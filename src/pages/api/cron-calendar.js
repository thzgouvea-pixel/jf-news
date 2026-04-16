// ===== FONSECA NEWS — CRON CALENDAR =====
// Fetches João Fonseca's 2026 ATP calendar via Gemini
// Runs weekly via Vercel cron (Monday 6h UTC)
// Also callable manually: /api/cron-calendar?secret=PUSH_SECRET

import { kv } from "@vercel/kv";
import crypto from "crypto";

function safeCompare(a, b) {
  if (!a || !b) return false;
  var bufA = Buffer.from(String(a));
  var bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export default async function handler(req, res) {
  // Cron call (Vercel sends this header automatically)
  var isCron = !!req.headers["x-vercel-cron"];

  // GET without secret → return current calendar
  if (!isCron && !req.query.secret) {
    try {
      var data = await kv.get("fn:atpCalendar");
      if (!data) return res.status(200).json({ calendar: null });
      var parsed = typeof data === "string" ? JSON.parse(data) : data;
      return res.status(200).json(parsed);
    } catch (e) {
      return res.status(200).json({ calendar: null });
    }
  }

  // Manual call → require secret
  if (!isCron) {
    var secret = req.query.secret;
    if (!safeCompare(secret, process.env.PUSH_SECRET)) {
      return res.status(401).json({ error: "Senha errada" });
    }
  }

  // Check freshness — skip if updated less than 5 days ago (cron runs weekly)
  if (isCron) {
    try {
      var existing = await kv.get("fn:atpCalendar");
      if (existing) {
        var ex = typeof existing === "string" ? JSON.parse(existing) : existing;
        if (ex.updatedAt && (Date.now() - new Date(ex.updatedAt).getTime()) < 5 * 86400000) {
          return res.status(200).json({ skip: true, reason: "fresh", updatedAt: ex.updatedAt });
        }
      }
    } catch (e) {}
  }

  // Call Gemini
  var gk = process.env.GEMINI_API_KEY;
  if (!gk) return res.status(500).json({ error: "GEMINI_API_KEY not set" });

  try {
    var r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + gk, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text:
          "Liste TODOS os torneios ATP de tenis que Joao Fonseca jogou ou provavelmente jogara em 2026. " +
          "Inclua Grand Slams, Masters 1000, ATP 500, ATP 250 que ele participou ou tem chance de participar. " +
          "Superficie em portugues: Duro, Saibro ou Grama. " +
          "Responda SOMENTE com JSON array. Nenhum texto antes ou depois, nenhum markdown. " +
          "Formato exato: [{\"name\":\"Australian Open\",\"cat\":\"Grand Slam\",\"surface\":\"Duro\",\"city\":\"Melbourne\",\"country\":\"Australia\",\"start\":\"2026-01-18\",\"end\":\"2026-02-01\"}]"
        }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 4096 }
      })
    });

    if (!r.ok) {
      var errText = await r.text();
      return res.status(500).json({ error: "Gemini HTTP " + r.status, detail: errText.substring(0, 300) });
    }

    var d = await r.json();
    var parts = d.candidates && d.candidates[0] && d.candidates[0].content && d.candidates[0].content.parts;
    if (!parts) {
      return res.status(500).json({ error: "Gemini: no parts", raw: JSON.stringify(d).substring(0, 500) });
    }

    var txt = "";
    parts.forEach(function(p) { if (p.text) txt += p.text; });

    if (!txt) {
      return res.status(500).json({ error: "Gemini: empty text" });
    }

    var cleaned = txt.replace(/```json|```/g, "").trim();
    var arrMatch = cleaned.match(/\[[\s\S]*\]/);
    if (!arrMatch) {
      return res.status(500).json({ error: "No JSON array found", raw: txt.substring(0, 500) });
    }

    var arr = JSON.parse(arrMatch[0]);
    if (!Array.isArray(arr)) {
      return res.status(500).json({ error: "Parsed but not array" });
    }

    var valid = arr.filter(function(t) { return t.name && t.start; });
    if (valid.length < 3) {
      return res.status(500).json({ error: "Too few tournaments: " + valid.length, raw: txt.substring(0, 500) });
    }

    // Add display fields
    var monthNames = ["JAN","FEV","MAR","ABR","MAI","JUN","JUL","AGO","SET","OUT","NOV","DEZ"];
    var mShort = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
    valid.forEach(function(t) {
      var sd = new Date(t.start);
      var ed = t.end ? new Date(t.end) : sd;
      t.month = monthNames[sd.getUTCMonth()] || "";
      t.date = sd.getUTCDate() + " " + mShort[sd.getUTCMonth()] + " - " + ed.getUTCDate() + " " + mShort[ed.getUTCMonth()];
      if (!t.cat) t.cat = "";
      if (!t.surface) t.surface = "";
      if (!t.city) t.city = "";
      if (!t.country) t.country = "";
    });
    valid.sort(function(a, b) { return a.start.localeCompare(b.start); });

    // Save to KV (14 days TTL)
    var payload = { tournaments: valid, updatedAt: new Date().toISOString() };
    await kv.set("fn:atpCalendar", JSON.stringify(payload), { ex: 86400 * 14 });

    return res.status(200).json({
      ok: true,
      count: valid.length,
      tournaments: valid.map(function(t) { return t.name + " (" + t.cat + ") " + t.date; }),
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
