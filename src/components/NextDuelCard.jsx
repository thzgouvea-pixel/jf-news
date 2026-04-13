import { useState, useEffect } from 'react';
import { GREEN, YELLOW, TEXT, DIM, SANS, SERIF, BORDER, CARD_SHADOW, surfaceColorMap, countryFlags, FONSECA_IMG, FONSECA_IMG_FALLBACK } from '../lib/constants';
import { findPlayer, getATPImage, getESPNImage } from '../lib/utils';

var BROADCAST_URLS = {
  "disney+": "https://www.disneyplus.com",
  "disneyplus": "https://www.disneyplus.com",
  "espn": "https://www.espn.com.br",
  "espn 2": "https://www.espn.com.br",
  "espn2": "https://www.espn.com.br",
  "espn 4": "https://www.espn.com.br",
  "star+": "https://www.starplus.com",
  "sportv": "https://ge.globo.com/sportv",
  "sportv 2": "https://ge.globo.com/sportv",
  "globoplay": "https://globoplay.globo.com",
  "tennis tv": "https://www.tennistv.com",
  "tennistv": "https://www.tennistv.com",
  "prime video": "https://www.primevideo.com",
  "amazon prime": "https://www.primevideo.com",
};

function getBroadcastUrl(broadcast) {
  if (!broadcast) return null;
  var key = broadcast.toLowerCase().trim();
  if (BROADCAST_URLS[key]) return BROADCAST_URLS[key];
  for (var k in BROADCAST_URLS) { if (key.includes(k)) return BROADCAST_URLS[k]; }
  return null;
}

function useCountdown(targetDate) {
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

export default function NextDuelCard(props) {
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

  // Timer for "updated ago" (must be before early return to keep hook order)
  var _now = useState(Date.now()); var now = _now[0]; var setNow = _now[1];
  useEffect(function() {
    var iv = setInterval(function() { setNow(Date.now()); }, 5000);
    return function() { clearInterval(iv); };
  }, []);

  var nextTournament = props.nextTournament || null;

  if (!match || !match.opponent_name || match.opponent_name === "A definir" || match.opponent_name === "A+definir") {
    if (!nextTournament) return null;

    var surfaceTranslatePrev = { "Clay": "Saibro", "Hard": "Duro", "Grass": "Grama" };
    var surfaceLabelPrev = surfaceTranslatePrev[nextTournament.surface] || nextTournament.surface || "";
    var scPrev = surfaceColorMap[nextTournament.surface] || "#999";
    var startD = new Date(nextTournament.start_date);
    var endD = nextTournament.end_date ? new Date(nextTournament.end_date) : null;
    var monthsShort = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
    var formattedDateRange = startD.getUTCDate() + " " + monthsShort[startD.getUTCMonth()] + (endD ? " - " + endD.getUTCDate() + " " + monthsShort[endD.getUTCMonth()] : "");
    var todayPrev = new Date();
    var endDMidnight = endD ? new Date(endD.getUTCFullYear(), endD.getUTCMonth(), endD.getUTCDate(), 23, 59, 59, 999) : null;
    var isOngoingPrev = todayPrev >= startD && (!endDMidnight || todayPrev <= endDMidnight);

    return (
      <section style={{ margin: "4px 0 0", padding: 0, background: "linear-gradient(160deg, #0a1220 0%, #111d33 40%, #0d1828 100%)", borderRadius: 22, position: "relative", overflow: "hidden", boxShadow: "0 4px 20px rgba(10,18,32,0.25)" }}>
        <div style={{ position: "absolute", top: -50, right: -50, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, " + scPrev + "10 0%, transparent 65%)", pointerEvents: "none" }} />

        {/* Top bar */}
        <div style={{ padding: "18px 20px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(79,195,247,0.7)", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.08em" }}>🎾 Próximo torneio</span>
          <span style={{ fontSize: 9, fontWeight: 800, color: scPrev, fontFamily: SANS, background: scPrev + "20", padding: "4px 10px", borderRadius: 999, textTransform: "uppercase", letterSpacing: "0.06em" }}>{surfaceLabelPrev}</span>
        </div>

        {/* Tournament name */}
        <div style={{ textAlign: "center", padding: "14px 18px 0" }}>
          <h2 style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-0.02em", lineHeight: 1.3 }}>
            {nextTournament.tournament_category + " · " + nextTournament.tournament_name}
          </h2>
        </div>

        {/* Players */}
        <div style={{ padding: "18px 18px 0" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 6, alignItems: "center" }}>
            {/* Fonseca */}
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", margin: "0 auto 8px", background: "#152035", border: "2.5px solid " + GREEN + "40", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <img src={FONSECA_IMG} alt="JF" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={function(e) { if (!e.target.dataset.tried) { e.target.dataset.tried = "1"; e.target.src = FONSECA_IMG_FALLBACK; } }} />
              </div>
              <span style={{ fontSize: 15, fontWeight: 700, color: "#fff", fontFamily: SERIF, display: "block", lineHeight: 1.2 }}>J. Fonseca</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontFamily: SANS, display: "block", marginTop: 3 }}>🇧🇷 {player && player.ranking ? "#" + player.ranking : "#40"}</span>
            </div>

            {/* VS */}
            <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.15)", fontFamily: SANS, letterSpacing: "0.05em" }}>VS</span>

            {/* Opponent placeholder */}
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", margin: "0 auto 8px", background: "#152035", border: "2.5px dashed rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 24, color: "rgba(255,255,255,0.12)" }}>?</span>
              </div>
              <span style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.25)", fontFamily: SERIF, display: "block", lineHeight: 1.2 }}>A definir</span>
            </div>
          </div>
        </div>

        {/* Info grid: Data + Cidade + País */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, padding: "22px 20px 0" }}>
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "14px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Período</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.9)", fontFamily: SANS }}>{formattedDateRange}</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "14px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Local</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.9)", fontFamily: SANS }}>{nextTournament.city}</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "14px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>País</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.9)", fontFamily: SANS }}>{nextTournament.country}</div>
          </div>
        </div>

        {/* Message + link */}
        <div style={{ padding: "20px 24px 22px", textAlign: "center" }}>
          {isOngoingPrev
            ? <p style={{ fontSize: 13, color: GREEN, fontFamily: SANS, margin: "0 0 14px", lineHeight: 1.5, fontWeight: 700 }}>🟢 Fonseca está neste torneio</p>
            : <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", fontFamily: SANS, margin: "0 0 14px", lineHeight: 1.5 }}>Aguardando confirmação do adversário</p>
          }
          <a href="https://www.atptour.com/en/players/joao-fonseca/f0fv/player-activity" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 20px", background: "rgba(79,195,247,0.1)", border: "1px solid rgba(79,195,247,0.2)", borderRadius: 12, color: "#4FC3F7", fontSize: 12, fontWeight: 700, fontFamily: SANS, textDecoration: "none" }}>
            Ver calendário ATP
          </a>
        </div>
      </section>
    );
  }

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
    var diaSemana = d.toLocaleDateString("pt-BR", { weekday: "short", timeZone: "America/Sao_Paulo" });
    var diaNum = d.toLocaleDateString("pt-BR", { day: "numeric", month: "short", timeZone: "America/Sao_Paulo" });
    var weekdayClean = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1).replace(".", "");
    return { weekday: weekdayClean, date: diaNum.replace(".", ""), time: h };
  })() : null;

  var downloadICS = function() {
    if (!match.date) return;
    var d = new Date(match.date);
    var pad = function(n) { return String(n).padStart(2, "0"); };
    var formatICS = function(dt) { return dt.getUTCFullYear() + pad(dt.getUTCMonth()+1) + pad(dt.getUTCDate()) + "T" + pad(dt.getUTCHours()) + pad(dt.getUTCMinutes()) + "00Z"; };
    var endDate = new Date(d.getTime() + 3 * 60 * 60 * 1000);
    var title = "J. Fonseca vs " + oppName + " — " + (match.tournament_name || "ATP");
    var location = (match.tournament_name || "") + (match.city ? ", " + match.city : "");
    var description = (match.tournament_category || "") + (match.round ? " · " + match.round : "") + "\\nfonsecanews.com.br";
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

  // Live stats extraction
  var liveStats = isLive && liveData.stats ? liveData.stats : null;

  // Time since last update (hooks already declared above)
  var checkedSecsAgo = isLive && liveData.checkedAt ? Math.floor((now - new Date(liveData.checkedAt).getTime()) / 1000) : null;

  // Live court from liveData or match
  var liveCourt = (isLive && liveData.court) ? liveData.court : (match.court || null);
  var liveRound = (isLive && liveData.round) ? liveData.round : (match.round || "");
  var liveSurface = isLive && liveData.surface ? liveData.surface : surfaceLabel;
  var liveSc = surfaceColorMap[liveSurface] || sc;

  return (
    <section style={{ margin: "4px 0 0", padding: 0, background: "linear-gradient(160deg, #0a1220 0%, #111d33 40%, #0d1828 100%)", borderRadius: 22, position: "relative", overflow: "hidden", boxShadow: isLive ? "0 4px 24px rgba(239,68,68,0.15), 0 4px 20px rgba(10,18,32,0.25)" : "0 4px 20px rgba(10,18,32,0.25)" }}>
      {/* Background glow */}
      <div style={{ position: "absolute", top: -50, right: -50, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, " + (isLive ? "#ef4444" : sc) + (isLive ? "18" : "10") + " 0%, transparent 65%)", pointerEvents: "none" }} />
      {isLive && <div style={{ position: "absolute", top: -30, left: -30, width: 160, height: 160, borderRadius: "50%", background: "radial-gradient(circle, #ef444410 0%, transparent 65%)", pointerEvents: "none" }} />}

      {/* ===== TOP BAR ===== */}
      <div style={{ padding: "18px 20px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {isLive ? (
            <>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", boxShadow: "0 0 8px #ef444480", animation: "pulse 1.5s ease-in-out infinite", display: "inline-block" }} />
              <span style={{ fontSize: 11, fontWeight: 800, color: "#ef4444", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.08em" }}>Ao vivo</span>
            </>
          ) : (
            <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(79,195,247,0.7)", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.08em" }}>Próximo jogo</span>
          )}
          {(liveRound || match.round) && <span style={{ fontSize: 14, fontWeight: 800, color: "#fff", fontFamily: SANS }}>{liveRound || match.round}</span>}
        </div>
        <span style={{ fontSize: 10, fontWeight: 800, color: isLive ? liveSc : sc, fontFamily: SANS, background: (isLive ? liveSc : sc) + "20", padding: "5px 14px", borderRadius: 999, textTransform: "uppercase", letterSpacing: "0.06em" }}>{isLive ? liveSurface : surfaceLabel}</span>
      </div>

      {/* ===== TOURNAMENT TITLE ===== */}
      <div style={{ textAlign: "center", padding: "14px 18px 0" }}>
        {isLive ? (
          <h2 style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-0.02em", lineHeight: 1.3 }}>{(liveData.tournament || match.tournament_name || "Partida ao vivo")}</h2>
        ) : (
          <h2 style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-0.02em", lineHeight: 1.3 }}>{(match.tournament_category ? match.tournament_category + " · " : "") + (match.tournament_name || "Próxima Partida")}</h2>
        )}
      </div>

      {/* ===== PLAYERS + SCORE ===== */}
      <div style={{ padding: "18px 18px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 6, alignItems: "center" }}>
          {/* Fonseca */}
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", margin: "0 auto 8px", background: "#152035", border: "2.5px solid " + (isLive ? GREEN + "70" : GREEN + "40"), overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <img src={FONSECA_IMG} alt="JF" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={function(e) { if (!e.target.dataset.tried) { e.target.dataset.tried = "1"; e.target.src = FONSECA_IMG_FALLBACK; } else { e.target.style.display = "none"; e.target.parentNode.innerHTML = '<span style="font-size:16px;font-weight:800;color:#00A859;font-family:Inter,sans-serif">JF</span>'; } }} />
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#fff", fontFamily: SERIF, display: "block", lineHeight: 1.2 }}>J. Fonseca</span>
            {isLive && liveServing === "fonseca" ? (
              <span style={{ fontSize: 11, color: YELLOW, fontFamily: SANS, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginTop: 3 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: YELLOW, display: "inline-block" }} />
                Sacando
              </span>
            ) : (
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontFamily: SANS, display: "block", marginTop: 3 }}>🇧🇷 {player && player.ranking ? "#" + player.ranking : "#40"}</span>
            )}
          </div>

          {/* Score center */}
          {isLive ? (
            <div style={{ textAlign: "center", minWidth: 90 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                <span style={{ fontSize: 34, fontWeight: 900, color: GREEN, fontFamily: SANS, lineHeight: 1 }}>{setsWon.fonseca || 0}</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: "rgba(255,255,255,0.12)", fontFamily: SANS }}>:</span>
                <span style={{ fontSize: 34, fontWeight: 900, color: "#ef4444", fontFamily: SANS, lineHeight: 1 }}>{setsWon.opponent || 0}</span>
              </div>
            </div>
          ) : (
            <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.15)", fontFamily: SANS, letterSpacing: "0.05em" }}>VS</span>
          )}

          {/* Opponent */}
          <div style={{ textAlign: "center" }} onClick={onOppClick ? function(){ onOppClick(); } : undefined} role={onOppClick ? "button" : undefined} tabIndex={onOppClick ? 0 : undefined}>
            <div style={{ position: "relative", width: 72, height: 72, margin: "0 auto 8px" }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#152035", border: "2.5px solid " + (isLive ? "#ef444450" : "rgba(255,255,255,0.12)"), overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", cursor: onOppClick ? "pointer" : "default" }}>
                {oppImg ? <img src={oppImg} alt={oppName} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={function(e) { if (oppImgFallback && !e.target.dataset.tried) { e.target.dataset.tried = "1"; e.target.src = oppImgFallback; } else { e.target.style.display = "none"; e.target.parentNode.innerHTML = "<span style='font-size:18px;font-weight:700;color:rgba(255,255,255,0.35);display:flex;align-items:center;justify-content:center;width:100%;height:100%'>" + oppName.charAt(0) + "</span>"; } }} /> : <span style={{ fontSize: 18, fontWeight: 700, color: "rgba(255,255,255,0.35)" }}>{oppName.charAt(0)}</span>}
              </div>
              {!isLive && onOppClick && <div style={{ position: "absolute", bottom: 0, right: 0, width: 22, height: 22, borderRadius: "50%", background: "#4FC3F7", border: "2.5px solid #111d33", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}><span style={{ color: "#fff", fontSize: 15, fontWeight: 700, lineHeight: 1 }}>+</span></div>}
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#fff", fontFamily: SERIF, display: "block", lineHeight: 1.2 }}>{oppName}</span>
            {isLive && liveServing === "opponent" ? (
              <span style={{ fontSize: 11, color: YELLOW, fontFamily: SANS, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginTop: 3 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: YELLOW, display: "inline-block" }} />
                Sacando
              </span>
            ) : (
              oppCountry ? <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontFamily: SANS, display: "block", marginTop: 3 }}>{oppFlag} {oppRanking ? "#" + oppRanking : ""}</span> : <span style={{ fontSize: 11, color: "rgba(255,255,255,0.15)", fontFamily: SANS, display: "block", marginTop: 3 }}>chave pendente</span>
            )}
          </div>
        </div>
      </div>

      {/* ===== LIVE CONTENT ===== */}
      {isLive ? (
        <>
          {/* Set-by-set scoreboard */}
          {fSets.length > 0 && (
            <div style={{ margin: "18px 20px 0", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0 }}>
                {/* Labels column */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginRight: 12, textAlign: "right" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.8)", fontFamily: SANS, lineHeight: "24px" }}>Fonseca</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.8)", fontFamily: SANS, lineHeight: "24px" }}>{oppName.split(" ").pop()}</span>
                </div>
                {/* Set scores */}
                {fSets.map(function(fs, i) {
                  var os = oSets[i];
                  var isCurrentSet = i === fSets.length - 1;
                  var fWon = !isCurrentSet && fs > os;
                  var oWon = !isCurrentSet && os > fs;
                  return (
                    <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 32, textAlign: "center" }}>
                      {i === 0 && <div style={{ display: "flex", justifyContent: "center", gap: 0, marginBottom: 2 }}>{fSets.map(function(_, si) { return <span key={si} style={{ fontSize: 8, fontWeight: 700, color: "rgba(255,255,255,0.2)", fontFamily: SANS, minWidth: 32, textAlign: "center" }}>{"S" + (si + 1)}</span>; })}</div>}
                      {i === 0 && (
                        <>
                          <div style={{ display: "flex", justifyContent: "center", gap: 0 }}>
                            {fSets.map(function(fss, si) {
                              var oss = oSets[si];
                              var isCur = si === fSets.length - 1;
                              var fw = !isCur && fss > oss;
                              return <span key={si} style={{ fontSize: 16, fontWeight: 800, color: fw ? GREEN : (isCur ? "#fff" : "rgba(255,255,255,0.4)"), fontFamily: SANS, minWidth: 32, textAlign: "center" }}>{fss}</span>;
                            })}
                          </div>
                          <div style={{ display: "flex", justifyContent: "center", gap: 0 }}>
                            {oSets.map(function(oss, si) {
                              var fss = fSets[si];
                              var isCur = si === fSets.length - 1;
                              var ow = !isCur && oss > fss;
                              return <span key={si} style={{ fontSize: 16, fontWeight: 800, color: ow ? "#ef4444" : (isCur ? "#fff" : "rgba(255,255,255,0.4)"), fontFamily: SANS, minWidth: 32, textAlign: "center" }}>{oss}</span>;
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  );
                }).slice(0, 1)}
              </div>
            </div>
          )}

          {/* Live stats (if available) */}
          {liveStats && (liveStats.fonseca || liveStats.opponent) && (function() {
            var f = liveStats.fonseca || {};
            var o = liveStats.opponent || {};
            var rows = [
              { label: "Aces", fVal: f.aces || 0, oVal: o.aces || 0 },
              { label: "Duplas faltas", fVal: f.doublefaults || f.double_faults || 0, oVal: o.doublefaults || o.double_faults || 0 },
              { label: "1º saque", fVal: f["1st_serve_percentage"] || f.firstserveaccuracy || 0, oVal: o["1st_serve_percentage"] || o.firstserveaccuracy || 0, pct: true },
              { label: "Break points", fVal: f.breakpointssaved || f.break_points_saved || 0, oVal: o.breakpointssaved || o.break_points_saved || 0 },
            ].filter(function(r) { return r.fVal > 0 || r.oVal > 0; });
            if (rows.length === 0) return null;
            return (
              <div style={{ margin: "10px 20px 0", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "14px 16px" }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.25)", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10, textAlign: "center" }}>Estatísticas ao vivo</div>
                {rows.map(function(row, i) {
                  var fBetter = row.fVal >= row.oVal;
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: i < rows.length - 1 ? 8 : 0 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: fBetter ? GREEN : "rgba(255,255,255,0.4)", fontFamily: SANS, width: 40, textAlign: "left" }}>{row.pct ? row.fVal + "%" : row.fVal}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.3)", fontFamily: SANS, textAlign: "center", flex: 1 }}>{row.label}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: !fBetter ? "#ef4444" : "rgba(255,255,255,0.4)", fontFamily: SANS, width: 40, textAlign: "right" }}>{row.pct ? row.oVal + "%" : row.oVal}</span>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* Info grid: Quadra + Transmissão */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "12px 20px 0" }}>
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "12px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Quadra</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.9)", fontFamily: SANS }}>{liveCourt || "A definir"}</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "12px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Transmissão</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.9)", fontFamily: SANS }}>{match.broadcast || "A confirmar"}</div>
            </div>
          </div>

          {/* Assista ao vivo button — only if broadcast is known */}
          {match.broadcast && getBroadcastUrl(match.broadcast) && (
          <div style={{ padding: "14px 20px 0" }}>
            <a href={getBroadcastUrl(match.broadcast)} target="_blank" rel="noopener noreferrer" style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              padding: "16px", background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
              borderRadius: 14, textDecoration: "none", width: "100%", boxSizing: "border-box",
              boxShadow: "0 4px 16px rgba(239,68,68,0.25)",
            }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#fff", animation: "pulse 1.5s ease-in-out infinite", display: "inline-block" }} />
              <span style={{ fontSize: 16, fontWeight: 800, color: "#fff", fontFamily: SANS, letterSpacing: "0.02em" }}>Assista ao vivo</span>
            </a>
          </div>
          )}

          {/* Updated ago indicator */}
          <div style={{ textAlign: "center", padding: "12px 20px 16px" }}>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", fontFamily: SANS }}>
              {checkedSecsAgo !== null ? (checkedSecsAgo < 10 ? "Atualizado agora" : "Atualizado há " + checkedSecsAgo + "s") : "Ao vivo"}
            </span>
          </div>
        </>
      ) : (
        <>
          {/* ===== PREMATCH CONTENT ===== */}
          {/* Info grid 2x2 — uniform cells */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "22px 20px 0" }}>
            {dateInfo && (
              <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "14px 12px", textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center", minHeight: 70 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Data</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.9)", fontFamily: SANS }}>{dateInfo.weekday + ", " + dateInfo.date}</div>
              </div>
            )}
            {dateInfo && (
              <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "14px 12px", textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center", minHeight: 70 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Horário (BRT)</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.9)", fontFamily: SANS }}>{dateInfo.time}</div>
              </div>
            )}
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "14px 12px", textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center", minHeight: 70 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Quadra</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.9)", fontFamily: SANS }}>{match.court || "A definir"}</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "14px 12px", textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center", minHeight: 70 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Transmissão</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.9)", fontFamily: SANS }}>{match.broadcast || "A confirmar"}</div>
            </div>
          </div>

          {/* Countdown */}
          {countdownText && (
            <div style={{ margin: "14px 20px 0", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "16px 18px", textAlign: "center" }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(79,195,247,0.6)", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Contagem regressiva</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", fontFamily: SANS, letterSpacing: "0.02em" }}>{(function() {
                if (countdown.expired) return "";
                var p = [];
                if (countdown.days > 0) p.push(countdown.days + "d");
                p.push(String(countdown.hours).padStart(2, "0") + "h");
                p.push(String(countdown.minutes).padStart(2, "0") + "m");
                p.push(String(countdown.seconds).padStart(2, "0") + "s");
                return p.join(" ");
              })()}</div>
            </div>
          )}

          {/* Probability — always visible */}
          <div style={{ margin: "16px 20px 0", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "16px 18px" }}>
            {fPct !== null && oPct !== null ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 8 }}>
                  <div>
                    <span style={{ fontSize: 9, fontWeight: 700, color: GREEN, fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 2 }}>João</span>
                    <span style={{ fontSize: 26, fontWeight: 900, color: fPct >= oPct ? GREEN : "rgba(255,255,255,0.3)", fontFamily: SANS, lineHeight: 1 }}>{fPct + "%"}</span>
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.2)", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.06em", textAlign: "center", paddingBottom: 4 }}>Probabilidade de{"\n"}vitória</span>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: "#ef4444", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 2 }}>{oppName.split(" ").pop()}</span>
                    <span style={{ fontSize: 26, fontWeight: 900, color: oPct > fPct ? "#ef4444" : "rgba(255,255,255,0.3)", fontFamily: SANS, lineHeight: 1 }}>{oPct + "%"}</span>
                  </div>
                </div>
                <div style={{ display: "flex", height: 6, borderRadius: 4, overflow: "hidden", gap: 2 }}>
                  <div style={{ width: fPct + "%", background: "linear-gradient(90deg, " + GREEN + ", #22c55e)", borderRadius: 4, transition: "width 0.8s ease" }} />
                  <div style={{ width: oPct + "%", background: "linear-gradient(90deg, #ef4444, #f87171)", borderRadius: 4, transition: "width 0.8s ease" }} />
                </div>
              </>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 8 }}>
                  <div>
                    <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.15)", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 2 }}>João</span>
                    <span style={{ fontSize: 26, fontWeight: 900, color: "rgba(255,255,255,0.1)", fontFamily: SANS, lineHeight: 1 }}>—</span>
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.15)", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.06em", textAlign: "center", paddingBottom: 4 }}>Probabilidade de{"\n"}vitória</span>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.15)", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 2 }}>{oppName.split(" ").pop()}</span>
                    <span style={{ fontSize: 26, fontWeight: 900, color: "rgba(255,255,255,0.1)", fontFamily: SANS, lineHeight: 1 }}>—</span>
                  </div>
                </div>
                <div style={{ display: "flex", height: 6, borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: "100%", height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 4 }} />
                </div>
                <p style={{ margin: "10px 0 0", fontSize: 10, color: "rgba(255,255,255,0.2)", fontFamily: SANS, textAlign: "center" }}>Probabilidades ainda não disponíveis</p>
              </>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ padding: "16px 20px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
            {match.broadcast && getBroadcastUrl(match.broadcast) && (
            <a href={getBroadcastUrl(match.broadcast)} target="_blank" rel="noopener noreferrer" style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "16px", background: "linear-gradient(135deg, #4FC3F7 0%, #39B0E4 100%)",
              borderRadius: 14, textDecoration: "none", width: "100%", boxSizing: "border-box",
            }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: "#fff", fontFamily: SANS, letterSpacing: "0.01em" }}>► Assistir</span>
            </a>
            )}
            <button onClick={downloadICS} style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 14, cursor: "pointer", color: "rgba(255,255,255,0.6)", fontSize: 14, fontWeight: 700, fontFamily: SANS, width: "100%", boxSizing: "border-box",
            }}>
              Adicionar ao calendário
            </button>
          </div>
        </>
      )}

      {/* ===== CONTEXT FACTS (both modes) ===== */}
      {facts && facts.length > 0 && !isLive && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)", padding: "16px 20px 18px", marginTop: 16, textAlign: "center" }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.25)", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>{"Curiosidades de " + (match.tournament_name || "").split(",")[0].trim()}</span>
          {factIdx % (facts.length + 1) === 0 ? null : (
            <span style={{ fontSize: 11, color: "rgba(79,195,247,0.65)", fontFamily: SANS, fontWeight: 500, whiteSpace: "nowrap", display: "block" }}>{facts[(factIdx - 1) % facts.length].text}</span>
          )}
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.15)", fontFamily: SANS, display: "block", marginTop: 6 }}>{factIdx % (facts.length + 1) === 0 ? "" : ((factIdx - 1) % facts.length + 1) + "/" + facts.length}</span>
        </div>
      )}
    </section>
  );
}
