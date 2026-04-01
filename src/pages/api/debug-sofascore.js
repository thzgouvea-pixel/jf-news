// ===== DEBUG v3: Test Player endpoints =====
var RAPIDAPI_HOST = "sofascore6.p.rapidapi.com";
var FONSECA_TEAM_ID = 403869;

async function testEndpoint(path, apiKey) {
  try {
    var url = "https://" + RAPIDAPI_HOST + "/api/sofascore" + path;
    var res = await fetch(url, {
      headers: { "x-rapidapi-host": RAPIDAPI_HOST, "x-rapidapi-key": apiKey },
    });
    if (!res.ok) return { path: path, status: res.status, error: "HTTP " + res.status };
    var data = await res.json();
    return { path: path, status: res.status, keys: Object.keys(data), preview: JSON.stringify(data).substring(0, 2000) };
  } catch (e) {
    return { path: path, error: e.message };
  }
}

export default async function handler(req, res) {
  var apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) return res.status(200).json({ error: "No RAPIDAPI_KEY" });

  var results = {};

  // Player endpoints — team_id might work as player_id
  results.player_details = await testEndpoint("/v1/player/details?player_id=" + FONSECA_TEAM_ID, apiKey);
  results.player_transfer = await testEndpoint("/v1/player/transfer-history?player_id=" + FONSECA_TEAM_ID, apiKey);

  // Team endpoints we haven't tried
  results.team_statistics = await testEndpoint("/v1/team/statistics?team_id=" + FONSECA_TEAM_ID + "&season_id=80799", apiKey);
  results.team_players = await testEndpoint("/v1/team/players?team_id=" + FONSECA_TEAM_ID, apiKey);

  // Match odds
  results.match_odds = await testEndpoint("/v1/match/odds?match_id=15708865", apiKey);

  res.status(200).json(results);
}
