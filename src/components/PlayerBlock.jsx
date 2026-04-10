import { GREEN, RED, BG_ALT, TEXT, SUB, DIM, BORDER, SANS, SERIF, CARD_RADIUS, CARD_SHADOW, CARD_SHADOW_MD, surfaceColorMap, countryFlags, FONSECA_IMG, FONSECA_IMG_FALLBACK } from '../lib/constants';
import { getATPImage, getESPNImage } from '../lib/utils';

export default function PlayerBlock(props) {
  var lastMatch = props.lastMatch;
  var matchStats = props.matchStats;
  var recentForm = props.recentForm;
  var season = props.season;
  var prizeMoney = props.prizeMoney;
  var playerRanking = props.playerRanking;
  var opponentProfile = props.opponentProfile;

  var hasAnyData = (matchStats && matchStats.fonseca) || (recentForm && recentForm.length > 0) || season || prizeMoney;
  if (!hasAnyData) return null;

  return (
    <div>
      {matchStats && matchStats.fonseca && (function() {
        var f = matchStats.fonseca;
        var o = matchStats.opponent;

        // Calculate stats
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
          { label: "1º saque", fVal: f1stPct, oVal: o1stPct, pct: true },
          { label: "Pts no 1º saque", fVal: fPts1st, oVal: oPts1st, pct: true },
          { label: "Pts no 2º saque", fVal: fPts2nd, oVal: oPts2nd, pct: true },
          { label: "Breaks salvos", fVal: f.breakpointssaved || 0, oVal: o.breakpointssaved || 0 },
          { label: "Total de pontos", fVal: fTotalPts, oVal: oTotalPts },
        ].filter(function(r) { return r.fVal > 0 || r.oVal > 0; });
        if (statRows.length === 0) return null;

        var oppName = matchStats.opponent_name || "Adv.";
        var oppShort = oppName.length > 12 ? oppName.split(" ").pop() : oppName;
        var isWin = matchStats.result === "V";
        var oppFlag = countryFlags[matchStats.opponent_country || ""] || "";
        var oppImg = getATPImage(oppName);
        var oppImgFallback = getESPNImage(oppName);

        var oppProfileMatch = opponentProfile && opponentProfile.name && oppName.indexOf(opponentProfile.name.split(" ").pop()) !== -1;
        var oppRanking = matchStats.opponent_ranking || (oppProfileMatch ? opponentProfile.ranking : null);

        var formMatches = recentForm ? recentForm.slice(-5) : [];

        // Match context
        var tournament = matchStats.tournament || "";
        var round = matchStats.round || (lastMatch && lastMatch.round) || "";
        var surface = matchStats.surface || (lastMatch && lastMatch.surface) || "";
        var surfaceLabel = { "Clay": "Saibro", "Hard": "Duro", "Grass": "Grama", "Saibro": "Saibro", "Duro": "Duro", "Grama": "Grama" }[surface] || surface || "";
        var sc = surfaceColorMap[surface] || surfaceColorMap[surfaceLabel] || "#999";
        var matchDate = matchStats.date ? new Date(matchStats.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : "";

        // Quick highlights
        var highlights = [
          { label: "Aces", value: f.aces || 0, icon: "🎯" },
          { label: "1º Saque", value: f1stPct + "%", icon: "💨" },
          { label: "Breaks", value: (f.breakpointsscored || 0), icon: "💥" },
          { label: "Winners", value: f.winners || (f.maxpointsinrow ? "+" + f.maxpointsinrow : null), icon: "🔥" },
        ].filter(function(h) { return h.value && h.value !== 0 && h.value !== "0%"; });

        // Total games for approximate duration
        var fGames = f.gameswon || 0;
        var oGames = o.gameswon || 0;
        var totalGames = fGames + oGames;
        var approxMinutes = totalGames > 0 ? Math.round(totalGames * 4.5) : null;

        return (
          <div style={{ background: "linear-gradient(160deg, #0a1220 0%, #111d33 40%, #0d1828 100%)", borderRadius: 22, overflow: "hidden", boxShadow: "0 4px 20px rgba(10,18,32,0.25)", position: "relative" }}>
            {/* Subtle glow */}
            <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: "radial-gradient(circle, " + (isWin ? GREEN : "#ef4444") + "10 0%, transparent 65%)", pointerEvents: "none" }} />

            {/* ===== TOP BAR ===== */}
            <div style={{ padding: "18px 20px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: isWin ? GREEN : "#ef4444", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.08em" }}>Última partida</span>
                {round && <span style={{ fontSize: 12, fontWeight: 800, color: "#fff", fontFamily: SANS }}>{round}</span>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {matchDate && <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.3)", fontFamily: SANS }}>{matchDate}</span>}
                {surfaceLabel && <span style={{ fontSize: 9, fontWeight: 800, color: sc, fontFamily: SANS, background: sc + "20", padding: "4px 10px", borderRadius: 999, textTransform: "uppercase", letterSpacing: "0.06em" }}>{surfaceLabel}</span>}
              </div>
            </div>

            {/* ===== TOURNAMENT ===== */}
            <div style={{ textAlign: "center", padding: "12px 18px 0" }}>
              <h3 style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-0.02em" }}>{tournament}</h3>
            </div>

            {/* ===== PLAYERS + SCORE ===== */}
            <div style={{ padding: "20px 18px 0" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 6, alignItems: "center" }}>
                {/* Fonseca */}
                <div style={{ textAlign: "center" }}>
                  <div style={{ width: 64, height: 64, borderRadius: "50%", margin: "0 auto 8px", background: "#152035", border: "2.5px solid " + GREEN + "50", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <img src={FONSECA_IMG} alt="Fonseca" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={function(e) { if (!e.target.dataset.tried) { e.target.dataset.tried = "1"; e.target.src = FONSECA_IMG_FALLBACK; } }} />
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: SERIF, display: "block", lineHeight: 1.2 }}>J. Fonseca</span>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", fontFamily: SANS, display: "block", marginTop: 2 }}>🇧🇷 #{playerRanking || 35}</span>
                </div>

                {/* Score */}
                <div style={{ textAlign: "center", padding: "0 6px" }}>
                  <span style={{ fontSize: 22, fontWeight: 900, color: "#fff", fontFamily: SANS, letterSpacing: "0.03em", display: "block", marginBottom: 6 }}>{matchStats.score}</span>
                  <span style={{ fontSize: 10, fontWeight: 800, color: isWin ? GREEN : "#ef4444", fontFamily: SANS, background: isWin ? GREEN + "18" : "#ef444418", padding: "4px 14px", borderRadius: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>{isWin ? "Vitória" : "Derrota"}</span>
                  {approxMinutes && <span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", fontFamily: SANS, display: "block", marginTop: 6 }}>{"~" + approxMinutes + " min"}</span>}
                </div>

                {/* Opponent */}
                <div style={{ textAlign: "center" }}>
                  <div style={{ width: 64, height: 64, borderRadius: "50%", margin: "0 auto 8px", background: "#152035", border: "2.5px solid rgba(255,255,255,0.12)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {oppImg ? (
                      <img src={oppImg} alt={oppShort} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={function(e) { if (oppImgFallback && !e.target.dataset.tried) { e.target.dataset.tried = "1"; e.target.src = oppImgFallback; } else { e.target.style.display = "none"; } }} />
                    ) : (
                      <span style={{ fontSize: 18, fontWeight: 700, color: "rgba(255,255,255,0.35)" }}>{oppShort.charAt(0)}</span>
                    )}
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: SERIF, display: "block", lineHeight: 1.2 }}>{oppShort}</span>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", fontFamily: SANS, display: "block", marginTop: 2 }}>{oppFlag} {oppRanking ? "#" + oppRanking : ""}</span>
                </div>
              </div>
            </div>

            {/* ===== QUICK HIGHLIGHTS ===== */}
            {highlights.length >= 3 && (
              <div style={{ display: "flex", justifyContent: "space-around", padding: "18px 20px 0" }}>
                {highlights.slice(0, 4).map(function(h, i) {
                  return (
                    <div key={i} style={{ textAlign: "center" }}>
                      <span style={{ fontSize: 18, fontWeight: 800, color: "#fff", fontFamily: SANS, display: "block", lineHeight: 1 }}>{h.value}</span>
                      <span style={{ fontSize: 8, fontWeight: 700, color: "rgba(255,255,255,0.3)", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 3, display: "block" }}>{h.label}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ===== STAT BARS ===== */}
            <div style={{ padding: "18px 20px 0" }}>
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 16 }}>
                {statRows.map(function(row, i) {
                  var fBetter = row.invert ? row.fVal < row.oVal : row.fVal >= row.oVal;
                  var fNum = row.fVal || 0;
                  var oNum = row.oVal || 0;
                  var total = fNum + oNum;
                  var fPct2, oPct2;
                  if (row.pct) {
                    var pctTotal = fNum + oNum;
                    fPct2 = pctTotal > 0 ? Math.round((fNum / pctTotal) * 100) : 50;
                    oPct2 = 100 - fPct2;
                  } else {
                    fPct2 = total > 0 ? Math.round((fNum / total) * 100) : 50;
                    oPct2 = 100 - fPct2;
                  }
                  if (fPct2 > 0 && fPct2 < 8) { fPct2 = 8; oPct2 = 92; }
                  if (oPct2 > 0 && oPct2 < 8) { oPct2 = 8; fPct2 = 92; }

                  return (
                    <div key={i} style={{ marginBottom: i < statRows.length - 1 ? 12 : 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: fBetter ? GREEN : "rgba(255,255,255,0.35)", fontFamily: SANS, minWidth: 40, textAlign: "left" }}>{row.pct ? row.fVal + "%" : row.fVal}</span>
                        <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.06em", textAlign: "center", flex: 1 }}>{row.label}</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: !fBetter ? "#ef4444" : "rgba(255,255,255,0.35)", fontFamily: SANS, minWidth: 40, textAlign: "right" }}>{row.pct ? row.oVal + "%" : row.oVal}</span>
                      </div>
                      <div style={{ display: "flex", height: 5, borderRadius: 3, overflow: "hidden", gap: 1 }}>
                        <div style={{ width: fPct2 + "%", height: 5, background: "linear-gradient(90deg, " + GREEN + ", #34D399)", borderRadius: "3px 0 0 3px", transition: "width 0.8s ease" }} />
                        <div style={{ width: oPct2 + "%", height: 5, background: "linear-gradient(90deg, #EF4444, #F87171)", borderRadius: "0 3px 3px 0", transition: "width 0.8s ease" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ===== RECENT FORM ===== */}
            {formMatches.length > 0 && (
              <div style={{ padding: "18px 20px 20px" }}>
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 14 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.25)", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 10 }}>Forma recente</span>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {formMatches.slice().reverse().map(function(m, i) {
                      var w = m.result === "V";
                      return (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 10px", background: "rgba(255,255,255,0.03)", borderRadius: 8 }}>
                          <span style={{ fontSize: 10, fontWeight: 800, color: w ? GREEN : "#ef4444", fontFamily: SANS, width: 14, textAlign: "center" }}>{w ? "V" : "D"}</span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)", fontFamily: SANS, flex: 1 }}>{m.opponent_name}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", fontFamily: SANS }}>{m.score}</span>
                          {m.tournament && <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", fontFamily: SANS, display: "none" }}>{m.tournament}</span>}
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
