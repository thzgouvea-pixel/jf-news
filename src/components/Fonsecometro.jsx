import { SANS, SERIF, GREEN } from "../lib/constants";

function calcHype(recentForm) {
  if (!recentForm || recentForm.length === 0) return { pct: 50, mood: "Sem dados", emoji: "⚖️", ctx: "" };
  var last10 = recentForm.slice(0, 10);
  var score = 50;
  last10.forEach(function(m, i) {
    var weight = last10.length - i;
    var rank = m.opponent_ranking || 80;
    var isWin = (m.result || "").toUpperCase() === "V";
    if (isWin) {
      if (rank <= 10) score += weight * 2.0;
      else if (rank <= 20) score += weight * 1.5;
      else if (rank <= 50) score += weight * 1.0;
      else score += weight * 0.5;
    } else {
      if (rank <= 5) score -= weight * 0.3;
      else if (rank <= 10) score -= weight * 0.5;
      else if (rank <= 20) score -= weight * 1.0;
      else score -= weight * 2.0;
    }
  });
  var pct = Math.max(0, Math.min(100, Math.round(score)));
  var wins = last10.filter(function(m) { return (m.result || "").toUpperCase() === "V"; }).length;
  var losses = last10.length - wins;

  var notable = [];
  last10.slice(0, 5).forEach(function(m) {
    if (m.opponent_ranking && m.opponent_ranking <= 10) {
      notable.push((m.result === "V" ? "vitória" : "derrota honrosa") + " vs #" + m.opponent_ranking);
    }
  });

  var mood, emoji;
  if (pct >= 90) { mood = "Imparável"; emoji = "🔥"; }
  else if (pct >= 80) { mood = "Em grande fase"; emoji = "🔥"; }
  else if (pct >= 70) { mood = "Moral em alta"; emoji = "📈"; }
  else if (pct >= 60) { mood = "Confiante"; emoji = "💪"; }
  else if (pct >= 50) { mood = "Estável"; emoji = "⚖️"; }
  else if (pct >= 40) { mood = "Oscilando"; emoji = "📉"; }
  else if (pct >= 30) { mood = "Buscando ritmo"; emoji = "😤"; }
  else { mood = "Fase de adaptação"; emoji = "🔄"; }

  var ctx = wins + "V " + losses + "D nas últimas " + last10.length;
  if (notable.length > 0) ctx += " — " + notable[0];

  return { pct: pct, mood: mood, emoji: emoji, ctx: ctx };
}

export default function Fonsecometro({ recentForm }) {
  if (!recentForm || recentForm.length === 0) return null;
  var h = calcHype(recentForm);

  var barColor = h.pct >= 70 ? "#22C55E" : (h.pct >= 50 ? "#EAB308" : (h.pct >= 30 ? "#F97316" : "#60A5FA"));
  var barGlow = barColor + "30";

  return (
    <div style={{ margin: "12px 0", padding: "14px 18px", background: "linear-gradient(135deg, #0d1520 0%, #111d33 100%)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: "radial-gradient(circle, " + barColor + "15 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.08em" }}>Fonsecômetro</span>
          <span style={{ fontSize: 12 }}>{h.emoji}</span>
        </div>
        <span style={{ fontSize: 13, fontWeight: 800, color: barColor, fontFamily: SANS }}>{h.mood}</span>
      </div>

      <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden", marginBottom: 8 }}>
        <div style={{ height: 6, borderRadius: 3, width: h.pct + "%", background: "linear-gradient(90deg, " + barColor + "80, " + barColor + ")", boxShadow: "0 0 8px " + barGlow, transition: "width 1.2s ease" }} />
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: SANS }}>{h.ctx}</span>
        <span style={{ fontSize: 14, fontWeight: 900, color: barColor, fontFamily: SANS }}>{h.pct}%</span>
      </div>
    </div>
  );
}
