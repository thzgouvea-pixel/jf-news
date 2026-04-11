import { GREEN, RED, DIM, BORDER, SANS } from '../lib/constants';

export default function WinProbBar(props) {
  var winProb = props.winProb;
  if (!winProb || !winProb.fonseca) return null;

  var fPct = winProb.fonseca != null ? Math.round(winProb.fonseca) : 0;
  var oPct = winProb.opponent != null ? Math.round(winProb.opponent) : (100 - fPct);
  var oppName = (winProb.opponent_name || "Oponente").split(" ").pop();

  return (
    <div style={{ padding: "12px 0", borderBottom: "1px solid " + BORDER }}>
      <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: DIM, fontFamily: SANS, display: "block", marginBottom: 8 }}>Probabilidade de vitória</span>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: fPct >= oPct ? GREEN : DIM, fontFamily: SANS }}>Fonseca {fPct}%</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: oPct > fPct ? RED : DIM, fontFamily: SANS }}>{oppName} {oPct}%</span>
      </div>
      <div style={{ display: "flex", height: 6, borderRadius: 3, overflow: "hidden", gap: 2 }}>
        <div style={{ width: fPct + "%", background: GREEN, borderRadius: "3px 0 0 3px", transition: "width 0.8s ease" }} />
        <div style={{ width: oPct + "%", background: RED, borderRadius: "0 3px 3px 0", transition: "width 0.8s ease" }} />
      </div>
    </div>
  );
}
