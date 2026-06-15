// Proxy de foto de jogador, servida a partir do NOSSO dominio (o navegador
// carrega de fonsecanews.com.br, entao nao sofre o hotlink-block que derruba
// ATP/ESPN/SofaScore direto no <img> do usuario).
//
// Fonte: Wikipedia. Funciona server-side (nao bloqueia nosso egress) e as
// imagens sao do Wikimedia Commons. MAS so aceitamos a pagina com VERIFICACAO
// ESTRITA — ela precisa ser de um TENISTA com sobrenome (e inicial/nome, quando
// disponivel) batendo. Isso evita o desastre anterior de mostrar a cara errada
// (um futebolista "Pavlovic" qualquer). Se nada passa na verificacao -> 404 ->
// o cliente mostra a inicial. Nunca a pessoa errada.
//
// Query: ?name=Nome%20do%20Jogador  (obrigatorio).  ?debug=1 -> JSON do match.

var WIKI_UA = "FonsecaNewsBot/1.0 (https://fonsecanews.com.br)";

function stripAccents(s) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}
function norm(s) {
  return stripAccents(String(s || "")).toLowerCase().replace(/[^a-z\s]/g, " ").replace(/\s+/g, " ").trim();
}
function sniffImage(b) {
  if (!b || b.length < 12) return null;
  if (b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF) return "image/jpeg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47) return "image/png";
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return "image/gif";
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return "image/webp";
  return null;
}

// Partes do nome pedido. "Y. Hanfmann" -> {surname:"hanfmann", firstInitial:"y", hasFullFirst:false}
function parseName(name) {
  var toks = String(name).trim().split(/\s+/).filter(Boolean);
  if (!toks.length) return null;
  var surname = norm(toks[toks.length - 1]);
  if (!surname || surname.length < 2) return null;
  var first = toks[0];
  var firstNorm = norm(first);
  var hasFullFirst = first.indexOf(".") === -1 && firstNorm.length >= 2;
  var firstInitial = firstNorm.charAt(0);
  return { surname: surname, firstInitial: firstInitial, hasFullFirst: hasFullFirst, firstNorm: firstNorm };
}

var TENNIS_RE = /tennis|tenis|tenista|\batp\b|wta|grand slam|davis cup/i;

// Verifica se o summary do Wikipedia e do TENISTA certo.
function verify(np, summary) {
  if (!summary || summary.type !== "standard") return false;
  var thumb = (summary.thumbnail && summary.thumbnail.source) || (summary.originalimage && summary.originalimage.source);
  if (!thumb) return false;
  var text = (summary.description || "") + " " + (summary.extract || "");
  if (!TENNIS_RE.test(text)) return false; // tem que ser tenista
  var titleToks = norm(summary.title).split(" ").filter(Boolean);
  if (!titleToks.length) return false;
  var titleSurname = titleToks[titleToks.length - 1];
  if (titleSurname !== np.surname) return false; // sobrenome tem que bater
  // Nome/inicial: desambigua irmaos (Cerundolo, Zverev) e homonimos.
  var titleFirst = titleToks[0];
  if (np.hasFullFirst) {
    if (titleFirst !== np.firstNorm) return false;
  } else if (np.firstInitial) {
    if (titleFirst.charAt(0) !== np.firstInitial) return false;
  }
  return true;
}

async function wikiOpenSearch(query) {
  try {
    var url = "https://en.wikipedia.org/w/api.php?action=opensearch&format=json&limit=5&redirects=resolve&search=" + encodeURIComponent(query);
    var r = await fetch(url, { headers: { "User-Agent": WIKI_UA, "Accept": "application/json" } });
    if (!r.ok) return [];
    var d = await r.json();
    return (d && Array.isArray(d[1])) ? d[1] : [];
  } catch (e) { return []; }
}
async function wikiSummary(title) {
  try {
    var url = "https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(title);
    var r = await fetch(url, { headers: { "User-Agent": WIKI_UA, "Accept": "application/json" } });
    if (!r.ok) return null;
    return await r.json();
  } catch (e) { return null; }
}

// Acha a pagina do tenista certo. Retorna {title, thumb, desc} ou null.
async function resolvePage(name) {
  var np = parseName(name);
  if (!np) return null;
  var raw = String(name).replace(/\./g, "").trim();
  var queries = [raw + " tennis", raw, np.surname + " tennis player"];
  var seen = {};
  for (var qi = 0; qi < queries.length; qi++) {
    var titles = await wikiOpenSearch(queries[qi]);
    for (var ti = 0; ti < titles.length; ti++) {
      var title = titles[ti];
      if (!title || seen[title]) continue;
      seen[title] = 1;
      var sum = await wikiSummary(title);
      if (sum && verify(np, sum)) {
        var thumb = (sum.thumbnail && sum.thumbnail.source) || (sum.originalimage && sum.originalimage.source);
        return { title: sum.title, thumb: thumb, desc: sum.description || "" };
      }
    }
  }
  return null;
}

export default async function handler(req, res) {
  var name = req.query.name;
  var debug = req.query.debug;
  if (!name) return res.status(400).send("Missing name");

  var page = await resolvePage(name);

  if (debug) {
    res.setHeader("Content-Type", "application/json");
    return res.status(200).json({ name: name, matched: page ? page.title : null, desc: page ? page.desc : null, thumb: page ? page.thumb : null });
  }

  if (page && page.thumb) {
    try {
      var ir = await fetch(page.thumb, { headers: { "User-Agent": WIKI_UA } });
      if (ir.ok) {
        var buf = await ir.arrayBuffer();
        var type = sniffImage(new Uint8Array(buf));
        if (type && buf.byteLength >= 1000) {
          res.setHeader("Content-Type", type);
          res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=604800");
          res.setHeader("Access-Control-Allow-Origin", "*");
          return res.send(Buffer.from(buf));
        }
      }
    } catch (e) { /* cai pro 404 */ }
  }

  console.warn("[player-image] sem match verificado para name=" + name);
  return res.status(404).send("Not found");
}
