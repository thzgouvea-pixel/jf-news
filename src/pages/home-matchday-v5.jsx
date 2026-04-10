import Head from "next/head";
import { useEffect, useMemo, useState } from "react";

const C = {
  green: "#00A859",
  gold: "#FFCB05",
  blue: "#4FC3F7",
  bg: "#F5F7FA",
  card: "#FFFFFF",
  line: "#E7EBF0",
  text: "#111827",
  sub: "#6B7280",
  dim: "#9CA3AF",
  dark1: "#071120",
  dark2: "#0C1D37",
  dark3: "#0A1628",
  red: "#FF5A5F",
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
  Brazil: "🇧🇷", Brasil: "🇧🇷", Italy: "🇮🇹", Itália: "🇮🇹", USA: "🇺🇸", "United States": "🇺🇸",
  Canada: "🇨🇦", France: "🇫🇷", Argentina: "🇦🇷", Monaco: "🇲🇨", Mônaco: "🇲🇨", Germany: "🇩🇪", Alemanha: "🇩🇪",
};

function fmtDate(date) {
  if (!date) return "A definir";
  try {
    return new Date(date).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Sao_Paulo" }).replace(/^./, (c) => c.toUpperCase());
  } catch { return "A definir"; }
}
function fmtTime(date) {
  if (!date) return "A definir";
  try {
    return new Date(date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
  } catch { return "A definir"; }
}
function fmtAgo(date) {
  if (!date) return "";
  try {
    const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (mins < 1) return "agora";
    if (mins < 60) return `há ${mins} min`;
    const h = Math.floor(mins / 60);
    if (h < 24) return `há ${h}h`;
    const d = Math.floor(h / 24);
    return d === 1 ? "ontem" : `há ${d} dias`;
  } catch { return ""; }
}
function imgFor(name) {
  if (!name) return null;
  const key = Object.keys(PLAYER_IMG).find((x) => name.includes(x));
  return key ? PLAYER_IMG[key] : null;
}

function useCountdown(targetDate) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return useMemo(() => {
    if (!targetDate) return "A definir";
    const diff = new Date(targetDate).getTime() - now;
    if (diff <= 0) return "Ao vivo ou já começou";
    const total = Math.floor(diff / 1000);
    const days = Math.floor(total / 86400);
    const hours = Math.floor((total % 86400) / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    return `${hours}h ${minutes}m ${seconds}s`;
  }, [targetDate, now]);
}

function Header() {
  return (
    <header style={{ position: "sticky", top: 0, zIndex: 40, background: "rgba(245,247,250,0.94)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", borderBottom: `1px solid ${C.line}` }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: "linear-gradient(135deg, #0D1726, #132440)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 800 }}><span style={{ color: C.green }}>F</span><span style={{ color: C.gold }}>N</span></span>
        </div>
        <div>
          <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}><span style={{ color: C.green }}>Fonseca</span> <span style={{ color: C.gold }}>News</span></div>
          <div style={{ fontSize: 11, color: C.dim, fontFamily: SANS }}>Tudo sobre João Fonseca, em leitura rápida</div>
        </div>
      </div>
    </header>
  );
}

function Card({ children, padding = 22 }) {
  return <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 24, padding, boxShadow: "0 12px 32px rgba(15,23,42,0.05)" }}>{children}</div>;
}

function SectionLabel({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 800, color: C.dim, fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>{children}</div>;
}

function Player({ image, name, meta, accent }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ width: 96, height: 96, borderRadius: "50%", overflow: "hidden", margin: "0 auto 10px", background: "rgba(255,255,255,0.08)", border: accent ? `3px solid ${C.green}55` : "3px solid rgba(255,255,255,0.16)", boxShadow: accent ? "0 0 0 6px rgba(0,168,89,0.08)" : "0 0 0 6px rgba(255,255,255,0.05)" }}>
        {image ? <img src={image} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}
      </div>
      <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", fontFamily: SERIF }}>{name}</div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.58)", fontFamily: SANS, marginTop: 4 }}>{meta}</div>
    </div>
  );
}

function MetaBox({ label, value }) {
  return (
    <div style={{ padding: "14px 15px", borderRadius: 16, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.34)", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", fontFamily: SANS, lineHeight: 1.25, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{value}</div>
    </div>
  );
}

function StatPill({ label, value, accent }) {
  return (
    <div style={{ textAlign: "center", background: C.card, border: `1px solid ${C.line}`, borderRadius: 18, padding: "14px 10px", boxShadow: "0 8px 24px rgba(15,23,42,0.04)" }}>
      <div style={{ fontSize: 22, fontWeight: 900, color: accent || C.text, fontFamily: SANS }}>{value}</div>
      <div style={{ fontSize: 10, fontWeight: 800, color: C.dim, fontFamily: SANS, marginTop: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
    </div>
  );
}

function StatMini({ label, value }) {
  return (
    <div style={{ background: C.bg, border: `1px solid ${C.line}`, borderRadius: 16, padding: 14 }}>
      <div style={{ fontSize: 10, color: C.dim, fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 900, color: C.text, fontFamily: SANS, lineHeight: 1 }}>{value}</div>
    </div>
  );
}

function NewsItem({ item, noBorder }) {
  return (
    <article style={{ padding: "18px 0", borderBottom: noBorder ? "none" : `1px solid ${C.line}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: C.green, fontFamily: SANS }}>{item.category || "Notícia"}</span>
        <span style={{ fontSize: 11, color: C.dim, fontFamily: SANS }}>{item.source || "Fonte"}</span>
        <span style={{ marginLeft: "auto", fontSize: 11, color: C.dim, fontFamily: SANS }}>{fmtAgo(item.date)}</span>
      </div>
      <h3 style={{ margin: "0 0 6px", fontSize: 18, lineHeight: 1.35, color: C.text, fontFamily: SERIF, fontWeight: 800 }}>{item.title}</h3>
      {item.summary ? <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: C.sub, fontFamily: SANS }}>{item.summary}</p> : null}
    </article>
  );
}

function getLastMatchStats(lastMatch) {
  const stats = lastMatch?.stats || lastMatch?.statistics || {};
  return [
    { label: "Aces", value: stats.aces ?? lastMatch?.aces ?? "—" },
    { label: "1º saque", value: stats.firstServePct ?? stats.firstServePercentage ?? lastMatch?.firstServePct ?? "—" },
    { label: "Pts 1º saque", value: stats.firstServePointsWonPct ?? stats.firstServePointsWonPercentage ?? lastMatch?.firstServePointsWonPct ?? "—" },
    { label: "Break points", value: stats.breakPointsWon ?? lastMatch?.breakPointsWon ?? "—" },
  ];
}

function LastMatchCard({ lastMatch, form }) {
  const matchStats = getLastMatchStats(lastMatch);
  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 12, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: C.dim, fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Última partida</div>
          <div style={{ fontSize: 30, fontWeight: 800, color: C.text, fontFamily: SERIF, lineHeight: 1.05 }}>{lastMatch?.score || "—"}</div>
          <div style={{ fontSize: 14, color: C.sub, fontFamily: SANS, marginTop: 8 }}>{lastMatch?.tournament_name || "Último torneio"}{lastMatch?.round ? ` · ${lastMatch.round}` : ""}</div>
        </div>
        <div style={{ padding: "8px 12px", borderRadius: 999, background: lastMatch?.result === "V" ? `${C.green}12` : "#FEE2E2", color: lastMatch?.result === "V" ? C.green : "#DC2626", fontSize: 12, fontWeight: 800, fontFamily: SANS }}>{lastMatch?.result === "V" ? "Vitória" : "Derrota"}</div>
      </div>

      <div style={{ background: C.bg, border: `1px solid ${C.line}`, borderRadius: 18, padding: 16, marginBottom: 12 }}>
        <div style={{ fontSize: 10, color: C.dim, fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Adversário</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: C.text, fontFamily: SERIF, lineHeight: 1.1 }}>{lastMatch?.opponent_name || "A definir"}</div>
        <p style={{ margin: "12px 0 0", fontSize: 14, color: C.sub, fontFamily: SANS, lineHeight: 1.55 }}>{lastMatch?.result === "V" ? "João venceu" : "João foi superado por"} <strong>{lastMatch?.opponent_name || "o adversário"}</strong>{lastMatch?.score ? ` por ${lastMatch.score}` : ""}{lastMatch?.round ? `, em ${lastMatch.round.toLowerCase()}` : ""}.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
        {matchStats.map((s) => <StatMini key={s.label} label={s.label} value={String(s.value)} />)}
      </div>

      <div style={{ background: C.bg, border: `1px solid ${C.line}`, borderRadius: 18, padding: 16 }}>
        <div style={{ fontSize: 10, color: C.dim, fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Forma recente</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>{form.map((m, i) => <span key={i} style={{ height: 42, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: m.result === "V" ? `${C.green}14` : "#FEE2E2", color: m.result === "V" ? C.green : "#DC2626", fontSize: 14, fontWeight: 800, fontFamily: SANS }}>{m.result}</span>)}</div>
      </div>
    </Card>
  );
}

function BioCard({ player, season }) {
  const age = player?.age || 18;
  const ranking = player?.ranking || 35;
  const wins = season?.wins ?? 5;
  const losses = season?.losses ?? 2;
  return (
    <Card>
      <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 16 }}>
        <div style={{ width: 74, height: 74, borderRadius: 20, overflow: "hidden", flexShrink: 0 }}><img src={FONSECA_IMG} alt="João Fonseca" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>
        <div>
          <div style={{ fontSize: 28, fontWeight: 800, color: C.text, fontFamily: SERIF, lineHeight: 1.05 }}>João Fonseca</div>
          <div style={{ fontSize: 14, color: C.sub, fontFamily: SANS, marginTop: 6 }}>Tenista brasileiro · {age} anos · ranking ATP #{ranking}</div>
        </div>
      </div>
      <p style={{ margin: 0, fontSize: 15, lineHeight: 1.65, color: C.sub, fontFamily: SANS }}>João Fonseca é uma das maiores promessas do tênis brasileiro. Ainda muito jovem, já disputa grandes torneios, soma vitórias relevantes no circuito e chama atenção pela potência, personalidade e maturidade competitiva.</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 16 }}>
        <StatPill label="Idade" value={`${age}`} accent={C.green} />
        <StatPill label="2026" value={`${wins}-${losses}`} />
        <StatPill label="Ranking" value={`#${ranking}`} accent={C.green} />
      </div>
    </Card>
  );
}

export default function HomeMatchdayV5() {
  const [news, setNews] = useState([]);
  const [nextMatch, setNextMatch] = useState(null);
  const [lastMatch, setLastMatch] = useState(null);
  const [player, setPlayer] = useState(null);
  const [season, setSeason] = useState(null);
  const [recentForm, setRecentForm] = useState([]);
  const [prizeMoney, setPrizeMoney] = useState(null);
  const [tournamentFacts, setTournamentFacts] = useState(null);
  const [winProb, setWinProb] = useState(null);
  const timerText = useCountdown(nextMatch?.date);

  useEffect(() => {
    fetch("/api/news").then((r) => r.json()).then((d) => {
      if (d?.news) setNews(d.news);
      if (d?.nextMatch) setNextMatch(d.nextMatch);
      if (d?.lastMatch) setLastMatch(d.lastMatch);
      if (d?.player) setPlayer(d.player);
      if (d?.season) setSeason(d.season);
    }).catch(() => {});

    fetch("/api/sofascore-data").then((r) => r.json()).then((d) => {
      if (d?.recentForm) setRecentForm(d.recentForm);
      if (d?.prizeMoney) setPrizeMoney(d.prizeMoney);
      if (d?.tournamentFacts) setTournamentFacts(d.tournamentFacts);
      if (d?.winProb) setWinProb(d.winProb);
      if (d?.season) setSeason(d.season);
      if (d?.ranking?.ranking) setPlayer((prev) => (prev ? { ...prev, ranking: d.ranking.ranking } : { ranking: d.ranking.ranking }));
      if (d?.lastMatch?.result) setLastMatch(d.lastMatch);
      if (d?.nextMatch?.date) setNextMatch(d.nextMatch);
    }).catch(() => {});
  }, []);

  const displayNews = news.slice(0, 6);
  const seasonValue = season?.wins !== undefined && season?.losses !== undefined ? `${season.wins}-${season.losses}` : "14-8";
  const prizeValue = prizeMoney ? (prizeMoney >= 1000000 ? `$${(Math.floor(prizeMoney / 100000) / 10).toFixed(1)}M` : `$${Math.round(prizeMoney / 1000)}K`) : "$2.9M";
  const opponentName = nextMatch?.opponent_name || "A definir";
  const opponentMeta = `${COUNTRY_FLAGS[nextMatch?.opponent_country || ""] || ""} ${nextMatch?.opponent_ranking ? `#${nextMatch.opponent_ranking}` : ""}`.trim();
  const joaoPct = Math.round(winProb?.fonseca ?? 42);
  const oppPct = Math.round(winProb?.opponent ?? 58);
  const form = Array.isArray(recentForm) ? recentForm.slice(-5).reverse() : [];

  return (
    <div style={{ minHeight: "100vh", background: C.bg }}>
      <Head>
        <title>Fonseca News</title>
        <meta name="description" content="Homepage matchday v5" />
      </Head>
      <style>{"@import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@400;600;700;800&family=Inter:wght@400;500;600;700;800&display=swap');" + "*{box-sizing:border-box;margin:0;padding:0}" + "body{background:#F5F7FA;-webkit-font-smoothing:antialiased}"}</style>

      <Header />

      <main style={{ maxWidth: 760, margin: "0 auto", padding: "12px 12px 32px" }}>
        <section style={{ paddingBottom: 24 }}>
          <section style={{ background: `linear-gradient(160deg, ${C.dark1} 0%, ${C.dark2} 54%, ${C.dark3} 100%)`, borderRadius: 28, overflow: "hidden", boxShadow: "0 22px 50px rgba(7,12,22,0.18)" }}>
            <div style={{ padding: "18px 18px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: C.blue, fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.08em" }}>Próximo jogo</span>
                  <span style={{ fontSize: 15, fontWeight: 900, color: "#fff", fontFamily: SANS }}>{nextMatch?.round || "Rodada a definir"}</span>
                </div>
                <span style={{ fontSize: 10, fontWeight: 800, color: "#F59E0B", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.08em", padding: "6px 12px", borderRadius: 999, background: "rgba(245,158,11,0.12)" }}>{nextMatch?.surface || "A definir"}</span>
              </div>
              <h1 style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.74)", fontFamily: SANS, lineHeight: 1.35 }}>{nextMatch?.tournament_category || "ATP Tour"}</h1>
              <div style={{ fontSize: 42, fontWeight: 800, color: "#fff", fontFamily: SERIF, lineHeight: 1.02, letterSpacing: "-0.03em" }}>{(nextMatch?.tournament_name || "Próxima partida").split(",")[0]}</div>
            </div>

            <div style={{ padding: 18 }}>
              <div style={{ borderRadius: 24, padding: "18px 14px 16px", background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))", border: "1px solid rgba(255,255,255,0.07)", marginBottom: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 8 }}>
                  <Player image={FONSECA_IMG} name="J. Fonseca" meta={`🇧🇷 #${player?.ranking || 40}`} accent />
                  <div style={{ fontSize: 22, fontWeight: 800, color: "rgba(255,255,255,0.18)", fontFamily: SANS }}>VS</div>
                  <Player image={imgFor(opponentName)} name={opponentName} meta={opponentMeta} />
                </div>
              </div>

              <div style={{ display: "grid", gap: 10, marginBottom: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <MetaBox label="Data do jogo" value={fmtDate(nextMatch?.date)} />
                  <MetaBox label="Horário" value={fmtTime(nextMatch?.date)} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <MetaBox label="Quadra" value={nextMatch?.court || "A definir"} />
                  <MetaBox label="Transmissão" value="ESPN 2 · Disney+" />
                </div>
              </div>

              <div style={{ borderRadius: 18, padding: "14px 16px", textAlign: "center", marginBottom: 12, background: "linear-gradient(180deg, rgba(79,195,247,0.12), rgba(79,195,247,0.08))", border: "1px solid rgba(79,195,247,0.18)" }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: C.blue, fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Contagem regressiva</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#fff", fontFamily: SANS }}>{timerText}</div>
              </div>

              <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
                <a href="https://www.disneyplus.com" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", textAlign: "center", padding: "16px 12px", borderRadius: 16, color: "#fff", fontSize: 14, fontWeight: 800, fontFamily: SANS, background: "linear-gradient(135deg,#F59E0B 0%, #EA8A00 100%)" }}>▶ Assistir</a>
                <button type="button" style={{ padding: "16px 12px", borderRadius: 16, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.88)", fontSize: 14, fontWeight: 800, fontFamily: SANS }}>Adicionar ao calendário</button>
              </div>

              <div style={{ borderRadius: 18, padding: "14px 14px 12px", marginBottom: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.40)", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>João</div>
                    <div style={{ fontSize: 32, fontWeight: 900, color: "#FFFFFF", fontFamily: SANS, lineHeight: 1 }}>{joaoPct}%</div>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.42)", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "center" }}>Probabilidade de vitória</div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.40)", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>{opponentName.split(" ").pop() || "Adversário"}</div>
                    <div style={{ fontSize: 32, fontWeight: 900, color: C.red, fontFamily: SANS, lineHeight: 1 }}>{oppPct}%</div>
                  </div>
                </div>
                <div style={{ height: 10, borderRadius: 999, overflow: "hidden", display: "flex", background: "rgba(255,255,255,0.05)" }}>
                  <div style={{ width: `${joaoPct}%`, background: "linear-gradient(90deg, #22C55E, #00A859)" }} />
                  <div style={{ width: `${oppPct}%`, background: "linear-gradient(90deg, #FF5A5F, #FF7A7E)" }} />
                </div>
              </div>

              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.30)", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Curiosidade de {(nextMatch?.tournament_name || "Torneio").split(",")[0]}</div>
                <div style={{ fontSize: 15, color: "#5CC8FF", fontFamily: SANS, lineHeight: 1.45, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{tournamentFacts?.facts?.[0]?.text || "Atualização em breve"}</div>
              </div>
            </div>
          </section>
        </section>

        <section style={{ paddingBottom: 24 }}>
          <LastMatchCard lastMatch={lastMatch} form={form} />
        </section>

        <section style={{ paddingBottom: 24 }}>
          <SectionLabel>Biografia</SectionLabel>
          <BioCard player={player} season={season} />
        </section>

        <section style={{ paddingBottom: 24 }}>
          <SectionLabel>O que mudou hoje</SectionLabel>
          <Card>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
              <StatPill label="Ranking" value={`#${player?.ranking || 40}`} accent={C.green} />
              <StatPill label="Temporada" value={seasonValue} />
              <StatPill label="vs Top 10" value="1-4" />
              <StatPill label="Prize Money" value={prizeValue} accent={C.green} />
            </div>
            {displayNews.length ? displayNews.map((item, idx) => <NewsItem key={`${item.title}-${idx}`} item={item} noBorder={idx === displayNews.length - 1} />) : <div style={{ fontSize: 14, color: C.sub, fontFamily: SANS }}>Carregando notícias...</div>}
          </Card>
        </section>
      </main>
    </div>
  );
}

export async function getServerSideProps() {
  return { props: {} };
}
