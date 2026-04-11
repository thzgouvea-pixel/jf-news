import { GREEN, RED, BG_ALT, TEXT, DIM, BORDER, SANS, SERIF } from '../lib/constants';

export default function NextGenComparator(props) {
  var currentRanking = props.currentRanking || null;
  var players = [
    { name: "J. Fonseca", country: "🇧🇷", age: 19, ranking: currentRanking || "—", titles: 2, style: "Agressivo", forehand: 95, serve: 88, movement: 85, mental: 90, color: GREEN },
    { name: "L. Tien", country: "🇺🇸", age: 20, ranking: 21, titles: 1, style: "Contra-atacante", forehand: 82, serve: 80, movement: 92, mental: 88, color: RED },
    { name: "J. Mensik", country: "🇨🇿", age: 19, ranking: 30, titles: 2, style: "Saque e voleio", forehand: 85, serve: 94, movement: 78, mental: 82, color: "#3B82F6" },
    { name: "A. Fils", country: "🇫🇷", age: 20, ranking: 28, titles: 2, style: "Completo", forehand: 88, serve: 86, movement: 90, mental: 84, color: "#8B5CF6" },
  ];
  var StatBar = function(p) { return (<div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}><span style={{ fontSize: 10, color: DIM, fontFamily: SANS, width: 55, textAlign: "right" }}>{p.label}</span><div style={{ flex: 1, height: 4, background: "#f0f0f0", borderRadius: 2 }}><div style={{ height: 4, background: p.color, borderRadius: 2, width: p.value + "%", transition: "width 0.5s" }} /></div><span style={{ fontSize: 10, fontWeight: 700, color: p.color, fontFamily: SANS, width: 24 }}>{p.value}</span></div>); };
  return (
    <div style={{ padding: "16px 0" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
        {players.map(function(p, i) { return (<div key={i} style={{ padding: "14px", background: i === 0 ? GREEN + "06" : BG_ALT, border: "1px solid " + (i === 0 ? GREEN + "15" : BORDER), borderRadius: 14 }}><div style={{ textAlign: "center", marginBottom: 10 }}><span style={{ fontSize: 20 }}>{p.country}</span><p style={{ margin: "4px 0 2px", fontSize: 15, fontWeight: 700, color: TEXT, fontFamily: SERIF }}>{p.name}</p><span style={{ fontSize: 12, fontWeight: 700, color: p.color, fontFamily: SANS }}>{"#" + p.ranking}</span></div><div style={{ fontSize: 10, color: DIM, fontFamily: SANS, textAlign: "center", marginBottom: 8 }}>{p.age + " anos · " + p.titles + " títulos · " + p.style}</div><StatBar label="Forehand" value={p.forehand} color={p.color} /><StatBar label="Saque" value={p.serve} color={p.color} /><StatBar label="Movim." value={p.movement} color={p.color} /><StatBar label="Mental" value={p.mental} color={p.color} /></div>); })}
      </div>
    </div>
  );
}
