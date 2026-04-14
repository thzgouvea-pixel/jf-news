import { useState } from "react";
import { SANS, SERIF, GREEN } from "../lib/constants";

function calcHype(recentForm) {
  if (!recentForm || recentForm.length === 0) return { pct: 50, mood: "Sem dados", emoji: "⚖️" };
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

  var mood;
  if (pct >= 90) mood = "Imparável";
  else if (pct >= 80) mood = "Em grande fase";
  else if (pct >= 70) mood = "Moral em alta";
  else if (pct >= 60) mood = "Confiante";
  else if (pct >= 50) mood = "Estável";
  else if (pct >= 40) mood = "Oscilando";
  else if (pct >= 30) mood = "Buscando ritmo";
  else mood = "Fase de adaptação";

  return { pct: pct, mood: mood };
}

export default function Fonsecometro({ recentForm }) {
  if (!recentForm || recentForm.length === 0) return null;
  var _show = useState(false); var showPopup = _show[0]; var setShowPopup = _show[1];
  var h = calcHype(recentForm);

  var barColor = h.pct >= 70 ? "#22C55E" : (h.pct >= 50 ? "#EAB308" : (h.pct >= 30 ? "#F97316" : "#60A5FA"));

  var wins = recentForm.slice(0, 10).filter(function(m) { return (m.result || "").toUpperCase() === "V"; }).length;
  var losses = recentForm.slice(0, 10).length - wins;

  return (
    <>
      <div style={{ margin: 0, padding: "12px 18px", background: "linear-gradient(135deg, #0d1520 0%, #111d33 100%)", position: "relative", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <button onClick={function(){ setShowPopup(true); }} onTouchStart={function(){ setShowPopup(true); }} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: barColor, fontFamily: SERIF, letterSpacing: "-0.01em" }}>Fonsecômetro</span>
            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", fontFamily: SANS }}>?</span>
          </button>
          <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)", fontFamily: SANS }}>{h.mood}</span>
        </div>

        <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
          <div style={{ height: 5, borderRadius: 3, width: h.pct + "%", background: "linear-gradient(90deg, " + barColor + "80, " + barColor + ")", boxShadow: "0 0 8px " + barColor + "30", transition: "width 1.2s ease" }} />
        </div>
      </div>

      {showPopup && (
        <div onClick={function(){ setShowPopup(false); }} style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={function(e){ e.stopPropagation(); }} style={{ background: "#111827", borderRadius: 20, padding: "28px 24px", maxWidth: 360, width: "100%", position: "relative" }}>
            <button onClick={function(){ setShowPopup(false); }} style={{ position: "absolute", top: 12, right: 12, background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
            <h3 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 800, color: "#fff", fontFamily: SERIF }}>O que é o Fonsecômetro?</h3>
            <p style={{ margin: "0 0 16px", fontSize: 13, color: "rgba(255,255,255,0.7)", fontFamily: SANS, lineHeight: 1.6 }}>
              Um indicador exclusivo do Fonseca News que mede o momento atual do João baseado nos resultados recentes, qualidade dos adversários e peso de cada partida.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              {[
                { color: "#22C55E", label: "70%+", desc: "Em alta — vitórias consistentes" },
                { color: "#EAB308", label: "50-69%", desc: "Estável — resultados mistos" },
                { color: "#F97316", label: "30-49%", desc: "Oscilando — buscando ritmo" },
                { color: "#60A5FA", label: "0-29%", desc: "Fase de adaptação" },
              ].map(function(s, i) {
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 5, borderRadius: 3, background: s.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontFamily: SANS }}>{s.label} — {s.desc}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "12px 16px", textAlign: "center" }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: SANS, display: "block", marginBottom: 4 }}>Momento atual</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: barColor, fontFamily: SERIF }}>{h.mood}</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: SANS, display: "block", marginTop: 4 }}>{wins}V {losses}D nas últimas {recentForm.slice(0, 10).length}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
