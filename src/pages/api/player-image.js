// Proxy de foto de jogador. Busca SOMENTE por identificador exato (id numerico
// do SofaScore) — nunca por nome. Buscar por nome era um chute que retornava a
// PESSOA ERRADA (ex.: sobrenomes comuns como Pavlovic/Medjedovic no Wikipedia),
// e mostrar a cara errada e pior do que nao mostrar nada.
//
// Ordem: SofaScore direto -> SofaScore via proxy publico de imagem (wsrv.nl,
// que busca a partir do servidor DELES, contornando o bloqueio de IP que o
// Cloudflare do SofaScore aplica ao egress da Vercel). Tudo chaveado pelo id,
// entao o resultado e SEMPRE aquele jogador ou 404 (cai pra inicial no cliente).
//
// Aceita ?id=NNNN. (?name= e aceito mas IGNORADO — nao chutamos mais por nome.)

var BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
  "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
  "Referer": "https://www.sofascore.com/",
};

function isImage(r) {
  var ct = (r.headers.get("content-type") || "").toLowerCase();
  return ct.indexOf("image/") === 0;
}

async function tryFetchImage(url, headers) {
  try {
    var r = await fetch(url, headers ? { headers: headers } : undefined);
    if (!r.ok || !isImage(r)) return null;
    var buf = await r.arrayBuffer();
    if (buf.byteLength < 1000) return null; // placeholder/erro disfarcado
    return { contentType: r.headers.get("content-type") || "image/png", buffer: buf };
  } catch (e) {
    return null;
  }
}

async function fetchPlayerImage(id) {
  var sofaPath = "img.sofascore.com/api/v1/team/" + id + "/image";
  // 1) SofaScore direto (funciona quando o IP nao esta bloqueado)
  var direct = [
    "https://img.sofascore.com/api/v1/team/" + id + "/image",
    "https://api.sofascore.app/api/v1/team/" + id + "/image",
    "https://api.sofascore.app/api/v1/player/" + id + "/image",
  ];
  for (var i = 0; i < direct.length; i++) {
    var d = await tryFetchImage(direct[i], BROWSER_HEADERS);
    if (d) return d;
  }
  // 2) Proxy publico de imagem (busca do servidor deles -> contorna bloqueio de IP).
  //    Continua sendo a imagem do MESMO id, entao nunca e o jogador errado.
  var proxied = [
    "https://wsrv.nl/?url=" + encodeURIComponent(sofaPath),
    "https://images.weserv.nl/?url=" + encodeURIComponent(sofaPath),
  ];
  for (var j = 0; j < proxied.length; j++) {
    var p = await tryFetchImage(proxied[j], null);
    if (p) return p;
  }
  return null;
}

export default async function handler(req, res) {
  var id = req.query.id;
  if (!id) return res.status(400).send("Missing id");
  if (!/^\d{1,10}$/.test(String(id))) return res.status(400).send("Invalid id format");

  var img = await fetchPlayerImage(id);
  if (img) {
    res.setHeader("Content-Type", img.contentType);
    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=604800");
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.send(Buffer.from(img.buffer));
  }

  console.warn("[player-image] nenhuma fonte respondeu para id=" + id);
  return res.status(404).send("Not found");
}
