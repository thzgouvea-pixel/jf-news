// Debug: examina o HTML da pagina do Fonseca pra ver o que da pra extrair
// URL: https://fonsecanews.com.br/api/debug-html

export default async function handler(req, res) {
  try {
    var ctrl = new AbortController();
    var to = setTimeout(function () { ctrl.abort(); }, 10000);

    var r = await fetch("https://www.sofascore.com/tennis/player/fonseca-joao/403869", {
      signal: ctrl.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0",
        "Accept": "text/html",
      },
    });
    clearTimeout(to);

    var html = await r.text();
    var sample = {};

    // 1. Procura por "next match" e mostra o contexto
    var nextIdx = html.indexOf("next match");
    if (nextIdx >= 0) {
      sample.nextMatch_context = html.substring(nextIdx, nextIdx + 500);
    } else {
      sample.nextMatch_context = "NAO ENCONTRADO";
    }

    // 2. Procura tags de structured data (JSON-LD ou similares)
    var jsonLd = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g);
    if (jsonLd) {
      sample.json_ld_count = jsonLd.length;
      sample.json_ld_first_500 = jsonLd[0].substring(0, 500);
    }

    // 3. Procura __NEXT_DATA__ (Next.js apps embedam dados ai)
    var nextData = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (nextData) {
      sample.has_next_data = true;
      sample.next_data_length = nextData[1].length;
      // Tenta achar info do match na data
      var matchKeyIdx = nextData[1].indexOf("16012160");
      if (matchKeyIdx >= 0) {
        sample.match_in_next_data = nextData[1].substring(Math.max(0, matchKeyIdx - 200), matchKeyIdx + 800);
      } else {
        sample.match_in_next_data = "ID 16012160 nao esta no NEXT_DATA";
      }
    } else {
      sample.has_next_data = false;
    }

    // 4. Procura por padroes comuns de match
    var nextEventMatch = html.match(/"nextEvent"\s*:\s*\{[^}]+\}/);
    if (nextEventMatch) {
      sample.next_event_pattern = nextEventMatch[0].substring(0, 500);
    }

    // 5. Tamanho geral
    sample.total_html_size_kb = Math.round(html.length / 1024);

    // 6. Conta ocorrencias
    sample.occurrences = {
      "next match": (html.match(/next match/g) || []).length,
      "16012160": (html.match(/16012160/g) || []).length,
      "Madrid": (html.match(/Madrid/g) || []).length,
      "Cilic": (html.match(/Cilic/g) || []).length,
      "Bergs": (html.match(/Bergs/g) || []).length,
    };

    res.status(200).json(sample);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
