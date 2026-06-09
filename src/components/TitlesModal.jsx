// TitlesModal — deduplica os dois modais "Conquistas" hardcoded (estavam em
// index.jsx e sobre.jsx, identicos). Le do KV via props.achievements; se a
// lista ainda nao chegou (primeiro render), usa o SEED como fallback pra nao
// ficar vazio. Visual identico ao original.
import { GREEN, TEXT, SUB, DIM, SANS, SERIF } from "../lib/constants";
import { SEED_ACHIEVEMENTS, groupForModal } from "../lib/achievements";

var SECTION_COLORS = { Slam: GREEN, Singles: GREEN, Duplas: GREEN, NextGen: "#b8860b", Challenger: SUB };
var SECTION_LABELS = {
  Slam: "Grand Slam", Singles: "ATP Tour — Singles", Duplas: "ATP Tour — Duplas",
  NextGen: "NextGen ATP Finals", Challenger: "ATP Challenger",
};
var ORDER = ["Slam", "Singles", "Duplas", "NextGen", "Challenger"];

function Item(props) {
  var a = props.a;
  var sm = props.small;
  return (
    <div style={{ padding: sm ? "8px 0" : "10px 0", borderBottom: "1px solid #f0f0f0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
        <span style={{ fontSize: sm ? 13 : 14, fontWeight: sm ? 600 : 700, color: TEXT, fontFamily: sm ? SANS : SERIF }}>{a.t}</span>
        <span style={{ fontSize: 11, color: DIM, fontFamily: SANS }}>{a.d}</span>
      </div>
      {a.det && <p style={{ margin: 0, fontSize: sm ? 11 : 12, color: SUB, fontFamily: SANS }}>{a.det}</p>}
      {a.note && <p style={{ margin: "4px 0 0", fontSize: 11, color: GREEN, fontFamily: SANS, fontWeight: 600 }}>{a.note}</p>}
    </div>
  );
}

export default function TitlesModal(props) {
  var list = props.achievements && props.achievements.length > 0 ? props.achievements : SEED_ACHIEVEMENTS;
  var groups = groupForModal(list);
  return (
    <div>
      {ORDER.map(function (key, idx) {
        var items = groups[key];
        if (!items || items.length === 0) return null;
        var small = (key === "Challenger");
        return (
          <div key={key}>
            {idx > 0 && <div style={{ height: 1, background: "#e8e8e8", margin: "14px 0" }} />}
            <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: SECTION_COLORS[key], fontFamily: SANS }}>
              {SECTION_LABELS[key]}
            </p>
            {items.map(function (a, i) { return <Item key={a.id || i} a={a} small={small} />; })}
          </div>
        );
      })}
    </div>
  );
}
