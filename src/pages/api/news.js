// ===== FONSECA NEWS - API v4 - ZERO CLAUDE COST =====
// Ranking: SofaScore via RapidAPI (free, 500 req/month)
// Matches: SofaScore via RapidAPI (free, same quota)
// News: Google News RSS (free, unlimited)

const FONSECA_TEAM_ID = 403869;

// Cache
let cache = { news: null, newsAt: 0, ranking: null, rankingAt: 0, lastMatch: null, lastMatchAt: 0 };
const NEWS_TTL = 30 * 60 * 1000;       // 30 min
const RANKING_TTL = 12 * 60 * 60 * 1000; // 12 hours
const MATCH_TTL = 12 * 60 * 60 * 1000;   // 12 hours

// Fixed season data (update manually when needed)
const SEASON_DATA = { wins: 5, losses: 5, titles: 1, year: 2026 };

// Fixed player ranking (update weekly on Mondays when ATP ranking changes)
const PLAYER_DATA = { ranking: 39, rankingChange: -4, points: 1135, bestRanking: 24 };

// Fixed next tournament data (update manually between tournaments)
const NEXT_TOURNAMENT = {
  tournament_category: "Masters 1000",
  tournament_name: "Monte Carlo Masters",
  surface: "Saibro",
  city: "Monte Carlo",
  country: "Mônaco",
  date: "2026-04-05",
  round: ""
};

// ===== GOOGLE NEWS RSS (FREE) =====
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
    items.push({ title, summary: "", source: source || "Google News", url: link, image: "", date: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(), category });
  }
  return items;
}

async function fetchGoogleNews() {
  const queries = ["João+Fonseca+tenista", "João+Fonseca+tênis+ATP", "Joao+Fonseca+tennis"];
  const allItems = [];
  const seenTitles = new Set();
  for (const q of queries) {
    try {
      const res = await fetch(`https://news.google.com/rss/search?q=${q}&hl=pt-BR&gl=BR&ceid=BR:pt-419`, { headers: { "User-Agent": "FonsecaNews/1.0" } });
      if (!res.ok) continue;
      const xml = await res.text();
      for (const item of parseRSS(xml)) {
        const key = item.title.toLowerCase().substring(0, 50);
        if (!seenTitles.has(key)) { seenTitles.add(key); allItems.push(item); }
      }
    } catch (e) { console.error("RSS error:", e); }
  }
  allItems.sort((a, b) => new Date(b.date) - new Date(a.date));
  return allItems.slice(0, 15);
}

// ===== SOFASCORE RANKING VIA RAPIDAPI =====
async function fetchRanking(apiKey) {
  if (!apiKey) return null;
  try {
    const res = await fetch(`https://sofascore6.p.rapidapi.com/api/sofascore/v1/team/rankings?team_id=${FONSECA_TEAM_ID}`, {
      headers: {
        "Content-Type": "application/json",
        "x-rapidapi-host": "sofascore6.p.rapidapi.com",
        "x-rapidapi-key": apiKey
      }
    });
    if (!res.ok) {
      console.error("Ranking API error:", res.status);
      return null;
    }
    const data = await res.json();
    // Could be array or object with rankings
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
  } catch (e) { console.error("Ranking error:", e); }
  return null;
}

// ===== LAST MATCH VIA RAPIDAPI =====
async function fetchLastMatch(apiKey) {
  if (!apiKey) return null;
  try {
    // Check last 5 days for Fonseca's most recent match
    for (let i = 0; i < 5; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const date = d.toISOString().split("T")[0];
      
      const res = await fetch(`https://sofascore6.p.rapidapi.com/api/sofascore/v1/match/list?date=${date}&sport_slug=tennis`, {
        headers: {
          "Content-Type": "application/json",
          "x-rapidapi-host": "sofascore6.p.rapidapi.com",
          "x-rapidapi-key": apiKey
        }
      });
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
          tournament: m.tournament?.name || "?",
          round: m.roundInfo?.name || ""
        };
      }
    }
  } catch (e) { console.error("LastMatch error:", e); }
  return null;
}

// ===== MAIN HANDLER =====
export default async function handler(req, res) {
  const rapidApiKey = process.env.RAPIDAPI_KEY;
  const now = Date.now();
  const forceRefresh = req.method === "POST" && req.body?.force === true;

  try {
    // 1. News (Google RSS - free)
    if (!cache.news || (now - cache.newsAt) >= NEWS_TTL || forceRefresh) {
      const fresh = await fetchGoogleNews();
      if (fresh.length > 0) { cache.news = fresh; cache.newsAt = now; }
    }

    // 2. Ranking (RapidAPI SofaScore - 1 req every 12h = ~60/month)
    if (!cache.ranking || (now - cache.rankingAt) >= RANKING_TTL || forceRefresh) {
      const fresh = await fetchRanking(rapidApiKey);
      if (fresh) { cache.ranking = fresh; cache.rankingAt = now; }
    }

    // 3. Last match (RapidAPI SofaScore - max 5 req every 12h = ~10/day worst case, cached)
    if (!cache.lastMatch || (now - cache.lastMatchAt) >= MATCH_TTL || forceRefresh) {
      const fresh = await fetchLastMatch(rapidApiKey);
      if (fresh) { cache.lastMatch = fresh; cache.lastMatchAt = now; }
    }

    const result = {
      news: cache.news || [],
      player: cache.ranking ? {
        ranking: cache.ranking.ranking,
        rankingChange: cache.ranking.rankingChange,
        points: cache.ranking.points,
        bestRanking: cache.ranking.bestRanking
      } : PLAYER_DATA,
      season: SEASON_DATA,
      lastMatch: cache.lastMatch || null,
      nextMatch: NEXT_TOURNAMENT,
      _cache: {
        newsHit: !(!cache.news || (now - cache.newsAt) >= NEWS_TTL || forceRefresh),
        rankingHit: !(!cache.ranking || (now - cache.rankingAt) >= RANKING_TTL || forceRefresh),
        matchHit: !(!cache.lastMatch || (now - cache.lastMatchAt) >= MATCH_TTL || forceRefresh),
        source: "sofascore+google_rss",
        claudeCost: "$0.00"
      }
    };

    res.status(200).json(result);

  } catch (error) {
    console.error("Handler error:", error);
    if (cache.news) {
      res.status(200).json({
        news: cache.news,
        player: cache.ranking ? { ranking: cache.ranking.ranking, rankingChange: cache.ranking.rankingChange } : PLAYER_DATA,
        season: SEASON_DATA,
        lastMatch: cache.lastMatch || null,
        nextMatch: NEXT_TOURNAMENT,
        _cache: { stale: true, source: "sofascore+google_rss", claudeCost: "$0.00" }
      });
    } else {
      res.status(500).json({ error: "Failed to fetch data" });
    }
  }
}
