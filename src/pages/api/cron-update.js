// ===== FONSECA NEWS — CRON UPDATE v11 =====
// Runs via Vercel Cron every 4 hours.
// Populates ALL KV keys the site reads from.
//
// Data sources:
//   SofaScore (via RapidAPI) → matches, stats, ranking, opponent
//   The Odds API             → win probability
//   Gemini 2.5 Flash         → tournament facts, opponent profile enrichment
//
// KV keys written:
//   fn:ranking, fn:lastMatch, fn:nextMatch, fn:matchStats,
//   fn:recentForm, fn:season, fn:careerStats, fn:prizeMoney,
//   fn:winProb, fn:opponentProfile, fn:tournamentFacts,
//   fn:atpRankings, fn:cronLastRun

import { kv } from "@vercel/kv";

// ===== CONFIG =====
var RAPIDAPI_HOST = "sofascore6.p.rapidapi.com";
var FONSECA_TEAM_ID = 403869;
var SCAN_DAYS_BACK = 30;
var SCAN_DAYS_FORWARD = 14;

// ===== HELPERS =====
function log(msg) { console.log("[cron] " + msg); }

async function sofaFetch(path) {
  var apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) { log("WARN: RAPIDAPI_KEY missing"); return null; }
  try {
    var res = await fetch("https://" + RAPIDAPI_HOST + "/api/sofascore" + path, {
      headers: { "x-rapidapi-host": RAPIDAPI_HOST, "x-rapidapi-key": apiKey },
    });
    if (!res.ok) { log("SofaScore " + res.status + " for " + path); return null; }
    return await res.json();
  } catch (e) { log("SofaScore error: " + e.message); return null; }
}

function dateStr(offsetDays) {
  var d = new Date(Date.now() + offsetDays * 86400000);
  return d.toISOString().split("T")[0];
}

function isFonseca(match) {
  var slug = (match.slug || "").toLowerCase();
  var home = (match.homeTeam && (match.homeTeam.slug || match.homeTeam.name || "")).toLowerCase();
  var away = (match.awayTeam && (match.awayTeam.slug || match.awayTeam.name || "")).toLowerCase();
  return slug.includes("fonseca") || home.includes("fonseca") || away.includes("fonseca");
}

function isFinished(match) {
  var s = match.status || {};
  return s.type === "finished" || s.isFinished === true;
}

function isUpcoming(match) {
  var s = match.status || {};
  var t = (s.type || "").toLowerCase();
  return t === "notstarted" || t === "not_started" || (!s.isFinished && !s.isStarted);
}

function extractMatchData(match) {
  var home = match.homeTeam || {};
  var away = match.awayTeam || {};
  var isFHome = (home.slug || home.name || "").toLowerCase().includes("fonseca");
  var opp = isFHome ? away : home;
  var fScore = isFHome ? (match.homeScore || {}) : (match.awayScore || {});
  var oScore = isFHome ? (match.awayScore || {}) : (match.homeScore || {});
  var tournament = match.tournament || {};
  var round = match.roundInfo || {};
  var season = match.season || {};

  // Build score string
  var fSets = [], oSets = [];
  for (var i = 1; i <= 5; i++) {
    var k = "period" + i;
    if (fScore[k] !== undefined && oScore[k] !== undefined) {
      fSets.push(fScore[k]);
      oSets.push(oScore[k]);
    }
  }
  var scoreStr = fSets.map(function(s, idx) { return s + "-" + oSets[idx]; }).join(" ");

  var fSetsWon = 0, oSetsWon = 0;
  fSets.forEach(function(s, idx) { if (s > oSets[idx]) fSetsWon++; else oSetsWon++; });
  var isWin = fSetsWon > oSetsWon;

  var surface = (function() {
    var gt = (match.groundType || tournament.groundType || "").toLowerCase();
    if (gt === "clay") return "Saibro";
    if (gt === "grass") return "Grama";
    if (gt.includes("hard")) return "Duro";
    return gt || "Duro";
  })();

  var city = "";
  var country = "";
  if (tournament.category) {
    country = tournament.category.country ? tournament.category.country.name || "" : "";
  }

  var category = "";
  var tName = (tournament.name || "").toLowerCase();
  var uName = (tournament.uniqueTournament && tournament.uniqueTournament.name || "").toLowerCase();
  if (uName.includes("grand slam") || ["australian open","roland garros","french open","wimbledon","us open"].some(function(gs) { return tName.includes(gs) || uName.includes(gs); })) category = "Grand Slam";
  else if (tName.includes("1000") || uName.includes("1000") || ["monte carlo","madrid","roma","indian wells","miami","canadian","cincinnati","shanghai","paris"].some(function(m) { return tName.includes(m); })) category = "Masters 1000";
  else if (tName.includes("500") || uName.includes("500")) category = "ATP 500";
  else if (tName.includes("250") || uName.includes("250")) category = "ATP 250";
  else category = tournament.uniqueTournament ? (tournament.uniqueTournament.name || "") : "";

  // Opponent country
  var oppCountry = opp.country ? (opp.country.name || "") : "";

  return {
    id: match.id,
    result: isWin ? "V" : "D",
    score: scoreStr,
    fSets: fSets,
    oSets: oSets,
    opponent_name: opp.shortName || opp.name || "Oponente",
    opponent_id: opp.id || null,
    opponent_country: oppCountry,
    tournament_name: tournament.name || tournament.uniqueTournament && tournament.uniqueTournament.name || "",
    tournament_category: category,
    surface: surface,
    round: round.name || "",
    date: match.startTimestamp ? new Date(match.startTimestamp * 1000).toISOString() : null,
    startTimestamp: match.startTimestamp || null,
    season_id: season.id || null,
    court: match.venue ? (typeof match.venue === "string" ? match.venue : (match.venue.name || match.venue.stadium || "")) : (match.courtName || ""),
    country: country,
    isFonsecaHome: isFHome,
    finished: isFinished(match),
  };
}

// ===== STEP 1: SCAN MATCHES =====
async function scanMatches() {
  log("Scanning matches...");
  var allMatches = [];
  var seenIds = new Set();

  // Strategy A: team events (most reliable)
  var lastEvents = await sofaFetch("/v1/team/events/last/0?team_id=" + FONSECA_TEAM_ID);
  var nextEvents = await sofaFetch("/v1/team/events/next/0?team_id=" + FONSECA_TEAM_ID);

  function addEvents(data) {
    if (!data) return;
    var events = data.events || data;
    if (!Array.isArray(events)) {
      for (var k in data) { if (Array.isArray(data[k])) { events = data[k]; break; } }
    }
    if (!Array.isArray(events)) return;
    events.forEach(function(m) {
      if (m.id && !seenIds.has(m.id)) { seenIds.add(m.id); allMatches.push(m); }
    });
  }

  addEvents(lastEvents);
  addEvents(nextEvents);

  // Strategy B: date scan fallback (if team events returned nothing)
  if (allMatches.length === 0) {
    log("Team events empty, falling back to date scan...");
    for (var d = -SCAN_DAYS_BACK; d <= SCAN_DAYS_FORWARD; d += 1) {
      var ds = dateStr(d);
      var dayData = await sofaFetch("/v1/match/list?sport_slug=tennis&date=" + ds);
      if (!dayData) continue;
      var dayEvents = dayData.events || dayData;
      if (!Array.isArray(dayEvents)) {
        for (var k in dayData) { if (Array.isArray(dayData[k])) { dayEvents = dayData[k]; break; } }
      }
      if (!Array.isArray(dayEvents)) continue;
      dayEvents.forEach(function(m) {
        if (isFonseca(m) && m.id && !seenIds.has(m.id)) { seenIds.add(m.id); allMatches.push(m); }
      });
    }
  }

  log("Found " + allMatches.length + " Fonseca matches");
  return allMatches;
}

// ===== STEP 2: PROCESS MATCHES =====
function processMatches(matches) {
  var finished = [];
  var upcoming = [];

  matches.forEach(function(m) {
    if (isFinished(m)) finished.push(m);
    else if (isUpcoming(m)) upcoming.push(m);
  });

  // Sort finished by timestamp desc (most recent first)
  finished.sort(function(a, b) { return (b.startTimestamp || 0) - (a.startTimestamp || 0); });
  // Sort upcoming by timestamp asc (soonest first)
  upcoming.sort(function(a, b) { return (a.startTimestamp || 0) - (b.startTimestamp || 0); });

  var lastMatch = finished.length > 0 ? extractMatchData(finished[0]) : null;
  var nextMatch = upcoming.length > 0 ? extractMatchData(upcoming[0]) : null;

  // Recent form: last 10 finished matches
  var recentForm = finished.slice(0, 10).map(function(m) {
    var d = extractMatchData(m);
    return { result: d.result, score: d.score, opponent_name: d.opponent_name, tournament: d.tournament_name, date: d.date };
  });

  // Season stats: W/L from this year's matches
  var yearStart = new Date().getFullYear();
  var seasonMatches = finished.filter(function(m) {
    return m.startTimestamp && new Date(m.startTimestamp * 1000).getFullYear() === yearStart;
  });
  var wins = 0, losses = 0;
  var surfaceStats = { hard: { w: 0, l: 0 }, clay: { w: 0, l: 0 }, grass: { w: 0, l: 0 } };
  seasonMatches.forEach(function(m) {
    var d = extractMatchData(m);
    if (d.result === "V") wins++; else losses++;
    var surf = d.surface.toLowerCase();
    var sKey = surf === "saibro" ? "clay" : (surf === "grama" ? "grass" : "hard");
    if (d.result === "V") surfaceStats[sKey].w++; else surfaceStats[sKey].l++;
  });

  return {
    lastMatch: lastMatch,
    nextMatch: nextMatch,
    recentForm: recentForm,
    season: { wins: wins, losses: losses, winPct: (wins + losses) > 0 ? Math.round((wins / (wins + losses)) * 100) : 0 },
    careerStats: { wins: wins, losses: losses, winPct: (wins + losses) > 0 ? Math.round((wins / (wins + losses)) * 100) : 0, surface: surfaceStats },
  };
}

// ===== STEP 3: MATCH STATS =====
async function fetchMatchStats(lastMatch) {
  if (!lastMatch || !lastMatch.id) return null;
  log("Fetching stats for match " + lastMatch.id);
  var data = await sofaFetch("/v1/match/statistics?match_id=" + lastMatch.id);
  if (!data || !Array.isArray(data)) return null;

  var allPeriod = data.find(function(p) { return p.period === "ALL"; });
  if (!allPeriod || !allPeriod.groups) return null;

  var fStats = {}, oStats = {};
  allPeriod.groups.forEach(function(group) {
    (group.statisticsItems || []).forEach(function(item) {
      var k = (item.key || item.name || "").toLowerCase().replace(/\s+/g, "");
      var hv = item.homeValue !== undefined ? item.homeValue : (parseInt(item.home, 10) || 0);
      var av = item.awayValue !== undefined ? item.awayValue : (parseInt(item.away, 10) || 0);
      fStats[k] = lastMatch.isFonsecaHome ? hv : av;
      oStats[k] = lastMatch.isFonsecaHome ? av : hv;
    });
  });

  return {
    fonseca: fStats,
    opponent: oStats,
    opponent_name: lastMatch.opponent_name,
    opponent_country: lastMatch.opponent_country,
    tournament: lastMatch.tournament_name,
    result: lastMatch.result,
    score: lastMatch.score,
    date: lastMatch.date,
    opponent_ranking: null,
  };
}

// ===== STEP 4: RANKING =====
async function fetchRanking() {
  log("Fetching rankings...");
  // Try team-based ranking first
  var teamData = await sofaFetch("/v1/team/" + FONSECA_TEAM_ID);
  var ranking = null;
  if (teamData && teamData.team && teamData.team.ranking) {
    ranking = teamData.team.ranking;
  }

  // Also try to get ATP rankings list for Top 50
  var rankingsData = await sofaFetch("/v1/rankings/type/1");
  var top50 = [];
  if (rankingsData && rankingsData.rankings) {
    var rows = rankingsData.rankings;
    if (Array.isArray(rows)) {
      rows.slice(0, 50).forEach(function(r) {
        var name = r.team ? (r.team.shortName || r.team.name || "") : (r.player ? (r.player.shortName || r.player.name || "") : "");
        top50.push({ rank: r.ranking || r.position || 0, name: name, points: r.points || r.rowName || "" });
        if (name.toLowerCase().includes("fonseca") && !ranking) {
          ranking = r.ranking || r.position;
        }
      });
    }
  }

  return { ranking: ranking, top50: top50 };
}

// ===== STEP 5: OPPONENT PROFILE =====
async function fetchOpponentProfile(nextMatch) {
  if (!nextMatch || !nextMatch.opponent_id) return null;
  log("Fetching opponent profile: " + nextMatch.opponent_name);

  // Check cache first
  var cacheKey = "fn:oppCache:" + nextMatch.opponent_id;
  var cached = await kv.get(cacheKey);
  if (cached) {
    var parsed = typeof cached === "string" ? JSON.parse(cached) : cached;
    if (parsed && parsed.name) return parsed;
  }

  var data = await sofaFetch("/v1/team/" + nextMatch.opponent_id);
  if (!data || !data.team) return null;

  var t = data.team;
  var profile = {
    name: t.shortName || t.name || nextMatch.opponent_name,
    country: t.country ? t.country.name : nextMatch.opponent_country,
    ranking: t.ranking || null,
    age: null,
    height: null,
    hand: null,
    titles: null,
    careerHigh: null,
    style: null,
  };

  // Try player info for age/height
  if (t.playerTeamInfo) {
    var info = t.playerTeamInfo;
    if (info.birthDateTimestamp) {
      var birthDate = new Date(info.birthDateTimestamp * 1000);
      profile.age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    }
    if (info.height) profile.height = (info.height / 100).toFixed(2) + "m";
    if (info.plays) profile.hand = info.plays === "right-handed" ? "Destro" : "Canhoto";
  }

  // Cache for 2 days
  await kv.set(cacheKey, JSON.stringify(profile), { ex: 86400 * 2 });
  return profile;
}

// ===== STEP 6: WIN PROBABILITY (The Odds API) =====
async function fetchWinProb(nextMatch) {
  if (!nextMatch || !nextMatch.opponent_name) return null;
  var oddsKey = process.env.ODDS_API_KEY;
  if (!oddsKey) { log("WARN: ODDS_API_KEY missing, skipping win prob"); return null; }

  log("Fetching odds...");
  try {
    var url = "https://api.the-odds-api.com/v4/sports/tennis_atp_singles/odds/?apiKey=" + oddsKey + "&regions=eu&markets=h2h&oddsFormat=decimal";
    var res = await fetch(url);
    if (!res.ok) { log("Odds API " + res.status); return null; }
    var data = await res.json();
    if (!Array.isArray(data)) return null;

    // Find Fonseca's match
    var fonsecaGame = null;
    for (var i = 0; i < data.length; i++) {
      var g = data[i];
      var names = [g.home_team || "", g.away_team || ""].map(function(n) { return n.toLowerCase(); });
      if (names.some(function(n) { return n.includes("fonseca"); })) { fonsecaGame = g; break; }
    }

    if (!fonsecaGame || !fonsecaGame.bookmakers || fonsecaGame.bookmakers.length === 0) return null;

    // Use first bookmaker
    var book = fonsecaGame.bookmakers[0];
    var market = book.markets && book.markets.find(function(m) { return m.key === "h2h"; });
    if (!market || !market.outcomes) return null;

    var fOdds = null, oOdds = null;
    market.outcomes.forEach(function(o) {
      if (o.name.toLowerCase().includes("fonseca")) fOdds = o.price;
      else oOdds = o.price;
    });

    if (!fOdds || !oOdds) return null;

    var implF = 1 / fOdds;
    var implO = 1 / oOdds;
    var total = implF + implO;
    var fPct = Math.round((implF / total) * 100);

    return {
      fonseca: fPct,
      opponent: 100 - fPct,
      opponent_name: nextMatch.opponent_name,
      source: "odds-api",
      odds: { fonseca: fOdds, opponent: oOdds },
      updatedAt: new Date().toISOString(),
    };
  } catch (e) { log("Odds error: " + e.message); return null; }
}

// ===== STEP 7: TOURNAMENT FACTS (Gemini) =====
async function fetchTournamentFacts(nextMatch) {
  if (!nextMatch || !nextMatch.tournament_name) return null;
  var geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) { log("WARN: GEMINI_API_KEY missing, skipping facts"); return null; }

  log("Generating tournament facts via Gemini...");
  try {
    var prompt = "Gere 5 curiosidades curtas e interessantes sobre o torneio de tênis " + nextMatch.tournament_name +
      " (" + (nextMatch.tournament_category || "ATP") + ", " + (nextMatch.surface || "") + ")." +
      " Cada curiosidade deve ter no máximo 2 frases e ser em português brasileiro." +
      " Responda APENAS com JSON: [{\"text\": \"...\"}]";

    var res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + geminiKey,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
        })
      }
    );
    if (!res.ok) { log("Gemini " + res.status); return null; }
    var data = await res.json();
    var text = data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text;
    if (!text) return null;

    // Parse JSON from Gemini response
    var clean = text.replace(/```json|```/g, "").trim();
    var facts = JSON.parse(clean);
    if (!Array.isArray(facts)) return null;

    return {
      tournament: nextMatch.tournament_name,
      facts: facts.filter(function(f) { return f && f.text; }).slice(0, 5),
      generatedAt: new Date().toISOString(),
    };
  } catch (e) { log("Gemini facts error: " + e.message); return null; }
}

// ===== STEP 8: OPPONENT ENRICHMENT (Gemini) =====
async function enrichOpponentProfile(profile, nextMatch) {
  if (!profile || profile.style) return profile;
  var geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) return profile;

  log("Enriching opponent profile via Gemini...");
  try {
    var prompt = "Descreva em 1-2 frases curtas o estilo de jogo do tenista " + (profile.name || nextMatch.opponent_name) +
      " (" + (profile.country || "") + ", ranking ATP #" + (profile.ranking || "?") + ")." +
      " Em português brasileiro. Responda APENAS o texto, sem aspas.";

    var res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + geminiKey,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.5, maxOutputTokens: 150 }
        })
      }
    );
    if (!res.ok) return profile;
    var data = await res.json();
    var text = data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text;
    if (text) profile.style = text.trim();
  } catch (e) { log("Gemini opponent error: " + e.message); }
  return profile;
}

// ===== MAIN HANDLER =====
export default async function handler(req, res) {
  var startTime = Date.now();
  var results = { steps: {} };

  try {
    // 1. Scan matches
    var matches = await scanMatches();
    results.steps.scan = matches.length + " matches found";

    // 2. Process matches
    var processed = processMatches(matches);
    results.steps.process = "last=" + (processed.lastMatch ? processed.lastMatch.opponent_name : "none") +
      " next=" + (processed.nextMatch ? processed.nextMatch.opponent_name : "none") +
      " form=" + processed.recentForm.length;

    // 3. Match stats
    var matchStats = null;
    if (processed.lastMatch) {
      matchStats = await fetchMatchStats(processed.lastMatch);
    }
    results.steps.stats = matchStats ? "ok" : "skip";

    // 4. Ranking
    var rankData = await fetchRanking();
    results.steps.ranking = rankData.ranking ? "#" + rankData.ranking : "not found";

    // 5. Opponent profile
    var oppProfile = null;
    if (processed.nextMatch) {
      oppProfile = await fetchOpponentProfile(processed.nextMatch);
      if (oppProfile) {
        oppProfile = await enrichOpponentProfile(oppProfile, processed.nextMatch);
      }
    }
    results.steps.opponent = oppProfile ? oppProfile.name : "skip";

    // 6. Win probability
    var winProb = null;
    if (processed.nextMatch) {
      winProb = await fetchWinProb(processed.nextMatch);
    }
    results.steps.odds = winProb ? winProb.fonseca + "% vs " + winProb.opponent + "%" : "skip";

    // 7. Tournament facts
    var tournFacts = null;
    if (processed.nextMatch) {
      tournFacts = await fetchTournamentFacts(processed.nextMatch);
    }
    results.steps.facts = tournFacts ? tournFacts.facts.length + " facts" : "skip";

    // ===== WRITE TO KV =====
    log("Writing to KV...");
    var writes = [];
    var TTL_7D = 86400 * 7;
    var TTL_2D = 86400 * 2;
    var TTL_1D = 86400;

    if (processed.lastMatch) writes.push(kv.set("fn:lastMatch", JSON.stringify(processed.lastMatch), { ex: TTL_7D }));
    if (processed.nextMatch) writes.push(kv.set("fn:nextMatch", JSON.stringify(processed.nextMatch), { ex: TTL_7D }));
    if (processed.recentForm.length > 0) writes.push(kv.set("fn:recentForm", JSON.stringify(processed.recentForm), { ex: TTL_7D }));
    if (processed.season) writes.push(kv.set("fn:season", JSON.stringify(processed.season), { ex: TTL_7D }));
    if (processed.careerStats) writes.push(kv.set("fn:careerStats", JSON.stringify(processed.careerStats), { ex: TTL_7D }));
    if (matchStats) writes.push(kv.set("fn:matchStats", JSON.stringify(matchStats), { ex: TTL_7D }));
    if (rankData.ranking) writes.push(kv.set("fn:ranking", JSON.stringify({ ranking: rankData.ranking, updatedAt: new Date().toISOString() }), { ex: TTL_2D }));
    if (rankData.top50.length > 0) writes.push(kv.set("fn:atpRankings", JSON.stringify({ rankings: rankData.top50, updatedAt: new Date().toISOString() }), { ex: TTL_2D }));
    if (oppProfile) writes.push(kv.set("fn:opponentProfile", JSON.stringify(oppProfile), { ex: TTL_2D }));
    if (winProb) writes.push(kv.set("fn:winProb", JSON.stringify(winProb), { ex: TTL_2D }));
    if (tournFacts) writes.push(kv.set("fn:tournamentFacts", JSON.stringify(tournFacts), { ex: TTL_2D }));

    // Always write cronLastRun
    writes.push(kv.set("fn:cronLastRun", new Date().toISOString(), { ex: TTL_7D }));

    await Promise.all(writes);
    results.steps.kv = writes.length + " keys written";

    var elapsed = Date.now() - startTime;
    log("Done in " + elapsed + "ms — " + writes.length + " KV writes");

    results.ok = true;
    results.elapsed = elapsed + "ms";
    results.timestamp = new Date().toISOString();

    res.status(200).json(results);
  } catch (e) {
    log("FATAL: " + e.message);
    // Still record the attempt
    try { await kv.set("fn:cronLastRun", "error:" + new Date().toISOString(), { ex: 604800 }); } catch (_) {}
    res.status(200).json({ ok: false, error: e.message, steps: results.steps });
  }
}
