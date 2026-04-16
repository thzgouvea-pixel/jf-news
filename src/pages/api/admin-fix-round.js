import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  // Basic auth via query param
  if (req.query.key !== "fn-admin-2026") {
    return res.status(401).json({ error: "unauthorized" });
  }

  try {
    var raw = await kv.get("fn:lastMatch");
    if (!raw) return res.status(404).json({ error: "no lastMatch in KV" });
    var lm = typeof raw === "string" ? JSON.parse(raw) : raw;

    var oldRound = lm.round;
    var newRound = req.query.round || "Oitavas de final";
    lm.round = newRound;

    await kv.set("fn:lastMatch", JSON.stringify(lm), { ex: 604800 });

    return res.status(200).json({
      ok: true,
      opponent: lm.opponent_name,
      oldRound: oldRound,
      newRound: newRound,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
