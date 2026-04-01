// ===== CRON: SofaScore Update v5 =====
// CHANGES FROM v4:
//   - Ranking: tries 3 endpoints (rankings, details, direct) instead of 2
//   - Added Block 6: Season stats via /v1/team/results (W/L count for current year)
// TESTED ENDPOINTS:
//   GET /v1/match/list?sport_slug=tennis&date=YYYY-MM-DD
//   GET /v1/match/statistics?match_id=XXXXX
//   GET /v1/team/details?team_id=403869
//   GET /v1/team/rankings?team_id=403869
//   GET /v1/team/results?team_id=403869
// Runs 3x/day via cron-job.org POST to /api/cron-update
// Host: sofascore6.p.rapidapi.com

import { kv } from "@vercel/kv";

var RAPIDAPI_HOST = "sofascore6.p.rapidapi.com";
var FONSECA_SLUG = "fonseca";
var FONSECA_TEAM_ID = 403869;

var ODDS_TOURNAMENT_MAP = {
  "monte-carlo masters": "tennis_atp_monte_carlo_masters",
  "monte carlo masters": "tennis_atp_monte_carlo_masters",
  "monte carlo": "tennis_atp_monte_carlo_masters",
  "madrid open": "tennis_atp_madrid_open",
  "italian open": "tennis_atp_italian_open",
  "french open": "tennis_atp_french_open",
  "roland garros": "tennis_atp_french_open",
  "wimbledon": "tennis_atp_wimbledon",
  "us open": "tennis_atp_us_open",
  "australian open": "tennis_atp_aus_open_singles",
  "canadian open": "tennis_atp_canadian_open",
  "cincinnati open": "tennis_atp_cincinnati_open",
  "shanghai masters": "tennis_atp_shanghai_masters",
  "paris masters": "tennis_atp_paris_masters",
  "indian wells": "tennis_atp_indian_wells",
  "miami open": "tennis_atp_miami_open",
};

async function sofaFetch(path, apiKey) {
  var url = "https://" + RAPIDAPI_HOST + "/api/sofascore" + path;
  console.log("[cron] Fetching:", path);
  var res = await fetch(url, {
    headers: {
      "x-rapidapi-host": RAPIDAPI_HOST,
      "x-rapidapi-key": apiKey,
    },
  });
  if (!res.ok) {
    console.log("[cron] Error " + res.status + " for " + path);
    return null;
  }
  return res.json();
}

// ===== RANKING — tries 3 endpoints =====
async function fetchRanking(apiKey, log) {
  // Attempt 1: /v1/team/rankings (used by news.js v5, returns rankings array)
  try {
    var data = await sofaFetch("/v1/team/rankings?team_id=" + FONSECA_TEAM_ID, apiKey);
    if (data) {
      var rankings = Array.isArray(data) ? data : data.rankings;
      if (rankings && rankings.length > 0) {
        var r = rankings[0];
        log.push("ranking: #" + r.ranking + " (via /rankings)");
        return {
          ranking: r.ranking,
          points: r.points || null,
          previousRanking: r.previousRanking || null,
          bestRanking: r.bestRanking || null,
          rankingChange: (r.previousRanking || 0) - (r.ranking || 0)
        };
      }
    }
  } catch (e) { console.log("[cron] rankings endpoint failed:", e.message); }

  // Attempt 2: /v1/team/details (returns team object with ranking field)
  try {
    var data2 = await sofaFetch("/v1/team/details?team_id=" + FONSECA_TEAM_ID, apiKey);
    if (data2) {
      var team = data2.team || data2;
      if (team.ranking) {
        log.push("ranking: #" + team.ranking + " (via /details)");
        return {
          ranking: team.ranking,
          points: team.rankingPoints || null,
          previousRanking: team.previousRanking || null,
          bestRanking: team.bestRanking || null,
          rankingChange: (team.previousRanking || 0) - (team.ranking || 0)
        };
      }
    }
  } catch (e) { console.log("[cron] details endpoint failed:", e.message); }

  // Attempt 3: direct SofaScore API (no RapidAPI, free but may be blocked)
  try {
    var res = await fetch("https://api.sofascore.com/api/v1/team/" + FONSECA_TEAM_ID, {
      headers: { "User-Agent": "FonsecaNews/5.0" },
    });
    if (res.ok) {
      var d = await res.json();
      var t = d.team || d;
      if (t.ranking) {
        log.push("ranking: #" + t.ranking + " (via direct API)");
        return {
          ranking: t.ranking,
          points: t.rankingPoints || null,
          previousRanking: t.previousRanking || null,
          bestRanking: t.bestRanking || null,
          rankingChange: (t.previousRanking || 0) - (t.ranking || 0)
        };
      }
    }
  } catch (e) { console.log("[cron] direct API failed:", e.message); }

  log.push("ranking: all 3 endpoints failed");
  return null;
}

// ===== SEASON STATS — W/L for current year =====
async function fetchSeasonStats(apiKey, log) {
  try {
    var data = await sofaFetch("/v1/team/results?team_id=" + FONSECA_TEAM_ID, apiKey);
    if (!data) { log.push("season: endpoint returned null"); return null; }

    var results = Array.isArray(data) ? data : (data.events || data.results || []);
    if (results.length === 0) { log.push("season: no results returned"); return null; }

    var currentYear = new Date().getFullYear();
    var wins = 0;
    var losses = 0;

    for (var i = 0; i < results.length; i++) {
      var match = results[i];
      if (!match.startTimestamp && !match.timestamp) continue;
      var ts = match.startTimestamp || match.timestamp;
      var matchYear = new Date(ts * 1000).getFullYear();
      if (matchYear !== currentYear) continue;
      if (match.status && match.status.type !== "finished" && !match.status.isFinished) continue;

      var isFonsecaHome = (match.homeTeam && match.homeTeam.id === FONSECA_TEAM_ID);
      var fScore = isFonsecaHome ? (match.homeScore || {}) : (match.awayScore || {});
      var oScore = isFonsecaHome ? (match.awayScore || {}) : (match.homeScore || {});

      if ((fScore.current || 0) > (oScore.current || 0)) wins++;
      else if ((oScore.current || 0) > (fScore.current || 0)) losses++;
    }

    if (wins === 0 && losses === 0) { log.push("season: no " + currentYear + " matches found in results"); return null; }

    var season = { wins: wins, losses: losses, year: currentYear };
    log.push("season: " + wins + "W-" + losses + "L (" + currentYear + ")");
    return season;
  } catch (e) {
    log.push("season: error " + e.message);
    return null;
  }
}

async function findFonsecaMatches(date, apiKey) {
  var dateStr = date.toISOString().split("T")[0];
  var data = await sofaFetch("/v1/match/list?sport_slug=tennis&date=" + dateStr, apiKey);
  if (!data) return [];

  var matches = [];
  if (Array.isArray(data)) matches = data;
  else if (data.events && Array.isArray(data.events)) matches = data.events;
  else {
    for (var k of Object.keys(data)) {
      if (Array.isArray(data[k])) {
        matches = data[k];
        break;
      }
    }
  }

  var fonsecaMatches = matches.filter(function (m) {
    var slug = (m.slug || "").toLowerCase();
    var homeName = (m.homeTeam && (m.homeTeam.slug || m.homeTeam.name || "")).toLowerCase();
    var awayName = (m.awayTeam && (m.awayTeam.slug || m.awayTeam.name || "")).toLowerCase();
    return slug.includes("fonseca") || homeName.includes("fonseca") || awayName.includes("fonseca");
  });

  return fonsecaMatches;
}

async function findLastMatch(apiKey) {
  var today = new Date();
  for (var i = 0; i < 14; i++) {
    var d = new Date(today);
    d.setDate(d.getDate() - i);
    var matches = await findFonsecaMatches(d, apiKey);
    if (matches.length > 0) {
      var finished = matches.filter(function (m) {
        return m.status && (m.status.type === "finished" || m.status.isFinished);
      });
      if (finished.length > 0) return { match: finished[0], daysAgo: i, requestsUsed: i + 1 };
    }
  }
  return { match: null, daysAgo: -1, requestsUsed: 14 };
}

async function findNextMatch(apiKey) {
  var today = new Date();
  for (var i = 0; i <= 14; i++) {
    var d = new Date(today);
    d.setDate(d.getDate() + i);
    var matches = await findFonsecaMatches(d, apiKey);
    if (matches.length > 0) {
      var upcoming = matches.filter(function (m) {
        return m.status && (m.status.type === "notstarted" || !m.status.isFinished);
      });
      if (upcoming.length > 0) return { match: upcoming[0], requestsUsed: i + 1 };
      if (i === 0) continue;
    }
  }
  return { match: null, requestsUsed: 14 };
}

async function fetchMatchStats(matchId, apiKey) {
  if (!matchId) return null;
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

// ===== ODDS — The Odds API =====
async function fetchOdds(nextMatch, log) {
  var oddsApiKey = process.env.ODDS_API_KEY;
  if (!oddsApiKey) { log.push("prob: no ODDS_API_KEY"); return; }
  if (!nextMatch) { log.push("prob: no next match"); return; }

  var tournamentName = (nextMatch.tournament_name || "").toLowerCase();
  var sportKey = null;
  for (var key of Object.keys(ODDS_TOURNAMENT_MAP)) {
    if (tournamentName.includes(key)) {
      sportKey = ODDS_TOURNAMENT_MAP[key];
      break;
    }
  }

  if (!sportKey) {
    log.push("prob: tournament not covered (" + nextMatch.tournament_name + ")");
    return;
  }

  try {
    var url = "https://api.the-odds-api.com/v4/sports/" + sportKey + "/odds"
      + "?regions=eu&markets=h2h&oddsFormat=decimal&apiKey=" + oddsApiKey;

    var res = await fetch(url);
    if (!res.ok) { log.push("prob: API error " + res.status); return; }

    var data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      log.push("prob: no data for " + sportKey);
      return;
    }

    var fonsecaMatch = data.find(function (event) {
      var home = (event.home_team || "").toLowerCase();
      var away = (event.away_team || "").toLowerCase();
      return home.includes("fonseca") || away.includes("fonseca");
    });

    if (!fonsecaMatch) {
      log.push("prob: Fonseca not in " + data.length + " events");
      return;
    }

    var isFonsecaHome = (fonsecaMatch.home_team || "").toLowerCase().includes("fonseca");
    var opponentName = isFonsecaHome ? fonsecaMatch.away_team : fonsecaMatch.home_team;

    var fonsecaOdds = [], opponentOdds = [];
    (fonsecaMatch.bookmakers || []).forEach(function (bm) {
      var market = (bm.markets || []).find(function (m) { return m.key === "h2h"; });
      if (!market) return;
      (market.outcomes || []).forEach(function (o) {
        if ((o.name || "").toLowerCase().includes("fonseca")) fonsecaOdds.push(o.price);
        else opponentOdds.push(o.price);
      });
    });

    if (!fonsecaOdds.length || !opponentOdds.length) {
      log.push("prob: incomplete data");
      return;
    }

    function median(arr) {
      var sorted = arr.slice().sort(function (a, b) { return a - b; });
      var mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    }

    var medF = median(fonsecaOdds);
    var medO = median(opponentOdds);
    var impliedF = 1 / medF;
    var impliedO = 1 / medO;
    var total = impliedF + impliedO;
    var fonsecaPct = Math.round((impliedF / total) * 100);
    var opponentPct = 100 - fonsecaPct;

    var payload = {
      fonseca: fonsecaPct,
      opponent: opponentPct,
      opponent_name: opponentName,
      tournament: nextMatch.tournament_name,
      commence_time: fonsecaMatch.commence_time,
      updatedAt: new Date().toISOString(),
    };

    await kv.set("fn:winProb", JSON.stringify(payload), { ex: 86400 });
    log.push("prob: Fonseca " + fonsecaPct + "% vs " + opponentName + " " + opponentPct + "%");

  } catch (e) {
    log.push("prob: exception " + e.message);
  }
}

function parseMatch(m, isNext) {
  if (!m) return null;
  var homeTeam = m.homeTeam || {};
  var awayTeam = m.awayTeam || {};
  var tournament = m.tournament || {};
  var season = m.season || {};
  var roundInfo = m.roundInfo || {};
  var homeScore = m.homeScore || {};
  var awayScore = m.awayScore || {};

  var isFonsecaHome = (homeTeam.slug || "").toLowerCase().includes(FONSECA_SLUG);
  var opponent = isFonsecaHome ? awayTeam : homeTeam;

  var result = {
    event_id: m.id,
    tournament_name: tournament.name || "",
    tournament_category: season.name || tournament.name || "",
    surface: "",
    city: (tournament.name || "").split(",")[0] || "",
    round: roundInfo.name || "",
    date: m.timestamp ? new Date(m.timestamp * 1000).toISOString() : null,
    opponent_name: opponent.shortName || opponent.name || "A definir",
    opponent_id: opponent.id || null,
    opponent_ranking: opponent.ranking || null,
    opponent_country: opponent.country ? opponent.country.name : "",
    isFonsecaHome,
  };

  if (!isNext) {
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
  if (!apiKey) return res.status(200).json({ ok: false, error: "No RAPIDAPI_KEY env var" });

  try {
    var log = [];
    var totalRequests = 0;
    var now = new Date();

    // 1. Ranking (tries 3 endpoints)
    var ranking = await fetchRanking(apiKey, log);
    totalRequests += 2; // worst case: 2 RapidAPI calls + 1 direct
    if (ranking && ranking.ranking) {
      await kv.set("fn:ranking", JSON.stringify(ranking), { ex: 86400 });
    }

    // 1b. Prize money (Mondays 9-12h BRT only)
    var brasiliaHour = (now.getUTCHours() - 3 + 24) % 24;
    if (now.getUTCDay() === 1 && brasiliaHour >= 9 && brasiliaHour <= 12) {
      try {
        var pmRes = await fetch("https://api.sofascore.com/api/v1/team/" + FONSECA_TEAM_ID, {
          headers: { "User-Agent": "FonsecaNews/5.0" },
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

    // 2. Last match
    var lastResult = await findLastMatch(apiKey);
    totalRequests += lastResult.requestsUsed;

    if (lastResult.match) {
      var lastMatch = parseMatch(lastResult.match, false);
      await kv.set("fn:lastMatch", JSON.stringify(lastMatch), { ex: 86400 * 3 });
      log.push("lastMatch: " + lastMatch.result + " vs " + lastMatch.opponent_name + " (" + lastResult.daysAgo + "d ago)");

      // 3. Stats
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
            score: lastMatch.score,
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

      // Form — scan last 30 days for complete history
      try {
        var existingForm = await kv.get("fn:recentForm");
        var form = existingForm ? (typeof existingForm === "string" ? JSON.parse(existingForm) : existingForm) : [];
        var lastAlreadyInForm = form.some(function(f) { return f.event_id === lastMatch.event_id; });

        if (!lastAlreadyInForm || form.length < 5) {
          var allFinished = [];
          var today = new Date();
          for (var fd = 0; fd < 30; fd++) {
            var scanDate = new Date(today);
            scanDate.setDate(scanDate.getDate() - fd);
            var dayMatches = await findFonsecaMatches(scanDate, apiKey);
            totalRequests++;
            var finished = dayMatches.filter(function(m) {
              return m.status && (m.status.type === "finished" || m.status.isFinished);
            });
            allFinished = allFinished.concat(finished);
            if (allFinished.length >= 10) break;
          }
          allFinished.sort(function(a, b) { return (b.timestamp || 0) - (a.timestamp || 0); });
          form = allFinished.slice(0, 10).map(function(m) { return parseMatch(m, false); });
          await kv.set("fn:recentForm", JSON.stringify(form), { ex: 86400 * 7 });
          log.push("form: " + form.map(function(m) { return m.result; }).join("") + " (" + form.length + " jogos)");
        } else {
          log.push("form: " + form.map(function(m) { return m.result; }).join("") + " (cache ok)");
        }
      } catch (e) {
        log.push("form: error " + e.message);
      }
    } else {
      log.push("lastMatch: none in last 14 days");
    }

    // 4. Next match
    var nextResult = await findNextMatch(apiKey);
    totalRequests += nextResult.requestsUsed;
    var nextMatch = null;

    if (nextResult.match) {
      nextMatch = parseMatch(nextResult.match, true);
      await kv.set("fn:nextMatch", JSON.stringify(nextMatch), { ex: 86400 });
      log.push("nextMatch: vs " + nextMatch.opponent_name + " @ " + nextMatch.tournament_name);
    } else {
      log.push("nextMatch: none in next 14 days");
    }

    // 5. Odds
    await fetchOdds(nextMatch, log);

    // 6. Season stats (W/L for current year)
    var seasonData = await fetchSeasonStats(apiKey, log);
    totalRequests++;
    if (seasonData) {
      await kv.set("fn:season", JSON.stringify(seasonData), { ex: 86400 });
    }

    // Timestamp
    await kv.set("fn:cronLastRun", now.toISOString());

    console.log("[cron-v5] Done. Requests: " + totalRequests + ". " + log.join(" | "));
    return res.status(200).json({ ok: true, requests: totalRequests, log, timestamp: now.toISOString() });

  } catch (error) {
    console.error("[cron-v5] Error:", error);
    return res.status(500).json({ ok: false, error: error.message });
  }
}
