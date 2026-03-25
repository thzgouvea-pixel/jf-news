// v9 rival-banner
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
    <div style={{ padding: "8px 24px", background: "#F8F9FA", borderBottom: "1px solid " + BORDER, display: "flex", alignItems: "center", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
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
    <div style={{ padding: "8px 24px", background: w ? "#F7FDFA" : "#FFFAFA", borderBottom: "1px solid " + BORDER, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
      <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: TEXT_DIM, fontFamily: "'Inter', -apple-system, sans-serif" }}>Última partida</span>
      <span style={{ fontSize: 10, fontWeight: 700, color: w ? GREEN : RED, fontFamily: "'Inter', -apple-system, sans-serif", background: w ? "#EAFAF3" : "#FEF0F0", padding: "1px 6px", borderRadius: 3 }}>{w ? "V" : "D"}</span>
      <span style={{ fontSize: 12.5, fontWeight: 700, color: TEXT_PRIMARY, fontFamily: "'Source Serif 4', Georgia, serif" }}>Fonseca <span style={{ color: w ? GREEN : RED }}>{match.score}</span> {match.opponent}</span>
      <span style={{ fontSize: 10.5, color: TEXT_DIM, fontFamily: "'Inter', -apple-system, sans-serif" }}>{match.tournament}{match.round ? (" · " + match.round) : ""}</span>
    </div>
  );
};

// ===== RIVAL BANNER (Learner Tien) - REDESIGNED =====
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
    <div style={{ background: "linear-gradient(135deg, #1a0a0a 0%, #2d1111 40%, #1a0f1e 100%)", borderBottom: "1px solid " + BORDER, padding: "22px 24px 20px", position: "relative", overflow: "hidden" }}>
      {/* Decorative elements */}
      <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "radial-gradient(circle, rgba(230,57,70,0.1) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -30, left: -30, width: 100, height: 100, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,168,89,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />

      {/* Quote */}
      <p style={{ margin: "0 0 18px", textAlign: "center", fontSize: 11.5, fontStyle: "italic", color: "rgba(255,255,255,0.35)", fontFamily: "'Source Serif 4', Georgia, serif", letterSpacing: "0.02em" }}>
        &quot;Porque todo ídolo de verdade precisa de um grande rival&quot;
      </p>

      {/* Players face-off */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24 }}>
        {/* João */}
        <div style={{ textAlign: "center", minWidth: 80 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", overflow: "hidden", background: "#1a2a3a", border: "2.5px solid " + GREEN + "50", margin: "0 auto 8px", boxShadow: "0 0 16px " + GREEN + "15" }}>
            <img src={joaoImg} alt="Fonseca" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={function(e) { e.target.onerror = null; e.target.src = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56"><rect width="56" height="56" fill="#1a2a3a"/><text x="28" y="35" text-anchor="middle" font-family="Georgia" font-weight="800" font-size="18" fill="#00A859">JF</text></svg>'); }} />
          </div>
          <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "'Source Serif 4', Georgia, serif" }}>Fonseca</p>
          <span style={{ fontSize: 10, fontWeight: 700, color: GREEN, fontFamily: "'Inter', sans-serif" }}>🇧🇷 #39 ATP</span>
        </div>

        {/* VS / H2H */}
        <div style={{ textAlign: "center", padding: "0 8px" }}>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.3)", fontFamily: "'Inter', sans-serif", marginBottom: 6 }}>H2H</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 24, fontWeight: 900, color: GREEN, fontFamily: "'Inter', sans-serif" }}>{r.h2h.joao}</span>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 8, fontWeight: 900, color: "rgba(255,255,255,0.25)", fontFamily: "'Inter', sans-serif" }}>VS</span>
            </div>
            <span style={{ fontSize: 24, fontWeight: 900, color: RED, fontFamily: "'Inter', sans-serif" }}>{r.h2h.tien}</span>
          </div>
          <div style={{ marginTop: 8 }}>
            <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: RED, fontFamily: "'Inter', sans-serif", background: "rgba(230,57,70,0.12)", padding: "3px 10px", borderRadius: 4, border: "1px solid rgba(230,57,70,0.2)" }}>Rivalidade</span>
          </div>
        </div>

        {/* Tien */}
        <div style={{ textAlign: "center", minWidth: 80 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", overflow: "hidden", background: "#1a2a3a", border: "2.5px solid " + RED + "50", margin: "0 auto 8px", boxShadow: "0 0 16px " + RED + "15" }}>
            <img src={tienImg} alt={r.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={function(e) { e.target.onerror = null; e.target.src = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56"><rect width="56" height="56" fill="#1a2a3a"/><text x="28" y="35" text-anchor="middle" font-family="Georgia" font-weight="800" font-size="18" fill="#E63946">LT</text></svg>'); }} />
          </div>
          <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "'Source Serif 4', Georgia, serif" }}>{r.name}</p>
          <span style={{ fontSize: 10, fontWeight: 700, color: RED, fontFamily: "'Inter', sans-serif" }}>{r.country + " #" + r.ranking + " ATP"}</span>
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
      <div style={{ textAlign: "center", padding: "14px 20px 6px", position: "relative" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: YELLOW, fontFamily: "'Inter', sans-serif" }}>Próximo Duelo</span>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: sc + "20", borderRadius: 14, padding: "2px 10px", border: "1px solid " + sc + "30" }}>
            <span style={{ fontSize: 11 }}>{se}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: sc, fontFamily: "'Inter', sans-serif" }}>{match.surface}</span>
          </div>
        </div>
        <p style={{ margin: "6px 0 0", fontSize: 20, fontWeight: 800, color: "#fff", fontFamily: "'Source Serif 4', Georgia, serif", letterSpacing: "-0.02em" }}>{match.tournament_category || match.tournament_name || "Próxima Partida"}</p>
        {match.tournament_name && match.tournament_category && (
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "rgba(255,255,255,0.4)", fontFamily: "'Inter', sans-serif" }}>{match.tournament_name}</p>
        )}
      </div>

      {/* Players */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 50px 1fr", alignItems: "start", gap: 6, padding: "14px 20px 10px" }}>
        {/* João */}
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", margin: "0 auto 6px", overflow: "hidden", background: "linear-gradient(135deg, #1a2a3a, #0d1b2e)", border: "2px solid " + GREEN + "50", boxShadow: "0 0 20px " + GREEN + "15" }}>
            <img src={joaoImg} alt="João Fonseca" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={function(e) { e.target.onerror = null; e.target.src = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" fill="#1a2a3a"/><text x="40" y="48" text-anchor="middle" font-family="Georgia,serif" font-weight="800" font-size="24" fill="#00A859">JF</text></svg>'); }} />
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
        <div style={{ padding: "10px 20px 14px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
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
      <div style={{ display: "flex", justifyContent: "center", gap: 16, padding: (countdown.expired ? "12px" : "4px") + " 20px 14px", flexWrap: "wrap" }}>
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
  var cat = catCfg[item.category] || catCfg["Notícia"];
  var hasImg = item.image && !imgErr;
  var hasUrl = item.url && item.url.startsWith("http");
  var Tag = hasUrl ? "a" : "div";
  var linkProps = hasUrl ? { href: item.url, target: "_blank", rel: "noopener noreferrer" } : {};
  return (
    <Tag {...linkProps} onMouseEnter={function() { setH(true); }} onMouseLeave={function() { setH(false); }}
      style={{ display: "flex", gap: hasImg ? 14 : 0, textDecoration: "none", background: h && hasUrl ? "#F8F9FA" : BG_WHITE, padding: hasImg ? "16px 24px" : "16px 24px 16px 20px", borderBottom: "1px solid " + BORDER, borderLeft: hasImg ? "none" : ("3px solid " + cat.color), transition: "background 0.15s", animation: "fadeIn 0.35s ease forwards", animationDelay: (index * 0.04) + "s", opacity: 0, cursor: hasUrl ? "pointer" : "default", alignItems: "flex-start" }}>
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
        <h3 style={{ margin: "0 0 5px", fontSize: 15.5, fontWeight: 700, color: h && hasUrl ? GREEN : TEXT_PRIMARY, fontFamily: "'Source Serif 4', Georgia, serif", lineHeight: 1.4, transition: "color 0.15s" }}>{item.source && item.title ? item.title.replace(" - " + item.source, "").replace(" | " + item.source, "").replace(" · " + item.source, "") : item.title}</h3>
        {item.summary && <p style={{ margin: 0, fontSize: 13, color: TEXT_SECONDARY, fontFamily: "'Inter', -apple-system, sans-serif", lineHeight: 1.5 }}>{item.summary}</p>}
      </div>
    </Tag>
  );
};

var buildFeed = function(newsItems, season, lastMatch) {
  var elements = [];
  var inserts = [
    { at: 5, component: <SeasonBar key="season-bar" season={season} /> },
    { at: 10, component: <RivalBanner key="rival-bar" /> },
    { at: 12, component: <LastMatchBar key="last-match-bar" match={lastMatch} /> },
  ];
  newsItems.forEach(function(item, i) {
    elements.push(<NewsCard key={"news-" + i} item={item} index={i} />);
    var insert = inserts.find(function(ins) { return ins.at === i + 1; });
    if (insert) elements.push(insert.component);
  });
  if (newsItems.length < 5 && season) elements.push(<SeasonBar key="season-bar" season={season} />);
  if (newsItems.length < 10) elements.push(<RivalBanner key="rival-bar" />);
  if (newsItems.length < 12 && lastMatch) elements.push(<LastMatchBar key="last-match-bar" match={lastMatch} />);
  return elements;
};

// ===== VISITOR COUNTER =====
var VisitorCounter = function() {
  var _s = useState(null); var count = _s[0]; var setCount = _s[1];
  useEffect(function() {
    try {
      var key = "fn-visit-count";
      var today = new Date().toDateString();
      var data = JSON.parse(localStorage.getItem(key) || '{"total":0,"today":0,"date":""}');
      if (data.date !== today) { data.today = 0; data.date = today; }
      data.total += 1;
      data.today += 1;
      localStorage.setItem(key, JSON.stringify(data));
      setCount(data);
    } catch(e) {}
  }, []);
  if (!count) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, padding: "8px 0" }}>
      <div style={{ textAlign: "center" }}>
        <span style={{ fontSize: 16, fontWeight: 800, color: GREEN, fontFamily: "'Inter', sans-serif" }}>{count.total}</span>
        <span style={{ fontSize: 10, color: TEXT_DIM, fontFamily: "'Inter', sans-serif", display: "block" }}>visitas totais</span>
      </div>
      <div style={{ width: 1, height: 24, background: BORDER }} />
      <div style={{ textAlign: "center" }}>
        <span style={{ fontSize: 16, fontWeight: 800, color: YELLOW, fontFamily: "'Inter', sans-serif" }}>{count.today}</span>
        <span style={{ fontSize: 10, color: TEXT_DIM, fontFamily: "'Inter', sans-serif", display: "block" }}>visitas hoje</span>
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
  var _sm = useState(true); var showMenu = _sm[0]; var setShowMenu = _sm[1];
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
    document.title = "Fonseca News · João Fonseca";

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
      ["og:title", "Fonseca News · João Fonseca"],
      ["og:description", "Acompanhe as últimas notícias do João Fonseca, a maior promessa do tênis brasileiro."],
      ["og:type", "website"], ["og:site_name", "Fonseca News"], ["og:locale", "pt_BR"],
      ["twitter:card", "summary"], ["twitter:title", "Fonseca News · João Fonseca"],
      ["twitter:description", "Todas as notícias do João Fonseca em um só lugar."],
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
    descMeta.content = "Acompanhe as últimas notícias do João Fonseca, tenista brasileiro. Ranking ATP, resultados, próximos torneios e declarações.";

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
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "18px 16px 16px" }}>
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
                <p style={{ margin: "1px 0 0 0", fontSize: 10.5, color: TEXT_DIM, fontFamily: "'Inter', -apple-system, sans-serif", fontWeight: 500 }}>
                  João Fonseca 🇧🇷
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
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "12px 24px", background: BG_WHITE, borderLeft: "1px solid " + BORDER, borderRight: "1px solid " + BORDER, borderBottom: "1px solid " + BORDER, textAlign: "center" }}>
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

              <button onClick={function() { setShowTitles(true); setShowMenu(false); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "#F8F9FA", border: "1px solid " + BORDER, borderRadius: 12, cursor: "pointer", transition: "background 0.15s" }}>
                <span style={{ fontSize: 18, width: 28, textAlign: "center" }}>🏆</span>
                <div style={{ textAlign: "left" }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: TEXT_PRIMARY, fontFamily: "'Inter', sans-serif", display: "block" }}>Conquistas</span>
                  <span style={{ fontSize: 10, color: TEXT_DIM, fontFamily: "'Inter', sans-serif" }}>Títulos e recordes</span>
                </div>
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "#F8F9FA", border: "1px solid " + BORDER, borderRadius: 12, opacity: 0.5 }}>
                <span style={{ fontSize: 18, width: 28, textAlign: "center" }}>🎬</span>
                <div style={{ textAlign: "left" }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: TEXT_PRIMARY, fontFamily: "'Inter', sans-serif", display: "block" }}>Vídeos</span>
                  <span style={{ fontSize: 10, color: TEXT_DIM, fontFamily: "'Inter', sans-serif" }}>Em breve</span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "#F8F9FA", border: "1px solid " + BORDER, borderRadius: 12, opacity: 0.5 }}>
                <span style={{ fontSize: 18, width: 28, textAlign: "center" }}>💬</span>
                <div style={{ textAlign: "left" }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: TEXT_PRIMARY, fontFamily: "'Inter', sans-serif", display: "block" }}>Fórum</span>
                  <span style={{ fontSize: 10, color: TEXT_DIM, fontFamily: "'Inter', sans-serif" }}>Em breve</span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "#F8F9FA", border: "1px solid " + BORDER, borderRadius: 12, opacity: 0.5 }}>
                <span style={{ fontSize: 18, width: 28, textAlign: "center" }}>📝</span>
                <div style={{ textAlign: "left" }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: TEXT_PRIMARY, fontFamily: "'Inter', sans-serif", display: "block" }}>Blog</span>
                  <span style={{ fontSize: 10, color: TEXT_DIM, fontFamily: "'Inter', sans-serif" }}>Em breve</span>
                </div>
              </div>

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

      {/* NEWS FEED */}
      <main style={{ maxWidth: 680, margin: "0 auto", background: BG_WHITE, borderLeft: "1px solid " + BORDER, borderRight: "1px solid " + BORDER, minHeight: "70vh" }}>
        {/* Section label */}
        <div style={{ padding: "14px 24px 8px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ height: 1, flex: 1, background: BORDER }} />
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: TEXT_DIM, fontFamily: "'Inter', sans-serif", whiteSpace: "nowrap" }}>Últimas Notícias</span>
          <div style={{ height: 1, flex: 1, background: BORDER }} />
        </div>
        {loading && news.length === 0 && <Skeleton />}
        {dn.length > 0 && !(loading && news.length === 0) && (
          <div>{buildFeed(dn, ds, dl)}</div>
        )}
        <div style={{ borderTop: "1px solid " + BORDER, padding: "24px 24px 32px" }}>
          {/* Conquistas bar */}
          <div onClick={function() { setShowTitles(true); }} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, flexWrap: "wrap", marginBottom: 20, cursor: "pointer", padding: "10px 16px", background: "#F8F9FA", borderRadius: 10, border: "1px solid " + BORDER }}>
            {[["🏆","2 títulos ATP"],["🎯","3 Challengers"],["🇧🇷","Nº1 do Brasil"],["⭐","NextGen Champion"]].map(function(pair, i) { return (
              <span key={i} style={{ fontSize: 11, color: TEXT_SECONDARY, fontFamily: "'Inter', -apple-system, sans-serif", fontWeight: 500 }}>{pair[0]} {pair[1]}</span>
            ); })}
            <span style={{ fontSize: 10, color: GREEN, fontFamily: "'Inter', -apple-system, sans-serif", fontWeight: 600 }}>Ver todos →</span>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
            <button onClick={function() { setShowShare(true); }} style={{ background: "none", border: "1px solid " + BORDER, borderRadius: 8, padding: "7px 16px", fontSize: 11.5, color: TEXT_SECONDARY, cursor: "pointer", fontFamily: "'Inter', -apple-system, sans-serif", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 5 }}>🔗 Compartilhar</button>
            <PixDonation />
          </div>

          {/* VISITOR COUNTER */}
          <VisitorCounter />

          <div style={{ textAlign: "center", marginTop: 12, marginBottom: 16 }}>
            <p style={{ margin: 0, fontSize: 10.5, color: TEXT_DIM, fontFamily: "'Inter', -apple-system, sans-serif" }}>📱 iPhone: Safari → (↑) → &quot;Tela de Início&quot; · Android: Chrome → (⋮) → &quot;Tela inicial&quot;</p>
          </div>
          <div style={{ borderTop: "1px solid " + BORDER, paddingTop: 14 }}>
            <p style={{ fontSize: 10, color: "#bbb", fontFamily: "'Inter', -apple-system, sans-serif", lineHeight: 1.6, maxWidth: 440, margin: "0 auto", textAlign: "center" }}>Fonseca News é um site independente de fãs, sem vínculo oficial com João Fonseca, sua equipe ou a ATP. Notícias agregadas de fontes públicas com devidos créditos.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
