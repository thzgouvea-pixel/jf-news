import { SANS, SERIF, GREEN } from '../lib/constants';

var FLAGS = {
  "Australia": "🇦🇺", "Austrália": "🇦🇺",
  "Argentina": "🇦🇷",
  "Brasil": "🇧🇷", "Brazil": "🇧🇷",
  "EUA": "🇺🇸", "USA": "🇺🇸", "United States": "🇺🇸",
  "Mônaco": "🇲🇨", "Monaco": "🇲🇨",
  "Espanha": "🇪🇸", "Spain": "🇪🇸",
  "Itália": "🇮🇹", "Italy": "🇮🇹",
  "França": "🇫🇷", "France": "🇫🇷",
  "Reino Unido": "🇬🇧", "UK": "🇬🇧", "United Kingdom": "🇬🇧",
  "Alemanha": "🇩🇪", "Germany": "🇩🇪",
  "Canadá": "🇨🇦", "Canada": "🇨🇦",
  "China": "🇨🇳",
  "Áustria": "🇦🇹", "Austria": "🇦🇹",
  "Japão": "🇯🇵", "Japan": "🇯🇵",
  "Suíça": "🇨🇭", "Switzerland": "🇨🇭",
  "Holanda": "🇳🇱", "Netherlands": "🇳🇱",
};

// Landmark/elemento da cidade — emoji renderizado em silhueta cinza no header
// Match por substring no nome do torneio ou cidade. Fallback: 🎾
var CITY_EMOJI = {
  // Grand Slams
  "australian open": "🦘",
  "melbourne": "🦘",
  "roland garros": "🗼",
  "paris": "🗼",
  "wimbledon": "👑",
  "londres": "👑",
  "london": "👑",
  "us open": "🗽",
  "nova york": "🗽",
  "new york": "🗽",
  // Masters 1000
  "indian wells": "🌴",
  "miami": "🌴",
  "monte carlo": "🎰",
  "monte-carlo": "🎰",
  "madrid": "🐻",
  "madri": "🐻",
  "roma": "🏛️",
  "rome": "🏛️",
  "italian": "🏛️",
  "canadian": "🍁",
  "canada": "🍁",
  "toronto": "🍁",
  "montreal": "🍁",
  "cincinnati": "🏙️",
  "shanghai": "🏯",
  "paris masters": "🥐",
  // ATP 500/250
  "rio": "⛰️",
  "rio de janeiro": "⛰️",
  "buenos aires": "💃",
  "barcelona": "🏖️",
  "munique": "🍺",
  "munich": "🍺",
  "bmw": "🍺",
  "hamburgo": "⚓",
  "halle": "🌳",
  "queens": "👑",
  "doha": "🕌",
  "dubai": "🏙️",
  "acapulco": "🌊",
  "tóquio": "🗼",
  "tokyo": "🗼",
  "viena": "🎼",
  "vienna": "🎼",
  // Finals
  "atp finals": "🏆",
  "turim": "🏆",
  "turin": "🏆",
  "next gen": "🏆",
};

var SURFACE_PT = { "Clay": "Saibro", "Hard": "Duro", "Grass": "Grama", "Saibro": "Saibro", "Duro": "Duro", "Grama": "Grama" };
var SURFACE_BAR = { "Saibro": "#fb923c", "Duro": "#60a5fa", "Grama": "#4ade80" };
var SURFACE_GLOW = { "Saibro": "rgba(217,119,6,0.18)", "Duro": "rgba(37,99,235,0.18)", "Grama": "rgba(22,163,74,0.18)" };
var SURFACE_TEXT = { "Saibro": "#fb923c", "Duro": "#60a5fa", "Grama": "#4ade80" };

// Pontos ao campeão por categoria — estável ao longo do tempo
var POINTS_BY_CAT = { "Grand Slam": 2000, "Masters 1000": 1000, "ATP 500": 500, "ATP 250": 250, "Finals": 1500 };

// Premiação total estimada — atualizar anualmente. Em USD ou EUR conforme cada torneio.
var PRIZE_BY_NAME = {
  "Australian Open": "A$96.5M",
  "Roland Garros": "€56M",
  "Wimbledon": "£53.5M",
  "US Open": "$75M",
  "Indian Wells Masters": "$10M",
  "Miami Open": "$9.2M",
  "Monte Carlo": "€6.3M",
  "Madrid Open": "€8.0M",
  "Roma Masters": "€8.7M",
  "Canadian Open": "$9.2M",
  "Cincinnati Masters": "$9.2M",
  "Shanghai Masters": "$9.2M",
  "Paris Masters": "€6.4M",
  "ATP Finals": "$15M",
};

function flagOf(country, city) {
  return FLAGS[country] || FLAGS[city] || "🎾";
}

// Acha o emoji do landmark da cidade. Procura match por substring.
function landmarkOf(name, city) {
  var n = (name || "").toLowerCase();
  var c = (city || "").toLowerCase();
  // Tenta match exato/substring no nome do torneio primeiro
  for (var k in CITY_EMOJI) {
    if (n.indexOf(k) !== -1) return CITY_EMOJI[k];
  }
  // Depois tenta na cidade
  for (var k2 in CITY_EMOJI) {
    if (c.indexOf(k2) !== -1) return CITY_EMOJI[k2];
  }
  return "🎾";
}

function formatDateRange(start, end) {
  if (!start) return "";
  var mShort = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
  var sd = new Date(start);
  var ed = end ? new Date(end) : sd;
  var sDay = sd.getUTCDate();
  var sMonth = mShort[sd.getUTCMonth()];
  var eDay = ed.getUTCDate();
  var eMonth = mShort[ed.getUTCMonth()];
  if (sMonth === eMonth) return sDay + " a " + eDay + " de " + sMonth;
  return sDay + " " + sMonth + " a " + eDay + " " + eMonth;
}

function daysUntilStart(start) {
  if (!start) return null;
  var now = new Date();
  var sd = new Date(start);
  var diffMs = sd.getTime() - now.getTime();
  var d = Math.ceil(diffMs / 86400000);
  return d;
}

export default function NextTournamentCard(props) {
  var t = props.tournament || {};
  var name = t.name || t.tournament_name || "";
  var cat = t.category || t.tournament_category || t.cat || "";
  var surface = SURFACE_PT[t.surface] || t.surface || "";
  var city = t.city || "";
  var country = t.country || "";
  var startDate = t.start || t.start_date || "";
  var endDate = t.end || t.end_date || "";

  // Campos opcionais (vindos de Gemini)
  var prizeMoney = t.prize_money || PRIZE_BY_NAME[name] || null;
  var defendingPts = (typeof t.defending_points === "number") ? t.defending_points : null;
  var seed = (typeof t.seed === "number" && t.seed > 0) ? t.seed : null;
  var lastYear = t.joao_last_year || null;

  if (!name || !startDate) return null;

  var dRange = formatDateRange(startDate, endDate);
  var days = daysUntilStart(startDate);
  var inProgress = days !== null && days <= 0;

  var pointsToWinner = POINTS_BY_CAT[cat] || null;
  var flag = flagOf(country, city);
  var landmark = landmarkOf(name, city);

  // Cores da superfície
  var bar = SURFACE_BAR[surface] || "rgba(255,255,255,0.15)";
  var glow = SURFACE_GLOW[surface] || "rgba(255,255,255,0.05)";
  var surfaceText = SURFACE_TEXT[surface] || "rgba(255,255,255,0.7)";

  var statBox = function(label, value, valueColor) {
    return (
      <div style={{ background: "rgba(255,255,255,0.04)", padding: "10px 12px", borderRadius: 10 }}>
        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 700, marginBottom: 3, fontFamily: SANS }}>
          {label}
        </div>
        <div style={{ fontSize: 14, fontWeight: 800, color: valueColor || "white", fontFamily: SANS }}>
          {value}
        </div>
      </div>
    );
  };

  return (
    <div style={{ position: "relative", padding: "22px 20px 22px 23px", color: "white", fontFamily: SANS }}>
      {/* Borda lateral colorida indicando a superfície (substitui o pill) */}
      <div style={{ position: "absolute", top: 22, bottom: 22, left: 0, width: 3, borderRadius: "0 2px 2px 0", background: bar, pointerEvents: "none" }} />

      {/* Header com glow + landmark da cidade */}
      <div style={{ position: "relative", margin: "-22px -20px 18px -23px", padding: "22px 20px 18px 23px", overflow: "hidden", minHeight: 110 }}>
        {/* Glow radial sutil cor-da-superfície */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at top right, " + glow + " 0%, transparent 65%)", pointerEvents: "none" }} />

        {/* Landmark emoji em silhueta cinza */}
        <div style={{ position: "absolute", top: 8, right: 12, fontSize: 78, lineHeight: 1, filter: "grayscale(1) brightness(0.7) contrast(1.4)", opacity: 0.18, pointerEvents: "none", userSelect: "none" }}>
          {landmark}
        </div>

        {/* Conteúdo */}
        <div style={{ position: "relative", zIndex: 2, maxWidth: 220 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: "#4FC3F7", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
            <span>{flag}</span>
            <span>Próximo torneio</span>
          </div>
          <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.015em" }}>
            {name}
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 4, lineHeight: 1.5 }}>
            {cat && <span>{cat}</span>}
            {cat && surface && <span> · </span>}
            {surface && <span style={{ color: surfaceText, fontWeight: 700 }}>{surface}</span>}
            {(cat || surface) && dRange && <span> · </span>}
            {dRange && <span>{dRange}</span>}
          </div>
        </div>
      </div>

      {/* Countdown — só dias até o início (sem horário, ainda não sabemos) */}
      {days !== null && (
        <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "12px 14px", marginBottom: 14, borderLeft: "3px solid " + (inProgress ? "#FFCB05" : GREEN) }}>
          <div style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 800, lineHeight: 1, color: "white" }}>
            {inProgress ? "•" : days}
          </div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", letterSpacing: "0.05em", textTransform: "uppercase", marginTop: 2 }}>
            {inProgress ? "torneio em andamento" : (days === 1 ? "dia até o início" : "dias até o início")}
          </div>
        </div>
      )}

      {/* Grid 2x2 stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
        {statBox("Premiação total", prizeMoney || "—")}
        {statBox("Pontos ao campeão", pointsToWinner ? pointsToWinner.toLocaleString("pt-BR") : "—")}
        {statBox("João defendendo",
          defendingPts === null ? "—" : (defendingPts === 0 ? "0 pts" : defendingPts + " pts"),
          defendingPts !== null && defendingPts > 0 ? "#ff6b6b" : "white"
        )}
        {statBox("Cabeça de chave", seed ? "#" + seed : "Não")}
      </div>

      {/* Histórico do João */}
      {lastYear && (
        <div style={{ background: "rgba(0,168,89,0.06)", border: "1px solid rgba(0,168,89,0.15)", borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(0,168,89,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00d973" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 3"/></svg>
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.85)", lineHeight: 1.4 }}>
            {lastYear}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#00d973", boxShadow: "0 0 6px rgba(0,217,115,0.6)", animation: "pulse 2s ease-in-out infinite" }} />
          João confirmado · main draw
        </div>
        {props.onCalendarClick && (
          <button onClick={props.onCalendarClick} style={{ background: "none", border: "none", color: "#4FC3F7", fontSize: 11, fontWeight: 600, cursor: "pointer", padding: 0, fontFamily: SANS }}>
            Calendário ›
          </button>
        )}
      </div>
    </div>
  );
}
