// pages/api/manual-video.js
// GET  → retorna o vídeo atual
// POST → salva um novo vídeo (precisa de PUSH_SECRET)
//
// ╔════════════════════════════════════════════════════════════╗
// ║  COMO USAR (pelo navegador do celular):                   ║
// ║                                                           ║
// ║  1. Abra o YouTube e encontre o vídeo de highlights       ║
// ║  2. Copie o link (ex: https://youtu.be/abc123xyz)         ║
// ║  3. No navegador, acesse:                                 ║
// ║                                                           ║
// ║  fonsecanews.com.br/api/manual-video?secret=SUA_SENHA     ║
// ║  &video=https://youtu.be/abc123xyz                        ║
// ║  &title=Fonseca vs Rinderknech                            ║
// ║                                                           ║
// ║  Pronto! O vídeo aparece no site instantaneamente.        ║
// ║                                                           ║
// ║  Para REMOVER o vídeo:                                    ║
// ║  fonsecanews.com.br/api/manual-video?secret=SUA_SENHA     ║
// ║  &clear=1                                                 ║
// ╚════════════════════════════════════════════════════════════╝

import { kv } from "@vercel/kv";

function extractYouTubeId(url) {
  if (!url) return null;
  // youtu.be/abc123
  var short = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (short) return short[1];
  // youtube.com/watch?v=abc123
  var full = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (full) return full[1];
  // youtube.com/embed/abc123
  var embed = url.match(/embed\/([a-zA-Z0-9_-]{11})/);
  if (embed) return embed[1];
  // Se já é só o ID (11 chars)
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
  return null;
}

export default async function handler(req, res) {
  // GET sem parâmetros → retorna vídeo atual
  if (req.method === "GET" && !req.query.secret) {
    try {
      var data = await kv.get("fn:highlight-video");
      if (!data) return res.status(200).json({ video: null });
      var parsed = typeof data === "string" ? JSON.parse(data) : data;
      return res.status(200).json(parsed);
    } catch (e) {
      return res.status(200).json({ video: null });
    }
  }

  // GET ou POST com secret → atualizar vídeo
  var secret = req.query.secret || (req.body && req.body.secret);
  if (secret !== process.env.PUSH_SECRET) {
    return res.status(401).json({ error: "Senha errada" });
  }

  // Limpar vídeo
  if (req.query.clear || (req.body && req.body.clear)) {
    await kv.del("fn:highlight-video");
    return res.status(200).json({ ok: true, message: "Vídeo removido" });
  }

  var videoUrl = req.query.video || (req.body && req.body.video);
  var title = req.query.title || (req.body && req.body.title) || "";

  if (!videoUrl) {
    return res.status(400).json({ error: "Faltou o parâmetro 'video'. Ex: ?video=https://youtu.be/abc123xyz" });
  }

  var videoId = extractYouTubeId(videoUrl);
  if (!videoId) {
    return res.status(400).json({ error: "Link do YouTube inválido. Use o link de compartilhamento do YouTube." });
  }

  var payload = {
    videoId: videoId,
    title: title,
    updatedAt: new Date().toISOString(),
  };

  // Salva por 7 dias (depois expira sozinho)
  await kv.set("fn:highlight-video", JSON.stringify(payload), { ex: 86400 * 7 });

  return res.status(200).json({
    ok: true,
    message: "Vídeo salvo com sucesso!",
    videoId: videoId,
    title: title,
    embed: "https://www.youtube.com/embed/" + videoId,
  });
}
