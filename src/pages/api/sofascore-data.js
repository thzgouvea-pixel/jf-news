// ===== /api/sofascore-data =====
// Serves SofaScore data stored in KV by cron-update
// Frontend calls this to get ranking, match stats, H2H, form

import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  try {
    // Fetch all SofaScore data from KV in parallel
    var keys = ["fn:ranking", "fn:lastMatch", "fn:nextMatch", "fn:season", "fn:matchStats", "fn:h2h", "fn:recentForm", "fn:cronLastRun", "fn:prizeMoney"];
    var values = await Promise.all(keys.map(function(k) {
      return kv.get(k).catch(function() { return null; });
    }));

    var parse = function(val) {
      if (!val) return null;
      if (typeof val === "string") {
        try { return JSON.parse(val); } catch(e) { return val; }
      }
      return val;
    };

    var data = {
      ranking: parse(values[0]),
      lastMatch: parse(values[1]),
      nextMatch: parse(values[2]),
      season: parse(values[3]),
      matchStats: parse(values[4]),
      h2h: parse(values[5]),
      recentForm: parse(values[6]),
      cronLastRun: values[7],
      prizeMoney: parse(values[8])
    };

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    res.status(200).json(data);

  } catch (error) {
    console.error("[sofascore-data] Error:", error);
    res.status(200).json({
      ranking: null,
      lastMatch: null,
      nextMatch: null,
      season: null,
      matchStats: null,
      h2h: null,
      recentForm: null,
      error: error.message
    });
  }
}
