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
    // Return first 500 chars to avoid huge response
    var preview = JSON.stringify(data).substring(0, 500);
    return { path: path, status: status, keys: Object.keys(data), preview: preview };
  } catch (e) {
    return { path: path, status: 0, error: e.message };
  }
}

export default async function handler(req, res) {
  var apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) return res.status(200).json({ error: "No RAPIDAPI_KEY" });

  var results = {};

  // Test ranking endpoints
  results.rankings = await testEndpoint("/v1/team/rankings?team_id=" + FONSECA_TEAM_ID, apiKey);
  results.details = await testEndpoint("/v1/team/details?team_id=" + FONSECA_TEAM_ID, apiKey);
  results.results_endpoint = await testEndpoint("/v1/team/results?team_id=" + FONSECA_TEAM_ID, apiKey);
  results.near_events = await testEndpoint("/v1/team/near-events?team_id=" + FONSECA_TEAM_ID + "&upcoming=true", apiKey);

  // Try alternative endpoints for ranking
  results.player_rankings = await testEndpoint("/v1/rankings/type/1", apiKey); // ATP singles ranking
  results.team_events = await testEndpoint("/v1/team/events?team_id=" + FONSECA_TEAM_ID + "&page=0", apiKey);
  results.team_last_events = await testEndpoint("/v1/team/events/last?team_id=" + FONSECA_TEAM_ID + "&page=0", apiKey);
  results.team_next_events = await testEndpoint("/v1/team/events/next?team_id=" + FONSECA_TEAM_ID + "&page=0", apiKey);
  results.team_statistics = await testEndpoint("/v1/team/statistics?team_id=" + FONSECA_TEAM_ID, apiKey);

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
