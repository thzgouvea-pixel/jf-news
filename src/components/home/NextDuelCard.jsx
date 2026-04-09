import React, { useEffect, useState } from "react";
import useCountdown from "../../hooks/useCountdown";
import countryFlags from "../../data/countryFlags";
import { findPlayer, getATPImage, getESPNImage } from "../../data/playerDb";

const GREEN = "#00A859";
const YELLOW = "#FFCB05";
const SANS = "'Inter', -apple-system, sans-serif";
const SERIF = "'Source Serif 4', Georgia, serif";

const surfaceColorMap = {
  Saibro: "#E8734A",
  Clay: "#E8734A",
  Hard: "#3B82F6",
  Dura: "#3B82F6",
  Grama: "#22C55E",
  Grass: "#22C55E",
};

const FONSECA_IMG = "https://www.atptour.com/-/media/alias/player-headshot/f0fv";
const FONSECA_IMG_FALLBACK = "https://a.espncdn.com/combiner/i?img=/i/headshots/tennis/players/full/11745.png&w=200&h=145";

export default function NextDuelCard({
  match,
  player,
  onOppClick,
  winProb,
  oppProfile,
  liveData,
  tournamentFacts,
}) {
  const countdown = useCountdown(match ? match.date : null);
  const [factIdx, setFactIdx] = useState(0);

  useEffect(() => {
    if (!tournamentFacts || !tournamentFacts.length) return;
    const interval = setInterval(() => {
      setFactIdx((prev) => (prev + 1) % (tournamentFacts.length + 1));
    }, 5000);
    return () => clearInterval(interval);
  }, [tournamentFacts]);

  if (!match) return null;

  const isLive = liveData && liveData.live;
  const oppName = isLive
    ? liveData?.opponent?.name || match.opponent_name || "A definir"
    : match.opponent_name || "A definir";
  const oppRanking = match.opponent_ranking || (oppProfile && oppProfile.ranking ? oppProfile.ranking : null);
  const oppCountry = match.opponent_country || (oppProfile && oppProfile.country ? oppProfile.country : "");
  const oppFlag = countryFlags[oppCountry] || "";

  let oppAtpSlug = match.opponent_atp_slug || null;
  if (!oppAtpSlug) {
    const found = findPlayer(oppName);
    if (found && found.data.slug) oppAtpSlug = found.data.slug;
  }

  const oppImg = getATPImage(oppName);
  const oppImgFallback = getESPNImage(oppName);

  const surfaceColor = surfaceColorMap[match.surface] || "#999";
  const surfaceTranslate = {
    Clay: "Saibro",
    Hard: "Duro",
    Grass: "Grama",
    "Clay court": "Saibro",
    "Hard court": "Duro",
    Saibro: "Saibro",
    Duro: "Duro",
    Grama: "Grama",
  };
  const surfaceLabel = surfaceTranslate[match.surface] || match.surface || "";

  let fPct = winProb && winProb.fonseca ? Math.round(winProb.fonseca) : null;
  let oPct = winProb && winProb.opponent ? Math.round(winProb.opponent) : null;

  if (fPct === null && player && player.ranking && oppRanking) {
    const rankDiff = oppRanking - player.ranking;
    const exponent = -rankDiff / 16;
    let fProb = 1 / (1 + Math.pow(10, exponent));
    fProb = Math.min(0.92, Math.max(0.08, fProb + 0.03));
    fPct = Math.round(fProb * 100);
    oPct = 100 - fPct;
  }

  const dateInfo = match.date
    ? (() => {
        const d = new Date(match.date);
        const time = d.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "America/Sao_Paulo",
        });
        const weekday = d.toLocaleDateString("pt-BR", {
          weekday: "long",
          timeZone: "America/Sao_Paulo",
        });
        const date = d.toLocaleDateString("pt-BR", {
          day: "numeric",
          month: "long",
          timeZone: "America/Sao_Paulo",
        });
        return {
          weekday: weekday.charAt(0).toUpperCase() + weekday.slice(1),
          date,
          time,
        };
      })()
    : null;

  function downloadICS() {
    if (!match.date) return;
    const d = new Date(match.date);
    const pad = (n) => String(n).padStart(2, "0");
    const formatICS = (dt) =>
      `${dt.getUTCFullYear()}${pad(dt.getUTCMonth() + 1)}${pad(dt.getUTCDate())}T${pad(dt.getUTCHours())}${pad(dt.getUTCMinutes())}00Z`;
    const endDate = new Date(d.getTime() + 3 * 60 * 60 * 1000);
    const title = `J. Fonseca vs ${oppName} — ${match.tournament_name || "ATP"}`;
    const location = `${match.tournament_name || ""}${match.city ? `, ${match.city}` : ""}`;
    const description = `${match.tournament_category || ""}${match.round ? ` · ${match.round}` : ""}\\nESPN 2 · Disney+\\nfonsecanews.com.br`;
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//FonsecaNews//PT",
      "BEGIN:VEVENT",
      `DTSTART:${formatICS(d)}`,
      `DTEND:${formatICS(endDate)}`,
      `SUMMARY:${title}`,
      `LOCATION:${location}`,
      `DESCRIPTION:${description}`,
      "BEGIN:VALARM",
      "TRIGGER:-PT30M",
      "ACTION:DISPLAY",
      "DESCRIPTION:Jogo do João Fonseca em 30 minutos!",
      "END:VALARM",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `fonseca-vs-${oppName.replace(/[^a-zA-Z]/g, "").toLowerCase()}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  let countdownText = "";
  if (!countdown.expired) {
    const parts = [];
    if (countdown.days > 0) parts.push(`${countdown.days} ${countdown.days === 1 ? "dia" : "dias"}`);
    if (countdown.hours > 0) parts.push(`${countdown.hours} ${countdown.hours === 1 ? "hora" : "horas"}`);
    if (countdown.minutes > 0 || parts.length === 0) parts.push(`${countdown.minutes} ${countdown.minutes === 1 ? "minuto" : "minutos"}`);
    if (parts.length === 1) countdownText = `Faltam: ${parts[0]}`;
    else if (parts.length === 2) countdownText = `Faltam: ${parts[0]} e ${parts[1]}`;
    else countdownText = `Faltam: ${parts[0]}, ${parts[1]} e ${parts[2]}`;
  }

  const liveScore = isLive ? liveData.score || {} : {};
  const fSets = liveScore.fonseca_sets || [];
  const oSets = liveScore.opponent_sets || [];
  const setsWon = liveScore.sets_won || {};
  const liveServing = liveScore.serving || "";

  return (
    <section style={{ margin: "4px 0 0", padding: 0, background: "linear-gradient(160deg, #0a1220 0%, #111d33 40%, #0d1828 100%)", borderRadius: 20, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -50, right: -50, width: 180, height: 180, borderRadius: "50%", background: `radial-gradient(circle, ${isLive ? "#ef4444" : surfaceColor}10 0%, transparent 65%)`, pointerEvents: "none" }} />

      <div style={{ padding: "18px 20px 6px", display: "flex", alignItems: "center", gap: 8 }}>
        {isLive ? (
          <>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", animation: "pulse 1.5s ease-in-out infinite", display: "inline-block" }} />
            <span style={{ fontSize: 10, fontWeight: 800, color: "#ef4444", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.08em" }}>Ao vivo{match.round ? ` · ${match.round}` : ""}</span>
          </>
        ) : (
          <>
            <div style={{ width: 20, height: 20, borderRadius: 6, background: "rgba(79,195,247,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#4FC3F7" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="12" x2="16" y2="14"/></svg>
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.1em" }}>Próximo duelo</span>
          </>
        )}
      </div>

      {!isLive ? (
        <div style={{ padding: "14px 20px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: surfaceColor, fontFamily: SANS, background: `${surfaceColor}18`, padding: "3px 10px", borderRadius: 999, textTransform: "uppercase", letterSpacing: "0.05em" }}>{surfaceLabel}</span>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: SANS, fontWeight: 600 }}>{match.tournament_category || ""}</span>
          </div>
          {match.round ? <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(79,195,247,0.7)", fontFamily: SANS, background: "rgba(79,195,247,0.08)", padding: "4px 12px", whiteSpace: "nowrap", borderRadius: 999 }}>{match.round}</span> : null}
        </div>
      ) : null}

      <div style={{ textAlign: "center", padding: "14px 18px 0" }}>
        {isLive ? <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.25)", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>Jogo em andamento</span> : null}
        <h2 style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-0.02em" }}>{(match.tournament_name || "Próxima Partida").split(",")[0].trim()}</h2>
      </div>

      <div style={{ padding: "20px 18px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 6, alignItems: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 68, height: 68, borderRadius: "50%", margin: "0 auto 6px", background: "#152035", border: `2.5px solid ${isLive ? `${GREEN}60` : `${GREEN}35`}`, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <img src={FONSECA_IMG} alt="JF" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { if (!e.target.dataset.tried) { e.target.dataset.tried = "1"; e.target.src = FONSECA_IMG_FALLBACK; } else { e.target.style.display = "none"; e.target.parentNode.innerHTML = '<span style="font-size:16px;font-weight:800;color:#00A859;font-family:Inter,sans-serif">JF</span>'; } }} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: SERIF, display: "block", lineHeight: 1.2 }}>J. Fonseca</span>
            {isLive && liveServing === "fonseca" ? <span style={{ fontSize: 10, color: YELLOW, fontFamily: SANS, display: "block", marginTop: 2 }}>🇧🇷 Sacando</span> : <span style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", fontFamily: SANS, display: "block", marginTop: 2 }}>🇧🇷 {player ? `#${player.ranking}` : ""}</span>}
          </div>

          {isLive ? (
            <div style={{ textAlign: "center", minWidth: 80 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: GREEN, fontFamily: SANS }}>{setsWon.fonseca || 0}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.15)", fontFamily: SANS }}>-</span>
                <span style={{ fontSize: 28, fontWeight: 800, color: "#ef4444", fontFamily: SANS }}>{setsWon.opponent || 0}</span>
              </div>
              {fSets.length > 0 ? <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 4 }}>{fSets.map((s, i) => <span key={i} style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: SANS }}>{s}-{oSets[i]}</span>)}</div> : null}
            </div>
          ) : (
            <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.15)", fontFamily: SANS, letterSpacing: "0.05em" }}>VS</span>
          )}

          <div style={{ textAlign: "center" }} onClick={onOppClick ? () => onOppClick() : undefined} role={onOppClick ? "button" : undefined} tabIndex={onOppClick ? 0 : undefined}>
            <div style={{ position: "relative", width: 68, height: 68, margin: "0 auto 6px" }}>
              <div style={{ width: 68, height: 68, borderRadius: "50%", background: "#152035", border: "2.5px solid rgba(255,255,255,0.1)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", cursor: onOppClick ? "pointer" : "default" }}>
                {oppImg ? <img src={oppImg} alt={oppName} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { if (oppImgFallback && !e.target.dataset.tried) { e.target.dataset.tried = "1"; e.target.src = oppImgFallback; } else { e.target.style.display = "none"; e.target.parentNode.innerHTML = `<span style='font-size:18px;font-weight:700;color:rgba(255,255,255,0.35);display:flex;align-items:center;justify-content:center;width:100%;height:100%'>${oppName.charAt(0)}</span>`; } }} /> : <span style={{ fontSize: 18, fontWeight: 700, color: "rgba(255,255,255,0.35)" }}>{oppName.charAt(0)}</span>}
              </div>
              {!isLive && onOppClick ? <div style={{ position: "absolute", bottom: 0, right: 0, width: 22, height: 22, borderRadius: "50%", background: "#4FC3F7", border: "2.5px solid #111d33", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}><span style={{ color: "#fff", fontSize: 15, fontWeight: 700, lineHeight: 1 }}>+</span></div> : null}
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: SERIF, display: "block", lineHeight: 1.2 }}>{oppName}</span>
            {isLive && liveServing === "opponent" ? <span style={{ fontSize: 10, color: YELLOW, fontFamily: SANS, display: "block", marginTop: 2 }}>{oppFlag} Sacando</span> : oppCountry ? <span style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", fontFamily: SANS, display: "block", marginTop: 2 }}>{oppFlag} {oppRanking ? `#${oppRanking}` : ""}</span> : <span style={{ fontSize: 10, color: "rgba(255,255,255,0.15)", fontFamily: SANS, display: "block", marginTop: 2 }}>chave pendente</span>}
          </div>
        </div>
      </div>

      {isLive ? (
        <div style={{ padding: "22px 18px 24px" }}>
          <a href="https://www.disneyplus.com" target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "16px", background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)", borderRadius: 14, textDecoration: "none", width: "100%", boxSizing: "border-box" }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#fff", animation: "pulse 1.5s ease-in-out infinite", display: "inline-block" }} />
            <span style={{ fontSize: 15, fontWeight: 800, color: "#fff", fontFamily: SANS, letterSpacing: "0.02em" }}>Assista ao vivo</span>
          </a>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginTop: 10 }}>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: SANS }}>ESPN 2 · Disney+</span>
          </div>
          {match.court ? <div style={{ textAlign: "center", marginTop: 8 }}><span style={{ fontSize: 12, color: "rgba(79,195,247,0.6)", fontFamily: SANS, fontWeight: 600, letterSpacing: "0.02em" }}>{`Quadra ${match.court}`}</span></div> : null}
        </div>
      ) : (
        <>
          {fPct !== null && oPct !== null ? (
            <div style={{ padding: "22px 20px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 20, fontWeight: 900, color: fPct >= oPct ? GREEN : "rgba(255,255,255,0.25)", fontFamily: SANS }}>{`${fPct}%`}</span>
                <span style={{ fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.2)", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.06em" }}>Probabilidade de vitória</span>
                <span style={{ fontSize: 20, fontWeight: 900, color: oPct > fPct ? "#ef4444" : "rgba(255,255,255,0.25)", fontFamily: SANS }}>{`${oPct}%`}</span>
              </div>
              <div style={{ display: "flex", height: 5, borderRadius: 3, overflow: "hidden", gap: 2 }}>
                <div style={{ width: `${fPct}%`, background: `linear-gradient(90deg, ${GREEN}, #22c55e)`, borderRadius: 3, transition: "width 0.8s ease" }} />
                <div style={{ width: `${oPct}%`, background: "linear-gradient(90deg, #ef4444, #f87171)", borderRadius: 3, transition: "width 0.8s ease" }} />
              </div>
            </div>
          ) : null}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "18px 20px" }}>
            {dateInfo ? <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: "10px 12px" }}><div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(79,195,247,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4FC3F7" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div><div><div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.06em" }}>Data</div><div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.8)", fontFamily: SANS, marginTop: 1 }}>{`${dateInfo.weekday}, ${dateInfo.date}`}</div></div></div> : null}
            {dateInfo ? <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: "10px 12px" }}><div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(79,195,247,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4FC3F7" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></div><div><div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.06em" }}>Horário</div><div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.8)", fontFamily: SANS, marginTop: 1 }}>{`${dateInfo.time} BRT`}</div></div></div> : null}
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: "10px 12px" }}><div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(79,195,247,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4FC3F7" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div><div><div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.06em" }}>Quadra</div><div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.8)", fontFamily: SANS, marginTop: 1 }}>{match.court || "A definir"}</div></div></div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: "10px 12px" }}><div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(79,195,247,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4FC3F7" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg></div><div><div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.06em" }}>Transmissão</div><div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.8)", fontFamily: SANS, marginTop: 1 }}>ESPN 2 · Disney+</div></div></div>
          </div>

          {countdownText ? <div style={{ textAlign: "center", padding: "4px 0 4px" }}><span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: SANS }}>{countdownText}</span></div> : null}

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

      {tournamentFacts && tournamentFacts.length > 0 ? (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)", padding: "14px 20px", textAlign: "center" }}>
          {factIdx % (tournamentFacts.length + 1) === 0 ? (
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", fontFamily: SANS, fontWeight: 600 }}>{`Curiosidades sobre ${match.tournament_name || "o torneio"}`}</span>
          ) : (
            <span style={{ fontSize: 12, color: "rgba(79,195,247,0.6)", fontFamily: SANS, fontWeight: 500 }}>{tournamentFacts[(factIdx - 1) % tournamentFacts.length].text}</span>
          )}
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.15)", fontFamily: SANS, display: "block", marginTop: 4 }}>{factIdx % (tournamentFacts.length + 1) === 0 ? "" : `${((factIdx - 1) % tournamentFacts.length) + 1}/${tournamentFacts.length}`}</span>
        </div>
      ) : null}
    </section>
  );
}
