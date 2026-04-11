// ===== API: Feedback v3 =====
// OPTIMIZATION: Uses "feedback:all" index instead of kv.keys() scan.
// GET list reads a single key. POST appends to the index.

import { kv } from "@vercel/kv";

var FEEDBACK_INDEX_KEY = "feedback:all";
var MAX_FEEDBACKS = 200;

export default async function handler(req, res) {
  if (req.method === "GET" && req.query.list === "1") {
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    try {
      var raw = await kv.get(FEEDBACK_INDEX_KEY);
      var feedbacks = raw ? (typeof raw === "string" ? JSON.parse(raw) : raw) : [];
      if (!Array.isArray(feedbacks)) feedbacks = [];
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

    // Validate rating is a number between 1 and 5
    if (rating !== null) {
      rating = Number(rating);
      if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
        rating = null;
      } else {
        rating = Math.round(rating);
      }
    }

    if (!message || message.length < 3) return res.status(400).json({ error: "Mensagem muito curta" });
    if (message.length > 2000) return res.status(400).json({ error: "Mensagem muito longa (max 2000)" });

    var feedbackId = "feedback:" + Date.now() + "_" + Math.random().toString(36).substring(2, 6);
    var feedbackData = {
      id: feedbackId,
      name: name.substring(0, 100),
      message: message.substring(0, 2000),
      rating: rating,
      timestamp: Date.now(),
      date: new Date().toISOString(),
    };

    // Update the index (single key read + write instead of kv.keys() scan).
    // Note: low-traffic fan site — occasional concurrent writes may lose one entry,
    // which is acceptable given the significant cost saving over the kv.keys() scan.
    var existing = await kv.get(FEEDBACK_INDEX_KEY);
    var feedbacks = existing ? (typeof existing === "string" ? JSON.parse(existing) : existing) : [];
    if (!Array.isArray(feedbacks)) feedbacks = [];
    feedbacks.push(feedbackData);
    // Keep only the most recent MAX_FEEDBACKS entries
    if (feedbacks.length > MAX_FEEDBACKS) {
      feedbacks.sort(function(a, b) { return (b.timestamp || 0) - (a.timestamp || 0); });
      feedbacks = feedbacks.slice(0, MAX_FEEDBACKS);
    }
    await kv.set(FEEDBACK_INDEX_KEY, feedbacks, { ex: 60 * 60 * 24 * 90 });
    await kv.incr("feedback_count");

    return res.status(200).json({ success: true, message: "Feedback enviado!" });
  } catch (e) {
    console.error("[feedback] Error:", e);
    return res.status(500).json({ error: "Erro ao salvar feedback" });
  }
}
