import React from "react";

const GREEN = "#00A859";
const YELLOW = "#FFCB05";
const TEXT = "#1a1a1a";
const SUB = "#6b6b6b";
const DIM = "#a0a0a0";
const SERIF = "'Source Serif 4', Georgia, serif";
const SANS = "'Inter', -apple-system, sans-serif";

const surfaceColorMap = {
  Saibro: "#E8734A",
  Clay: "#E8734A",
  Hard: "#3B82F6",
  Duro: "#3B82F6",
  Grama: "#22C55E",
  Grass: "#22C55E",
};

function InfoChip({ label, value, icon }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 12,
        padding: "10px 12px",
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: "rgba(79,195,247,0.10)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.28)", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.86)", fontFamily: SANS, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</div>
      </div>
    </div>
  );
}

export default function DuelHeroCardV2({
  statusLabel = "PRÓXIMO DUELO",
  tournamentName,
  tournamentCategory,
  round,
  surface,
  dateLabel,
  timeLabel,
  courtLabel,
  broadcastLabel,
  countdownLabel,
  joao = {},
  opponent = {},
  probability = null,
  factLabel,
}) {
  const surfaceColor = surfaceColorMap[surface] || "#999";
  const fPct = probability?.fonseca ?? null;
  const oPct = probability?.opponent ?? null;

  return (
    <section
      style={{
        background: "linear-gradient(160deg, #0a1220 0%, #111d33 42%, #0d1828 100%)",
        borderRadius: 22,
        overflow: "hidden",
        position: "relative",
        boxShadow: "0 18px 40px rgba(8,12,20,0.18)",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -52,
          right: -52,
          width: 180,
          height: 180,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${surfaceColor}18 0%, transparent 68%)`,
          pointerEvents: "none",
        }}
      />

      <div style={{ padding: "18px 18px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: "#4FC3F7", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.08em" }}>{statusLabel}</span>
            {round ? <span style={{ fontSize: 10, color: "rgba(255,255,255,0.36)", fontFamily: SANS }}>{round}</span> : null}
            {tournamentCategory ? <span style={{ fontSize: 10, color: "rgba(255,255,255,0.30)", fontFamily: SANS }}>{tournamentCategory}</span> : null}
          </div>
          {surface ? (
            <span style={{ fontSize: 9, fontWeight: 700, color: surfaceColor, fontFamily: SANS, background: `${surfaceColor}18`, padding: "4px 10px", borderRadius: 999, textTransform: "uppercase", letterSpacing: "0.05em" }}>{surface}</span>
          ) : null}
        </div>

        {tournamentName ? (
          <div style={{ textAlign: "center", marginBottom: 14 }}>
            <h2 style={{ margin: 0, fontSize: 21, fontWeight: 800, color: "#fff", fontFamily: SERIF, letterSpacing: "-0.02em" }}>{tournamentName}</h2>
          </div>
        ) : null}
      </div>

      <div style={{ padding: "0 18px 0" }}>
        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 18,
            padding: "16px 14px 14px",
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 6 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 72, height: 72, margin: "0 auto 8px", borderRadius: "50%", overflow: "hidden", border: `2.5px solid ${GREEN}40`, background: "#152035", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {joao.image ? <img src={joao.image} alt={joao.name || "João Fonseca"} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 18, fontWeight: 800, color: GREEN, fontFamily: SANS }}>JF</span>}
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", fontFamily: SERIF, lineHeight: 1.2 }}>{joao.name || "J. Fonseca"}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.48)", fontFamily: SANS, marginTop: 2 }}>{joao.flag || "🇧🇷"} {joao.ranking ? `#${joao.ranking}` : ""}</div>
            </div>

            <div style={{ textAlign: "center", padding: "0 8px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.16)", fontFamily: SANS, letterSpacing: "0.06em" }}>VS</div>
            </div>

            <div style={{ textAlign: "center" }}>
              <div style={{ width: 72, height: 72, margin: "0 auto 8px", borderRadius: "50%", overflow: "hidden", border: "2.5px solid rgba(255,255,255,0.12)", background: "#152035", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {opponent.image ? <img src={opponent.image} alt={opponent.name || "Oponente"} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 18, fontWeight: 700, color: "rgba(255,255,255,0.35)", fontFamily: SANS }}>{(opponent.name || "?").charAt(0)}</span>}
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", fontFamily: SERIF, lineHeight: 1.2 }}>{opponent.name || "A definir"}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.48)", fontFamily: SANS, marginTop: 2 }}>{opponent.flag || ""} {opponent.ranking ? `#${opponent.ranking}` : ""}</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "14px 18px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <InfoChip label="Data" value={dateLabel || "A definir"} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4FC3F7" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>} />
          <InfoChip label="Horário" value={timeLabel || "A definir"} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4FC3F7" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>} />
          <InfoChip label="Quadra" value={courtLabel || "A definir"} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4FC3F7" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>} />
          <InfoChip label="Transmissão" value={broadcastLabel || "A definir"} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4FC3F7" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>} />
        </div>
      </div>

      {countdownLabel ? (
        <div style={{ padding: "12px 18px 0" }}>
          <div style={{ background: "rgba(79,195,247,0.10)", border: "1px solid rgba(79,195,247,0.16)", borderRadius: 14, padding: "12px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#4FC3F7", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>Countdown</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#fff", fontFamily: SANS }}>{countdownLabel}</div>
          </div>
        </div>
      ) : null}

      <div style={{ padding: "12px 18px 0" }}>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={{ flex: 1, padding: "13px 10px", background: "linear-gradient(135deg, #E58D19 0%, #D97706 100%)", border: "none", borderRadius: 12, color: "#fff", fontSize: 13, fontWeight: 800, fontFamily: SANS, cursor: "pointer" }}>Assistir</button>
          <button style={{ flex: 1, padding: "13px 10px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 12, color: "rgba(255,255,255,0.82)", fontSize: 12, fontWeight: 700, fontFamily: SANS, cursor: "pointer" }}>Adicionar ao calendário</button>
        </div>
      </div>

      {fPct !== null && oPct !== null ? (
        <div style={{ padding: "16px 18px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 20, fontWeight: 900, color: fPct >= oPct ? GREEN : "rgba(255,255,255,0.30)", fontFamily: SANS }}>{`${Math.round(fPct)}%`}</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.22)", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.06em" }}>Probabilidade</span>
            <span style={{ fontSize: 20, fontWeight: 900, color: oPct > fPct ? "#ef4444" : "rgba(255,255,255,0.30)", fontFamily: SANS }}>{`${Math.round(oPct)}%`}</span>
          </div>
          <div style={{ display: "flex", gap: 2, height: 6, borderRadius: 3, overflow: "hidden" }}>
            <div style={{ width: `${Math.round(fPct)}%`, background: `linear-gradient(90deg, ${GREEN}, #22c55e)` }} />
            <div style={{ width: `${Math.round(oPct)}%`, background: "linear-gradient(90deg, #ef4444, #f87171)" }} />
          </div>
        </div>
      ) : null}

      {factLabel ? (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", marginTop: 16, padding: "14px 18px", textAlign: "center" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.22)", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Contexto</div>
          <div style={{ fontSize: 12, color: "rgba(79,195,247,0.78)", fontFamily: SANS, lineHeight: 1.5 }}>{factLabel}</div>
        </div>
      ) : null}
    </section>
  );
}
