// src/pages/api/feedback.js
// Receives user feedback and stores in Vercel KV
// Thomaz can check via /api/feedback?list=1

import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  // List all feedback (for Thomaz)
  if (req.method === "GET" && req.query.list === "1") {
    try {
      var keys = await kv.keys("feedback:*");
      var feedbacks = [];
      for (var i = 0; i < Math.min(keys.length, 50); i++) {
        var fb = await kv.get(keys[i]);
        if (fb) feedbacks.push(fb);
      }
      feedbacks.sort(function(a, b) { return (b.timestamp || 0) - (a.timestamp || 0); });
      return res.status(200).json({ total: feedbacks.length, feedbacks: feedbacks });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    var body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    var message = (body.message || "").trim();
    var name = (body.name || "Anônimo").trim();
    var rating = body.rating || null;

    if (!message || message.length < 3) {
      return res.status(400).json({ error: "Mensagem muito curta" });
    }

    if (message.length > 2000) {
      return res.status(400).json({ error: "Mensagem muito longa (max 2000)" });
    }

    var feedbackId = "feedback:" + Date.now() + "_" + Math.random().toString(36).substring(2, 6);
    var feedbackData = {
      id: feedbackId,
      name: name.substring(0, 100),
      message: message.substring(0, 2000),
      rating: rating,
      timestamp: Date.now(),
      date: new Date().toISOString(),
    };

    await kv.set(feedbackId, feedbackData, { ex: 60 * 60 * 24 * 90 }); // 90 days

    // Increment feedback counter
    await kv.incr("feedback_count");

    return res.status(200).json({ success: true, message: "Feedback enviado!" });
  } catch (e) {
    console.error("[feedback] Error:", e);
    return res.status(500).json({ error: "Erro ao salvar feedback" });
  }
}
