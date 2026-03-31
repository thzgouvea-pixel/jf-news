// ===== CRON: Daily SofaScore Update v2 =====
// Fetches: ranking, last match, next match, match stats, H2H
// Runs daily via cron-job.org POST to /api/cron-update
// Budget: ~60 req/month of 500 free

import { kv } from "@vercel/kv";

var FONSECA_TEAM_ID = 403869;
var RAPIDAPI_HOST = "sofascore6.p.rapidapi.com";

async function sofaFetch(path, apiKey) {
  var url = "https://" + RAPIDAPI_HOST + "/api/sofascore" + path;
  var res = await fetch(url, {
    headers: {
      "x-rapidapi-host": RAPIDAPI_HOST,
      "x-rapidapi-key": apiKey
    }
  });
  if (!res.ok) {
    console.log("[cron] SofaScore " + path + " returned " + res.status);
    return null;
  }
  return res.json();
}

// Direct SofaScore API (free, no key needed) for ranking
async function fetchRanking() {
  try {
    var res = await fetch("https://api.sofascore.com/api/v1/team/" + FONSECA_TEAM_ID, {
      headers: { "User-Agent": "FonsecaNews/2.0" }
    });
    if (!res.ok) return null;
    var data = await res.json();
    var team = data.team || data;
    return {
      ranking: team.ranking || null,
      points: team.rankingPoints || null,
      previousRanking: team.previousRanking || null,
      bestRanking: team.bestRanking || null,
      bestRankingDate: team.bestRankingTimestamp ? new Date(team.bestRankingTimestamp * 1000).toISOString() : null
    };
  } catch (e) {
    console.log("[cron] Ranking fetch error:", e.message);
    return null;
  }
}

// Fetch last events (uses 1 RapidAPI request)
async function fetchLastEvents(apiKey) {
  // Try RapidAPI first
  var data = await sofaFetch("/v1/team/" + FONSECA_TEAM_ID + "/events/last/0", apiKey);
  if (data && data.events && data.events.length > 0) return data.events;

  // Fallback: try direct API
  try {
    var res = await fetch("https://api.sofascore.com/api/v1/team/" + FONSECA_TEAM_ID + "/events/last/0", {
      headers: { "User-Agent": "FonsecaNews/2.0" }
    });
    if (res.ok) {
      var d = await res.json();
      if (d.events) return d.events;
    }
  } catch (e) {}
  return [];
}

// Fetch next events (uses 1 RapidAPI request)
async function fetchNextEvents(apiKey) {
  var data = await sofaFetch("/v1/team/" + FONSECA_TEAM_ID + "/events/next/0", apiKey);
  if (data && data.events && data.events.length > 0) return data.events;

  try {
    var res = await fetch("https://api.sofascore.com/api/v1/team/" + FONSECA_TEAM_ID + "/events/next/0", {
      headers: { "User-Agent": "FonsecaNews/2.0" }
    });
    if (res.ok) {
      var d = await res.json();
      if (d.events) return d.events;
    }
  } catch (e) {}
  return [];
}

// Fetch match statistics (aces, winners, serve %, etc)
async function fetchMatchStats(eventId, apiKey) {
  if (!eventId) return null;
  var data = await sofaFetch("/v1/event/" + eventId + "/statistics", apiKey);
  if (!data) return null;

  // SofaScore returns statistics in groups
  var stats = data.statistics || [];
  var result = { home: {}, away: {} };

  stats.forEach(function(group) {
    var groups = group.groups || [];
    groups.forEach(function(g) {
      var items = g.statisticsItems || [];
      items.forEach(function(item) {
        var key = (item.name || "").toLowerCase().replace(/\s+/g, "_");
        result.home[key] = item.home || item.homeValue || 0;
        result.away[key] = item.away || item.awayValue || 0;
      });
    });
  });

  return result;
}

// Fetch H2H between two players
async function fetchH2H(eventId, apiKey) {
  if (!eventId) return null;
  var data = await sofaFetch("/v1/event/" + eventId + "/h2h", apiKey);
  if (!data) return null;

  var h2h = {};
  // Extract win counts
  if (data.teamDuel) {
    h2h.homeWins = data.teamDuel.homeWins || 0;
    h2h.awayWins = data.teamDuel.awayWins || 0;
  }
  // Extract past events
  if (data.events && data.events.length > 0) {
    h2h.pastMatches = data.events.slice(0, 5).map(function(ev) {
      var homeScore = ev.homeScore || {};
      var awayScore = ev.awayScore || {};
      return {
        date: ev.startTimestamp ? new Date(ev.startTimestamp * 1000).toISOString() : null,
        tournament: ev.tournament ? ev.tournament.name : "",
        round: ev.roundInfo ? ev.roundInfo.name : "",
        homePlayer: ev.homeTeam ? ev.homeTeam.name : "",
        awayPlayer: ev.awayTeam ? ev.awayTeam.name : "",
        score: (homeScore.current || 0) + "-" + (awayScore.current || 0),
        winner: ev.winnerCode === 1 ? "home" : (ev.winnerCode === 2 ? "away" : "unknown")
      };
    });
  }
  return h2h;
}

// Parse a SofaScore event into our format
function parseEvent(ev, isNext) {
  var isFonsecaHome = ev.homeTeam && ev.homeTeam.id === FONSECA_TEAM_ID;
  var opponent = isFonsecaHome ? ev.awayTeam : ev.homeTeam;
  var homeScore = ev.homeScore || {};
  var awayScore = ev.awayScore || {};

  var surfaceMap = { 1: "Duro", 2: "Saibro", 3: "Grama", 4: "Carpet", 5: "Duro (indoor)" };
  var tournament = ev.tournament || {};
  var uniqueTournament = tournament.uniqueTournament || {};
  var season = ev.season || {};
  var roundInfo = ev.roundInfo || {};
  var groundType = uniqueTournament.groundType || ev.groundType;

  var result = {
    event_id: ev.id,
    tournament_name: uniqueTournament.name || tournament.name || "",
    tournament_category: uniqueTournament.category ? uniqueTournament.category.name : "",
    surface: surfaceMap[groundType] || "Duro",
    city: tournament.city || "",
    country: tournament.country ? tournament.country.name : "",
    round: roundInfo.name || "",
    date: ev.startTimestamp ? new Date(ev.startTimestamp * 1000).toISOString() : null,
    opponent_name: opponent ? (opponent.shortName || opponent.name || "") : "A definir",
    opponent_id: opponent ? opponent.id : null,
    opponent_ranking: opponent ? (opponent.ranking || null) : null,
    opponent_country: opponent && opponent.country ? opponent.country.alpha2 : ""
  };

  if (!isNext) {
    var fonsecaScore = isFonsecaHome ? homeScore : awayScore;
    var oppScore = isFonsecaHome ? awayScore : homeScore;
    var sets = [];
    for (var i = 1; i <= 5; i++) {
      var key = "period" + i;
      if (fonsecaScore[key] !== undefined && oppScore[key] !== undefined) {
        sets.push(fonsecaScore[key] + "-" + oppScore[key]);
      }
    }
    result.result = (ev.winnerCode === 1 && isFonsecaHome) || (ev.winnerCode === 2 && !isFonsecaHome) ? "V" : "D";
    result.score = sets.join(" ");
    result.opponent = result.opponent_name;
    result.tournament = result.tournament_name;
  }

  return result;
}

// Calculate season record from recent events
function calculateSeason(events, year) {
  var wins = 0;
  var losses = 0;
  var titles = 0;

  events.forEach(function(ev) {
    if (!ev.startTimestamp) return;
    var evDate = new Date(ev.startTimestamp * 1000);
    if (evDate.getFullYear() !== year) return;

    var isFonsecaHome = ev.homeTeam && ev.homeTeam.id === FONSECA_TEAM_ID;
    var won = (ev.winnerCode === 1 && isFonsecaHome) || (ev.winnerCode === 2 && !isFonsecaHome);
    if (won) wins++;
    else losses++;

    // Check if it was a final and he won
    var round = ev.roundInfo ? (ev.roundInfo.name || "").toLowerCase() : "";
    if (won && (round === "final" || round === "finals")) titles++;
  });

  return { wins: wins, losses: losses, titles: titles, year: year };
}

// ===== MAIN HANDLER =====
export default async function handler(req, res) {
  var apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    return res.status(200).json({ ok: false, error: "No RAPIDAPI_KEY" });
  }

  try {
    var log = [];
    var requestCount = 0;

    // 1. Fetch ranking (free, no RapidAPI)
    var ranking = await fetchRanking();
    if (ranking) {
      await kv.set("fn:ranking", JSON.stringify(ranking), { ex: 86400 }); // 24h
      log.push("ranking: #" + ranking.ranking);
    }

    // 2. Fetch last events (1 RapidAPI request)
    var lastEvents = await fetchLastEvents(apiKey);
    requestCount++;
    if (lastEvents.length > 0) {
      var lastMatch = parseEvent(lastEvents[0], false);
      await kv.set("fn:lastMatch", JSON.stringify(lastMatch), { ex: 86400 });
      log.push("lastMatch: " + lastMatch.result + " vs " + lastMatch.opponent_name);

      // Calculate season from all events
      var currentYear = new Date().getFullYear();
      var season = calculateSeason(lastEvents, currentYear);
      await kv.set("fn:season", JSON.stringify(season), { ex: 86400 });
      log.push("season: " + season.wins + "V " + season.losses + "D");

      // 3. Fetch stats for last match (1 RapidAPI request)
      var lastEventId = lastEvents[0].id;
      var prevStatsId = null;
      try {
        var prev = await kv.get("fn:lastStatsEventId");
        prevStatsId = prev;
      } catch (e) {}

      // Only fetch stats if it's a new match
      if (lastEventId && String(lastEventId) !== String(prevStatsId)) {
        var matchStats = await fetchMatchStats(lastEventId, apiKey);
        requestCount++;
        if (matchStats) {
          var isFonsecaHome = lastEvents[0].homeTeam && lastEvents[0].homeTeam.id === FONSECA_TEAM_ID;
          var fonsecaStats = isFonsecaHome ? matchStats.home : matchStats.away;
          var opponentStats = isFonsecaHome ? matchStats.away : matchStats.home;

          var statsData = {
            event_id: lastEventId,
            fonseca: fonsecaStats,
            opponent: opponentStats,
            opponent_name: lastMatch.opponent_name,
            tournament: lastMatch.tournament_name,
            date: lastMatch.date,
            result: lastMatch.result,
            score: lastMatch.score
          };
          await kv.set("fn:matchStats", JSON.stringify(statsData), { ex: 86400 * 7 }); // 7 days
          await kv.set("fn:lastStatsEventId", String(lastEventId));
          log.push("stats: " + Object.keys(fonsecaStats).length + " metrics");
        } else {
          log.push("stats: not available for this match");
        }
      } else {
        log.push("stats: already fetched for this match");
      }

      // Store last 5 results for "forma recente"
      var recentForm = lastEvents.slice(0, 5).map(function(ev) {
        return parseEvent(ev, false);
      });
      await kv.set("fn:recentForm", JSON.stringify(recentForm), { ex: 86400 });
      log.push("form: " + recentForm.map(function(m) { return m.result; }).join(""));
    }

    // 4. Fetch next events (1 RapidAPI request)
    var nextEvents = await fetchNextEvents(apiKey);
    requestCount++;
    if (nextEvents.length > 0) {
      var nextMatch = parseEvent(nextEvents[0], true);
      await kv.set("fn:nextMatch", JSON.stringify(nextMatch), { ex: 86400 });
      log.push("nextMatch: vs " + nextMatch.opponent_name + " @ " + nextMatch.tournament_name);

      // 5. Fetch H2H for next opponent (1 RapidAPI request) - only if opponent is known
      if (nextMatch.opponent_name && nextMatch.opponent_name !== "A definir") {
        var nextEventId = nextEvents[0].id;
        var h2h = await fetchH2H(nextEventId, apiKey);
        requestCount++;
        if (h2h) {
          h2h.opponent_name = nextMatch.opponent_name;
          h2h.opponent_id = nextMatch.opponent_id;
          await kv.set("fn:h2h", JSON.stringify(h2h), { ex: 86400 * 3 }); // 3 days
          log.push("h2h: " + (h2h.homeWins || 0) + "-" + (h2h.awayWins || 0));
        }
      }
    } else {
      log.push("nextMatch: none found");
    }

    // Store last cron run time
    await kv.set("fn:cronLastRun", new Date().toISOString());

    console.log("[cron-update] Done. Requests: " + requestCount + ". " + log.join(" | "));

    res.status(200).json({
      ok: true,
      requests: requestCount,
      log: log,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("[cron-update] Error:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
}
