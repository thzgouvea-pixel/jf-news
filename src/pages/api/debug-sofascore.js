export default async function handler(req, res) {
  try {
    var apiUrl = "https://en.wikipedia.org/w/api.php?action=parse&page=Jo%C3%A3o_Fonseca_(tennis)&prop=wikitext&section=0&format=json";
    var r = await fetch(apiUrl, { headers: { "User-Agent": "FonsecaNews/5.0" } });
    var data = await r.json();
    var wikitext = (data && data.parse && data.parse.wikitext) ? (data.parse.wikitext["*"] || "") : "";

    // Find all lines containing "ranking" in the wikitext
    var lines = wikitext.split("\n");
    var rankingLines = lines.filter(function(l) { return l.toLowerCase().includes("ranking"); });

    // Also find prize_money line
    var prizeLines = lines.filter(function(l) { return l.toLowerCase().includes("prize"); });

    res.status(200).json({
      totalLines: lines.length,
      rankingLines: rankingLines,
      prizeLines: prizeLines,
    });
  } catch (e) {
    res.status(200).json({ error: e.message });
  }
}
