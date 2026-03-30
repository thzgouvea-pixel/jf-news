// Fonseca News — Clean Redesign v1
import { useState, useEffect, useRef } from "react";

const GREEN = "#00A859";
const YELLOW = "#FFCB05";
const BG = "#FFFFFF";
const BG_ALT = "#F7F8F9";
const TEXT = "#1a1a1a";
const SUB = "#6b6b6b";
const DIM = "#a0a0a0";
const BORDER = "#e8e8e8";
const RED = "#c0392b";
const SERIF = "'Source Serif 4', Georgia, serif";
const SANS = "'Inter', -apple-system, sans-serif";

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
var formatMatchDate = function(d) { if (!d) return "Sem data confirmada"; try { var dt = new Date(d); return isNaN(dt.getTime()) ? d : dt.toLocaleDateString("pt-BR", { day: "numeric", month: "long" }); } catch(e) { return d; } };

var detectDevice = function() {
  if (typeof window === "undefined") return "unknown";
  var ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  return "desktop";
};

var catColors = {
  "Torneio": "#c0392b", "Treino": "#2A9D8F", "Declaração": "#b8860b",
  "Resultado": "#2563EB", "Ranking": "#6D35D0", "Notícia": "#6b6b6b",
};

// ===== COUNTDOWN HOOK =====
// ===== SHARE CARD GENERATOR =====
var generateShareCard = function(opts) {
  // opts: { type: "prediction"|"quiz", title, subtitle, value, emoji, matchInfo }
  var canvas = document.createElement("canvas");
  canvas.width = 1080; canvas.height = 1920; // Instagram Stories size
  var ctx = canvas.getContext("2d");

  // Background gradient
  var bg = ctx.createLinearGradient(0, 0, 1080, 1920);
  bg.addColorStop(0, "#0D1726"); bg.addColorStop(0.5, "#132440"); bg.addColorStop(1, "#0a1628");
  ctx.fillStyle = bg; ctx.fillRect(0, 0, 1080, 1920);

  // Subtle glow
  ctx.save();
  var glow = ctx.createRadialGradient(800, 400, 0, 800, 400, 500);
  glow.addColorStop(0, "rgba(0,168,89,0.08)"); glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow; ctx.fillRect(0, 0, 1080, 1920);
  var glow2 = ctx.createRadialGradient(200, 1400, 0, 200, 1400, 500);
  glow2.addColorStop(0, "rgba(255,203,5,0.06)"); glow2.addColorStop(1, "transparent");
  ctx.fillStyle = glow2; ctx.fillRect(0, 0, 1080, 1920);
  ctx.restore();

  // FN Logo
  ctx.font = "800 120px Georgia, serif";
  ctx.fillStyle = "#00A859"; ctx.fillText("F", 420, 500);
  ctx.fillStyle = "#FFCB05"; ctx.fillText("N", 520, 500);

  // "Fonseca News" below logo
  ctx.font = "600 36px Inter, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.textAlign = "center";
  ctx.fillText("FONSECA NEWS", 540, 570);

  // Emoji
  ctx.font = "120px sans-serif";
  ctx.fillText(opts.emoji || "🎾", 540, 780);

  // Title
  ctx.font = "800 64px Georgia, serif";
  ctx.fillStyle = "#fff";
  ctx.fillText(opts.title || "", 540, 920);

  // Value (big number / score)
  ctx.font = "800 140px Inter, sans-serif";
  ctx.fillStyle = "#00A859";
  ctx.fillText(opts.value || "", 540, 1120);

  // Subtitle
  ctx.font = "600 40px Inter, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fillText(opts.subtitle || "", 540, 1210);

  // Match info
  if (opts.matchInfo) {
    ctx.font = "600 32px Inter, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.fillText(opts.matchInfo, 540, 1300);
  }

  // Bottom CTA
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.beginPath();
  ctx.roundRect(240, 1640, 600, 80, 20);
  ctx.fill();
  ctx.font = "700 30px Inter, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fillText("fonsecanews.com.br", 540, 1692);

  // Top bar
  ctx.fillStyle = "#00A859";
  ctx.fillRect(0, 0, 540, 6);
  ctx.fillStyle = "#FFCB05";
  ctx.fillRect(540, 0, 540, 6);

  return canvas;
};

var shareCard = function(canvas, text) {
  canvas.toBlob(function(blob) {
    if (navigator.share && navigator.canShare) {
      var file = new File([blob], "fonseca-news.png", { type: "image/png" });
      var shareData = { text: text, files: [file] };
      if (navigator.canShare(shareData)) {
        navigator.share(shareData);
        return;
      }
    }
    // Fallback: download
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = "fonseca-news.png";
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, "image/png");
};

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

// ===== SEASON BAR =====
var SeasonBar = function(props) {
  var season = props.season;
  if (!season) return null;
  var pct = season.wins + season.losses > 0 ? Math.round((season.wins / (season.wins + season.losses)) * 100) : 0;
  return (
    <div style={{ padding: "12px 0", borderBottom: "1px solid " + BORDER, display: "flex", alignItems: "center", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
      <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: DIM, fontFamily: SANS }}>Temporada {season.year}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: GREEN, fontFamily: SANS }}>{season.wins}V</span>
      <span style={{ color: DIM }}>·</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: RED, fontFamily: SANS }}>{season.losses}D</span>
      <span style={{ fontSize: 11, color: DIM, fontFamily: SANS }}>({pct}%)</span>
      {season.titles > 0 && (<><span style={{ color: DIM }}>·</span><span style={{ fontSize: 13, fontFamily: SANS }}>🏆 <span style={{ fontWeight: 700, color: "#b8860b" }}>{season.titles}</span></span></>)}
    </div>
  );
};

// ===== LAST MATCH BAR =====
var LastMatchBar = function(props) {
  var match = props.match;
  if (!match) return null;
  var w = match.result === "V";
  return (
    <div style={{ padding: "12px 0", borderBottom: "1px solid " + BORDER, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
      <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: DIM, fontFamily: SANS }}>Última partida</span>
      <span style={{ fontSize: 11, fontWeight: 700, color: w ? GREEN : RED, fontFamily: SANS, background: w ? GREEN + "0A" : RED + "0A", padding: "2px 8px", borderRadius: 999 }}>{w ? "V" : "D"}</span>
      <span style={{ fontSize: 14, fontWeight: 700, color: TEXT, fontFamily: SERIF }}>Fonseca <span style={{ color: w ? GREEN : RED }}>{match.score}</span> {match.opponent}</span>
      <span style={{ fontSize: 11, color: DIM, fontFamily: SANS }}>{match.tournament}{match.round ? (" · " + match.round) : ""}</span>
    </div>
  );
};

// ===== RANKING CHART =====
var RankingChart = function(props) {
  var currentRanking = props.currentRanking || 39;
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
  var W = 600; var H = 260; var padL = 45; var padR = 20; var padT = 30; var padB = 50;
  var chartW = W - padL - padR; var chartH = H - padT - padB;
  var maxRank = 160; var minRank = 10; var rankRange = maxRank - minRank;
  var getX = function(i) { return padL + (i / (data.length - 1)) * chartW; };
  var getY = function(rank) { return padT + ((rank - minRank) / rankRange) * chartH; };
  var points = data.map(function(d, i) { return getX(i) + "," + getY(d.rank); });
  var linePath = "M" + points.join("L");
  var areaPath = linePath + "L" + getX(data.length - 1) + "," + (padT + chartH) + "L" + padL + "," + (padT + chartH) + "Z";
  var yLabels = [20, 50, 100, 150];
  return (
    <div style={{ padding: "20px 0", overflowX: "auto" }}>
      <svg viewBox={"0 0 " + W + " " + H} style={{ width: "100%", maxWidth: W, height: "auto" }}>
        {yLabels.map(function(rank) { var y = getY(rank); return (<g key={rank}><line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#f0f0f0" strokeWidth="1" /><text x={padL - 8} y={y + 4} textAnchor="end" fill={DIM} fontSize="9" fontFamily="Inter, sans-serif">{"#" + rank}</text></g>); })}
        <defs><linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={GREEN} stopOpacity="0.12" /><stop offset="100%" stopColor={GREEN} stopOpacity="0.01" /></linearGradient></defs>
        <path d={areaPath} fill="url(#areaGrad)" />
        <path d={linePath} fill="none" stroke={GREEN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {data.map(function(d, i) { var x = getX(i); var y = getY(d.rank); var isLast = i === data.length - 1; return (<g key={i}><circle cx={x} cy={y} r={isLast ? 5 : (d.label ? 3.5 : 2.5)} fill={isLast ? YELLOW : "#fff"} stroke={isLast ? YELLOW : GREEN} strokeWidth="2" />{(d.label || isLast) && (<text x={x} y={y - 12} textAnchor="middle" fill={isLast ? YELLOW : GREEN} fontSize="10" fontWeight="700" fontFamily="Inter, sans-serif">{"#" + d.rank}</text>)}{d.label && (<text x={x} y={y - 22} textAnchor="middle" fill={SUB} fontSize="7.5" fontFamily="Inter, sans-serif" fontWeight="600">{d.label}</text>)}{(i % 2 === 0 || isLast) && (<text x={x} y={H - padB + 18} textAnchor="middle" fill={DIM} fontSize="8" fontFamily="Inter, sans-serif">{d.month}</text>)}</g>); })}
      </svg>
      <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
        {[["Maior Ascensão","+121 posições",GREEN],["Melhor Ranking","#24 ATP","#b8860b"],["Títulos","🏆 2 ATP Tour","#2563EB"]].map(function(s,i) { return (<div key={i} style={{ textAlign: "center" }}><span style={{ fontSize: 10, color: s[2], fontFamily: SANS, fontWeight: 600, display: "block" }}>{s[0]}</span><span style={{ fontSize: 13, fontWeight: 700, color: TEXT, fontFamily: SANS }}>{s[1]}</span></div>); })}
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
  var polls = [
    { q: "O João vai vencer o primeiro jogo em Monte Carlo?", a: "Sim!", b: "Não" },
    { q: "O João chega ao Top 30 até o fim de 2026?", a: "Com certeza!", b: "Difícil" },
    { q: "O João vai conquistar um Masters 1000 na carreira?", a: "Vai sim!", b: "Acho que não" },
    { q: "Quem vai ter a melhor temporada 2026?", a: "João 🇧🇷", b: "Tien 🇺🇸" },
    { q: "O João chega às quartas de final em Roland Garros?", a: "Chega sim!", b: "Ainda é cedo" },
    { q: "O João entra no Top 10 até 2027?", a: "Com certeza!", b: "Precisa de tempo" },
    { q: "Quem é mais talentoso aos 19 anos?", a: "João 🇧🇷", b: "Alcaraz 🇪🇸" },
    { q: "O João chega ao Top 5 antes dos 21 anos?", a: "Sem dúvida!", b: "É muito cedo" },
    { q: "Se enfrentarem, quem vence: João ou Djokovic?", a: "João!", b: "Djokovic" },
    { q: "Quem é o melhor tenista sub-20 do mundo hoje?", a: "João 🇧🇷", b: "Tien 🇺🇸" },
    { q: "O João conquista um Grand Slam até 2028?", a: "Conquista!", b: "Precisa evoluir" },
    { q: "Quem tem o forehand mais forte?", a: "João 🇧🇷", b: "Sinner 🇮🇹" },
    { q: "O João vai ser número 1 do mundo um dia?", a: "Vai sim!", b: "Difícil prever" },
    { q: "Qual a melhor superfície do João?", a: "Saibro 🟤", b: "Quadra dura 🔵" },
  ];
  var dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
  var dayIdx = dayOfYear % polls.length;
  var poll = polls[dayIdx];
  useEffect(function() {
    if (vote) { fetch("/api/poll").then(function(r) { return r.json(); }).then(function(d) { if (d && typeof d.a === "number" && d.total > 0) { setResults({ a: Math.round((d.a / d.total) * 100), b: Math.round((d.b / d.total) * 100), total: d.total }); } }).catch(function() {}); }
  }, []);
  var handleVote = function(choice) {
    if (vote) return;
    setVote(choice);
    try { localStorage.setItem(pollKey, choice); } catch(e) {}
    fetch("/api/poll?vote=" + choice, { method: "POST" }).then(function(r) { return r.json(); }).then(function(d) { if (d && typeof d.a === "number" && d.total > 0) { setResults({ a: Math.round((d.a / d.total) * 100), b: Math.round((d.b / d.total) * 100), total: d.total }); } }).catch(function() { var sim = choice === "a" ? { a: 62, b: 38 } : { a: 45, b: 55 }; setResults(sim); });
  };
  return (
    <div style={{ padding: "18px 20px", background: "linear-gradient(135deg, #0a1a10 0%, #0d2818 100%)", borderRadius: 14, margin: "4px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
          <span style={{ fontSize: 13 }}>📊</span>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: GREEN, fontFamily: SANS }}>Enquete do dia</span>
        </div>
        <p style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700, color: "#fff", fontFamily: SERIF, lineHeight: 1.4 }}>{poll.q}</p>
        {!vote ? (
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={function() { handleVote("a"); }} style={{ flex: 1, padding: "10px", background: "rgba(0,168,89,0.12)", border: "1px solid rgba(0,168,89,0.25)", borderRadius: 10, fontSize: 13, fontWeight: 700, color: GREEN, cursor: "pointer", fontFamily: SANS }}>{poll.a}</button>
            <button onClick={function() { handleVote("b"); }} style={{ flex: 1, padding: "10px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.7)", cursor: "pointer", fontFamily: SANS }}>{poll.b}</button>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ fontSize: 12, fontWeight: 600, color: vote === "a" ? GREEN : "rgba(255,255,255,0.6)", fontFamily: SANS }}>{poll.a} {vote === "a" ? "✓" : ""}</span><span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)", fontFamily: SANS }}>{results ? results.a : 50}%</span></div>
              <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2 }}><div style={{ height: 4, background: GREEN, borderRadius: 2, width: (results ? results.a : 50) + "%", transition: "width 0.8s ease" }} /></div>
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ fontSize: 12, fontWeight: 600, color: vote === "b" ? GREEN : "rgba(255,255,255,0.6)", fontFamily: SANS }}>{poll.b} {vote === "b" ? "✓" : ""}</span><span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)", fontFamily: SANS }}>{results ? results.b : 50}%</span></div>
              <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2 }}><div style={{ height: 4, background: "rgba(255,255,255,0.35)", borderRadius: 2, width: (results ? results.b : 50) + "%", transition: "width 0.8s ease" }} /></div>
            </div>
            <p style={{ margin: "8px 0 0", fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: SANS, textAlign: "center" }}>Nova enquete amanhã</p>
          </div>
        )}
    </div>
  );
};

// ===== NEXT GEN COMPARATOR =====
var NextGenComparator = function() {
  var players = [
    { name: "J. Fonseca", country: "🇧🇷", age: 19, ranking: 39, titles: 2, style: "Agressivo", forehand: 95, serve: 88, movement: 85, mental: 90, color: GREEN },
    { name: "L. Tien", country: "🇺🇸", age: 20, ranking: 21, titles: 1, style: "Contra-atacante", forehand: 82, serve: 80, movement: 92, mental: 88, color: RED },
    { name: "J. Mensik", country: "🇨🇿", age: 19, ranking: 30, titles: 2, style: "Saque e voleio", forehand: 85, serve: 94, movement: 78, mental: 82, color: "#3B82F6" },
    { name: "A. Fils", country: "🇫🇷", age: 20, ranking: 28, titles: 2, style: "Completo", forehand: 88, serve: 86, movement: 90, mental: 84, color: "#8B5CF6" },
  ];
  var StatBar = function(p) { return (<div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}><span style={{ fontSize: 10, color: DIM, fontFamily: SANS, width: 55, textAlign: "right" }}>{p.label}</span><div style={{ flex: 1, height: 4, background: "#f0f0f0", borderRadius: 2 }}><div style={{ height: 4, background: p.color, borderRadius: 2, width: p.value + "%", transition: "width 0.5s" }} /></div><span style={{ fontSize: 10, fontWeight: 700, color: p.color, fontFamily: SANS, width: 24 }}>{p.value}</span></div>); };
  return (
    <div style={{ padding: "16px 0" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
        {players.map(function(p, i) { return (<div key={i} style={{ padding: "14px", background: i === 0 ? GREEN + "06" : BG_ALT, border: "1px solid " + (i === 0 ? GREEN + "15" : BORDER), borderRadius: 14 }}><div style={{ textAlign: "center", marginBottom: 10 }}><span style={{ fontSize: 20 }}>{p.country}</span><p style={{ margin: "4px 0 2px", fontSize: 15, fontWeight: 700, color: TEXT, fontFamily: SERIF }}>{p.name}</p><span style={{ fontSize: 12, fontWeight: 700, color: p.color, fontFamily: SANS }}>{"#" + p.ranking}</span></div><div style={{ fontSize: 10, color: DIM, fontFamily: SANS, textAlign: "center", marginBottom: 8 }}>{p.age + " anos · " + p.titles + " títulos · " + p.style}</div><StatBar label="Forehand" value={p.forehand} color={p.color} /><StatBar label="Saque" value={p.serve} color={p.color} /><StatBar label="Movim." value={p.movement} color={p.color} /><StatBar label="Mental" value={p.mental} color={p.color} /></div>); })}
      </div>
    </div>
  );
};

// ===== CAREER TIMELINE =====
var CareerTimeline = function() {
  var events = [
    { date: "Ago 2006", title: "Nasce no Rio de Janeiro", desc: "Bairro de Ipanema", emoji: "👶", color: DIM },
    { date: "2010", title: "Começa no tênis", desc: "Primeiras aulas no Country Club", emoji: "🎾", color: DIM },
    { date: "2014", title: "Encontro com Nadal", desc: "Assiste ao Rio Open aos 8 anos", emoji: "⭐", color: "#b8860b" },
    { date: "Set 2023", title: "Nº1 mundial juvenil", desc: "Campeão do US Open Jr", emoji: "🏆", color: GREEN },
    { date: "Fev 2024", title: "Estreia ATP no Rio Open", desc: "Derrota Arthur Fils (#36)", emoji: "🇧🇷", color: GREEN },
    { date: "Ago 2024", title: "1º Challenger", desc: "Título em Lexington", emoji: "🎯", color: "#3B82F6" },
    { date: "Dez 2024", title: "Campeão NextGen", desc: "Invicto em 5 jogos", emoji: "🏆", color: GREEN },
    { date: "Jan 2025", title: "Derrota Rublev no AO", desc: "Top 10 na R1 de Grand Slam", emoji: "🔥", color: RED },
    { date: "Fev 2025", title: "1º título ATP", desc: "Buenos Aires 250", emoji: "🏆", color: GREEN },
    { date: "Jul 2025", title: "Wimbledon R3", desc: "1º brasileiro desde Bellucci 2010", emoji: "🌿", color: GREEN },
    { date: "Out 2025", title: "Campeão Basel 500", desc: "1º brasileiro a ganhar ATP 500", emoji: "🏆", color: YELLOW },
    { date: "Jan 2026", title: "Duplas no Rio Open", desc: "Título de duplas em casa", emoji: "🤝", color: "#3B82F6" },
    { date: "Mar 2026", title: "Ranking #39 ATP", desc: "Preparando-se para Monte Carlo", emoji: "📈", color: GREEN },
  ];
  return (
    <div style={{ padding: "16px 0", maxHeight: "65vh", overflowY: "auto" }}>
      <div style={{ position: "relative", paddingLeft: 24 }}>
        <div style={{ position: "absolute", left: 7, top: 8, bottom: 8, width: 1.5, background: "#e8e8e8", borderRadius: 1 }} />
        {events.map(function(ev, i) { var isTitle = ev.emoji === "🏆"; return (<div key={i} style={{ position: "relative", marginBottom: i < events.length - 1 ? 14 : 0 }}><div style={{ position: "absolute", left: -20, top: 6, width: 10, height: 10, borderRadius: "50%", background: isTitle ? ev.color : "#fff", border: "2px solid " + ev.color, zIndex: 1 }} /><div style={{ paddingBottom: 4 }}><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}><span style={{ fontSize: 10, fontWeight: 600, color: ev.color, fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.04em" }}>{ev.date}</span><span style={{ fontSize: 14 }}>{ev.emoji}</span></div><p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 700, color: TEXT, fontFamily: SERIF }}>{ev.title}</p><p style={{ margin: 0, fontSize: 12, color: SUB, fontFamily: SANS }}>{ev.desc}</p></div></div>); })}
      </div>
    </div>
  );
};

// ===== GAME BANNER =====
var GameBanner = function() {
  return (
    <a href="/game" style={{ textDecoration: "none", display: "block" }}>
      <div style={{ background: "linear-gradient(135deg, #0a0a18 0%, #0d1130 40%, #1a0a2e 100%)", borderRadius: 14, padding: "18px 20px", margin: "4px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <span style={{ fontSize: 13 }}>🎮</span>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#ffd700", fontFamily: SANS }}>Novo jogo</span>
            </div>
            <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: "#fff", fontFamily: SERIF }}>Tennis Career 26</p>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontFamily: SANS }}>Crie sua carreira no tênis profissional</span>
          </div>
          <div style={{ flexShrink: 0, marginLeft: 16, background: "linear-gradient(135deg, " + GREEN + ", #007A3D)", padding: "8px 20px", borderRadius: 10, color: "#fff", fontSize: 12, fontWeight: 700, fontFamily: SANS }}>Jogar</div>
        </div>
      </div>
    </a>
  );
};

// ===== VIDEO BANNER =====
var VideoBanner = function(props) {
  return (
    <a href="https://www.youtube.com/results?search_query=João+Fonseca+tennis+highlights+2025" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "block" }}>
      <div style={{ borderRadius: 14, overflow: "hidden", background: "linear-gradient(135deg, #0a0a18 0%, #1a0a2e 100%)", padding: "24px 20px", margin: "4px 0", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center", marginBottom: 12 }}>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#FF4444", fontFamily: SANS }}>🔥 Vídeos em alta</span>
        </div>
        <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(255,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", boxShadow: "0 4px 16px rgba(255,0,0,0.25)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z"/></svg>
        </div>
        <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: "#fff", fontFamily: SERIF }}>Melhores momentos do João</p>
        <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.4)", fontFamily: SANS }}>Highlights, entrevistas e jogadas</p>
      </div>
    </a>
  );
};

// ===== TENNIS TV BANNER =====
var TennisTVBanner = function() {
  return (
    <a href="https://www.tennistv.com/players/joao-fonseca" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "block" }}>
      <div style={{ background: "linear-gradient(135deg, #0a2540 0%, #0d3b66 100%)", borderRadius: 14, padding: "18px 20px", margin: "4px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <span style={{ fontSize: 13 }}>📺</span>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#4FC3F7", fontFamily: SANS }}>Ao vivo</span>
            </div>
            <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: "#fff", fontFamily: SERIF }}>Assista no TennisTV</p>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontFamily: SANS }}>Streaming oficial do ATP Tour</span>
          </div>
          <div style={{ flexShrink: 0, marginLeft: 16, background: "#4FC3F7", padding: "8px 16px", borderRadius: 10, color: "#0a2540", fontSize: 12, fontWeight: 700, fontFamily: SANS }}>Assistir</div>
        </div>
      </div>
    </a>
  );
};

// ===== RAQUETES BANNER =====
var RaquetesBanner = function() {
  return (
    <a href="/raquetes" style={{ textDecoration: "none", display: "block" }}>
      <div style={{ background: "linear-gradient(135deg, #1a1a0a 0%, #2d2811 50%, #1a1e0a 100%)", borderRadius: 14, padding: "18px 20px", margin: "4px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <span style={{ fontSize: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#1a1a0a", fontFamily: SANS, background: YELLOW, padding: "2px 6px", borderRadius: 999 }}>Novo</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.4)", fontFamily: SANS }}>Comunidade</span>
            </div>
            <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: "#fff", fontFamily: SERIF }}>Venda sua raquete usada</p>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontFamily: SANS }}>Anuncie grátis no Telegram</span>
          </div>
          <div style={{ flexShrink: 0, marginLeft: 16, background: YELLOW, padding: "8px 16px", borderRadius: 10, color: "#1a1a0a", fontSize: 12, fontWeight: 700, fontFamily: SANS }}>Anunciar</div>
        </div>
      </div>
    </a>
  );
};

// ===== MATCH PREDICTION =====
var MatchPrediction = function(props) {
  var match = props.match;
  if (!match || !match.date) return null;
  var matchDate = new Date(match.date); var now = new Date(); var isPast = now > matchDate;
  var daysDiff = Math.ceil((matchDate - now) / (1000 * 60 * 60 * 24));
  if (daysDiff > 7 && !isPast) return null;
  var oppName = match.opponent_name || "Adversário";
  var oppShort = oppName.length > 12 ? oppName.split(" ").pop() : oppName;
  var matchKey = "fn_pred_" + (match.tournament_name || "match").replace(/[^a-zA-Z0-9]/g, "_") + "_" + match.date;
  var _p = useState(function() { try { return JSON.parse(localStorage.getItem(matchKey)); } catch(e) { return null; } });
  var prediction = _p[0]; var setPrediction = _p[1];
  var options = [
    { label: "João 2x0", sets: "2-0", winner: "joao" },
    { label: "João 2x1", sets: "2-1", winner: "joao" },
    { label: oppShort + " 2x1", sets: "1-2", winner: "opp" },
    { label: oppShort + " 2x0", sets: "0-2", winner: "opp" },
  ];
  var isGrandSlam = match.tournament_category && match.tournament_category.toLowerCase().includes("grand slam");
  if (isGrandSlam) { options = [{ label: "João 3x0", sets: "3-0", winner: "joao" },{ label: "João 3x1", sets: "3-1", winner: "joao" },{ label: "João 3x2", sets: "3-2", winner: "joao" },{ label: oppShort + " 3x2", sets: "2-3", winner: "opp" },{ label: oppShort + " 3x1", sets: "1-3", winner: "opp" },{ label: oppShort + " 3x0", sets: "0-3", winner: "opp" }]; }
  var handlePredict = function(opt) { if (prediction) return; var pred = { sets: opt.sets, winner: opt.winner, label: opt.label, timestamp: Date.now() }; setPrediction(pred); try { localStorage.setItem(matchKey, JSON.stringify(pred)); } catch(e) {} };
  var _streak = useState(function() { try { return parseInt(localStorage.getItem("fn_pred_streak") || "0", 10); } catch(e) { return 0; } });
  var streak = _streak[0];
  return (
    <div style={{ background: "linear-gradient(135deg, #0a1628 0%, #12203a 100%)", borderRadius: 14, padding: "18px 20px", margin: "4px 0" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 13 }}>🔮</span>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#B388FF", fontFamily: SANS }}>Palpite</span>
        </div>
        {streak > 0 && <span style={{ fontSize: 10, fontWeight: 600, color: YELLOW, fontFamily: SANS }}>🔥 {streak} acerto{streak > 1 ? "s" : ""}</span>}
      </div>
      {!prediction ? (
        <>
          <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: "#fff", fontFamily: SERIF }}>Qual será o placar?</p>
          <p style={{ margin: "0 0 10px", fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: SANS }}>Fonseca vs {oppName}{match.round ? (" · " + match.round) : ""}</p>
          <div style={{ display: "grid", gridTemplateColumns: isGrandSlam ? "repeat(3, 1fr)" : "repeat(4, 1fr)", gap: 8 }}>
            {options.map(function(opt) { var isJ = opt.winner === "joao"; return (<button key={opt.sets} onClick={function() { handlePredict(opt); }} style={{ padding: "7px 4px", background: isJ ? "rgba(0,168,89,0.1)" : "rgba(192,57,43,0.1)", border: "1px solid " + (isJ ? "rgba(0,168,89,0.25)" : "rgba(192,57,43,0.25)"), borderRadius: 8, cursor: "pointer", textAlign: "center" }}><span style={{ fontSize: 13, fontWeight: 700, color: isJ ? GREEN : RED, fontFamily: SANS, display: "block" }}>{opt.sets.replace("-", "x")}</span><span style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", fontFamily: SANS }}>{isJ ? "Fonseca" : oppShort}</span></button>); })}
          </div>
        </>
      ) : (
        <div style={{ textAlign: "center", padding: "4px 0" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: prediction.winner === "joao" ? "rgba(0,168,89,0.12)" : "rgba(192,57,43,0.12)", borderRadius: 12, padding: "8px 16px", border: "1px solid " + (prediction.winner === "joao" ? "rgba(0,168,89,0.25)" : "rgba(192,57,43,0.25)") }}>
            <span style={{ fontSize: 14 }}>{prediction.winner === "joao" ? "🇧🇷" : "🎾"}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: prediction.winner === "joao" ? GREEN : RED, fontFamily: SANS }}>Palpite: {prediction.label}</span>
          </div>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontFamily: SANS, marginTop: 6 }}>Resultado após o jogo</p>
          <button onClick={function() {
            var c = generateShareCard({ type: "prediction", emoji: prediction.winner === "joao" ? "🇧🇷" : "🎾", title: "Meu palpite", value: prediction.label, subtitle: "Fonseca vs " + oppName, matchInfo: match.tournament_name || "" });
            shareCard(c, "🔮 Meu palpite no Fonseca News: " + prediction.label + " — fonsecanews.com.br");
          }} style={{ marginTop: 8, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "6px 14px", color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: SANS }}>Compartilhar palpite</button>
        </div>
      )}
    </div>
  );
};

// ===== ATP CALENDAR =====
var ATPCalendar = function() {
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
    { month: "AGO", name: "US Open", cat: "Grand Slam", surface: "Duro", city: "Nova York", date: "31 Ago - 13 Set", done: false },
    { month: "NOV", name: "ATP Finals", cat: "Finals", surface: "Duro (indoor)", city: "Turim", date: "15-22 Nov", done: false },
  ];
  var catColors2 = { "Grand Slam": "#6D35D0", "Masters 1000": "#c0392b", "ATP 500": "#2563EB", "Finals": "#b8860b" };
  return (
    <div style={{ padding: "12px 0", maxHeight: "70vh", overflowY: "auto" }}>
      {events.map(function(ev, i) { var cc = catColors2[ev.cat] || DIM; var isNext = ev.next; return (<div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 4px", borderBottom: i < events.length - 1 ? "1px solid #f0f0f0" : "none", background: isNext ? GREEN + "06" : "transparent", borderRadius: isNext ? 8 : 0 }}><div style={{ width: 36, textAlign: "center", flexShrink: 0 }}><span style={{ fontSize: 10, fontWeight: 700, color: ev.done ? DIM : cc, fontFamily: SANS }}>{ev.month}</span></div><div style={{ flex: 1 }}><div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}><span style={{ fontSize: 14, fontWeight: 700, color: ev.done ? DIM : TEXT, fontFamily: SERIF }}>{ev.name}</span>{isNext && <span style={{ fontSize: 9, fontWeight: 600, color: GREEN, fontFamily: SANS, background: GREEN + "0A", padding: "1px 6px", borderRadius: 999 }}>Próximo</span>}</div><span style={{ fontSize: 10, color: DIM, fontFamily: SANS }}>{ev.cat} · {ev.city} · {ev.date}</span></div><div style={{ flexShrink: 0 }}>{ev.done ? <span style={{ fontSize: 10, fontWeight: 600, color: ev.result && ev.result.includes("🏆") ? GREEN : DIM, fontFamily: SANS }}>{ev.result}</span> : isNext ? <span style={{ width: 6, height: 6, borderRadius: "50%", background: GREEN, display: "inline-block" }} /> : null}</div></div>); })}
    </div>
  );
};

// ===== QUIZ =====
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
    { q: "Qual foi o primeiro título ATP do João?", opts: ["Basel 500", "Rio Open 500", "Buenos Aires 250", "Lexington Challenger"], answer: 2, points: 10, fun: "Brasileiro mais jovem a conquistar um título ATP!" },
    { q: "Com que idade o João se tornou nº1 mundial juvenil?", opts: ["15 anos", "16 anos", "17 anos", "18 anos"], answer: 2, points: 10, fun: "Primeiro brasileiro da história a terminar como nº1 juvenil!" },
    { q: "Qual torneio o João venceu invicto com 5 vitórias em 2024?", opts: ["ATP Finals", "NextGen ATP Finals", "Copa Davis", "Laver Cup"], answer: 1, points: 15, fun: "Primeiro sul-americano campeão do NextGen Finals!" },
    { q: "Qual ATP 500 o João conquistou em outubro de 2025?", opts: ["Viena", "Hamburgo", "Basel", "Barcelona"], answer: 2, points: 15, fun: "Primeiro brasileiro a ganhar um ATP 500!" },
    { q: "Quem é o ídolo do João que ele conheceu aos 4 anos?", opts: ["Federer", "Nadal", "Djokovic", "Guga"], answer: 1, points: 10, fun: "Mostrou a foto desse encontro pro Nadal no NextGen Finals!" },
    { q: "Quantos títulos profissionais o João já tem?", opts: ["4", "5", "6", "8"], answer: 3, points: 15, fun: "2 ATP + 3 Challengers + NextGen + Duplas + US Open Jr!" },
  ];
  var _shuf = useState(function() { var arr = allQuestions.slice(); var s = Date.now(); for (var i = arr.length - 1; i > 0; i--) { s = (s * 9301 + 49297) % 233280; var j = Math.floor((s / 233280) * (i + 1)); var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp; } return arr; });
  var questions = _shuf[0]; var setQuestions = _shuf[1];
  var totalPoints = questions.reduce(function(sum, q) { return sum + q.points; }, 0);
  var maxQ = questions.length;
  var handleAnswer = function(idx) { if (revealed) return; setSelected(idx); setRevealed(true); if (idx === questions[currentQ].answer) { setScore(score + questions[currentQ].points); } };
  var handleNext = function() { if (currentQ < maxQ - 1) { setCurrentQ(currentQ + 1); setSelected(null); setRevealed(false); } else { setDone(true); } };
  var handleRestart = function() { var arr = allQuestions.slice(); var s = Date.now(); for (var i = arr.length - 1; i > 0; i--) { s = (s * 9301 + 49297) % 233280; var j = Math.floor((s / 233280) * (i + 1)); var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp; } setQuestions(arr); setCurrentQ(0); setScore(0); setSelected(null); setDone(false); setStarted(false); setRevealed(false); };
  var getResultMsg = function() { var pct = Math.round((score / totalPoints) * 100); if (pct === 100) return { emoji: "🏆", msg: "Perfeito! Verdadeiro fã!" }; if (pct >= 80) return { emoji: "🔥", msg: "Impressionante!" }; if (pct >= 60) return { emoji: "🎾", msg: "Bom, você acompanha!" }; if (pct >= 40) return { emoji: "👏", msg: "No caminho certo!" }; return { emoji: "📚", msg: "Continue acompanhando!" }; };

  if (!started) {
    return (
      <div style={{ background: "linear-gradient(135deg, #0a1628 0%, #1a2a4a 100%)", borderRadius: 14, padding: "18px 20px", margin: "4px 0", cursor: "pointer", overflow: "hidden" }} onClick={function() { setStarted(true); }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
          <span style={{ fontSize: 13 }}>🎾</span>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: YELLOW, fontFamily: SANS }}>Quiz interativo</span>
        </div>
        <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: "#fff", fontFamily: SERIF }}>Quanto você conhece o João?</p>
        <p style={{ margin: "0 0 12px", fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: SANS }}>10 perguntas · {totalPoints} pontos</p>
        <div style={{ background: "linear-gradient(135deg, " + GREEN + ", #007A3D)", padding: "9px 20px", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 700, fontFamily: SANS, textAlign: "center" }}>Jogar</div>
      </div>
    );
  }
  if (done) {
    var result = getResultMsg();
    return (
      <div style={{ background: "linear-gradient(135deg, #0a1628 0%, #1a2a4a 100%)", borderRadius: 14, padding: "18px 20px", margin: "4px 0", textAlign: "center" }}>
        <span style={{ fontSize: 40 }}>{result.emoji}</span>
        <h3 style={{ margin: "8px 0 4px", fontSize: 20, fontWeight: 800, color: "#fff", fontFamily: SERIF }}>{score}/{totalPoints} pontos</h3>
        <p style={{ margin: "0 0 16px", fontSize: 13, color: "rgba(255,255,255,0.6)", fontFamily: SANS }}>{result.msg}</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={function() {
            var c = generateShareCard({ type: "quiz", emoji: result.emoji, title: "Quiz do João", value: score + "/" + totalPoints, subtitle: result.msg, matchInfo: "fonsecanews.com.br" });
            shareCard(c, "🎾 Fiz " + score + "/" + totalPoints + " no Quiz do Fonseca News! " + result.emoji + " — fonsecanews.com.br");
          }} style={{ padding: "10px 18px", background: YELLOW, color: "#1a1a0a", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: SANS }}>Compartilhar</button>
          <button onClick={handleRestart} style={{ padding: "10px 18px", background: GREEN, color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: SANS }}>Jogar de novo</button>
          <button onClick={function() { setStarted(false); setDone(false); setCurrentQ(0); setScore(0); }} style={{ padding: "10px 18px", background: "rgba(255,255,255,0.08)", color: "#fff", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: SANS }}>Fechar</button>
        </div>
      </div>
    );
  }
  var q = questions[currentQ];
  return (
    <div style={{ background: "linear-gradient(135deg, #0a1628 0%, #1a2a4a 100%)", borderRadius: 14, padding: "18px 20px", margin: "4px 0" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: YELLOW, fontFamily: SANS }}>Pergunta {currentQ + 1}/{maxQ}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: GREEN, fontFamily: SANS }}>{score} pts</span>
      </div>
      <div style={{ height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 2, marginBottom: 14 }}><div style={{ height: 3, background: "linear-gradient(90deg, " + GREEN + ", " + YELLOW + ")", borderRadius: 2, width: ((currentQ + 1) / maxQ * 100) + "%", transition: "width 0.3s" }} /></div>
      <p style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: "#fff", fontFamily: SERIF, lineHeight: 1.4 }}>{q.q}</p>
      <span style={{ fontSize: 11, color: YELLOW, fontFamily: SANS, fontWeight: 600 }}>{q.points} pontos</span>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
        {q.opts.map(function(opt, idx) { var isCorrect = idx === q.answer; var isSelected = idx === selected; var bg = "rgba(255,255,255,0.05)"; var borderColor = "rgba(255,255,255,0.1)"; var textColor = "rgba(255,255,255,0.8)";
          if (revealed) { if (isCorrect) { bg = GREEN + "20"; borderColor = GREEN + "40"; textColor = GREEN; } else if (isSelected && !isCorrect) { bg = RED + "20"; borderColor = RED + "40"; textColor = RED; } else { bg = "rgba(255,255,255,0.02)"; textColor = "rgba(255,255,255,0.3)"; } }
          return (<button key={idx} onClick={function() { handleAnswer(idx); }} disabled={revealed} style={{ padding: "12px 14px", background: bg, border: "1px solid " + borderColor, borderRadius: 10, cursor: revealed ? "default" : "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 10 }}><span style={{ width: 24, height: 24, borderRadius: "50%", background: revealed && isCorrect ? GREEN : (revealed && isSelected && !isCorrect ? RED : "rgba(255,255,255,0.06)"), border: "1px solid " + (revealed && isCorrect ? GREEN : (revealed && isSelected && !isCorrect ? RED : "rgba(255,255,255,0.12)")), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: revealed && (isCorrect || isSelected) ? "#fff" : "rgba(255,255,255,0.4)", fontFamily: SANS, flexShrink: 0 }}>{revealed && isCorrect ? "✓" : (revealed && isSelected && !isCorrect ? "✗" : String.fromCharCode(65 + idx))}</span><span style={{ fontSize: 14, fontWeight: 600, color: textColor, fontFamily: SANS }}>{opt}</span></button>); })}
      </div>
      {revealed && (<div style={{ marginTop: 12 }}><div style={{ padding: "10px 14px", background: "rgba(255,203,5,0.08)", borderRadius: 10, border: "1px solid rgba(255,203,5,0.15)", marginBottom: 10 }}><p style={{ margin: 0, fontSize: 12, color: YELLOW, fontFamily: SANS }}>💡 {q.fun}</p></div><button onClick={handleNext} style={{ width: "100%", padding: "12px", background: GREEN, color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: SANS }}>{currentQ < maxQ - 1 ? "Próxima pergunta →" : "Ver resultado 🏆"}</button></div>)}
    </div>
  );
};

// ===== RIVAL BANNER =====
var RIVAL_DATA = { name: "Learner Tien", country: "🇺🇸", ranking: 21, h2h: { joao: 1, tien: 1 } };
var RivalBanner = function() {
  var r = RIVAL_DATA;
  return (
    <div style={{ background: "linear-gradient(135deg, #1a0a0a 0%, #2d1111 40%, #1a0f1e 100%)", borderRadius: 14, padding: "18px 20px", margin: "4px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <span style={{ fontSize: 13 }}>⚔️</span>
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: RED, fontFamily: SANS }}>Rivalidade</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24 }}>
        <div style={{ textAlign: "center" }}><span style={{ fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: SERIF }}>Fonseca</span><br/><span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontFamily: SANS }}>🇧🇷 #39</span></div>
        <div style={{ textAlign: "center" }}><div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 22, fontWeight: 800, color: GREEN, fontFamily: SANS }}>{r.h2h.joao}</span><span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", fontFamily: SANS }}>VS</span><span style={{ fontSize: 22, fontWeight: 800, color: RED, fontFamily: SANS }}>{r.h2h.tien}</span></div></div>
        <div style={{ textAlign: "center" }}><span style={{ fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: SERIF }}>{r.name}</span><br/><span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontFamily: SANS }}>{r.country} #{r.ranking}</span></div>
      </div>
    </div>
  );
};

// ===== NEXT DUEL CARD =====
var NextDuelCard = function(props) {
  var match = props.match; var player = props.player; var isLive = props.isLive;
  var countdown = useCountdown(match ? match.date : null);
  if (!match) return null;
  var joaoImg = "https://www.atptour.com/-/media/alias/player-headshot/f0fv";
  var oppImg = match.opponent_id ? ("https://api.sofascore.app/api/v1/player/" + match.opponent_id + "/image") : null;
  var oppName = match.opponent_name || "A definir";
  var oppRanking = match.opponent_ranking;
  var oppCountry = match.opponent_country || "";
  var sc = surfaceColorMap[match.surface] || "#999";
  return (
    <section style={{ margin: "4px -20px 0", padding: "24px 24px 20px", background: "linear-gradient(145deg, #0D1726 0%, #132440 100%)", borderRadius: 20, position: "relative", overflow: "hidden" }}>
      {/* Subtle glow */}
      <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "radial-gradient(circle, " + sc + "15 0%, transparent 70%)", pointerEvents: "none" }} />

      {/* Header line */}
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: sc, fontFamily: SANS }}>{match.surface}</span>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>·</span>
          <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.4)", fontFamily: SANS }}>{match.city}</span>
        </div>
      </div>

      {/* Tournament name */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <h2 style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 800, color: "#fff", lineHeight: 1.1, letterSpacing: "-0.03em", margin: "0 0 4px" }}>{match.tournament_category || "Próxima Partida"}</h2>
        {match.tournament_name && match.tournament_category && <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontFamily: SANS, margin: 0 }}>{match.tournament_name} · {formatMatchDate(match.date)}</p>}
      </div>

      {/* Players - centered */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 16, alignItems: "center", marginBottom: 24 }}>
        {/* João */}
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", margin: "0 auto 8px", background: "#1a2a3a", border: "2px solid " + GREEN + "35", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <img src={joaoImg} alt="JF" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={function(e) { e.target.style.display = "none"; e.target.parentNode.innerHTML = '<span style="font-size:16px;font-weight:800;color:#00A859;font-family:Inter,sans-serif">JF</span>'; }} />
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: SERIF, display: "block" }}>J. Fonseca</span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontFamily: SANS }}>🇧🇷 {player ? "#" + player.ranking : ""}</span>
        </div>

        {/* VS */}
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.2)", fontFamily: SANS }}>VS</span>
          </div>
        </div>

        {/* Opponent */}
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", margin: "0 auto 8px", background: "#1a2a3a", border: "2px solid rgba(255,255,255,0.1)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {oppImg ? <img src={oppImg} alt={oppName} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={function(e) { e.target.style.display = "none"; }} /> : <span style={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>?</span>}
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: SERIF, display: "block" }}>{oppName}</span>
          {oppCountry ? <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontFamily: SANS }}>{oppCountry}{oppRanking ? " #" + oppRanking : ""}</span> : <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontFamily: SANS }}>chave pendente</span>}
        </div>
      </div>

      {/* Countdown - centered */}
      {!countdown.expired && (
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ display: "inline-flex", gap: 14 }}>
            {[[countdown.days,"dias"],[countdown.hours,"hrs"],[countdown.minutes,"min"],[countdown.seconds,"seg"]].map(function(p,i) {
              return (
                <div key={i} style={{ textAlign: "center", minWidth: 36 }}>
                  <span style={{ fontSize: 20, fontWeight: 700, color: "#fff", fontFamily: SANS, display: "block", lineHeight: 1 }}>{String(p[0]).padStart(2, "0")}</span>
                  <span style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.06em" }}>{p[1]}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CTA - centered */}
      <div style={{ textAlign: "center" }}>
        <a href="https://www.tennistv.com/players/joao-fonseca" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 600, color: "#4FC3F7", fontFamily: SANS, textDecoration: "none", padding: "6px 14px", borderRadius: 8, background: "rgba(79,195,247,0.1)", border: "1px solid rgba(79,195,247,0.15)" }}>Assistir ao vivo →</a>
      </div>

      {!isLive && <p style={{ margin: "10px 0 0", fontSize: 9, color: "rgba(255,255,255,0.1)", fontStyle: "italic", fontFamily: SANS, textAlign: "center" }}>Atualizado automaticamente</p>}
    </section>
  );
};

// ===== PIX DONATION =====
var PixDonation = function() {
  var _s = useState(false); var showModal = _s[0]; var setShowModal = _s[1];
  var _c = useState(false); var copied = _c[0]; var setCopied = _c[1];
  var PIX_KEY = "SUA-CHAVE-PIX-AQUI";
  var handleCopy = function() { if (navigator.clipboard) { navigator.clipboard.writeText(PIX_KEY).then(function() { setCopied(true); setTimeout(function() { setCopied(false); }, 3000); }); } else { var ta = document.createElement("textarea"); ta.value = PIX_KEY; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta); setCopied(true); setTimeout(function() { setCopied(false); }, 3000); } };
  return (
    <>
      <button onClick={function() { setShowModal(true); }} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", background: GREEN, color: "#fff", border: "none", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: SANS }}>💚 Apoie via PIX</button>
      {showModal && (
        <div onClick={function() { setShowModal(false); }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16, animation: "fadeInO 0.3s ease" }}>
          <div onClick={function(e) { e.stopPropagation(); }} style={{ background: "#fff", borderRadius: 20, padding: 28, maxWidth: 360, width: "100%", textAlign: "center", position: "relative", animation: "slideU 0.3s ease" }}>
            <button onClick={function() { setShowModal(false); }} style={{ position: "absolute", top: 12, right: 16, background: "none", border: "none", color: DIM, fontSize: 18, cursor: "pointer" }}>✕</button>
            <div style={{ fontSize: 28, fontWeight: 800, fontFamily: SERIF, marginBottom: 8 }}><span style={{ color: GREEN }}>F</span><span style={{ color: YELLOW }}>N</span></div>
            <h3 style={{ margin: "0 0 6px", color: TEXT, fontSize: 18, fontFamily: SERIF }}>Apoie o Fonseca News</h3>
            <p style={{ color: SUB, fontSize: 13, margin: "0 0 20px", fontFamily: SANS }}>Ajude a manter o site no ar!</p>
            <div style={{ marginBottom: 16 }}>
              <label style={{ color: DIM, fontSize: 11, display: "block", marginBottom: 8, fontFamily: SANS }}>Chave PIX:</label>
              <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
                <code style={{ background: BG_ALT, padding: "8px 12px", borderRadius: 8, color: SUB, fontSize: 11, fontFamily: "monospace", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>{PIX_KEY}</code>
                <button onClick={handleCopy} style={{ padding: "8px 14px", background: GREEN, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: SANS }}>{copied ? "✅ Copiado!" : "Copiar"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ===== SKELETON =====
var Skeleton = function() { return (<div>{[...Array(4)].map(function(_, i) { return (<div key={i} style={{ padding: "22px 0", borderBottom: "1px solid " + BORDER, animation: "pulse 1.8s ease-in-out infinite", animationDelay: (i * .12) + "s" }}><div style={{ height: 12, width: 70, background: "#f0f0f0", borderRadius: 4, marginBottom: 10 }} /><div style={{ height: 16, width: "85%", background: "#f0f0f0", borderRadius: 4, marginBottom: 8 }} /><div style={{ height: 14, width: "60%", background: "#f5f5f5", borderRadius: 4 }} /></div>); })}</div>); };

// ===== NEWS CARD =====
var NewsCard = function(props) {
  var item = props.item; var index = props.index; var allLikes = props.allLikes || {};
  var _s = useState(false); var h = _s[0]; var setH = _s[1];
  var _i = useState(false); var imgErr = _i[0]; var setImgErr = _i[1];
  var hasImg = item.image && !imgErr;
  var _reading = useState(false); var reading = _reading[0]; var setReading = _reading[1];
  var likeId = (item.title || "").substring(0, 40).replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
  var initialLikes = allLikes[likeId] || { likes: 0, dislikes: 0 };
  var _lk = useState(initialLikes); var rx = _lk[0]; var setRx = _lk[1];
  var _voted = useState(function() { try { return localStorage.getItem("fn_v_" + likeId); } catch(e) { return null; } });
  var voted = _voted[0]; var setVoted = _voted[1];
  useEffect(function() { var fresh = allLikes[likeId]; if (fresh && typeof fresh.likes === "number") setRx(fresh); }, [allLikes[likeId]]);
  var handleRx = function(type, e) { e.preventDefault(); e.stopPropagation(); if (voted) return; var action = type === "l" ? "like" : "dislike"; fetch("/api/likes?id=" + likeId + "&action=" + action, { method: "POST" }).then(function(r) { return r.json(); }).then(function(d) { if (d && typeof d.likes === "number") setRx(d); }).catch(function() {}); setVoted(type); try { localStorage.setItem("fn_v_" + likeId, type); } catch(e) {} };
  var handleSh = function(e) { e.preventDefault(); e.stopPropagation(); if (navigator.share) { navigator.share({ title: item.title, url: item.url || "https://fonsecanews.com.br" }).catch(function() {}); } else { try { navigator.clipboard.writeText(item.title + "\n" + (item.url || "fonsecanews.com.br")); } catch(e) {} } };
  var catColor = catColors[item.category] || catColors["Notícia"];
  var hasUrl = item.url && item.url.startsWith("http");
  var cleanTitle = item.source && item.title ? item.title.replace(" - " + item.source, "").replace(" | " + item.source, "").replace(" · " + item.source, "") : item.title;
  return (
    <>
    <article onClick={function() { if (hasUrl) { window.open(item.url, "_blank", "noopener,noreferrer"); } }} onMouseEnter={function() { setH(true); }} onMouseLeave={function() { setH(false); }}
      style={{ padding: "20px 0", borderBottom: "1px solid " + BORDER, cursor: "pointer", transition: "background 0.15s", animation: "fadeIn 0.35s ease forwards", animationDelay: (index * 0.04) + "s", opacity: 0 }}>
      <div style={{ display: "flex", gap: 14 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: catColor, fontFamily: SANS }}>{item.category}</span>
            <span style={{ fontSize: 11, color: DIM, fontFamily: SANS }}>{item.source}</span>
            <span style={{ fontSize: 11, color: DIM, fontFamily: SANS, marginLeft: "auto" }}>{formatTimeAgo(item.date)}</span>
      </div>
      <h3 style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 700, color: h ? "#007A3D" : TEXT, fontFamily: SERIF, lineHeight: 1.35, letterSpacing: "-0.01em", transition: "color 0.15s" }}>{cleanTitle}</h3>
      {item.summary && <p style={{ margin: "0 0 6px", fontSize: 14, color: SUB, fontFamily: SANS, lineHeight: 1.6 }}>{item.summary}</p>}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 10 }}>
        <button onClick={function(e) { handleRx("l", e); }} style={{ background: "none", border: "none", cursor: voted ? "default" : "pointer", display: "flex", alignItems: "center", gap: 4, padding: 0, opacity: voted && voted !== "l" ? 0.2 : (voted === "l" ? 1 : 0.35) }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill={voted === "l" ? GREEN : "none"} stroke={voted === "l" ? GREEN : DIM} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
          {rx.likes > 0 && <span style={{ fontSize: 10, color: voted === "l" ? GREEN : DIM, fontWeight: 600, fontFamily: SANS }}>{rx.likes}</span>}
        </button>
        <button onClick={function(e) { handleRx("d", e); }} style={{ background: "none", border: "none", cursor: voted ? "default" : "pointer", display: "flex", alignItems: "center", gap: 4, padding: 0, opacity: voted && voted !== "d" ? 0.2 : (voted === "d" ? 1 : 0.35) }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill={voted === "d" ? RED : "none"} stroke={voted === "d" ? RED : DIM} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10zM17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>
          {rx.dislikes > 0 && <span style={{ fontSize: 10, color: voted === "d" ? RED : DIM, fontWeight: 600, fontFamily: SANS }}>{rx.dislikes}</span>}
        </button>
        <button onClick={handleSh} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, marginLeft: "auto", opacity: 0.3 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={DIM} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
        </button>
      </div>
        </div>
        {hasImg && (
          <img src={item.image} alt="" onError={function() { setImgErr(true); }}
            style={{ width: 72, height: 72, borderRadius: 10, objectFit: "cover", flexShrink: 0, background: "#f0f0f0" }} loading="lazy" />
        )}
      </div>
    </article>
    {/* READING MODE */}
    {reading && (
      <div onClick={function() { setReading(false); }} style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(6px)", display: "flex", alignItems: "flex-end", justifyContent: "center", animation: "fadeInO 0.25s ease" }}>
        <div onClick={function(e) { e.stopPropagation(); }} style={{ background: "#fff", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 560, maxHeight: "92vh", overflowY: "auto", animation: "slideU 0.35s ease" }}>
          <div style={{ textAlign: "center", padding: "10px 0 4px" }}><div style={{ width: 36, height: 4, borderRadius: 2, background: "#ddd", margin: "0 auto" }} /></div>
          <div style={{ padding: "8px 24px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: catColor, fontFamily: SANS }}>{item.category}</span>
              <span style={{ fontSize: 11, color: DIM, fontFamily: SANS }}>{item.source} · {formatTimeAgo(item.date)}</span>
            </div>
            <button onClick={function() { setReading(false); }} style={{ background: "none", border: "none", color: DIM, fontSize: 18, cursor: "pointer" }}>✕</button>
          </div>
          <div style={{ padding: "16px 24px 28px" }}>
            <h2 style={{ margin: "0 0 14px", fontSize: 22, fontWeight: 800, color: TEXT, fontFamily: SERIF, lineHeight: 1.3, letterSpacing: "-0.02em" }}>{cleanTitle}</h2>
            {item.summary && <p style={{ margin: "0 0 16px", fontSize: 16, color: SUB, fontFamily: SERIF, lineHeight: 1.75 }}>{item.summary}</p>}
            <div style={{ background: BG_ALT, borderRadius: 10, padding: "12px 16px", marginBottom: 20, borderLeft: "3px solid " + GREEN }}>
              <p style={{ margin: 0, fontSize: 13, color: SUB, fontFamily: SANS, lineHeight: 1.6 }}>Matéria publicada pela <strong>{item.source}</strong>. Toque no botão abaixo para ler o conteúdo completo.</p>
            </div>
            {hasUrl && (<a href={item.url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 20px", background: GREEN, color: "#fff", borderRadius: 12, fontSize: 14, fontWeight: 700, fontFamily: SANS, textDecoration: "none", marginBottom: 16 }}>Ler matéria completa<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></a>)}
            <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
              <button onClick={function(e) { handleRx("l", e); }} style={{ background: "none", border: "1px solid " + (voted === "l" ? GREEN : BORDER), borderRadius: 10, padding: "10px 20px", cursor: voted ? "default" : "pointer", display: "flex", alignItems: "center", gap: 6, opacity: voted && voted !== "l" ? 0.3 : 1 }}><svg width="16" height="16" viewBox="0 0 24 24" fill={voted === "l" ? GREEN : "none"} stroke={voted === "l" ? GREEN : DIM} strokeWidth="1.8"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>{rx.likes > 0 && <span style={{ fontSize: 12, color: voted === "l" ? GREEN : DIM, fontWeight: 600, fontFamily: SANS }}>{rx.likes}</span>}</button>
              <button onClick={function(e) { handleRx("d", e); }} style={{ background: "none", border: "1px solid " + (voted === "d" ? RED : BORDER), borderRadius: 10, padding: "10px 20px", cursor: voted ? "default" : "pointer", display: "flex", alignItems: "center", gap: 6, opacity: voted && voted !== "d" ? 0.3 : 1 }}><svg width="16" height="16" viewBox="0 0 24 24" fill={voted === "d" ? RED : "none"} stroke={voted === "d" ? RED : DIM} strokeWidth="1.8"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10zM17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>{rx.dislikes > 0 && <span style={{ fontSize: 12, color: voted === "d" ? RED : DIM, fontWeight: 600, fontFamily: SANS }}>{rx.dislikes}</span>}</button>
              <button onClick={handleSh} style={{ background: "none", border: "1px solid " + BORDER, borderRadius: 10, padding: "10px 20px", cursor: "pointer" }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={DIM} strokeWidth="1.8"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg></button>
            </div>
            <p style={{ margin: "12px 0 0", fontSize: 10, color: DIM, fontFamily: SANS, textAlign: "center" }}>Fonte: {item.source} · via Fonseca News</p>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

// ===== BUILD FEED =====
// ===== DUAL BANNER WRAPPER =====
var DualBanner = function(props) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, margin: "4px 0" }}>
      {props.children}
    </div>
  );
};

// ===== COMPACT BANNER CARDS (for dual layout) =====
var CompactQuiz = function(props) {
  return (
    <div onClick={props.onStart} style={{ background: "linear-gradient(135deg, #0a1628 0%, #1a2a4a 100%)", borderRadius: 14, padding: "14px 12px", cursor: "pointer", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
          <span style={{ fontSize: 12 }}>🎾</span>
          <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: YELLOW, fontFamily: SANS }}>Quiz</span>
        </div>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: SERIF, lineHeight: 1.3 }}>Quanto você conhece o João?</p>
      </div>
      <div style={{ marginTop: 10, background: GREEN, padding: "6px 12px", borderRadius: 8, color: "#fff", fontSize: 11, fontWeight: 700, fontFamily: SANS, textAlign: "center" }}>Jogar</div>
    </div>
  );
};

var CompactPoll = function(props) {
  return (
    <div style={{ background: "linear-gradient(135deg, #0a1a10 0%, #0d2818 100%)", borderRadius: 14, padding: "14px 12px", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
          <span style={{ fontSize: 12 }}>📊</span>
          <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: GREEN, fontFamily: SANS }}>Enquete</span>
        </div>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: SERIF, lineHeight: 1.3 }}>{props.question}</p>
      </div>
      <div style={{ display: "flex", gap: 4, marginTop: 10 }}>
        <button onClick={props.onVoteA} style={{ flex: 1, padding: "6px", background: "rgba(0,168,89,0.12)", border: "1px solid rgba(0,168,89,0.25)", borderRadius: 6, fontSize: 10, fontWeight: 700, color: GREEN, cursor: "pointer", fontFamily: SANS }}>{props.optA}</button>
        <button onClick={props.onVoteB} style={{ flex: 1, padding: "6px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 6, fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.6)", cursor: "pointer", fontFamily: SANS }}>{props.optB}</button>
      </div>
    </div>
  );
};

var CompactGame = function() {
  return (
    <a href="/game" style={{ textDecoration: "none", display: "block", height: "100%" }}>
      <div style={{ background: "linear-gradient(135deg, #0a0a18 0%, #1a0a2e 100%)", borderRadius: 14, padding: "14px 12px", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
            <span style={{ fontSize: 12 }}>🎮</span>
            <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#ffd700", fontFamily: SANS }}>Jogo</span>
          </div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: SERIF, lineHeight: 1.3 }}>Tennis Career 26</p>
        </div>
        <div style={{ marginTop: 10, background: GREEN, padding: "6px 12px", borderRadius: 8, color: "#fff", fontSize: 11, fontWeight: 700, fontFamily: SANS, textAlign: "center" }}>Jogar</div>
      </div>
    </a>
  );
};

var CompactRaquetes = function() {
  return (
    <a href="/raquetes" style={{ textDecoration: "none", display: "block", height: "100%" }}>
      <div style={{ background: "linear-gradient(135deg, #1a1a0a 0%, #2d2811 100%)", borderRadius: 14, padding: "14px 12px", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
            <span style={{ fontSize: 8, fontWeight: 700, color: "#1a1a0a", fontFamily: SANS, background: YELLOW, padding: "1px 5px", borderRadius: 999 }}>Novo</span>
          </div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: SERIF, lineHeight: 1.3 }}>Venda sua raquete</p>
        </div>
        <div style={{ marginTop: 10, background: YELLOW, padding: "6px 12px", borderRadius: 8, color: "#1a1a0a", fontSize: 11, fontWeight: 700, fontFamily: SANS, textAlign: "center" }}>Anunciar</div>
      </div>
    </a>
  );
};

var CompactVideo = function() {
  return (
    <a href="https://www.youtube.com/results?search_query=João+Fonseca+tennis+highlights+2025" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "block", height: "100%" }}>
      <div style={{ background: "linear-gradient(135deg, #0a0a18 0%, #1a0a2e 100%)", borderRadius: 14, padding: "14px 12px", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z"/></svg>
        </div>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: SERIF }}>Highlights</p>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontFamily: SANS }}>Vídeos do João</span>
      </div>
    </a>
  );
};

var CompactRival = function() {
  var r = RIVAL_DATA;
  return (
    <div style={{ background: "linear-gradient(135deg, #1a0a0a 0%, #2d1111 100%)", borderRadius: 14, padding: "14px 12px", height: "100%", textAlign: "center" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginBottom: 8 }}>
        <span style={{ fontSize: 10 }}>⚔️</span>
        <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: RED, fontFamily: SANS }}>Rivalidade</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
        <div><span style={{ fontSize: 12, fontWeight: 700, color: "#fff", fontFamily: SANS }}>🇧🇷</span><br/><span style={{ fontSize: 18, fontWeight: 800, color: GREEN, fontFamily: SANS }}>{r.h2h.joao}</span></div>
        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", fontFamily: SANS }}>VS</span>
        <div><span style={{ fontSize: 12, fontWeight: 700, color: "#fff", fontFamily: SANS }}>{r.country}</span><br/><span style={{ fontSize: 18, fontWeight: 800, color: RED, fontFamily: SANS }}>{r.h2h.tien}</span></div>
      </div>
      <p style={{ margin: "6px 0 0", fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: SANS }}>Fonseca vs {r.name}</p>
    </div>
  );
};

var RegrasBanner = function() {
  return (
    <a href="/regras" style={{ textDecoration: "none", display: "block" }}>
      <div style={{ background: "linear-gradient(135deg, #1a2a1a 0%, #0d2818 100%)", borderRadius: 14, padding: "18px 20px", margin: "4px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
          <span style={{ fontSize: 13 }}>📖</span>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: GREEN, fontFamily: SANS }}>Para iniciantes</span>
        </div>
        <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: "#fff", fontFamily: SERIF }}>Novo no mundo do tênis?</p>
        <p style={{ margin: "0 0 12px", fontSize: 12, color: "rgba(255,255,255,0.45)", fontFamily: SANS, lineHeight: 1.5 }}>Preparamos um guia completo com as regras básicas pra você acompanhar cada ponto do João.</p>
        <div style={{ display: "inline-block", background: GREEN, padding: "8px 16px", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 700, fontFamily: SANS }}>Conferir regras →</div>
      </div>
    </a>
  );
};

var buildFeed = function(newsItems, season, lastMatch, onOpenVideos, allLikes, nextMatch, pollData) {
  var elements = [];
  var banners = [
    <MatchPrediction key="prediction-bar" match={nextMatch} />,
    <QuizGame key="quiz-bar" />,
    <DualBanner key="dual-game-raquetes">
      <CompactGame key="compact-game" />
      <CompactRaquetes key="compact-raquetes" />
    </DualBanner>,
    <VideoBanner key="video-banner" onOpen={onOpenVideos} />,
    <RegrasBanner key="regras-banner" />,
  ];
  // 4 news + 1 banner pattern
  var insertAfter = [4, 8, 12, 16, 20];
  var bannerIdx = 0;
  newsItems.forEach(function(item, i) {
    elements.push(<NewsCard key={"news-" + i} item={item} index={i} allLikes={allLikes} />);
    // Thin inline separators
    if (i + 1 === 2 && lastMatch) elements.push(<LastMatchBar key="last-match-bar" match={lastMatch} />);
    if (i + 1 === 6 && season) elements.push(<SeasonBar key="season-bar" season={season} />);
    if (i + 1 === 10) elements.push(<DailyPoll key="daily-poll" />);
    // Main banners
    if (bannerIdx < banners.length && insertAfter.indexOf(i + 1) !== -1) { elements.push(banners[bannerIdx]); bannerIdx++; }
  });
  while (bannerIdx < banners.length) { elements.push(banners[bannerIdx]); bannerIdx++; }
  return elements;
};

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
  var _allLikes = useState({}); var allLikes = _allLikes[0]; var setAllLikes = _allLikes[1];
  var _visibleCount = useState(12); var visibleCount = _visibleCount[0]; var setVisibleCount = _visibleCount[1];
  var _fb = useState(function() { try { return localStorage.getItem("fn_site_fb"); } catch(e) { return null; } });
  var siteFeedback = _fb[0]; var setSiteFeedback = _fb[1];

  var handleSiteFeedback = function(vote) { if (siteFeedback) return; fetch("/api/feedback?vote=" + vote, { method: "POST" }).then(function(r) { return r.json(); }).then(function(d) {}).catch(function() {}); setSiteFeedback(vote); try { localStorage.setItem("fn_site_fb", vote); } catch(e) {} };
  var initDone = useRef(false);

  useEffect(function() { if (popupDismissed) return; var t = setTimeout(function() { setShowInstallPopup(true); }, 60000); return function() { clearTimeout(t); }; }, [popupDismissed]);
  useEffect(function() { if (!cacheExpiresAt) return; var tick = function() { setTimeLeft(Math.max(0, cacheExpiresAt - Date.now())); }; tick(); var iv = setInterval(tick, 15000); return function() { clearInterval(iv); }; }, [cacheExpiresAt]);

  useEffect(function() {
    var manifest = { name: "Fonseca News", short_name: "Fonseca News", start_url: "/", display: "standalone", background_color: "#FFFFFF", theme_color: "#00A859", orientation: "portrait",
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
    favicon.type = "image/svg+xml"; favicon.href = "data:image/svg+xml," + encodeURIComponent(faviconSvg);
    var touchIconSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180"><rect width="180" height="180" rx="36" fill="#0a1628"/><text x="18" y="130" font-family="Georgia,serif" font-weight="900" font-size="100" fill="#00A859">F</text><text x="95" y="130" font-family="Georgia,serif" font-weight="900" font-size="100" fill="#FFCB05">N</text></svg>';
    var touchIcon = document.querySelector('link[rel="apple-touch-icon"]');
    if (!touchIcon) { touchIcon = document.createElement("link"); touchIcon.rel = "apple-touch-icon"; document.head.appendChild(touchIcon); }
    touchIcon.href = "data:image/svg+xml," + encodeURIComponent(touchIconSvg);
    var ogTags = [["og:title", "Fonseca News · João Fonseca #" + (dp ? dp.ranking : 39) + " ATP"],["og:description", "Notícias, resultados e análises sobre João Fonseca."],["og:type", "website"],["og:site_name", "Fonseca News"],["og:locale", "pt_BR"],["og:url", "https://fonsecanews.com.br"],["og:image", "https://www.atptour.com/-/media/alias/player-headshot/f0fv"],["twitter:card", "summary"],["twitter:site", "@JFonsecaNews"],["twitter:title", "Fonseca News"],["twitter:description", "Notícias e análises sobre João Fonseca"],["twitter:image", "https://www.atptour.com/-/media/alias/player-headshot/f0fv"]];
    ogTags.forEach(function(pair) { var prop = pair[0]; var content = pair[1]; var isOg = prop.startsWith("og:"); var selector = isOg ? ('meta[property="' + prop + '"]') : ('meta[name="' + prop + '"]'); var tag = document.querySelector(selector); if (!tag) { tag = document.createElement("meta"); if (isOg) tag.setAttribute("property", prop); else tag.name = prop; document.head.appendChild(tag); } tag.content = content; });
    var descMeta = document.querySelector('meta[name="description"]');
    if (!descMeta) { descMeta = document.createElement("meta"); descMeta.name = "description"; document.head.appendChild(descMeta); }
    descMeta.content = "Fonseca News — Notícias, resultados, ranking e análises sobre João Fonseca, #" + (dp ? dp.ranking : 39) + " ATP.";
    var GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-J5CD56E1VX";
    if (GA_ID && !document.querySelector('script[src*="googletagmanager"]')) { var gaScript = document.createElement("script"); gaScript.async = true; gaScript.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID; document.head.appendChild(gaScript); var gaInit = document.createElement("script"); gaInit.textContent = "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','" + GA_ID + "');"; document.head.appendChild(gaInit); }
    var handler = function(e) { e.preventDefault(); setDeferredPrompt(e); setShowInstallBanner(true); };
    window.addEventListener("beforeinstallprompt", handler);
    if ("serviceWorker" in navigator) { var sw = new Blob(["self.addEventListener('install',e=>{self.skipWaiting()});self.addEventListener('activate',e=>{e.waitUntil(clients.claim())});self.addEventListener('fetch',e=>{e.respondWith(fetch(e.request).catch(()=>new Response('Offline')))});"], { type: "application/javascript" }); navigator.serviceWorker.register(URL.createObjectURL(sw)).catch(function() {}); }
    return function() { window.removeEventListener("beforeinstallprompt", handler); URL.revokeObjectURL(url); };
  }, []);

  var handleInstall = async function() { if (!deferredPrompt) return; deferredPrompt.prompt(); var r = await deferredPrompt.userChoice; if (r.outcome === "accepted") setShowInstallBanner(false); setDeferredPrompt(null); };
  var dismissPopup = function() { setShowInstallPopup(false); setPopupDismissed(true); };

  var loadCache = async function() { try { var raw = localStorage.getItem("jf-news-v4"); if (raw) { var c = JSON.parse(raw); if (Date.now() - c.timestamp < CACHE_DURATION_MS && c.news && c.news.length) { setNews(c.news); setNextMatch(c.nextMatch||null); setLastMatch(c.lastMatch||null); setPlayer(c.player||null); setSeason(c.season||null); setIsLive(true); setLastUpdate(new Date(c.timestamp).toISOString()); setCacheExpiresAt(c.timestamp+CACHE_DURATION_MS); setCacheStatus("cached"); return true; } } } catch(e) {} return false; };
  var saveCache = async function(d) { try { var o = Object.assign({}, d, { timestamp: Date.now() }); localStorage.setItem("jf-news-v4", JSON.stringify(o)); setCacheExpiresAt(o.timestamp+CACHE_DURATION_MS); } catch(e) {} };
  var fetchNews = async function() { setLoading(true); setCacheStatus("loading"); try { var res = await fetch("/api/news"); if (!res.ok) throw new Error("" + res.status); var p = await res.json(); if (p && p.news && p.news.length) { setNews(p.news); setNextMatch(p.nextMatch||null); setLastMatch(p.lastMatch||null); setPlayer(p.player||null); setSeason(p.season||null); setIsLive(true); setLastUpdate(new Date().toISOString()); setCacheStatus("live"); await saveCache({ news:p.news, nextMatch:p.nextMatch, lastMatch:p.lastMatch, player:p.player, season:p.season }); } else throw new Error("No data"); } catch(e) { setCacheStatus("error"); } finally { setLoading(false); } };
  var handleRefresh = async function() { await fetchNews(); };

  useEffect(function() { if (initDone.current) return; initDone.current = true; (async function() { if (!(await loadCache())) await fetchNews(); })(); }, []);
  useEffect(function() { fetch("/api/stats").then(function(r) { return r.json(); }).then(function(d) { if (d.likes) setAllLikes(d.likes); if (d.visitors) { var el = document.getElementById("fn-visitors"); if (el) el.textContent = d.visitors; } }).catch(function() {}); var isNew = !localStorage.getItem("fn_visited"); if (isNew) { fetch("/api/visitors", { method: "POST" }).catch(function() {}); try { localStorage.setItem("fn_visited", "1"); } catch(e) {} } }, []);

  var dn = news.length > 0 ? news : SAMPLE_NEWS;
  var dm = nextMatch || (news.length === 0 ? SAMPLE_NEXT_MATCH : null);
  var dl = lastMatch || (news.length === 0 ? SAMPLE_LAST_MATCH : null);
  var dp = player || (news.length === 0 ? SAMPLE_PLAYER : null);
  var ds = season || (news.length === 0 ? SAMPLE_SEASON : null);

  // Modal helper
  var Modal = function(p) { return (
    <div onClick={p.onClose} style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, animation: "fadeInO 0.3s ease", overflowY: "auto" }}>
      <div onClick={function(e) { e.stopPropagation(); }} style={{ background: "#fff", borderRadius: 20, padding: "24px 20px", maxWidth: p.maxWidth || 440, width: "100%", maxHeight: "88vh", overflowY: "auto", animation: "slideU 0.4s ease" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: TEXT, fontFamily: SERIF }}>{p.title}</h2>
          <button onClick={p.onClose} style={{ background: "none", border: "none", color: DIM, fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>
        {p.subtitle && <p style={{ margin: "-10px 0 12px", fontSize: 13, color: SUB, fontFamily: SANS }}>{p.subtitle}</p>}
        {p.children}
      </div>
    </div>
  ); };

  return (
    <div style={{ minHeight: "100vh", background: "#fff" }}>
      <style>{
        "@import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@400;600;700;800&family=Inter:wght@400;500;600;700;800&display=swap');" +
        "*{box-sizing:border-box;margin:0;padding:0}" +
        "body{background:#fff;-webkit-font-smoothing:antialiased}" +
        "@keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}" +
        "@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}" +
        "@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}" +
        "@keyframes slideU{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}" +
        "@keyframes fadeInO{from{opacity:0}to{opacity:1}}"
      }</style>

      {/* HEADER */}
      <header style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(255,255,255,0.96)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid " + BORDER }}>
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "16px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg, #0D1726, #132440)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}>
              <span style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 800, letterSpacing: "-0.04em" }}><span style={{ color: GREEN }}>F</span><span style={{ color: YELLOW }}>N</span></span>
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 700, color: TEXT, letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>Fonseca News</span>
                {dp && <span style={{ fontSize: 10, fontWeight: 600, color: GREEN, fontFamily: SANS, background: GREEN + "08", padding: "2px 7px", borderRadius: 999, whiteSpace: "nowrap", flexShrink: 0 }}>#{dp.ranking}</span>}
              </div>
              <p style={{ margin: "2px 0 0", fontSize: 10, color: DIM, fontFamily: SANS, whiteSpace: "nowrap" }}>Site de fãs{lastUpdate ? " · " + formatTimeAgo(lastUpdate) : ""}{dn.length > 0 ? " · " + dn.length + " notícias" : ""}</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <a href="/raquetes" style={{ fontSize: 10, fontWeight: 600, color: "#b8860b", fontFamily: SANS, textDecoration: "none", padding: "5px 8px", borderRadius: 8, background: YELLOW + "0A", border: "1px solid " + YELLOW + "20", whiteSpace: "nowrap" }}>Venda sua raquete</a>
            <button onClick={handleRefresh} disabled={loading} style={{ width: 30, height: 30, borderRadius: 8, background: "transparent", border: "1px solid " + BORDER, color: loading ? DIM : SUB, display: "flex", alignItems: "center", justifyContent: "center", cursor: loading ? "default" : "pointer", flexShrink: 0 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={loading ? { animation: "spin 1s linear infinite" } : {}}><path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16" /></svg>
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 640, margin: "0 auto", padding: "0 20px" }}>
        {/* NEXT DUEL */}
        <h2 style={{ fontSize: 18, fontWeight: 800, color: TEXT, fontFamily: SERIF, letterSpacing: "-0.02em", padding: "10px 0 6px" }}>Próximo duelo</h2>
        <NextDuelCard match={dm} player={dp} isLive={isLive} />

        {/* QUICK NAV */}
        <section style={{ padding: "14px 0", borderBottom: "1px solid " + BORDER }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
            <button onClick={function(){setShowBio(true);}} style={{ padding: "14px 6px", background: BG_ALT, border: "1px solid " + BORDER, borderRadius: 12, cursor: "pointer", textAlign: "center" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={SUB} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", margin: "0 auto 6px" }}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <span style={{ fontSize: 11, fontWeight: 600, color: TEXT, fontFamily: SANS }}>Biografia</span>
            </button>
            <button onClick={function(){setShowRanking(true);}} style={{ padding: "14px 6px", background: BG_ALT, border: "1px solid " + BORDER, borderRadius: 12, cursor: "pointer", textAlign: "center" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={SUB} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", margin: "0 auto 6px" }}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              <span style={{ fontSize: 11, fontWeight: 600, color: TEXT, fontFamily: SANS }}>Ranking</span>
            </button>
            <button onClick={function(){setShowCalendar(true);}} style={{ padding: "14px 6px", background: BG_ALT, border: "1px solid " + BORDER, borderRadius: 12, cursor: "pointer", textAlign: "center" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={SUB} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", margin: "0 auto 6px" }}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <span style={{ fontSize: 11, fontWeight: 600, color: TEXT, fontFamily: SANS }}>Calendário</span>
            </button>
          </div>
        </section>

        {/* MORE MENU */}
        <section style={{ borderBottom: "1px solid " + BORDER }}>
          {!showMenu && (
            <button onClick={function() { setShowMenu(true); }} style={{ width: "100%", padding: "10px 0", background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: SUB, fontFamily: SANS }}>Mais</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={DIM} strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
            </button>
          )}
          {showMenu && (
            <>
              <div style={{ padding: "10px 0 0", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, animation: "fadeIn 0.2s ease" }}>
                <button onClick={function(){setShowTitles(true);setShowMenu(false);}} style={{ padding: "10px 6px", background: BG_ALT, border: "1px solid " + BORDER, borderRadius: 10, cursor: "pointer", textAlign: "center" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={SUB} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", margin: "0 auto 4px" }}><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>
                  <span style={{ fontSize: 10, fontWeight: 600, color: TEXT, fontFamily: SANS }}>Conquistas</span>
                </button>
                <button onClick={function(){setShowNextGen(true);setShowMenu(false);}} style={{ padding: "10px 6px", background: BG_ALT, border: "1px solid " + BORDER, borderRadius: 10, cursor: "pointer", textAlign: "center" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={SUB} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", margin: "0 auto 4px" }}><path d="M6 3v12"/><path d="M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M15 6a9 9 0 0 1-9 9"/></svg>
                  <span style={{ fontSize: 10, fontWeight: 600, color: TEXT, fontFamily: SANS }}>Next Gen</span>
                </button>
                <button onClick={function(){setShowTimeline(true);setShowMenu(false);}} style={{ padding: "10px 6px", background: BG_ALT, border: "1px solid " + BORDER, borderRadius: 10, cursor: "pointer", textAlign: "center" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={SUB} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", margin: "0 auto 4px" }}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <span style={{ fontSize: 10, fontWeight: 600, color: TEXT, fontFamily: SANS }}>Timeline</span>
                </button>
              </div>
              <button onClick={function() { setShowMenu(false); }} style={{ width: "100%", padding: "10px 0", background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: SUB, fontFamily: SANS }}>Menos</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={DIM} strokeWidth="2.5"><polyline points="18 15 12 9 6 15" /></svg>
              </button>
            </>
          )}
        </section>

        {/* NEWS FEED */}
        <section style={{ paddingTop: 4 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: TEXT, fontFamily: SERIF, letterSpacing: "-0.02em", padding: "20px 0 12px" }}>Notícias</h2>
          {loading && news.length === 0 && <Skeleton />}
          {dn.length > 0 && !(loading && news.length === 0) && (
            <>
              <div>{buildFeed(dn.slice(0, visibleCount), ds, dl, function() { setShowVideos(true); }, allLikes, dm)}</div>
              {visibleCount < dn.length && (
                <button onClick={function() { setVisibleCount(function(v) { return Math.min(v + 10, dn.length); }); }} style={{ width: "100%", padding: "14px", background: "transparent", border: "none", borderBottom: "1px solid " + BORDER, cursor: "pointer", fontSize: 13, fontWeight: 600, color: GREEN, fontFamily: SANS }}>
                  Carregar mais ({dn.length - visibleCount} restantes)
                </button>
              )}
            </>
          )}
        </section>

        {/* FOOTER */}
        <footer style={{ padding: "28px 0", borderTop: "1px solid " + BORDER, marginTop: 8 }}>
          {/* Conquistas resumo */}
          <div onClick={function() { setShowTitles(true); }} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 20, cursor: "pointer", flexWrap: "wrap" }}>
            {[["🏆","2 ATP"],["🎯","3 Challengers"],["🇧🇷","Nº1 Brasil"]].map(function(pair, i) { return (<span key={i} style={{ fontSize: 11, color: SUB, fontFamily: SANS }}>{pair[0]} {pair[1]}</span>); })}
            <span style={{ fontSize: 11, color: GREEN, fontFamily: SANS, fontWeight: 600 }}>Ver todos →</span>
          </div>

          {/* Social + ações */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 16 }}>
            <a href="https://www.instagram.com/joaoffonseca" target="_blank" rel="noopener noreferrer" style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid " + BORDER, display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={SUB} strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5" fill={SUB} stroke="none"/></svg>
            </a>
            <a href="https://x.com/JFonsecaNews" target="_blank" rel="noopener noreferrer" style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid " + BORDER, display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill={SUB}><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a href="mailto:thzgouvea@gmail.com?subject=Fonseca News" style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid " + BORDER, display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={SUB} strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22 6 12 13 2 6"/></svg>
            </a>
            <PixDonation />
          </div>

          {/* Feedback + Visitantes */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 16 }}>
            <span style={{ fontSize: 11, color: DIM, fontFamily: SANS }}>{siteFeedback ? (siteFeedback === "up" ? "💚 Obrigado!" : "Vamos melhorar!") : "Gostando do site?"}</span>
            {!siteFeedback && (<div style={{ display: "flex", gap: 4 }}>
              <button onClick={function() { handleSiteFeedback("up"); }} style={{ background: "none", border: "1px solid " + GREEN + "25", borderRadius: 6, width: 28, height: 28, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg></button>
              <button onClick={function() { handleSiteFeedback("down"); }} style={{ background: "none", border: "1px solid " + RED + "25", borderRadius: 6, width: 28, height: 28, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={RED} strokeWidth="2"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10zM17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg></button>
            </div>)}
            <span style={{ color: "#e0e0e0" }}>·</span>
            <span style={{ fontSize: 11, color: DIM, fontFamily: SANS }}><span id="fn-visitors" style={{ fontWeight: 700, color: GREEN }}>...</span> visitantes</span>
          </div>

          {/* Disclaimer */}
          <div style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 12 }}>
            <a href="/regras" style={{ fontSize: 11, color: GREEN, fontFamily: SANS, fontWeight: 600, textDecoration: "none" }}>Regras do tênis</a>
            <a href="/raquetes" style={{ fontSize: 11, color: GREEN, fontFamily: SANS, fontWeight: 600, textDecoration: "none" }}>Venda sua raquete</a>
          </div>
          <p style={{ fontSize: 9, color: DIM, fontFamily: SANS, lineHeight: 1.6, maxWidth: 340, margin: "0 auto", textAlign: "center" }}>Site independente de fãs · Sem vínculo com João Fonseca ou ATP · © 2026 Fonseca News</p>
        </footer>
      </main>

      {/* ===== MODALS ===== */}
      {showBio && (<Modal title="João Fonseca" subtitle="Tenista profissional 🇧🇷" onClose={function(){setShowBio(false);}}><div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>{[["🎂","21/08/2006"],["📍","Ipanema, Rio"],["📏","1,83m"],["🎾","Destro"],["👟","Profissional desde 2024"],["🏆","Melhor: #24"]].map(function(p,i){return(<span key={i} style={{fontSize:11,color:SUB,fontFamily:SANS,background:BG_ALT,padding:"4px 10px",borderRadius:8}}>{p[0]} {p[1]}</span>);})}</div><div style={{fontSize:14,color:SUB,fontFamily:SANS,lineHeight:1.75}}><p style={{marginBottom:12}}>Nascido em Ipanema, filho de Roberta e Christiano. Começou no tênis aos 4 anos no Country Club do Rio.</p><p style={{marginBottom:12}}>Em 2023, conquistou o US Open Juvenil e se tornou o primeiro brasileiro nº1 do ranking juvenil.</p><p style={{marginBottom:12}}>Profissional em 2024. Em janeiro de 2025, derrotou Rublev (top 10) na estreia do Australian Open.</p><p style={{marginBottom:12}}>Conquistou o ATP 250 de Buenos Aires e o ATP 500 de Basel — primeiro brasileiro a ganhar um ATP 500.</p><p>Aos 19 anos, já tem mais títulos ATP que Federer, Djokovic e Nadal tinham na mesma idade.</p></div></Modal>)}

      {showTitles && (<Modal title="🏆 Conquistas" subtitle="8 títulos na carreira" onClose={function(){setShowTitles(false);}} maxWidth={460}><div style={{marginBottom:16}}><p style={{margin:"0 0 8px",fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em",color:GREEN,fontFamily:SANS}}>ATP Tour</p>{[{t:"ATP 500 Basel",d:"Out 2025",det:"vs Davidovich Fokina · 6-3 6-4",note:"1º brasileiro a ganhar ATP 500"},{t:"ATP 250 Buenos Aires",d:"Fev 2025",det:"vs Cerúndolo · 6-4 7-6(1)",note:"Brasileiro mais jovem a ganhar ATP"}].map(function(t,i){return(<div key={i} style={{padding:"10px 0",borderBottom:"1px solid #f0f0f0"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}><span style={{fontSize:14,fontWeight:700,color:TEXT,fontFamily:SERIF}}>{t.t}</span><span style={{fontSize:11,color:DIM,fontFamily:SANS}}>{t.d}</span></div><p style={{margin:0,fontSize:12,color:SUB,fontFamily:SANS}}>{t.det}</p>{t.note&&<p style={{margin:"4px 0 0",fontSize:11,color:GREEN,fontFamily:SANS,fontWeight:600}}>{t.note}</p>}</div>);})}</div><div style={{marginBottom:16}}><p style={{margin:"0 0 8px",fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em",color:"#E8734A",fontFamily:SANS}}>Challengers</p>{[{t:"Phoenix",d:"Mar 2025"},{t:"Canberra",d:"Jan 2025"},{t:"Lexington",d:"Ago 2024",note:"1º título profissional"}].map(function(t,i){return(<div key={i} style={{padding:"8px 0",borderBottom:"1px solid #f0f0f0"}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:13,fontWeight:700,color:TEXT,fontFamily:SERIF}}>{t.t}</span><span style={{fontSize:11,color:DIM,fontFamily:SANS}}>{t.d}</span></div>{t.note&&<p style={{margin:"2px 0 0",fontSize:11,color:"#E8734A",fontFamily:SANS,fontWeight:600}}>{t.note}</p>}</div>);})}</div><div><p style={{margin:"0 0 8px",fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em",color:"#6D35D0",fontFamily:SANS}}>Outros</p>{[{t:"NextGen ATP Finals",d:"Dez 2024"},{t:"Duplas Rio Open",d:"Fev 2026"},{t:"US Open Juvenil",d:"2023"},{t:"Copa Davis Juvenil",d:"2023"}].map(function(t,i){return(<div key={i} style={{padding:"6px 0",borderBottom:i<3?"1px solid #f0f0f0":"none"}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:13,fontWeight:700,color:TEXT,fontFamily:SERIF}}>{t.t}</span><span style={{fontSize:11,color:DIM,fontFamily:SANS}}>{t.d}</span></div></div>);})}</div></Modal>)}

      {showRanking && (<Modal title="📈 Evolução no Ranking" subtitle="Posição ATP ao longo do tempo" onClose={function(){setShowRanking(false);}} maxWidth={650}><RankingChart currentRanking={dp ? dp.ranking : 39} /></Modal>)}
      {showTimeline && (<Modal title="📅 Timeline" subtitle="De Ipanema ao Top 40" onClose={function(){setShowTimeline(false);}} maxWidth={500}><CareerTimeline /></Modal>)}
      {showNextGen && (<Modal title="⚡ Next Gen" subtitle="Os 4 maiores talentos sub-21" onClose={function(){setShowNextGen(false);}} maxWidth={650}><NextGenComparator /></Modal>)}
      {showCalendar && (<Modal title="🗓️ Calendário ATP 2026" subtitle="Grand Slams, Masters e Finals" onClose={function(){setShowCalendar(false);}} maxWidth={520}><ATPCalendar /></Modal>)}

      {showVideos && (<Modal title="🎬 Vídeos" subtitle="Melhores momentos" onClose={function(){setShowVideos(false);}} maxWidth={560}><div style={{display:"flex",flexDirection:"column",gap:12}}>{[{id:"fddSkeUwti4",title:"Fonseca vs Rublev — AO 2025"},{id:"mJbJWh20K8Y",title:"Fonseca: estrela nascendo no AO"}].map(function(vid){return(<div key={vid.id} style={{borderRadius:12,overflow:"hidden",border:"1px solid "+BORDER}}><div style={{position:"relative",paddingBottom:"56.25%",height:0}}><iframe src={"https://www.youtube.com/embed/"+vid.id} title={vid.title} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",border:"none"}} /></div><div style={{padding:"8px 12px"}}><p style={{margin:0,fontSize:12,fontWeight:600,color:TEXT,fontFamily:SANS}}>{vid.title}</p></div></div>);})}</div><div style={{textAlign:"center",marginTop:16}}><a href="https://www.youtube.com/results?search_query=João+Fonseca+tennis+highlights" target="_blank" rel="noopener noreferrer" style={{fontSize:13,fontWeight:600,color:RED,fontFamily:SANS,textDecoration:"none"}}>Ver mais no YouTube →</a></div></Modal>)}

      {showShare && (<Modal title="Compartilhar" onClose={function(){setShowShare(false);}} maxWidth={340}><p style={{margin:"0 0 14px",fontSize:13,color:SUB,fontFamily:SANS,textAlign:"center"}}>Indique o Fonseca News!</p><div style={{display:"flex",flexDirection:"column",gap:8}}><a href={"https://wa.me/?text="+encodeURIComponent("🎾 Fonseca News — Acompanhe o João Fonseca! fonsecanews.com.br")} target="_blank" rel="noopener noreferrer" style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",background:BG_ALT,borderRadius:12,textDecoration:"none",border:"1px solid "+BORDER}}><span style={{fontSize:18}}>💬</span><span style={{fontSize:13,fontWeight:600,color:TEXT,fontFamily:SANS}}>WhatsApp</span></a><a href={"mailto:?subject="+encodeURIComponent("Fonseca News")+"&body="+encodeURIComponent("fonsecanews.com.br")} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",background:BG_ALT,borderRadius:12,textDecoration:"none",border:"1px solid "+BORDER}}><span style={{fontSize:18}}>✉️</span><span style={{fontSize:13,fontWeight:600,color:TEXT,fontFamily:SANS}}>Email</span></a><button onClick={function(){navigator.clipboard.writeText("fonsecanews.com.br").then(function(){setShowShare(false);});}} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",background:BG_ALT,borderRadius:12,border:"1px solid "+BORDER,cursor:"pointer",width:"100%"}}><span style={{fontSize:18}}>📋</span><span style={{fontSize:13,fontWeight:600,color:TEXT,fontFamily:SANS}}>Copiar link</span></button></div></Modal>)}

      {/* INSTALL POPUP */}
      {showInstallPopup && !popupDismissed && (function() {
        var device = detectDevice();
        return (<div onClick={dismissPopup} style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)", display: "flex", alignItems: device === "ios" ? "flex-end" : "center", justifyContent: "center", padding: device === "ios" ? 0 : 16, animation: "fadeInO 0.3s ease" }}><div onClick={function(e){e.stopPropagation();}} style={{ background: "#fff", borderRadius: device === "ios" ? "24px 24px 0 0" : 24, padding: "28px 24px", maxWidth: 380, width: "100%", maxHeight: "90vh", overflowY: "auto", animation: "slideU 0.4s ease", position: "relative" }}>
          <button onClick={dismissPopup} style={{ position: "absolute", top: 14, right: 16, background: "#f0f0f0", border: "none", color: DIM, fontSize: 14, cursor: "pointer", width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>

          {/* Hero */}
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg, #0D1726, #132440)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", boxShadow: "0 4px 12px rgba(0,0,0,0.12)" }}>
              <span style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 800 }}><span style={{ color: GREEN }}>F</span><span style={{ color: YELLOW }}>N</span></span>
            </div>
            <h2 style={{ margin: "0 0 6px", fontSize: 19, fontWeight: 800, color: TEXT, fontFamily: SERIF }}>Tenha o FN na sua tela</h2>
            <p style={{ margin: 0, fontSize: 13, color: SUB, fontFamily: SANS, lineHeight: 1.5 }}>Acesse as notícias do João com um toque, direto do seu celular</p>
          </div>

          {/* Benefits */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: BG_ALT, borderRadius: 10 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              <span style={{ fontSize: 13, color: TEXT, fontFamily: SANS }}>Acesso instantâneo, sem abrir navegador</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: BG_ALT, borderRadius: 10 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              <span style={{ fontSize: 13, color: TEXT, fontFamily: SANS }}>Countdown e notícias sempre atualizados</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: BG_ALT, borderRadius: 10 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12" y2="18"/></svg>
              <span style={{ fontSize: 13, color: TEXT, fontFamily: SANS }}>Tela cheia, como um app de verdade</span>
            </div>
          </div>

          {/* Install button (Android/Chrome) */}
          {deferredPrompt && (<button onClick={function(){handleInstall();dismissPopup();}} style={{ width: "100%", background: GREEN, color: "#fff", border: "none", borderRadius: 12, padding: "14px 0", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: SANS, marginBottom: 12 }}>Adicionar à tela inicial</button>)}

          {/* iOS Steps */}
          {device === "ios" && (
            <div style={{ marginBottom: 8 }}>
              <p style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 600, color: DIM, fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.04em" }}>É rápido — 3 toques:</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: GREEN, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0, fontFamily: SANS }}>1</div>
                  <span style={{ fontSize: 13, color: TEXT, fontFamily: SANS }}>Toque em <strong>Compartilhar</strong> (↑) na barra do Safari</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: GREEN, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0, fontFamily: SANS }}>2</div>
                  <span style={{ fontSize: 13, color: TEXT, fontFamily: SANS }}>Role e toque em <strong>"Adicionar à Tela de Início"</strong></span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: GREEN, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0, fontFamily: SANS }}>3</div>
                  <span style={{ fontSize: 13, color: TEXT, fontFamily: SANS }}>Toque em <strong>"Adicionar"</strong> — pronto!</span>
                </div>
              </div>
            </div>
          )}

          {/* Android Steps */}
          {device === "android" && !deferredPrompt && (
            <div style={{ marginBottom: 8 }}>
              <p style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 600, color: DIM, fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.04em" }}>É rápido — 3 toques:</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: GREEN, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0, fontFamily: SANS }}>1</div>
                  <span style={{ fontSize: 13, color: TEXT, fontFamily: SANS }}>Toque nos <strong>3 pontinhos</strong> (⋮) do Chrome</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: GREEN, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0, fontFamily: SANS }}>2</div>
                  <span style={{ fontSize: 13, color: TEXT, fontFamily: SANS }}>Toque em <strong>"Adicionar à tela inicial"</strong></span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: GREEN, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0, fontFamily: SANS }}>3</div>
                  <span style={{ fontSize: 13, color: TEXT, fontFamily: SANS }}>Confirme em <strong>"Instalar"</strong> — pronto!</span>
                </div>
              </div>
            </div>
          )}

          <button onClick={dismissPopup} style={{ width: "100%", background: "none", color: DIM, border: "none", padding: "10px 0 2px", fontSize: 13, cursor: "pointer", fontFamily: SANS }}>Agora não</button>
        </div></div>);
      })()}
    </div>
  );
}
