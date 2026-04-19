import Head from "next/head";
import { useState } from "react";
import { GREEN, YELLOW, TEXT, SUB, DIM, BORDER, BG_ALT, SERIF, SANS } from "../lib/constants";

var sections = [
  {
    id: "basico",
    title: "O básico do jogo",
    icon: "🎾",
    content: [
      { q: "O que é o tênis?", a: "O tênis é um esporte jogado entre dois jogadores (simples) ou quatro jogadores em duplas. O objetivo é rebater a bola por cima da rede para o lado adversário de forma que o oponente não consiga devolver." },
      { q: "Qual o tamanho da quadra?", a: "A quadra de simples mede 23,77m de comprimento por 8,23m de largura. Para duplas, a largura aumenta para 10,97m. A rede tem 91,4cm de altura no centro." },
      { q: "Quais são as superfícies?", a: "Existem três superfícies principais: saibro (terra batida, como Roland Garros e Monte Carlo), grama (como Wimbledon) e hard court/piso duro (como US Open e Australian Open — pode ser ao ar livre ou indoor). Cada superfície afeta a velocidade e o quique da bola: o saibro é mais lento e a bola quica mais alto, a grama é mais rápida e irregular, e o hard court é o meio-termo. O João Fonseca joga em todas, mas brilhou especialmente no hard court." },
    ]
  },
  {
    id: "pontuacao",
    title: "Sistema de pontuação",
    icon: "📊",
    content: [
      { q: "Como funciona a contagem de pontos?", a: "A contagem é: 0 (love), 15, 30, 40. Se ambos chegam a 40, temos um \"deuce\" (igualdade). A partir daí, precisa ganhar 2 pontos consecutivos — primeiro a \"vantagem\" (advantage), depois o game." },
      { q: "O que é um game?", a: "Um game é vencido pelo jogador que primeiro faz 4 pontos com pelo menos 2 de vantagem. Cada game tem um sacador, que alterna entre os jogadores." },
      { q: "O que é um set?", a: "Um set é vencido pelo jogador que primeiro ganha 6 games com pelo menos 2 de diferença. Se chegar a 6x6, geralmente se joga um tiebreak." },
      { q: "O que é um tiebreak?", a: "No tiebreak, os pontos são contados numericamente (1, 2, 3...). Vence quem primeiro faz 7 pontos com 2 de diferença. O saque alterna: o primeiro jogador saca 1 vez, depois cada jogador saca 2 vezes, alternando. Troca-se de lado a cada 6 pontos. Hoje, todos os Grand Slams usam tiebreak no set decisivo a 6-6." },
      { q: "Quantos sets tem uma partida?", a: "Partidas masculinas em Grand Slams (Australian Open, Roland Garros, Wimbledon, US Open) são jogadas em melhor de 5 sets (best of 5). Nas demais competições ATP, incluindo Masters 1000 como Monte Carlo, são jogadas em melhor de 3 sets (best of 3). Partidas femininas são sempre melhor de 3." },
    ]
  },
  {
    id: "saque",
    title: "Saque e devolução",
    icon: "💨",
    content: [
      { q: "Como funciona o saque?", a: "O sacador tem duas chances de colocar a bola em jogo. O primeiro saque deve cair na área de serviço diagonalmente oposta. Se errar o primeiro, tem direito ao segundo saque. Se errar os dois, é uma dupla-falta e o adversário ganha o ponto. O saque alterna a cada game: quem sacou no primeiro, recebe no segundo, e assim por diante. Dentro de um game, o sacador alterna o lado da quadra a cada ponto." },
      { q: "O que é um ace?", a: "Ace é quando o sacador faz um saque tão bom que o adversário nem consegue tocar na bola. É um dos stats mais acompanhados — jogadores como o João Fonseca frequentemente marcam vários aces por partida." },
      { q: "O que significa 'quebrar o saque'?", a: "Quebra de saque (break) acontece quando o devolvedor vence o game de saque do adversário. É um momento crucial porque o sacador tem vantagem natural. Conseguir um break geralmente define o set." },
    ]
  },
  {
    id: "torneios",
    title: "Torneios e ranking",
    icon: "🏆",
    content: [
      { q: "O que são os Grand Slams?", a: "São os 4 torneios mais importantes do circuito: Australian Open (janeiro, hard court), Roland Garros (maio-junho, saibro), Wimbledon (junho-julho, grama) e US Open (agosto-setembro, hard court). Valem mais pontos pro ranking e têm partidas em melhor de 5 sets." },
      { q: "O que são os Masters 1000?", a: "São os 9 torneios logo abaixo dos Grand Slams em importância: Indian Wells, Miami, Monte Carlo, Madrid, Roma, Canadá, Cincinnati, Shanghai e Paris. Valem 1000 pontos para o campeão. São jogados em melhor de 3 sets. O próximo torneio do João Fonseca é o Masters de Monte Carlo!" },
      { q: "Como funciona o ranking ATP?", a: "O ranking é baseado nos melhores resultados do jogador nos últimos 12 meses. Grand Slams valem até 2000 pontos, Masters 1000 até 1000 pontos, e assim por diante. O João Fonseca está atualmente no top 40 e subindo." },
      { q: "O que é o ATP Finals?", a: "É o torneio de fim de temporada que reúne os 8 melhores jogadores do ano. É jogado em formato de grupo + eliminatórias. O NextGen ATP Finals reúne os 8 melhores sub-21 — o João Fonseca foi campeão em 2024!" },
    ]
  },
  {
    id: "termos",
    title: "Termos comuns",
    icon: "📖",
    content: [
      { q: "Winner", a: "Bola vencedora que o adversário não consegue devolver. Diferente do ace, pode acontecer em qualquer momento do ponto, não só no saque." },
      { q: "Unforced error", a: "Erro não forçado — quando o jogador erra sem pressão do adversário. É um indicador importante de consistência." },
      { q: "Rally", a: "Troca de bolas entre os jogadores dentro de um ponto. Rallies longos são comuns no saibro." },
      { q: "Volley", a: "Quando o jogador bate na bola antes dela quicar, geralmente perto da rede." },
      { q: "Drop shot", a: "Bola curta que quica perto da rede, usada pra surpreender o adversário que está no fundo da quadra." },
      { q: "Let", a: "Quando o saque toca na rede mas cai na área de serviço correta. O saque é repetido sem penalidade." },
      { q: "Seed (cabeça de chave)", a: "Jogadores pré-selecionados no sorteio do torneio baseado no ranking, para evitar que os melhores se enfrentem nas primeiras rodadas." },
    ]
  },
];

export default function RegrasDoTenis() {
  var _a = useState(null); var activeSection = _a[0]; var setActiveSection = _a[1];
  var _q = useState(null); var activeQ = _q[0]; var setActiveQ = _q[1];

  return (
    <>
      <Head>
        <title>Regras do Tênis — Guia Completo | Fonseca News</title>
        <meta name="description" content="Aprenda as regras do tênis de forma simples e rápida. Pontuação, saque, sets, tiebreak, Grand Slams e tudo que você precisa saber para acompanhar o João Fonseca." />
        <meta name="keywords" content="regras do tênis, como funciona o tênis, pontuação tênis, saque tênis, tiebreak, Grand Slam, ATP, João Fonseca" />
        <meta property="og:title" content="Regras do Tênis — Guia Completo | Fonseca News" />
        <meta property="og:description" content="Aprenda as regras do tênis de forma simples e rápida." />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://fonsecanews.com.br/regras" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@400;600;700;800&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>

      <div style={{ minHeight: "100vh", background: "#fff", fontFamily: SANS }}>
        {/* Header */}
        <header style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(255,255,255,0.96)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid " + BORDER }}>
          <div style={{ maxWidth: 640, margin: "0 auto", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #0D1726, #132440)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: SERIF, fontSize: 14, fontWeight: 800 }}><span style={{ color: GREEN }}>F</span><span style={{ color: YELLOW }}>N</span></span>
              </div>
              <span style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 700, color: TEXT }}>Fonseca News</span>
            </a>
            <a href="/" style={{ fontSize: 12, fontWeight: 600, color: GREEN, fontFamily: SANS, textDecoration: "none" }}>← Voltar</a>
          </div>
        </header>

        <main style={{ maxWidth: 640, margin: "0 auto", padding: "0 20px 60px" }}>
          {/* Hero */}
          <section style={{ padding: "32px 0 28px", textAlign: "center" }}>
            <span style={{ fontSize: 48 }}>🎾</span>
            <h1 style={{ margin: "12px 0 8px", fontSize: 28, fontWeight: 800, fontFamily: SERIF, color: TEXT, letterSpacing: "-0.03em", lineHeight: 1.1 }}>Regras do Tênis</h1>
            <p style={{ margin: 0, fontSize: 14, color: SUB, fontFamily: SANS, lineHeight: 1.6, maxWidth: 400, marginLeft: "auto", marginRight: "auto" }}>Tudo que você precisa saber pra acompanhar o João Fonseca e entender cada ponto.</p>
          </section>

          {/* Quick nav */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 24, justifyContent: "center" }}>
            {sections.map(function(s) {
              return (
                <a key={s.id} href={"#" + s.id} style={{ fontSize: 11, fontWeight: 600, color: GREEN, fontFamily: SANS, padding: "6px 12px", borderRadius: 999, background: GREEN + "08", border: "1px solid " + GREEN + "15", textDecoration: "none" }}>{s.icon} {s.title}</a>
              );
            })}
          </div>

          {/* Sections */}
          {sections.map(function(section) {
            return (
              <section key={section.id} id={section.id} style={{ marginBottom: 28 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, paddingBottom: 10, borderBottom: "1px solid " + BORDER }}>
                  <span style={{ fontSize: 18 }}>{section.icon}</span>
                  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, fontFamily: SERIF, color: TEXT, letterSpacing: "-0.02em" }}>{section.title}</h2>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {section.content.map(function(item, idx) {
                    var key = section.id + "-" + idx;
                    var isOpen = activeQ === key;
                    return (
                      <div key={key}>
                        <button onClick={function() { setActiveQ(isOpen ? null : key); }} style={{ width: "100%", padding: "14px 0", background: "transparent", border: "none", borderBottom: "1px solid " + (isOpen ? "transparent" : BORDER), cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, textAlign: "left" }}>
                          <span style={{ fontSize: 14, fontWeight: 600, color: isOpen ? GREEN : TEXT, fontFamily: SANS, lineHeight: 1.4 }}>{item.q}</span>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isOpen ? GREEN : DIM} strokeWidth="2" style={{ flexShrink: 0, transition: "transform 0.3s", transform: isOpen ? "rotate(180deg)" : "rotate(0)" }}><polyline points="6 9 12 15 18 9" /></svg>
                        </button>
                        {isOpen && (
                          <div style={{ padding: "0 0 16px", borderBottom: "1px solid " + BORDER }}>
                            <p style={{ margin: 0, fontSize: 14, color: SUB, fontFamily: SANS, lineHeight: 1.7 }}>{item.a}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}

          {/* CTA */}
          <section style={{ background: "linear-gradient(145deg, #0D1726, #132440)", borderRadius: 20, padding: "28px 24px", textAlign: "center", marginTop: 20 }}>
            <span style={{ fontSize: 32 }}>🇧🇷</span>
            <h3 style={{ margin: "10px 0 6px", fontSize: 20, fontWeight: 800, color: "#fff", fontFamily: SERIF }}>Agora acompanhe o João!</h3>
            <p style={{ margin: "0 0 16px", fontSize: 13, color: "rgba(255,255,255,0.5)", fontFamily: SANS }}>Notícias, countdown, quiz e mais no Fonseca News.</p>
            <a href="/" style={{ display: "inline-block", background: GREEN, color: "#fff", padding: "12px 24px", borderRadius: 12, fontSize: 14, fontWeight: 700, fontFamily: SANS, textDecoration: "none" }}>Ir para o site →</a>
          </section>

          {/* Footer */}
          <footer style={{ padding: "24px 0", textAlign: "center" }}>
            <p style={{ fontSize: 10, color: DIM, fontFamily: SANS }}>© 2026 Fonseca News · Site independente de fãs</p>
          </footer>
        </main>
      </div>
    </>
  );
}
