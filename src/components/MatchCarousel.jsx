import { useState, useEffect, useRef } from 'react';
import { GREEN, DIM, BORDER, TEXT, SANS } from '../lib/constants';
import PlayerBlock from './PlayerBlock';

export default function MatchCarousel(props) {
  var scrollRef = useRef(null);
  var statsRef = useRef(null);
  var _page = useState(0); var activePage = _page[0]; var setActivePage = _page[1];
  var _statsH = useState(0); var statsHeight = _statsH[0]; var setStatsHeight = _statsH[1];

  useEffect(function() {
    if (statsRef.current) {
      var h = statsRef.current.offsetHeight;
      if (h > 0) setStatsHeight(h);
    }
  });

  var handleScroll = function() {
    if (!scrollRef.current) return;
    var el = scrollRef.current;
    var page = Math.round(el.scrollLeft / el.clientWidth);
    setActivePage(page);
  };

  var goTo = function(i) {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: i * scrollRef.current.clientWidth, behavior: "smooth" });
    }
  };

  return (
    <div>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        data-match-carousel=""
        style={{
          display: "flex", overflowX: "auto", scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch", scrollbarWidth: "none", msOverflowStyle: "none",
          gap: 0,
        }}
      >
        <div ref={statsRef} style={{ flex: "0 0 100%", scrollSnapAlign: "start", minWidth: "100%" }}>
          <PlayerBlock
            lastMatch={props.lastMatch} matchStats={props.matchStats}
            recentForm={props.recentForm} prizeMoney={props.prizeMoney}
            playerRanking={props.playerRanking} opponentProfile={props.opponentProfile}
          />
        </div>

        <div style={{ flex: "0 0 100%", scrollSnapAlign: "start", minWidth: "100%", display: "flex", flexDirection: "column" }}>
          <div style={{ borderRadius: 16, overflow: "hidden", background: "#000", border: "1px solid " + BORDER, flex: 1, display: "flex", flexDirection: "column", minHeight: statsHeight > 0 ? statsHeight : undefined }}>
            <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
              <iframe
                src={"https://www.youtube.com/embed/" + props.highlightVideo.videoId}
                title={props.highlightVideo.title || "Melhores momentos"}
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            {props.highlightVideo.title && (
              <div style={{ padding: "12px 16px", background: "#111" }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#fff", fontFamily: SANS }}>{props.highlightVideo.title}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 14 }}>
        <button onClick={function() { goTo(0); }} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", background: activePage === 0 ? "#FAFBFC" : "transparent", border: "1px solid " + (activePage === 0 ? BORDER : "transparent"), borderRadius: 999, cursor: "pointer" }}>
          <span style={{ width: activePage === 0 ? 14 : 6, height: 6, borderRadius: 3, background: activePage === 0 ? GREEN : DIM, transition: "all 0.3s ease" }} />
          <span style={{ fontSize: 10, fontWeight: 600, color: activePage === 0 ? TEXT : DIM, fontFamily: SANS, transition: "color 0.3s ease" }}>Stats</span>
        </button>
        <button onClick={function() { goTo(1); }} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", background: activePage === 1 ? "#FAFBFC" : "transparent", border: "1px solid " + (activePage === 1 ? BORDER : "transparent"), borderRadius: 999, cursor: "pointer" }}>
          <span style={{ width: activePage === 1 ? 14 : 6, height: 6, borderRadius: 3, background: activePage === 1 ? "#ef4444" : DIM, transition: "all 0.3s ease" }} />
          <svg width="10" height="10" viewBox="0 0 24 24" fill={activePage === 1 ? "#ef4444" : DIM} stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          <span style={{ fontSize: 10, fontWeight: 600, color: activePage === 1 ? TEXT : DIM, fontFamily: SANS, transition: "color 0.3s ease" }}>Melhores momentos</span>
        </button>
      </div>
    </div>
  );
}
