import { useState } from "react";
import Head from "next/head";

var GREEN = "#00A859";
var YELLOW = "#FFCB05";
var BG = "#FFFFFF";
var BORDER = "#E8E8E8";
var TEXT = "#1A1A2E";
var TEXT_DIM = "#999";

var MARCAS = ["Wilson", "Babolat", "Head", "Yonex", "Prince", "Tecnifibre", "Dunlop", "Prokennex", "Outra"];
var ESTADOS = ["Novo (sem uso)", "Seminovo (poucos jogos)", "Usado — Bom estado", "Usado — Marcas de uso", "Precisa de encordoamento"];
var GRIPS = ["L0", "L1", "L2", "L3", "L4", "L5"];

var SelectField = function(props) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: TEXT_DIM, fontFamily: "'Inter', sans-serif", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>{props.label} {props.required && <span style={{ color: "#E63946" }}>*</span>}</label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {props.options.map(function(opt) {
          var active = props.value === opt;
          return (
            <button key={opt} onClick={function() { props.onChange(opt); }} style={{ padding: "8px 14px", borderRadius: 8, border: "1.5px solid " + (active ? GREEN : BORDER), background: active ? GREEN + "10" : "#fff", color: active ? GREEN : TEXT, fontSize: 12.5, fontWeight: active ? 700 : 500, cursor: "pointer", fontFamily: "'Inter', sans-serif", transition: "all 0.15s" }}>{opt}</button>
          );
        })}
      </div>
    </div>
  );
};

var InputField = function(props) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: TEXT_DIM, fontFamily: "'Inter', sans-serif", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>{props.label} {props.required && <span style={{ color: "#E63946" }}>*</span>}</label>
      <input type={props.type || "text"} value={props.value} onChange={function(e) { props.onChange(e.target.value); }} placeholder={props.placeholder} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid " + BORDER, fontSize: 14, fontFamily: "'Inter', sans-serif", color: TEXT, outline: "none", boxSizing: "border-box", transition: "border 0.2s" }} />
    </div>
  );
};

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

  var isValid = marca && modelo && estado && preco && cidade;

  var handleSubmit = function() {
    if (!isValid) return;
    var msg = "🎾 *Raquete à venda — Fonseca News*\n\n";
    msg += "📌 Marca: " + marca + "\n";
    msg += "📌 Modelo: " + modelo + "\n";
    if (grip) msg += "📌 Grip: " + grip + "\n";
    if (peso) msg += "📌 Peso: " + peso + "g\n";
    msg += "📌 Estado: " + estado + "\n";
    msg += "📌 Preço: R$ " + preco + "\n";
    msg += "📌 Cidade: " + cidade + "\n";
    if (obs) msg += "\n💬 " + obs + "\n";
    msg += "\nInteressados, me chamem! 🏷️";

    var encoded = encodeURIComponent(msg);
    window.open("https://t.me/raquetesfn?text=" + encoded, "_blank");
    setSent(true);
  };

  return (
    <>
      <Head>
        <title>Venda sua Raquete · Fonseca News</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Anuncie sua raquete de tênis usada na comunidade Fonseca News" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Source+Serif+4:ital,wght@0,400;0,700;0,800;1,400&display=swap" rel="stylesheet" />
      </Head>
      <div style={{ minHeight: "100vh", background: "#F5F5F5" }}>
        {/* Header */}
        <div style={{ background: "linear-gradient(135deg, #0a1628 0%, #1a2a4a 100%)", padding: "20px 24px", textAlign: "center" }}>
          <a href="/" style={{ textDecoration: "none" }}>
            <span style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Inter', sans-serif" }}>
              <span style={{ color: GREEN }}>F</span><span style={{ color: YELLOW }}>N</span>
            </span>
          </a>
          <h1 style={{ margin: "10px 0 4px", fontSize: 20, fontWeight: 800, color: "#fff", fontFamily: "'Source Serif 4', Georgia, serif" }}>Venda sua Raquete</h1>
          <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: "'Inter', sans-serif" }}>Preencha os dados e anuncie no nosso grupo do Telegram</p>
        </div>

        {/* Form */}
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px 20px 40px" }}>
          {!sent ? (
            <div style={{ background: "#fff", borderRadius: 16, padding: "24px 20px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid " + BORDER }}>

              <SelectField label="Marca" options={MARCAS} value={marca} onChange={setMarca} required />
              <InputField label="Modelo" value={modelo} onChange={setModelo} placeholder="Ex: Pro Staff 97, Pure Aero..." required />
              <SelectField label="Tamanho do grip" options={GRIPS} value={grip} onChange={setGrip} />
              <InputField label="Peso (gramas)" value={peso} onChange={setPeso} placeholder="Ex: 305" type="number" />
              <SelectField label="Estado" options={ESTADOS} value={estado} onChange={setEstado} required />
              <InputField label="Preço (R$)" value={preco} onChange={setPreco} placeholder="Ex: 450" type="number" required />
              <InputField label="Cidade / Estado" value={cidade} onChange={setCidade} placeholder="Ex: São Paulo/SP" required />
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: TEXT_DIM, fontFamily: "'Inter', sans-serif", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Observações</label>
                <textarea value={obs} onChange={function(e) { setObs(e.target.value); }} placeholder="Encordoamento, acessórios inclusos, motivo da venda..." rows={3} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid " + BORDER, fontSize: 14, fontFamily: "'Inter', sans-serif", color: TEXT, outline: "none", boxSizing: "border-box", resize: "vertical" }} />
              </div>

              {/* Preview */}
              {isValid && (
                <div style={{ background: "#F8FAF5", borderRadius: 12, padding: "14px 16px", marginBottom: 20, borderLeft: "3px solid " + GREEN }}>
                  <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 700, color: GREEN, fontFamily: "'Inter', sans-serif", textTransform: "uppercase", letterSpacing: "0.05em" }}>Prévia do anúncio</p>
                  <p style={{ margin: 0, fontSize: 12, color: TEXT, fontFamily: "'Inter', sans-serif", lineHeight: 1.6, whiteSpace: "pre-line" }}>
                    {"🎾 Raquete à venda\n📌 " + marca + " " + modelo + (grip ? "\n📌 Grip: " + grip : "") + (peso ? "\n📌 Peso: " + peso + "g" : "") + "\n📌 " + estado + "\n📌 R$ " + preco + "\n📌 " + cidade + (obs ? "\n💬 " + obs : "")}
                  </p>
                </div>
              )}

              <button onClick={handleSubmit} disabled={!isValid} style={{ width: "100%", padding: "14px", background: isValid ? GREEN : "#ccc", color: "#fff", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: isValid ? "pointer" : "default", fontFamily: "'Inter', sans-serif", transition: "all 0.2s", boxShadow: isValid ? "0 4px 12px rgba(0,168,89,0.25)" : "none" }}>
                Anunciar no Telegram
              </button>

              <p style={{ margin: "12px 0 0", fontSize: 10, color: TEXT_DIM, fontFamily: "'Inter', sans-serif", textAlign: "center" }}>Você será redirecionado para o grupo no Telegram</p>
            </div>
          ) : (
            <div style={{ background: "#fff", borderRadius: 16, padding: "40px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid " + BORDER, textAlign: "center" }}>
              <span style={{ fontSize: 48 }}>🎾</span>
              <h2 style={{ margin: "12px 0 8px", fontSize: 20, fontWeight: 800, color: TEXT, fontFamily: "'Source Serif 4', Georgia, serif" }}>Anúncio criado!</h2>
              <p style={{ margin: "0 0 20px", fontSize: 14, color: TEXT_DIM, fontFamily: "'Inter', sans-serif" }}>Cole a mensagem no grupo do Telegram para publicar.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <a href="https://t.me/raquetesfn" target="_blank" rel="noopener noreferrer" style={{ padding: "12px", background: "#0088cc", color: "#fff", borderRadius: 10, fontSize: 14, fontWeight: 700, fontFamily: "'Inter', sans-serif", textDecoration: "none", textAlign: "center" }}>Abrir grupo no Telegram</a>
                <button onClick={function() { setSent(false); setMarca(""); setModelo(""); setGrip(""); setPeso(""); setEstado(""); setPreco(""); setCidade(""); setObs(""); }} style={{ padding: "12px", background: "#F8F9FA", color: TEXT, border: "1px solid " + BORDER, borderRadius: 10, fontSize: 14, fontWeight: 600, fontFamily: "'Inter', sans-serif", cursor: "pointer" }}>Criar outro anúncio</button>
                <a href="/" style={{ padding: "12px", color: GREEN, fontSize: 13, fontWeight: 600, fontFamily: "'Inter', sans-serif", textDecoration: "none" }}>← Voltar ao Fonseca News</a>
              </div>
            </div>
          )}

          {/* Info */}
          <div style={{ marginTop: 24, textAlign: "center" }}>
            <p style={{ margin: "0 0 8px", fontSize: 11, color: TEXT_DIM, fontFamily: "'Inter', sans-serif" }}>O Fonseca News não se responsabiliza pelas transações realizadas entre os usuários.</p>
            <a href="/" style={{ fontSize: 12, color: GREEN, fontFamily: "'Inter', sans-serif", fontWeight: 600, textDecoration: "none" }}>← Voltar ao Fonseca News</a>
          </div>
        </div>
      </div>
    </>
  );
}
