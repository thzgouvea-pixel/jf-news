// ===== API: Prediction v2 =====
// OPTIMIZATION: s-maxage=60 on GET

import { kv } from "@vercel/kv";

function getVisitorId(req) {
  var forwarded = req.headers["x-forwarded-for"];
  var ip = forwarded ? forwarded.split(",")[0].trim() : req.socket?.remoteAddress || "unknown";
  var hash = 0;
  for (var i = 0; i < ip.length; i++) {
    hash = ((hash << 5) - hash) + ip.charCodeAt(i);
    hash = hash & hash;
  }
  return "v_" + Math.abs(hash).toString(36);
}

export default async function handler(req, res) {
  try {
    var visitorId = getVisitorId(req);

    if (req.method === "GET") {
      res.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=300");
      var matchKey = req.query.match;
      if (!matchKey) return res.status(400).json({ error: "Missing match param" });

      // Validate matchKey
      matchKey = String(matchKey).substring(0, 50);
      if (!/^[a-zA-Z0-9_-]+$/.test(matchKey)) return res.status(400).json({ error: "Invalid match format" });

      var key = "pred:" + visitorId + ":" + matchKey;
      var prediction = await kv.get(key);
      var streakKey = "pred_streak:" + visitorId;
      var streak = await kv.get(streakKey) || 0;
      var statsKey = "pred_stats:" + matchKey;
      var stats = await kv.get(statsKey) || {};

      return res.status(200).json({
        prediction: prediction || null,
        streak: streak,
        community: stats
      });
    }

    if (req.method === "POST") {
      var body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      var matchKey = body.match;
      var pred = body.prediction;
      if (!matchKey || !pred) return res.status(400).json({ error: "Missing data" });

      // Validate inputs
      matchKey = String(matchKey).substring(0, 50);
      if (!/^[a-zA-Z0-9_-]+$/.test(matchKey)) return res.status(400).json({ error: "Invalid match format" });

      var key = "pred:" + visitorId + ":" + matchKey;
      var existing = await kv.get(key);
      if (existing) return res.status(200).json({ message: "Already predicted", prediction: existing });

      await kv.set(key, pred, { ex: 60 * 60 * 24 * 30 });

      var statsKey = "pred_stats:" + matchKey;
      var stats = await kv.get(statsKey) || {};
      var setKey = pred.sets || "unknown";
      stats[setKey] = (stats[setKey] || 0) + 1;
      stats.total = (stats.total || 0) + 1;
      await kv.set(statsKey, stats, { ex: 60 * 60 * 24 * 30 });

      return res.status(200).json({
        message: "Prediction saved",
        prediction: pred,
        community: stats
      });
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    console.error("[prediction] Error:", e);
    res.status(200).json({ prediction: null, streak: 0, community: {} });
  }
}
