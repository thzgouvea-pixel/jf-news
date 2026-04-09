import React from "react";
import countryFlags from "../../data/countryFlags";
import { getATPImage, getESPNImage } from "../../data/playerDb";

const GREEN = "#00A859";
const BG_ALT = "#F7F8F9";
const TEXT = "#1a1a1a";
const SUB = "#6b6b6b";
const DIM = "#a0a0a0";
const BORDER = "#e8e8e8";
const RED = "#c0392b";
const SANS = "'Inter', -apple-system, sans-serif";

const FONSECA_IMG = "https://www.atptour.com/-/media/alias/player-headshot/f0fv";
const FONSECA_IMG_FALLBACK = "https://a.espncdn.com/combiner/i?img=/i/headshots/tennis/players/full/11745.png&w=200&h=145";

export default function PlayerBlock({
  matchStats,
  recentForm,
  season,
  prizeMoney,
  playerRanking,
  opponentProfile,
}) {
  const hasAnyData = (matchStats && matchStats.fonseca) || (recentForm && recentForm.length > 0) || season || prizeMoney;
  if (!hasAnyData) return null;
  if (!(matchStats && matchStats.fonseca)) return null;

  const f = matchStats.fonseca;
  const o = matchStats.opponent;
  const fServTotal = (f.firstserveaccuracy || 0) + (f.secondserveaccuracy || 0) + (f.doublefaults || 0);
  const oServTotal = (o.firstserveaccuracy || 0) + (o.secondserveaccuracy || 0) + (o.doublefaults || 0);
  const f1stPct = fServTotal > 0 ? Math.round(((f.firstserveaccuracy || 0) / fServTotal) * 100) : 0;
  const o1stPct = oServTotal > 0 ? Math.round(((o.firstserveaccuracy || 0) / oServTotal) * 100) : 0;
  const fPts1st = (f.firstserveaccuracy || 0) > 0 ? Math.round(((f.firstservepointsaccuracy || 0) / (f.firstserveaccuracy || 1)) * 100) : 0;
  const oPts1st = (o.firstserveaccuracy || 0) > 0 ? Math.round(((o.firstservepointsaccuracy || 0) / (o.firstserveaccuracy || 1)) * 100) : 0;
  const f2ndTotal = (f.secondserveaccuracy || 0) + (f.doublefaults || 0);
  const o2ndTotal = (o.secondserveaccuracy || 0) + (o.doublefaults || 0);
  const fPts2nd = f2ndTotal > 0 ? Math.round(((f.secondservepointsaccuracy || 0) / f2ndTotal) * 100) : 0;
  const oPts2nd = o2ndTotal > 0 ? Math.round(((o.secondservepointsaccuracy || 0) / o2ndTotal) * 100) : 0;

  const statRows = [
    { label: "Aces", fVal: f.aces || 0, oVal: o.aces || 0 },
    { label: "Duplas faltas", fVal: f.doublefaults || 0, oVal: o.doublefaults || 0, invert: true },
    { label: "1o saque", fVal: f1stPct, oVal: o1stPct, pct: true },
    { label: "Pts no 1o saque", fVal: fPts1st, oVal: oPts1st, pct: true },
    { label: "Pts no 2o saque", fVal: fPts2nd, oVal: oPts2nd, pct: true },
    { label: "Breaks salvos", fVal: f.breakpointssaved || 0, oVal: o.breakpointssaved || 0 },
    {
      label: "Total de pontos",
      fVal: (f.servicepointsscored || 0) + (f.receiverpointsscored || 0) || f.pointstotal || 0,
      oVal: (o.servicepointsscored || 0) + (o.receiverpointsscored || 0) || o.pointstotal || 0,
    },
  ].filter((row) => row.fVal > 0 || row.oVal > 0);

  if (statRows.length === 0) return null;

  const oppName = matchStats.opponent_name || "Adv.";
  const oppShort = oppName.length > 12 ? oppName.split(" ").pop() : oppName;
  const isWin = matchStats.result === "V";
  const oppFlag = countryFlags[matchStats.opponent_country || ""] || "";
  const oppImg = getATPImage(oppName);
  const oppImgFallback = getESPNImage(oppName);
  const oppProfileMatch = opponentProfile && opponentProfile.name && oppName.indexOf(opponentProfile.name.split(" ").pop()) !== -1;
  const oppRanking = matchStats.opponent_ranking || (oppProfileMatch ? opponentProfile.ranking : null);
  const formMatches = recentForm ? recentForm.slice(-10) : [];

  return (
    <div>
      <div style={{ background: BG_ALT, borderRadius: 16, padding: "20px", overflow: "hidden", border: `1px solid ${BORDER}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: TEXT, fontFamily: SANS }}>{matchStats.tournament}</span>
            <span style={{ fontSize: 10, color: DIM, fontFamily: SANS }}>{matchStats.date ? new Date(matchStats.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : ""}</span>
          </div>
          {formMatches.length > 0 ? (
            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <span style={{ fontSize: 9, fontWeight: 600, color: DIM, fontFamily: SANS, letterSpacing: "0.03em", marginRight: 2 }}>Forma</span>
              {formMatches.slice().reverse().map((match, index) => {
                const won = match.result === "V";
                return (
                  <div key={index} title={`${match.opponent_name} ${match.score}`} style={{ width: 16, height: 16, borderRadius: 3, background: won ? `${GREEN}15` : `${RED}15`, border: `1px solid ${won ? `${GREEN}35` : `${RED}35`}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 8, fontWeight: 700, color: won ? GREEN : RED, fontFamily: SANS }}>{won ? "V" : "D"}</span>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ textAlign: "center", flex: 1 }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", overflow: "hidden", margin: "0 auto 6px", border: `2px solid ${GREEN}40` }}>
              <img src={FONSECA_IMG} alt="Fonseca" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { if (!e.target.dataset.tried) { e.target.dataset.tried = "1"; e.target.src = FONSECA_IMG_FALLBACK; } else { e.target.style.display = "none"; e.target.parentNode.innerHTML = `<span style='font-size:16px;font-weight:700;color:${GREEN};display:flex;align-items:center;justify-content:center;width:100%;height:100%'>JF</span>`; } }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: TEXT, fontFamily: SANS, display: "block" }}>Fonseca</span>
            <span style={{ fontSize: 10, color: DIM, fontFamily: SANS }}>🇧🇷 #{playerRanking || 40}</span>
          </div>

          <div style={{ textAlign: "center", padding: "0 8px" }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: TEXT, fontFamily: SANS, letterSpacing: "0.05em", display: "block", marginBottom: 4 }}>{matchStats.score}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: isWin ? GREEN : RED, fontFamily: SANS, background: isWin ? `${GREEN}12` : `${RED}12`, padding: "3px 10px", borderRadius: 6 }}>{isWin ? "VITORIA" : "DERROTA"}</span>
          </div>

          <div style={{ textAlign: "center", flex: 1 }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", overflow: "hidden", margin: "0 auto 6px", border: `2px solid ${BORDER}`, background: BG_ALT }}>
              {oppImg ? (
                <img src={oppImg} alt={oppShort} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { if (oppImgFallback && !e.target.dataset.tried) { e.target.dataset.tried = "1"; e.target.src = oppImgFallback; } else { e.target.style.display = "none"; e.target.parentNode.innerHTML = `<span style='font-size:16px;font-weight:700;color:${DIM};display:flex;align-items:center;justify-content:center;width:100%;height:100%'>${oppShort.charAt(0)}</span>`; } }} />
              ) : (
                <span style={{ fontSize: 16, fontWeight: 700, color: DIM, display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }}>{oppShort.charAt(0)}</span>
              )}
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: TEXT, fontFamily: SANS, display: "block" }}>{oppShort}</span>
            <span style={{ fontSize: 10, color: DIM, fontFamily: SANS }}>{oppFlag} {oppRanking ? `#${oppRanking}` : ""}</span>
          </div>
        </div>

        <div style={{ height: 1, background: BORDER, marginBottom: 16 }} />

        {statRows.map((row, index) => {
          const fBetter = row.invert ? row.fVal < row.oVal : row.fVal >= row.oVal;
          const fNum = row.fVal || 0;
          const oNum = row.oVal || 0;
          const total = fNum + oNum;
          let fPct;
          let oPct;

          if (row.pct) {
            const pctTotal = fNum + oNum;
            fPct = pctTotal > 0 ? Math.round((fNum / pctTotal) * 100) : 50;
            oPct = 100 - fPct;
          } else {
            fPct = total > 0 ? Math.round((fNum / total) * 100) : 50;
            oPct = 100 - fPct;
          }

          if (fPct > 0 && fPct < 8) {
            fPct = 8;
            oPct = 92;
          }
          if (oPct > 0 && oPct < 8) {
            oPct = 8;
            fPct = 92;
          }

          return (
            <div key={index} style={{ marginBottom: index < statRows.length - 1 ? 14 : 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: fBetter ? GREEN : "#8bc9a5", fontFamily: SANS, minWidth: 40, textAlign: "left" }}>{row.pct ? `${row.fVal}%` : row.fVal}</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: SUB, fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "center", flex: 1 }}>{row.label}</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: !fBetter ? "#e74c3c" : "#e8a9a1", fontFamily: SANS, minWidth: 40, textAlign: "right" }}>{row.pct ? `${row.oVal}%` : row.oVal}</span>
              </div>
              <div style={{ display: "flex", height: 5, borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: `${fPct}%`, height: 5, background: GREEN, transition: "width 0.8s ease" }} />
                <div style={{ width: `${oPct}%`, height: 5, background: "#e74c3c", transition: "width 0.8s ease" }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
