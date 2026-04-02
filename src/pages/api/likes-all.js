// ===== API: All Likes v2 =====
// OPTIMIZATION: s-maxage=300 (5 min edge cache) + no more kv.scan loop
// Instead of scanning all keys every request, we maintain a single "likes:index" key
// that stores all likes data in one object. Updated on write, read once.

import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  // Cache for 5 minutes at edge — crawlers/bots get cached response
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");

  try {
    // Single read instead of scan + mget
    var allLikes = await kv.get("likes:all");
    return res.status(200).json(allLikes || {});
  } catch (error) {
    console.error("[likes-all] Error:", error);
    return res.status(200).json({});
  }
}
