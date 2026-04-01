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
  results.details = await testEndpoint("/v1/team/details?team_id=" + FONSECA_TEAM_ID, apiKey);

  // Try scraping ranking from match data (players in match list often include ranking)
  var today = new Date().toISOString().split("T")[0];
  results.match_list_today = await testEndpoint("/v1/match/list?sport_slug=tennis&date=" + today, apiKey);

  // Try ATP rankings endpoint variations
  results.atp_rankings = await testEndpoint("/v1/rankings/type/1", apiKey);
  results.atp_rankings_v2 = await testEndpoint("/v1/sport/tennis/rankings", apiKey);
  results.atp_rankings_v3 = await testEndpoint("/v1/unique-tournament/2519/rankings", apiKey); // 2519 = ATP Rankings
  results.atp_rankings_v4 = await testEndpoint("/v1/rankings/type/1/page/1", apiKey);

  // Check if match data includes player ranking
  // Look at a recent Fonseca match to see if ranking is embedded
  results.match_detail = await testEndpoint("/v1/match/details?match_id=15708865", apiKey); // Alcaraz match

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
