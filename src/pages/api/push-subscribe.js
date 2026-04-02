// src/pages/api/push-subscribe.js
// Saves FCM device tokens to Vercel KV for push notifications
// POST: { token: "fcm-device-token" } -> saves to KV set "push:tokens"
// GET: returns subscriber count (cached 5 min)

import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    if (req.method === "POST") {
      var body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      var token = body.token;
      if (!token || token.length < 20) {
        return res.status(400).json({ error: "Invalid token" });
      }

      // Get existing tokens
      var tokens = (await kv.get("push:tokens")) || [];
      
      // Don't add duplicates
      if (tokens.includes(token)) {
        return res.status(200).json({ success: true, message: "Already subscribed", count: tokens.length });
      }

      // Add token and save
      tokens.push(token);
      await kv.set("push:tokens", tokens);

      return res.status(200).json({ success: true, message: "Subscribed", count: tokens.length });
    }

    if (req.method === "GET") {
      res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
      var tokens = (await kv.get("push:tokens")) || [];
      return res.status(200).json({ subscribers: tokens.length });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("[push-subscribe] Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
