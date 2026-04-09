import { GREEN, YELLOW, TEXT, SUB, DIM, BORDER, SERIF, SANS, formatTimeAgo } from "./constants";

var Navigation = function(props) {
  var headerCompact = props.headerCompact;
  var lastUpdate = props.lastUpdate;
  var loading = props.loading;
  var onRefresh = props.onRefresh;
  var tabBarHidden = props.tabBarHidden;
  var showMaisMenu = props.showMaisMenu;
  var onShowRanking = props.onShowRanking;
  var onShowCalendar = props.onShowCalendar;
  var onShowTitles = props.onShowTitles;
  var onShowFeedback = props.onShowFeedback;
  var onShowRankingChart = props.onShowRankingChart;
  var onToggleMaisMenu = props.onToggleMaisMenu;

  return (
    <>
      <header style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(255,255,255,0.97)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid " + BORDER, transition: "all 0.3s ease" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", padding: headerCompact ? "8px 16px" : "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, transition: "padding 0.3s ease" }}>
          <div style={{ display: "flex", alignItems: "center", gap: headerCompact ? 10 : 12, minWidth: 0 }}>
            <div style={{ width: headerCompact ? 32 : 42, height: headerCompact ? 32 : 42, borderRadius: headerCompact ? 8 : 12, background: "linear-gradient(135deg, #0D1726, #132440)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.3s ease" }}>
              <span style={{ fontFamily: SERIF, fontSize: headerCompact ? 13 : 17, fontWeight: 800, letterSpacing: "-0.04em", transition: "font-size 0.3s ease" }}><span style={{ color: GREEN }}>F</span><span style={{ color: YELLOW }}>N</span></span>
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontFamily: SERIF, fontSize: headerCompact ? 16 : 22, fontWeight: 800, letterSpacing: "-0.02em", whiteSpace: "nowrap", transition: "font-size 0.3s ease" }}><span style={{ color: GREEN }}>Fonseca</span> <span style={{ color: YELLOW }}>News</span></span>
              </div>
              <span style={{ fontSize: 10, color: DIM, fontFamily: SANS, display: "flex", alignItems: "center", gap: 4, marginTop: -1, overflow: "hidden", maxHeight: headerCompact ? 0 : 16, opacity: headerCompact ? 0 : 1, transition: "all 0.3s ease" }}>
                {lastUpdate && (function() {
                  var minAgo = Math.floor((Date.now() - new Date(lastUpdate).getTime()) / 60000);
                  var isFresh = minAgo < 30;
                  return <span style={{ width: 5, height: 5, borderRadius: "50%", background: isFresh ? GREEN : "#ccc", display: "inline-block", flexShrink: 0, animation: isFresh ? "pulse 2s ease-in-out infinite" : "none" }} />;
                })()}
                <span>{"Guia de bolso" + (lastUpdate ? " · " + formatTimeAgo(lastUpdate) : "")}</span>
              </span>
            </div>
          </div>
          <button onClick={onRefresh} disabled={loading} style={{ width: 32, height: 32, borderRadius: 8, background: "transparent", border: "none", color: loading ? DIM : SUB, display: "flex", alignItems: "center", justifyContent: "center", cursor: loading ? "default" : "pointer", flexShrink: 0, padding: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={loading ? { animation: "spin 1s linear infinite" } : {}}><path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16" /></svg>
          </button>
        </div>

        <div className="desktop-nav" style={{ position: "relative" }}>
          <nav style={{ maxWidth: 640, margin: "0 auto", overflowX: "auto", overflowY: "hidden", WebkitOverflowScrolling: "touch", scrollbarWidth: "none", msOverflowStyle: "none", padding: "2px 16px 12px", paddingRight: 48, display: "flex", alignItems: "center", gap: 24 }}>
            {[
              { label: "Biografia", href: "/biografia" },
              { label: "Ranking", action: onShowRanking },
              { label: "Calendário", action: onShowCalendar },
              { label: "Conquistas", action: onShowTitles },
              { label: "Feedback", action: onShowFeedback },
              { label: "Sobre", href: "/sobre" },
            ].map(function(item, i) {
              var isLink = !!item.href;
              var navStyle = { fontSize: 13, fontWeight: 500, color: SUB, fontFamily: SANS, whiteSpace: "nowrap", padding: 0, background: "none", border: "none", cursor: "pointer", textDecoration: "none", letterSpacing: "0.01em", flexShrink: 0 };
              if (isLink) return <a key={i} href={item.href} style={navStyle}>{item.label}</a>;
              return <button key={i} onClick={item.action} style={navStyle}>{item.label}</button>;
            })}
          </nav>
          <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 48, background: "linear-gradient(to right, transparent, rgba(255,255,255,0.95) 60%)", display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 8, pointerEvents: "none" }}>
            <span style={{ fontSize: 14, color: DIM, fontFamily: SANS, fontWeight: 300 }}>›</span>
          </div>
        </div>
      </header>

      {/* Mobile Tab Bar */}
      <div className="mobile-tab-bar" style={{ display: "none", position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 200, background: "#fff", borderTop: "1px solid " + BORDER, transition: "transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)", transform: tabBarHidden ? "translateY(100%)" : "translateY(0)", paddingBottom: 28 }}>
        {showMaisMenu && (
          <div style={{ position: "absolute", bottom: "100%", right: 16, background: "white", borderRadius: 16, boxShadow: "0 8px 30px rgba(0,0,0,0.15)", border: "1px solid " + BORDER, padding: "8px 0", minWidth: 180, marginBottom: 6 }}>
            {[
              { label: "Biografia", action: function(){ window.location.href="/biografia"; } },
              { label: "Feedback", action: function(){ onShowFeedback(); onToggleMaisMenu(false); } },
              { label: "Sobre", action: function(){ window.location.href="/sobre"; } },
            ].map(function(item, i) {
              return <button key={i} onClick={item.action} style={{ display: "block", width: "100%", textAlign: "left", padding: "13px 20px", background: "none", border: "none", fontSize: 15, fontWeight: 500, color: TEXT, fontFamily: SANS, cursor: "pointer" }}>{item.label}</button>;
            })}
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center", padding: "10px 8px 4px" }}>
          {[
            { label: "Home", action: function(){ window.scrollTo({top:0,behavior:"smooth"}); onToggleMaisMenu(false); }, icon: function(a){ return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a?"#4FC3F7":"rgba(0,0,0,0.3)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>; } },
            { label: "Ranking", action: function(){ onShowRanking(); onToggleMaisMenu(false); }, icon: function(a){ return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a?"#4FC3F7":"rgba(0,0,0,0.3)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>; } },
            { label: "Calendário", action: function(){ onShowCalendar(); onToggleMaisMenu(false); }, icon: function(a){ return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a?"#4FC3F7":"rgba(0,0,0,0.3)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>; } },
            { label: "Conquistas", action: function(){ onShowTitles(); onToggleMaisMenu(false); }, icon: function(a){ return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a?"#4FC3F7":"rgba(0,0,0,0.3)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>; } },
            { label: "Mais", action: onToggleMaisMenu, icon: function(a){ return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a?"#4FC3F7":"rgba(0,0,0,0.3)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>; } },
          ].map(function(tab, i) {
            var isActive = (tab.label === "Mais" && showMaisMenu);
            return (
              <button key={i} onClick={tab.action} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, background: "none", border: "none", cursor: "pointer", padding: "3px 10px", minWidth: 52 }}>
                {tab.icon(isActive)}
                <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500, color: isActive ? "#4FC3F7" : "rgba(0,0,0,0.35)", fontFamily: SANS }}>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default Navigation;
