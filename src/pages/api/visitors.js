// ===== API: Visitors v2 =====
// OPTIMIZATION: s-maxage=300 on GET (5 min edge cache)

import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    var key = "visitors:total";

    if (req.method === "GET") {
      res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
      var count = (await kv.get(key)) || 0;
      return res.status(200).json({ visitors: count });
    }

    if (req.method === "POST") {
      var count = (await kv.get(key)) || 0;
      var newCount = count + 1;
      await kv.set(key, newCount);
      return res.status(200).json({ visitors: newCount });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("[visitors] Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
