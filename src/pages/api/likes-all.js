// ===== API: All Likes (single request) =====
import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    // Scan all keys starting with "likes:"
    const keys = [];
    let cursor = 0;
    do {
      const [newCursor, foundKeys] = await kv.scan(cursor, { match: "likes:*", count: 100 });
      cursor = newCursor;
      keys.push(...foundKeys);
    } while (cursor !== 0);

    if (keys.length === 0) {
      return res.status(200).json({});
    }

    // Get all values in one batch
    const values = await kv.mget(...keys);
    const result = {};
    keys.forEach(function(key, i) {
      var id = key.replace("likes:", "");
      result[id] = values[i] || { likes: 0, dislikes: 0 };
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("[likes-all] Error:", error);
    return res.status(200).json({});
  }
}
