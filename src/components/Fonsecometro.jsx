import { useState } from "react";
import { SANS, SERIF, DIM } from "../lib/constants";

function getTemperature(wins, total) {
  var pct = total > 0 ? Math.round((wins / total) * 100) : 0;
  if (pct >= 90) return { emoji: "🔥", color: "#22C55E", label: "Em chamas" };
  if (pct >= 70) return { emoji: "🔥", color: "#4ADE80", label: "Em chamas" };
  if (pct >= 50) return { emoji: "🌡️", color: "#EAB308", label: "Morno" };
  if (pct >= 30) return { emoji: "😐", color: "#F97316", label: "Esfriando" };
  return { emoji: "🥶", color: "#60A5FA", label: "Frio" };
}

var SCALE = [
  { range: "70–100%", color: "#4ADE80", label: "Em chamas" },
  { range: "50–69%", color: "#EAB308", label: "Morno" },
  { range: "30–49%", color: "#F97316", label: "Esfriando" },
  { range: "0–29%", color: "#60A5FA", label: "Frio" },
];

export default function Fonsecometro({ recentForm }) {
  var _s = useState(false); var showInfo = _s[0]; var setShowInfo = _s[1];

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
    <>
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "6px 0",
      }}>
        <span style={{ fontSize: 14, lineHeight: 1 }}>{temp.emoji}</span>
        <span onClick={function(){ setShowInfo(true); }} style={{ fontSize: 10, fontWeight: 700, color: DIM, fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0, cursor: "pointer", borderBottom: "1px dashed rgba(156,163,175,0.4)", paddingBottom: 1 }}>Fonsecômetro</span>
        <div style={{ flex: 1, height: 4, background: "rgba(0,0,0,0.06)", borderRadius: 2, overflow: "hidden" }}>
          <div style={{ height: 4, borderRadius: 2, width: pct + "%", background: temp.color, transition: "width 1s ease" }} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 800, color: temp.color, fontFamily: SANS, flexShrink: 0 }}>{pct}%</span>
      </div>

      {showInfo && (
        <div onClick={function(){ setShowInfo(false); }} style={{ position: "fixed", inset: 0, zIndex: 400, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, animation: "fadeInO 0.2s ease" }}>
          <div onClick={function(e){ e.stopPropagation(); }} style={{ background: "linear-gradient(160deg, #0D1726 0%, #142238 100%)", borderRadius: 20, padding: "28px 24px 24px", maxWidth: 340, width: "100%", animation: "slideU 0.3s ease", position: "relative" }}>

            <button onClick={function(){ setShowInfo(false); }} style={{ position: "absolute", top: 14, right: 14, background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "50%", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>

            <h3 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 800, color: "#fff", fontFamily: SERIF, letterSpacing: "-0.02em" }}>Fonsecômetro</h3>
            <p style={{ margin: "0 0 20px", fontSize: 13, color: "rgba(255,255,255,0.55)", fontFamily: SANS, lineHeight: 1.6 }}>
              Mede a temperatura do João Fonseca com base nas últimas 10 partidas. Quanto mais vitórias, mais quente!
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {SCALE.map(function(s) {
                return (
                  <div key={s.range} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: s.color, fontFamily: SANS, width: 52, flexShrink: 0 }}>{s.range}</span>
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", fontFamily: SANS }}>{s.label}</span>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: 20, padding: "12px 14px", background: "rgba(255,255,255,0.04)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontFamily: SANS }}>Agora: {wins}V {total - wins}D nas últimas {total}</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: temp.color, fontFamily: SANS }}>{pct}%</span>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
