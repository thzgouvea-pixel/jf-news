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
  if (!safeCompare(req.query.secret, process.env.PUSH_SECRET)) {
    return res.status(401).json({ error: "unauthorized" });
  }
  var keys = (req.query.keys || "").split(",").filter(Boolean);
  if (!keys.length) return res.status(400).json({ error: "keys required" });
  for (var i = 0; i < keys.length; i++) { await kv.del(keys[i]); }
  return res.status(200).json({ ok: true, deleted: keys });
}
