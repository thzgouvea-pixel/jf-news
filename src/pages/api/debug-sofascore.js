// ===== DEBUG v5: Find ranking via Miami standings or team ranking field =====
var RAPIDAPI_HOST = "sofascore6.p.rapidapi.com";

async function testEndpoint(path, apiKey) {
  try {
    var url = "https://" + RAPIDAPI_HOST + "/api/sofascore" + path;
    var res = await fetch(url, {
      headers: { "x-rapidapi-host": RAPIDAPI_HOST, "x-rapidapi-key": apiKey },
    });
    if (!res.ok) return { path: path, status: res.status, error: "HTTP " + res.status };
    var data = await res.json();
    return { path: path, status: res.status, keys: Object.keys(data), preview: JSON.stringify(data).substring(0, 3000) };
  } catch (e) {
    return { path: path, error: e.message };
  }
}

export default async function handler(req, res) {
  var apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) return res.status(200).json({ error: "No RAPIDAPI_KEY" });

  var results = {};

  // Miami Open = unique_tournament_id 2430, season_id 80799
  // Get seasons to find the right season_id
  results.miami_seasons = await testEndpoint("/v1/unique-tournament/seasons?unique_tournament_id=2430", apiKey);

  // Get standings for Miami 2026
  results.miami_standings = await testEndpoint("/v1/unique-tournament/season/standings?unique_tournament_id=2430&season_id=80799", apiKey);

  // Get the full team details response (ALL fields, not truncated)
  // to check every single field for ranking data
  var teamUrl = "https://" + RAPIDAPI_HOST + "/api/sofascore/v1/team/details?team_id=403869";
  try {
    var teamRes = await fetch(teamUrl, {
      headers: { "x-rapidapi-host": RAPIDAPI_HOST, "x-rapidapi-key": apiKey },
    });
    var teamData = await teamRes.json();
    results.team_full = { 
      allKeys: Object.keys(teamData),
      fullJSON: JSON.stringify(teamData)
    };
  } catch(e) { results.team_full = { error: e.message }; }

  // Try searching for "rankings" in endpoint URL patterns
  results.rankings_atp = await testEndpoint("/v1/rankings?sport_slug=tennis&type=atp", apiKey);
  results.rankings_singles = await testEndpoint("/v1/rankings?type=singles&category=atp", apiKey);

  res.status(200).json(results);
}
