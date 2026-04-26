// Debug endpoint TEMPORARIO — checa o estado de push
// Uso: /api/debug-push?secret=fn-push-2026
import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  if (req.query.secret !== "fn-push-2026") return res.status(401).json({ error: "unauthorized" });
  try {
    var pushState = await kv.get("fn:pushState");
    var subsRaw = await kv.get("fn:pushSubscriptions");
    var subs = [];
    if (subsRaw) {
      try { subs = typeof subsRaw === "string" ? JSON.parse(subsRaw) : subsRaw; } catch(e) {}
    }
    var subsCount = Array.isArray(subs) ? subs.length : 0;

    var hasSecret = !!process.env.PUSH_SECRET;
    var hasVapidPub = !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    var hasVapidPriv = !!process.env.VAPID_PRIVATE_KEY;

    return res.status(200).json({
      pushState: pushState || null,
      subscriptionsCount: subsCount,
      env: { hasSecret: hasSecret, hasVapidPublic: hasVapidPub, hasVapidPrivate: hasVapidPriv },
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
