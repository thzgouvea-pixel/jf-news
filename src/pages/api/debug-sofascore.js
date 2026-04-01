// ===== DEBUG: Test SofaScore endpoints =====
// TEMPORARY — delete after verifying which endpoints work
// Access: GET /api/debug-sofascore

var RAPIDAPI_HOST = "sofascore6.p.rapidapi.com";
var FONSECA_TEAM_ID = 403869;

async function testEndpoint(path, apiKey) {
  try {
    var url = "https://" + RAPIDAPI_HOST + "/api/sofascore" + path;
    var res = await fetch(url, {
      headers: {
        "x-rapidapi-host": RAPIDAPI_HOST,
        "x-rapidapi-key": apiKey,
      },
    });
    var status = res.status;
    if (!res.ok) return { path: path, status: status, data: null, error: "HTTP " + status };
    var data = await res.json();
    var preview = JSON.stringify(data).substring(0, 2000);
    return { path: path, status: status, keys: Object.keys(data), preview: preview };
  } catch (e) {
    return { path: path, status: 0, error: e.message };
  }
}

export default async function handler(req, res) {
  var apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) return res.status(200).json({ error: "No RAPIDAPI_KEY" });

  var results = {};

  // Focus: does match_detail include ranking in homeTeam/awayTeam?
  results.match_detail = await testEndpoint("/v1/match/details?match_id=15708865", apiKey);

  // Also check a match from the list to see if ranking is there
  // Pick first match from today's list and inspect team objects
  try {
    var listUrl = "https://" + RAPIDAPI_HOST + "/api/sofascore/v1/match/list?sport_slug=tennis&date=2026-04-01";
    var listRes = await fetch(listUrl, { headers: { "x-rapidapi-host": RAPIDAPI_HOST, "x-rapidapi-key": apiKey } });
    var listData = await listRes.json();
    var matches = Array.isArray(listData) ? listData : [];
    // Find any ATP match and show the homeTeam/awayTeam structure
    var sample = matches.find(function(m) { return m.tournament && m.tournament.name && m.tournament.category && m.tournament.category.slug === "atp"; });
    if (sample) {
      results.sample_match = {
        homeTeam: sample.homeTeam,
        awayTeam: sample.awayTeam,
        homeTeamKeys: Object.keys(sample.homeTeam || {}),
        awayTeamKeys: Object.keys(sample.awayTeam || {}),
      };
    }
  } catch(e) { results.sample_match = { error: e.message }; }

  // Also test the direct SofaScore API
  try {
    var directRes = await fetch("https://api.sofascore.com/api/v1/team/" + FONSECA_TEAM_ID, {
      headers: { "User-Agent": "FonsecaNews/5.0" },
    });
    var directData = directRes.ok ? await directRes.json() : null;
    results.direct_api = {
      status: directRes.status,
      keys: directData ? Object.keys(directData) : null,
      preview: directData ? JSON.stringify(directData).substring(0, 500) : null,
    };
  } catch (e) {
    results.direct_api = { error: e.message };
  }

  res.status(200).json(results);
}
