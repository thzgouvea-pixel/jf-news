// Debug v3: testa search/all com parametro correto "q" (nao "query")
// URL: https://fonsecanews.com.br/api/debug-madrid-v3

export default async function handler(req, res) {
  var key = process.env.RAPIDAPI_KEY;
  if (!key) return res.status(500).json({ error: "RAPIDAPI_KEY missing" });

  var HOST = "sofascore6.p.rapidapi.com";
  var BASE = "https://sofascore6.p.rapidapi.com/api/sofascore";
  var headers = { "x-rapidapi-host": HOST, "x-rapidapi-key": key };

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

  // Testa search/all com diferentes formatos
  var tests = [
    test("search_q_fonseca", BASE + "/v1/search/all?q=fonseca"),
    test("search_q_joao_fonseca", BASE + "/v1/search/all?q=joao%20fonseca"),
    test("search_q_fonseca_type", BASE + "/v1/search/all?q=fonseca&type=player"),

    // Testa match/list com filtro especifico pra Madrid
    test("matchList_D+2_2026-04-22", BASE + "/v1/match/list?sport_slug=tennis&date=2026-04-22"),

    // Tenta endpoints de player com team_id  
    test("player_detail_v2", BASE + "/v1/player/details?player_id=403869"),
    test("player_events", BASE + "/v1/player/events?player_id=403869"),
    test("player_next", BASE + "/v1/player/next?player_id=403869"),

    // Tenta variantes de team com endpoint correto
    test("team_matches_q", BASE + "/v1/team/matches?team_id=403869&type=next"),
    test("team_matches_upcoming", BASE + "/v1/team/matches?team_id=403869&type=upcoming"),

    // Tentativas com match list
    test("matchList_category", BASE + "/v1/match/list?sport_slug=tennis&date=2026-04-22&category_id=3"),
  ];

  var all = await Promise.all(tests);

  // Filtra Fonseca em qualquer resposta
  var fonsecaFound = {};
  all.forEach(function (r) {
    if (!r.body || typeof r.body !== "object") return;

    // Procura em TODOS os arrays dentro da resposta
    function searchDeep(obj, path) {
      path = path || "";
      if (!obj) return;
      if (Array.isArray(obj)) {
        var matches = obj.filter(function (item) {
          if (!item || typeof item !== "object") return false;
          var s = JSON.stringify(item).toLowerCase();
          return s.indexOf("fonseca") >= 0 || s.indexOf("403869") >= 0;
        });
        if (matches.length > 0) {
          fonsecaFound[r.label + path] = matches.slice(0, 3);
        }
      } else if (typeof obj === "object") {
        for (var k in obj) {
          searchDeep(obj[k], path + "." + k);
        }
      }
    }
    searchDeep(r.body, "");
  });

  var summary = all.map(function (r) {
    return {
      label: r.label,
      status: r.status,
      works: r.status === 200,
    };
  });

  res.status(200).json({
    FONSECA_FOUND: fonsecaFound,
    ENDPOINTS_WORKING: summary.filter(function (s) { return s.works; }).map(function (s) { return s.label; }),
    summary: summary,
    full_results: all,
  });
}
