import { GREEN, RED, BG_ALT, TEXT, SUB, DIM, BORDER, SANS, SERIF, CARD_RADIUS, CARD_SHADOW, surfaceColorMap, countryFlags, FONSECA_IMG, FONSECA_IMG_FALLBACK } from '../lib/constants';
import { getATPImage, getESPNImage } from '../lib/utils';

export default function PlayerBlock(props) {
  var lastMatch = props.lastMatch;
  var matchStats = props.matchStats;
  var recentForm = props.recentForm;
  var season = props.season;
  var prizeMoney = props.prizeMoney;
  var playerRanking = props.playerRanking;
  var opponentProfile = props.opponentProfile;

  var hasAnyData = (matchStats && matchStats.fonseca) || lastMatch || (recentForm && recentForm.length > 0) || season || prizeMoney;
  if (!hasAnyData) return null;

  return (
    <div>
      {(matchStats && matchStats.fonseca || lastMatch) && (function() {
        var msValid = matchStats && matchStats.fonseca && lastMatch && lastMatch.opponent_name && matchStats.opponent_name && matchStats.opponent_name.split(" ").pop() === lastMatch.opponent_name.split(" ").pop();
        var f = msValid ? matchStats.fonseca : {};
        var o = msValid ? matchStats.opponent : {};

        // ===== DEFENSIVE STAT EXTRACTION =====
        // SofaScore may use different key names across plans/versions.
        // Try each candidate; return null if none present.
        function pick(obj, keys) {
          for (var i = 0; i < keys.length; i++) {
            var v = obj[keys[i]];
            if (v !== undefined && v !== null && v !== "") return v;
          }
          return null;
        }

        // 1º serve %
        var fServTotal = (f.firstserveaccuracy||0) + (f.secondserveaccuracy||0) + (f.doublefaults||0);
        var oServTotal = (o.firstserveaccuracy||0) + (o.secondserveaccuracy||0) + (o.doublefaults||0);
        var f1stPct = fServTotal > 0 ? Math.round((f.firstserveaccuracy||0) / fServTotal * 100) : 0;
        var o1stPct = oServTotal > 0 ? Math.round((o.firstserveaccuracy||0) / oServTotal * 100) : 0;

        // Break points converted & opportunities (directly, if provided by SofaScore)
        var fBpConv = pick(f, ["breakpointsconverted", "breakpointswon"]);
        var fBpOpp  = pick(f, ["breakpoints", "breakpointsopportunities", "breakpointsfaced", "breakpointstotal"]);
        var oBpConv = pick(o, ["breakpointsconverted", "breakpointswon"]);
        var oBpOpp  = pick(o, ["breakpoints", "breakpointsopportunities", "breakpointsfaced", "breakpointstotal"]);

        // Fallback derivation: BP converted by X = BP faced by Y minus BP saved by Y.
        // Requires `breakpointssaved` on one side AND opportunities on the other side, which is hard.
        // If we can't get opportunities, we still can derive "converted" from the counterpart's lost BPs
        // using: bpConverted(X) = bpFaced(Y) - bpSaved(Y). But bpFaced is the missing piece.
        // Pragmatic approach: only show this stat when BOTH conv AND opp are numeric AND opp > 0 on at least one side.
        var hasBp = (fBpConv !== null && fBpOpp !== null && (fBpOpp > 0 || oBpOpp > 0))
                 && (oBpConv !== null && oBpOpp !== null);

        // Winners (may or may not be in plan)
        var fWinners = pick(f, ["winners", "totalwinners", "winnersandforcedwinners"]);
        var oWinners = pick(o, ["winners", "totalwinners", "winnersandforcedwinners"]);
        var hasWinners = (fWinners !== null || oWinners !== null) && (fWinners + oWinners) > 0;

        // Unforced errors
        var fUE = pick(f, ["unforcederrors", "unforcederror"]);
        var oUE = pick(o, ["unforcederrors", "unforcederror"]);
        var hasUE = (fUE !== null || oUE !== null) && ((fUE||0) + (oUE||0)) > 0;

        // Total points — kept as last-resort filler if winners/UE absent
        var fTotalPts = (f.servicepointsscored||0) + (f.receiverpointsscored||0) || f.pointstotal || 0;
        var oTotalPts = (o.servicepointsscored||0) + (o.receiverpointsscored||0) || o.pointstotal || 0;

        // Build stat rows. Each entry either renders or is filtered out later.
        // `bp` flag marks the break-points row so we can render "X / Y" instead of plain value.
        var statRows = [
          { label: "Aces", fVal: f.aces || 0, oVal: o.aces || 0 },
        ];

        if (hasBp) {
          statRows.push({
            label: "Break points",
            fVal: fBpConv, oVal: oBpConv,
            fSecondary: fBpOpp, oSecondary: oBpOpp,
            bp: true,
            // Use conversion rate for the bar (otherwise 0/3 vs 3/4 looks visually wrong by raw numbers)
            fBarVal: fBpOpp > 0 ? (fBpConv / fBpOpp) * 100 : 0,
            oBarVal: oBpOpp > 0 ? (oBpConv / oBpOpp) * 100 : 0,
            pct: true, // sum-to-100 bar
          });
        }

        statRows.push({ label: "1\u00ba saque", fVal: f1stPct, oVal: o1stPct, pct: true });

        if (hasWinners) {
          statRows.push({ label: "Winners", fVal: fWinners || 0, oVal: oWinners || 0 });
        }
        if (hasUE) {
          // invert: fewer UE is better
          statRows.push({ label: "Erros n\u00e3o for\u00e7ados", fVal: fUE || 0, oVal: oUE || 0, invert: true });
        }

        // Fallback: if we don't have winners AND don't have UE, add Total de pontos so card has body
        if (!hasWinners && !hasUE && (fTotalPts > 0 || oTotalPts > 0)) {
          statRows.push({ label: "Total de pontos", fVal: fTotalPts, oVal: oTotalPts });
        }

        statRows = statRows.filter(function(r) { return r.fVal > 0 || r.oVal > 0 || r.fSecondary > 0 || r.oSecondary > 0; });
        var showStats = statRows.length > 0;

        var oppName = (lastMatch && lastMatch.opponent_name) || "Adv.";
        var oppShort = oppName.length > 12 ? oppName.split(" ").pop() : oppName;
        var isWin = (lastMatch && lastMatch.result) === "V";
        var oppFlag = countryFlags[(lastMatch && lastMatch.opponent_country) || ""] || "";
        var oppImg = getATPImage(oppName);
        var oppImgFallback = getESPNImage(oppName);
        var oppProfileMatch = opponentProfile && opponentProfile.name && oppName.indexOf(opponentProfile.name.split(" ").pop()) !== -1;
        var oppRanking = (lastMatch && lastMatch.opponent_ranking) || (oppProfileMatch ? opponentProfile.ranking : null);
        var formMatches = recentForm ? recentForm.slice(0, 5) : [];

        // ===== PARSE SCORE into sets =====
        var scoreStr = (lastMatch && lastMatch.score) || "";
        var sets = scoreStr.split(" ").filter(function(s) { return s.includes("-"); });
        var fSetsWon = 0; var oSetsWon = 0;
        sets.forEach(function(s) {
          var parts = s.split("-");
          var fg = parseInt(parts[0]) || 0;
          var og = parseInt(parts[1]) || 0;
          if (fg > og) fSetsWon++; else oSetsWon++;
        });

        // ===== TOURNAMENT NAME cleanup =====
        var tournament = (lastMatch && lastMatch.tournament_name) || "";
        var tournamentCategory = (lastMatch && lastMatch.tournament_category) || "";
        // Clean: "Monte Carlo, Monaco" -> "Monte Carlo"
        var tournamentClean = tournament.split(",")[0].trim();
        // Build display: "Masters 1000 \u00b7 Monte Carlo"
        var tournamentDisplay = tournamentCategory ? (tournamentCategory + " \u00b7 " + tournamentClean) : tournamentClean;

        // ===== ROUND =====
        var round = (lastMatch && lastMatch.round) || "";


        // ===== SURFACE =====
        var surface = (lastMatch && lastMatch.surface) || "";
        var surfaceTranslateMap = { "Clay": "Saibro", "Hard": "Duro", "Grass": "Grama", "Saibro": "Saibro", "Duro": "Duro", "Grama": "Grama" };
        var surfaceLabel = surfaceTranslateMap[surface] || surface || "";
        var sc = surfaceColorMap[surface] || surfaceColorMap[surfaceLabel] || "#999";
        var tournLow = tournament.toLowerCase();
        if (["monte carlo","roland garros","barcelona","madrid","roma","buenos aires","rio open","lyon","hamburg","gstaad","umag","bucharest","estoril"].some(function(t) { return tournLow.includes(t); }) && surface === "Hard") { surfaceLabel = "Saibro"; sc = surfaceColorMap["Clay"]; }

var matchDate = (lastMatch && lastMatch.date) ? (function() {
          var d = new Date(lastMatch.date);
          var dayMonth = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" });
          var time = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
          return time !== "00:00" ? dayMonth + " · " + time : dayMonth;
        })() : null;
        // Duration formatted as Xh Ymin
        var fGames = f.gameswon || 0; var oGames = o.gameswon || 0;
        var totalGames = fGames + oGames;
        var approxMinutes = totalGames > 0 ? Math.round(totalGames * 4.5) : null;
        var durationStr = null;
        if (approxMinutes) { var hrs = Math.floor(approxMinutes / 60); var mins = approxMinutes % 60; durationStr = hrs > 0 ? hrs + "h " + mins + "min" : mins + "min"; }

        return (
          <div style={{ background: "linear-gradient(160deg, #0a1220 0%, #111d33 40%, #0d1828 100%)", borderRadius: 22, overflow: "hidden", boxShadow: "0 4px 20px rgba(10,18,32,0.25)", position: "relative" }}>
            <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: "radial-gradient(circle, " + (isWin ? GREEN : "#ef4444") + "10 0%, transparent 65%)", pointerEvents: "none" }} />

            {/* TOP BAR — line 1: label + surface badge */}
            <div style={{ padding: "18px 20px 0", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.45)", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>Última partida</span>
              {surfaceLabel && <span style={{ fontSize: 10, fontWeight: 800, color: sc, fontFamily: SANS, background: sc + "20", padding: "5px 14px", borderRadius: 999, textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{surfaceLabel}</span>}
            </div>

            {/* TOP BAR — line 2: round · date · time */}
            {(round || matchDate) && (
              <div style={{ padding: "8px 20px 0", textAlign: "center" }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.5)", fontFamily: SANS, whiteSpace: "nowrap" }}>
                  {round}
                  {round && matchDate ? " · " : ""}
                  {matchDate}
                </span>
              </div>
            )}

            {/* TOURNAMENT */}
            <div style={{ textAlign: "center", padding: "10px 18px 0" }}>
              <h2 style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-0.02em", lineHeight: 1.3 }}>{tournamentDisplay}</h2>
            </div>

            {/* PLAYERS + SCORE (new layout) */}
            <div style={{ padding: "18px 18px 0" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 6, alignItems: "center" }}>
                {/* Fonseca */}
                <div style={{ textAlign: "center" }}>
                  <div style={{ width: 72, height: 72, borderRadius: "50%", margin: "0 auto 8px", background: "#152035", border: "2.5px solid " + GREEN + "50", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <img src={FONSECA_IMG} alt="Fonseca" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={function(e) { if (!e.target.dataset.tried) { e.target.dataset.tried = "1"; e.target.src = FONSECA_IMG_FALLBACK; } }} />
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "#fff", fontFamily: SERIF, display: "block", lineHeight: 1.2 }}>J. Fonseca</span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontFamily: SANS, display: "block", marginTop: 3 }}>{"\ud83c\udde7\ud83c\uddf7"}{playerRanking ? " #" + playerRanking : ""}</span>
                </div>

                {/* Score center */}
                <div style={{ textAlign: "center", minWidth: 100 }}>
                  {/* Sets won */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 10 }}>
                    <span style={{ fontSize: 32, fontWeight: 900, color: isWin ? GREEN : "rgba(255,255,255,0.5)", fontFamily: SANS, lineHeight: 1 }}>{fSetsWon}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.15)", fontFamily: SANS }}>x</span>
                    <span style={{ fontSize: 32, fontWeight: 900, color: !isWin ? "#ef4444" : "rgba(255,255,255,0.5)", fontFamily: SANS, lineHeight: 1 }}>{oSetsWon}</span>
                  </div>
                  {/* Individual set scores */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 14 }}>
                    {sets.map(function(s, i) {
                      var parts = s.split("-");
                      var fWon = (parseInt(parts[0]) || 0) > (parseInt(parts[1]) || 0);
                      return (
                        <span key={i} style={{ fontSize: 10, fontWeight: 600, color: fWon ? GREEN + "90" : "#ef4444" + "80", fontFamily: SANS, background: fWon ? GREEN + "08" : "#ef4444" + "08", padding: "2px 6px", borderRadius: 4, letterSpacing: "0.02em" }}>{s}</span>
                      );
                    })}
                  </div>
                  {/* Duration */}
                  {durationStr && <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", fontFamily: SANS, display: "block" }}>{durationStr}</span>}
                </div>

                {/* Opponent */}
                <div style={{ textAlign: "center" }}>
                  <div style={{ width: 72, height: 72, borderRadius: "50%", margin: "0 auto 8px", background: "#152035", border: "2.5px solid rgba(255,255,255,0.12)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {oppImg ? (<img src={oppImg} alt={oppShort} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={function(e) { if (oppImgFallback && !e.target.dataset.tried) { e.target.dataset.tried = "1"; e.target.src = oppImgFallback; } else { e.target.style.display = "none"; } }} />) : (<span style={{ fontSize: 18, fontWeight: 700, color: "rgba(255,255,255,0.35)" }}>{oppShort.charAt(0)}</span>)}
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "#fff", fontFamily: SERIF, display: "block", lineHeight: 1.2 }}>{oppShort}</span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontFamily: SANS, display: "block", marginTop: 3 }}>{oppFlag} {oppRanking ? "#" + oppRanking : ""}</span>
                </div>
              </div>
            </div>

            {/* STAT BARS */}
            {showStats && <div style={{ padding: "22px 20px 0" }}>
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 18 }}>
                {statRows.map(function(row, i) {
                  // Which side wins this stat? (inverted means lower is better)
                  var fCompare = row.bp ? (row.fBarVal || 0) : (row.fVal || 0);
                  var oCompare = row.bp ? (row.oBarVal || 0) : (row.oVal || 0);
                  var tie = fCompare === oCompare;
                  var fBetter = row.invert ? fCompare < oCompare : fCompare > oCompare;
                  var oBetter = row.invert ? oCompare < fCompare : oCompare > fCompare;
                  if (tie) { fBetter = false; oBetter = false; }

                  // Bar widths
                  var fP, oP;
                  if (row.bp) {
                    // Use explicit bar values (conversion rate) — sum to 100 between the two
                    var total = (row.fBarVal || 0) + (row.oBarVal || 0);
                    fP = total > 0 ? Math.round(((row.fBarVal || 0) / total) * 100) : 50;
                    oP = 100 - fP;
                  } else if (row.pct) {
                    var pt = (row.fVal || 0) + (row.oVal || 0);
                    fP = pt > 0 ? Math.round(((row.fVal || 0) / pt) * 100) : 50;
                    oP = 100 - fP;
                  } else {
                    var tot = (row.fVal || 0) + (row.oVal || 0);
                    fP = tot > 0 ? Math.round(((row.fVal || 0) / tot) * 100) : 50;
                    oP = 100 - fP;
                  }
                  if (fP > 0 && fP < 8) { fP = 8; oP = 92; }
                  if (oP > 0 && oP < 8) { oP = 8; fP = 92; }

                  // Rendered values
                  var fDisplay = row.bp ? (row.fVal + " / " + row.fSecondary) : (row.pct ? row.fVal + "%" : row.fVal);
                  var oDisplay = row.bp ? (row.oVal + " / " + row.oSecondary) : (row.pct ? row.oVal + "%" : row.oVal);

                  var fColor = fBetter ? GREEN : "rgba(255,255,255,0.35)";
                  var oColor = oBetter ? "#ef4444" : "rgba(255,255,255,0.35)";

                  return (
                    <div key={i} style={{ marginBottom: i < statRows.length - 1 ? 14 : 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: fColor, fontFamily: SANS, minWidth: 50, textAlign: "left" }}>{fDisplay}</span>
                        <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.35)", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "center", flex: 1, padding: "0 6px" }}>{row.label}</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: oColor, fontFamily: SANS, minWidth: 50, textAlign: "right" }}>{oDisplay}</span>
                      </div>
                      <div style={{ display: "flex", height: 4, borderRadius: 2, overflow: "hidden", gap: 1 }}>
                        <div style={{ width: fP + "%", height: 4, background: GREEN, borderRadius: "2px 0 0 2px", transition: "width 0.8s ease" }} />
                        <div style={{ width: oP + "%", height: 4, background: "#EF4444", borderRadius: "0 2px 2px 0", transition: "width 0.8s ease" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>}

            {/* RECENT FORM */}
            {formMatches.length > 0 && (
              <div style={{ padding: "18px 20px 20px" }}>
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 14 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.25)", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 10 }}>Forma recente</span>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {formMatches.map(function(m, i) {
                      var w = m.result === "V";
                      return (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.04)" }}>
                          <span style={{ fontSize: 10, fontWeight: 800, color: w ? GREEN : "#ef4444", fontFamily: SANS, width: 16, textAlign: "center" }}>{w ? "V" : "D"}</span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)", fontFamily: SANS, flex: 1 }}>
                            {m.opponent_name}
                            {m.opponent_ranking && <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.3)", fontFamily: SANS, marginLeft: 4 }}>{"#" + m.opponent_ranking}</span>}
                          </span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", fontFamily: SANS }}>{m.score}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
