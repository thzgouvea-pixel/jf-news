export default async function handler(req, res) {
  var id = req.query.id;
  if (!id) return res.status(400).send("Missing id");
  if (!/^\d{1,10}$/.test(id)) return res.status(400).send("Invalid id format");

  var sources = [
    "https://img.sofascore.com/api/v1/team/" + id + "/image",
    "https://api.sofascore.app/api/v1/team/" + id + "/image",
    "https://api.sofascore.app/api/v1/player/" + id + "/image",
  ];

  for (var i = 0; i < sources.length; i++) {
    try {
      var r = await fetch(sources[i], {
        headers: { "User-Agent": "Mozilla/5.0 FonsecaNewsBot/1.0" }
      });
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
  return res.status(404).send("Not found");
}
