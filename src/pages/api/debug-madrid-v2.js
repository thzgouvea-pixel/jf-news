// Debug v2: testa dias +3 a +7 (main draw Madrid) + endpoints alternativos pra Fonseca
// URL: https://fonsecanews.com.br/api/debug-madrid-v2

export default async function handler(req, res) {
  var key = process.env.RAPIDAPI_KEY;
  if (!key) return res.status(500).json({ error: "RAPIDAPI_KEY missing" });

  var HOST = "sofascore6.p.rapidapi.com";
  var BASE = "https://sofascore6.p.rapidapi.com/api/sofascore";
  var headers = { "x-rapidapi-host": HOST, "x-rapidapi-key": key, "Content-Type": "application/json" };

  async function test(label, url) {
    try {
      var r = await fetch(url, { headers: headers });
      var body;
      try { body = await r.json(); } catch (e) { body = await r.text(); }
      return { label: label, url: url, status: r.status, body: body };
    } catch (e) {
      return { label: label, url: url, error: e.message };
    }
  }

  // 1. matchList dias +3 a +7 (onde main draw Madrid deve estar)
  var dayTests = [];
  for (var i = 3; i <= 7; i++) {
    var d = new Date(Date.now() + i * 86400000).toISOString().split("T")[0];
    dayTests.push(test("matchList_D+" + i + "_" + d, BASE + "/v1/match/list?sport_slug=tennis&date=" + d));
  }

  // 2. Endpoints alternativos de team events (formatos diferentes)
  var teamTests = [
    test("team_events_next_0", BASE + "/v1/team/403869/events/next/0"),
    test("team_events_last_0", BASE + "/v1/team/403869/events/last/0"),
    test("team_nextEvents", BASE + "/v1/team/nextEvents?team_id=403869"),
    test("team_lastEvents", BASE + "/v1/team/lastEvents?team_id=403869"),
    test("team_upcoming", BASE + "/v1/team/upcoming-events?team_id=403869"),
  ];

  // 3. Endpoints de unique-tournament (Madrid ATP = 2374, Season 2026 = 81204)
  var tournTests = [
    test("madrid_nextMatches", BASE + "/v1/unique-tournament/2374/season/81204/next-matches"),
    test("madrid_events_round1", BASE + "/v1/unique-tournament/2374/season/81204/events/round/1"),
    test("madrid_events_R1slug", BASE + "/v1/unique-tournament/2374/season/81204/events?round=1"),
    test("madrid_rounds", BASE + "/v1/unique-tournament/2374/season/81204/rounds"),
    test("madrid_info", BASE + "/v1/unique-tournament/2374/info"),
    test("madrid_list", BASE + "/v1/unique-tournament/list?sport_slug=tennis"),
  ];

  // 4. Search endpoints
  var searchTests = [
    test("search_fonseca", BASE + "/v1/search?query=fonseca"),
    test("search_all", BASE + "/v1/search/all?query=fonseca"),
    test("search_player", BASE + "/v1/search/player?query=fonseca"),
  ];

  var all = await Promise.all([].concat(dayTests, teamTests, tournTests, searchTests));

  // Filtra Fonseca
  var fonsecaFound = {};
  all.forEach(function (r) {
    if (!r.body || typeof r.body !== "object") return;
    var events = r.body.events || r.body.results || r.body.matches || (Array.isArray(r.body) ? r.body : null);
    if (!events || !Array.isArray(events)) return;
    var matches = events.filter(function (m) {
      if (!m) return false;
      var h = m.homeTeam || {}, a = m.awayTeam || {};
      var s = m.slug || m.name || "";
      return h.id === 403869 || a.id === 403869 ||
        /fonseca/i.test(h.name || "") || /fonseca/i.test(a.name || "") ||
        /fonseca/i.test(h.slug || "") || /fonseca/i.test(a.slug || "") ||
        /fonseca/i.test(s);
    });
    if (matches.length > 0) fonsecaFound[r.label] = matches.slice(0, 3); // max 3 pra não explodir
  });

  // Summary compacto: endpoints que funcionam (status 200) vs 404
  var summary = all.map(function (r) {
    return {
      label: r.label,
      status: r.status,
      works: r.status === 200,
      has_body: !!r.body,
      body_type: Array.isArray(r.body) ? "array(" + r.body.length + ")" : typeof r.body,
    };
  });

  res.status(200).json({
    FONSECA_FOUND: fonsecaFound,
    ENDPOINTS_THAT_WORK: summary.filter(function (s) { return s.works; }).map(function (s) { return s.label; }),
    ENDPOINTS_404: summary.filter(function (s) { return s.status === 404; }).map(function (s) { return s.label; }),
    summary: summary,
    full_results: all,
  });
}
