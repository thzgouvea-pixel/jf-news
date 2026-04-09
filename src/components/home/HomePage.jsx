import { useState } from "react";
import Head from "next/head";
import NextDuelCard from "./NextDuelCard";
import MatchCarousel from "./MatchCarousel";
import NewsCard from "./NewsCard";
import Modal from "../ui/Modal";
import { formatTimeAgo } from "../../lib/formatters";
import useHomeData from "../../hooks/useHomeData";

const GREEN = "#00A859";
const YELLOW = "#FFCB05";
const BG_ALT = "#F7F8F9";
const TEXT = "#1a1a1a";
const SUB = "#6b6b6b";
const DIM = "#a0a0a0";
const BORDER = "#e8e8e8";
const SERIF = "'Source Serif 4', Georgia, serif";
const SANS = "'Inter', -apple-system, sans-serif";

const SAMPLE_PLAYER = { ranking: 40, rankingChange: "+4" };
const SAMPLE_NEXT_MATCH = {
  tournament_category: "Masters 1000",
  tournament_name: "Monte Carlo Masters",
  surface: "Saibro",
  city: "Monte Carlo",
  country: "Mônaco",
  date: "2026-04-04T12:00:00Z",
  round: "",
};
const SAMPLE_NEWS = [
  { title: "João Fonseca confirma presença no ATP 500 de Barcelona", summary: "O tenista brasileiro confirmou participação no torneio espanhol de saibro.", source: "ESPN Brasil", url: "https://www.espn.com.br/tenis/", date: new Date(Date.now() - 2 * 3600000).toISOString(), category: "Torneio" },
  { title: "Fonseca sobe para 40º no ranking da ATP", summary: "Campanha até as oitavas em Miami rende posições ao carioca.", source: "UOL Esporte", url: "https://www.uol.com.br/esporte/tenis/", date: new Date(Date.now() - 8 * 3600000).toISOString(), category: "Ranking" },
  { title: "Fonseca treina no Rio visando saibro", summary: "Preparação física e ajustes no saque com equipe técnica.", source: "O Globo", url: "https://oglobo.globo.com/esportes/", date: new Date(Date.now() - 36 * 3600000).toISOString(), category: "Treino" },
];

function Skeleton() {
  return (
    <div>
      {[...Array(4)].map((_, i) => (
        <div key={i} style={{ padding: "22px 0", borderBottom: `1px solid ${BORDER}`, animation: "pulse 1.8s ease-in-out infinite", animationDelay: `${i * 0.12}s` }}>
          <div style={{ height: 12, width: 70, background: "#f0f0f0", borderRadius: 4, marginBottom: 10 }} />
          <div style={{ height: 16, width: "85%", background: "#f0f0f0", borderRadius: 4, marginBottom: 8 }} />
          <div style={{ height: 14, width: "60%", background: "#f5f5f5", borderRadius: 4 }} />
        </div>
      ))}
    </div>
  );
}

export default function HomePage({ preview = false }) {
  const [showOppPopup, setShowOppPopup] = useState(false);
  const {
    news,
    nextMatch,
    player,
    lastMatch,
    matchStats,
    recentForm,
    prizeMoney,
    loading,
    lastUpdate,
    allLikes,
    highlightVideo,
    opponentProfile,
    winProb,
    liveMatch,
    tournamentFacts,
  } = useHomeData();

  const displayNews = news.length ? news : SAMPLE_NEWS;
  const displayMatch = nextMatch || SAMPLE_NEXT_MATCH;
  const displayPlayer = player || SAMPLE_PLAYER;

  return (
    <div style={{ minHeight: "100vh", background: "#fff" }}>
      <Head>
        <title>{preview ? "Fonseca News — Home V2" : "Fonseca News — Guia de bolso sobre João Fonseca"}</title>
        <meta name="description" content={preview ? "Preview da home refatorada do Fonseca News." : "Acompanhe a carreira do tenista João Fonseca: notícias, ranking, estatísticas, próximos jogos e mais."} />
      </Head>
      <style>{
        "@import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@400;600;700;800&family=Inter:wght@400;500;600;700;800&display=swap');" +
        "*{box-sizing:border-box;margin:0;padding:0}" +
        "body{background:#fff;-webkit-font-smoothing:antialiased}" +
        "[data-match-carousel]::-webkit-scrollbar{display:none}" +
        "@keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}" +
        "@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}" +
        "@keyframes slideU{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}" +
        "@keyframes fadeInO{from{opacity:0}to{opacity:1}}"
      }</style>
      <header style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(255,255,255,0.97)", backdropFilter: "blur(20px)", borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: "linear-gradient(135deg, #0D1726, #132440)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 800, letterSpacing: "-0.04em" }}><span style={{ color: GREEN }}>F</span><span style={{ color: YELLOW }}>N</span></span>
            </div>
            <div style={{ minWidth: 0 }}>
              <span style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", whiteSpace: "nowrap" }}><span style={{ color: GREEN }}>Fonseca</span> <span style={{ color: YELLOW }}>News</span></span>
              <span style={{ fontSize: 10, color: DIM, fontFamily: SANS, display: "block", marginTop: 2 }}>
                {preview ? "Preview da home refatorada" : "Guia de bolso"}{lastUpdate ? ` · ${formatTimeAgo(lastUpdate)}` : ""}
              </span>
            </div>
          </div>
          {preview ? <a href="/" style={{ fontSize: 12, fontWeight: 700, color: GREEN, fontFamily: SANS, textDecoration: "none" }}>Voltar</a> : null}
        </div>
      </header>
      <main style={{ maxWidth: 640, margin: "0 auto", padding: "0 12px 36px" }}>
        <section style={{ padding: "8px 0 0" }}>
          <NextDuelCard match={displayMatch} player={displayPlayer} onOppClick={opponentProfile ? () => setShowOppPopup(true) : null} winProb={winProb} oppProfile={opponentProfile} liveData={liveMatch} tournamentFacts={tournamentFacts?.facts || null} />
        </section>
        <section style={{ padding: "20px 0 0" }}>
          <p style={{ margin: "0 0 12px", fontSize: 11, fontWeight: 700, color: DIM, fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.06em" }}>Última partida</p>
          {highlightVideo?.videoId ? (
            <MatchCarousel matchStats={matchStats} lastMatch={lastMatch} recentForm={recentForm} prizeMoney={prizeMoney} playerRanking={displayPlayer?.ranking} opponentProfile={opponentProfile} highlightVideo={highlightVideo} />
          ) : loading ? <Skeleton /> : null}
        </section>
        <section style={{ padding: "20px 0 0" }}>
          <p style={{ margin: "0 0 12px", fontSize: 11, fontWeight: 700, color: DIM, fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.06em" }}>Notícias</p>
          {loading && !news.length ? <Skeleton /> : null}
          {!loading ? <div>{displayNews.slice(0, 8).map((item, index) => <NewsCard key={`${item.title}-${index}`} item={item} index={index} allLikes={allLikes} noBorder={index === Math.min(displayNews.length, 8) - 1} />)}</div> : null}
        </section>
        {preview ? (
          <section style={{ padding: "24px 0 0" }}>
            <div style={{ background: BG_ALT, borderRadius: 14, padding: "16px 18px", border: `1px solid ${BORDER}` }}>
              <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 700, color: TEXT, fontFamily: SERIF }}>O que esta rota prova</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {["NextDuelCard já está desacoplado da home principal","MatchCarousel e PlayerBlock já funcionam como módulos independentes","NewsCard saiu do arquivo monolítico","Modal compartilhado e utilitários base já estão extraídos","Busca de dados da home agora está centralizada em hook"].map((text, index) => (
                  <div key={index} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}><span style={{ color: GREEN, fontSize: 12, fontWeight: 700, fontFamily: SANS, marginTop: 1 }}>•</span><span style={{ fontSize: 12, color: SUB, fontFamily: SANS, lineHeight: 1.5 }}>{text}</span></div>
                ))}
              </div>
            </div>
          </section>
        ) : null}
      </main>
      {showOppPopup && opponentProfile ? (
        <Modal title={opponentProfile.name || "Oponente"} subtitle={preview ? "Preview do modal refatorado" : undefined} onClose={() => setShowOppPopup(false)} maxWidth={420}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[ ["País", opponentProfile.country || "—"], ["Ranking", opponentProfile.ranking ? `#${opponentProfile.ranking}` : "—"], ["Idade", opponentProfile.age || "—"], ["Mão", opponentProfile.hand || "—"] ].map(([label, value]) => (
              <div key={label} style={{ padding: "12px", borderRadius: 12, background: BG_ALT, border: `1px solid ${BORDER}` }}><span style={{ fontSize: 10, color: DIM, fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 4 }}>{label}</span><span style={{ fontSize: 14, color: TEXT, fontFamily: SANS, fontWeight: 700 }}>{value}</span></div>
            ))}
          </div>
          {opponentProfile.style ? <p style={{ margin: "14px 0 0", fontSize: 13, color: SUB, fontFamily: SANS, lineHeight: 1.6 }}>{opponentProfile.style}</p> : null}
        </Modal>
      ) : null}
    </div>
  );
}
