// /api/generate-posts — monta tweets prontos a partir do estado atual do KV.
// Usado pela pagina /admin-posts. Auth via PUSH_SECRET (ja existe no env).
// Nao posta nada em lugar nenhum: so devolve o texto pro usuario copiar.

import { kv } from "@vercel/kv";
import { buildPosts } from "../../lib/postTemplates.js";

async function getKV(key) {
  try {
    var val = await kv.get(key);
    if (!val) return null;
    return typeof val === "string" ? JSON.parse(val) : val;
  } catch (e) { return null; }
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  var secret = req.query.secret || (req.body && req.body.secret);
  var expected = process.env.PUSH_SECRET || process.env.CRON_SECRET;
  if (!expected || secret !== expected) {
    return res.status(401).json({ error: "unauthorized" });
  }

  try {
    var results = await Promise.all([
      getKV("fn:lastMatch"),
      getKV("fn:nextMatch"),
      getKV("fn:nextTournament"),
      getKV("fn:ranking"),
      getKV("fn:recentForm"),
      getKV("fn:careerStats"),
    ]);

    var data = {
      lastMatch: results[0],
      nextMatch: results[1],
      nextTournament: results[2],
      ranking: results[3],
      recentForm: results[4],
      careerStats: results[5],
    };

    var posts = buildPosts(data);

    return res.status(200).json({
      ok: true,
      generatedAt: new Date().toISOString(),
      posts: posts,
      // contexto util pro front mostrar o que existe agora
      has: {
        nextTournament: !!data.nextTournament,
        nextMatch: !!(data.nextMatch && data.nextMatch.opponent_name && data.nextMatch.opponent_name !== "A definir"),
        lastMatch: !!data.lastMatch,
      },
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
