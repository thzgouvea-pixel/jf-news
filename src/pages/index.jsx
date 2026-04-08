// Fonseca News — Clean Redesign v2 (corrigido + 5 fixes)
import { useState, useEffect, useRef } from "react";
import Head from "next/head";

const GREEN = "#00A859";
const YELLOW = "#FFCB05";
const BG_ALT = "#F7F8F9";
const TEXT = "#1a1a1a";
const SUB = "#6b6b6b";
const DIM = "#a0a0a0";
const BORDER = "#e8e8e8";
const RED = "#c0392b";
const SERIF = "'Source Serif 4', Georgia, serif";
const SANS = "'Inter', -apple-system, sans-serif";

const CACHE_DURATION_MS = 30 * 60 * 1000;
const surfaceColorMap = { "Saibro": "#E8734A", "Clay": "#E8734A", "Hard": "#3B82F6", "Dura": "#3B82F6", "Grama": "#22C55E", "Grass": "#22C55E" };

// ===== PLAYER DATABASE — unified map (ATP slug, ESPN ID, SofaScore ID) =====
var PLAYER_DB = {
  "Alcaraz": { slug: "a0e2", espn: "4686", sofa: 856498 },
  "Sinner": { slug: "s0ag", espn: "4375", sofa: 333849 },
  "Djokovic": { slug: "d643", espn: "777", sofa: 12708 },
  "Medvedev": { slug: "mm58", espn: "3367", sofa: 196065 },
  "Zverev": { slug: "z355", espn: "3098", sofa: 197075 },
  "Rublev": { slug: "re44", espn: "3523", sofa: 197592 },
  "Ruud": { slug: "rh16", espn: null, sofa: null },
  "Tsitsipas": { slug: "te51", espn: null, sofa: null },
  "Fritz": { slug: "fb98", espn: "2981", sofa: 163713 },
  "Rune": { slug: "r0dg", espn: "4685", sofa: null },
  "Hurkacz": { slug: "hb71", espn: "3264", sofa: 203766 },
  "Khachanov": { slug: "ke29", espn: "3112", sofa: null },
  "Berrettini": { slug: "bk40", espn: "3316", sofa: 205641 },
  "Diallo": { slug: "d0f6", espn: "3885", sofa: 280151 },
  "Shelton": { slug: "s0jy", espn: "11712", sofa: 963814 },
  "Draper": { slug: "d0bi", espn: "4580", sofa: 366258 },
  "Tiafoe": { slug: "td51", espn: "3263", sofa: 235141 },
  "Musetti": { slug: "m0ej", espn: "4228", sofa: 367702 },
  "Fils": { slug: "f0gx", espn: "11716", sofa: 963839 },
  "Cerundolo": { slug: "c0aq", espn: "11689", sofa: 829780 },
  "Davidovich Fokina": { slug: "d0au", espn: "4579", sofa: 367748 },
  "Auger-Aliassime": { slug: "ag37", espn: "3270", sofa: 230882 },
  "de Minaur": { slug: "dh58", espn: "3313", sofa: 226413 },
  "Paul": { slug: "pl56", espn: "3117", sofa: 189458 },
  "Tabilo": { slug: "t0ag", espn: "4684", sofa: 367700 },
  "Machac": { slug: "m0eo", espn: "11709", sofa: 828775 },
  "Mpetshi Perricard": { slug: "m0je", espn: "11747", sofa: null },
  "Mensik": { slug: "m0ij", espn: "11746", sofa: 979825 },
  "Shapovalov": { slug: "su55", espn: "3086", sofa: 202233 },
  "Munar": { slug: "mf53", espn: "4229", sofa: 252456 },
  "Rinderknech": { slug: "rc91", espn: "3511", sofa: 136498 },
  "Fonseca": { slug: "f0fv", espn: "11745", sofa: null },
  "Nakashima": { slug: "n0ae", espn: "4581", sofa: 829749 },
  "Baez": { slug: "b0dx", espn: "11690", sofa: 830192 },
  "Etcheverry": { slug: "e0gd", espn: "11700", sofa: 953250 },
  "Jarry": { slug: "j0ag", espn: "3539", sofa: 135133 },
  "Bublik": { slug: "b0bk", espn: "3540", sofa: 227296 },
  "Kokkinakis": { slug: "k0ad", espn: "3124", sofa: null },
  "Korda": { slug: "k0ah", espn: "4578", sofa: 367699 },
  "Norrie": { slug: "n0ab", espn: "3266", sofa: null },
  "Dimitrov": { slug: "d875", espn: "1629", sofa: 26696 },
  "Monfils": { slug: "m788", espn: "716", sofa: 14640 },
  "Wawrinka": { slug: "w367", espn: "536", sofa: null },
  "Nishikori": { slug: "n552", espn: "1058", sofa: null },
  "Coric": { slug: "c0ag", espn: "2435", sofa: null },
  "Popyrin": { slug: "p0dj", espn: "3541", sofa: null },
  "Thompson": { slug: "t0aj", espn: "3099", sofa: null },
  "Giron": { slug: "g0ah", espn: "3116", sofa: null },
  "Kotov": { slug: null, espn: "11706", sofa: null },
  "Safiullin": { slug: null, espn: "11714", sofa: null },
};

var findPlayer = function(name) {
  if (!name) return null;
  for (var k in PLAYER_DB) { if (name.indexOf(k) !== -1) return { key: k, data: PLAYER_DB[k] }; }
  return null;
};

var getATPImage = function(name) {
  var p = findPlayer(name);
  return (p && p.data.slug) ? "https://www.atptour.com/-/media/alias/player-headshot/" + p.data.slug : null;
};

var getESPNImage = function(name) {
  var p = findPlayer(name);
  return (p && p.data.espn) ? "https://a.espncdn.com/combiner/i?img=/i/headshots/tennis/players/full/" + p.data.espn + ".png&w=200&h=145" : null;
};

var getSofaScoreImage = function(name, sofascoreId) {
  var p = findPlayer(name);
  var id = (p && p.data.sofa) ? p.data.sofa : sofascoreId;
  return id ? "https://api.sofascore.app/api/v1/player/" + id + "/image" : null;
};

const FONSECA_IMG = "https://www.atptour.com/-/media/alias/player-headshot/f0fv";
const FONSECA_IMG_FALLBACK = "https://a.espncdn.com/combiner/i?img=/i/headshots/tennis/players/full/11745.png&w=200&h=145";

var SAMPLE_PLAYER = { ranking: 40, rankingChange: "+4" };
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

var countryFlags = { "Spain": "🇪🇸", "France": "🇫🇷", "Italy": "🇮🇹", "USA": "🇺🇸", "United States": "🇺🇸", "Germany": "🇩🇪", "UK": "🇬🇧", "United Kingdom": "🇬🇧", "Australia": "🇦🇺", "Argentina": "🇦🇷", "Serbia": "🇷🇸", "Russia": "🇷🇺", "Greece": "🇬🇷", "Canada": "🇨🇦", "Norway": "🇳🇴", "Denmark": "🇩🇰", "Poland": "🇵🇱", "Chile": "🇨🇱", "Japan": "🇯🇵", "China": "🇨🇳", "Czech Republic": "🇨🇿", "Czechia": "🇨🇿", "Bulgaria": "🇧🇬", "Belgium": "🇧🇪", "Netherlands": "🇳🇱", "Switzerland": "🇨🇭", "Croatia": "🇭🇷", "Brazil": "🇧🇷", "Portugal": "🇵🇹", "Colombia": "🇨🇴", "Mexico": "🇲🇽", "Peru": "🇵🇪", "South Korea": "🇰🇷", "Taiwan": "🇹🇼", "Austria": "🇦🇹", "Hungary": "🇭🇺", "Romania": "🇷🇴", "Sweden": "🇸🇪", "Finland": "🇫🇮", "Kazakhstan": "🇰🇿", "Georgia": "🇬🇪", "Tunisia": "🇹🇳", "Monaco": "🇲🇨", "Mônaco": "🇲🇨" };

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

// ===== ATP RANKING LIST — Top 50 live =====
var ATPRankingList = function(props) {
  var currentRanking = props.currentRanking || 40;
  var _r = useState(null); var rankings = _r[0]; var setRankings = _r[1];
  var _l = useState(true); var loading = _l[0]; var setLoading = _l[1];
  useEffect(function() {
    fetch("/api/rankings").then(function(r) { return r.json(); }).then(function(d) {
      if (d && d.rankings && d.rankings.length > 0) setRankings(d);
      setLoading(false);
    }).catch(function() { setLoading(false); });
  }, []);
  if (loading) return <div style={{ padding: "40px 0", textAlign: "center" }}><span style={{ fontSize: 12, color: DIM, fontFamily: SANS }}>Carregando ranking...</span></div>;
  if (!rankings || !rankings.rankings || rankings.rankings.length === 0) return <div style={{ padding: "20px 0", textAlign: "center" }}><span style={{ fontSize: 12, color: DIM, fontFamily: SANS }}>Ranking indisponível. Aguarde a próxima atualização.</span></div>;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, padding: "0 4px" }}>
        <span style={{ fontSize: 11, color: DIM, fontFamily: SANS }}>Top 50 · ATP Singles</span>
        {rankings.updatedAt && <span style={{ fontSize: 10, color: DIM, fontFamily: SANS }}>{formatTimeAgo(rankings.updatedAt)}</span>}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {rankings.rankings.map(function(r, i) {
          var isFonseca = (r.name || "").toLowerCase().includes("fonseca") || r.rank === currentRanking;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: isFonseca ? GREEN + "0A" : (i % 2 === 0 ? "transparent" : BG_ALT), borderRadius: isFonseca ? 10 : 0, border: isFonseca ? "1.5px solid " + GREEN + "30" : "none", borderBottom: isFonseca ? "none" : "1px solid " + BORDER + "80" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: isFonseca ? GREEN : DIM, fontFamily: SANS, width: 28, textAlign: "right", flexShrink: 0 }}>{r.rank}</span>
              <span style={{ fontSize: 13, fontWeight: isFonseca ? 700 : 500, color: isFonseca ? GREEN : TEXT, fontFamily: SANS, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</span>
              {r.points && <span style={{ fontSize: 11, color: DIM, fontFamily: SANS, flexShrink: 0 }}>{r.points} pts</span>}
            </div>
          );
        })}
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
    { q: "O João vai vencer o próximo jogo?", a: "Sim!", b: "Não" },
    { q: "O João chega ao Top 30 até o fim de 2026?", a: "Com certeza!", b: "Difícil" },
    { q: "O João vai conquistar um Masters 1000 na carreira?", a: "Vai sim!", b: "Acho que não" },
    { q: "Quem vai ter a melhor carreira?", a: "João 🇧🇷", b: "Tien 🇺🇸" },
    { q: "O João chega às quartas de final em Roland Garros?", a: "Chega sim!", b: "Ainda é cedo" },
    { q: "O João entra no Top 10 até 2027?", a: "Com certeza!", b: "Precisa de tempo" },
    { q: "Quem é mais talentoso aos 19 anos?", a: "João 🇧🇷", b: "Alcaraz 🇪🇸" },
    { q: "O João chega ao Top 5 antes dos 21 anos?", a: "Sem dúvida!", b: "É muito cedo" },
    { q: "O João vai ganhar um Grand Slam na carreira?", a: "Vai sim!", b: "Não acredito" },
    { q: "Qual a melhor superfície do João?", a: "Saibro", b: "Piso duro" },
    { q: "O João seria top 10 se fosse espanhol?", a: "Já seria!", b: "Não muda nada" },
    { q: "O forehand do João é o melhor da NextGen?", a: "Sem dúvida!", b: "Tem melhores" },
    { q: "O João vai ser nº1 do mundo algum dia?", a: "Vai sim!", b: "É sonhar demais" },
    { q: "Quem tem o melhor saque da NextGen?", a: "João 🇧🇷", b: "Mensik 🇨🇿" },
    { q: "O João deve jogar mais torneios de saibro?", a: "Sim, é sua força", b: "Precisa variar" },
    { q: "O João vai superar o Guga em conquistas?", a: "Com certeza!", b: "Guga é lenda" },
    { q: "O melhor jogo do João até agora foi vs Rublev no AO?", a: "Foi sim!", b: "Tem outros" },
    { q: "O João deveria focar em simples ou jogar duplas também?", a: "Só simples", b: "Duplas ajuda" },
    { q: "Quem chega primeiro ao Top 10?", a: "João 🇧🇷", b: "Fils 🇫🇷" },
    { q: "O João faz semifinal de Grand Slam em 2026?", a: "Faz sim!", b: "Ainda não" },
    { q: "O tênis brasileiro vive sua melhor fase?", a: "Com certeza!", b: "Guga era melhor" },
    { q: "O João deve mudar de treinador?", a: "Não, está bem", b: "Precisa evoluir" },
    { q: "O mental do João é seu maior diferencial?", a: "Sem dúvida!", b: "É o forehand" },
    { q: "O João vai liderar o Brasil na Copa Davis?", a: "Já lidera!", b: "Precisa de mais" },
    { q: "Qual Grand Slam o João vai ganhar primeiro?", a: "Roland Garros", b: "US Open" },
    { q: "O João termina 2026 no Top 20?", a: "Com certeza!", b: "Top 30 já é bom" },
    { q: "Quem é a maior promessa do tênis mundial?", a: "João 🇧🇷", b: "Draper 🇬🇧" },
    { q: "O João deve jogar o Rio Open todo ano?", a: "Sempre!", b: "Só quando fizer sentido" },
  ];
  var dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
  var poll = polls[dayOfYear % polls.length];
  useEffect(function() {
    // Load real vote results on mount
    fetch("/api/vote").then(function(r) { return r.json(); }).then(function(d) { if (d && d.total > 0) { setResults({ a: d.pctA, b: d.pctB, total: d.total }); } }).catch(function() {});
  }, []);
  var handleVote = function(choice) {
    if (vote) return;
    setVote(choice);
    try { localStorage.setItem(pollKey, choice); } catch(e) {}
    fetch("/api/vote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ option: choice }) }).then(function(r) { return r.json(); }).then(function(d) { if (d && d.total > 0) { setResults({ a: d.pctA, b: d.pctB, total: d.total }); } }).catch(function() { setResults(choice === "a" ? { a: 62, b: 38, total: 1 } : { a: 45, b: 55, total: 1 }); });
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
          <p style={{ margin: "8px 0 0", fontSize: 10, color: DIM, fontFamily: SANS, textAlign: "center" }}>{results && results.total ? results.total + (results.total === 1 ? " voto" : " votos") + " · " : ""}Nova enquete amanhã</p>
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
    { date: "Fev 2026", title: "Duplas no Rio Open", desc: "Título de duplas em casa", emoji: "🤝", color: "#3B82F6" },
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
  var _qc = useState(null); var quizCount = _qc[0]; var setQuizCount = _qc[1];
  useEffect(function() {
    fetch("/api/quiz-count").then(function(r) { return r.json(); }).then(function(d) { if (d && typeof d.count === "number") setQuizCount(d.count); }).catch(function() {});
  }, []);
  var allQuestions = [
    { q: "Em que bairro do Rio de Janeiro o João nasceu?", opts: ["Copacabana", "Ipanema", "Leblon", "Barra da Tijuca"], answer: 1, points: 10, fun: "Ele cresceu a 10 minutos do local do Rio Open!" },
    { q: "Qual Grand Slam juvenil o João conquistou em 2023?", opts: ["Australian Open", "Roland Garros", "Wimbledon", "US Open"], answer: 3, points: 10, fun: "Derrotou Learner Tien na final!" },
    { q: "Quem o João derrotou na estreia do Australian Open 2025?", opts: ["Djokovic", "Alcaraz", "Rublev", "Medvedev"], answer: 2, points: 15, fun: "Primeiro adolescente a derrotar um top 10 em 1ª rodada de Grand Slam desde 2002!" },
    { q: "Em qual cidade o João conquistou seu primeiro título ATP?", opts: ["Basel", "Rio de Janeiro", "Buenos Aires", "Santiago"], answer: 2, points: 10, fun: "Brasileiro mais jovem a conquistar um título ATP!" },
    { q: "Qual torneio o João venceu invicto com 5 vitórias em 2024?", opts: ["ATP Finals", "NextGen ATP Finals", "Copa Davis", "Laver Cup"], answer: 1, points: 15, fun: "Primeiro sul-americano campeão do NextGen Finals!" },
    { q: "Em qual cidade o João conquistou seu primeiro ATP 500?", opts: ["Viena", "Hamburgo", "Basel", "Barcelona"], answer: 2, points: 15, fun: "Primeiro brasileiro a ganhar um ATP 500!" },
    { q: "Com que idade o João se tornou profissional?", opts: ["15 anos", "16 anos", "17 anos", "18 anos"], answer: 2, points: 10, fun: "Ele recusou uma bolsa milionária de universidade americana!" },
    { q: "Qual o recorde de vitórias do João no circuito juvenil?", opts: ["72-27", "82-27", "92-27", "102-27"], answer: 2, points: 10, fun: "Foi o 1º brasileiro nº1 do ranking juvenil!" },
    { q: "Em qual clube do Rio o João começou a jogar tênis?", opts: ["Flamengo", "Country Club", "Caiçaras", "Paissandu"], answer: 1, points: 10, fun: "O clube fica a poucos metros da casa onde ele cresceu!" },
    { q: "Quem o João derrotou na final do seu primeiro título ATP?", opts: ["Baez", "Cerúndolo", "Etcheverry", "Jarry"], answer: 1, points: 15, fun: "Venceu o argentino em Buenos Aires, na casa dele!" },
    { q: "Qual marca de raquete o João usa?", opts: ["Wilson", "Babolat", "Head", "Yonex"], answer: 3, points: 10, fun: "Ele usa a mesma marca que Djokovic!" },
    { q: "Em que ano o João alcançou o nº1 do ranking juvenil?", opts: ["2021", "2022", "2023", "2024"], answer: 2, points: 10, fun: "Com apenas 17 anos, antes de virar profissional!" },
  ];
  var _shuf = useState(function() { var arr = allQuestions.slice(); for (var i = arr.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp; } return arr; });
  var questions = _shuf[0];
  var totalPoints = questions.reduce(function(sum, q) { return sum + q.points; }, 0);
  var handleAnswer = function(idx) { if (revealed) return; setSelected(idx); setRevealed(true); if (idx === questions[currentQ].answer) setScore(score + questions[currentQ].points); };
  var handleNext = function() {
    if (currentQ < questions.length - 1) { setCurrentQ(currentQ + 1); setSelected(null); setRevealed(false); }
    else {
      setDone(true);
      // Register quiz completion
      fetch("/api/quiz-count", { method: "POST" }).then(function(r) { return r.json(); }).then(function(d) { if (d && typeof d.count === "number") setQuizCount(d.count); }).catch(function() {});
    }
  };
  var getResultMsg = function() { var pct = Math.round((score / totalPoints) * 100); if (pct === 100) return { emoji: "🏆", msg: "Perfeito! Verdadeiro fã!" }; if (pct >= 80) return { emoji: "🔥", msg: "Impressionante!" }; if (pct >= 60) return { emoji: "🎾", msg: "Bom, você acompanha!" }; return { emoji: "📚", msg: "Continue acompanhando!" }; };
  if (!started) return (
    <div style={{ background: BG_ALT, borderRadius: 10, padding: "18px 16px", margin: "4px 0", cursor: "pointer", border: "1px solid " + BORDER }} onClick={function() { setStarted(true); }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <span style={{ fontSize: 8, fontWeight: 700, color: "#fff", fontFamily: SANS, background: "#b8860b", padding: "2px 6px", borderRadius: 999, textTransform: "uppercase", letterSpacing: "0.06em" }}>Quiz</span>
      </div>
      <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: TEXT, fontFamily: SERIF }}>Quanto você conhece o João?</p>
      <p style={{ margin: "0 0 12px", fontSize: 11, color: SUB, fontFamily: SANS }}>{questions.length} perguntas · {totalPoints} pontos{quizCount ? " · " + quizCount + " já jogaram" : ""}</p>
      <div style={{ background: GREEN, padding: "9px 20px", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 700, fontFamily: SANS, textAlign: "center" }}>Jogar</div>
    </div>
  );
  if (done) {
    var result = getResultMsg();
    return (
      <div style={{ background: BG_ALT, borderRadius: 10, padding: "18px 16px", margin: "4px 0", textAlign: "center", border: "1px solid " + BORDER }}>
        <span style={{ fontSize: 40 }}>{result.emoji}</span>
        <h3 style={{ margin: "8px 0 4px", fontSize: 20, fontWeight: 800, color: TEXT, fontFamily: SERIF }}>{score}/{totalPoints} pontos</h3>
        <p style={{ margin: "0 0 4px", fontSize: 13, color: SUB, fontFamily: SANS }}>{result.msg}</p>
        {quizCount && <p style={{ margin: "0 0 12px", fontSize: 10, color: DIM, fontFamily: SANS }}>{quizCount} pessoas já jogaram o quiz</p>}
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
  if (now > matchDate) return null; // hide after match starts
  var oppName = match.opponent_name || "A definir";
  var oppShort = oppName.length > 12 ? oppName.split(" ").pop() : oppName;
  var matchId = (match.event_id || match.tournament_name || "match").toString().replace(/[^a-zA-Z0-9]/g, "_");
  var _p = useState(function() { try { return localStorage.getItem("fn_pred_" + matchId); } catch(e) { return null; } });
  var prediction = _p[0]; var setPrediction = _p[1];
  var _res = useState(null); var predResults = _res[0]; var setPredResults = _res[1];
  useEffect(function() {
    fetch("/api/predict?matchId=" + matchId).then(function(r) { return r.json(); }).then(function(d) { if (d && d.total > 0) setPredResults(d); }).catch(function() {});
  }, []);
  var options = [
    { label: "Fonseca 2x0", score: "fonseca_2x0", winner: "joao" },
    { label: "Fonseca 2x1", score: "fonseca_2x1", winner: "joao" },
    { label: oppShort + " 2x1", score: "opp_2x1", winner: "opp" },
    { label: oppShort + " 2x0", score: "opp_2x0", winner: "opp" },
  ];
  var handlePredict = function(opt) {
    if (prediction) return;
    setPrediction(opt.score);
    try { localStorage.setItem("fn_pred_" + matchId, opt.score); } catch(e) {}
    fetch("/api/predict", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ score: opt.score, matchId: matchId }) })
      .then(function(r) { return r.json(); })
      .then(function(d) { if (d && d.total > 0) setPredResults(d); })
      .catch(function() {});
  };
  return (
    <div style={{ background: BG_ALT, borderRadius: 10, padding: "18px 16px", margin: "4px 0", border: "1px solid " + BORDER }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <span style={{ fontSize: 8, fontWeight: 700, color: "#fff", fontFamily: SANS, background: "#7C3AED", padding: "2px 6px", borderRadius: 999, textTransform: "uppercase", letterSpacing: "0.06em" }}>Palpite</span>
      </div>
      {!prediction ? (
        <>
          <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: TEXT, fontFamily: SERIF }}>Qual será o placar?</p>
          <p style={{ margin: "0 0 10px", fontSize: 11, color: SUB, fontFamily: SANS }}>Fonseca vs {oppName}{match.round ? " · " + match.round : ""}{predResults && predResults.total ? " · " + predResults.total + " palpites" : ""}</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {options.map(function(opt) { var isJ = opt.winner === "joao"; return (<button key={opt.score} onClick={function() { handlePredict(opt); }} style={{ padding: "7px 4px", background: isJ ? "rgba(0,168,89,0.08)" : "rgba(192,57,43,0.08)", border: "1px solid " + (isJ ? "rgba(0,168,89,0.2)" : "rgba(192,57,43,0.2)"), borderRadius: 8, cursor: "pointer", textAlign: "center" }}><span style={{ fontSize: 13, fontWeight: 700, color: isJ ? GREEN : RED, fontFamily: SANS, display: "block" }}>{opt.score.includes("2x0") ? "2x0" : "2x1"}</span><span style={{ fontSize: 9, color: DIM, fontFamily: SANS }}>{isJ ? "Fonseca" : oppShort}</span></button>); })}
          </div>
        </>
      ) : (
        <div>
          <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: TEXT, fontFamily: SERIF }}>Palpites da comunidade</p>
          {options.map(function(opt) {
            var pct = predResults && predResults.predictions && predResults.predictions[opt.score] ? predResults.predictions[opt.score].pct : 0;
            var isSelected = prediction === opt.score;
            var isJ = opt.winner === "joao";
            return (
              <div key={opt.score} style={{ marginBottom: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 11, fontWeight: isSelected ? 700 : 500, color: isSelected ? (isJ ? GREEN : RED) : SUB, fontFamily: SANS }}>{opt.label}{isSelected ? " ✓" : ""}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: DIM, fontFamily: SANS }}>{pct}%</span>
                </div>
                <div style={{ height: 4, background: "#e8e8e8", borderRadius: 2 }}><div style={{ height: 4, background: isJ ? GREEN : RED, borderRadius: 2, width: Math.max(pct, 2) + "%", opacity: isSelected ? 1 : 0.4, transition: "width 0.6s ease" }} /></div>
              </div>
            );
          })}
          {predResults && predResults.total && <p style={{ margin: "6px 0 0", fontSize: 10, color: DIM, fontFamily: SANS, textAlign: "center" }}>{predResults.total} palpites</p>}
        </div>
      )}
    </div>
  );
};

// ===== TOURNAMENT FACTS CAROUSEL =====
var TournamentFactsCarousel = function(props) {
  var facts = props.facts || [];
  var tournamentName = props.tournamentName || "";
  var surface = props.surface || "";
  var surfaceColor = surfaceColorMap[surface] || "#E8734A";
  var _idx = useState(0); var activeIdx = _idx[0]; var setActiveIdx = _idx[1];
  var _fade = useState(true); var visible = _fade[0]; var setVisible = _fade[1];
  var _paused = useState(false); var paused = _paused[0]; var setPaused = _paused[1];
  var touchStartX = useRef(0);

  var cleanFacts = facts.map(function(f) {
    var t = (f.text || "").replace(/\[\[([^\]|]*\|)?([^\]]*)\]\]/g, "$2").replace(/\{\{[^}]*\}\}/g, "").replace(/'{2,}/g, "").trim();
    t = t.replace(/Clay court/gi, "Saibro").replace(/Hard court/gi, "Piso duro").replace(/Grass court/gi, "Grama");
    return { text: t };
  });

  if (cleanFacts.length === 0) return null;

  useEffect(function() {
    if (paused || cleanFacts.length <= 1) return;
    var iv = setInterval(function() {
      setVisible(false);
      setTimeout(function() {
        setActiveIdx(function(prev) { return (prev + 1) % cleanFacts.length; });
        setVisible(true);
      }, 350);
    }, 5000);
    return function() { clearInterval(iv); };
  }, [paused, cleanFacts.length]);

  var goTo = function(i) {
    if (i === activeIdx) return;
    setVisible(false);
    setTimeout(function() { setActiveIdx(i); setVisible(true); }, 250);
    setPaused(true);
    setTimeout(function() { setPaused(false); }, 10000);
  };

  var handleTouchStart = function(e) { touchStartX.current = e.touches[0].clientX; };
  var handleTouchEnd = function(e) {
    var diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) goTo((activeIdx + 1) % cleanFacts.length);
      else goTo((activeIdx - 1 + cleanFacts.length) % cleanFacts.length);
    }
  };

  var fact = cleanFacts[activeIdx];
  var shortName = (tournamentName || "").split(",")[0].trim();

  return (
    <section style={{ padding: "4px 0 0" }}>
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          background: "linear-gradient(160deg, #0a1220 0%, #111d33 50%, #0d1828 100%)",
          borderRadius: 14,
          padding: "12px 18px 10px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 6 }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.25)", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.06em" }}>Curiosidades · {shortName}</span>
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.12)", fontFamily: SANS }}>{(activeIdx + 1) + "/" + cleanFacts.length}</span>
        </div>

        <div style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateX(0)" : "translateX(8px)",
          transition: "opacity 0.35s ease, transform 0.35s ease",
          overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", textAlign: "center",
        }}>
          <span key={activeIdx} ref={function(el) {
            if (el) {
              el.style.fontSize = "13px";
              if (el.scrollWidth > el.parentElement.clientWidth) {
                var size = 13;
                while (size > 8 && el.scrollWidth > el.parentElement.clientWidth) {
                  size -= 0.5;
                  el.style.fontSize = size + "px";
                }
              }
            }
          }} style={{
            fontSize: 13, fontWeight: 500, color: "#4FC3F7",
            fontFamily: SANS, lineHeight: 1.4, whiteSpace: "nowrap",
          }}>{fact.text}</span>
        </div>

        {/* Dots */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, marginTop: 8 }}>
          {cleanFacts.map(function(_, i) {
            var isActive = i === activeIdx;
            return (
              <button
                key={i}
                onClick={function() { goTo(i); }}
                style={{
                  width: isActive ? 16 : 5, height: 5,
                  borderRadius: 3,
                  background: isActive ? "#4FC3F7" : "rgba(255,255,255,0.12)",
                  border: "none", padding: 0, cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              />
            );
          })}
        </div>

        {/* Progress bar */}
        {!paused && cleanFacts.length > 1 && (
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: "rgba(255,255,255,0.03)" }}>
            <div style={{ height: 2, background: "#4FC3F730", borderRadius: 1, animation: "factProgress 5s linear infinite" }} />
          </div>
        )}
      </div>
    </section>
  );
};

// ===== NEXT DUEL CARD — v4 (usando PLAYER_DB unificado) =====
var NextDuelCard = function(props) {
  var match = props.match; var player = props.player;
  var onOppClick = props.onOppClick;
  var winProb = props.winProb;
  var onPushClick = props.onPushClick;
  var pushEnabled = props.pushEnabled;
  var pushLoading = props.pushLoading;
  var oppProfile = props.oppProfile;
  var liveData = props.liveData || null;
  var countdown = useCountdown(match ? match.date : null);
  if (!match) return null;

  var isLive = liveData && liveData.live;

  var oppName = isLive ? (liveData.opponent && liveData.opponent.name || match.opponent_name || "A definir") : (match.opponent_name || "A definir");
  var oppRanking = match.opponent_ranking || (oppProfile && oppProfile.ranking ? oppProfile.ranking : null);
  var oppCountry = match.opponent_country || (oppProfile && oppProfile.country ? oppProfile.country : "");
  var oppFlag = countryFlags[oppCountry] || "";
  var oppAtpSlug = match.opponent_atp_slug || null;
  if (!oppAtpSlug) { var fp = findPlayer(oppName); if (fp && fp.data.slug) oppAtpSlug = fp.data.slug; }

  var oppImg = getATPImage(oppName);
  var oppImgFallback = getESPNImage(oppName);

  var sc = surfaceColorMap[match.surface] || "#999";
  var surfaceTranslate = { "Clay": "Saibro", "Hard": "Duro", "Grass": "Grama", "Clay court": "Saibro", "Hard court": "Duro", "Saibro": "Saibro", "Duro": "Duro", "Grama": "Grama" };
  var surfaceLabel = surfaceTranslate[match.surface] || match.surface || "";

  var fPct = winProb && winProb.fonseca ? Math.round(winProb.fonseca) : null;
  var oPct = winProb && winProb.opponent ? Math.round(winProb.opponent) : null;

  if (fPct === null && player && player.ranking && oppRanking) {
    var fRank = player.ranking;
    var oRank = oppRanking;
    var rankDiff = oRank - fRank;
    var exponent = -rankDiff / 16;
    var fProb = 1 / (1 + Math.pow(10, exponent));
    fProb = Math.min(0.92, Math.max(0.08, fProb + 0.03));
    fPct = Math.round(fProb * 100);
    oPct = 100 - fPct;
  }

  var dateInfo = match.date ? (function() {
    var d = new Date(match.date);
    var h = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
    var diaSemana = d.toLocaleDateString("pt-BR", { weekday: "long", timeZone: "America/Sao_Paulo" });
    var diaNum = d.toLocaleDateString("pt-BR", { day: "numeric", month: "long", timeZone: "America/Sao_Paulo" });
    return { weekday: diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1), date: diaNum, time: h };
  })() : null;

  var downloadICS = function() {
    if (!match.date) return;
    var d = new Date(match.date);
    var pad = function(n) { return String(n).padStart(2, "0"); };
    var formatICS = function(dt) { return dt.getUTCFullYear() + pad(dt.getUTCMonth()+1) + pad(dt.getUTCDate()) + "T" + pad(dt.getUTCHours()) + pad(dt.getUTCMinutes()) + "00Z"; };
    var endDate = new Date(d.getTime() + 3 * 60 * 60 * 1000);
    var title = "J. Fonseca vs " + oppName + " — " + (match.tournament_name || "ATP");
    var location = (match.tournament_name || "") + (match.city ? ", " + match.city : "");
    var description = (match.tournament_category || "") + (match.round ? " · " + match.round : "") + "\\nESPN 2 · Disney+\\nfonsecanews.com.br";
    var ics = ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//FonsecaNews//PT","BEGIN:VEVENT","DTSTART:" + formatICS(d),"DTEND:" + formatICS(endDate),"SUMMARY:" + title,"LOCATION:" + location,"DESCRIPTION:" + description,"BEGIN:VALARM","TRIGGER:-PT30M","ACTION:DISPLAY","DESCRIPTION:Jogo do João Fonseca em 30 minutos!","END:VALARM","END:VEVENT","END:VCALENDAR"].join("\r\n");
    var blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = "fonseca-vs-" + oppName.replace(/[^a-zA-Z]/g, "").toLowerCase() + ".ics";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  var shortDate = match.date ? (function() {
    var d = new Date(match.date);
    var dia = d.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short", timeZone: "America/Sao_Paulo" });
    return dia.replace(/\.$/, "");
  })() : "";

  var countdownText = "";
  if (!countdown.expired) {
    var parts = [];
    if (countdown.days > 0) parts.push(countdown.days + (countdown.days === 1 ? " dia" : " dias"));
    if (countdown.hours > 0) parts.push(countdown.hours + (countdown.hours === 1 ? " hora" : " horas"));
    if (countdown.minutes > 0 || parts.length === 0) parts.push(countdown.minutes + (countdown.minutes === 1 ? " minuto" : " minutos"));
    if (parts.length === 1) countdownText = "Faltam: " + parts[0];
    else if (parts.length === 2) countdownText = "Faltam: " + parts[0] + " e " + parts[1];
    else countdownText = "Faltam: " + parts[0] + ", " + parts[1] + " e " + parts[2];
  }

  // === LIVE SCORE DATA ===
  var liveScore = isLive ? liveData.score || {} : {};
  var fSets = liveScore.fonseca_sets || [];
  var oSets = liveScore.opponent_sets || [];
  var setsWon = liveScore.sets_won || {};
  var liveServing = liveScore.serving || "";

  return (
    <section style={{ margin: "4px 0 0", padding: 0, background: "linear-gradient(160deg, #0a1220 0%, #111d33 40%, #0d1828 100%)", borderRadius: 20, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -50, right: -50, width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle, " + (isLive ? "#ef4444" : sc) + "10 0%, transparent 65%)", pointerEvents: "none" }} />

      {/* Top bar */}
      <div style={{ padding: "18px 18px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {isLive ? (
            <>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", animation: "pulse 1.5s ease-in-out infinite", display: "inline-block" }} />
              <span style={{ fontSize: 10, fontWeight: 800, color: "#ef4444", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.08em" }}>Ao vivo</span>
            </>
          ) : (
            <>
              <span style={{ fontSize: 9, fontWeight: 700, color: sc, fontFamily: SANS, background: sc + "18", padding: "3px 8px", borderRadius: 999, textTransform: "uppercase", letterSpacing: "0.05em" }}>{surfaceLabel}</span>
              <span style={{ fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.35)", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                {match.tournament_category || ""}
                {match.round ? " · " + match.round : ""}
              </span>
            </>
          )}
        </div>
        {isLive && (
          <span style={{ fontSize: 9, fontWeight: 700, color: sc, fontFamily: SANS, background: sc + "18", padding: "3px 8px", borderRadius: 999, textTransform: "uppercase", letterSpacing: "0.05em" }}>{surfaceLabel}</span>
        )}
        {!isLive && !pushEnabled && onPushClick && (
          <button onClick={onPushClick} disabled={pushLoading} style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, padding: 0 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={pushLoading ? "rgba(255,255,255,0.15)" : YELLOW} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          </button>
        )}
        {!isLive && pushEnabled && (
          <div style={{ width: 30, height: 30, borderRadius: 8, background: GREEN + "12", border: "1px solid " + GREEN + "25", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill={GREEN} stroke={GREEN} strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          </div>
        )}
      </div>

      {/* Tournament title */}
      <div style={{ textAlign: "center", padding: "14px 18px 0" }}>
        {isLive && <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.25)", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>Jogo em andamento</span>}
        <h2 style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-0.02em" }}>{(function() {
          var name = (match.tournament_name || "Próxima Partida").split(",")[0].trim();
          var cat = (match.tournament_category || "").toLowerCase();
          var pts = "";
          if (cat.includes("grand slam") || ["australian open","roland garros","french open","wimbledon","us open"].some(function(gs) { return name.toLowerCase().includes(gs); })) pts = " 2000";
          else if (cat.includes("masters 1000") || cat.includes("1000") || ["monte carlo","madrid","roma","indian wells","miami","canadian","cincinnati","shanghai","paris"].some(function(m) { return name.toLowerCase().includes(m); })) pts = " 1000";
          else if (cat.includes("500") || ["rio open","basel","barcelona","vienna","hamburg","queen","halle"].some(function(m) { return name.toLowerCase().includes(m); })) pts = " 500";
          else if (cat.includes("250")) pts = " 250";
          return name + pts;
        })()}</h2>
      </div>

      {/* Players */}
      <div style={{ padding: "20px 18px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 6, alignItems: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 68, height: 68, borderRadius: "50%", margin: "0 auto 6px", background: "#152035", border: "2.5px solid " + (isLive ? GREEN + "60" : GREEN + "35"), overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <img src={FONSECA_IMG} alt="JF" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={function(e) { if (!e.target.dataset.tried) { e.target.dataset.tried = "1"; e.target.src = FONSECA_IMG_FALLBACK; } else { e.target.style.display = "none"; e.target.parentNode.innerHTML = '<span style="font-size:16px;font-weight:800;color:#00A859;font-family:Inter,sans-serif">JF</span>'; } }} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: SERIF, display: "block", lineHeight: 1.2 }}>J. Fonseca</span>
            {isLive && liveServing === "fonseca" ? <span style={{ fontSize: 10, color: YELLOW, fontFamily: SANS, display: "block", marginTop: 2 }}>🇧🇷 Sacando</span> : <span style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", fontFamily: SANS, display: "block", marginTop: 2 }}>🇧🇷 {player ? "#" + player.ranking : ""}</span>}
          </div>
          {isLive ? (
            <div style={{ textAlign: "center", minWidth: 80 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: GREEN, fontFamily: SANS }}>{setsWon.fonseca || 0}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.15)", fontFamily: SANS }}>-</span>
                <span style={{ fontSize: 28, fontWeight: 800, color: "#ef4444", fontFamily: SANS }}>{setsWon.opponent || 0}</span>
              </div>
              {fSets.length > 0 && (
                <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 4 }}>
                  {fSets.map(function(s, i) {
                    return (<span key={i} style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: SANS }}>{s}-{oSets[i]}</span>);
                  })}
                </div>
              )}
            </div>
          ) : (
            <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.15)", fontFamily: SANS, letterSpacing: "0.05em" }}>VS</span>
          )}
          <div style={{ textAlign: "center" }} onClick={onOppClick ? function(){ onOppClick(); } : undefined} role={onOppClick ? "button" : undefined} tabIndex={onOppClick ? 0 : undefined}>
            <div style={{ position: "relative", width: 68, height: 68, margin: "0 auto 6px" }}>
              <div style={{ width: 68, height: 68, borderRadius: "50%", background: "#152035", border: "2.5px solid rgba(255,255,255,0.1)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", cursor: onOppClick ? "pointer" : "default" }}>
                {oppImg ? <img src={oppImg} alt={oppName} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={function(e) { if (oppImgFallback && !e.target.dataset.tried) { e.target.dataset.tried = "1"; e.target.src = oppImgFallback; } else { e.target.style.display = "none"; e.target.parentNode.innerHTML = "<span style='font-size:18px;font-weight:700;color:rgba(255,255,255,0.35);display:flex;align-items:center;justify-content:center;width:100%;height:100%'>" + oppName.charAt(0) + "</span>"; } }} /> : <span style={{ fontSize: 18, fontWeight: 700, color: "rgba(255,255,255,0.35)" }}>{oppName.charAt(0)}</span>}
              </div>
              {!isLive && onOppClick && <div style={{ position: "absolute", bottom: 0, right: 0, width: 22, height: 22, borderRadius: "50%", background: "#4FC3F7", border: "2.5px solid #111d33", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}><span style={{ color: "#fff", fontSize: 15, fontWeight: 700, lineHeight: 1 }}>+</span></div>}
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: SERIF, display: "block", lineHeight: 1.2 }}>{oppName}</span>
            {isLive && liveServing === "opponent" ? <span style={{ fontSize: 10, color: YELLOW, fontFamily: SANS, display: "block", marginTop: 2 }}>{oppFlag} Sacando</span> : (oppCountry ? <span style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", fontFamily: SANS, display: "block", marginTop: 2 }}>{oppFlag} {oppRanking ? "#" + oppRanking : ""}</span> : <span style={{ fontSize: 10, color: "rgba(255,255,255,0.15)", fontFamily: SANS, display: "block", marginTop: 2 }}>chave pendente</span>)}
          </div>
        </div>
      </div>

      {isLive ? (
        <>
          {/* Live: Assista ao vivo */}
          <div style={{ padding: "22px 18px 24px" }}>
            <a href="https://www.disneyplus.com" target="_blank" rel="noopener noreferrer" style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              padding: "16px", background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
              borderRadius: 14, textDecoration: "none", width: "100%", boxSizing: "border-box",
            }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#fff", animation: "pulse 1.5s ease-in-out infinite", display: "inline-block" }} />
              <span style={{ fontSize: 15, fontWeight: 800, color: "#fff", fontFamily: SANS, letterSpacing: "0.02em" }}>Assista ao vivo</span>
            </a>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginTop: 10 }}>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: SANS }}>ESPN 2 · Disney+</span>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Normal: Probability + Date + Buttons */}
          {fPct !== null && oPct !== null && (
            <div style={{ padding: "20px 18px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: fPct >= oPct ? GREEN : "rgba(255,255,255,0.25)", fontFamily: SANS }}>{fPct}%</span>
                <span style={{ fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.2)", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.06em" }}>Probabilidade de vitória</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: oPct > fPct ? "#ef4444" : "rgba(255,255,255,0.25)", fontFamily: SANS }}>{oPct}%</span>
              </div>
              <div style={{ display: "flex", height: 4, borderRadius: 2, overflow: "hidden", gap: 2 }}>
                <div style={{ width: fPct + "%", background: GREEN, borderRadius: 2, transition: "width 0.8s ease" }} />
                <div style={{ width: oPct + "%", background: "#ef4444", borderRadius: 2, transition: "width 0.8s ease" }} />
              </div>
            </div>
          )}

          {dateInfo && (
            <div style={{ padding: "22px 18px 0", textAlign: "center" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: SERIF, display: "block" }}>{dateInfo.weekday + ", " + dateInfo.date}</span>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4FC3F7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span style={{ fontSize: 22, fontWeight: 800, color: "#4FC3F7", fontFamily: SANS, letterSpacing: "0.04em" }}>{dateInfo.time}</span>
                <span style={{ fontSize: 10, color: "rgba(79,195,247,0.45)", fontFamily: SANS }}>BRT</span>
              </div>
              {countdownText && <span style={{ display: "block", marginTop: 8, fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: SANS }}>{countdownText}</span>}
            </div>
          )}

          <div style={{ padding: "20px 18px 16px", display: "flex", gap: 8 }}>
            <button onClick={downloadICS} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "12px 8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, cursor: "pointer", color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600, fontFamily: SANS }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Calendário
            </button>
            <a href="https://www.disneyplus.com" target="_blank" rel="noopener noreferrer" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "12px 8px", background: "rgba(79,195,247,0.08)", border: "1px solid rgba(79,195,247,0.15)", borderRadius: 12, textDecoration: "none", fontSize: 12, fontWeight: 600, fontFamily: SANS, color: "#4FC3F7" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              ESPN 2 · Disney+
            </a>
          </div>
          <div style={{ padding: "0 18px 22px", textAlign: "center" }}>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontFamily: SANS }}>{match.court ? "Quadra " + match.court : "Quadra ainda desconhecida"}</span>
          </div>
        </>
      )}
    </section>
  );
};

// ===== LIVE SCORE CARD =====
var LiveScoreCard = function(props) {
  var data = props.data;
  if (!data || !data.live) return null;

  var opponent = data.opponent || {};
  var score = data.score || {};
  var stats = data.stats || {};
  var fSets = score.fonseca_sets || [];
  var oSets = score.opponent_sets || [];
  var setsWon = score.sets_won || {};
  var currentGame = score.current_game || {};
  var serving = score.serving || "";

  var oppName = opponent.name || "Oponente";
  var oppShort = oppName.length > 12 ? oppName.split(" ").pop() : oppName;

  var tourneyName = data.tournament || "";
  var surface = data.surface || "";
  var sc = surfaceColorMap[surface] || "#999";
  var statusText = data.status || "Ao vivo";
  var roundText = data.round || "";

  var fStats = stats.fonseca || {};
  var oStats = stats.opponent || {};

  var liveStatRows = [
    { label: "Aces", f: fStats.aces || 0, o: oStats.aces || 0 },
    { label: "D. Faltas", f: fStats.doublefaults || 0, o: oStats.doublefaults || 0, invert: true },
    { label: "1o Saque %", f: fStats.firstserveaccuracy || 0, o: oStats.firstserveaccuracy || 0, pct: true },
    { label: "Winners", f: fStats.winners || 0, o: oStats.winners || 0 },
    { label: "Break Points", f: fStats.breakpointsscored || 0, o: oStats.breakpointsscored || 0 },
    { label: "Pontos", f: fStats.pointstotal || 0, o: oStats.pointstotal || 0 },
  ].filter(function(r) { return r.f > 0 || r.o > 0; });

  return (
    <section style={{ margin: "4px 0 0", padding: "20px 24px", background: "linear-gradient(145deg, #0D1726 0%, #1a3050 100%)", borderRadius: 20, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 16, right: 20, display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", animation: "pulse 1.5s ease-in-out infinite", display: "inline-block" }} />
        <span style={{ fontSize: 10, fontWeight: 700, color: "#ef4444", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.08em" }}>Ao vivo</span>
      </div>

      <div style={{ textAlign: "center", marginBottom: 16 }}>
        {surface && <span style={{ fontSize: 10, fontWeight: 700, color: sc, fontFamily: SANS }}>{surface}</span>}
        {tourneyName && <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: SANS }}>{surface ? " · " : ""}{tourneyName}</span>}
        {roundText && <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: SANS }}> · {roundText}</span>}
        <div style={{ marginTop: 4 }}><span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontFamily: SANS }}>{statusText}</span></div>
      </div>

      <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 12, padding: "16px 20px", marginBottom: liveStatRows.length > 0 ? 16 : 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: GREEN, fontFamily: SERIF }}>J. Fonseca</span>
            {serving === "fonseca" && <span style={{ width: 6, height: 6, borderRadius: "50%", background: YELLOW, display: "inline-block" }} />}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {serving === "opponent" && <span style={{ width: 6, height: 6, borderRadius: "50%", background: YELLOW, display: "inline-block" }} />}
            <span style={{ fontSize: 15, fontWeight: 700, color: "#fff", fontFamily: SERIF }}>{oppShort}</span>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {fSets.map(function(s, i) {
              var won = (oSets[i] !== undefined) ? s > oSets[i] : false;
              var isCurrentSet = i === fSets.length - 1 && !((setsWon.fonseca || 0) + (setsWon.opponent || 0) >= 2);
              return (<span key={i} style={{ fontSize: 22, fontWeight: 800, color: won ? GREEN : (isCurrentSet ? "#fff" : "rgba(255,255,255,0.5)"), fontFamily: SANS }}>{s}</span>);
            })}
            {currentGame.fonseca !== undefined && currentGame.fonseca !== "" && <span style={{ fontSize: 16, fontWeight: 600, color: YELLOW, fontFamily: SANS, marginLeft: 6 }}>{currentGame.fonseca}</span>}
          </div>
          <div style={{ textAlign: "center" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.15)", fontFamily: SANS }}>SETS</span>
            <div style={{ fontSize: 14, fontWeight: 800, color: "rgba(255,255,255,0.3)", fontFamily: SANS, marginTop: 2 }}>{(setsWon.fonseca || 0)} - {(setsWon.opponent || 0)}</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {currentGame.opponent !== undefined && currentGame.opponent !== "" && <span style={{ fontSize: 16, fontWeight: 600, color: YELLOW, fontFamily: SANS, marginRight: 6 }}>{currentGame.opponent}</span>}
            {oSets.map(function(s, i) {
              var won = (fSets[i] !== undefined) ? s > fSets[i] : false;
              var isCurrentSet = i === oSets.length - 1 && !((setsWon.fonseca || 0) + (setsWon.opponent || 0) >= 2);
              return (<span key={i} style={{ fontSize: 22, fontWeight: 800, color: won ? "#ef4444" : (isCurrentSet ? "#fff" : "rgba(255,255,255,0.5)"), fontFamily: SANS }}>{s}</span>);
            })}
          </div>
        </div>
      </div>

      {liveStatRows.length > 0 && (
        <div style={{ padding: "0 4px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: GREEN, fontFamily: SANS }}>Fonseca</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.4)", fontFamily: SANS }}>{oppShort}</span>
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

// ===== PLAYER BLOCK (REDESIGN — FIX 1,2,3,4,5) =====
// ===== MATCH CAROUSEL (Última Partida + Melhores Momentos) =====
var MatchCarousel = function(props) {
  var scrollRef = useRef(null);
  var statsRef = useRef(null);
  var _page = useState(0); var activePage = _page[0]; var setActivePage = _page[1];
  var _statsH = useState(0); var statsHeight = _statsH[0]; var setStatsHeight = _statsH[1];

  useEffect(function() {
    if (statsRef.current) {
      var h = statsRef.current.offsetHeight;
      if (h > 0) setStatsHeight(h);
    }
  });

  var handleScroll = function() {
    if (!scrollRef.current) return;
    var el = scrollRef.current;
    var page = Math.round(el.scrollLeft / el.clientWidth);
    setActivePage(page);
  };

  var goTo = function(i) {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: i * scrollRef.current.clientWidth, behavior: "smooth" });
    }
  };

  return (
    <div>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        data-match-carousel=""
        style={{
          display: "flex", overflowX: "auto", scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch", scrollbarWidth: "none", msOverflowStyle: "none",
          gap: 0,
        }}
      >
        {/* Slide 1: Stats */}
        <div ref={statsRef} style={{ flex: "0 0 100%", scrollSnapAlign: "start", minWidth: "100%" }}>
          <PlayerBlock
            lastMatch={props.lastMatch} matchStats={props.matchStats}
            recentForm={props.recentForm} prizeMoney={props.prizeMoney}
            playerRanking={props.playerRanking} opponentProfile={props.opponentProfile}
          />
        </div>

        {/* Slide 2: Video */}
        <div style={{ flex: "0 0 100%", scrollSnapAlign: "start", minWidth: "100%", display: "flex", flexDirection: "column" }}>
          <div style={{ borderRadius: 16, overflow: "hidden", background: "#000", border: "1px solid " + BORDER, flex: 1, display: "flex", flexDirection: "column", minHeight: statsHeight > 0 ? statsHeight : undefined }}>
            <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
              <iframe
                src={"https://www.youtube.com/embed/" + props.highlightVideo.videoId}
                title={props.highlightVideo.title || "Melhores momentos"}
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            {props.highlightVideo.title && (
              <div style={{ padding: "12px 16px", background: "#111" }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#fff", fontFamily: SANS }}>{props.highlightVideo.title}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dot indicators + labels */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 14 }}>
        <button onClick={function() { goTo(0); }} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", background: activePage === 0 ? BG_ALT : "transparent", border: "1px solid " + (activePage === 0 ? BORDER : "transparent"), borderRadius: 999, cursor: "pointer" }}>
          <span style={{ width: activePage === 0 ? 14 : 6, height: 6, borderRadius: 3, background: activePage === 0 ? GREEN : DIM, transition: "all 0.3s ease" }} />
          <span style={{ fontSize: 10, fontWeight: 600, color: activePage === 0 ? TEXT : DIM, fontFamily: SANS, transition: "color 0.3s ease" }}>Stats</span>
        </button>
        <button onClick={function() { goTo(1); }} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", background: activePage === 1 ? BG_ALT : "transparent", border: "1px solid " + (activePage === 1 ? BORDER : "transparent"), borderRadius: 999, cursor: "pointer" }}>
          <span style={{ width: activePage === 1 ? 14 : 6, height: 6, borderRadius: 3, background: activePage === 1 ? "#ef4444" : DIM, transition: "all 0.3s ease" }} />
          <svg width="10" height="10" viewBox="0 0 24 24" fill={activePage === 1 ? "#ef4444" : DIM} stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          <span style={{ fontSize: 10, fontWeight: 600, color: activePage === 1 ? TEXT : DIM, fontFamily: SANS, transition: "color 0.3s ease" }}>Melhores momentos</span>
        </button>
      </div>
    </div>
  );
};

var PlayerBlock = function(props) {
  var lastMatch = props.lastMatch;
  var matchStats = props.matchStats;
  var recentForm = props.recentForm;
  var season = props.season;
  var prizeMoney = props.prizeMoney;
  var playerRanking = props.playerRanking;
  var opponentProfile = props.opponentProfile;

  var hasAnyData = (matchStats && matchStats.fonseca) || (recentForm && recentForm.length > 0) || season || prizeMoney;
  if (!hasAnyData) return null;

  return (
    <div style={{ margin: "12px 0 4px" }}>

      {matchStats && matchStats.fonseca && (function() {
        var f = matchStats.fonseca;
        var o = matchStats.opponent;
        var statRows = [
          { label: "Aces", fVal: f.aces || 0, oVal: o.aces || 0, icon: "A" },
          { label: "Duplas faltas", fVal: f.doublefaults || 0, oVal: o.doublefaults || 0, invert: true, icon: "DF" },
          { label: "1o saque", fVal: f.firstserveaccuracy || 0, oVal: o.firstserveaccuracy || 0, pct: true, icon: "1S" },
          { label: "Pts no 1o saque", fVal: f.firstservepointsaccuracy || 0, oVal: o.firstservepointsaccuracy || 0, pct: true, icon: "P1" },
          { label: "Pts no 2o saque", fVal: f.secondservepointsaccuracy || 0, oVal: o.secondservepointsaccuracy || 0, pct: true, icon: "P2" },
          { label: "Breaks salvos", fVal: f.breakpointssaved || 0, oVal: o.breakpointssaved || 0, icon: "BP" },
          { label: "Total de pontos", fVal: f.pointstotal || 0, oVal: o.pointstotal || 0, icon: "TP" },
        ].filter(function(r) { return r.fVal > 0 || r.oVal > 0; });
        if (statRows.length === 0) return null;
        var oppName = matchStats.opponent_name || "Adv.";
        var oppShort = oppName.length > 12 ? oppName.split(" ").pop() : oppName;
        var isWin = matchStats.result === "V";
        var oppFlag = countryFlags[matchStats.opponent_country || ""] || "";

        // FIX 2: Foto do oponente via ATP Tour (funciona pra todos)
        var oppImg = getATPImage(oppName);
        var oppImgFallback = getESPNImage(oppName);

        // FIX 3: Ranking do oponente — tenta matchStats, depois opponentProfile (só se mesmo jogador)
        var oppProfileMatch = opponentProfile && opponentProfile.name && oppName.indexOf(opponentProfile.name.split(" ").pop()) !== -1;
        var oppRanking = matchStats.opponent_ranking || (oppProfileMatch ? opponentProfile.ranking : null);

        // FIX 4: Forma atual — até 10 jogos
        var formMatches = recentForm ? recentForm.slice(-10) : [];

        return (
          <div>
            <p style={{ margin: "0 0 12px", fontSize: 11, fontWeight: 700, color: DIM, fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.06em", paddingTop: 20 }}>Última partida</p>
            <div style={{ background: BG_ALT, borderRadius: 16, padding: "20px", overflow: "hidden", border: "1px solid " + BORDER }}>

              {/* Header: torneio + forma atual */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: TEXT, fontFamily: SANS }}>{matchStats.tournament}</span>
                  <span style={{ fontSize: 10, color: DIM, fontFamily: SANS }}>{matchStats.date ? new Date(matchStats.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : ""}</span>
                </div>
                {/* FIX 4: Forma atual com até 10 jogos */}
                {formMatches.length > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                    <span style={{ fontSize: 9, fontWeight: 600, color: DIM, fontFamily: SANS, letterSpacing: "0.03em", marginRight: 2 }}>Forma</span>
                    {formMatches.slice().reverse().map(function(m, i) {
                      var w = m.result === "V";
                      return (
                        <div key={i} title={m.opponent_name + " " + m.score} style={{ width: 16, height: 16, borderRadius: 3, background: w ? GREEN + "15" : RED + "15", border: "1px solid " + (w ? GREEN + "35" : RED + "35"), display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontSize: 8, fontWeight: 700, color: w ? GREEN : RED, fontFamily: SANS }}>{w ? "V" : "D"}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Jogadores: fotos + placar */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                {/* Fonseca — FIX 1: usa FONSECA_IMG */}
                <div style={{ textAlign: "center", flex: 1 }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", overflow: "hidden", margin: "0 auto 6px", border: "2px solid " + GREEN + "40" }}>
                    <img src={FONSECA_IMG} alt="Fonseca" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={function(e) { if (!e.target.dataset.tried) { e.target.dataset.tried = "1"; e.target.src = FONSECA_IMG_FALLBACK; } else { e.target.style.display = "none"; e.target.parentNode.innerHTML = "<span style='font-size:16px;font-weight:700;color:" + GREEN + ";display:flex;align-items:center;justify-content:center;width:100%;height:100%'>JF</span>"; } }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: TEXT, fontFamily: SANS, display: "block" }}>Fonseca</span>
                  <span style={{ fontSize: 10, color: DIM, fontFamily: SANS }}>🇧🇷 #{playerRanking || 40}</span>
                </div>

                {/* Placar */}
                <div style={{ textAlign: "center", padding: "0 8px" }}>
                  <span style={{ fontSize: 20, fontWeight: 800, color: TEXT, fontFamily: SANS, letterSpacing: "0.05em", display: "block", marginBottom: 4 }}>{matchStats.score}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: isWin ? GREEN : RED, fontFamily: SANS, background: isWin ? GREEN + "12" : RED + "12", padding: "3px 10px", borderRadius: 6 }}>{isWin ? "VITÓRIA" : "DERROTA"}</span>
                </div>

                {/* Oponente — FIX 2: foto ESPN + FIX 3: ranking */}
                <div style={{ textAlign: "center", flex: 1 }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", overflow: "hidden", margin: "0 auto 6px", border: "2px solid " + BORDER, background: BG_ALT }}>
                    {oppImg ? (
                      <img src={oppImg} alt={oppShort} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={function(e) { if (oppImgFallback && !e.target.dataset.tried) { e.target.dataset.tried = "1"; e.target.src = oppImgFallback; } else { e.target.style.display = "none"; e.target.parentNode.innerHTML = "<span style='font-size:16px;font-weight:700;color:" + DIM + ";display:flex;align-items:center;justify-content:center;width:100%;height:100%'>" + oppShort.charAt(0) + "</span>"; } }} />
                    ) : (
                      <span style={{ fontSize: 16, fontWeight: 700, color: DIM, display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }}>{oppShort.charAt(0)}</span>
                    )}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: TEXT, fontFamily: SANS, display: "block" }}>{oppShort}</span>
                  <span style={{ fontSize: 10, color: DIM, fontFamily: SANS }}>{oppFlag} {oppRanking ? "#" + oppRanking : ""}</span>
                </div>
              </div>

              <div style={{ height: 1, background: BORDER, marginBottom: 16 }} />

              {/* FIX 5: Barras de stats — flex bar sem gaps */}
              {statRows.map(function(row, i) {
                var fBetter = row.invert ? row.fVal < row.oVal : row.fVal >= row.oVal;
                // Calcular proporção: ambos sobre o total, sempre somam ~100%
                var fNum = row.fVal || 0;
                var oNum = row.oVal || 0;
                var total = fNum + oNum;
                var fPct, oPct;
                if (row.pct) {
                  // Para percentuais, normalizar para que somem 100
                  var pctTotal = fNum + oNum;
                  fPct = pctTotal > 0 ? Math.round((fNum / pctTotal) * 100) : 50;
                  oPct = 100 - fPct;
                } else {
                  fPct = total > 0 ? Math.round((fNum / total) * 100) : 50;
                  oPct = 100 - fPct;
                }
                // Mínimo visual de 8% para não sumir
                if (fPct > 0 && fPct < 8) { fPct = 8; oPct = 92; }
                if (oPct > 0 && oPct < 8) { oPct = 8; fPct = 92; }

                return (
                  <div key={i} style={{ marginBottom: i < statRows.length - 1 ? 14 : 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: fBetter ? GREEN : "#8bc9a5", fontFamily: SANS, minWidth: 40, textAlign: "left" }}>{row.pct ? row.fVal + "%" : row.fVal}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: SUB, fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "center", flex: 1 }}>{row.label}</span>
                      <span style={{ fontSize: 15, fontWeight: 700, color: !fBetter ? "#e74c3c" : "#e8a9a1", fontFamily: SANS, minWidth: 40, textAlign: "right" }}>{row.pct ? row.oVal + "%" : row.oVal}</span>
                    </div>
                    <div style={{ display: "flex", height: 5, borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: fPct + "%", height: 5, background: GREEN, transition: "width 0.8s ease" }} />
                      <div style={{ width: oPct + "%", height: 5, background: "#e74c3c", transition: "width 0.8s ease" }} />
                    </div>
                  </div>
                );
              })}

            </div>
          </div>
        );
      })()}
    </div>
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
// ===== MODAL (top-level to prevent re-mount on state changes) =====
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
  var _src = useState(false); var showRankingChart = _src[0]; var setShowRankingChart = _src[1];
  var _sng = useState(false); var showNextGen = _sng[0]; var setShowNextGen = _sng[1];
  var _stl = useState(false); var showTimeline = _stl[0]; var setShowTimeline = _stl[1];
  var _scal = useState(false); var showCalendar = _scal[0]; var setShowCalendar = _scal[1];
  var _svid = useState(false); var showVideos = _svid[0]; var setShowVideos = _svid[1];
  var _allLikes = useState({}); var allLikes = _allLikes[0]; var setAllLikes = _allLikes[1];
  var _matchStats = useState(null); var matchStats = _matchStats[0]; var setMatchStats = _matchStats[1];
  var _recentForm = useState(null); var recentForm = _recentForm[0]; var setRecentForm = _recentForm[1];
  var _prizeMoney = useState(null); var prizeMoney = _prizeMoney[0]; var setPrizeMoney = _prizeMoney[1];
  var _careerStats = useState(null); var careerStats = _careerStats[0]; var setCareerStats = _careerStats[1];
  var _liveMatch = useState(null); var liveMatch = _liveMatch[0]; var setLiveMatch = _liveMatch[1];
  var _highlightVideo = useState(null); var highlightVideo = _highlightVideo[0]; var setHighlightVideo = _highlightVideo[1];
  var _winProb = useState(null); var winProb = _winProb[0]; var setWinProb = _winProb[1];
  var _visibleCount = useState(12); var visibleCount = _visibleCount[0]; var setVisibleCount = _visibleCount[1];
  var _fb = useState(function() { try { return localStorage.getItem("fn_site_fb"); } catch(e) { return null; } });
  var siteFeedback = _fb[0]; var setSiteFeedback = _fb[1];
  var _showFeedback = useState(false); var showFeedback = _showFeedback[0]; var setShowFeedback = _showFeedback[1];
  var _showInstallGuide = useState(false); var showInstallGuide = _showInstallGuide[0]; var setShowInstallGuide = _showInstallGuide[1];
  var _pushEnabled = useState(function() { try { return localStorage.getItem("fn_push_enabled") === "1"; } catch(e) { return false; } });
  var pushEnabled = _pushEnabled[0]; var setPushEnabled = _pushEnabled[1];
  var _pushLoading = useState(false); var pushLoading = _pushLoading[0]; var setPushLoading = _pushLoading[1];
  var _showAutoInstall = useState(false); var showAutoInstall = _showAutoInstall[0]; var setShowAutoInstall = _showAutoInstall[1];
  var _autoInstallStep = useState(0); var autoInstallStep = _autoInstallStep[0]; var setAutoInstallStep = _autoInstallStep[1];
  var _fbName = useState(""); var fbName = _fbName[0]; var setFbName = _fbName[1];
  var _fbMsg = useState(""); var fbMsg = _fbMsg[0]; var setFbMsg = _fbMsg[1];
  var _fbRating = useState(null); var fbRating = _fbRating[0]; var setFbRating = _fbRating[1];
  var _fbSent = useState(false); var fbSent = _fbSent[0]; var setFbSent = _fbSent[1];
  var _biography = useState(null); var biography = _biography[0]; var setBiography = _biography[1];
  var _tournamentFacts = useState(null); var tournamentFacts = _tournamentFacts[0]; var setTournamentFacts = _tournamentFacts[1];
  var _opponentProfile = useState(null); var opponentProfile = _opponentProfile[0]; var setOpponentProfile = _opponentProfile[1];
  var _showOppPopup = useState(false); var showOppPopup = _showOppPopup[0]; var setShowOppPopup = _showOppPopup[1];

  var initDone = useRef(false);

  var handlePushSubscribe = function() {
    if (pushLoading || pushEnabled) return;
    if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) return;
    setPushLoading(true);

    Notification.requestPermission().then(function(permission) {
      if (permission !== "granted") { setPushLoading(false); return; }

      navigator.serviceWorker.register("/firebase-messaging-sw.js").then(function(registration) {
        var loadScript = function(src) {
          return new Promise(function(resolve, reject) {
            if (document.querySelector('script[src="' + src + '"]')) { resolve(); return; }
            var s = document.createElement("script");
            s.src = src; s.onload = resolve; s.onerror = reject;
            document.head.appendChild(s);
          });
        };

        loadScript("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js").then(function() {
          return loadScript("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");
        }).then(function() {
          if (!firebase.apps.length) {
            firebase.initializeApp({
              apiKey: "AIzaSyC-HLexrhKl8nzoSvzreVC5p5c3gSu7YBM",
              authDomain: "fonsecanews-a8dd6.firebaseapp.com",
              projectId: "fonsecanews-a8dd6",
              storageBucket: "fonsecanews-a8dd6.firebasestorage.app",
              messagingSenderId: "956348246783",
              appId: "1:956348246783:web:175dd2d3ff5586b05c3aca"
            });
          }
          var messaging = firebase.messaging();
          return messaging.getToken({
            vapidKey: "BImy1bs1rv3d168KaRR7lEy8LH2bLiP8cxJQvj6c-L3RIdDu8F31rFpoMDes1zfxkpebXladqku94qWaLlY-pgk",
            serviceWorkerRegistration: registration
          });
        }).then(function(token) {
          if (token) {
            return fetch("/api/push-subscribe", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ token: token })
            }).then(function() {
              try { localStorage.setItem("fn_push_enabled", "1"); } catch(e) {}
              setPushEnabled(true);
              setPushLoading(false);
            });
          }
          setPushLoading(false);
        }).catch(function(e) {
          console.error("[push] Error:", e);
          setPushLoading(false);
        });
      }).catch(function(e) {
        console.error("[push] SW registration error:", e);
        setPushLoading(false);
      });
    }).catch(function() {
      setPushLoading(false);
    });
  };

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
    pollLive();
    var iv = setInterval(function() {
      if (!document.hidden) pollLive();
    }, 30000);
    return function() { clearInterval(iv); };
  }, []);

  useEffect(function() {
    fetch("/api/manual-video").then(function(r) { return r.json(); }).then(function(d) {
      if (d && d.videoId) setHighlightVideo(d);
    }).catch(function() {});
  }, []);

  useEffect(function() { if (popupDismissed) return; var t = setTimeout(function() { setShowInstallPopup(true); }, 60000); return function() { clearTimeout(t); }; }, [popupDismissed]);

  useEffect(function() {
    var handler = function(e) { e.preventDefault(); setDeferredPrompt(e); setShowInstallBanner(true); };
    window.addEventListener("beforeinstallprompt", handler);
    if ("serviceWorker" in navigator) { var sw = new Blob(["self.addEventListener('install',e=>{self.skipWaiting()});self.addEventListener('activate',e=>{e.waitUntil(clients.claim())});self.addEventListener('fetch',e=>{e.respondWith(fetch(e.request).catch(()=>new Response('Offline')))});"], { type: "application/javascript" }); navigator.serviceWorker.register(URL.createObjectURL(sw)).catch(function() {}); }
    return function() { window.removeEventListener("beforeinstallprompt", handler); };
  }, []);

  var handleInstall = function() { if (!deferredPrompt) return; deferredPrompt.prompt(); deferredPrompt.userChoice.then(function(r) { if (r.outcome === "accepted") setShowInstallBanner(false); setDeferredPrompt(null); }); };
  var dismissPopup = function() { setShowInstallPopup(false); setPopupDismissed(true); };

  var loadCache = function() {
    try { var raw = localStorage.getItem("jf-news-v5"); if (raw) { var c = JSON.parse(raw); if (Date.now() - c.timestamp < CACHE_DURATION_MS && c.news && c.news.length) { setNews(c.news); setNextMatch(c.nextMatch||null); setLastMatch(c.lastMatch||null); setPlayer(c.player||null); setSeason(c.season||null); setLastUpdate(new Date(c.timestamp).toISOString()); return true; } } } catch(e) {}
    return false;
  };
  var saveCache = function(d) { try { localStorage.setItem("jf-news-v5", JSON.stringify(Object.assign({}, d, { timestamp: Date.now() }))); } catch(e) {} };

  var fetchNews = function() {
    setLoading(true);
    fetch("/api/news").then(function(res) { if (!res.ok) throw new Error("" + res.status); return res.json(); }).then(function(p) { if (p && p.news && p.news.length) { setNews(p.news); setNextMatch(p.nextMatch||null); setLastMatch(p.lastMatch||null); setPlayer(p.player||null); setSeason(p.season||null); setLastUpdate(new Date().toISOString()); saveCache({ news:p.news, nextMatch:p.nextMatch, lastMatch:p.lastMatch, player:p.player, season:p.season }); } }).catch(function() {}).then(function() { setLoading(false); });
  };

  var handleRefresh = function() {
    fetchNews();
    fetch("/api/sofascore-data").then(function(r) { return r.json(); }).then(function(d) {
      if (d.matchStats) setMatchStats(d.matchStats);
      if (d.recentForm) setRecentForm(d.recentForm);
      if (d.prizeMoney) setPrizeMoney(d.prizeMoney);
      if (d.careerStats) setCareerStats(d.careerStats);
      if (d.ranking && d.ranking.ranking) setPlayer(function(prev) { return prev ? Object.assign({}, prev, { ranking: d.ranking.ranking }) : { ranking: d.ranking.ranking }; });
      if (d.season && d.season.wins !== undefined) setSeason(d.season);
      if (d.lastMatch && d.lastMatch.result) setLastMatch(d.lastMatch);
      if (d.nextMatch && d.nextMatch.date) setNextMatch(d.nextMatch);
      if (d.winProb) setWinProb(d.winProb);
      if (d.biography) setBiography(d.biography);
      if (d.tournamentFacts) setTournamentFacts(d.tournamentFacts);
      if (d.opponentProfile) setOpponentProfile(d.opponentProfile);
    }).catch(function() {});
  };

  useEffect(function() {
    if (initDone.current) return; initDone.current = true;
    if (!loadCache()) fetchNews();
  }, []);

  useEffect(function() {
    fetch("/api/stats").then(function(r) { return r.json(); }).then(function(d) { if (d.likes) setAllLikes(d.likes); if (d.visitors) { var el = document.getElementById("fn-visitors"); var wrap = document.getElementById("fn-visitors-wrap"); if (el) el.textContent = d.visitors; if (wrap) wrap.style.display = "inline"; } }).catch(function() {});
    fetch("/api/visitors").then(function(r) { return r.json(); }).then(function(d) { if (d.standalone) { var el = document.getElementById("fn-standalone"); var wrap = document.getElementById("fn-standalone-wrap"); if (el) el.textContent = d.standalone; if (wrap) wrap.style.display = "inline"; } }).catch(function() {});
    var isNew = !localStorage.getItem("fn_visited");
    if (isNew) { fetch("/api/visitors", { method: "POST" }).catch(function() {}); try { localStorage.setItem("fn_visited", "1"); } catch(e) {} }
    try {
      var isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
      var alreadyTracked = localStorage.getItem("fn_standalone_tracked");
      if (isStandalone && !alreadyTracked) {
        fetch("/api/visitors?action=standalone", { method: "POST" }).catch(function() {});
        localStorage.setItem("fn_standalone_tracked", "1");
      }
    } catch(e) {}
    fetch("/api/sofascore-data").then(function(r) { return r.json(); }).then(function(d) {
      if (d.matchStats) setMatchStats(d.matchStats);
      if (d.recentForm) setRecentForm(d.recentForm);
      if (d.prizeMoney) setPrizeMoney(d.prizeMoney);
      if (d.careerStats) setCareerStats(d.careerStats);
      if (d.ranking && d.ranking.ranking) setPlayer(function(prev) { return prev ? Object.assign({}, prev, { ranking: d.ranking.ranking }) : { ranking: d.ranking.ranking }; });
      if (d.season && d.season.wins !== undefined) setSeason(d.season);
      if (d.lastMatch && d.lastMatch.result) setLastMatch(d.lastMatch);
      if (d.nextMatch && d.nextMatch.date) setNextMatch(d.nextMatch);
      if (d.winProb) setWinProb(d.winProb);
      if (d.biography) setBiography(d.biography);
      if (d.tournamentFacts) setTournamentFacts(d.tournamentFacts);
      if (d.opponentProfile) setOpponentProfile(d.opponentProfile);
    }).catch(function() {});
  }, []);

  useEffect(function() {
    try {
      var isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
      var wasDismissed = localStorage.getItem("fn_autoinstall_dismissed");
      if (isStandalone || wasDismissed) return;
    } catch(e) { return; }
    var timer = setTimeout(function() { setShowAutoInstall(true); }, 15000);
    return function() { clearTimeout(timer); };
  }, []);

  var dn = news.length > 0 ? news : SAMPLE_NEWS;
  var dm = nextMatch || SAMPLE_NEXT_MATCH;
  var dl = lastMatch || null;
  var dp = player || (news.length === 0 ? SAMPLE_PLAYER : null);
  var ds = season || null;

  return (
    <div style={{ minHeight: "100vh", background: "#fff" }}>
      <Head>
        <title>Fonseca News — Guia de bolso sobre João Fonseca</title>
        <meta name="description" content="Acompanhe a carreira do tenista João Fonseca: notícias, ranking, estatísticas, próximos jogos e mais." />
      </Head>
      <style>{
        "@import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@400;600;700;800&family=Inter:wght@400;500;600;700;800&display=swap');" +
        "*{box-sizing:border-box;margin:0;padding:0}" +
        "body{background:#fff;-webkit-font-smoothing:antialiased}" +
        "nav::-webkit-scrollbar{display:none}" +
        "[data-match-carousel]::-webkit-scrollbar{display:none}" +
        "@keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}" +
        "@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}" +
        "@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}" +
        "@keyframes slideU{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}" +
        "@keyframes fadeInO{from{opacity:0}to{opacity:1}}" +
        "@keyframes factProgress{from{width:0}to{width:100%}}"
      }</style>

      <header style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(255,255,255,0.97)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid " + BORDER }}>
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #0D1726, #132440)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontFamily: SERIF, fontSize: 15, fontWeight: 800, letterSpacing: "-0.04em" }}><span style={{ color: GREEN }}>F</span><span style={{ color: YELLOW }}>N</span></span>
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontFamily: SERIF, fontSize: 19, fontWeight: 800, letterSpacing: "-0.02em", whiteSpace: "nowrap" }}><span style={{ color: GREEN }}>Fonseca</span> <span style={{ color: YELLOW }}>News</span></span>
                {dp && <span style={{ fontSize: 11, fontWeight: 700, color: "#132440", fontFamily: SANS, whiteSpace: "nowrap" }}>#{dp.ranking}</span>}
              </div>
              <span style={{ fontSize: 10, color: DIM, fontFamily: SANS, display: "flex", alignItems: "center", gap: 4, marginTop: -1 }}>
                {lastUpdate && (function() {
                  var minAgo = Math.floor((Date.now() - new Date(lastUpdate).getTime()) / 60000);
                  var isFresh = minAgo < 30;
                  return <span style={{ width: 5, height: 5, borderRadius: "50%", background: isFresh ? GREEN : "#ccc", display: "inline-block", flexShrink: 0, animation: isFresh ? "pulse 2s ease-in-out infinite" : "none" }} />;
                })()}
                <span>Guia de bolso{lastUpdate ? " · " + formatTimeAgo(lastUpdate) : ""}</span>
              </span>
            </div>
          </div>
          <button onClick={handleRefresh} disabled={loading} style={{ width: 32, height: 32, borderRadius: 8, background: "transparent", border: "none", color: loading ? DIM : SUB, display: "flex", alignItems: "center", justifyContent: "center", cursor: loading ? "default" : "pointer", flexShrink: 0, padding: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={loading ? { animation: "spin 1s linear infinite" } : {}}><path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16" /></svg>
          </button>
        </div>

        <div style={{ position: "relative" }}>
          <nav style={{ maxWidth: 640, margin: "0 auto", overflowX: "auto", overflowY: "hidden", WebkitOverflowScrolling: "touch", scrollbarWidth: "none", msOverflowStyle: "none", padding: "2px 16px 12px", paddingRight: 48, display: "flex", alignItems: "center", gap: 24 }}>
            {[
              { label: "Biografia", href: "/biografia" },
              { label: "Ranking", action: function(){setShowRanking(true);} },
              { label: "Calendário", action: function(){setShowCalendar(true);} },
              { label: "Conquistas", action: function(){setShowTitles(true);} },
              { label: "Feedback", action: function(){setShowFeedback(true);} },
              { label: "Sobre", href: "/sobre" },
            ].map(function(item, i) {
              var isLink = !!item.href;
              var isGreen = !!item.green;
              var isGold = !!item.gold;
              var navColor = isGreen ? GREEN : (isGold ? "#b8860b" : SUB);
              var navStyle = { fontSize: 13, fontWeight: 500, color: navColor, fontFamily: SANS, whiteSpace: "nowrap", padding: 0, background: "none", border: "none", cursor: "pointer", textDecoration: "none", letterSpacing: "0.01em", flexShrink: 0 };
              if (isLink) return <a key={i} href={item.href} style={navStyle}>{item.label}</a>;
              return <button key={i} onClick={item.action} style={navStyle}>{item.label}</button>;
            })}
          </nav>
          <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 48, background: "linear-gradient(to right, transparent, rgba(255,255,255,0.95) 60%)", display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 8, pointerEvents: "none" }}>
            <span style={{ fontSize: 14, color: DIM, fontFamily: SANS, fontWeight: 300 }}>›</span>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 640, margin: "0 auto", padding: "0 12px" }}>

        {!loading && news.length === 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "#FEF3C7", borderRadius: 10, margin: "12px 0 0", border: "1px solid #F59E0B33" }}>
            <span style={{ fontSize: 13 }}>⚠️</span>
            <span style={{ fontSize: 11, color: "#92400E", fontFamily: SANS }}>Dados offline — mostrando informações de exemplo. Toque em atualizar.</span>
          </div>
        )}

        <section style={{ padding: "20px 0 0" }}>
          {!liveMatch && <p style={{ margin: "0 0 12px", fontSize: 11, fontWeight: 700, color: DIM, fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.06em" }}>Próximo duelo</p>}
          <NextDuelCard match={dm} player={dp} onOppClick={opponentProfile ? function(){ setShowOppPopup(true); } : null} winProb={winProb} oppProfile={opponentProfile} onPushClick={handlePushSubscribe} pushEnabled={pushEnabled} pushLoading={pushLoading} liveData={liveMatch} />
        </section>

        {/* Curiosidades do torneio — carrossel automático */}
        {tournamentFacts && tournamentFacts.facts && tournamentFacts.facts.length > 0 && (
          <TournamentFactsCarousel facts={tournamentFacts.facts} tournamentName={tournamentFacts.name || dm.tournament_name} surface={dm.surface} />
        )}

        {/* Última Partida + Melhores Momentos — carrossel swipável */}
        <section style={{ padding: "20px 0 0" }}>
          <p style={{ margin: "0 0 12px", fontSize: 11, fontWeight: 700, color: DIM, fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.06em" }}>Última partida</p>
          {highlightVideo && highlightVideo.videoId ? (
            <MatchCarousel matchStats={matchStats} lastMatch={dl} recentForm={recentForm} prizeMoney={prizeMoney} playerRanking={dp ? dp.ranking : null} opponentProfile={opponentProfile} highlightVideo={highlightVideo} />
          ) : (
            <PlayerBlock lastMatch={dl} matchStats={matchStats} recentForm={recentForm} prizeMoney={prizeMoney} playerRanking={dp ? dp.ranking : null} opponentProfile={opponentProfile} />
          )}
        </section>

        {/* Notícias */}
        <section style={{ padding: "20px 0 0" }}>
          <p style={{ margin: "0 0 12px", fontSize: 11, fontWeight: 700, color: DIM, fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.06em" }}>Notícias</p>
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

        {/* João em números */}
        <section style={{ padding: "20px 0 0" }}>
          <p style={{ margin: "0 0 12px", fontSize: 11, fontWeight: 700, color: DIM, fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.06em" }}>João em números</p>
          {(function() {
            var cs = careerStats || {};
            var cW = cs.wins || 42; var cL = cs.losses || 28;
            var cPct = cs.winPct || Math.round((cW / (cW + cL)) * 100);
            var surf = cs.surface || {};
            var hardW = surf.hard ? surf.hard.w : 16; var hardL = surf.hard ? surf.hard.l : 11;
            var clayW = surf.clay ? surf.clay.w : 14; var clayL = surf.clay ? surf.clay.l : 12;
            var grassW = surf.grass ? surf.grass.w : 3; var grassL = surf.grass ? surf.grass.l : 4;
            return (
          <div style={{ background: BG_ALT, borderRadius: 16, padding: "18px", border: "1px solid " + BORDER }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 16 }}>
              {(function() {
                var t10 = cs.vsTop10 || { w: 1, l: 4 };
                var t10w = t10.w || 1; var t10l = t10.l || 4;
                return [{v:cW+"V "+cL+"D",l:"Carreira",c:TEXT},{v:cPct+"%",l:"Aprov.",c:GREEN},{v:t10w+"V "+t10l+"D",l:"vs Top 10",c:TEXT},{v:prizeMoney ? (prizeMoney >= 1000000 ? "$" + (Math.floor(prizeMoney / 100000) / 10).toFixed(1) + "M" : "$" + Math.round(prizeMoney / 1000) + "K") : "$2.9M",l:"Prize Money",c:GREEN}];
              })().map(function(s,i){return(<div key={i} style={{textAlign:"center"}}><span style={{fontSize:17,fontWeight:800,color:s.c,fontFamily:SANS,display:"block",lineHeight:1}}>{s.v}</span><span style={{fontSize:9,fontWeight:600,color:DIM,fontFamily:SANS,textTransform:"uppercase",letterSpacing:"0.04em",marginTop:2,display:"block"}}>{s.l}</span></div>);})}
            </div>
            <div style={{ height: 1, background: BORDER, marginBottom: 14 }} />
            <p style={{ margin: "0 0 10px", fontSize: 10, fontWeight: 700, color: DIM, fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.04em" }}>Por superfície</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              {[{ surface: "Piso duro", wins: hardW, losses: hardL, color: "#3B82F6" },{ surface: "Saibro", wins: clayW, losses: clayL, color: "#D97706" },{ surface: "Grama", wins: grassW, losses: grassL, color: "#16A34A" }].map(function(s) {
                var total = s.wins + s.losses; var pct = total > 0 ? Math.round((s.wins / total) * 100) : 0;
                return (<div key={s.surface} style={{ display: "flex", alignItems: "center", gap: 10 }}><span style={{ fontSize: 12, width: 80, fontWeight: 600, color: TEXT, fontFamily: SANS }}>{s.surface}</span><div style={{ flex: 1, height: 6, background: "#e8e8e8", borderRadius: 3, overflow: "hidden" }}><div style={{ height: 6, background: s.color, borderRadius: 3, width: pct + "%", transition: "width 0.8s ease" }} /></div><span style={{ fontSize: 11, fontWeight: 700, color: TEXT, fontFamily: SANS, minWidth: 44, textAlign: "right" }}>{s.wins}-{s.losses}</span><span style={{ fontSize: 10, color: DIM, fontFamily: SANS, minWidth: 28 }}>{pct}%</span></div>);
              })}
            </div>
            <div style={{ height: 1, background: BORDER, marginBottom: 14 }} />
            <p style={{ margin: "0 0 10px", fontSize: 10, fontWeight: 700, color: DIM, fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.04em" }}>Recordes</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {["Mais jovem brasileiro no top 100 da história","1º brasileiro a vencer um ATP 500","1º sul-americano campeão do NextGen Finals","Mais jovem sul-americano campeão ATP desde 1987","Mais jovem a bater top 10 no Australian Open (desde 1973)","1º brasileiro nº1 do ranking juvenil","Record juvenil ITF: 92-27"].map(function(r, i) {
                return (<div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}><span style={{ color: GREEN, fontSize: 11, fontWeight: 700, fontFamily: SANS, flexShrink: 0, marginTop: 1 }}>•</span><span style={{ fontSize: 12, color: TEXT, fontFamily: SANS, lineHeight: 1.5 }}>{r}</span></div>);
              })}
            </div>
          </div>
            );
          })()}
        </section>

        <section style={{ padding: "20px 0" }}>
          <p style={{ margin: "0 0 12px", fontSize: 11, fontWeight: 700, color: DIM, fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.06em" }}>Parceiros</p>
          <a href="mailto:thzgouvea@gmail.com?subject=Parceria Fonseca News" style={{ display: "block", borderRadius: 16, overflow: "hidden", border: "1px solid " + BORDER, textDecoration: "none", background: "#0D1726" }}>
            <img src="/partner-banner-1.svg" alt="Fonseca News - Seja parceiro" style={{ width: "100%", height: "auto", display: "block", minHeight: 120 }} />
          </a>
          <p style={{ margin: "10px 0 0", fontSize: 10, color: DIM, fontFamily: SANS, textAlign: "center" }}>Quer ser parceiro? <a href="mailto:thzgouvea@gmail.com?subject=Parceria Fonseca News" style={{ color: GREEN, textDecoration: "none", fontWeight: 600 }}>Entre em contato</a></p>
        </section>

        <section style={{ padding: "20px 0", borderTop: "1px solid " + BORDER }}>
          <p style={{ margin: "0 0 12px", fontSize: 11, fontWeight: 700, color: DIM, fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.06em" }}>Explore também</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>, bg: GREEN + "10", title: "Evolução no Ranking", sub: "De #145 ao Top 40 — a ascensão do João", action: function(){setShowRankingChart(true);} },
              { href: "/raquetes", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b8860b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>, bg: YELLOW + "10", title: "Venda sua raquete", sub: "Anuncie grátis na comunidade do Telegram" },
              { href: "/game", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 12h4M8 10v4M15 11h.01M18 13h.01"/></svg>, bg: "#7C3AED10", title: "Tennis Career 26", sub: "Simulador de carreira profissional" },
              { href: "/regras", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>, bg: "#2563EB10", title: "Regras do Tênis", sub: "Aprenda como funciona o esporte" },
              { href: "https://www.youtube.com/results?search_query=João+Fonseca+tennis+highlights", target: "_blank", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={RED} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>, bg: RED + "10", title: "Momentos do João", sub: "Highlights e jogadas no YouTube" },
            ].map(function(item, i) {
              var inner = <><div style={{ width: 32, height: 32, borderRadius: 8, background: item.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{item.icon}</div><div><span style={{ fontSize: 13, fontWeight: 700, color: TEXT, fontFamily: SANS, display: "block" }}>{item.title}</span><span style={{ fontSize: 11, color: SUB, fontFamily: SANS }}>{item.sub}</span></div></>;
              var style = { display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: BG_ALT, borderRadius: 12, textDecoration: "none", border: "1px solid " + BORDER, cursor: "pointer", width: "100%" };
              if (item.action) return <button key={i} onClick={item.action} style={Object.assign({}, style, { textAlign: "left" })}>{inner}</button>;
              return (<a key={i} href={item.href} target={item.target} rel={item.target ? "noopener noreferrer" : undefined} style={style}>{inner}</a>);
            })}
          </div>
        </section>

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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 16 }}>
            <span id="fn-visitors-wrap" style={{ fontSize: 11, color: DIM, fontFamily: SANS, display: "none" }}><span id="fn-visitors" style={{ fontWeight: 700, color: GREEN }}></span> visitantes</span>
            <span id="fn-standalone-wrap" style={{ fontSize: 11, color: DIM, fontFamily: SANS, display: "none" }}><span id="fn-standalone" style={{ fontWeight: 700, color: GREEN }}></span> instalaram o app</span>
          </div>
          <p style={{ fontSize: 9, color: DIM, fontFamily: SANS, lineHeight: 1.6, maxWidth: 340, margin: "0 auto", textAlign: "center" }}>Guia de bolso para fãs do João Fonseca · Sem vínculo com João Fonseca ou ATP · © 2026 Fonseca News</p>
        </footer>
      </main>

      {showRanking && (<Modal title="🏆 Ranking ATP Singles" onClose={function(){setShowRanking(false);}} maxWidth={480}><ATPRankingList currentRanking={dp ? dp.ranking : 40} /></Modal>)}
      {showRankingChart && (<Modal title="📈 Evolução no Ranking" onClose={function(){setShowRankingChart(false);}} maxWidth={650}><RankingChart currentRanking={dp ? dp.ranking : 40} /></Modal>)}
      {showCalendar && (<Modal title="🗓️ Calendário ATP 2026" onClose={function(){setShowCalendar(false);}} maxWidth={520}><ATPCalendar /></Modal>)}
      {showTitles && (<Modal title="🏆 Conquistas" onClose={function(){setShowTitles(false);}} maxWidth={460}><div><p style={{margin:"0 0 8px",fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em",color:GREEN,fontFamily:SANS}}>ATP Tour — Singles</p>{[{t:"ATP 500 Basel",d:"Out 2025",det:"vs Davidovich Fokina · 6-3 6-4",note:"1º brasileiro a ganhar ATP 500"},{t:"ATP 250 Buenos Aires",d:"Fev 2025",det:"vs Cerúndolo · 6-4 7-6(1)",note:"Brasileiro mais jovem a ganhar ATP"}].map(function(t,i){return(<div key={i} style={{padding:"10px 0",borderBottom:"1px solid #f0f0f0"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}><span style={{fontSize:14,fontWeight:700,color:TEXT,fontFamily:SERIF}}>{t.t}</span><span style={{fontSize:11,color:DIM,fontFamily:SANS}}>{t.d}</span></div><p style={{margin:0,fontSize:12,color:SUB,fontFamily:SANS}}>{t.det}</p>{t.note&&<p style={{margin:"4px 0 0",fontSize:11,color:GREEN,fontFamily:SANS,fontWeight:600}}>{t.note}</p>}</div>);})}<div style={{height:1,background:"#e8e8e8",margin:"14px 0"}} /><p style={{margin:"0 0 8px",fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em",color:GREEN,fontFamily:SANS}}>ATP Tour — Duplas</p><div style={{padding:"10px 0",borderBottom:"1px solid #f0f0f0"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}><span style={{fontSize:14,fontWeight:700,color:TEXT,fontFamily:SERIF}}>Rio Open 500</span><span style={{fontSize:11,color:DIM,fontFamily:SANS}}>Fev 2026</span></div><p style={{margin:0,fontSize:12,color:SUB,fontFamily:SANS}}>Duplas · Rio de Janeiro</p></div><div style={{height:1,background:"#e8e8e8",margin:"14px 0"}} /><p style={{margin:"0 0 8px",fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em",color:"#b8860b",fontFamily:SANS}}>NextGen ATP Finals</p><div style={{padding:"10px 0",borderBottom:"1px solid #f0f0f0"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}><span style={{fontSize:14,fontWeight:700,color:TEXT,fontFamily:SERIF}}>Campeão invicto</span><span style={{fontSize:11,color:DIM,fontFamily:SANS}}>Dez 2024</span></div><p style={{margin:0,fontSize:12,color:SUB,fontFamily:SANS}}>5 vitórias, 0 derrotas · Jeddah</p><p style={{margin:"4px 0 0",fontSize:11,color:GREEN,fontFamily:SANS,fontWeight:600}}>1º sul-americano campeão do NextGen Finals</p></div><div style={{height:1,background:"#e8e8e8",margin:"14px 0"}} /><p style={{margin:"0 0 8px",fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em",color:SUB,fontFamily:SANS}}>ATP Challenger</p>{[{t:"Phoenix Challenger",d:"Mar 2025",det:"vs Bublik"},{t:"Canberra International",d:"Jan 2025",det:"vs Quinn · sem perder sets"},{t:"Lexington Challenger",d:"Ago 2024",det:"Mais jovem campeão Challenger de 2024"}].map(function(t,i){return(<div key={i} style={{padding:"8px 0",borderBottom:"1px solid #f0f0f0"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}><span style={{fontSize:13,fontWeight:600,color:TEXT,fontFamily:SANS}}>{t.t}</span><span style={{fontSize:11,color:DIM,fontFamily:SANS}}>{t.d}</span></div><p style={{margin:0,fontSize:11,color:SUB,fontFamily:SANS}}>{t.det}</p></div>);})}</div></Modal>)}

      {showOppPopup && opponentProfile && (
        <div onClick={function(){ setShowOppPopup(false); }} style={{ position: "fixed", inset: 0, zIndex: 350, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", display: "flex", alignItems: "flex-end", justifyContent: "center", padding: 0, animation: "fadeInO 0.2s ease" }}>
          <div onClick={function(e) { e.stopPropagation(); }} style={{ background: "linear-gradient(160deg, #0D1726 0%, #142238 100%)", borderRadius: "22px 22px 0 0", padding: "28px 24px 32px", maxWidth: 420, width: "100%", animation: "slideU 0.3s ease", position: "relative" }}>
            {/* Handle bar */}
            <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.15)", margin: "0 auto 20px" }} />
            {/* Header: photo + name */}
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", overflow: "hidden", border: "2.5px solid rgba(255,255,255,0.12)", margin: "0 auto 10px", background: "#152035", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {(function() {
                  var oppImg = getATPImage(opponentProfile.name);
                  var oppFallback = getESPNImage(opponentProfile.name);
                  if (oppImg) return <img src={oppImg} alt={opponentProfile.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={function(e) { if (oppFallback && !e.target.dataset.tried) { e.target.dataset.tried = "1"; e.target.src = oppFallback; } else { e.target.style.display = "none"; } }} />;
                  return <span style={{ fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,0.3)" }}>{(opponentProfile.name || "?").charAt(0)}</span>;
                })()}
              </div>
              <span style={{ fontSize: 20, fontWeight: 800, color: "#fff", fontFamily: SERIF, display: "block", letterSpacing: "-0.01em" }}>{opponentProfile.name || "Oponente"}</span>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 4 }}>
                {opponentProfile.country && <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontFamily: SANS }}>{countryFlags[opponentProfile.country] || ""} {opponentProfile.country}</span>}
                {opponentProfile.ranking && <span style={{ fontSize: 12, fontWeight: 700, color: "#4FC3F7", fontFamily: SANS }}>#{opponentProfile.ranking}</span>}
              </div>
            </div>
            {/* Stats row */}
            <div style={{ display: "flex", justifyContent: "space-around", marginBottom: 18, padding: "14px 0", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {[{ label: "Idade", value: opponentProfile.age || "—" },{ label: "Altura", value: opponentProfile.height || "—" },{ label: "Mão", value: opponentProfile.hand || "—" },{ label: "Títulos", value: opponentProfile.titles !== undefined && opponentProfile.titles !== null ? opponentProfile.titles : "—" }].map(function(s, i) {
                return (<div key={i} style={{ textAlign: "center" }}><span style={{ fontSize: 16, fontWeight: 700, color: "#fff", fontFamily: SANS, display: "block", lineHeight: 1 }}>{s.value}</span><span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.04em", marginTop: 3, display: "block" }}>{s.label}</span></div>);
              })}
            </div>
            {/* Style */}
            {opponentProfile.style && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ margin: "0 0 6px", fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.25)", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.06em" }}>Estilo de jogo</p>
                <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.7)", fontFamily: SANS, lineHeight: 1.6 }}>{opponentProfile.style}</p>
              </div>
            )}
            {/* Career high */}
            {opponentProfile.careerHigh && (
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontFamily: SANS, textAlign: "center" }}>
                Melhor ranking: <span style={{ fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>#{opponentProfile.careerHigh}</span>
              </div>
            )}
          </div>
        </div>
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
              }} disabled={fbMsg.length < 3} style={{ width: "100%", padding: "12px", background: fbMsg.length >= 3 ? GREEN : DIM, color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: fbMsg.length >= 3 ? "pointer" : "default", fontFamily: SANS, opacity: fbMsg.length >= 3 ? 1 : 0.5 }}>Enviar</button>
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

    </div>
  );
}
