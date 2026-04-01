// ===== /api/sofascore-data =====
// Serves SofaScore data stored in KV by cron-update
// Uses mget to fetch all keys in ONE Redis request instead of N separate gets
// This is critical for staying within Upstash free tier (500k requests/month)
import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  try {
    var keys = [
      "fn:ranking",
      "fn:lastMatch",
      "fn:nextMatch",
      "fn:season",
      "fn:matchStats",
      "fn:h2h",
      "fn:recentForm",
      "fn:cronLastRun",
      "fn:prizeMoney",
      "fn:winProb",
    ];

    // mget = 1 Redis round-trip for all keys (vs 10 separate gets)
    var values = await kv.mget(...keys);

    var parse = function(val) {
      if (!val) return null;
      if (typeof val === "string") { try { return JSON.parse(val); } catch(e) { return val; } }
      return val;
    };

    var data = {
      ranking:     parse(values[0]),
      lastMatch:   parse(values[1]),
      nextMatch:   parse(values[2]),
      season:      parse(values[3]),
      matchStats:  parse(values[4]),
      h2h:         parse(values[5]),
      recentForm:  parse(values[6]),
      cronLastRun: values[7],
      prizeMoney:  parse(values[8]),
      winProb:     parse(values[9]),
    };

    // Cache 5 min on CDN, serve stale up to 10 min while revalidating
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    res.status(200).json(data);
  } catch (error) {
    console.error("[sofascore-data] Error:", error);
    res.status(200).json({
      ranking: null, lastMatch: null, nextMatch: null,
      season: null, matchStats: null, h2h: null,
      recentForm: null, winProb: null, error: error.message
    });
  }
}
