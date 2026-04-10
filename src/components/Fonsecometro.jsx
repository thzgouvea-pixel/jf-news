import { SANS } from '../lib/constants';

// Fonsecômetro — rolling win% over last N matches as a mini line chart
// Each point = cumulative win% up to that match (oldest→newest, left→right)
// Green when hot, red when cold, emoji at the end

export default function Fonsecometro(props) {
  var recentForm = props.recentForm;
  var lastMatch = props.lastMatch;

  // Build match list: recentForm + lastMatch (deduplicated)
  var matches = [];
  if (recentForm && recentForm.length > 0) {
    recentForm.forEach(function(m) { matches.push(m); });
  }
  // Add lastMatch if not already in the list
  if (lastMatch && lastMatch.result) {
    var isDupe = matches.some(function(m) {
      return m.opponent_name === lastMatch.opponent_name && m.score === lastMatch.score;
    });
    if (!isDupe) matches.push({ result: lastMatch.result, opponent_name: lastMatch.opponent_name, score: lastMatch.score });
  }

  if (matches.length < 2) return null;

  // Take last 10, oldest first
  var last10 = matches.slice(-10);

  // Calculate rolling win% at each point
  var points = [];
  var wins = 0;
  for (var i = 0; i < last10.length; i++) {
    if (last10[i].result === "V") wins++;
    var pct = Math.round((wins / (i + 1)) * 100);
    points.push(pct);
  }

  var currentPct = points[points.length - 1];

  // Emoji based on current form
  var emoji = "😐";
  if (currentPct >= 80) emoji = "🔥";
  else if (currentPct >= 60) emoji = "😎";
  else if (currentPct >= 50) emoji = "💪";
  else if (currentPct >= 40) emoji = "😐";
  else if (currentPct >= 20) emoji = "😰";
  else emoji = "🥶";

  // Color based on current pct (green → yellow → red)
  function getColor(pct) {
    if (pct >= 70) return "#22C55E";
    if (pct >= 50) return "#F59E0B";
    if (pct >= 30) return "#F97316";
    return "#EF4444";
  }
  var lineColor = getColor(currentPct);

  // SVG dimensions
  var W = 280;
  var H = 32;
  var padX = 4;
  var padY = 6;
  var chartW = W - padX * 2;
  var chartH = H - padY * 2;

  // Build path
  var pathParts = [];
  for (var j = 0; j < points.length; j++) {
    var x = padX + (points.length > 1 ? (j / (points.length - 1)) * chartW : chartW / 2);
    var y = padY + chartH - (points[j] / 100) * chartH;
    pathParts.push((j === 0 ? "M" : "L") + x.toFixed(1) + "," + y.toFixed(1));
  }
  var pathD = pathParts.join(" ");

  // Last point coordinates for dot + emoji
  var lastX = padX + (points.length > 1 ? ((points.length - 1) / (points.length - 1)) * chartW : chartW / 2);
  var lastY = padY + chartH - (currentPct / 100) * chartH;

  // Area fill path (path + close to bottom)
  var areaD = pathD + " L" + lastX.toFixed(1) + "," + (H - 1) + " L" + padX.toFixed(1) + "," + (H - 1) + " Z";

  // Label
  var label = currentPct + "%";
  var formText = wins + "V " + (last10.length - wins) + "D";

  return (
    <div style={{ padding: "0 16px 0", margin: "0 0 4px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {/* Label */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, minWidth: 0, flexShrink: 0 }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: "#9CA3AF", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>Forma</span>
          <span style={{ fontSize: 11, fontWeight: 800, color: lineColor, fontFamily: SANS }}>{label}</span>
          <span style={{ fontSize: 9, fontWeight: 600, color: "#9CA3AF", fontFamily: SANS }}>({formText})</span>
        </div>

        {/* Chart */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <svg viewBox={"0 0 " + W + " " + H} style={{ width: "100%", height: 32, display: "block" }} preserveAspectRatio="none">
            {/* Area fill */}
            <path d={areaD} fill={lineColor + "12"} />
            {/* Line */}
            <path d={pathD} fill="none" stroke={lineColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            {/* Dots */}
            {points.map(function(pct, idx) {
              var dx = padX + (points.length > 1 ? (idx / (points.length - 1)) * chartW : chartW / 2);
              var dy = padY + chartH - (pct / 100) * chartH;
              var dotColor = getColor(pct);
              var isLast = idx === points.length - 1;
              return (
                <circle key={idx} cx={dx} cy={dy} r={isLast ? 3.5 : 2} fill={isLast ? dotColor : dotColor + "80"} stroke={isLast ? "#fff" : "none"} strokeWidth={isLast ? 1.5 : 0} />
              );
            })}
          </svg>
        </div>

        {/* Emoji */}
        <span style={{ fontSize: 18, flexShrink: 0 }}>{emoji}</span>
      </div>
    </div>
  );
}
