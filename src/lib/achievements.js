// achievements.js — automatiza a lista de Conquistas (titulos do Joao).
//
// Estrutura unica (fn:achievements no KV): array de itens, cada um com:
//   id          — chave estavel pra dedup (lm.id quando vem do cron, "manual:<slug>" pro seed)
//   t           — titulo do torneio (ex.: "ATP 500 Basel")
//   d           — data curta (ex.: "Out 2025")
//   det         — linha de detalhe (ex.: "vs Davidovich Fokina · 6-3 6-4")
//   note        — nota especial opcional (ex.: "1º brasileiro a ganhar ATP 500")
//   category    — "Singles" | "Duplas" | "NextGen" | "Challenger" | "Slam"
//                 (usado pra agrupar no modal; mantem a hierarquia original)
//   dateISO     — pra ordenacao (string ISO ou null)
//   source      — "auto" (cron detectou) | "manual" (seed/admin)
//
// O seed cobre os titulos atuais do Joao. O cron adiciona automatico quando
// detecta lm.result==="V" + lm.round==="Final" + categoria conhecida.
//
// PRINCIPIO: o seed e a fonte da verdade da historia; o cron acrescenta. Itens
// "manual" tem prioridade visual via 'note' (curadoria). Itens "auto" entram
// como Singles factuais (sem nota; o admin pode adicionar depois).

export var SEED_ACHIEVEMENTS = [
  {
    id: "manual:atp500-basel-2025",
    category: "Singles", t: "ATP 500 Basel", d: "Out 2025",
    det: "vs Davidovich Fokina · 6-3 6-4", note: "1º brasileiro a ganhar ATP 500",
    dateISO: "2025-10-26", source: "manual",
  },
  {
    id: "manual:atp250-ba-2025",
    category: "Singles", t: "ATP 250 Buenos Aires", d: "Fev 2025",
    det: "vs Cerúndolo · 6-4 7-6(1)", note: "Brasileiro mais jovem a ganhar ATP",
    dateISO: "2025-02-16", source: "manual",
  },
  {
    id: "manual:rio-open-duplas-2026",
    category: "Duplas", t: "Rio Open 500", d: "Fev 2026",
    det: "Duplas · Rio de Janeiro", note: null,
    dateISO: "2026-02-22", source: "manual",
  },
  {
    id: "manual:nextgen-2024",
    category: "NextGen", t: "Campeão invicto", d: "Dez 2024",
    det: "5 vitórias, 0 derrotas · Jeddah", note: "1º sul-americano campeão do NextGen Finals",
    dateISO: "2024-12-21", source: "manual",
  },
  {
    id: "manual:challenger-phoenix-2025",
    category: "Challenger", t: "Phoenix Challenger", d: "Mar 2025",
    det: "vs Bublik", note: null,
    dateISO: "2025-03-16", source: "manual",
  },
  {
    id: "manual:challenger-canberra-2025",
    category: "Challenger", t: "Canberra International", d: "Jan 2025",
    det: "vs Quinn · sem perder sets", note: null,
    dateISO: "2025-01-12", source: "manual",
  },
  {
    id: "manual:challenger-lexington-2024",
    category: "Challenger", t: "Lexington Challenger", d: "Ago 2024",
    det: "Mais jovem campeão Challenger de 2024", note: null,
    dateISO: "2024-08-18", source: "manual",
  },
];

var MESES_PT = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

function surnameOf(name) {
  if (!name) return "";
  var p = String(name).trim().split(/\s+/);
  return p[p.length - 1];
}

function shortDate(iso) {
  if (!iso) return "";
  var d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return MESES_PT[d.getUTCMonth()] + " " + d.getUTCFullYear();
}

// Classifica o torneio pra agrupar no modal. So categorias REAIS de torneio ATP,
// e nada mais. Se nao bate, retorna null (cron ignora — nao polui a lista).
export function classifyTournament(category, name) {
  var c = String(category || "").toLowerCase();
  var n = String(name || "").toLowerCase();
  if (c.indexOf("grand slam") !== -1 || c === "slam") return "Slam";
  if (c.indexOf("masters 1000") !== -1 || c.indexOf("masters") !== -1) return "Singles"; // Masters entra em Singles
  if (c.indexOf("atp 500") !== -1 || c.indexOf("atp 250") !== -1 || c === "atp") return "Singles";
  if (c.indexOf("challenger") !== -1 || n.indexOf("challenger") !== -1) return "Challenger";
  // ITF, Futures, exibicoes — nao entram
  return null;
}

// Constroi uma entrada de conquista a partir de um lm (lastMatch) que foi
// FINAL ganha. Retorna null se o lm nao qualifica (categoria fora ou dado faltando).
export function buildAchievementFromMatch(lm) {
  if (!lm || lm.result !== "V" || !lm.finished) return null;
  var round = String(lm.round || "").toLowerCase();
  if (round !== "final" && round !== "final do torneio") return null;
  if (!lm.tournament_name) return null;
  var cat = classifyTournament(lm.tournament_category, lm.tournament_name);
  if (!cat) return null;
  var prefix = lm.tournament_category ? lm.tournament_category + " " : "";
  return {
    id: "auto:" + (lm.id || (lm.tournament_name + "|" + (lm.date || ""))),
    category: cat,
    t: prefix + lm.tournament_name,
    d: shortDate(lm.date),
    det: lm.opponent_name ? ("vs " + surnameOf(lm.opponent_name) + (lm.score ? " · " + lm.score : "")) : (lm.score || ""),
    note: null,
    dateISO: lm.date || null,
    source: "auto",
  };
}

// Junta a lista existente do KV com uma possivel nova conquista (do lm atual).
// Idempotente: nao duplica pelo id. Se a entrada ja existe, preserva (nao
// sobrescreve) — admins podem ter editado a nota.
// Retorna { list, added } pra cron logar quando teve titulo novo.
export function mergeAchievement(stored, candidate) {
  var list = Array.isArray(stored) ? stored.slice() : [];
  if (!candidate || !candidate.id) return { list: list, added: false };
  for (var i = 0; i < list.length; i++) {
    if (list[i] && list[i].id === candidate.id) return { list: list, added: false };
  }
  list.push(candidate);
  return { list: list, added: true };
}

// Garante que o seed esteja presente (cron faz isso uma vez na primeira execucao).
// Adiciona apenas os ids do seed que nao estao no KV.
export function ensureSeed(stored) {
  var list = Array.isArray(stored) ? stored.slice() : [];
  var seen = {};
  list.forEach(function (a) { if (a && a.id) seen[a.id] = true; });
  var added = 0;
  SEED_ACHIEVEMENTS.forEach(function (s) {
    if (!seen[s.id]) { list.push(s); added++; }
  });
  return { list: list, added: added };
}

// Ordena pra exibicao: mais recente primeiro (por dateISO).
export function sortForDisplay(list) {
  return (list || []).slice().sort(function (a, b) {
    var da = a && a.dateISO ? new Date(a.dateISO).getTime() : 0;
    var db = b && b.dateISO ? new Date(b.dateISO).getTime() : 0;
    return db - da;
  });
}

// Agrupa pra renderizar no modal (mantendo a estrutura visual original).
export function groupForModal(list) {
  var sorted = sortForDisplay(list);
  return {
    Slam:       sorted.filter(function (a) { return a.category === "Slam"; }),
    Singles:    sorted.filter(function (a) { return a.category === "Singles"; }),
    Duplas:     sorted.filter(function (a) { return a.category === "Duplas"; }),
    NextGen:    sorted.filter(function (a) { return a.category === "NextGen"; }),
    Challenger: sorted.filter(function (a) { return a.category === "Challenger"; }),
  };
}
