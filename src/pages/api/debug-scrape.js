// ===== FONSECA NEWS — DEBUG SCRAPE v2 =====
// Adiciona NIVEL 2.5: regex de links com "fonseca" no slug
// Vai retornar APENAS IDs de jogos do Fonseca, nao do dia inteiro.

export default async function handler(req, res) {
  var result = {
    timestamp: new Date().toISOString(),
    level1_api: null,
    level2_html: null,
  };

  // ===== NIVEL 1: API publica (sabemos que da 403) =====
  try {
    var t0 = Date.now();
    var ctrl = new AbortController();
    var to = setTimeout(function() { ctrl.abort(); }, 8000);
    var r = await fetch("https://api.sofascore.com/api/v1/team/403869/events/next/0", {
      signal: ctrl.signal,
      headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" },
    });
    clearTimeout(to);
    result.level1_api = { status: r.status, elapsedMs: Date.now() - t0 };
  } catch (e) {
    result.level1_api = { error: e.name + ": " + e.message };
  }

  // ===== NIVEL 2: HTML scrape com regex melhorada =====
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
    var html = await r2.text();

    var info2 = {
      status: r2.status,
      elapsedMs: elapsed2,
      htmlLength: html.length,
    };

    // STRATEGY A: regex pra links de match com "fonseca" no slug
    // URLs tipicas: /tennis/match/joao-fonseca-rafael-jodar/abc123#id:16012167
    var fonsecaLinkRegex = /\/tennis\/match\/[^"'\s>]*?fonseca[^"'\s>]*?#id[:=](\d+)/gi;
    var fonsecaMatches = [];
    var fmatch;
    var seenIds = {};
    while ((fmatch = fonsecaLinkRegex.exec(html)) !== null && fonsecaMatches.length < 10) {
      var matchId = parseInt(fmatch[1], 10);
      if (!seenIds[matchId]) {
        seenIds[matchId] = true;
        var ctxStart = Math.max(0, fmatch.index - 60);
        var ctxEnd = Math.min(html.length, fmatch.index + 200);
        fonsecaMatches.push({
          id: matchId,
          fullMatch: fmatch[0],
          context: html.substring(ctxStart, ctxEnd),
        });
      }
    }
    info2.fonsecaLinks = fonsecaMatches;

    // STRATEGY B: regex pra qualquer URL com "fonseca" mesmo sem #id
    var allFonsecaUrls = html.match(/\/tennis\/match\/[^"'\s>]*?fonseca[^"'\s>]{0,100}/gi);
    info2.allFonsecaUrlsCount = allFonsecaUrls ? allFonsecaUrls.length : 0;
    info2.firstFonsecaUrls = allFonsecaUrls ? allFonsecaUrls.slice(0, 5) : [];

    // STRATEGY C: contexto ao redor de cada anchor (200 chars depois)
    var anchors = ["next match", "Next match", "Upcoming"];
    var anchorContexts = {};
    anchors.forEach(function(a) {
      var idx = html.indexOf(a);
      if (idx >= 0) anchorContexts[a] = { idx: idx, snippet: html.substring(idx, Math.min(html.length, idx + 600)) };
    });
    info2.anchorContexts = anchorContexts;

    result.level2_html = info2;
  } catch (e) {
    result.level2_html = { error: e.name + ": " + e.message };
  }

  res.status(200).json(result);
}
