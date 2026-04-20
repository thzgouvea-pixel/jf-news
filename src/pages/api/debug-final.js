// Teste final: confirma que o scraping do sofascore.com funciona + match/details funciona com ID 16012160
// URL: https://fonsecanews.com.br/api/debug-final

export default async function handler(req, res) {
  var key = process.env.RAPIDAPI_KEY;
  if (!key) return res.status(500).json({ error: "RAPIDAPI_KEY missing" });

  var results = {};

  // TESTE 1: Scraping da pagina publica do Fonseca no sofascore.com
  try {
    var r1 = await fetch("https://www.sofascore.com/tennis/player/fonseca-joao/403869", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
      },
    });
    var html = await r1.text();
    
    // Procura match_id via regex
    var idMatches = html.match(/#id:(\d+)/g) || [];
    var urlMatches = html.match(/\/tennis\/match\/[a-z0-9-]+\/[a-zA-Z0-9]+/g) || [];
    
    results.scrape = {
      status: r1.status,
      html_length: html.length,
      has_fonseca: html.indexOf("Fonseca") >= 0 || html.indexOf("fonseca") >= 0,
      has_madrid: html.toLowerCase().indexOf("madrid") >= 0,
      match_ids_found: idMatches.slice(0, 5),
      match_urls_found: urlMatches.slice(0, 5),
      next_match_context: html.indexOf("next match") >= 0 ? html.substring(html.indexOf("next match") - 100, html.indexOf("next match") + 500) : null,
    };
  } catch (e) {
    results.scrape = { error: e.message };
  }

  // TESTE 2: /v1/match/details com ID 16012160 (jogo do Fonseca em Madrid)
  try {
    var r2 = await fetch("https://sofascore6.p.rapidapi.com/api/sofascore/v1/match/details?match_id=16012160", {
      headers: {
        "x-rapidapi-host": "sofascore6.p.rapidapi.com",
        "x-rapidapi-key": key,
      },
    });
    var body2;
    try { body2 = await r2.json(); } catch (e) { body2 = await r2.text(); }
    results.match_details = {
      status: r2.status,
      body: body2,
    };
  } catch (e) {
    results.match_details = { error: e.message };
  }

  res.status(200).json(results);
}
