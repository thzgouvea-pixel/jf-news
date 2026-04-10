import { useState, useEffect, useRef } from 'react';
import { SANS, surfaceColorMap } from '../lib/constants';

export default function TournamentFactsCarousel(props) {
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

        {!paused && cleanFacts.length > 1 && (
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: "rgba(255,255,255,0.03)" }}>
            <div style={{ height: 2, background: "#4FC3F730", borderRadius: 1, animation: "factProgress 5s linear infinite" }} />
          </div>
        )}
      </div>
    </section>
  );
}
