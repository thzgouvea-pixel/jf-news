import React from "react";

const TEXT = "#1a1a1a";
const DIM = "#a0a0a0";
const SUB = "#6b6b6b";
const SERIF = "'Source Serif 4', Georgia, serif";
const SANS = "'Inter', -apple-system, sans-serif";

export default function Modal({ title, subtitle, onClose, maxWidth = 440, children }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        background: "rgba(0,0,0,0.4)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        animation: "fadeInO 0.3s ease",
        overflowY: "auto",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 20,
          padding: "24px 20px",
          maxWidth,
          width: "100%",
          maxHeight: "88vh",
          overflowY: "auto",
          animation: "slideU 0.4s ease",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 800,
              color: TEXT,
              fontFamily: SERIF,
            }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: DIM,
              fontSize: 18,
              cursor: "pointer",
            }}
          >
            x
          </button>
        </div>

        {subtitle ? (
          <p
            style={{
              margin: "-10px 0 12px",
              fontSize: 13,
              color: SUB,
              fontFamily: SANS,
            }}
          >
            {subtitle}
          </p>
        ) : null}

        {children}
      </div>
    </div>
  );
}
