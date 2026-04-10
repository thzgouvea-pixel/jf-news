import Head from "next/head";
import { useEffect, useMemo, useState } from "react";

const COLORS = {
  green: "#00A859",
  gold: "#FFCB05",
  blue: "#4FC3F7",
  bg: "#F7F8FA",
  card: "#FFFFFF",
  border: "#E7E7EA",
  text: "#171717",
  sub: "#6B7280",
  dim: "#9CA3AF",
  darkA: "#081223",
  darkB: "#10213E",
  darkC: "#0A1628",
  danger: "#FF5A5F",
};

const SERIF = "'Source Serif 4', Georgia, serif";
const SANS = "'Inter', -apple-system, sans-serif";
const FONSECA_IMG = "https://www.atptour.com/-/media/alias/player-headshot/f0fv";
const PLAYER_IMG = {
  Zverev: "https://www.atptour.com/-/media/alias/player-headshot/z355",
  Berrettini: "https://www.atptour.com/-/media/alias/player-headshot/bk40",
  Nakashima: "https://www.atptour.com/-/media/alias/player-headshot/n0ae",
  Rinderknech: "https://www.atptour.com/-/media/alias/player-headshot/rc91",
  Diallo: "https://www.atptour.com/-/media/alias/player-headshot/d0f6",
  Bublik: "https://www.atptour.com/-/media/alias/player-headshot/b0bk",
  Cerundolo: "https://www.atptour.com/-/media/alias/player-headshot/c0aq",
  Davidovich: "https://www.atptour.com/-/media/alias/player-headshot/d0au",
};
const COUNTRY_FLAGS = {
  Brazil: "🇧🇷",
  Brasil: "🇧🇷",
  Italy: "🇮🇹",
  Itália: "🇮🇹",
  USA: "🇺🇸",
  "United States": "🇺🇸",
  Canada: "🇨🇦",
  France: "🇫🇷",
  Argentina: "🇦🇷",
  Monaco: "🇲🇨",
  Mônaco: "🇲🇨",
  Germany: "🇩🇪",
  Alemanha: "🇩🇪",
};

function fmtDate(date) {
  if (!date) return "A definir";
  try {
    return new Date(date)
      .toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        timeZone: "America/Sao_Paulo",
      })
      .replace(/^./, (c) => c.toUpperCase());
  } catch {
    return "A definir";
  }
}

function fmtTime(date) {
  if (!date) return "A definir";
  try {
    return new Date(date).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    });
  } catch {
    return "A definir";
  }
}

function fmtAgo(date) {
  if (!date) return "";
  try {
    const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (mins < 1) return "agora";
    if (mins < 60) return `há ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `há ${hours}h`;
    const days = Math.floor(hours / 24);
    return days === 1 ? "ontem" : `há ${days} dias`;
  } catch {
    return "";
  }
}

function countdown(date) {
  if (!date) return "A definir";
  const diff = new Date(date).getTime() - Date.now();
  if (diff <= 0) return "Ao vivo ou já começou";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const parts = [];
  if (days > 0) parts.push(`${days} ${days === 1 ? "dia" : "dias"}`);
  if (hours > 0) parts.push(`${hours} ${hours === 1 ? "hora" : "horas"}`);
  if (minutes > 0 && days === 0) parts.push(`${minutes} ${minutes === 1 ? "minuto" : "minutos"}`);
  return parts.length ? parts.join(" e ") : "Menos de 1 minuto";
}

function pickOpponentImage(name) {
  if (!name) return null;
  const found = Object.keys(PLAYER_IMG).find((k) => name.includes(k));
  return found ? PLAYER_IMG[found] : null;
}

function Shell({ children }) {
  return <div style={{ minHeight: "100vh", background: COLORS.bg }}>{children}</div>;
}

function Header() {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        background: "rgba(247,248,250,0.94)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        borderBottom: `1px solid ${COLORS.border}`,
      }}
    >
      <div
        style={{
          maxWidth: 760,
          margin: "0 auto",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: "linear-gradient(135deg, #0D1726, #132440)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 800, letterSpacing: "-0.04em" }}>
            <span style={{ color: COLORS.green }}>F</span>
            <span style={{ color: COLORS.gold }}>N</span>
          </span>
        </div>
        <div>
          <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>
            <span style={{ color: COLORS.green }}>Fonseca</span> <span style={{ color: COLORS.gold }}>News</span>
          </div>
          <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: SANS, marginTop: 1 }}>
            Tudo sobre João Fonseca, em leitura rápida
          </div>
        </div>
      </div>
    </header>
  );
}

function SectionLabel({ children }) {
  return (
    <p
      style={{
        margin: "0 0 12px",
        fontSize: 11,
        fontWeight: 800,
        color: COLORS.dim,
        fontFamily: SANS,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
      }}
    >
      {children}
    </p>
  );
}

function WhiteCard({ children, padding = 20 }) {
  return (
    <div
      style={{
        background: COLORS.card,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 24,
        padding,
        boxShadow: "0 12px 32px rgba(15,23,42,0.05)",
      }}
    >
      {children}
    </div>
  );
}

function MatchHero({ nextMatch, playerRanking, probability, factText }) {
  const opponentName = nextMatch?.opponent_name || "A definir";
  const opponentImage = pickOpponentImage(opponentName);
  const opponentFlag = COUNTRY_FLAGS[nextMatch?.opponent_country || ""] || "";
  const joaoPct = probability?.fonseca ?? 50;
  const oppPct = probability?.opponent ?? 50;

  return (
    <section
      style={{
        background: `linear-gradient(160deg, ${COLORS.darkA} 0%, ${COLORS.darkB} 54%, ${COLORS.darkC} 100%)`,
        borderRadius: 28,
        overflow: "hidden",
        boxShadow: "0 22px 50px rgba(7,12,22,0.18)",
      }}
    >
      <div style={{ padding: "18px 18px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: COLORS.blue,
                fontFamily: SANS,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Próximo jogo
            </span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.42)", fontFamily: SANS }}>{nextMatch?.round || "Rodada a definir"}</span>
          </div>
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: "#F59E0B",
              fontFamily: SANS,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              padding: "6px 12px",
              borderRadius: 999,
              background: "rgba(245,158,11,0.12)",
            }}
          >
            {nextMatch?.surface || "A definir"}
          </span>
        </div>
        <h1 style={{ margin: "10px 0 4px", fontSize: 18, fontWeight: 700, color: "rgba(255,255,255,0.78)", fontFamily: SANS }}>
          {nextMatch?.tournament_category || "ATP Tour"}
        </h1>
        <div style={{ fontSize: 42, fontWeight: 800, color: "#fff", fontFamily: SERIF, lineHeight: 1.02, letterSpacing: "-0.03em" }}>
          {(nextMatch?.tournament_name || "Próxima partida").split(",")[0]}
        </div>
      </div>

      <div style={{ padding: 18 }}>
        <div
          style={{
            borderRadius: 24,
            padding: "18px 14px 16px",
            background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))",
            border: "1px solid rgba(255,255,255,0.07)",
            marginBottom: 14,
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 8 }}>
            <PlayerSide image={FONSECA_IMG} name="J. Fonseca" meta={`🇧🇷 #${playerRanking || 40}`} accent />
            <div style={{ fontSize: 22, fontWeight: 800, color: "rgba(255,255,255,0.18)", fontFamily: SANS }}>VS</div>
            <PlayerSide image={opponentImage} name={opponentName} meta={`${opponentFlag} ${nextMatch?.opponent_ranking ? `#${nextMatch.opponent_ranking}` : ""}`} />
          </div>
        </div>

        <div style={{ display: "grid", gap: 10, marginBottom: 12 }}>
          <InfoGridRow leftLabel="Data do jogo" leftValue={fmtDate(nextMatch?.date)} rightLabel="Horário em Brasília" rightValue={fmtTime(nextMatch?.date)} />
          <InfoGridRow leftLabel="Quadra confirmada" leftValue={nextMatch?.court || "A definir"} rightLabel="Onde assistir" rightValue="ESPN 2 · Disney+" />
        </div>

        <div
          style={{
            borderRadius: 18,
            padding: "14px 16px",
            textAlign: "center",
            marginBottom: 12,
            background: "linear-gradient(180deg, rgba(79,195,247,0.12), rgba(79,195,247,0.08))",
            border: "1px solid rgba(79,195,247,0.18)",
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 800, color: COLORS.blue, fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
            Falta para o jogo
          </div>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#fff", fontFamily: SANS }}>{countdown(nextMatch?.date)}</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          <a
            href="https://www.disneyplus.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              textDecoration: "none",
              textAlign: "center",
              padding: "16px 12px",
              borderRadius: 16,
              color: "#fff",
              fontSize: 14,
              fontWeight: 800,
              fontFamily: SANS,
              background: "linear-gradient(135deg,#F59E0B 0%, #EA8A00 100%)",
            }}
          >
            Onde assistir
          </a>
          <button
            type="button"
            style={{
              padding: "16px 12px",
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.88)",
              fontSize: 14,
              fontWeight: 800,
              fontFamily: SANS,
            }}
          >
            Adicionar ao calendário
          </button>
        </div>

        <div
          style={{
            borderRadius: 18,
            padding: "14px 14px 12px",
            marginBottom: 14,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", marginBottom: 8 }}>
            <ProbabilitySide label="João" value={joaoPct} left />
            <div style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.42)", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "center" }}>
              Probabilidade de vitória
            </div>
            <ProbabilitySide label={opponentName.split(" ").pop() || "Adversário"} value={oppPct} danger />
          </div>
          <div style={{ height: 10, borderRadius: 999, overflow: "hidden", display: "flex", background: "rgba(255,255,255,0.05)" }}>
            <div style={{ width: `${joaoPct}%`, background: "linear-gradient(90deg, #22C55E, #00A859)" }} />
            <div style={{ width: `${oppPct}%`, background: "linear-gradient(90deg, #FF5A5F, #FF7A7E)" }} />
          </div>
        </div>

        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.30)", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
            Contexto do jogo
          </div>
          <div style={{ fontSize: 15, color: "#5CC8FF", fontFamily: SANS, lineHeight: 1.45 }}>{factText || "Atualização em breve"}</div>
        </div>
      </div>
    </section>
  );
}

function PlayerSide({ image, name, meta, accent = false }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          width: 94,
          height: 94,
          borderRadius: "50%",
          overflow: "hidden",
          margin: "0 auto 10px",
          border: accent ? `3px solid ${COLORS.green}55` : "3px solid rgba(255,255,255,0.16)",
          boxShadow: accent ? "0 0 0 6px rgba(0,168,89,0.08)" : "0 0 0 6px rgba(255,255,255,0.05)",
          background: "rgba(255,255,255,0.08)",
        }}
      >
        {image ? (
          <img src={image} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.5)", fontSize: 28, fontWeight: 800, fontFamily: SANS }}>
            {name?.[0] || "?"}
          </div>
        )}
      </div>
      <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", fontFamily: SERIF }}>{name}</div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", fontFamily: SANS, marginTop: 4 }}>{meta}</div>
    </div>
  );
}

function InfoGridRow({ leftLabel, leftValue, rightLabel, rightValue }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
      <InfoBox label={leftLabel} value={leftValue} />
      <InfoBox label={rightLabel} value={rightValue} />
    </div>
  );
}

function InfoBox({ label, value }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16,
        padding: "14px 16px",
      }}
    >
      <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.34)", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", fontFamily: SANS, lineHeight: 1.2 }}>{value}</div>
    </div>
  );
}

function ProbabilitySide({ label, value, danger = false, left = false }) {
  return (
    <div style={{ textAlign: left ? "left" : "right" }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.40)", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>
        {label}
      </div>
      <div style={{ fontSize: 32, fontWeight: 900, color: danger ? COLORS.danger : "#FFFFFF", fontFamily: SANS, lineHeight: 1 }}>
        {value}%
      </div>
    </div>
  );
}

function LastMatchCard({ lastMatch, form }) {
  const won = lastMatch?.result === "V";
  return (
    <WhiteCard padding={22}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 12, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: COLORS.dim, fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
            Última partida
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, color: COLORS.text, fontFamily: SERIF, lineHeight: 1.05 }}>{lastMatch?.score || "—"}</div>
          <div style={{ fontSize: 14, color: COLORS.sub, fontFamily: SANS, marginTop: 8 }}>
            {lastMatch?.tournament_name || "Último torneio"}
            {lastMatch?.round ? ` · ${lastMatch.round}` : ""}
          </div>
        </div>
        <div
          style={{
            padding: "8px 12px",
            borderRadius: 999,
            background: won ? `${COLORS.green}12` : "#FEE2E2",
            color: won ? COLORS.green : "#DC2626",
            fontSize: 12,
            fontWeight: 800,
            fontFamily: SANS,
          }}
        >
          {won ? "Vitória" : "Derrota"}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr .8fr", gap: 12 }}>
        <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 18, padding: 16 }}>
          <div style={{ fontSize: 10, color: COLORS.dim, fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Adversário</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.text, fontFamily: SERIF, lineHeight: 1.1 }}>{lastMatch?.opponent_name || "A definir"}</div>
          <p style={{ margin: "12px 0 0", fontSize: 14, color: COLORS.sub, fontFamily: SANS, lineHeight: 1.55 }}>
            {won ? "João venceu" : "João foi superado por"} <strong>{lastMatch?.opponent_name || "o adversário"}</strong>
            {lastMatch?.score ? ` por ${lastMatch.score}` : ""}
            {lastMatch?.round ? `, em ${lastMatch.round.toLowerCase()}` : ""}.
          </p>
        </div>
        <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 18, padding: 16 }}>
          <div style={{ fontSize: 10, color: COLORS.dim, fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Forma recente</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {form.map((m, i) => (
              <span
                key={i}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: m.result === "V" ? `${COLORS.green}14` : "#FEE2E2",
                  color: m.result === "V" ? COLORS.green : "#DC2626",
                  fontSize: 11,
                  fontWeight: 800,
                  fontFamily: SANS,
                }}
              >
                {m.result}
              </span>
            ))}
          </div>
        </div>
      </div>
    </WhiteCard>
  );
}

export default function HomeMatchdayFinal() {
  const [news, setNews] = useState([]);
  const [nextMatch, setNextMatch] = useState(null);
  const [lastMatch, setLastMatch] = useState(null);
  const [player, setPlayer] = useState(null);
  const [season, setSeason] = useState(null);
  const [recentForm, setRecentForm] = useState([]);
  const [prizeMoney, setPrizeMoney] = useState(null);
  const [tournamentFacts, setTournamentFacts] = useState(null);
  const [winProb, setWinProb] = useState(null);

  useEffect(() => {
    fetch("/api/news")
      .then((r) => r.json())
      .then((d) => {
        if (d?.news) setNews(d.news);
        if (d?.nextMatch) setNextMatch(d.nextMatch);
        if (d?.lastMatch) setLastMatch(d.lastMatch);
        if (d?.player) setPlayer(d.player);
        if (d?.season) setSeason(d.season);
      })
      .catch(() => {});

    fetch("/api/sofascore-data")
      .then((r) => r.json())
      .then((d) => {
        if (d?.recentForm) setRecentForm(d.recentForm);
        if (d?.prizeMoney) setPrizeMoney(d.prizeMoney);
        if (d?.tournamentFacts) setTournamentFacts(d.tournamentFacts);
        if (d?.winProb) setWinProb(d.winProb);
        if (d?.season) setSeason(d.season);
        if (d?.ranking?.ranking) setPlayer((prev) => (prev ? { ...prev, ranking: d.ranking.ranking } : { ranking: d.ranking.ranking }));
        if (d?.lastMatch?.result) setLastMatch(d.lastMatch);
        if (d?.nextMatch?.date) setNextMatch(d.nextMatch);
      })
      .catch(() => {});
  }, []);

  const form = Array.isArray(recentForm) ? recentForm.slice(-5).reverse() : [];
  const displayNews = news.slice(0, 3);
  const seasonValue = season?.wins !== undefined && season?.losses !== undefined ? `${season.wins}-${season.losses}` : "14-8";
  const prizeValue = prizeMoney
    ? prizeMoney >= 1000000
      ? `$${(Math.floor(prizeMoney / 100000) / 10).toFixed(1)}M`
      : `$${Math.round(prizeMoney / 1000)}K`
    : "$2.9M";

  return (
    <Shell>
      <Head>
        <title>Fonseca News</title>
        <meta name="description" content="Homepage matchday nova com hierarquia mais clara e hero redesenhado" />
      </Head>
      <style>{"@import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@400;600;700;800&family=Inter:wght@400;500;600;700;800&display=swap');" + "*{box-sizing:border-box;margin:0;padding:0}" + "body{background:#F7F8FA;-webkit-font-smoothing:antialiased}"}</style>

      <Header />

      <main style={{ maxWidth: 760, margin: "0 auto", padding: "12px 12px 32px" }}>
        <section style={{ paddingBottom: 24 }}>
          <MatchHero nextMatch={nextMatch} playerRanking={player?.ranking} probability={winProb} factText={tournamentFacts?.facts?.[0]?.text} />
        </section>

        <section style={{ paddingBottom: 24 }}>
          <SectionLabel>O que acabou de acontecer</SectionLabel>
          <LastMatchCard lastMatch={lastMatch} form={form} />
        </section>

        <section style={{ paddingBottom: 24 }}>
          <SectionLabel>O que mudou hoje</SectionLabel>
          <WhiteCard padding={22}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 18 }}>
              <StatPill label="Ranking" value={`#${player?.ranking || 40}`} accent={COLORS.green} />
              <StatPill label="Temporada" value={seasonValue} />
              <StatPill label="vs Top 10" value="1-4" />
              <StatPill label="Prize Money" value={prizeValue} accent={COLORS.green} />
            </div>
            {displayNews.length ? (
              displayNews.map((item, idx) => <NewsItem key={`${item.title}-${idx}`} item={item} noBorder={idx === displayNews.length - 1} />)
            ) : (
              <div style={{ fontSize: 14, color: COLORS.sub, fontFamily: SANS }}>Carregando notícias...</div>
            )}
          </WhiteCard>
        </section>
      </main>
    </Shell>
  );
}

export async function getServerSideProps() {
  return { props: {} };
}
