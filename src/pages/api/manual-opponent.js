// /api/manual-opponent.js
// Atualiza o nextMatch manualmente quando SofaScore ainda não tem os dados
// GET: /api/manual-opponent?secret=XXX&name=Gabriel+Diallo&ranking=36&country=Canada&id=280151&broadcast=ESPN+2
// POST: body JSON { name, ranking, country, sofascore_id }
// Reutiliza o PUSH_SECRET como autenticação

import { kv } from "@vercel/kv";
import crypto from "crypto";

var BROADCAST_MAP = {
  "BMW Open": "ESPN 2 / Disney+",
  "Monte Carlo Masters": "ESPN",
  "Indian Wells Masters": "ESPN",
  "Miami Open": "ESPN",
  "Madrid Open": "ESPN",
  "Italian Open": "ESPN",
  "Roland Garros": "Globoplay",
  "Wimbledon": "ESPN",
  "Australian Open": "ESPN",
  "US Open": "ESPN",
  "Barcelona Open": "ESPN 4",
  "Hamburg Open": "ESPN 4",
  "Halle Open": "ESPN 4",
  "Queen's Club": "ESPN 4",
  "Swiss Indoors Basel": "ESPN 4",
  "Vienna Open": "ESPN 4",
  "Rotterdam Open": "ESPN 4",
  "Rio Open": "ESPN",
  "Argentina Open": "ESPN 4",
  "ATP Finals": "ESPN",
  "Canadian Open": "ESPN",
  "Cincinnati Masters": "ESPN",
  "Shanghai Masters": "ESPN",
  "Paris Masters": "ESPN",
};

function lookupBroadcast(tournamentName) {
  if (!tournamentName) return null;
  if (BROADCAST_MAP[tournamentName]) return BROADCAST_MAP[tournamentName];
  for (var k in BROADCAST_MAP) { if (tournamentName.toLowerCase().includes(k.toLowerCase())) return BROADCAST_MAP[k]; }
  return null;
}

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
    // Accept both GET query params and POST body
    var name = req.query.name || (req.body && req.body.name);
    var ranking = parseInt(req.query.ranking || (req.body && req.body.ranking)) || null;
    var country = req.query.country || (req.body && req.body.country) || "";
    var opponentId = parseInt(req.query.id || (req.body && req.body.sofascore_id)) || null;
    var atpSlug = req.query.atp || (req.body && req.body.atp_slug) || null;

    if (!name) return res.status(400).json({ error: "name required. Use ?name=Gabriel+Diallo&ranking=36&country=Canada&id=280151" });

    // Sanitize inputs
    name = String(name).substring(0, 100).replace(/[<>"'&]/g, "");
    if (!name.trim()) return res.status(400).json({ error: "name required after sanitization" });
    country = String(country).substring(0, 60).replace(/[<>"'&]/g, "");
    if (ranking !== null && (ranking < 1 || ranking > 5000)) {
      return res.status(400).json({ error: "ranking must be between 1 and 5000" });
    }
    if (atpSlug) atpSlug = String(atpSlug).substring(0, 20).replace(/[^a-zA-Z0-9]/g, "");

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
    var round = req.query.round || (req.body && req.body.round);
    var surface = req.query.surface || (req.body && req.body.surface);
    var court = req.query.court || (req.body && req.body.court);
    var category = req.query.category || (req.body && req.body.category);
    var broadcast = req.query.broadcast || (req.body && req.body.broadcast);
    if (tournament) nextMatch.tournament_name = tournament;
    if (date) nextMatch.date = date;
    if (round) nextMatch.round = round;
    if (surface) nextMatch.surface = surface;
    if (court) nextMatch.court = court;
    if (category) nextMatch.tournament_category = category;
    if (broadcast) nextMatch.broadcast = broadcast;

    // Auto-lookup broadcast from BROADCAST_MAP when not explicitly provided
    if (!nextMatch.broadcast && nextMatch.tournament_name) {
      var autoBC = lookupBroadcast(nextMatch.tournament_name);
      if (autoBC) nextMatch.broadcast = autoBC;
    }

    // Defaults if no tournament data exists
    if (!nextMatch.tournament_name) nextMatch.tournament_name = "Monte Carlo Masters";
    if (!nextMatch.date) nextMatch.date = "2026-04-05T12:00:00Z";
    if (!nextMatch.tournament_category) nextMatch.tournament_category = "Masters 1000";
    if (!nextMatch.surface) nextMatch.surface = "Clay";

    await kv.set("fn:nextMatch", JSON.stringify(nextMatch), { ex: 86400 * 7 });
    await kv.set("fn:nextMatchManualLock", new Date().toISOString(), { ex: 86400 * 3 });

    return res.status(200).json({
      ok: true,
      updated: {
        opponent_name: nextMatch.opponent_name,
        opponent_ranking: nextMatch.opponent_ranking,
        opponent_country: nextMatch.opponent_country,
        opponent_id: nextMatch.opponent_id,
        tournament: nextMatch.tournament_name || "unknown",
        round: nextMatch.round || "",
        surface: nextMatch.surface || "",
        court: nextMatch.court || "",
        date: nextMatch.date || "",
        broadcast: nextMatch.broadcast || null,
      }
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
