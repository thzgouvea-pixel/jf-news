import { useState, useEffect } from 'react';
import { GREEN, RED, TEXT, SUB, DIM, BORDER, SANS, SERIF, CARD_SHADOW, CARD_SHADOW_MD, catColors } from '../lib/constants';
import { formatTimeAgo } from '../lib/utils';

export default function NewsCard(props) {
  var item = props.item; var index = props.index; var allLikes = props.allLikes || {}; var noBorder = props.noBorder;
  var _s = useState(false); var h = _s[0]; var setH = _s[1];
  var _i = useState(false); var imgErr = _i[0]; var setImgErr = _i[1];
  var hasImg = item.image && !imgErr;
  var likeId = (item.title || "").substring(0, 40).replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
  var initialLikes = allLikes[likeId] || { likes: 0, dislikes: 0 };
  var _lk = useState(initialLikes); var rx = _lk[0]; var setRx = _lk[1];
  var _voted = useState(function() { try { return localStorage.getItem("fn_v_" + likeId); } catch(e) { return null; } });
  var voted = _voted[0]; var setVoted = _voted[1];
  useEffect(function() { var fresh = allLikes[likeId]; if (fresh && typeof fresh.likes === "number") setRx(fresh); }, [allLikes[likeId]]);
  var handleRx = function(type, e) { e.preventDefault(); e.stopPropagation(); if (voted) return; var action = type === "l" ? "like" : "dislike"; fetch("/api/likes?id=" + likeId + "&action=" + action, { method: "POST" }).then(function(r) { return r.json(); }).then(function(d) { if (d && typeof d.likes === "number") setRx(d); }).catch(function() {}); setVoted(type); try { localStorage.setItem("fn_v_" + likeId, type); } catch(e) {} };
  var buildShareText = function() {
    var title = cleanTitle || item.title || "";
    var src = item.source ? "Fonte: " + item.source : "";
    return title + "\n\n\ud83d\udd17 via https://fonsecanews.com.br" + (src ? "\n" + src : "");
  };
  var handleTwitter = function(e) {
    e.preventDefault(); e.stopPropagation();
    var text = encodeURIComponent(buildShareText());
    window.open("https://twitter.com/intent/tweet?text=" + text, "_blank", "noopener,noreferrer");
  };
  var handleWhatsApp = function(e) {
    e.preventDefault(); e.stopPropagation();
    var text = encodeURIComponent(buildShareText());
    window.open("https://wa.me/?text=" + text, "_blank", "noopener,noreferrer");
  };
  var handleSh = function(e) {
    e.preventDefault(); e.stopPropagation();
    if (navigator.share) {
      navigator.share({ title: item.title, text: buildShareText(), url: "https://fonsecanews.com.br" }).catch(function() {});
    } else {
      // Fallback: copy to clipboard
      if (navigator.clipboard) {
        navigator.clipboard.writeText(buildShareText() + "\n\n" + (item.url || "")).catch(function() {});
      }
    }
  };
  var catColor = catColors[item.category] || catColors["Notícia"];
  var hasUrl = item.url && item.url.startsWith("http");
  var cleanTitle = item.source && item.title ? item.title.replace(" - " + item.source, "").replace(" | " + item.source, "").replace(" · " + item.source, "") : item.title;
  return (
    <article onClick={function() { if (hasUrl) window.open(item.url, "_blank", "noopener,noreferrer"); }} onMouseEnter={function() { setH(true); }} onMouseLeave={function() { setH(false); }}
      style={{ padding: "16px 18px", marginBottom: 10, background: "#fff", borderRadius: 14, border: "1px solid " + BORDER, boxShadow: h ? CARD_SHADOW_MD : CARD_SHADOW, cursor: "pointer", animation: "fadeIn 0.35s ease forwards", animationDelay: (index * 0.04) + "s", opacity: 0, transition: "box-shadow 0.2s" }}>
      <div style={{ display: "flex", gap: 14 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: catColor, fontFamily: SANS }}>{item.category}</span>
            <span style={{ fontSize: 11, color: DIM, fontFamily: SANS }}>{item.source}</span>
            <span style={{ fontSize: 11, color: DIM, fontFamily: SANS, marginLeft: "auto" }}>{formatTimeAgo(item.date)}</span>
          </div>
          <h3 style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 700, color: h ? "#007A3D" : TEXT, fontFamily: SERIF, lineHeight: 1.35, letterSpacing: "-0.01em", transition: "color 0.15s" }}>{cleanTitle}</h3>
          {item.summary && <p style={{ margin: "0 0 6px", fontSize: 14, color: SUB, fontFamily: SANS, lineHeight: 1.6 }}>{item.summary}</p>}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 10 }}>
            <button onClick={function(e) { handleRx("l", e); }} style={{ background: "none", border: "none", cursor: voted ? "default" : "pointer", display: "flex", alignItems: "center", gap: 4, padding: 0, opacity: voted && voted !== "l" ? 0.2 : (voted === "l" ? 1 : 0.35) }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill={voted === "l" ? GREEN : "none"} stroke={voted === "l" ? GREEN : DIM} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
              {rx.likes > 0 && <span style={{ fontSize: 10, color: voted === "l" ? GREEN : DIM, fontWeight: 600, fontFamily: SANS }}>{rx.likes}</span>}
            </button>
            <button onClick={function(e) { handleRx("d", e); }} style={{ background: "none", border: "none", cursor: voted ? "default" : "pointer", display: "flex", alignItems: "center", gap: 4, padding: 0, opacity: voted && voted !== "d" ? 0.2 : (voted === "d" ? 1 : 0.35) }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill={voted === "d" ? RED : "none"} stroke={voted === "d" ? RED : DIM} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10zM17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>
              {rx.dislikes > 0 && <span style={{ fontSize: 10, color: voted === "d" ? RED : DIM, fontWeight: 600, fontFamily: SANS }}>{rx.dislikes}</span>}
            </button>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
              <button onClick={handleTwitter} aria-label="Compartilhar no X" style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill={SUB}><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </button>
              <button onClick={handleWhatsApp} aria-label="Compartilhar no WhatsApp" style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="#25D366"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
              </button>
              <button onClick={handleSh} aria-label="Compartilhar" style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.5 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={SUB} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
              </button>
            </div>
          </div>
        </div>
        {hasImg && <img src={item.image} alt="" onError={function() { setImgErr(true); }} style={{ width: 72, height: 72, borderRadius: 10, objectFit: "cover", flexShrink: 0, background: "#f0f0f0" }} loading="lazy" />}
      </div>
    </article>
  );
}
