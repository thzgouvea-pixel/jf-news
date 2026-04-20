// Diagnostico: isola onde o problema esta (nosso codigo / proxy sofascore6 / SofaScore real)
// URL: https://fonsecanews.com.br/api/debug-timing
// Chamar 3-5 vezes em horarios diferentes pra ter amostra

export default async function handler(req, res) {
  var key = process.env.RAPIDAPI_KEY;
  if (!key) return res.status(500).json({ error: "RAPIDAPI_KEY missing" });

  var results = [];

  // TESTE 1: Proxy sofascore6 (o que a gente usa) - endpoint match/details
  // Testa 3 vezes consecutivas pra ver se e consistente ou esporadico
  for (var i = 0; i < 3; i++) {
    var t0 = Date.now();
    try {
      var r = await fetch("https://sofascore6.p.rapidapi.com/api/sofascore/v1/match/details?match_id=16012160", {
        headers: { "x-rapidapi-host": "sofascore6.p.rapidapi.com", "x-rapidapi-key": key },
        signal: AbortSignal.timeout(15000),  // 15s: timeout generoso pra investigacao
      });
      var elapsed = Date.now() - t0;
      var body = null;
      try { body = await r.json(); } catch (e) {}
      results.push({
        test: "proxy_matchDetails_" + (i + 1),
        status: r.status,
        elapsed_ms: elapsed,
        has_data: !!(body && body.id),
        body_size_bytes: body ? JSON.stringify(body).length : 0,
      });
    } catch (e) {
      results.push({
        test: "proxy_matchDetails_" + (i + 1),
        error: e.name === "TimeoutError" ? "TIMEOUT_15s" : e.message,
        elapsed_ms: Date.now() - t0,
      });
    }
  }

  // TESTE 2: Proxy sofascore6 - endpoint match/list (o que FUNCIONOU ontem)
  // Se esse funciona e match/details nao, o problema e especifico do endpoint no proxy
  var t1 = Date.now();
  try {
    var r2 = await fetch("https://sofascore6.p.rapidapi.com/api/sofascore/v1/match/list?sport_slug=tennis&date=2026-04-20", {
      headers: { "x-rapidapi-host": "sofascore6.p.rapidapi.com", "x-rapidapi-key": key },
      signal: AbortSignal.timeout(15000),
    });
    var body2 = null;
    try { body2 = await r2.json(); } catch (e) {}
    results.push({
      test: "proxy_matchList",
      status: r2.status,
      elapsed_ms: Date.now() - t1,
      items_count: Array.isArray(body2) ? body2.length : 0,
    });
  } catch (e) {
    results.push({ test: "proxy_matchList", error: e.message, elapsed_ms: Date.now() - t1 });
  }

  // TESTE 3: SofaScore.com direto (pagina publica - ja sabemos que funciona)
  // Se isso for rapido e estavel, sabemos que o SofaScore real nao e o problema
  var t3 = Date.now();
  try {
    var r3 = await fetch("https://www.sofascore.com/tennis/player/fonseca-joao/403869", {
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0" },
      signal: AbortSignal.timeout(15000),
    });
    var html = await r3.text();
    results.push({
      test: "sofascore_direct_scrape",
      status: r3.status,
      elapsed_ms: Date.now() - t3,
      html_size_kb: Math.round(html.length / 1024),
    });
  } catch (e) {
    results.push({ test: "sofascore_direct_scrape", error: e.message, elapsed_ms: Date.now() - t3 });
  }

  // TESTE 4: Ver se existe endpoint PUBLICO do SofaScore pra match/details
  // (alguns sao bloqueados mas vale tentar)
  var t4 = Date.now();
  try {
    var r4 = await fetch("https://api.sofascore.com/api/v1/event/16012160", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0",
        "Accept": "application/json",
        "Referer": "https://www.sofascore.com/",
      },
      signal: AbortSignal.timeout(15000),
    });
    var body4 = null;
    try { body4 = await r4.json(); } catch (e) {}
    results.push({
      test: "sofascore_api_direct",
      status: r4.status,
      elapsed_ms: Date.now() - t4,
      has_event: !!(body4 && body4.event),
      body_size_bytes: body4 ? JSON.stringify(body4).length : 0,
    });
  } catch (e) {
    results.push({ test: "sofascore_api_direct", error: e.message, elapsed_ms: Date.now() - t4 });
  }

  // Analise automatica
  var proxyDetailsTimes = results
    .filter(function (r) { return r.test.indexOf("proxy_matchDetails") === 0 && r.elapsed_ms; })
    .map(function (r) { return r.elapsed_ms; });
  var avgProxyDetails = proxyDetailsTimes.length
    ? Math.round(proxyDetailsTimes.reduce(function (a, b) { return a + b; }, 0) / proxyDetailsTimes.length)
    : null;

  var diagnosis = {
    proxy_matchDetails_avg_ms: avgProxyDetails,
    proxy_matchDetails_all_failed: proxyDetailsTimes.length === 0,
    proxy_matchList_ok: results.find(function(r){return r.test==="proxy_matchList";})?.status === 200,
    sofascore_direct_ok: results.find(function(r){return r.test==="sofascore_direct_scrape";})?.status === 200,
    sofascore_api_ok: results.find(function(r){return r.test==="sofascore_api_direct";})?.status === 200,
  };

  res.status(200).json({
    timestamp: new Date().toISOString(),
    vercel_region: process.env.VERCEL_REGION || "unknown",
    diagnosis: diagnosis,
    results: results,
  });
}
