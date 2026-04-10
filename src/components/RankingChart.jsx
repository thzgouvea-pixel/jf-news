import { GREEN, YELLOW, TEXT, DIM, SANS, SUB } from '../lib/constants';

export default function RankingChart(props) {
  var currentRanking = props.currentRanking || 40;
  var data = [
    { month: "Dez/24", rank: 145, label: "NextGen" }, { month: "Jan/25", rank: 113, label: "Canberra" },
    { month: "Fev/25", rank: 68, label: "1º título" }, { month: "Mar/25", rank: 55, label: "Phoenix" },
    { month: "Mai/25", rank: 49, label: "" }, { month: "Jul/25", rank: 42, label: "Wimbledon R3" },
    { month: "Ago/25", rank: 35, label: "Top 40" }, { month: "Out/25", rank: 24, label: "Basel 500 🏆" },
    { month: "Jan/26", rank: 29, label: "" }, { month: "Mar/26", rank: currentRanking, label: "Atual" },
  ];
  var W = 600; var H = 260; var padL = 45; var padR = 20; var padT = 30; var padB = 50;
  var chartW = W - padL - padR; var chartH = H - padT - padB;
  var maxRank = 160; var minRank = 10; var rankRange = maxRank - minRank;
  var getX = function(i) { return padL + (i / (data.length - 1)) * chartW; };
  var getY = function(rank) { return padT + ((rank - minRank) / rankRange) * chartH; };
  var points = data.map(function(d, i) { return getX(i) + "," + getY(d.rank); });
  var linePath = "M" + points.join("L");
  var areaPath = linePath + "L" + getX(data.length - 1) + "," + (padT + chartH) + "L" + padL + "," + (padT + chartH) + "Z";
  return (
    <div style={{ padding: "20px 0", overflowX: "auto" }}>
      <svg viewBox={"0 0 " + W + " " + H} style={{ width: "100%", maxWidth: W, height: "auto" }}>
        {[20, 50, 100, 150].map(function(rank) { var y = getY(rank); return (<g key={rank}><line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#f0f0f0" strokeWidth="1" /><text x={padL - 8} y={y + 4} textAnchor="end" fill={DIM} fontSize="9" fontFamily="Inter, sans-serif">{"#" + rank}</text></g>); })}
        <defs><linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={GREEN} stopOpacity="0.12" /><stop offset="100%" stopColor={GREEN} stopOpacity="0.01" /></linearGradient></defs>
        <path d={areaPath} fill="url(#areaGrad)" />
        <path d={linePath} fill="none" stroke={GREEN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {data.map(function(d, i) { var x = getX(i); var y = getY(d.rank); var isLast = i === data.length - 1; return (<g key={i}><circle cx={x} cy={y} r={isLast ? 5 : (d.label ? 3.5 : 2.5)} fill={isLast ? YELLOW : "#fff"} stroke={isLast ? YELLOW : GREEN} strokeWidth="2" />{(d.label || isLast) && (<text x={x} y={y - 12} textAnchor="middle" fill={isLast ? YELLOW : GREEN} fontSize="10" fontWeight="700" fontFamily="Inter, sans-serif">{"#" + d.rank}</text>)}{d.label && (<text x={x} y={y - 22} textAnchor="middle" fill={SUB} fontSize="7.5" fontFamily="Inter, sans-serif" fontWeight="600">{d.label}</text>)}{(i % 2 === 0 || isLast) && (<text x={x} y={H - padB + 18} textAnchor="middle" fill={DIM} fontSize="8" fontFamily="Inter, sans-serif">{d.month}</text>)}</g>); })}
      </svg>
      <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
        {[["Maior Ascensão","+121 posições",GREEN],["Melhor Ranking","#24 ATP","#b8860b"],["Títulos","🏆 2 ATP Tour","#2563EB"]].map(function(s,i) { return (<div key={i} style={{ textAlign: "center" }}><span style={{ fontSize: 10, color: s[2], fontFamily: SANS, fontWeight: 600, display: "block" }}>{s[0]}</span><span style={{ fontSize: 13, fontWeight: 700, color: TEXT, fontFamily: SANS }}>{s[1]}</span></div>); })}
      </div>
    </div>
  );
}
