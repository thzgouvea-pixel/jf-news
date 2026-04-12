import { kv } from "@vercel/kv";
import crypto from "crypto";

function safeCompare(a, b) {
  if (!a || !b) return false;
  var bufA = Buffer.from(String(a));
  var bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// GET: /api/manual-lastmatch?secret=XXX&opponent=A.+Zverev&score=5-7+7-6+3-6&result=D&tournament=Monte+Carlo+Masters&round=Quartas+de+final&surface=Clay&country=Germany&ranking=3&category=Masters+1000&date=2026-04-10T06:15:00Z
// POST: body JSON com os mesmos campos
export default async function handler(req, res) {
  var secret = req.query.secret || req.headers["x-secret"];
  if (!safeCompare(secret, process.env.PUSH_SECRET)) {
    return res.status(401).json({ error: "unauthorized" });
  }
  try {
    var match;
    if (req.method === "POST" && req.body) {
      match = req.body;
    } else {
      // GET: build match from query params
      var opponent = req.query.opponent;
      var score = req.query.score;
      var result = req.query.result;
      if (!opponent || !score || !result) {
        return res.status(400).json({
          error: "opponent, score, result required",
          usage: "/api/manual-lastmatch?secret=XXX&opponent=A.+Zverev&score=5-7+7-6+3-6&result=D&tournament=Monte+Carlo+Masters&round=QF&surface=Clay&country=Germany&ranking=3&category=Masters+1000&date=2026-04-10T06:15:00Z"
        });
      }
      match = {
        result: String(result).substring(0, 1).toUpperCase(),
        score: String(score).substring(0, 50),
        opponent_name: String(opponent).substring(0, 100).replace(/[<>"'&]/g, ""),
        opponent_ranking: parseInt(req.query.ranking) || null,
        opponent_country: req.query.country ? String(req.query.country).substring(0, 60) : "",
        tournament_name: req.query.tournament ? String(req.query.tournament).substring(0, 100) : "",
        tournament_category: req.query.category ? String(req.query.category).substring(0, 50) : "",
        surface: req.query.surface ? String(req.query.surface).substring(0, 20) : "",
        round: req.query.round ? String(req.query.round).substring(0, 50) : "",
        date: req.query.date || new Date().toISOString()
      };
    }
    match.finished = true;
    var T7 = 86400 * 7;
    var T3 = 86400 * 3;
    await kv.set("fn:lastMatch", JSON.stringify(match), { ex: T7 });
    await kv.set("fn:lastMatchManualLock", new Date().toISOString(), { ex: T3 });
    // Only delete matchStats if opponent changed (stale data from different match)
    try {
      var existingStats = await kv.get("fn:matchStats");
      if (existingStats) {
        var parsedStats = typeof existingStats === "string" ? JSON.parse(existingStats) : existingStats;
        if (parsedStats && parsedStats.opponent_name && match.opponent_name) {
          var statsOpp = parsedStats.opponent_name.split(" ").pop().toLowerCase();
          var newOpp = match.opponent_name.split(" ").pop().toLowerCase();
          if (statsOpp !== newOpp) {
            await kv.del("fn:matchStats");
          }
          // else: same opponent, keep existing stats
        }
      }
    } catch(e) {
      // If we can't check, don't delete (safe default)
    }
    return res.status(200).json({ ok: true, updated: match });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
