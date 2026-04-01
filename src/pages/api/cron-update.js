// ===== CRON: SofaScore Update v4 =====
// CHANGES FROM v3:
//   + Block 5: Odds via The Odds API (free tier, ~1 req/day during tournament)
//     Saves to KV as "fn:winProb" — only normalized % probability, no odds data
// TESTED ENDPOINTS:
//   GET /v1/match/list?sport_slug=tennis&date=YYYY-MM-DD
//   GET /v1/match/statistics?match_id=XXXXX
//   GET /v1/team/details?team_id=403869
// Runs 3x/day via cron-job.org POST to /api/cron-update
// Host: sofascore6.p.rapidapi.com

import { kv } from "@vercel/kv";

var RAPIDAPI_HOST = "sofascore6.p.rapidapi.com";
var FONSECA_SLUG = "fonseca";
var FONSECA_TEAM_ID = 403869;

// Map tournament names → The Odds API sport keys
// Only ATP 1000 + Grand Slams are covered by The Odds API free tier
var ODDS_TOURNAMENT_MAP = {
  "monte-carlo masters": "tennis_atp_monte_carlo_masters",
  "monte carlo masters": "tennis_atp_monte_carlo_masters",
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

async function fetchRanking(apiKey) {
  try {
    var data = await sofaFetch("/v1/team/details?team_id=" + FONSECA_TEAM_ID, apiKey);
    if (data && data.team) {
      var team = data.team;
      return { ranking: team.ranking || null, points: team.rankingPoints || null, previousRanking: team.previousRanking || null, bestRanking: team.bestRanking || null };
    }
    if (data && data.ranking) {
      return { ranking: data.ranking, points: data.rankingPoints || null, previousRanking: data.previousRanking || null, bestRanking: data.bestRanking || null };
    }
  } catch (e) {}

  try {
    var res = await fetch("https://api.sofascore.com/api/v1/team/" + FONSECA_TEAM_ID, {
      headers: { "User-Agent": "FonsecaNews/4.0" },
    });
    if (res.ok) {
      var d = await res.json();
      var t = d.team || d;
      if (t.ranking) return { ranking: t.ranking, points: t.rankingPoints || null, previousRanking: t.previousRanking || null, bestRanking: t.bestRanking || null };
    }
  } catch (e) {}

  return null;
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
        console.log("[cron] Found array in key: " + k + " with " + matches.length + " items");
        break;
      }
    }
  }

  console.log("[cron] Date " + dateStr + ": " + matches.length + " total matches");

  var fonsecaMatches = matches.filter(function (m) {
    var slug = (m.slug || "").toLowerCase();
    var homeName = (m.homeTeam && (m.homeTeam.slug || m.homeTeam.name || "")).toLowerCase();
    var awayName = (m.awayTeam && (m.awayTeam.slug || m.awayTeam.name || "")).toLowerCase();
    return slug.includes("fonseca") || homeName.includes("fonseca") || awayName.includes("fonseca");
  });

  console.log("[cron] Date " + dateStr + ": " + fonsecaMatches.length + " Fonseca matches");
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

// ===== BLOCK 5: Win probability via The Odds API =====
// Fetches h2h odds, converts to normalized win probability (0-100%).
// NOTHING related to betting is stored or exposed — only the probability %.
// Saves { fonseca_pct: 45, opponent_pct: 55, opponent_name: "...", updatedAt }
// Cost: 1 credit per call (1 market × 1 region). Free tier = 500/month.
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
      + "?regions=eu"
      + "&markets=h2h"
      + "&oddsFormat=decimal"
      + "&apiKey=" + oddsApiKey;

    var res = await fetch(url);
    if (!res.ok) { log.push("prob: API error " + res.status); return; }

    var data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      log.push("prob: no data for " + sportKey + " (not listed yet)");
      return;
    }

    // Find match involving Fonseca
    var fonsecaMatch = data.find(function (event) {
      var home = (event.home_team || "").toLowerCase();
      var away = (event.away_team || "").toLowerCase();
      return home.includes("fonseca") || away.includes("fonseca");
    });

    if (!fonsecaMatch) {
      log.push("prob: Fonseca not found in " + data.length + " events");
      return;
    }

    var isFonsecaHome = (fonsecaMatch.home_team || "").toLowerCase().includes("fonseca");
    var opponentName = isFonsecaHome ? fonsecaMatch.away_team : fonsecaMatch.home_team;

    // Collect raw decimal odds per player across all bookmakers
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
      log.push("prob: incomplete odds data");
      return;
    }

    // Median odds per player
    function median(arr) {
      var sorted = arr.slice().sort(function (a, b) { return a - b; });
      var mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    }

    var medF = median(fonsecaOdds);
    var medO = median(opponentOdds);

    // Convert decimal odds → implied probability → normalize (removes bookmaker margin)
    // implied prob = 1 / odd
    var impliedF = 1 / medF;
    var impliedO = 1 / medO;
    var total = impliedF + impliedO;

    var fonsecaPct = Math.round((impliedF / total) * 100);
    var opponentPct = 100 - fonsecaPct;

    // Store ONLY the probability — no odds, no bookmaker names
    var payload = {
      fonseca_pct: fonsecaPct,
      opponent_pct: opponentPct,
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

    // 1. Ranking
    var ranking = await fetchRanking(apiKey);
    totalRequests++;
    if (ranking && ranking.ranking) {
      await kv.set("fn:ranking", JSON.stringify(ranking), { ex: 86400 });
      log.push("ranking: #" + ranking.ranking);
    } else {
      log.push("ranking: failed");
    }

    // 1b. Prize money (Mondays 9-12h BRT only)
    var brasiliaHour = (now.getUTCHours() - 3 + 24) % 24;
    if (now.getUTCDay() === 1 && brasiliaHour >= 9 && brasiliaHour <= 12) {
      try {
        var pmRes = await fetch("https://api.sofascore.com/api/v1/team/" + FONSECA_TEAM_ID, {
          headers: { "User-Agent": "FonsecaNews/4.0" },
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

      // Form
      try {
        var existingForm = await kv.get("fn:recentForm");
        var form = existingForm ? (typeof existingForm === "string" ? JSON.parse(existingForm) : existingForm) : [];
        var alreadyInForm = form.some(function (f) { return f.event_id === lastMatch.event_id; });
        if (!alreadyInForm) {
          form.unshift(lastMatch);
          form = form.slice(0, 5);
          await kv.set("fn:recentForm", JSON.stringify(form), { ex: 86400 * 7 });
        }
        log.push("form: " + form.map(function (m) { return m.result; }).join(""));
      } catch (e) {
        log.push("form: error");
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

    // 5. Odds (The Odds API — free tier, ~1 credit/call)
    await fetchOdds(nextMatch, log);

    // Timestamp
    await kv.set("fn:cronLastRun", now.toISOString());

    console.log("[cron-v4] Done. Requests: " + totalRequests + ". " + log.join(" | "));

    return res.status(200).json({ ok: true, requests: totalRequests, log, timestamp: now.toISOString() });

  } catch (error) {
    console.error("[cron-v4] Error:", error);
    return res.status(500).json({ ok: false, error: error.message });
  }
}
