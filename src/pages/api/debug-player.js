// Endpoint de debug — testa endpoints SofaScore que podem ter career stats do João
// Pode deletar depois de validar
import crypto from "crypto";

function safeCompare(a, b) {
  if (!a || !b) return false;
  var bufA = Buffer.from(String(a));
  var bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

const TEAM_ID = 403869; // João Fonseca SofaScore team_id
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const BASE = "https://sofascore6.p.rapidapi.com/api/sofascore";

async function tryEndpoint(name, url) {
  try {
    var ctrl = new AbortController();
    var to = setTimeout(function () { ctrl.abort(); }, 8000);
    var res = await fetch(url, {
      headers: {
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": "sofascore6.p.rapidapi.com"
      },
      signal: ctrl.signal
    });
    clearTimeout(to);
    var body;
    try { body = await res.json(); } catch (e) { body = "non-json: " + e.message; }
    return { name: name, status: res.status, body: body };
  } catch (e) {
    return { name: name, error: e.message };
  }
}

export default async function handler(req, res) {
  if (!safeCompare(req.query.secret, process.env.PUSH_SECRET)) {
    return res.status(401).json({ error: "unauthorized" });
  }

  var results = [];
  results.push(await tryEndpoint("team_details", BASE + "/v1/team/details?team_id=" + TEAM_ID));
  results.push(await tryEndpoint("team_statistics_overall", BASE + "/v1/team/statistics/overall?team_id=" + TEAM_ID));
  results.push(await tryEndpoint("team_year_summary", BASE + "/v1/team/year-summary?team_id=" + TEAM_ID));
  results.push(await tryEndpoint("team_performance", BASE + "/v1/team/performance?team_id=" + TEAM_ID));

  return res.status(200).json({
    team_id: TEAM_ID,
    results: results
  });
}
