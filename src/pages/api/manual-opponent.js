// /api/manual-opponent.js
// Atualiza o nextMatch manualmente quando SofaScore ainda não tem os dados
// GET: /api/manual-opponent?secret=XXX&name=Gabriel+Diallo&ranking=36&country=Canada&id=280151
// POST: body JSON { name, ranking, country, sofascore_id }
// Reutiliza o PUSH_SECRET como autenticação

import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  var secret = req.query.secret || req.headers["x-secret"];
  if (!secret || secret !== process.env.PUSH_SECRET) {
    return res.status(401).json({ error: "unauthorized" });
  }

  try {
    // Accept both GET query params and POST body
    var name = req.query.name || (req.body && req.body.name);
    var ranking = parseInt(req.query.ranking || (req.body && req.body.ranking)) || null;
    var country = req.query.country || (req.body && req.body.country) || "";
    var opponentId = parseInt(req.query.id || (req.body && req.body.sofascore_id)) || null;
    var atpSlug = req.query.atp || (req.body && req.body.atp_slug) || null;

    if (!name) return res.status(400).json({ error: "name required. Use ?name=Gabriel+Diallo&ranking=36&country=Canada&id=280151" });

    // Get existing nextMatch from KV or create with tournament defaults
    var existing = await kv.get("fn:nextMatch");
    var nextMatch = existing ? (typeof existing === "string" ? JSON.parse(existing) : existing) : {};

    // Update opponent fields
    nextMatch.opponent_name = name;
    nextMatch.opponent_ranking = ranking;
    nextMatch.opponent_country = country;
    nextMatch.opponent_id = opponentId;
    if (atpSlug) nextMatch.opponent_atp_slug = atpSlug;

    // Ensure tournament fields exist (use query params or keep existing)
    var tournament = req.query.tournament || (req.body && req.body.tournament);
    var date = req.query.date || (req.body && req.body.date);
    if (tournament) nextMatch.tournament_name = tournament;
    if (date) nextMatch.date = date;

    // Defaults if no tournament data exists
    if (!nextMatch.tournament_name) nextMatch.tournament_name = "Monte Carlo Masters";
    if (!nextMatch.date) nextMatch.date = "2026-04-05T12:00:00Z";
    if (!nextMatch.tournament_category) nextMatch.tournament_category = "Masters 1000";
    if (!nextMatch.surface) nextMatch.surface = "Clay";

    await kv.set("fn:nextMatch", JSON.stringify(nextMatch), { ex: 86400 * 7 });

    return res.status(200).json({
      ok: true,
      updated: {
        opponent_name: nextMatch.opponent_name,
        opponent_ranking: nextMatch.opponent_ranking,
        opponent_country: nextMatch.opponent_country,
        opponent_id: nextMatch.opponent_id,
        tournament: nextMatch.tournament_name || "unknown"
      }
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
