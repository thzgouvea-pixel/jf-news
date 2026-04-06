// pages/api/rankings.js — ATP Top 50 rankings via Upstash KV
import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  try {
    var cached = await kv.get("fn:atpRankings");
    if (cached) {
      var data = typeof cached === "string" ? JSON.parse(cached) : cached;
      res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=7200");
      return res.status(200).json(data);
    }
    return res.status(200).json({ rankings: [], updatedAt: null });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
