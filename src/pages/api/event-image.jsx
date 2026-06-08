// /api/event-image — imagem dinamica por evento pra anexar nos tweets do X.
// Params: ?label=RANKING ATP&head=#25&sub=...&accent=00A859&emoji=📈
// Edge runtime (@vercel/og). 1200x675 (16:9 — formato que o X mostra inteiro).
import { ImageResponse } from "@vercel/og";
export const config = { runtime: "edge" };

function clean(v, max) {
  if (!v) return "";
  return String(v).substring(0, max || 80).replace(/[<>]/g, "");
}

export default async function handler(req) {
  var url = new URL(req.url);
  var label = clean(url.searchParams.get("label"), 40) || "FONSECA NEWS";
  var head = clean(url.searchParams.get("head"), 28) || "João Fonseca";
  var sub = clean(url.searchParams.get("sub"), 130) || "";
  var emoji = clean(url.searchParams.get("emoji"), 6) || "🎾";
  var accentRaw = clean(url.searchParams.get("accent"), 6) || "00A859";
  var accent = "#" + accentRaw.replace(/[^0-9a-fA-F]/g, "").substring(0, 6);
  if (accent.length !== 7) accent = "#00A859";

  // tamanho do head: encolhe se for texto longo (ex: "VITÓRIA" vs "#25")
  var headSize = head.length <= 5 ? 200 : (head.length <= 12 ? 130 : (head.length <= 20 ? 90 : 64));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(145deg, #0D1726 0%, #132440 55%, #0a1628 100%)",
          padding: "64px", fontFamily: "Georgia, serif", position: "relative",
        }}
      >
        {/* faixa verde-amarela no topo */}
        <div style={{ display: "flex", width: "100%", height: "8px", position: "absolute", top: 0, left: 0 }}>
          <div style={{ width: "50%", height: "8px", background: "#00A859" }} />
          <div style={{ width: "50%", height: "8px", background: "#FFCB05" }} />
        </div>

        {/* topo: logo FN + nome */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{
            width: "60px", height: "60px", borderRadius: "16px", background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "26px", fontWeight: 800,
          }}>
            <span style={{ color: "#00A859" }}>F</span>
            <span style={{ color: "#FFCB05" }}>N</span>
          </div>
          <span style={{ color: "#fff", fontSize: "30px", fontWeight: 800 }}>Fonseca News</span>
        </div>

        {/* centro: label + head + sub */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "8px" }}>
            <span style={{ fontSize: "34px" }}>{emoji}</span>
            <span style={{ color: accent, fontSize: "30px", fontWeight: 700, letterSpacing: "2px", fontFamily: "sans-serif", textTransform: "uppercase" }}>{label}</span>
          </div>
          <div style={{ display: "flex", fontSize: headSize + "px", fontWeight: 800, color: "#fff", lineHeight: 1.05, letterSpacing: "-0.03em" }}>{head}</div>
          {sub ? <div style={{ display: "flex", fontSize: "32px", color: "rgba(255,255,255,0.72)", marginTop: "18px", maxWidth: "1040px", fontFamily: "sans-serif", lineHeight: 1.25 }}>{sub}</div> : null}
        </div>

        {/* base: site + handle */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "26px", color: accent, fontWeight: 700, fontFamily: "sans-serif" }}>fonsecanews.com.br</span>
          <span style={{ fontSize: "22px", color: "rgba(255,255,255,0.4)", fontFamily: "sans-serif" }}>@JFonsecaNews 🇧🇷</span>
        </div>
      </div>
    ),
    { width: 1200, height: 675 }
  );
}
