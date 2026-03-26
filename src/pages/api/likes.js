// ===== API: Likes & Dislikes (Vercel KV) =====
import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const { id, action } = req.query;

    if (!id) {
      return res.status(400).json({ error: "Missing id parameter" });
    }

    const key = "likes:" + id;

    if (req.method === "GET") {
      // Get current likes/dislikes for an article
      const data = await kv.get(key);
      return res.status(200).json(data || { likes: 0, dislikes: 0 });
    }

    if (req.method === "POST") {
      if (!action || (action !== "like" && action !== "dislike")) {
        return res.status(400).json({ error: "action must be 'like' or 'dislike'" });
      }

      // Get current data
      const current = (await kv.get(key)) || { likes: 0, dislikes: 0 };

      // Increment
      if (action === "like") {
        current.likes += 1;
      } else {
        current.dislikes += 1;
      }

      // Save
      await kv.set(key, current);

      return res.status(200).json(current);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("[likes] Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
