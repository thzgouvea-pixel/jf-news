// ===== API: Unified Stats (single request for everything) =====
import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=60");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    // Get poll date (Brasilia time)
    var now = new Date();
    var brasilia = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    var today = brasilia.toISOString().split("T")[0];

    // Fetch all data in parallel
    var [visitors, feedback, poll, likeKeys] = await Promise.all([
      kv.get("visitors:total").catch(function() { return 0; }),
      kv.get("site:feedback").catch(function() { return { up: 0, down: 0 }; }),
      kv.get("poll:" + today).catch(function() { return { a: 0, b: 0, total: 0 }; }),
      (async function() {
        var keys = [];
        var cursor = 0;
        do {
          var [newCursor, foundKeys] = await kv.scan(cursor, { match: "likes:*", count: 100 });
          cursor = newCursor;
          keys.push(...foundKeys);
        } while (cursor !== 0);
        return keys;
      })().catch(function() { return []; })
    ]);

    // Fetch all like values in one batch
    var likes = {};
    if (likeKeys.length > 0) {
      var values = await kv.mget(...likeKeys);
      likeKeys.forEach(function(key, i) {
        var id = key.replace("likes:", "");
        likes[id] = values[i] || { likes: 0, dislikes: 0 };
      });
    }

    return res.status(200).json({
      visitors: visitors || 0,
      feedback: feedback || { up: 0, down: 0 },
      poll: poll || { a: 0, b: 0, total: 0 },
      likes: likes
    });
  } catch (error) {
    console.error("[stats] Error:", error);
    return res.status(200).json({
      visitors: 0,
      feedback: { up: 0, down: 0 },
      poll: { a: 0, b: 0, total: 0 },
      likes: {}
    });
  }
}
