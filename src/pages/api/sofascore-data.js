// ===== API: SofaScore Data v2 =====
// Reads all KV data populated by cron-update.
// OPTIMIZATION: s-maxage=300 (5 min edge cache) prevents KV reads on repeated requests.
// Crawlers, bots, and rapid reloads all get cached response.

import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  try {
    var values = await kv.mget(
      "fn:ranking",
      "fn:lastMatch",
      "fn:nextMatch",
      "fn:season",
      "fn:matchStats",
      "fn:h2h",
      "fn:recentForm",
      "fn:winProb",
      "fn:cronLastRun",
      "fn:prizeMoney"
    );

    var parse = function(val) {
      if (!val) return null;
      if (typeof val === "string") { try { return JSON.parse(val); } catch(e) { return val; } }
      return val;
    };

    var ranking = parse(values[0]);
    var lastMatch = parse(values[1]);
    var nextMatch = parse(values[2]);
    var season = parse(values[3]);
    var matchStats = parse(values[4]);
    var h2h = parse(values[5]);
    var recentForm = parse(values[6]);
    var winProb = parse(values[7]);
    var cronLastRun = parse(values[8]);
    var prizeMoney = parse(values[9]);

    var result = {
      ranking: ranking ? ranking.ranking : null,
      lastMatch: lastMatch,
      nextMatch: nextMatch,
      season: season,
      matchStats: matchStats,
      h2h: h2h,
      recentForm: recentForm,
      winProb: winProb,
      cronLastRun: cronLastRun,
      prizeMoney: prizeMoney ? prizeMoney.amount : null,
    };

    // Cache for 5 minutes at Vercel edge — prevents KV reads from crawlers/bots
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    res.status(200).json(result);

  } catch (error) {
    console.error("[sofascore-data] Error:", error);
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");
    res.status(200).json({ error: error.message });
  }
}
