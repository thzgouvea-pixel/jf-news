// pages/api/live.js — Live match detection via SofaScore with 30s KV cache
import { kv } from "@vercel/kv";

var RAPIDAPI_HOST = "sofascore6.p.rapidapi.com";
var FONSECA_TEAM_ID = 403869;

async function sofaFetch(path, apiKey) {
  var url = "https://" + RAPIDAPI_HOST + "/api/sofascore" + path;
  var res = await fetch(url, {
    headers: { "x-rapidapi-host": RAPIDAPI_HOST, "x-rapidapi-key": apiKey },
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function handler(req, res) {
  try {
    var apiKey = process.env.RAPIDAPI_KEY;

    // Check KV cache first (30s TTL)
    var cached = await kv.get("fn:live");
    if (cached) {
      var data = typeof cached === "string" ? JSON.parse(cached) : cached;
      // Check if cache is fresh (< 30s)
      if (data.checkedAt && Date.now() - new Date(data.checkedAt).getTime() < 30000) {
        res.setHeader("Cache-Control", "public, s-maxage=10, stale-while-revalidate=20");
        return res.status(200).json(data);
      }
    }

    // Find today's Fonseca matches
    var today = new Date().toISOString().split("T")[0];
    var matchData = await sofaFetch("/v1/match/list?sport_slug=tennis&date=" + today, apiKey);

    if (!matchData) {
      var result = { live: false, checkedAt: new Date().toISOString() };
      await kv.set("fn:live", JSON.stringify(result), { ex: 60 });
      return res.status(200).json(result);
    }

    // Find Fonseca's match
    var matches = [];
    if (Array.isArray(matchData)) matches = matchData;
    else if (matchData.events) matches = matchData.events;
    else { for (var k of Object.keys(matchData)) { if (Array.isArray(matchData[k])) { matches = matchData[k]; break; } } }

    var fonsecaMatch = null;
    for (var i = 0; i < matches.length; i++) {
      var m = matches[i];
      var homeSlug = (m.homeTeam && (m.homeTeam.slug || m.homeTeam.name || "")).toLowerCase();
      var awaySlug = (m.awayTeam && (m.awayTeam.slug || m.awayTeam.name || "")).toLowerCase();
      var slug = (m.slug || "").toLowerCase();
      if (slug.includes("fonseca") || homeSlug.includes("fonseca") || awaySlug.includes("fonseca")) {
        fonsecaMatch = m;
        break;
      }
    }

    if (!fonsecaMatch) {
      var result = { live: false, checkedAt: new Date().toISOString() };
      await kv.set("fn:live", JSON.stringify(result), { ex: 60 });
      return res.status(200).json(result);
    }

    var status = fonsecaMatch.status || {};
    var isLive = status.type === "inprogress" || status.type === "live" || (status.description && status.description.toLowerCase().includes("live"));
    var isFinished = status.type === "finished" || status.isFinished;

    if (!isLive) {
      // Match exists but not live yet (or already finished)
      var result = {
        live: false,
        matchFound: true,
        status: isFinished ? "finished" : "notstarted",
        checkedAt: new Date().toISOString(),
      };
      await kv.set("fn:live", JSON.stringify(result), { ex: 30 });
      return res.status(200).json(result);
    }

    // Match is LIVE — build response
    var homeTeam = fonsecaMatch.homeTeam || {};
    var awayTeam = fonsecaMatch.awayTeam || {};
    var isFonsecaHome = (homeTeam.slug || homeTeam.name || "").toLowerCase().includes("fonseca");
    var opponent = isFonsecaHome ? awayTeam : homeTeam;
    var homeScore = fonsecaMatch.homeScore || {};
    var awayScore = fonsecaMatch.awayScore || {};
    var fScore = isFonsecaHome ? homeScore : awayScore;
    var oScore = isFonsecaHome ? awayScore : homeScore;

    // Build sets array
    var fSets = [];
    var oSets = [];
    for (var si = 1; si <= 5; si++) {
      var key = "period" + si;
      if (fScore[key] !== undefined && oScore[key] !== undefined) {
        fSets.push(fScore[key]);
        oSets.push(oScore[key]);
      }
    }

    // Current game score
    var currentGame = {};
    if (fScore.point !== undefined) currentGame.fonseca = fScore.point;
    if (oScore.point !== undefined) currentGame.opponent = oScore.point;

    // Sets won
    var fSetsWon = 0;
    var oSetsWon = 0;
    for (var sj = 0; sj < fSets.length - 1; sj++) {
      if (fSets[sj] > oSets[sj]) fSetsWon++;
      else oSetsWon++;
    }

    var tournament = fonsecaMatch.tournament || {};
    var roundInfo = fonsecaMatch.roundInfo || {};
    var venue = fonsecaMatch.venue || fonsecaMatch.courtName || fonsecaMatch.court || null;
    if (!venue && fonsecaMatch.venue && typeof fonsecaMatch.venue === "object") venue = fonsecaMatch.venue.name || fonsecaMatch.venue.stadium || null;

    var result = {
      live: true,
      matchId: fonsecaMatch.id,
      status: status.description || "Em andamento",
      opponent: {
        name: opponent.shortName || opponent.name || "Oponente",
        country: opponent.country ? opponent.country.name : "",
      },
      score: {
        fonseca_sets: fSets,
        opponent_sets: oSets,
        sets_won: { fonseca: fSetsWon, opponent: oSetsWon },
        current_game: currentGame,
        serving: fonsecaMatch.servingTeam ? ((fonsecaMatch.servingTeam === "homeTeam" && isFonsecaHome) || (fonsecaMatch.servingTeam === "awayTeam" && !isFonsecaHome) ? "fonseca" : "opponent") : "",
      },
      tournament: tournament.name || "",
      surface: (function() {
        var gt = fonsecaMatch.groundType || tournament.groundType || "";
        if (gt.toLowerCase() === "clay") return "Saibro";
        if (gt.toLowerCase() === "grass") return "Grama";
        return "Duro";
      })(),
      round: roundInfo.name || "",
      court: venue,
      checkedAt: new Date().toISOString(),
    };

    // Also try to get live stats
    try {
      var statsData = await sofaFetch("/v1/match/statistics?match_id=" + fonsecaMatch.id, apiKey);
      if (statsData && Array.isArray(statsData)) {
        var allPeriod = statsData.find(function(p) { return p.period === "ALL"; });
        if (allPeriod && allPeriod.groups) {
          var fStats = {};
          var oStats = {};
          allPeriod.groups.forEach(function(group) {
            (group.statisticsItems || []).forEach(function(item) {
              var k = (item.key || item.name || "").toLowerCase().replace(/\s+/g, "_");
              var hv = item.homeValue !== undefined ? item.homeValue : (parseInt(item.home, 10) || 0);
              var av = item.awayValue !== undefined ? item.awayValue : (parseInt(item.away, 10) || 0);
              fStats[k] = isFonsecaHome ? hv : av;
              oStats[k] = isFonsecaHome ? av : hv;
            });
          });
          result.stats = { fonseca: fStats, opponent: oStats };
        }
      }
    } catch (e) { /* stats optional */ }

    await kv.set("fn:live", JSON.stringify(result), { ex: 30 });
    res.setHeader("Cache-Control", "public, s-maxage=10, stale-while-revalidate=20");
    return res.status(200).json(result);

  } catch (e) {
    return res.status(200).json({ live: false, error: e.message, checkedAt: new Date().toISOString() });
  }
}
