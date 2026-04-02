// ===== API: Live Score v2 =====
// OPTIMIZATION: Added HTTP cache headers to prevent KV reads on every request.
// When no live match: caches for 5 minutes at edge (s-maxage=300).
// When live: caches for 30 seconds (s-maxage=30).
// This means crawlers/bots get cached responses without touching KV.

import { kv } from "@vercel/kv";

var RAPIDAPI_HOST = "sofascore6.p.rapidapi.com";
var CACHE_KEY = "fn:liveMatch";
var CACHE_TTL = 290; // seconds — KV cache, slightly under HTTP cache

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

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  var apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    return res.status(200).json({ live: false, error: "no key" });
  }

  try {
    // 1. Check KV cache first
    var cached = await kv.get(CACHE_KEY);
    if (cached) {
      var parsed = typeof cached === "string" ? JSON.parse(cached) : cached;
      // If no live match, cache aggressively at edge (5 min)
      var cacheTime = parsed.live ? 30 : 300;
      res.setHeader("Cache-Control", "s-maxage=" + cacheTime + ", stale-while-revalidate=" + (cacheTime * 2));
      return res.status(200).json({ ...parsed, cached: true });
    }

    // 2. Cache miss — fetch from SofaScore
    var liveMatch = await findLiveMatch(apiKey);

    if (!liveMatch) {
      var noMatch = { live: false, checkedAt: new Date().toISOString() };
      await kv.set(CACHE_KEY, JSON.stringify(noMatch), { ex: CACHE_TTL });
      // Cache for 5 minutes at edge — no need to check more often when no match
      res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
      return res.status(200).json(noMatch);
    }

    // 3. Live match found
    var stats = await fetchStats(liveMatch.id, apiKey);
    var isFonsecaHome = (liveMatch.homeTeam?.slug || liveMatch.homeTeam?.name || "").toLowerCase().includes("fonseca");
    var opponent = isFonsecaHome ? liveMatch.awayTeam : liveMatch.homeTeam;

    var fonsecaStats = null;
    var opponentStats = null;
    if (stats) {
      fonsecaStats = isFonsecaHome ? stats.home : stats.away;
      opponentStats = isFonsecaHome ? stats.away : stats.home;
    }

    var homeScore = liveMatch.homeScore || {};
    var awayScore = liveMatch.awayScore || {};
    var fonsecaSets = [];
    var opponentSets = [];
    for (var i = 1; i <= 5; i++) {
      var k = "period" + i;
      if (homeScore[k] !== undefined && awayScore[k] !== undefined) {
        fonsecaSets.push(isFonsecaHome ? homeScore[k] : awayScore[k]);
        opponentSets.push(isFonsecaHome ? awayScore[k] : homeScore[k]);
      }
    }

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
        sets_won: { fonseca: fonsecaSets.filter(function(s, idx) { return s > opponentSets[idx]; }).length, opponent: opponentSets.filter(function(s, idx) { return s > fonsecaSets[idx]; }).length },
        current_game: isFonsecaHome
          ? { fonseca: homeScore.point, opponent: awayScore.point }
          : { fonseca: awayScore.point, opponent: homeScore.point },
        serving: (liveMatch.firstToServe === 1 && isFonsecaHome) || (liveMatch.firstToServe === 2 && !isFonsecaHome) ? "fonseca" : "opponent",
      },
      stats: { fonseca: fonsecaStats, opponent: opponentStats },
      updatedAt: new Date().toISOString(),
    };

    await kv.set(CACHE_KEY, JSON.stringify(payload), { ex: 55 });
    // Live match: cache only 30s at edge for fresher updates
    res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=60");
    return res.status(200).json(payload);

  } catch (err) {
    console.error("[live] Error:", err);
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    return res.status(200).json({ live: false, error: err.message });
  }
}
