import { useState } from "react";
import Head from "next/head";
import { GREEN, YELLOW, TEXT, SUB, DIM, BORDER, BG_ALT, SERIF, SANS } from "../lib/constants";

var MARCAS = ["Wilson", "Babolat", "Head", "Yonex", "Prince", "Tecnifibre", "Dunlop", "Prokennex", "Outra"];
var ESTADOS = ["Novo (sem uso)", "Seminovo (poucos jogos)", "Usado — Bom estado", "Usado — Marcas de uso", "Precisa de encordoamento"];
var GRIPS = ["L0", "L1", "L2", "L3", "L4", "L5"];

function InputField(props) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: DIM, fontFamily: SANS, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {props.label} {props.required && <span style={{ color: "#E63946" }}>*</span>}
      </label>
      <input
        type={props.type || "text"}
        value={props.value}
        onChange={function(e) { props.onChange(e.target.value); }}
        placeholder={props.placeholder || ""}
        style={{ width: "100%", padding: "12px 14px", border: "1.5px solid " + BORDER, borderRadius: 10, fontSize: 14, fontFamily: SANS, color: TEXT, background: "#fff", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }}
        onFocus={function(e) { e.target.style.borderColor = GREEN; }}
        onBlur={function(e) { e.target.style.borderColor = BORDER; }}
      />
    </div>
  );
}

function ChipSelect(props) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: DIM, fontFamily: SANS, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {props.label} {props.required && <span style={{ color: "#E63946" }}>*</span>}
      </label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {props.options.map(function(opt) {
          var active = props.value === opt;
          return (
            <button key={opt} onClick={function() { props.onChange(opt); }} type="button"
              style={{ padding: props.compact ? "8px 12px" : "10px 16px", borderRadius: 10, border: "1.5px solid " + (active ? GREEN : BORDER), background: active ? GREEN + "10" : "#fff", color: active ? GREEN : TEXT, fontSize: 13, fontWeight: active ? 700 : 500, fontFamily: SANS, cursor: "pointer", transition: "all 0.15s" }}>
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function Raquetes() {
  var _marca = useState(""); var marca = _marca[0]; var setMarca = _marca[1];
  var _modelo = useState(""); var modelo = _modelo[0]; var setModelo = _modelo[1];
  var _grip = useState(""); var grip = _grip[0]; var setGrip = _grip[1];
  var _peso = useState(""); var peso = _peso[0]; var setPeso = _peso[1];
  var _estado = useState(""); var estado = _estado[0]; var setEstado = _estado[1];
  var _preco = useState(""); var preco = _preco[0]; var setPreco = _preco[1];
  var _cidade = useState(""); var cidade = _cidade[0]; var setCidade = _cidade[1];
  var _obs = useState(""); var obs = _obs[0]; var setObs = _obs[1];
  var _sent = useState(false); var sent = _sent[0]; var setSent = _sent[1];
  var _copied = useState(false); var copied = _copied[0]; var setCopied = _copied[1];

  var isValid = marca && modelo && estado && preco && cidade;

  var buildMessage = function() {
    var msg = "🎾 Raquete à venda — Fonseca News\n\n";
    msg += "📌 Marca: " + marca + "\n";
    msg += "📌 Modelo: " + modelo + "\n";
    if (grip) msg += "📌 Grip: " + grip + "\n";
    if (peso) msg += "📌 Peso: " + peso + "g\n";
    msg += "📌 Estado: " + estado + "\n";
    msg += "📌 Preço: R$ " + preco + "\n";
    msg += "📌 Cidade: " + cidade + "\n";
    if (obs) msg += "\n💬 " + obs + "\n";
    msg += "\nInteressados, me chamem! 🏷️";
    return msg;
  };

  var handleSubmit = function() {
    if (!isValid) return;
    var msg = buildMessage();
    // Copy to clipboard then open Telegram
    if (navigator.clipboard) {
      navigator.clipboard.writeText(msg).then(function() {
        setCopied(true);
        setTimeout(function() {
          window.open("https://t.me/raquetesfn", "_blank");
          setSent(true);
        }, 800);
      });
    } else {
      var ta = document.createElement("textarea");
      ta.value = msg; document.body.appendChild(ta); ta.select();
      document.execCommand("copy"); document.body.removeChild(ta);
      setCopied(true);
      setTimeout(function() {
        window.open("https://t.me/raquetesfn", "_blank");
        setSent(true);
      }, 800);
    }
  };

  var handleReset = function() {
    setMarca(""); setModelo(""); setGrip(""); setPeso("");
    setEstado(""); setPreco(""); setCidade(""); setObs("");
    setSent(false); setCopied(false);
  };

  return (
    <>
      <Head>
        <title>Venda sua Raquete | Fonseca News</title>
        <meta name="description" content="Anuncie sua raquete de tênis usada gratuitamente na comunidade Fonseca News. Compra e venda entre fãs de tênis." />
        <meta property="og:title" content="Venda sua Raquete | Fonseca News" />
        <meta property="og:description" content="Anuncie grátis na comunidade de tênis do Fonseca News." />
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
          <section style={{ padding: "28px 0 24px", textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: "linear-gradient(135deg, #1a1a0a 0%, #2d2811 100%)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}>
              <span style={{ fontSize: 28 }}>🎾</span>
            </div>
            <h1 style={{ margin: "0 0 8px", fontSize: 26, fontWeight: 800, fontFamily: SERIF, color: TEXT, letterSpacing: "-0.03em" }}>Venda sua raquete</h1>
            <p style={{ margin: "0 0 4px", fontSize: 14, color: SUB, fontFamily: SANS }}>Anuncie grátis na comunidade do Fonseca News</p>
            <p style={{ margin: 0, fontSize: 12, color: DIM, fontFamily: SANS }}>Seu anúncio vai direto pro grupo no Telegram</p>
          </section>

          {/* How it works */}
          <section style={{ display: "flex", gap: 8, marginBottom: 28, justifyContent: "center" }}>
            {[["1", "Preencha", "os dados da raquete"], ["2", "Copie", "o anúncio formatado"], ["3", "Cole", "no grupo do Telegram"]].map(function(step) {
              return (
                <div key={step[0]} style={{ flex: 1, textAlign: "center", padding: "12px 8px", background: BG_ALT, borderRadius: 12 }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: GREEN, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, margin: "0 auto 6px", fontFamily: SANS }}>{step[0]}</div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: TEXT, fontFamily: SANS, display: "block" }}>{step[1]}</span>
                  <span style={{ fontSize: 10, color: DIM, fontFamily: SANS }}>{step[2]}</span>
                </div>
              );
            })}
          </section>

          {!sent ? (
            <>
              {/* Form */}
              <section style={{ marginBottom: 24 }}>
                <ChipSelect label="Marca" options={MARCAS} value={marca} onChange={setMarca} required />
                <InputField label="Modelo" value={modelo} onChange={setModelo} placeholder="Ex: Pro Staff 97, Pure Aero..." required />
                <ChipSelect label="Grip" options={GRIPS} value={grip} onChange={setGrip} compact />
                <InputField label="Peso" value={peso} onChange={setPeso} placeholder="Ex: 305" type="number" />
                <ChipSelect label="Estado" options={ESTADOS} value={estado} onChange={setEstado} required />
                <InputField label="Preço (R$)" value={preco} onChange={setPreco} placeholder="Ex: 450" type="number" required />
                <InputField label="Cidade/Estado" value={cidade} onChange={setCidade} placeholder="Ex: São Paulo/SP" required />

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: DIM, fontFamily: SANS, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Observações</label>
                  <textarea
                    value={obs} onChange={function(e) { setObs(e.target.value); }}
                    placeholder="Ex: Com capa e overgrip novo, cordas recém trocadas..."
                    rows="3"
                    style={{ width: "100%", padding: "12px 14px", border: "1.5px solid " + BORDER, borderRadius: 10, fontSize: 14, fontFamily: SANS, color: TEXT, background: "#fff", outline: "none", resize: "vertical", boxSizing: "border-box" }}
                    onFocus={function(e) { e.target.style.borderColor = GREEN; }}
                    onBlur={function(e) { e.target.style.borderColor = BORDER; }}
                  />
                </div>
              </section>

              {/* Preview */}
              {isValid && (
                <section style={{ marginBottom: 24 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: DIM, fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Prévia do anúncio</p>
                  <div style={{ background: "linear-gradient(135deg, #0D1726, #132440)", borderRadius: 14, padding: "16px 18px" }}>
                    <pre style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.8)", fontFamily: SANS, lineHeight: 1.7, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{buildMessage()}</pre>
                  </div>
                </section>
              )}

              {/* Submit */}
              <button onClick={handleSubmit} disabled={!isValid}
                style={{ width: "100%", padding: "16px", background: isValid ? GREEN : DIM, color: "#fff", border: "none", borderRadius: 14, fontSize: 15, fontWeight: 700, fontFamily: SANS, cursor: isValid ? "pointer" : "default", transition: "background 0.2s", opacity: isValid ? 1 : 0.5, marginBottom: 12 }}>
                {copied ? "✓ Copiado! Abrindo Telegram..." : "Copiar anúncio e abrir Telegram"}
              </button>

              <p style={{ fontSize: 10, color: DIM, fontFamily: SANS, textAlign: "center", lineHeight: 1.5 }}>
                O anúncio será copiado automaticamente. Basta colar no grupo do Telegram.
              </p>
            </>
          ) : (
            /* Success state */
            <section style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: GREEN + "12", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
              <h2 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 800, fontFamily: SERIF, color: TEXT }}>Anúncio pronto!</h2>
              <p style={{ margin: "0 0 24px", fontSize: 14, color: SUB, fontFamily: SANS }}>Seu anúncio foi copiado. Cole no grupo do Telegram para publicar.</p>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <a href="https://t.me/raquetesfn" target="_blank" rel="noopener noreferrer"
                  style={{ display: "block", padding: "14px", background: "#0088cc", color: "#fff", borderRadius: 12, fontSize: 14, fontWeight: 700, fontFamily: SANS, textDecoration: "none", textAlign: "center" }}>
                  Abrir grupo no Telegram
                </a>
                <button onClick={handleReset}
                  style={{ padding: "14px", background: BG_ALT, color: TEXT, border: "1px solid " + BORDER, borderRadius: 12, fontSize: 14, fontWeight: 600, fontFamily: SANS, cursor: "pointer", textAlign: "center" }}>
                  Criar outro anúncio
                </button>
                <a href="/" style={{ fontSize: 13, color: GREEN, fontFamily: SANS, textDecoration: "none", textAlign: "center", padding: "8px 0" }}>← Voltar pro Fonseca News</a>
              </div>
            </section>
          )}

          {/* Info cards */}
          <section style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px", background: BG_ALT, borderRadius: 12 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="8"/></svg>
              <div>
                <span style={{ fontSize: 13, fontWeight: 700, color: TEXT, fontFamily: SANS }}>100% gratuito</span>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: SUB, fontFamily: SANS }}>Não cobramos nada pelo anúncio. É um serviço da comunidade FN.</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px", background: BG_ALT, borderRadius: 12 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={YELLOW} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              <div>
                <span style={{ fontSize: 13, fontWeight: 700, color: TEXT, fontFamily: SANS }}>Comunidade ativa</span>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: SUB, fontFamily: SANS }}>Fãs de tênis brasileiros comprando e vendendo equipamentos.</p>
              </div>
            </div>
          </section>

          {/* Disclaimer */}
          <footer style={{ padding: "24px 0", textAlign: "center" }}>
            <p style={{ fontSize: 9, color: DIM, fontFamily: SANS, lineHeight: 1.6 }}>O Fonseca News não se responsabiliza pelas transações entre compradores e vendedores. Negocie diretamente com o interessado.</p>
            <p style={{ fontSize: 9, color: DIM, fontFamily: SANS, marginTop: 4 }}>© 2026 Fonseca News · fonsecanews.com.br</p>
          </footer>
        </main>
      </div>
    </>
  );
}
