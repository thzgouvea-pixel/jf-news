// v4
import { useState, useEffect, useRef } from "react";

const ACCENT = "#0066FF";
const ACCENT_LIGHT = "#E8F0FE";
const BG = "#FAFAFA";
const BG_WHITE = "#FFFFFF";
const TEXT_PRIMARY = "#1A1A1A";
const TEXT_SECONDARY = "#5A5A5A";
const TEXT_DIM = "#999";
const BORDER = "#EBEBEB";
const GREEN = "#2A9D8F";
const RED = "#E63946";

const CACHE_DURATION_MS = 30 * 60 * 1000;
const surfaceEmoji = { "Saibro": "🟠", "Hard": "🔵", "Dura": "🔵", "Grama": "🟢" };
const surfaceColorMap = { "Saibro": "#E8734A", "Hard": "#3B82F6", "Dura": "#3B82F6", "Grama": "#22C55E" };

const JF_QUOTES = [
  "Os pequenos detalhes fazem a diferença.",
  "Mantenho o foco e uma atitude positiva enquanto sigo evoluindo.",
  "Eu sabia que podia competir nesse nível.",
  "Cada torneio é uma oportunidade de aprender.",
  "O trabalho duro não mente.",
  "Estou evoluindo a cada torneio.",
  "Quero fazer história pelo Brasil.",
  "A pressão é um privilégio.",
];

const SAMPLE_PLAYER = { ranking: 59, rankingChange: "+4" };
const SAMPLE_SEASON = { wins: 14, losses: 5, titles: 3, year: 2026 };
const SAMPLE_LAST_MATCH = { result: "V", score: "6-3 6-4", opponent: "T. Nakashima", tournament: "Indian Wells", round: "R2" };
const SAMPLE_NEXT_MATCH = { tournament_category: "ATP 500", tournament_name: "Barcelona Open", surface: "Saibro", city: "Barcelona", country: "Espanha", date: "", round: "" };
const SAMPLE_NEWS = [
  { title: "João Fonseca confirma presença no ATP 500 de Barcelona", summary: "O tenista brasileiro confirmou participação no torneio espanhol de saibro.", source: "ESPN Brasil", url: "https://www.espn.com.br/tenis/", date: new Date(Date.now() - 2 * 3600000).toISOString(), category: "Torneio" },
  { title: "Fonseca sobe para 59º no ranking da ATP", summary: "Campanha até as oitavas em Indian Wells rende posições ao carioca.", source: "UOL Esporte", url: "https://www.uol.com.br/esporte/tenis/", date: new Date(Date.now() - 8 * 3600000).toISOString(), category: "Ranking" },
  { title: "\"Estou evoluindo a cada torneio\", diz Fonseca", summary: "Brasileiro elogiou próprio desempenho após derrota para o nº1.", source: "GE", url: "https://ge.globo.com/tenis/", date: new Date(Date.now() - 18 * 3600000).toISOString(), category: "Declaração" },
  { title: "Fonseca treina no Rio visando saibro", summary: "Preparação física e ajustes no saque com equipe técnica.", source: "O Globo", url: "https://oglobo.globo.com/esportes/", date: new Date(Date.now() - 36 * 3600000).toISOString(), category: "Treino" },
  { title: "Fonseca vence em sets diretos em Miami", summary: "Parciais de 6-3, 6-4 garantiram vaga na chave principal.", source: "Tênis Brasil", url: "https://tenisbrasil.uol.com.br/", date: new Date(Date.now() - 52 * 3600000).toISOString(), category: "Resultado" },
  { title: "Nike renova com Fonseca até 2028", summary: "Marca americana amplia acordo apostando no potencial do brasileiro.", source: "Folha de S. Paulo", url: "https://www.folha.uol.com.br/esporte/", date: new Date(Date.now() - 72 * 3600000).toISOString(), category: "Notícia" },
  { title: "Técnico revela plano para restante da temporada", summary: "Prioridade: Masters 1000 de saibro e Roland Garros.", source: "ESPN Brasil", url: "https://www.espn.com.br/tenis/", date: new Date(Date.now() - 96 * 3600000).toISOString(), category: "Notícia" },
];

const formatTimeAgo = (d) => { if (!d) return ""; try { const m = Math.floor((new Date() - new Date(d)) / 60000); if (m < 1) return "agora"; if (m < 60) return `há ${m} min`; const h = Math.floor(m / 60); if (h < 24) return `há ${h}h`; const dd = Math.floor(h / 24); if (dd === 1) return "ontem"; if (dd < 7) return `há ${dd} dias`; return new Date(d).toLocaleDateString("pt-BR", { day: "numeric", month: "short" }); } catch { return ""; } };
const formatMinLeft = (ms) => { const m = Math.max(0, Math.ceil(ms / 60000)); return m === 0 ? "agora" : `${m} min`; };
const formatMatchDate = (d) => { if (!d) return "Sem data confirmada"; try { const dt = new Date(d); return isNaN(dt.getTime()) ? d : dt.toLocaleDateString("pt-BR", { day: "numeric", month: "long" }); } catch { return d; } };

const catCfg = {
  "Torneio": { color: "#E63946", bg: "#FEF0F0" }, "Treino": { color: "#2A9D8F", bg: "#EDF8F6" },
  "Declaração": { color: "#E9A820", bg: "#FDF6E3" }, "Resultado": { color: "#0066FF", bg: "#E8F0FE" },
  "Ranking": { color: "#7C3AED", bg: "#F3EEFF" }, "Notícia": { color: "#5A5A5A", bg: "#F3F3F3" },
};

// ===== INLINE INFO BARS =====
const SeasonBar = ({ season }) => {
  if (!season) return null;
  const pct = season.wins + season.losses > 0 ? Math.round((season.wins / (season.wins + season.losses)) * 100) : 0;
  return (
    <div style={{ padding: "8px 24px", background: "#F8F9FA", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
      <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: TEXT_DIM, fontFamily: "'Inter', -apple-system, sans-serif" }}>Temporada {season.year}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: GREEN, fontFamily: "'Inter', -apple-system, sans-serif" }}>{season.wins}V</span>
      <span style={{ fontSize: 10, color: TEXT_DIM }}>·</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: RED, fontFamily: "'Inter', -apple-system, sans-serif" }}>{season.losses}D</span>
      <span style={{ fontSize: 10.5, color: TEXT_DIM, fontFamily: "'Inter', -apple-system, sans-serif" }}>({pct}%)</span>
      {season.titles > 0 && (<>
        <span style={{ fontSize: 10, color: TEXT_DIM }}>·</span>
        <span style={{ fontSize: 12, fontFamily: "'Inter', -apple-system, sans-serif" }}>🏆 <span style={{ fontWeight: 700, color: "#E9A820" }}>{season.titles}</span></span>
      </>)}
    </div>
  );
};

const LastMatchBar = ({ match }) => {
  if (!match) return null;
  const w = match.result === "V";
  return (
    <div style={{ padding: "8px 24px", background: w ? "#F7FDFA" : "#FFFAFA", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
      <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: TEXT_DIM, fontFamily: "'Inter', -apple-system, sans-serif" }}>Última partida</span>
      <span style={{ fontSize: 10, fontWeight: 700, color: w ? GREEN : RED, fontFamily: "'Inter', -apple-system, sans-serif", background: w ? "#EAFAF3" : "#FEF0F0", padding: "1px 6px", borderRadius: 3 }}>{w ? "V" : "D"}</span>
      <span style={{ fontSize: 12.5, fontWeight: 700, color: TEXT_PRIMARY, fontFamily: "'Source Serif 4', Georgia, serif" }}>Fonseca <span style={{ color: w ? GREEN : RED }}>{match.score}</span> {match.opponent}</span>
      <span style={{ fontSize: 10.5, color: TEXT_DIM, fontFamily: "'Inter', -apple-system, sans-serif" }}>{match.tournament}{match.round ? ` · ${match.round}` : ""}</span>
    </div>
  );
};

// ===== NEXT DUEL CARD =====
const NextDuelCard = ({ match, player, isLive }) => {
  if (!match) return null;
  const sc = surfaceColorMap[match.surface] || ACCENT;
  const joaoImg = "https://api.sofascore.app/api/v1/player/403869/image";
  const oppImg = match.opponent_id ? ("https://api.sofascore.app/api/v1/player/" + match.opponent_id + "/image") : null;
  const oppName = match.opponent_name || "";
  const oppRanking = match.opponent_ranking;
  const oppCountry = match.opponent_country || "";
  return (
    <div style={{ maxWidth: 680, margin: "0 auto", background: "linear-gradient(135deg, #0a0a1a 0%, #16213e 100%)", borderLeft: "1px solid " + BORDER, borderRight: "1px solid " + BORDER, borderBottom: "1px solid " + BORDER, position: "relative", overflow: "hidden" }}>
      <div style={{ height: 3, background: "linear-gradient(90deg, #009739, #FEDD00)" }} />
      <div style={{ textAlign: "center", padding: "16px 20px 8px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: sc + "25", borderRadius: 20, padding: "3px 12px", border: "1px solid " + sc + "40" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: sc }} />
          <span style={{ fontSize: 10.5, fontWeight: 700, color: sc, fontFamily: "'Inter', sans-serif", textTransform: "uppercase", letterSpacing: "0.05em" }}>{match.surface}</span>
        </div>
        <p style={{ margin: "8px 0 2px", fontSize: 18, fontWeight: 800, color: "#fff", fontFamily: "'Source Serif 4', Georgia, serif" }}>{match.tournament_category || match.tournament_name || "Próxima Partida"}</p>
        {match.tournament_name && match.tournament_category && (
          <p style={{ margin: 0, fontSize: 12, color: "#888", fontFamily: "'Inter', sans-serif" }}>{match.tournament_name}</p>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 60px 1fr", alignItems: "start", gap: 8, padding: "16px 20px" }}>
        {/* João */}
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", margin: "0 auto 8px", overflow: "hidden", background: "rgba(255,255,255,0.05)", border: "2px solid rgba(0,168,89,0.4)", boxShadow: "0 0 20px rgba(0,168,89,0.15)" }}>
            <img src={joaoImg} alt="João Fonseca" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={function(e) { e.target.style.display = "none"; }} />
          </div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: "'Source Serif 4', Georgia, serif" }}>J. Fonseca</p>
          <p style={{ margin: "2px 0 0", fontSize: 11, color: "#888", fontFamily: "'Inter', sans-serif" }}>🇧🇷</p>
          {player && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 3, background: "rgba(0,168,89,0.15)", borderRadius: 6, padding: "2px 8px", marginTop: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#00E676", fontFamily: "'Inter', sans-serif" }}>{"#" + player.ranking}</span>
              <span style={{ fontSize: 9, color: "#888", fontFamily: "'Inter', sans-serif" }}>ATP</span>
            </div>
          )}
        </div>
        {/* VS */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, paddingTop: 28 }}>
          <span style={{ fontSize: 22, fontWeight: 900, color: "rgba(255,255,255,0.12)", fontFamily: "'Inter', sans-serif" }}>VS</span>
        </div>
        {/* Opponent */}
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", margin: "0 auto 8px", overflow: "hidden", background: "rgba(255,255,255,0.05)", border: "2px solid rgba(255,255,255,0.1)" }}>
            {oppImg ? (
              <img src={oppImg} alt={oppName} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={function(e) { e.target.style.display = "none"; }} />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>🎾</div>
            )}
          </div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: "'Source Serif 4', Georgia, serif" }}>{oppName || "A definir"}</p>
          {oppCountry && (
            <p style={{ margin: "2px 0 0", fontSize: 11, color: "#888", fontFamily: "'Inter', sans-serif" }}>{oppCountry}</p>
          )}
          {oppRanking && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 3, background: "rgba(255,255,255,0.08)", borderRadius: 6, padding: "2px 8px", marginTop: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#ccc", fontFamily: "'Inter', sans-serif" }}>{"#" + oppRanking}</span>
              <span style={{ fontSize: 9, color: "#888", fontFamily: "'Inter', sans-serif" }}>ATP</span>
            </div>
          )}
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 16, padding: "10px 20px 16px", borderTop: "1px solid rgba(255,255,255,0.06)", flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, color: "#aaa", fontFamily: "'Inter', sans-serif" }}>📅 {formatMatchDate(match.date)}</span>
        <span style={{ fontSize: 12, color: "#aaa", fontFamily: "'Inter', sans-serif" }}>📍 {match.city}{match.country ? (", " + match.country) : ""}</span>
        {match.round && (
          <span style={{ fontSize: 12, color: "#aaa", fontFamily: "'Inter', sans-serif" }}>🏟️ {match.round}</span>
        )}
      </div>
      {!isLive && (
        <p style={{ margin: 0, padding: "0 20px 10px", fontSize: 10, color: "#555", fontStyle: "italic", fontFamily: "'Inter', sans-serif", textAlign: "center" }}>Dados de exemplo</p>
      )}
    </div>
  );
};

// ===== OTHER COMPONENTS =====
const Skeleton = () => (<div>{[...Array(5)].map((_, i) => (<div key={i} style={{ background: BG_WHITE, padding: "20px 24px", borderBottom: "1px solid " + BORDER, animation: "pulse 1.8s ease-in-out infinite", animationDelay: (i * .12) + "s" }}><div style={{ display: "flex", gap: 8, marginBottom: 10 }}><div style={{ height: 20, width: 70, background: "#f0f0f0", borderRadius: 4 }} /><div style={{ height: 20, width: 90, background: "#f5f5f5", borderRadius: 4 }} /></div><div style={{ height: 18, width: "85%", background: "#f0f0f0", borderRadius: 4, marginBottom: 8 }} /><div style={{ height: 14, width: "60%", background: "#f5f5f5", borderRadius: 4 }} /></div>))}</div>);

const NewsCard = ({ item, index }) => {
  const [h, setH] = useState(false);
  const [imgErr, setImgErr] = useState(false);
  const cat = catCfg[item.category] || catCfg["Notícia"];
  const hasImg = item.image && !imgErr;
  const hasUrl = item.url && item.url.startsWith("http");
  const Tag = hasUrl ? "a" : "div";
  const linkProps = hasUrl ? { href: item.url, target: "_blank", rel: "noopener noreferrer" } : {};
  return (
    <Tag {...linkProps} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display: "flex", gap: hasImg ? 14 : 0, textDecoration: "none", background: h && hasUrl ? "#F8F9FA" : BG_WHITE, padding: hasImg ? "16px 24px" : "16px 24px 16px 20px", borderBottom: "1px solid " + BORDER, borderLeft: hasImg ? "none" : ("3px solid " + cat.color), transition: "background 0.15s", animation: "fadeIn 0.35s ease forwards", animationDelay: (index * 0.04) + "s", opacity: 0, cursor: hasUrl ? "pointer" : "default", alignItems: "flex-start" }}>
      {hasImg && (
        <img src={item.image} alt="" onError={() => setImgErr(true)}
          style={{ width: 56, height: 56, borderRadius: 10, objectFit: "cover", flexShrink: 0, marginTop: 2, background: "#f0f0f0" }} />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: cat.color, fontFamily: "'Inter', -apple-system, sans-serif", background: cat.bg, padding: "3px 8px", borderRadius: 4 }}>{item.category}</span>
          <span style={{ fontSize: 12, color: TEXT_DIM, fontFamily: "'Inter', -apple-system, sans-serif" }}>{item.source}</span>
          <span style={{ fontSize: 12, color: TEXT_DIM, fontFamily: "'Inter', -apple-system, sans-serif", marginLeft: "auto", whiteSpace: "nowrap" }}>{formatTimeAgo(item.date)}</span>
        </div>
        <h3 style={{ margin: "0 0 5px", fontSize: 15.5, fontWeight: 700, color: h && hasUrl ? ACCENT : TEXT_PRIMARY, fontFamily: "'Source Serif 4', Georgia, serif", lineHeight: 1.4, transition: "color 0.15s" }}>{item.title}</h3>
        {item.summary && <p style={{ margin: 0, fontSize: 13, color: TEXT_SECONDARY, fontFamily: "'Inter', -apple-system, sans-serif", lineHeight: 1.5 }}>{item.summary}</p>}
      </div>
    </Tag>
  );
};

const buildFeed = (newsItems, season, lastMatch) => {
  const elements = [];
  const inserts = [
    { at: 3, component: <SeasonBar key="season-bar" season={season} /> },
    { at: 6, component: <LastMatchBar key="last-match-bar" match={lastMatch} /> },
  ];
  newsItems.forEach((item, i) => {
    elements.push(<NewsCard key={"news-" + i} item={item} index={i} />);
    const insert = inserts.find(ins => ins.at === i + 1);
    if (insert) elements.push(insert.component);
  });
  if (newsItems.length < 3 && season) elements.push(<SeasonBar key="season-bar" season={season} />);
  if (newsItems.length < 6 && lastMatch) elements.push(<LastMatchBar key="last-match-bar" match={lastMatch} />);
  return elements;
};

// ===== MAIN APP =====
export default function JoaoFonsecaNews() {
  const [news, setNews] = useState([]);
  const [nextMatch, setNextMatch] = useState(null);
  const [lastMatch, setLastMatch] = useState(null);
  const [player, setPlayer] = useState(null);
  const [season, setSeason] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [cacheExpiresAt, setCacheExpiresAt] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [cacheStatus, setCacheStatus] = useState("init");
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [showInstallPopup, setShowInstallPopup] = useState(false);
  const [popupDismissed, setPopupDismissed] = useState(false);
  const [showBio, setShowBio] = useState(false);
  const [showTitles, setShowTitles] = useState(false);
  const initDone = useRef(false);

  useEffect(() => { if (popupDismissed) return; const t = setTimeout(() => setShowInstallPopup(true), 15000); return () => clearTimeout(t); }, [popupDismissed]);
  useEffect(() => { if (!cacheExpiresAt) return; const tick = () => setTimeLeft(Math.max(0, cacheExpiresAt - Date.now())); tick(); const iv = setInterval(tick, 15000); return () => clearInterval(iv); }, [cacheExpiresAt]);

  useEffect(() => {
    const manifest = { name: "Fonseca News", short_name: "Fonseca News", start_url: "/", display: "standalone", background_color: "#FAFAFA", theme_color: "#0066FF", orientation: "portrait",
      icons: [{ src: "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="100" fill="#0066FF"/><text x="256" y="330" text-anchor="middle" font-family="Georgia,serif" font-weight="800" font-size="220" fill="#fff">FN</text></svg>'), sizes: "512x512", type: "image/svg+xml" }] };
    const blob = new Blob([JSON.stringify(manifest)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    var link = document.querySelector('link[rel="manifest"]');
    if (!link) { link = document.createElement("link"); link.rel = "manifest"; document.head.appendChild(link); }
    link.href = url;
    [["theme-color","#0066FF"],["apple-mobile-web-app-capable","yes"],["apple-mobile-web-app-status-bar-style","default"],["apple-mobile-web-app-title","Fonseca News"]].forEach(function(pair) { var n = pair[0]; var c = pair[1]; var m = document.querySelector('meta[name="' + n + '"]'); if (!m) { m = document.createElement("meta"); m.name = n; document.head.appendChild(m); } m.content = c; });
    document.title = "Fonseca News · João Fonseca";

    var faviconSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#0066FF"/><text x="16" y="22" text-anchor="middle" font-family="Georgia,serif" font-weight="800" font-size="13" fill="#fff">FN</text></svg>';
    var favicon = document.querySelector('link[rel="icon"]');
    if (!favicon) { favicon = document.createElement("link"); favicon.rel = "icon"; document.head.appendChild(favicon); }
    favicon.type = "image/svg+xml";
    favicon.href = "data:image/svg+xml," + encodeURIComponent(faviconSvg);

    var touchIconSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180"><rect width="180" height="180" rx="36" fill="#0066FF"/><text x="90" y="118" text-anchor="middle" font-family="Georgia,serif" font-weight="800" font-size="72" fill="#fff">FN</text></svg>';
    var touchIcon = document.querySelector('link[rel="apple-touch-icon"]');
    if (!touchIcon) { touchIcon = document.createElement("link"); touchIcon.rel = "apple-touch-icon"; document.head.appendChild(touchIcon); }
    touchIcon.href = "data:image/svg+xml," + encodeURIComponent(touchIconSvg);

    var ogTags = [
      ["og:title", "Fonseca News · João Fonseca"],
      ["og:description", "Acompanhe as últimas notícias do João Fonseca, a maior promessa do tênis brasileiro. Ranking, resultados, torneios e mais."],
      ["og:type", "website"],
      ["og:site_name", "Fonseca News"],
      ["og:locale", "pt_BR"],
      ["twitter:card", "summary"],
      ["twitter:title", "Fonseca News · João Fonseca"],
      ["twitter:description", "Todas as notícias do João Fonseca em um só lugar. Ranking ATP, próximos torneios, resultados ao vivo."],
    ];
    ogTags.forEach(function(pair) {
      var prop = pair[0]; var content = pair[1];
      var isOg = prop.startsWith("og:");
      var selector = isOg ? ('meta[property="' + prop + '"]') : ('meta[name="' + prop + '"]');
      var tag = document.querySelector(selector);
      if (!tag) {
        tag = document.createElement("meta");
        if (isOg) tag.setAttribute("property", prop); else tag.name = prop;
        document.head.appendChild(tag);
      }
      tag.content = content;
    });

    var descMeta = document.querySelector('meta[name="description"]');
    if (!descMeta) { descMeta = document.createElement("meta"); descMeta.name = "description"; document.head.appendChild(descMeta); }
    descMeta.content = "Acompanhe as últimas notícias do João Fonseca, tenista brasileiro. Ranking ATP, resultados, próximos torneios e declarações.";

    var GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-J5CD56E1VX";
    if (GA_ID && !document.querySelector('script[src*="googletagmanager"]')) {
      var gaScript = document.createElement("script");
      gaScript.async = true;
      gaScript.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
      document.head.appendChild(gaScript);
      var gaInit = document.createElement("script");
      gaInit.textContent = "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','" + GA_ID + "');";
      document.head.appendChild(gaInit);
    }

    var handler = function(e) { e.preventDefault(); setDeferredPrompt(e); setShowInstallBanner(true); };
    window.addEventListener("beforeinstallprompt", handler);
    if ("serviceWorker" in navigator) { var sw = new Blob(["self.addEventListener('install',e=>{self.skipWaiting()});self.addEventListener('activate',e=>{e.waitUntil(clients.claim())});self.addEventListener('fetch',e=>{e.respondWith(fetch(e.request).catch(()=>new Response('Offline')))});"], { type: "application/javascript" }); navigator.serviceWorker.register(URL.createObjectURL(sw)).catch(function() {}); }
    return function() { window.removeEventListener("beforeinstallprompt", handler); URL.revokeObjectURL(url); };
  }, []);

  var handleInstall = async function() { if (!deferredPrompt) return; deferredPrompt.prompt(); var r = await deferredPrompt.userChoice; if (r.outcome === "accepted") setShowInstallBanner(false); setDeferredPrompt(null); };
  var dismissPopup = function() { setShowInstallPopup(false); setPopupDismissed(true); };

  var loadCache = async function() {
    try { var raw = localStorage.getItem("jf-news-v4"); if (raw) { var c = JSON.parse(raw); if (Date.now() - c.timestamp < CACHE_DURATION_MS && c.news && c.news.length) { setNews(c.news); setNextMatch(c.nextMatch||null); setLastMatch(c.lastMatch||null); setPlayer(c.player||null); setSeason(c.season||null); setIsLive(true); setLastUpdate(new Date(c.timestamp).toISOString()); setCacheExpiresAt(c.timestamp+CACHE_DURATION_MS); setCacheStatus("cached"); return true; } } } catch(e) { console.log(e); }
    return false;
  };
  var saveCache = async function(d) { try { var o = Object.assign({}, d, { timestamp: Date.now() }); localStorage.setItem("jf-news-v4", JSON.stringify(o)); setCacheExpiresAt(o.timestamp+CACHE_DURATION_MS); } catch(e){console.error(e);} };

  var fetchNews = async function() {
    setLoading(true); setCacheStatus("loading");
    try {
      var res = await fetch("/api/news");
      if (!res.ok) throw new Error("" + res.status);
      var p = await res.json();
      if (p && p.news && p.news.length) {
        setNews(p.news); setNextMatch(p.nextMatch||null); setLastMatch(p.lastMatch||null); setPlayer(p.player||null); setSeason(p.season||null);
        setIsLive(true); setLastUpdate(new Date().toISOString()); setCacheStatus("live");
        await saveCache({ news:p.news, nextMatch:p.nextMatch, lastMatch:p.lastMatch, player:p.player, season:p.season });
      } else throw new Error("No data");
    } catch(e) { console.error(e); setCacheStatus("error"); }
    finally { setLoading(false); }
  };

  var handleRefresh = async function() { await fetchNews(); };
  var handleForce = async function() {
    try { await fetch("/api/news", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ force: true }) }); } catch(e) {}
    await fetchNews();
  };

  useEffect(function() { if (initDone.current) return; initDone.current = true; (async function() { if (!(await loadCache())) await fetchNews(); })(); }, []);

  var dn = news.length > 0 ? news : SAMPLE_NEWS;
  var dm = nextMatch || (news.length === 0 ? SAMPLE_NEXT_MATCH : null);
  var dl = lastMatch || (news.length === 0 ? SAMPLE_LAST_MATCH : null);
  var dp = player || (news.length === 0 ? SAMPLE_PLAYER : null);
  var ds = season || (news.length === 0 ? SAMPLE_SEASON : null);
  var ca = cacheExpiresAt && Date.now() < cacheExpiresAt && isLive;

  return (
    <div style={{ minHeight: "100vh", background: BG }}>
      <style>{
        "@import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');" +
        "*{box-sizing:border-box;margin:0;padding:0}" +
        "@keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}" +
        "@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}" +
        "@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}" +
        "@keyframes slideUp{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:translateY(0)}}" +
        "@keyframes fadeInOverlay{from{opacity:0}to{opacity:1}}" +
        "body{background:" + BG + "}"
      }</style>

      <div style={{ height: 3, background: "linear-gradient(90deg, #009739 0%, #009739 50%, #FEDD00 50%, #FEDD00 100%)" }} />

      <header style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid " + BORDER }}>
        <div style={{ height: 2, background: "linear-gradient(90deg, #009739 0%, #009739 50%, #FEDD00 50%, #FEDD00 100%)" }} />
        <div style={{ padding: "4px 16px", background: "#F8F9FA", borderBottom: "1px solid " + BORDER, textAlign: "center" }}>
          <span style={{ fontSize: 9.5, color: TEXT_DIM, fontFamily: "'Inter', -apple-system, sans-serif", fontWeight: 500, letterSpacing: "0.02em" }}>Site independente de fãs · Não oficial</span>
        </div>
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "16px 16px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
              <div style={{ width: 46, height: 46, borderRadius: 14, background: "linear-gradient(135deg, #0052CC, #3B82F6, #60A5FA)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 17, color: "#fff", fontFamily: "'Source Serif 4', Georgia, serif", flexShrink: 0, boxShadow: "0 2px 8px rgba(0,102,255,0.25)" }}>FN</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 20, fontWeight: 800, color: TEXT_PRIMARY, fontFamily: "'Source Serif 4', Georgia, serif", letterSpacing: "-0.03em", whiteSpace: "nowrap" }}>Fonseca News</span>
                  {dp && (
                    <div style={{ display: "flex", alignItems: "center", gap: 3, background: ACCENT_LIGHT, borderRadius: 6, padding: "2px 7px", border: "1px solid #D0E0FD" }}>
                      <span style={{ fontSize: 11.5, fontWeight: 800, color: ACCENT, fontFamily: "'Inter', -apple-system, sans-serif" }}>{"#" + dp.ranking}</span>
                      <span style={{ fontSize: 9, color: TEXT_DIM, fontFamily: "'Inter', -apple-system, sans-serif", fontWeight: 600 }}>ATP</span>
                      {(function() {
                        var val = typeof dp.rankingChange === "number" ? dp.rankingChange : parseInt(String(dp.rankingChange).replace(/[^0-9-]/g, ""), 10);
                        if (!val || val === 0) return null;
                        var up = val > 0;
                        return (
                          <span style={{ fontSize: 9, fontWeight: 700, color: up ? GREEN : RED, fontFamily: "'Inter', -apple-system, sans-serif" }}>
                            {up ? "▲" : "▼"}{Math.abs(val)}
                          </span>
                        );
                      })()}
                    </div>
                  )}
                </div>
                <p style={{ margin: "1px 0 0 0", fontSize: 10.5, color: TEXT_DIM, fontFamily: "'Inter', -apple-system, sans-serif", fontWeight: 500 }}>
                  João Fonseca 🇧🇷
                  {lastUpdate ? (" · " + formatTimeAgo(lastUpdate)) : " · Carregando..."}
                  {dn.length > 0 && (" · " + dn.length + " notícias")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "10px 24px", background: BG_WHITE, borderLeft: "1px solid " + BORDER, borderRight: "1px solid " + BORDER, borderBottom: "1px solid " + BORDER, textAlign: "center" }}>
        <p style={{ margin: 0, fontSize: 12.5, color: TEXT_SECONDARY, fontFamily: "'Source Serif 4', Georgia, serif", fontStyle: "italic", lineHeight: 1.5 }}>
          &quot;{JF_QUOTES[Math.floor(Date.now() / 1800000) % JF_QUOTES.length]}&quot;
        </p>
      </div>
{/* REFRESH BUTTON */}
      <button onClick={handleRefresh} disabled={loading} style={{ position: "fixed", bottom: 16, right: 16, width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: loading ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", justifyContent: "center", cursor: loading ? "default" : "pointer", zIndex: 50, backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", transition: "all 0.2s" }} title="Atualizar dados">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={loading ? { animation: "spin 1s linear infinite" } : {}}>
          <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16" />
        </svg>
      </button>
      <NextDuelCard match={dm} player={dp} isLive={isLive} />

      {showInstallPopup && !popupDismissed && (
        <div onClick={dismissPopup} style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, animation: "fadeInOverlay 0.3s ease" }}>
          <div onClick={function(e) { e.stopPropagation(); }} style={{ background: BG_WHITE, borderRadius: 20, padding: "32px 28px", maxWidth: 360, width: "100%", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", animation: "slideUp 0.4s ease" }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, margin: "0 auto 14px", background: "linear-gradient(135deg, " + ACCENT + ", #3B82F6)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 20, color: "#fff", fontFamily: "'Source Serif 4', Georgia, serif" }}>FN</div>
            <h2 style={{ margin: "0 0 6px", fontSize: 19, fontWeight: 800, color: TEXT_PRIMARY, fontFamily: "'Source Serif 4', Georgia, serif" }}>Instale o Fonseca News</h2>
            <p style={{ margin: "0 0 18px", fontSize: 13.5, color: TEXT_SECONDARY, fontFamily: "'Inter', -apple-system, sans-serif", lineHeight: 1.5 }}>Acompanhe o João Fonseca direto da tela inicial</p>
            <div style={{ background: "#F8F9FA", borderRadius: 10, padding: "12px 14px", marginBottom: 18, textAlign: "left" }}>
              <p style={{ margin: "0 0 6px", fontSize: 11.5, fontWeight: 700, color: TEXT_PRIMARY, fontFamily: "'Inter', -apple-system, sans-serif" }}>📱 Como instalar:</p>
              <p style={{ margin: "0 0 3px", fontSize: 11.5, color: TEXT_SECONDARY, fontFamily: "'Inter', -apple-system, sans-serif", lineHeight: 1.6 }}><strong>iPhone:</strong> Safari → (↑) → &quot;Tela de Início&quot;</p>
              <p style={{ margin: 0, fontSize: 11.5, color: TEXT_SECONDARY, fontFamily: "'Inter', -apple-system, sans-serif", lineHeight: 1.6 }}><strong>Android:</strong> Chrome → (⋮) → &quot;Tela inicial&quot;</p>
            </div>
            {deferredPrompt && <button onClick={function() { handleInstall(); dismissPopup(); }} style={{ width: "100%", background: ACCENT, color: "#fff", border: "none", borderRadius: 10, padding: "12px 0", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Inter', -apple-system, sans-serif", marginBottom: 8 }}>Instalar agora</button>}
            <button onClick={dismissPopup} style={{ width: "100%", background: "none", color: TEXT_DIM, border: "none", padding: "8px 0", fontSize: 12.5, cursor: "pointer", fontFamily: "'Inter', -apple-system, sans-serif" }}>Agora não</button>
          </div>
        </div>
      )}

      {showBio && (
        <div onClick={function() { setShowBio(false); }} style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, animation: "fadeInOverlay 0.3s ease", overflowY: "auto" }}>
          <div onClick={function(e) { e.stopPropagation(); }} style={{ background: BG_WHITE, borderRadius: 20, padding: "28px 24px", maxWidth: 400, width: "100%", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", animation: "slideUp 0.4s ease" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg, " + ACCENT + ", #3B82F6)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16, color: "#fff", fontFamily: "'Source Serif 4', Georgia, serif" }}>FN</div>
                <div>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: TEXT_PRIMARY, fontFamily: "'Source Serif 4', Georgia, serif" }}>João Fonseca</h2>
                  <p style={{ margin: 0, fontSize: 11, color: TEXT_DIM, fontFamily: "'Inter', -apple-system, sans-serif" }}>Tenista profissional 🇧🇷</p>
                </div>
              </div>
              <button onClick={function() { setShowBio(false); }} style={{ background: "none", border: "none", color: TEXT_DIM, fontSize: 20, cursor: "pointer", padding: "4px 8px" }}>✕</button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {[["🎂","21/08/2006"],["📍","Ipanema, Rio de Janeiro"],["📏","1,83m"],["🎾","Destro"],["👟","Profissional desde 2024"],["🏆","Melhor ranking: #24 ATP"]].map(function(pair, i) { return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, background: "#F8F9FA", borderRadius: 6, padding: "4px 10px" }}>
                  <span style={{ fontSize: 12 }}>{pair[0]}</span>
                  <span style={{ fontSize: 11.5, color: TEXT_SECONDARY, fontFamily: "'Inter', -apple-system, sans-serif", fontWeight: 500 }}>{pair[1]}</span>
                </div>
              ); })}
            </div>
            <div style={{ fontSize: 13.5, color: TEXT_SECONDARY, fontFamily: "'Inter', -apple-system, sans-serif", lineHeight: 1.7 }}>
              <p style={{ marginBottom: 12 }}>Nascido em Ipanema, Rio de Janeiro, filho de Roberta e Christiano Fonseca. Começou a jogar tênis aos 4 anos no Country Club do Rio, pertinho de casa. Antes da raquete, jogava futsal.</p>
              <p style={{ marginBottom: 12 }}>Em 2023, com apenas 16 anos, conquistou o US Open Juvenil e se tornou o primeiro brasileiro da história a terminar a temporada como nº1 do ranking mundial de juniores. Também ajudou o Brasil a vencer a Copa Davis Juvenil pela primeira vez.</p>
              <p style={{ marginBottom: 12 }}>Se profissionalizou em 2024, abrindo mão de uma bolsa na Universidade da Virginia. Logo na estreia como profissional no Rio Open, aplicou um impressionante 6-0 no primeiro set contra Arthur Fils, então top 40 do mundo.</p>
              <p style={{ marginBottom: 12 }}>Em janeiro de 2025, derrotou Andrey Rublev (top 10) em sua estreia no Australian Open — se tornando o primeiro adolescente desde 2002 a vencer um cabeça-de-chave do top 10 na primeira rodada de um Grand Slam.</p>
              <p style={{ marginBottom: 12 }}>Conquistou o ATP 250 de Buenos Aires em fevereiro de 2025, tornando-se o brasileiro mais jovem e o 7º mais jovem do mundo a vencer um título ATP. Em outubro de 2025, fez história novamente ao ser o primeiro brasileiro a ganhar um ATP 500, em Basel.</p>
              <p style={{ marginBottom: 0 }}>Comparado a lendas na mesma idade: aos 19 anos, João já tem mais títulos ATP que Federer, Djokovic e Nadal tinham. Apenas Carlos Alcaraz estava à frente nessa faixa etária. É hoje o nº1 do Brasil e uma das maiores promessas do tênis mundial.</p>
            </div>
            <div style={{ marginTop: 16, padding: "10px 12px", background: "#F8F9FA", borderRadius: 8, display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
              <span style={{ fontSize: 13 }}>📸</span>
              <a href="https://www.instagram.com/joaoffonseca" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: ACCENT, fontFamily: "'Inter', -apple-system, sans-serif", fontWeight: 600, textDecoration: "none" }}>@joaoffonseca</a>
              <span style={{ fontSize: 11, color: TEXT_DIM, fontFamily: "'Inter', -apple-system, sans-serif" }}>· 1M seguidores</span>
            </div>
          </div>
        </div>
      )}

      {showTitles && (
        <div onClick={function() { setShowTitles(false); }} style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, animation: "fadeInOverlay 0.3s ease", overflowY: "auto" }}>
          <div onClick={function(e) { e.stopPropagation(); }} style={{ background: BG_WHITE, borderRadius: 20, padding: "28px 24px", maxWidth: 420, width: "100%", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", animation: "slideUp 0.4s ease" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: TEXT_PRIMARY, fontFamily: "'Source Serif 4', Georgia, serif" }}>🏆 Conquistas</h2>
              <button onClick={function() { setShowTitles(false); }} style={{ background: "none", border: "none", color: TEXT_DIM, fontSize: 20, cursor: "pointer", padding: "4px 8px" }}>✕</button>
            </div>
            <p style={{ margin: "0 0 16px", fontSize: 13, color: TEXT_SECONDARY, fontFamily: "'Inter', -apple-system, sans-serif" }}>8 títulos na carreira · 2 ATP Tour · 3 Challengers · 1 NextGen Finals · 1 Duplas · 1 Juvenil</p>
            <div style={{ marginBottom: 16 }}>
              <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: ACCENT, fontFamily: "'Inter', -apple-system, sans-serif" }}>ATP Tour</p>
              {[
                { emoji: "🥇", title: "ATP 500 Basel", date: "Out 2025", surface: "Dura (indoor)", final_: "vs A. Davidovich Fokina", score: "6-3 6-4", note: "1º brasileiro a ganhar um ATP 500" },
                { emoji: "🥇", title: "ATP 250 Buenos Aires", date: "Fev 2025", surface: "Saibro", final_: "vs F. Cerúndolo", score: "6-4 7-6(1)", note: "Brasileiro mais jovem a ganhar um ATP" },
              ].map(function(t, i) { return (
                <div key={i} style={{ padding: "10px 12px", background: "#F8F9FA", borderRadius: 10, marginBottom: 6, borderLeft: "3px solid " + ACCENT }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY, fontFamily: "'Source Serif 4', Georgia, serif" }}>{t.emoji} {t.title}</span>
                    <span style={{ fontSize: 11, color: TEXT_DIM, fontFamily: "'Inter', -apple-system, sans-serif" }}>{t.date}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: TEXT_SECONDARY, fontFamily: "'Inter', -apple-system, sans-serif", lineHeight: 1.5 }}>{t.surface} · Final: {t.final_} · {t.score}</p>
                  {t.note && <p style={{ margin: "4px 0 0", fontSize: 11, color: ACCENT, fontFamily: "'Inter', -apple-system, sans-serif", fontWeight: 600 }}>{t.note}</p>}
                </div>
              ); })}
            </div>
            <div style={{ marginBottom: 16 }}>
              <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#E8734A", fontFamily: "'Inter', -apple-system, sans-serif" }}>Challengers</p>
              {[
                { title: "Challenger 175 Phoenix", date: "Mar 2025", surface: "Dura", final_: "vs A. Bublik", score: "7-6(5) 7-6(1)" },
                { title: "Challenger 125 Canberra", date: "Jan 2025", surface: "Dura", final_: "vs E. Quinn", score: "6-4 6-4" },
                { title: "Challenger 75 Lexington", date: "Ago 2024", surface: "Dura", final_: "vs Li Tu", score: "6-1 6-4", note: "1º título profissional · Sem perder sets" },
              ].map(function(t, i) { return (
                <div key={i} style={{ padding: "10px 12px", background: "#FFF8F5", borderRadius: 10, marginBottom: 6, borderLeft: "3px solid #E8734A" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY, fontFamily: "'Source Serif 4', Georgia, serif" }}>🎯 {t.title}</span>
                    <span style={{ fontSize: 11, color: TEXT_DIM, fontFamily: "'Inter', -apple-system, sans-serif" }}>{t.date}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: TEXT_SECONDARY, fontFamily: "'Inter', -apple-system, sans-serif" }}>{t.surface} · Final: {t.final_} · {t.score}</p>
                  {t.note && <p style={{ margin: "4px 0 0", fontSize: 11, color: "#E8734A", fontFamily: "'Inter', -apple-system, sans-serif", fontWeight: 600 }}>{t.note}</p>}
                </div>
              ); })}
            </div>
            <div>
              <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#7C3AED", fontFamily: "'Inter', -apple-system, sans-serif" }}>Outros destaques</p>
              {[
                { emoji: "⭐", title: "NextGen ATP Finals", date: "Dez 2024", detail: "Torneio sub-20 · Final: vs L. Tien · 3-1 (virada) · Campanha invicta" },
                { emoji: "🎾", title: "ATP Duplas Rio Open", date: "Fev 2026", detail: "Parceria com Marcelo Melo · 1º título de duplas" },
                { emoji: "🌟", title: "US Open Juvenil", date: "2023", detail: "Final: vs L. Tien · Nº1 mundial juvenil" },
                { emoji: "🇧🇷", title: "Copa Davis Juvenil", date: "2023", detail: "1ª conquista brasileira na história" },
              ].map(function(t, i) { return (
                <div key={i} style={{ padding: "8px 12px", background: "#F8F5FF", borderRadius: 10, marginBottom: 6, borderLeft: "3px solid #7C3AED" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY, fontFamily: "'Source Serif 4', Georgia, serif" }}>{t.emoji} {t.title}</span>
                    <span style={{ fontSize: 11, color: TEXT_DIM, fontFamily: "'Inter', -apple-system, sans-serif" }}>{t.date}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 11.5, color: TEXT_SECONDARY, fontFamily: "'Inter', -apple-system, sans-serif" }}>{t.detail}</p>
                </div>
              ); })}
            </div>
          </div>
        </div>
      )}

      <main style={{ maxWidth: 680, margin: "0 auto", background: BG_WHITE, borderLeft: "1px solid " + BORDER, borderRight: "1px solid " + BORDER, minHeight: "70vh" }}>
        {loading && news.length === 0 && <Skeleton />}
        {dn.length > 0 && !(loading && news.length === 0) && (
          <div>{buildFeed(dn, ds, dl)}</div>
        )}
        <div style={{ borderTop: "1px solid " + BORDER, padding: "24px 24px 40px" }}>
          <div onClick={function() { setShowTitles(true); }} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, flexWrap: "wrap", marginBottom: 20, cursor: "pointer", padding: "10px 16px", background: "#F8F9FA", borderRadius: 10, border: "1px solid " + BORDER, transition: "background 0.15s" }}>
            {[["🏆","2 títulos ATP"],["🎯","3 Challengers"],["🇧🇷","Nº1 do Brasil"],["⭐","NextGen Champion"]].map(function(pair, i) { return (
              <span key={i} style={{ fontSize: 11, color: TEXT_SECONDARY, fontFamily: "'Inter', -apple-system, sans-serif", fontWeight: 500 }}>{pair[0]} {pair[1]}</span>
            ); })}
            <span style={{ fontSize: 10, color: ACCENT, fontFamily: "'Inter', -apple-system, sans-serif", fontWeight: 600 }}>Ver todos →</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 20 }}>
            <button onClick={function() { setShowBio(true); }} style={{ background: "none", border: "1px solid " + BORDER, borderRadius: 8, padding: "7px 16px", fontSize: 11.5, color: TEXT_SECONDARY, cursor: "pointer", fontFamily: "'Inter', -apple-system, sans-serif", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 5 }}>👤 Sobre</button>
            <button onClick={function() { setShowTitles(true); }} style={{ background: "none", border: "1px solid " + BORDER, borderRadius: 8, padding: "7px 16px", fontSize: 11.5, color: TEXT_SECONDARY, cursor: "pointer", fontFamily: "'Inter', -apple-system, sans-serif", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 5 }}>🏆 Conquistas</button>
            <a href="https://www.instagram.com/joaoffonseca" target="_blank" rel="noopener noreferrer" style={{ border: "1px solid " + BORDER, borderRadius: 8, padding: "7px 16px", fontSize: 11.5, color: TEXT_SECONDARY, fontFamily: "'Inter', -apple-system, sans-serif", fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5 }}>📸 Instagram</a>
          </div>
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <p style={{ margin: 0, fontSize: 10.5, color: TEXT_DIM, fontFamily: "'Inter', -apple-system, sans-serif" }}>📱 iPhone: Safari → (↑) → &quot;Tela de Início&quot; · Android: Chrome → (⋮) → &quot;Tela inicial&quot;</p>
          </div>
          <div style={{ borderTop: "1px solid " + BORDER, paddingTop: 14 }}>
            <p style={{ fontSize: 10, color: "#bbb", fontFamily: "'Inter', -apple-system, sans-serif", lineHeight: 1.6, maxWidth: 440, margin: "0 auto", textAlign: "center" }}>Fonseca News é um site independente de fãs, sem vínculo oficial com João Fonseca, sua equipe ou a ATP. Notícias agregadas de fontes públicas com devidos créditos. Marcas e nomes pertencem aos respectivos proprietários.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
