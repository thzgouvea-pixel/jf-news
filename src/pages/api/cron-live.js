// ===== FONSECA NEWS — CRON LIVE v1 =====
// Endpoint leve para refresh frequente em dias de jogo.
// Roda a cada 5min via cron-job.org. 80% das execucoes sao early-return.
//
// Estrategia: le fn:nextMatch + fn:lastMatch (KV, gratis) pra decidir se "esta em janela".
// Se sim: chama /api/live (que ja faz o trabalho de atualizar fn:live, fn:matchStats,
// fn:lastMatch, fn:recentForm via handleMatchFinished).
// Se nao: retorna em <100ms sem nenhuma chamada externa.
//
// JANELA DE ATIVACAO:
//  (a) Pre-jogo: ate 90min antes de nm.startTimestamp
//  (b) Durante: nm.liveStatus === "inprogress"
//  (c) Pos-jogo: ate 6h depois de nm.startTimestamp (cobre jogos longos + termino)

import { kv } from "@vercel/kv";

function log(msg) { console.log("[cron-live] " + msg); }

function parseKV(raw) {
  if (!raw) return null;
  try { return typeof raw === "string" ? JSON.parse(raw) : raw; }
  catch (e) { return null; }
}

export default async function handler(req, res) {
  var start = Date.now();

  try {
    // ── PHASE 1: Decide se esta em janela (so KV reads, sem calls externas) ──
    var kvReads = await Promise.all([
      kv.get("fn:nextMatch"),
      kv.get("fn:lastMatch"),
    ]);
    var nm = parseKV(kvReads[0]);
    var lm = parseKV(kvReads[1]);

    var now = Date.now();
    var inWindow = false;
    var reason = "no-match-data";

    // (a) Pre-jogo: 90min antes do startTimestamp
    if (nm && nm.startTimestamp) {
      var minsUntil = (nm.startTimestamp * 1000 - now) / 60000;
      if (minsUntil >= -1 && minsUntil <= 90) {
        inWindow = true;
        reason = "pre-match (" + Math.round(minsUntil) + "min)";
      }
    }

    // (b) Jogo ao vivo (status confirmado pelo SofaScore)
    if (!inWindow && nm && nm.liveStatus) {
      var s = nm.liveStatus.toLowerCase();
      if (s === "inprogress" || s === "in_progress" || s === "live" || s === "started") {
        inWindow = true;
        reason = "live";
      }
    }

    // (c) Pos-jogo: ate 6h apos o startTimestamp do nm
    // Cobre o termino do jogo + processamento de stats. Apos isso, lastMatch ja estabiliza.
    if (!inWindow && nm && nm.startTimestamp) {
      var minsAfterStart = (now - nm.startTimestamp * 1000) / 60000;
      if (minsAfterStart > 0 && minsAfterStart <= 360) {
        inWindow = true;
        reason = "post-match (" + Math.round(minsAfterStart) + "min after start)";
      }
    }

    // (d) Cobertura adicional: lastMatch acabou nas ultimas 30min (jogo recem-terminado).
    // Util quando o jogo terminou rapido (ex: 2-0 em 1h) e ainda precisamos garantir
    // que matchStats / recentForm estejam atualizados.
    if (!inWindow && lm && lm.startTimestamp && lm.finished) {
      var minsAfterLm = (now - lm.startTimestamp * 1000) / 60000;
      if (minsAfterLm > 0 && minsAfterLm <= 30) {
        inWindow = true;
        reason = "lm-recent (" + Math.round(minsAfterLm) + "min after lm start)";
      }
    }

    if (!inWindow) {
      log("skip: " + reason);
      return res.status(200).json({
        ok: true,
        active: false,
        reason: reason,
        elapsed: (Date.now() - start) + "ms",
      });
    }

    // ── PHASE 2: Em janela. Chama /api/live (que faz todo o trabalho). ──
    log("ACTIVE: " + reason + " — chamando /api/live");

    // Usa dominio publico fixo (mesma estrategia de cron-update.js -> push-send).
    var host = "https://fonsecanews.com.br";
    var ctrl = new AbortController();
    var to = setTimeout(function() { ctrl.abort(); }, 25000);

    var liveData = null;
    var liveStatus = 0;
    try {
      var r = await fetch(host + "/api/live", {
        method: "GET",
        headers: { "User-Agent": "fn-cron-live/1.0" },
        signal: ctrl.signal,
      });
      clearTimeout(to);
      liveStatus = r.status;
      try { liveData = await r.json(); } catch (e) { liveData = null; }
    } catch (e) {
      clearTimeout(to);
      log("live fetch error: " + (e.name === "AbortError" ? "timeout 25s" : e.message));
    }

    var summary = {
      live: liveData && liveData.live === true,
      matchFound: liveData && liveData.matchFound === true,
      status: liveData && liveData.status,
      score: null,
    };

    // Resumo de placar pra log (se tiver)
    if (liveData && liveData.score && liveData.score.sets_won) {
      summary.score = liveData.score.sets_won.fonseca + "-" + liveData.score.sets_won.opponent + " sets";
    }

    log("done: status=" + liveStatus + " live=" + summary.live + " matchFound=" + summary.matchFound + (summary.score ? " score=" + summary.score : ""));

    return res.status(200).json({
      ok: true,
      active: true,
      reason: reason,
      liveCallStatus: liveStatus,
      summary: summary,
      elapsed: (Date.now() - start) + "ms",
    });

  } catch (e) {
    log("FATAL: " + e.message);
    return res.status(200).json({
      ok: false,
      error: e.message,
      elapsed: (Date.now() - start) + "ms",
    });
  }
}
