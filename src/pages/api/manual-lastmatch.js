import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  var secret = req.query.secret || req.headers["x-secret"];
  if (secret !== process.env.PUSH_SECRET) {
    return res.status(401).json({ error: "unauthorized" });
  }
  try {
    if (req.method === "POST" && req.body) {
      var match = req.body;
      await kv.set("fn:lastMatch", JSON.stringify(match), { ex: 86400 * 7 });
      return res.status(200).json({ ok: true, match: match });
    }

    // GET: set the current last match with verified data
    var lastMatch = {
      result: "D",
      score: "5-7 7-6 3-6",
      opponent_name: "A. Zverev",
      opponent_ranking: 3,
      opponent_country: "Germany",
      tournament_name: "Monte Carlo, Monaco",
      tournament_category: "Masters 1000",
      surface: "Clay",
      round: "Quartas de final",
      date: "2026-04-10T06:15:00Z",
      court: "",
      finished: true
    };

    await kv.set("fn:lastMatch", JSON.stringify(lastMatch), { ex: 86400 * 7 });
    return res.status(200).json({ ok: true, match: lastMatch });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
