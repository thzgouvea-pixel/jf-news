// Proxy de foto de jogador. Busca SOMENTE por identificador exato (id numerico
// do SofaScore) — nunca por nome. Buscar por nome era um chute que retornava a
// PESSOA ERRADA (sobrenomes comuns no Wikipedia); mostrar a cara errada e pior
// do que nao mostrar nada.
//
// O Cloudflare do SofaScore bloqueia o egress da Vercel por IP. Tentamos:
//   1) SofaScore direto (caso o IP nao esteja bloqueado);
//   2) proxies publicos de imagem (wsrv.nl / images.weserv.nl), que buscam a
//      partir do servidor DELES — IP diferente. Note o prefixo "ssl:" exigido
//      por esses proxies pra upstream https.
// Tudo chaveado pelo id -> e sempre AQUELE jogador ou 404 (cai pra inicial).

var BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
  "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
  "Referer": "https://www.sofascore.com/",
};

// Detecta imagem por magic number (mais confiavel que content-type, que vem
// inconsistente dos proxies; tambem rejeita paginas de erro HTML/JSON).
function sniffImage(bytes) {
  if (!bytes || bytes.length < 12) return null;
  var b = bytes;
  if (b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF) return "image/jpeg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47) return "image/png";
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return "image/gif";
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
      b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return "image/webp";
  return null;
}

async function tryFetchImage(label, url, headers) {
  try {
    var r = await fetch(url, headers ? { headers: headers } : undefined);
    if (!r.ok) { console.log("[player-image] " + label + " -> HTTP " + r.status); return null; }
    var buf = await r.arrayBuffer();
    var bytes = new Uint8Array(buf);
    var type = sniffImage(bytes);
    if (!type || buf.byteLength < 1000) {
      console.log("[player-image] " + label + " -> not-an-image (ct=" + (r.headers.get("content-type") || "?") + ", bytes=" + buf.byteLength + ")");
      return null;
    }
    console.log("[player-image] " + label + " -> OK " + type + " (" + buf.byteLength + " bytes)");
    return { contentType: type, buffer: buf };
  } catch (e) {
    console.log("[player-image] " + label + " -> error " + e.message);
    return null;
  }
}

async function fetchPlayerImage(id) {
  var sofaSsl = "ssl:img.sofascore.com/api/v1/team/" + id + "/image";
  var attempts = [
    ["sofa-direct-img", "https://img.sofascore.com/api/v1/team/" + id + "/image", BROWSER_HEADERS],
    ["sofa-direct-app", "https://api.sofascore.app/api/v1/team/" + id + "/image", BROWSER_HEADERS],
    ["wsrv-ssl", "https://wsrv.nl/?url=" + encodeURIComponent(sofaSsl), null],
    ["weserv-ssl", "https://images.weserv.nl/?url=" + encodeURIComponent(sofaSsl), null],
    ["wsrv-plain", "https://wsrv.nl/?url=" + encodeURIComponent("img.sofascore.com/api/v1/team/" + id + "/image"), null],
  ];
  for (var i = 0; i < attempts.length; i++) {
    var got = await tryFetchImage(attempts[i][0], attempts[i][1], attempts[i][2]);
    if (got) return got;
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
