import { useState, useEffect, useRef } from "react";
import Head from "next/head";

const GREEN = "#00A859";
const YELLOW = "#FFCB05";
const TEXT = "#1a1a1a";
const SUB = "#666";
const DIM = "#999";
const BG = "#f9f9f9";
const BORDER = "#e5e5e5";
const SERIF = "'Source Serif 4', Georgia, serif";
const SANS = "'Inter', -apple-system, sans-serif";

export default function JoaoFonsecaNews() {
  const [news, setNews] = useState([]);
  const [nextMatch, setNextMatch] = useState(null);
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/news").then(r => r.json()).then(d => setNews(d.news || [])).catch(() => {});
    fetch("/api/sofascore-data").then(r => r.json()).then(d => {
      if (d.nextMatch) setNextMatch(d.nextMatch);
      if (d.ranking) setPlayer({ ranking: d.ranking.ranking });
    }).catch(() => {});
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#fff" }}>
      <Head>
        <title>Fonseca News</title>
      </Head>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@400;600;700;800&family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #fff; }
      `}</style>

      <header style={{ background: "#fff", borderBottom: "1px solid " + BORDER, padding: "14px 16px", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: TEXT, fontFamily: SERIF }}>Fonseca News</h1>
            <p style={{ margin: 0, fontSize: 10, color: DIM, fontFamily: SANS }}>João Fonseca</p>
          </div>
          <button onClick={() => window.location.reload()} style={{ width: 32, height: 32, borderRadius: 8, background: "transparent", border: "none", cursor: "pointer", fontSize: 16 }}>
            🔄
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 640, margin: "0 auto", padding: "20px 16px 100px" }}>
        {/* Próximo Jogo */}
        {nextMatch && (
          <section style={{ background: BG, border: "2px solid " + GREEN, borderRadius: 16, padding: 20, marginBottom: 20 }}>
            <h2 style={{ margin: "0 0 16px", fontSize: 20, fontWeight: 800, color: TEXT, fontFamily: SERIF }}>{nextMatch.tournament_name}</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 12, alignItems: "center", marginBottom: 20 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ width: 60, height: 60, borderRadius: "50%", margin: "0 auto 8px", background: "#fff", border: "2px solid " + GREEN }} />
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: TEXT }}>J. Fonseca</p>
                <p style={{ margin: "2px 0 0", fontSize: 10, color: SUB }}>🇧🇷 #{player?.ranking || 40}</p>
              </div>
              <p style={{ fontSize: 14, fontWeight: 700, color: GREEN }}>VS</p>
              <div style={{ textAlign: "center" }}>
                <div style={{ width: 60, height: 60, borderRadius: "50%", margin: "0 auto 8px", background: "#fff", border: "2px solid " + BORDER }} />
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: TEXT }}>{nextMatch.opponent_name}</p>
                <p style={{ margin: "2px 0 0", fontSize: 10, color: SUB }}>#{nextMatch.opponent_ranking || "—"}</p>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button style={{ padding: "12px", background: "#fff", border: "1px solid " + BORDER, borderRadius: 10, fontSize: 12, fontWeight: 600, color: GREEN, cursor: "pointer" }}>
                📅 Calendário
              </button>
              <a href="https://www.disneyplus.com" target="_blank" rel="noopener noreferrer" style={{ padding: "12px", background: GREEN, border: "none", borderRadius: 10, fontSize: 12, fontWeight: 600, color: "#fff", cursor: "pointer", textAlign: "center", textDecoration: "none" }}>
                ▶️ Assistir
              </a>
            </div>
          </section>
        )}

        {/* Ranking */}
        <section style={{ background: GREEN + "15", border: "1px solid " + GREEN + "30", borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: SUB, textTransform: "uppercase" }}>Ranking ATP</p>
              <p style={{ margin: "4px 0 0", fontSize: 28, fontWeight: 800, color: GREEN, fontFamily: SANS }}>#{player?.ranking || 40}</p>
            </div>
            <span style={{ fontSize: 32 }}>📊</span>
          </div>
        </section>

        {/* Notícias */}
        <section>
          <h2 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700, color: TEXT, fontFamily: SERIF }}>📰 Notícias</h2>
          <div style={{ background: "#fff", borderRadius: 12, padding: 16, border: "1px solid " + BORDER }}>
            {news.length > 0 ? (
              news.map((item, i) => (
                <article key={i} style={{ padding: "12px 0", borderBottom: i < news.length - 1 ? "1px solid " + BORDER : "none" }}>
                  <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: GREEN, textTransform: "uppercase" }}>{item.category}</span>
                    <span style={{ fontSize: 10, color: DIM }}>{item.source}</span>
                  </div>
                  <h3 style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: TEXT, fontFamily: SERIF }}>{item.title}</h3>
                  {item.summary && <p style={{ margin: 0, fontSize: 12, color: SUB }}>{item.summary}</p>}
                </article>
              ))
            ) : (
              <p style={{ margin: 0, fontSize: 12, color: DIM, textAlign: "center", padding: "20px 0" }}>Carregando notícias...</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export async function getServerSideProps() {
  return { props: {} };
}
