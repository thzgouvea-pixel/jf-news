// src/pages/biografia.jsx
// Aesthetic biography page for João Fonseca
// v2: Fixed height (1.88m), coach (Franco Davin + Teixeira), Challengers (3), Nadal photo story
import Head from "next/head";
import { useState, useEffect } from "react";

var SERIF = "'Source Serif 4', Georgia, serif";
var SANS = "'Inter', -apple-system, sans-serif";
var GREEN = "#00A859";
var YELLOW = "#FFCB05";
var TEXT = "#1a1a1a";
var SUB = "#6b6b6b";
var DIM = "#a0a0a0";
var BORDER = "#e8e8e8";

var TIMELINE = [
  { year: "2006", age: "", title: "O começo", text: "Nasce em 21 de agosto no Rio de Janeiro, em Ipanema. Filho de Roberta, ex-jogadora de vôlei, e Christiano, CEO da IP Capital Partners." },
  { year: "2010", age: "4 anos", title: "Primeiro contato", text: "Começa a jogar tênis no Country Club do Rio de Janeiro, ao lado de casa. Pai monta uma mini-rede no quarto pra jogar com ele." },
  { year: "2014", age: "8 anos", title: "O sonho nasce", text: "Assiste Rafael Nadal vencer o Rio Open da primeira fileira. Tira foto com Thomaz Bellucci. O tênis deixa de ser brincadeira." },
  { year: "2022", age: "16 anos", title: "Primeiros passos", text: "Atinge quartas de final em dois Challengers. Começa a aparecer no radar do circuito profissional." },
  { year: "2023", age: "17 anos", title: "Ano revelação", emoji: "🏆", text: "Campeão do US Open Juvenil. Primeiro brasileiro nº1 do ranking juvenil da ITF. Estreia no ATP no Rio Open. Convidado como sparring no Nitto ATP Finals — treina com Alcaraz, Medvedev e Sinner." },
  { year: "2024", age: "18 anos", title: "A explosão", emoji: "🔥", text: "Quartas do Rio Open (ATP 500) com vitória sobre Arthur Fils. Vira profissional. Salta do #727 para #145 no ranking. Campeão do Lexington Challenger. Campeão do NextGen ATP Finals invicto (5-0) — primeiro sul-americano e terceiro mais jovem da história, ao lado de Alcaraz e Sinner." },
  { year: "2025", age: "19 anos", title: "Elite mundial", emoji: "⭐", text: "Derrota Rublev (#9) na estreia do Australian Open. Campeão do ATP 250 de Buenos Aires — mais jovem sul-americano campeão desde Perez-Roldan em 1987. Campeão do Canberra e Phoenix Challengers. Campeão do ATP 500 de Basel — primeiro brasileiro a vencer um ATP 500, feito inédito desde Kuerten. Encerra o ano como #24 do mundo." },
  { year: "2026", age: "19 anos", title: "Em ascensão", emoji: "🚀", text: "Lesão nas costas atrasa início da temporada. Volta forte: R4 em Indian Wells com vitórias sobre Collignon, Khachanov e Tommy Paul. Jogo épico contra Sinner nas oitavas (dois tiebreaks). R3 no Miami Open. Campeão de duplas no Rio Open com Marcelo Melo. QF em Monte Carlo com vitórias sobre Diallo, Rinderknech e Berrettini — derrota honrosa contra o #3 Zverev. Novo técnico: Franco Davin se junta à equipe. Disputa o BMW Open em Munique." },
];

var STATS = [
  { label: "Títulos ATP", value: "2", detail: "Buenos Aires + Basel" },
  { label: "Títulos Challenger", value: "3", detail: "Lexington, Canberra, Phoenix" },
  { label: "NextGen Finals", value: "🏆", detail: "Campeão 2024" },
  { label: "US Open Jr", value: "🏆", detail: "Campeão 2023" },
  { label: "Melhor ranking", value: "#24", detail: "Nov 2025" },
  { label: "Nº1 Brasil", value: "✓", detail: "Atual" },
];

var FICHA = [
  ["Nome completo", "João Franca Guimarães Fonseca"],
  ["Nascimento", "21 de agosto de 2006 (19 anos)"],
  ["Naturalidade", "Ipanema, Rio de Janeiro 🇧🇷"],
  ["Altura", "1,88m"],
  ["Mão", "Destro, backhand com duas mãos"],
  ["Técnico", "Franco Davin / Guilherme Teixeira"],
  ["Profissional desde", "2024"],
  ["Patrocinadores", "Nike, Rolex"],
  ["Ídolos", "Roger Federer, Gustavo Kuerten"],
];

var CURIOSIDADES = [
  "Aos 2 anos, o professor de yoga do pai já notava coordenação fora do normal",
  "Cresceu a 10 minutos do Rio Open — assistia o torneio todo ano desde criança",
  "Em 2014, aos 8 anos, assistiu Nadal da primeira fileira no Rio Open e tirou foto com Bellucci — ali nasceu o sonho",
  "Aos 19, já tem mais títulos ATP que Federer e Djokovic tinham na mesma idade",
  "O New York Times o chamou de 'futura estrela' e comparou seu forehand a uma 'bola de demolição'",
  "Foi o primeiro sul-americano campeão do NextGen ATP Finals",
  "Torneios viram 'carnaval brasileiro' quando ele joga, segundo a imprensa internacional",
  "Testimonee da Rolex desde 2024 — a mesma marca que patrocina Federer",
];

var CITACOES = [
  { text: "Estou muito feliz com o momento em que estou agora, mas claro que quero mais.", author: "João Fonseca", context: "ao New York Times" },
  { text: "Sou confiante e acho que posso fazer grandes coisas, mas também preciso manter os pés no chão.", author: "João Fonseca", context: "ao New York Times" },
];

export default function Biografia() {
  var _openSection = useState(null);
  var openSection = _openSection[0];
  var setOpenSection = _openSection[1];

  // Dynamic stats from API
  var _data = useState(null); var data = _data[0]; var setData = _data[1];
  useEffect(function() {
    fetch("/api/all-data").then(function(r) { return r.json(); }).then(function(d) {
      setData(d);
    }).catch(function() {});
  }, []);

  // Dynamic values with fallbacks
  var ranking = (data && data.ranking && data.ranking.ranking) || 35;
  var bestRanking = (data && data.ranking && data.ranking.bestRanking) || 24;
  var career = (data && data.careerStats) || {};
  var wins = career.wins || 114;
  var losses = career.losses || 63;
  var titles = career.titles || 2;
  var prizeMoney = (data && data.prizeMoney) || 3152530;
  var prizeStr = prizeMoney >= 1000000 ? "$" + (Math.floor(prizeMoney / 100000) / 10).toFixed(1) + "M" : "$" + Math.round(prizeMoney / 1000) + "K";
  var season = (data && data.season) || {};
  var seasonW = season.wins || 0;
  var seasonL = season.losses || 0;

  var STATS_DYNAMIC = [
    { label: "Ranking ATP", value: "#" + ranking, detail: "Best: #" + bestRanking },
    { label: "Carreira", value: wins + "V " + losses + "D", detail: Math.round(wins/(wins+losses)*100) + "% aprov." },
    { label: "Temporada 2026", value: seasonW + "V " + seasonL + "D", detail: (seasonW+seasonL) > 0 ? Math.round(seasonW/(seasonW+seasonL)*100) + "% aprov." : "" },
    { label: "Títulos ATP", value: "" + titles, detail: "Buenos Aires + Basel" },
    { label: "Prize Money", value: prizeStr, detail: "Carreira" },
    { label: "NextGen Finals", value: "🏆", detail: "Campeão 2024" },
  ];

  return (
    <>
      <Head>
        <title>João Fonseca — Biografia | Fonseca News</title>
        <meta name="description" content="Biografia completa de João Fonseca, tenista brasileiro. Carreira, títulos, curiosidades e timeline completa do fenômeno do tênis brasileiro." />
        <meta name="keywords" content="João Fonseca, biografia, tênis, ATP, brasileiro, ranking, carreira, títulos, NextGen" />
        <meta property="og:title" content="João Fonseca — Biografia Completa | Fonseca News" />
        <meta property="og:description" content="Tudo sobre a carreira do fenômeno do tênis brasileiro. De Ipanema ao top 40 do mundo." />
        <meta property="og:type" content="profile" />
        <meta property="og:url" content="https://fonsecanews.com.br/biografia" />
        <meta property="og:image" content="https://fonsecanews.com.br/og-image.PNG" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href="https://fonsecanews.com.br/biografia" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@400;600;700;800;900&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 20px", background: "#fff", minHeight: "100vh" }}>

        {/* HEADER */}
        <header style={{ padding: "16px 0", borderBottom: "1px solid " + BORDER, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg, #0D1726, #132440)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: SERIF, fontSize: 13, fontWeight: 800 }}><span style={{ color: GREEN }}>F</span><span style={{ color: YELLOW }}>N</span></span>
            </div>
            <span style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 700, color: TEXT }}>Fonseca News</span>
          </a>
          <a href="/" style={{ fontSize: 13, color: GREEN, fontFamily: SANS, fontWeight: 600, textDecoration: "none" }}>← Voltar</a>
        </header>

        {/* HERO */}
        <section style={{ textAlign: "center", padding: "32px 0 24px" }}>
          <img
            src="https://www.atptour.com/-/media/alias/player-headshot/f0fv"
            alt="João Fonseca"
            style={{ width: 120, height: 120, borderRadius: "50%", objectFit: "cover", border: "3px solid " + GREEN, marginBottom: 16 }}
          />
          <h1 style={{ margin: "0 0 4px", fontSize: 28, fontWeight: 900, color: TEXT, fontFamily: SERIF, letterSpacing: "-0.03em" }}>João Fonseca</h1>
          <p style={{ margin: "0 0 12px", fontSize: 14, color: SUB, fontFamily: SANS }}>Tenista profissional 🇧🇷</p>
          <div style={{ display: "flex", justifyContent: "center", gap: 6, flexWrap: "wrap" }}>
            {[["🎂", "19 anos"], ["📍", "Rio de Janeiro"], ["📏", "1,88m"], ["🎾", "Destro"], ["🏆", "#" + ranking + " ATP"]].map(function(p, i) {
              return <span key={i} style={{ fontSize: 11, color: SUB, fontFamily: SANS, background: "#f5f5f5", padding: "4px 10px", borderRadius: 8 }}>{p[0]} {p[1]}</span>;
            })}
          </div>
        </section>

        {/* INTRO */}
        <section style={{ padding: "0 0 24px" }}>
          <p style={{ margin: 0, fontSize: 15, color: TEXT, fontFamily: SERIF, lineHeight: 1.8 }}>
            De um menino que jogava mini-tênis no quarto com o pai em Ipanema ao jogador que fez Sinner suar em dois tiebreaks diante de milhares de pessoas em Indian Wells. João Fonseca não é uma promessa — é uma realidade do tênis mundial aos 19 anos.
          </p>
        </section>

        {/* STATS GRID */}
        <section style={{ padding: "0 0 28px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {STATS_DYNAMIC.map(function(s, i) {
              return (
                <div key={i} style={{ background: "#f8f8f8", borderRadius: 12, padding: "14px 10px", textAlign: "center", border: "1px solid " + BORDER }}>
                  <span style={{ fontSize: 22, fontWeight: 800, color: TEXT, fontFamily: SERIF, display: "block" }}>{s.value}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: SUB, fontFamily: SANS, display: "block", marginTop: 2 }}>{s.label}</span>
                  <span style={{ fontSize: 9, color: DIM, fontFamily: SANS }}>{s.detail}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* CITAÇÃO */}
        <section style={{ padding: "0 0 28px" }}>
          <div style={{ background: "#f8f8f8", borderRadius: 14, padding: "20px", borderLeft: "3px solid " + GREEN }}>
            <p style={{ margin: "0 0 8px", fontSize: 15, fontStyle: "italic", color: TEXT, fontFamily: SERIF, lineHeight: 1.6 }}>"{CITACOES[0].text}"</p>
            <p style={{ margin: 0, fontSize: 11, color: SUB, fontFamily: SANS }}><strong>{CITACOES[0].author}</strong> · {CITACOES[0].context}</p>
          </div>
        </section>

        {/* TIMELINE */}
        <section style={{ padding: "0 0 28px" }}>
          <h2 style={{ margin: "0 0 16px", fontSize: 20, fontWeight: 800, color: TEXT, fontFamily: SERIF }}>Trajetória</h2>
          <div style={{ position: "relative", paddingLeft: 28 }}>
            <div style={{ position: "absolute", left: 8, top: 6, bottom: 6, width: 2, background: "linear-gradient(" + GREEN + ", " + YELLOW + ")", borderRadius: 2 }} />
            {TIMELINE.map(function(t, i) {
              var isLast = i === TIMELINE.length - 1;
              return (
                <div key={i} style={{ position: "relative", marginBottom: isLast ? 0 : 20 }}>
                  <div style={{ position: "absolute", left: -23, top: 5, width: 12, height: 12, borderRadius: "50%", background: isLast ? GREEN : "#fff", border: "2px solid " + GREEN, zIndex: 1 }} />
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: GREEN, fontFamily: SANS }}>{t.year}</span>
                      {t.age && <span style={{ fontSize: 10, color: DIM, fontFamily: SANS }}>{t.age}</span>}
                      {t.emoji && <span style={{ fontSize: 12 }}>{t.emoji}</span>}
                    </div>
                    <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: TEXT, fontFamily: SERIF }}>{t.title}</h3>
                    <p style={{ margin: 0, fontSize: 13, color: SUB, fontFamily: SANS, lineHeight: 1.65 }}>{t.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* CITAÇÃO 2 */}
        <section style={{ padding: "0 0 28px" }}>
          <div style={{ background: "#f8f8f8", borderRadius: 14, padding: "20px", borderLeft: "3px solid " + YELLOW }}>
            <p style={{ margin: "0 0 8px", fontSize: 15, fontStyle: "italic", color: TEXT, fontFamily: SERIF, lineHeight: 1.6 }}>"{CITACOES[1].text}"</p>
            <p style={{ margin: 0, fontSize: 11, color: SUB, fontFamily: SANS }}><strong>{CITACOES[1].author}</strong> · {CITACOES[1].context}</p>
          </div>
        </section>

        {/* FICHA TÉCNICA */}
        <section style={{ padding: "0 0 28px" }}>
          <h2 style={{ margin: "0 0 16px", fontSize: 20, fontWeight: 800, color: TEXT, fontFamily: SERIF }}>Ficha técnica</h2>
          <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid " + BORDER }}>
            {FICHA.map(function(f, i) {
              return (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: i < FICHA.length - 1 ? "1px solid " + BORDER : "none", background: i % 2 === 0 ? "#fafafa" : "#fff" }}>
                  <span style={{ fontSize: 12, color: SUB, fontFamily: SANS, fontWeight: 600 }}>{f[0]}</span>
                  <span style={{ fontSize: 12, color: TEXT, fontFamily: SANS, fontWeight: 500, textAlign: "right" }}>{f[1]}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* CURIOSIDADES */}
        <section style={{ padding: "0 0 28px" }}>
          <h2 style={{ margin: "0 0 16px", fontSize: 20, fontWeight: 800, color: TEXT, fontFamily: SERIF }}>Curiosidades</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {CURIOSIDADES.map(function(c, i) {
              return (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", fontFamily: SANS, background: GREEN, width: 20, height: 20, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>{i + 1}</span>
                  <p style={{ margin: 0, fontSize: 13, color: TEXT, fontFamily: SANS, lineHeight: 1.6 }}>{c}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA */}
        <section style={{ padding: "0 0 32px" }}>
          <div style={{ background: "linear-gradient(135deg, #0D1726 0%, #132440 100%)", borderRadius: 16, padding: "28px 24px", textAlign: "center" }}>
            <span style={{ fontSize: 32, display: "block", marginBottom: 8 }}>🇧🇷</span>
            <h3 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 800, color: "#fff", fontFamily: SERIF }}>Acompanhe o João</h3>
            <p style={{ margin: "0 0 16px", fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: SANS }}>Notícias, palpites, quiz e countdown no Fonseca News</p>
            <a href="/" style={{ display: "inline-block", background: GREEN, padding: "10px 24px", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 700, fontFamily: SANS, textDecoration: "none" }}>Ir para o site →</a>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{ padding: "20px 0", borderTop: "1px solid " + BORDER, textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 9, color: DIM, fontFamily: SANS, lineHeight: 1.6 }}>
            Fontes: ATP Tour, Wikipedia, Laver Cup, Rolex, Olympics.com, CNN Brasil, Agência Brasil, New York Times<br />
            Site independente de fãs · © 2026 Fonseca News
          </p>
        </footer>
      </div>

      <style jsx global>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #fff; -webkit-font-smoothing: antialiased; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </>
  );
}
