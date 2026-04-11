// pages/api/quiz-count.js — Quiz: contador de participantes via Upstash KV
import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  try {
    var key = "fn:quizCount";

    if (req.method === "POST") {
      var current = await kv.get(key);
      var count = current ? parseInt(current, 10) : 0;
      count++;
      await kv.set(key, count.toString());
      return res.status(200).json({ count: count });
    }

    if (req.method === "GET") {
      res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
      var current = await kv.get(key);
      var count = current ? parseInt(current, 10) : 0;
      return res.status(200).json({ count: count });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
