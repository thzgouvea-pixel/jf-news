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

// ===== INLINE INFO BARS (thin, between news) =====
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
      {season.titles > 0 && <>
        <span style={{ fontSize: 10, color: TEXT_DIM }}>·</span>
        <span style={{ fontSize: 12, fontFamily: "'Inter', -apple-system, sans-serif" }}>🏆 <span style={{ fontWeight: 700, color: "#E9A820" }}>{season.titles}</span></span>
      </>}
    </div>
  );
};

const LastMatchBar = ({ match }) => {
  if (!match) return null;
  const w = match.result === "V";
  return (
    <div style={{ padding: "8px 24px", background: w ? "#F7FDFA" : "#FFFAFA", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
      <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: TEXT_DIM, fontFamily: "'Inter', -apple-system, sans-serif" }}>
        Última partida
      </span>
      <span style={{ fontSize: 10, fontWeight: 700, color: w ? GREEN : RED, fontFamily: "'Inter', -apple-system, sans-serif", background: w ? "#EAFAF3" : "#FEF0F0", padding: "1px 6px", borderRadius: 3 }}>
        {w ? "V" : "D"}
      </span>
      <span style={{ fontSize: 12.5, fontWeight: 700, color: TEXT_PRIMARY, fontFamily: "'Source Serif 4', Georgia, serif" }}>
        Fonseca <span style={{ color: w ? GREEN : RED }}>{match.score}</span> {match.opponent}
      </span>
      <span style={{ fontSize: 10.5, color: TEXT_DIM, fontFamily: "'Inter', -apple-system, sans-serif" }}>
        {match.tournament}{match.round ? ` · ${match.round}` : ""}
      </span>
    </div>
  );
};

// ===== MAIN COMPONENTS =====
const NextMatchBanner = ({ match, isLive }) => {
  if (!match) return null;
  const sc = surfaceColorMap[match.surface] || ACCENT;
  const se = surfaceEmoji[match.surface] || "🎾";
  return (
    <div style={{ maxWidth: 680, margin: "0 auto", background: `linear-gradient(135deg, ${sc}08, ${sc}15)`, borderBottom: `1px solid ${sc}30`, borderLeft: `1px solid ${BORDER}`, borderRight: `1px solid ${BORDER}`, padding: "10px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ background: `${sc}18`, border: `1.5px solid ${sc}40`, borderRadius: 6, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{se}</div>
          <div>
            <p style={{ margin: 0, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: sc, fontFamily: "'Inter', -apple-system, sans-serif" }}>Próxima partida</p>
            <p style={{ margin: "1px 0 0", fontSize: 13.5, fontWeight: 700, color: TEXT_PRIMARY, fontFamily: "'Source Serif 4', Georgia, serif" }}>{match.tournament_category || ""}</p>
            {match.tournament_name && <p style={{ margin: "1px 0 0", fontSize: 10.5, color: TEXT_SECONDARY, fontFamily: "'Inter', -apple-system, sans-serif", fontWeight: 500 }}>{match.tournament_name}</p>}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, background: `${sc}15`, borderRadius: 5, padding: "2px 8px" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: sc }} />
            <span style={{ fontSize: 10.5, fontWeight: 600, color: sc, fontFamily: "'Inter', -apple-system, sans-serif" }}>{match.surface}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: TEXT_PRIMARY, fontFamily: "'Inter', -apple-system, sans-serif" }}>{match.city}{match.country ? `, ${match.country}` : ""}</span>
            <span style={{ fontSize: 10.5, color: TEXT_DIM, fontFamily: "'Inter', -apple-system, sans-serif" }}>{formatMatchDate(match.date)}{match.round ? ` · ${match.round}` : ""}</span>
          </div>
        </div>
      </div>
      {!isLive && <p style={{ margin: "4px 0 0 36px", fontSize: 10, color: TEXT_DIM, fontStyle: "italic", fontFamily: "'Inter', -apple-system, sans-serif" }}>Dados de exemplo</p>}
    </div>
  );
};

const Skeleton = () => (<div>{[...Array(5)].map((_, i) => (<div key={i} style={{ background: BG_WHITE, padding: "20px 24px", borderBottom: `1px solid ${BORDER}`, animation: "pulse 1.8s ease-in-out infinite", animationDelay: `${i * .12}s` }}><div style={{ display: "flex", gap: 8, marginBottom: 10 }}><div style={{ height: 20, width: 70, background: "#f0f0f0", borderRadius: 4 }} /><div style={{ height: 20, width: 90, background: "#f5f5f5", borderRadius: 4 }} /></div><div style={{ height: 18, width: "85%", background: "#f0f0f0", borderRadius: 4, marginBottom: 8 }} /><div style={{ height: 14, width: "60%", background: "#f5f5f5", borderRadius: 4 }} /></div>))}</div>);

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
      style={{ display: "flex", gap: hasImg ? 14 : 0, textDecoration: "none", background: h && hasUrl ? "#F8F9FA" : BG_WHITE, padding: hasImg ? "16px 24px" : "16px 24px 16px 20px", borderBottom: `1px solid ${BORDER}`, borderLeft: hasImg ? "none" : `3px solid ${cat.color}`, transition: "background 0.15s", animation: "fadeIn 0.35s ease forwards", animationDelay: `${index * 0.04}s`, opacity: 0, cursor: hasUrl ? "pointer" : "default", alignItems: "flex-start" }}>
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

// Build feed with inline bars inserted between news
const buildFeed = (newsItems, season, lastMatch) => {
  const elements = [];
  const inserts = [
    { at: 3, component: <SeasonBar key="season-bar" season={season} /> },
    { at: 6, component: <LastMatchBar key="last-match-bar" match={lastMatch} /> },
  ];
  newsItems.forEach((item, i) => {
    elements.push(<NewsCard key={`news-${i}`} item={item} index={i} />);
    const insert = inserts.find(ins => ins.at === i + 1);
    if (insert) elements.push(insert.component);
  });
  // If less than 3 news, still show bars at the end
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
  const initDone = useRef(false);

  useEffect(() => { if (popupDismissed) return; const t = setTimeout(() => setShowInstallPopup(true), 15000); return () => clearTimeout(t); }, [popupDismissed]);
  useEffect(() => { if (!cacheExpiresAt) return; const tick = () => setTimeLeft(Math.max(0, cacheExpiresAt - Date.now())); tick(); const iv = setInterval(tick, 15000); return () => clearInterval(iv); }, [cacheExpiresAt]);

  // PWA
  useEffect(() => {
    const manifest = { name: "João Fonseca News", short_name: "JF News", start_url: "/", display: "standalone", background_color: "#FAFAFA", theme_color: "#0066FF", orientation: "portrait",
      icons: [{ src: "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="100" fill="#0066FF"/><text x="256" y="330" text-anchor="middle" font-family="Georgia,serif" font-weight="800" font-size="240" fill="#fff">JF</text></svg>'), sizes: "512x512", type: "image/svg+xml" }] };
    const blob = new Blob([JSON.stringify(manifest)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    let link = document.querySelector('link[rel="manifest"]');
    if (!link) { link = document.createElement("link"); link.rel = "manifest"; document.head.appendChild(link); }
    link.href = url;
    [["theme-color","#0066FF"],["apple-mobile-web-app-capable","yes"],["apple-mobile-web-app-status-bar-style","default"],["apple-mobile-web-app-title","JF News"]].forEach(([n,c]) => { let m = document.querySelector(`meta[name="${n}"]`); if (!m) { m = document.createElement("meta"); m.name = n; document.head.appendChild(m); } m.content = c; });
    document.title = "JF News · João Fonseca";

    // Favicon
    const faviconSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#0066FF"/><text x="16" y="22" text-anchor="middle" font-family="Georgia,serif" font-weight="800" font-size="16" fill="#fff">JF</text></svg>';
    let favicon = document.querySelector('link[rel="icon"]');
    if (!favicon) { favicon = document.createElement("link"); favicon.rel = "icon"; document.head.appendChild(favicon); }
    favicon.type = "image/svg+xml";
    favicon.href = "data:image/svg+xml," + encodeURIComponent(faviconSvg);

    // Apple touch icon
    const touchIconSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180"><rect width="180" height="180" rx="36" fill="#0066FF"/><text x="90" y="118" text-anchor="middle" font-family="Georgia,serif" font-weight="800" font-size="84" fill="#fff">JF</text></svg>';
    let touchIcon = document.querySelector('link[rel="apple-touch-icon"]');
    if (!touchIcon) { touchIcon = document.createElement("link"); touchIcon.rel = "apple-touch-icon"; document.head.appendChild(touchIcon); }
    touchIcon.href = "data:image/svg+xml," + encodeURIComponent(touchIconSvg);

    // Open Graph meta tags (WhatsApp, Twitter, Facebook previews)
    const ogTags = [
      ["og:title", "JF News · João Fonseca"],
      ["og:description", "Acompanhe as últimas notícias do João Fonseca, a maior promessa do tênis brasileiro. Ranking, resultados, torneios e mais."],
      ["og:type", "website"],
      ["og:site_name", "JF News"],
      ["og:locale", "pt_BR"],
      ["twitter:card", "summary"],
      ["twitter:title", "JF News · João Fonseca"],
      ["twitter:description", "Todas as notícias do João Fonseca em um só lugar. Ranking ATP, próximos torneios, resultados ao vivo."],
    ];
    ogTags.forEach(([prop, content]) => {
      const isOg = prop.startsWith("og:");
      const selector = isOg ? `meta[property="${prop}"]` : `meta[name="${prop}"]`;
      let tag = document.querySelector(selector);
      if (!tag) {
        tag = document.createElement("meta");
        if (isOg) tag.setAttribute("property", prop); else tag.name = prop;
        document.head.appendChild(tag);
      }
      tag.content = content;
    });

    // Description meta
    let descMeta = document.querySelector('meta[name="description"]');
    if (!descMeta) { descMeta = document.createElement("meta"); descMeta.name = "description"; document.head.appendChild(descMeta); }
    descMeta.content = "Acompanhe as últimas notícias do João Fonseca, tenista brasileiro. Ranking ATP, resultados, próximos torneios e declarações.";
    // Google Analytics (replace GA_ID with your ID, e.g. "G-XXXXXXXXXX")
    const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "";
    if (GA_ID && !document.querySelector(`script[src*="googletagmanager"]`)) {
      const gaScript = document.createElement("script");
      gaScript.async = true;
      gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
      document.head.appendChild(gaScript);
      const gaInit = document.createElement("script");
      gaInit.textContent = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`;
      document.head.appendChild(gaInit);
    }

    const handler = (e) => { e.preventDefault(); setDeferredPrompt(e); setShowInstallBanner(true); };
    window.addEventListener("beforeinstallprompt", handler);
    if ("serviceWorker" in navigator) { const sw = new Blob([`self.addEventListener('install',e=>{self.skipWaiting()});self.addEventListener('activate',e=>{e.waitUntil(clients.claim())});self.addEventListener('fetch',e=>{e.respondWith(fetch(e.request).catch(()=>new Response('Offline')))});`], { type: "application/javascript" }); navigator.serviceWorker.register(URL.createObjectURL(sw)).catch(() => {}); }
    return () => { window.removeEventListener("beforeinstallprompt", handler); URL.revokeObjectURL(url); };
  }, []);

  const handleInstall = async () => { if (!deferredPrompt) return; deferredPrompt.prompt(); const r = await deferredPrompt.userChoice; if (r.outcome === "accepted") setShowInstallBanner(false); setDeferredPrompt(null); };
  const dismissPopup = () => { setShowInstallPopup(false); setPopupDismissed(true); };

  const loadCache = async () => {
    try { const raw = localStorage.getItem("jf-news-v4"); if (raw) { const c = JSON.parse(raw); if (Date.now() - c.timestamp < CACHE_DURATION_MS && c.news?.length) { setNews(c.news); setNextMatch(c.nextMatch||null); setLastMatch(c.lastMatch||null); setPlayer(c.player||null); setSeason(c.season||null); setIsLive(true); setLastUpdate(new Date(c.timestamp).toISOString()); setCacheExpiresAt(c.timestamp+CACHE_DURATION_MS); setCacheStatus("cached"); return true; } } } catch(e) { console.log(e); }
    return false;
  };
  const saveCache = async (d) => { try { const o = {...d, timestamp: Date.now()}; localStorage.setItem("jf-news-v4", JSON.stringify(o)); setCacheExpiresAt(o.timestamp+CACHE_DURATION_MS); } catch(e){console.error(e);} };

  const fetchNews = async () => {
    setLoading(true); setCacheStatus("loading");
    try {
      const res = await fetch("/api/news", { method: "POST", headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 4000, tools: [{ type: "web_search_20250305", name: "web_search" }],
          messages: [{ role: "user", content: `Hoje é ${new Date().toLocaleDateString("pt-BR")}. Busque TODAS as informações mais recentes sobre João Fonseca, tenista brasileiro. Faça MÚLTIPLAS buscas: "João Fonseca tênis hoje", "João Fonseca notícias", "João Fonseca ranking ATP", "João Fonseca próximo torneio". Priorize notícias das últimas 48 horas. Busque em sites como ESPN, GE, UOL, Lance, O Tempo, CNN Brasil, Olympics.com, Tenis News, ATP Tour.

Responda APENAS com JSON (sem markdown, sem backticks):
{
  "player": { "ranking": numero, "rankingChange": N (positivo = subiu, negativo = caiu) },
  "season": { "wins": N, "losses": N, "titles": N, "year": 2026 },
  "lastMatch": { "result": "V" ou "D", "score": "6-3 6-4", "opponent": "T. Sobrenome", "tournament": "nome curto", "round": "R1/R2/QF/SF/F" },
  "nextMatch": { "tournament_category": "ATP 250/500/Masters 1000/Grand Slam", "tournament_name": "nome", "surface": "Saibro/Dura/Grama", "city": "cidade", "country": "país", "date": "YYYY-MM-DD ou vazio", "round": "fase ou vazio" },
  "news": [{ "title": "em português", "summary": "1-2 frases", "source": "veículo", "url": "OBRIGATÓRIO: URL completa (https://...) da notícia encontrada na busca. Nunca vazio.", "image": "URL da imagem/thumbnail ou vazio", "date": "ISO", "category": "Torneio/Resultado/Treino/Declaração/Ranking/Notícia" }]
}
10-15 notícias, mais recente primeiro. IMPORTANTE: faça várias buscas web para encontrar o máximo de notícias recentes. Cada notícia DEVE ter URL real. APENAS JSON.` }] }) });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      let txt = ""; if (data.content) for (const b of data.content) if (b.type === "text" && b.text) txt += b.text;
      let c = txt.trim().replace(/```json\s*/g,"").replace(/```\s*/g,"").trim();
      let p; const os = c.indexOf("{"), oe = c.lastIndexOf("}");
      if (os !== -1 && oe !== -1) p = JSON.parse(c.substring(os, oe+1));
      if (p?.news?.length) {
        const sortedNews = [...p.news].sort((a, b) => new Date(b.date) - new Date(a.date));
        setNews(sortedNews); setNextMatch(p.nextMatch||null); setLastMatch(p.lastMatch||null); setPlayer(p.player||null); setSeason(p.season||null);
        setIsLive(true); setLastUpdate(new Date().toISOString()); setCacheStatus("live");
        await saveCache({ news:sortedNews, nextMatch:p.nextMatch, lastMatch:p.lastMatch, player:p.player, season:p.season });
      } else throw new Error("No data");
    } catch(e) { console.error(e); setCacheStatus("error"); }
    finally { setLoading(false); }
  };

  const handleRefresh = async () => { if (cacheExpiresAt && Date.now() < cacheExpiresAt && news.length > 0) return; await fetchNews(); };
  const handleForce = async () => await fetchNews();

  useEffect(() => { if (initDone.current) return; initDone.current = true; (async () => { if (!(await loadCache())) await fetchNews(); })(); }, []);

  const dn = news.length > 0 ? news : SAMPLE_NEWS;
  const dm = nextMatch || (news.length === 0 ? SAMPLE_NEXT_MATCH : null);
  const dl = lastMatch || (news.length === 0 ? SAMPLE_LAST_MATCH : null);
  const dp = player || (news.length === 0 ? SAMPLE_PLAYER : null);
  const ds = season || (news.length === 0 ? SAMPLE_SEASON : null);
  const ca = cacheExpiresAt && Date.now() < cacheExpiresAt && isLive;

  const stMsg = () => { if (loading) return "Buscando..."; if (ca && timeLeft !== null) return `Ao vivo · Atualiza em ${formatMinLeft(timeLeft)}`; if (isLive) return "Cache expirado"; return "Preview"; };
  const stClr = () => loading ? "#E9A820" : ca ? GREEN : isLive ? "#E9A820" : ACCENT;

  return (
    <div style={{ minHeight: "100vh", background: BG }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}
        @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeInOverlay{from{opacity:0}to{opacity:1}}
        body{background:${BG}}
      `}</style>

      {/* BRAZILIAN STRIPE */}
      <div style={{ height: 3, background: "linear-gradient(90deg, #009739 0%, #009739 50%, #FEDD00 50%, #FEDD00 100%)" }} />

      {/* HEADER */}
      <header style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ height: 2, background: "linear-gradient(90deg, #009739 0%, #009739 50%, #FEDD00 50%, #FEDD00 100%)" }} />
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "12px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg, #0052CC, #3B82F6, #60A5FA)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16, color: "#fff", fontFamily: "'Source Serif 4', Georgia, serif", flexShrink: 0, boxShadow: "0 2px 8px rgba(0,102,255,0.25)" }}>JF</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: TEXT_PRIMARY, fontFamily: "'Source Serif 4', Georgia, serif", letterSpacing: "-0.03em", whiteSpace: "nowrap" }}>João Fonseca 🇧🇷</span>
                  {dp && (
                    <div style={{ display: "flex", alignItems: "center", gap: 3, background: ACCENT_LIGHT, borderRadius: 6, padding: "2px 7px", border: "1px solid #D0E0FD" }}>
                      <span style={{ fontSize: 11.5, fontWeight: 800, color: ACCENT, fontFamily: "'Inter', -apple-system, sans-serif" }}>#{dp.ranking}</span>
                      <span style={{ fontSize: 9, color: TEXT_DIM, fontFamily: "'Inter', -apple-system, sans-serif", fontWeight: 600 }}>ATP</span>
                      {(() => {
                        const val = typeof dp.rankingChange === "number" ? dp.rankingChange : parseInt(String(dp.rankingChange).replace(/[^0-9-]/g, ""), 10);
                        if (!val || val === 0) return null;
                        const up = val > 0;
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
                  {lastUpdate ? formatTimeAgo(lastUpdate) : "Carregando..."}
                  {dn.length > 0 && ` · ${dn.length} notícias`}
                </p>
              </div>
            </div>
            <button onClick={handleRefresh} disabled={loading}
              style={{ background: loading ? "#f5f5f5" : ACCENT, border: "none", borderRadius: 10, padding: "8px 12px", color: loading ? TEXT_DIM : "#fff", cursor: loading ? "not-allowed" : "pointer", fontSize: 12, fontFamily: "'Inter', -apple-system, sans-serif", fontWeight: 600, display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
              <span style={{ display: "inline-block", animation: loading ? "spin 1s linear infinite" : "none", fontSize: 13 }}>↻</span>
              {loading ? "..." : "Atualizar"}
            </button>
          </div>
        </div>
      </header>

      {/* INSPIRATIONAL QUOTE */}
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "10px 24px", background: BG_WHITE, borderLeft: `1px solid ${BORDER}`, borderRight: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`, textAlign: "center" }}>
        <p style={{ margin: 0, fontSize: 12.5, color: TEXT_SECONDARY, fontFamily: "'Source Serif 4', Georgia, serif", fontStyle: "italic", lineHeight: 1.5 }}>
          "{JF_QUOTES[Math.floor(Date.now() / 1800000) % JF_QUOTES.length]}"
        </p>
      </div>

      {/* NEXT MATCH */}
      <NextMatchBanner match={dm} isLive={isLive} />

      {/* INSTALL POPUP */}
      {showInstallPopup && !popupDismissed && (
        <div onClick={dismissPopup} style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, animation: "fadeInOverlay 0.3s ease" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: BG_WHITE, borderRadius: 20, padding: "32px 28px", maxWidth: 360, width: "100%", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", animation: "slideUp 0.4s ease" }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, margin: "0 auto 14px", background: `linear-gradient(135deg, ${ACCENT}, #3B82F6)`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 22, color: "#fff", fontFamily: "'Source Serif 4', Georgia, serif" }}>JF</div>
            <h2 style={{ margin: "0 0 6px", fontSize: 19, fontWeight: 800, color: TEXT_PRIMARY, fontFamily: "'Source Serif 4', Georgia, serif" }}>Instale o JF News</h2>
            <p style={{ margin: "0 0 18px", fontSize: 13.5, color: TEXT_SECONDARY, fontFamily: "'Inter', -apple-system, sans-serif", lineHeight: 1.5 }}>Acompanhe o João Fonseca direto da tela inicial</p>
            <div style={{ background: "#F8F9FA", borderRadius: 10, padding: "12px 14px", marginBottom: 18, textAlign: "left" }}>
              <p style={{ margin: "0 0 6px", fontSize: 11.5, fontWeight: 700, color: TEXT_PRIMARY, fontFamily: "'Inter', -apple-system, sans-serif" }}>📱 Como instalar:</p>
              <p style={{ margin: "0 0 3px", fontSize: 11.5, color: TEXT_SECONDARY, fontFamily: "'Inter', -apple-system, sans-serif", lineHeight: 1.6 }}><strong>iPhone:</strong> Safari → (↑) → "Tela de Início"</p>
              <p style={{ margin: 0, fontSize: 11.5, color: TEXT_SECONDARY, fontFamily: "'Inter', -apple-system, sans-serif", lineHeight: 1.6 }}><strong>Android:</strong> Chrome → (⋮) → "Tela inicial"</p>
            </div>
            {deferredPrompt && <button onClick={() => { handleInstall(); dismissPopup(); }} style={{ width: "100%", background: ACCENT, color: "#fff", border: "none", borderRadius: 10, padding: "12px 0", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Inter', -apple-system, sans-serif", marginBottom: 8 }}>Instalar agora</button>}
            <button onClick={dismissPopup} style={{ width: "100%", background: "none", color: TEXT_DIM, border: "none", padding: "8px 0", fontSize: 12.5, cursor: "pointer", fontFamily: "'Inter', -apple-system, sans-serif" }}>Agora não</button>
          </div>
        </div>
      )}

      {/* BIO POPUP */}
      {showBio && (
        <div onClick={() => setShowBio(false)} style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, animation: "fadeInOverlay 0.3s ease", overflowY: "auto" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: BG_WHITE, borderRadius: 20, padding: "28px 24px", maxWidth: 400, width: "100%", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", animation: "slideUp 0.4s ease" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg, ${ACCENT}, #3B82F6)`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 17, color: "#fff", fontFamily: "'Source Serif 4', Georgia, serif" }}>JF</div>
                <div>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: TEXT_PRIMARY, fontFamily: "'Source Serif 4', Georgia, serif" }}>João Fonseca</h2>
                  <p style={{ margin: 0, fontSize: 11, color: TEXT_DIM, fontFamily: "'Inter', -apple-system, sans-serif" }}>Tenista profissional 🇧🇷</p>
                </div>
              </div>
              <button onClick={() => setShowBio(false)} style={{ background: "none", border: "none", color: TEXT_DIM, fontSize: 20, cursor: "pointer", padding: "4px 8px" }}>✕</button>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {[["🎂","21/08/2006"],["📍","Ipanema, Rio de Janeiro"],["📏","1,83m"],["🎾","Destro"],["👟","Profissional desde 2024"],["🏆","Melhor ranking: #24 ATP"]].map(([icon, text], i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, background: "#F8F9FA", borderRadius: 6, padding: "4px 10px" }}>
                  <span style={{ fontSize: 12 }}>{icon}</span>
                  <span style={{ fontSize: 11.5, color: TEXT_SECONDARY, fontFamily: "'Inter', -apple-system, sans-serif", fontWeight: 500 }}>{text}</span>
                </div>
              ))}
            </div>

            <div style={{ fontSize: 13.5, color: TEXT_SECONDARY, fontFamily: "'Inter', -apple-system, sans-serif", lineHeight: 1.7 }}>
              <p style={{ marginBottom: 12 }}>
                Nascido em Ipanema, Rio de Janeiro, filho de Roberta e Christiano Fonseca. Começou a jogar tênis aos 4 anos no Country Club do Rio, pertinho de casa. Antes da raquete, jogava futsal.
              </p>
              <p style={{ marginBottom: 12 }}>
                Em 2023, com apenas 16 anos, conquistou o US Open Juvenil e se tornou o primeiro brasileiro da história a terminar a temporada como nº1 do ranking mundial de juniores. Também ajudou o Brasil a vencer a Copa Davis Juvenil pela primeira vez.
              </p>
              <p style={{ marginBottom: 12 }}>
                Se profissionalizou em 2024, abrindo mão de uma bolsa na Universidade da Virginia. Logo na estreia como profissional no Rio Open, aplicou um impressionante 6-0 no primeiro set contra Arthur Fils, então top 40 do mundo.
              </p>
              <p style={{ marginBottom: 12 }}>
                Em janeiro de 2025, derrotou Andrey Rublev (top 10) em sua estreia no Australian Open — se tornando o primeiro adolescente desde 2002 a vencer um cabeça-de-chave do top 10 na primeira rodada de um Grand Slam.
              </p>
              <p style={{ marginBottom: 12 }}>
                Conquistou o ATP 250 de Buenos Aires em fevereiro de 2025, tornando-se o brasileiro mais jovem e o 7º mais jovem do mundo a vencer um título ATP. Em outubro de 2025, fez história novamente ao ser o primeiro brasileiro a ganhar um ATP 500, em Basel.
              </p>
              <p style={{ marginBottom: 0 }}>
                Comparado a lendas na mesma idade: aos 19 anos, João já tem mais títulos ATP que Federer, Djokovic e Nadal tinham. Apenas Carlos Alcaraz estava à frente nessa faixa etária. É hoje o nº1 do Brasil e uma das maiores promessas do tênis mundial.
              </p>
            </div>

            <div style={{ marginTop: 16, padding: "10px 12px", background: "#F8F9FA", borderRadius: 8, display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
              <span style={{ fontSize: 13 }}>📸</span>
              <a href="https://www.instagram.com/joaoffonseca" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: ACCENT, fontFamily: "'Inter', -apple-system, sans-serif", fontWeight: 600, textDecoration: "none" }}>@joaoffonseca</a>
              <span style={{ fontSize: 11, color: TEXT_DIM, fontFamily: "'Inter', -apple-system, sans-serif" }}>· 1M seguidores</span>
            </div>
          </div>
        </div>
      )}

      {/* NEWS FEED with inline bars */}
      <main style={{ maxWidth: 680, margin: "0 auto", background: BG_WHITE, borderLeft: `1px solid ${BORDER}`, borderRight: `1px solid ${BORDER}`, minHeight: "70vh" }}>
        {loading && news.length === 0 && <Skeleton />}
        {dn.length > 0 && !(loading && news.length === 0) && (
          <div>{buildFeed(dn, ds, dl)}</div>
        )}
        <div style={{ borderTop: `1px solid ${BORDER}`, padding: "24px 24px 40px" }}>

          {/* CONQUISTAS */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
            {[["🏆","2 títulos ATP"],["🎯","3 Challengers"],["🇧🇷","Nº1 do Brasil"],["⭐","NextGen Champion"]].map(([icon, label], i) => (
              <span key={i} style={{ fontSize: 11, color: TEXT_SECONDARY, fontFamily: "'Inter', -apple-system, sans-serif", fontWeight: 500 }}>
                {icon} {label}
              </span>
            ))}
          </div>

          {/* AÇÕES */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 20 }}>
            <button onClick={() => setShowBio(true)} style={{ background: "none", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "7px 16px", fontSize: 11.5, color: TEXT_SECONDARY, cursor: "pointer", fontFamily: "'Inter', -apple-system, sans-serif", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 5 }}>
              👤 Sobre
            </button>
            <a href="https://www.instagram.com/joaoffonseca" target="_blank" rel="noopener noreferrer" style={{ border: `1px solid ${BORDER}`, borderRadius: 8, padding: "7px 16px", fontSize: 11.5, color: TEXT_SECONDARY, fontFamily: "'Inter', -apple-system, sans-serif", fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5 }}>
              📸 Instagram
            </a>
          </div>

          {/* APP */}
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <p style={{ margin: 0, fontSize: 10.5, color: TEXT_DIM, fontFamily: "'Inter', -apple-system, sans-serif" }}>
              📱 iPhone: Safari → (↑) → "Tela de Início" · Android: Chrome → (⋮) → "Tela inicial"
            </p>
          </div>

          {/* DISCLAIMER */}
          <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 14 }}>
            <p style={{ fontSize: 10, color: "#bbb", fontFamily: "'Inter', -apple-system, sans-serif", lineHeight: 1.6, maxWidth: 440, margin: "0 auto", textAlign: "center" }}>
              Site independente de fãs, sem vínculo oficial com João Fonseca, sua equipe ou a ATP. Notícias agregadas de fontes públicas com devidos créditos. Marcas e nomes pertencem aos respectivos proprietários.
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}
