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

var SURFACE_PT = { "Clay": "Saibro", "Hard": "Duro", "Grass": "Grama", "Saibro": "Saibro", "Duro": "Duro", "Grama": "Grama" };
var SURFACE_COLOR_BG = { "Saibro": "rgba(217,119,6,0.18)", "Duro": "rgba(59,130,246,0.18)", "Grama": "rgba(22,163,74,0.18)" };
var SURFACE_COLOR_FG = { "Saibro": "#fbbf24", "Duro": "#60a5fa", "Grama": "#34d399" };

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
  // Aceita nomes em snake_case (do Gemini/cron) ou camelCase
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
  var firstMatch = t.first_match_date || null;

  var pointsToWinner = POINTS_BY_CAT[cat] || null;
  var flag = flagOf(country, city);
  var surfBg = SURFACE_COLOR_BG[surface] || "rgba(255,255,255,0.08)";
  var surfFg = SURFACE_COLOR_FG[surface] || "rgba(255,255,255,0.7)";

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
    <div style={{ padding: "22px 20px", color: "white", fontFamily: SANS }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: "#4FC3F7", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
            <span>{flag}</span>
            <span>Próximo torneio</span>
          </div>
          <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.015em" }}>
            {name}
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>
            {cat && <span>{cat}</span>}
            {cat && dRange && <span> · </span>}
            {dRange && <span>{dRange}</span>}
          </div>
        </div>
        {surface && (
          <div style={{ background: surfBg, color: surfFg, padding: "4px 10px", borderRadius: 14, fontSize: 9, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", flexShrink: 0, marginTop: 4 }}>
            {surface}
          </div>
        )}
      </div>

      {/* Countdown */}
      {days !== null && (
        <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, borderLeft: "3px solid " + (inProgress ? "#FFCB05" : GREEN) }}>
          <div>
            <div style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 800, lineHeight: 1, color: "white" }}>
              {inProgress ? "•" : days}
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", letterSpacing: "0.05em", textTransform: "uppercase", marginTop: 2 }}>
              {inProgress ? "torneio em andamento" : (days === 1 ? "dia até o início" : "dias até o início")}
            </div>
          </div>
          {firstMatch && !inProgress && (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>
                {firstMatch}
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", letterSpacing: "0.05em", textTransform: "uppercase", marginTop: 2 }}>
                primeira partida
              </div>
            </div>
          )}
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

      {/* Histórico */}
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
