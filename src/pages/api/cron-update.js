// ===== CRON: SofaScore Update v3 =====
// TESTED ENDPOINTS:
//   GET /v1/match/list?sport_slug=tennis&date=YYYY-MM-DD → 585 items, filter by "fonseca"
//   GET /v1/match/statistics?match_id=XXXXX → aces, DFs, serve %, winners
//   GET /v1/team/details?team_id=403869 → team/player info
// Runs 3x/day via cron-job.org POST to /api/cron-update
// Host: sofascore6.p.rapidapi.com
// Path prefix: /api/sofascore

import { kv } from "@vercel/kv";

var RAPIDAPI_HOST = "sofascore6.p.rapidapi.com";
var FONSECA_SLUG = "fonseca";
var FONSECA_TEAM_ID = 403869;

async function sofaFetch(path, apiKey) {
  var url = "https://" + RAPIDAPI_HOST + "/api/sofascore" + path;
  console.log("[cron] Fetching:", path);
  var res = await fetch(url, {
    headers: {
      "x-rapidapi-host": RAPIDAPI_HOST,
      "x-rapidapi-key": apiKey
    }
  });
  if (!res.ok) {
    console.log("[cron] Error " + res.status + " for " + path);
    return null;
  }
  return res.json();
}

// Fetch ranking via direct SofaScore API (free, no RapidAPI quota)
async function fetchRanking() {
  try {
    var res = await fetch("https://api.sofascore.com/api/v1/team/" + FONSECA_TEAM_ID, {
      headers: { "User-Agent": "FonsecaNews/3.0" }
    });
    if (!res.ok) return null;
    var data = await res.json();
    var team = data.team || data;
    return {
      ranking: team.ranking || null,
      points: team.rankingPoints || null,
      previousRanking: team.previousRanking || null,
      bestRanking: team.bestRanking || null
    };
  } catch (e) {
    console.log("[cron] Direct ranking failed:", e.message);
    return null;
  }
}

// Find Fonseca matches from "Get matches by date"
async function findFonsecaMatches(date, apiKey) {
  var dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD
  var data = await sofaFetch("/v1/match/list?sport_slug=tennis&date=" + dateStr, apiKey);
  
  if (!data) return [];

  // Handle different response formats
  var matches = [];
  if (Array.isArray(data)) {
    matches = data;
  } else if (data.events && Array.isArray(data.events)) {
    matches = data.events;
  } else if (typeof data === "object") {
    // Try to find any array in the response
    var keys = Object.keys(data);
    for (var k = 0; k < keys.length; k++) {
      if (Array.isArray(data[keys[k]])) {
        matches = data[keys[k]];
        console.log("[cron] Found array in key: " + keys[k] + " with " + matches.length + " items");
        break;
      }
    }
    if (matches.length === 0) {
      console.log("[cron] Response keys: " + keys.join(", ") + " | type: " + typeof data + " | sample: " + JSON.stringify(data).substring(0, 300));
    }
  }

  console.log("[cron] Date " + dateStr + ": " + matches.length + " total matches");

  // Filter matches containing "fonseca" in slug or team names
  var fonsecaMatches = matches.filter(function(m) {
    var slug = (m.slug || "").toLowerCase();
    var homeName = (m.homeTeam && (m.homeTeam.slug || m.homeTeam.name || "")).toLowerCase();
    var awayName = (m.awayTeam && (m.awayTeam.slug || m.awayTeam.name || "")).toLowerCase();
    return slug.indexOf("fonseca") !== -1 || homeName.indexOf("fonseca") !== -1 || awayName.indexOf("fonseca") !== -1;
  });

  console.log("[cron] Date " + dateStr + ": " + fonsecaMatches.length + " Fonseca matches");
  return fonsecaMatches;
}

// Search last 7 days for Fonseca's most recent match
async function findLastMatch(apiKey) {
  var today = new Date();
  for (var i = 0; i < 14; i++) {
    var d = new Date(today);
    d.setDate(d.getDate() - i);
    var matches = await findFonsecaMatches(d, apiKey);
    if (matches.length > 0) {
      // Return finished matches only
      var finished = matches.filter(function(m) {
        return m.status && (m.status.type === "finished" || m.status.isFinished);
      });
      if (finished.length > 0) return { match: finished[0], daysAgo: i, requestsUsed: i + 1 };
    }
  }
  return { match: null, daysAgo: -1, requestsUsed: i + 1 };
}

// Search next 7 days for Fonseca's upcoming match
async function findNextMatch(apiKey) {
  var today = new Date();
  for (var i = 0; i <= 14; i++) {
    var d = new Date(today);
    d.setDate(d.getDate() + i);
    var matches = await findFonsecaMatches(d, apiKey);
    if (matches.length > 0) {
      var upcoming = matches.filter(function(m) {
        return m.status && (m.status.type === "notstarted" || !m.status.isFinished);
      });
      if (upcoming.length > 0) return { match: upcoming[0], requestsUsed: i + 1 };
      // If today has a finished match, skip
      if (i === 0) continue;
    }
  }
  return { match: null, requestsUsed: i + 1 };
}

// Fetch match statistics (aces, DFs, winners, serve %)
async function fetchMatchStats(matchId, apiKey) {
  if (!matchId) return null;
  var data = await sofaFetch("/v1/match/statistics?match_id=" + matchId, apiKey);
  if (!data || !Array.isArray(data)) return null;

  // Find the "ALL" period
  var allPeriod = data.find(function(p) { return p.period === "ALL"; });
  if (!allPeriod || !allPeriod.groups) return null;

  var home = {};
  var away = {};
  allPeriod.groups.forEach(function(group) {
    var items = group.statisticsItems || [];
    items.forEach(function(item) {
      var key = (item.key || item.name || "").toLowerCase().replace(/\s+/g, "_");
      home[key] = item.homeValue !== undefined ? item.homeValue : parseInt(item.home, 10) || 0;
      away[key] = item.awayValue !== undefined ? item.awayValue : parseInt(item.away, 10) || 0;
    });
  });

  return { home: home, away: away };
}

// Parse match into our format
function parseMatch(m, isNext) {
  if (!m) return null;
  var homeTeam = m.homeTeam || {};
  var awayTeam = m.awayTeam || {};
  var tournament = m.tournament || {};
  var season = m.season || {};
  var roundInfo = m.roundInfo || {};
  var homeScore = m.homeScore || {};
  var awayScore = m.awayScore || {};

  var isFonsecaHome = (homeTeam.slug || "").toLowerCase().indexOf(FONSECA_SLUG) !== -1;
  var opponent = isFonsecaHome ? awayTeam : homeTeam;

  var result = {
    event_id: m.id,
    tournament_name: tournament.name || "",
    tournament_category: season.name || tournament.name || "",
    surface: "", // API doesn't return surface directly
    city: (tournament.name || "").split(",")[0] || "",
    round: roundInfo.name || "",
    date: m.timestamp ? new Date(m.timestamp * 1000).toISOString() : null,
    opponent_name: opponent.shortName || opponent.name || "A definir",
    opponent_id: opponent.id || null,
    opponent_ranking: opponent.ranking || null,
    opponent_country: opponent.country ? opponent.country.name : "",
    isFonsecaHome: isFonsecaHome
  };

  if (!isNext) {
    // Parse score
    var fScore = isFonsecaHome ? homeScore : awayScore;
    var oScore = isFonsecaHome ? awayScore : homeScore;
    var sets = [];
    for (var i = 1; i <= 5; i++) {
      var key = "period" + i;
      if (fScore[key] !== undefined && oScore[key] !== undefined) {
        sets.push(fScore[key] + "-" + oScore[key]);
      }
    }
    var wonMatch = (m.winnerCode === 1 && isFonsecaHome) || (m.winnerCode === 2 && !isFonsecaHome);
    result.result = wonMatch ? "V" : "D";
    result.score = sets.join(" ");
    result.opponent = result.opponent_name;
    result.tournament = result.tournament_name;
  }

  return result;
}

// ===== MAIN HANDLER =====
export default async function handler(req, res) {
  var apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    return res.status(200).json({ ok: false, error: "No RAPIDAPI_KEY env var" });
  }

  try {
    var log = [];
    var totalRequests = 0;

    // 1. Fetch ranking (free, no RapidAPI)
    var ranking = await fetchRanking();
    if (ranking && ranking.ranking) {
      await kv.set("fn:ranking", JSON.stringify(ranking), { ex: 86400 });
      log.push("ranking: #" + ranking.ranking);
    } else {
      log.push("ranking: direct API failed");
    }

    // 1b. Prize money (Mondays 9-12h BRT only)
    var now = new Date();
    var brasiliaHour = (now.getUTCHours() - 3 + 24) % 24;
    if (now.getUTCDay() === 1 && brasiliaHour >= 9 && brasiliaHour <= 12) {
      try {
        var pmRes = await fetch("https://api.sofascore.com/api/v1/team/" + FONSECA_TEAM_ID, {
          headers: { "User-Agent": "FonsecaNews/3.0" }
        });
        if (pmRes.ok) {
          var pmData = await pmRes.json();
          var team = pmData.team || pmData;
          var prizeMoney = team.prizeMoney || team.totalPrizeMoney || team.careerPrizeMoney || null;
          if (prizeMoney) {
            await kv.set("fn:prizeMoney", JSON.stringify({ amount: prizeMoney, currency: "USD", updatedAt: now.toISOString() }), { ex: 86400 * 8 });
            log.push("prizeMoney: $" + prizeMoney);
          }
        }
      } catch (e) {}
    }

    // 2. Find last match (searches back up to 7 days, 1 request per day searched)
    var lastResult = await findLastMatch(apiKey);
    totalRequests += lastResult.requestsUsed;

    if (lastResult.match) {
      var lastMatch = parseMatch(lastResult.match, false);
      await kv.set("fn:lastMatch", JSON.stringify(lastMatch), { ex: 86400 * 3 });
      log.push("lastMatch: " + lastMatch.result + " vs " + lastMatch.opponent_name + " (" + lastResult.daysAgo + "d ago, " + lastResult.requestsUsed + " req)");

      // 3. Get match statistics if new match found
      var prevStatsId = null;
      try { prevStatsId = await kv.get("fn:lastStatsEventId"); } catch (e) {}

      if (String(lastResult.match.id) !== String(prevStatsId)) {
        var rawStats = await fetchMatchStats(lastResult.match.id, apiKey);
        totalRequests++;

        if (rawStats) {
          var fonsecaStats = lastMatch.isFonsecaHome ? rawStats.home : rawStats.away;
          var opponentStats = lastMatch.isFonsecaHome ? rawStats.away : rawStats.home;

          var statsData = {
            event_id: lastResult.match.id,
            fonseca: fonsecaStats,
            opponent: opponentStats,
            opponent_name: lastMatch.opponent_name,
            tournament: lastMatch.tournament_name,
            date: lastMatch.date,
            result: lastMatch.result,
            score: lastMatch.score
          };
          await kv.set("fn:matchStats", JSON.stringify(statsData), { ex: 86400 * 7 });
          await kv.set("fn:lastStatsEventId", String(lastResult.match.id));
          log.push("stats: " + Object.keys(fonsecaStats).length + " metrics");
        } else {
          log.push("stats: not available");
        }
      } else {
        log.push("stats: already fetched");
      }

      // Store recent form (last 5 results) - reuse today's search
      // We already have this match; to save requests, store what we have
      try {
        var existingForm = await kv.get("fn:recentForm");
        var form = existingForm ? (typeof existingForm === "string" ? JSON.parse(existingForm) : existingForm) : [];
        // Add this match if not already in form
        var alreadyInForm = form.some(function(f) { return f.event_id === lastMatch.event_id; });
        if (!alreadyInForm) {
          form.unshift(lastMatch);
          form = form.slice(0, 5);
          await kv.set("fn:recentForm", JSON.stringify(form), { ex: 86400 * 7 });
        }
        log.push("form: " + form.map(function(m) { return m.result; }).join(""));
      } catch (e) {
        log.push("form: error");
      }
    } else {
      log.push("lastMatch: none in last 14 days (" + lastResult.requestsUsed + " req)");
    }

    // 4. Find next match (searches forward up to 7 days)
    var nextResult = await findNextMatch(apiKey);
    totalRequests += nextResult.requestsUsed;

    if (nextResult.match) {
      var nextMatch = parseMatch(nextResult.match, true);
      await kv.set("fn:nextMatch", JSON.stringify(nextMatch), { ex: 86400 });
      log.push("nextMatch: vs " + nextMatch.opponent_name + " @ " + nextMatch.tournament_name + " (" + nextResult.requestsUsed + " req)");
    } else {
      log.push("nextMatch: none in next 14 days (" + nextResult.requestsUsed + " req)");
    }

    // Save cron timestamp
    await kv.set("fn:cronLastRun", now.toISOString());

    console.log("[cron-v3] Done. Total requests: " + totalRequests + ". " + log.join(" | "));

    res.status(200).json({
      ok: true,
      requests: totalRequests,
      log: log,
      timestamp: now.toISOString()
    });

  } catch (error) {
    console.error("[cron-v3] Error:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
}
