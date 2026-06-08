// eventTweets.js — auto-posta no X SO os eventos seguros (factuais):
//   1) Resultado de uma partida que acabou de terminar
//   2) Torneio novo confirmado (fonsecaConfirmed === true)
// O resto (proximo jogo, retrospectiva, ranking) fica no painel /admin-posts
// pro usuario postar manualmente. Decisao do usuario: modo "hibrido".
//
// Idempotente: cada evento posta UMA vez (chave tw:event:* no KV, TTL 60d).
// Guardas de frescor: nao posta resultado velho nem torneio que ja passou.
// Posta no maximo 1 evento por chamada (resultado tem prioridade) pra nao floodar.

import { buildPosts } from "./postTemplates.js";

// Espaçamento minimo entre QUALQUER post (evento ou bot). Evita posts grudados
// ou muito parecidos num intervalo curto. Compartilha a chave tw:last_post com
// o bot /api/tweet (que tem cooldown proprio de 2h).
var MIN_GAP_MS = 20 * 60 * 1000;

function pickPost(posts, id) {
  for (var i = 0; i < posts.length; i++) {
    if (posts[i] && posts[i].id === id) return posts[i];
  }
  return null;
}

// Marca que postamos: atualiza tw:last_post (faz o bot segurar o cooldown de 2h)
// e incrementa a contagem diaria (eventos contam no limite, controla volume).
async function recordPosted(kv) {
  try { await kv.set("tw:last_post", Date.now()); } catch (e) {}
  try {
    var d = new Date().toISOString().split("T")[0];
    await kv.incr("tw:count:" + d);
    await kv.expire("tw:count:" + d, 172800);
  } catch (e) {}
}

// deps: { kv, postTweet, postWithLinkReply, log, lastMatch, nextTournament, recentForm }
export async function postPendingEventTweets(deps) {
  deps = deps || {};
  var kv = deps.kv;
  var post = deps.postWithLinkReply || deps.postTweet;
  var log = deps.log || function () {};
  if (!kv || !post) return { posted: null, reason: "no-deps" };

  var lm = deps.lastMatch;
  var nt = deps.nextTournament;
  var nowMs = Date.now();
  var LINK = "🎾 fonsecanews.com.br";

  // ===== ESPAÇAMENTO: nao posta evento se houve QUALQUER post (bot ou evento)
  // nos ultimos 20min. Segura este tick; o proximo cron reavalia. Evita clusters
  // e posts parecidos saindo grudados. =====
  try {
    var lastPostRaw = await kv.get("tw:last_post");
    if (lastPostRaw) {
      var since = nowMs - parseInt(lastPostRaw, 10);
      if (!isNaN(since) && since >= 0 && since < MIN_GAP_MS) {
        log("event tweet HELD (espacamento): ultimo post ha " + Math.round(since / 60000) + "min");
        return { posted: null, reason: "spacing" };
      }
    }
  } catch (e) {}

  // ===== 1) RESULTADO =====
  if (lm && lm.finished && lm.id && (lm.result === "V" || lm.result === "D")) {
    // frescor: so posta se a partida terminou nas ultimas 48h (evita postar
    // resultado antigo se o KV foi limpo / chave de dedup expirou)
    var fresh = true;
    if (lm.startTimestamp) {
      var hrs = (nowMs - lm.startTimestamp * 1000) / 3600000;
      if (hrs > 48 || hrs < -3) fresh = false;
    } else if (lm.date) {
      var hrs2 = (nowMs - new Date(lm.date).getTime()) / 3600000;
      if (!isNaN(hrs2) && (hrs2 > 48 || hrs2 < -3)) fresh = false;
    }
    if (fresh) {
      var rKey = "tw:event:result:" + lm.id;
      var rDone = null;
      try { rDone = await kv.get(rKey); } catch (e) {}
      if (!rDone) {
        var rPosts = buildPosts({ lastMatch: lm, recentForm: deps.recentForm });
        var rPost = pickPost(rPosts, "resultado");
        if (rPost && rPost.text) {
          try {
            await post(rPost.text, LINK);
            try { await kv.set(rKey, nowMs, { ex: 60 * 86400 }); } catch (e) {}
            await recordPosted(kv);
            log("event tweet POSTED: resultado id=" + lm.id + " (" + lm.result + ")");
            return { posted: "resultado", id: lm.id };
          } catch (e) {
            log("event tweet resultado FAIL: " + e.message);
            return { posted: null, error: e.message };
          }
        }
      }
    }
  }

  // ===== 2) TORNEIO CONFIRMADO =====
  if (nt && nt.fonsecaConfirmed === true && nt.tournament_name && nt.start_date) {
    // frescor: anuncia ate 21 dias antes do inicio e ate 7 dias depois (durante)
    var ok = true;
    var startMs = new Date(nt.start_date + "T00:00:00Z").getTime();
    if (!isNaN(startMs)) {
      var days = (startMs - nowMs) / 86400000;
      if (days > 21 || days < -7) ok = false;
    }
    if (ok) {
      var slug = (nt.tournament_name + nt.start_date).replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
      var tKey = "tw:event:tourn:" + slug;
      var tDone = null;
      try { tDone = await kv.get(tKey); } catch (e) {}
      if (!tDone) {
        var tPosts = buildPosts({ nextTournament: nt });
        var tPost = pickPost(tPosts, "torneio");
        if (tPost && tPost.text) {
          try {
            await post(tPost.text, LINK);
            try { await kv.set(tKey, nowMs, { ex: 60 * 86400 }); } catch (e) {}
            await recordPosted(kv);
            log("event tweet POSTED: torneio " + nt.tournament_name);
            return { posted: "torneio", name: nt.tournament_name };
          } catch (e) {
            log("event tweet torneio FAIL: " + e.message);
            return { posted: null, error: e.message };
          }
        }
      }
    }
  }

  return { posted: null };
}
