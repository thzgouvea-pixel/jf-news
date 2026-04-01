// ===== FONSECA NEWS - API v6 - KV-BACKED =====
// News: Google News RSS (free, unlimited, cached 30 min in-memory)
// Ranking/Season/Matches: Read from Vercel KV (populated by cron-update)
// Zero manual data. Everything comes from APIs automatically.

import { kv } from "@vercel/kv";

const FONSECA_TEAM_ID = 403869;

// ===== IN-MEMORY CACHE (news only — RSS is free so no KV needed) =====
let newsCache = { items: null, at: 0 };
const NEWS_TTL = 30 * 60 * 1000; // 30 min

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

// ===== READ KV DATA (populated by cron-update) =====
async function readKVData() {
  try {
    var keys = [
      "fn:ranking",
      "fn:lastMatch",
      "fn:nextMatch",
      "fn:season",
      "fn:cronLastRun"
    ];
    var values = await kv.mget(...keys);

    var parse = function(val) {
      if (!val) return null;
      if (typeof val === "string") { try { return JSON.parse(val); } catch(e) { return val; } }
      return val;
    };

    return {
      ranking: parse(values[0]),
      lastMatch: parse(values[1]),
      nextMatch: parse(values[2]),
      season: parse(values[3]),
      cronLastRun: values[4]
    };
  } catch (e) {
    console.error("[news] KV read error:", e);
    return { ranking: null, lastMatch: null, nextMatch: null, season: null, cronLastRun: null };
  }
}

// ===== MAIN HANDLER =====
export default async function handler(req, res) {
  const now = Date.now();

  try {
    // ===== 1. NEWS (Google RSS - always free) =====
    if (!newsCache.items || (now - newsCache.at) >= NEWS_TTL) {
      console.log("[news] Fetching Google RSS...");
      const fresh = await fetchGoogleNews();
      if (fresh.length > 0) {
        newsCache.items = fresh;
        newsCache.at = now;
      }
    }

    // ===== 2. KV DATA (ranking, matches, season — from cron-update) =====
    var kvData = await readKVData();

    // Build player object from KV ranking data
    var playerData = null;
    if (kvData.ranking) {
      playerData = {
        ranking: kvData.ranking.ranking || null,
        rankingChange: kvData.ranking.rankingChange || 0,
        points: kvData.ranking.points || null,
        bestRanking: kvData.ranking.bestRanking || null
      };
    }

    // Build season object from KV
    var seasonData = kvData.season || null;

    // ===== BUILD RESPONSE =====
    var result = {
      news: newsCache.items || [],
      player: playerData,
      season: seasonData,
      lastMatch: kvData.lastMatch || null,
      nextMatch: kvData.nextMatch || null,
      _cache: {
        newsAge: newsCache.at ? Math.round((now - newsCache.at) / 60000) + "min" : "none",
        kvSource: "cron-update → Vercel KV",
        lastCron: kvData.cronLastRun || "never",
        source: "kv+google_rss"
      }
    };

    res.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=300");
    res.status(200).json(result);

  } catch (error) {
    console.error("[news] Handler error:", error);
    res.status(200).json({
      news: newsCache.items || [],
      player: null,
      season: null,
      lastMatch: null,
      nextMatch: null,
      _cache: { error: true, source: "fallback" }
    });
  }
}
