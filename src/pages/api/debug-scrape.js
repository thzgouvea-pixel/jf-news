// ===== FONSECA NEWS — DEBUG SCRAPE v6 =====
// Chamadas SEQUENCIAIS com timeout 12s. Foca nos endpoints que ja sabemos existir.

async function tryProxy(label, path, timeoutMs) {
  var rkey = process.env.RAPIDAPI_KEY;
  var url = "https://sofascore6.p.rapidapi.com/api/sofascore" + path;
  var ctrl = new AbortController();
  var to = setTimeout(function() { ctrl.abort(); }, timeoutMs || 12000);
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
      var events = (data && data.events) || (Array.isArray(data) ? data : null);
      if (events && Array.isArray(events)) {
        info.eventsCount = events.length;
        var fonsecaEvents = events.filter(function(ev) {
          if (!ev) return false;
          var hn = ev.homeTeam ? (ev.homeTeam.name || "").toLowerCase() : "";
          var an = ev.awayTeam ? (ev.awayTeam.name || "").toLowerCase() : "";
          var slug = (ev.slug || "").toLowerCase();
          return hn.indexOf("fonseca") !== -1 || an.indexOf("fonseca") !== -1 || slug.indexOf("fonseca") !== -1;
        });
        info.fonsecaCount = fonsecaEvents.length;
        info.fonsecaEvents = fonsecaEvents.slice(0, 5).map(function(ev) {
          return {
            id: ev.id,
            slug: ev.slug,
            home: ev.homeTeam ? ev.homeTeam.name : null,
            away: ev.awayTeam ? ev.awayTeam.name : null,
            startISO: ev.startTimestamp ? new Date(ev.startTimestamp * 1000).toISOString() : null,
            tournament: ev.tournament ? ev.tournament.name : null,
            uniqueTournamentName: ev.tournament && ev.tournament.uniqueTournament ? ev.tournament.uniqueTournament.name : null,
            status: ev.status ? ev.status.type : null,
            round: ev.roundInfo ? ev.roundInfo.name : (ev.round ? (ev.round.name || ev.round) : null),
          };
        });
        // Tambem tenta achar matches em Roma/Italian Open mesmo sem nome Fonseca (placeholder R64P19)
        var romaEvents = events.filter(function(ev) {
          if (!ev || !ev.tournament) return false;
          var tn = (ev.tournament.name || "").toLowerCase();
          var utn = ev.tournament.uniqueTournament ? (ev.tournament.uniqueTournament.name || "").toLowerCase() : "";
          return tn.indexOf("rome") !== -1 || tn.indexOf("italian") !== -1 || utn.indexOf("rome") !== -1 || utn.indexOf("italian") !== -1;
        });
        info.romaCount = romaEvents.length;
        info.romaSample = romaEvents.slice(0, 3).map(function(ev) {
          return {
            id: ev.id,
            home: ev.homeTeam ? ev.homeTeam.name : null,
            away: ev.awayTeam ? ev.awayTeam.name : null,
            startISO: ev.startTimestamp ? new Date(ev.startTimestamp * 1000).toISOString() : null,
            tournament: ev.tournament ? ev.tournament.name : null,
            round: ev.roundInfo ? ev.roundInfo.name : null,
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
          round: ev.roundInfo ? ev.roundInfo.name : (ev.round ? (ev.round.name || ev.round) : null),
        };
      } else {
        info.parsedKeys = Object.keys(data || {}).slice(0, 8);
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
  // SEQUENCIAL com timeout maior
  var results = [];

  // 1. match/details com ID conhecido (Roma R64P19)
  results.push(await tryProxy("matchdetails_16098942", "/v1/match/details?match_id=16098942", 15000));

  // 2. match/list pra 08/05 (jogo de Roma esperado)
  results.push(await tryProxy("matchlist_2026-05-08", "/v1/match/list?sport_slug=tennis&date=2026-05-08", 15000));

  // 3. match/list pra 06/05 (start Roma)
  results.push(await tryProxy("matchlist_2026-05-06", "/v1/match/list?sport_slug=tennis&date=2026-05-06", 15000));

  // 4. match/list pra hoje (controle - sabemos que funciona)
  results.push(await tryProxy("matchlist_today", "/v1/match/list?sport_slug=tennis&date=2026-05-04", 15000));

  res.status(200).json({
    timestamp: new Date().toISOString(),
    tests: results,
  });
}
