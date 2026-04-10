import { TEXT, SUB, BG_ALT, BORDER, SANS } from '../lib/constants';

export default function InstallBanner() {
  var isStandalone = typeof window !== "undefined" && (window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone);
  if (isStandalone) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: BG_ALT, borderRadius: 12, border: "1px solid " + BORDER }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: "#0D1726", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12" y2="18"/></svg>
      </div>
      <div>
        <span style={{ fontSize: 13, fontWeight: 700, color: TEXT, fontFamily: SANS, display: "block" }}>Tenha o FN no celular</span>
        <span style={{ fontSize: 11, color: SUB, fontFamily: SANS }}>Adicione à tela inicial — sem baixar nada</span>
      </div>
    </div>
  );
}
