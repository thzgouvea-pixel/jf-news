export default async function handler(req, res) {
  var id = req.query.id;
  if (!id) return res.status(400).send("Missing id");
  if (!/^\d{1,10}$/.test(id)) return res.status(400).send("Invalid id format");

  var sources = [
    "https://img.sofascore.com/api/v1/team/" + id + "/image",
    "https://api.sofascore.app/api/v1/team/" + id + "/image",
    "https://api.sofascore.app/api/v1/player/" + id + "/image",
  ];

  // User-Agent de browser real + Referer: o SofaScore comecou a 403 pro UA
  // "FonsecaNewsBot/1.0" (provavel upgrade de bot-block via Cloudflare), o que
  // derrubou todas as fotos dos adversarios na producao. Mesma estrategia do
  // refresh-opponent.js, que segue funcionando.
  var browserHeaders = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
    "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    "Referer": "https://www.sofascore.com/",
  };

  var lastStatus = null;
  for (var i = 0; i < sources.length; i++) {
    try {
      var r = await fetch(sources[i], { headers: browserHeaders });
      lastStatus = r.status;
      if (r.ok) {
        var buf = await r.arrayBuffer();
        if (buf.byteLength < 1000) continue;
        res.setHeader("Content-Type", r.headers.get("content-type") || "image/png");
        res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=604800");
        res.setHeader("Access-Control-Allow-Origin", "*");
        return res.send(Buffer.from(buf));
      }
    } catch (e) {
      console.error("[player-image] Error source " + i + ":", e.message);
    }
  }
  console.warn("[player-image] all sources failed for id=" + id + " (lastStatus=" + lastStatus + ")");
  return res.status(404).send("Not found");
}
