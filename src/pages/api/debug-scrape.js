// ===== FONSECA NEWS — DEBUG SCRAPE v5 =====
// Prefix CORRETO: /api/sofascore antes de /v1/...
// Testa team/events/next que pode retornar placeholders R64P19.

async function tryProxy(label, path) {
  var rkey = process.env.RAPIDAPI_KEY;
  var url = "https://sofascore6.p.rapidapi.com/api/sofascore" + path;
  var ctrl = new AbortController();
  var to = setTimeout(function() { ctrl.abort(); }, 8000);
  var t0 = Date.now();
  try {
    var r = await fetch(url, {
      signal: ctrl.signal,
      headers: { "x-rapidapi-key": rkey, "x-rapidapi-host": "sofascore6.p.rapidapi.com" }
    });
    clearTimeout(to);
    var elapsed = Date.now() - t0;
    var text = await r.text();
    var info = { label: label, path: path, status: r.status, elapsedMs: elapsed, bodyLength: text.length };
    try {
      var data = JSON.parse(text);
      info.parsedKeys = Object.keys(data || {}).slice(0, 8);
      var events = (data && data.events) || (Array.isArray(data) ? data : null);
      if (events && Array.isArray(events)) {
        info.eventsCount = events.length;
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
            round: ev.roundInfo ? ev.roundInfo.name : (ev.round ? ev.round.name : null),
          };
        });
      } else if (data && data.event) {
        var ev = data.event;
        info.eventDetails = {
          id: ev.id,
          home: ev.homeTeam ? ev.homeTeam.name : null,
          away: ev.awayTeam ? ev.awayTeam.name : null,
          startISO: ev.startTimestamp ? new Date(ev.startTimestamp * 1000).toISOString() : null,
          tournament: ev.tournament ? ev.tournament.name : null,
          status: ev.status ? ev.status.type : null,
          round: ev.roundInfo ? ev.roundInfo.name : (ev.round ? ev.round.name : null),
        };
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
  var tests = [
    // 1. Endpoints que sabemos funcionam (validacao do path)
    { label: "matchlist_today", path: "/v1/match/list?sport_slug=tennis&date=2026-05-04" },

    // 2. team/X/events/next/0 (provavelmente EXISTE com prefix correto)
    { label: "team_next_0", path: "/v1/team/403869/events/next/0" },
    { label: "team_next_1", path: "/v1/team/403869/events/next/1" },
    { label: "team_last_0", path: "/v1/team/403869/events/last/0" },
    { label: "team_info", path: "/v1/team/403869" },

    // 3. match/list pra dias que podem ter Joao em Roma
    { label: "matchlist_2026-05-06", path: "/v1/match/list?sport_slug=tennis&date=2026-05-06" },
    { label: "matchlist_2026-05-07", path: "/v1/match/list?sport_slug=tennis&date=2026-05-07" },
    { label: "matchlist_2026-05-08", path: "/v1/match/list?sport_slug=tennis&date=2026-05-08" },

    // 4. match/details direto com ID das memorias
    { label: "matchdetails_16098942", path: "/v1/match/details?match_id=16098942" },

    // 5. search/all
    { label: "search_fonseca", path: "/v1/search/all?q=fonseca" },
  ];

  var results = await Promise.all(tests.map(function(t) {
    return tryProxy(t.label, t.path);
  }));

  res.status(200).json({
    timestamp: new Date().toISOString(),
    tests: results,
  });
}
