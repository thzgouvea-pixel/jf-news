import { GREEN, RED, TEXT, DIM, SANS, SERIF, BORDER } from '../lib/constants';

export default function Fonsecometro(props) {
  var recentForm = props.recentForm;
  if (!recentForm || recentForm.length === 0) return null;

  var last10 = recentForm.slice(-10);
  var wins = last10.filter(function(m) { return m.result === "V"; }).length;
  var losses = last10.length - wins;
  var pct = last10.length > 0 ? Math.round((wins / last10.length) * 100) : 0;
  var total = wins + losses;
  var wPct = total > 0 ? Math.max(Math.round((wins / total) * 100), 5) : 50;
  var lPct = 100 - wPct;

  var emoji = pct >= 80 ? "🔥" : (pct >= 60 ? "😎" : (pct >= 40 ? "😐" : "😤"));

  return (
    <div style={{ background: "linear-gradient(160deg, #0a1220 0%, #111d33 40%, #0d1828 100%)", borderRadius: 16, padding: "16px 20px", boxShadow: "0 2px 12px rgba(10,18,32,0.15)" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: GREEN, fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.08em" }}>Fonsecômetro</span>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: SANS }}>Últimas {last10.length} partidas</span>
        </div>
        <span style={{ fontSize: 18 }}>{emoji}</span>
      </div>

      {/* Big percentage */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 28, fontWeight: 900, color: pct >= 50 ? GREEN : "#ef4444", fontFamily: SANS, lineHeight: 1 }}>{pct}%</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)", fontFamily: SANS }}>{wins}V {losses}D</span>
      </div>

      {/* Bar — green vs red like stat bars */}
      <div style={{ display: "flex", height: 6, borderRadius: 3, overflow: "hidden", gap: 1, marginBottom: 14 }}>
        <div style={{ width: wPct + "%", height: 6, background: "linear-gradient(90deg, " + GREEN + ", #34D399)", borderRadius: "3px 0 0 3px", transition: "width 0.8s ease" }} />
        <div style={{ width: lPct + "%", height: 6, background: "linear-gradient(90deg, #EF4444, #F87171)", borderRadius: "0 3px 3px 0", transition: "width 0.8s ease" }} />
      </div>

      {/* Match dots */}
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {last10.map(function(m, i) {
          var w = m.result === "V";
          return (
            <div key={i} title={m.opponent_name + " " + m.score} style={{ flex: 1, height: 22, borderRadius: 4, background: w ? GREEN + "15" : "#ef4444" + "15", border: "1px solid " + (w ? GREEN + "30" : "#ef4444" + "30"), display: "flex", alignItems: "center", justifyContent: "center", cursor: "default" }}>
              <span style={{ fontSize: 8, fontWeight: 700, color: w ? GREEN : "#ef4444", fontFamily: SANS }}>{w ? "V" : "D"}</span>
            </div>
          );
        })}
        {/* Placeholders for missing matches to reach 10 */}
        {Array.from({ length: Math.max(0, 10 - last10.length) }).map(function(_, i) {
          return (
            <div key={"p" + i} style={{ flex: 1, height: 22, borderRadius: 4, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 8, color: "rgba(255,255,255,0.1)", fontFamily: SANS }}>—</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
