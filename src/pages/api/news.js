// ===== FONSECA NEWS - API v5 - CACHE INTELIGENTE =====
// Ranking: SofaScore via RapidAPI (1x/dia via cron = ~30 req/mês)
// Matches: SofaScore via RapidAPI (1x/dia via cron = ~150 req/mês max)
// News: Google News RSS (free, unlimited, every 30 min)
// Total SofaScore: ~180/mês (de 500 disponíveis)

const FONSECA_TEAM_ID = 403869;

// ===== PERSISTENT CACHE (survives between requests) =====
let cache = {
  news: null,
  newsAt: 0,
  ranking: null,
  rankingAt: 0,
  lastMatch: null,
  lastMatchAt: 0,
  nextTournament: null,
  nextTournamentAt: 0,
  seasonStats: null,
  seasonStatsAt: 0,
  cronLastRun: 0
};

// TTLs
const NEWS_TTL = 30 * 60 * 1000;         // 30 min (RSS is free)
const SOFASCORE_TTL = 23 * 60 * 60 * 1000; // 23 hours (only via cron)

// ===== FIXED DATA (update manually when needed) =====
// These serve as fallback when SofaScore quota is exhausted or cache is cold
const SEASON_DATA = { wins: 5, losses: 5, titles: 1, year: 2026 };

const PLAYER_DATA = { ranking: 39, rankingChange: -4, points: 1135, bestRanking: 24 };

const NEXT_TOURNAMENT = {
  tournament_category: "Masters 1000",
  tournament_name: "Monte Carlo Masters",
  surface: "Saibro",
  city: "Monte Carlo",
  country: "Mônaco",
  date: "2026-04-05",
  round: "",
  channels: []
};

// ===== GOOGLE NEWS RSS (FREE, UNLIMITED) =====
function parseRSS(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const content = match[1];
    const get = (tag) => {
      const m = content.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
      return m ? (m[1] || m[2] || "").trim() : "";
    };
    const title = get("title");
    const link = get("link");
    const pubDate = get("pubDate");
    const source = get("source");
    if (title && !title.toLowerCase().includes("fonseca")) continue;
    let category = "Notícia";
    const t = title.toLowerCase();
    if (t.includes("ranking") || t.includes("posição") || t.includes("atp")) category = "Ranking";
    else if (t.includes("vence") || t.includes("perde") || t.includes("derrota") || t.includes("vitória") || t.includes("elimina")) category = "Resultado";
    else if (t.includes("disse") || t.includes("afirma") || t.includes("elogia") || t.includes("confiante") || t.includes("declarou")) category = "Declaração";
    else if (t.includes("treino") || t.includes("preparação")) category = "Treino";
    else if (t.includes("torneio") || t.includes("open") || t.includes("masters") || t.includes("estreia")) category = "Torneio";
    items.push({
      title,
      summary: "",
      source: source || "Google News",
      url: link,
      image: "",
      date: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
      category
    });
  }
  return items;
}

async function fetchGoogleNews() {
  const queries = ["João+Fonseca+tenista", "João+Fonseca+tênis+ATP", "Joao+Fonseca+tennis"];
  const allItems = [];
  const seenTitles = new Set();
  for (const q of queries) {
    try {
      const res = await fetch(
        `https://news.google.com/rss/search?q=${q}&hl=pt-BR&gl=BR&ceid=BR:pt-419`,
        { headers: { "User-Agent": "FonsecaNews/1.0" } }
      );
      if (!res.ok) continue;
      const xml = await res.text();
      for (const item of parseRSS(xml)) {
        const key = item.title.toLowerCase().substring(0, 50);
        if (!seenTitles.has(key)) {
          seenTitles.add(key);
          allItems.push(item);
        }
      }
    } catch (e) {
      console.error("RSS error:", e);
    }
  }
  allItems.sort((a, b) => new Date(b.date) - new Date(a.date));
  return allItems.slice(0, 25);
}

// ===== SOFASCORE VIA RAPIDAPI (ONLY CALLED BY CRON) =====
async function fetchRanking(apiKey) {
  if (!apiKey) return null;
  try {
    const res = await fetch(
      `https://sofascore6.p.rapidapi.com/api/sofascore/v1/team/rankings?team_id=${FONSECA_TEAM_ID}`,
      {
        headers: {
          "Content-Type": "application/json",
          "x-rapidapi-host": "sofascore6.p.rapidapi.com",
          "x-rapidapi-key": apiKey
        }
      }
    );
    if (!res.ok) {
      console.error("Ranking API error:", res.status);
      return null;
    }
    const data = await res.json();
    let rankings = Array.isArray(data) ? data : data.rankings;
    if (rankings && rankings.length > 0) {
      const r = rankings[0];
      return {
        ranking: r.ranking,
        points: r.points,
        previousRanking: r.previousRanking,
        previousPoints: r.previousPoints,
        bestRanking: r.bestRanking,
        tournamentsPlayed: r.tournamentsPlayed,
        rankingChange: (r.previousRanking || 0) - (r.ranking || 0)
      };
    }
  } catch (e) {
    console.error("Ranking error:", e);
  }
  return null;
}

async function fetchLastMatch(apiKey) {
  if (!apiKey) return null;
  try {
    // Only check last 3 days (reduced from 5 to save API calls)
    for (let i = 0; i < 3; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const date = d.toISOString().split("T")[0];

      const res = await fetch(
        `https://sofascore6.p.rapidapi.com/api/sofascore/v1/match/list?date=${date}&sport_slug=tennis`,
        {
          headers: {
            "Content-Type": "application/json",
            "x-rapidapi-host": "sofascore6.p.rapidapi.com",
            "x-rapidapi-key": apiKey
          }
        }
      );
      if (!res.ok) continue;
      const data = await res.json();
      if (!Array.isArray(data)) continue;

      for (const m of data) {
        const homeId = m.homeTeam?.id;
        const awayId = m.awayTeam?.id;
        if (homeId !== FONSECA_TEAM_ID && awayId !== FONSECA_TEAM_ID) continue;
        if (m.status?.type !== "finished") continue;

        const isFonsecaHome = homeId === FONSECA_TEAM_ID;
        const opponent = isFonsecaHome ? m.awayTeam : m.homeTeam;
        const fScore = isFonsecaHome ? m.homeScore : m.awayScore;
        const oScore = isFonsecaHome ? m.awayScore : m.homeScore;

        const periods = [];
        for (let p = 1; p <= 5; p++) {
          const fp = fScore?.[`period${p}`];
          const op = oScore?.[`period${p}`];
          if (fp !== undefined && op !== undefined) periods.push(`${fp}-${op}`);
        }

        return {
          result: (fScore?.current || 0) > (oScore?.current || 0) ? "V" : "D",
          score: periods.join(" "),
          opponent: opponent?.shortName || opponent?.name || "?",
          opponent_id: (isFonsecaHome ? awayId : homeId) || null,
          tournament: m.tournament?.name || "?",
          round: m.roundInfo?.name || ""
        };
      }
    }
  } catch (e) {
    console.error("LastMatch error:", e);
  }
  return null;
}

// ===== NEXT TOURNAMENT VIA RAPIDAPI =====
async function fetchNextTournament(apiKey) {
  if (!apiKey) return null;
  try {
    // Get upcoming events for Fonseca
    const res = await fetch(
      `https://sofascore6.p.rapidapi.com/api/sofascore/v1/team/near-events?team_id=${FONSECA_TEAM_ID}&upcoming=true`,
      {
        headers: {
          "Content-Type": "application/json",
          "x-rapidapi-host": "sofascore6.p.rapidapi.com",
          "x-rapidapi-key": apiKey
        }
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const events = Array.isArray(data) ? data : (data.events || data.nearEvents || []);
    if (events.length === 0) return null;

    // Find the next upcoming match
    const next = events[0];
    const surfaceMap = { 1: "Duro", 2: "Saibro", 3: "Grama", 4: "Carpet", 5: "Duro (indoor)" };
    const tournament = next.tournament || {};
    const season = next.season || {};
    const isFonsecaHome = next.homeTeam?.id === FONSECA_TEAM_ID;
    const opponent = isFonsecaHome ? next.awayTeam : next.homeTeam;

    return {
      tournament_category: tournament.uniqueTournament?.category?.name || tournament.name || "",
      tournament_name: tournament.name || season.name || "",
      surface: surfaceMap[tournament.uniqueTournament?.groundType] || "Duro",
      city: tournament.uniqueTournament?.city || "",
      country: tournament.uniqueTournament?.country || "",
      date: next.startTimestamp ? new Date(next.startTimestamp * 1000).toISOString().split("T")[0] : "",
      round: next.roundInfo?.name || "",
      opponent_name: opponent?.shortName || opponent?.name || "",
      opponent_id: opponent?.id || null,
      opponent_ranking: null,
      opponent_country: ""
    };
  } catch (e) {
    console.error("NextTournament error:", e);
  }
  return null;
}

// ===== SEASON STATS VIA RAPIDAPI =====
async function fetchSeasonStats(apiKey) {
  if (!apiKey) return null;
  try {
    const res = await fetch(
      `https://sofascore6.p.rapidapi.com/api/sofascore/v1/team/results?team_id=${FONSECA_TEAM_ID}`,
      {
        headers: {
          "Content-Type": "application/json",
          "x-rapidapi-host": "sofascore6.p.rapidapi.com",
          "x-rapidapi-key": apiKey
        }
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const results = Array.isArray(data) ? data : (data.events || data.results || []);

    // Count wins/losses for current year
    const currentYear = new Date().getFullYear();
    let wins = 0;
    let losses = 0;
    let titles = 0;

    for (const match of results) {
      if (!match.startTimestamp) continue;
      const matchYear = new Date(match.startTimestamp * 1000).getFullYear();
      if (matchYear !== currentYear) continue;
      if (match.status?.type !== "finished") continue;

      const isFonsecaHome = match.homeTeam?.id === FONSECA_TEAM_ID;
      const fScore = isFonsecaHome ? match.homeScore?.current : match.awayScore?.current;
      const oScore = isFonsecaHome ? match.awayScore?.current : match.homeScore?.current;

      if (fScore > oScore) wins++;
      else losses++;
    }

    return { wins, losses, titles: SEASON_DATA.titles, year: currentYear };
  } catch (e) {
    console.error("SeasonStats error:", e);
  }
  return null;
}

// ===== MAIN HANDLER =====
export default async function handler(req, res) {
  const rapidApiKey = process.env.RAPIDAPI_KEY;
  const now = Date.now();

  // Check if this is a cron call (daily SofaScore update)
  const isCron = req.method === "POST" && req.body?.cron === true;
  const isForce = req.method === "POST" && req.body?.force === true;

  try {
    // ===== 1. NEWS (Google RSS - always free) =====
    if (!cache.news || (now - cache.newsAt) >= NEWS_TTL || isForce) {
      console.log("[news] Fetching Google RSS...");
      const fresh = await fetchGoogleNews();
      if (fresh.length > 0) {
        cache.news = fresh;
        cache.newsAt = now;
      }
    } else {
      console.log("[news] Using cached news (" + Math.round((now - cache.newsAt) / 60000) + "min old)");
    }

    // ===== 2. SOFASCORE DATA (ONLY via cron or if cache is very old) =====
    const sofascoreExpired = !cache.ranking || (now - cache.rankingAt) >= SOFASCORE_TTL;

    if (isCron || isForce) {
      // Cron call: update SofaScore data
      console.log("[cron] Updating SofaScore data...");

      const freshRanking = await fetchRanking(rapidApiKey);
      if (freshRanking) {
        cache.ranking = freshRanking;
        cache.rankingAt = now;
        console.log("[cron] Ranking updated: #" + freshRanking.ranking);
      } else {
        console.log("[cron] Ranking fetch failed, keeping cached/fixed data");
      }

      const freshMatch = await fetchLastMatch(rapidApiKey);
      if (freshMatch) {
        cache.lastMatch = freshMatch;
        cache.lastMatchAt = now;
        console.log("[cron] Last match updated: " + freshMatch.result + " vs " + freshMatch.opponent);
      } else {
        console.log("[cron] No recent match found");
      }

      const freshTournament = await fetchNextTournament(rapidApiKey);
      if (freshTournament && freshTournament.date) {
        cache.nextTournament = freshTournament;
        cache.nextTournamentAt = now;
        console.log("[cron] Next tournament updated: " + freshTournament.tournament_name);
      } else {
        console.log("[cron] No upcoming tournament found, keeping fixed data");
      }

      const freshSeason = await fetchSeasonStats(rapidApiKey);
      if (freshSeason) {
        cache.seasonStats = freshSeason;
        cache.seasonStatsAt = now;
        console.log("[cron] Season stats updated: " + freshSeason.wins + "W-" + freshSeason.losses + "L");
      } else {
        console.log("[cron] Season stats fetch failed, keeping fixed data");
      }

      cache.cronLastRun = now;
    } else if (sofascoreExpired) {
      // Normal request but cache is very old (>23h) — DON'T call SofaScore
      // Just use fixed data as fallback
      console.log("[cache] SofaScore cache expired, using fixed fallback data");
    } else {
      console.log("[cache] Using cached SofaScore data (" + Math.round((now - cache.rankingAt) / 3600000) + "h old)");
    }

    // ===== BUILD RESPONSE =====
    const playerData = cache.ranking ? {
      ranking: cache.ranking.ranking,
      rankingChange: cache.ranking.rankingChange,
      points: cache.ranking.points,
      bestRanking: cache.ranking.bestRanking
    } : PLAYER_DATA;

    const result = {
      news: cache.news || [],
      player: playerData,
      season: cache.seasonStats || SEASON_DATA,
      lastMatch: cache.lastMatch || null,
      nextMatch: cache.nextTournament || NEXT_TOURNAMENT,
      _cache: {
        newsAge: cache.newsAt ? Math.round((now - cache.newsAt) / 60000) + "min" : "none",
        rankingAge: cache.rankingAt ? Math.round((now - cache.rankingAt) / 3600000) + "h" : "fixed",
        matchAge: cache.lastMatchAt ? Math.round((now - cache.lastMatchAt) / 3600000) + "h" : "none",
        tournamentAge: cache.nextTournamentAt ? Math.round((now - cache.nextTournamentAt) / 3600000) + "h" : "fixed",
        seasonAge: cache.seasonStatsAt ? Math.round((now - cache.seasonStatsAt) / 3600000) + "h" : "fixed",
        lastCron: cache.cronLastRun ? new Date(cache.cronLastRun).toISOString() : "never",
        source: "sofascore_cron+google_rss",
        sofascoreCalls: isCron ? "yes (cron)" : "no (cached)",
        claudeCost: "$0.00"
      }
    };

    // If cron call, return simple confirmation
    if (isCron) {
      return res.status(200).json({
        ok: true,
        message: "Cron update complete",
        ranking: playerData.ranking,
        lastMatch: cache.lastMatch ? (cache.lastMatch.result + " vs " + cache.lastMatch.opponent) : "none",
        _cache: result._cache
      });
    }

    res.status(200).json(result);

  } catch (error) {
    console.error("Handler error:", error);
    // Always return something useful
    res.status(200).json({
      news: cache.news || [],
      player: cache.ranking ? {
        ranking: cache.ranking.ranking,
        rankingChange: cache.ranking.rankingChange
      } : PLAYER_DATA,
      season: cache.seasonStats || SEASON_DATA,
      lastMatch: cache.lastMatch || null,
      nextMatch: cache.nextTournament || NEXT_TOURNAMENT,
      _cache: { error: true, source: "fallback", claudeCost: "$0.00" }
    });
  }
}
