// /api/manual-odds.js — Set win probability from SofaScore odds
// Usage: /api/manual-odds?secret=fn-push-2026&f=1.25&o=4.00&opponent=G.+Diallo
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
  var secret = req.query.secret;
  if (!safeCompare(secret, process.env.PUSH_SECRET)) {
    return res.status(401).json({ error: "unauthorized" });
  }

  var fOdds = parseFloat(req.query.f);
  var oOdds = parseFloat(req.query.o);
  var oppName = req.query.opponent || "Oponente";

  if (!fOdds || !oOdds || fOdds <= 1 || oOdds <= 1 || fOdds > 1000 || oOdds > 1000) {
    return res.status(400).json({ error: "Provide ?f=1.25&o=4.00 (decimal odds, between 1 and 1000)" });
  }

  // Sanitize opponent name
  oppName = oppName.replace(/\+/g, " ").replace(/[<>"'&]/g, "").substring(0, 100);

  // Convert decimal odds to implied probability (remove vig)
  var implF = 1 / fOdds;
  var implO = 1 / oOdds;
  var totalImpl = implF + implO;
  var fPct = Math.round((implF / totalImpl) * 100);
  var oPct = 100 - fPct;

  var payload = {
    fonseca: fPct,
    opponent: oPct,
    opponent_name: oppName,
    source: "sofascore",
    odds: { fonseca: fOdds, opponent: oOdds },
    updatedAt: new Date().toISOString(),
  };

  await kv.set("fn:winProb", JSON.stringify(payload), { ex: 86400 * 2 });

  return res.status(200).json({
    ok: true,
    fonseca: fPct + "%",
    opponent: oPct + "%",
    odds: { fonseca: fOdds, opponent: oOdds },
  });
}
