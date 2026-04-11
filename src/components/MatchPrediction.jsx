import { useState, useEffect } from 'react';
import { GREEN, RED, BG_ALT, TEXT, SUB, DIM, BORDER, SANS, SERIF } from '../lib/constants';

export default function MatchPrediction(props) {
  var match = props.match;
  if (!match || !match.date) return null;
  var matchDate = new Date(match.date); var now = new Date();
  if (now > matchDate) return null;
  var oppName = match.opponent_name || "A definir";
  var oppShort = oppName.length > 12 ? oppName.split(" ").pop() : oppName;
  var matchId = (match.event_id || (match.tournament_name || "") + "_" + (match.date || "").split("T")[0] + "_" + (match.opponent_name || "") || "match").toString().replace(/[^a-zA-Z0-9]/g, "_");
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
}
