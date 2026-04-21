// Debug: testa endpoints SofaScore subutilizados pra ver quais dao dados do proximo jogo
// mesmo com adversario placeholder (R64P14)
// URL: https://fonsecanews.com.br/api/debug-endpoints

export default async function handler(req, res) {
  var key = process.env.RAPIDAPI_KEY;
  if (!key) return res.status(500).json({ error: "RAPIDAPI_KEY missing" });

  var TEAM_ID = 403869;  // Fonseca
  var MATCH_ID = 16012160;  // Madrid R64 placeholder

  var endpointsToTest = [
    // Endpoints de TIME/JOGADOR
    { name: "team_near_events", path: "/v1/team/" + TEAM_ID + "/near-events" },
    { name: "team_last_events", path: "/v1/team/" + TEAM_ID + "/last-events/0" },
    { name: "team_next_events", path: "/v1/team/" + TEAM_ID + "/next-events/0" },

    // Endpoints de MATCH/EVENT
    { name: "match_details", path: "/v1/match/details?match_id=" + MATCH_ID },
    { name: "event_details", path: "/v1/event/" + MATCH_ID },
    { name: "match_info", path: "/v1/match/info?match_id=" + MATCH_ID },

    // Endpoints de TORNEIO
    { name: "tournament_madrid", path: "/v1/unique-tournament/2374/season/81204/events/last/0" },
    { name: "tournament_madrid_next", path: "/v1/unique-tournament/2374/season/81204/events/next/0" },
  ];

  var results = [];

  for (var i = 0; i < endpointsToTest.length; i++) {
    var ep = endpointsToTest[i];
    var t0 = Date.now();
    try {
      var r = await fetch("https://sofascore6.p.rapidapi.com/api/sofascore" + ep.path, {
        headers: { "x-rapidapi-host": "sofascore6.p.rapidapi.com", "x-rapidapi-key": key },
        signal: AbortSignal.timeout(10000),
      });
      var elapsed = Date.now() - t0;
      var body = null;
      try { body = await r.json(); } catch (e) {}

      var entry = {
        name: ep.name,
        path: ep.path,
        status: r.status,
        elapsed_ms: elapsed,
      };

      if (body) {
        entry.body_size_bytes = JSON.stringify(body).length;

        // Analise especifica: tem match id 16012160?
        var bodyStr = JSON.stringify(body);
        entry.has_madrid_match = bodyStr.indexOf("16012160") >= 0;
        entry.has_R64P14 = bodyStr.indexOf("R64P14") >= 0;
        entry.has_Madrid = bodyStr.indexOf("Madrid") >= 0 || bodyStr.indexOf("madrid") >= 0;

        // Conta eventos se tiver lista
        if (body.events && Array.isArray(body.events)) {
          entry.events_count = body.events.length;
          // Pega os 3 primeiros eventos futuros com timestamps
          var now = Math.floor(Date.now() / 1000);
          var upcoming = body.events.filter(function (e) { return e.startTimestamp > now; }).slice(0, 3);
          entry.upcoming_events = upcoming.map(function (e) {
            return {
              id: e.id,
              home: e.homeTeam && e.homeTeam.name,
              away: e.awayTeam && e.awayTeam.name,
              tournament: e.tournament && e.tournament.name,
              round: e.roundInfo && e.roundInfo.name || e.round && e.round.name,
              startTime: new Date(e.startTimestamp * 1000).toISOString(),
            };
          });
        }

        // Se for match/event individual, mostra summary
        if (body.event || body.id) {
          var ev = body.event || body;
          entry.match_summary = {
            id: ev.id,
            home: ev.homeTeam && ev.homeTeam.name,
            away: ev.awayTeam && ev.awayTeam.name,
            tournament: ev.tournament && ev.tournament.name,
            round: ev.roundInfo && ev.roundInfo.name || ev.round && ev.round.name,
            startTime: ev.startTimestamp ? new Date(ev.startTimestamp * 1000).toISOString() : null,
          };
        }
      }

      results.push(entry);
    } catch (e) {
      results.push({
        name: ep.name,
        path: ep.path,
        error: e.name === "TimeoutError" ? "TIMEOUT_10s" : e.message,
        elapsed_ms: Date.now() - t0,
      });
    }
  }

  res.status(200).json({
    timestamp: new Date().toISOString(),
    results: results,
  });
}
