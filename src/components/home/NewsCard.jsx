import React, { useEffect, useState } from "react";
import { formatTimeAgo } from "../../lib/formatters";

const GREEN = "#00A859";
const BG_ALT = "#F7F8F9";
const TEXT = "#1a1a1a";
const SUB = "#6b6b6b";
const DIM = "#a0a0a0";
const BORDER = "#e8e8e8";
const RED = "#c0392b";
const SERIF = "'Source Serif 4', Georgia, serif";
const SANS = "'Inter', -apple-system, sans-serif";

const catColors = {
  Torneio: "#c0392b",
  Treino: "#2A9D8F",
  Declaração: "#b8860b",
  Resultado: "#2563EB",
  Ranking: "#6D35D0",
  Notícia: "#6b6b6b",
};

export default function NewsCard({ item, index, allLikes = {}, noBorder }) {
  const [hovered, setHovered] = useState(false);
  const [imgErr, setImgErr] = useState(false);

  const likeId = (item.title || "")
    .substring(0, 40)
    .replace(/[^a-zA-Z0-9]/g, "_")
    .toLowerCase();

  const initialLikes = allLikes[likeId] || { likes: 0, dislikes: 0 };
  const [reactions, setReactions] = useState(initialLikes);
  const [voted, setVoted] = useState(() => {
    try {
      return localStorage.getItem(`fn_v_${likeId}`);
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const fresh = allLikes[likeId];
    if (fresh && typeof fresh.likes === "number") {
      setReactions(fresh);
    }
  }, [allLikes, likeId]);

  const hasImg = item.image && !imgErr;
  const catColor = catColors[item.category] || catColors.Notícia;
  const hasUrl = item.url && item.url.startsWith("http");
  const cleanTitle = item.source && item.title
    ? item.title
        .replace(` - ${item.source}`, "")
        .replace(` | ${item.source}`, "")
        .replace(` · ${item.source}`, "")
    : item.title;

  function handleReaction(type, event) {
    event.preventDefault();
    event.stopPropagation();
    if (voted) return;

    const action = type === "l" ? "like" : "dislike";

    fetch(`/api/likes?id=${likeId}&action=${action}`, { method: "POST" })
      .then((r) => r.json())
      .then((data) => {
        if (data && typeof data.likes === "number") {
          setReactions(data);
        }
      })
      .catch(() => {});

    setVoted(type);
    try {
      localStorage.setItem(`fn_v_${likeId}`, type);
    } catch {}
  }

  function handleShare(event) {
    event.preventDefault();
    event.stopPropagation();
    if (!navigator.share) return;
    navigator.share({
      title: item.title,
      url: item.url || "https://fonsecanews.com.br",
    }).catch(() => {});
  }

  return (
    <article
      onClick={() => {
        if (hasUrl) window.open(item.url, "_blank", "noopener,noreferrer");
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "20px 0",
        borderBottom: noBorder ? "none" : `1px solid ${BORDER}`,
        cursor: "pointer",
        animation: "fadeIn 0.35s ease forwards",
        animationDelay: `${index * 0.04}s`,
        opacity: 0,
      }}
    >
      <div style={{ display: "flex", gap: 14 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: catColor, fontFamily: SANS }}>
              {item.category}
            </span>
            <span style={{ fontSize: 11, color: DIM, fontFamily: SANS }}>{item.source}</span>
            <span style={{ fontSize: 11, color: DIM, fontFamily: SANS, marginLeft: "auto" }}>
              {formatTimeAgo(item.date)}
            </span>
          </div>

          <h3
            style={{
              margin: "0 0 6px",
              fontSize: 17,
              fontWeight: 700,
              color: hovered ? "#007A3D" : TEXT,
              fontFamily: SERIF,
              lineHeight: 1.35,
              letterSpacing: "-0.01em",
              transition: "color 0.15s",
            }}
          >
            {cleanTitle}
          </h3>

          {item.summary ? (
            <p style={{ margin: "0 0 6px", fontSize: 14, color: SUB, fontFamily: SANS, lineHeight: 1.6 }}>
              {item.summary}
            </p>
          ) : null}

          <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 10 }}>
            <button
              onClick={(e) => handleReaction("l", e)}
              style={{
                background: "none",
                border: "none",
                cursor: voted ? "default" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: 0,
                opacity: voted && voted !== "l" ? 0.2 : voted === "l" ? 1 : 0.35,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill={voted === "l" ? GREEN : "none"} stroke={voted === "l" ? GREEN : DIM} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
              {reactions.likes > 0 ? (
                <span style={{ fontSize: 10, color: voted === "l" ? GREEN : DIM, fontWeight: 600, fontFamily: SANS }}>
                  {reactions.likes}
                </span>
              ) : null}
            </button>

            <button
              onClick={(e) => handleReaction("d", e)}
              style={{
                background: "none",
                border: "none",
                cursor: voted ? "default" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: 0,
                opacity: voted && voted !== "d" ? 0.2 : voted === "d" ? 1 : 0.35,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill={voted === "d" ? RED : "none"} stroke={voted === "d" ? RED : DIM} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10zM17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>
              {reactions.dislikes > 0 ? (
                <span style={{ fontSize: 10, color: voted === "d" ? RED : DIM, fontWeight: 600, fontFamily: SANS }}>
                  {reactions.dislikes}
                </span>
              ) : null}
            </button>

            <button
              onClick={handleShare}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                marginLeft: "auto",
                opacity: 0.3,
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={DIM} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
            </button>
          </div>
        </div>

        {hasImg ? (
          <img
            src={item.image}
            alt=""
            onError={() => setImgErr(true)}
            style={{
              width: 72,
              height: 72,
              borderRadius: 10,
              objectFit: "cover",
              flexShrink: 0,
              background: BG_ALT,
            }}
            loading="lazy"
          />
        ) : null}
      </div>
    </article>
  );
}
