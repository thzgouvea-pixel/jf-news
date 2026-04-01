// ===== DEBUG v4: UT standings + match odds =====
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

  // ATP Rankings is unique_tournament_id 3371 on SofaScore
  // Try common ATP ranking IDs
  results.ut_standings_3371 = await testEndpoint("/v1/unique-tournament/season/standings?unique_tournament_id=3371&season_id=80799", apiKey);
  results.ut_standings_2519 = await testEndpoint("/v1/unique-tournament/season/standings?unique_tournament_id=2519&season_id=80799", apiKey);

  // Try getting UT details for ATP to find the right IDs
  results.ut_details_atp = await testEndpoint("/v1/unique-tournament/details?unique_tournament_id=3371", apiKey);

  // Try ATP seasons to find season_id
  results.ut_seasons_3371 = await testEndpoint("/v1/unique-tournament/seasons?unique_tournament_id=3371", apiKey);

  // Also try the rankings-style unique tournament IDs
  // SofaScore uses 4820 for ATP Rankings in some versions
  results.ut_standings_4820 = await testEndpoint("/v1/unique-tournament/season/standings?unique_tournament_id=4820&season_id=80799", apiKey);

  // Try without season_id
  results.ut_standings_no_season = await testEndpoint("/v1/unique-tournament/season/standings?unique_tournament_id=3371", apiKey);

  res.status(200).json(results);
}
