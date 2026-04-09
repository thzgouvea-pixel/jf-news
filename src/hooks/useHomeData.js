import { useEffect, useState } from "react";

export default function useHomeData() {
  const [news, setNews] = useState([]);
  const [nextMatch, setNextMatch] = useState(null);
  const [player, setPlayer] = useState(null);
  const [lastMatch, setLastMatch] = useState(null);
  const [matchStats, setMatchStats] = useState(null);
  const [recentForm, setRecentForm] = useState(null);
  const [prizeMoney, setPrizeMoney] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [allLikes, setAllLikes] = useState({});
  const [highlightVideo, setHighlightVideo] = useState(null);
  const [opponentProfile, setOpponentProfile] = useState(null);
  const [winProb, setWinProb] = useState(null);
  const [liveMatch, setLiveMatch] = useState(null);
  const [tournamentFacts, setTournamentFacts] = useState(null);

  useEffect(() => {
    let isMounted = true;

    Promise.allSettled([
      fetch("/api/news").then((r) => r.json()),
      fetch("/api/sofascore-data").then((r) => r.json()),
      fetch("/api/stats").then((r) => r.json()),
      fetch("/api/manual-video").then((r) => r.json()),
      fetch("/api/live").then((r) => r.json()),
    ]).then((results) => {
      if (!isMounted) return;

      const [newsRes, sofaRes, statsRes, videoRes, liveRes] = results;

      if (newsRes.status === "fulfilled" && newsRes.value) {
        const data = newsRes.value;
        if (data.news?.length) setNews(data.news);
        if (data.nextMatch) setNextMatch(data.nextMatch);
        if (data.lastMatch) setLastMatch(data.lastMatch);
        if (data.player) setPlayer(data.player);
      }

      if (sofaRes.status === "fulfilled" && sofaRes.value) {
        const data = sofaRes.value;
        if (data.matchStats) setMatchStats(data.matchStats);
        if (data.recentForm) setRecentForm(data.recentForm);
        if (data.prizeMoney) setPrizeMoney(data.prizeMoney);
        if (data.winProb) setWinProb(data.winProb);
        if (data.opponentProfile) setOpponentProfile(data.opponentProfile);
        if (data.tournamentFacts) setTournamentFacts(data.tournamentFacts);
        if (data.lastMatch?.result) setLastMatch(data.lastMatch);
        if (data.nextMatch?.date) setNextMatch(data.nextMatch);
        if (data.ranking?.ranking) {
          setPlayer((prev) => (prev ? { ...prev, ranking: data.ranking.ranking } : { ranking: data.ranking.ranking }));
        }
      }

      if (statsRes.status === "fulfilled" && statsRes.value?.likes) {
        setAllLikes(statsRes.value.likes);
      }

      if (videoRes.status === "fulfilled" && videoRes.value?.videoId) {
        setHighlightVideo(videoRes.value);
      }

      if (liveRes.status === "fulfilled" && liveRes.value?.live) {
        setLiveMatch(liveRes.value);
      }

      setLastUpdate(new Date().toISOString());
      setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    news,
    nextMatch,
    player,
    lastMatch,
    matchStats,
    recentForm,
    prizeMoney,
    loading,
    lastUpdate,
    allLikes,
    highlightVideo,
    opponentProfile,
    winProb,
    liveMatch,
    tournamentFacts,
  };
}
