// src/pages/api/og.jsx
// Dynamic Open Graph image generation
// Preview: fonsecanews.com.br/api/og
import { ImageResponse } from "@vercel/og";
export const config = { runtime: "edge" };
export default async function handler(req) {
  var url = new URL(req.url);
  var title = url.searchParams.get("title") || "Fonseca News";
  var subtitle = url.searchParams.get("subtitle") || "Tudo sobre João Fonseca";
  var ranking = url.searchParams.get("ranking") || "#40";
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(145deg, #0D1726 0%, #132440 50%, #0a1628 100%)",
          padding: "60px",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", width: "100%", height: "6px", position: "absolute", top: 0, left: 0 }}>
          <div style={{ width: "50%", height: "6px", background: "#00A859" }} />
          <div style={{ width: "50%", height: "6px", background: "#FFCB05" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "18px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "28px",
                fontWeight: 800,
              }}
            >
              <span style={{ color: "#00A859" }}>F</span>
              <span style={{ color: "#FFCB05" }}>N</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ color: "#fff", fontSize: "32px", fontWeight: 800 }}>Fonseca News</span>
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "16px", fontFamily: "sans-serif" }}>Site independente de fãs</span>
            </div>
          </div>
          <div style={{ fontSize: "56px", fontWeight: 800, color: "#fff", lineHeight: 1.15, maxWidth: "900px", letterSpacing: "-0.03em" }}>
            {title}
          </div>
          <div style={{ fontSize: "24px", color: "rgba(255,255,255,0.5)", marginTop: "16px", fontFamily: "sans-serif" }}>
            {subtitle}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "16px", color: "rgba(255,255,255,0.3)", fontFamily: "sans-serif" }}>fonsecanews.com.br</span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(0,168,89,0.12)",
              border: "1px solid rgba(0,168,89,0.25)",
              borderRadius: "999px",
              padding: "8px 20px",
            }}
          >
            <span style={{ fontSize: "14px" }}>🇧🇷</span>
            <span style={{ color: "#00A859", fontSize: "18px", fontWeight: 700, fontFamily: "sans-serif" }}>João Fonseca {ranking} ATP</span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
