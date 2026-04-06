export default async function handler(req, res) {
  var id = req.query.id;
  if (!id) return res.status(400).send("Missing id");

  var urls = [
    {
      url: "https://sofascore6.p.rapidapi.com/api/sofascore/v1/team/image?team_id=" + id,
      headers: {
        "x-rapidapi-host": "sofascore6.p.rapidapi.com",
        "x-rapidapi-key": process.env.RAPIDAPI_KEY,
      },
    },
    {
      url: "https://a.espncdn.com/i/headshots/tennis/players/full/" + (req.query.espn || "") + ".png",
      headers: { "User-Agent": "FonsecaNews/9.0" },
    },
  ];

  for (var i = 0; i < urls.length; i++) {
    if (i === 1 && !req.query.espn) continue;
    try {
      var r = await fetch(urls[i].url, { headers: urls[i].headers });
      if (r.ok) {
        var buf = await r.arrayBuffer();
        res.setHeader("Content-Type", r.headers.get("content-type") || "image/png");
        res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
        return res.send(Buffer.from(buf));
      }
    } catch (e) {}
  }

  return res.status(404).send("Not found");
}
