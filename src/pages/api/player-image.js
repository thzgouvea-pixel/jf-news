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

async function tryWikipedia(name) {
  if (!name) return null;
  // Pega o ultimo "token" do nome ("Y. Hanfmann" -> "Hanfmann"), tira pontos,
  // e busca como "{lastName} tennis" pra desambiguar do mundo non-tenis.
  var lastName = String(name).split(/\s+/).pop().replace(/\./g, "").trim();
  if (!lastName || lastName.length < 3) return null;

  try {
    // ── 1) opensearch pra achar o titulo da pagina ──
    var searchUrl = "https://en.wikipedia.org/w/api.php?action=opensearch&format=json&limit=1&search="
      + encodeURIComponent(lastName + " tennis");
    var sRes = await fetch(searchUrl, { headers: { "User-Agent": WIKI_UA, "Accept": "application/json" } });
    if (!sRes.ok) return null;
    var sData = await sRes.json();
    var title = sData && sData[1] && sData[1][0];
    if (!title) return null;

    // ── 2) page summary pega o thumbnail ──
    var sumUrl = "https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(title);
    var pRes = await fetch(sumUrl, { headers: { "User-Agent": WIKI_UA, "Accept": "application/json" } });
    if (!pRes.ok) return null;
    var pData = await pRes.json();
    var thumb = pData && (pData.thumbnail && pData.thumbnail.source) || (pData.originalimage && pData.originalimage.source);
    if (!thumb) return null;

    // ── 3) baixa a imagem ──
    var iRes = await fetch(thumb, { headers: { "User-Agent": WIKI_UA } });
    if (!iRes.ok) return null;
    var ibuf = await iRes.arrayBuffer();
    if (ibuf.byteLength < 1000) return null;
    return { contentType: iRes.headers.get("content-type") || "image/jpeg", buffer: ibuf };
  } catch (e) {
    console.warn("[player-image/wiki] error: " + e.message);
    return null;
  }
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
