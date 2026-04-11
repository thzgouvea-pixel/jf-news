import { kv } from "@vercel/kv";
import crypto from "crypto";

function safeCompare(a, b) {
  if (!a || !b) return false;
  var bufA = Buffer.from(String(a));
  var bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

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
      // GET: set the verified correct last match (Fonseca vs Zverev, Monte Carlo QF)
      match = {
        result: "D",
        score: "5-7 7-6 3-6",
        opponent_name: "A. Zverev",
        opponent_ranking: 3,
        opponent_country: "Germany",
        tournament_name: "Monte Carlo, Monaco",
        tournament_category: "Masters 1000",
        surface: "Clay",
        round: "Quartas de final",
        date: "2026-04-10T06:15:00Z"
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
