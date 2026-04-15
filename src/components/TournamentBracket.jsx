import { GREEN, RED, TEXT, SUB, DIM, SANS, SERIF } from '../lib/constants';

var ROUND_ORDER = ["1ª rodada", "2ª rodada", "3ª rodada", "16avos de final", "Oitavas de final", "Quartas de final", "Semifinal", "Final"];
var ROUND_SHORT = { "1ª rodada": "R1", "2ª rodada": "R2", "3ª rodada": "R3", "16avos de final": "16avos", "Oitavas de final": "Oitavas", "Quartas de final": "QF", "Semifinal": "SF", "Final": "Final" };

function roundIndex(round) {
  if (!round) return -1;
  var idx = ROUND_ORDER.indexOf(round);
  if (idx >= 0) return idx;
  var low = round.toLowerCase();
  for (var i = 0; i < ROUND_ORDER.length; i++) {
    if (ROUND_ORDER[i].toLowerCase().includes(low) || low.includes(ROUND_ORDER[i].toLowerCase())) return i;
  }
  return -1;
}

function matchesTournament(formTournament, tournName) {
  if (!formTournament || !tournName) return false;
  var a = formTournament.toLowerCase().split(",")[0].trim();
  var b = tournName.toLowerCase().split(",")[0].trim();
  return a.includes(b) || b.includes(a);
}

// For ATP 500 with 32 draw: rounds are R1→R2(16avos)→QF→SF→F
// For Masters 1000 with 64 draw: R1→R2→R3→R4(16avos)→QF→SF→F
// For Grand Slam with 128: R1→R2→R3→R4→QF→SF→F
function inferRounds(matches, category) {
  if (!matches || matches.length === 0) return matches;
  var roundsByCategory = {
    "ATP 250": ["1ª rodada", "2ª rodada", "Quartas de final", "Semifinal", "Final"],
    "ATP 500": ["1ª rodada", "Oitavas de final", "Quartas de final", "Semifinal", "Final"],
    "Masters 1000": ["1ª rodada", "2ª rodada", "3ª rodada", "Oitavas de final", "Quartas de final", "Semifinal", "Final"],
    "Grand Slam": ["1ª rodada", "2ª rodada", "3ª rodada", "Oitavas de final", "Quartas de final", "Semifinal", "Final"],
  };
  var rounds = roundsByCategory[category] || roundsByCategory["ATP 500"];
  return matches.map(function(m, i) {
    if (m.round && m.round.length > 0) return m;
    var inferred = Object.assign({}, m);
    if (i < rounds.length) inferred.round = rounds[i];
    return inferred;
  });
}

export default function TournamentBracket(props) {
  var recentForm = props.recentForm || [];
  var lastMatch = props.lastMatch;
  var nextMatch = props.nextMatch;

  var tournName = null;
  var category = "";
  if (nextMatch && nextMatch.tournament_name) { tournName = nextMatch.tournament_name; category = nextMatch.tournament_category || ""; }
  else if (lastMatch && lastMatch.tournament_name) { tournName = lastMatch.tournament_name; category = lastMatch.tournament_category || ""; }
  if (!tournName) return <p style={{ fontSize: 13, color: SUB, fontFamily: SANS, textAlign: "center", padding: 20 }}>Nenhum torneio em andamento</p>;

  var tournMatches = recentForm.filter(function(m) {
    return matchesTournament(m.tournament, tournName);
  }).slice().reverse();

  tournMatches = inferRounds(tournMatches, category);

  var steps = [];

  tournMatches.forEach(function(m) {
    steps.push({
      round: m.round || "",
      roundShort: ROUND_SHORT[m.round] || m.round || "",
      opponent: m.opponent_name,
      ranking: m.opponent_ranking,
      score: m.score,
      result: m.result,
      status: m.result === "V" ? "win" : "loss",
    });
  });

  if (nextMatch && nextMatch.opponent_name && matchesTournament(nextMatch.tournament_name, tournName)) {
    var alreadyShown = steps.some(function(s) { return s.opponent === nextMatch.opponent_name && s.status !== "next"; });
    if (!alreadyShown) {
      steps.push({
        round: nextMatch.round || "Próxima rodada",
        roundShort: ROUND_SHORT[nextMatch.round] || nextMatch.round || "Próx",
        opponent: nextMatch.opponent_name,
        ranking: nextMatch.opponent_ranking,
        score: null,
        result: null,
        status: "next",
      });
    }
  }

  var lastStep = steps.length > 0 ? steps[steps.length - 1] : null;
  var isEliminated = lastStep && lastStep.status === "loss";
  var isActive = !isEliminated;

  if (isActive && lastStep) {
    var lastRI = roundIndex(lastStep.round);
    var remaining = ROUND_ORDER.filter(function(r) { return roundIndex(r) > lastRI; });
    remaining.slice(0, 2).forEach(function(r) {
      if (!steps.some(function(s) { return s.round === r; })) {
        steps.push({ round: r, roundShort: ROUND_SHORT[r] || r, opponent: null, score: null, result: null, status: "future" });
      }
    });
  }

  if (steps.length === 0) return <p style={{ fontSize: 13, color: SUB, fontFamily: SANS, textAlign: "center", padding: 20 }}>Sem partidas neste torneio</p>;

  var surface = (lastMatch && lastMatch.surface) || (nextMatch && nextMatch.surface) || "";
  var surfaceMap = { "Clay": "Saibro", "Hard": "Duro", "Grass": "Grama" };

  return (
    <div style={{ padding: "4px 0 8px" }}>
      <div style={{ textAlign: "center", marginBottom: 14 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: DIM, fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {category}{surface ? " · " + (surfaceMap[surface] || surface) : ""}
        </span>
      </div>

      <div style={{ position: "relative", paddingLeft: 22 }}>
        <div style={{ position: "absolute", left: 9, top: 14, bottom: 14, width: 2, background: "#eaeaea", borderRadius: 1 }} />

        {steps.map(function(r, i) {
          var isWin = r.status === "win";
          var isLoss = r.status === "loss";
          var isNext = r.status === "next";
          var isFuture = r.status === "future";
          var dotColor = isWin ? GREEN : (isLoss ? "#ef4444" : (isNext ? "#3B82F6" : "#d4d4d4"));

          return (
            <div key={i} style={{ position: "relative", marginBottom: i < steps.length - 1 ? 6 : 0, paddingLeft: 18 }}>
              <div style={{ position: "absolute", left: -13, top: 12, width: isFuture ? 8 : 10, height: isFuture ? 8 : 10, borderRadius: "50%", background: isFuture ? "#fff" : dotColor, border: "2px solid " + dotColor, zIndex: 1 }} />

              <div style={{ padding: "10px 14px", background: isNext ? "#EFF6FF" : (isFuture ? "#FAFAFA" : "#fff"), borderRadius: 12, border: "1px solid " + (isNext ? "#BFDBFE" : "#f0f0f0"), boxShadow: isNext ? "0 1px 4px rgba(59,130,246,0.08)" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: isNext ? "#3B82F6" : (isFuture ? DIM : SUB), fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    {r.round}
                  </span>
                  {r.score && <span style={{ fontSize: 13, fontWeight: 800, color: isWin ? GREEN : "#ef4444", fontFamily: SANS }}>{r.score}</span>}
                  {isNext && !r.score && <span style={{ fontSize: 10, fontWeight: 700, color: "#3B82F6", fontFamily: SANS, background: "#DBEAFE", padding: "2px 8px", borderRadius: 99 }}>Próximo</span>}
                  {isFuture && <span style={{ fontSize: 10, color: DIM, fontFamily: SANS }}>—</span>}
                </div>
                {r.opponent ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                    {(isWin || isLoss) && <span style={{ fontSize: 11, fontWeight: 800, color: isWin ? GREEN : "#ef4444", fontFamily: SANS, width: 14 }}>{isWin ? "V" : "D"}</span>}
                    <span style={{ fontSize: 14, fontWeight: 700, color: TEXT, fontFamily: SERIF }}>{r.opponent}</span>
                    {r.ranking && <span style={{ fontSize: 10, fontWeight: 600, color: DIM, fontFamily: SANS }}>#{r.ranking}</span>}
                  </div>
                ) : (
                  <span style={{ fontSize: 12, color: DIM, fontFamily: SANS, fontStyle: "italic", marginTop: 2, display: "block" }}>A definir</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isEliminated && (
        <div style={{ textAlign: "center", marginTop: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: SUB, fontFamily: SANS, background: "#f5f5f5", padding: "4px 14px", borderRadius: 99 }}>
            Eliminado — {steps.filter(function(s) { return s.status === "win"; }).length}V {steps.filter(function(s) { return s.status === "loss"; }).length}D
          </span>
        </div>
      )}
    </div>
  );
}
