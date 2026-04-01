// ===== DEBUG: Wikipedia HTML inspection =====
export default async function handler(req, res) {
  try {
    var url = "https://en.wikipedia.org/wiki/Jo%C3%A3o_Fonseca_(tennis)";
    var r = await fetch(url, {
      headers: { "User-Agent": "FonsecaNews/5.0 (fan site)", "Accept": "text/html" },
    });
    var html = await r.text();

    // Search for ranking-related text in the HTML
    var patterns = [
      /Current\s+ranking[^<]{0,100}/gi,
      /ranking[^<]{0,60}No\.\s*\d+/gi,
      /No\.\s*\d+[^<]{0,40}ranking/gi,
      /singles_ranking\s*=\s*[^|}{]{0,50}/gi,
      /ranking[^<]{0,30}\d{1,4}/gi,
      /ATP[^<]{0,30}\d{1,4}/gi,
    ];

    var matches = {};
    for (var i = 0; i < patterns.length; i++) {
      var found = html.match(patterns[i]);
      matches["pattern_" + i] = found ? found.slice(0, 5) : null;
    }

    // Also show a chunk around "ranking" in the raw HTML
    var idx = html.toLowerCase().indexOf("current_ranking");
    if (idx === -1) idx = html.toLowerCase().indexOf("singles_ranking");
    if (idx === -1) idx = html.toLowerCase().indexOf("currentranking");
    var snippet = idx >= 0 ? html.substring(idx - 50, idx + 200) : "not found";

    // Try the Wikipedia API instead (returns wikitext which is easier to parse)
    var apiUrl = "https://en.wikipedia.org/w/api.php?action=parse&page=Jo%C3%A3o_Fonseca_(tennis)&prop=wikitext&section=0&format=json";
    var apiRes = await fetch(apiUrl, { headers: { "User-Agent": "FonsecaNews/5.0" } });
    var apiData = apiRes.ok ? await apiRes.json() : null;
    var wikitext = apiData && apiData.parse && apiData.parse.wikitext ? apiData.parse.wikitext["*"] || "" : "";

    // Find ranking in wikitext (format: | current_ranking = No. 38)
    var wikiRankMatch = wikitext.match(/current_ranking\s*=\s*(?:No\.\s*)?(\d{1,4})/i);
    var singlesRankMatch = wikitext.match(/singles_current_ranking\s*=\s*(?:No\.\s*)?(\d{1,4})/i);

    res.status(200).json({
      htmlLength: html.length,
      htmlStatus: r.status,
      regexMatches: matches,
      htmlSnippet: snippet,
      wikitextAvailable: wikitext.length > 0,
      wikitextSnippet: wikitext.substring(0, 1000),
      wikiRankMatch: wikiRankMatch ? wikiRankMatch[1] : null,
      singlesRankMatch: singlesRankMatch ? singlesRankMatch[1] : null,
    });
  } catch (e) {
    res.status(200).json({ error: e.message });
  }
}
