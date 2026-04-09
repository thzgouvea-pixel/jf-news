import Head from "next/head";
import DuelHeroCardV2 from "../components/redesign/DuelHeroCardV2";

const GREEN = "#00A859";
const YELLOW = "#FFCB05";
const BG_ALT = "#F7F8F9";
const TEXT = "#1a1a1a";
const SUB = "#6b6b6b";
const DIM = "#a0a0a0";
const BORDER = "#e8e8e8";
const SERIF = "'Source Serif 4', Georgia, serif";
const SANS = "'Inter', -apple-system, sans-serif";

function SectionLabel({ children }) {
  return (
    <p style={{ margin: "0 0 12px", fontSize: 11, fontWeight: 700, color: DIM, fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.06em" }}>
      {children}
    </p>
  );
}

function SoftCard({ children, padding = 18 }) {
  return (
    <div style={{ background: BG_ALT, borderRadius: 16, border: `1px solid ${BORDER}`, padding }}>
      {children}
    </div>
  );
}

function NewsItem({ category, source, time, title, summary }) {
  return (
    <article style={{ padding: "18px 0", borderBottom: `1px solid ${BORDER}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: GREEN, fontFamily: SANS }}>{category}</span>
        <span style={{ fontSize: 11, color: DIM, fontFamily: SANS }}>{source}</span>
        <span style={{ fontSize: 11, color: DIM, fontFamily: SANS, marginLeft: "auto" }}>{time}</span>
      </div>
      <h3 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 700, color: TEXT, fontFamily: SERIF, lineHeight: 1.35 }}>{title}</h3>
      <p style={{ margin: 0, fontSize: 14, color: SUB, fontFamily: SANS, lineHeight: 1.6 }}>{summary}</p>
    </article>
  );
}

function StatPill({ label, value, accent = TEXT }) {
  return (
    <div style={{ textAlign: "center", background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: "14px 10px" }}>
      <span style={{ display: "block", fontSize: 18, fontWeight: 800, color: accent, fontFamily: SANS, lineHeight: 1 }}>{value}</span>
      <span style={{ display: "block", fontSize: 9, fontWeight: 700, color: DIM, fontFamily: SANS, marginTop: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
    </div>
  );
}

export default function HomePreview() {
  return (
    <div style={{ minHeight: "100vh", background: "#fff" }}>
      <Head>
        <title>Fonseca News — Home Preview</title>
        <meta name="description" content="Preview isolada da nova homepage do Fonseca News" />
      </Head>

      <style>{
        "@import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@400;600;700;800&family=Inter:wght@400;500;600;700;800&display=swap');" +
        "*{box-sizing:border-box;margin:0;padding:0}" +
        "body{background:#fff;-webkit-font-smoothing:antialiased}"
      }</style>

      <header style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(255,255,255,0.97)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: "linear-gradient(135deg, #0D1726, #132440)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 800, letterSpacing: "-0.04em" }}><span style={{ color: GREEN }}>F</span><span style={{ color: YELLOW }}>N</span></span>
            </div>
            <div>
              <span style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}><span style={{ color: GREEN }}>Fonseca</span> <span style={{ color: YELLOW }}>News</span></span>
              <span style={{ display: "block", fontSize: 10, color: DIM, fontFamily: SANS, marginTop: 1 }}>Preview da nova hierarquia da home</span>
            </div>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#4FC3F7", fontFamily: SANS, background: "#4FC3F710", border: "1px solid #4FC3F726", padding: "6px 10px", borderRadius: 999 }}>Preview</span>
        </div>
      </header>

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "18px 12px 28px" }}>
        <section style={{ paddingBottom: 22 }}>
          <DuelHeroCardV2
            statusLabel="PRÓXIMO DUELO"
            tournamentName="Monte Carlo Masters 1000"
            tournamentCategory="Masters 1000"
            round="2ª rodada"
            surface="Saibro"
            dateLabel="Quarta, 10 de abril"
            timeLabel="10:30 BRT"
            courtLabel="Court Rainier III"
            broadcastLabel="ESPN 2 · Disney+"
            countdownLabel="Faltam 1 dia e 13 horas"
            joao={{ name: "J. Fonseca", flag: "🇧🇷", ranking: 40, image: "https://www.atptour.com/-/media/alias/player-headshot/f0fv" }}
            opponent={{ name: "M. Berrettini", flag: "🇮🇹", ranking: 34, image: "https://www.atptour.com/-/media/alias/player-headshot/bk40" }}
            probability={{ fonseca: 54, opponent: 46 }}
            factLabel="Monte Carlo é o primeiro grande bloco de saibro da temporada e tende a valorizar pontos mais construídos."
          />
        </section>

        <section style={{ paddingBottom: 22 }}>
          <SectionLabel>O que acabou de acontecer</SectionLabel>
          <div style={{ display: "grid", gap: 12 }}>
            <SoftCard>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: TEXT, fontFamily: SERIF }}>Última partida</h2>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: SUB, fontFamily: SANS }}>Vitória em sets diretos · Miami Open</p>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: GREEN, fontFamily: SANS, background: `${GREEN}12`, padding: "6px 10px", borderRadius: 999 }}>6-3 6-4</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: 14 }}>
                  <div style={{ fontSize: 10, color: DIM, fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Oponente</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: TEXT, fontFamily: SERIF }}>Brandon Nakashima</div>
                </div>
                <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: 14 }}>
                  <div style={{ fontSize: 10, color: DIM, fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Forma recente</div>
                  <div style={{ display: "flex", gap: 5, marginTop: 6 }}>
                    {['V','V','D','V','V'].map((r, i) => (
                      <span key={i} style={{ width: 22, height: 22, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", background: r === 'V' ? `${GREEN}14` : "#FEE2E2", color: r === 'V' ? GREEN : "#DC2626", fontSize: 10, fontWeight: 800, fontFamily: SANS }}>{r}</span>
                    ))}
                  </div>
                </div>
              </div>
            </SoftCard>

            <SoftCard padding={0}>
              <div style={{ aspectRatio: "16 / 9", background: "linear-gradient(135deg, #111827 0%, #1F2937 100%)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: SANS, fontWeight: 700 }}>
                Melhores momentos
              </div>
            </SoftCard>
          </div>
        </section>

        <section style={{ paddingBottom: 22 }}>
          <SectionLabel>O que mudou hoje</SectionLabel>
          <SoftCard>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 18 }}>
              <StatPill label="Ranking" value="#40" accent={GREEN} />
              <StatPill label="Temporada" value="14-8" />
              <StatPill label="vs Top 10" value="1-4" />
              <StatPill label="Prize Money" value="$2.9M" accent={GREEN} />
            </div>

            <NewsItem
              category="Torneio"
              source="ESPN Brasil"
              time="há 2h"
              title="João Fonseca confirma presença no ATP 500 de Barcelona"
              summary="O brasileiro amplia o calendário de saibro e mantém sequência forte na gira europeia."
            />
            <NewsItem
              category="Ranking"
              source="UOL Esporte"
              time="há 8h"
              title="Fonseca sobe para o top 40 e consolida melhor marca da carreira"
              summary="A campanha recente em Masters 1000 reforça a ascensão e aumenta expectativa para a temporada de saibro."
            />
            <article style={{ paddingTop: 18 }}>
              <div style={{ display: "flex", gap: 10 }}>
                <button style={{ flex: 1, padding: "13px 12px", background: GREEN, color: "#fff", border: "none", borderRadius: 12, fontSize: 13, fontWeight: 800, fontFamily: SANS, cursor: "pointer" }}>Ver feed completo</button>
                <button style={{ flex: 1, padding: "13px 12px", background: "#fff", color: TEXT, border: `1px solid ${BORDER}`, borderRadius: 12, fontSize: 13, fontWeight: 700, fontFamily: SANS, cursor: "pointer" }}>Abrir ranking</button>
              </div>
            </article>
          </SoftCard>
        </section>

        <section>
          <SectionLabel>Explorar o universo do João</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              ["Calendário ATP", "Próximos torneios e agenda"],
              ["Conquistas", "Títulos e marcos da carreira"],
              ["Linha do tempo", "Do juvenil ao circuito ATP"],
              ["Comparativos", "João vs Next Gen"],
            ].map(([title, sub], i) => (
              <SoftCard key={i}>
                <div style={{ fontSize: 15, fontWeight: 800, color: TEXT, fontFamily: SERIF, marginBottom: 4 }}>{title}</div>
                <div style={{ fontSize: 12, color: SUB, fontFamily: SANS, lineHeight: 1.5 }}>{sub}</div>
              </SoftCard>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export async function getServerSideProps() {
  return { props: {} };
}
