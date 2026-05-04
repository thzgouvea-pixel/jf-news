// ===== FONSECA NEWS — DEBUG SCRAPE =====
// Endpoint de diagnostico: testa NIVEL 1 (API publica) e NIVEL 2/3 (HTML scrape)
// e retorna JSON detalhado pra revelar exatamente onde o fluxo trava.
// NAO escreve nada em KV. Pode ser chamado quantas vezes precisar.

export default async function handler(req, res) {
  var result = {
    timestamp: new Date().toISOString(),
    level1_api: null,
    level2_html: null,
  };

  // ===== NIVEL 1: API publica oficial =====
  try {
    var t0 = Date.now();
    var ctrl = new AbortController();
    var to = setTimeout(function() { ctrl.abort(); }, 8000);
    var r = await fetch("https://api.sofascore.com/api/v1/team/403869/events/next/0", {
      signal: ctrl.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        "Accept": "application/json",
      },
    });
    clearTimeout(to);
    var elapsed = Date.now() - t0;
    var info = {
      status: r.status,
      ok: r.ok,
      elapsedMs: elapsed,
      headers: {},
      body: null,
      bodyTextSample: null,
      eventsCount: null,
      firstEvents: [],
    };
    var hdrs = ["content-type", "cf-ray", "cf-cache-status", "server", "x-content-type-options"];
    hdrs.forEach(function(h) { info.headers[h] = r.headers.get(h); });

    var text = await r.text();
    info.bodyTextSample = text.substring(0, 600);
    try {
      var data = JSON.parse(text);
      info.body = "json_parsed";
      var events = (data && data.events) || [];
      info.eventsCount = events.length;
      info.firstEvents = events.slice(0, 3).map(function(ev) {
        return {
          id: ev.id,
          home: ev.homeTeam ? { name: ev.homeTeam.name, id: ev.homeTeam.id, slug: ev.homeTeam.slug, sport: ev.homeTeam.sport ? ev.homeTeam.sport.slug : null, type: ev.homeTeam.type } : null,
          away: ev.awayTeam ? { name: ev.awayTeam.name, id: ev.awayTeam.id, slug: ev.awayTeam.slug, sport: ev.awayTeam.sport ? ev.awayTeam.sport.slug : null, type: ev.awayTeam.type } : null,
          startTimestamp: ev.startTimestamp,
          startTimeISO: ev.startTimestamp ? new Date(ev.startTimestamp * 1000).toISOString() : null,
          tournament: ev.tournament ? { name: ev.tournament.name, slug: ev.tournament.slug, uniqueId: ev.tournament.uniqueTournament ? ev.tournament.uniqueTournament.id : null } : null,
          status: ev.status ? { type: ev.status.type, code: ev.status.code, description: ev.status.description } : null,
          round: ev.roundInfo || ev.round || null,
        };
      });
    } catch (eParse) {
      info.body = "parse_error: " + eParse.message;
    }
    result.level1_api = info;
  } catch (e) {
    result.level1_api = { error: e.name + ": " + e.message };
  }

  // ===== NIVEL 2: HTML scrape =====
  try {
    var t1 = Date.now();
    var ctrl2 = new AbortController();
    var to2 = setTimeout(function() { ctrl2.abort(); }, 12000);
    var r2 = await fetch("https://www.sofascore.com/tennis/player/fonseca-joao/403869", {
      signal: ctrl2.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        "Accept": "text/html",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    clearTimeout(to2);
    var elapsed2 = Date.now() - t1;
    var info2 = {
      status: r2.status,
      ok: r2.ok,
      elapsedMs: elapsed2,
      headers: {},
      htmlLength: 0,
      htmlStart: null,
      anchorMatches: {},
      idMatches: [],
    };
    var hdrs2 = ["content-type", "cf-ray", "cf-cache-status", "server", "content-length", "content-encoding"];
    hdrs2.forEach(function(h) { info2.headers[h] = r2.headers.get(h); });
    var html = await r2.text();
    info2.htmlLength = html.length;
    info2.htmlStart = html.substring(0, 400);
    var anchors = ["next match", "Next match", "Next Match", "proxima partida", "próxima partida", "Próxima partida", "proximo jogo", "próximo jogo", "Upcoming", "Roma", "Italian Open", "16098942"];
    anchors.forEach(function(a) {
      var idx = html.indexOf(a);
      if (idx >= 0) info2.anchorMatches[a] = idx;
    });
    var allIds = html.match(/#id:(\d+)/g);
    if (allIds) info2.idMatches = allIds.slice(0, 10);

    result.level2_html = info2;
  } catch (e) {
    result.level2_html = { error: e.name + ": " + e.message };
  }

  res.status(200).json(result);
}
