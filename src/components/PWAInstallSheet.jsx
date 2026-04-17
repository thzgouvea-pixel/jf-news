import { SERIF, SANS, GREEN, YELLOW } from '../lib/constants';
import { detectDevice } from '../lib/utils';

export default function PWAInstallSheet(props) {
  var onClose = props.onClose;
  var onInstall = props.onInstall;
  var deferredPrompt = props.deferredPrompt;

  var device = detectDevice();
  var isIOS = device === "ios";
  var canInstallNative = !!deferredPrompt && !isIOS;

  var dismiss = function() {
    try { localStorage.setItem("fn_autoinstall_dismissed", String(Date.now())); } catch(e){}
    onClose();
  };

  var handleNativeInstall = function() {
    if (onInstall) onInstall();
    dismiss();
  };

  var steps = isIOS ? [
    { num: "1", icon: "↑", title: "Compartilhar", desc: "Toque no ícone de compartilhar na barra do Safari" },
    { num: "2", icon: "+", title: "Adicionar à Tela", desc: "Role e toque em \"Adicionar à Tela de Início\"" },
    { num: "3", icon: "✓", title: "Confirmar", desc: "Toque em \"Adicionar\" no canto superior" },
  ] : canInstallNative ? [
    { num: "1", icon: "↓", title: "Instalar", desc: "Toque no botão abaixo para instalar direto" },
  ] : [
    { num: "1", icon: "⋮", title: "Menu", desc: "Toque nos 3 pontinhos no canto superior direito" },
    { num: "2", icon: "+", title: "Adicionar à Tela", desc: "Selecione \"Adicionar à tela inicial\"" },
    { num: "3", icon: "✓", title: "Confirmar", desc: "Toque em \"Adicionar\" para finalizar" },
  ];

  return (
    <div onClick={dismiss} style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.7)",
      backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      animation: "fadeInO 0.3s ease",
    }}>
      <div onClick={function(e){ e.stopPropagation(); }} style={{
        width: "100%", maxWidth: 400,
        background: "linear-gradient(180deg, #0D1726 0%, #0a1220 100%)",
        borderRadius: "28px 28px 0 0",
        padding: "0 0 env(safe-area-inset-bottom, 20px) 0",
        animation: "slideUpSheet 0.4s cubic-bezier(0.16,1,0.3,1)",
        position: "relative", overflow: "hidden",
      }}>
        {/* Glow accent */}
        <div style={{
          position: "absolute", top: -60, left: "50%", transform: "translateX(-50%)",
          width: 200, height: 120,
          background: "radial-gradient(ellipse, rgba(0,168,89,0.15) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "14px 0 0" }}>
          <div style={{ width: 40, height: 4, borderRadius: 4, background: "rgba(255,255,255,0.12)" }} />
        </div>

        {/* Close */}
        <button onClick={dismiss} style={{
          position: "absolute", top: 16, right: 16, zIndex: 2,
          background: "rgba(255,255,255,0.06)", border: "none", borderRadius: "50%",
          width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>

        {/* Header */}
        <div style={{ textAlign: "center", padding: "24px 24px 20px" }}>
          {/* FN Logo */}
          <div style={{
            width: 64, height: 64, borderRadius: 18, margin: "0 auto 16px",
            background: "linear-gradient(135deg, #0D1726, #1a2d4a)",
            border: "2px solid rgba(255,255,255,0.08)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
          }}>
            <span style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1 }}>
              <span style={{ color: GREEN }}>F</span><span style={{ color: YELLOW }}>N</span>
            </span>
          </div>

          <h3 style={{
            margin: "0 0 4px", fontSize: 20, fontWeight: 800, color: "#fff",
            fontFamily: SERIF, letterSpacing: "-0.02em",
          }}>
            Fonseca News no seu celular
          </h3>
          <p style={{
            margin: 0, fontSize: 13, color: "rgba(255,255,255,0.4)",
            fontFamily: SANS, lineHeight: 1.4,
          }}>
            Acompanhe o João com um toque
          </p>
        </div>

        {/* Benefits */}
        <div style={{ display: "flex", justifyContent: "center", gap: 6, padding: "0 24px 20px" }}>
          {[
            { emoji: "⚡", label: "Placar ao vivo" },
            { emoji: "🔔", label: "Notificações" },
            { emoji: "📱", label: "Acesso rápido" },
          ].map(function(b) {
            return (
              <div key={b.label} style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 12, padding: "8px 12px",
                textAlign: "center", flex: 1,
              }}>
                <span style={{ fontSize: 16, display: "block", marginBottom: 3 }}>{b.emoji}</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.5)", fontFamily: SANS }}>{b.label}</span>
              </div>
            );
          })}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "0 24px" }} />

        {/* Steps */}
        <div style={{ padding: "20px 24px" }}>
          <p style={{
            margin: "0 0 16px", fontSize: 10, fontWeight: 700,
            color: "rgba(255,255,255,0.3)", fontFamily: SANS,
            textTransform: "uppercase", letterSpacing: "0.1em",
          }}>
            {isIOS ? "Como instalar no iPhone" : (canInstallNative ? "Instalação rápida" : "Como instalar")}
          </p>

          {steps.map(function(step, i) {
            var isLast = i === steps.length - 1;
            return (
              <div key={step.num} style={{
                display: "flex", alignItems: "flex-start", gap: 14,
                marginBottom: isLast ? 0 : 16,
                position: "relative",
              }}>
                {/* Step connector line */}
                {!isLast && steps.length > 1 && (
                  <div style={{
                    position: "absolute", left: 19, top: 40, bottom: -8,
                    width: 1, background: "rgba(255,255,255,0.06)",
                  }} />
                )}
                {/* Step number circle */}
                <div style={{
                  width: 38, height: 38, borderRadius: 12, flexShrink: 0,
                  background: isLast ? "rgba(0,168,89,0.12)" : "rgba(255,255,255,0.04)",
                  border: "1px solid " + (isLast ? "rgba(0,168,89,0.2)" : "rgba(255,255,255,0.06)"),
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, color: isLast ? GREEN : "rgba(255,255,255,0.5)",
                  fontWeight: 700, fontFamily: SANS,
                }}>
                  {step.icon}
                </div>
                {/* Step text */}
                <div style={{ flex: 1, paddingTop: 2 }}>
                  <span style={{
                    fontSize: 14, fontWeight: 700, color: "#fff",
                    fontFamily: SANS, display: "block", lineHeight: 1.2, marginBottom: 3,
                  }}>
                    {step.title}
                  </span>
                  <span style={{
                    fontSize: 12, color: "rgba(255,255,255,0.45)",
                    fontFamily: SANS, lineHeight: 1.5, display: "block",
                  }}>
                    {step.desc}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action button */}
        <div style={{ padding: "8px 24px 24px" }}>
          {canInstallNative ? (
            <button onClick={handleNativeInstall} style={{
              width: "100%", padding: "15px 0", borderRadius: 14, border: "none",
              background: "linear-gradient(135deg, " + GREEN + " 0%, #0D7C48 100%)",
              color: "#fff", fontSize: 15, fontWeight: 700, fontFamily: SANS,
              cursor: "pointer", boxShadow: "0 4px 20px rgba(0,168,89,0.3)",
              letterSpacing: "-0.01em",
            }}>
              Instalar agora
            </button>
          ) : (
            <button onClick={dismiss} style={{
              width: "100%", padding: "15px 0", borderRadius: 14, border: "none",
              background: "linear-gradient(135deg, " + GREEN + " 0%, #0D7C48 100%)",
              color: "#fff", fontSize: 15, fontWeight: 700, fontFamily: SANS,
              cursor: "pointer", boxShadow: "0 4px 20px rgba(0,168,89,0.3)",
              letterSpacing: "-0.01em",
            }}>
              Entendi!
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
