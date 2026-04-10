// pages/api/predict.js — Palpites: placar da próxima partida via Upstash KV
import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  try {
    if (req.method === "POST") {
      var body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      var score = body.score; // e.g. "6-3 6-4" or "fonseca" / "opponent"
      var matchId = body.matchId || "next";
      if (!score) return res.status(400).json({ error: "score required" });

      // Validate inputs
      score = String(score).substring(0, 50);
      matchId = String(matchId).substring(0, 50);
      if (!/^[a-zA-Z0-9\s\-_]+$/.test(score)) return res.status(400).json({ error: "invalid score format" });
      if (!/^[a-zA-Z0-9_-]+$/.test(matchId)) return res.status(400).json({ error: "invalid matchId format" });

      var key = "fn:predict:" + matchId;
      var current = await kv.get(key);
      var data = current ? (typeof current === "string" ? JSON.parse(current) : current) : {};
      data[score] = (data[score] || 0) + 1;
      await kv.set(key, JSON.stringify(data), { ex: 86400 * 14 }); // 14 days expiry

      var total = 0;
      for (var k in data) total += data[k];
      var predictions = {};
      for (var k in data) predictions[k] = { count: data[k], pct: Math.round((data[k] / total) * 100) };

      return res.status(200).json({ predictions: predictions, total: total });
    }

    if (req.method === "GET") {
      var matchId = req.query.matchId || "next";
      matchId = String(matchId).substring(0, 50);
      if (!/^[a-zA-Z0-9_-]+$/.test(matchId)) return res.status(400).json({ error: "invalid matchId format" });
      var key = "fn:predict:" + matchId;
      var current = await kv.get(key);
      var data = current ? (typeof current === "string" ? JSON.parse(current) : current) : {};

      var total = 0;
      for (var k in data) total += data[k];
      var predictions = {};
      for (var k in data) predictions[k] = { count: data[k], pct: total > 0 ? Math.round((data[k] / total) * 100) : 0 };

      return res.status(200).json({ predictions: predictions, total: total });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
