// eventTweets.js — auto-posta no X eventos FACTUAIS do site, sempre como TEASER
// (gancho/curiosidade + chamada pro site), via teaserComposer (IA compoe a partir
// de fatos reais; number-guard impede invencao; cai em template seguro se falhar).
//
// Idempotente: cada evento posta UMA vez (chave tw:event:* no KV, TTL 60d).
// Espacamento: 20min entre QUALQUER post (evento ou bot), compartilha tw:last_post.
// Posta no maximo 1 evento por chamada (ordem de prioridade) pra nao floodar.

import { buildPosts } from "./postTemplates.js";
import { composeTeaser } from "./teaserComposer.js";

var MIN_GAP_MS = 20 * 60 * 1000;
var TAGS = "#JoãoFonseca #FonsecaNews";

function surname(n) {
  if (!n) return "";
  var p = String(n).trim().split(/\s+/);
  return p[p.length - 1];
}
function pick(posts, id) {
  for (var i = 0; i < posts.length; i++) { if (posts[i] && posts[i].id === id) return posts[i]; }
  return null;
}
function slug(s) { return String(s || "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase(); }

function winStreak(rf) {
  if (!Array.isArray(rf)) return 0;
  var c = 0;
  for (var i = 0; i < rf.length; i++) {
    if ((rf[i].result || "").toUpperCase() === "V") c++; else break;
  }
  return c;
}

// Marca que postamos: atualiza tw:last_post (bot segura cooldown 2h) + conta no dia.
async function recordPosted(kv) {
  try { await kv.set("tw:last_post", Date.now()); } catch (e) {}
  try {
    var d = new Date().toISOString().split("T")[0];
    await kv.incr("tw:count:" + d);
    await kv.expire("tw:count:" + d, 172800);
  } catch (e) {}
}

// deps: { kv, postWithLinkReply|postTweet, log, lastMatch, nextMatch, nextTournament,
//         recentForm, winProb, matchStats, h2h, season, ranking, rankingHistory }
export async function postPendingEventTweets(deps) {
  deps = deps || {};
  var kv = deps.kv;
  var post = deps.postWithLinkReply || deps.postTweet;
  var log = deps.log || function () {};
  if (!kv || !post) return { posted: null, reason: "no-deps" };

  var lm = deps.lastMatch, nm = deps.nextMatch, nt = deps.nextTournament, rf = deps.recentForm;
  var wp = deps.winProb, ms = deps.matchStats, h2h = deps.h2h, season = deps.season;
  var ranking = deps.ranking, history = deps.rankingHistory;
  var nowMs = Date.now();
  var LINK = "🎾 fonsecanews.com.br";

  // ===== ESPACAMENTO: segura se houve QUALQUER post nos ultimos 20min =====
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

  // templates de fallback (seguros) gerados uma vez
  var tmpl = buildPosts({ lastMatch: lm, nextMatch: nm, nextTournament: nt, ranking: ranking, recentForm: rf });

  // frescor da ultima partida: resultado e estatisticas so saem nas primeiras 48h
  var lmFresh = false;
  if (lm && lm.finished) {
    lmFresh = true;
    if (lm.startTimestamp) { var hhx = (nowMs - lm.startTimestamp * 1000) / 3600000; if (hhx > 48 || hhx < -3) lmFresh = false; }
    else if (lm.date) { var hhy = (nowMs - new Date(lm.date).getTime()) / 3600000; if (!isNaN(hhy) && (hhy > 48 || hhy < -3)) lmFresh = false; }
  }

  // ===== REGISTRO DE CANDIDATOS (ordem de prioridade) =====
  var cands = [];

  // 1) RESULTADO (vitoria/derrota) — gancho: aproveitamento na temporada
  if (lm && lm.finished && lm.id && (lm.result === "V" || lm.result === "D")) {
    if (lmFresh) {
      var rLines = [];
      rLines.push((lm.result === "V" ? "Joao Fonseca venceu" : "Joao Fonseca perdeu para") + " " + surname(lm.opponent_name) + (lm.score ? " por " + lm.score : ""));
      if (lm.tournament_name) rLines.push("No " + lm.tournament_name + (lm.round ? " (" + lm.round + ")" : ""));
      if (lm.opponent_ranking) rLines.push(surname(lm.opponent_name) + " era #" + lm.opponent_ranking + " do mundo");
      if (season && typeof season.winPct === "number" && season.wins != null && season.losses != null) {
        rLines.push("Aproveitamento na temporada 2026: " + season.winPct + "% (" + season.wins + "V " + season.losses + "D)");
      }
      cands.push({ id: "resultado", key: "tw:event:result:" + lm.id, facts: { lines: rLines, hashtags: TAGS }, fallback: (pick(tmpl, "resultado") || {}).text });
    }
  }

  // 2) PROBABILIDADE DE VITORIA
  if (nm && nm.opponent_name && nm.opponent_name !== "A definir" && wp && typeof wp.fonseca === "number") {
    var wpLines = [];
    wpLines.push("Modelo do Fonseca News da " + wp.fonseca + "% de chance pro Joao Fonseca vencer " + surname(nm.opponent_name));
    if (nm.tournament_name) wpLines.push("Jogo pelo " + nm.tournament_name + (nm.round ? " (" + nm.round + ")" : ""));
    if (nm.opponent_ranking) wpLines.push(surname(nm.opponent_name) + " e #" + nm.opponent_ranking + " do mundo");
    cands.push({
      id: "winprob",
      key: "tw:event:winprob:" + slug(nm.id || (nm.tournament_name + nm.opponent_name)),
      facts: { lines: wpLines, hashtags: TAGS },
      fallback: "📊 Nosso modelo dá " + wp.fonseca + "% pro João contra " + surname(nm.opponent_name) + ". Você concorda? Veja a análise no site 👀\n\n" + TAGS,
    });
  }

  // 3) PROXIMO ADVERSARIO definido
  if (nm && nm.opponent_name && nm.opponent_name !== "A definir") {
    var oLines = [];
    oLines.push("Proximo adversario de Joao Fonseca: " + surname(nm.opponent_name));
    if (nm.opponent_ranking) oLines.push(surname(nm.opponent_name) + " e #" + nm.opponent_ranking + " do mundo");
    if (nm.tournament_name) oLines.push("Pelo " + nm.tournament_name + (nm.round ? " (" + nm.round + ")" : ""));
    if (h2h) {
      var fw = (h2h.fonsecaWins != null) ? h2h.fonsecaWins : h2h.wins;
      var ow = (h2h.oppWins != null) ? h2h.oppWins : h2h.losses;
      if (fw != null && ow != null) oLines.push("Confronto direto: Joao " + fw + "-" + ow);
    }
    cands.push({
      id: "opp",
      key: "tw:event:opp:" + slug((nm.tournament_name || "") + "|" + nm.opponent_name + "|" + (nm.round || "")),
      facts: { lines: oLines, hashtags: TAGS },
      fallback: "🎾 Próximo desafio do João: " + surname(nm.opponent_name) + (nm.opponent_ranking ? " (#" + nm.opponent_ranking + ")" : "") + ". Análise completa no site!\n\n" + TAGS,
    });
  }

  // 4) ESTATISTICAS DA PARTIDA (so se a partida e recente — mesma trava de 48h)
  if (ms && ms.fonseca && lm && lm.id && lmFresh) {
    var f = ms.fonseca;
    var sLines = [];
    sLines.push("Estatisticas de Joao Fonseca vs " + surname(ms.opponent_name || lm.opponent_name) + (lm.score ? " (" + lm.score + ")" : ""));
    if (typeof f.winnerstotal === "number") sLines.push("Winners: " + f.winnerstotal);
    if (typeof f.aces === "number") sLines.push("Aces: " + f.aces);
    if (typeof f.breakpointsscored === "number") sLines.push("Break points convertidos: " + f.breakpointsscored);
    if (sLines.length >= 2) {
      var fbStat = "📊 O raio-x do João" + (typeof f.winnerstotal === "number" ? ": " + f.winnerstotal + " winners" : "") + (typeof f.aces === "number" ? ", " + f.aces + " aces" : "") + ". Estatística completa no site!\n\n" + TAGS;
      cands.push({ id: "stats", key: "tw:event:stats:" + lm.id, facts: { lines: sLines, hashtags: TAGS }, fallback: fbStat });
    }
  }

  // 5) MUDANCA DE RANKING (usa rankingHistory pra detectar mudanca REAL)
  if (ranking && ranking.ranking && Array.isArray(history) && history.length >= 2) {
    var prevH = history[history.length - 2], curH = history[history.length - 1];
    if (prevH && curH && prevH.rank && curH.rank && prevH.rank !== curH.rank && curH.rank === ranking.ranking) {
      var up = curH.rank < prevH.rank;
      var rLines2 = [];
      rLines2.push("Joao Fonseca " + (up ? "subiu" : "caiu") + " no ranking ATP: de #" + prevH.rank + " para #" + curH.rank);
      if (ranking.bestRanking) rLines2.push("Melhor ranking da carreira dele: #" + ranking.bestRanking);
      cands.push({
        id: "rank",
        key: "tw:event:rank:" + curH.rank,
        facts: { lines: rLines2, hashtags: TAGS + " #ATP" },
        fallback: "📈 João " + (up ? "subiu" : "caiu") + " para #" + curH.rank + " no ranking ATP (era #" + prevH.rank + "). Veja a evolução no site!\n\n" + TAGS + " #ATP",
      });
    }
  }

  // 6) MELHOR RANKING DA CARREIRA
  if (ranking && ranking.ranking && ranking.bestRanking && ranking.ranking === ranking.bestRanking) {
    cands.push({
      id: "careerhigh",
      key: "tw:event:careerhigh:" + ranking.ranking,
      facts: { lines: ["Joao Fonseca atingiu o melhor ranking da carreira: #" + ranking.ranking + " do mundo"], hashtags: TAGS + " #ATP" },
      fallback: "🏔️ Novo recorde! João atingiu o melhor ranking da carreira: #" + ranking.ranking + ". Que trajetória! 🇧🇷\n\n" + TAGS + " #ATP",
    });
  }

  // 7) SEQUENCIA DE VITORIAS (>=3)
  var streak = winStreak(rf);
  if (streak >= 3 && rf && rf[0] && rf[0].opponent_name) {
    cands.push({
      id: "streak",
      key: "tw:event:streak:" + streak + ":" + slug(rf[0].tournament || rf[0].tournament_name || "") + slug(rf[0].opponent_name),
      facts: { lines: ["Joao Fonseca esta com uma sequencia de " + streak + " vitorias seguidas"], hashtags: TAGS },
      fallback: "🔥 João emplaca " + streak + " vitórias seguidas! Acompanhe a sequência no site 🇧🇷\n\n" + TAGS,
    });
  }

  // 8) TORNEIO CONFIRMADO
  if (nt && nt.fonsecaConfirmed === true && nt.tournament_name && nt.start_date) {
    var okTourn = true;
    var sMs = new Date(nt.start_date + "T00:00:00Z").getTime();
    if (!isNaN(sMs)) { var dd = (sMs - nowMs) / 86400000; if (dd > 21 || dd < -7) okTourn = false; }
    if (okTourn) {
      var surfPt = nt.surface === "Grass" ? "grama" : (nt.surface === "Clay" ? "saibro" : (nt.surface === "Hard" ? "quadra dura" : nt.surface || ""));
      var tLines = [];
      tLines.push("Proximo torneio de Joao Fonseca: " + nt.tournament_name + (nt.tournament_category ? " (" + nt.tournament_category + ")" : ""));
      tLines.push("Comeca em " + nt.start_date + (surfPt ? ", em " + surfPt : ""));
      if (nt.joao_last_year) tLines.push("Ano passado: " + nt.joao_last_year);
      cands.push({ id: "torneio", key: "tw:event:tourn:" + slug(nt.tournament_name + nt.start_date), facts: { lines: tLines, hashtags: TAGS + " #ATP" }, fallback: (pick(tmpl, "torneio") || {}).text });
    }
  }

  // ===== PROCESSA: primeiro candidato pendente (dedup nao setado) =====
  for (var i = 0; i < cands.length; i++) {
    var c = cands[i];
    if (!c || !c.key) continue;
    var done = null;
    try { done = await kv.get(c.key); } catch (e) {}
    if (done) continue;
    var text = await composeTeaser(c.facts, c.fallback);
    if (!text) continue;
    try {
      log("event compose [" + c.id + "]: " + text.replace(/\n+/g, " ").substring(0, 140));
      await post(text, LINK);
      try { await kv.set(c.key, nowMs, { ex: 60 * 86400 }); } catch (e) {}
      await recordPosted(kv);
      log("event tweet POSTED: " + c.id);
      return { posted: c.id };
    } catch (e) {
      log("event tweet " + c.id + " FAIL: " + e.message);
      return { posted: null, error: e.message };
    }
  }

  return { posted: null };
}
