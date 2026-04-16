// GET  → retorna o bracket URL atual
// GET com secret → salva novo bracket URL
//
// Como usar:
// fonsecanews.com.br/api/manual-bracket?secret=SUA_SENHA
//   &url=https://www.atptour.com/en/scores/current/bmw-open/308/draws
//   &tournament=BMW Open
//
// Limpar:
// fonsecanews.com.br/api/manual-bracket?secret=SUA_SENHA&clear=1

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
  // GET sem parâmetros → retorna bracket atual
  if (req.method === "GET" && !req.query.secret) {
    try {
      var data = await kv.get("fn:bracketUrl");
      if (!data) return res.status(200).json({ bracket: null });
      var parsed = typeof data === "string" ? JSON.parse(data) : data;
      return res.status(200).json(parsed);
    } catch (e) {
      return res.status(200).json({ bracket: null });
    }
  }

  // Requer senha
  var secret = req.query.secret || (req.body && req.body.secret);
  if (!safeCompare(secret, process.env.PUSH_SECRET)) {
    return res.status(401).json({ error: "Senha errada" });
  }

  // Limpar
  if (req.query.clear || (req.body && req.body.clear)) {
    await kv.del("fn:bracketUrl");
    return res.status(200).json({ ok: true, message: "Bracket removido" });
  }

  var url = req.query.url || (req.body && req.body.url);
  var tournament = req.query.tournament || (req.body && req.body.tournament) || "";

  if (!url) {
    return res.status(400).json({ error: "Faltou 'url'. Ex: ?url=https://..." });
  }

  // Valida URL básica
  if (!/^https?:\/\//i.test(url)) {
    return res.status(400).json({ error: "URL precisa começar com http:// ou https://" });
  }

  var payload = {
    url: url,
    tournament: String(tournament).substring(0, 100).replace(/[<>"'&]/g, ""),
    updatedAt: new Date().toISOString(),
  };

  await kv.set("fn:bracketUrl", JSON.stringify(payload), { ex: 86400 * 14 });

  return res.status(200).json({
    ok: true,
    message: "Bracket salvo!",
    url: url,
    tournament: tournament,
  });
}
