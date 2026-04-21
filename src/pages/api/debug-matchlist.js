// Investigacao focada: matchList esta travando ou nao?
// Testa 3x o mesmo endpoint que o cron usa + varia datas
// URL: https://fonsecanews.com.br/api/debug-matchlist

export default async function handler(req, res) {
  var key = process.env.RAPIDAPI_KEY;
  if (!key) return res.status(500).json({ error: "RAPIDAPI_KEY missing" });

  async function testCall(path, timeoutMs) {
    var t0 = Date.now();
    try {
      var r = await fetch("https://sofascore6.p.rapidapi.com/api/sofascore" + path, {
        headers: { "x-rapidapi-host": "sofascore6.p.rapidapi.com", "x-rapidapi-key": key },
        signal: AbortSignal.timeout(timeoutMs || 20000),
      });
      var elapsed = Date.now() - t0;
      var body = null;
      try { body = await r.json(); } catch (e) {}
      return {
        path: path,
        status: r.status,
        elapsed_ms: elapsed,
        items: Array.isArray(body) ? body.length : (body && Array.isArray(body.events) ? body.events.length : 0),
        ok: r.status === 200,
      };
    } catch (e) {
      return {
        path: path,
        error: e.name === "TimeoutError" ? "TIMEOUT_" + timeoutMs + "ms" : e.message,
        elapsed_ms: Date.now() - t0,
      };
    }
  }

  var results = [];

  // TESTE 1: matchList pra hoje, 3 vezes consecutivas (timeout 20s)
  for (var i = 0; i < 3; i++) {
    var r = await testCall("/v1/match/list?sport_slug=tennis&date=2026-04-21", 20000);
    r.test = "matchList_today_" + (i + 1);
    results.push(r);
  }

  // TESTE 2: matchList pra varias datas (1 vez cada)
  var datesToTest = ["2026-04-20", "2026-04-22", "2026-04-23", "2026-04-24"];
  for (var j = 0; j < datesToTest.length; j++) {
    var r2 = await testCall("/v1/match/list?sport_slug=tennis&date=" + datesToTest[j], 20000);
    r2.test = "matchList_" + datesToTest[j];
    results.push(r2);
  }

  // TESTE 3: matchList com timeout curto (8s, igual cron atual) pra ver se reproduz o timeout
  var rShort = await testCall("/v1/match/list?sport_slug=tennis&date=2026-04-21", 8000);
  rShort.test = "matchList_8s_timeout";
  results.push(rShort);

  // TESTE 4: match/details pra comparar (controle - sabemos que funciona)
  var rCtrl = await testCall("/v1/match/details?match_id=16012160", 20000);
  rCtrl.test = "match_details_control";
  results.push(rCtrl);

  // Analise
  var matchListTimes = results
    .filter(function (r) { return r.test.indexOf("matchList_today") === 0 && r.elapsed_ms; })
    .map(function (r) { return r.elapsed_ms; });
  var avg = matchListTimes.length
    ? Math.round(matchListTimes.reduce(function (a, b) { return a + b; }, 0) / matchListTimes.length)
    : 0;
  var failed = results.filter(function (r) { return r.error; }).length;

  res.status(200).json({
    timestamp: new Date().toISOString(),
    region: process.env.VERCEL_REGION || "unknown",
    summary: {
      total_tests: results.length,
      failures: failed,
      matchList_today_avg_ms: avg,
      conclusion:
        failed >= 5 ? "PROXY DEGRADADO - considerar alternativas" :
        avg > 5000 ? "LENTO MAS FUNCIONANDO - aumentar timeouts" :
        "OK - foi pico momentaneo",
    },
    results: results,
  });
}
