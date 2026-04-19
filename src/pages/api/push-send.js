// src/pages/api/push-send.js
// Envia push notifications para todos os inscritos via Web Push nativo
// Uses: web-push library (protocolo oficial, zero Firebase)
//
// POST body: { title, body, url?, tag? }
// Auth: header "x-push-secret" com PUSH_SECRET (ou query ?secret=)
//
// Chamado por: cron-update.js quando detecta eventos (novo adversario, ranking, ao vivo, resultado)

import { kv } from "@vercel/kv";
import crypto from "crypto";
import webpush from "web-push";

function safeCompare(a, b) {
  if (!a || !b) return false;
  var bufA = Buffer.from(String(a));
  var bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// Configura web-push com as chaves VAPID (uma vez por cold start)
var vapidConfigured = false;
function configureVapid() {
  if (vapidConfigured) return true;
  var pub = process.env.VAPID_PUBLIC_KEY;
  var priv = process.env.VAPID_PRIVATE_KEY;
  var subject = process.env.VAPID_SUBJECT || "mailto:thzgouvea@gmail.com";
  if (!pub || !priv) {
    console.error("[push-send] VAPID keys not configured in env");
    return false;
  }
  try {
    webpush.setVapidDetails(subject, pub, priv);
    vapidConfigured = true;
    return true;
  } catch (e) {
    console.error("[push-send] VAPID config error:", e.message);
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Cache-Control", "s-maxage=300");
    return res.status(405).json({ error: "POST only" });
  }

  // Auth
  var secret = req.headers["x-push-secret"] || req.query.secret;
  if (!safeCompare(secret, process.env.PUSH_SECRET)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!configureVapid()) {
    return res.status(500).json({ error: "VAPID not configured" });
  }

  try {
    var body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    var title = String(body.title || "Fonseca News").substring(0, 200);
    var msgBody = String(body.body || "").substring(0, 500);
    var url = body.url || "https://fonsecanews.com.br";
    var tag = body.tag || "fn-default";

    // Valida URL (so nosso dominio)
    if (!/^https:\/\/(www\.)?fonsecanews\.com\.br(\/|$)/.test(url)) {
      url = "https://fonsecanews.com.br";
    }

    var subs = (await kv.get("push:subs")) || [];
    if (subs.length === 0) {
      return res.status(200).json({ sent: 0, message: "Nenhum inscrito" });
    }

    var payload = JSON.stringify({
      title: title,
      body: msgBody,
      url: url,
      tag: tag,
      icon: "/icon-192.png"
    });

    var sent = 0;
    var failed = 0;
    var expiredSubs = [];

    // Envia para cada inscrito em paralelo (limite de conexoes)
    var results = await Promise.allSettled(subs.map(function(sub) {
      return webpush.sendNotification(sub, payload, {
        TTL: 86400,   // 24h: se o device estiver offline, entrega quando voltar (em 24h)
        urgency: "normal"
      }).then(function() {
        return { ok: true, sub: sub };
      }).catch(function(err) {
        return { ok: false, sub: sub, status: err.statusCode || 0, message: err.message };
      });
    }));

    results.forEach(function(r) {
      if (r.status !== "fulfilled") { failed++; return; }
      var v = r.value;
      if (v.ok) { sent++; return; }
      failed++;
      // 404 ou 410 = subscription expirou/revogada, remove do KV
      if (v.status === 404 || v.status === 410) {
        expiredSubs.push(v.sub.endpoint);
      }
    });

    // Limpa inscritos expirados
    if (expiredSubs.length > 0) {
      var cleanSubs = subs.filter(function(s) { return expiredSubs.indexOf(s.endpoint) === -1; });
      await kv.set("push:subs", cleanSubs);
    }

    return res.status(200).json({
      sent: sent,
      failed: failed,
      cleaned: expiredSubs.length,
      total: subs.length
    });

  } catch (error) {
    console.error("[push-send] Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
