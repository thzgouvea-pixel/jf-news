// src/lib/matchContext.js
// Classifica o "momento" baseado em nextMatch + lastMatch.
// Cron/UI/health consultam pra decidir cadencia, gates de Gemini, e exibir status.
//
// Estados:
//   live       — jogo em andamento agora
//   pre        — nm com startTimestamp nos proximos ~24h
//   post       — lm terminou ha ate ~28h (cobre jogos longos + processamento)
//   tournament — nm existe mas comeca em mais de 24h (entre rodadas / torneio
//                proximo confirmado)
//   idle       — sem nm relevante nem lm recente; Joao descansando
//
// Tem como objetivo unificar duas coisas:
//   (a) Quando o cron deve gastar Gemini agressivamente vs poupar.
//   (b) Quao "fresco" o dado precisa estar pra ser mostrado com confianca.

var HOUR_MS = 3600 * 1000;
var DAY_MS = 86400 * 1000;

export function getMatchContext(args) {
  args = args || {};
  var now = args.now || Date.now();
  var nm = args.nextMatch || null;
  var lm = args.lastMatch || null;

  // 1) LIVE — status confirmado ou esta dentro de uma janela razoavel apos startTimestamp
  if (nm && nm.liveStatus) {
    var s = String(nm.liveStatus).toLowerCase();
    if (s === "inprogress" || s === "in_progress" || s === "live" || s === "started") {
      return { kind: "live" };
    }
  }
  if (nm && nm.startTimestamp) {
    var startMs = nm.startTimestamp * 1000;
    var afterStart = now - startMs;
    if (afterStart >= 0 && afterStart <= 6 * HOUR_MS) {
      return { kind: "live", sinceMs: afterStart };
    }
  }

  // 2) PRE — proximos 24h
  if (nm && nm.startTimestamp) {
    var untilMs = nm.startTimestamp * 1000 - now;
    if (untilMs > 0 && untilMs <= 24 * HOUR_MS) {
      return { kind: "pre", untilMs: untilMs };
    }
  }

  // 3) POST — ultimo jogo nas ultimas ~28h
  if (lm && lm.finished && lm.startTimestamp) {
    var sinceLm = now - lm.startTimestamp * 1000;
    if (sinceLm > 0 && sinceLm < 28 * HOUR_MS) {
      return { kind: "post", sinceMs: sinceLm };
    }
  }

  // 4) TOURNAMENT — nm existe com data mais distante (proximo torneio em ate 7 dias)
  //    Ou placeholder (sem horario ainda mas Joao esta inscrito)
  if (nm && nm.startTimestamp) {
    var dUntil = nm.startTimestamp * 1000 - now;
    if (dUntil > 0 && dUntil <= 7 * DAY_MS) {
      return { kind: "tournament", untilMs: dUntil };
    }
  }
  if (nm && !nm.startTimestamp && nm.opponent_name && nm.opponent_name !== "A definir") {
    return { kind: "tournament" };
  }

  // 5) IDLE
  return { kind: "idle" };
}

// Quao "velho" um dado pode estar e ainda ser confiavel em cada contexto.
// Em ms. Se o KV tem updatedAt mais antigo que isso, o /api/health marca "stale".
//
// Estrategia: durante a pre-partida e durante a partida, dados visiveis no
// "Proximo Jogo" precisam estar SUPER frescos. Em contextos frios, sao quase
// dados-de-arquivo, podem ter horas.
export var FRESHNESS_BUDGET = {
  "fn:nextMatch":            { live: 5 * HOUR_MS,  pre: 1 * HOUR_MS,  post: 2 * HOUR_MS, tournament: 6 * HOUR_MS, idle: 24 * HOUR_MS },
  "fn:lastMatch":            { live: 1 * HOUR_MS,  pre: 6 * HOUR_MS,  post: 1 * HOUR_MS, tournament: 24 * HOUR_MS, idle: 7 * DAY_MS },
  "fn:matchStats":           { live: 30 * 60 * 1000, pre: 24 * HOUR_MS, post: 1 * HOUR_MS, tournament: 24 * HOUR_MS, idle: 7 * DAY_MS },
  "fn:opponentProfile":      { live: 6 * HOUR_MS,  pre: 6 * HOUR_MS,  post: 24 * HOUR_MS, tournament: 24 * HOUR_MS, idle: 7 * DAY_MS },
  "fn:opponentSeasonStats":  { live: 24 * HOUR_MS, pre: 24 * HOUR_MS, post: 24 * HOUR_MS, tournament: 3 * DAY_MS, idle: 7 * DAY_MS },
  // pre: 12h (NAO 1h). As odds do cron so refrescam a cada ~6h; com budget de 1h
  // a probabilidade ficava "stale" e o front a escondia ~5 de cada 6 horas —
  // parecia "sumir sozinha" na pre-partida. Odds de pre-jogo sao estaveis, entao
  // 12h e seguro. live segue curto (30min) de proposito: odds ao vivo mudam
  // rapido, melhor esconder do que mostrar valor velho.
  "fn:winProb":              { live: 30 * 60 * 1000, pre: 12 * HOUR_MS, post: 6 * HOUR_MS, tournament: 24 * HOUR_MS, idle: 24 * HOUR_MS },
  "fn:ranking":              { live: 24 * HOUR_MS, pre: 24 * HOUR_MS, post: 12 * HOUR_MS, tournament: 24 * HOUR_MS, idle: 3 * DAY_MS },
  "fn:atpRankings":          { live: 7 * DAY_MS,   pre: 7 * DAY_MS,   post: 7 * DAY_MS,   tournament: 7 * DAY_MS,    idle: 14 * DAY_MS },
  "fn:nextTournament":       { live: 24 * HOUR_MS, pre: 24 * HOUR_MS, post: 6 * HOUR_MS, tournament: 24 * HOUR_MS, idle: 3 * DAY_MS },
  "fn:h2h":                  { live: 24 * HOUR_MS, pre: 24 * HOUR_MS, post: 24 * HOUR_MS, tournament: 7 * DAY_MS, idle: 14 * DAY_MS },
  "fn:recentForm":           { live: 6 * HOUR_MS,  pre: 12 * HOUR_MS, post: 1 * HOUR_MS, tournament: 24 * HOUR_MS, idle: 7 * DAY_MS },
};
