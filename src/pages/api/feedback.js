// ===== API: Site Feedback (Vercel KV) =====
import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const key = "site:feedback";

    if (req.method === "GET") {
      const data = await kv.get(key);
      return res.status(200).json(data || { up: 0, down: 0 });
    }

    if (req.method === "POST") {
      const { vote } = req.query;
      if (!vote || (vote !== "up" && vote !== "down")) {
        return res.status(400).json({ error: "vote must be 'up' or 'down'" });
      }

      const current = (await kv.get(key)) || { up: 0, down: 0 };
      if (vote === "up") current.up += 1;
      else current.down += 1;

      await kv.set(key, current);
      return res.status(200).json(current);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("[feedback] Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
