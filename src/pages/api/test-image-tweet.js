// /api/test-image-tweet — posta UM tweet de teste de um evento atual COM imagem,
// pra verificar o pipeline completo (gera imagem -> upload na API do X -> anexa).
// NAO respeita dedup (e teste, pode rodar de novo). Auth: PUSH_SECRET.
// Uso: /api/test-image-tweet?secret=...[&event=rank]

import { kv } from "@vercel/kv";
import { buildEventCandidates } from "../../lib/eventTweets.js";
import { composeTeaser } from "../../lib/teaserComposer.js";
import { uploadMediaFromUrl } from "../../lib/twitterMedia.js";
import { postTweet, postWithLinkReply } from "./tweet.js";

var IMG_BASE = "https://fonsecanews.com.br/api/event-image";
function eventImageUrl(img) {
  if (!img || !img.head) return null;
  return IMG_BASE +
    "?label=" + encodeURIComponent(img.label || "Fonseca News") +
    "&head=" + encodeURIComponent(img.head) +
    "&sub=" + encodeURIComponent(img.sub || "") +
    "&emoji=" + encodeURIComponent(img.emoji || "🎾") +
    "&accent=" + encodeURIComponent(img.accent || "00A859");
}
async function getKV(key) {
  try { var v = await kv.get(key); if (!v) return null; return typeof v === "string" ? JSON.parse(v) : v; } catch (e) { return null; }
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
    var cands = buildEventCandidates({
      lastMatch: vals[0], nextMatch: vals[1], nextTournament: vals[2], recentForm: vals[3],
      winProb: vals[4], matchStats: vals[5], h2h: vals[6], season: vals[7],
      ranking: vals[8], rankingHistory: vals[9],
    });
    if (cands.length === 0) return res.status(200).json({ ok: false, error: "nenhum evento ativo agora" });

    var only = req.query.event;
    var c = null;
    for (var i = 0; i < cands.length; i++) { if (!only || cands[i].id === only) { c = cands[i]; break; } }
    if (!c) return res.status(200).json({ ok: false, error: "evento '" + only + "' nao ativo", disponiveis: cands.map(function (x) { return x.id; }) });

    var composed = await composeTeaser(c.facts, c.fallback);
    var text = composed.text;

    var mediaIds = null, imgErr = null;
    var imgUrl = eventImageUrl(c.image);
    if (imgUrl) {
      try { var mid = await uploadMediaFromUrl(imgUrl); if (mid) mediaIds = [mid]; }
      catch (e) { imgErr = e.message; }
    }

    var result;
    if (mediaIds) result = await postTweet(text + "\n\n🔗 fonsecanews.com.br", null, mediaIds);
    else result = await postWithLinkReply(text, "🎾 fonsecanews.com.br");

    return res.status(200).json({
      ok: true, event: c.id, source: composed.source,
      image_attached: !!mediaIds, image_error: imgErr,
      image_url: imgUrl, text: text,
      tweet_id: result && result.data ? result.data.id : null,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
