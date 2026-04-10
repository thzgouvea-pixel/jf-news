// Fonsecômetro — barra fina de temperatura baseada nas últimas 10 partidas
// Calcula internamente: não exibe partidas individuais, só o resultado da "temperatura"
import { SANS, DIM } from "../lib/constants";

function getTemperature(wins, total) {
  var pct = total > 0 ? Math.round((wins / total) * 100) : 0;
  if (pct >= 90) return { label: "On fire", emoji: "🔥", color: "#EF4444", glow: "rgba(239,68,68,0.12)" };
  if (pct >= 70) return { label: "Quente", emoji: "🔥", color: "#F97316", glow: "rgba(249,115,22,0.08)" };
  if (pct >= 50) return { label: "Aquecido", emoji: "🌡️", color: "#EAB308", glow: "rgba(234,179,8,0.08)" };
  if (pct >= 30) return { label: "Morno", emoji: "😐", color: "#9CA3AF", glow: "transparent" };
  return { label: "Frio", emoji: "🥶", color: "#60A5FA", glow: "rgba(96,165,250,0.08)" };
}

export default function Fonsecometro({ recentForm }) {
  if (!recentForm || recentForm.length === 0) return null;

  var last10 = recentForm.slice(0, 10);
  var wins = 0;
  last10.forEach(function(m) {
    var r = (m.result || m.res || "").toUpperCase();
    if (r === "V" || r === "W" || r === "WIN") wins++;
  });
  var total = last10.length;
  var pct = total > 0 ? Math.round((wins / total) * 100) : 0;
  var temp = getTemperature(wins, total);

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "8px 14px",
      borderRadius: 10,
      background: temp.glow !== "transparent" ? temp.glow : "rgba(0,0,0,0.02)",
      border: "1px solid rgba(0,0,0,0.04)",
    }}>
      <span style={{ fontSize: 14, lineHeight: 1 }}>{temp.emoji}</span>
      <span style={{
        fontSize: 10,
        fontWeight: 700,
        color: DIM,
        fontFamily: SANS,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        flexShrink: 0,
      }}>Fonsecômetro</span>
      <div style={{
        flex: 1,
        height: 4,
        background: "rgba(0,0,0,0.06)",
        borderRadius: 2,
        overflow: "hidden",
      }}>
        <div style={{
          height: 4,
          borderRadius: 2,
          width: pct + "%",
          background: temp.color,
          transition: "width 1s ease",
        }} />
      </div>
      <span style={{
        fontSize: 12,
        fontWeight: 800,
        color: temp.color,
        fontFamily: SANS,
        flexShrink: 0,
        minWidth: 30,
        textAlign: "right",
      }}>{pct}%</span>
      <span style={{
        fontSize: 10,
        fontWeight: 600,
        color: DIM,
        fontFamily: SANS,
        flexShrink: 0,
      }}>{wins}V {total - wins}D</span>
    </div>
  );
}
