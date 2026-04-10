import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  var secret = req.query.secret || req.headers["x-secret"];
  if (secret !== process.env.PUSH_SECRET) {
    return res.status(401).json({ error: "unauthorized" });
  }
  try {
    var opponent = req.query.opponent;
    var score = req.query.score;
    var result = req.query.result || "V";
    if (!opponent || !score) return res.status(400).json({ error: "opponent and score required" });
    var existing = await kv.get("fn:lastMatch");
    var lastMatch = existing ? (typeof existing === "string" ? JSON.parse(existing) : existing) : {};
    lastMatch.opponent_name = decodeURIComponent(opponent);
    lastMatch.score = decodeURIComponent(score);
    lastMatch.result = result;
    if (req.query.tournament) lastMatch.tournament_name = decodeURIComponent(req.query.tournament);
    if (req.query.round) lastMatch.round = decodeURIComponent(req.query.round);
    if (req.query.surface) lastMatch.surface = req.query.surface;
    if (req.query.country) lastMatch.opponent_country = req.query.country;
    if (req.query.ranking) lastMatch.opponent_ranking = parseInt(req.query.ranking);
    if (req.query.id) lastMatch.opponent_id = parseInt(req.query.id);
    if (req.query.category) lastMatch.tournament_category = req.query.category;
    lastMatch.date = req.query.date || new Date().toISOString();
    lastMatch.finished = true;
    await kv.set("fn:lastMatch", JSON.stringify(lastMatch), { ex: 86400 * 7 });
    return res.status(200).json({ ok: true, updated: lastMatch });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
