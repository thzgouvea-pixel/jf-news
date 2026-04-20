// Debug endpoint: testa varias rotas do SofaScore pra descobrir como achar a proxima partida do Joao
// Chamar UMA vez: https://fonsecanews.com.br/api/debug-madrid
// Copiar retorno e mandar no chat.

export default async function handler(req, res) {
  var key = process.env.RAPIDAPI_KEY;
  if (!key) return res.status(500).json({ error: "RAPIDAPI_KEY missing" });

  var HOST = "sofascore6.p.rapidapi.com";
  var BASE = "https://sofascore6.p.rapidapi.com/api/sofascore";
  var headers = { "x-rapidapi-host": HOST, "x-rapidapi-key": key, "Content-Type": "application/json" };

  var results = {};

  async function test(label, url) {
    try {
      var r = await fetch(url, { headers: headers });
      var status = r.status;
      var body;
      try { body = await r.json(); } catch (e) { body = await r.text(); }
      results[label] = { url: url, status: status, body: body };
    } catch (e) {
      results[label] = { url: url, error: e.message };
    }
  }

  var today = new Date().toISOString().split("T")[0];
  var tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
  var dayAfter = new Date(Date.now() + 2 * 86400000).toISOString().split("T")[0];

  // 1. Match list nos próximos 3 dias (o que o cron atual usa)
  await test("matchList_" + today, BASE + "/v1/match/list?sport_slug=tennis&date=" + today);
  await test("matchList_" + tomorrow, BASE + "/v1/match/list?sport_slug=tennis&date=" + tomorrow);
  await test("matchList_" + dayAfter, BASE + "/v1/match/list?sport_slug=tennis&date=" + dayAfter);

  // 2. Tentar endpoint "near-events" com varios formatos (nao listado oficialmente mas pode existir)
  await test("team_nearEvents_query", BASE + "/v1/team/near-events?team_id=403869");
  await test("team_nearEvents_path", BASE + "/v1/team/403869/near-events");
  await test("team_events", BASE + "/v1/team/events?team_id=403869");
  await test("team_matches", BASE + "/v1/team/matches?team_id=403869");

  // 3. Get team details (ja sabemos que funciona mas so pra confirmar que nao tem match info)
  await test("team_details", BASE + "/v1/team/details?team_id=403869");

  // 4. Madrid Open = unique_tournament_id 752 (padrao SofaScore)
  await test("madrid_seasons", BASE + "/v1/unique-tournament/seasons?unique_tournament_id=752");

  // 5. Filtrar matches com Fonseca nos resultados
  var fonsecaInMatchList = {};
  for (var i = 0; i < 3; i++) {
    var d = new Date(Date.now() + i * 86400000).toISOString().split("T")[0];
    var key2 = "matchList_" + d;
    var r = results[key2];
    if (r && r.body && typeof r.body === "object") {
      var events = r.body.events || [];
      var fonsecaMatches = events.filter(function (m) {
        var h = m.homeTeam || {}, a = m.awayTeam || {};
        var idMatch = h.id === 403869 || a.id === 403869;
        var nameMatch = /fonseca/i.test(h.name || "") || /fonseca/i.test(a.name || "") ||
          /fonseca/i.test(h.slug || "") || /fonseca/i.test(a.slug || "");
        return idMatch || nameMatch;
      });
      if (fonsecaMatches.length > 0) fonsecaInMatchList[d] = fonsecaMatches;
    }
  }

  // Retorna resumo + detalhes
  res.status(200).json({
    date_today: today,
    range_scanned: [today, tomorrow, dayAfter],
    fonseca_matches_found_in_matchList: fonsecaInMatchList,
    full_results: results,
  });
}
