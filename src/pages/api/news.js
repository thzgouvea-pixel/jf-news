// Server-side cache
let newsCache = null;
let newsCacheTimestamp = 0;
const NEWS_CACHE_TTL = 30 * 60 * 1000; // 30 min for news

let statsCache = null;
let statsCacheTimestamp = 0;
const STATS_CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours for player stats (ranking, season, matches)

// Parse Google News RSS XML
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
    
    if (title && !title.includes("João Fonseca") && !title.includes("Joao Fonseca") && !title.includes("Fonseca")) continue;
    
    // Guess category from title
    let category = "Notícia";
    const t = title.toLowerCase();
    if (t.includes("ranking") || t.includes("posição") || t.includes("posicao") || t.includes("atp")) category = "Ranking";
    else if (t.includes("vence") || t.includes("perde") || t.includes("derrota") || t.includes("vitória") || t.includes("elimina") || t.includes("sets")) category = "Resultado";
    else if (t.includes("disse") || t.includes("afirma") || t.includes("elogia") || t.includes("compara") || t.includes("confiante") || t.includes("declarou")) category = "Declaração";
    else if (t.includes("treino") || t.includes("treina") || t.includes("preparação")) category = "Treino";
    else if (t.includes("torneio") || t.includes("open") || t.includes("masters") || t.includes("slam") || t.includes("estreia") || t.includes("calendário") || t.includes("próximo")) category = "Torneio";
    
    items.push({
      title,
      summary: "",
      source: source || "Google News",
      url: link,
      image: "",
      date: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
      category,
    });
  }
  return items;
}

// Fetch news from Google News RSS (FREE)
async function fetchGoogleNews() {
  const queries = [
    "João+Fonseca+tenista",
    "João+Fonseca+tênis+ATP",
    "Joao+Fonseca+tennis",
  ];
  
  const allItems = [];
  const seenTitles = new Set();
  
  for (const q of queries) {
    try {
      const res = await fetch(`https://news.google.com/rss/search?q=${q}&hl=pt-BR&gl=BR&ceid=BR:pt-419`, {
        headers: { "User-Agent": "FonsecaNews/1.0" }
      });
      if (!res.ok) continue;
      const xml = await res.text();
      const items = parseRSS(xml);
      for (const item of items) {
        const key = item.title.toLowerCase().substring(0, 50);
        if (!seenTitles.has(key)) {
          seenTitles.add(key);
          allItems.push(item);
        }
      }
    } catch (e) {
      console.error("RSS fetch error:", e);
    }
  }
  
  // Sort by date, newest first
  allItems.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  // Return top 15
  return allItems.slice(0, 15);
}

// Fetch player stats from Claude (CHEAP - only ranking, season, matches)
async function fetchPlayerStats(apiKey) {
  try {
    const today = new Date().toLocaleDateString("pt-BR");
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 500,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{
          role: "user",
          content: `Hoje é ${today}. Busque APENAS dados factuais do João Fonseca tenista: ranking ATP atual, variação, próximo torneio, último resultado, e record da temporada 2026. Responda APENAS JSON (sem markdown):
{"player":{"ranking":N,"rankingChange":N},"season":{"wins":N,"losses":N,"titles":N,"year":2026},"lastMatch":{"result":"V ou D","score":"6-3 6-4","opponent":"Sobrenome","tournament":"nome","round":"fase"},"nextMatch":{"tournament_category":"ATP 250/500/Masters 1000/Grand Slam","tournament_name":"nome","surface":"Saibro/Dura/Grama","city":"cidade","country":"país","date":"YYYY-MM-DD ou vazio","round":""}}`
        }]
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    let text = "";
    if (data.content) for (const b of data.content) if (b.type === "text" && b.text) text += b.text;
    let cleaned = text.trim().replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const os = cleaned.indexOf("{"), oe = cleaned.lastIndexOf("}");
    if (os !== -1 && oe !== -1) return JSON.parse(cleaned.substring(os, oe + 1));
  } catch (e) {
    console.error("Stats fetch error:", e);
  }
  return null;
}

export default async function handler(req, res) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });

  const now = Date.now();
  const forceRefresh = req.method === "POST" && req.body?.force === true;

  // Check news cache
  const newsExpired = !newsCache || (now - newsCacheTimestamp) >= NEWS_CACHE_TTL || forceRefresh;
  const statsExpired = !statsCache || (now - statsCacheTimestamp) >= STATS_CACHE_TTL || forceRefresh;

  try {
    // Fetch news from Google RSS (FREE) if expired
    let news = newsCache;
    if (newsExpired) {
      const freshNews = await fetchGoogleNews();
      if (freshNews.length > 0) {
        news = freshNews;
        newsCache = freshNews;
        newsCacheTimestamp = now;
      }
    }

    // Fetch stats from Claude (CHEAP) if expired - only every 6 hours
    let stats = statsCache;
    if (statsExpired && apiKey) {
      const freshStats = await fetchPlayerStats(apiKey);
      if (freshStats) {
        stats = freshStats;
        statsCache = freshStats;
        statsCacheTimestamp = now;
      }
    }

    // Combine
    const result = {
      news: news || [],
      player: stats?.player || null,
      season: stats?.season || null,
      lastMatch: stats?.lastMatch || null,
      nextMatch: stats?.nextMatch || null,
      _cache: {
        newsAge: now - newsCacheTimestamp,
        statsAge: now - statsCacheTimestamp,
        newsHit: !newsExpired,
        statsHit: !statsExpired,
      }
    };

    res.status(200).json(result);

  } catch (error) {
    console.error("Handler error:", error);
    // Return stale cache if available
    if (newsCache) {
      res.status(200).json({
        news: newsCache,
        player: statsCache?.player || null,
        season: statsCache?.season || null,
        lastMatch: statsCache?.lastMatch || null,
        nextMatch: statsCache?.nextMatch || null,
        _cache: { stale: true }
      });
    } else {
      res.status(500).json({ error: "Failed to fetch data" });
    }
  }
}
