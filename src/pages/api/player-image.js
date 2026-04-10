export default async function handler(req, res) {
  var id = req.query.id;
  if (!id) return res.status(400).send("Missing id");

  // Validate id is numeric to prevent SSRF
  if (!/^\d{1,10}$/.test(id)) {
    return res.status(400).send("Invalid id format");
  }

  var sources = [
    "https://api.sofascore.app/api/v1/team/" + id + "/image",
    "https://api.sofascore.app/api/v1/player/" + id + "/image",
  ];

  for (var i = 0; i < sources.length; i++) {
    try {
      var r = await fetch(sources[i]);
      if (r.ok) {
        var buf = await r.arrayBuffer();
        res.setHeader("Content-Type", r.headers.get("content-type") || "image/png");
        res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
        return res.send(Buffer.from(buf));
      }
    } catch (e) {
      console.error("[player-image] Fetch error for source " + i + ":", e.message);
    }
  }

  return res.status(404).send("Not found");
}
