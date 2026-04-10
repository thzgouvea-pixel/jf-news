import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  var secret = req.query.secret || req.headers["x-secret"];
  if (secret !== process.env.PUSH_SECRET) {
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
    return res.status(200).json({ ok: true, updated: match });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
