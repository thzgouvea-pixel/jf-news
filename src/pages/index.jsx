// Fonseca News — Refactored v3
import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import { GREEN, YELLOW, BG_ALT, TEXT, SUB, DIM, BORDER, RED, SERIF, SANS, CARD_SHADOW, CARD_SHADOW_MD, CARD_RADIUS, CACHE_DURATION_MS, surfaceColorMap, countryFlags, catColors, PLAYER_DB } from "../lib/constants";
import { findPlayer, getATPImage, getESPNImage, getSofaScoreImage, formatTimeAgo, formatMatchDate, detectDevice } from "../lib/utils";
import NextDuelCard from "../components/NextDuelCard";
import LiveScoreCard from "../components/LiveScoreCard";
import PlayerBlock from "../components/PlayerBlock";
import MatchCarousel from "../components/MatchCarousel";
import Fonsecometro from "../components/Fonsecometro";
import NewsCard from "../components/NewsCard";
import DailyPoll from "../components/DailyPoll";
import QuizGame from "../components/QuizGame";
import MatchPrediction from "../components/MatchPrediction";
import RankingChart from "../components/RankingChart";
import ATPRankingList from "../components/ATPRankingList";
import NextGenComparator from "../components/NextGenComparator";
import CareerTimeline from "../components/CareerTimeline";
import ATPCalendar from "../components/ATPCalendar";
import TournamentBracket from "../components/TournamentBracket";
import NextStopCard from "../components/NextStopCard";
import PWAInstallSheet from "../components/PWAInstallSheet";
import WinProbBar from "../components/WinProbBar";
import InstallBanner from "../components/InstallBanner";
import Modal from "../components/Modal";
import Skeleton from "../components/Skeleton";

var SAMPLE_PLAYER = { ranking: 40, rankingChange: "+4" };
var SAMPLE_LAST_MATCH = { result: "V", score: "6-3 6-4", opponent: "T. Nakashima", opponent_name: "T. Nakashima", tournament: "Indian Wells", tournament_name: "Indian Wells", round: "R2" };
var SAMPLE_NEXT_MATCH = { tournament_category: "Masters 1000", tournament_name: "Monte Carlo Masters", surface: "Saibro", city: "Monte Carlo", country: "Mônaco", date: "2026-04-04T12:00:00Z", round: "" };
var SAMPLE_NEWS = [
  { title: "João Fonseca confirma presença no ATP 500 de Barcelona", summary: "O tenista brasileiro confirmou participação no torneio espanhol de saibro.", source: "ESPN Brasil", url: "https://www.espn.com.br/tenis/", date: new Date(Date.now() - 2 * 3600000).toISOString(), category: "Torneio" },
  { title: "Fonseca sobe para 40º no ranking da ATP", summary: "Campanha até as oitavas em Miami rende posições ao carioca.", source: "UOL Esporte", url: "https://www.uol.com.br/esporte/tenis/", date: new Date(Date.now() - 8 * 3600000).toISOString(), category: "Ranking" },
  { title: "\"Estou evoluindo a cada torneio\", diz Fonseca", summary: "Brasileiro elogiou próprio desempenho após derrota para o nº1.", source: "GE", url: "https://ge.globo.com/tenis/", date: new Date(Date.now() - 18 * 3600000).toISOString(), category: "Declaração" },
  { title: "Fonseca treina no Rio visando saibro", summary: "Preparação física e ajustes no saque com equipe técnica.", source: "O Globo", url: "https://oglobo.globo.com/esportes/", date: new Date(Date.now() - 36 * 3600000).toISOString(), category: "Treino" },
  { title: "Fonseca vence em sets diretos em Miami", summary: "Parciais de 6-3, 6-4 garantiram vaga na chave principal.", source: "Tênis Brasil", url: "https://tenisbrasil.uol.com.br/", date: new Date(Date.now() - 52 * 3600000).toISOString(), category: "Resultado" },
  { title: "Nike renova com Fonseca até 2028", summary: "Marca americana amplia acordo apostando no potencial do brasileiro.", source: "Folha de S. Paulo", url: "https://www.folha.uol.com.br/esporte/", date: new Date(Date.now() - 72 * 3600000).toISOString(), category: "Notícia" },
  { title: "Técnico revela plano para restante da temporada", summary: "Prioridade: Masters 1000 de saibro e Roland Garros.", source: "ESPN Brasil", url: "https://www.espn.com.br/tenis/", date: new Date(Date.now() - 96 * 3600000).toISOString(), category: "Notícia" },
];

var buildFeed = function(newsItems, allLikes, nextMatch) {
  var elements = [];
  var interactions = [
    nextMatch ? <MatchPrediction key="prediction" match={nextMatch} /> : null,
    <QuizGame key="quiz" />,
    <DailyPoll key="poll" />,
  ].filter(Boolean);
  var interactionIdx = 0;
  newsItems.forEach(function(item, i) {
    var isLastBeforeInteraction = (i + 1) % 4 === 0 && interactionIdx < interactions.length;
    elements.push(<NewsCard key={"news-" + i} item={item} index={i} allLikes={allLikes} noBorder={isLastBeforeInteraction} />);
    if (isLastBeforeInteraction) {
      elements.push(interactions[interactionIdx]);
      interactionIdx++;
    }
  });
  while (interactionIdx < interactions.length) {
    elements.push(interactions[interactionIdx]);
    interactionIdx++;
  }
  return elements;
};

export default function JoaoFonsecaNews() {
  var _n = useState([]); var news = _n[0]; var setNews = _n[1];
  var _nm = useState(null); var nextMatch = _nm[0]; var setNextMatch = _nm[1];
  var _lm = useState(null); var lastMatch = _lm[0]; var setLastMatch = _lm[1];
  var _p = useState(null); var player = _p[0]; var setPlayer = _p[1];
  var _se = useState(null); var season = _se[0]; var setSeason = _se[1];
  var _l = useState(false); var loading = _l[0]; var setLoading = _l[1];
  var _lu = useState(null); var lastUpdate = _lu[0]; var setLastUpdate = _lu[1];
  var _dp = useState(null); var deferredPrompt = _dp[0]; var setDeferredPrompt = _dp[1];
  var _sib = useState(false); var showInstallBanner = _sib[0]; var setShowInstallBanner = _sib[1];
  var _sip = useState(false); var showInstallPopup = _sip[0]; var setShowInstallPopup = _sip[1];
  var _pd = useState(false); var popupDismissed = _pd[0]; var setPopupDismissed = _pd[1];
  var _sb = useState(false); var showBio = _sb[0]; var setShowBio = _sb[1];
  var _st = useState(false); var showTitles = _st[0]; var setShowTitles = _st[1];
  var _sm = useState(false); var showMenu = _sm[0]; var setShowMenu = _sm[1];
  var _sr = useState(false); var showRanking = _sr[0]; var setShowRanking = _sr[1];
  var _src = useState(false); var showRankingChart = _src[0]; var setShowRankingChart = _src[1];
  var _sng = useState(false); var showNextGen = _sng[0]; var setShowNextGen = _sng[1];
  var _stl = useState(false); var showTimeline = _stl[0]; var setShowTimeline = _stl[1];
  var _scal = useState(false); var showCalendar = _scal[0]; var setShowCalendar = _scal[1];
  var _sbr = useState(false); var showBracket = _sbr[0]; var setShowBracket = _sbr[1];
  var _svid = useState(false); var showVideos = _svid[0]; var setShowVideos = _svid[1];
  var _allLikes = useState({}); var allLikes = _allLikes[0]; var setAllLikes = _allLikes[1];
  var _matchStats = useState(null); var matchStats = _matchStats[0]; var setMatchStats = _matchStats[1];
  var _recentForm = useState(null); var recentForm = _recentForm[0]; var setRecentForm = _recentForm[1];
  var _prizeMoney = useState(null); var prizeMoney = _prizeMoney[0]; var setPrizeMoney = _prizeMoney[1];
  var _careerStats = useState(null); var careerStats = _careerStats[0]; var setCareerStats = _careerStats[1];
  var _liveMatch = useState(null); var liveMatch = _liveMatch[0]; var setLiveMatch = _liveMatch[1];
  var _highlightVideo = useState(null); var highlightVideo = _highlightVideo[0]; var setHighlightVideo = _highlightVideo[1];
  var _bracketUrl = useState(null); var bracketUrl = _bracketUrl[0]; var setBracketUrl = _bracketUrl[1];
  var _atpCalendar = useState(null); var atpCalendar = _atpCalendar[0]; var setAtpCalendar = _atpCalendar[1];
  var _winProb = useState(null); var winProb = _winProb[0]; var setWinProb = _winProb[1];
  var _visibleCount = useState(12); var visibleCount = _visibleCount[0]; var setVisibleCount = _visibleCount[1];
  var _fb = useState(function() { try { return localStorage.getItem("fn_site_fb"); } catch(e) { return null; } });
  var siteFeedback = _fb[0]; var setSiteFeedback = _fb[1];
  var _showFeedback = useState(false); var showFeedback = _showFeedback[0]; var setShowFeedback = _showFeedback[1];
  var _showMaisMenu = useState(false); var showMaisMenu = _showMaisMenu[0]; var setShowMaisMenu = _showMaisMenu[1];
  var _tabBarHidden = useState(false); var tabBarHidden = _tabBarHidden[0]; var setTabBarHidden = _tabBarHidden[1];
  var _headerCompact = useState(false); var headerCompact = _headerCompact[0]; var setHeaderCompact = _headerCompact[1];
  useEffect(function() {
    var lastScrollY = window.scrollY;
    var scrollDelta = 0;
    var handleScroll = function() {
      var currentY = window.scrollY;
      var diff = currentY - lastScrollY;
      scrollDelta += diff;
      if (scrollDelta > 80 && currentY > 150) { setTabBarHidden(true); setShowMaisMenu(false); scrollDelta = 0; }
      else if (scrollDelta < -30) { setTabBarHidden(false); scrollDelta = 0; }
      if (diff > 0 && scrollDelta < 0) scrollDelta = 0;
      if (diff < 0 && scrollDelta > 0) scrollDelta = 0;
      setHeaderCompact(currentY > 60);
      lastScrollY = currentY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return function() { window.removeEventListener("scroll", handleScroll); };
  }, []);
  var _showInstallGuide = useState(false); var showInstallGuide = _showInstallGuide[0]; var setShowInstallGuide = _showInstallGuide[1];
  var _pushEnabled = useState(function() { try { return localStorage.getItem("fn_push_enabled") === "1"; } catch(e) { return false; } });
  var pushEnabled = _pushEnabled[0]; var setPushEnabled = _pushEnabled[1];
  var _pushLoading = useState(false); var pushLoading = _pushLoading[0]; var setPushLoading = _pushLoading[1];
  // Banner de push: mostra se nunca se inscreveu E nao dismissou nos ultimos 30 dias
  var _showPushBanner = useState(function() {
    try {
      if (localStorage.getItem("fn_push_enabled") === "1") return false;  // ja inscrito
      var dismissedAt = localStorage.getItem("fn_push_banner_dismissed");
      if (!dismissedAt) return true;  // nunca dismissou
      var thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      return (Date.now() - parseInt(dismissedAt)) > thirtyDaysMs;  // dismissou ha mais de 30d
    } catch(e) { return true; }
  });
  var showPushBanner = _showPushBanner[0]; var setShowPushBanner = _showPushBanner[1];
  var dismissPushBanner = function() {
    try { localStorage.setItem("fn_push_banner_dismissed", String(Date.now())); } catch(e) {}
    setShowPushBanner(false);
  };
  var _showAutoInstall = useState(false); var showAutoInstall = _showAutoInstall[0]; var setShowAutoInstall = _showAutoInstall[1];
  var _showMiniBanner = useState(false); var showMiniBanner = _showMiniBanner[0]; var setShowMiniBanner = _showMiniBanner[1];
  var _autoInstallStep = useState(0); var autoInstallStep = _autoInstallStep[0]; var setAutoInstallStep = _autoInstallStep[1];
  var _fbName = useState(""); var fbName = _fbName[0]; var setFbName = _fbName[1];
  var _fbMsg = useState(""); var fbMsg = _fbMsg[0]; var setFbMsg = _fbMsg[1];
  var _fbRating = useState(null); var fbRating = _fbRating[0]; var setFbRating = _fbRating[1];
  var _fbSent = useState(false); var fbSent = _fbSent[0]; var setFbSent = _fbSent[1];
  var _biography = useState(null); var biography = _biography[0]; var setBiography = _biography[1];
  var _opponentProfile = useState(null); var opponentProfile = _opponentProfile[0]; var setOpponentProfile = _opponentProfile[1];
  var _nextTournament = useState(null); var nextTournament = _nextTournament[0]; var setNextTournament = _nextTournament[1];
  var _showOppPopup = useState(false); var showOppPopup = _showOppPopup[0]; var setShowOppPopup = _showOppPopup[1];

  var initDone = useRef(false); var nextMatchRef = useRef(null);

  // VAPID public key (copiada do env var VAPID_PUBLIC_KEY - precisa estar acessivel no client)
  // Esta e a chave publica, pode ser exposta no frontend.
  var VAPID_PUBLIC_KEY = "BEBtbLDE4cEvYCy-9Uvuqyxk024DltZv-VdpipAnw-cqJkh6SrGF0lezDxPai5o7C8k3vKmwshYqXs4n1qDDBPM";

  // Helper: converte base64url -> Uint8Array (exigido pelo browser.pushManager.subscribe)
  function urlBase64ToUint8Array(base64String) {
    var padding = "=".repeat((4 - base64String.length % 4) % 4);
    var base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
    var rawData = window.atob(base64);
    var outputArray = new Uint8Array(rawData.length);
    for (var i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
    return outputArray;
  }

  var handlePushSubscribe = function() {
    if (pushLoading || pushEnabled) return;
    if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      alert("Seu navegador não suporta notificações push. Tente no Chrome, Firefox, Edge ou Safari 16.4+.");
      return;
    }
    setPushLoading(true);

    Notification.requestPermission().then(function(permission) {
      if (permission !== "granted") {
        // Se usuario bloqueou, nao adianta mostrar o banner (navegador nao pergunta de novo)
        if (permission === "denied") {
          try { localStorage.setItem("fn_push_banner_dismissed", String(Date.now())); } catch(e) {}
          setShowPushBanner(false);
        }
        setPushLoading(false);
        return;
      }

      // Registra o service worker novo (fn-sw.js, sem Firebase)
      navigator.serviceWorker.register("/fn-sw.js").then(function(registration) {
        // Espera o SW ficar ativo antes de tentar subscribe
        return navigator.serviceWorker.ready.then(function() { return registration; });
      }).then(function(registration) {
        // Se ja tem subscription, reusa
        return registration.pushManager.getSubscription().then(function(existing) {
          if (existing) return existing;
          return registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
          });
        });
      }).then(function(subscription) {
        // Envia ao servidor
        return fetch("/api/push-subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription: subscription.toJSON() })
        });
      }).then(function(res) {
        if (res && res.ok) {
          try { localStorage.setItem("fn_push_enabled", "1"); } catch(e) {}
          setPushEnabled(true);
          setShowPushBanner(false);  // esconde banner quando inscreve com sucesso
        }
        setPushLoading(false);
      }).catch(function(e) {
        console.error("[push] Error:", e);
        setPushLoading(false);
      });
    }).catch(function() {
      setPushLoading(false);
    });
  };

  useEffect(function() {
    var liveInterval = 300000; // 5 min default (no match)
    var iv = null;
    var pollLive = function() {
      fetch("/api/live").then(function(r) { return r.json(); }).then(function(d) {
        if (d && d.live) {
          setLiveMatch(d);
          // Switch to fast polling when live
          if (liveInterval !== 30000) {
            liveInterval = 30000;
            clearInterval(iv);
            iv = setInterval(function() { if (!document.hidden) pollLive(); }, liveInterval);
          }
        } else {
          setLiveMatch(null);
          var desiredInterval = 300000;
          var nmRef = nextMatchRef.current;
          if (nmRef && nmRef.startTimestamp) {
            var msToMatch = nmRef.startTimestamp * 1000 - Date.now();
            if (msToMatch > 0 && msToMatch < 3600000) desiredInterval = 120000;
          }
          if (liveInterval !== desiredInterval) {
            liveInterval = desiredInterval;
            clearInterval(iv);
            iv = setInterval(function() { if (!document.hidden) pollLive(); }, liveInterval);
          }
        }
      }).catch(function() {});
    };
    pollLive();
    iv = setInterval(function() {
      if (!document.hidden) pollLive();
    }, liveInterval);
    return function() { clearInterval(iv); };
  }, []);

  useEffect(function() { if (popupDismissed) return; var t = setTimeout(function() { setShowInstallPopup(true); }, 60000); return function() { clearTimeout(t); }; }, [popupDismissed]); useEffect(function() { nextMatchRef.current = nextMatch; }, [nextMatch]);

  useEffect(function() {
    var handler = function(e) { e.preventDefault(); setDeferredPrompt(e); setShowInstallBanner(true); };
    window.addEventListener("beforeinstallprompt", handler);
    // Registra o fn-sw.js desde o load — ele cobre PWA (install/activate) E push.
    // Sem bloquear nem pedir permissao — a permissao de push e pedida so quando o usuario clica no sininho.
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/fn-sw.js").catch(function() {});
    }
    return function() { window.removeEventListener("beforeinstallprompt", handler); };
  }, []);

  var handleInstall = function() { if (!deferredPrompt) return; deferredPrompt.prompt(); deferredPrompt.userChoice.then(function(r) { if (r.outcome === "accepted") setShowInstallBanner(false); setDeferredPrompt(null); }); };
  var dismissPopup = function() { setShowInstallPopup(false); setPopupDismissed(true); };

  var loadCache = function() {
    try { var raw = localStorage.getItem("jf-news-v5"); if (raw) { var c = JSON.parse(raw); if (Date.now() - c.timestamp < CACHE_DURATION_MS && c.news && c.news.length) { setNews(c.news); setNextMatch(c.nextMatch||null); setLastMatch(c.lastMatch||null); setPlayer(c.player||null); setSeason(c.season||null); setLastUpdate(new Date(c.timestamp).toISOString()); return true; } } } catch(e) {}
    return false;
  };
  var saveCache = function(d) { try { localStorage.setItem("jf-news-v5", JSON.stringify(Object.assign({}, d, { timestamp: Date.now() }))); } catch(e) {} };
  var pickNewerLastMatch = function(prev, next) {
    if (!next) return prev || null;
    if (!prev || !prev.date) return next;
    if (!next.date) return prev;
    return new Date(next.date) >= new Date(prev.date) ? next : prev;
  };

  var fetchNews = function(bustCache) {
    setLoading(true);
    var url = "/api/news" + (bustCache ? "?t=" + Date.now() : "");
    fetch(url, bustCache ? { cache: "no-store" } : {}).then(function(res) { if (!res.ok) throw new Error("" + res.status); return res.json(); }).then(function(p) { if (p && p.news && p.news.length) { setNews(p.news); setNextMatch(p.nextMatch||null); setLastMatch(function(prev) { return pickNewerLastMatch(prev, p.lastMatch); }); setPlayer(p.player||null); setSeason(p.season||null); setLastUpdate(new Date().toISOString()); saveCache({ news:p.news, nextMatch:p.nextMatch, lastMatch:p.lastMatch, player:p.player, season:p.season }); } }).catch(function() {}).then(function() { setLoading(false); });
  };

  var handleRefresh = function() {
    try { localStorage.removeItem("jf-news-v5"); } catch(e) {}
    if ("caches" in window) { caches.keys().then(function(names) { names.forEach(function(n) { caches.delete(n); }); }); }
    fetchNews(true);
    fetch("/api/all-data?t=" + Date.now(), { cache: "no-store" }).then(function(r) { return r.json(); }).then(function(d) {
      if (d.matchStats) setMatchStats(d.matchStats);
      if (d.recentForm) setRecentForm(d.recentForm);
      if (d.prizeMoney) setPrizeMoney(d.prizeMoney);
      if (d.careerStats) setCareerStats(d.careerStats);
      if (d.ranking && d.ranking.ranking) setPlayer(function(prev) { return prev ? Object.assign({}, prev, { ranking: d.ranking.ranking }) : { ranking: d.ranking.ranking }; });
      if (d.season && d.season.wins !== undefined) setSeason(d.season);
      if (d.lastMatch && d.lastMatch.result) setLastMatch(function(prev) { return pickNewerLastMatch(prev, d.lastMatch); });
      if (d.nextMatch && d.nextMatch.tournament_name) setNextMatch(d.nextMatch); else setNextMatch(null);
      if (d.winProb) setWinProb(d.winProb); else setWinProb(null);
      if (d.biography) setBiography(d.biography);
      if (d.opponentProfile) setOpponentProfile(d.opponentProfile);
      if (d.nextTournament) setNextTournament(d.nextTournament); else setNextTournament(null);
      if (d.highlightVideo && d.highlightVideo.videoId) setHighlightVideo(d.highlightVideo);
      if (d.bracketUrl && d.bracketUrl.url) setBracketUrl(d.bracketUrl); else setBracketUrl(null);
      if (d.atpCalendar) setAtpCalendar(d.atpCalendar); else setAtpCalendar(null);
    }).catch(function() {});
  };

  useEffect(function() {
    if (initDone.current) return; initDone.current = true;
    loadCache();
    fetchNews();
  }, []);

  useEffect(function() {
    fetch("/api/all-data").then(function(r) { return r.json(); }).then(function(d) {
      if (d.stats && d.stats.likes) setAllLikes(d.stats.likes);
      if (d.stats && d.stats.visitors) { var el = document.getElementById("fn-visitors"); var wrap = document.getElementById("fn-visitors-wrap"); if (el) el.textContent = d.stats.visitors; if (wrap) wrap.style.display = "inline"; }
      if (d.matchStats) setMatchStats(d.matchStats);
      if (d.recentForm) setRecentForm(d.recentForm);
      if (d.prizeMoney) setPrizeMoney(d.prizeMoney);
      if (d.careerStats) setCareerStats(d.careerStats);
      if (d.ranking && d.ranking.ranking) setPlayer(function(prev) { return prev ? Object.assign({}, prev, { ranking: d.ranking.ranking }) : { ranking: d.ranking.ranking }; });
      if (d.season && d.season.wins !== undefined) setSeason(d.season);
      if (d.lastMatch && d.lastMatch.result) setLastMatch(function(prev) { return pickNewerLastMatch(prev, d.lastMatch); });
      if (d.nextMatch && d.nextMatch.tournament_name) setNextMatch(d.nextMatch); else setNextMatch(null);
      if (d.winProb) setWinProb(d.winProb); else setWinProb(null);
      if (d.biography) setBiography(d.biography);
      if (d.opponentProfile) setOpponentProfile(d.opponentProfile);
      if (d.nextTournament) setNextTournament(d.nextTournament); else setNextTournament(null);
      if (d.highlightVideo && d.highlightVideo.videoId) setHighlightVideo(d.highlightVideo);
      if (d.bracketUrl && d.bracketUrl.url) setBracketUrl(d.bracketUrl); else setBracketUrl(null);
      if (d.atpCalendar) setAtpCalendar(d.atpCalendar); else setAtpCalendar(null);
    }).catch(function() {});
    var isNew = !localStorage.getItem("fn_visited");
    if (isNew) { fetch("/api/visitors", { method: "POST" }).catch(function() {}); try { localStorage.setItem("fn_visited", "1"); } catch(e) {} }
    try {
      var isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
      var alreadyTracked = localStorage.getItem("fn_standalone_tracked");
      if (isStandalone && !alreadyTracked) {
        fetch("/api/visitors?action=standalone", { method: "POST" }).catch(function() {});
        localStorage.setItem("fn_standalone_tracked", "1");
      }
    } catch(e) {}
  }, []);

  useEffect(function() {
    try {
      var isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
      var wasDismissed = localStorage.getItem("fn_autoinstall_dismissed");
      var dismissExpired = wasDismissed && (Date.now() - parseInt(wasDismissed)) > 7 * 86400000;
      if (dismissExpired) localStorage.removeItem("fn_autoinstall_dismissed");
      var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isStandalone || (wasDismissed && !dismissExpired) || !isMobile) return;
    } catch(e) { return; }
    var timer = setTimeout(function() { setShowAutoInstall(true); }, 15000);
    return function() { clearTimeout(timer); };
  }, []);

  // Mini PWA banner for returning visitors (shows if auto-install was dismissed)
  useEffect(function() {
    try {
      var isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
      var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isStandalone || !isMobile) return;
      var autoWasDismissed = localStorage.getItem("fn_autoinstall_dismissed");
      if (!autoWasDismissed) return; // auto-install not yet shown/dismissed
      var miniDismissed = localStorage.getItem("fn_minibanner_dismissed");
      if (miniDismissed && (Date.now() - parseInt(miniDismissed)) < 86400000) return; // 24h cooldown
      var t2 = setTimeout(function() { setShowMiniBanner(true); }, 5000);
      return function() { clearTimeout(t2); };
    } catch(e) {}
  }, []);

  var dn = news.length > 0 ? news : SAMPLE_NEWS;
  var dm = nextMatch || null;   var hasNextMatch = !!(nextMatch && nextMatch.tournament_name);
  var dl = lastMatch || null;
  var dp = player || (news.length === 0 ? SAMPLE_PLAYER : null);
  var ds = season || null;

  return (
    <div style={{ minHeight: "100vh", background: "#fff" }}>
        <Head>
        <title>Fonseca News — Guia de bolso sobre João Fonseca</title>
        <meta name="description" content="Acompanhe a carreira do tenista João Fonseca: notícias, ranking, estatísticas, próximos jogos e mais." />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <meta name="author" content="Fonseca News" />
        <meta name="keywords" content="João Fonseca, tenista brasileiro, tênis, ATP, ranking ATP, Fonseca, tênis Brasil" />

        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Fonseca News" />
        <meta property="og:title" content="Fonseca News — Guia de bolso sobre João Fonseca" />
        <meta property="og:description" content="Acompanhe a carreira do tenista João Fonseca: notícias, ranking, estatísticas, próximos jogos e mais." />
        <meta property="og:image" content="https://fonsecanews.com.br/og-image.PNG" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content="https://fonsecanews.com.br" />
        <meta property="og:locale" content="pt_BR" />

        {/* Twitter/X: preview desabilitado intencionalmente (tweets do bot ficam focados no texto).
            og:image acima continua ativo para WhatsApp, Facebook, LinkedIn, Discord, etc. */}
        <meta name="twitter:site" content="@JFonsecaNews" />
        <meta name="twitter:title" content="Fonseca News — Guia de bolso sobre João Fonseca" />
        <meta name="twitter:description" content="Acompanhe a carreira do tenista João Fonseca: notícias, ranking, estatísticas, próximos jogos e mais." />

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Fonseca News",
          "url": "https://fonsecanews.com.br",
          "inLanguage": "pt-BR",
          "description": "Guia de bolso sobre o tenista brasileiro João Fonseca",
          "about": {
            "@type": "Person",
            "name": "João Fonseca",
            "alternateName": "Joao Fonseca",
            "jobTitle": "Tenista profissional",
            "nationality": "BR",
            "sport": "Tennis"
          }
        })}} />
      </Head>

      <header style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(248,250,251,0.92)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid " + BORDER, boxShadow: headerCompact ? "0 1px 8px rgba(0,0,0,0.04)" : "none", transition: "all 0.3s ease" }}>
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
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button className="pwa-install-btn" onClick={function(){ setShowAutoInstall(true); }} style={{ width: 32, height: 32, borderRadius: 8, background: "#FFCB05", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, padding: 0, animation: "pulse 2s ease-in-out infinite", boxShadow: "0 0 8px #FFCB0540" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
            </button>
            <button
              onClick={handlePushSubscribe}
              disabled={pushLoading}
              title={pushEnabled ? "Notificações ativadas" : "Ativar notificações"}
              style={{ width: 32, height: 32, borderRadius: 8, background: pushEnabled ? GREEN + "15" : "transparent", border: "none", color: pushEnabled ? GREEN : SUB, display: "flex", alignItems: "center", justifyContent: "center", cursor: pushLoading ? "default" : "pointer", flexShrink: 0, padding: 0 }}
            >
              {pushLoading ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: "spin 1s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              ) : pushEnabled ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              )}
            </button>
                    <button onClick={handleRefresh} disabled={loading} style={{ width: 32, height: 32, borderRadius: 8, background: "transparent", border: "none", color: loading ? DIM : SUB, display: "flex", alignItems: "center", justifyContent: "center", cursor: loading ? "default" : "pointer", flexShrink: 0, padding: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={loading ? { animation: "spin 1s linear infinite" } : {}}><path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16" /></svg>
          </button>
          </div>
        </div>

        <div className="desktop-nav" style={{ position: "relative" }}>
          <nav style={{ maxWidth: 640, margin: "0 auto", overflowX: "auto", overflowY: "hidden", WebkitOverflowScrolling: "touch", scrollbarWidth: "none", msOverflowStyle: "none", padding: "2px 16px 12px", paddingRight: 48, display: "flex", alignItems: "center", gap: 24 }}>
            {[
              { label: "Biografia", href: "/biografia" },
              { label: "Ranking", action: function(){setShowRanking(true);} },
              { label: "Conquistas", action: function(){setShowTitles(true);} },
              { label: "Feedback", action: function(){setShowFeedback(true);} },
              { label: "Sobre", href: "/sobre" },
            ].map(function(item, i) {
              var isLink = !!item.href;
              var isGreen = !!item.green;
              var isGold = !!item.gold;
              var navColor = isGreen ? GREEN : (isGold ? "#b8860b" : SUB);
              var navStyle = { fontSize: 13, fontWeight: 500, color: navColor, fontFamily: SANS, whiteSpace: "nowrap", padding: 0, background: "none", border: "none", cursor: "pointer", textDecoration: "none", letterSpacing: "0.01em", flexShrink: 0 };
              if (isLink) return <a key={i} href={item.href} style={navStyle}>{item.label}</a>;
              return <button key={i} onClick={item.action} style={navStyle}>{item.label}</button>;
            })}
          </nav>
          <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 48, background: "linear-gradient(to right, transparent, rgba(255,255,255,0.95) 60%)", display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 8, pointerEvents: "none" }}>
            <span style={{ fontSize: 14, color: DIM, fontFamily: SANS, fontWeight: 300 }}>›</span>
          </div>
        </div>
      </header>

      <main className="mobile-pad" style={{ maxWidth: 640, margin: "0 auto", padding: "0 12px" }}>

        {showPushBanner && !pushEnabled && (
          <div style={{
            margin: "12px 0 0",
            padding: "14px 14px 12px",
            borderRadius: 14,
            background: "linear-gradient(135deg, " + GREEN + "18 0%, " + YELLOW + "22 100%)",
            border: "1px solid " + GREEN + "33",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            position: "relative",
            fontFamily: SANS
          }}>
            <button
              onClick={dismissPushBanner}
              aria-label="Fechar"
              style={{ position: "absolute", top: 8, right: 8, width: 24, height: 24, borderRadius: 6, border: "none", background: "transparent", color: SUB, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", padding: 0, opacity: 0.6 }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, paddingRight: 24 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: TEXT, marginBottom: 6, lineHeight: 1.3 }}>
                  🎾 Acompanhe o João em tempo real
                </div>
                <ul style={{ margin: "0 0 10px", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 3 }}>
                  <li style={{ fontSize: 12, color: SUB, lineHeight: 1.4, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color: GREEN, fontWeight: 700 }}>•</span> Novo adversário definido
                  </li>
                  <li style={{ fontSize: 12, color: SUB, lineHeight: 1.4, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color: GREEN, fontWeight: 700 }}>•</span> Jogo ao vivo começando
                  </li>
                  <li style={{ fontSize: 12, color: SUB, lineHeight: 1.4, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color: GREEN, fontWeight: 700 }}>•</span> Resultado ao final da partida
                  </li>
                  <li style={{ fontSize: 12, color: SUB, lineHeight: 1.4, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color: GREEN, fontWeight: 700 }}>•</span> Mudança no ranking ATP
                  </li>
                </ul>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button
                    onClick={handlePushSubscribe}
                    disabled={pushLoading}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 8,
                      background: GREEN,
                      color: "#fff",
                      border: "none",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: pushLoading ? "default" : "pointer",
                      fontFamily: SANS,
                      boxShadow: "0 1px 3px " + GREEN + "40",
                      opacity: pushLoading ? 0.7 : 1
                    }}
                  >
                    {pushLoading ? "Ativando..." : "Ativar notificações"}
                  </button>
                  <button
                    onClick={dismissPushBanner}
                    style={{ padding: "8px 10px", borderRadius: 8, background: "transparent", color: SUB, border: "none", fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: SANS }}
                  >
                    Agora não
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && news.length === 0 && (
  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", background: "#FFFBEB", borderRadius: 12, margin: "12px 0 0", border: "1px solid #F59E0B22", boxShadow: "0 1px 4px rgba(245,158,11,0.06)" }}>
    <span style={{ fontSize: 13 }}>⚠️</span>
    <span style={{ fontSize: 12, color: "#92400E", fontFamily: SANS, fontWeight: 500 }}>Dados offline — mostrando informações de exemplo.</span>
  </div>
)}

        {recentForm && recentForm.length > 0 && <Fonsecometro recentForm={recentForm} />}

       {!hasNextMatch && (
        <>
        <section style={{ padding: "8px 0 0" }}>
          <div style={{ borderRadius: 22, overflow: "hidden", boxShadow: "0 4px 20px rgba(10,18,32,0.25)", background: "#0a1220" }}>
          {highlightVideo && highlightVideo.videoId ? (
            <MatchCarousel matchStats={matchStats} lastMatch={dl} recentForm={recentForm} prizeMoney={prizeMoney} playerRanking={dp ? dp.ranking : null} opponentProfile={opponentProfile} highlightVideo={highlightVideo} />
          ) : (
            <PlayerBlock lastMatch={dl} matchStats={matchStats} recentForm={recentForm} prizeMoney={prizeMoney} playerRanking={dp ? dp.ranking : null} opponentProfile={opponentProfile} />
          )}
          </div>
        </section>
        <section style={{ padding: "12px 0 0" }}>
          <div style={{ borderRadius: 22, overflow: "hidden", boxShadow: "0 4px 20px rgba(10,18,32,0.25)", background: "#0a1220" }}>
            <NextDuelCard match={dm} player={dp} onOppClick={opponentProfile ? function(){ setShowOppPopup(true); } : null} winProb={winProb} oppProfile={opponentProfile} onPushClick={handlePushSubscribe} pushEnabled={pushEnabled} pushLoading={pushLoading} liveData={liveMatch} nextTournament={nextTournament} bracketUrl={bracketUrl} />
          </div>
        </section>
        <NextStopCard nextMatch={dm} lastMatch={dl} atpCalendar={atpCalendar} nextTournament={nextTournament} />
        </>
)}  

{hasNextMatch && (
        <>
        <section style={{ padding: "8px 0 0" }}>
          <div style={{ borderRadius: 22, overflow: "hidden", boxShadow: "0 4px 20px rgba(10,18,32,0.25)", background: "#0a1220" }}>
          <NextDuelCard match={dm} player={dp} onOppClick={opponentProfile ? function(){ setShowOppPopup(true); } : null} winProb={winProb} oppProfile={opponentProfile} onPushClick={handlePushSubscribe} pushEnabled={pushEnabled} pushLoading={pushLoading} liveData={liveMatch} nextTournament={nextTournament} bracketUrl={bracketUrl} />
          </div>
        </section>
        <section style={{ padding: "12px 0 0" }}>
          <div style={{ borderRadius: 22, overflow: "hidden", boxShadow: "0 4px 20px rgba(10,18,32,0.25)", background: "#0a1220" }}>
          {highlightVideo && highlightVideo.videoId ? (
            <MatchCarousel matchStats={matchStats} lastMatch={dl} recentForm={recentForm} prizeMoney={prizeMoney} playerRanking={dp ? dp.ranking : null} opponentProfile={opponentProfile} highlightVideo={highlightVideo} />
          ) : (
            <PlayerBlock lastMatch={dl} matchStats={matchStats} recentForm={recentForm} prizeMoney={prizeMoney} playerRanking={dp ? dp.ranking : null} opponentProfile={opponentProfile} />
          )}
          </div>
        </section>
        <NextStopCard nextMatch={dm} lastMatch={dl} atpCalendar={atpCalendar} nextTournament={nextTournament} />
        </>
)}
<section style={{ padding: "28px 0 0" }}>
          {showMiniBanner && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "#f0fdf4", borderRadius: 12, border: "1px solid #bbf7d0", marginBottom: 14 }}>
              <span style={{ fontSize: 15 }}>📱</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: TEXT, fontFamily: SANS, flex: 1 }}>Adicione o FN à sua tela inicial</span>
              <button onClick={function(){ handleInstall(); setShowMiniBanner(false); try { localStorage.setItem("fn_minibanner_dismissed", String(Date.now())); } catch(e){} }} style={{ background: GREEN, border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 11, fontWeight: 700, color: "#fff", fontFamily: SANS, cursor: "pointer" }}>Instalar</button>
              <button onClick={function(){ setShowMiniBanner(false); try { localStorage.setItem("fn_minibanner_dismissed", String(Date.now())); } catch(e){} }} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
          )}
          <p style={{ margin: "0 0 14px", fontSize: 12, fontWeight: 800, color: TEXT, fontFamily: SANS, letterSpacing: "-0.01em", display: "flex", alignItems: "center", gap: 8 }}><span style={{ width: 3, height: 16, borderRadius: 2, background: "#2563EB", display: "inline-block" }} />Notícias</p>
          {loading && news.length === 0 && <Skeleton />}
          {dn.length > 0 && !(loading && news.length === 0) && (
            <>
              <div>{buildFeed(dn.slice(0, visibleCount), allLikes, dm)}</div>
              {visibleCount < dn.length && (
                <button onClick={function() { setVisibleCount(function(v) { return Math.min(v + 10, dn.length); }); }} style={{ width: "100%", padding: "14px", background: "#fff", border: "1px solid " + BORDER, borderRadius: 12, cursor: "pointer", fontSize: 13, fontWeight: 700, color: GREEN, fontFamily: SANS, boxShadow: CARD_SHADOW, marginTop: 4 }}>
                  Carregar mais ({dn.length - visibleCount} restantes)
                </button>
              )}
            </>
          )}
        </section>
        <section style={{ padding: "28px 0 0" }}>
          <p style={{ margin: "0 0 14px", fontSize: 12, fontWeight: 800, color: TEXT, fontFamily: SANS, letterSpacing: "-0.01em", display: "flex", alignItems: "center", gap: 8 }}><span style={{ width: 3, height: 16, borderRadius: 2, background: "#7C3AED", display: "inline-block" }} />João em números</p>
          {(function() {
            var cs = careerStats || {};
            // Sem fallbacks hardcoded - se nao temos dado real, mostra "N/D"
            var cW = cs.wins; var cL = cs.losses;
            var hasCareerData = (typeof cW === "number" && typeof cL === "number" && (cW + cL) > 0);
            var cPct = hasCareerData ? (cs.winPct || Math.round((cW / (cW + cL)) * 100)) : null;
            return (
          <div style={{ background: "#fff", borderRadius: CARD_RADIUS, padding: "22px 20px", border: "1px solid " + BORDER, boxShadow: CARD_SHADOW }}>
            <div style={{ display: "grid", gridTemplateColumns: cs.vsTop10 ? "repeat(4, 1fr)" : "repeat(3, 1fr)", gap: 8, marginBottom: 16 }}>
              {(function() {
                var t10 = cs.vsTop10 || null;
                var items = [
                  {v: hasCareerData ? (cW+"V "+cL+"D") : "N/D", l:"Carreira", c: hasCareerData ? TEXT : DIM},
                  {v: cPct !== null ? (cPct+"%") : "N/D", l:"Aprov.", c: cPct !== null ? GREEN : DIM}
                ];
                if (t10) { items.push({v:t10.w+"V "+t10.l+"D",l:"vs Top 10",c:TEXT}); }
                items.push({v:prizeMoney != null ? (prizeMoney >= 1000000 ? "$" + (Math.floor(prizeMoney / 100000) / 10).toFixed(1) + "M" : "$" + Math.round(prizeMoney / 1000) + "K") : "N/D",l:"Prize Money",c:prizeMoney != null ? GREEN : DIM});
                return items;
              })().map(function(s,i){return(<div key={i} style={{textAlign:"center"}}><span style={{fontSize:17,fontWeight:800,color:s.c,fontFamily:SANS,display:"block",lineHeight:1}}>{s.v}</span><span style={{fontSize:9,fontWeight:600,color:DIM,fontFamily:SANS,textTransform:"uppercase",letterSpacing:"0.04em",marginTop:2,display:"block"}}>{s.l}</span></div>);})}
            </div>
            <div style={{ height: 1, background: BORDER, marginBottom: 14 }} />
            <p style={{ margin: "0 0 10px", fontSize: 10, fontWeight: 700, color: DIM, fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.04em" }}>Recordes</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {["Mais jovem brasileiro no top 100 da história","1º brasileiro a vencer um ATP 500","1º sul-americano campeão do NextGen Finals","Mais jovem sul-americano campeão ATP desde 1987","Mais jovem a bater top 10 no Australian Open (desde 1973)","1º brasileiro nº1 do ranking juvenil","Record juvenil ITF: 92-27"].map(function(r, i) {
                return (<div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}><span style={{ color: GREEN, fontSize: 11, fontWeight: 700, fontFamily: SANS, flexShrink: 0, marginTop: 1 }}>•</span><span style={{ fontSize: 12, color: TEXT, fontFamily: SANS, lineHeight: 1.5 }}>{r}</span></div>);
              })}
            </div>
          </div>
            );
          })()}
        </section>

        <section style={{ padding: "28px 0" }}>
          <p style={{ margin: "0 0 14px", fontSize: 12, fontWeight: 800, color: TEXT, fontFamily: SANS, letterSpacing: "-0.01em", display: "flex", alignItems: "center", gap: 8 }}><span style={{ width: 3, height: 16, borderRadius: 2, background: "#b8860b", display: "inline-block" }} />Parceiros</p>
          <a href="mailto:thzgouvea@gmail.com?subject=Parceria Fonseca News" style={{ display: "block", borderRadius: CARD_RADIUS, overflow: "hidden", border: "1px solid " + BORDER, textDecoration: "none", background: "#0D1726", boxShadow: CARD_SHADOW }}>
            <img src="/partner-banner-1.svg" alt="Fonseca News - Seja parceiro" style={{ width: "100%", height: "auto", display: "block", minHeight: 120 }} />
          </a>
          <p style={{ margin: "10px 0 0", fontSize: 10, color: DIM, fontFamily: SANS, textAlign: "center" }}>Quer ser parceiro? <a href="mailto:thzgouvea@gmail.com?subject=Parceria Fonseca News" style={{ color: GREEN, textDecoration: "none", fontWeight: 600 }}>Entre em contato</a></p>
        </section>

        <section style={{ padding: "28px 0", borderTop: "1px solid " + BORDER }}>
          <p style={{ margin: "0 0 14px", fontSize: 12, fontWeight: 800, color: TEXT, fontFamily: SANS, letterSpacing: "-0.01em", display: "flex", alignItems: "center", gap: 8 }}><span style={{ width: 3, height: 16, borderRadius: 2, background: "#F59E0B", display: "inline-block" }} />Explore também</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>, bg: GREEN + "10", title: "Evolução no Ranking", sub: "De #145 ao Top 40 — a ascensão do João", action: function(){setShowRankingChart(true);} },
              { href: "/raquetes", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b8860b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>, bg: YELLOW + "10", title: "Venda sua raquete", sub: "Anuncie grátis na comunidade do Telegram" },
              { href: "/game", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 12h4M8 10v4M15 11h.01M18 13h.01"/></svg>, bg: "#7C3AED10", title: "Tennis Career 26", sub: "Simulador de carreira profissional" },
              { href: "/regras", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>, bg: "#2563EB10", title: "Regras do Tênis", sub: "Aprenda como funciona o esporte" },
              { href: "https://www.youtube.com/results?search_query=João+Fonseca+tennis+highlights", target: "_blank", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={RED} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>, bg: RED + "10", title: "Momentos do João", sub: "Highlights e jogadas no YouTube" },
            ].map(function(item, i) {
              var inner = <><div style={{ width: 36, height: 36, borderRadius: 10, background: item.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{item.icon}</div><div style={{ flex: 1 }}><span style={{ fontSize: 14, fontWeight: 700, color: TEXT, fontFamily: SANS, display: "block", lineHeight: 1.3 }}>{item.title}</span><span style={{ fontSize: 12, color: SUB, fontFamily: SANS }}>{item.sub}</span></div><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={DIM} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg></>;
              var style = { display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: "#fff", borderRadius: 14, textDecoration: "none", border: "1px solid " + BORDER, cursor: "pointer", width: "100%", boxShadow: CARD_SHADOW, transition: "box-shadow 0.2s, transform 0.2s" };
              if (item.action) return <button key={i} onClick={item.action} style={Object.assign({}, style, { textAlign: "left" })}>{inner}</button>;
              return (<a key={i} href={item.href} target={item.target} rel={item.target ? "noopener noreferrer" : undefined} style={style}>{inner}</a>);
            })}
          </div>
        </section>

        <footer style={{ padding: "32px 0", borderTop: "1px solid " + BORDER, marginTop: 12, background: "linear-gradient(180deg, transparent, rgba(0,168,89,0.02))" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 16 }}>
            {[
              { href: "https://www.instagram.com/joaoffonseca", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={SUB} strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1" fill={SUB} stroke="none"/></svg> },
              { href: "https://x.com/JFonsecaNews", icon: <svg width="13" height="13" viewBox="0 0 24 24" fill={SUB}><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
              { href: "mailto:thzgouvea@gmail.com", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={SUB} strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22 6 12 13 2 6"/></svg> },
            ].map(function(s, i) {
              return (<a key={i} href={s.href} target={s.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" style={{ width: 38, height: 38, borderRadius: 10, border: "1px solid " + BORDER, background: "#fff", boxShadow: CARD_SHADOW, display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>{s.icon}</a>);
            })}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 16 }}>
            <span id="fn-visitors-wrap" style={{ fontSize: 11, color: DIM, fontFamily: SANS, display: "none" }}><span id="fn-visitors" style={{ fontWeight: 700, color: GREEN }}></span> visitantes</span>
            <span id="fn-standalone-wrap" style={{ fontSize: 11, color: DIM, fontFamily: SANS, display: "none" }}><span id="fn-standalone" style={{ fontWeight: 700, color: GREEN }}></span> instalaram o app</span>
          </div>
          <p style={{ fontSize: 9, color: DIM, fontFamily: SANS, lineHeight: 1.6, maxWidth: 340, margin: "0 auto", textAlign: "center" }}>Guia de bolso para fãs do João Fonseca · Sem vínculo com João Fonseca ou ATP · © 2026 Fonseca News</p>
        </footer>
      </main>

      {showRanking && (<Modal title="🏆 Ranking ATP Singles" onClose={function(){setShowRanking(false);}} maxWidth={480}><ATPRankingList currentRanking={dp ? dp.ranking : null} /></Modal>)}
      {showRankingChart && (<Modal title="📈 Evolução no Ranking" onClose={function(){setShowRankingChart(false);}} maxWidth={650}><RankingChart currentRanking={dp ? dp.ranking : null} /></Modal>)}
      {showCalendar && (<Modal title="🗓️ Calendário ATP 2026" onClose={function(){setShowCalendar(false);}} maxWidth={520}><ATPCalendar recentForm={recentForm} lastMatch={dl} nextMatch={dm} nextTournament={nextTournament} atpCalendar={atpCalendar} /></Modal>)}
      {showBracket && (<Modal title={"🏟️ Chave · " + ((dm && dm.tournament_name) || (dl && dl.tournament_name) || "Torneio")} onClose={function(){setShowBracket(false);}} maxWidth={420}><TournamentBracket recentForm={recentForm} lastMatch={dl} nextMatch={dm} /></Modal>)}
      {showTitles && (<Modal title="🏆 Conquistas" onClose={function(){setShowTitles(false);}} maxWidth={460}><div><p style={{margin:"0 0 8px",fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em",color:GREEN,fontFamily:SANS}}>ATP Tour — Singles</p>{[{t:"ATP 500 Basel",d:"Out 2025",det:"vs Davidovich Fokina · 6-3 6-4",note:"1º brasileiro a ganhar ATP 500"},{t:"ATP 250 Buenos Aires",d:"Fev 2025",det:"vs Cerúndolo · 6-4 7-6(1)",note:"Brasileiro mais jovem a ganhar ATP"}].map(function(t,i){return(<div key={i} style={{padding:"10px 0",borderBottom:"1px solid #f0f0f0"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}><span style={{fontSize:14,fontWeight:700,color:TEXT,fontFamily:SERIF}}>{t.t}</span><span style={{fontSize:11,color:DIM,fontFamily:SANS}}>{t.d}</span></div><p style={{margin:0,fontSize:12,color:SUB,fontFamily:SANS}}>{t.det}</p>{t.note&&<p style={{margin:"4px 0 0",fontSize:11,color:GREEN,fontFamily:SANS,fontWeight:600}}>{t.note}</p>}</div>);})}<div style={{height:1,background:"#e8e8e8",margin:"14px 0"}} /><p style={{margin:"0 0 8px",fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em",color:GREEN,fontFamily:SANS}}>ATP Tour — Duplas</p><div style={{padding:"10px 0",borderBottom:"1px solid #f0f0f0"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}><span style={{fontSize:14,fontWeight:700,color:TEXT,fontFamily:SERIF}}>Rio Open 500</span><span style={{fontSize:11,color:DIM,fontFamily:SANS}}>Fev 2026</span></div><p style={{margin:0,fontSize:12,color:SUB,fontFamily:SANS}}>Duplas · Rio de Janeiro</p></div><div style={{height:1,background:"#e8e8e8",margin:"14px 0"}} /><p style={{margin:"0 0 8px",fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em",color:"#b8860b",fontFamily:SANS}}>NextGen ATP Finals</p><div style={{padding:"10px 0",borderBottom:"1px solid #f0f0f0"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}><span style={{fontSize:14,fontWeight:700,color:TEXT,fontFamily:SERIF}}>Campeão invicto</span><span style={{fontSize:11,color:DIM,fontFamily:SANS}}>Dez 2024</span></div><p style={{margin:0,fontSize:12,color:SUB,fontFamily:SANS}}>5 vitórias, 0 derrotas · Jeddah</p><p style={{margin:"4px 0 0",fontSize:11,color:GREEN,fontFamily:SANS,fontWeight:600}}>1º sul-americano campeão do NextGen Finals</p></div><div style={{height:1,background:"#e8e8e8",margin:"14px 0"}} /><p style={{margin:"0 0 8px",fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em",color:SUB,fontFamily:SANS}}>ATP Challenger</p>{[{t:"Phoenix Challenger",d:"Mar 2025",det:"vs Bublik"},{t:"Canberra International",d:"Jan 2025",det:"vs Quinn · sem perder sets"},{t:"Lexington Challenger",d:"Ago 2024",det:"Mais jovem campeão Challenger de 2024"}].map(function(t,i){return(<div key={i} style={{padding:"8px 0",borderBottom:"1px solid #f0f0f0"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}><span style={{fontSize:13,fontWeight:600,color:TEXT,fontFamily:SANS}}>{t.t}</span><span style={{fontSize:11,color:DIM,fontFamily:SANS}}>{t.d}</span></div><p style={{margin:0,fontSize:11,color:SUB,fontFamily:SANS}}>{t.det}</p></div>);})}</div></Modal>)}

      {showOppPopup && opponentProfile && (
        <div onClick={function(){ setShowOppPopup(false); }} style={{ position: "fixed", inset: 0, zIndex: 350, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", display: "flex", alignItems: "flex-end", justifyContent: "center", padding: 0, animation: "fadeInO 0.2s ease" }}>
          <div onClick={function(e) { e.stopPropagation(); }} style={{ background: "linear-gradient(160deg, #0D1726 0%, #142238 100%)", borderRadius: "22px 22px 0 0", padding: "28px 24px 32px", maxWidth: 420, width: "100%", animation: "slideU 0.3s ease", position: "relative" }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.15)", margin: "0 auto 20px" }} />
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", overflow: "hidden", border: "2.5px solid rgba(255,255,255,0.12)", margin: "0 auto 10px", background: "#152035", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {(function() {
                  var oppImg = getATPImage(opponentProfile.name);
                  var oppFallback = getESPNImage(opponentProfile.name);
                  if (oppImg) return <img src={oppImg} alt={opponentProfile.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={function(e) { if (oppFallback && !e.target.dataset.tried) { e.target.dataset.tried = "1"; e.target.src = oppFallback; } else { e.target.style.display = "none"; } }} />;
                  return <span style={{ fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,0.3)" }}>{(opponentProfile.name || "?").charAt(0)}</span>;
                })()}
              </div>
              <span style={{ fontSize: 20, fontWeight: 800, color: "#fff", fontFamily: SERIF, display: "block", letterSpacing: "-0.01em" }}>{opponentProfile.name || "Oponente"}</span>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 4 }}>
                {opponentProfile.country && <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontFamily: SANS }}>{countryFlags[opponentProfile.country] || ""} {opponentProfile.country}</span>}
                {(dm && dm.opponent_ranking || opponentProfile.ranking) && <span style={{ fontSize: 12, fontWeight: 700, color: "#4FC3F7", fontFamily: SANS }}>{"#" + (dm && dm.opponent_ranking || opponentProfile.ranking)}</span>}
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-around", marginBottom: 18, padding: "14px 0", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {[{ label: "Idade", value: opponentProfile.age || "—" },{ label: "Altura", value: opponentProfile.height || "—" },{ label: "Mão", value: opponentProfile.hand || "—" },{ label: "Títulos", value: opponentProfile.titles !== undefined && opponentProfile.titles !== null ? opponentProfile.titles : "—" }].map(function(s, i) {
                return (<div key={i} style={{ textAlign: "center" }}><span style={{ fontSize: 16, fontWeight: 700, color: "#fff", fontFamily: SANS, display: "block", lineHeight: 1 }}>{s.value}</span><span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.04em", marginTop: 3, display: "block" }}>{s.label}</span></div>);
              })}
            </div>
            {opponentProfile.style && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ margin: "0 0 6px", fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.25)", fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.06em" }}>Estilo de jogo</p>
                <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.7)", fontFamily: SANS, lineHeight: 1.6 }}>{opponentProfile.style}</p>
              </div>
            )}
            {opponentProfile.careerHigh && (
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontFamily: SANS, textAlign: "center" }}>
                Melhor ranking: <span style={{ fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>#{opponentProfile.careerHigh}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {showFeedback && (
        <Modal title="Feedback" subtitle="Sua opinião é importante" onClose={function(){setShowFeedback(false);}} maxWidth={420}>
          {!fbSent ? (
            <div>
              <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: DIM, fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.04em" }}>Como avalia o site?</p>
              <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                {[["😍","Incrível"],["😊","Bom"],["😐","Ok"],["😕","Pode melhorar"]].map(function(r) {
                  var isActive = fbRating === r[1];
                  return (<button key={r[1]} onClick={function() { setFbRating(r[1]); }} style={{ flex: 1, padding: "10px 4px", background: isActive ? GREEN + "10" : BG_ALT, border: "1.5px solid " + (isActive ? GREEN : BORDER), borderRadius: 10, cursor: "pointer", textAlign: "center" }}><span style={{ fontSize: 20, display: "block", marginBottom: 2 }}>{r[0]}</span><span style={{ fontSize: 9, color: isActive ? GREEN : DIM, fontFamily: SANS, fontWeight: 600 }}>{r[1]}</span></button>);
                })}
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: DIM, fontFamily: SANS, marginBottom: 4 }}>Seu nome (opcional)</label>
                <input type="text" value={fbName} onChange={function(e) { setFbName(e.target.value); }} placeholder="Como quer ser chamado?" style={{ width: "100%", padding: "10px 12px", border: "1.5px solid " + BORDER, borderRadius: 8, fontSize: 13, fontFamily: SANS, color: TEXT, background: "#fff", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: DIM, fontFamily: SANS, marginBottom: 4 }}>Mensagem *</label>
                <textarea value={fbMsg} onChange={function(e) { setFbMsg(e.target.value); }} placeholder="Elogios, críticas, sugestões..." rows="4" style={{ width: "100%", padding: "10px 12px", border: "1.5px solid " + BORDER, borderRadius: 8, fontSize: 13, fontFamily: SANS, color: TEXT, background: "#fff", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
              </div>
              <button onClick={function() {
                if (!fbMsg.trim() || fbMsg.trim().length < 3) return;
                fetch("/api/feedback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: fbName || "Anônimo", message: fbMsg, rating: fbRating }) }).then(function() { setFbSent(true); }).catch(function() { setFbSent(true); });
              }} disabled={fbMsg.length < 3} style={{ width: "100%", padding: "12px", background: fbMsg.length >= 3 ? GREEN : DIM, color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: fbMsg.length >= 3 ? "pointer" : "default", fontFamily: SANS, opacity: fbMsg.length >= 3 ? 1 : 0.5 }}>Enviar</button>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <span style={{ fontSize: 48, display: "block", marginBottom: 12 }}>💚</span>
              <h3 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 800, color: TEXT, fontFamily: SERIF }}>Obrigado!</h3>
              <p style={{ margin: "0 0 16px", fontSize: 13, color: SUB, fontFamily: SANS }}>Cada mensagem é lida pessoalmente.</p>
              <button onClick={function() { setShowFeedback(false); setFbSent(false); setFbMsg(""); setFbName(""); setFbRating(null); }} style={{ padding: "10px 20px", background: GREEN, color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: SANS }}>Fechar</button>
            </div>
          )}
        </Modal>
      )}

      {/* Mobile Tab Bar — floating Instagram-style, compacta ao rolar */}
      <div className="mobile-tab-bar" style={{ display: "none", position: "fixed", bottom: 32, left: 12, right: 12, zIndex: 200, background: "rgba(255,255,255,0.82)", backdropFilter: "blur(24px) saturate(180%)", WebkitBackdropFilter: "blur(24px) saturate(180%)", border: "1px solid rgba(255,255,255,0.5)", borderRadius: 28, boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)", transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)" }}>
        {showMaisMenu && (
          <div style={{ position: "absolute", bottom: "100%", right: 8, background: "white", borderRadius: 16, boxShadow: "0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)", border: "1px solid " + BORDER, padding: "6px 0", minWidth: 180, marginBottom: 10 }}>
            {[
              { label: "Feedback", action: function(){ setShowFeedback(true); setShowMaisMenu(false); } },
              { label: "Sobre", action: function(){ window.location.href="/sobre"; } },
            ].map(function(item, i) {
              return <button key={i} onClick={item.action} style={{ display: "block", width: "100%", textAlign: "left", padding: "13px 20px", background: "none", border: "none", fontSize: 15, fontWeight: 500, color: TEXT, fontFamily: SANS, cursor: "pointer" }}>{item.label}</button>;
            })}
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center", padding: tabBarHidden ? "6px 8px" : "7px 8px", transition: "padding 0.35s cubic-bezier(0.4, 0, 0.2, 1)" }}>
          {[
            { label: "Biografia", action: function(){ window.location.href="/biografia"; setShowMaisMenu(false); }, icon: function(a){ return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={a?"#4FC3F7":"rgba(0,0,0,0.3)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>; } },
            { label: "Ranking", action: function(){ setShowRanking(true); setShowMaisMenu(false); }, icon: function(a){ return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={a?"#4FC3F7":"rgba(0,0,0,0.3)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>; } },
            { label: "Conquistas", action: function(){ setShowTitles(true); setShowMaisMenu(false); }, icon: function(a){ return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={a?"#4FC3F7":"rgba(0,0,0,0.3)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>; } },
            { label: "Mais", action: function(){ setShowMaisMenu(!showMaisMenu); }, icon: function(a){ return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={a?"#4FC3F7":"rgba(0,0,0,0.3)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>; } },
          ].map(function(tab, i) {
            var isActive = (tab.label === "Mais" && showMaisMenu);
            return (
              <button key={i} onClick={tab.action} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, background: "none", border: "none", cursor: "pointer", padding: "3px 10px", minWidth: 52 }}>
                {tab.icon(isActive)}
                <span style={{ fontSize: 9, fontWeight: isActive ? 700 : 500, color: isActive ? "#4FC3F7" : "rgba(0,0,0,0.35)", fontFamily: SANS, maxHeight: tabBarHidden ? 0 : 12, opacity: tabBarHidden ? 0 : 1, overflow: "hidden", transition: "max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease" }}>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ===== PWA INSTALL BOTTOM SHEET ===== */}
      {showAutoInstall && <PWAInstallSheet onClose={function(){ setShowAutoInstall(false); }} onInstall={handleInstall} deferredPrompt={deferredPrompt} />}

    </div>
  );
}

// Static page — no server cost per visit
