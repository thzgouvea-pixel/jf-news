// Debug endpoint TEMPORARIO — checa o estado de push
// Uso: /api/debug-push?secret=fn-push-2026
import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  if (req.query.secret !== "fn-push-2026") return res.status(401).json({ error: "unauthorized" });
  try {
    var pushState = await kv.get("fn:pushState");
    var subs = (await kv.get("push:subs")) || [];
    var subsCount = Array.isArray(subs) ? subs.length : 0;

    var hasSecret = !!process.env.PUSH_SECRET;
    var hasVapidPub = !!process.env.VAPID_PUBLIC_KEY;
    var hasVapidPriv = !!process.env.VAPID_PRIVATE_KEY;

    // Endpoints truncados pra preservar privacidade
    var endpointPreviews = [];
    if (Array.isArray(subs)) {
      for (var i = 0; i < subs.length; i++) {
        var s = subs[i];
        if (s && s.endpoint) {
          endpointPreviews.push(s.endpoint.substring(0, 60) + "...");
        }
      }
    }

    // Info temporal: quanto tempo desde ultimo push
    var hoursSinceLastPush = null;
    if (pushState && pushState.lastPushAt) {
      hoursSinceLastPush = Math.round((Date.now() - new Date(pushState.lastPushAt).getTime()) / 3600000 * 10) / 10;
    }

    return res.status(200).json({
      pushState: pushState || null,
      hoursSinceLastPush: hoursSinceLastPush,
      subscriptionsCount: subsCount,
      endpointPreviews: endpointPreviews,
      env: { hasSecret: hasSecret, hasVapidPublic: hasVapidPub, hasVapidPrivate: hasVapidPriv },
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
