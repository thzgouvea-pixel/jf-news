// ===== API: Live Score =====
// GET /api/live
// Checks if Fonseca has a live match today via SofaScore RapidAPI.
// If live: returns match + statistics (2 requests).
// If not live: returns { live: false } from KV cache (0 requests).
// Called client-side every 60s only when page is visible.

import { kv } from "@vercel/kv";

var RAPIDAPI_HOST = "sofascore6.p.rapidapi.com";
var FONSECA_SLUG = "fonseca";
var CACHE_KEY = "fn:liveMatch";
var CACHE_TTL = 55; // seconds — slightly under polling interval

async function sofaFetch(path, apiKey) {
  var url = "https://" + RAPIDAPI_HOST + "/api/sofascore" + path;
  var res = await fetch(url, {
    headers: {
      "x-rapidapi-host": RAPIDAPI_HOST,
      "x-rapidapi-key": apiKey,
    },
  });
  if (!res.ok) return null;
  return res.json();
}

async function findLiveMatch(apiKey) {
  var today = new Date().toISOString().split("T")[0];
  var data = await sofaFetch("/v1/match/list?sport_slug=tennis&date=" + today, apiKey);
  if (!data) return null;

  var matches = [];
  if (Array.isArray(data)) matches = data;
  else if (data.events) matches = data.events;
  else {
    for (var k of Object.keys(data)) {
      if (Array.isArray(data[k])) { matches = data[k]; break; }
    }
  }

  // Filter Fonseca matches that are in progress
  return matches.find(function (m) {
    var slug = (m.slug || "").toLowerCase();
    var home = (m.homeTeam && (m.homeTeam.slug || m.homeTeam.name || "")).toLowerCase();
    var away = (m.awayTeam && (m.awayTeam.slug || m.awayTeam.name || "")).toLowerCase();
    var isFonseca = slug.includes("fonseca") || home.includes("fonseca") || away.includes("fonseca");
    var isLive = m.status && (
      m.status.type === "inprogress" ||
      m.status.description === "In progress" ||
      m.status.type === "1st set" ||
      m.status.type === "2nd set" ||
      m.status.type === "3rd set"
    );
    return isFonseca && isLive;
  }) || null;
}

async function fetchStats(matchId, apiKey) {
  var data = await sofaFetch("/v1/match/statistics?match_id=" + matchId, apiKey);
  if (!data || !Array.isArray(data)) return null;

  var allPeriod = data.find(function (p) { return p.period === "ALL"; });
  if (!allPeriod || !allPeriod.groups) return null;

  var home = {}, away = {};
  allPeriod.groups.forEach(function (group) {
    (group.statisticsItems || []).forEach(function (item) {
      var key = (item.key || item.name || "").toLowerCase().replace(/\s+/g, "_");
      home[key] = item.homeValue !== undefined ? item.homeValue : (parseInt(item.home, 10) || 0);
      away[key] = item.awayValue !== undefined ? item.awayValue : (parseInt(item.away, 10) || 0);
    });
  });

  return { home, away };
}

function parseScore(m) {
  var homeScore = m.homeScore || {};
  var awayScore = m.awayScore || {};
  var sets = [];
  for (var i = 1; i <= 5; i++) {
    var k = "period" + i;
    if (homeScore[k] !== undefined && awayScore[k] !== undefined) {
      sets.push({ home: homeScore[k], away: awayScore[k] });
    }
  }
  return {
    sets,
    currentGame: {
      home: homeScore.current,
      away: awayScore.current,
    },
    serving: m.firstToServe, // 1 = home, 2 = away
  };
}

export default async function handler(req, res) {
  // Only GET
  if (req.method !== "GET") return res.status(405).end();

  res.setHeader("Cache-Control", "no-store");

  var apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) return res.status(200).json({ live: false, error: "no key" });

  try {
    // 1. Check KV cache first to avoid hitting RapidAPI on every request
    var cached = await kv.get(CACHE_KEY);
    if (cached) {
      // Cache hit — return what we have (could be { live: false } or live data)
      var parsed = typeof cached === "string" ? JSON.parse(cached) : cached;
      return res.status(200).json({ ...parsed, cached: true });
    }

    // 2. Cache miss — fetch from SofaScore (1 request)
    var liveMatch = await findLiveMatch(apiKey);

    if (!liveMatch) {
      // No live match — cache for 55s so next poll doesn't hit API
      var noMatch = { live: false, checkedAt: new Date().toISOString() };
      await kv.set(CACHE_KEY, JSON.stringify(noMatch), { ex: CACHE_TTL });
      return res.status(200).json(noMatch);
    }

    // 3. Live match found — fetch stats (1 more request)
    var stats = await fetchStats(liveMatch.id, apiKey);
    var isFonsecaHome = (liveMatch.homeTeam?.slug || liveMatch.homeTeam?.name || "").toLowerCase().includes("fonseca");
    var opponent = isFonsecaHome ? liveMatch.awayTeam : liveMatch.homeTeam;

    var fonsecaStats = null;
    var opponentStats = null;
    if (stats) {
      fonsecaStats = isFonsecaHome ? stats.home : stats.away;
      opponentStats = isFonsecaHome ? stats.away : stats.home;
    }

    var score = parseScore(liveMatch);
    // Flip score so Fonseca is always "home" side in our response
    var fonsecaSets = score.sets.map(s => isFonsecaHome ? s.home : s.away);
    var opponentSets = score.sets.map(s => isFonsecaHome ? s.away : s.home);

    var payload = {
      live: true,
      match_id: liveMatch.id,
      tournament: (liveMatch.tournament?.name || ""),
      round: (liveMatch.roundInfo?.name || ""),
      status: liveMatch.status?.description || "Em jogo",
      opponent: {
        name: opponent.shortName || opponent.name,
        ranking: opponent.ranking || null,
        country: opponent.country?.name || "",
      },
      score: {
        fonseca_sets: fonsecaSets,
        opponent_sets: opponentSets,
        sets_won: { fonseca: fonsecaSets.filter((s, i) => s > opponentSets[i]).length, opponent: opponentSets.filter((s, i) => s > fonsecaSets[i]).length },
        current_game: isFonsecaHome
          ? { fonseca: score.currentGame.home, opponent: score.currentGame.away }
          : { fonseca: score.currentGame.away, opponent: score.currentGame.home },
        serving: (score.serving === 1 && isFonsecaHome) || (score.serving === 2 && !isFonsecaHome) ? "fonseca" : "opponent",
      },
      stats: {
        fonseca: fonsecaStats,
        opponent: opponentStats,
      },
      updatedAt: new Date().toISOString(),
    };

    // Cache for 55s
    await kv.set(CACHE_KEY, JSON.stringify(payload), { ex: CACHE_TTL });

    return res.status(200).json(payload);

  } catch (err) {
    console.error("[live] Error:", err);
    return res.status(200).json({ live: false, error: err.message });
  }
}
