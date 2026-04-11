import { GREEN, YELLOW, DIM, SANS, SERIF, surfaceColorMap } from '../lib/constants';

export default function LiveScoreCard(props) {
  var data = props.data;
  if (!data || !data.live) return null;

  var opponent = data.opponent || {};
  var score = data.score || {};
  var stats = data.stats || {};
  var fSets = score.fonseca_sets || [];
  var oSets = score.opponent_sets || [];
  var setsWon = score.sets_won || {};
  var currentGame = score.current_game || {};
  var serving = score.serving || "";

  var oppName = opponent.name || "Oponente";
  var oppShort = oppName.length > 12 ? oppName.split(" ").pop() : oppName;

  var tourneyName = data.tournament || "";
  var surface = data.surface || "";
  var sc = surfaceColorMap[surface] || "#999";
  var statusText = data.status || "Ao vivo";
  var roundText = data.round || "";

  var fStats = stats.fonseca || {};
  var oStats = stats.opponent || {};

  var fST = (fStats.firstserveaccuracy || fStats.first_serve_accuracy || 0) + (fStats.secondserveaccuracy || fStats.second_serve_accuracy || 0) + (fStats.doublefaults || fStats.double_faults || 0);
  var oST = (oStats.firstserveaccuracy || oStats.first_serve_accuracy || 0) + (oStats.secondserveaccuracy || oStats.second_serve_accuracy || 0) + (oStats.doublefaults || oStats.double_faults || 0);
  var liveStatRows = [
    { label: "Aces", f: fStats.aces || 0, o: oStats.aces || 0 },
    { label: "D. Faltas", f: fStats.doublefaults || fStats.double_faults || 0, o: oStats.doublefaults || oStats.double_faults || 0, invert: true },
    { label: "1o Saque %", f: fST > 0 ? Math.round((fStats.firstserveaccuracy || fStats.first_serve_accuracy || 0)/fST*100) : 0, o: oST > 0 ? Math.round((oStats.firstserveaccuracy || oStats.first_serve_accuracy || 0)/oST*100) : 0, pct: true },
    { label: "Winners", f: fStats.winners || 0, o: oStats.winners || 0 },
    { label: "Break Points", f: fStats.breakpointsscored || fStats.break_points_scored || 0, o: oStats.breakpointsscored || oStats.break_points_scored || 0 },
    { label: "Pontos", f: (fStats.servicepointsscored || fStats.service_points_scored || 0) + (fStats.receiverpointsscored || fStats.receiver_points_scored || 0) || fStats.pointstotal || fStats.points_total || 0, o: (oStats.servicepointsscored || oStats.service_points_scored || 0) + (oStats.receiverpointsscored || oStats.receiver_points_scored || 0) || oStats.pointstotal || oStats.points_total || 0 },
  ].filter(function(r) { return r.f > 0 || r.o > 0; });

  return (
    <section style={{ margin: "4px 0 0", padding: "20px 24px", background: "linear-gradient(145deg, #0D1726 0%, #1a3050 100%)", borderRadius: 20, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 16, right: 20, display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", animation: "pulse 1.5s ease-in-out infinite", display: "inline-block" }} />
        <span style={{ fontSize: 10, fontWeight: 700, color: "#ef4444", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.08em" }}>Ao vivo</span>
      </div>

      <div style={{ textAlign: "center", marginBottom: 16 }}>
        {surface && <span style={{ fontSize: 10, fontWeight: 700, color: sc, fontFamily: SANS }}>{surface}</span>}
        {tourneyName && <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: SANS }}>{surface ? " · " : ""}{tourneyName}</span>}
        {roundText && <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: SANS }}> · {roundText}</span>}
        <div style={{ marginTop: 4 }}><span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontFamily: SANS }}>{statusText}</span></div>
      </div>

      <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 12, padding: "16px 20px", marginBottom: liveStatRows.length > 0 ? 16 : 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: GREEN, fontFamily: SERIF }}>J. Fonseca</span>
            {serving === "fonseca" && <span style={{ width: 6, height: 6, borderRadius: "50%", background: YELLOW, display: "inline-block" }} />}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {serving === "opponent" && <span style={{ width: 6, height: 6, borderRadius: "50%", background: YELLOW, display: "inline-block" }} />}
            <span style={{ fontSize: 15, fontWeight: 700, color: "#fff", fontFamily: SERIF }}>{oppShort}</span>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {fSets.map(function(s, i) {
              var won = (oSets[i] !== undefined) ? s > oSets[i] : false;
              var isCurrentSet = i === fSets.length - 1 && !((setsWon.fonseca || 0) + (setsWon.opponent || 0) >= 2);
              return (<span key={i} style={{ fontSize: 22, fontWeight: 800, color: won ? GREEN : (isCurrentSet ? "#fff" : "rgba(255,255,255,0.5)"), fontFamily: SANS }}>{s}</span>);
            })}
            {currentGame.fonseca !== undefined && currentGame.fonseca !== "" && <span style={{ fontSize: 16, fontWeight: 600, color: YELLOW, fontFamily: SANS, marginLeft: 6 }}>{currentGame.fonseca}</span>}
          </div>
          <div style={{ textAlign: "center" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.15)", fontFamily: SANS }}>SETS</span>
            <div style={{ fontSize: 14, fontWeight: 800, color: "rgba(255,255,255,0.3)", fontFamily: SANS, marginTop: 2 }}>{(setsWon.fonseca || 0)} - {(setsWon.opponent || 0)}</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {currentGame.opponent !== undefined && currentGame.opponent !== "" && <span style={{ fontSize: 16, fontWeight: 600, color: YELLOW, fontFamily: SANS, marginRight: 6 }}>{currentGame.opponent}</span>}
            {oSets.map(function(s, i) {
              var won = (fSets[i] !== undefined) ? s > fSets[i] : false;
              var isCurrentSet = i === oSets.length - 1 && !((setsWon.fonseca || 0) + (setsWon.opponent || 0) >= 2);
              return (<span key={i} style={{ fontSize: 22, fontWeight: 800, color: won ? "#ef4444" : (isCurrentSet ? "#fff" : "rgba(255,255,255,0.5)"), fontFamily: SANS }}>{s}</span>);
            })}
          </div>
        </div>
      </div>

      {liveStatRows.length > 0 && (
        <div style={{ padding: "0 4px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: GREEN, fontFamily: SANS }}>Fonseca</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.4)", fontFamily: SANS }}>{oppShort}</span>
          </div>
          {liveStatRows.map(function(row, i) {
            var fBetter = row.invert ? row.f < row.o : row.f >= row.o;
            return (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: fBetter ? GREEN : "rgba(255,255,255,0.4)", fontFamily: SANS, width: 30 }}>{row.pct ? row.f + "%" : row.f}</span>
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontFamily: SANS, textAlign: "center", flex: 1 }}>{row.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: !fBetter ? "#ef4444" : "rgba(255,255,255,0.4)", fontFamily: SANS, width: 30, textAlign: "right" }}>{row.pct ? row.o + "%" : row.o}</span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
