// ===== FONSECA NEWS - API v3 - ZERO CLAUDE COST =====
// Ranking: SofaScore direct API (free, unlimited)
// Matches: RapidAPI SofaScore (free, 500 req/month)
// News: Google News RSS (free, unlimited)

const FONSECA_TEAM_ID = 403869;

// Cache
let cache = { news: null, newsAt: 0, ranking: null, rankingAt: 0, matches: null, matchesAt: 0 };
const NEWS_TTL = 30 * 60 * 1000;      // 30 min
const RANKING_TTL = 6 * 60 * 60 * 1000; // 6 hours
const MATCHES_TTL = 6 * 60 * 60 * 1000; // 6 hours

// Fixed season data (update manually when needed)
const SEASON_DATA = {
  wins: 5, losses: 5, titles: 1, year: 2026
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
      const items = parseRSS(xml);
      for (const item of items) {
        const key = item.title.toLowerCase().substring(0, 50);
        if (!seenTitles.has(key)) { seenTitles.add(key); allItems.push(item); }
      }
    } catch (e) { console.error("RSS error:", e); }
  }
  allItems.sort((a, b) => new Date(b.date) - new Date(a.date));
  return allItems.slice(0, 15);
}

// ===== SOFASCORE RANKING (FREE, UNLIMITED) =====
async function fetchRanking() {
  try {
    const res = await fetch(`https://api.sofascore.com/api/v1/team/${FONSECA_TEAM_ID}/rankings`, {
      headers: { "User-Agent": "FonsecaNews/1.0", "Accept": "application/json" }
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.rankings && data.rankings.length > 0) {
      // First ranking entry is the official ATP ranking
      const r = data.rankings[0];
      return {
        ranking: r.ranking,
        points: r.points,
        previousRanking: r.previousRanking,
        previousPoints: r.previousPoints,
        bestRanking: r.bestRanking,
        tournamentsPlayed: r.tournamentsPlayed,
        // Calculate rankingChange (positive = improved, negative = worsened)
        rankingChange: r.previousRanking - r.ranking
      };
    }
  } catch (e) { console.error("Ranking error:", e); }
  return null;
}

// ===== SOFASCORE MATCHES VIA RAPIDAPI (500 req/month FREE) =====
async function fetchMatches(rapidApiKey) {
  if (!rapidApiKey) return null;
  
  try {
    // Fetch last few days to find Fonseca's last match
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split("T")[0]);
    }
    
    let lastMatch = null;
    
    // Search recent days for Fonseca's matches (1 request per day checked)
    for (const date of dates) {
      if (lastMatch) break; // Found it, stop searching
      try {
        const res = await fetch(`https://sofascore6.p.rapidapi.com/api/sofascore/v1/match/list?date=${date}&sport_slug=tennis`, {
          headers: {
            "Content-Type": "application/json",
            "x-rapidapi-host": "sofascore6.p.rapidapi.com",
            "x-rapidapi-key": rapidApiKey
          }
        });
        if (!res.ok) continue;
        const data = await res.json();
        if (!Array.isArray(data)) continue;
        
        // Find Fonseca's match
        for (const match of data) {
          const homeId = match.homeTeam?.id;
          const awayId = match.awayTeam?.id;
          if (homeId === FONSECA_TEAM_ID || awayId === FONSECA_TEAM_ID) {
            const isFonsecaHome = homeId === FONSECA_TEAM_ID;
            const opponent = isFonsecaHome ? match.awayTeam : match.homeTeam;
            const fonsecaScore = isFonsecaHome ? match.homeScore : match.awayScore;
            const opponentScore = isFonsecaHome ? match.awayScore : match.homeScore;
            
            // Build score string from periods
            let score = "";
            if (fonsecaScore && opponentScore) {
              const periods = [];
              for (let p = 1; p <= 5; p++) {
                const fPeriod = fonsecaScore[`period${p}`];
                const oPeriod = opponentScore[`period${p}`];
                if (fPeriod !== undefined && oPeriod !== undefined) {
                  periods.push(`${fPeriod}-${oPeriod}`);
                }
              }
              score = periods.join(" ");
            }
            
            const isFinished = match.status?.type === "finished";
            const fonsecaWon = fonsecaScore?.current > opponentScore?.current;
            
            if (isFinished) {
              lastMatch = {
                result: fonsecaWon ? "V" : "D",
                score: score,
                opponent: opponent?.shortName || opponent?.name || "?",
                tournament: match.tournament?.name || "?",
                round: match.roundInfo?.name || ""
              };
            }
            break;
          }
        }
      } catch (e) { console.error("Match fetch error for", date, e); }
    }
    
    // Also check future dates for next match
    let nextMatch = null;
    const futureDates = [];
    for (let i = 1; i <= 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      futureDates.push(d.toISOString().split("T")[0]);
    }
    
    // Only check a few future dates to save requests
    for (const date of futureDates.slice(0, 3)) {
      if (nextMatch) break;
      try {
        const res = await fetch(`https://sofascore6.p.rapidapi.com/api/sofascore/v1/match/list?date=${date}&sport_slug=tennis`, {
          headers: {
            "Content-Type": "application/json",
            "x-rapidapi-host": "sofascore6.p.rapidapi.com",
            "x-rapidapi-key": rapidApiKey
          }
        });
        if (!res.ok) continue;
        const data = await res.json();
        if (!Array.isArray(data)) continue;
        
        for (const match of data) {
          const homeId = match.homeTeam?.id;
          const awayId = match.awayTeam?.id;
          if (homeId === FONSECA_TEAM_ID || awayId === FONSECA_TEAM_ID) {
            if (match.status?.type === "notstarted") {
              nextMatch = {
                tournament_name: match.tournament?.name || "?",
                tournament_category: match.uniqueTournament?.name || "",
                date: date,
                round: match.roundInfo?.name || ""
              };
            }
            break;
          }
        }
      } catch (e) { console.error("Next match error:", e); }
    }
    
    return { lastMatch, nextMatch };
  } catch (e) { console.error("Matches error:", e); }
  return null;
}

// ===== MAIN HANDLER =====
export default async function handler(req, res) {
  const rapidApiKey = process.env.RAPIDAPI_KEY;
  const now = Date.now();
  const forceRefresh = req.method === "POST" && req.body?.force === true;

  try {
    // 1. News from Google RSS (free)
    if (!cache.news || (now - cache.newsAt) >= NEWS_TTL || forceRefresh) {
      const freshNews = await fetchGoogleNews();
      if (freshNews.length > 0) { cache.news = freshNews; cache.newsAt = now; }
    }

    // 2. Ranking from SofaScore direct API (free, unlimited)
    if (!cache.ranking || (now - cache.rankingAt) >= RANKING_TTL || forceRefresh) {
      const freshRanking = await fetchRanking();
      if (freshRanking) { cache.ranking = freshRanking; cache.rankingAt = now; }
    }

    // 3. Matches from RapidAPI SofaScore (500 req/month free)
    if (!cache.matches || (now - cache.matchesAt) >= MATCHES_TTL || forceRefresh) {
      const freshMatches = await fetchMatches(rapidApiKey);
      if (freshMatches) { cache.matches = freshMatches; cache.matchesAt = now; }
    }

    // Build response in same format as before
    const ranking = cache.ranking;
    const matches = cache.matches;

    const result = {
      news: cache.news || [],
      player: ranking ? {
        ranking: ranking.ranking,
        rankingChange: ranking.rankingChange,
        points: ranking.points,
        bestRanking: ranking.bestRanking
      } : null,
      season: SEASON_DATA,
      lastMatch: matches?.lastMatch || null,
      nextMatch: matches?.nextMatch ? {
        tournament_category: matches.nextMatch.tournament_category,
        tournament_name: matches.nextMatch.tournament_name,
        surface: "", // SofaScore doesn't provide this directly
        city: "",
        country: "",
        date: matches.nextMatch.date,
        round: matches.nextMatch.round
      } : null,
      _cache: {
        newsHit: cache.news && (now - cache.newsAt) < NEWS_TTL && !forceRefresh,
        rankingHit: cache.ranking && (now - cache.rankingAt) < RANKING_TTL && !forceRefresh,
        matchesHit: cache.matches && (now - cache.matchesAt) < MATCHES_TTL && !forceRefresh,
        source: "sofascore+google_rss",
        claudeCost: "$0.00"
      }
    };

    res.status(200).json(result);

  } catch (error) {
    console.error("Handler error:", error);
    // Return stale cache
    if (cache.news) {
      res.status(200).json({
        news: cache.news,
        player: cache.ranking ? { ranking: cache.ranking.ranking, rankingChange: cache.ranking.rankingChange } : null,
        season: SEASON_DATA,
        lastMatch: cache.matches?.lastMatch || null,
        nextMatch: null,
        _cache: { stale: true }
      });
    } else {
      res.status(500).json({ error: "Failed to fetch data" });
    }
  }
}
