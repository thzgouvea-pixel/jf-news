// pages/api/vote.js — Enquete: votos reais via Upstash KV
import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  try {
    // Calculate day of year for poll rotation
    var now = new Date();
    var start = new Date(now.getFullYear(), 0, 0);
    var dayOfYear = Math.floor((now - start) / 86400000);

    if (req.method === "POST") {
      var body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      var option = body.option; // "a" or "b"
      if (option !== "a" && option !== "b") {
        return res.status(400).json({ error: "option must be 'a' or 'b'" });
      }
      var key = "fn:poll:" + dayOfYear;
      var current = await kv.get(key);
      var data = current ? (typeof current === "string" ? JSON.parse(current) : current) : { a: 0, b: 0 };
      data[option] = (data[option] || 0) + 1;
      await kv.set(key, JSON.stringify(data), { ex: 86400 * 30 }); // 30 days expiry
      var total = data.a + data.b;
      return res.status(200).json({
        a: data.a,
        b: data.b,
        total: total,
        pctA: total > 0 ? Math.round((data.a / total) * 100) : 50,
        pctB: total > 0 ? Math.round((data.b / total) * 100) : 50,
      });
    }

    // GET — return current results without voting
    if (req.method === "GET") {
      res.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=300");
      var key = "fn:poll:" + dayOfYear;
      var current = await kv.get(key);
      var data = current ? (typeof current === "string" ? JSON.parse(current) : current) : { a: 0, b: 0 };
      var total = data.a + data.b;
      return res.status(200).json({
        a: data.a,
        b: data.b,
        total: total,
        pctA: total > 0 ? Math.round((data.a / total) * 100) : 50,
        pctB: total > 0 ? Math.round((data.b / total) * 100) : 50,
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
