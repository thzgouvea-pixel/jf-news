// v12 breathing-revolution
import { useState, useEffect, useRef } from "react";

const ACCENT = "#00A859";
const ACCENT_YELLOW = "#FFCB05";
const ACCENT_LIGHT = "#E8F8F0";
const BG = "#FAFAFA";
const BG_WHITE = "#FFFFFF";
const TEXT_PRIMARY = "#1A1A1A";
const TEXT_SECONDARY = "#5A5A5A";
const TEXT_DIM = "#999";
const BORDER = "#EBEBEB";
const GREEN = "#00A859";
const RED = "#E63946";
const YELLOW = "#FFCB05";

const CACHE_DURATION_MS = 30 * 60 * 1000;
const surfaceEmoji = { "Saibro": "🟠", "Hard": "🔵", "Dura": "🔵", "Grama": "🟢" };
const surfaceColorMap = { "Saibro": "#E8734A", "Hard": "#3B82F6", "Dura": "#3B82F6", "Grama": "#22C55E" };

const JF_QUOTES = [
  "Os pequenos detalhes fazem a diferença.",
  "Mantenho o foco e uma atitude positiva enquanto sigo evoluindo.",
  "Eu sabia que podia competir nesse nível.",
  "Cada torneio é uma oportunidade de aprender.",
  "O trabalho duro não mente.",
  "Estou evoluindo a cada torneio.",
  "Quero fazer história pelo Brasil.",
  "A pressão é um privilégio.",
];

var SAMPLE_PLAYER = { ranking: 59, rankingChange: "+4" };
var SAMPLE_SEASON = { wins: 14, losses: 5, titles: 3, year: 2026 };
var SAMPLE_LAST_MATCH = { result: "V", score: "6-3 6-4", opponent: "T. Nakashima", tournament: "Indian Wells", round: "R2" };
var SAMPLE_NEXT_MATCH = { tournament_category: "Masters 1000", tournament_name: "Monte Carlo Masters", surface: "Saibro", city: "Monte Carlo", country: "Mônaco", date: "2026-04-04T12:00:00Z", round: "" };
var SAMPLE_NEWS = [
  { title: "João Fonseca confirma presença no ATP 500 de Barcelona", summary: "O tenista brasileiro confirmou participação no torneio espanhol de saibro.", source: "ESPN Brasil", url: "https://www.espn.com.br/tenis/", date: new Date(Date.now() - 2 * 3600000).toISOString(), category: "Torneio" },
  { title: "Fonseca sobe para 59º no ranking da ATP", summary: "Campanha até as oitavas em Indian Wells rende posições ao carioca.", source: "UOL Esporte", url: "https://www.uol.com.br/esporte/tenis/", date: new Date(Date.now() - 8 * 3600000).toISOString(), category: "Ranking" },
  { title: "\"Estou evoluindo a cada torneio\", diz Fonseca", summary: "Brasileiro elogiou próprio desempenho após derrota para o nº1.", source: "GE", url: "https://ge.globo.com/tenis/", date: new Date(Date.now() - 18 * 3600000).toISOString(), category: "Declaração" },
  { title: "Fonseca treina no Rio visando saibro", summary: "Preparação física e ajustes no saque com equipe técnica.", source: "O Globo", url: "https://oglobo.globo.com/esportes/", date: new Date(Date.now() - 36 * 3600000).toISOString(), category: "Treino" },
  { title: "Fonseca vence em sets diretos em Miami", summary: "Parciais de 6-3, 6-4 garantiram vaga na chave principal.", source: "Tênis Brasil", url: "https://tenisbrasil.uol.com.br/", date: new Date(Date.now() - 52 * 3600000).toISOString(), category: "Resultado" },
  { title: "Nike renova com Fonseca até 2028", summary: "Marca americana amplia acordo apostando no potencial do brasileiro.", source: "Folha de S. Paulo", url: "https://www.folha.uol.com.br/esporte/", date: new Date(Date.now() - 72 * 3600000).toISOString(), category: "Notícia" },
  { title: "Técnico revela plano para restante da temporada", summary: "Prioridade: Masters 1000 de saibro e Roland Garros.", source: "ESPN Brasil", url: "https://www.espn.com.br/tenis/", date: new Date(Date.now() - 96 * 3600000).toISOString(), category: "Notícia" },
];

var formatTimeAgo = function(d) { if (!d) return ""; try { var m = Math.floor((new Date() - new Date(d)) / 60000); if (m < 1) return "agora"; if (m < 60) return "há " + m + " min"; var h = Math.floor(m / 60); if (h < 24) return "há " + h + "h"; var dd = Math.floor(h / 24); if (dd === 1) return "ontem"; if (dd < 7) return "há " + dd + " dias"; return new Date(d).toLocaleDateString("pt-BR", { day: "numeric", month: "short" }); } catch(e) { return ""; } };
var formatMinLeft = function(ms) { var m = Math.max(0, Math.ceil(ms / 60000)); return m === 0 ? "agora" : m + " min"; };
var formatMatchDate = function(d) { if (!d) return "Sem data confirmada"; try { var dt = new Date(d); return isNaN(dt.getTime()) ? d : dt.toLocaleDateString("pt-BR", { day: "numeric", month: "long" }); } catch(e) { return d; } };

var detectDevice = function() {
  if (typeof window === "undefined") return "unknown";
  var ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  return "desktop";
};

var catCfg = {
  "Torneio": { color: "#E63946", bg: "#FEF0F0" }, "Treino": { color: "#2A9D8F", bg: "#EDF8F6" },
  "Declaração": { color: "#E9A820", bg: "#FDF6E3" }, "Resultado": { color: "#0066FF", bg: "#E8F0FE" },
  "Ranking": { color: "#7C3AED", bg: "#F3EEFF" }, "Notícia": { color: "#5A5A5A", bg: "#F3F3F3" },
};

// ===== COUNTDOWN HOOK =====
function useCountdown(targetDate) {
  var _s = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
  var countdown = _s[0]; var setCountdown = _s[1];
  useEffect(function() {
    if (!targetDate) return;
    function calc() {
      var now = new Date().getTime();
      var target = new Date(targetDate).getTime();
      var diff = target - now;
      if (diff <= 0) { setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true }); return; }
      setCountdown({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
        expired: false
      });
    }
    calc();
    var iv = setInterval(calc, 1000);
    return function() { clearInterval(iv); };
  }, [targetDate]);
  return countdown;
}

// ===== INLINE INFO BARS =====
var SeasonBar = function(props) {
  var season = props.season;
  if (!season) return null;
  var pct = season.wins + season.losses > 0 ? Math.round((season.wins / (season.wins + season.losses)) * 100) : 0;
  return (
    <div style={{ padding: "12px 24px", background: "#F8F9FA", borderBottom: "1px solid " + BORDER, display: "flex", alignItems: "center", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
      <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: TEXT_DIM, fontFamily: "'Inter', -apple-system, sans-serif" }}>Temporada {season.year}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: GREEN, fontFamily: "'Inter', -apple-system, sans-serif" }}>{season.wins}V</span>
      <span style={{ fontSize: 10, color: TEXT_DIM }}>·</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: RED, fontFamily: "'Inter', -apple-system, sans-serif" }}>{season.losses}D</span>
      <span style={{ fontSize: 10.5, color: TEXT_DIM, fontFamily: "'Inter', -apple-system, sans-serif" }}>({pct}%)</span>
      {season.titles > 0 && (<>
        <span style={{ fontSize: 10, color: TEXT_DIM }}>·</span>
        <span style={{ fontSize: 12, fontFamily: "'Inter', -apple-system, sans-serif" }}>🏆 <span style={{ fontWeight: 700, color: "#E9A820" }}>{season.titles}</span></span>
      </>)}
    </div>
  );
};

var LastMatchBar = function(props) {
  var match = props.match;
  if (!match) return null;
  var w = match.result === "V";
  return (
    <div style={{ padding: "12px 24px", background: w ? "#F7FDFA" : "#FFFAFA", borderBottom: "1px solid " + BORDER, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
      <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: TEXT_DIM, fontFamily: "'Inter', -apple-system, sans-serif" }}>Última partida</span>
      <span style={{ fontSize: 10, fontWeight: 700, color: w ? GREEN : RED, fontFamily: "'Inter', -apple-system, sans-serif", background: w ? "#EAFAF3" : "#FEF0F0", padding: "1px 6px", borderRadius: 3 }}>{w ? "V" : "D"}</span>
      <span style={{ fontSize: 12.5, fontWeight: 700, color: TEXT_PRIMARY, fontFamily: "'Source Serif 4', Georgia, serif" }}>Fonseca <span style={{ color: w ? GREEN : RED }}>{match.score}</span> {match.opponent}</span>
      <span style={{ fontSize: 10.5, color: TEXT_DIM, fontFamily: "'Inter', -apple-system, sans-serif" }}>{match.tournament}{match.round ? (" · " + match.round) : ""}</span>
    </div>
  );
};

// ===== RANKING EVOLUTION CHART =====
var RankingChart = function(props) {
  var currentRanking = props.currentRanking || 39;
  // Historical data points: [month_label, ranking, event_label]
  var data = [
    { month: "Dez/24", rank: 145, label: "NextGen Champion" },
    { month: "Jan/25", rank: 113, label: "Canberra" },
    { month: "Fev/25", rank: 68, label: "1º título ATP" },
    { month: "Mar/25", rank: 55, label: "Phoenix" },
    { month: "Mai/25", rank: 49, label: "" },
    { month: "Jul/25", rank: 42, label: "Wimbledon R3" },
    { month: "Ago/25", rank: 35, label: "Top 40" },
    { month: "Out/25", rank: 24, label: "Basel 500 🏆" },
    { month: "Jan/26", rank: 29, label: "" },
    { month: "Mar/26", rank: currentRanking, label: "Atual" },
  ];

  // Chart dimensions
  var W = 600;
  var H = 260;
  var padL = 45;
  var padR = 20;
  var padT = 30;
  var padB = 50;
  var chartW = W - padL - padR;
  var chartH = H - padT - padB;

  // Scale: ranking goes from high number (bad) to low (good), so invert Y
  var maxRank = 160;
  var minRank = 10;
  var rankRange = maxRank - minRank;

  var getX = function(i) { return padL + (i / (data.length - 1)) * chartW; };
  var getY = function(rank) { return padT + ((rank - minRank) / rankRange) * chartH; };

  // Build SVG path
  var points = data.map(function(d, i) { return getX(i) + "," + getY(d.rank); });
  var linePath = "M" + points.join("L");

  // Area path (fill under line)
  var areaPath = linePath + "L" + getX(data.length - 1) + "," + (padT + chartH) + "L" + padL + "," + (padT + chartH) + "Z";

  // Y axis labels
  var yLabels = [20, 50, 100, 150];

  return (
    <div style={{ padding: "20px 16px", overflowX: "auto" }}>
      <svg viewBox={"0 0 " + W + " " + H} style={{ width: "100%", maxWidth: W, height: "auto" }}>
        {/* Grid lines */}
        {yLabels.map(function(rank) {
          var y = getY(rank);
          return (
            <g key={rank}>
              <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#EBEBEB" strokeWidth="1" />
              <text x={padL - 8} y={y + 4} textAnchor="end" fill="#999" fontSize="9" fontFamily="Inter, sans-serif">{"#" + rank}</text>
            </g>
          );
        })}

        {/* Area fill */}
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00A859" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#00A859" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#areaGrad)" />

        {/* Line */}
        <path d={linePath} fill="none" stroke="#00A859" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points */}
        {data.map(function(d, i) {
          var x = getX(i);
          var y = getY(d.rank);
          var isLast = i === data.length - 1;
          var isBest = d.rank === Math.min.apply(null, data.map(function(p) { return p.rank; }));
          return (
            <g key={i}>
              {/* Dot */}
              <circle cx={x} cy={y} r={isLast ? 5 : (d.label ? 4 : 3)} fill={isLast ? "#FFCB05" : (isBest ? "#00A859" : "#fff")} stroke={isLast ? "#FFCB05" : "#00A859"} strokeWidth="2" />
              {/* Rank number */}
              {(d.label || isLast) && (
                <text x={x} y={y - 12} textAnchor="middle" fill={isLast ? "#FFCB05" : "#00A859"} fontSize="10" fontWeight="800" fontFamily="Inter, sans-serif">{"#" + d.rank}</text>
              )}
              {/* Event label */}
              {d.label && (
                <text x={x} y={y - 22} textAnchor="middle" fill="#666" fontSize="7.5" fontFamily="Inter, sans-serif" fontWeight="600">{d.label}</text>
              )}
              {/* Month label */}
              {(i % 2 === 0 || isLast) && (
                <text x={x} y={H - padB + 18} textAnchor="middle" fill="#999" fontSize="8" fontFamily="Inter, sans-serif">{d.month}</text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Stats bar */}
      <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
        <div style={{ background: "#E8F8F0", border: "1px solid #C8E6D8", borderRadius: 8, padding: "6px 14px", textAlign: "center" }}>
          <span style={{ fontSize: 10, color: "#00A859", fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>Maior Ascensão</span>
          <span style={{ fontSize: 12, fontWeight: 800, color: "#007A3D", fontFamily: "'Inter', sans-serif", display: "block" }}>+121 posições</span>
        </div>
        <div style={{ background: "#FFF8E8", border: "1px solid #FFE8A8", borderRadius: 8, padding: "6px 14px", textAlign: "center" }}>
          <span style={{ fontSize: 10, color: "#B8860B", fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>Melhor Ranking</span>
          <span style={{ fontSize: 12, fontWeight: 800, color: "#8B6914", fontFamily: "'Inter', sans-serif", display: "block" }}>#24 ATP</span>
        </div>
        <div style={{ background: "#E8F0FE", border: "1px solid #D0DFFF", borderRadius: 8, padding: "6px 14px", textAlign: "center" }}>
          <span style={{ fontSize: 10, color: "#2A5AA0", fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>Títulos</span>
          <span style={{ fontSize: 12, fontWeight: 800, color: "#1A3A70", fontFamily: "'Inter', sans-serif", display: "block" }}>🏆 2 ATP Tour</span>
        </div>
      </div>
    </div>
  );
};

// ===== DAILY POLL =====
var DailyPoll = function() {
  var now = new Date();
  var today = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");
  var pollKey = "fn_poll_" + today;
  var _v = useState(function() { try { return localStorage.getItem(pollKey); } catch(e) { return null; } });
  var vote = _v[0]; var setVote = _v[1];
  var _r = useState(function() { try { var d = JSON.parse(localStorage.getItem(pollKey + "_r") || "null"); return d; } catch(e) { return null; } });
  var results = _r[0]; var setResults = _r[1];

  // Poll question changes daily based on LOCAL date
  var polls = [
    { q: "João vence o primeiro jogo em Monte Carlo?", a: "Sim", b: "Não" },
    { q: "João chega ao Top 30 até o fim de 2026?", a: "Com certeza", b: "Difícil" },
    { q: "João vai ganhar um Masters 1000 na carreira?", a: "Sim!", b: "Ainda não" },
    { q: "Quem terá o melhor 2026: João ou Tien?", a: "João 🇧🇷", b: "Tien 🇺🇸" },
    { q: "João chega às quartas em Roland Garros?", a: "Vai sim!", b: "Ainda cedo" },
    { q: "João pode ser Top 10 até 2027?", a: "Claro!", b: "Precisa de tempo" },
    { q: "Quem é mais talentoso: João ou Alcaraz aos 19?", a: "João 🇧🇷", b: "Alcaraz 🇪🇸" },
    { q: "João será top 5 antes dos 21 anos?", a: "Sem dúvida!", b: "Muito cedo" },
    { q: "João vence Djokovic se enfrentarem?", a: "João ganha!", b: "Djoko ainda é rei" },
    { q: "O João é o melhor tenista sub-20 do mundo?", a: "É sim!", b: "Tien tá na frente" },
    { q: "João vai ganhar um Grand Slam até 2028?", a: "Com certeza!", b: "Precisa evoluir" },
    { q: "Quem tem o melhor forehand: João ou Sinner?", a: "João 🇧🇷", b: "Sinner 🇮🇹" },
    { q: "O João vai ser nº1 do mundo algum dia?", a: "Vai sim!", b: "Difícil prever" },
    { q: "Qual superfície favorita do João?", a: "Saibro 🟤", b: "Duro 🔵" },
  ];
  var dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
  var dayIdx = dayOfYear % polls.length;
  var poll = polls[dayIdx];

  var handleVote = function(choice) {
    if (vote) return;
    setVote(choice);
    try { localStorage.setItem(pollKey, choice); } catch(e) {}
    // Simulate community results (fake but fun)
    var sim = choice === "a" ? { a: 55 + Math.floor(Math.random() * 15), b: 0 } : { a: 35 + Math.floor(Math.random() * 15), b: 0 };
    sim.b = 100 - sim.a;
    setResults(sim);
    try { localStorage.setItem(pollKey + "_r", JSON.stringify(sim)); } catch(e) {}
  };

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", borderLeft: "1px solid " + BORDER, borderRight: "1px solid " + BORDER }}>
      <div style={{ padding: "12px 24px", background: "linear-gradient(135deg, #FAFDF7 0%, #F5FAF0 100%)", borderBottom: "1px solid " + BORDER }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
          <span style={{ fontSize: 13 }}>📊</span>
          <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: GREEN, fontFamily: "'Inter', sans-serif" }}>Enquete do dia</span>
        </div>
        <p style={{ margin: "0 0 10px", fontSize: 13.5, fontWeight: 700, color: TEXT_PRIMARY, fontFamily: "'Source Serif 4', Georgia, serif", lineHeight: 1.4 }}>{poll.q}</p>

        {!vote ? (
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={function() { handleVote("a"); }} style={{ flex: 1, padding: "8px", background: "#fff", border: "1.5px solid " + GREEN, borderRadius: 8, fontSize: 12, fontWeight: 700, color: GREEN, cursor: "pointer", fontFamily: "'Inter', sans-serif", transition: "all 0.2s" }}>{poll.a}</button>
            <button onClick={function() { handleVote("b"); }} style={{ flex: 1, padding: "8px", background: "#fff", border: "1.5px solid " + BORDER, borderRadius: 8, fontSize: 12, fontWeight: 700, color: TEXT_SECONDARY, cursor: "pointer", fontFamily: "'Inter', sans-serif", transition: "all 0.2s" }}>{poll.b}</button>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: vote === "a" ? GREEN : TEXT_SECONDARY, fontFamily: "'Inter', sans-serif" }}>{poll.a} {vote === "a" ? "✓" : ""}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: TEXT_DIM, fontFamily: "'Inter', sans-serif" }}>{results ? results.a : 50}%</span>
              </div>
              <div style={{ height: 4, background: "#E8E8E8", borderRadius: 2 }}>
                <div style={{ height: 4, background: GREEN, borderRadius: 2, width: (results ? results.a : 50) + "%", transition: "width 0.8s ease" }} />
              </div>
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: vote === "b" ? GREEN : TEXT_SECONDARY, fontFamily: "'Inter', sans-serif" }}>{poll.b} {vote === "b" ? "✓" : ""}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: TEXT_DIM, fontFamily: "'Inter', sans-serif" }}>{results ? results.b : 50}%</span>
              </div>
              <div style={{ height: 4, background: "#E8E8E8", borderRadius: 2 }}>
                <div style={{ height: 4, background: TEXT_DIM, borderRadius: 2, width: (results ? results.b : 50) + "%", transition: "width 0.8s ease" }} />
              </div>
            </div>
            <p style={{ margin: "6px 0 0", fontSize: 9, color: TEXT_DIM, fontFamily: "'Inter', sans-serif", textAlign: "center" }}>Nova enquete amanhã!</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ===== NEXT GEN COMPARATOR =====
var NextGenComparator = function() {
  var players = [
    { name: "J. Fonseca", country: "🇧🇷", age: 19, ranking: 39, titles: 2, bestRanking: 24, style: "Agressivo", forehand: 95, serve: 88, movement: 85, mental: 90, color: GREEN },
    { name: "L. Tien", country: "🇺🇸", age: 20, ranking: 21, titles: 1, bestRanking: 21, style: "Contra-atacante", forehand: 82, serve: 80, movement: 92, mental: 88, color: RED },
    { name: "J. Mensik", country: "🇨🇿", age: 19, ranking: 30, titles: 2, bestRanking: 30, style: "Saque e voleio", forehand: 85, serve: 94, movement: 78, mental: 82, color: "#3B82F6" },
    { name: "A. Fils", country: "🇫🇷", age: 20, ranking: 28, titles: 2, bestRanking: 20, style: "Completo", forehand: 88, serve: 86, movement: 90, mental: 84, color: "#8B5CF6" },
  ];

  var StatBar = function(p) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <span style={{ fontSize: 10, color: TEXT_DIM, fontFamily: "'Inter', sans-serif", width: 60, textAlign: "right" }}>{p.label}</span>
        <div style={{ flex: 1, height: 5, background: "#EBEBEB", borderRadius: 3 }}>
          <div style={{ height: 5, background: p.color, borderRadius: 3, width: p.value + "%", transition: "width 0.5s" }} />
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, color: p.color, fontFamily: "'Inter', sans-serif", width: 24 }}>{p.value}</span>
      </div>
    );
  };

  return (
    <div style={{ padding: "20px 16px", overflowX: "auto" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
        {players.map(function(p, i) {
          return (
            <div key={i} style={{ padding: "14px", background: i === 0 ? "#F7FDF9" : "#F8F9FA", border: "1px solid " + (i === 0 ? GREEN + "30" : BORDER), borderRadius: 14 }}>
              <div style={{ textAlign: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 20 }}>{p.country}</span>
                <p style={{ margin: "4px 0 2px", fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY, fontFamily: "'Source Serif 4', Georgia, serif" }}>{p.name}</p>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: p.color + "15", borderRadius: 6, padding: "2px 8px" }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: p.color, fontFamily: "'Inter', sans-serif" }}>{"#" + p.ranking}</span>
                </div>
              </div>
              <div style={{ fontSize: 10, color: TEXT_DIM, fontFamily: "'Inter', sans-serif", textAlign: "center", marginBottom: 8 }}>
                {p.age + " anos · " + p.titles + " títulos · Estilo: " + p.style}
              </div>
              <StatBar label="Forehand" value={p.forehand} color={p.color} />
              <StatBar label="Saque" value={p.serve} color={p.color} />
              <StatBar label="Movim." value={p.movement} color={p.color} />
              <StatBar label="Mental" value={p.mental} color={p.color} />
            </div>
          );
        })}
      </div>
      <p style={{ margin: "12px 0 0", fontSize: 9, color: TEXT_DIM, fontFamily: "'Inter', sans-serif", textAlign: "center", fontStyle: "italic" }}>Estatísticas baseadas em análise de desempenho. Valores relativos entre os jogadores.</p>
    </div>
  );
};

// ===== CAREER TIMELINE =====
var CareerTimeline = function() {
  var events = [
    { date: "Ago 2006", title: "Nasce no Rio de Janeiro", desc: "Bairro de Ipanema, a 10 min do local do Rio Open", emoji: "👶", color: "#6B7280" },
    { date: "2010", title: "Começa no tênis", desc: "Primeiras aulas no Country Club do Rio", emoji: "🎾", color: "#6B7280" },
    { date: "2014", title: "Encontro com Nadal", desc: "Assiste ao Rio Open e tira foto com o ídolo aos 8 anos", emoji: "⭐", color: "#EF9F27" },
    { date: "Set 2023", title: "Nº1 mundial juvenil", desc: "Campeão do US Open Jr — primeiro brasileiro no topo", emoji: "🏆", color: GREEN },
    { date: "Fev 2024", title: "Estreia ATP no Rio Open", desc: "Derrota Arthur Fils (#36) e chega às quartas", emoji: "🇧🇷", color: GREEN },
    { date: "Ago 2024", title: "1º Challenger", desc: "Título em Lexington sem perder sets", emoji: "🎯", color: "#3B82F6" },
    { date: "Dez 2024", title: "Campeão NextGen", desc: "Invicto em 5 jogos — 1º sul-americano campeão", emoji: "🏆", color: GREEN },
    { date: "Jan 2025", title: "Derrota Rublev no AO", desc: "Top 10 caiu na R1 — João entra no Top 100", emoji: "🔥", color: RED },
    { date: "Fev 2025", title: "1º título ATP", desc: "Buenos Aires 250 — brasileiro mais jovem campeão ATP", emoji: "🏆", color: GREEN },
    { date: "Jul 2025", title: "Wimbledon R3", desc: "Primeiro brasileiro na R3 desde Bellucci 2010", emoji: "🌿", color: GREEN },
    { date: "Out 2025", title: "Campeão Basel 500", desc: "1º brasileiro a ganhar um ATP 500 — ranking #24", emoji: "🏆", color: YELLOW },
    { date: "Jan 2026", title: "Duplas no Rio Open", desc: "Título de duplas no torneio de casa", emoji: "🤝", color: "#3B82F6" },
    { date: "Mar 2026", title: "Ranking #39 ATP", desc: "Preparando-se para Monte Carlo Masters 1000", emoji: "📈", color: GREEN },
  ];

  return (
    <div style={{ padding: "16px 20px", maxHeight: "65vh", overflowY: "auto" }}>
      <div style={{ position: "relative", paddingLeft: 28 }}>
        {/* Vertical line */}
        <div style={{ position: "absolute", left: 9, top: 8, bottom: 8, width: 2, background: "linear-gradient(to bottom, " + GREEN + "40, " + YELLOW + "40)", borderRadius: 1 }} />

        {events.map(function(ev, i) {
          var isTitle = ev.emoji === "🏆";
          return (
            <div key={i} style={{ position: "relative", marginBottom: i < events.length - 1 ? 16 : 0, paddingBottom: 4 }}>
              {/* Dot */}
              <div style={{ position: "absolute", left: -22, top: 4, width: 14, height: 14, borderRadius: "50%", background: isTitle ? ev.color : "#fff", border: "2.5px solid " + ev.color, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1 }}>
                {isTitle && <span style={{ fontSize: 7, lineHeight: 1 }}>🏆</span>}
              </div>
              {/* Content */}
              <div style={{ background: isTitle ? (ev.color === YELLOW ? "#FFFBEB" : "#F7FDF9") : "#FAFAFA", border: "1px solid " + (isTitle ? ev.color + "30" : BORDER), borderRadius: 10, padding: "10px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: ev.color, fontFamily: "'Inter', sans-serif", textTransform: "uppercase", letterSpacing: "0.05em" }}>{ev.date}</span>
                  <span style={{ fontSize: 14 }}>{ev.emoji}</span>
                </div>
                <p style={{ margin: "0 0 2px", fontSize: 13.5, fontWeight: 700, color: TEXT_PRIMARY, fontFamily: "'Source Serif 4', Georgia, serif" }}>{ev.title}</p>
                <p style={{ margin: 0, fontSize: 11.5, color: TEXT_SECONDARY, fontFamily: "'Inter', sans-serif", lineHeight: 1.4 }}>{ev.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ===== GAME BANNER =====
var GameBanner = function() {
  return (
    <a href="/game" style={{ textDecoration: "none", display: "block" }}>
      <div style={{ background: "linear-gradient(135deg, #0a0a18 0%, #0d1130 40%, #1a0a2e 100%)", padding: "20px 24px", cursor: "pointer", transition: "all 0.2s", borderBottom: "1px solid " + BORDER }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
          <span style={{ fontSize: 14 }}>🎮</span>
          <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#ffd700", fontFamily: "'Inter', sans-serif" }}>Novo jogo</span>
        </div>
        <p style={{ margin: "0 0 10px", fontSize: 13.5, fontWeight: 700, color: "#fff", fontFamily: "'Source Serif 4', Georgia, serif", lineHeight: 1.4 }}>Tennis Career 26</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "'Inter', sans-serif" }}>Crie sua carreira no tênis profissional!</span>
          <div style={{ background: "linear-gradient(135deg, " + GREEN + ", #007A3D)", padding: "8px 16px", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 700, fontFamily: "'Inter', sans-serif" }}>Jogar ▶</div>
        </div>
      </div>
    </a>
  );
};

// ===== VIDEO BANNER =====
var VideoBanner = function(props) {
  var onOpen = props.onOpen;
  return (
    <div style={{ borderBottom: "1px solid " + BORDER, background: BG_WHITE, padding: "16px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <span style={{ fontSize: 14 }}>🎬</span>
        <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#FF0000", fontFamily: "'Inter', sans-serif" }}>Destaque</span>
      </div>
      <a href="https://www.youtube.com/results?search_query=João+Fonseca+tennis+highlights+2025" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "block" }}>
        <div style={{ position: "relative", borderRadius: 10, overflow: "hidden", background: "linear-gradient(135deg, #0a0a18 0%, #1a0a2e 100%)", padding: "24px 20px", textAlign: "center" }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(255,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", boxShadow: "0 4px 20px rgba(255,0,0,0.3)" }}>
            <span style={{ fontSize: 22, color: "#fff", marginLeft: 3 }}>▶</span>
          </div>
          <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: "'Source Serif 4', Georgia, serif" }}>Melhores momentos do João</p>
          <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.5)", fontFamily: "'Inter', sans-serif" }}>Highlights, entrevistas e jogadas incríveis</p>
        </div>
      </a>
    </div>
  );
};

// ===== ATP CALENDAR 2026 =====
var ATPCalendar = function() {
  var now = new Date();
  var events = [
    { month: "JAN", name: "Australian Open", cat: "Grand Slam", surface: "Duro", city: "Melbourne", date: "12 Jan - 1 Fev", done: true, result: "R1" },
    { month: "FEV", name: "Rio Open", cat: "ATP 500", surface: "Saibro", city: "Rio de Janeiro", date: "16-22 Fev", done: true, result: "Duplas 🏆" },
    { month: "MAR", name: "Indian Wells", cat: "Masters 1000", surface: "Duro", city: "Califórnia", date: "4-15 Mar", done: true, result: "R3" },
    { month: "MAR", name: "Miami Open", cat: "Masters 1000", surface: "Duro", city: "Miami", date: "18-29 Mar", done: true, result: "R3" },
    { month: "ABR", name: "Monte Carlo", cat: "Masters 1000", surface: "Saibro", city: "Mônaco", date: "5-12 Abr", done: false, next: true },
    { month: "ABR", name: "Madrid Open", cat: "Masters 1000", surface: "Saibro", city: "Madri", date: "22 Abr - 3 Mai", done: false },
    { month: "MAI", name: "Roma Masters", cat: "Masters 1000", surface: "Saibro", city: "Roma", date: "6-17 Mai", done: false },
    { month: "MAI", name: "Roland Garros", cat: "Grand Slam", surface: "Saibro", city: "Paris", date: "24 Mai - 7 Jun", done: false },
    { month: "JUN", name: "Wimbledon", cat: "Grand Slam", surface: "Grama", city: "Londres", date: "29 Jun - 12 Jul", done: false },
    { month: "AGO", name: "Montreal", cat: "Masters 1000", surface: "Duro", city: "Montreal", date: "2-12 Ago", done: false },
    { month: "AGO", name: "Cincinnati", cat: "Masters 1000", surface: "Duro", city: "Cincinnati", date: "13-23 Ago", done: false },
    { month: "AGO", name: "US Open", cat: "Grand Slam", surface: "Duro", city: "Nova York", date: "31 Ago - 13 Set", done: false },
    { month: "OUT", name: "Shanghai", cat: "Masters 1000", surface: "Duro", city: "Xangai", date: "7-18 Out", done: false },
    { month: "NOV", name: "Paris Masters", cat: "Masters 1000", surface: "Duro (indoor)", city: "Paris", date: "2-8 Nov", done: false },
    { month: "NOV", name: "ATP Finals", cat: "Finals", surface: "Duro (indoor)", city: "Turim", date: "15-22 Nov", done: false },
  ];

  var catColors = { "Grand Slam": "#8B5CF6", "Masters 1000": "#E8593C", "ATP 500": "#3B82F6", "Finals": YELLOW };
  var surfaceEmojis = { "Saibro": "🟤", "Duro": "🔵", "Grama": "🟢", "Duro (indoor)": "🏠" };

  return (
    <div style={{ padding: "16px 16px 20px", maxHeight: "70vh", overflowY: "auto" }}>
      {events.map(function(ev, i) {
        var catColor = catColors[ev.cat] || TEXT_DIM;
        var isNext = ev.next;
        return (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 8px", borderBottom: i < events.length - 1 ? "1px solid " + BORDER : "none", background: isNext ? GREEN + "08" : "transparent", borderRadius: isNext ? 10 : 0, marginBottom: isNext ? 4 : 0, border: isNext ? "1px solid " + GREEN + "20" : "none" }}>
            {/* Month pill */}
            <div style={{ width: 40, textAlign: "center", flexShrink: 0, paddingTop: 2 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: ev.done ? TEXT_DIM : catColor, fontFamily: "'Inter', sans-serif", letterSpacing: "0.05em" }}>{ev.month}</span>
            </div>

            {/* Event info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2, flexWrap: "wrap" }}>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: ev.done ? TEXT_DIM : TEXT_PRIMARY, fontFamily: "'Source Serif 4', Georgia, serif", textDecoration: ev.done ? "none" : "none" }}>{ev.name}</span>
                {isNext && (
                  <span style={{ fontSize: 8, fontWeight: 700, color: GREEN, fontFamily: "'Inter', sans-serif", textTransform: "uppercase", letterSpacing: "0.1em", background: GREEN + "15", padding: "2px 6px", borderRadius: 4 }}>Próximo</span>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: catColor, fontFamily: "'Inter', sans-serif", background: catColor + "12", padding: "1px 6px", borderRadius: 4 }}>{ev.cat}</span>
                <span style={{ fontSize: 10, color: TEXT_DIM, fontFamily: "'Inter', sans-serif" }}>{surfaceEmojis[ev.surface] || ""} {ev.surface}</span>
                <span style={{ fontSize: 10, color: TEXT_DIM, fontFamily: "'Inter', sans-serif" }}>· {ev.city}</span>
              </div>
              <span style={{ fontSize: 10, color: TEXT_DIM, fontFamily: "'Inter', sans-serif" }}>{ev.date}</span>
            </div>

            {/* Result or status */}
            <div style={{ flexShrink: 0, textAlign: "right", paddingTop: 2 }}>
              {ev.done ? (
                <span style={{ fontSize: 10, fontWeight: 700, color: ev.result && ev.result.includes("🏆") ? GREEN : TEXT_DIM, fontFamily: "'Inter', sans-serif", background: ev.result && ev.result.includes("🏆") ? GREEN + "12" : "#F0F0F0", padding: "2px 8px", borderRadius: 4 }}>{ev.result || "—"}</span>
              ) : isNext ? (
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: GREEN, display: "inline-block", animation: "pulse 1.5s ease-in-out infinite" }} />
              ) : (
                <span style={{ fontSize: 10, color: TEXT_DIM, fontFamily: "'Inter', sans-serif" }}>—</span>
              )}
            </div>
          </div>
        );
      })}
      <p style={{ margin: "12px 0 0", fontSize: 9, color: TEXT_DIM, fontFamily: "'Inter', sans-serif", textAlign: "center", fontStyle: "italic" }}>Calendário simplificado. Torneios ATP 250 e outros eventos não listados.</p>
    </div>
  );
};

// ===== QUIZ: Quanto você conhece o João? =====
var QuizGame = function() {
  var _q = useState(0); var currentQ = _q[0]; var setCurrentQ = _q[1];
  var _sc = useState(0); var score = _sc[0]; var setScore = _sc[1];
  var _sel = useState(null); var selected = _sel[0]; var setSelected = _sel[1];
  var _done = useState(false); var done = _done[0]; var setDone = _done[1];
  var _started = useState(false); var started = _started[0]; var setStarted = _started[1];
  var _revealed = useState(false); var revealed = _revealed[0]; var setRevealed = _revealed[1];

  var allQuestions = [
    { q: "Em que bairro do Rio de Janeiro o João nasceu?", opts: ["Copacabana", "Ipanema", "Leblon", "Barra da Tijuca"], answer: 1, points: 10, fun: "Ele cresceu a 10 minutos do local do Rio Open!" },
    { q: "Qual esporte o João praticava antes do tênis?", opts: ["Futebol", "Natação", "Futsal", "Surf"], answer: 2, points: 10, fun: "Trocou a bola redonda pela raquete aos 4 anos!" },
    { q: "Qual Grand Slam juvenil o João conquistou em 2023?", opts: ["Australian Open", "Roland Garros", "Wimbledon", "US Open"], answer: 3, points: 10, fun: "Derrotou Learner Tien na final!" },
    { q: "Quem o João derrotou na estreia do Australian Open 2025?", opts: ["Djokovic", "Alcaraz", "Rublev", "Medvedev"], answer: 2, points: 15, fun: "Primeiro adolescente a derrotar um top 10 em 1ª rodada de Grand Slam desde 2002!" },
    { q: "Qual foi o primeiro título ATP do João?", opts: ["Basel 500", "Rio Open 250", "Buenos Aires 250", "Lexington Challenger"], answer: 2, points: 10, fun: "Brasileiro mais jovem a conquistar um título ATP!" },
    { q: "Com que idade o João se tornou nº1 mundial juvenil?", opts: ["15 anos", "16 anos", "17 anos", "18 anos"], answer: 2, points: 10, fun: "Primeiro brasileiro da história a terminar a temporada como nº1 juvenil!" },
    { q: "Qual torneio o João venceu invicto com 5 vitórias em 2024?", opts: ["ATP Finals", "NextGen ATP Finals", "Copa Davis", "Laver Cup"], answer: 1, points: 15, fun: "Primeiro sul-americano campeão do NextGen Finals!" },
    { q: "Qual ATP 500 o João conquistou em outubro de 2025?", opts: ["Viena", "Hamburgo", "Basel", "Barcelona"], answer: 2, points: 15, fun: "Primeiro brasileiro a ganhar um ATP 500 na história!" },
    { q: "Quem é o ídolo do João que ele conheceu aos 4 anos no Rio Open?", opts: ["Federer", "Nadal", "Djokovic", "Guga"], answer: 1, points: 10, fun: "Ele mostrou a foto desse encontro pro Nadal no NextGen Finals!" },
    { q: "Quantos títulos profissionais o João já tem na carreira?", opts: ["4", "5", "6", "8"], answer: 3, points: 15, fun: "2 ATP Tour + 3 Challengers + NextGen Finals + 1 Duplas + US Open Jr!" },
  ];

  // Shuffle questions using seed (changes each time quiz restarts)
  var _shuf = useState(function() {
    var arr = allQuestions.slice();
    var s = Date.now();
    for (var i = arr.length - 1; i > 0; i--) {
      s = (s * 9301 + 49297) % 233280;
      var j = Math.floor((s / 233280) * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  });
  var questions = _shuf[0]; var setQuestions = _shuf[1];

  var totalPoints = questions.reduce(function(sum, q) { return sum + q.points; }, 0);
  var maxQ = questions.length;

  var handleAnswer = function(idx) {
    if (revealed) return;
    setSelected(idx);
    setRevealed(true);
    if (idx === questions[currentQ].answer) {
      setScore(score + questions[currentQ].points);
    }
  };

  var handleNext = function() {
    if (currentQ < maxQ - 1) {
      setCurrentQ(currentQ + 1);
      setSelected(null);
      setRevealed(false);
    } else {
      setDone(true);
    }
  };

  var handleRestart = function() {
    var arr = allQuestions.slice();
    var s = Date.now();
    for (var i = arr.length - 1; i > 0; i--) {
      s = (s * 9301 + 49297) % 233280;
      var j = Math.floor((s / 233280) * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    setQuestions(arr);
    setCurrentQ(0); setScore(0); setSelected(null); setDone(false); setStarted(false); setRevealed(false);
  };

  var getResultMsg = function() {
    var pct = Math.round((score / totalPoints) * 100);
    if (pct === 100) return { emoji: "🏆", msg: "Perfeito! Você é um verdadeiro fã do João!" };
    if (pct >= 80) return { emoji: "🔥", msg: "Impressionante! Você conhece bem o João!" };
    if (pct >= 60) return { emoji: "🎾", msg: "Bom! Você acompanha o João de perto!" };
    if (pct >= 40) return { emoji: "👏", msg: "Legal! Está no caminho pra ser um grande fã!" };
    return { emoji: "📚", msg: "Continue acompanhando o João aqui no Fonseca News!" };
  };

  // Card de início
  if (!started) {
    return (
      <div style={{ maxWidth: 680, margin: "0 auto", borderLeft: "1px solid " + BORDER, borderRight: "1px solid " + BORDER }}>
        <div style={{ background: "linear-gradient(135deg, #0a1628 0%, #1a2a4a 100%)", padding: "20px 24px", cursor: "pointer", position: "relative", overflow: "hidden" }} onClick={function() { setStarted(true); }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <span style={{ fontSize: 14 }}>🎾</span>
            <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: YELLOW, fontFamily: "'Inter', sans-serif" }}>Quiz interativo</span>
          </div>
          <p style={{ margin: "0 0 10px", fontSize: 13.5, fontWeight: 700, color: "#fff", fontFamily: "'Source Serif 4', Georgia, serif", lineHeight: 1.4 }}>Quanto você conhece o João Fonseca?</p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "'Inter', sans-serif" }}>10 perguntas · {totalPoints} pontos</span>
            <div style={{ background: "linear-gradient(135deg, " + GREEN + ", #007A3D)", padding: "8px 16px", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 700, fontFamily: "'Inter', sans-serif" }}>Jogar</div>
          </div>
        </div>
      </div>
    );
  }

  // Tela de resultado
  if (done) {
    var result = getResultMsg();
    return (
      <div style={{ maxWidth: 680, margin: "0 auto", borderLeft: "1px solid " + BORDER, borderRight: "1px solid " + BORDER }}>
        <div style={{ background: "linear-gradient(135deg, #0a1628 0%, #1a2a4a 100%)", padding: "28px 24px", textAlign: "center" }}>
          <span style={{ fontSize: 48 }}>{result.emoji}</span>
          <h3 style={{ margin: "10px 0 4px", fontSize: 20, fontWeight: 800, color: "#fff", fontFamily: "'Source Serif 4', Georgia, serif" }}>{score}/{totalPoints} pontos</h3>
          <p style={{ margin: "0 0 16px", fontSize: 13.5, color: "rgba(255,255,255,0.6)", fontFamily: "'Inter', sans-serif" }}>{result.msg}</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button onClick={handleRestart} style={{ padding: "10px 20px", background: GREEN, color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>🔄 Jogar de novo</button>
            <button onClick={function() { setStarted(false); setDone(false); setCurrentQ(0); setScore(0); }} style={{ padding: "10px 20px", background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>Fechar</button>
          </div>
        </div>
      </div>
    );
  }

  // Tela de pergunta
  var q = questions[currentQ];
  return (
    <div style={{ maxWidth: 680, margin: "0 auto", borderLeft: "1px solid " + BORDER, borderRight: "1px solid " + BORDER }}>
      <div style={{ background: "linear-gradient(135deg, #0a1628 0%, #1a2a4a 100%)", padding: "20px 24px", position: "relative" }}>
        {/* Progress */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: YELLOW, fontFamily: "'Inter', sans-serif", textTransform: "uppercase", letterSpacing: "0.1em" }}>Pergunta {currentQ + 1}/{maxQ}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: GREEN, fontFamily: "'Inter', sans-serif" }}>{score} pts</span>
        </div>
        <div style={{ height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 2, marginBottom: 16 }}>
          <div style={{ height: 3, background: "linear-gradient(90deg, " + GREEN + ", " + YELLOW + ")", borderRadius: 2, width: ((currentQ + 1) / maxQ * 100) + "%", transition: "width 0.3s" }} />
        </div>

        {/* Question */}
        <p style={{ margin: "0 0 4px", fontSize: 15.5, fontWeight: 700, color: "#fff", fontFamily: "'Source Serif 4', Georgia, serif", lineHeight: 1.5 }}>{q.q}</p>
        <span style={{ fontSize: 10, color: YELLOW, fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>{q.points} pontos</span>

        {/* Options */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
          {q.opts.map(function(opt, idx) {
            var isCorrect = idx === q.answer;
            var isSelected = idx === selected;
            var bg = "rgba(255,255,255,0.06)";
            var borderColor = "rgba(255,255,255,0.1)";
            var textColor = "rgba(255,255,255,0.8)";
            if (revealed) {
              if (isCorrect) { bg = GREEN + "25"; borderColor = GREEN + "50"; textColor = GREEN; }
              else if (isSelected && !isCorrect) { bg = RED + "25"; borderColor = RED + "50"; textColor = RED; }
              else { bg = "rgba(255,255,255,0.03)"; textColor = "rgba(255,255,255,0.3)"; }
            }
            return (
              <button key={idx} onClick={function() { handleAnswer(idx); }} disabled={revealed} style={{ padding: "12px 16px", background: bg, border: "1px solid " + borderColor, borderRadius: 10, cursor: revealed ? "default" : "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 10, transition: "all 0.2s" }}>
                <span style={{ width: 24, height: 24, borderRadius: "50%", background: revealed && isCorrect ? GREEN : (revealed && isSelected && !isCorrect ? RED : "rgba(255,255,255,0.08)"), border: "1px solid " + (revealed && isCorrect ? GREEN : (revealed && isSelected && !isCorrect ? RED : "rgba(255,255,255,0.15)")), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: revealed && (isCorrect || isSelected) ? "#fff" : "rgba(255,255,255,0.4)", fontFamily: "'Inter', sans-serif", flexShrink: 0 }}>
                  {revealed && isCorrect ? "✓" : (revealed && isSelected && !isCorrect ? "✗" : String.fromCharCode(65 + idx))}
                </span>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: textColor, fontFamily: "'Inter', sans-serif" }}>{opt}</span>
              </button>
            );
          })}
        </div>

        {/* Fun fact + Next */}
        {revealed && (
          <div style={{ marginTop: 14, animation: "fadeIn 0.3s ease" }}>
            <div style={{ padding: "10px 14px", background: "rgba(255,203,5,0.08)", borderRadius: 10, border: "1px solid rgba(255,203,5,0.15)", marginBottom: 12 }}>
              <p style={{ margin: 0, fontSize: 12, color: YELLOW, fontFamily: "'Inter', sans-serif", lineHeight: 1.5 }}>💡 {q.fun}</p>
            </div>
            <button onClick={handleNext} style={{ width: "100%", padding: "12px", background: "linear-gradient(135deg, " + GREEN + ", #007A3D)", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
              {currentQ < maxQ - 1 ? "Próxima pergunta →" : "Ver resultado 🏆"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
var RIVAL_DATA = {
  name: "Learner Tien",
  country: "🇺🇸",
  countryName: "EUA",
  ranking: 21,
  age: 20,
  titles: 1,
  bestRanking: 21,
  sofascoreId: 412818,
  atpCode: "t0ha",
  h2h: { joao: 1, tien: 1 },
};

var RivalBanner = function() {
  var r = RIVAL_DATA;
  var tienImg = "https://www.atptour.com/-/media/alias/player-headshot/" + r.atpCode;
  var joaoImg = "https://www.atptour.com/-/media/alias/player-headshot/f0fv";
  return (
    <div style={{ background: "linear-gradient(135deg, #1a0a0a 0%, #2d1111 40%, #1a0f1e 100%)", borderBottom: "1px solid " + BORDER, padding: "20px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <span style={{ fontSize: 14 }}>⚔️</span>
        <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: RED, fontFamily: "'Inter', sans-serif" }}>Rivalidade</span>
      </div>
      <p style={{ margin: "0 0 10px", textAlign: "center", fontSize: 10.5, fontStyle: "italic", color: "rgba(255,255,255,0.35)", fontFamily: "'Source Serif 4', Georgia, serif" }}>
        &quot;Porque todo ídolo de verdade precisa de um grande rival&quot;
      </p>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", overflow: "hidden", background: "#1a2a3a", border: "2px solid " + GREEN + "50", flexShrink: 0 }}>
            <img src={joaoImg} alt="Fonseca" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={function(e) { e.target.onerror = null; e.target.src = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36"><rect width="36" height="36" fill="#1a2a3a"/><text x="18" y="23" text-anchor="middle" font-family="Georgia" font-weight="800" font-size="13" fill="#00A859">JF</text></svg>'); }} />
          </div>
          <div>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#fff", fontFamily: "'Source Serif 4', Georgia, serif", display: "block" }}>Fonseca</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: GREEN, fontFamily: "'Inter', sans-serif" }}>🇧🇷 #39</span>
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 20, fontWeight: 900, color: GREEN, fontFamily: "'Inter', sans-serif" }}>{r.h2h.joao}</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.2)", fontFamily: "'Inter', sans-serif" }}>VS</span>
            <span style={{ fontSize: 20, fontWeight: 900, color: RED, fontFamily: "'Inter', sans-serif" }}>{r.h2h.tien}</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#fff", fontFamily: "'Source Serif 4', Georgia, serif", display: "block", textAlign: "right" }}>{r.name}</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: RED, fontFamily: "'Inter', sans-serif" }}>{r.country + " #" + r.ranking}</span>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: "50%", overflow: "hidden", background: "#1a2a3a", border: "2px solid " + RED + "50", flexShrink: 0 }}>
            <img src={tienImg} alt={r.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={function(e) { e.target.onerror = null; e.target.src = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36"><rect width="36" height="36" fill="#1a2a3a"/><text x="18" y="23" text-anchor="middle" font-family="Georgia" font-weight="800" font-size="13" fill="#E63946">LT</text></svg>'); }} />
          </div>
        </div>
      </div>
    </div>
  );
};

// ===== REDESIGNED NEXT DUEL CARD (compact) =====
var NextDuelCard = function(props) {
  var match = props.match; var player = props.player; var isLive = props.isLive;
  var countdown = useCountdown(match ? match.date : null);
  if (!match) return null;
  var sc = surfaceColorMap[match.surface] || ACCENT;
  var se = surfaceEmoji[match.surface] || "🎾";
  var joaoImg = "https://www.atptour.com/-/media/alias/player-headshot/f0fv";
  var oppImg = match.opponent_id ? ("https://api.sofascore.app/api/v1/player/" + match.opponent_id + "/image") : null;
  var oppName = match.opponent_name || "";
  var oppRanking = match.opponent_ranking;
  var oppCountry = match.opponent_country || "";

  var CountdownBox = function(p) {
    return (
      <div style={{ textAlign: "center", minWidth: 40 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", fontFamily: "'Inter', sans-serif", lineHeight: 1, background: "rgba(255,255,255,0.08)", borderRadius: 8, padding: "6px 4px", border: "1px solid rgba(255,255,255,0.1)" }}>{String(p.value).padStart(2, "0")}</div>
        <div style={{ fontSize: 8, color: "#777", fontFamily: "'Inter', sans-serif", marginTop: 3, textTransform: "uppercase", letterSpacing: "0.1em" }}>{p.label}</div>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", background: "linear-gradient(145deg, #0a0f1e 0%, #0d1b2e 40%, #132440 100%)", borderLeft: "1px solid " + BORDER, borderRight: "1px solid " + BORDER, borderBottom: "1px solid " + BORDER, position: "relative", overflow: "hidden" }}>
      {/* Accent bar */}
      <div style={{ height: 3, background: "linear-gradient(90deg, " + GREEN + ", " + YELLOW + ")" }} />

      {/* Decorative glow */}
      <div style={{ position: "absolute", top: -40, right: -40, width: 140, height: 140, borderRadius: "50%", background: "radial-gradient(circle, " + sc + "12 0%, transparent 70%)", pointerEvents: "none" }} />

      {/* Header */}
      <div style={{ textAlign: "center", padding: "18px 20px 8px", position: "relative" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: YELLOW, fontFamily: "'Inter', sans-serif" }}>Próximo Duelo</span>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: sc + "20", borderRadius: 14, padding: "2px 10px", border: "1px solid " + sc + "30" }}>
            <span style={{ fontSize: 11 }}>{se}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: sc, fontFamily: "'Inter', sans-serif" }}>{match.surface}</span>
          </div>
        </div>
        <p style={{ margin: "8px 0 0", fontSize: 22, fontWeight: 800, color: "#fff", fontFamily: "'Source Serif 4', Georgia, serif", letterSpacing: "-0.02em" }}>{match.tournament_category || match.tournament_name || "Próxima Partida"}</p>
        {match.tournament_name && match.tournament_category && (
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "rgba(255,255,255,0.4)", fontFamily: "'Inter', sans-serif" }}>{match.tournament_name}</p>
        )}
      </div>

      {/* Players */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 50px 1fr", alignItems: "start", gap: 6, padding: "18px 20px 14px" }}>
        {/* João */}
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", margin: "0 auto 6px", overflow: "hidden", background: "linear-gradient(135deg, #1a2a3a, #0d1b2e)", border: "2px solid " + GREEN + "50", boxShadow: "0 0 20px " + GREEN + "15" }}>
            <img src={joaoImg} alt="João Fonseca" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={function(e) {
              if (e.target.src.includes("atptour")) {
                e.target.src = "https://api.sofascore.app/api/v1/player/403869/image";
              } else {
                e.target.onerror = null;
                e.target.src = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" fill="#1a2a3a"/><text x="40" y="48" text-anchor="middle" font-family="Georgia,serif" font-weight="800" font-size="24" fill="#00A859">JF</text></svg>');
              }
            }} />
          </div>
          <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: "#fff", fontFamily: "'Source Serif 4', Georgia, serif" }}>J. Fonseca</p>
          <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(255,255,255,0.45)", fontFamily: "'Inter', sans-serif" }}>🇧🇷</p>
          {player && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 3, background: GREEN + "18", borderRadius: 6, padding: "2px 8px", marginTop: 4, border: "1px solid " + GREEN + "25" }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: GREEN, fontFamily: "'Inter', sans-serif" }}>{"#" + player.ranking}</span>
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", fontFamily: "'Inter', sans-serif" }}>ATP</span>
            </div>
          )}
        </div>

        {/* VS */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: 22 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 900, color: "rgba(255,255,255,0.18)", fontFamily: "'Inter', sans-serif" }}>VS</span>
          </div>
        </div>

        {/* Opponent */}
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", margin: "0 auto 6px", overflow: "hidden", background: "linear-gradient(135deg, #1a2a3a, #0d1b2e)", border: "2px solid rgba(255,255,255,0.1)" }}>
            {oppImg ? (
              <img src={oppImg} alt={oppName} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={function(e) { e.target.style.display = "none"; }} />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>🎾</div>
            )}
          </div>
          <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: "#fff", fontFamily: "'Source Serif 4', Georgia, serif" }}>{oppName || "A definir"}</p>
          {oppCountry && (
            <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(255,255,255,0.45)", fontFamily: "'Inter', sans-serif" }}>{oppCountry}</p>
          )}
          {oppRanking && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 3, background: "rgba(255,255,255,0.05)", borderRadius: 6, padding: "2px 8px", marginTop: 4, border: "1px solid rgba(255,255,255,0.08)" }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.6)", fontFamily: "'Inter', sans-serif" }}>{"#" + oppRanking}</span>
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontFamily: "'Inter', sans-serif" }}>ATP</span>
            </div>
          )}
        </div>
      </div>

      {/* Countdown */}
      {!countdown.expired && (
        <div style={{ padding: "14px 20px 18px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <p style={{ margin: "0 0 8px", textAlign: "center", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: YELLOW, fontFamily: "'Inter', sans-serif" }}>Começa em</p>
          <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
            <CountdownBox value={countdown.days} label="dias" />
            <div style={{ color: "rgba(255,255,255,0.12)", fontSize: 16, fontWeight: 700, paddingTop: 6 }}>:</div>
            <CountdownBox value={countdown.hours} label="hrs" />
            <div style={{ color: "rgba(255,255,255,0.12)", fontSize: 16, fontWeight: 700, paddingTop: 6 }}>:</div>
            <CountdownBox value={countdown.minutes} label="min" />
            <div style={{ color: "rgba(255,255,255,0.12)", fontSize: 16, fontWeight: 700, paddingTop: 6 }}>:</div>
            <CountdownBox value={countdown.seconds} label="seg" />
          </div>
        </div>
      )}

      {/* Location & date */}
      <div style={{ display: "flex", justifyContent: "center", gap: 16, padding: (countdown.expired ? "16px" : "6px") + " 20px 18px", flexWrap: "wrap" }}>
        <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)", fontFamily: "'Inter', sans-serif" }}>📅 {formatMatchDate(match.date)}</span>
        <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)", fontFamily: "'Inter', sans-serif" }}>📍 {match.city}{match.country ? (", " + match.country) : ""}</span>
        {match.round && (
          <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)", fontFamily: "'Inter', sans-serif" }}>🏟️ {match.round}</span>
        )}
      </div>

      {!isLive && (
        <p style={{ margin: 0, padding: "0 20px 10px", fontSize: 9, color: "rgba(255,255,255,0.15)", fontStyle: "italic", fontFamily: "'Inter', sans-serif", textAlign: "center" }}>Dados de exemplo</p>
      )}
    </div>
  );
};

// ===== PIX DONATION =====
var PixDonation = function() {
  var _s = useState(false); var showModal = _s[0]; var setShowModal = _s[1];
  var _c = useState(false); var copied = _c[0]; var setCopied = _c[1];
  var PIX_KEY = "SUA-CHAVE-PIX-AQUI";

  var handleCopy = function() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(PIX_KEY).then(function() { setCopied(true); setTimeout(function() { setCopied(false); }, 3000); });
    } else {
      var ta = document.createElement("textarea"); ta.value = PIX_KEY; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta);
      setCopied(true); setTimeout(function() { setCopied(false); }, 3000);
    }
  };

  return (
    <>
      <button onClick={function() { setShowModal(true); }} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 18px", background: "linear-gradient(135deg, " + GREEN + ", #007A3D)", color: "#fff", border: "none", borderRadius: 10, fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter', sans-serif", boxShadow: "0 2px 8px rgba(0,168,89,0.3)", transition: "all 0.2s" }}>💚 Apoie via PIX</button>
      {showModal && (
        <div onClick={function() { setShowModal(false); }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16, animation: "fadeInOverlay 0.3s ease" }}>
          <div onClick={function(e) { e.stopPropagation(); }} style={{ background: "#1a1a2e", border: "1px solid rgba(255,203,5,0.2)", borderRadius: 20, padding: 32, maxWidth: 360, width: "100%", textAlign: "center", position: "relative", animation: "slideUp 0.3s ease" }}>
            <button onClick={function() { setShowModal(false); }} style={{ position: "absolute", top: 12, right: 16, background: "none", border: "none", color: "#888", fontSize: 20, cursor: "pointer" }}>✕</button>
            <div style={{ fontSize: 32, fontWeight: 800, fontFamily: "'Inter', sans-serif", marginBottom: 8 }}>
              <span style={{ color: GREEN }}>F</span><span style={{ color: YELLOW }}>N</span>
            </div>
            <h3 style={{ margin: "0 0 6px", color: "#fff", fontSize: 18, fontFamily: "'Source Serif 4', Georgia, serif" }}>Apoie o Fonseca News</h3>
            <p style={{ color: "#aaa", fontSize: 13, margin: "0 0 20px", fontFamily: "'Inter', sans-serif" }}>Ajude a manter o site no ar e acompanhar cada ponto do João!</p>
            <div style={{ marginBottom: 16 }}>
              <label style={{ color: "#888", fontSize: 11, display: "block", marginBottom: 8, fontFamily: "'Inter', sans-serif" }}>Chave PIX (aleatória):</label>
              <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
                <code style={{ background: "rgba(255,255,255,0.05)", padding: "8px 12px", borderRadius: 8, color: "#ccc", fontSize: 11, fontFamily: "monospace", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>{PIX_KEY}</code>
                <button onClick={handleCopy} style={{ padding: "8px 16px", background: GREEN, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "'Inter', sans-serif", whiteSpace: "nowrap" }}>{copied ? "✅ Copiado!" : "📋 Copiar"}</button>
              </div>
            </div>
            <p style={{ color: "#888", fontSize: 12, margin: 0, fontFamily: "'Inter', sans-serif" }}>Qualquer valor já ajuda muito! 🎾🇧🇷</p>
          </div>
        </div>
      )}
    </>
  );
};

// ===== OTHER COMPONENTS =====
var Skeleton = function() { return (<div>{[...Array(5)].map(function(_, i) { return (<div key={i} style={{ background: BG_WHITE, padding: "20px 24px", borderBottom: "1px solid " + BORDER, animation: "pulse 1.8s ease-in-out infinite", animationDelay: (i * .12) + "s" }}><div style={{ display: "flex", gap: 8, marginBottom: 10 }}><div style={{ height: 20, width: 70, background: "#f0f0f0", borderRadius: 4 }} /><div style={{ height: 20, width: 90, background: "#f5f5f5", borderRadius: 4 }} /></div><div style={{ height: 18, width: "85%", background: "#f0f0f0", borderRadius: 4, marginBottom: 8 }} /><div style={{ height: 14, width: "60%", background: "#f5f5f5", borderRadius: 4 }} /></div>); })}</div>); };

var NewsCard = function(props) {
  var item = props.item; var index = props.index;
  var _s = useState(false); var h = _s[0]; var setH = _s[1];
  var _i = useState(false); var imgErr = _i[0]; var setImgErr = _i[1];
  var likeKey = "fn_r_" + (item.title || "").substring(0, 30).replace(/\s/g, "_");
  var _lk = useState(function() { try { return JSON.parse(localStorage.getItem(likeKey) || '{"l":0,"d":0,"v":null}'); } catch(e) { return {l:0,d:0,v:null}; } });
  var rx = _lk[0]; var setRx = _lk[1];
  var handleRx = function(type, e) {
    e.preventDefault(); e.stopPropagation();
    if (rx.v) return;
    var u = { l: rx.l, d: rx.d, v: type };
    if (type === "l") u.l += 1; else u.d += 1;
    setRx(u);
    try { localStorage.setItem(likeKey, JSON.stringify(u)); } catch(e) {}
  };
  var handleSh = function(e) {
    e.preventDefault(); e.stopPropagation();
    if (navigator.share) { navigator.share({ title: item.title, url: item.url || "https://fonsecanews.com.br" }).catch(function() {}); }
    else { try { navigator.clipboard.writeText(item.title + "\n" + (item.url || "fonsecanews.com.br")); } catch(e) {} }
  };
  var cat = catCfg[item.category] || catCfg["Notícia"];
  var hasImg = item.image && !imgErr;
  var hasUrl = item.url && item.url.startsWith("http");
  var Tag = hasUrl ? "a" : "div";
  var linkProps = hasUrl ? { href: item.url, target: "_blank", rel: "noopener noreferrer" } : {};
  return (
    <Tag {...linkProps} onMouseEnter={function() { setH(true); }} onMouseLeave={function() { setH(false); }}
      style={{ display: "flex", gap: hasImg ? 14 : 0, textDecoration: "none", background: h && hasUrl ? "#F8F9FA" : BG_WHITE, padding: hasImg ? "20px 24px" : "20px 24px 20px 20px", borderBottom: "1px solid " + BORDER, borderLeft: hasImg ? "none" : ("3px solid " + cat.color), transition: "background 0.15s", animation: "fadeIn 0.35s ease forwards", animationDelay: (index * 0.04) + "s", opacity: 0, cursor: hasUrl ? "pointer" : "default", alignItems: "flex-start" }}>
      {hasImg && (
        <img src={item.image} alt="" onError={function() { setImgErr(true); }}
          style={{ width: 56, height: 56, borderRadius: 10, objectFit: "cover", flexShrink: 0, marginTop: 2, background: "#f0f0f0" }} />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: cat.color, fontFamily: "'Inter', -apple-system, sans-serif", background: cat.bg, padding: "3px 8px", borderRadius: 4 }}>{item.category}</span>
          <span style={{ fontSize: 12, color: TEXT_DIM, fontFamily: "'Inter', -apple-system, sans-serif" }}>{item.source}</span>
          <span style={{ fontSize: 12, color: TEXT_DIM, fontFamily: "'Inter', -apple-system, sans-serif", marginLeft: "auto", whiteSpace: "nowrap" }}>{formatTimeAgo(item.date)}</span>
        </div>
        <h3 style={{ margin: "0 0 5px", fontSize: 16, fontWeight: 700, color: h && hasUrl ? GREEN : TEXT_PRIMARY, fontFamily: "'Source Serif 4', Georgia, serif", lineHeight: 1.45, transition: "color 0.15s" }}>{item.source && item.title ? item.title.replace(" - " + item.source, "").replace(" | " + item.source, "").replace(" · " + item.source, "") : item.title}</h3>
        {item.summary && <p style={{ margin: "0 0 4px", fontSize: 13, color: TEXT_SECONDARY, fontFamily: "'Inter', -apple-system, sans-serif", lineHeight: 1.5 }}>{item.summary}</p>}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 10 }}>
          <button onClick={function(e) { handleRx("l", e); }} style={{ background: "none", border: "none", cursor: rx.v ? "default" : "pointer", display: "flex", alignItems: "center", gap: 4, padding: 0, opacity: rx.v && rx.v !== "l" ? 0.2 : (rx.v === "l" ? 1 : 0.35), transition: "opacity 0.2s" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill={rx.v === "l" ? GREEN : "none"} stroke={rx.v === "l" ? GREEN : TEXT_DIM} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
            {rx.l > 0 && <span style={{ fontSize: 10, color: rx.v === "l" ? GREEN : TEXT_DIM, fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>{rx.l}</span>}
          </button>
          <button onClick={function(e) { handleRx("d", e); }} style={{ background: "none", border: "none", cursor: rx.v ? "default" : "pointer", display: "flex", alignItems: "center", gap: 4, padding: 0, opacity: rx.v && rx.v !== "d" ? 0.2 : (rx.v === "d" ? 1 : 0.35), transition: "opacity 0.2s" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill={rx.v === "d" ? RED : "none"} stroke={rx.v === "d" ? RED : TEXT_DIM} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10zM17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>
            {rx.d > 0 && <span style={{ fontSize: 10, color: rx.v === "d" ? RED : TEXT_DIM, fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>{rx.d}</span>}
          </button>
          <button onClick={handleSh} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, marginLeft: "auto", opacity: 0.3, display: "flex", alignItems: "center", transition: "opacity 0.2s" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={TEXT_DIM} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
          </button>
        </div>
      </div>
    </Tag>
  );
};

var buildFeed = function(newsItems, season, lastMatch, onOpenVideos) {
  var elements = [];
  var inserts = [
    { at: 3, component: <DailyPoll key="poll-bar" /> },
    { at: 6, component: <QuizGame key="quiz-bar" /> },
    { at: 9, component: <SeasonBar key="season-bar" season={season} /> },
    { at: 12, component: <GameBanner key="game-banner" /> },
    { at: 15, component: <LastMatchBar key="last-match-bar" match={lastMatch} /> },
    { at: 18, component: <VideoBanner key="video-banner" onOpen={onOpenVideos} /> },
  ];
  newsItems.forEach(function(item, i) {
    elements.push(<NewsCard key={"news-" + i} item={item} index={i} />);
    var insert = inserts.find(function(ins) { return ins.at === i + 1; });
    if (insert) elements.push(insert.component);
  });
  if (newsItems.length < 3) elements.push(<DailyPoll key="poll-bar" />);
  if (newsItems.length < 6) elements.push(<QuizGame key="quiz-bar" />);
  if (newsItems.length < 9 && season) elements.push(<SeasonBar key="season-bar" season={season} />);
  if (newsItems.length < 12) elements.push(<GameBanner key="game-banner" />);
  if (newsItems.length < 15 && lastMatch) elements.push(<LastMatchBar key="last-match-bar" match={lastMatch} />);
  if (newsItems.length < 18) elements.push(<VideoBanner key="video-banner" onOpen={onOpenVideos} />);
  return elements;
};

// ===== VISITOR COUNTER =====
// ===== MAIN APP =====
export default function JoaoFonsecaNews() {
  var _n = useState([]); var news = _n[0]; var setNews = _n[1];
  var _nm = useState(null); var nextMatch = _nm[0]; var setNextMatch = _nm[1];
  var _lm = useState(null); var lastMatch = _lm[0]; var setLastMatch = _lm[1];
  var _p = useState(null); var player = _p[0]; var setPlayer = _p[1];
  var _se = useState(null); var season = _se[0]; var setSeason = _se[1];
  var _l = useState(false); var loading = _l[0]; var setLoading = _l[1];
  var _il = useState(false); var isLive = _il[0]; var setIsLive = _il[1];
  var _lu = useState(null); var lastUpdate = _lu[0]; var setLastUpdate = _lu[1];
  var _ce = useState(null); var cacheExpiresAt = _ce[0]; var setCacheExpiresAt = _ce[1];
  var _tl = useState(null); var timeLeft = _tl[0]; var setTimeLeft = _tl[1];
  var _cs = useState("init"); var cacheStatus = _cs[0]; var setCacheStatus = _cs[1];
  var _dp = useState(null); var deferredPrompt = _dp[0]; var setDeferredPrompt = _dp[1];
  var _sib = useState(false); var showInstallBanner = _sib[0]; var setShowInstallBanner = _sib[1];
  var _sip = useState(false); var showInstallPopup = _sip[0]; var setShowInstallPopup = _sip[1];
  var _pd = useState(false); var popupDismissed = _pd[0]; var setPopupDismissed = _pd[1];
  var _sb = useState(false); var showBio = _sb[0]; var setShowBio = _sb[1];
  var _st = useState(false); var showTitles = _st[0]; var setShowTitles = _st[1];
  var _ssh = useState(false); var showShare = _ssh[0]; var setShowShare = _ssh[1];
  var _sm = useState(false); var showMenu = _sm[0]; var setShowMenu = _sm[1];
  var _sr = useState(false); var showRanking = _sr[0]; var setShowRanking = _sr[1];
  var _sng = useState(false); var showNextGen = _sng[0]; var setShowNextGen = _sng[1];
  var _stl = useState(false); var showTimeline = _stl[0]; var setShowTimeline = _stl[1];
  var _scal = useState(false); var showCalendar = _scal[0]; var setShowCalendar = _scal[1];
  var _svid = useState(false); var showVideos = _svid[0]; var setShowVideos = _svid[1];
  var initDone = useRef(false);

  useEffect(function() { if (popupDismissed) return; var t = setTimeout(function() { setShowInstallPopup(true); }, 15000); return function() { clearTimeout(t); }; }, [popupDismissed]);
  useEffect(function() { if (!cacheExpiresAt) return; var tick = function() { setTimeLeft(Math.max(0, cacheExpiresAt - Date.now())); }; tick(); var iv = setInterval(tick, 15000); return function() { clearInterval(iv); }; }, [cacheExpiresAt]);

  useEffect(function() {
    var manifest = { name: "Fonseca News", short_name: "Fonseca News", start_url: "/", display: "standalone", background_color: "#FAFAFA", theme_color: "#00A859", orientation: "portrait",
      icons: [{ src: "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="100" fill="#0a1628"/><text x="135" y="360" font-family="Georgia,serif" font-weight="900" font-size="280" fill="#00A859">F</text><text x="300" y="360" font-family="Georgia,serif" font-weight="900" font-size="280" fill="#FFCB05">N</text></svg>'), sizes: "512x512", type: "image/svg+xml" }] };
    var blob = new Blob([JSON.stringify(manifest)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var link = document.querySelector('link[rel="manifest"]');
    if (!link) { link = document.createElement("link"); link.rel = "manifest"; document.head.appendChild(link); }
    link.href = url;
    [["theme-color","#00A859"],["apple-mobile-web-app-capable","yes"],["apple-mobile-web-app-status-bar-style","default"],["apple-mobile-web-app-title","Fonseca News"]].forEach(function(pair) { var n = pair[0]; var c = pair[1]; var m = document.querySelector('meta[name="' + n + '"]'); if (!m) { m = document.createElement("meta"); m.name = n; document.head.appendChild(m); } m.content = c; });
    document.title = "Fonseca News · João Fonseca #" + (dp ? dp.ranking : 39) + " ATP";

    var faviconSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#0a1628"/><text x="3" y="24" font-family="Georgia,serif" font-weight="900" font-size="18" fill="#00A859">F</text><text x="17" y="24" font-family="Georgia,serif" font-weight="900" font-size="18" fill="#FFCB05">N</text></svg>';
    var favicon = document.querySelector('link[rel="icon"]');
    if (!favicon) { favicon = document.createElement("link"); favicon.rel = "icon"; document.head.appendChild(favicon); }
    favicon.type = "image/svg+xml";
    favicon.href = "data:image/svg+xml," + encodeURIComponent(faviconSvg);

    var touchIconSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180"><rect width="180" height="180" rx="36" fill="#0a1628"/><text x="18" y="130" font-family="Georgia,serif" font-weight="900" font-size="100" fill="#00A859">F</text><text x="95" y="130" font-family="Georgia,serif" font-weight="900" font-size="100" fill="#FFCB05">N</text></svg>';
    var touchIcon = document.querySelector('link[rel="apple-touch-icon"]');
    if (!touchIcon) { touchIcon = document.createElement("link"); touchIcon.rel = "apple-touch-icon"; document.head.appendChild(touchIcon); }
    touchIcon.href = "data:image/svg+xml," + encodeURIComponent(touchIconSvg);

    var ogTags = [
      ["og:title", "Fonseca News · João Fonseca #" + (dp ? dp.ranking : 39) + " ATP"],
      ["og:description", "🎾 Sua bússola para acompanhar João Fonseca. Ranking #" + (dp ? dp.ranking : 39) + " ATP · Notícias, resultados, quiz e enquetes."],
      ["og:type", "website"], ["og:site_name", "Fonseca News"], ["og:locale", "pt_BR"],
      ["og:url", "https://fonsecanews.com.br"],
      ["og:image", "https://www.atptour.com/-/media/alias/player-headshot/f0fv"],
      ["twitter:card", "summary"],
      ["twitter:site", "@JFonsecaNews"],
      ["twitter:title", "Fonseca News · João Fonseca #" + (dp ? dp.ranking : 39) + " ATP"],
      ["twitter:description", "🎾 Notícias, ranking, quiz e enquetes sobre o João Fonseca. Acesse agora!"],
      ["twitter:image", "https://www.atptour.com/-/media/alias/player-headshot/f0fv"],
    ];
    ogTags.forEach(function(pair) {
      var prop = pair[0]; var content = pair[1]; var isOg = prop.startsWith("og:");
      var selector = isOg ? ('meta[property="' + prop + '"]') : ('meta[name="' + prop + '"]');
      var tag = document.querySelector(selector);
      if (!tag) { tag = document.createElement("meta"); if (isOg) tag.setAttribute("property", prop); else tag.name = prop; document.head.appendChild(tag); }
      tag.content = content;
    });
    var descMeta = document.querySelector('meta[name="description"]');
    if (!descMeta) { descMeta = document.createElement("meta"); descMeta.name = "description"; document.head.appendChild(descMeta); }
    descMeta.content = "Fonseca News — Sua bússola para acompanhar João Fonseca, #" + (dp ? dp.ranking : 39) + " ATP. Notícias, resultados, ranking, quiz interativo e enquetes diárias sobre o maior talento do tênis brasileiro.";

    var GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-J5CD56E1VX";
    if (GA_ID && !document.querySelector('script[src*="googletagmanager"]')) {
      var gaScript = document.createElement("script"); gaScript.async = true;
      gaScript.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID; document.head.appendChild(gaScript);
      var gaInit = document.createElement("script");
      gaInit.textContent = "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','" + GA_ID + "');";
      document.head.appendChild(gaInit);
    }

    var handler = function(e) { e.preventDefault(); setDeferredPrompt(e); setShowInstallBanner(true); };
    window.addEventListener("beforeinstallprompt", handler);
    if ("serviceWorker" in navigator) { var sw = new Blob(["self.addEventListener('install',e=>{self.skipWaiting()});self.addEventListener('activate',e=>{e.waitUntil(clients.claim())});self.addEventListener('fetch',e=>{e.respondWith(fetch(e.request).catch(()=>new Response('Offline')))});"], { type: "application/javascript" }); navigator.serviceWorker.register(URL.createObjectURL(sw)).catch(function() {}); }
    return function() { window.removeEventListener("beforeinstallprompt", handler); URL.revokeObjectURL(url); };
  }, []);

  var handleInstall = async function() { if (!deferredPrompt) return; deferredPrompt.prompt(); var r = await deferredPrompt.userChoice; if (r.outcome === "accepted") setShowInstallBanner(false); setDeferredPrompt(null); };
  var dismissPopup = function() { setShowInstallPopup(false); setPopupDismissed(true); };

  var loadCache = async function() {
    try { var raw = localStorage.getItem("jf-news-v4"); if (raw) { var c = JSON.parse(raw); if (Date.now() - c.timestamp < CACHE_DURATION_MS && c.news && c.news.length) { setNews(c.news); setNextMatch(c.nextMatch||null); setLastMatch(c.lastMatch||null); setPlayer(c.player||null); setSeason(c.season||null); setIsLive(true); setLastUpdate(new Date(c.timestamp).toISOString()); setCacheExpiresAt(c.timestamp+CACHE_DURATION_MS); setCacheStatus("cached"); return true; } } } catch(e) { console.log(e); }
    return false;
  };
  var saveCache = async function(d) { try { var o = Object.assign({}, d, { timestamp: Date.now() }); localStorage.setItem("jf-news-v4", JSON.stringify(o)); setCacheExpiresAt(o.timestamp+CACHE_DURATION_MS); } catch(e) { console.error(e); } };

  var fetchNews = async function() {
    setLoading(true); setCacheStatus("loading");
    try {
      var res = await fetch("/api/news");
      if (!res.ok) throw new Error("" + res.status);
      var p = await res.json();
      if (p && p.news && p.news.length) {
        setNews(p.news); setNextMatch(p.nextMatch||null); setLastMatch(p.lastMatch||null); setPlayer(p.player||null); setSeason(p.season||null);
        setIsLive(true); setLastUpdate(new Date().toISOString()); setCacheStatus("live");
        await saveCache({ news:p.news, nextMatch:p.nextMatch, lastMatch:p.lastMatch, player:p.player, season:p.season });
      } else throw new Error("No data");
    } catch(e) { console.error(e); setCacheStatus("error"); }
    finally { setLoading(false); }
  };

  var handleRefresh = async function() { await fetchNews(); };

  useEffect(function() { if (initDone.current) return; initDone.current = true; (async function() { if (!(await loadCache())) await fetchNews(); })(); }, []);

  var dn = news.length > 0 ? news : SAMPLE_NEWS;
  var dm = nextMatch || (news.length === 0 ? SAMPLE_NEXT_MATCH : null);
  var dl = lastMatch || (news.length === 0 ? SAMPLE_LAST_MATCH : null);
  var dp = player || (news.length === 0 ? SAMPLE_PLAYER : null);
  var ds = season || (news.length === 0 ? SAMPLE_SEASON : null);

  return (
    <div style={{ minHeight: "100vh", background: BG }}>
      <style>{
        "@import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@600;700;800&family=Inter:wght@400;500;600;700;800&display=swap');" +
        "*{box-sizing:border-box;margin:0;padding:0}" +
        "@keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}" +
        "@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}" +
        "@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}" +
        "@keyframes slideUp{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:translateY(0)}}" +
        "@keyframes fadeInOverlay{from{opacity:0}to{opacity:1}}" +
        "body{background:" + BG + "}"
      }</style>

      {/* BRAZILIAN STRIPE */}
      <div style={{ height: 3, background: "linear-gradient(90deg, " + GREEN + " 0%, " + GREEN + " 50%, " + YELLOW + " 50%, " + YELLOW + " 100%)" }} />

      {/* HEADER */}
      <header style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid " + BORDER }}>
        <div style={{ height: 2, background: "linear-gradient(90deg, " + GREEN + " 0%, " + GREEN + " 50%, " + YELLOW + " 50%, " + YELLOW + " 100%)" }} />
        <div style={{ padding: "4px 16px", background: "#F8F9FA", borderBottom: "1px solid " + BORDER, textAlign: "center" }}>
          <span style={{ fontSize: 9.5, color: TEXT_DIM, fontFamily: "'Inter', -apple-system, sans-serif", fontWeight: 500, letterSpacing: "0.02em" }}>Site independente de fãs · Não oficial</span>
        </div>
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "22px 16px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
              {/* GREEN/YELLOW LOGO */}
              <div style={{ width: 52, height: 52, borderRadius: 16, background: "linear-gradient(135deg, #0a1628, #132440)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 3px 12px rgba(0,0,0,0.2)" }}>
                <span style={{ fontWeight: 900, fontSize: 20, fontFamily: "'Source Serif 4', Georgia, serif", letterSpacing: "-0.02em" }}>
                  <span style={{ color: GREEN }}>F</span><span style={{ color: YELLOW }}>N</span>
                </span>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 22, fontWeight: 800, color: TEXT_PRIMARY, fontFamily: "'Source Serif 4', Georgia, serif", letterSpacing: "-0.03em", whiteSpace: "nowrap" }}>Fonseca News</span>
                  {dp && (
                    <div style={{ display: "flex", alignItems: "center", gap: 3, background: ACCENT_LIGHT, borderRadius: 6, padding: "2px 7px", border: "1px solid #C8E6D8" }}>
                      <span style={{ fontSize: 11.5, fontWeight: 800, color: GREEN, fontFamily: "'Inter', -apple-system, sans-serif" }}>{"#" + dp.ranking}</span>
                      <span style={{ fontSize: 9, color: TEXT_DIM, fontFamily: "'Inter', -apple-system, sans-serif", fontWeight: 600 }}>ATP</span>
                      {(function() {
                        var val = typeof dp.rankingChange === "number" ? dp.rankingChange : parseInt(String(dp.rankingChange).replace(/[^0-9-]/g, ""), 10);
                        if (!val || val === 0) return null;
                        var up = val > 0;
                        return (<span style={{ fontSize: 9, fontWeight: 700, color: up ? GREEN : RED, fontFamily: "'Inter', -apple-system, sans-serif" }}>{up ? "▲" : "▼"}{Math.abs(val)}</span>);
                      })()}
                    </div>
                  )}
                </div>
                <p style={{ margin: "1px 0 0 0", fontSize: 10.5, color: TEXT_DIM, fontFamily: "'Inter', -apple-system, sans-serif", fontWeight: 500, display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
                  {/* Live indicator - shows during tournament dates */}
                  {(function() {
                    if (!dm || !dm.date) return null;
                    var matchDate = new Date(dm.date);
                    var now = new Date();
                    var daysDiff = (matchDate - now) / (1000 * 60 * 60 * 24);
                    if (daysDiff <= 7 && daysDiff >= -7) {
                      return (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: RED + "12", borderRadius: 6, padding: "1px 7px", marginRight: 2 }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: RED, display: "inline-block", animation: "pulse 1.5s ease-in-out infinite" }} />
                          <span style={{ fontSize: 9, fontWeight: 700, color: RED, fontFamily: "'Inter', sans-serif", textTransform: "uppercase", letterSpacing: "0.05em" }}>Torneio</span>
                        </span>
                      );
                    }
                    return null;
                  })()}
                  <span>João Fonseca 🇧🇷</span>
                  {lastUpdate ? (" · " + formatTimeAgo(lastUpdate)) : " · Carregando..."}
                  {dn.length > 0 && (" · " + dn.length + " notícias")}
                </p>
              </div>
            </div>
            {/* REFRESH BUTTON IN HEADER */}
            <button onClick={handleRefresh} disabled={loading} style={{ flexShrink: 0, width: 36, height: 36, borderRadius: 10, background: loading ? "#F0F0F0" : "#F8F9FA", border: "1px solid " + BORDER, color: loading ? TEXT_DIM : TEXT_SECONDARY, display: "flex", alignItems: "center", justifyContent: "center", cursor: loading ? "default" : "pointer", transition: "all 0.2s" }} title="Atualizar dados">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={loading ? { animation: "spin 1s linear infinite" } : {}}>
                <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* SLOGAN */}
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "14px 24px", background: BG_WHITE, borderLeft: "1px solid " + BORDER, borderRight: "1px solid " + BORDER, borderBottom: "1px solid " + BORDER, textAlign: "center" }}>
        <p style={{ margin: 0, fontSize: 13, color: TEXT_SECONDARY, fontFamily: "'Source Serif 4', Georgia, serif", fontStyle: "italic", lineHeight: 1.6 }}>
          🧭 Sua bússola para acompanhar <strong style={{ color: TEXT_PRIMARY }}>João Fonseca</strong>, um futuro ídolo do tênis brasileiro.
        </p>
      </div>

      {/* NEXT DUEL CARD */}
      <NextDuelCard match={dm} player={dp} isLive={isLive} />

      {/* EXPANDABLE MENU */}
      <div style={{ maxWidth: 680, margin: "0 auto", borderLeft: "1px solid " + BORDER, borderRight: "1px solid " + BORDER, background: BG_WHITE }}>
        <button onClick={function() { setShowMenu(!showMenu); }} style={{ width: "100%", padding: "12px 24px", background: showMenu ? "#F8F9FA" : BG_WHITE, border: "none", borderBottom: "1px solid " + BORDER, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "background 0.2s" }}>
          <span style={{ fontSize: 14 }}>☰</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: TEXT_PRIMARY, fontFamily: "'Inter', sans-serif", textTransform: "uppercase", letterSpacing: "0.08em" }}>Mais</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={TEXT_DIM} strokeWidth="2.5" strokeLinecap="round" style={{ transition: "transform 0.3s", transform: showMenu ? "rotate(180deg)" : "rotate(0)" }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {showMenu && (
          <div style={{ padding: "8px 16px 12px", borderBottom: "1px solid " + BORDER, animation: "fadeIn 0.25s ease" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>

              <button onClick={function() { setShowBio(true); setShowMenu(false); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "#F8F9FA", border: "1px solid " + BORDER, borderRadius: 12, cursor: "pointer", transition: "background 0.15s" }}>
                <span style={{ fontSize: 18, width: 28, textAlign: "center" }}>👤</span>
                <div style={{ textAlign: "left" }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: TEXT_PRIMARY, fontFamily: "'Inter', sans-serif", display: "block" }}>Biografia</span>
                  <span style={{ fontSize: 10, color: TEXT_DIM, fontFamily: "'Inter', sans-serif" }}>Conheça o João</span>
                </div>
              </button>

              <button onClick={function() { setShowTitles(true); setShowMenu(false); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "#F8F9FA", border: "1px solid " + BORDER, borderRadius: 12, cursor: "pointer", transition: "background 0.15s", width: "100%" }}>
                <span style={{ fontSize: 18, width: 28, textAlign: "center" }}>🏆</span>
                <div style={{ textAlign: "left" }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: TEXT_PRIMARY, fontFamily: "'Inter', sans-serif", display: "block" }}>Conquistas</span>
                  <span style={{ fontSize: 10, color: TEXT_DIM, fontFamily: "'Inter', sans-serif" }}>Títulos e recordes</span>
                </div>
              </button>

              <button onClick={function() { setShowRanking(true); setShowMenu(false); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "#F8F9FA", border: "1px solid " + BORDER, borderRadius: 12, cursor: "pointer", transition: "background 0.15s", width: "100%" }}>
                <span style={{ fontSize: 18, width: 28, textAlign: "center" }}>📈</span>
                <div style={{ textAlign: "left" }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: TEXT_PRIMARY, fontFamily: "'Inter', sans-serif", display: "block" }}>Evolução Ranking</span>
                  <span style={{ fontSize: 10, color: TEXT_DIM, fontFamily: "'Inter', sans-serif" }}>Gráfico interativo</span>
                </div>
              </button>

              <button onClick={function() { setShowTimeline(true); setShowMenu(false); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "#F8F9FA", border: "1px solid " + BORDER, borderRadius: 12, cursor: "pointer", transition: "background 0.15s", width: "100%" }}>
                <span style={{ fontSize: 18, width: 28, textAlign: "center" }}>📅</span>
                <div style={{ textAlign: "left" }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: TEXT_PRIMARY, fontFamily: "'Inter', sans-serif", display: "block" }}>Timeline</span>
                  <span style={{ fontSize: 10, color: TEXT_DIM, fontFamily: "'Inter', sans-serif" }}>Carreira completa</span>
                </div>
              </button>

              <button onClick={function() { setShowNextGen(true); setShowMenu(false); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "#F8F9FA", border: "1px solid " + BORDER, borderRadius: 12, cursor: "pointer", transition: "background 0.15s", width: "100%" }}>
                <span style={{ fontSize: 18, width: 28, textAlign: "center" }}>⚡</span>
                <div style={{ textAlign: "left" }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: TEXT_PRIMARY, fontFamily: "'Inter', sans-serif", display: "block" }}>Next Gen</span>
                  <span style={{ fontSize: 10, color: TEXT_DIM, fontFamily: "'Inter', sans-serif" }}>Comparador de rivais</span>
                </div>
              </button>

              <button onClick={function() { setShowCalendar(true); setShowMenu(false); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "#F8F9FA", border: "1px solid " + BORDER, borderRadius: 12, cursor: "pointer", transition: "background 0.15s", width: "100%" }}>
                <span style={{ fontSize: 18, width: 28, textAlign: "center" }}>🗓️</span>
                <div style={{ textAlign: "left" }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: TEXT_PRIMARY, fontFamily: "'Inter', sans-serif", display: "block" }}>Calendário</span>
                  <span style={{ fontSize: 10, color: TEXT_DIM, fontFamily: "'Inter', sans-serif" }}>ATP 2026</span>
                </div>
              </button>

              <button onClick={function() { setShowVideos(true); setShowMenu(false); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "#F8F9FA", border: "1px solid " + BORDER, borderRadius: 12, cursor: "pointer", transition: "background 0.15s", width: "100%" }}>
                <span style={{ fontSize: 18, width: 28, textAlign: "center" }}>🎬</span>
                <div style={{ textAlign: "left" }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: TEXT_PRIMARY, fontFamily: "'Inter', sans-serif", display: "block" }}>Vídeos</span>
                  <span style={{ fontSize: 10, color: TEXT_DIM, fontFamily: "'Inter', sans-serif" }}>Highlights e entrevistas</span>
                </div>
              </button>

              <a href="https://www.instagram.com/joaoffonseca" target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "#F8F9FA", border: "1px solid " + BORDER, borderRadius: 12, textDecoration: "none", cursor: "pointer", transition: "background 0.15s" }}>
                <span style={{ fontSize: 18, width: 28, textAlign: "center" }}>📸</span>
                <div style={{ textAlign: "left" }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: TEXT_PRIMARY, fontFamily: "'Inter', sans-serif", display: "block" }}>Instagram</span>
                  <span style={{ fontSize: 10, color: TEXT_DIM, fontFamily: "'Inter', sans-serif" }}>@joaoffonseca</span>
                </div>
              </a>

              <button onClick={function() { setShowShare(true); setShowMenu(false); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "#F8F9FA", border: "1px solid " + BORDER, borderRadius: 12, cursor: "pointer", transition: "background 0.15s", width: "100%" }}>
                <span style={{ fontSize: 18, width: 28, textAlign: "center" }}>🔗</span>
                <div style={{ textAlign: "left" }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: TEXT_PRIMARY, fontFamily: "'Inter', sans-serif", display: "block" }}>Compartilhar</span>
                  <span style={{ fontSize: 10, color: TEXT_DIM, fontFamily: "'Inter', sans-serif" }}>WhatsApp, Email, Link</span>
                </div>
              </button>

            </div>
          </div>
        )}
      </div>

      {/* INSTALL POPUP - REDESIGNED */}
      {showInstallPopup && !popupDismissed && (function() {
        var device = detectDevice();
        var ShareIcon = function() { return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle" }}><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>); };
        var MenuIcon = function() { return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2" strokeLinecap="round" style={{ verticalAlign: "middle" }}><circle cx="12" cy="5" r="1.5" fill={GREEN}/><circle cx="12" cy="12" r="1.5" fill={GREEN}/><circle cx="12" cy="19" r="1.5" fill={GREEN}/></svg>); };
        var PlusIcon = function() { return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2.5" strokeLinecap="round" style={{ verticalAlign: "middle" }}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>); };
        var CheckIcon = function() { return (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle" }}><polyline points="20 6 9 17 4 12"/></svg>); };
        var StepNumber = function(p) { return (<div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, " + GREEN + ", #007A3D)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0, fontFamily: "'Inter', sans-serif" }}>{p.n}</div>); };

        return (
        <div onClick={dismissPopup} style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", display: "flex", alignItems: device === "ios" ? "flex-end" : "center", justifyContent: "center", padding: device === "ios" ? "0 0 0 0" : 16, animation: "fadeInOverlay 0.3s ease" }}>
          <div onClick={function(e) { e.stopPropagation(); }} style={{ background: BG_WHITE, borderRadius: device === "ios" ? "24px 24px 0 0" : 24, padding: "28px 24px 24px", maxWidth: 400, width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 -4px 40px rgba(0,0,0,0.2)", animation: "slideUp 0.4s ease", position: "relative" }}>
            {/* Close button */}
            <button onClick={dismissPopup} style={{ position: "absolute", top: 14, right: 16, background: "#F0F0F0", border: "none", color: TEXT_DIM, fontSize: 16, cursor: "pointer", width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>

            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ width: 60, height: 60, borderRadius: 16, margin: "0 auto 12px", background: "linear-gradient(135deg, #0a1628, #132440)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
                <span style={{ fontWeight: 900, fontSize: 22, fontFamily: "'Source Serif 4', Georgia, serif" }}>
                  <span style={{ color: GREEN }}>F</span><span style={{ color: YELLOW }}>N</span>
                </span>
              </div>
              <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 800, color: TEXT_PRIMARY, fontFamily: "'Source Serif 4', Georgia, serif" }}>Instale o Fonseca News</h2>
              <p style={{ margin: 0, fontSize: 13, color: TEXT_SECONDARY, fontFamily: "'Inter', sans-serif", lineHeight: 1.5 }}>Acompanhe cada ponto do João direto da tela do seu celular!</p>
            </div>

            {/* Benefits */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20, justifyContent: "center", flexWrap: "wrap" }}>
              {[["⚡","Acesso rápido"],["🔔","Tempo real"],["📱","Tela cheia"]].map(function(b, i) {
                return (<div key={i} style={{ display: "flex", alignItems: "center", gap: 5, background: ACCENT_LIGHT, borderRadius: 8, padding: "5px 10px", border: "1px solid #C8E6D8" }}>
                  <span style={{ fontSize: 13 }}>{b[0]}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: GREEN, fontFamily: "'Inter', sans-serif" }}>{b[1]}</span>
                </div>);
              })}
            </div>

            {/* Native install button for Android/Chrome */}
            {deferredPrompt && (
              <div style={{ marginBottom: 16 }}>
                <button onClick={function() { handleInstall(); dismissPopup(); }} style={{ width: "100%", background: "linear-gradient(135deg, " + GREEN + ", #007A3D)", color: "#fff", border: "none", borderRadius: 14, padding: "14px 0", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'Inter', sans-serif", boxShadow: "0 4px 14px rgba(0,168,89,0.35)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <span style={{ fontSize: 18 }}>📲</span> Instalar agora
                </button>
                <p style={{ margin: "8px 0 0", textAlign: "center", fontSize: 11, color: TEXT_DIM, fontFamily: "'Inter', sans-serif" }}>Instalação direta em 1 toque!</p>
              </div>
            )}

            {/* iOS Instructions */}
            {device === "ios" && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
                  <span style={{ fontSize: 16 }}>🍎</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: TEXT_PRIMARY, fontFamily: "'Inter', sans-serif", textTransform: "uppercase", letterSpacing: "0.05em" }}>No iPhone / iPad (Safari)</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {/* Step 1 */}
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <StepNumber n="1" />
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: "0 0 4px", fontSize: 13.5, fontWeight: 600, color: TEXT_PRIMARY, fontFamily: "'Inter', sans-serif" }}>Toque no botão <strong>Compartilhar</strong></p>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#F0F7FF", border: "1px solid #D0E3FF", borderRadius: 8, padding: "6px 12px" }}>
                        <ShareIcon />
                        <span style={{ fontSize: 12, color: "#0066FF", fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>Este ícone na barra inferior do Safari</span>
                      </div>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <StepNumber n="2" />
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: "0 0 4px", fontSize: 13.5, fontWeight: 600, color: TEXT_PRIMARY, fontFamily: "'Inter', sans-serif" }}>Role para baixo e toque em:</p>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#F8F9FA", border: "1px solid " + BORDER, borderRadius: 8, padding: "8px 14px" }}>
                        <PlusIcon />
                        <span style={{ fontSize: 13, color: TEXT_PRIMARY, fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>Adicionar à Tela de Início</span>
                      </div>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <StepNumber n="3" />
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: "0 0 4px", fontSize: 13.5, fontWeight: 600, color: TEXT_PRIMARY, fontFamily: "'Inter', sans-serif" }}>Toque em <strong>&quot;Adicionar&quot;</strong> no canto superior direito</p>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: ACCENT_LIGHT, border: "1px solid #C8E6D8", borderRadius: 8, padding: "6px 12px" }}>
                        <CheckIcon />
                        <span style={{ fontSize: 12, color: GREEN, fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>Pronto! O app aparece na sua tela</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 14, padding: "10px 14px", background: "#FFF8E8", borderRadius: 10, border: "1px solid #FFE8A8", display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>⚠️</span>
                  <p style={{ margin: 0, fontSize: 11.5, color: "#8B6914", fontFamily: "'Inter', sans-serif", lineHeight: 1.5 }}><strong>Importante:</strong> Funciona apenas no <strong>Safari</strong>. Se estiver em outro navegador (Chrome, Firefox), abra <strong>fonsecanews.com.br</strong> no Safari primeiro.</p>
                </div>
              </div>
            )}

            {/* Android Instructions */}
            {device === "android" && !deferredPrompt && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
                  <span style={{ fontSize: 16 }}>🤖</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: TEXT_PRIMARY, fontFamily: "'Inter', sans-serif", textTransform: "uppercase", letterSpacing: "0.05em" }}>No Android (Chrome)</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {/* Step 1 */}
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <StepNumber n="1" />
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: "0 0 4px", fontSize: 13.5, fontWeight: 600, color: TEXT_PRIMARY, fontFamily: "'Inter', sans-serif" }}>Toque nos <strong>3 pontinhos</strong></p>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#F8F9FA", border: "1px solid " + BORDER, borderRadius: 8, padding: "6px 12px" }}>
                        <MenuIcon />
                        <span style={{ fontSize: 12, color: TEXT_SECONDARY, fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>No canto superior direito do Chrome</span>
                      </div>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <StepNumber n="2" />
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: "0 0 4px", fontSize: 13.5, fontWeight: 600, color: TEXT_PRIMARY, fontFamily: "'Inter', sans-serif" }}>Toque em:</p>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#F8F9FA", border: "1px solid " + BORDER, borderRadius: 8, padding: "8px 14px" }}>
                        <span style={{ fontSize: 14 }}>📲</span>
                        <span style={{ fontSize: 13, color: TEXT_PRIMARY, fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>&quot;Adicionar à tela inicial&quot;</span>
                      </div>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <StepNumber n="3" />
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: "0 0 4px", fontSize: 13.5, fontWeight: 600, color: TEXT_PRIMARY, fontFamily: "'Inter', sans-serif" }}>Confirme tocando em <strong>&quot;Instalar&quot;</strong></p>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: ACCENT_LIGHT, border: "1px solid #C8E6D8", borderRadius: 8, padding: "6px 12px" }}>
                        <CheckIcon />
                        <span style={{ fontSize: 12, color: GREEN, fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>Pronto! O app aparece na sua tela</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Desktop Instructions */}
            {device === "desktop" && !deferredPrompt && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
                  <span style={{ fontSize: 16 }}>💻</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: TEXT_PRIMARY, fontFamily: "'Inter', sans-serif", textTransform: "uppercase", letterSpacing: "0.05em" }}>No Computador (Chrome)</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <StepNumber n="1" />
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: TEXT_PRIMARY, fontFamily: "'Inter', sans-serif" }}>Clique no ícone de <strong>instalação</strong> (📲) na barra de endereço, ou vá em <strong>⋮ → &quot;Instalar Fonseca News&quot;</strong></p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Dismiss button */}
            <button onClick={dismissPopup} style={{ width: "100%", background: "none", color: TEXT_DIM, border: "none", padding: "10px 0 4px", fontSize: 13, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>Agora não</button>
          </div>
        </div>
        );
      })()}

      {/* BIO POPUP */}
      {showBio && (
        <div onClick={function() { setShowBio(false); }} style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, animation: "fadeInOverlay 0.3s ease", overflowY: "auto" }}>
          <div onClick={function(e) { e.stopPropagation(); }} style={{ background: BG_WHITE, borderRadius: 20, padding: "28px 24px", maxWidth: 400, width: "100%", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", animation: "slideUp 0.4s ease" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg, #0a1628, #132440)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 16, fontFamily: "'Source Serif 4', Georgia, serif" }}><span style={{ color: GREEN }}>F</span><span style={{ color: YELLOW }}>N</span></div>
                <div>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: TEXT_PRIMARY, fontFamily: "'Source Serif 4', Georgia, serif" }}>João Fonseca</h2>
                  <p style={{ margin: 0, fontSize: 11, color: TEXT_DIM, fontFamily: "'Inter', -apple-system, sans-serif" }}>Tenista profissional 🇧🇷</p>
                </div>
              </div>
              <button onClick={function() { setShowBio(false); }} style={{ background: "none", border: "none", color: TEXT_DIM, fontSize: 20, cursor: "pointer", padding: "4px 8px" }}>✕</button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {[["🎂","21/08/2006"],["📍","Ipanema, Rio de Janeiro"],["📏","1,83m"],["🎾","Destro"],["👟","Profissional desde 2024"],["🏆","Melhor ranking: #24 ATP"]].map(function(pair, i) { return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, background: "#F8F9FA", borderRadius: 6, padding: "4px 10px" }}>
                  <span style={{ fontSize: 12 }}>{pair[0]}</span>
                  <span style={{ fontSize: 11.5, color: TEXT_SECONDARY, fontFamily: "'Inter', -apple-system, sans-serif", fontWeight: 500 }}>{pair[1]}</span>
                </div>
              ); })}
            </div>
            <div style={{ fontSize: 13.5, color: TEXT_SECONDARY, fontFamily: "'Inter', -apple-system, sans-serif", lineHeight: 1.7 }}>
              <p style={{ marginBottom: 12 }}>Nascido em Ipanema, Rio de Janeiro, filho de Roberta e Christiano Fonseca. Começou a jogar tênis aos 4 anos no Country Club do Rio. Antes da raquete, jogava futsal.</p>
              <p style={{ marginBottom: 12 }}>Em 2023, com apenas 16 anos, conquistou o US Open Juvenil e se tornou o primeiro brasileiro a terminar como nº1 do ranking mundial de juniores. Também ajudou o Brasil a vencer a Copa Davis Juvenil pela primeira vez.</p>
              <p style={{ marginBottom: 12 }}>Se profissionalizou em 2024. Na estreia no Rio Open, aplicou 6-0 no primeiro set contra Arthur Fils, então top 40.</p>
              <p style={{ marginBottom: 12 }}>Em janeiro de 2025, derrotou Andrey Rublev (top 10) na estreia do Australian Open — primeiro adolescente desde 2002 a vencer top 10 na 1ª rodada de um Grand Slam.</p>
              <p style={{ marginBottom: 12 }}>Conquistou o ATP 250 de Buenos Aires (fev/2025) e o ATP 500 de Basel (out/2025) — primeiro brasileiro a ganhar um ATP 500.</p>
              <p style={{ marginBottom: 0 }}>Aos 19 anos, já tem mais títulos ATP que Federer, Djokovic e Nadal tinham na mesma idade. É o nº1 do Brasil e uma das maiores promessas do tênis mundial.</p>
            </div>
            <div style={{ marginTop: 16, padding: "10px 12px", background: "#F8F9FA", borderRadius: 8, display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
              <span style={{ fontSize: 13 }}>📸</span>
              <a href="https://www.instagram.com/joaoffonseca" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: GREEN, fontFamily: "'Inter', -apple-system, sans-serif", fontWeight: 600, textDecoration: "none" }}>@joaoffonseca</a>
            </div>
          </div>
        </div>
      )}

      {/* TITLES POPUP */}
      {showTitles && (
        <div onClick={function() { setShowTitles(false); }} style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, animation: "fadeInOverlay 0.3s ease", overflowY: "auto" }}>
          <div onClick={function(e) { e.stopPropagation(); }} style={{ background: BG_WHITE, borderRadius: 20, padding: "28px 24px", maxWidth: 420, width: "100%", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", animation: "slideUp 0.4s ease" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: TEXT_PRIMARY, fontFamily: "'Source Serif 4', Georgia, serif" }}>🏆 Conquistas</h2>
              <button onClick={function() { setShowTitles(false); }} style={{ background: "none", border: "none", color: TEXT_DIM, fontSize: 20, cursor: "pointer", padding: "4px 8px" }}>✕</button>
            </div>
            <p style={{ margin: "0 0 16px", fontSize: 13, color: TEXT_SECONDARY, fontFamily: "'Inter', -apple-system, sans-serif" }}>8 títulos na carreira · 2 ATP Tour · 3 Challengers · 1 NextGen Finals · 1 Duplas · 1 Juvenil</p>
            <div style={{ marginBottom: 16 }}>
              <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: GREEN, fontFamily: "'Inter', -apple-system, sans-serif" }}>ATP Tour</p>
              {[
                { emoji: "🥇", title: "ATP 500 Basel", date: "Out 2025", surface: "Dura (indoor)", final_: "vs A. Davidovich Fokina", score: "6-3 6-4", note: "1º brasileiro a ganhar um ATP 500" },
                { emoji: "🥇", title: "ATP 250 Buenos Aires", date: "Fev 2025", surface: "Saibro", final_: "vs F. Cerúndolo", score: "6-4 7-6(1)", note: "Brasileiro mais jovem a ganhar um ATP" },
              ].map(function(t, i) { return (
                <div key={i} style={{ padding: "10px 12px", background: "#F8F9FA", borderRadius: 10, marginBottom: 6, borderLeft: "3px solid " + GREEN }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY, fontFamily: "'Source Serif 4', Georgia, serif" }}>{t.emoji} {t.title}</span>
                    <span style={{ fontSize: 11, color: TEXT_DIM, fontFamily: "'Inter', -apple-system, sans-serif" }}>{t.date}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: TEXT_SECONDARY, fontFamily: "'Inter', -apple-system, sans-serif", lineHeight: 1.5 }}>{t.surface} · Final: {t.final_} · {t.score}</p>
                  {t.note && <p style={{ margin: "4px 0 0", fontSize: 11, color: GREEN, fontFamily: "'Inter', -apple-system, sans-serif", fontWeight: 600 }}>{t.note}</p>}
                </div>
              ); })}
            </div>
            <div style={{ marginBottom: 16 }}>
              <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#E8734A", fontFamily: "'Inter', -apple-system, sans-serif" }}>Challengers</p>
              {[
                { title: "Challenger 175 Phoenix", date: "Mar 2025", surface: "Dura", final_: "vs A. Bublik", score: "7-6(5) 7-6(1)" },
                { title: "Challenger 125 Canberra", date: "Jan 2025", surface: "Dura", final_: "vs E. Quinn", score: "6-4 6-4" },
                { title: "Challenger 75 Lexington", date: "Ago 2024", surface: "Dura", final_: "vs Li Tu", score: "6-1 6-4", note: "1º título profissional" },
              ].map(function(t, i) { return (
                <div key={i} style={{ padding: "10px 12px", background: "#FFF8F5", borderRadius: 10, marginBottom: 6, borderLeft: "3px solid #E8734A" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY, fontFamily: "'Source Serif 4', Georgia, serif" }}>🎯 {t.title}</span>
                    <span style={{ fontSize: 11, color: TEXT_DIM, fontFamily: "'Inter', -apple-system, sans-serif" }}>{t.date}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: TEXT_SECONDARY, fontFamily: "'Inter', -apple-system, sans-serif" }}>{t.surface} · Final: {t.final_} · {t.score}</p>
                  {t.note && <p style={{ margin: "4px 0 0", fontSize: 11, color: "#E8734A", fontFamily: "'Inter', -apple-system, sans-serif", fontWeight: 600 }}>{t.note}</p>}
                </div>
              ); })}
            </div>
            <div>
              <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#7C3AED", fontFamily: "'Inter', -apple-system, sans-serif" }}>Outros destaques</p>
              {[
                { emoji: "⭐", title: "NextGen ATP Finals", date: "Dez 2024", detail: "Torneio sub-20 · Final: vs L. Tien · 3-1 (virada)" },
                { emoji: "🎾", title: "ATP Duplas Rio Open", date: "Fev 2026", detail: "Parceria com Marcelo Melo" },
                { emoji: "🌟", title: "US Open Juvenil", date: "2023", detail: "Nº1 mundial juvenil" },
                { emoji: "🇧🇷", title: "Copa Davis Juvenil", date: "2023", detail: "1ª conquista brasileira" },
              ].map(function(t, i) { return (
                <div key={i} style={{ padding: "8px 12px", background: "#F8F5FF", borderRadius: 10, marginBottom: 6, borderLeft: "3px solid #7C3AED" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY, fontFamily: "'Source Serif 4', Georgia, serif" }}>{t.emoji} {t.title}</span>
                    <span style={{ fontSize: 11, color: TEXT_DIM, fontFamily: "'Inter', -apple-system, sans-serif" }}>{t.date}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 11.5, color: TEXT_SECONDARY, fontFamily: "'Inter', -apple-system, sans-serif" }}>{t.detail}</p>
                </div>
              ); })}
            </div>
          </div>
        </div>
      )}

      {/* VIDEOS POPUP */}
      {showVideos && (
        <div onClick={function() { setShowVideos(false); }} style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, animation: "fadeInOverlay 0.3s ease", overflowY: "auto" }}>
          <div onClick={function(e) { e.stopPropagation(); }} style={{ background: BG_WHITE, borderRadius: 20, padding: "24px 16px", maxWidth: 560, width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", animation: "slideUp 0.4s ease" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, padding: "0 8px" }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: TEXT_PRIMARY, fontFamily: "'Source Serif 4', Georgia, serif" }}>🎬 Vídeos do João</h2>
              <button onClick={function() { setShowVideos(false); }} style={{ background: "none", border: "none", color: TEXT_DIM, fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>
            <p style={{ margin: "0 0 12px", padding: "0 8px", fontSize: 12, color: TEXT_SECONDARY, fontFamily: "'Inter', sans-serif" }}>Melhores momentos e highlights</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "0 8px" }}>
              {[
                { id: "fddSkeUwti4", title: "Fonseca vs Rublev — Australian Open 2025" },
                { id: "mJbJWh20K8Y", title: "Fonseca: estrela nascendo no AO 2025" },
              ].map(function(vid) {
                return (
                  <div key={vid.id} style={{ borderRadius: 12, overflow: "hidden", border: "1px solid " + BORDER }}>
                    <div style={{ position: "relative", paddingBottom: "56.25%", height: 0 }}>
                      <iframe src={"https://www.youtube.com/embed/" + vid.id} title={vid.title} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }} />
                    </div>
                    <div style={{ padding: "8px 12px" }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: TEXT_PRIMARY, fontFamily: "'Inter', sans-serif" }}>{vid.title}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <a href="https://www.youtube.com/results?search_query=João+Fonseca+tennis+highlights" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 20px", background: "#FF0000", color: "#fff", borderRadius: 10, fontSize: 13, fontWeight: 700, fontFamily: "'Inter', sans-serif", textDecoration: "none" }}>▶ Ver mais no YouTube</a>
            </div>
          </div>
        </div>
      )}

      {/* ATP CALENDAR POPUP */}
      {showCalendar && (
        <div onClick={function() { setShowCalendar(false); }} style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, animation: "fadeInOverlay 0.3s ease", overflowY: "auto" }}>
          <div onClick={function(e) { e.stopPropagation(); }} style={{ background: BG_WHITE, borderRadius: 20, padding: "24px 16px", maxWidth: 520, width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", animation: "slideUp 0.4s ease" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, padding: "0 8px" }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: TEXT_PRIMARY, fontFamily: "'Source Serif 4', Georgia, serif" }}>🗓️ Calendário ATP 2026</h2>
              <button onClick={function() { setShowCalendar(false); }} style={{ background: "none", border: "none", color: TEXT_DIM, fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>
            <p style={{ margin: "0 0 4px", padding: "0 8px", fontSize: 12, color: TEXT_SECONDARY, fontFamily: "'Inter', sans-serif" }}>Grand Slams, Masters 1000 e Finals</p>
            <ATPCalendar />
          </div>
        </div>
      )}

      {/* NEXT GEN COMPARATOR POPUP */}
      {showNextGen && (
        <div onClick={function() { setShowNextGen(false); }} style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, animation: "fadeInOverlay 0.3s ease", overflowY: "auto" }}>
          <div onClick={function(e) { e.stopPropagation(); }} style={{ background: BG_WHITE, borderRadius: 20, padding: "24px 16px", maxWidth: 650, width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", animation: "slideUp 0.4s ease" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, padding: "0 8px" }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: TEXT_PRIMARY, fontFamily: "'Source Serif 4', Georgia, serif" }}>⚡ Next Gen: Quem lidera?</h2>
              <button onClick={function() { setShowNextGen(false); }} style={{ background: "none", border: "none", color: TEXT_DIM, fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>
            <p style={{ margin: "0 0 8px", padding: "0 8px", fontSize: 12, color: TEXT_SECONDARY, fontFamily: "'Inter', sans-serif" }}>Os 4 maiores talentos sub-21 do tênis mundial</p>
            <NextGenComparator />
          </div>
        </div>
      )}

      {/* CAREER TIMELINE POPUP */}
      {showTimeline && (
        <div onClick={function() { setShowTimeline(false); }} style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, animation: "fadeInOverlay 0.3s ease", overflowY: "auto" }}>
          <div onClick={function(e) { e.stopPropagation(); }} style={{ background: BG_WHITE, borderRadius: 20, padding: "24px 16px", maxWidth: 500, width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", animation: "slideUp 0.4s ease" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, padding: "0 8px" }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: TEXT_PRIMARY, fontFamily: "'Source Serif 4', Georgia, serif" }}>📅 Timeline da carreira</h2>
              <button onClick={function() { setShowTimeline(false); }} style={{ background: "none", border: "none", color: TEXT_DIM, fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>
            <p style={{ margin: "0 0 4px", padding: "0 8px", fontSize: 12, color: TEXT_SECONDARY, fontFamily: "'Inter', sans-serif" }}>De Ipanema ao Top 40 mundial</p>
            <CareerTimeline />
          </div>
        </div>
      )}

      {/* RANKING CHART POPUP */}
      {showRanking && (
        <div onClick={function() { setShowRanking(false); }} style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, animation: "fadeInOverlay 0.3s ease", overflowY: "auto" }}>
          <div onClick={function(e) { e.stopPropagation(); }} style={{ background: BG_WHITE, borderRadius: 20, padding: "24px 16px", maxWidth: 650, width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", animation: "slideUp 0.4s ease" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, padding: "0 8px" }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: TEXT_PRIMARY, fontFamily: "'Source Serif 4', Georgia, serif" }}>📈 Evolução no Ranking</h2>
              <button onClick={function() { setShowRanking(false); }} style={{ background: "none", border: "none", color: TEXT_DIM, fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>
            <p style={{ margin: "0 0 8px", padding: "0 8px", fontSize: 12, color: TEXT_SECONDARY, fontFamily: "'Inter', sans-serif" }}>Posição de João Fonseca no ranking ATP ao longo do tempo</p>
            <RankingChart currentRanking={dp ? dp.ranking : 39} />
          </div>
        </div>
      )}

      {/* SHARE POPUP */}
      {showShare && (
        <div onClick={function() { setShowShare(false); }} style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, animation: "fadeInOverlay 0.3s ease" }}>
          <div onClick={function(e) { e.stopPropagation(); }} style={{ background: BG_WHITE, borderRadius: 20, padding: "28px 24px", maxWidth: 340, width: "100%", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", animation: "slideUp 0.4s ease" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: TEXT_PRIMARY, fontFamily: "'Source Serif 4', Georgia, serif" }}>🔗 Compartilhar</h3>
              <button onClick={function() { setShowShare(false); }} style={{ background: "none", border: "none", color: TEXT_DIM, fontSize: 18, cursor: "pointer" }}>✕</button>
            </div>
            <p style={{ margin: "0 0 16px", fontSize: 12.5, color: TEXT_SECONDARY, fontFamily: "'Inter', sans-serif" }}>Indique o Fonseca News para outros fãs do João!</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <a href={"https://wa.me/?text=" + encodeURIComponent("🎾 Fonseca News — Acompanhe o João Fonseca! fonsecanews.com.br")} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "#E8F8E8", borderRadius: 12, textDecoration: "none", border: "1px solid #C8E6C8", transition: "background 0.15s" }}>
                <span style={{ fontSize: 22 }}>💬</span>
                <div style={{ textAlign: "left" }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: "#1A7A1A", fontFamily: "'Inter', sans-serif", display: "block" }}>WhatsApp</span>
                  <span style={{ fontSize: 10.5, color: "#5A8A5A", fontFamily: "'Inter', sans-serif" }}>Enviar para contato ou grupo</span>
                </div>
              </a>
              <a href={"mailto:?subject=" + encodeURIComponent("Fonseca News — João Fonseca") + "&body=" + encodeURIComponent("Olha esse site sobre o João Fonseca! 🎾🇧🇷\n\nfonsecanews.com.br")} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "#F0F4FF", borderRadius: 12, textDecoration: "none", border: "1px solid #D0DFFF", transition: "background 0.15s" }}>
                <span style={{ fontSize: 22 }}>✉️</span>
                <div style={{ textAlign: "left" }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: "#2A5AA0", fontFamily: "'Inter', sans-serif", display: "block" }}>Email</span>
                  <span style={{ fontSize: 10.5, color: "#6A8ABB", fontFamily: "'Inter', sans-serif" }}>Compartilhar por email</span>
                </div>
              </a>
              <button onClick={function() { navigator.clipboard.writeText("fonsecanews.com.br").then(function() { setShowShare(false); }); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "#F8F9FA", borderRadius: 12, border: "1px solid " + BORDER, cursor: "pointer", width: "100%", transition: "background 0.15s" }}>
                <span style={{ fontSize: 22 }}>📋</span>
                <div style={{ textAlign: "left" }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: TEXT_PRIMARY, fontFamily: "'Inter', sans-serif", display: "block" }}>Copiar link</span>
                  <span style={{ fontSize: 10.5, color: TEXT_DIM, fontFamily: "'Inter', sans-serif" }}>fonsecanews.com.br</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Spacer before news */}
      <div style={{ maxWidth: 680, margin: "0 auto", height: 6, background: "#F5F5F5", borderLeft: "1px solid " + BORDER, borderRight: "1px solid " + BORDER }} />

      {/* NEWS FEED */}
      <main style={{ maxWidth: 680, margin: "0 auto", background: BG_WHITE, borderLeft: "1px solid " + BORDER, borderRight: "1px solid " + BORDER, minHeight: "70vh" }}>
        {/* Section label */}
        <div style={{ padding: "20px 24px 12px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ height: 1, flex: 1, background: BORDER }} />
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: TEXT_DIM, fontFamily: "'Inter', sans-serif", whiteSpace: "nowrap" }}>Últimas Notícias</span>
          <div style={{ height: 1, flex: 1, background: BORDER }} />
        </div>
        {loading && news.length === 0 && <Skeleton />}
        {dn.length > 0 && !(loading && news.length === 0) && (
          <div>{buildFeed(dn, ds, dl, function() { setShowVideos(true); })}</div>
        )}
        <div style={{ borderTop: "1px solid " + BORDER, padding: "28px 24px 36px" }}>
          {/* Conquistas bar */}
          <div onClick={function() { setShowTitles(true); }} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, flexWrap: "wrap", marginBottom: 24, cursor: "pointer", padding: "12px 16px", background: "#F8F9FA", borderRadius: 12, border: "1px solid " + BORDER }}>
            {[["🏆","2 títulos ATP"],["🎯","3 Challengers"],["🇧🇷","Nº1 do Brasil"],["⭐","NextGen Champion"]].map(function(pair, i) { return (
              <span key={i} style={{ fontSize: 11, color: TEXT_SECONDARY, fontFamily: "'Inter', -apple-system, sans-serif", fontWeight: 500 }}>{pair[0]} {pair[1]}</span>
            ); })}
            <span style={{ fontSize: 10, color: GREEN, fontFamily: "'Inter', -apple-system, sans-serif", fontWeight: 600 }}>Ver todos →</span>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
            <button onClick={function() { setShowShare(true); }} style={{ background: "none", border: "1px solid " + BORDER, borderRadius: 8, padding: "7px 16px", fontSize: 11.5, color: TEXT_SECONDARY, cursor: "pointer", fontFamily: "'Inter', -apple-system, sans-serif", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 5 }}>🔗 Compartilhar</button>
            <a href="mailto:thzgouvea@gmail.com?subject=Fonseca News — Contato" style={{ background: "none", border: "1px solid " + BORDER, borderRadius: 8, padding: "7px 16px", fontSize: 11.5, color: TEXT_SECONDARY, fontFamily: "'Inter', -apple-system, sans-serif", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 5, textDecoration: "none" }}>✉️ Fale conosco</a>
            <PixDonation />
          </div>

          <div style={{ textAlign: "center", marginTop: 16, marginBottom: 20 }}>
            <p style={{ margin: 0, fontSize: 10.5, color: TEXT_DIM, fontFamily: "'Inter', -apple-system, sans-serif" }}>📱 iPhone: Safari → (↑) → &quot;Tela de Início&quot; · Android: Chrome → (⋮) → &quot;Tela inicial&quot;</p>
          </div>
          <div style={{ borderTop: "1px solid " + BORDER, paddingTop: 18 }}>
            <p style={{ fontSize: 10, color: "#bbb", fontFamily: "'Inter', -apple-system, sans-serif", lineHeight: 1.6, maxWidth: 440, margin: "0 auto", textAlign: "center" }}>Fonseca News é um site independente de fãs, sem vínculo oficial com João Fonseca, sua equipe ou a ATP. Notícias agregadas de fontes públicas com devidos créditos.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
