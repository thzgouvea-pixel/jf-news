// pages/api/live.js — Live match detection via SofaScore (fix: UTC date + status)
import { kv } from "@vercel/kv";

var RAPIDAPI_HOST = "sofascore6.p.rapidapi.com";

async function sofaFetch(path, apiKey) {
  var url = "https://" + RAPIDAPI_HOST + "/api/sofascore" + path;
  var res = await fetch(url, {
    headers: { "x-rapidapi-host": RAPIDAPI_HOST, "x-rapidapi-key": apiKey },
  });
  if (!res.ok) return null;
  return res.json();
}

function findFonsecaInList(matchData) {
  var matches = [];
  if (Array.isArray(matchData)) matches = matchData;
  else if (matchData && matchData.events) matches = matchData.events;
  else if (matchData) { for (var k of Object.keys(matchData)) { if (Array.isArray(matchData[k])) { matches = matchData[k]; break; } } }
  for (var i = 0; i < matches.length; i++) {
    var m = matches[i];
    var homeSlug = (m.homeTeam && (m.homeTeam.slug || m.homeTeam.name || "")).toLowerCase();
    var awaySlug = (m.awayTeam && (m.awayTeam.slug || m.awayTeam.name || "")).toLowerCase();
    var slug = (m.slug || "").toLowerCase();
    if (slug.includes("fonseca") || homeSlug.includes("fonseca") || awaySlug.includes("fonseca")) return m;
  }
  return null;
}

function isMatchLive(status) {
  if (!status) return false;
  var t = (status.type || "").toLowerCase();
  var d = (status.description || "").toLowerCase();
  return t === "inprogress" || t === "in_progress" || t === "live" || t === "started" ||
    d.includes("live") || d.includes("progress") || d.includes("set ") || d.includes("andamento");
}

export default async function handler(req, res) {
  try {
    var apiKey = process.env.RAPIDAPI_KEY;

    // Check KV cache first (25s TTL)
    var cached = await kv.get("fn:live");
    if (cached) {
      var data = typeof cached === "string" ? JSON.parse(cached) : cached;
      if (data.checkedAt && Date.now() - new Date(data.checkedAt).getTime() < 25000) {
        res.setHeader("Cache-Control", "public, s-maxage=10, stale-while-revalidate=20");
        return res.status(200).json(data);
      }
    }

    // FIX: check today AND yesterday in UTC (covers BRT evening matches)
    var now = new Date();
    var today = now.toISOString().split("T")[0];
    var yesterday = new Date(now.getTime() - 86400000).toISOString().split("T")[0];

    var fonsecaMatch = null;
    var matchData = await sofaFetch("/v1/match/list?sport_slug=tennis&date=" + today, apiKey);
    if (matchData) fonsecaMatch = findFonsecaInList(matchData);
    if (!fonsecaMatch) {
      var yData = await sofaFetch("/v1/match/list?sport_slug=tennis&date=" + yesterday, apiKey);
      if (yData) fonsecaMatch = findFonsecaInList(yData);
    }

    if (!fonsecaMatch) {
      var result = { live: false, checkedAt: now.toISOString() };
      await kv.set("fn:live", JSON.stringify(result), { ex: 60 });
      return res.status(200).json(result);
    }

    var status = fonsecaMatch.status || {};
    var isLive = isMatchLive(status);
    var isFinished = status.type === "finished" || status.isFinished;

    // DEBUG: log status so you can see what SofaScore returns
    console.log("[live] match found:", fonsecaMatch.id, "status:", JSON.stringify(status), "isLive:", isLive);

    if (!isLive) {
      var result = {
        live: false,
        matchFound: true,
        matchId: fonsecaMatch.id,
        status: isFinished ? "finished" : (status.type || "notstarted"),
        statusRaw: status,
        checkedAt: now.toISOString(),
      };
      await kv.set("fn:live", JSON.stringify(result), { ex: 30 });
      return res.status(200).json(result);
    }

    // Match is LIVE
    var homeTeam = fonsecaMatch.homeTeam || {};
    var awayTeam = fonsecaMatch.awayTeam || {};
    var isFonsecaHome = (homeTeam.slug || homeTeam.name || "").toLowerCase().includes("fonseca");
    var opponent = isFonsecaHome ? awayTeam : homeTeam;
    var homeScore = fonsecaMatch.homeScore || {};
    var awayScore = fonsecaMatch.awayScore || {};
    var fScore = isFonsecaHome ? homeScore : awayScore;
    var oScore = isFonsecaHome ? awayScore : homeScore;

    var fSets = [], oSets = [];
    for (var si = 1; si <= 5; si++) {
      var key = "period" + si;
      if (fScore[key] !== undefined && oScore[key] !== undefined) { fSets.push(fScore[key]); oSets.push(oScore[key]); }
    }

    var currentGame = {};
    if (fScore.point !== undefined) currentGame.fonseca = fScore.point;
    if (oScore.point !== undefined) currentGame.opponent = oScore.point;

    var fSetsWon = 0, oSetsWon = 0;
    for (var sj = 0; sj < fSets.length - 1; sj++) {
      if (fSets[sj] > oSets[sj]) fSetsWon++; else oSetsWon++;
    }

    var tournament = fonsecaMatch.tournament || {};
    var roundInfo = fonsecaMatch.roundInfo || {};
    var venue = null;
    if (fonsecaMatch.venue) { venue = typeof fonsecaMatch.venue === "string" ? fonsecaMatch.venue : (fonsecaMatch.venue.name || fonsecaMatch.venue.stadium || null); }
    if (!venue && fonsecaMatch.courtName) venue = fonsecaMatch.courtName;

    var result = {
      live: true,
      matchId: fonsecaMatch.id,
      status: status.description || "Em andamento",
      opponent: { name: opponent.shortName || opponent.name || "Oponente", country: opponent.country ? opponent.country.name : "" },
      score: {
        fonseca_sets: fSets, opponent_sets: oSets,
        sets_won: { fonseca: fSetsWon, opponent: oSetsWon },
        current_game: currentGame,
        serving: fonsecaMatch.servingTeam ? ((fonsecaMatch.servingTeam === "homeTeam" && isFonsecaHome) || (fonsecaMatch.servingTeam === "awayTeam" && !isFonsecaHome) ? "fonseca" : "opponent") : "",
      },
      tournament: tournament.name || "",
      surface: (function() { var gt = (fonsecaMatch.groundType || tournament.groundType || "").toLowerCase(); if (gt === "clay") return "Saibro"; if (gt === "grass") return "Grama"; return "Duro"; })(),
      round: roundInfo.name || "",
      court: venue,
      checkedAt: now.toISOString(),
    };

    try {
      var statsData = await sofaFetch("/v1/match/statistics?match_id=" + fonsecaMatch.id, apiKey);
      if (statsData && Array.isArray(statsData)) {
        var allPeriod = statsData.find(function(p) { return p.period === "ALL"; });
        if (allPeriod && allPeriod.groups) {
          var fStats = {}, oStats = {};
          allPeriod.groups.forEach(function(group) { (group.statisticsItems || []).forEach(function(item) { var k2 = (item.key || item.name || "").toLowerCase().replace(/\s+/g, "_"); var hv = item.homeValue !== undefined ? item.homeValue : (parseInt(item.home, 10) || 0); var av = item.awayValue !== undefined ? item.awayValue : (parseInt(item.away, 10) || 0); fStats[k2] = isFonsecaHome ? hv : av; oStats[k2] = isFonsecaHome ? av : hv; }); });
          result.stats = { fonseca: fStats, opponent: oStats };
        }
      }
    } catch (e) {}

    await kv.set("fn:live", JSON.stringify(result), { ex: 30 });
    res.setHeader("Cache-Control", "public, s-maxage=10, stale-while-revalidate=20");
    return res.status(200).json(result);

  } catch (e) {
    console.error("[live] error:", e.message);
    return res.status(200).json({ live: false, error: e.message, checkedAt: new Date().toISOString() });
  }
}
