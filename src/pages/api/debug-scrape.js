// ===== FONSECA NEWS — DEBUG SCRAPE v4 =====
// Foco: descobrir se proxy sofascore6 retorna jogos do Joao em Roma
// via match/list (que ja sabemos funciona) ou match/details com ID conhecido.

async function tryProxy(label, path) {
  var rkey = process.env.RAPIDAPI_KEY;
  var url = "https://sofascore6.p.rapidapi.com" + path;
  var ctrl = new AbortController();
  var to = setTimeout(function() { ctrl.abort(); }, 8000);
  var t0 = Date.now();
  try {
    var r = await fetch(url, {
      signal: ctrl.signal,
      headers: { "X-RapidAPI-Key": rkey, "X-RapidAPI-Host": "sofascore6.p.rapidapi.com" }
    });
    clearTimeout(to);
    var elapsed = Date.now() - t0;
    var text = await r.text();
    var info = { label: label, path: path, status: r.status, elapsedMs: elapsed, bodyLength: text.length };
    try {
      var data = JSON.parse(text);
      info.parsedKeys = Object.keys(data || {}).slice(0, 8);
      var events = (data && data.events) || (data && data.event ? [data.event] : null) || (Array.isArray(data) ? data : null);
      if (events && Array.isArray(events)) {
        info.eventsCount = events.length;
        // Filtra eventos relacionados ao Fonseca
        var fonsecaEvents = events.filter(function(ev) {
          if (!ev) return false;
          var hn = ev.homeTeam ? (ev.homeTeam.name || "").toLowerCase() : "";
          var an = ev.awayTeam ? (ev.awayTeam.name || "").toLowerCase() : "";
          return hn.indexOf("fonseca") !== -1 || an.indexOf("fonseca") !== -1;
        });
        info.fonsecaCount = fonsecaEvents.length;
        info.fonsecaEvents = fonsecaEvents.slice(0, 5).map(function(ev) {
          return {
            id: ev.id,
            home: ev.homeTeam ? ev.homeTeam.name : null,
            away: ev.awayTeam ? ev.awayTeam.name : null,
            startISO: ev.startTimestamp ? new Date(ev.startTimestamp * 1000).toISOString() : null,
            tournament: ev.tournament ? ev.tournament.name : null,
            status: ev.status ? ev.status.type : null,
            round: ev.roundInfo || ev.round || null,
          };
        });
      } else if (data && data.event) {
        // match/details retorna { event: {...} }
        var ev = data.event;
        info.eventId = ev.id;
        info.eventHome = ev.homeTeam ? ev.homeTeam.name : null;
        info.eventAway = ev.awayTeam ? ev.awayTeam.name : null;
        info.eventStart = ev.startTimestamp ? new Date(ev.startTimestamp * 1000).toISOString() : null;
        info.eventTournament = ev.tournament ? ev.tournament.name : null;
        info.eventStatus = ev.status ? ev.status.type : null;
        info.eventRound = ev.roundInfo || ev.round || null;
      } else {
        info.bodyStart = text.substring(0, 300);
      }
    } catch (e) {
      info.parseError = e.message.substring(0, 100);
      info.bodyStart = text.substring(0, 300);
    }
    return info;
  } catch (e) {
    clearTimeout(to);
    return { label: label, path: path, error: e.name + ": " + e.message };
  }
}

export default async function handler(req, res) {
  // Datas chave: Roma comeca 06/05, Joao deve jogar 06-08/05
  var tests = [
    // 1. match/list pra cada dia que pode ter Joao em Roma
    { label: "matchlist_2026-05-06", path: "/v1/match/list?sport_slug=tennis&date=2026-05-06" },
    { label: "matchlist_2026-05-07", path: "/v1/match/list?sport_slug=tennis&date=2026-05-07" },
    { label: "matchlist_2026-05-08", path: "/v1/match/list?sport_slug=tennis&date=2026-05-08" },
    { label: "matchlist_2026-05-09", path: "/v1/match/list?sport_slug=tennis&date=2026-05-09" },

    // 2. match/details com ID que VI nas memorias (Roma R64P19 16098942)
    { label: "matchdetails_16098942", path: "/v1/match/details?match_id=16098942" },

    // 3. Tentativas de descoberta de endpoints alternativos do proxy
    { label: "tournaments", path: "/v1/tournament/2473" },          // Roma uniqueTournament guess
    { label: "tournament_seasons", path: "/v1/unique-tournament/2473/seasons" },
    { label: "team_search", path: "/v1/team/search?name=fonseca" },
    { label: "events_team", path: "/v1/events/team/403869" },
    { label: "players_search", path: "/v1/players/search?name=fonseca" },
  ];

  var results = await Promise.all(tests.map(function(t) {
    return tryProxy(t.label, t.path);
  }));

  res.status(200).json({
    timestamp: new Date().toISOString(),
    tests: results,
  });
}
