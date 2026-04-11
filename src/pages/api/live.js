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
  else if (matchData) { var mKeys = Object.keys(matchData); for (var ki = 0; ki < mKeys.length; ki++) { var k = mKeys[ki]; if (Array.isArray(matchData[k])) { matches = matchData[k]; break; } } }
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
  if (status.isInProgress === true) return true;
  if (status.isStarted === true && !status.isFinished) return true;
  var t = (status.type || "").toLowerCase();
  var d = (status.description || "").toLowerCase();
  return t === "inprogress" || t === "in_progress" || t === "live" || t === "started" ||
    d.includes("live") || d.includes("progress") || d.includes("set ") || d.includes("andamento");
}

export default async function handler(req, res) {
  try {
    var apiKey = process.env.RAPIDAPI_KEY;

    // Check KV cache first (respect KV TTL — no need for extra time check since KV ex handles expiry)
    var cached = await kv.get("fn:live");
    if (cached) {
      var data = typeof cached === "string" ? JSON.parse(cached) : cached;
      var cacheAge = data.checkedAt ? Date.now() - new Date(data.checkedAt).getTime() : Infinity;
      // If live, use short cache (15s). If not live, trust KV TTL fully.
      var maxAge = data.live ? 15000 : 90000;
      if (cacheAge < maxAge) {
        var smaxage = data.live ? 10 : (data.matchFound ? 120 : 300);
        res.setHeader("Cache-Control", "public, s-maxage=" + smaxage + ", stale-while-revalidate=" + (smaxage * 2));
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
      await kv.set("fn:live", JSON.stringify(result), { ex: 300 });
      res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
      return res.status(200).json(result);
    }

    var status = fonsecaMatch.status || {};
    var isLive = isMatchLive(status);
    var isFinished = status.type === "finished" || status.isFinished;

    // DEBUG: log status so you can see what SofaScore returns
    console.log("[live] match found:", fonsecaMatch.id, "status:", JSON.stringify(status), "isLive:", isLive);

    if (!isLive) {
      // ===== AUTO-UPDATE: When match just finished, save to lastMatch + clear nextMatch =====
      if (isFinished && fonsecaMatch.id) {
        try {
          var prevId = await kv.get("fn:lastStatsEventId");
          if (prevId !== String(fonsecaMatch.id)) {
            // Check manual lock before overwriting lastMatch
            var manualLock = await kv.get("fn:lastMatchManualLock");
            if (manualLock) {
              console.log("[live] Manual lock active for lastMatch, skipping auto-update");
            } else {
            console.log("[live] Match finished! Auto-updating lastMatch + clearing nextMatch");
            var homeTeamF = fonsecaMatch.homeTeam || {};
            var awayTeamF = fonsecaMatch.awayTeam || {};
            var isFH = (homeTeamF.slug || homeTeamF.name || "").toLowerCase().includes("fonseca");
            var oppF = isFH ? awayTeamF : homeTeamF;
            var fScoreF = isFH ? (fonsecaMatch.homeScore || {}) : (fonsecaMatch.awayScore || {});
            var oScoreF = isFH ? (fonsecaMatch.awayScore || {}) : (fonsecaMatch.homeScore || {});
            var fSetsF = [], oSetsF = [];
            for (var si2 = 1; si2 <= 5; si2++) { var k2 = "period" + si2; if (fScoreF[k2] !== undefined && oScoreF[k2] !== undefined) { fSetsF.push(fScoreF[k2]); oSetsF.push(oScoreF[k2]); } }
            var scoreStr = fSetsF.map(function(s, idx) { return s + "-" + oSetsF[idx]; }).join(" ");
            var fW2 = 0, oW2 = 0; fSetsF.forEach(function(s, idx) { if (s > oSetsF[idx]) fW2++; else oW2++; });
            var tournF = fonsecaMatch.tournament || {};
            var roundF = fonsecaMatch.roundInfo || {};
            var gt = (fonsecaMatch.groundType || tournF.groundType || "").toLowerCase();
            var surfF = gt === "clay" ? "Clay" : (gt === "grass" ? "Grass" : "Hard");
            var venueF = fonsecaMatch.courtName || (fonsecaMatch.venue && (typeof fonsecaMatch.venue === "string" ? fonsecaMatch.venue : fonsecaMatch.venue.name)) || "";
            var lastMatchData = {
              id: fonsecaMatch.id,
              result: fW2 > oW2 ? "V" : "D",
              score: scoreStr,
              opponent_name: oppF.shortName || oppF.name || "Oponente",
              opponent_id: oppF.id || null,
              opponent_country: oppF.country ? oppF.country.name : "",
              tournament_name: tournF.name || (tournF.uniqueTournament && tournF.uniqueTournament.name) || "",
              tournament_category: "",
              surface: surfF,
              round: roundF.name || "",
              date: fonsecaMatch.startTimestamp ? new Date(fonsecaMatch.startTimestamp * 1000).toISOString() : now.toISOString(),
              court: venueF,
              finished: true,
              isFonsecaHome: isFH,
            };
            // Categorize tournament
            var tLow = lastMatchData.tournament_name.toLowerCase();
            if (["australian open","roland garros","french open","wimbledon","us open"].some(function(g){return tLow.includes(g);})) lastMatchData.tournament_category = "Grand Slam";
            else if (tLow.includes("1000") || ["monte carlo","madrid","roma","indian wells","miami","canadian","cincinnati","shanghai","paris"].some(function(m){return tLow.includes(m);})) lastMatchData.tournament_category = "Masters 1000";
            else if (tLow.includes("500")) lastMatchData.tournament_category = "ATP 500";
            else if (tLow.includes("250")) lastMatchData.tournament_category = "ATP 250";

            await Promise.all([
              kv.set("fn:lastMatch", JSON.stringify(lastMatchData), { ex: 604800 }),
              kv.set("fn:lastStatsEventId", String(fonsecaMatch.id), { ex: 604800 }),
              kv.del("fn:nextMatch"),
              kv.del("fn:winProb"),
            ]);

            // Update recentForm — prepend this match, keep last 10
            try {
              var existingForm = await kv.get("fn:recentForm");
              var formArr = existingForm ? (typeof existingForm === "string" ? JSON.parse(existingForm) : existingForm) : [];
              if (!Array.isArray(formArr)) formArr = [];
              var newEntry = { result: lastMatchData.result, score: lastMatchData.score, opponent_name: lastMatchData.opponent_name, tournament: lastMatchData.tournament_name, date: lastMatchData.date };
              // Don't duplicate
              var alreadyExists = formArr.some(function(f) { return f.opponent_name === newEntry.opponent_name && f.score === newEntry.score; });
              if (!alreadyExists) {
                formArr.unshift(newEntry);
                if (formArr.length > 10) formArr = formArr.slice(0, 10);
                await kv.set("fn:recentForm", JSON.stringify(formArr), { ex: 604800 });
                console.log("[live] recentForm updated: " + formArr.length + " entries");
              }
            } catch(formErr) { console.log("[live] recentForm error: " + formErr.message); }
            console.log("[live] lastMatch saved: " + lastMatchData.result + " " + lastMatchData.score + " vs " + lastMatchData.opponent_name);

            // Also try to fetch and save match stats
            try {
              var finStatsData = await sofaFetch("/v1/match/statistics?match_id=" + fonsecaMatch.id, apiKey);
              if (finStatsData && Array.isArray(finStatsData)) {
                var finAllPeriod = finStatsData.find(function(p) { return p.period === "ALL"; });
                if (finAllPeriod && finAllPeriod.groups) {
                  var finFS = {}, finOS = {};
                  finAllPeriod.groups.forEach(function(group) { (group.statisticsItems || []).forEach(function(item) { var kk = (item.key || "").toLowerCase().replace(/\s+/g, ""); var hv = item.homeValue !== undefined ? item.homeValue : (parseInt(item.home) || 0); var av = item.awayValue !== undefined ? item.awayValue : (parseInt(item.away) || 0); finFS[kk] = isFH ? hv : av; finOS[kk] = isFH ? av : hv; }); });
                  await kv.set("fn:matchStats", JSON.stringify({ fonseca: finFS, opponent: finOS, opponent_name: lastMatchData.opponent_name, opponent_country: lastMatchData.opponent_country, tournament: lastMatchData.tournament_name, result: lastMatchData.result, score: lastMatchData.score, date: lastMatchData.date }), { ex: 604800 });
                  console.log("[live] matchStats saved");
                }
              }
            } catch(statsErr) { console.log("[live] stats fetch error: " + statsErr.message); }
            } // end of manual lock else
          }
        } catch(autoErr) { console.log("[live] auto-update error: " + autoErr.message); }
      }

      var result = {
        live: false,
        matchFound: true,
        matchId: fonsecaMatch.id,
        status: isFinished ? "finished" : (status.type || "notstarted"),
        statusRaw: status,
        checkedAt: now.toISOString(),
      };
      await kv.set("fn:live", JSON.stringify(result), { ex: 120 });
      res.setHeader("Cache-Control", "public, s-maxage=120, stale-while-revalidate=240");
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
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
    return res.status(200).json({ live: false, error: e.message, checkedAt: new Date().toISOString() });
  }
}
