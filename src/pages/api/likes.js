// ===== API: Likes & Dislikes v2 =====
// OPTIMIZATION: On write, updates both the individual key AND "likes:all" index.
// This way likes-all.js does 1 read instead of scan+mget.

import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    var id = req.query.id;
    var action = req.query.action;

    if (!id) {
      return res.status(400).json({ error: "Missing id parameter" });
    }

    var key = "likes:" + id;

    if (req.method === "GET") {
      res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");
      var data = await kv.get(key);
      return res.status(200).json(data || { likes: 0, dislikes: 0 });
    }

    if (req.method === "POST") {
      if (!action || (action !== "like" && action !== "dislike")) {
        return res.status(400).json({ error: "action must be 'like' or 'dislike'" });
      }

      var current = (await kv.get(key)) || { likes: 0, dislikes: 0 };
      if (action === "like") current.likes += 1;
      else current.dislikes += 1;

      // Save individual key
      await kv.set(key, current);

      // Also update the "likes:all" index so likes-all.js doesn't need to scan
      try {
        var allLikes = (await kv.get("likes:all")) || {};
        allLikes[id] = current;
        await kv.set("likes:all", allLikes);
      } catch (e) {
        console.error("[likes] Index update error:", e.message);
      }

      return res.status(200).json(current);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("[likes] Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
