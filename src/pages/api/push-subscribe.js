// src/pages/api/push-subscribe.js
// Salva PushSubscription (do Web Push API nativo) no Vercel KV
// POST body: { subscription: { endpoint, keys: { p256dh, auth } } }
// GET: retorna contagem de inscritos
//
// Migrou de FCM tokens para subscription objects nativos (sem Firebase)

import { kv } from "@vercel/kv";

function isValidSubscription(s) {
  if (!s || typeof s !== "object") return false;
  if (typeof s.endpoint !== "string" || s.endpoint.length < 20 || s.endpoint.length > 1000) return false;
  if (!s.endpoint.startsWith("https://")) return false;
  if (!s.keys || typeof s.keys !== "object") return false;
  if (typeof s.keys.p256dh !== "string" || s.keys.p256dh.length < 20) return false;
  if (typeof s.keys.auth !== "string" || s.keys.auth.length < 10) return false;
  return true;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    if (req.method === "POST") {
      var body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      var subscription = body.subscription;

      if (!isValidSubscription(subscription)) {
        return res.status(400).json({ error: "Invalid subscription object" });
      }

      // Carrega lista atual (nome de chave MUDOU para push:subs, formato diferente)
      var subs = (await kv.get("push:subs")) || [];

      // Dedupe por endpoint (se mesmo usuario re-inscreve, substitui)
      var alreadyExists = false;
      for (var i = 0; i < subs.length; i++) {
        if (subs[i].endpoint === subscription.endpoint) {
          subs[i] = subscription;
          alreadyExists = true;
          break;
        }
      }
      if (!alreadyExists) subs.push(subscription);

      await kv.set("push:subs", subs);

      return res.status(200).json({
        success: true,
        message: alreadyExists ? "Atualizado" : "Inscrito",
        count: subs.length
      });
    }

    if (req.method === "GET") {
      res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
      var subs = (await kv.get("push:subs")) || [];
      return res.status(200).json({ subscribers: subs.length });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("[push-subscribe] Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
