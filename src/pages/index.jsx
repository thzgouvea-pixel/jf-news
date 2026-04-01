// Fonseca News — Clean Redesign v2 (corrigido)
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
const surfaceColorMap = { "Saibro": "#E8734A", "Hard": "#3B82F6", "Dura": "#3B82F6", "Grama": "#22C55E" };

var SAMPLE_PLAYER = { ranking: 40, rankingChange: "+4" };
var SAMPLE_SEASON = { wins: 14, losses: 5, titles: 3, year: 2026 };
var SAMPLE_LAST_MATCH = { result: "V", score: "6-3 6-4", opponent: "T. Nakashima", opponent_name: "T. Nakashima", tournament: "Indian Wells", tournament_name: "Indian Wells", round: "R2" };
var SAMPLE_NEXT_MATCH = { tournament_category: "Masters 1000", tournament_name: "Monte Carlo Masters", surface: "Saibro", city: "Monte Carlo", country: "Mônaco", date: "2026-04-04T12:00:00Z", round: "" };
var SAMPLE_NEWS = [
  { title: "João Fonseca confirma presença no ATP 500 de Barcelona", summary: "O tenista brasileiro confirmou participação no torneio espanhol de saibro.", source: "ESPN Brasil", url: "https://www.espn.com.br/tenis/", date: new Date(Date.now() - 2 * 3600000).toISOString(), category: "Torneio" },
  { title: "Fonseca sobe para 40º no ranking da ATP", summary: "Campanha até as oitavas em Miami rende posições ao carioca.", source: "UOL Esporte", url: "https://www.uol.com.br/esporte/tenis/", date: new Date(Date.now() - 8 * 3600000).toISOString(), category: "Ranking" },
  { title: "\"Estou evoluindo a cada torneio\", diz Fonseca", summary: "Brasileiro elogiou próprio desempenho após derrota para o nº1.", source: "GE", url: "https://ge.globo.com/tenis/", date: new Date(Date.now() - 18 * 3600000).toISOString(), category: "Declaração" },
  { title: "Fonseca treina no Rio visando saibro", summary: "Preparação física e ajustes no saque com equipe técnica.", source: "O Globo", url: "https://oglobo.globo.com/esportes/", date: new Date(Date.now() - 36 * 3600000).toISOString(), category: "Treino" },
  { title: "Fonseca vence em sets diretos em Miami", summary: "Parciais de 6-3, 6-4 garantiram vaga na chave principal.", source: "Tênis Brasil", url: "https://tenisbrasil.uol.com.br/", date: new Date(Date.now() - 52 * 3600000).toISOString(), category: "Resultado" },
  { title: "Nike renova com Fonseca até 2028", summary: "Marca americana amplia acordo apostando no potencial do brasileiro.", source: "Folha de S. Paulo", url: "https://www.folha.uol.com.br/esporte/", date: new Date(Date.now() - 72 * 3600000).toISOString(), category: "Notícia" },
  { title: "Técnico revela plano para restante da temporada", summary: "Prioridade: Masters 1000 de saibro e Roland Garros.", source: "ESPN Brasil", url: "https://www.espn.com.br/tenis/", date: new Date(Date.now() - 96 * 3600000).toISOString(), category: "Notícia" },
];

var formatTimeAgo = function(d) { if (!d) return ""; try { var m = Math.floor((new Date() - new Date(d)) / 60000); if (m < 1) return "agora"; if (m < 60) return "há " + m + " min"; var h = Math.floor(m / 60); if (h < 24) return "há " + h + "h"; var dd = Math.floor(h / 24); if (dd === 1) return "ontem"; if (dd < 7) return "há " + dd + " dias"; return new Date(d).toLocaleDateString("pt-BR", { day: "numeric", month: "short" }); } catch(e) { return ""; } };
var formatMatchDate = function(d) { if (!d) return "Sem data confirmada"; try { var dt = new Date(d); return isNaN(dt.getTime()) ? d : dt.toLocaleDateString("pt-BR", { day: "numeric", month: "long" }); } catch(e) { return d; } };
var detectDevice = function() { if (typeof window === "undefined") return "unknown"; var ua = navigator.userAgent.toLowerCase(); if (/iphone|ipad|ipod/.test(ua)) return "ios"; if (/android/.test(ua)) return "android"; return "desktop"; };

var catColors = {
  "Torneio": "#c0392b", "Treino": "#2A9D8F", "Declaração": "#b8860b",
  "Resultado": "#2563EB", "Ranking": "#6D35D0", "Notícia": "#6b6b6b",
};

var generateShareCard = function(opts) {
  var canvas = document.createElement("canvas");
  canvas.width = 1080; canvas.height = 1920;
  var ctx = canvas.getContext("2d");
  var bg = ctx.createLinearGradient(0, 0, 1080, 1920);
  bg.addColorStop(0, "#0D1726"); bg.addColorStop(0.5, "#132440"); bg.addColorStop(1, "#0a1628");
  ctx.fillStyle = bg; ctx.fillRect(0, 0, 1080, 1920);
  ctx.font = "800 120px Georgia, serif"; ctx.fillStyle = "#00A859"; ctx.fillText("F", 420, 500);
  ctx.fillStyle = "#FFCB05"; ctx.fillText("N", 520, 500);
  ctx.font = "600 36px Inter, sans-serif"; ctx.fillStyle = "rgba(255,255,255,0.4)"; ctx.textAlign = "center"; ctx.fillText("FONSECA NEWS", 540, 570);
  ctx.font = "120px sans-serif"; ctx.fillText(opts.emoji || "🎾", 540, 780);
  ctx.font = "800 64px Georgia, serif"; ctx.fillStyle = "#fff"; ctx.fillText(opts.title || "", 540, 920);
  ctx.font = "800 140px Inter, sans-serif"; ctx.fillStyle = "#00A859"; ctx.fillText(opts.value || "", 540, 1120);
  ctx.font = "600 40px Inter, sans-serif"; ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.fillText(opts.subtitle || "", 540, 1210);
  if (opts.matchInfo) { ctx.font = "600 32px Inter, sans-serif"; ctx.fillStyle = "rgba(255,255,255,0.3)"; ctx.fillText(opts.matchInfo, 540, 1300); }
  ctx.fillStyle = "rgba(255,255,255,0.08)"; ctx.beginPath(); ctx.roundRect(240, 1640, 600, 80, 20); ctx.fill();
  ctx.font = "700 30px Inter, sans-serif"; ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.fillText("fonsecanews.com.br", 540, 1692);
  ctx.fillStyle = "#00A859"; ctx.fillRect(0, 0, 540, 6); ctx.fillStyle = "#FFCB05"; ctx.fillRect(540, 0, 540, 6);
  return canvas;
};

var shareCard = function(canvas, text) {
  canvas.toBlob(function(blob) {
    if (navigator.share && navigator.canShare) { var file = new File([blob], "fonseca-news.png", { type: "image/png" }); var shareData = { text: text, files: [file] }; if (navigator.canShare(shareData)) { navigator.share(shareData); return; } }
    var url = URL.createObjectURL(blob); var a = document.createElement("a"); a.href = url; a.download = "fonseca-news.png"; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  }, "image/png");
};

function useCountdown(targetDate) {
  var _s = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
  var countdown = _s[0]; var setCountdown = _s[1];
  useEffect(function() {
    if (!targetDate) return;
    function calc() {
      var now = new Date().getTime(); var target = new Date(targetDate).getTime(); var diff = target - now;
      if (diff <= 0) { setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true }); return; }
      setCountdown({ days: Math.floor(diff / (1000 * 60 * 60 * 24)), hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)), minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)), seconds: Math.floor((diff % (1000 * 60)) / 1000), expired: false });
    }
    calc(); var iv = setInterval(calc, 1000); return function() { clearInterval(iv); };
  }, [targetDate]);
  return countdown;
}

// ===== RANKING CHART =====
var RankingChart = function(props) {
  var currentRanking = props.currentRanking || 40;
  var data = [
    { month: "Dez/24", rank: 145, label: "NextGen" }, { month: "Jan/25", rank: 113, label: "Canberra" },
    { month: "Fev/25", rank: 68, label: "1º título" }, { month: "Mar/25", rank: 55, label: "Phoenix" },
    { month: "Mai/25", rank: 49, label: "" }, { month: "Jul/25", rank: 42, label: "Wimbledon R3" },
    { month: "Ago/25", rank: 35, label: "Top 40" }, { month: "Out/25", rank: 24, label: "Basel 500 🏆" },
    { month: "Jan/26", rank: 29, label: "" }, { month: "Mar/26", rank: currentRanking, label: "Atual" },
  ];
  var W = 600; var H = 260; var padL = 45; var padR = 20; var padT = 30; var padB = 50;
  var chartW = W - padL - padR; var chartH = H - padT - padB;
  var maxRank = 160; var minRank = 10; var rankRange = maxRank - minRank;
  var getX = function(i) { return padL + (i / (data.length - 1)) * chartW; };
  var getY = function(rank) { return padT + ((rank - minRank) / rankRange) * chartH; };
  var points = data.map(function(d, i) { return getX(i) + "," + getY(d.rank); });
  var linePath = "M" + points.join("L");
  var areaPath = linePath + "L" + getX(data.length - 1) + "," + (padT + chartH) + "L" + padL + "," + (padT + chartH) + "Z";
  return (
    <div style={{ padding: "20px 0", overflowX: "auto" }}>
      <svg viewBox={"0 0 " + W + " " + H} style={{ width: "100%", maxWidth: W, height: "auto" }}>
        {[20, 50, 100, 150].map(function(rank) { var y = getY(rank); return (<g key={rank}><line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#f0f0f0" strokeWidth="1" /><text x={padL - 8} y={y + 4} textAnchor="end" fill={DIM} fontSize="9" fontFamily="Inter, sans-serif">{"#" + rank}</text></g>); })}
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
  ];
  var dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
  var poll = polls[dayOfYear % polls.length];
  useEffect(function() {
    if (vote) { fetch("/api/poll").then(function(r) { return r.json(); }).then(function(d) { if (d && typeof d.a === "number" && d.total > 0) { setResults({ a: Math.round((d.a / d.total) * 100), b: Math.round((d.b / d.total) * 100), total: d.total }); } }).catch(function() {}); }
  }, []);
  var handleVote = function(choice) {
    if (vote) return;
    setVote(choice);
    try { localStorage.setItem(pollKey, choice); } catch(e) {}
    fetch("/api/poll?vote=" + choice, { method: "POST" }).then(function(r) { return r.json(); }).then(function(d) { if (d && typeof d.a === "number" && d.total > 0) { setResults({ a: Math.round((d.a / d.total) * 100), b: Math.round((d.b / d.total) * 100), total: d.total }); } }).catch(function() { setResults(choice === "a" ? { a: 62, b: 38 } : { a: 45, b: 55 }); });
  };
  return (
    <div style={{ padding: "18px 16px", background: BG_ALT, borderRadius: 10, margin: "4px 0", border: "1px solid " + BORDER }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <span style={{ fontSize: 8, fontWeight: 700, color: "#fff", fontFamily: SANS, background: GREEN, padding: "2px 6px", borderRadius: 999, textTransform: "uppercase", letterSpacing: "0.06em" }}>Enquete</span>
      </div>
      <p style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700, color: TEXT, fontFamily: SERIF, lineHeight: 1.4 }}>{poll.q}</p>
      {!vote ? (
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={function() { handleVote("a"); }} style={{ flex: 1, padding: "10px", background: "rgba(0,168,89,0.06)", border: "1px solid rgba(0,168,89,0.2)", borderRadius: 10, fontSize: 13, fontWeight: 700, color: GREEN, cursor: "pointer", fontFamily: SANS }}>{poll.a}</button>
          <button onClick={function() { handleVote("b"); }} style={{ flex: 1, padding: "10px", background: "#f0f0f0", border: "1px solid " + BORDER, borderRadius: 10, fontSize: 13, fontWeight: 700, color: TEXT, cursor: "pointer", fontFamily: SANS }}>{poll.b}</button>
        </div>
      ) : (
        <div>
          {[["a", poll.a], ["b", poll.b]].map(function(pair) {
            var k = pair[0]; var label = pair[1]; var pct = results ? results[k] : 50;
            return (
              <div key={k} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: vote === k ? GREEN : SUB, fontFamily: SANS }}>{label} {vote === k ? "✓" : ""}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: DIM, fontFamily: SANS }}>{pct}%</span>
                </div>
                <div style={{ height: 4, background: "#e8e8e8", borderRadius: 2 }}><div style={{ height: 4, background: k === "a" ? GREEN : DIM, borderRadius: 2, width: pct + "%", transition: "width 0.8s ease" }} /></div>
              </div>
            );
          })}
          <p style={{ margin: "8px 0 0", fontSize: 10, color: DIM, fontFamily: SANS, textAlign: "center" }}>Nova enquete amanhã</p>
        </div>
      )}
    </div>
  );
};

// ===== NEXT GEN COMPARATOR =====
var NextGenComparator = function() {
  var players = [
    { name: "J. Fonseca", country: "🇧🇷", age: 19, ranking: 40, titles: 2, style: "Agressivo", forehand: 95, serve: 88, movement: 85, mental: 90, color: GREEN },
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
    { date: "Set 2023", title: "Nº1 mundial juvenil", desc: "Campeão do US Open Jr", emoji: "🏆", color: GREEN },
    { date: "Fev 2024", title: "Estreia ATP no Rio Open", desc: "Derrota Arthur Fils (#36)", emoji: "🇧🇷", color: GREEN },
    { date: "Dez 2024", title: "Campeão NextGen", desc: "Invicto em 5 jogos", emoji: "🏆", color: GREEN },
    { date: "Jan 2025", title: "Derrota Rublev no AO", desc: "Top 10 na R1 de Grand Slam", emoji: "🔥", color: RED },
    { date: "Fev 2025", title: "1º título ATP", desc: "Buenos Aires 250", emoji: "🏆", color: GREEN },
    { date: "Jul 2025", title: "Wimbledon R3", desc: "1º brasileiro desde Bellucci 2010", emoji: "🌿", color: GREEN },
    { date: "Out 2025", title: "Campeão Basel 500", desc: "1º brasileiro a ganhar ATP 500", emoji: "🏆", color: YELLOW },
    { date: "Jan 2026", title: "Duplas no Rio Open", desc: "Título de duplas em casa", emoji: "🤝", color: "#3B82F6" },
    { date: "Mar 2026", title: "Ranking #40 ATP", desc: "Preparando-se para Monte Carlo", emoji: "📈", color: GREEN },
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
    { q: "Qual Grand Slam juvenil o João conquistou em 2023?", opts: ["Australian Open", "Roland Garros", "Wimbledon", "US Open"], answer: 3, points: 10, fun: "Derrotou Learner Tien na final!" },
    { q: "Quem o João derrotou na estreia do Australian Open 2025?", opts: ["Djokovic", "Alcaraz", "Rublev", "Medvedev"], answer: 2, points: 15, fun: "Primeiro adolescente a derrotar um top 10 em 1ª rodada de Grand Slam desde 2002!" },
    { q: "Qual foi o primeiro título ATP do João?", opts: ["Basel 500", "Rio Open 500", "Buenos Aires 250", "Lexington Challenger"], answer: 2, points: 10, fun: "Brasileiro mais jovem a conquistar um título ATP!" },
    { q: "Qual torneio o João venceu invicto com 5 vitórias em 2024?", opts: ["ATP Finals", "NextGen ATP Finals", "Copa Davis", "Laver Cup"], answer: 1, points: 15, fun: "Primeiro sul-americano campeão do NextGen Finals!" },
    { q: "Qual ATP 500 o João conquistou em outubro de 2025?", opts: ["Viena", "Hamburgo", "Basel", "Barcelona"], answer: 2, points: 15, fun: "Primeiro brasileiro a ganhar um ATP 500!" },
  ];
  var _shuf = useState(function() { var arr = allQuestions.slice(); for (var i = arr.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp; } return arr; });
  var questions = _shuf[0];
  var totalPoints = questions.reduce(function(sum, q) { return sum + q.points; }, 0);
  var handleAnswer = function(idx) { if (revealed) return; setSelected(idx); setRevealed(true); if (idx === questions[currentQ].answer) setScore(score + questions[currentQ].points); };
  var handleNext = function() { if (currentQ < questions.length - 1) { setCurrentQ(currentQ + 1); setSelected(null); setRevealed(false); } else setDone(true); };
  var getResultMsg = function() { var pct = Math.round((score / totalPoints) * 100); if (pct === 100) return { emoji: "🏆", msg: "Perfeito! Verdadeiro fã!" }; if (pct >= 80) return { emoji: "🔥", msg: "Impressionante!" }; if (pct >= 60) return { emoji: "🎾", msg: "Bom, você acompanha!" }; return { emoji: "📚", msg: "Continue acompanhando!" }; };
  if (!started) return (
    <div style={{ background: BG_ALT, borderRadius: 10, padding: "18px 16px", margin: "4px 0", cursor: "pointer", border: "1px solid " + BORDER }} onClick={function() { setStarted(true); }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <span style={{ fontSize: 8, fontWeight: 700, color: "#fff", fontFamily: SANS, background: "#b8860b", padding: "2px 6px", borderRadius: 999, textTransform: "uppercase", letterSpacing: "0.06em" }}>Quiz</span>
      </div>
      <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: TEXT, fontFamily: SERIF }}>Quanto você conhece o João?</p>
      <p style={{ margin: "0 0 12px", fontSize: 11, color: SUB, fontFamily: SANS }}>{questions.length} perguntas · {totalPoints} pontos</p>
      <div style={{ background: GREEN, padding: "9px 20px", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 700, fontFamily: SANS, textAlign: "center" }}>Jogar</div>
    </div>
  );
  if (done) {
    var result = getResultMsg();
    return (
      <div style={{ background: BG_ALT, borderRadius: 10, padding: "18px 16px", margin: "4px 0", textAlign: "center", border: "1px solid " + BORDER }}>
        <span style={{ fontSize: 40 }}>{result.emoji}</span>
        <h3 style={{ margin: "8px 0 4px", fontSize: 20, fontWeight: 800, color: TEXT, fontFamily: SERIF }}>{score}/{totalPoints} pontos</h3>
        <p style={{ margin: "0 0 16px", fontSize: 13, color: SUB, fontFamily: SANS }}>{result.msg}</p>
        <button onClick={function() { setCurrentQ(0); setScore(0); setSelected(null); setDone(false); setStarted(false); setRevealed(false); }} style={{ padding: "10px 20px", background: GREEN, color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: SANS }}>Jogar de novo</button>
      </div>
    );
  }
  var q = questions[currentQ];
  return (
    <div style={{ background: BG_ALT, borderRadius: 10, padding: "18px 16px", margin: "4px 0", border: "1px solid " + BORDER }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: 8, fontWeight: 700, color: "#fff", fontFamily: SANS, background: "#b8860b", padding: "2px 6px", borderRadius: 999 }}>Pergunta {currentQ + 1}/{questions.length}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: GREEN, fontFamily: SANS }}>{score} pts</span>
      </div>
      <div style={{ height: 3, background: "#e8e8e8", borderRadius: 2, marginBottom: 14 }}><div style={{ height: 3, background: GREEN, borderRadius: 2, width: ((currentQ + 1) / questions.length * 100) + "%", transition: "width 0.3s" }} /></div>
      <p style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: TEXT, fontFamily: SERIF, lineHeight: 1.4 }}>{q.q}</p>
      <span style={{ fontSize: 11, color: "#b8860b", fontFamily: SANS, fontWeight: 600 }}>{q.points} pontos</span>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
        {q.opts.map(function(opt, idx) {
          var isCorrect = idx === q.answer; var isSelected = idx === selected;
          var bg = BG_ALT; var borderColor = BORDER; var textColor = TEXT;
          if (revealed) { if (isCorrect) { bg = GREEN + "20"; borderColor = GREEN + "40"; textColor = GREEN; } else if (isSelected) { bg = RED + "20"; borderColor = RED + "40"; textColor = RED; } else { bg = "#f5f5f5"; textColor = DIM; } }
          return (<button key={idx} onClick={function() { handleAnswer(idx); }} disabled={revealed} style={{ padding: "12px 14px", background: bg, border: "1px solid " + borderColor, borderRadius: 10, cursor: revealed ? "default" : "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 10 }}><span style={{ width: 24, height: 24, borderRadius: "50%", background: revealed && isCorrect ? GREEN : (revealed && isSelected ? RED : BORDER), border: "1px solid " + (revealed && isCorrect ? GREEN : (revealed && isSelected ? RED : BORDER)), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: revealed && (isCorrect || isSelected) ? "#fff" : DIM, fontFamily: SANS, flexShrink: 0 }}>{revealed && isCorrect ? "✓" : (revealed && isSelected ? "✗" : String.fromCharCode(65 + idx))}</span><span style={{ fontSize: 14, fontWeight: 600, color: textColor, fontFamily: SANS }}>{opt}</span></button>);
        })}
      </div>
      {revealed && (<div style={{ marginTop: 12 }}><div style={{ padding: "10px 14px", background: "#FFFBEB", borderRadius: 10, border: "1px solid #FDE68A", marginBottom: 10 }}><p style={{ margin: 0, fontSize: 12, color: "#92400E", fontFamily: SANS }}>💡 {q.fun}</p></div><button onClick={handleNext} style={{ width: "100%", padding: "12px", background: GREEN, color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: SANS }}>{currentQ < questions.length - 1 ? "Próxima →" : "Ver resultado 🏆"}</button></div>)}
    </div>
  );
};

// ===== MATCH PREDICTION =====
var MatchPrediction = function(props) {
  var match = props.match;
  if (!match || !match.date) return null;
  var matchDate = new Date(match.date); var now = new Date();
  var daysDiff = Math.ceil((matchDate - now) / (1000 * 60 * 60 * 24));
  if (daysDiff > 7 && now <= matchDate) return null;
  var oppName = match.opponent_name || "Adversário";
  var oppShort = oppName.length > 12 ? oppName.split(" ").pop() : oppName;
  var matchKey = (match.tournament_name || "match").replace(/[^a-zA-Z0-9]/g, "_") + "_" + match.date;
  var _p = useState(function() { try { return JSON.parse(localStorage.getItem("fn_pred_" + matchKey)); } catch(e) { return null; } });
  var prediction = _p[0]; var setPrediction = _p[1];
  var options = [
    { label: "João 2x0", sets: "2-0", winner: "joao" }, { label: "João 2x1", sets: "2-1", winner: "joao" },
    { label: oppShort + " 2x1", sets: "1-2", winner: "opp" }, { label: oppShort + " 2x0", sets: "0-2", winner: "opp" },
  ];
  var handlePredict = function(opt) {
    if (prediction) return;
    var pred = { sets: opt.sets, winner: opt.winner, label: opt.label, timestamp: Date.now() };
    setPrediction(pred);
    try { localStorage.setItem("fn_pred_" + matchKey, JSON.stringify(pred)); } catch(e) {}
    fetch("/api/prediction", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ match: matchKey, prediction: pred }) }).catch(function() {});
  };
  return (
    <div style={{ background: BG_ALT, borderRadius: 10, padding: "18px 16px", margin: "4px 0", border: "1px solid " + BORDER }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <span style={{ fontSize: 8, fontWeight: 700, color: "#fff", fontFamily: SANS, background: "#7C3AED", padding: "2px 6px", borderRadius: 999, textTransform: "uppercase", letterSpacing: "0.06em" }}>Palpite</span>
      </div>
      {!prediction ? (
        <>
          <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: TEXT, fontFamily: SERIF }}>Qual será o placar?</p>
          <p style={{ margin: "0 0 10px", fontSize: 11, color: SUB, fontFamily: SANS }}>Fonseca vs {oppName}{match.round ? (" · " + match.round) : ""}</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {options.map(function(opt) { var isJ = opt.winner === "joao"; return (<button key={opt.sets} onClick={function() { handlePredict(opt); }} style={{ padding: "7px 4px", background: isJ ? "rgba(0,168,89,0.08)" : "rgba(192,57,43,0.08)", border: "1px solid " + (isJ ? "rgba(0,168,89,0.2)" : "rgba(192,57,43,0.2)"), borderRadius: 8, cursor: "pointer", textAlign: "center" }}><span style={{ fontSize: 13, fontWeight: 700, color: isJ ? GREEN : RED, fontFamily: SANS, display: "block" }}>{opt.sets.replace("-", "x")}</span><span style={{ fontSize: 9, color: DIM, fontFamily: SANS }}>{isJ ? "Fonseca" : oppShort}</span></button>); })}
          </div>
        </>
      ) : (
        <div style={{ textAlign: "center", padding: "4px 0" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: prediction.winner === "joao" ? "rgba(0,168,89,0.06)" : "rgba(192,57,43,0.06)", borderRadius: 12, padding: "8px 16px", border: "1px solid " + (prediction.winner === "joao" ? "rgba(0,168,89,0.25)" : "rgba(192,57,43,0.25)") }}>
            <span style={{ fontSize: 14 }}>{prediction.winner === "joao" ? "🇧🇷" : "🎾"}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: prediction.winner === "joao" ? GREEN : RED, fontFamily: SANS }}>Palpite: {prediction.label}</span>
          </div>
          <p style={{ fontSize: 10, color: DIM, fontFamily: SANS, marginTop: 6 }}>Resultado após o jogo</p>
        </div>
      )}
    </div>
  );
};

// ===== NEXT DUEL CARD =====
var NextDuelCard = function(props) {
  var match = props.match; var player = props.player;
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
      <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "radial-gradient(circle, " + sc + "15 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: sc, fontFamily: SANS }}>{match.surface}</span>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>·</span>
          <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.4)", fontFamily: SANS }}>{match.city}</span>
        </div>
      </div>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <h2 style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 800, color: "#fff", lineHeight: 1.1, letterSpacing: "-0.03em", margin: "0 0 4px" }}>{match.tournament_category || "Próxima Partida"}</h2>
        {match.tournament_name && <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontFamily: SANS, margin: 0 }}>{match.tournament_name} · {formatMatchDate(match.date)}</p>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 16, alignItems: "center", marginBottom: 24 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", margin: "0 auto 8px", background: "#1a2a3a", border: "2px solid " + GREEN + "35", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <img src={joaoImg} alt="JF" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={function(e) { e.target.style.display = "none"; e.target.parentNode.innerHTML = '<span style="font-size:16px;font-weight:800;color:#00A859;font-family:Inter,sans-serif">JF</span>'; }} />
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: SERIF, display: "block" }}>J. Fonseca</span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontFamily: SANS }}>🇧🇷 {player ? "#" + player.ranking : ""}</span>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.2)", fontFamily: SANS }}>VS</span>
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", margin: "0 auto 8px", background: "#1a2a3a", border: "2px solid rgba(255,255,255,0.1)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {oppImg ? <img src={oppImg} alt={oppName} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={function(e) { e.target.style.display = "none"; }} /> : <span style={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>?</span>}
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: SERIF, display: "block" }}>{oppName}</span>
          {oppCountry ? <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontFamily: SANS }}>{oppCountry}{oppRanking ? " #" + oppRanking : ""}</span> : <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontFamily: SANS }}>chave pendente</span>}
        </div>
      </div>
      {!countdown.expired && (
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ display: "inline-flex", gap: 14 }}>
            {[[countdown.days,"dias"],[countdown.hours,"hrs"],[countdown.minutes,"min"],[countdown.seconds,"seg"]].map(function(p,i) { return (<div key={i} style={{ textAlign: "center", minWidth: 36 }}><span style={{ fontSize: 20, fontWeight: 700, color: "#fff", fontFamily: SANS, display: "block", lineHeight: 1 }}>{String(p[0]).padStart(2, "0")}</span><span style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.06em" }}>{p[1]}</span></div>); })}
          </div>
        </div>
      )}
      <div style={{ textAlign: "center" }}>
        <a href="https://www.tennistv.com/players/joao-fonseca" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 600, color: "#4FC3F7", fontFamily: SANS, textDecoration: "none", padding: "6px 14px", borderRadius: 8, background: "rgba(79,195,247,0.1)", border: "1px solid rgba(79,195,247,0.15)" }}>Assistir ao vivo →</a>
      </div>
    </section>
  );
};

// ===== LIVE SCORE CARD =====
var LiveScoreCard = function(props) {
  var data = props.data;
  if (!data || !data.live) return null;

  var match = data.match || {};
  var stats = data.stats || {};
  var homeTeam = match.homeTeam || {};
  var awayTeam = match.awayTeam || {};
  var homeScore = match.homeScore || {};
  var awayScore = match.awayScore || {};
  var status = match.status || {};

  // Determine which side is Fonseca
  var homeName = (homeTeam.name || homeTeam.slug || "").toLowerCase();
  var isFonsecaHome = homeName.includes("fonseca");
  var fTeam = isFonsecaHome ? homeTeam : awayTeam;
  var oTeam = isFonsecaHome ? awayTeam : homeTeam;
  var fScore = isFonsecaHome ? homeScore : awayScore;
  var oScore = isFonsecaHome ? awayScore : homeScore;

  // Set scores
  var fSets = fScore.period1 !== undefined ? [fScore.period1, fScore.period2, fScore.period3].filter(function(s) { return s !== undefined; }) : [];
  var oSets = oScore.period1 !== undefined ? [oScore.period1, oScore.period2, oScore.period3].filter(function(s) { return s !== undefined; }) : [];

  var fName = (fTeam.name || "J. Fonseca").split(" ").pop();
  var oName = (oTeam.name || "Oponente").split(" ").pop();

  // Current game score
  var fGame = fScore.point || "";
  var oGame = oScore.point || "";

  // Tournament info
  var tournament = match.tournament || {};
  var tourneyName = tournament.name || data.tournament || "";
  var surface = data.surface || "";
  var sc = surfaceColorMap[surface] || "#999";
  var statusText = status.description || "Ao vivo";

  // Live stats (if available from the same fetch)
  var fStats = isFonsecaHome ? (stats.home || {}) : (stats.away || {});
  var oStats = isFonsecaHome ? (stats.away || {}) : (stats.home || {});

  var liveStatRows = [
    { label: "Aces", f: fStats.aces || 0, o: oStats.aces || 0 },
    { label: "D. Faltas", f: fStats.doublefaults || 0, o: oStats.doublefaults || 0, invert: true },
    { label: "1o Saque %", f: fStats.firstserveaccuracy || 0, o: oStats.firstserveaccuracy || 0, pct: true },
    { label: "Winners", f: fStats.winners || 0, o: oStats.winners || 0 },
    { label: "Pontos", f: fStats.pointstotal || 0, o: oStats.pointstotal || 0 },
  ].filter(function(r) { return r.f > 0 || r.o > 0; });

  return (
    <section style={{ margin: "4px -20px 0", padding: "20px 24px", background: "linear-gradient(145deg, #0D1726 0%, #1a3050 100%)", borderRadius: 20, position: "relative", overflow: "hidden" }}>
      {/* Pulsing live dot */}
      <div style={{ position: "absolute", top: 16, right: 20, display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", animation: "pulse 1.5s ease-in-out infinite", display: "inline-block" }} />
        <span style={{ fontSize: 10, fontWeight: 700, color: "#ef4444", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.08em" }}>Ao vivo</span>
      </div>

      {/* Tournament info */}
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        {surface && <span style={{ fontSize: 10, fontWeight: 700, color: sc, fontFamily: SANS }}>{surface}</span>}
        {tourneyName && <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: SANS }}> · {tourneyName}</span>}
        <div style={{ marginTop: 4 }}><span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontFamily: SANS }}>{statusText}</span></div>
      </div>

      {/* Scoreboard */}
      <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 12, padding: "16px 20px", marginBottom: liveStatRows.length > 0 ? 16 : 0 }}>
        {/* Player names row */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: GREEN, fontFamily: SERIF }}>J. Fonseca</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#fff", fontFamily: SERIF }}>{oName}</span>
        </div>

        {/* Sets */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 10 }}>
            {fSets.map(function(s, i) {
              var won = s > oSets[i];
              return (<span key={i} style={{ fontSize: 22, fontWeight: 800, color: won ? GREEN : "rgba(255,255,255,0.5)", fontFamily: SANS }}>{s}</span>);
            })}
            {fGame !== "" && <span style={{ fontSize: 16, fontWeight: 600, color: YELLOW, fontFamily: SANS, marginLeft: 6 }}>{fGame}</span>}
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.15)", fontFamily: SANS }}>SETS</span>
          <div style={{ display: "flex", gap: 10 }}>
            {oGame !== "" && <span style={{ fontSize: 16, fontWeight: 600, color: YELLOW, fontFamily: SANS, marginRight: 6 }}>{oGame}</span>}
            {oSets.map(function(s, i) {
              var won = s > fSets[i];
              return (<span key={i} style={{ fontSize: 22, fontWeight: 800, color: won ? "#ef4444" : "rgba(255,255,255,0.5)", fontFamily: SANS }}>{s}</span>);
            })}
          </div>
        </div>
      </div>

      {/* Live stats */}
      {liveStatRows.length > 0 && (
        <div style={{ padding: "0 4px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: GREEN, fontFamily: SANS }}>Fonseca</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.4)", fontFamily: SANS }}>{oName}</span>
          </div>
          {liveStatRows.map(function(row, i) {
            var fBetter = row.invert ? row.f < row.o : row.f >= row.o;
            return (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: fBetter ? GREEN : "rgba(255,255,255,0.4)", fontFamily: SANS, width: 30 }}>{row.pct ? row.f + "%" : row.f}</span>
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontFamily: SANS, textAlign: "center", flex: 1 }}>{row.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: !fBetter ? "#ef4444" : "rgba(255,255,255,0.4)", fontFamily: SANS, width: 30, textAlign: "right" }}>{row.pct ? row.o + "%" : row.o}</span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

// ===== WIN PROBABILITY BAR =====
var WinProbBar = function(props) {
  var winProb = props.winProb;
  if (!winProb || !winProb.fonseca) return null;

  var fPct = Math.round(winProb.fonseca);
  var oPct = Math.round(winProb.opponent);
  var oppName = (winProb.opponent_name || "Oponente").split(" ").pop();

  return (
    <div style={{ padding: "12px 0", borderBottom: "1px solid " + BORDER }}>
      <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: DIM, fontFamily: SANS, display: "block", marginBottom: 8 }}>Probabilidade de vitória</span>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: fPct >= oPct ? GREEN : DIM, fontFamily: SANS }}>Fonseca {fPct}%</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: oPct > fPct ? RED : DIM, fontFamily: SANS }}>{oppName} {oPct}%</span>
      </div>
      <div style={{ display: "flex", height: 6, borderRadius: 3, overflow: "hidden", gap: 2 }}>
        <div style={{ width: fPct + "%", background: GREEN, borderRadius: "3px 0 0 3px", transition: "width 0.8s ease" }} />
        <div style={{ width: oPct + "%", background: RED, borderRadius: "0 3px 3px 0", transition: "width 0.8s ease" }} />
      </div>
    </div>
  );
};

// ===== PLAYER BLOCK (CORRIGIDO) =====
var PlayerBlock = function(props) {
  var lastMatch = props.lastMatch;
  var matchStats = props.matchStats;
  var recentForm = props.recentForm;
  var season = props.season;
  var prizeMoney = props.prizeMoney;

  var hasAnyData = (matchStats && matchStats.fonseca) || (recentForm && recentForm.length > 0) || season || prizeMoney;
  if (!hasAnyData) return null;

  return (
    <div style={{ borderTop: "1px solid " + BORDER, margin: "0 0 4px" }}>

      {/* Stats do jogo */}
      {matchStats && matchStats.fonseca && (function() {
        var f = matchStats.fonseca;
        var o = matchStats.opponent;
        var statRows = [
          { label: "Aces", fVal: f.aces || 0, oVal: o.aces || 0 },
          { label: "Duplas faltas", fVal: f.doublefaults || 0, oVal: o.doublefaults || 0, invert: true },
          { label: "1º saque %", fVal: f.firstserveaccuracy || 0, oVal: o.firstserveaccuracy || 0, pct: true },
          { label: "Pontos no 1º saque", fVal: f.firstservepointsaccuracy || 0, oVal: o.firstservepointsaccuracy || 0, pct: true },
          { label: "Pontos no 2º saque", fVal: f.secondservepointsaccuracy || 0, oVal: o.secondservepointsaccuracy || 0, pct: true },
          { label: "Breaks salvos", fVal: f.breakpointssaved || 0, oVal: o.breakpointssaved || 0 },
          { label: "Total de pontos", fVal: f.pointstotal || 0, oVal: o.pointstotal || 0 },
        ].filter(function(r) { return r.fVal > 0 || r.oVal > 0; });
        if (statRows.length === 0) return null;
        var oppShort = (matchStats.opponent_name || "Adv.").split(" ").pop();
        var isWin = matchStats.result === "V";
        var hasBelowContent = (recentForm && recentForm.length > 0) || prizeMoney;
        return (
          <div style={{ padding: "16px 0", borderBottom: hasBelowContent ? "1px solid " + BORDER : "none" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: DIM, fontFamily: SANS, display: "block" }}>Stats · Última partida</span>
                <span style={{ fontSize: 12, color: SUB, fontFamily: SANS }}>{matchStats.tournament} · {matchStats.score}</span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: isWin ? GREEN : RED, fontFamily: SANS, background: isWin ? GREEN + "0A" : RED + "0A", padding: "3px 10px", borderRadius: 999 }}>{isWin ? "Vitória" : "Derrota"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: GREEN, fontFamily: SANS }}>Fonseca</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: SUB, fontFamily: SANS }}>{oppShort}</span>
            </div>
            {statRows.map(function(row, i) {
              var fMax = Math.max(row.fVal, row.oVal, 1);
              var fPct = row.pct ? row.fVal : Math.round((row.fVal / fMax) * 100);
              var oPct = row.pct ? row.oVal : Math.round((row.oVal / fMax) * 100);
              var fBetter = row.invert ? row.fVal < row.oVal : row.fVal >= row.oVal;
              return (
                <div key={i} style={{ marginBottom: i < statRows.length - 1 ? 10 : 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: fBetter ? TEXT : DIM, fontFamily: SANS }}>{row.pct ? row.fVal + "%" : row.fVal}</span>
                    <span style={{ fontSize: 10, color: DIM, fontFamily: SANS, textAlign: "center", flex: 1, padding: "0 8px" }}>{row.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: !fBetter ? TEXT : DIM, fontFamily: SANS }}>{row.pct ? row.oVal + "%" : row.oVal}</span>
                  </div>
                  <div style={{ display: "flex", height: 3, gap: 3 }}>
                    <div style={{ flex: 1, display: "flex", justifyContent: "flex-end", background: "#f0f0f0", borderRadius: "2px 0 0 2px" }}>
                      <div style={{ height: 3, background: fBetter ? GREEN : "#d0d0d0", borderRadius: "2px 0 0 2px", width: Math.max(fPct, 4) + "%", transition: "width 0.6s ease" }} />
                    </div>
                    <div style={{ flex: 1, background: "#f0f0f0", borderRadius: "0 2px 2px 0" }}>
                      <div style={{ height: 3, background: !fBetter ? RED : "#d0d0d0", borderRadius: "0 2px 2px 0", width: Math.max(oPct, 4) + "%", transition: "width 0.6s ease" }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Forma recente */}
      {recentForm && recentForm.length > 0 && (
        <div style={{ padding: "10px 0", borderBottom: prizeMoney ? "1px solid " + BORDER : "none", display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: DIM, fontFamily: SANS }}>Forma</span>
          <div style={{ display: "flex", gap: 3 }}>
            {recentForm.map(function(m, i) {
              var w = m.result === "V";
              return (<div key={i} title={(m.opponent_name || "") + " " + (m.score || "")} style={{ width: 20, height: 20, borderRadius: 5, background: w ? GREEN + "12" : RED + "12", border: "1px solid " + (w ? GREEN + "30" : RED + "30"), display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 9, fontWeight: 700, color: w ? GREEN : RED, fontFamily: SANS }}>{w ? "V" : "D"}</span></div>);
            })}
          </div>
        </div>
      )}

      {/* Prize Money */}
      {prizeMoney && (
        <div style={{ padding: "10px 0", display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: DIM, fontFamily: SANS }}>Prize money</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: GREEN, fontFamily: SANS }}>
            {prizeMoney >= 1000000 ? "US$ " + (prizeMoney / 1000000).toFixed(1) + "M" : "US$ " + Math.round(prizeMoney / 1000) + "K"}
          </span>
        </div>
      )}
    </div>
  );
};

// ===== PIX DONATION =====
var PixDonation = function() {
  var _s = useState(false); var showModal = _s[0]; var setShowModal = _s[1];
  var _c = useState(false); var copied = _c[0]; var setCopied = _c[1];
  var PIX_KEY = "SUA-CHAVE-PIX-AQUI";
  var handleCopy = function() { if (navigator.clipboard) { navigator.clipboard.writeText(PIX_KEY).then(function() { setCopied(true); setTimeout(function() { setCopied(false); }, 3000); }); } };
  return (
    <>
      <button data-pix-btn onClick={function() { setShowModal(true); }} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", background: GREEN, color: "#fff", border: "none", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: SANS }}>💚 Apoie via PIX</button>
      {showModal && (
        <div onClick={function() { setShowModal(false); }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
          <div onClick={function(e) { e.stopPropagation(); }} style={{ background: "#fff", borderRadius: 20, padding: 28, maxWidth: 360, width: "100%", textAlign: "center", position: "relative" }}>
            <button onClick={function() { setShowModal(false); }} style={{ position: "absolute", top: 12, right: 16, background: "none", border: "none", color: DIM, fontSize: 18, cursor: "pointer" }}>✕</button>
            <h3 style={{ margin: "0 0 6px", color: TEXT, fontSize: 18, fontFamily: SERIF }}>Apoie o Fonseca News</h3>
            <p style={{ color: SUB, fontSize: 13, margin: "0 0 20px", fontFamily: SANS }}>Ajude a manter o site no ar!</p>
            <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
              <code style={{ background: BG_ALT, padding: "8px 12px", borderRadius: 8, color: SUB, fontSize: 11 }}>{PIX_KEY}</code>
              <button onClick={handleCopy} style={{ padding: "8px 14px", background: GREEN, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: SANS }}>{copied ? "✅ Copiado!" : "Copiar"}</button>
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
  var item = props.item; var index = props.index; var allLikes = props.allLikes || {}; var noBorder = props.noBorder;
  var _s = useState(false); var h = _s[0]; var setH = _s[1];
  var _i = useState(false); var imgErr = _i[0]; var setImgErr = _i[1];
  var hasImg = item.image && !imgErr;
  var likeId = (item.title || "").substring(0, 40).replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
  var initialLikes = allLikes[likeId] || { likes: 0, dislikes: 0 };
  var _lk = useState(initialLikes); var rx = _lk[0]; var setRx = _lk[1];
  var _voted = useState(function() { try { return localStorage.getItem("fn_v_" + likeId); } catch(e) { return null; } });
  var voted = _voted[0]; var setVoted = _voted[1];
  useEffect(function() { var fresh = allLikes[likeId]; if (fresh && typeof fresh.likes === "number") setRx(fresh); }, [allLikes[likeId]]);
  var handleRx = function(type, e) { e.preventDefault(); e.stopPropagation(); if (voted) return; var action = type === "l" ? "like" : "dislike"; fetch("/api/likes?id=" + likeId + "&action=" + action, { method: "POST" }).then(function(r) { return r.json(); }).then(function(d) { if (d && typeof d.likes === "number") setRx(d); }).catch(function() {}); setVoted(type); try { localStorage.setItem("fn_v_" + likeId, type); } catch(e) {} };
  var handleSh = function(e) { e.preventDefault(); e.stopPropagation(); if (navigator.share) { navigator.share({ title: item.title, url: item.url || "https://fonsecanews.com.br" }).catch(function() {}); } };
  var catColor = catColors[item.category] || catColors["Notícia"];
  var hasUrl = item.url && item.url.startsWith("http");
  var cleanTitle = item.source && item.title ? item.title.replace(" - " + item.source, "").replace(" | " + item.source, "").replace(" · " + item.source, "") : item.title;
  return (
    <article onClick={function() { if (hasUrl) window.open(item.url, "_blank", "noopener,noreferrer"); }} onMouseEnter={function() { setH(true); }} onMouseLeave={function() { setH(false); }}
      style={{ padding: "20px 0", borderBottom: noBorder ? "none" : "1px solid " + BORDER, cursor: "pointer", animation: "fadeIn 0.35s ease forwards", animationDelay: (index * 0.04) + "s", opacity: 0 }}>
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
        {hasImg && <img src={item.image} alt="" onError={function() { setImgErr(true); }} style={{ width: 72, height: 72, borderRadius: 10, objectFit: "cover", flexShrink: 0, background: "#f0f0f0" }} loading="lazy" />}
      </div>
    </article>
  );
};

// ===== BUILD FEED =====
var buildFeed = function(newsItems, allLikes, nextMatch) {
  var elements = [];
  var interactions = [
    nextMatch ? <MatchPrediction key="prediction" match={nextMatch} /> : null,
    <QuizGame key="quiz" />,
    <DailyPoll key="poll" />,
  ].filter(Boolean);
  var interactionIdx = 0;
  newsItems.forEach(function(item, i) {
    var isLastBeforeInteraction = (i + 1) % 4 === 0 && interactionIdx < interactions.length;
    elements.push(<NewsCard key={"news-" + i} item={item} index={i} allLikes={allLikes} noBorder={isLastBeforeInteraction} />);
    if (isLastBeforeInteraction) {
      elements.push(interactions[interactionIdx]);
      interactionIdx++;
    }
  });
  while (interactionIdx < interactions.length) {
    elements.push(interactions[interactionIdx]);
    interactionIdx++;
  }
  return elements;
};

// ===== INSTALL BANNER =====
var InstallBanner = function() {
  var isStandalone = typeof window !== "undefined" && (window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone);
  if (isStandalone) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: BG_ALT, borderRadius: 12, border: "1px solid " + BORDER }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: "#0D1726", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12" y2="18"/></svg>
      </div>
      <div>
        <span style={{ fontSize: 13, fontWeight: 700, color: TEXT, fontFamily: SANS, display: "block" }}>Tenha o FN no celular</span>
        <span style={{ fontSize: 11, color: SUB, fontFamily: SANS }}>Adicione à tela inicial — sem baixar nada</span>
      </div>
    </div>
  );
};

// ===== MAIN APP =====
export default function JoaoFonsecaNews() {
  var _n = useState([]); var news = _n[0]; var setNews = _n[1];
  var _nm = useState(null); var nextMatch = _nm[0]; var setNextMatch = _nm[1];
  var _lm = useState(null); var lastMatch = _lm[0]; var setLastMatch = _lm[1];
  var _p = useState(null); var player = _p[0]; var setPlayer = _p[1];
  var _se = useState(null); var season = _se[0]; var setSeason = _se[1];
  var _l = useState(false); var loading = _l[0]; var setLoading = _l[1];
  var _lu = useState(null); var lastUpdate = _lu[0]; var setLastUpdate = _lu[1];
  var _dp = useState(null); var deferredPrompt = _dp[0]; var setDeferredPrompt = _dp[1];
  var _sib = useState(false); var showInstallBanner = _sib[0]; var setShowInstallBanner = _sib[1];
  var _sip = useState(false); var showInstallPopup = _sip[0]; var setShowInstallPopup = _sip[1];
  var _pd = useState(false); var popupDismissed = _pd[0]; var setPopupDismissed = _pd[1];
  var _sb = useState(false); var showBio = _sb[0]; var setShowBio = _sb[1];
  var _st = useState(false); var showTitles = _st[0]; var setShowTitles = _st[1];
  var _sm = useState(false); var showMenu = _sm[0]; var setShowMenu = _sm[1];
  var _sr = useState(false); var showRanking = _sr[0]; var setShowRanking = _sr[1];
  var _sng = useState(false); var showNextGen = _sng[0]; var setShowNextGen = _sng[1];
  var _stl = useState(false); var showTimeline = _stl[0]; var setShowTimeline = _stl[1];
  var _scal = useState(false); var showCalendar = _scal[0]; var setShowCalendar = _scal[1];
  var _svid = useState(false); var showVideos = _svid[0]; var setShowVideos = _svid[1];
  var _allLikes = useState({}); var allLikes = _allLikes[0]; var setAllLikes = _allLikes[1];
  var _matchStats = useState(null); var matchStats = _matchStats[0]; var setMatchStats = _matchStats[1];
  var _recentForm = useState(null); var recentForm = _recentForm[0]; var setRecentForm = _recentForm[1];
  var _prizeMoney = useState(null); var prizeMoney = _prizeMoney[0]; var setPrizeMoney = _prizeMoney[1];
  var _liveMatch = useState(null); var liveMatch = _liveMatch[0]; var setLiveMatch = _liveMatch[1];
  var _winProb = useState(null); var winProb = _winProb[0]; var setWinProb = _winProb[1];
  var _visibleCount = useState(12); var visibleCount = _visibleCount[0]; var setVisibleCount = _visibleCount[1];
  var _fb = useState(function() { try { return localStorage.getItem("fn_site_fb"); } catch(e) { return null; } });
  var siteFeedback = _fb[0]; var setSiteFeedback = _fb[1];
  var _showFeedback = useState(false); var showFeedback = _showFeedback[0]; var setShowFeedback = _showFeedback[1];
  var _showInstallGuide = useState(false); var showInstallGuide = _showInstallGuide[0]; var setShowInstallGuide = _showInstallGuide[1];
  var _fbName = useState(""); var fbName = _fbName[0]; var setFbName = _fbName[1];
  var _fbMsg = useState(""); var fbMsg = _fbMsg[0]; var setFbMsg = _fbMsg[1];
  var _fbRating = useState(null); var fbRating = _fbRating[0]; var setFbRating = _fbRating[1];
  var _fbSent = useState(false); var fbSent = _fbSent[0]; var setFbSent = _fbSent[1];

  var initDone = useRef(false);

  // Live score polling — every 60s, only when page visible
  useEffect(function() {
    var pollLive = function() {
      fetch("/api/live").then(function(r) { return r.json(); }).then(function(d) {
        if (d && d.live) {
          setLiveMatch(d);
        } else {
          setLiveMatch(null);
        }
      }).catch(function() {});
    };
    pollLive(); // initial
    var iv = setInterval(function() {
      if (!document.hidden) pollLive();
    }, 60000);
    return function() { clearInterval(iv); };
  }, []);

  useEffect(function() { if (popupDismissed) return; var t = setTimeout(function() { setShowInstallPopup(true); }, 60000); return function() { clearTimeout(t); }; }, [popupDismissed]);

  useEffect(function() {
    var handler = function(e) { e.preventDefault(); setDeferredPrompt(e); setShowInstallBanner(true); };
    window.addEventListener("beforeinstallprompt", handler);
    if ("serviceWorker" in navigator) { var sw = new Blob(["self.addEventListener('install',e=>{self.skipWaiting()});self.addEventListener('activate',e=>{e.waitUntil(clients.claim())});self.addEventListener('fetch',e=>{e.respondWith(fetch(e.request).catch(()=>new Response('Offline')))});"], { type: "application/javascript" }); navigator.serviceWorker.register(URL.createObjectURL(sw)).catch(function() {}); }
    return function() { window.removeEventListener("beforeinstallprompt", handler); };
  }, []);

  var handleInstall = async function() { if (!deferredPrompt) return; deferredPrompt.prompt(); var r = await deferredPrompt.userChoice; if (r.outcome === "accepted") setShowInstallBanner(false); setDeferredPrompt(null); };
  var dismissPopup = function() { setShowInstallPopup(false); setPopupDismissed(true); };

  var loadCache = async function() {
    try { var raw = localStorage.getItem("jf-news-v4"); if (raw) { var c = JSON.parse(raw); if (Date.now() - c.timestamp < CACHE_DURATION_MS && c.news && c.news.length) { setNews(c.news); setNextMatch(c.nextMatch||null); setLastMatch(c.lastMatch||null); setPlayer(c.player||null); setSeason(c.season||null); setLastUpdate(new Date(c.timestamp).toISOString()); return true; } } } catch(e) {}
    return false;
  };
  var saveCache = async function(d) { try { localStorage.setItem("jf-news-v4", JSON.stringify(Object.assign({}, d, { timestamp: Date.now() }))); } catch(e) {} };

  var fetchNews = async function() {
    setLoading(true);
    try { var res = await fetch("/api/news"); if (!res.ok) throw new Error("" + res.status); var p = await res.json(); if (p && p.news && p.news.length) { setNews(p.news); setNextMatch(p.nextMatch||null); setLastMatch(p.lastMatch||null); setPlayer(p.player||null); setSeason(p.season||null); setLastUpdate(new Date().toISOString()); await saveCache({ news:p.news, nextMatch:p.nextMatch, lastMatch:p.lastMatch, player:p.player, season:p.season }); } else throw new Error("No data"); } catch(e) {}
    finally { setLoading(false); }
  };

  var handleRefresh = async function() {
    await fetchNews();
    fetch("/api/sofascore-data").then(function(r) { return r.json(); }).then(function(d) {
      if (d.matchStats) setMatchStats(d.matchStats);
      if (d.recentForm) setRecentForm(d.recentForm);
      if (d.prizeMoney && d.prizeMoney.amount) setPrizeMoney(d.prizeMoney.amount);
      if (d.ranking && d.ranking.ranking) setPlayer(function(prev) { return prev ? Object.assign({}, prev, { ranking: d.ranking.ranking }) : { ranking: d.ranking.ranking }; });
      if (d.season && d.season.wins !== undefined) setSeason(d.season);
      if (d.lastMatch && d.lastMatch.result) setLastMatch(d.lastMatch);
      if (d.nextMatch && d.nextMatch.date) setNextMatch(d.nextMatch);
      if (d.winProb) setWinProb(d.winProb);
    }).catch(function() {});
  };

  useEffect(function() {
    if (initDone.current) return; initDone.current = true;
    (async function() { if (!(await loadCache())) await fetchNews(); })();
  }, []);

  useEffect(function() {
    fetch("/api/stats").then(function(r) { return r.json(); }).then(function(d) { if (d.likes) setAllLikes(d.likes); if (d.visitors) { var el = document.getElementById("fn-visitors"); var wrap = document.getElementById("fn-visitors-wrap"); if (el) el.textContent = d.visitors; if (wrap) wrap.style.display = "inline"; } }).catch(function() {});
    var isNew = !localStorage.getItem("fn_visited");
    if (isNew) { fetch("/api/visitors", { method: "POST" }).catch(function() {}); try { localStorage.setItem("fn_visited", "1"); } catch(e) {} }
    fetch("/api/sofascore-data").then(function(r) { return r.json(); }).then(function(d) {
      if (d.matchStats) setMatchStats(d.matchStats);
      if (d.recentForm) setRecentForm(d.recentForm);
      if (d.prizeMoney && d.prizeMoney.amount) setPrizeMoney(d.prizeMoney.amount);
      if (d.ranking && d.ranking.ranking) setPlayer(function(prev) { return prev ? Object.assign({}, prev, { ranking: d.ranking.ranking }) : { ranking: d.ranking.ranking }; });
      if (d.season && d.season.wins !== undefined) setSeason(d.season);
      if (d.lastMatch && d.lastMatch.result) setLastMatch(d.lastMatch);
      if (d.nextMatch && d.nextMatch.date) setNextMatch(d.nextMatch);
      if (d.winProb) setWinProb(d.winProb);
    }).catch(function() {});
  }, []);

  var dn = news.length > 0 ? news : SAMPLE_NEWS;
  // When no nextMatch in KV, use next upcoming tournament from calendar as fallback
  var dm = nextMatch || (function() {
    var calendarEvents = [
      { tournament_category: "Masters 1000", tournament_name: "Monte Carlo Masters", surface: "Saibro", city: "Monte Carlo", country: "Mônaco", date: "2026-04-05T12:00:00Z" },
      { tournament_category: "Masters 1000", tournament_name: "Madrid Open", surface: "Saibro", city: "Madri", country: "Espanha", date: "2026-04-22T12:00:00Z" },
      { tournament_category: "Masters 1000", tournament_name: "Roma Masters", surface: "Saibro", city: "Roma", country: "Itália", date: "2026-05-06T12:00:00Z" },
      { tournament_category: "Grand Slam", tournament_name: "Roland Garros", surface: "Saibro", city: "Paris", country: "França", date: "2026-05-24T12:00:00Z" },
      { tournament_category: "Grand Slam", tournament_name: "Wimbledon", surface: "Grama", city: "Londres", country: "Reino Unido", date: "2026-06-29T12:00:00Z" },
      { tournament_category: "Grand Slam", tournament_name: "US Open", surface: "Duro", city: "Nova York", country: "EUA", date: "2026-08-31T12:00:00Z" },
    ];
    var now = new Date();
    var next = calendarEvents.find(function(e) { return new Date(e.date) > now; });
    return next || calendarEvents[0];
  })();
  var dl = lastMatch || null;
  var dp = player || (news.length === 0 ? SAMPLE_PLAYER : null);
  var ds = season || null;

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
              <p style={{ margin: "2px 0 0", fontSize: 10, color: DIM, fontFamily: SANS, whiteSpace: "nowrap" }}>Site de fãs{lastUpdate ? " · " + formatTimeAgo(lastUpdate) : ""}</p>
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

        {/* 1. AO VIVO ou PRÓXIMO DUELO */}
        {liveMatch ? (
          <>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: TEXT, fontFamily: SERIF, letterSpacing: "-0.02em", padding: "10px 0 6px" }}>Ao vivo</h2>
            <LiveScoreCard data={liveMatch} />
          </>
        ) : (
          <>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: TEXT, fontFamily: SERIF, letterSpacing: "-0.02em", padding: "10px 0 6px" }}>Próximo duelo</h2>
            <NextDuelCard match={dm} player={dp} />
          </>
        )}

        {/* 2. WIN PROB + PLAYER BLOCK */}
        <WinProbBar winProb={winProb} />
        <PlayerBlock
          lastMatch={dl}
          matchStats={matchStats}
          recentForm={recentForm}
          season={ds}
          prizeMoney={prizeMoney}
        />

        {/* 3. QUICK NAV — FIX 3: padding reduzido */}
        <section style={{ padding: "8px 0" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            <a href="/biografia" style={{ padding: "10px 6px", background: BG_ALT, border: "1px solid " + BORDER, borderRadius: 10, cursor: "pointer", textAlign: "center", textDecoration: "none", display: "block" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={SUB} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", margin: "0 auto 4px" }}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <span style={{ fontSize: 10, fontWeight: 600, color: TEXT, fontFamily: SANS }}>Biografia</span>
            </a>
            <button onClick={function(){setShowRanking(true);}} style={{ padding: "10px 6px", background: BG_ALT, border: "1px solid " + BORDER, borderRadius: 10, cursor: "pointer", textAlign: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={SUB} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", margin: "0 auto 4px" }}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              <span style={{ fontSize: 10, fontWeight: 600, color: TEXT, fontFamily: SANS }}>Ranking</span>
            </button>
            <button onClick={function(){setShowCalendar(true);}} style={{ padding: "10px 6px", background: BG_ALT, border: "1px solid " + BORDER, borderRadius: 10, cursor: "pointer", textAlign: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={SUB} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", margin: "0 auto 4px" }}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <span style={{ fontSize: 10, fontWeight: 600, color: TEXT, fontFamily: SANS }}>Calendário</span>
            </button>
          </div>
        </section>

        {/* 4. MORE MENU */}
        <section style={{ borderBottom: "1px solid " + BORDER }}>
          {!showMenu ? (
            <button onClick={function() { setShowMenu(true); }} style={{ width: "100%", padding: "6px 0", background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: DIM, fontFamily: SANS }}>Mais</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={DIM} strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
            </button>
          ) : (
            <>
              <div style={{ padding: "8px 0 0", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, animation: "fadeIn 0.2s ease" }}>
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
              <div style={{ paddingTop: 8, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                <a href="/regras" style={{ padding: "10px 6px", background: BG_ALT, border: "1px solid " + BORDER, borderRadius: 10, cursor: "pointer", textAlign: "center", textDecoration: "none", display: "block" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={SUB} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", margin: "0 auto 4px" }}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                  <span style={{ fontSize: 10, fontWeight: 600, color: TEXT, fontFamily: SANS }}>Regras</span>
                </a>
                <button onClick={function(){setShowFeedback(true);setShowMenu(false);}} style={{ padding: "10px 6px", background: BG_ALT, border: "1px solid " + BORDER, borderRadius: 10, cursor: "pointer", textAlign: "center" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={SUB} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", margin: "0 auto 4px" }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  <span style={{ fontSize: 10, fontWeight: 600, color: TEXT, fontFamily: SANS }}>Feedback</span>
                </button>
                <button onClick={function(){var m=document.querySelector('[data-pix-btn]');if(m)m.click();setShowMenu(false);}} style={{ padding: "10px 6px", background: BG_ALT, border: "1px solid " + BORDER, borderRadius: 10, cursor: "pointer", textAlign: "center" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={SUB} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", margin: "0 auto 4px" }}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                  <span style={{ fontSize: 10, fontWeight: 600, color: TEXT, fontFamily: SANS }}>Apoiar</span>
                </button>
              </div>
              <button onClick={function() { setShowMenu(false); }} style={{ width: "100%", padding: "10px 0", background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: DIM, fontFamily: SANS }}>Menos</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={DIM} strokeWidth="2.5"><polyline points="18 15 12 9 6 15" /></svg>
              </button>
            </>
          )}
        </section>

        {/* 5. NOTÍCIAS — FIX 2: spacing reduzido */}
        <section style={{ paddingTop: 4 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: TEXT, fontFamily: SERIF, letterSpacing: "-0.02em", padding: "6px 0 4px" }}>Notícias</h2>
          {loading && news.length === 0 && <Skeleton />}
          {dn.length > 0 && !(loading && news.length === 0) && (
            <>
              <div>{buildFeed(dn.slice(0, visibleCount), allLikes, dm)}</div>
              {visibleCount < dn.length && (
                <button onClick={function() { setVisibleCount(function(v) { return Math.min(v + 10, dn.length); }); }} style={{ width: "100%", padding: "14px", background: "transparent", border: "none", borderBottom: "1px solid " + BORDER, cursor: "pointer", fontSize: 13, fontWeight: 600, color: GREEN, fontFamily: SANS }}>
                  Carregar mais ({dn.length - visibleCount} restantes)
                </button>
              )}
            </>
          )}
        </section>

        {/* PARTNERS */}
        <section style={{ padding: "20px 0" }}>
          <p style={{ margin: "0 0 12px", fontSize: 11, fontWeight: 700, color: DIM, fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.06em" }}>Parceiros</p>
          <a href="mailto:thzgouvea@gmail.com?subject=Parceria Fonseca News" style={{ display: "block", borderRadius: 12, overflow: "hidden", border: "1px solid " + BORDER, textDecoration: "none" }}>
            <img src="/partner-banner-1.svg" alt="Fonseca News - Seja parceiro" style={{ width: "100%", height: "auto", display: "block" }} />
          </a>
          <p style={{ margin: "8px 0 0", fontSize: 9, color: DIM, fontFamily: SANS, textAlign: "center" }}>Quer ser parceiro? <a href="mailto:thzgouvea@gmail.com?subject=Parceria Fonseca News" style={{ color: GREEN, textDecoration: "none", fontWeight: 600 }}>Entre em contato</a></p>
        </section>

        {/* EXPLORE */}
        <section style={{ padding: "20px 0", borderTop: "1px solid " + BORDER }}>
          <p style={{ margin: "0 0 12px", fontSize: 11, fontWeight: 700, color: DIM, fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.06em" }}>Explore também</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { href: "/raquetes", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b8860b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>, bg: YELLOW + "10", title: "Venda sua raquete", sub: "Anuncie grátis na comunidade do Telegram" },
              { href: "/game", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 12h4M8 10v4M15 11h.01M18 13h.01"/></svg>, bg: "#7C3AED10", title: "Tennis Career 26", sub: "Simulador de carreira profissional" },
              { href: "https://www.youtube.com/results?search_query=João+Fonseca+tennis+highlights", target: "_blank", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={RED} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>, bg: RED + "10", title: "Momentos do João", sub: "Highlights e jogadas no YouTube" },
            ].map(function(item, i) {
              return (
                <a key={i} href={item.href} target={item.target} rel={item.target ? "noopener noreferrer" : undefined} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: BG_ALT, borderRadius: 12, textDecoration: "none", border: "1px solid " + BORDER }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: item.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{item.icon}</div>
                  <div><span style={{ fontSize: 13, fontWeight: 700, color: TEXT, fontFamily: SANS, display: "block" }}>{item.title}</span><span style={{ fontSize: 11, color: SUB, fontFamily: SANS }}>{item.sub}</span></div>
                </a>
              );
            })}
            <div onClick={function(){setShowInstallGuide(true);}} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: BG_ALT, borderRadius: 12, border: "1px solid " + BORDER, cursor: "pointer" }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "#0D172610", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0D1726" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12" y2="18"/></svg>
              </div>
              <div><span style={{ fontSize: 13, fontWeight: 700, color: TEXT, fontFamily: SANS, display: "block" }}>Transforme o FN em app</span><span style={{ fontSize: 11, color: SUB, fontFamily: SANS }}>Adicione à tela inicial — sem baixar nada</span></div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{ padding: "28px 0", borderTop: "1px solid " + BORDER, marginTop: 8 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 16 }}>
            {[
              { href: "https://www.instagram.com/joaoffonseca", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={SUB} strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5" fill={SUB} stroke="none"/></svg> },
              { href: "https://x.com/JFonsecaNews", icon: <svg width="13" height="13" viewBox="0 0 24 24" fill={SUB}><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
              { href: "mailto:thzgouvea@gmail.com", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={SUB} strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22 6 12 13 2 6"/></svg> },
            ].map(function(s, i) {
              return (<a key={i} href={s.href} target={s.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid " + BORDER, display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>{s.icon}</a>);
            })}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <span id="fn-visitors-wrap" style={{ fontSize: 11, color: DIM, fontFamily: SANS, display: "none" }}><span id="fn-visitors" style={{ fontWeight: 700, color: GREEN }}></span> visitantes</span>
          </div>
          <p style={{ fontSize: 9, color: DIM, fontFamily: SANS, lineHeight: 1.6, maxWidth: 340, margin: "0 auto", textAlign: "center" }}>Site independente de fãs · Sem vínculo com João Fonseca ou ATP · © 2026 Fonseca News</p>
        </footer>
      </main>

      {/* MODALS */}
      {showBio && (<Modal title="João Fonseca" subtitle="Tenista profissional 🇧🇷" onClose={function(){setShowBio(false);}}><div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>{[["🎂","21/08/2006"],["📍","Ipanema, Rio"],["📏","1,83m"],["🎾","Destro"],["👟","Profissional desde 2024"],["🏆","Melhor: #24"]].map(function(p,i){return(<span key={i} style={{fontSize:11,color:SUB,fontFamily:SANS,background:BG_ALT,padding:"4px 10px",borderRadius:8}}>{p[0]} {p[1]}</span>);})}</div><div style={{fontSize:14,color:SUB,fontFamily:SANS,lineHeight:1.75}}><p style={{marginBottom:12}}>Nascido em Ipanema, filho de Roberta e Christiano. Começou no tênis aos 4 anos no Country Club do Rio.</p><p style={{marginBottom:12}}>Em 2023, conquistou o US Open Juvenil e se tornou o primeiro brasileiro nº1 do ranking juvenil.</p><p style={{marginBottom:12}}>Profissional em 2024. Em janeiro de 2025, derrotou Rublev (top 10) na estreia do Australian Open.</p><p>Conquistou o ATP 250 de Buenos Aires e o ATP 500 de Basel — primeiro brasileiro a ganhar um ATP 500.</p></div></Modal>)}
      {showTitles && (<Modal title="🏆 Conquistas" onClose={function(){setShowTitles(false);}} maxWidth={460}><div style={{marginBottom:16}}><p style={{margin:"0 0 8px",fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em",color:GREEN,fontFamily:SANS}}>ATP Tour</p>{[{t:"ATP 500 Basel",d:"Out 2025",det:"vs Davidovich Fokina · 6-3 6-4",note:"1º brasileiro a ganhar ATP 500"},{t:"ATP 250 Buenos Aires",d:"Fev 2025",det:"vs Cerúndolo · 6-4 7-6(1)",note:"Brasileiro mais jovem a ganhar ATP"}].map(function(t,i){return(<div key={i} style={{padding:"10px 0",borderBottom:"1px solid #f0f0f0"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}><span style={{fontSize:14,fontWeight:700,color:TEXT,fontFamily:SERIF}}>{t.t}</span><span style={{fontSize:11,color:DIM,fontFamily:SANS}}>{t.d}</span></div><p style={{margin:0,fontSize:12,color:SUB,fontFamily:SANS}}>{t.det}</p>{t.note&&<p style={{margin:"4px 0 0",fontSize:11,color:GREEN,fontFamily:SANS,fontWeight:600}}>{t.note}</p>}</div>);})}</div></Modal>)}
      {showRanking && (<Modal title="📈 Evolução no Ranking" onClose={function(){setShowRanking(false);}} maxWidth={650}><RankingChart currentRanking={dp ? dp.ranking : 40} /></Modal>)}
      {showTimeline && (<Modal title="📅 Timeline" subtitle="De Ipanema ao Top 40" onClose={function(){setShowTimeline(false);}} maxWidth={500}><CareerTimeline /></Modal>)}
      {showNextGen && (<Modal title="⚡ Next Gen" subtitle="Os 4 maiores talentos sub-21" onClose={function(){setShowNextGen(false);}} maxWidth={650}><NextGenComparator /></Modal>)}
      {showCalendar && (<Modal title="🗓️ Calendário ATP 2026" onClose={function(){setShowCalendar(false);}} maxWidth={520}><ATPCalendar /></Modal>)}

      {showInstallGuide && (
        <Modal title="Instale o Fonseca News" subtitle="3 passos simples" onClose={function(){setShowInstallGuide(false);}} maxWidth={400}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[["1","Abra o menu do navegador","No Safari (iPhone): ícone de compartilhar (↑) · No Chrome (Android): três pontos (⋮)"],["2","Adicionar à Tela de Início","Role as opções até encontrar e toque"],["3","Confirme","Toque em Adicionar — pronto!"]].map(function(step, i) {
              return (<div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}><div style={{ width: 28, height: 28, borderRadius: "50%", background: GREEN, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0, fontFamily: SANS }}>{step[0]}</div><div><p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 700, color: TEXT, fontFamily: SANS }}>{step[1]}</p><p style={{ margin: 0, fontSize: 12, color: SUB, fontFamily: SANS, lineHeight: 1.5 }}>{step[2]}</p></div></div>);
            })}
          </div>
        </Modal>
      )}

      {showFeedback && (
        <Modal title="Feedback" subtitle="Sua opinião é importante" onClose={function(){setShowFeedback(false);}} maxWidth={420}>
          {!fbSent ? (
            <div>
              <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: DIM, fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.04em" }}>Como avalia o site?</p>
              <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                {[["😍","Incrível"],["😊","Bom"],["😐","Ok"],["😕","Pode melhorar"]].map(function(r) {
                  var isActive = fbRating === r[1];
                  return (<button key={r[1]} onClick={function() { setFbRating(r[1]); }} style={{ flex: 1, padding: "10px 4px", background: isActive ? GREEN + "10" : BG_ALT, border: "1.5px solid " + (isActive ? GREEN : BORDER), borderRadius: 10, cursor: "pointer", textAlign: "center" }}><span style={{ fontSize: 20, display: "block", marginBottom: 2 }}>{r[0]}</span><span style={{ fontSize: 9, color: isActive ? GREEN : DIM, fontFamily: SANS, fontWeight: 600 }}>{r[1]}</span></button>);
                })}
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: DIM, fontFamily: SANS, marginBottom: 4 }}>Seu nome (opcional)</label>
                <input type="text" value={fbName} onChange={function(e) { setFbName(e.target.value); }} placeholder="Como quer ser chamado?" style={{ width: "100%", padding: "10px 12px", border: "1.5px solid " + BORDER, borderRadius: 8, fontSize: 13, fontFamily: SANS, color: TEXT, background: "#fff", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: DIM, fontFamily: SANS, marginBottom: 4 }}>Mensagem *</label>
                <textarea value={fbMsg} onChange={function(e) { setFbMsg(e.target.value); }} placeholder="Elogios, críticas, sugestões..." rows="4" style={{ width: "100%", padding: "10px 12px", border: "1.5px solid " + BORDER, borderRadius: 8, fontSize: 13, fontFamily: SANS, color: TEXT, background: "#fff", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
              </div>
              <button onClick={function() {
                if (!fbMsg.trim() || fbMsg.trim().length < 3) return;
                fetch("/api/feedback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: fbName || "Anônimo", message: fbMsg, rating: fbRating }) }).then(function() { setFbSent(true); }).catch(function() { setFbSent(true); });
              }} disabled={fbMsg.trim().length < 3} style={{ width: "100%", padding: "12px", background: fbMsg.trim().length >= 3 ? GREEN : DIM, color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: fbMsg.trim().length >= 3 ? "pointer" : "default", fontFamily: SANS, opacity: fbMsg.trim().length >= 3 ? 1 : 0.5 }}>Enviar</button>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <span style={{ fontSize: 48, display: "block", marginBottom: 12 }}>💚</span>
              <h3 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 800, color: TEXT, fontFamily: SERIF }}>Obrigado!</h3>
              <p style={{ margin: "0 0 16px", fontSize: 13, color: SUB, fontFamily: SANS }}>Cada mensagem é lida pessoalmente.</p>
              <button onClick={function() { setShowFeedback(false); setFbSent(false); setFbMsg(""); setFbName(""); setFbRating(null); }} style={{ padding: "10px 20px", background: GREEN, color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: SANS }}>Fechar</button>
            </div>
          )}
        </Modal>
      )}

      <PixDonation />
    </div>
  );
}
