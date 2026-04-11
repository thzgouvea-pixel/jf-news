import { useState } from "react";
import { SANS, SERIF, DIM } from "../lib/constants";

function getTemperature(wins, total) {
  var pct = total > 0 ? Math.round((wins / total) * 100) : 0;
  if (pct >= 90) return { color: "#22C55E" };
  if (pct >= 70) return { color: "#4ADE80" };
  if (pct >= 50) return { color: "#EAB308" };
  if (pct >= 30) return { color: "#F97316" };
  return { color: "#60A5FA" };
}

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
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
        <span onClick={function(){ setShowInfo(true); }} style={{ fontSize: 10, fontWeight: 700, color: DIM, fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0, cursor: "pointer", borderBottom: "1px dashed rgba(156,163,175,0.4)", paddingBottom: 1 }}>Fonsecômetro</span>
        <div style={{ flex: 1, height: 4, background: "rgba(0,0,0,0.06)", borderRadius: 2, overflow: "hidden" }}>
          <div style={{ height: 4, borderRadius: 2, width: pct + "%", background: temp.color, transition: "width 1s ease" }} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 800, color: temp.color, fontFamily: SANS, flexShrink: 0 }}>{pct}%</span>
      </div>

      {showInfo && (
        <div onClick={function(){ setShowInfo(false); }} style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, animation: "fadeInO 0.2s ease" }}>
          <div onClick={function(e){ e.stopPropagation(); }} style={{ background: "#111827", borderRadius: 18, padding: "24px 22px 22px", maxWidth: 300, width: "100%", animation: "slideU 0.25s ease" }}>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: "#fff", fontFamily: SERIF }}>Fonsecômetro</span>
              <button onClick={function(){ setShowInfo(false); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>

            <p style={{ margin: "0 0 16px", fontSize: 13, color: "rgba(255,255,255,0.5)", fontFamily: SANS, lineHeight: 1.5 }}>
              Temperatura do João nas últimas 10 partidas. Mais vitórias = mais quente.
            </p>

            <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
              {[
                { color: "#4ADE80", label: "Quente" },
                { color: "#EAB308", label: "Morno" },
                { color: "#F97316", label: "Frio" },
                { color: "#60A5FA", label: "Gelado" },
              ].map(function(s) {
                return (
                  <div key={s.label} style={{ flex: 1, textAlign: "center" }}>
                    <div style={{ height: 4, borderRadius: 2, background: s.color, marginBottom: 6 }} />
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontFamily: SANS }}>{s.label}</span>
                  </div>
                );
              })}
            </div>

            <div style={{ padding: "10px 12px", background: "rgba(255,255,255,0.05)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontFamily: SANS }}>{wins}V {total - wins}D — últimas {total}</span>
              <span style={{ fontSize: 15, fontWeight: 800, color: temp.color, fontFamily: SANS }}>{pct}%</span>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
