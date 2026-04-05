// ===== CRON: SofaScore Update v7 =====
// CHANGES FROM v6:
//   - Added fetchBiography: parses João's Wikipedia for sponsors, equipment, coach, bio
//   - Added fetchTournamentFacts: parses tournament Wikipedia for history, facts, curiosities
//   - Added fetchOpponentProfile: parses opponent Wikipedia for style, height, hand, titles
//   - All 3 are free (Wikipedia API), cached in KV, auto-update when data changes
//   - Biography cached 3 days, tournament facts until tournament changes, opponent until opponent changes
// TESTED ENDPOINTS:
//   GET /v1/match/list?sport_slug=tennis&date=YYYY-MM-DD
//   GET /v1/match/statistics?match_id=XXXXX
//   GET /v1/team/details?team_id=403869
//   GET /v1/team/rankings?team_id=403869
//   GET /v1/team/results?team_id=403869
// Runs 4x/day via cron-job.org POST to /api/cron-update
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

// ATP slug map for player headshot photos
var ATP_SLUGS = {
  "Alcaraz": "a0e2", "Sinner": "s0ag", "Djokovic": "d643", "Medvedev": "mm58",
  "Zverev": "z355", "Rublev": "re44", "Ruud": "rh16", "Tsitsipas": "te51",
  "Fritz": "fb98", "Rune": "r0dg", "Hurkacz": "hb71", "Khachanov": "ke29",
  "Berrettini": "bk40", "Diallo": "d0f6", "Shelton": "s0jy", "Draper": "d0bi",
  "Tiafoe": "td51", "Musetti": "m0ej", "Fils": "f0gx", "Cerundolo": "c0aq",
  "Davidovich Fokina": "d0au", "Auger-Aliassime": "ag37", "de Minaur": "dh58",
  "Paul": "pl56", "Tabilo": "t0ag", "Machac": "m0eo", "Mpetshi Perricard": "m0je",
  "Mensik": "m0ij", "Shapovalov": "su55", "Munar": "mf53", "Fonseca": "f0fv",
  "Nakashima": "n0ae", "Baez": "b0dc", "Etcheverry": "e0ar", "Jarry": "j0ab",
  "Norrie": "nb73", "Dimitrov": "dg88", "Bublik": "ba32", "Thompson": "tc94",
  "Humbert": "h0bj", "Giron": "g0bi", "Korda": "k0bh", "Popyrin": "p0bh",
  "Safiullin": "s0bf", "Nishikori": "n358", "Wawrinka": "wa48",
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

// ===== OPPONENT ENRICHMENT — ranking + country via SofaScore =====
// Fetches opponent details ONLY when opponent changes (cached in KV 7 days)
// Cost: 1 request per new opponent, 0 when cached
async function fetchOpponentDetails(opponentId, opponentName, apiKey, log) {
  if (!opponentId) { log.push("opp: no opponent_id"); return null; }

  // Check cache first
  var cacheKey = "fn:oppCache:" + opponentId;
  try {
    var cached = await kv.get(cacheKey);
    if (cached) {
      var parsed = typeof cached === "string" ? JSON.parse(cached) : cached;
      if (parsed && parsed.ranking) {
        log.push("opp: cache hit #" + parsed.ranking + " " + (parsed.country || ""));
        return parsed;
      }
    }
  } catch (e) {}

  // Fetch from SofaScore /v1/team/details — returns ranking + country
  var data = await sofaFetch("/v1/team/details?team_id=" + opponentId, apiKey);

  if (!data) { log.push("opp: details 404 for " + opponentId); return null; }

  // The response structure varies — try multiple paths
  var team = data.team || data;
  var ranking = team.ranking || (team.rankings && team.rankings.singlesRanking) || null;
  var country = "";

  // Country can be in team.country.name or team.nationality
  if (team.country && team.country.name) {
    country = team.country.name;
  } else if (team.nationality) {
    country = team.nationality;
  }

  // If no ranking in details, try /v1/team/rankings
  if (!ranking) {
    var rankData = await sofaFetch("/v1/team/rankings?team_id=" + opponentId, apiKey);
    if (rankData) {
      // Try different response shapes
      if (rankData.ranking) ranking = rankData.ranking;
      else if (rankData.rankings && rankData.rankings.ranking) ranking = rankData.rankings.ranking;
      else if (Array.isArray(rankData) && rankData.length > 0) {
        var singles = rankData.find(function(r) { return (r.type || "").toLowerCase().includes("singles"); });
        if (singles) ranking = singles.ranking || singles.position;
        else ranking = rankData[0].ranking || rankData[0].position;
      }
      log.push("opp: rankings endpoint gave #" + ranking);
    }
  }

  // Resolve ATP headshot slug
  var atpSlug = null;
  var nameToCheck = opponentName || team.name || "";
  for (var k in ATP_SLUGS) {
    if (nameToCheck.indexOf(k) !== -1) {
      atpSlug = ATP_SLUGS[k];
      break;
    }
  }

  var result = {
    ranking: ranking ? parseInt(ranking, 10) : null,
    country: country,
    atp_slug: atpSlug,
    name: opponentName || team.shortName || team.name || "",
    updatedAt: new Date().toISOString()
  };

  // Cache for 7 days (ranking changes weekly, this is good enough)
  await kv.set(cacheKey, JSON.stringify(result), { ex: 86400 * 7 });
  log.push("opp: fetched #" + (result.ranking || "?") + " " + result.country + (atpSlug ? " (atp:" + atpSlug + ")" : ""));

  return result;
}

// ===== RANKING — from Wikipedia API (wikitext, public, free) =====
async function fetchRanking(apiKey, log) {
  try {
    var apiUrl = "https://en.wikipedia.org/w/api.php?action=parse&page=Jo%C3%A3o_Fonseca_(tennis)&prop=wikitext&section=0&format=json";
    var res = await fetch(apiUrl, {
      headers: { "User-Agent": "FonsecaNews/7.0 (fan site; contact: thzgouvea@gmail.com)" },
    });
    if (!res.ok) { log.push("ranking: Wikipedia API HTTP " + res.status); return null; }
    var data = await res.json();
    var wikitext = (data && data.parse && data.parse.wikitext) ? (data.parse.wikitext["*"] || "") : "";

    if (!wikitext) { log.push("ranking: empty wikitext"); return null; }

    var rankMatch = wikitext.match(/currentsinglesranking\s*=\s*No\.\s*(\d{1,4})/i);
    if (!rankMatch) { log.push("ranking: field not found in wikitext"); return null; }

    var ranking = parseInt(rankMatch[1], 10);
    if (ranking <= 0 || ranking > 2000) { log.push("ranking: invalid value " + ranking); return null; }

    var highMatch = wikitext.match(/highestsinglesranking\s*=\s*No\.\s*(\d{1,4})/i);
    var bestRanking = highMatch ? parseInt(highMatch[1], 10) : 24;

    var prizeMatch = wikitext.match(/careerprizemoney\s*=\s*(?:US\s*)?\$\s*([\d,]+)/i);
    var prizeMoney = prizeMatch ? parseInt(prizeMatch[1].replace(/,/g, ""), 10) : null;

    log.push("ranking: #" + ranking + " (via Wikipedia API)");

    // ===== CAREER STATS from wikitext =====
    var wlMatch = wikitext.match(/(?:wonloss_singles|singlesrecord|singles_record|win_loss_singles)\s*=\s*(\d+)[–\-](\d+)/i);
    if (!wlMatch) wlMatch = wikitext.match(/(\d{2,3})[–\-](\d{2,3})\s*(?:singles|record)/i);
    var careerWins = wlMatch ? parseInt(wlMatch[1], 10) : null;
    var careerLosses = wlMatch ? parseInt(wlMatch[2], 10) : null;

    var hardMatch = wikitext.match(/\|\s*Hard\s*(?:courts?)?\s*(?:\|[^|]*){0,2}\|\s*(\d+)[–\-](\d+)/i);
    var clayMatch = wikitext.match(/\|\s*Clay\s*(?:\|[^|]*){0,2}\|\s*(\d+)[–\-](\d+)/i);
    var grassMatch = wikitext.match(/\|\s*Grass\s*(?:\|[^|]*){0,2}\|\s*(\d+)[–\-](\d+)/i);

    if (!hardMatch) hardMatch = wikitext.match(/Hard[^|]*?(\d+)[–\-](\d+)/i);
    if (!clayMatch) clayMatch = wikitext.match(/Clay[^|]*?(\d+)[–\-](\d+)/i);
    if (!grassMatch) grassMatch = wikitext.match(/Grass[^|]*?(\d+)[–\-](\d+)/i);

    var surfaceStats = {
      hard: hardMatch ? { w: parseInt(hardMatch[1], 10), l: parseInt(hardMatch[2], 10) } : null,
      clay: clayMatch ? { w: parseInt(clayMatch[1], 10), l: parseInt(clayMatch[2], 10) } : null,
      grass: grassMatch ? { w: parseInt(grassMatch[1], 10), l: parseInt(grassMatch[2], 10) } : null,
    };

    var titlesMatch = wikitext.match(/singlesrecord\s*=.*?(\d+)\s*title/i) || wikitext.match(/titles\s*=\s*(\d+)/i);
    var titlesCount = titlesMatch ? parseInt(titlesMatch[1], 10) : 2;

    var careerData = {
      wins: careerWins,
      losses: careerLosses,
      winPct: (careerWins && careerLosses) ? Math.round((careerWins / (careerWins + careerLosses)) * 100) : null,
      surface: surfaceStats,
      titles: titlesCount,
      updatedAt: new Date().toISOString()
    };
    await kv.set("fn:careerStats", JSON.stringify(careerData), { ex: 86400 * 7 });
    log.push("career: " + (careerWins || "?") + "-" + (careerLosses || "?") + " (" + (careerData.winPct || "?") + "%)");

    return {
      ranking: ranking,
      points: null,
      previousRanking: null,
      bestRanking: bestRanking,
      rankingChange: 0,
      prizeMoney: prizeMoney
    };
  } catch (e) {
    log.push("ranking: Wikipedia API error " + e.message);
  }
  return null;
}

// ===== SEASON STATS — compute from recentForm in KV =====
async function fetchSeasonStats(apiKey, log) {
  try {
    var existingForm = await kv.get("fn:recentForm");
    var form = existingForm ? (typeof existingForm === "string" ? JSON.parse(existingForm) : existingForm) : [];
    if (form.length === 0) { log.push("season: no form data to compute from"); return null; }

    var currentYear = new Date().getFullYear();
    var wins = 0;
    var losses = 0;

    for (var i = 0; i < form.length; i++) {
      if (!form[i].date) continue;
      var matchYear = new Date(form[i].date).getFullYear();
      if (matchYear !== currentYear) continue;
      if (form[i].result === "V") wins++;
      else if (form[i].result === "D") losses++;
    }

    if (wins === 0 && losses === 0) { log.push("season: no " + currentYear + " matches in form"); return null; }

    var season = { wins: wins, losses: losses, year: currentYear };
    log.push("season: " + wins + "W-" + losses + "L (from form, " + currentYear + ")");
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
  for (var i = 0; i < 7; i++) {
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
  return { match: null, daysAgo: -1, requestsUsed: 7 };
}

async function findNextMatch(apiKey) {
  var today = new Date();
  for (var i = 0; i <= 7; i++) {
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
  return { match: null, requestsUsed: 7 };
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

  // Detect surface from match data or infer from tournament name
  var detectedSurface = "";
  if (m.groundType) detectedSurface = m.groundType;
  else if (tournament.groundType) detectedSurface = tournament.groundType;
  else if (season.groundType) detectedSurface = season.groundType;
  // Fallback: infer from tournament name
  if (!detectedSurface) {
    var tName = (tournament.name || "").toLowerCase();
    var clayTournaments = ["monte carlo", "madrid", "roma", "roland garros", "french open", "buenos aires", "rio open", "barcelona", "hamburg", "kitzbuhel", "bastad", "umag", "gstaad"];
    var grassTournaments = ["wimbledon", "halle", "queen", "s-hertogenbosch", "eastbourne", "mallorca", "newport", "stuttgart"];
    for (var ci = 0; ci < clayTournaments.length; ci++) { if (tName.includes(clayTournaments[ci])) { detectedSurface = "Saibro"; break; } }
    if (!detectedSurface) { for (var gi = 0; gi < grassTournaments.length; gi++) { if (tName.includes(grassTournaments[gi])) { detectedSurface = "Grama"; break; } } }
    if (!detectedSurface && tName) detectedSurface = "Duro"; // Default to hard court
  }
  // Translate English surface names
  if (detectedSurface.toLowerCase() === "clay") detectedSurface = "Saibro";
  else if (detectedSurface.toLowerCase() === "grass") detectedSurface = "Grama";
  else if (detectedSurface.toLowerCase() === "hard" || detectedSurface.toLowerCase() === "hardcourt") detectedSurface = "Duro";

  var result = {
    event_id: m.id,
    tournament_name: tournament.name || "",
    tournament_category: season.name || tournament.name || "",
    surface: detectedSurface,
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
    var wonMatch = false;
    var fSetsWon = 0;
    var oSetsWon = 0;
    for (var si = 1; si <= 5; si++) {
      var sk = "period" + si;
      if (fScore[sk] !== undefined && oScore[sk] !== undefined) {
        if (fScore[sk] > oScore[sk]) fSetsWon++;
        else if (oScore[sk] > fScore[sk]) oSetsWon++;
      }
    }
    wonMatch = fSetsWon > oSetsWon;
    if (fSetsWon === oSetsWon && m.winnerCode) {
      wonMatch = (m.winnerCode === 1 && isFonsecaHome) || (m.winnerCode === 2 && !isFonsecaHome);
    }
    result.result = wonMatch ? "V" : "D";
    result.score = sets.join(" ");
    result.opponent = result.opponent_name;
    result.tournament = result.tournament_name;
  }

  return result;
}

// ===== BIOGRAPHY — from João Fonseca's Wikipedia page =====
// Parses sponsors, equipment, coach, bio text. Cached 3 days.
async function fetchBiography(log) {
  try {
    var cached = await kv.get("fn:biography");
    if (cached) {
      var parsed = typeof cached === "string" ? JSON.parse(cached) : cached;
      var age = parsed.updatedAt ? (Date.now() - new Date(parsed.updatedAt).getTime()) / 86400000 : 999;
      if (age < 3 && parsed.paragraphs && parsed.paragraphs.length > 0) {
        log.push("bio: cache ok (" + Math.round(age) + "d old)");
        return;
      }
    }
  } catch (e) {}

  try {
    // Fetch full article wikitext (section 0 = infobox + intro)
    var apiUrl = "https://en.wikipedia.org/w/api.php?action=parse&page=Jo%C3%A3o_Fonseca_(tennis)&prop=wikitext&format=json";
    var res = await fetch(apiUrl, {
      headers: { "User-Agent": "FonsecaNews/7.0 (fan site; contact: thzgouvea@gmail.com)" },
    });
    if (!res.ok) { log.push("bio: Wikipedia HTTP " + res.status); return; }
    var data = await res.json();
    var wikitext = (data && data.parse && data.parse.wikitext) ? (data.parse.wikitext["*"] || "") : "";
    if (!wikitext) { log.push("bio: empty wikitext"); return; }

    // === Parse infobox fields ===
    var getField = function(field) {
      var m = wikitext.match(new RegExp("\\|\\s*" + field + "\\s*=\\s*([^\\n|]+)", "i"));
      return m ? m[1].replace(/\[\[([^\]|]*\|)?([^\]]*)\]\]/g, "$2").replace(/\{\{[^}]*\}\}/g, "").trim() : null;
    };

    var birthDate = getField("birth_date") || getField("date_of_birth");
    // Clean birth date: extract from {{birth date and age|2006|8|21}}
    var bdMatch = wikitext.match(/birth.date.*?\|(\d{4})\|(\d{1,2})\|(\d{1,2})/i);
    var birthDateClean = bdMatch ? (bdMatch[3].padStart(2, "0") + "/" + bdMatch[2].padStart(2, "0") + "/" + bdMatch[1]) : (birthDate || "21/08/2006");

    var birthPlace = getField("birth_place") || "Ipanema, Rio de Janeiro";
    var height = getField("height");
    // Clean height: {{height|m=1.83}} or {{convert|1.83|m}}
    var hMatch = wikitext.match(/height.*?(\d\.\d{2})/i);
    var heightClean = hMatch ? hMatch[1] + "m" : (height || "1,83m");

    var hand = getField("plays");
    var handClean = hand ? (hand.toLowerCase().includes("right") ? "Destro" : "Canhoto") : "Destro";

    var coach = getField("coach") || getField("trainer");

    var highRank = getField("highestsinglesranking");
    var highRankNum = highRank ? (highRank.match(/(\d+)/) || [])[1] : "24";

    var proYear = getField("turned_pro") || getField("turnedpro") || "2024";

    // === Sponsors/Equipment ===
    // Look for "Equipment" or "Endorsements" sections
    var sponsors = [];
    // Common patterns: "He is sponsored by [[Nike]]" / "wears Nike" / "uses a [[Head (company)|Head]] racket"
    var sponsorPatterns = [
      /(?:sponsored|endorsed|sponsorship|deal|contract|partnership)\s+(?:by|with)\s+\[\[([^\]|]+)/gi,
      /(?:wears|wearing|clothing)\s+\[\[([^\]|]+)/gi,
      /(?:racket|racquet)\s+(?:is\s+)?(?:a\s+)?\[\[([^\]|]+)/gi,
    ];
    for (var sp = 0; sp < sponsorPatterns.length; sp++) {
      var m;
      while ((m = sponsorPatterns[sp].exec(wikitext)) !== null) {
        var brand = m[1].split("|").pop().trim();
        if (brand && sponsors.indexOf(brand) === -1) sponsors.push(brand);
      }
    }
    // Also look for explicit brand names
    var brandNames = ["Nike", "Head", "Adidas", "Wilson", "Babolat", "Yonex", "Lacoste", "Rolex", "TAG Heuer", "Uniqlo"];
    for (var bi = 0; bi < brandNames.length; bi++) {
      if (wikitext.indexOf(brandNames[bi]) !== -1 && sponsors.indexOf(brandNames[bi]) === -1) {
        // Verify it's in the context of sponsorship, not just mentioned
        var brandContext = wikitext.match(new RegExp("(" + brandNames[bi] + ")[^.]{0,50}(sponsor|endors|wear|equip|racket|shoe|cloth|apparel|deal|contract)", "i"));
        var brandContext2 = wikitext.match(new RegExp("(sponsor|endors|wear|equip|racket|shoe|cloth|apparel|deal|contract)[^.]{0,50}(" + brandNames[bi] + ")", "i"));
        if (brandContext || brandContext2) sponsors.push(brandNames[bi]);
      }
    }

    // Racket model
    var racketMatch = wikitext.match(/(?:racket|racquet)[^.]*?(Head\s+[A-Za-z]+\s*\d*|Wilson\s+[A-Za-z]+\s*\d*|Babolat\s+[A-Za-z]+\s*\d*|Yonex\s+[A-Za-z]+\s*\d*)/i);
    var racket = racketMatch ? racketMatch[1].trim() : null;

    // === Bio paragraphs from intro ===
    // Get the intro text (before first ==Section==)
    var introEnd = wikitext.indexOf("\n==");
    var intro = introEnd > 0 ? wikitext.substring(0, introEnd) : wikitext.substring(0, 3000);
    // Remove infobox
    var infoboxEnd = intro.lastIndexOf("}}");
    if (infoboxEnd > 0) intro = intro.substring(infoboxEnd + 2);
    // Clean wikitext markup
    intro = intro
      .replace(/\[\[([^\]|]*\|)?([^\]]*)\]\]/g, "$2") // [[link|text]] -> text
      .replace(/\{\{[^}]*\}\}/g, "") // remove templates
      .replace(/'{2,}/g, "") // remove bold/italic
      .replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, "") // remove refs
      .replace(/<ref[^/]*\/>/g, "") // remove self-closing refs
      .replace(/<[^>]+>/g, "") // remove HTML tags
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    var paragraphs = intro.split(/\n\n+/).filter(function(p) { return p.trim().length > 40; }).slice(0, 4);
    // Translate key phrases to Portuguese
    var ptParagraphs = paragraphs.map(function(p) {
      return p
        .replace(/is a Brazilian professional tennis player/gi, "é um tenista profissional brasileiro")
        .replace(/born (\w+ \d+, \d{4})/gi, "nascido em $1")
        .replace(/He has a career.high.*?No\.\s*(\d+)/gi, "Seu melhor ranking é o #$1")
        .replace(/He is currently/gi, "Atualmente é")
        .replace(/right.handed/gi, "destro")
        .replace(/left.handed/gi, "canhoto")
        .trim();
    });

    var biography = {
      birthDate: birthDateClean,
      birthPlace: birthPlace.replace(/,?\s*Brazil$/i, ""),
      height: heightClean,
      hand: handClean,
      coach: coach,
      proSince: "Profissional desde " + proYear,
      bestRanking: highRankNum,
      sponsors: sponsors.length > 0 ? sponsors : null,
      racket: racket,
      paragraphs: ptParagraphs.length > 0 ? ptParagraphs : null,
      updatedAt: new Date().toISOString()
    };

    await kv.set("fn:biography", JSON.stringify(biography), { ex: 86400 * 3 });
    log.push("bio: parsed (" + (sponsors.length || 0) + " sponsors, " + (ptParagraphs.length || 0) + " paragraphs)");
  } catch (e) {
    log.push("bio: error " + e.message);
  }
}

// ===== TOURNAMENT FACTS — from Wikipedia page of current tournament =====
// Maps tournament names to Wikipedia page titles
var TOURNAMENT_WIKI_MAP = {
  "monte carlo": "Monte-Carlo_Masters",
  "madrid": "Madrid_Open_(tennis)",
  "roma": "Italian_Open_(tennis)",
  "roland garros": "French_Open",
  "french open": "French_Open",
  "wimbledon": "The_Championships,_Wimbledon",
  "us open": "US_Open_(tennis)",
  "australian open": "Australian_Open",
  "indian wells": "Indian_Wells_Masters",
  "miami": "Miami_Open",
  "canadian open": "Canadian_Open_(tennis)",
  "cincinnati": "Cincinnati_Masters",
  "shanghai": "Shanghai_Masters_(tennis)",
  "paris": "Paris_Masters",
  "barcelona": "Barcelona_Open_Banc_Sabadell",
  "basel": "Swiss_Indoors",
  "vienna": "Vienna_Open",
  "hamburg": "Hamburg_European_Open",
  "rio open": "Rio_Open",
  "buenos aires": "Argentina_Open",
};

async function fetchTournamentFacts(tournamentName, log) {
  if (!tournamentName) { log.push("tournament: no name"); return; }

  // Check if tournament changed or data is broken
  try {
    var cached = await kv.get("fn:tournamentFacts");
    if (cached) {
      var parsed = typeof cached === "string" ? JSON.parse(cached) : cached;
      var sameTournament = parsed.name && tournamentName.toLowerCase().includes(parsed.name.toLowerCase().split(" ")[0]);
      // Check data quality — if any fact contains [[ or {{ it's broken
      var dataClean = true;
      if (parsed.facts) {
        for (var fi = 0; fi < parsed.facts.length; fi++) {
          if ((parsed.facts[fi].text || "").indexOf("[[") !== -1 || (parsed.facts[fi].text || "").indexOf("{{") !== -1) { dataClean = false; break; }
        }
      }
      if (sameTournament && dataClean) {
        log.push("tournament: cache ok (" + parsed.name + ")");
        return;
      }
      if (!dataClean) log.push("tournament: cache has broken markup, refetching");
    }
  } catch (e) {}

  // Find Wikipedia page
  var wikiPage = null;
  var tLower = tournamentName.toLowerCase();
  for (var key in TOURNAMENT_WIKI_MAP) {
    if (tLower.includes(key)) {
      wikiPage = TOURNAMENT_WIKI_MAP[key];
      break;
    }
  }
  if (!wikiPage) { log.push("tournament: no wiki page for " + tournamentName); return; }

  try {
    var apiUrl = "https://en.wikipedia.org/w/api.php?action=parse&page=" + encodeURIComponent(wikiPage) + "&prop=wikitext&section=0&format=json";
    var res = await fetch(apiUrl, {
      headers: { "User-Agent": "FonsecaNews/7.0 (fan site; contact: thzgouvea@gmail.com)" },
    });
    if (!res.ok) { log.push("tournament: Wikipedia HTTP " + res.status); return; }
    var data = await res.json();
    var wikitext = (data && data.parse && data.parse.wikitext) ? (data.parse.wikitext["*"] || "") : "";
    if (!wikitext) { log.push("tournament: empty wikitext"); return; }

    var facts = [];

    // First edition year
    var firstMatch = wikitext.match(/(?:first.*?|inaugurated.*?|established.*?|founded.*?)(\d{4})/i);
    if (!firstMatch) firstMatch = wikitext.match(/(?:held\s+since|since)\s+(\d{4})/i);
    if (firstMatch) {
      var yearsAgo = new Date().getFullYear() - parseInt(firstMatch[1], 10);
      facts.push({ icon: "📅", text: "Disputado desde " + firstMatch[1] + " — " + yearsAgo + " anos de história" });
    }

    // Surface
    var surfMatch = wikitext.match(/surface\s*=\s*([^\n|]+)/i);
    if (surfMatch) {
      var surf = surfMatch[1]
        .replace(/\[\[([^\]|]*\|)?([^\]]*)\]?\]?/g, "$2") // handle incomplete [[ ]]
        .replace(/\{\{[^}]*\}\}/g, "")
        .replace(/clay\s*court/gi, "Saibro")
        .replace(/hard\s*court/gi, "Piso duro")
        .replace(/grass\s*court/gi, "Grama")
        .replace(/^clay$/gi, "Saibro")
        .replace(/^hard$/gi, "Piso duro")
        .replace(/^grass$/gi, "Grama")
        .trim();
      if (surf) facts.push({ icon: "🏟️", text: "Superfície: " + surf });
    }

    // Location/venue
    var venueMatch = wikitext.match(/(?:venue|location)\s*=\s*([^\n|]+)/i);
    if (venueMatch) {
      var venue = venueMatch[1]
        .replace(/\[\[([^\]|]*\|)?([^\]]*)\]?\]?/g, "$2")
        .replace(/\{\{[^}]*\}\}/g, "")
        .trim();
      if (venue.length > 5 && venue.length < 80) facts.push({ icon: "📍", text: venue });
    }

    // Prize money
    var prizeMatch = wikitext.match(/prize.?money\s*=\s*([^\n|]+)/i);
    if (prizeMatch) {
      var prize = prizeMatch[1]
        .replace(/\[\[([^\]|]*\|)?([^\]]*)\]?\]?/g, "$2")
        .replace(/\{\{[^}]*\}\}/g, "")
        .trim();
      if (prize.length > 2 && prize.length < 50) facts.push({ icon: "💰", text: "Premiação: " + prize });
    }

    // Most titles / notable champions from intro text
    var nadalMatch = wikitext.match(/(?:Nadal|Rafael Nadal).*?(\d+)\s*(?:titles|times|wins)/i);
    var djokovicMatch = wikitext.match(/(?:Djokovic|Novak Djokovic).*?(\d+)\s*(?:titles|times|wins)/i);
    if (nadalMatch) facts.push({ icon: "👑", text: "Rafael Nadal é o maior campeão com " + nadalMatch[1] + " títulos" });
    else if (djokovicMatch) facts.push({ icon: "👑", text: "Novak Djokovic é o maior campeão com " + djokovicMatch[1] + " títulos" });

    // Most successful player (generic)
    if (!nadalMatch && !djokovicMatch) {
      var mostMatch = wikitext.match(/most\s+(?:successful|titles|wins).*?\[\[([^\]|]+)/i);
      if (mostMatch) facts.push({ icon: "👑", text: "Maior campeão: " + mostMatch[1].split("|").pop() });
    }

    // Category — translate and clean
    var catMatch = wikitext.match(/(?:category|series|type)\s*=\s*([^\n|]+)/i);
    if (catMatch) {
      var cat = catMatch[1]
        .replace(/\[\[([^\]|]*\|)?([^\]]*)\]?\]?/g, "$2")
        .replace(/\{\{[^}]*\}\}/g, "")
        .trim();
      // Translate common values
      if (cat.toLowerCase() === "atp" || cat.toLowerCase() === "atp tour masters 1000") cat = "ATP Masters 1000";
      else if (cat.toLowerCase().includes("grand slam")) cat = "Grand Slam";
      else if (cat.toLowerCase().includes("500")) cat = "ATP 500";
      else if (cat.toLowerCase().includes("250")) cat = "ATP 250";
      if (cat.length > 2 && cat.length < 40) facts.push({ icon: "🏆", text: "Categoria: " + cat });
    }

    // Brazilian players history (special for our audience)
    var brMatch = wikitext.match(/(?:Brazil|Brazilian|Kuerten|Guga|Bellucci|Fonseca)[^.]{0,100}\./i);
    if (brMatch) {
      var brFact = brMatch[0].replace(/\[\[([^\]|]*\|)?([^\]]*)\]\]/g, "$2").trim();
      if (brFact.length > 20 && brFact.length < 120) facts.push({ icon: "🇧🇷", text: brFact });
    }

    if (facts.length === 0) {
      log.push("tournament: no facts found for " + wikiPage);
      return;
    }

    var payload = {
      name: tournamentName,
      facts: facts.slice(0, 5), // max 5 facts
      source: "Wikipedia",
      updatedAt: new Date().toISOString()
    };

    await kv.set("fn:tournamentFacts", JSON.stringify(payload), { ex: 86400 * 14 });
    log.push("tournament: " + facts.length + " facts for " + tournamentName);
  } catch (e) {
    log.push("tournament: error " + e.message);
  }
}

// ===== OPPONENT PROFILE — from Wikipedia page =====
// Fetches style of play, height, hand, titles for the next opponent
async function fetchOpponentProfile(opponentName, opponentId, log) {
  if (!opponentName || opponentName === "A definir") { log.push("oppProfile: no opponent"); return; }

  // Check if same opponent is already cached
  try {
    var cached = await kv.get("fn:opponentProfile");
    if (cached) {
      var parsed = typeof cached === "string" ? JSON.parse(cached) : cached;
      if (parsed.name === opponentName && parsed.style) {
        log.push("oppProfile: cache ok (" + parsed.name + ")");
        return;
      }
    }
  } catch (e) {}

  try {
    // Build Wikipedia search — try full name first, then last name
    var fullName = opponentName.replace(/^[A-Z]\.\s*/, ""); // "G. Diallo" -> "Diallo"
    var searchTerms = [
      opponentName.replace(/\./g, "").trim() + " tennis",
      fullName + " tennis player",
      fullName + " tennis",
    ];

    var wikitext = "";
    for (var si = 0; si < searchTerms.length; si++) {
      // Use Wikipedia search API to find the right page
      var searchUrl = "https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=" + encodeURIComponent(searchTerms[si]) + "&srlimit=3&format=json";
      var searchRes = await fetch(searchUrl, {
        headers: { "User-Agent": "FonsecaNews/7.0 (fan site; contact: thzgouvea@gmail.com)" },
      });
      if (!searchRes.ok) continue;
      var searchData = await searchRes.json();
      var results = (searchData.query && searchData.query.search) || [];

      // Find the tennis player page
      var pageTitle = null;
      for (var ri = 0; ri < results.length; ri++) {
        var title = results[ri].title || "";
        var snippet = (results[ri].snippet || "").toLowerCase();
        if (snippet.includes("tennis") || title.toLowerCase().includes("tennis")) {
          pageTitle = title;
          break;
        }
      }
      if (!pageTitle && results.length > 0) pageTitle = results[0].title;

      if (pageTitle) {
        var pageUrl = "https://en.wikipedia.org/w/api.php?action=parse&page=" + encodeURIComponent(pageTitle) + "&prop=wikitext&format=json";
        var pageRes = await fetch(pageUrl, {
          headers: { "User-Agent": "FonsecaNews/7.0 (fan site; contact: thzgouvea@gmail.com)" },
        });
        if (pageRes.ok) {
          var pageData = await pageRes.json();
          wikitext = (pageData && pageData.parse && pageData.parse.wikitext) ? (pageData.parse.wikitext["*"] || "") : "";
          if (wikitext.length > 200) break;
        }
      }
    }

    if (!wikitext || wikitext.length < 200) {
      log.push("oppProfile: no Wikipedia page for " + opponentName);
      return;
    }

    // === Parse infobox ===
    var getField = function(field) {
      var m = wikitext.match(new RegExp("\\|\\s*" + field + "\\s*=\\s*([^\\n|]+)", "i"));
      return m ? m[1].replace(/\[\[([^\]|]*\|)?([^\]]*)\]\]/g, "$2").replace(/\{\{[^}]*\}\}/g, "").trim() : null;
    };

    // Height
    var height = getField("height");
    var hMatch = wikitext.match(/height.*?(\d\.\d{2})/i);
    var heightVal = hMatch ? hMatch[1] + "m" : (height || null);

    // Hand
    var plays = getField("plays");
    var hand = plays ? (plays.toLowerCase().includes("right") ? "Destro" : plays.toLowerCase().includes("left") ? "Canhoto" : plays) : null;

    // Birth date / age
    var bdMatch = wikitext.match(/birth.date.*?\|(\d{4})\|(\d{1,2})\|(\d{1,2})/i);
    var age = null;
    if (bdMatch) {
      var birthYear = parseInt(bdMatch[1], 10);
      age = new Date().getFullYear() - birthYear;
      // Adjust if birthday hasn't happened yet this year
      var birthMonth = parseInt(bdMatch[2], 10);
      var birthDay = parseInt(bdMatch[3], 10);
      var now = new Date();
      if (now.getMonth() + 1 < birthMonth || (now.getMonth() + 1 === birthMonth && now.getDate() < birthDay)) age--;
    }

    // Country
    var country = getField("birth_place") || getField("country") || "";
    // Extract country from birth_place (last part after comma)
    var countryParts = country.split(",");
    var countryClean = countryParts.length > 1 ? countryParts[countryParts.length - 1].trim() : country;

    // Career high
    var careerHighMatch = wikitext.match(/(?:highest|career.high).*?singles.*?No\.\s*(\d+)/i);
    var careerHigh = careerHighMatch ? parseInt(careerHighMatch[1], 10) : null;

    // Current ranking
    var currentRankMatch = wikitext.match(/currentsinglesranking\s*=\s*No\.\s*(\d+)/i);
    var currentRanking = currentRankMatch ? parseInt(currentRankMatch[1], 10) : null;

    // Titles
    var titlesMatch = wikitext.match(/(?:wonloss_singles|singlesrecord).*?(\d+)\s*title/i);
    var titles = titlesMatch ? parseInt(titlesMatch[1], 10) : null;
    // Alternative: count title mentions
    if (titles === null) {
      var titleMatches = wikitext.match(/won\s+(?:his|her|the)\s+(?:first|second|third|maiden|fourth|fifth)?\s*(?:ATP)?\s*title/gi);
      if (titleMatches) titles = titleMatches.length;
    }

    // Best surface (from W/L records)
    var bestSurface = null;
    var surfaceWins = {};
    var surfacePatterns = [
      { name: "Grama", regex: /(?:grass|grama)[^.]*?(\d+)[–\-](\d+)/i },
      { name: "Saibro", regex: /(?:clay|saibro)[^.]*?(\d+)[–\-](\d+)/i },
      { name: "Hard court", regex: /(?:hard)[^.]*?(\d+)[–\-](\d+)/i },
    ];
    for (var spi = 0; spi < surfacePatterns.length; spi++) {
      var sm = surfacePatterns[spi].regex.exec(wikitext);
      if (sm) {
        var w = parseInt(sm[1], 10);
        var l = parseInt(sm[2], 10);
        var pct = w / (w + l);
        surfaceWins[surfacePatterns[spi].name] = pct;
      }
    }
    var bestPct = 0;
    for (var sk in surfaceWins) {
      if (surfaceWins[sk] > bestPct) { bestPct = surfaceWins[sk]; bestSurface = sk; }
    }

    // === Style of play ===
    // Try to find a "Playing style" or "Style of play" section
    var styleSection = "";
    var styleSectionMatch = wikitext.match(/==\s*(?:Playing style|Style of play|Game style)\s*==\s*\n([\s\S]*?)(?:\n==|$)/i);
    if (styleSectionMatch) {
      styleSection = styleSectionMatch[1];
    }

    var styleText = "";
    if (styleSection) {
      // Clean wikitext
      styleText = styleSection
        .replace(/\[\[([^\]|]*\|)?([^\]]*)\]\]/g, "$2")
        .replace(/\{\{[^}]*\}\}/g, "")
        .replace(/'{2,}/g, "")
        .replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, "")
        .replace(/<ref[^/]*\/>/g, "")
        .replace(/<[^>]+>/g, "")
        .replace(/\n+/g, " ")
        .trim();
      // Take first 2 sentences
      var sentences = styleText.match(/[^.!?]+[.!?]+/g) || [];
      styleText = sentences.slice(0, 3).join(" ").trim();
    }

    // If no style section, build from attributes
    if (!styleText) {
      var attrs = [];
      if (heightVal) {
        var hNum = parseFloat(heightVal);
        if (hNum >= 1.90) attrs.push("Com " + heightVal + " de altura, tem grande vantagem no saque");
        else if (hNum >= 1.85) attrs.push("Com " + heightVal + ", combina potência e mobilidade");
        else attrs.push("Com " + heightVal + ", destaca-se pela agilidade na quadra");
      }
      if (hand) attrs.push(hand === "Canhoto" ? "Joga com a mão esquerda, criando ângulos incomuns" : "Destro, com jogo sólido de fundo de quadra");
      if (bestSurface) attrs.push("Melhor desempenho em " + bestSurface + " (" + Math.round(bestPct * 100) + "% de aproveitamento)");
      if (careerHigh) attrs.push("Já foi #" + careerHigh + " do mundo");
      if (titles && titles > 0) attrs.push(titles + " título" + (titles > 1 ? "s" : "") + " ATP na carreira");
      styleText = attrs.join(". ") + ".";
    }

    // Resolve ATP slug
    var atpSlug = null;
    for (var k in ATP_SLUGS) {
      if (opponentName.indexOf(k) !== -1) { atpSlug = ATP_SLUGS[k]; break; }
    }

    var profile = {
      name: opponentName,
      ranking: currentRanking,
      country: countryClean,
      age: age,
      height: heightVal,
      hand: hand,
      style: styleText || null,
      titles: titles,
      careerHigh: careerHigh,
      surface: bestSurface,
      atp_slug: atpSlug,
      updatedAt: new Date().toISOString()
    };

    await kv.set("fn:opponentProfile", JSON.stringify(profile), { ex: 86400 * 7 });
    log.push("oppProfile: " + opponentName + " — " + (heightVal || "?") + " " + (hand || "?") + " #" + (currentRanking || "?"));
  } catch (e) {
    log.push("oppProfile: error " + e.message);
  }
}

// ===== ENRICH MATCH — adds ranking, country, atp_slug from opponent details =====
function enrichMatch(match, oppDetails) {
  if (!match || !oppDetails) return match;
  // Always overwrite with better data — oppDetails comes from SofaScore team details or cache
  if (oppDetails.ranking) match.opponent_ranking = oppDetails.ranking;
  if (oppDetails.country) match.opponent_country = oppDetails.country;
  if (oppDetails.atp_slug) match.opponent_atp_slug = oppDetails.atp_slug;
  return match;
}

// ===== MAIN HANDLER =====
export default async function handler(req, res) {
  var apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) return res.status(200).json({ ok: false, error: "No RAPIDAPI_KEY env var" });

  try {
    var log = [];
    var totalRequests = 0;
    var now = new Date();

    // 1. Ranking (via Wikipedia API — free, no RapidAPI cost)
    var ranking = await fetchRanking(apiKey, log);
    if (ranking && ranking.ranking) {
      await kv.set("fn:ranking", JSON.stringify(ranking), { ex: 86400 });
    }

    // 1b. Prize money (from Wikipedia ranking data)
    if (ranking && ranking.prizeMoney) {
      await kv.set("fn:prizeMoney", JSON.stringify({ amount: ranking.prizeMoney, currency: "USD", updatedAt: now.toISOString() }), { ex: 86400 * 8 });
      log.push("prizeMoney: $" + ranking.prizeMoney + " (Wikipedia)");
    }

    // 2. Last match
    var lastResult = await findLastMatch(apiKey);
    totalRequests += lastResult.requestsUsed;
    var lastMatch = null;

    if (lastResult.match) {
      lastMatch = parseMatch(lastResult.match, false);

      // Enrich last match opponent (cached, 0 cost if same opponent)
      if (lastMatch.opponent_id && (!lastMatch.opponent_ranking || !lastMatch.opponent_country)) {
        var lastOppDetails = await fetchOpponentDetails(lastMatch.opponent_id, lastMatch.opponent_name, apiKey, log);
        if (lastOppDetails) {
          lastMatch = enrichMatch(lastMatch, lastOppDetails);
          totalRequests++; // only if cache miss
        }
      }

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
            opponent_id: lastMatch.opponent_id,
            opponent_ranking: lastMatch.opponent_ranking,
            opponent_country: lastMatch.opponent_country,
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

      // Form — scan last 14 days
      try {
        var existingForm = await kv.get("fn:recentForm");
        var form = existingForm ? (typeof existingForm === "string" ? JSON.parse(existingForm) : existingForm) : [];
        var lastAlreadyInForm = form.some(function(f) { return f.event_id === lastMatch.event_id; });

        if (!lastAlreadyInForm || form.length < 5) {
          var allFinished = [];
          var today = new Date();
          for (var fd = 0; fd < 14; fd++) {
            var scanDate = new Date(today);
            scanDate.setDate(scanDate.getDate() - fd);
            var dayMatches = await findFonsecaMatches(scanDate, apiKey);
            totalRequests++;
            var finished = dayMatches.filter(function(m) {
              return m.status && (m.status.type === "finished" || m.status.isFinished);
            });
            allFinished = allFinished.concat(finished);
            if (allFinished.length >= 5) break;
          }
          allFinished.sort(function(a, b) { return (b.timestamp || 0) - (a.timestamp || 0); });
          var seenIds = {};
          var uniqueFinished = [];
          for (var ui = 0; ui < allFinished.length; ui++) {
            var mid = allFinished[ui].id;
            if (!seenIds[mid]) {
              seenIds[mid] = true;
              uniqueFinished.push(allFinished[ui]);
            }
          }
          form = uniqueFinished.slice(0, 10).map(function(m) { return parseMatch(m, false); });
          await kv.set("fn:recentForm", JSON.stringify(form), { ex: 86400 * 7 });
          log.push("form: " + form.map(function(m) { return m.result; }).join("") + " (" + form.length + " jogos)");
        } else {
          log.push("form: " + form.map(function(m) { return m.result; }).join("") + " (cache ok)");
        }
      } catch (e) {
        log.push("form: error " + e.message);
      }
    } else {
      log.push("lastMatch: none in last 7 days");
    }

    // 4. Next match
    var nextResult = await findNextMatch(apiKey);
    totalRequests += nextResult.requestsUsed;
    var nextMatch = null;

    if (nextResult.match) {
      nextMatch = parseMatch(nextResult.match, true);

      // ===== ENRICH NEXT MATCH OPPONENT (the main new feature) =====
      // Only fetches from SofaScore when opponent_id changes (cached 7 days)
      if (nextMatch.opponent_id) {
        var prevOppId = null;
        try { prevOppId = await kv.get("fn:prevOpponentId"); } catch (e) {}

        var oppDetails = await fetchOpponentDetails(nextMatch.opponent_id, nextMatch.opponent_name, apiKey, log);
        if (oppDetails) {
          nextMatch = enrichMatch(nextMatch, oppDetails);
          // Only count as extra request if it was a cache miss (new opponent)
          if (String(nextMatch.opponent_id) !== String(prevOppId)) totalRequests++;
        }
        await kv.set("fn:prevOpponentId", String(nextMatch.opponent_id));
      }

      await kv.set("fn:nextMatch", JSON.stringify(nextMatch), { ex: 86400 });
      log.push("nextMatch: vs " + nextMatch.opponent_name + (nextMatch.opponent_ranking ? " #" + nextMatch.opponent_ranking : "") + (nextMatch.opponent_country ? " (" + nextMatch.opponent_country + ")" : "") + " @ " + nextMatch.tournament_name);
    } else {
      var manualNext = await kv.get("fn:nextMatch");
      if (manualNext) {
        var parsed = typeof manualNext === "string" ? JSON.parse(manualNext) : manualNext;
        if (parsed && parsed.opponent_name) {
          // Keep manual override, but still try to enrich if missing data
          if (parsed.opponent_id && (!parsed.opponent_ranking || !parsed.opponent_country)) {
            var manualOppDetails = await fetchOpponentDetails(parsed.opponent_id, parsed.opponent_name, apiKey, log);
            if (manualOppDetails) {
              parsed = enrichMatch(parsed, manualOppDetails);
              await kv.set("fn:nextMatch", JSON.stringify(parsed), { ex: 86400 * 7 });
              totalRequests++;
            }
          }
          log.push("nextMatch: manual override active (" + parsed.opponent_name + (parsed.opponent_ranking ? " #" + parsed.opponent_ranking : "") + ")");
          nextMatch = parsed; // use for odds fetch
        } else {
          log.push("nextMatch: none in next 7 days");
        }
      } else {
        log.push("nextMatch: none in next 7 days");
      }
    }

    // 5. Odds
    await fetchOdds(nextMatch, log);

    // 6. Season stats (computed from recentForm in KV — no RapidAPI cost)
    var seasonData = await fetchSeasonStats(apiKey, log);
    if (seasonData) {
      await kv.set("fn:season", JSON.stringify(seasonData), { ex: 86400 });
    }

    // 7. Biography (from Wikipedia — free, cached 3 days)
    await fetchBiography(log);

    // 8. Tournament facts (from Wikipedia — free, cached until tournament changes)
    if (nextMatch && nextMatch.tournament_name) {
      await fetchTournamentFacts(nextMatch.tournament_name, log);
    }

    // 9. Opponent profile (from Wikipedia — free, cached until opponent changes)
    if (nextMatch && nextMatch.opponent_name) {
      await fetchOpponentProfile(nextMatch.opponent_name, nextMatch.opponent_id, log);
    }

    // Timestamp
    await kv.set("fn:cronLastRun", now.toISOString());

    // ===== AUTO PUSH NOTIFICATIONS =====
    try {
      var pushSecret = process.env.PUSH_SECRET;
      var baseUrl = "https://fonsecanews.com.br";
      var notifications = [];

      // 1. Ranking changed
      if (ranking && ranking.ranking) {
        var prevRank = await kv.get("fn:prevRanking");
        var prevRankNum = prevRank ? parseInt(prevRank) : null;
        if (prevRankNum && prevRankNum !== ranking.ranking) {
          var direction = ranking.ranking < prevRankNum ? "subiu" : "caiu";
          var arrow = ranking.ranking < prevRankNum ? "📈" : "📉";
          notifications.push({
            title: arrow + " Ranking ATP: #" + ranking.ranking,
            body: "João Fonseca " + direction + " de #" + prevRankNum + " para #" + ranking.ranking
          });
        }
        await kv.set("fn:prevRanking", String(ranking.ranking));
      }

      // 2. New match result
      if (lastMatch && lastMatch.result && lastMatch.event_id) {
        var prevLastMatchId = await kv.get("fn:prevLastMatchId");
        if (prevLastMatchId === null) {
          await kv.set("fn:prevLastMatchId", String(lastMatch.event_id));
          log.push("push: first run, saved match ID " + lastMatch.event_id);
        } else if (prevLastMatchId !== String(lastMatch.event_id)) {
          var isWin = lastMatch.result === "V";
          notifications.push({
            title: isWin ? "🏆 Vitória! " + lastMatch.score : "Derrota: " + lastMatch.score,
            body: (isWin ? "João Fonseca venceu " : "João Fonseca perdeu para ") + lastMatch.opponent_name + " no " + lastMatch.tournament_name
          });
          await kv.set("fn:prevLastMatchId", String(lastMatch.event_id));
        }
      }

      // 3. Next match opponent defined or changed
      if (nextMatch && nextMatch.opponent_name) {
        var prevOpponent = await kv.get("fn:prevOpponent");
        if (prevOpponent === null) {
          await kv.set("fn:prevOpponent", nextMatch.opponent_name);
          log.push("push: first run, saved opponent " + nextMatch.opponent_name);
        } else if (prevOpponent !== nextMatch.opponent_name) {
          var matchDate = nextMatch.date ? new Date(nextMatch.date) : null;
          var dateStr = matchDate ? matchDate.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Sao_Paulo" }) : "";
          var timeStr = matchDate ? matchDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }) : "";
          // Include ranking in push notification if available
          var oppRankText = nextMatch.opponent_ranking ? " · #" + nextMatch.opponent_ranking + " do mundo" : "";
          notifications.push({
            title: "🎾 Próximo adversário: " + nextMatch.opponent_name,
            body: (nextMatch.tournament_name || "ATP") + oppRankText + (dateStr ? " · " + dateStr : "") + (timeStr ? " às " + timeStr : "")
          });
          await kv.set("fn:prevOpponent", nextMatch.opponent_name);
        }
      }

      // 4. Match starting soon (within 30 min)
      if (nextMatch && nextMatch.date) {
        var matchTime = new Date(nextMatch.date).getTime();
        var nowTime = Date.now();
        var diffMin = (matchTime - nowTime) / 60000;
        var pushKey30 = "fn:pushSent30:" + nextMatch.date;
        var alreadySent30 = await kv.get(pushKey30);
        if (diffMin > 0 && diffMin <= 30 && !alreadySent30) {
          notifications.push({
            title: "⏰ João Fonseca entra em quadra em breve!",
            body: "Jogo contra " + (nextMatch.opponent_name || "adversário") + " começa em " + Math.round(diffMin) + " min · ESPN 2 e Disney+"
          });
          await kv.set(pushKey30, "1", { ex: 86400 });
        }
      }

      // Send all notifications
      for (var ni = 0; ni < notifications.length; ni++) {
        try {
          await fetch(baseUrl + "/api/push-send", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-push-secret": pushSecret
            },
            body: JSON.stringify({
              title: notifications[ni].title,
              body: notifications[ni].body,
              url: baseUrl
            })
          });
          log.push("push: enviado '" + notifications[ni].title + "'");
        } catch (pe) {
          log.push("push: erro " + pe.message);
        }
      }
      if (notifications.length === 0) log.push("push: sem mudanças");
    } catch (pushErr) {
      log.push("push: erro " + pushErr.message);
    }

    console.log("[cron-v7] Done. Requests: " + totalRequests + ". " + log.join(" | "));
    return res.status(200).json({ ok: true, requests: totalRequests, log, timestamp: now.toISOString() });

  } catch (error) {
    console.error("[cron-v7] Error:", error);
    return res.status(500).json({ ok: false, error: error.message });
  }
}
