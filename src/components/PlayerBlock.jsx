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
        var fServTotal = (f.firstserveaccuracy||0) + (f.secondserveaccuracy||0) + (f.doublefaults||0);
        var oServTotal = (o.firstserveaccuracy||0) + (o.secondserveaccuracy||0) + (o.doublefaults||0);
        var f1stPct = fServTotal > 0 ? Math.round((f.firstserveaccuracy||0) / fServTotal * 100) : 0;
        var o1stPct = oServTotal > 0 ? Math.round((o.firstserveaccuracy||0) / oServTotal * 100) : 0;
        var fPts1st = (f.firstserveaccuracy||0) > 0 ? Math.round((f.firstservepointsaccuracy||0) / (f.firstserveaccuracy||1) * 100) : 0;
        var oPts1st = (o.firstserveaccuracy||0) > 0 ? Math.round((o.firstservepointsaccuracy||0) / (o.firstserveaccuracy||1) * 100) : 0;
        var f2ndTotal = (f.secondserveaccuracy||0) + (f.doublefaults||0);
        var o2ndTotal = (o.secondserveaccuracy||0) + (o.doublefaults||0);
        var fPts2nd = f2ndTotal > 0 ? Math.round((f.secondservepointsaccuracy||0) / f2ndTotal * 100) : 0;
        var oPts2nd = o2ndTotal > 0 ? Math.round((o.secondservepointsaccuracy||0) / o2ndTotal * 100) : 0;
        var fTotalPts = (f.servicepointsscored||0) + (f.receiverpointsscored||0) || f.pointstotal || 0;
        var oTotalPts = (o.servicepointsscored||0) + (o.receiverpointsscored||0) || o.pointstotal || 0;
        var statRows = [
          { label: "Aces", fVal: f.aces || 0, oVal: o.aces || 0 },
          { label: "Duplas faltas", fVal: f.doublefaults || 0, oVal: o.doublefaults || 0, invert: true },
          { label: "1\u00ba saque", fVal: f1stPct, oVal: o1stPct, pct: true },
          { label: "Pts no 1\u00ba saque", fVal: fPts1st, oVal: oPts1st, pct: true },
          { label: "Pts no 2\u00ba saque", fVal: fPts2nd, oVal: oPts2nd, pct: true },
          { label: "Breaks salvos", fVal: f.breakpointssaved || 0, oVal: o.breakpointssaved || 0 },
          { label: "Total de pontos", fVal: fTotalPts, oVal: oTotalPts },
        ].filter(function(r) { return r.fVal > 0 || r.oVal > 0; });
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

var matchDate = (lastMatch && lastMatch.date) ? new Date(lastMatch.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : null;
        // Duration formatted as Xh Ymin
        var fGames = f.gameswon || 0; var oGames = o.gameswon || 0;
        var totalGames = fGames + oGames;
        var approxMinutes = totalGames > 0 ? Math.round(totalGames * 4.5) : null;
        var durationStr = null;
        if (approxMinutes) { var hrs = Math.floor(approxMinutes / 60); var mins = approxMinutes % 60; durationStr = hrs > 0 ? hrs + "h " + mins + "min" : mins + "min"; }

        return (
          <div style={{ background: "linear-gradient(160deg, #0a1220 0%, #111d33 40%, #0d1828 100%)", borderRadius: 22, overflow: "hidden", boxShadow: "0 4px 20px rgba(10,18,32,0.25)", position: "relative" }}>
            <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: "radial-gradient(circle, " + (isWin ? GREEN : "#ef4444") + "10 0%, transparent 65%)", pointerEvents: "none" }} />

            {/* TOP BAR */}
            <div style={{ padding: "18px 20px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.08em" }}>Última partida</span>
                </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {round && <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)", fontFamily: SANS }}>{round}</span>}
                {matchDate && <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.3)", fontFamily: SANS }}>{matchDate}</span>}
                {surfaceLabel && <span style={{ fontSize: 9, fontWeight: 800, color: sc, fontFamily: SANS, background: sc + "20", padding: "4px 10px", borderRadius: 999, textTransform: "uppercase", letterSpacing: "0.06em" }}>{surfaceLabel}</span>}
              </div>
            </div>

            {/* TOURNAMENT */}
            <div style={{ textAlign: "center", padding: "12px 18px 0" }}>
              <h3 style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-0.02em" }}>{tournamentDisplay}</h3>
            </div>

            {/* PLAYERS + SCORE (new layout) */}
            <div style={{ padding: "22px 18px 0" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 6, alignItems: "center" }}>
                {/* Fonseca */}
                <div style={{ textAlign: "center" }}>
                  <div style={{ width: 64, height: 64, borderRadius: "50%", margin: "0 auto 8px", background: "#152035", border: "2.5px solid " + GREEN + "50", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <img src={FONSECA_IMG} alt="Fonseca" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={function(e) { if (!e.target.dataset.tried) { e.target.dataset.tried = "1"; e.target.src = FONSECA_IMG_FALLBACK; } }} />
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: SERIF, display: "block", lineHeight: 1.2 }}>J. Fonseca</span>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", fontFamily: SANS, display: "block", marginTop: 2 }}>{"\ud83c\udde7\ud83c\uddf7"} #{playerRanking || 35}</span>
                </div>

                {/* Score center */}
                <div style={{ textAlign: "center", minWidth: 100 }}>
                  {/* Sets won */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 32, fontWeight: 900, color: isWin ? GREEN : "rgba(255,255,255,0.5)", fontFamily: SANS, lineHeight: 1 }}>{fSetsWon}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.15)", fontFamily: SANS }}>x</span>
                    <span style={{ fontSize: 32, fontWeight: 900, color: !isWin ? "#ef4444" : "rgba(255,255,255,0.5)", fontFamily: SANS, lineHeight: 1 }}>{oSetsWon}</span>
                  </div>
                  {/* Individual set scores */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 8 }}>
                    {sets.map(function(s, i) {
                      var parts = s.split("-");
                      var fWon = (parseInt(parts[0]) || 0) > (parseInt(parts[1]) || 0);
                      return (
                        <span key={i} style={{ fontSize: 10, fontWeight: 600, color: fWon ? GREEN + "90" : "#ef4444" + "80", fontFamily: SANS, background: fWon ? GREEN + "08" : "#ef4444" + "08", padding: "2px 6px", borderRadius: 4, letterSpacing: "0.02em" }}>{s}</span>
                      );
                    })}
                  </div>
                  {/* Result badge */}
                  {/* Duration */}
                  {durationStr && <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", fontFamily: SANS, display: "block", marginTop: 8 }}>{durationStr}</span>}
                </div>

                {/* Opponent */}
                <div style={{ textAlign: "center" }}>
                  <div style={{ width: 64, height: 64, borderRadius: "50%", margin: "0 auto 8px", background: "#152035", border: "2.5px solid rgba(255,255,255,0.12)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {oppImg ? (<img src={oppImg} alt={oppShort} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={function(e) { if (oppImgFallback && !e.target.dataset.tried) { e.target.dataset.tried = "1"; e.target.src = oppImgFallback; } else { e.target.style.display = "none"; } }} />) : (<span style={{ fontSize: 18, fontWeight: 700, color: "rgba(255,255,255,0.35)" }}>{oppShort.charAt(0)}</span>)}
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: SERIF, display: "block", lineHeight: 1.2 }}>{oppShort}</span>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", fontFamily: SANS, display: "block", marginTop: 2 }}>{oppFlag} {oppRanking ? "#" + oppRanking : ""}</span>
                </div>
              </div>
            </div>

            {/* STAT BARS */}
            {showStats && <div style={{ padding: "22px 20px 0" }}>
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 16 }}>
                {statRows.map(function(row, i) {
                  var fBetter = row.invert ? row.fVal < row.oVal : row.fVal >= row.oVal;
                  var fNum = row.fVal || 0; var oNum = row.oVal || 0; var total = fNum + oNum;
                  var fP, oP;
                  if (row.pct) { var pt = fNum + oNum; fP = pt > 0 ? Math.round((fNum / pt) * 100) : 50; oP = 100 - fP; }
                  else { fP = total > 0 ? Math.round((fNum / total) * 100) : 50; oP = 100 - fP; }
                  if (fP > 0 && fP < 8) { fP = 8; oP = 92; }
                  if (oP > 0 && oP < 8) { oP = 8; fP = 92; }
                  return (
                    <div key={i} style={{ marginBottom: i < statRows.length - 1 ? 12 : 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: fBetter ? GREEN : "rgba(255,255,255,0.35)", fontFamily: SANS, minWidth: 40, textAlign: "left" }}>{row.pct ? row.fVal + "%" : row.fVal}</span>
                        <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.06em", textAlign: "center", flex: 1 }}>{row.label}</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: !fBetter ? "#ef4444" : "rgba(255,255,255,0.35)", fontFamily: SANS, minWidth: 40, textAlign: "right" }}>{row.pct ? row.oVal + "%" : row.oVal}</span>
                      </div>
                      <div style={{ display: "flex", height: 5, borderRadius: 3, overflow: "hidden", gap: 1 }}>
                        <div style={{ width: fP + "%", height: 5, background: "linear-gradient(90deg, " + GREEN + ", #34D399)", borderRadius: "3px 0 0 3px", transition: "width 0.8s ease" }} />
                        <div style={{ width: oP + "%", height: 5, background: "linear-gradient(90deg, #EF4444, #F87171)", borderRadius: "0 3px 3px 0", transition: "width 0.8s ease" }} />
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
                          <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)", fontFamily: SANS, flex: 1 }}>{m.opponent_name}</span>
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
