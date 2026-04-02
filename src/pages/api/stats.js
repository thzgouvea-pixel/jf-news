// ===== API: Unified Stats v2 =====
// OPTIMIZATION: Removed kv.scan() loop. Uses "likes:all" index instead.
// s-maxage=300 (5 min edge cache).
// Before: N+4 reads per request (scan loop). Now: 4 reads max.

import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    var now = new Date();
    var brasilia = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    var today = brasilia.toISOString().split("T")[0];

    // 4 reads max — no scan loop
    var values = await kv.mget(
      "visitors:total",
      "site:feedback",
      "poll:" + today,
      "likes:all"
    );

    var parse = function(val) {
      if (!val) return null;
      if (typeof val === "string") { try { return JSON.parse(val); } catch(e) { return val; } }
      return val;
    };

    return res.status(200).json({
      visitors: parse(values[0]) || 0,
      feedback: parse(values[1]) || { up: 0, down: 0 },
      poll: parse(values[2]) || { a: 0, b: 0, total: 0 },
      likes: parse(values[3]) || {}
    });
  } catch (error) {
    console.error("[stats] Error:", error);
    return res.status(200).json({
      visitors: 0,
      feedback: { up: 0, down: 0 },
      poll: { a: 0, b: 0, total: 0 },
      likes: {}
    });
  }
}
