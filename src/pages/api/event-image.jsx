// /api/event-image — imagem dinamica por evento pra anexar nos tweets do X.
// Design aprovado: tipografia Anton, barra de acento, badge, sem sobreposicao.
// Params: ?label=Ranking ATP&head=#25&sub=...&badge=▲ 5&accent=00A859
// Edge runtime (@vercel/og). 1200x675 (16:9). Fontes servidas pelo proprio site.
import { ImageResponse } from "@vercel/og";
export const config = { runtime: "edge" };

function clean(v, max) {
  if (!v) return "";
  return String(v).substring(0, max || 80).replace(/[<>]/g, "");
}

export default async function handler(req) {
  var url = new URL(req.url);
  var origin = url.origin;
  var label = clean(url.searchParams.get("label"), 42) || "FONSECA NEWS";
  var head = clean(url.searchParams.get("head"), 26) || "João Fonseca";
  var sub = clean(url.searchParams.get("sub"), 140) || "";
  var badge = clean(url.searchParams.get("badge"), 10);
  var accentRaw = clean(url.searchParams.get("accent"), 6) || "00A859";
  var accent = "#" + accentRaw.replace(/[^0-9a-fA-F]/g, "").substring(0, 6);
  if (accent.length !== 7) accent = "#00A859";

  // tamanho do head conforme o comprimento (evita estourar a largura)
  var L = head.length;
  var headSize = L <= 4 ? 232 : (L <= 7 ? 188 : (L <= 11 ? 142 : (L <= 16 ? 112 : (L <= 22 ? 88 : 66))));

  // carrega as fontes do proprio site (mesma origem) em paralelo
  async function font(file) {
    var r = await fetch(origin + "/fonts/" + file);
    return await r.arrayBuffer();
  }
  var fonts = await Promise.all([font("anton.ttf"), font("sans-bold.ttf"), font("sans.ttf"), font("archivo-black.ttf")]);

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#0A0F18", fontFamily: "Sans" }}>
        {/* barra de acento vertical esquerda */}
        <div style={{ position: "absolute", top: 0, left: 0, width: 14, height: 675, display: "flex", background: accent }} />
        {/* detalhe geometrico no canto (nao-texto) */}
        <div style={{ position: "absolute", top: 56, right: 64, width: 120, height: 120, display: "flex", border: "3px solid rgba(255,255,255,0.08)", borderRadius: 16, transform: "rotate(12deg)" }} />
        <div style={{ position: "absolute", top: 92, right: 100, width: 120, height: 120, display: "flex", border: "3px solid " + accent + "33", borderRadius: 16, transform: "rotate(12deg)" }} />

        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "60px 64px 54px 84px", width: 1200, height: 675 }}>
          {/* TOPO: marca */}
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", width: 18, height: 40, marginRight: 16 }}>
              <div style={{ display: "flex", width: 18, height: 20, background: "#00A859" }} />
              <div style={{ display: "flex", width: 18, height: 20, background: "#FFCB05" }} />
            </div>
            <div style={{ display: "flex", fontFamily: "SansB", fontSize: 24, letterSpacing: 6, color: "#fff" }}>FONSECA NEWS</div>
          </div>

          {/* CENTRO */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", width: 56, height: 6, background: accent, marginBottom: 18 }} />
            <div style={{ display: "flex", fontFamily: "SansB", fontSize: 28, letterSpacing: 5, color: accent, marginBottom: 26 }}>{label.toUpperCase()}</div>
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ display: "flex", fontFamily: "Anton", fontSize: headSize, color: "#fff", lineHeight: 0.92, letterSpacing: -2 }}>{head}</div>
              {badge ? <div style={{ display: "flex", alignItems: "center", background: "#FFCB05", color: "#0A0F18", fontFamily: "Archivo", fontSize: 40, padding: "8px 22px", borderRadius: 12, marginLeft: 26 }}>{badge}</div> : null}
            </div>
            {sub ? <div style={{ display: "flex", fontFamily: "Sans", fontSize: 35, color: "rgba(255,255,255,0.72)", marginTop: 30, maxWidth: 1000, lineHeight: 1.25 }}>{sub}</div> : null}
          </div>

          {/* BASE */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", width: "100%", height: 2, background: "rgba(255,255,255,0.1)", marginBottom: 16 }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", fontFamily: "SansB", fontSize: 26, color: accent }}>fonsecanews.com.br</div>
              <div style={{ display: "flex", fontFamily: "Sans", fontSize: 24, color: "rgba(255,255,255,0.45)" }}>@JFonsecaNews</div>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200, height: 675,
      fonts: [
        { name: "Anton", data: fonts[0], weight: 400, style: "normal" },
        { name: "SansB", data: fonts[1], weight: 700, style: "normal" },
        { name: "Sans", data: fonts[2], weight: 400, style: "normal" },
        { name: "Archivo", data: fonts[3], weight: 900, style: "normal" },
      ],
    }
  );
}
