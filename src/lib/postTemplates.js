// postTemplates.js — gera o texto de posts (tweets) a partir dos dados reais do KV.
// Pure functions, sem efeitos colaterais. Nunca inventa dado: tudo vem dos
// objetos passados (lastMatch, nextMatch, nextTournament, ranking, recentForm).
// O usuario revisa antes de postar no X do FonsecaNews.

var SURFACE_PT = { Grass: "Grama", Clay: "Saibro", Hard: "Dura", Carpet: "Carpete" };

// Bandeiras por nome de pais em portugues (nextTournament.country vem em PT)
var FLAG_PT = {
  "Alemanha": "🇩🇪", "Holanda": "🇳🇱", "Países Baixos": "🇳🇱", "Reino Unido": "🇬🇧",
  "Inglaterra": "🇬🇧", "Espanha": "🇪🇸", "França": "🇫🇷", "Itália": "🇮🇹",
  "Estados Unidos": "🇺🇸", "EUA": "🇺🇸", "Austrália": "🇦🇺", "Canadá": "🇨🇦",
  "China": "🇨🇳", "Japão": "🇯🇵", "Suíça": "🇨🇭", "Áustria": "🇦🇹",
  "Mônaco": "🇲🇨", "Brasil": "🇧🇷", "México": "🇲🇽", "Marrocos": "🇲🇦",
};

// Forma curta da rodada pra montar frases ("nas quartas", "na final"...)
var ROUND_SHORT = {
  "Final": "na final",
  "Semifinal": "na semifinal",
  "Semifinais": "nas semifinais",
  "Quartas de final": "nas quartas de final",
  "Oitavas de final": "nas oitavas de final",
  "16avos de final": "na 3ª rodada",
  "32avos de final": "na 2ª rodada",
  "64avos de final": "na 1ª rodada",
  "1ª rodada": "na 1ª rodada",
  "2ª rodada": "na 2ª rodada",
  "3ª rodada": "na 3ª rodada",
};

function surnameOf(name) {
  if (!name) return "";
  var parts = String(name).trim().split(/\s+/);
  return parts[parts.length - 1];
}

function fmtDateBR(iso) {
  if (!iso) return "";
  var m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return "";
  return m[3] + "/" + m[2];
}

function fmtTimeBR(startTimestamp) {
  if (!startTimestamp) return "";
  try {
    var t = new Date(startTimestamp * 1000).toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit", hour12: false,
    });
    // "14:30" -> "14h30", "14:00" -> "14h"
    var mm = t.match(/(\d{2}):(\d{2})/);
    if (!mm) return "";
    return mm[2] === "00" ? mm[1] + "h" : mm[1] + "h" + mm[2];
  } catch (e) { return ""; }
}

function roundShort(round) {
  if (!round) return "";
  return ROUND_SHORT[round] || "";
}

function flagFor(country) {
  return FLAG_PT[country] || "";
}

var TAGS = "#JoãoFonseca #FonsecaNews";

// ===== Templates individuais =====

function postProximoTorneio(nt) {
  if (!nt || !nt.tournament_name || !nt.start_date) return null;
  var flag = flagFor(nt.country);
  var surf = SURFACE_PT[nt.surface] || nt.surface || "";
  var cat = nt.tournament_category ? " (" + nt.tournament_category + ")" : "";
  var lines = [];
  lines.push("📅 PRÓXIMA PARADA");
  lines.push("");
  lines.push("João Fonseca está confirmado no " + nt.tournament_name + cat + " " + (flag || "🎾"));
  lines.push("");
  lines.push("🗓️ " + fmtDateBR(nt.start_date) + " a " + fmtDateBR(nt.end_date) + (surf ? " · " + surf : ""));
  if (nt.joao_last_year) lines.push("↩️ " + nt.joao_last_year);
  lines.push("");
  lines.push("Bora, João! 🇧🇷");
  lines.push("");
  lines.push(TAGS + " #ATP");
  return { id: "torneio", label: "Próximo torneio", emoji: "📅", text: lines.join("\n") };
}

function postProximoJogo(nm) {
  if (!nm || !nm.opponent_name || nm.opponent_name === "A definir") return null;
  if (!nm.startTimestamp) return null;
  var opp = surnameOf(nm.opponent_name);
  var time = fmtTimeBR(nm.startTimestamp);
  var rnd = roundShort(nm.round);
  var lines = [];
  lines.push("🔥 É DIA DE FONSECA!");
  lines.push("");
  lines.push("🇧🇷 João Fonseca x " + opp);
  lines.push("🏆 " + nm.tournament_name + (rnd ? " · " + rnd.replace(/^n[ao]s? /, "") : ""));
  if (time) lines.push("⏰ " + time + " (Brasília)");
  if (nm.broadcast) lines.push("📺 " + nm.broadcast);
  lines.push("");
  lines.push("Bora torcer! 🇧🇷🎾");
  lines.push("");
  lines.push(TAGS);
  return { id: "jogo", label: "Próximo jogo", emoji: "🔥", text: lines.join("\n") };
}

function postResultado(lm) {
  if (!lm || !lm.finished || !lm.opponent_name) return null;
  if (lm.result !== "V" && lm.result !== "D") return null;
  var opp = surnameOf(lm.opponent_name);
  var rnd = roundShort(lm.round);
  var tour = lm.tournament_name || "";
  var lines = [];
  if (lm.result === "V") {
    lines.push("✅ VITÓRIA DE JOÃO FONSECA! 🇧🇷");
    lines.push("");
    lines.push("Fonseca " + (lm.score || "") + " " + opp);
    lines.push("📍 " + tour + (lm.round ? " · " + lm.round : ""));
    lines.push("");
    // fecho de acordo com o nivel do adversario
    if (lm.opponent_ranking && lm.opponent_ranking <= 10) lines.push("Que resultadão sobre um top 10! 🔥");
    else if (lm.opponent_ranking && lm.opponent_ranking <= 30) lines.push("Mais um grande resultado! 🔥");
    else lines.push("Segue o jogo! 💪");
  } else {
    lines.push("João Fonseca foi superado por " + opp + " (" + (lm.score || "") + ")" + (rnd ? " " + rnd : "") + (tour ? " de " + tour + "." : "."));
    lines.push("");
    lines.push("Cabeça erguida — o caminho é longo e promissor. 💪🇧🇷");
  }
  lines.push("");
  lines.push(TAGS);
  return { id: "resultado", label: lm.result === "V" ? "Resultado (vitória)" : "Resultado (derrota)", emoji: lm.result === "V" ? "✅" : "🎾", text: lines.join("\n") };
}

function postCampanha(lm, recentForm) {
  if (!lm || !lm.tournament_name || !Array.isArray(recentForm)) return null;
  var tour = lm.tournament_name;
  var wins = recentForm.filter(function (m) {
    return m && m.tournament === tour && (m.result || "").toUpperCase() === "V";
  });
  if (wins.length < 2) return null;
  var lines = [];
  lines.push("👏 QUE CAMPANHA, JOÃO!");
  lines.push("");
  lines.push("No " + tour + ", Fonseca venceu:");
  // mais antigo primeiro fica melhor cronologicamente (recentForm vem do mais novo)
  var ordered = wins.slice().reverse().slice(0, 5);
  ordered.forEach(function (m) {
    var s = surnameOf(m.opponent_name);
    var note = "";
    if (s === "Djokovic") note = " 🐐";
    else if (m.opponent_ranking && m.opponent_ranking <= 10) note = " (top 10)";
    else if (m.opponent_ranking && m.opponent_ranking <= 20) note = " (top 20)";
    lines.push("✅ " + s + note);
  });
  lines.push("");
  if (lm.result === "D") lines.push("Parou " + (roundShort(lm.round) || "no caminho") + ", mas o Brasil se orgulha! 🇧🇷");
  else lines.push("O Brasil se orgulha! 🇧🇷");
  lines.push("");
  lines.push(TAGS);
  return { id: "campanha", label: "Retrospectiva da campanha", emoji: "👏", text: lines.join("\n") };
}

function postRanking(ranking) {
  if (!ranking || !ranking.ranking) return null;
  var lines = [];
  lines.push("📊 RANKING ATP");
  lines.push("");
  lines.push("João Fonseca está em #" + ranking.ranking + " no mundo.");
  if (ranking.bestRanking && ranking.bestRanking < ranking.ranking) {
    lines.push("🏔️ Melhor da carreira: #" + ranking.bestRanking);
  }
  lines.push("");
  lines.push("O futuro do tênis brasileiro segue subindo! 📈🇧🇷");
  lines.push("");
  lines.push(TAGS + " #ATP");
  return { id: "ranking", label: "Ranking", emoji: "📊", text: lines.join("\n") };
}

// ===== Builder principal =====
// Retorna array de posts relevantes pro estado atual, em ordem de prioridade.
export function buildPosts(data) {
  data = data || {};
  var out = [];
  var add = function (p) { if (p) out.push(p); };

  add(postProximoTorneio(data.nextTournament));
  add(postProximoJogo(data.nextMatch));
  add(postResultado(data.lastMatch));
  add(postCampanha(data.lastMatch, data.recentForm));
  add(postRanking(data.ranking));

  // anexa contagem de caracteres (limite X = 280)
  out.forEach(function (p) { p.chars = p.text.length; });
  return out;
}

export var _helpers = { surnameOf: surnameOf, fmtDateBR: fmtDateBR, fmtTimeBR: fmtTimeBR };
