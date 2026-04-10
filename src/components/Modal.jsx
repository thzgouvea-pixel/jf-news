import { TEXT, SUB, DIM, SANS, SERIF } from '../lib/constants';

export default function Modal(p) {
  return (
    <div onClick={p.onClose} style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, animation: "fadeInO 0.3s ease", overflowY: "auto" }}>
      <div onClick={function(e) { e.stopPropagation(); }} style={{ background: "#fff", borderRadius: 20, padding: "24px 20px", maxWidth: p.maxWidth || 440, width: "100%", maxHeight: "88vh", overflowY: "auto", animation: "slideU 0.4s ease" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: TEXT, fontFamily: SERIF }}>{p.title}</h2>
          <button onClick={p.onClose} style={{ background: "none", border: "none", color: DIM, fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>
        {p.subtitle && <p style={{ margin: "-10px 0 12px", fontSize: 13, color: SUB, fontFamily: SANS }}>{p.subtitle}</p>}
        {p.children}
      </div>
    </div>
  );
}
