// Proxy de foto de jogador. Tenta SofaScore primeiro (id) e, se cair, Wikipedia
// (busca por nome). Antes era so SofaScore — quando o Cloudflare deles passou
// a bloquear nosso IP, todas as fotos de adversario sumiram. Wikipedia nao tem
// bot-block e cobre qualquer jogador com pagina (ou seja, basicamente o tour
// inteiro).
//
// Aceita query: ?id=NNNN  ou  ?name=NomeDoJogador  ou  ambos.
// Resposta: 200 + bytes da imagem, com cache forte. 404 quando nenhuma fonte
// devolveu nada — ai o cliente cai pra cascata ATP/ESPN.

var WIKI_UA = "FonsecaNewsBot/1.0 (https://fonsecanews.com.br; contato pelo site)";

async function trySofaScore(id) {
  if (!id) return null;
  var sources = [
    "https://img.sofascore.com/api/v1/team/" + id + "/image",
    "https://api.sofascore.app/api/v1/team/" + id + "/image",
    "https://api.sofascore.app/api/v1/player/" + id + "/image",
  ];
  var browserHeaders = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
    "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    "Referer": "https://www.sofascore.com/",
  };
  for (var i = 0; i < sources.length; i++) {
    try {
      var r = await fetch(sources[i], { headers: browserHeaders });
      if (!r.ok) continue;
      var buf = await r.arrayBuffer();
      if (buf.byteLength < 1000) continue;
      return { contentType: r.headers.get("content-type") || "image/png", buffer: buf };
    } catch (e) { /* tenta proxima */ }
  }
  return null;
}

async function wikiSearchTitles(query, limit) {
  var url = "https://en.wikipedia.org/w/api.php?action=opensearch&format=json&limit=" + (limit || 5) +
    "&search=" + encodeURIComponent(query);
  var r = await fetch(url, { headers: { "User-Agent": WIKI_UA, "Accept": "application/json" } });
  if (!r.ok) return [];
  var data = await r.json();
  return (data && Array.isArray(data[1])) ? data[1] : [];
}

async function wikiSummary(title) {
  var url = "https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(title);
  var r = await fetch(url, { headers: { "User-Agent": WIKI_UA, "Accept": "application/json" } });
  if (!r.ok) return null;
  return r.json();
}

async function tryWikipedia(name) {
  if (!name) return null;
  // Pega o ultimo "token" do nome ("Y. Hanfmann" -> "Hanfmann"), tira pontos.
  var tokens = String(name).split(/\s+/).filter(function (t) { return t && !t.endsWith("."); });
  var lastName = (tokens.pop() || "").replace(/\./g, "").trim();
  if (!lastName || lastName.length < 3) return null;
  var fullName = String(name).replace(/\./g, "").trim();

  // Tenta varias buscas: nome completo > sobrenome+tennis > sobrenome. Pra cada
  // resposta, anda pelas TOP-N paginas (nao so a primeira — pode ser disambig).
  // E pra cada pagina, pega o thumbnail SE ela parecer ser de pessoa (type=standard).
  var queries = [];
  if (fullName !== lastName) queries.push(fullName);
  queries.push(lastName + " tennis");
  queries.push(lastName);

  var tried = {};
  for (var qi = 0; qi < queries.length; qi++) {
    var q = queries[qi];
    var titles = [];
    try { titles = await wikiSearchTitles(q, 5); } catch (e) { continue; }
    if (!titles.length) continue;
    for (var ti = 0; ti < titles.length; ti++) {
      var title = titles[ti];
      if (!title || tried[title]) continue;
      tried[title] = 1;
      var sum;
      try { sum = await wikiSummary(title); } catch (e) { continue; }
      if (!sum) continue;
      // Disambiguation nao serve
      if (sum.type === "disambiguation") continue;
      var thumb = (sum.thumbnail && sum.thumbnail.source) || (sum.originalimage && sum.originalimage.source);
      if (!thumb) continue;
      try {
        var iRes = await fetch(thumb, { headers: { "User-Agent": WIKI_UA } });
        if (!iRes.ok) continue;
        var ibuf = await iRes.arrayBuffer();
        if (ibuf.byteLength < 1000) continue;
        console.log("[player-image/wiki] hit: '" + q + "' -> '" + title + "' (" + ibuf.byteLength + " bytes)");
        return { contentType: iRes.headers.get("content-type") || "image/jpeg", buffer: ibuf };
      } catch (e) { continue; }
    }
  }
  console.warn("[player-image/wiki] miss for name='" + name + "' (queries=" + queries.join(" | ") + ")");
  return null;
}

export default async function handler(req, res) {
  var id = req.query.id;
  var name = req.query.name;
  if (!id && !name) return res.status(400).send("Missing id or name");
  if (id && !/^\d{1,10}$/.test(String(id))) return res.status(400).send("Invalid id format");

  // SofaScore primeiro (mais provavel ter foto profissional)
  var img = id ? await trySofaScore(id) : null;
  // Wikipedia como queda (resolve Hanfmann e qualquer outro fora do PLAYER_DB)
  if (!img && name) img = await tryWikipedia(name);

  if (img) {
    res.setHeader("Content-Type", img.contentType);
    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=604800");
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.send(Buffer.from(img.buffer));
  }

  console.warn("[player-image] nenhuma fonte respondeu para id=" + (id || "-") + " name=" + (name || "-"));
  return res.status(404).send("Not found");
}
