// /api/admin-set-tournament — manual override for fn:nextTournament when Gemini
// can't confidently identify the next tournament from grounded search.
// Usage: POST/GET with ?secret=...&name=Halle Open
// The name must match an entry in ATP_CALENDAR_2026.

import { kv } from "@vercel/kv";
import { ATP_CALENDAR_2026, lookupBroadcast } from "../../lib/sofascore.js";

export default async function handler(req, res) {
  var secret = req.query.secret || (req.body && req.body.secret);
  // Reuse PUSH_SECRET (ja existe no Vercel env), aceita CRON_SECRET tambem se setado
  var expected = process.env.PUSH_SECRET || process.env.CRON_SECRET;
  if (!expected || secret !== expected) {
    return res.status(401).json({ error: "unauthorized" });
  }

  var name = String(req.query.name || (req.body && req.body.name) || "").trim();
  if (!name) return res.status(400).json({ error: "missing name" });

  // Special action: clear (sets fn:nextTournament=null) — useful when user wants to reset
  if (name.toLowerCase() === "__clear__") {
    try { await kv.del("fn:nextTournament"); } catch (e) { }
    return res.status(200).json({ ok: true, cleared: true });
  }

  // Special action: clear-disconfirmed for a tournament name
  // Usage: ?secret=...&name=__undisconfirm__&target=Halle Open
  if (name.toLowerCase() === "__undisconfirm__") {
    var target = String(req.query.target || "").trim();
    if (!target) return res.status(400).json({ error: "missing target" });
    var dcKey = "fn:disconfirmed:" + target.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    var confKey = "fn:gemini:tournConfirmed:" + target.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    try { await kv.del(dcKey); } catch (e) { }
    try { await kv.del(confKey); } catch (e) { }
    return res.status(200).json({ ok: true, undisconfirmed: target, dcKey: dcKey });
  }

  // Find tournament in calendar (loose match)
  var normName = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  var found = null;
  for (var i = 0; i < ATP_CALENDAR_2026.length; i++) {
    var calNorm = ATP_CALENDAR_2026[i].name.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (calNorm === normName || calNorm.indexOf(normName) !== -1 || normName.indexOf(calNorm) !== -1) {
      found = ATP_CALENDAR_2026[i];
      break;
    }
  }
  if (!found) return res.status(404).json({ error: "tournament not in calendar", searched: name });

  // Optional defending_points, seed, joao_last_year via query (?defending=180&seed=8&last=...)
  var defending = parseInt(req.query.defending || "", 10);
  var seed = parseInt(req.query.seed || "", 10);
  var last = String(req.query.last || "").trim();

  var payload = {
    tournament_name: found.name,
    tournament_category: found.cat,
    surface: found.surface,
    city: found.city,
    country: found.country,
    start_date: found.start,
    end_date: found.end,
    fonsecaConfirmed: true,
    defending_points: isNaN(defending) ? null : defending,
    seed: isNaN(seed) ? null : seed,
    joao_last_year: last || null,
    source: "manual",  // marks as user-pinned, cron must respect
    updatedAt: new Date().toISOString(),
  };

  try {
    await kv.set("fn:nextTournament", JSON.stringify(payload), { ex: 30 * 86400 });
    // Clear any cached NO for this tournament so cron doesn't fight us
    var confKey2 = "fn:gemini:tournConfirmed:" + found.name.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    var dcKey2 = "fn:disconfirmed:" + found.name.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    try { await kv.del(confKey2); } catch (e) { }
    try { await kv.del(dcKey2); } catch (e) { }
    return res.status(200).json({ ok: true, written: payload });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
