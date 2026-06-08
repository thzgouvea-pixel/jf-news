// /api/preview-teaser — mostra como a IA comporia os teasers dos eventos ATUAIS,
// SEM postar nada. Serve pra calibrar a voz sem poluir o perfil.
// Auth: PUSH_SECRET. Uso: /api/preview-teaser?secret=...[&event=rank]

import { kv } from "@vercel/kv";
import { buildEventCandidates } from "../../lib/eventTweets.js";
import { composeTeaser } from "../../lib/teaserComposer.js";

async function getKV(key) {
  try {
    var v = await kv.get(key);
    if (!v) return null;
    return typeof v === "string" ? JSON.parse(v) : v;
  } catch (e) { return null; }
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  var secret = req.query.secret || (req.body && req.body.secret);
  var expected = process.env.PUSH_SECRET || process.env.CRON_SECRET;
  if (!expected || secret !== expected) return res.status(401).json({ error: "unauthorized" });

  try {
    var vals = await Promise.all([
      getKV("fn:lastMatch"), getKV("fn:nextMatch"), getKV("fn:nextTournament"),
      getKV("fn:recentForm"), getKV("fn:winProb"), getKV("fn:matchStats"),
      getKV("fn:h2h"), getKV("fn:season"), getKV("fn:ranking"), getKV("fn:rankingHistory"),
    ]);
    var deps = {
      lastMatch: vals[0], nextMatch: vals[1], nextTournament: vals[2], recentForm: vals[3],
      winProb: vals[4], matchStats: vals[5], h2h: vals[6], season: vals[7],
      ranking: vals[8], rankingHistory: vals[9],
    };

    var cands = buildEventCandidates(deps);
    var only = req.query.event;
    var out = [];
    for (var i = 0; i < cands.length; i++) {
      var c = cands[i];
      if (only && c.id !== only) continue;
      var composed = await composeTeaser(c.facts, c.fallback);
      out.push({
        event: c.id,
        source: composed ? composed.source : "none",
        text: composed ? composed.text : null,
        facts: c.facts.lines,
      });
    }

    if (req.query.format === "json") {
      return res.status(200).json({ ok: true, count: out.length, previews: out });
    }

    // texto legivel (default) — pra abrir no navegador e calibrar a voz
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    if (out.length === 0) return res.status(200).send("Nenhum evento ativo agora pra gerar teaser.");
    var lines = ["PREVIEW DOS TEASERS (nao postado) — " + out.length + " evento(s)\n"];
    out.forEach(function (o) {
      lines.push("============================================");
      lines.push("EVENTO: " + o.event + "   [" + (o.source === "ia" ? "IA ✓" : "template (IA falhou)") + "]");
      lines.push("--------------------------------------------");
      lines.push(o.text || "(sem texto)");
      lines.push("");
    });
    return res.status(200).send(lines.join("\n"));
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
