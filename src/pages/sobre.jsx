// pages/sobre.jsx — Página Sobre com disclaimer legal
import Head from "next/head";

export default function Sobre() {
  return (
    <>
      <Head>
        <title>Sobre — Fonseca News</title>
        <meta name="description" content="Sobre o Fonseca News — site de fãs dedicado a acompanhar a carreira do tenista João Fonseca." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@400;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "'Inter', -apple-system, sans-serif" }}>
        <header style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(255,255,255,0.97)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid #e8e8e8" }}>
          <div style={{ maxWidth: 640, margin: "0 auto", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <a href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "#6b6b6b", fontSize: 13, fontWeight: 600 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              Voltar
            </a>
            <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #0D1726, #132440)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 15, fontWeight: 800, letterSpacing: "-0.04em" }}><span style={{ color: "#00A859" }}>F</span><span style={{ color: "#FFCB05" }}>N</span></span>
              </div>
              <span style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 19, fontWeight: 800, letterSpacing: "-0.02em" }}><span style={{ color: "#00A859" }}>Fonseca</span> <span style={{ color: "#FFCB05" }}>News</span></span>
            </a>
          </div>
        </header>

        <main style={{ maxWidth: 640, margin: "0 auto", padding: "32px 16px 60px" }}>
          <h1 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 28, fontWeight: 800, color: "#1a1a1a", marginBottom: 8, letterSpacing: "-0.02em" }}>Sobre o Fonseca News</h1>
          <p style={{ fontSize: 13, color: "#a0a0a0", marginBottom: 32 }}>Última atualização: abril de 2026</p>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1a1a1a", marginBottom: 10, fontFamily: "'Source Serif 4', Georgia, serif" }}>O que é o Fonseca News?</h2>
            <p style={{ fontSize: 14, color: "#444", lineHeight: 1.7, marginBottom: 12 }}>
              O Fonseca News é um projeto independente criado por fãs para acompanhar a carreira do tenista brasileiro João Fonseca. Nosso objetivo é reunir notícias, estatísticas e informações úteis em um só lugar, de forma acessível e gratuita.
            </p>
            <p style={{ fontSize: 14, color: "#444", lineHeight: 1.7 }}>
              O site funciona como um guia de bolso para quem acompanha a trajetória do João no circuito profissional de tênis.
            </p>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1a1a1a", marginBottom: 10, fontFamily: "'Source Serif 4', Georgia, serif" }}>Disclaimer</h2>
            <div style={{ background: "#F7F8F9", borderRadius: 12, padding: "18px 20px", border: "1px solid #e8e8e8" }}>
              <p style={{ fontSize: 13, color: "#444", lineHeight: 1.7, marginBottom: 12 }}>
                <strong>Este site não possui qualquer vínculo oficial com João Fonseca, sua equipe, família, empresários, patrocinadores, a ATP Tour ou qualquer entidade esportiva.</strong>
              </p>
              <p style={{ fontSize: 13, color: "#444", lineHeight: 1.7, marginBottom: 12 }}>
                Trata-se de um projeto independente, sem fins lucrativos, criado exclusivamente para fins informativos e de entretenimento por fãs do esporte.
              </p>
              <p style={{ fontSize: 13, color: "#444", lineHeight: 1.7, marginBottom: 12 }}>
                As notícias exibidas são agregadas de fontes públicas e veículos de comunicação estabelecidos, com devidos créditos e links para as fontes originais. Nenhum conteúdo jornalístico original é produzido pelo site.
              </p>
              <p style={{ fontSize: 13, color: "#444", lineHeight: 1.7, marginBottom: 12 }}>
                As estatísticas, dados e imagens exibidos são obtidos de fontes públicas disponíveis na internet, incluindo sites de estatísticas esportivas e veículos de comunicação. Podem conter imprecisões ou atrasos na atualização. Todos os direitos de imagem pertencem aos seus respectivos titulares.
              </p>
              <p style={{ fontSize: 13, color: "#444", lineHeight: 1.7, marginBottom: 12 }}>
                Caso algum titular de direitos deseje a remoção de qualquer conteúdo, solicitamos que entre em contato pelo e-mail abaixo e atenderemos prontamente.
              </p>
              <p style={{ fontSize: 13, color: "#444", lineHeight: 1.7 }}>
                Os resultados de enquetes, quizzes e palpites são gerados pela comunidade de visitantes e não representam a opinião do site.
              </p>
            </div>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1a1a1a", marginBottom: 10, fontFamily: "'Source Serif 4', Georgia, serif" }}>Privacidade</h2>
            <p style={{ fontSize: 14, color: "#444", lineHeight: 1.7 }}>
              O Fonseca News não coleta dados pessoais identificáveis. Os votos em enquetes e palpites são armazenados de forma anônima. O site utiliza localStorage do navegador para cache e preferências do usuário, que podem ser apagados a qualquer momento pelo visitante.
            </p>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1a1a1a", marginBottom: 10, fontFamily: "'Source Serif 4', Georgia, serif" }}>Contato</h2>
            <p style={{ fontSize: 14, color: "#444", lineHeight: 1.7, marginBottom: 12 }}>
              Para dúvidas, sugestões, solicitações de remoção de conteúdo ou qualquer outro assunto:
            </p>
            <a href="mailto:thzgouvea@gmail.com" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "#F7F8F9", border: "1px solid #e8e8e8", borderRadius: 10, textDecoration: "none", color: "#1a1a1a", fontSize: 13, fontWeight: 600 }}>
              ✉️ thzgouvea@gmail.com
            </a>
          </section>

          <footer style={{ borderTop: "1px solid #e8e8e8", paddingTop: 24, textAlign: "center" }}>
            <p style={{ fontSize: 11, color: "#a0a0a0", lineHeight: 1.6 }}>
              © 2026 Fonseca News · Projeto independente sem fins lucrativos
              <br />Sem vínculo com João Fonseca ou ATP
            </p>
          </footer>
        </main>
      </div>
    </>
  );
}
