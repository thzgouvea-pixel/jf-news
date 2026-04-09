import { useState, useEffect, useRef } from "react";
import { GREEN, RED, BG_ALT, TEXT, SUB, DIM, BORDER, SERIF, SANS, FONSECA_IMG, FONSECA_IMG_FALLBACK, countryFlags, getATPImage, getESPNImage } from "./constants";

// ===== WIN PROBABILITY BAR =====
export var WinProbBar = function(props) {
  var winProb = props.winProb;
  if (!winProb || !winProb.fonseca) return null;

  var fPct = Math.round(winProb.fonseca);
  var oPct = Math.round(winProb.opponent);
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
};

// ===== PLAYER BLOCK =====
export var PlayerBlock = function(props) {
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
        var statRows = [
          { label: "Aces", fVal: f.aces || 0, oVal: o.aces || 0, icon: "A" },
          { label: "Duplas faltas", fVal: f.doublefaults || 0, oVal: o.doublefaults || 0, invert: true, icon: "DF" },
          { label: "1o saque", fVal: f1stPct, oVal: o1stPct, pct: true, icon: "1S" },
          { label: "Pts no 1o saque", fVal: fPts1st, oVal: oPts1st, pct: true, icon: "P1" },
          { label: "Pts no 2o saque", fVal: fPts2nd, oVal: oPts2nd, pct: true, icon: "P2" },
          { label: "Breaks salvos", fVal: f.breakpointssaved || 0, oVal: o.breakpointssaved || 0, icon: "BP" },
          { label: "Total de pontos", fVal: (f.servicepointsscored||0) + (f.receiverpointsscored||0) || f.pointstotal || 0, oVal: (o.servicepointsscored||0) + (o.receiverpointsscored||0) || o.pointstotal || 0, icon: "TP" },
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
        var formMatches = recentForm ? recentForm.slice(-10) : [];

        return (
          <div>
            <div style={{ background: BG_ALT, borderRadius: 16, padding: "20px", overflow: "hidden", border: "1px solid " + BORDER }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: TEXT, fontFamily: SANS }}>{matchStats.tournament}</span>
                  <span style={{ fontSize: 10, color: DIM, fontFamily: SANS }}>{matchStats.date ? new Date(matchStats.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : ""}</span>
                </div>
                {formMatches.length > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                    <span style={{ fontSize: 9, fontWeight: 600, color: DIM, fontFamily: SANS, letterSpacing: "0.03em", marginRight: 2 }}>Forma</span>
                    {formMatches.slice().reverse().map(function(m, i) {
                      var w = m.result === "V";
                      return (
                        <div key={i} title={m.opponent_name + " " + m.score} style={{ width: 16, height: 16, borderRadius: 3, background: w ? GREEN + "15" : RED + "15", border: "1px solid " + (w ? GREEN + "35" : RED + "35"), display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontSize: 8, fontWeight: 700, color: w ? GREEN : RED, fontFamily: SANS }}>{w ? "V" : "D"}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <div style={{ textAlign: "center", flex: 1 }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", overflow: "hidden", margin: "0 auto 6px", border: "2px solid " + GREEN + "40" }}>
                    <img src={FONSECA_IMG} alt="Fonseca" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={function(e) { if (!e.target.dataset.tried) { e.target.dataset.tried = "1"; e.target.src = FONSECA_IMG_FALLBACK; } else { e.target.style.display = "none"; e.target.parentNode.innerHTML = "<span style='font-size:16px;font-weight:700;color:" + GREEN + ";display:flex;align-items:center;justify-content:center;width:100%;height:100%'>JF</span>"; } }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: TEXT, fontFamily: SANS, display: "block" }}>Fonseca</span>
                  <span style={{ fontSize: 10, color: DIM, fontFamily: SANS }}>🇧🇷 #{playerRanking || 40}</span>
                </div>

                <div style={{ textAlign: "center", padding: "0 8px" }}>
                  <span style={{ fontSize: 20, fontWeight: 800, color: TEXT, fontFamily: SANS, letterSpacing: "0.05em", display: "block", marginBottom: 4 }}>{matchStats.score}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: isWin ? GREEN : RED, fontFamily: SANS, background: isWin ? GREEN + "12" : RED + "12", padding: "3px 10px", borderRadius: 6 }}>{isWin ? "VITÓRIA" : "DERROTA"}</span>
                </div>

                <div style={{ textAlign: "center", flex: 1 }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", overflow: "hidden", margin: "0 auto 6px", border: "2px solid " + BORDER, background: BG_ALT }}>
                    {oppImg ? (
                      <img src={oppImg} alt={oppShort} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={function(e) { if (oppImgFallback && !e.target.dataset.tried) { e.target.dataset.tried = "1"; e.target.src = oppImgFallback; } else { e.target.style.display = "none"; e.target.parentNode.innerHTML = "<span style='font-size:16px;font-weight:700;color:" + DIM + ";display:flex;align-items:center;justify-content:center;width:100%;height:100%'>" + oppShort.charAt(0) + "</span>"; } }} />
                    ) : (
                      <span style={{ fontSize: 16, fontWeight: 700, color: DIM, display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }}>{oppShort.charAt(0)}</span>
                    )}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: TEXT, fontFamily: SANS, display: "block" }}>{oppShort}</span>
                  <span style={{ fontSize: 10, color: DIM, fontFamily: SANS }}>{oppFlag} {oppRanking ? "#" + oppRanking : ""}</span>
                </div>
              </div>

              <div style={{ height: 1, background: BORDER, marginBottom: 16 }} />

              {statRows.map(function(row, i) {
                var fBetter = row.invert ? row.fVal < row.oVal : row.fVal >= row.oVal;
                var fNum = row.fVal || 0;
                var oNum = row.oVal || 0;
                var total = fNum + oNum;
                var fPct, oPct;
                if (row.pct) {
                  var pctTotal = fNum + oNum;
                  fPct = pctTotal > 0 ? Math.round((fNum / pctTotal) * 100) : 50;
                  oPct = 100 - fPct;
                } else {
                  fPct = total > 0 ? Math.round((fNum / total) * 100) : 50;
                  oPct = 100 - fPct;
                }
                if (fPct > 0 && fPct < 8) { fPct = 8; oPct = 92; }
                if (oPct > 0 && oPct < 8) { oPct = 8; fPct = 92; }

                return (
                  <div key={i} style={{ marginBottom: i < statRows.length - 1 ? 14 : 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: fBetter ? GREEN : "#8bc9a5", fontFamily: SANS, minWidth: 40, textAlign: "left" }}>{row.pct ? row.fVal + "%" : row.fVal}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: SUB, fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "center", flex: 1 }}>{row.label}</span>
                      <span style={{ fontSize: 15, fontWeight: 700, color: !fBetter ? "#e74c3c" : "#e8a9a1", fontFamily: SANS, minWidth: 40, textAlign: "right" }}>{row.pct ? row.oVal + "%" : row.oVal}</span>
                    </div>
                    <div style={{ display: "flex", height: 5, borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: fPct + "%", height: 5, background: GREEN, transition: "width 0.8s ease" }} />
                      <div style={{ width: oPct + "%", height: 5, background: "#e74c3c", transition: "width 0.8s ease" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
    </div>
  );
};

// ===== MATCH CAROUSEL =====
var MatchCarousel = function(props) {
  var scrollRef = useRef(null);
  var statsRef = useRef(null);
  var _page = useState(0); var activePage = _page[0]; var setActivePage = _page[1];
  var _statsH = useState(0); var statsHeight = _statsH[0]; var setStatsHeight = _statsH[1];

  useEffect(function() {
    if (statsRef.current) {
      var h = statsRef.current.offsetHeight;
      if (h > 0) setStatsHeight(h);
    }
  });

  var handleScroll = function() {
    if (!scrollRef.current) return;
    var el = scrollRef.current;
    var page = Math.round(el.scrollLeft / el.clientWidth);
    setActivePage(page);
  };

  var goTo = function(i) {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: i * scrollRef.current.clientWidth, behavior: "smooth" });
    }
  };

  return (
    <div>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        data-match-carousel=""
        style={{
          display: "flex", overflowX: "auto", scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch", scrollbarWidth: "none", msOverflowStyle: "none",
          gap: 0,
        }}
      >
        <div ref={statsRef} style={{ flex: "0 0 100%", scrollSnapAlign: "start", minWidth: "100%" }}>
          <PlayerBlock
            lastMatch={props.lastMatch} matchStats={props.matchStats}
            recentForm={props.recentForm} prizeMoney={props.prizeMoney}
            playerRanking={props.playerRanking} opponentProfile={props.opponentProfile}
          />
        </div>

        <div style={{ flex: "0 0 100%", scrollSnapAlign: "start", minWidth: "100%", display: "flex", flexDirection: "column" }}>
          <div style={{ borderRadius: 16, overflow: "hidden", background: "#000", border: "1px solid " + BORDER, flex: 1, display: "flex", flexDirection: "column", minHeight: statsHeight > 0 ? statsHeight : undefined }}>
            <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
              <iframe
                src={"https://www.youtube.com/embed/" + props.highlightVideo.videoId}
                title={props.highlightVideo.title || "Melhores momentos"}
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            {props.highlightVideo.title && (
              <div style={{ padding: "12px 16px", background: "#111" }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#fff", fontFamily: SANS }}>{props.highlightVideo.title}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 14 }}>
        <button onClick={function() { goTo(0); }} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", background: activePage === 0 ? BG_ALT : "transparent", border: "1px solid " + (activePage === 0 ? BORDER : "transparent"), borderRadius: 999, cursor: "pointer" }}>
          <span style={{ width: activePage === 0 ? 14 : 6, height: 6, borderRadius: 3, background: activePage === 0 ? GREEN : DIM, transition: "all 0.3s ease" }} />
          <span style={{ fontSize: 10, fontWeight: 600, color: activePage === 0 ? TEXT : DIM, fontFamily: SANS, transition: "color 0.3s ease" }}>Stats</span>
        </button>
        <button onClick={function() { goTo(1); }} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", background: activePage === 1 ? BG_ALT : "transparent", border: "1px solid " + (activePage === 1 ? BORDER : "transparent"), borderRadius: 999, cursor: "pointer" }}>
          <span style={{ width: activePage === 1 ? 14 : 6, height: 6, borderRadius: 3, background: activePage === 1 ? "#ef4444" : DIM, transition: "all 0.3s ease" }} />
          <svg width="10" height="10" viewBox="0 0 24 24" fill={activePage === 1 ? "#ef4444" : DIM} stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          <span style={{ fontSize: 10, fontWeight: 600, color: activePage === 1 ? TEXT : DIM, fontFamily: SANS, transition: "color 0.3s ease" }}>Melhores momentos</span>
        </button>
      </div>
    </div>
  );
};

export default MatchCarousel;
