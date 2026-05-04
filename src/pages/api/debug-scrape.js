// ===== FONSECA NEWS — DEBUG SCRAPE v3 =====
// HTML scrape NAO funciona (HTML nao tem dados de match dinamicos).
// API publica api.sofascore.com bloqueada pra IPs Vercel (Cloudflare 403).
// Aqui testamos VARIOS endpoints do proxy sofascore6 (autenticado, pago)
// e tambem subdomains alternativos da API publica pra achar o que funciona.

async function tryEndpoint(label, url, headers, timeoutMs) {
  var ctrl = new AbortController();
  var to = setTimeout(function() { ctrl.abort(); }, timeoutMs || 6000);
  var t0 = Date.now();
  try {
    var r = await fetch(url, { signal: ctrl.signal, headers: headers });
    clearTimeout(to);
    var elapsed = Date.now() - t0;
    var text = await r.text();
    var info = {
      status: r.status,
      ok: r.ok,
      elapsedMs: elapsed,
      bodyLength: text.length,
      bodyStart: text.substring(0, 250),
    };
    // Tenta parse JSON
    try {
      var data = JSON.parse(text);
      info.parsedKeys = Object.keys(data || {}).slice(0, 10);
      // Procura por eventos
      var events = (data && data.events) || (data && data.results && data.results.events);
      if (Array.isArray(events)) {
        info.eventsCount = events.length;
        info.firstEventSummary = events.slice(0, 3).map(function(ev) {
          return {
            id: ev.id,
            home: ev.homeTeam ? ev.homeTeam.name : null,
            away: ev.awayTeam ? ev.awayTeam.name : null,
            startISO: ev.startTimestamp ? new Date(ev.startTimestamp * 1000).toISOString() : null,
            tournament: ev.tournament ? ev.tournament.name : null,
            status: ev.status ? ev.status.type : null,
          };
        });
      }
      // Search results
      if (data && data.results && Array.isArray(data.results)) {
        info.searchResults = data.results.slice(0, 5).map(function(it) {
          return { type: it.type, entity: it.entity ? { id: it.entity.id, name: it.entity.name, slug: it.entity.slug, sport: it.entity.sport ? it.entity.sport.slug : null } : null };
        });
      }
    } catch (e) {
      info.parseError = e.message.substring(0, 100);
    }
    return { label: label, url: url, ...info };
  } catch (e) {
    clearTimeout(to);
    return { label: label, url: url, error: e.name + ": " + e.message };
  }
}

export default async function handler(req, res) {
  var rkey = process.env.RAPIDAPI_KEY;
  var proxyHeaders = {
    "X-RapidAPI-Key": rkey || "",
    "X-RapidAPI-Host": "sofascore6.p.rapidapi.com",
  };
  var browserHeaders = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
    "Origin": "https://www.sofascore.com",
    "Referer": "https://www.sofascore.com/",
  };

  var tests = [
    // Proxy sofascore6 (autenticado, pago)
    { label: "proxy_team_next_events_0", url: "https://sofascore6.p.rapidapi.com/v1/team/403869/events/next/0", headers: proxyHeaders },
    { label: "proxy_team_next_events_1", url: "https://sofascore6.p.rapidapi.com/v1/team/403869/events/next/1", headers: proxyHeaders },
    { label: "proxy_team_last_events_0", url: "https://sofascore6.p.rapidapi.com/v1/team/403869/events/last/0", headers: proxyHeaders },
    { label: "proxy_team_info", url: "https://sofascore6.p.rapidapi.com/v1/team/403869", headers: proxyHeaders },
    { label: "proxy_team_performance", url: "https://sofascore6.p.rapidapi.com/v1/team/403869/performance", headers: proxyHeaders },
    { label: "proxy_search_fonseca", url: "https://sofascore6.p.rapidapi.com/v1/search/all?q=fonseca", headers: proxyHeaders },
    { label: "proxy_team_404869_search", url: "https://sofascore6.p.rapidapi.com/v1/search/all?q=joao+fonseca", headers: proxyHeaders },

    // API publica alternativa: subdomain do app mobile
    { label: "public_app_team_next", url: "https://api.sofascore.app/api/v1/team/403869/events/next/0", headers: browserHeaders },
    // API publica via www (em vez de api.) — pode nao ter Cloudflare
    { label: "public_www_team_next", url: "https://www.sofascore.com/api/v1/team/403869/events/next/0", headers: browserHeaders },
    // Tentar referer pode passar bot detection
    { label: "public_api_team_next_referer", url: "https://api.sofascore.com/api/v1/team/403869/events/next/0", headers: browserHeaders },
  ];

  var results = await Promise.all(tests.map(function(t) {
    return tryEndpoint(t.label, t.url, t.headers, 6000);
  }));

  res.status(200).json({
    timestamp: new Date().toISOString(),
    rapidapiKeyPresent: !!rkey,
    rapidapiKeyLength: rkey ? rkey.length : 0,
    tests: results,
  });
}
