// ===== API: Daily Poll v2 =====
// OPTIMIZATION: s-maxage=60 on GET (1 min edge cache)

import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    var now = new Date();
    var brasilia = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    var today = brasilia.toISOString().split("T")[0];
    var key = "poll:" + today;

    if (req.method === "GET") {
      res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");
      var data = await kv.get(key);
      return res.status(200).json(data || { a: 0, b: 0, total: 0 });
    }

    if (req.method === "POST") {
      var vote = req.query.vote;
      if (!vote || (vote !== "a" && vote !== "b")) {
        return res.status(400).json({ error: "vote must be 'a' or 'b'" });
      }
      var current = (await kv.get(key)) || { a: 0, b: 0, total: 0 };
      if (vote === "a") current.a += 1;
      else current.b += 1;
      current.total = current.a + current.b;
      await kv.set(key, current);
      return res.status(200).json(current);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("[poll] Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
