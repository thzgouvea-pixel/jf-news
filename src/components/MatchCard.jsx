import { useState, useEffect, useRef } from "react";
import { GREEN, YELLOW, RED, TEXT, SUB, DIM, BORDER, SERIF, SANS, surfaceColorMap, countryFlags, findPlayer, getATPImage, getESPNImage, FONSECA_IMG, FONSECA_IMG_FALLBACK } from "./constants";

// ===== USE COUNTDOWN HOOK =====
export function useCountdown(targetDate) {
  var _s = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
  var countdown = _s[0]; var setCountdown = _s[1];
  useEffect(function() {
    if (!targetDate) return;
    function calc() {
      var now = new Date().getTime(); var target = new Date(targetDate).getTime(); var diff = target - now;
      if (diff <= 0) { setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true }); return; }
      setCountdown({ days: Math.floor(diff / (1000 * 60 * 60 * 24)), hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)), minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)), seconds: Math.floor((diff % (1000 * 60)) / 1000), expired: false });
    }
    calc(); var iv = setInterval(calc, 1000); return function() { clearInterval(iv); };
  }, [targetDate]);
  return countdown;
}

// ===== TOURNAMENT FACTS CAROUSEL =====
export var TournamentFactsCarousel = function(props) {
  var facts = props.facts || [];
  var tournamentName = props.tournamentName || "";
  var surface = props.surface || "";
  var surfaceColor = surfaceColorMap[surface] || "#E8734A";
  var _idx = useState(0); var activeIdx = _idx[0]; var setActiveIdx = _idx[1];
  var _fade = useState(true); var visible = _fade[0]; var setVisible = _fade[1];
  var _paused = useState(false); var paused = _paused[0]; var setPaused = _paused[1];
  var touchStartX = useRef(0);

  var cleanFacts = facts.map(function(f) {
    var t = (f.text || "").replace(/\[\[([^\]|]*\|)?([^\]]*)\]\]/g, "$2").replace(/\{\{[^}]*\}\}/g, "").replace(/'{2,}/g, "").trim();
    t = t.replace(/Clay court/gi, "Saibro").replace(/Hard court/gi, "Piso duro").replace(/Grass court/gi, "Grama");
    return { text: t };
  });

  if (cleanFacts.length === 0) return null;

  useEffect(function() {
    if (paused || cleanFacts.length <= 1) return;
    var iv = setInterval(function() {
      setVisible(false);
      setTimeout(function() {
        setActiveIdx(function(prev) { return (prev + 1) % cleanFacts.length; });
        setVisible(true);
      }, 350);
    }, 5000);
    return function() { clearInterval(iv); };
  }, [paused, cleanFacts.length]);

  var goTo = function(i) {
    if (i === activeIdx) return;
    setVisible(false);
    setTimeout(function() { setActiveIdx(i); setVisible(true); }, 250);
    setPaused(true);
    setTimeout(function() { setPaused(false); }, 10000);
  };

  var handleTouchStart = function(e) { touchStartX.current = e.touches[0].clientX; };
  var handleTouchEnd = function(e) {
    var diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) goTo((activeIdx + 1) % cleanFacts.length);
      else goTo((activeIdx - 1 + cleanFacts.length) % cleanFacts.length);
    }
  };

  var fact = cleanFacts[activeIdx];
  var shortName = (tournamentName || "").split(",")[0].trim();

  return (
    <section style={{ padding: "4px 0 0" }}>
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          background: "linear-gradient(160deg, #0a1220 0%, #111d33 50%, #0d1828 100%)",
          borderRadius: 14,
          padding: "12px 18px 10px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 6 }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.25)", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.06em" }}>Curiosidades · {shortName}</span>
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.12)", fontFamily: SANS }}>{(activeIdx + 1) + "/" + cleanFacts.length}</span>
        </div>

        <div style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateX(0)" : "translateX(8px)",
          transition: "opacity 0.35s ease, transform 0.35s ease",
          overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", textAlign: "center",
        }}>
          <span key={activeIdx} ref={function(el) {
            if (el) {
              el.style.fontSize = "13px";
              if (el.scrollWidth > el.parentElement.clientWidth) {
                var size = 13;
                while (size > 8 && el.scrollWidth > el.parentElement.clientWidth) {
                  size -= 0.5;
                  el.style.fontSize = size + "px";
                }
              }
            }
          }} style={{
            fontSize: 13, fontWeight: 500, color: "#4FC3F7",
            fontFamily: SANS, lineHeight: 1.4, whiteSpace: "nowrap",
          }}>{fact.text}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, marginTop: 8 }}>
          {cleanFacts.map(function(_, i) {
            var isActive = i === activeIdx;
            return (
              <button
                key={i}
                onClick={function() { goTo(i); }}
                style={{
                  width: isActive ? 16 : 5, height: 5,
                  borderRadius: 3,
                  background: isActive ? "#4FC3F7" : "rgba(255,255,255,0.12)",
                  border: "none", padding: 0, cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              />
            );
          })}
        </div>

        {!paused && cleanFacts.length > 1 && (
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: "rgba(255,255,255,0.03)" }}>
            <div style={{ height: 2, background: "#4FC3F730", borderRadius: 1, animation: "factProgress 5s linear infinite" }} />
          </div>
        )}
      </div>
    </section>
  );
};

// ===== NEXT DUEL CARD =====
export var NextDuelCard = function(props) {
  var match = props.match; var player = props.player;
  var onOppClick = props.onOppClick;
  var winProb = props.winProb;
  var onPushClick = props.onPushClick;
  var pushEnabled = props.pushEnabled;
  var pushLoading = props.pushLoading;
  var oppProfile = props.oppProfile;
  var liveData = props.liveData || null;
  var facts = props.tournamentFacts || null;
  var countdown = useCountdown(match ? match.date : null);
  var _factIdx = useState(0); var factIdx = _factIdx[0]; var setFactIdx = _factIdx[1];
  useEffect(function() {
    if (!facts || !facts.length) return;
    var iv = setInterval(function() { setFactIdx(function(p) { return (p + 1) % (facts.length + 1); }); }, 5000);
    return function() { clearInterval(iv); };
  }, [facts]);
  if (!match) return null;

  var isLive = liveData && liveData.live;

  var oppName = isLive ? (liveData.opponent && liveData.opponent.name || match.opponent_name || "A definir") : (match.opponent_name || "A definir");
  var oppRanking = match.opponent_ranking || (oppProfile && oppProfile.ranking ? oppProfile.ranking : null);
  var oppCountry = match.opponent_country || (oppProfile && oppProfile.country ? oppProfile.country : "");
  var oppFlag = countryFlags[oppCountry] || "";
  var oppAtpSlug = match.opponent_atp_slug || null;
  if (!oppAtpSlug) { var fp = findPlayer(oppName); if (fp && fp.data.slug) oppAtpSlug = fp.data.slug; }

  var oppImg = getATPImage(oppName);
  var oppImgFallback = getESPNImage(oppName);

  var sc = surfaceColorMap[match.surface] || "#999";
  var surfaceTranslate = { "Clay": "Saibro", "Hard": "Duro", "Grass": "Grama", "Clay court": "Saibro", "Hard court": "Duro", "Saibro": "Saibro", "Duro": "Duro", "Grama": "Grama" };
  var surfaceLabel = surfaceTranslate[match.surface] || match.surface || "";

  var fPct = winProb && winProb.fonseca ? Math.round(winProb.fonseca) : null;
  var oPct = winProb && winProb.opponent ? Math.round(winProb.opponent) : null;

  if (fPct === null && player && player.ranking && oppRanking) {
    var fRank = player.ranking;
    var oRank = oppRanking;
    var rankDiff = oRank - fRank;
    var exponent = -rankDiff / 16;
    var fProb = 1 / (1 + Math.pow(10, exponent));
    fProb = Math.min(0.92, Math.max(0.08, fProb + 0.03));
    fPct = Math.round(fProb * 100);
    oPct = 100 - fPct;
  }

  var dateInfo = match.date ? (function() {
    var d = new Date(match.date);
    var h = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
    var diaSemana = d.toLocaleDateString("pt-BR", { weekday: "long", timeZone: "America/Sao_Paulo" });
    var diaNum = d.toLocaleDateString("pt-BR", { day: "numeric", month: "long", timeZone: "America/Sao_Paulo" });
    return { weekday: diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1), date: diaNum, time: h };
  })() : null;

  var downloadICS = function() {
    if (!match.date) return;
    var d = new Date(match.date);
    var pad = function(n) { return String(n).padStart(2, "0"); };
    var formatICS = function(dt) { return dt.getUTCFullYear() + pad(dt.getUTCMonth()+1) + pad(dt.getUTCDate()) + "T" + pad(dt.getUTCHours()) + pad(dt.getUTCMinutes()) + "00Z"; };
    var endDate = new Date(d.getTime() + 3 * 60 * 60 * 1000);
    var title = "J. Fonseca vs " + oppName + " — " + (match.tournament_name || "ATP");
    var location = (match.tournament_name || "") + (match.city ? ", " + match.city : "");
    var description = (match.tournament_category || "") + (match.round ? " · " + match.round : "") + "\\nESPN 2 · Disney+\\nfonsecanews.com.br";
    var ics = ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//FonsecaNews//PT","BEGIN:VEVENT","DTSTART:" + formatICS(d),"DTEND:" + formatICS(endDate),"SUMMARY:" + title,"LOCATION:" + location,"DESCRIPTION:" + description,"BEGIN:VALARM","TRIGGER:-PT30M","ACTION:DISPLAY","DESCRIPTION:Jogo do João Fonseca em 30 minutos!","END:VALARM","END:VEVENT","END:VCALENDAR"].join("\r\n");
    var blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = "fonseca-vs-" + oppName.replace(/[^a-zA-Z]/g, "").toLowerCase() + ".ics";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  var countdownText = "";
  if (!countdown.expired) {
    var parts = [];
    if (countdown.days > 0) parts.push(countdown.days + (countdown.days === 1 ? " dia" : " dias"));
    if (countdown.hours > 0) parts.push(countdown.hours + (countdown.hours === 1 ? " hora" : " horas"));
    if (countdown.minutes > 0 || parts.length === 0) parts.push(countdown.minutes + (countdown.minutes === 1 ? " minuto" : " minutos"));
    if (parts.length === 1) countdownText = "Faltam: " + parts[0];
    else if (parts.length === 2) countdownText = "Faltam: " + parts[0] + " e " + parts[1];
    else countdownText = "Faltam: " + parts[0] + ", " + parts[1] + " e " + parts[2];
  }

  var liveScore = isLive ? liveData.score || {} : {};
  var fSets = liveScore.fonseca_sets || [];
  var oSets = liveScore.opponent_sets || [];
  var setsWon = liveScore.sets_won || {};
  var liveServing = liveScore.serving || "";

  return (
    <section style={{ margin: "4px 0 0", padding: 0, background: "linear-gradient(160deg, #0a1220 0%, #111d33 40%, #0d1828 100%)", borderRadius: 20, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -50, right: -50, width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle, " + (isLive ? "#ef4444" : sc) + "10 0%, transparent 65%)", pointerEvents: "none" }} />

      <div style={{ padding: "18px 20px 6px", display: "flex", alignItems: "center", gap: 8 }}>
        {isLive ? (
          <>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", animation: "pulse 1.5s ease-in-out infinite", display: "inline-block" }} />
            <span style={{ fontSize: 10, fontWeight: 800, color: "#ef4444", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.08em" }}>Ao vivo{match.round ? " · " + match.round : ""}</span>
          </>
        ) : (
          <>
            <div style={{ width: 20, height: 20, borderRadius: 6, background: "rgba(79,195,247,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#4FC3F7" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="12" x2="16" y2="14"/></svg>
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.1em" }}>Próximo jogo</span>
          </>
        )}
      </div>

      {!isLive && (
        <div style={{ padding: "14px 20px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: sc, fontFamily: SANS, background: sc + "18", padding: "3px 10px", borderRadius: 999, textTransform: "uppercase", letterSpacing: "0.05em" }}>{surfaceLabel}</span>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: SANS, fontWeight: 600 }}>{match.tournament_category || ""}</span>
          </div>
          {match.round && <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(79,195,247,0.7)", fontFamily: SANS, background: "rgba(79,195,247,0.08)", padding: "4px 12px", whiteSpace: "nowrap", borderRadius: 999 }}>{match.round}</span>}
        </div>
      )}

      <div style={{ textAlign: "center", padding: "14px 18px 0" }}>
        {isLive && <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.25)", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>Jogo em andamento</span>}
        <h2 style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-0.02em" }}>{(function() {
          var name = (match.tournament_name || "Próxima Partida").split(",")[0].trim();
          var cat = (match.tournament_category || "").toLowerCase();
          var pts = "";
          if (cat.includes("grand slam") || ["australian open","roland garros","french open","wimbledon","us open"].some(function(gs) { return name.toLowerCase().includes(gs); })) pts = " 2000";
          else if (cat.includes("masters 1000") || cat.includes("1000") || ["monte carlo","madrid","roma","indian wells","miami","canadian","cincinnati","shanghai","paris"].some(function(m) { return name.toLowerCase().includes(m); })) pts = " 1000";
          else if (cat.includes("500") || ["rio open","basel","barcelona","vienna","hamburg","queen","halle"].some(function(m) { return name.toLowerCase().includes(m); })) pts = " 500";
          else if (cat.includes("250")) pts = " 250";
          return name + pts;
        })()}</h2>
      </div>

      <div style={{ padding: "20px 18px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 6, alignItems: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 68, height: 68, borderRadius: "50%", margin: "0 auto 6px", background: "#152035", border: "2.5px solid " + (isLive ? GREEN + "60" : GREEN + "35"), overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <img src={FONSECA_IMG} alt="JF" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={function(e) { if (!e.target.dataset.tried) { e.target.dataset.tried = "1"; e.target.src = FONSECA_IMG_FALLBACK; } else { e.target.style.display = "none"; e.target.parentNode.innerHTML = '<span style="font-size:16px;font-weight:800;color:#00A859;font-family:Inter,sans-serif">JF</span>'; } }} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: SERIF, display: "block", lineHeight: 1.2 }}>J. Fonseca</span>
            {isLive && liveServing === "fonseca" ? <span style={{ fontSize: 10, color: YELLOW, fontFamily: SANS, display: "block", marginTop: 2 }}>🇧🇷 Sacando</span> : <span style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", fontFamily: SANS, display: "block", marginTop: 2 }}>🇧🇷 {player ? "#" + player.ranking : ""}</span>}
          </div>
          {isLive ? (
            <div style={{ textAlign: "center", minWidth: 80 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: GREEN, fontFamily: SANS }}>{setsWon.fonseca || 0}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.15)", fontFamily: SANS }}>-</span>
                <span style={{ fontSize: 28, fontWeight: 800, color: "#ef4444", fontFamily: SANS }}>{setsWon.opponent || 0}</span>
              </div>
              {fSets.length > 0 && (
                <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 4 }}>
                  {fSets.map(function(s, i) {
                    return (<span key={i} style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: SANS }}>{s}-{oSets[i]}</span>);
                  })}
                </div>
              )}
            </div>
          ) : (
            <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.15)", fontFamily: SANS, letterSpacing: "0.05em" }}>VS</span>
          )}
          <div style={{ textAlign: "center" }} onClick={onOppClick ? function(){ onOppClick(); } : undefined} role={onOppClick ? "button" : undefined} tabIndex={onOppClick ? 0 : undefined}>
            <div style={{ position: "relative", width: 68, height: 68, margin: "0 auto 6px" }}>
              <div style={{ width: 68, height: 68, borderRadius: "50%", background: "#152035", border: "2.5px solid rgba(255,255,255,0.1)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", cursor: onOppClick ? "pointer" : "default" }}>
                {oppImg ? <img src={oppImg} alt={oppName} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={function(e) { if (oppImgFallback && !e.target.dataset.tried) { e.target.dataset.tried = "1"; e.target.src = oppImgFallback; } else { e.target.style.display = "none"; e.target.parentNode.innerHTML = "<span style='font-size:18px;font-weight:700;color:rgba(255,255,255,0.35);display:flex;align-items:center;justify-content:center;width:100%;height:100%'>" + oppName.charAt(0) + "</span>"; } }} /> : <span style={{ fontSize: 18, fontWeight: 700, color: "rgba(255,255,255,0.35)" }}>{oppName.charAt(0)}</span>}
              </div>
              {!isLive && onOppClick && <div style={{ position: "absolute", bottom: 0, right: 0, width: 22, height: 22, borderRadius: "50%", background: "#4FC3F7", border: "2.5px solid #111d33", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}><span style={{ color: "#fff", fontSize: 15, fontWeight: 700, lineHeight: 1 }}>+</span></div>}
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: SERIF, display: "block", lineHeight: 1.2 }}>{oppName}</span>
            {isLive && liveServing === "opponent" ? <span style={{ fontSize: 10, color: YELLOW, fontFamily: SANS, display: "block", marginTop: 2 }}>{oppFlag} Sacando</span> : (oppCountry ? <span style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", fontFamily: SANS, display: "block", marginTop: 2 }}>{oppFlag} {oppRanking ? "#" + oppRanking : ""}</span> : <span style={{ fontSize: 10, color: "rgba(255,255,255,0.15)", fontFamily: SANS, display: "block", marginTop: 2 }}>chave pendente</span>)}
          </div>
        </div>
      </div>

      {isLive ? (
        <>
          <div style={{ padding: "22px 18px 24px" }}>
            <a href="https://www.disneyplus.com" target="_blank" rel="noopener noreferrer" style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              padding: "16px", background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
              borderRadius: 14, textDecoration: "none", width: "100%", boxSizing: "border-box",
            }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#fff", animation: "pulse 1.5s ease-in-out infinite", display: "inline-block" }} />
              <span style={{ fontSize: 15, fontWeight: 800, color: "#fff", fontFamily: SANS, letterSpacing: "0.02em" }}>Assista ao vivo</span>
            </a>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginTop: 10 }}>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: SANS }}>ESPN 2 · Disney+</span>
            </div>
            {match.court ? <div style={{ textAlign: "center", marginTop: 8 }}><span style={{ fontSize: 12, color: "rgba(79,195,247,0.6)", fontFamily: SANS, fontWeight: 600, letterSpacing: "0.02em" }}>{"Quadra " + match.court}</span></div> : null}
          </div>
        </>
      ) : (
        <>
          {fPct !== null && oPct !== null && (
            <div style={{ padding: "22px 20px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 20, fontWeight: 900, color: fPct >= oPct ? GREEN : "rgba(255,255,255,0.25)", fontFamily: SANS }}>{fPct + "%"}</span>
                <span style={{ fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.2)", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.06em" }}>Probabilidade de vitória</span>
                <span style={{ fontSize: 20, fontWeight: 900, color: oPct > fPct ? "#ef4444" : "rgba(255,255,255,0.25)", fontFamily: SANS }}>{oPct + "%"}</span>
              </div>
              <div style={{ display: "flex", height: 5, borderRadius: 3, overflow: "hidden", gap: 2 }}>
                <div style={{ width: fPct + "%", background: "linear-gradient(90deg, " + GREEN + ", #22c55e)", borderRadius: 3, transition: "width 0.8s ease" }} />
                <div style={{ width: oPct + "%", background: "linear-gradient(90deg, #ef4444, #f87171)", borderRadius: 3, transition: "width 0.8s ease" }} />
              </div>
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "18px 20px" }}>
            {dateInfo && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: "10px 12px" }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(79,195,247,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4FC3F7" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </div>
                <div><div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.06em" }}>Data</div><div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.8)", fontFamily: SANS, marginTop: 1 }}>{dateInfo.weekday + ", " + dateInfo.date}</div></div>
              </div>
            )}
            {dateInfo && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: "10px 12px" }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(79,195,247,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4FC3F7" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                </div>
                <div><div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.06em" }}>Horário</div><div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.8)", fontFamily: SANS, marginTop: 1 }}>{dateInfo.time}</div></div>
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: "10px 12px" }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(79,195,247,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4FC3F7" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              </div>
              <div><div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.06em" }}>Quadra</div><div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.8)", fontFamily: SANS, marginTop: 1 }}>{match.court || "A definir"}</div></div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: "10px 12px" }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(79,195,247,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4FC3F7" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              </div>
              <div><div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.06em" }}>Transmissão</div><div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.8)", fontFamily: SANS, marginTop: 1 }}>ESPN 2 · Disney+</div></div>
            </div>
          </div>
          {countdownText && <div style={{ textAlign: "center", padding: "4px 0 4px" }}><span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: SANS }}>{countdownText}</span></div>}
          <div style={{ padding: "4px 20px 18px", display: "flex", gap: 10 }}>
            <button onClick={downloadICS} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "12px 8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, cursor: "pointer", color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 600, fontFamily: SANS }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Adicionar ao Calendário
            </button>
            <a href="https://www.disneyplus.com" target="_blank" rel="noopener noreferrer" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "12px 8px", background: "rgba(79,195,247,0.08)", border: "1px solid rgba(79,195,247,0.15)", borderRadius: 12, textDecoration: "none", fontSize: 12, fontWeight: 600, fontFamily: SANS, color: "#4FC3F7" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Assistir
            </a>
          </div>
        </>
      )}
      {facts && facts.length > 0 && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)", padding: "14px 20px", textAlign: "center" }}>
          {factIdx % (facts.length + 1) === 0 ? (
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", fontFamily: SANS, fontWeight: 600 }}>{"Curiosidades sobre " + (match.tournament_name || "o torneio")}</span>
          ) : (
            <span style={{ fontSize: 12, color: "rgba(79,195,247,0.6)", fontFamily: SANS, fontWeight: 500 }}>{facts[(factIdx - 1) % facts.length].text}</span>
          )}
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.15)", fontFamily: SANS, display: "block", marginTop: 4 }}>{factIdx % (facts.length + 1) === 0 ? "" : ((factIdx - 1) % facts.length + 1) + "/" + facts.length}</span>
        </div>
      )}
    </section>
  );
};

// ===== LIVE SCORE CARD =====
export var LiveScoreCard = function(props) {
  var data = props.data;
  if (!data || !data.live) return null;

  var opponent = data.opponent || {};
  var score = data.score || {};
  var stats = data.stats || {};
  var fSets = score.fonseca_sets || [];
  var oSets = score.opponent_sets || [];
  var setsWon = score.sets_won || {};
  var currentGame = score.current_game || {};
  var serving = score.serving || "";

  var oppName = opponent.name || "Oponente";
  var oppShort = oppName.length > 12 ? oppName.split(" ").pop() : oppName;

  var tourneyName = data.tournament || "";
  var surface = data.surface || "";
  var sc = surfaceColorMap[surface] || "#999";
  var statusText = data.status || "Ao vivo";
  var roundText = data.round || "";

  var fStats = stats.fonseca || {};
  var oStats = stats.opponent || {};

  var fST = (fStats.firstserveaccuracy||0) + (fStats.secondserveaccuracy||0) + (fStats.doublefaults||0);
  var oST = (oStats.firstserveaccuracy||0) + (oStats.secondserveaccuracy||0) + (oStats.doublefaults||0);
  var liveStatRows = [
    { label: "Aces", f: fStats.aces || 0, o: oStats.aces || 0 },
    { label: "D. Faltas", f: fStats.doublefaults || 0, o: oStats.doublefaults || 0, invert: true },
    { label: "1o Saque %", f: fST > 0 ? Math.round((fStats.firstserveaccuracy||0)/fST*100) : 0, o: oST > 0 ? Math.round((oStats.firstserveaccuracy||0)/oST*100) : 0, pct: true },
    { label: "Winners", f: fStats.winners || 0, o: oStats.winners || 0 },
    { label: "Break Points", f: fStats.breakpointsscored || 0, o: oStats.breakpointsscored || 0 },
    { label: "Pontos", f: (fStats.servicepointsscored||0) + (fStats.receiverpointsscored||0) || fStats.pointstotal || 0, o: (oStats.servicepointsscored||0) + (oStats.receiverpointsscored||0) || oStats.pointstotal || 0 },
  ].filter(function(r) { return r.f > 0 || r.o > 0; });

  return (
    <section style={{ margin: "4px 0 0", padding: "20px 24px", background: "linear-gradient(145deg, #0D1726 0%, #1a3050 100%)", borderRadius: 20, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 16, right: 20, display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", animation: "pulse 1.5s ease-in-out infinite", display: "inline-block" }} />
        <span style={{ fontSize: 10, fontWeight: 700, color: "#ef4444", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.08em" }}>Ao vivo</span>
      </div>

      <div style={{ textAlign: "center", marginBottom: 16 }}>
        {surface && <span style={{ fontSize: 10, fontWeight: 700, color: sc, fontFamily: SANS }}>{surface}</span>}
        {tourneyName && <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: SANS }}>{surface ? " · " : ""}{tourneyName}</span>}
        {roundText && <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: SANS }}> · {roundText}</span>}
        <div style={{ marginTop: 4 }}><span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontFamily: SANS }}>{statusText}</span></div>
      </div>

      <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 12, padding: "16px 20px", marginBottom: liveStatRows.length > 0 ? 16 : 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: GREEN, fontFamily: SERIF }}>J. Fonseca</span>
            {serving === "fonseca" && <span style={{ width: 6, height: 6, borderRadius: "50%", background: YELLOW, display: "inline-block" }} />}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {serving === "opponent" && <span style={{ width: 6, height: 6, borderRadius: "50%", background: YELLOW, display: "inline-block" }} />}
            <span style={{ fontSize: 15, fontWeight: 700, color: "#fff", fontFamily: SERIF }}>{oppShort}</span>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {fSets.map(function(s, i) {
              var won = (oSets[i] !== undefined) ? s > oSets[i] : false;
              var isCurrentSet = i === fSets.length - 1 && !((setsWon.fonseca || 0) + (setsWon.opponent || 0) >= 2);
              return (<span key={i} style={{ fontSize: 22, fontWeight: 800, color: won ? GREEN : (isCurrentSet ? "#fff" : "rgba(255,255,255,0.5)"), fontFamily: SANS }}>{s}</span>);
            })}
            {currentGame.fonseca !== undefined && currentGame.fonseca !== "" && <span style={{ fontSize: 16, fontWeight: 600, color: YELLOW, fontFamily: SANS, marginLeft: 6 }}>{currentGame.fonseca}</span>}
          </div>
          <div style={{ textAlign: "center" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.15)", fontFamily: SANS }}>SETS</span>
            <div style={{ fontSize: 14, fontWeight: 800, color: "rgba(255,255,255,0.3)", fontFamily: SANS, marginTop: 2 }}>{(setsWon.fonseca || 0)} - {(setsWon.opponent || 0)}</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {currentGame.opponent !== undefined && currentGame.opponent !== "" && <span style={{ fontSize: 16, fontWeight: 600, color: YELLOW, fontFamily: SANS, marginRight: 6 }}>{currentGame.opponent}</span>}
            {oSets.map(function(s, i) {
              var won = (fSets[i] !== undefined) ? s > fSets[i] : false;
              var isCurrentSet = i === oSets.length - 1 && !((setsWon.fonseca || 0) + (setsWon.opponent || 0) >= 2);
              return (<span key={i} style={{ fontSize: 22, fontWeight: 800, color: won ? "#ef4444" : (isCurrentSet ? "#fff" : "rgba(255,255,255,0.5)"), fontFamily: SANS }}>{s}</span>);
            })}
          </div>
        </div>
      </div>

      {liveStatRows.length > 0 && (
        <div style={{ padding: "0 4px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: GREEN, fontFamily: SANS }}>Fonseca</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.4)", fontFamily: SANS }}>{oppShort}</span>
          </div>
          {liveStatRows.map(function(row, i) {
            var fBetter = row.invert ? row.f < row.o : row.f >= row.o;
            return (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: fBetter ? GREEN : "rgba(255,255,255,0.4)", fontFamily: SANS, width: 30 }}>{row.pct ? row.f + "%" : row.f}</span>
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontFamily: SANS, textAlign: "center", flex: 1 }}>{row.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: !fBetter ? "#ef4444" : "rgba(255,255,255,0.4)", fontFamily: SANS, width: 30, textAlign: "right" }}>{row.pct ? row.o + "%" : row.o}</span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default NextDuelCard;
