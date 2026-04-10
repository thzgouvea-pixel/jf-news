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
  var secret = req.query.secret || req.headers["x-secret"];
  if (!safeCompare(secret, process.env.PUSH_SECRET)) {
    return res.status(401).json({ error: "unauthorized" });
  }
  try {
    if (req.method === "DELETE" || req.query.action === "clear") {
      await kv.del("fn:nextMatch");
      await kv.del("fn:winProb");
      return res.status(200).json({ ok: true, action: "cleared" });
    }

    if (req.method === "POST" && req.body) {
      var match = req.body;
      await kv.set("fn:nextMatch", JSON.stringify(match), { ex: 86400 * 7 });
      await kv.set("fn:nextMatchManualLock", new Date().toISOString(), { ex: 86400 * 3 });
      return res.status(200).json({ ok: true, match: match });
    }

    // GET: return current nextMatch from KV
    var current = await kv.get("fn:nextMatch");
    return res.status(200).json({ ok: true, current: current ? (typeof current === "string" ? JSON.parse(current) : current) : null });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
