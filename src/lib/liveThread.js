// src/lib/liveThread.js
// Deteccao de eventos da partida ao vivo a partir do diff de snapshots.
// Zero chamadas externas, zero Gemini — templates puros baseados em logica de tenis.
//
// USO:
//   var ret = detectEvents(prev, cur, { bestOf: 5, opponentName: "Ruud" });
//   ret.events  -> array de eventos novos pra anexar no fn:liveThread
//   ret.snapshot -> novo estado a gravar em fn:liveSnapshot (substitui prev)
//
// EVENTOS GERADOS (V1):
//   match_start, set_won_f, set_won_o, match_won_f, match_won_o,
//   break_f, break_o
//
// REGRAS DE TENIS RESPEITADAS:
//  - Grand Slam masculino e melhor-de-5 (3 sets pra vencer); demais sao melhor-de-3.
//  - Break = receptor vence o game; detectado quando prev.serving era do outro lado.
//  - Set won detectado pelo incremento em sets_won; texto inclui placar final do set.
//
// LIMITACOES CONHECIDAS (V1):
//  - Nao detecta tiebreak especificamente (set_won ja cobre o fim do TB).
//  - Se a janela de poll perdeu varios games, registra so o set won, nao games intermediarios.

var ORDINAL_PT = ["", "1º", "2º", "3º", "4º", "5º"];
function ordinalSet(n) { return ORDINAL_PT[n] || (n + "º"); }

// Snapshot vazio inicial — formato que sai daqui e que entra no detectEvents.
export function emptySnapshot() {
  return {
    sets_won: { fonseca: 0, opponent: 0 },
    fSets: [],
    oSets: [],
    serving: "",
    live: false,
    status: "",
    matchId: null,
  };
}

// Compara prev (snapshot anterior) e cur (estado novo de /api/live) e retorna
// {events, snapshot}. Eventos vem com .ts em ISO; .kind classifica o tipo.
export function detectEvents(prev, cur, opts) {
  opts = opts || {};
  var fonseca = opts.fonsecaName || "Fonseca";
  var opp = opts.opponentName || "Adversário";
  var oppShort = opp.split(" ").pop();
  var bestOf = opts.bestOf === 5 ? 5 : 3;
  var setsNeeded = bestOf === 5 ? 3 : 2;

  if (!prev) prev = emptySnapshot();
  var events = [];

  var curSetsF = (cur && cur.sets_won && cur.sets_won.fonseca) || 0;
  var curSetsO = (cur && cur.sets_won && cur.sets_won.opponent) || 0;
  var prevSetsF = (prev.sets_won && prev.sets_won.fonseca) || 0;
  var prevSetsO = (prev.sets_won && prev.sets_won.opponent) || 0;
  var curFSets = (cur && cur.fSets) || [];
  var curOSets = (cur && cur.oSets) || [];
  var prevFSets = prev.fSets || [];
  var prevOSets = prev.oSets || [];

  // 1) MATCH_START — primeiro tick em que o jogo aparece live (ou primeiro tick com placar)
  var becameLive = !prev.live && cur && cur.live === true;
  var firstTickWithState = !prev.matchId && cur && cur.matchId &&
    (curSetsF > 0 || curSetsO > 0 || curFSets.length > 0);
  if (becameLive || firstTickWithState) {
    events.push({
      kind: "match_start",
      text: "🎾 Jogo começou: " + fonseca + " x " + oppShort,
    });
  }

  // 2) SET_WON — sets_won incrementou para algum lado. Usa o indice do set que acabou
  //    de fechar para puxar o placar de games. Pode acontecer junto do match_won.
  function placarDoSetFechado(idx) {
    // Prefere o cur (que ja tem o placar final do set fechado) sobre o prev
    // (que tinha o placar de antes da ultima bola). Fallback pro prev so se cur
    // ainda nao tiver o indice (caso raro: set fechou e cur ainda nao registrou).
    var fg = curFSets[idx];
    var og = curOSets[idx];
    if (fg === undefined || og === undefined) { fg = prevFSets[idx]; og = prevOSets[idx]; }
    if (fg === undefined || og === undefined) return null;
    return fg + "-" + og;
  }
  if (curSetsF > prevSetsF) {
    var idxF = prevSetsF + prevSetsO; // set que fechou
    var scoreF = placarDoSetFechado(idxF);
    events.push({
      kind: "set_won_f",
      text: "🏆 " + fonseca + " leva o " + ordinalSet(idxF + 1) + " set" +
        (scoreF ? " " + scoreF : "") + "!",
      score: scoreF,
    });
  }
  if (curSetsO > prevSetsO) {
    var idxO = prevSetsF + prevSetsO;
    var scoreO = placarDoSetFechado(idxO);
    events.push({
      kind: "set_won_o",
      text: "✖️ " + oppShort + " leva o " + ordinalSet(idxO + 1) + " set" +
        (scoreO ? " " + scoreO : "") + ".",
      score: scoreO,
    });
  }

  // 3) MATCH_WON — algum lado bateu o numero de sets necessario
  if (curSetsF >= setsNeeded && prevSetsF < setsNeeded) {
    events.push({
      kind: "match_won_f",
      text: "🎉 VITÓRIA! " + fonseca + " vence " + curSetsF + "-" + curSetsO + ".",
    });
  } else if (curSetsO >= setsNeeded && prevSetsO < setsNeeded) {
    events.push({
      kind: "match_won_o",
      text: "💔 Derrota. " + fonseca + " perde " + curSetsF + "-" + curSetsO + ".",
    });
  }

  // 4) BREAK — game contou +1 pro receptor (so quando set/jogo nao avancou na mesma rodada
  //    pra evitar ruido de transicao). prev.serving == oponente => Fonseca quebrou.
  var sameSets = curSetsF === prevSetsF && curSetsO === prevSetsO;
  if (sameSets && curFSets.length === prevFSets.length && curFSets.length > 0) {
    var i = curFSets.length - 1;
    var pFg = prevFSets[i] || 0, pOg = prevOSets[i] || 0;
    var cFg = curFSets[i] || 0, cOg = curOSets[i] || 0;
    var fDelta = cFg - pFg, oDelta = cOg - pOg;
    if (fDelta === 1 && oDelta === 0 && prev.serving === "opponent") {
      events.push({
        kind: "break_f",
        text: "⚡ Break para " + fonseca + "! " + cFg + "-" + cOg + " no " + ordinalSet(i + 1) + " set.",
      });
    } else if (oDelta === 1 && fDelta === 0 && prev.serving === "fonseca") {
      events.push({
        kind: "break_o",
        text: "⚠️ Break do " + oppShort + ". " + cFg + "-" + cOg + " no " + ordinalSet(i + 1) + " set.",
      });
    }
  }

  // Estampa o timestamp em todos os eventos
  var nowIso = new Date().toISOString();
  events.forEach(function (ev) { ev.ts = nowIso; });

  // Novo snapshot a salvar (substitui o prev)
  var snapshot = {
    sets_won: { fonseca: curSetsF, opponent: curSetsO },
    fSets: curFSets.slice(),
    oSets: curOSets.slice(),
    serving: (cur && cur.serving) || "",
    live: !!(cur && cur.live),
    status: (cur && cur.status) || "",
    matchId: (cur && cur.matchId) || prev.matchId || null,
  };

  return { events: events, snapshot: snapshot };
}

// Eventos que merecem push notification. So set_won — match_start/match_won o
// cron-update ja cobre via tag "live"/"result"; duplicar geraria dois pushes pro
// mesmo evento. Break nao entra (spam durante o jogo). Os demais ficam so no feed.
export var PUSH_EVENT_KINDS = {
  set_won_f: 1, set_won_o: 1,
};
