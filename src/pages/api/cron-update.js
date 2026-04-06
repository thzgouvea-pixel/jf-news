// ===== CRON: SofaScore Update v9 =====
// CHANGES FROM v8:
//   - Added fetchRankingFromESPN: automatic ranking lookup via ESPN page scraping
//     No API key needed, works for any ATP player automatically
//   - Ranking priority: SofaScore -> ESPN -> Wikipedia (fallback chain)
//   - Added "Rinderknech": "rc91" to ATP_SLUGS
//   - User-Agent bumped to 9.0
// Runs 4x/day via cron-job.org POST to /api/cron-update

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
  "Rinderknech": "rc91",
};

async function sofaFetch(path, apiKey) {
  var url = "https://" + RAPIDAPI_HOST + "/api/sofascore" + path;
  console.log("[cron] Fetching:", path);
  var res = await fetch(url, {
    headers: { "x-rapidapi-host": RAPIDAPI_HOST, "x-rapidapi-key": apiKey },
  });
  if (!res.ok) { console.log("[cron] Error " + res.status + " for " + path); return null; }
  return res.json();
}

// ===== OPPONENT RANKING — from ESPN (automatic, no API key needed) =====
async function fetchRankingFromESPN(opponentName, log) {
  if (!opponentName || opponentName === "A definir") return null;
  try {
    var cachedId = null;
    try { cachedId = await kv.get("fn:espnId:" + opponentName); } catch (e) {}
    var espnId = cachedId ? String(cachedId) : null;
    if (!espnId) {
      var searchName = opponentName.replace(/^[A-Z]\.\s*/, "").trim();
      var lastName = searchName.split(" ").pop().toLowerCase();
      // Method A: ESPN search API
      try {
        var searchUrl = "https://site.web.api.espn.com/apis/common/v3/search?query=" + encodeURIComponent(searchName) + "&limit=5&type=player&sport=tennis";
        var searchRes = await fetch(searchUrl, { headers: { "User-Agent": "FonsecaNews/9.0" } });
        if (searchRes.ok) {
          var searchData = await searchRes.json();
          var items = searchData.results || [];
          for (var ri = 0; ri < items.length && !espnId; ri++) {
            var contents = items[ri].contents || [];
            for (var ci = 0; ci < contents.length && !espnId; ci++) {
              var item = contents[ci];
              var dn = (item.displayName || item.title || "").toLowerCase();
              if (dn.includes(lastName)) {
                var iu = item.url || item.href || "";
                var idM = iu.match(/\/id\/(\d+)/);
                if (idM) espnId = idM[1];
                else if (item.id) espnId = String(item.id);
                else if (item.uid) { var um = item.uid.match(/:(\d+)$/); if (um) espnId = um[1]; }
              }
            }
          }
        }
      } catch (e) { log.push("espn-search: error " + e.message); }
      // Method B: ESPN name-based URL
      if (!espnId) {
        try {
          var nameSlug = searchName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
          var guessRes = await fetch("https://www.espn.com/tennis/player/_/name/" + encodeURIComponent(nameSlug), { headers: { "User-Agent": "FonsecaNews/9.0" }, redirect: "follow" });
          if (guessRes.ok) {
            var gh = await guessRes.text();
            var gm = gh.match(/\/tennis\/player\/_\/id\/(\d+)/);
            if (gm) espnId = gm[1];
          }
        } catch (e) {}
      }
    }
    if (!espnId) { log.push("espn-ranking: no ESPN ID for " + opponentName); return null; }
    var playerRes = await fetch("https://www.espn.com/tennis/player/_/id/" + espnId, { headers: { "User-Agent": "FonsecaNews/9.0" } });
    if (!playerRes.ok) { log.push("espn-ranking: HTTP " + playerRes.status); return null; }
    var html = await playerRes.text();
    var rm = html.match(/ATP\s*Rank\s*#(\d+)/i);
    if (!rm) rm = html.match(/World\s*Ranking[:\s]*#?(\d+)/i);
    if (!rm) rm = html.match(/Rank\s*#(\d+)/i);
    if (!rm) { log.push("espn-ranking: not found in page for " + opponentName); return null; }
    var ranking = parseInt(rm[1], 10);
    if (ranking <= 0 || ranking > 2000) return null;
    await kv.set("fn:espnId:" + opponentName, espnId, { ex: 86400 * 30 });
    log.push("espn-ranking: #" + ranking + " for " + opponentName + " (ESPN ID " + espnId + ")");
    return ranking;
  } catch (e) { log.push("espn-ranking: error " + e.message); return null; }
}

// ===== OPPONENT ENRICHMENT =====
async function fetchOpponentDetails(opponentId, opponentName, apiKey, log) {
  if (!opponentId) { log.push("opp: no opponent_id"); return null; }
  var cacheKey = "fn:oppCache:" + opponentId;
  try {
    var cached = await kv.get(cacheKey);
    if (cached) {
      var parsed = typeof cached === "string" ? JSON.parse(cached) : cached;
      if (parsed && parsed.ranking) { log.push("opp: cache hit #" + parsed.ranking + " " + (parsed.country || "")); return parsed; }
      log.push("opp: cache has no ranking, refetching");
    }
  } catch (e) {}

  var data = await sofaFetch("/v1/team/details?team_id=" + opponentId, apiKey);
  if (!data) { log.push("opp: details 404 for " + opponentId); return null; }
  var team = data.team || data;
  var ranking = team.ranking || (team.rankings && team.rankings.singlesRanking) || null;
  var country = "";
  if (team.country && team.country.name) country = team.country.name;
  else if (team.nationality) country = team.nationality;

  if (!ranking) {
    var rankData = await sofaFetch("/v1/team/rankings?team_id=" + opponentId, apiKey);
    if (rankData) {
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

  // ESPN fallback (NEW in v9)
  if (!ranking || ranking === "?" || ranking === "#?") {
    var espnRank = await fetchRankingFromESPN(opponentName, log);
    if (espnRank) ranking = espnRank;
  }

  // Wikipedia fallback
  if (!ranking || ranking === "?" || ranking === "#?") {
    try {
      var fullName = (opponentName || "").replace(/^[A-Z]\.\s*/, "").trim();
      var wikiSearchUrl = "https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=" + encodeURIComponent(fullName + " tennis") + "&srlimit=3&format=json";
      var wikiSearchRes = await fetch(wikiSearchUrl, { headers: { "User-Agent": "FonsecaNews/9.0" } });
      if (wikiSearchRes.ok) {
        var wikiSearchData = await wikiSearchRes.json();
        var wikiResults = (wikiSearchData.query && wikiSearchData.query.search) || [];
        var wikiPageTitle = null;
        for (var wri = 0; wri < wikiResults.length; wri++) {
          var wSnippet = (wikiResults[wri].snippet || "").toLowerCase();
          if (wSnippet.includes("tennis") || wikiResults[wri].title.toLowerCase().includes("tennis")) { wikiPageTitle = wikiResults[wri].title; break; }
        }
        if (!wikiPageTitle && wikiResults.length > 0) wikiPageTitle = wikiResults[0].title;
        if (wikiPageTitle) {
          var wikiPageRes = await fetch("https://en.wikipedia.org/w/api.php?action=parse&page=" + encodeURIComponent(wikiPageTitle) + "&prop=wikitext&section=0&format=json", { headers: { "User-Agent": "FonsecaNews/9.0" } });
          if (wikiPageRes.ok) {
            var wpd = await wikiPageRes.json();
            var wt = (wpd && wpd.parse && wpd.parse.wikitext) ? (wpd.parse.wikitext["*"] || "") : "";
            var wrm = wt.match(/currentsinglesranking\s*=\s*No\.\s*(\d{1,4})/i);
            if (wrm) { ranking = parseInt(wrm[1], 10); log.push("opp: Wikipedia fallback #" + ranking); }
          }
        }
      }
    } catch (e) { log.push("opp: Wikipedia fallback error " + e.message); }
  }

  var atpSlug = null;
  var nameToCheck = opponentName || team.name || "";
  for (var k in ATP_SLUGS) { if (nameToCheck.indexOf(k) !== -1) { atpSlug = ATP_SLUGS[k]; break; } }

  var result = { ranking: ranking ? parseInt(ranking, 10) : null, country: country, atp_slug: atpSlug, name: opponentName || team.shortName || team.name || "", updatedAt: new Date().toISOString() };
  await kv.set(cacheKey, JSON.stringify(result), { ex: 86400 * 2 });
  log.push("opp: fetched #" + (result.ranking || "?") + " " + result.country + (atpSlug ? " (atp:" + atpSlug + ")" : ""));
  return result;
}

// ===== RANKING — from Wikipedia API =====
async function fetchRanking(apiKey, log) {
  try {
    var apiUrl = "https://en.wikipedia.org/w/api.php?action=parse&page=Jo%C3%A3o_Fonseca_(tennis)&prop=wikitext&section=0&format=json";
    var res = await fetch(apiUrl, { headers: { "User-Agent": "FonsecaNews/9.0 (fan site; contact: thzgouvea@gmail.com)" } });
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

    var wlMatch = wikitext.match(/(?:wonloss_singles|singlesrecord|singles_record|win_loss_singles)\s*=\s*(\d+)[–\-](\d+)/i);
    if (!wlMatch) wlMatch = wikitext.match(/(\d{2,3})[–\-](\d{2,3})\s*(?:singles|record)/i);
    var careerWins = wlMatch ? parseInt(wlMatch[1], 10) : null;
    var careerLosses = wlMatch ? parseInt(wlMatch[2], 10) : null;
    var hardMatch = wikitext.match(/Hard[^|]*?(\d+)[–\-](\d+)/i);
    var clayMatch = wikitext.match(/Clay[^|]*?(\d+)[–\-](\d+)/i);
    var grassMatch = wikitext.match(/Grass[^|]*?(\d+)[–\-](\d+)/i);
    var surfaceStats = {
      hard: hardMatch ? { w: parseInt(hardMatch[1], 10), l: parseInt(hardMatch[2], 10) } : null,
      clay: clayMatch ? { w: parseInt(clayMatch[1], 10), l: parseInt(clayMatch[2], 10) } : null,
      grass: grassMatch ? { w: parseInt(grassMatch[1], 10), l: parseInt(grassMatch[2], 10) } : null,
    };
    var titlesMatch = wikitext.match(/singlesrecord\s*=.*?(\d+)\s*title/i) || wikitext.match(/titles\s*=\s*(\d+)/i);
    var titlesCount = titlesMatch ? parseInt(titlesMatch[1], 10) : 2;
    var careerData = { wins: careerWins, losses: careerLosses, winPct: (careerWins && careerLosses) ? Math.round((careerWins / (careerWins + careerLosses)) * 100) : null, surface: surfaceStats, titles: titlesCount, updatedAt: new Date().toISOString() };
    await kv.set("fn:careerStats", JSON.stringify(careerData), { ex: 86400 * 7 });
    log.push("career: " + (careerWins || "?") + "-" + (careerLosses || "?") + " (" + (careerData.winPct || "?") + "%)");
    return { ranking: ranking, points: null, previousRanking: null, bestRanking: bestRanking, rankingChange: 0, prizeMoney: prizeMoney };
  } catch (e) { log.push("ranking: Wikipedia API error " + e.message); }
  return null;
}

async function fetchSeasonStats(apiKey, log) {
  try {
    var existingForm = await kv.get("fn:recentForm");
    var form = existingForm ? (typeof existingForm === "string" ? JSON.parse(existingForm) : existingForm) : [];
    if (form.length === 0) { log.push("season: no form data"); return null; }
    var currentYear = new Date().getFullYear(); var wins = 0; var losses = 0;
    for (var i = 0; i < form.length; i++) { if (!form[i].date) continue; var matchYear = new Date(form[i].date).getFullYear(); if (matchYear !== currentYear) continue; if (form[i].result === "V") wins++; else if (form[i].result === "D") losses++; }
    if (wins === 0 && losses === 0) { log.push("season: no " + currentYear + " matches"); return null; }
    log.push("season: " + wins + "W-" + losses + "L (" + currentYear + ")");
    return { wins: wins, losses: losses, year: currentYear };
  } catch (e) { log.push("season: error " + e.message); return null; }
}

async function findFonsecaMatches(date, apiKey) {
  var dateStr = date.toISOString().split("T")[0];
  var data = await sofaFetch("/v1/match/list?sport_slug=tennis&date=" + dateStr, apiKey);
  if (!data) return [];
  var matches = [];
  if (Array.isArray(data)) matches = data;
  else if (data.events && Array.isArray(data.events)) matches = data.events;
  else { for (var k of Object.keys(data)) { if (Array.isArray(data[k])) { matches = data[k]; break; } } }
  return matches.filter(function (m) {
    var slug = (m.slug || "").toLowerCase();
    var homeName = (m.homeTeam && (m.homeTeam.slug || m.homeTeam.name || "")).toLowerCase();
    var awayName = (m.awayTeam && (m.awayTeam.slug || m.awayTeam.name || "")).toLowerCase();
    return slug.includes("fonseca") || homeName.includes("fonseca") || awayName.includes("fonseca");
  });
}

async function findLastMatch(apiKey) {
  var today = new Date();
  for (var i = 0; i < 7; i++) { var d = new Date(today); d.setDate(d.getDate() - i); var matches = await findFonsecaMatches(d, apiKey); if (matches.length > 0) { var finished = matches.filter(function (m) { return m.status && (m.status.type === "finished" || m.status.isFinished); }); if (finished.length > 0) return { match: finished[0], daysAgo: i, requestsUsed: i + 1 }; } }
  return { match: null, daysAgo: -1, requestsUsed: 7 };
}

async function findNextMatch(apiKey) {
  var today = new Date();
  for (var i = 0; i <= 7; i++) { var d = new Date(today); d.setDate(d.getDate() + i); var matches = await findFonsecaMatches(d, apiKey); if (matches.length > 0) { var upcoming = matches.filter(function (m) { return m.status && (m.status.type === "notstarted" || !m.status.isFinished); }); if (upcoming.length > 0) return { match: upcoming[0], requestsUsed: i + 1 }; if (i === 0) continue; } }
  return { match: null, requestsUsed: 7 };
}

async function fetchMatchStats(matchId, apiKey) {
  if (!matchId) return null;
  var data = await sofaFetch("/v1/match/statistics?match_id=" + matchId, apiKey);
  if (!data || !Array.isArray(data)) return null;
  var allPeriod = data.find(function (p) { return p.period === "ALL"; });
  if (!allPeriod || !allPeriod.groups) return null;
  var home = {}, away = {};
  allPeriod.groups.forEach(function (group) { (group.statisticsItems || []).forEach(function (item) { var key = (item.key || item.name || "").toLowerCase().replace(/\s+/g, "_"); home[key] = item.homeValue !== undefined ? item.homeValue : (parseInt(item.home, 10) || 0); away[key] = item.awayValue !== undefined ? item.awayValue : (parseInt(item.away, 10) || 0); }); });
  return { home, away };
}

async function fetchOdds(nextMatch, apiKey, log) {
  if (!nextMatch) { log.push("prob: no next match"); return; }
  if (nextMatch.event_id) {
    try {
      var oddsData = await sofaFetch("/v1/event/" + nextMatch.event_id + "/odds", apiKey);
      if (oddsData && oddsData.markets) {
        var markets = Array.isArray(oddsData.markets) ? oddsData.markets : [];
        for (var mi = 0; mi < markets.length; mi++) { var market = markets[mi]; if (!market.choices || market.choices.length < 2) continue; var fOdds = null; var oOdds = null; for (var ci = 0; ci < market.choices.length; ci++) { var choice = market.choices[ci]; var choiceName = (choice.name || "").toLowerCase(); if (choiceName.includes("fonseca")) fOdds = choice.fractionalValue || choice.odds; else oOdds = choice.fractionalValue || choice.odds; } if (fOdds && oOdds) { var implF = 1 / parseFloat(fOdds); var implO = 1 / parseFloat(oOdds); var totalImpl = implF + implO; var fPct = Math.round((implF / totalImpl) * 100); var oPct = 100 - fPct; await kv.set("fn:winProb", JSON.stringify({ fonseca: fPct, opponent: oPct, opponent_name: nextMatch.opponent_name, tournament: nextMatch.tournament_name, source: "sofascore", updatedAt: new Date().toISOString() }), { ex: 86400 }); log.push("prob: SofaScore odds Fonseca " + fPct + "% vs " + oPct + "%"); return; } }
      }
      log.push("prob: SofaScore no odds for event " + nextMatch.event_id);
    } catch (e) { log.push("prob: SofaScore odds error " + e.message); }
  }
  var oddsApiKey = process.env.ODDS_API_KEY;
  if (oddsApiKey) {
    var tournamentName = (nextMatch.tournament_name || "").toLowerCase(); var sportKey = null;
    for (var key of Object.keys(ODDS_TOURNAMENT_MAP)) { if (tournamentName.includes(key)) { sportKey = ODDS_TOURNAMENT_MAP[key]; break; } }
    if (sportKey) {
      try {
        var url = "https://api.the-odds-api.com/v4/sports/" + sportKey + "/odds?regions=eu&markets=h2h&oddsFormat=decimal&apiKey=" + oddsApiKey;
        var res = await fetch(url);
        if (res.ok) {
          var data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            var fm = data.find(function (e) { return (e.home_team||"").toLowerCase().includes("fonseca") || (e.away_team||"").toLowerCase().includes("fonseca"); });
            if (fm) {
              var isFH = (fm.home_team||"").toLowerCase().includes("fonseca"); var on = isFH ? fm.away_team : fm.home_team;
              var fo = [], oo = [];
              (fm.bookmakers||[]).forEach(function(bm) { var mk = (bm.markets||[]).find(function(m){return m.key==="h2h";}); if(!mk) return; (mk.outcomes||[]).forEach(function(o) { if ((o.name||"").toLowerCase().includes("fonseca")) fo.push(o.price); else oo.push(o.price); }); });
              if (fo.length > 0 && oo.length > 0) {
                function median(a){var s=a.slice().sort(function(x,y){return x-y;});var m=Math.floor(s.length/2);return s.length%2!==0?s[m]:(s[m-1]+s[m])/2;}
                var mF=median(fo),mO=median(oo),iF=1/mF,iO=1/mO,t=iF+iO,fp=Math.round((iF/t)*100),op=100-fp;
                await kv.set("fn:winProb", JSON.stringify({ fonseca:fp, opponent:op, opponent_name:on, tournament:nextMatch.tournament_name, source:"odds-api", updatedAt:new Date().toISOString() }), {ex:86400});
                log.push("prob: Fonseca "+fp+"% vs "+on+" "+op+"%"); return;
              }
            } else { log.push("prob: Fonseca not in events"); }
          }
        }
      } catch (e) { log.push("prob: exception " + e.message); }
    }
  }
  try {
    var manualOdds = await kv.get("fn:manualOdds");
    if (manualOdds) {
      var mo = typeof manualOdds === "string" ? JSON.parse(manualOdds) : manualOdds;
      if (mo.fonseca && mo.opponent) {
        var i3=1/parseFloat(mo.fonseca),o3=1/parseFloat(mo.opponent),t3=i3+o3,f3=Math.round((i3/t3)*100),p3=100-f3;
        await kv.set("fn:winProb", JSON.stringify({ fonseca:f3, opponent:p3, opponent_name:nextMatch.opponent_name, tournament:nextMatch.tournament_name, source:"manual", updatedAt:new Date().toISOString() }), {ex:86400});
        log.push("prob: manual odds Fonseca "+f3+"% vs "+p3+"% ("+mo.fonseca+"/"+mo.opponent+")"); return;
      }
    }
  } catch (e) { log.push("prob: manual odds error " + e.message); }
  log.push("prob: no odds source available");
}

function parseMatch(m, isNext) {
  if (!m) return null;
  var homeTeam=m.homeTeam||{}, awayTeam=m.awayTeam||{}, tournament=m.tournament||{}, season=m.season||{}, roundInfo=m.roundInfo||{}, homeScore=m.homeScore||{}, awayScore=m.awayScore||{};
  var isFonsecaHome = (homeTeam.slug||"").toLowerCase().includes(FONSECA_SLUG);
  var opponent = isFonsecaHome ? awayTeam : homeTeam;
  var detectedSurface = "";
  if (m.groundType) detectedSurface = m.groundType;
  else if (tournament.groundType) detectedSurface = tournament.groundType;
  else if (season.groundType) detectedSurface = season.groundType;
  if (!detectedSurface) {
    var tName = (tournament.name||"").toLowerCase();
    var clay = ["monte carlo","madrid","roma","roland garros","french open","buenos aires","rio open","barcelona","hamburg","kitzbuhel","bastad","umag","gstaad"];
    var grass = ["wimbledon","halle","queen","s-hertogenbosch","eastbourne","mallorca","newport","stuttgart"];
    for (var ci=0;ci<clay.length;ci++){if(tName.includes(clay[ci])){detectedSurface="Saibro";break;}}
    if(!detectedSurface){for(var gi=0;gi<grass.length;gi++){if(tName.includes(grass[gi])){detectedSurface="Grama";break;}}}
    if(!detectedSurface&&tName) detectedSurface="Duro";
  }
  if(detectedSurface.toLowerCase()==="clay") detectedSurface="Saibro";
  else if(detectedSurface.toLowerCase()==="grass") detectedSurface="Grama";
  else if(detectedSurface.toLowerCase()==="hard"||detectedSurface.toLowerCase()==="hardcourt") detectedSurface="Duro";
  var result = { event_id:m.id, tournament_name:tournament.name||"", tournament_category:season.name||tournament.name||"", surface:detectedSurface, city:(tournament.name||"").split(",")[0]||"", round:roundInfo.name||"", date:m.timestamp?new Date(m.timestamp*1000).toISOString():null, opponent_name:opponent.shortName||opponent.name||"A definir", opponent_id:opponent.id||null, opponent_ranking:opponent.ranking||null, opponent_country:opponent.country?opponent.country.name:"", isFonsecaHome };
  if (!isNext) {
    var fScore=isFonsecaHome?homeScore:awayScore, oScore=isFonsecaHome?awayScore:homeScore, sets=[];
    for(var i=1;i<=5;i++){var key="period"+i;if(fScore[key]!==undefined&&oScore[key]!==undefined)sets.push(fScore[key]+"-"+oScore[key]);}
    var wonMatch=false,fSW=0,oSW=0;
    for(var si=1;si<=5;si++){var sk="period"+si;if(fScore[sk]!==undefined&&oScore[sk]!==undefined){if(fScore[sk]>oScore[sk])fSW++;else if(oScore[sk]>fScore[sk])oSW++;}}
    wonMatch=fSW>oSW;
    if(fSW===oSW&&m.winnerCode){wonMatch=(m.winnerCode===1&&isFonsecaHome)||(m.winnerCode===2&&!isFonsecaHome);}
    result.result=wonMatch?"V":"D"; result.score=sets.join(" "); result.opponent=result.opponent_name; result.tournament=result.tournament_name;
  }
  return result;
}

async function fetchBiography(log) {
  try { var cached=await kv.get("fn:biography"); if(cached){var p=typeof cached==="string"?JSON.parse(cached):cached;var age=p.updatedAt?(Date.now()-new Date(p.updatedAt).getTime())/86400000:999;if(age<3&&p.paragraphs&&p.paragraphs.length>0){log.push("bio: cache ok ("+Math.round(age)+"d old)");return;}} } catch(e){}
  try {
    var res=await fetch("https://en.wikipedia.org/w/api.php?action=parse&page=Jo%C3%A3o_Fonseca_(tennis)&prop=wikitext&format=json",{headers:{"User-Agent":"FonsecaNews/9.0"}});
    if(!res.ok){log.push("bio: HTTP "+res.status);return;}
    var data=await res.json(); var wikitext=(data&&data.parse&&data.parse.wikitext)?(data.parse.wikitext["*"]||""):"";
    if(!wikitext){log.push("bio: empty");return;}
    var getField=function(f){var m=wikitext.match(new RegExp("\\|\\s*"+f+"\\s*=\\s*([^\\n|]+)","i"));return m?m[1].replace(/\[\[([^\]|]*\|)?([^\]]*)\]\]/g,"$2").replace(/\{\{[^}]*\}\}/g,"").trim():null;};
    var bdMatch=wikitext.match(/birth.date.*?\|(\d{4})\|(\d{1,2})\|(\d{1,2})/i);
    var birthDateClean=bdMatch?(bdMatch[3].padStart(2,"0")+"/"+bdMatch[2].padStart(2,"0")+"/"+bdMatch[1]):"21/08/2006";
    var birthPlace=getField("birth_place")||"Ipanema, Rio de Janeiro";
    var hMatch=wikitext.match(/height.*?(\d\.\d{2})/i); var heightClean=hMatch?hMatch[1]+"m":"1,83m";
    var hand=getField("plays"); var handClean=hand?(hand.toLowerCase().includes("right")?"Destro":"Canhoto"):"Destro";
    var coach=getField("coach")||getField("trainer");
    var highRank=getField("highestsinglesranking"); var highRankNum=highRank?(highRank.match(/(\d+)/)||[])[1]:"24";
    var proYear=getField("turned_pro")||getField("turnedpro")||"2024";
    var sponsors=[];
    var brandNames=["Nike","Head","Adidas","Wilson","Babolat","Yonex","Lacoste","Rolex","TAG Heuer","Uniqlo"];
    for(var bi=0;bi<brandNames.length;bi++){if(wikitext.indexOf(brandNames[bi])!==-1&&sponsors.indexOf(brandNames[bi])===-1){var bc=wikitext.match(new RegExp("("+brandNames[bi]+")[^.]{0,50}(sponsor|endors|wear|equip|racket|shoe|cloth|apparel|deal|contract)","i"));var bc2=wikitext.match(new RegExp("(sponsor|endors|wear|equip|racket|shoe|cloth|apparel|deal|contract)[^.]{0,50}("+brandNames[bi]+")","i"));if(bc||bc2)sponsors.push(brandNames[bi]);}}
    var introEnd=wikitext.indexOf("\n=="); var intro=introEnd>0?wikitext.substring(0,introEnd):wikitext.substring(0,3000);
    var infoboxEnd=intro.lastIndexOf("}}"); if(infoboxEnd>0) intro=intro.substring(infoboxEnd+2);
    intro=intro.replace(/\[\[([^\]|]*\|)?([^\]]*)\]\]/g,"$2").replace(/\{\{[^}]*\}\}/g,"").replace(/'{2,}/g,"").replace(/<ref[^>]*>[\s\S]*?<\/ref>/g,"").replace(/<ref[^/]*\/>/g,"").replace(/<[^>]+>/g,"").replace(/\n{3,}/g,"\n\n").trim();
    var paragraphs=intro.split(/\n\n+/).filter(function(p){return p.trim().length>40;}).slice(0,4);
    var ptParagraphs=paragraphs.map(function(p){return p.replace(/is a Brazilian professional tennis player/gi,"é um tenista profissional brasileiro").replace(/born (\w+ \d+, \d{4})/gi,"nascido em $1").replace(/He has a career.high.*?No\.\s*(\d+)/gi,"Seu melhor ranking é o #$1").replace(/He is currently/gi,"Atualmente é").replace(/right.handed/gi,"destro").replace(/left.handed/gi,"canhoto").trim();});
    var biography={birthDate:birthDateClean,birthPlace:birthPlace.replace(/,?\s*Brazil$/i,""),height:heightClean,hand:handClean,coach:coach,proSince:"Profissional desde "+proYear,bestRanking:highRankNum,sponsors:sponsors.length>0?sponsors:null,racket:null,paragraphs:ptParagraphs.length>0?ptParagraphs:null,updatedAt:new Date().toISOString()};
    await kv.set("fn:biography",JSON.stringify(biography),{ex:86400*3});
    log.push("bio: parsed ("+sponsors.length+" sponsors, "+ptParagraphs.length+" paragraphs)");
  } catch(e){log.push("bio: error "+e.message);}
}

var TOURNAMENT_WIKI_MAP={"monte carlo":"Monte-Carlo_Masters","madrid":"Madrid_Open_(tennis)","roma":"Italian_Open_(tennis)","roland garros":"French_Open","french open":"French_Open","wimbledon":"The_Championships,_Wimbledon","us open":"US_Open_(tennis)","australian open":"Australian_Open","indian wells":"Indian_Wells_Masters","miami":"Miami_Open","canadian open":"Canadian_Open_(tennis)","cincinnati":"Cincinnati_Masters","shanghai":"Shanghai_Masters_(tennis)","paris":"Paris_Masters","barcelona":"Barcelona_Open_Banc_Sabadell","basel":"Swiss_Indoors","vienna":"Vienna_Open","hamburg":"Hamburg_European_Open","rio open":"Rio_Open","buenos aires":"Argentina_Open"};

async function fetchTournamentFacts(tournamentName,log){
  if(!tournamentName){log.push("tournament: no name");return;}
  try{var cached=await kv.get("fn:tournamentFacts");if(cached){var p=typeof cached==="string"?JSON.parse(cached):cached;var same=p.name&&tournamentName.toLowerCase().includes(p.name.toLowerCase().split(" ")[0]);var clean=true;if(p.facts){for(var fi=0;fi<p.facts.length;fi++){if((p.facts[fi].text||"").indexOf("[[")!==-1||(p.facts[fi].text||"").indexOf("{{")!==-1){clean=false;break;}}}if(same&&clean){log.push("tournament: cache ok ("+p.name+")");return;}}}catch(e){}
  var wikiPage=null;var tL=tournamentName.toLowerCase();for(var key in TOURNAMENT_WIKI_MAP){if(tL.includes(key)){wikiPage=TOURNAMENT_WIKI_MAP[key];break;}}
  if(!wikiPage){log.push("tournament: no wiki for "+tournamentName);return;}
  try{
    var res=await fetch("https://en.wikipedia.org/w/api.php?action=parse&page="+encodeURIComponent(wikiPage)+"&prop=wikitext&section=0&format=json",{headers:{"User-Agent":"FonsecaNews/9.0"}});
    if(!res.ok){log.push("tournament: HTTP "+res.status);return;}
    var data=await res.json();var wt=(data&&data.parse&&data.parse.wikitext)?(data.parse.wikitext["*"]||""):"";if(!wt){log.push("tournament: empty");return;}
    var facts=[];
    var fm=wt.match(/(?:first.*?|inaugurated.*?|established.*?|founded.*?)(\d{4})/i);if(!fm)fm=wt.match(/(?:held\s+since|since)\s+(\d{4})/i);
    if(fm)facts.push({icon:"📅",text:"Disputado desde "+fm[1]+" — "+(new Date().getFullYear()-parseInt(fm[1],10))+" anos de história"});
    var sm=wt.match(/surface\s*=\s*([^\n|]+)/i);if(sm){var s=sm[1].replace(/\[\[([^\]|]*\|)?([^\]]*)\]?\]?/g,"$2").replace(/\{\{[^}]*\}\}/g,"").replace(/clay\s*court/gi,"Saibro").replace(/hard\s*court/gi,"Piso duro").replace(/grass\s*court/gi,"Grama").replace(/^clay$/gi,"Saibro").replace(/^hard$/gi,"Piso duro").replace(/^grass$/gi,"Grama").trim();if(s)facts.push({icon:"🏟️",text:"Superfície: "+s});}
    var vm=wt.match(/(?:venue|location)\s*=\s*([^\n|]+)/i);if(vm){var v=vm[1].replace(/\[\[([^\]|]*\|)?([^\]]*)\]?\]?/g,"$2").replace(/\{\{[^}]*\}\}/g,"").trim();if(v.length>5&&v.length<80)facts.push({icon:"📍",text:v});}
    var pm=wt.match(/prize.?money\s*=\s*([^\n|]+)/i);if(pm){var pr=pm[1].replace(/\[\[([^\]|]*\|)?([^\]]*)\]?\]?/g,"$2").replace(/\{\{[^}]*\}\}/g,"").trim();if(pr.length>2&&pr.length<50)facts.push({icon:"💰",text:"Premiação: "+pr});}
    var nm=wt.match(/(?:Nadal|Rafael Nadal).*?(\d+)\s*(?:titles|times|wins)/i);var dm2=wt.match(/(?:Djokovic|Novak Djokovic).*?(\d+)\s*(?:titles|times|wins)/i);
    if(nm)facts.push({icon:"👑",text:"Rafael Nadal é o maior campeão com "+nm[1]+" títulos"});else if(dm2)facts.push({icon:"👑",text:"Novak Djokovic é o maior campeão com "+dm2[1]+" títulos"});
    var cm=wt.match(/(?:category|series|type)\s*=\s*([^\n|]+)/i);if(cm){var c=cm[1].replace(/\[\[([^\]|]*\|)?([^\]]*)\]?\]?/g,"$2").replace(/\{\{[^}]*\}\}/g,"").trim();if(c.toLowerCase()==="atp"||c.toLowerCase()==="atp tour masters 1000")c="ATP Masters 1000";if(c.length>2&&c.length<40)facts.push({icon:"🏆",text:"Categoria: "+c});}
    if(facts.length===0){log.push("tournament: no facts");return;}
    await kv.set("fn:tournamentFacts",JSON.stringify({name:tournamentName,facts:facts.slice(0,5),source:"Wikipedia",updatedAt:new Date().toISOString()}),{ex:86400*14});
    log.push("tournament: "+facts.length+" facts");
  }catch(e){log.push("tournament: error "+e.message);}
}

async function fetchOpponentProfile(opponentName,opponentId,log){
  if(!opponentName||opponentName==="A definir"){log.push("oppProfile: no opponent");return;}
  try{var cached=await kv.get("fn:opponentProfile");if(cached){var p=typeof cached==="string"?JSON.parse(cached):cached;if(p.name===opponentName&&p.style){log.push("oppProfile: cache ok ("+p.name+")");return;}}}catch(e){}
  try{
    var fullName=opponentName.replace(/^[A-Z]\.\s*/,"").trim();
    var searchTerms=[opponentName.replace(/\./g,"").trim()+" tennis",fullName+" tennis player"];
    var wikitext="";
    for(var si=0;si<searchTerms.length;si++){
      var sr=await fetch("https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch="+encodeURIComponent(searchTerms[si])+"&srlimit=3&format=json",{headers:{"User-Agent":"FonsecaNews/9.0"}});
      if(!sr.ok)continue;var sd=await sr.json();var results=(sd.query&&sd.query.search)||[];
      var pageTitle=null;for(var ri=0;ri<results.length;ri++){var sn=(results[ri].snippet||"").toLowerCase();if(sn.includes("tennis")||results[ri].title.toLowerCase().includes("tennis")){pageTitle=results[ri].title;break;}}
      if(!pageTitle&&results.length>0)pageTitle=results[0].title;
      if(pageTitle){var pr=await fetch("https://en.wikipedia.org/w/api.php?action=parse&page="+encodeURIComponent(pageTitle)+"&prop=wikitext&format=json",{headers:{"User-Agent":"FonsecaNews/9.0"}});if(pr.ok){var pd=await pr.json();wikitext=(pd&&pd.parse&&pd.parse.wikitext)?(pd.parse.wikitext["*"]||""):"";if(wikitext.length>200)break;}}
    }
    if(!wikitext||wikitext.length<200){log.push("oppProfile: no Wikipedia for "+opponentName);return;}
    var getField=function(f){var m=wikitext.match(new RegExp("\\|\\s*"+f+"\\s*=\\s*([^\\n|]+)","i"));return m?m[1].replace(/\[\[([^\]|]*\|)?([^\]]*)\]\]/g,"$2").replace(/\{\{[^}]*\}\}/g,"").trim():null;};
    var hMatch=wikitext.match(/height.*?(\d\.\d{2})/i);var heightVal=hMatch?hMatch[1]+"m":null;
    var plays=getField("plays");var hand=plays?(plays.toLowerCase().includes("right")?"Destro":plays.toLowerCase().includes("left")?"Canhoto":plays):null;
    var bdMatch=wikitext.match(/birth.date.*?\|(\d{4})\|(\d{1,2})\|(\d{1,2})/i);var age=null;
    if(bdMatch){var by=parseInt(bdMatch[1],10);age=new Date().getFullYear()-by;var bm=parseInt(bdMatch[2],10);var bd=parseInt(bdMatch[3],10);var now=new Date();if(now.getMonth()+1<bm||(now.getMonth()+1===bm&&now.getDate()<bd))age--;}
    var country=getField("birth_place")||"";var cp=country.split(",");var cc=cp.length>1?cp[cp.length-1].trim():country;
    var chm=wikitext.match(/(?:highest|career.high).*?singles.*?No\.\s*(\d+)/i);var careerHigh=chm?parseInt(chm[1],10):null;
    var crm=wikitext.match(/currentsinglesranking\s*=\s*No\.\s*(\d+)/i);var currentRanking=crm?parseInt(crm[1],10):null;
    var tm=wikitext.match(/(?:wonloss_singles|singlesrecord).*?(\d+)\s*title/i);var titles=tm?parseInt(tm[1],10):null;
    var attrs=[];
    if(heightVal){var hn=parseFloat(heightVal);if(hn>=1.90)attrs.push("Com "+heightVal+" de altura, tem grande vantagem no saque");else if(hn>=1.85)attrs.push("Com "+heightVal+", combina potência e mobilidade");else attrs.push("Com "+heightVal+", destaca-se pela agilidade na quadra");}
    if(hand)attrs.push(hand==="Canhoto"?"Joga com a mão esquerda, criando ângulos incomuns":"Destro, com jogo sólido de fundo de quadra");
    if(careerHigh)attrs.push("Já foi #"+careerHigh+" do mundo");
    if(titles&&titles>0)attrs.push(titles+" título"+(titles>1?"s":"")+" ATP na carreira");
    var styleText=attrs.join(". ")+".";
    var styleSM=wikitext.match(/==\s*(?:Playing style|Style of play)\s*==\s*\n([\s\S]*?)(?:\n==|$)/i);
    if(styleSM){var st=styleSM[1].replace(/\[\[([^\]|]*\|)?([^\]]*)\]\]/g,"$2").replace(/\{\{[^}]*\}\}/g,"").replace(/'{2,}/g,"").replace(/<ref[^>]*>[\s\S]*?<\/ref>/g,"").replace(/<ref[^/]*\/>/g,"").replace(/<[^>]+>/g,"").replace(/\n+/g," ").trim();var sentences=st.match(/[^.!?]+[.!?]+/g)||[];if(sentences.length>0)styleText=sentences.slice(0,3).join(" ").trim();}
    var atpSlug=null;for(var k in ATP_SLUGS){if(opponentName.indexOf(k)!==-1){atpSlug=ATP_SLUGS[k];break;}}
    var profile={name:opponentName,ranking:currentRanking,country:cc,age:age,height:heightVal,hand:hand,style:styleText||null,titles:titles,careerHigh:careerHigh,atp_slug:atpSlug,updatedAt:new Date().toISOString()};
    await kv.set("fn:opponentProfile",JSON.stringify(profile),{ex:86400*7});
    log.push("oppProfile: "+opponentName+" — "+(heightVal||"?")+" "+(hand||"?")+" #"+(currentRanking||"?"));
  }catch(e){log.push("oppProfile: error "+e.message);}
}

function enrichMatch(match,oppDetails){if(!match||!oppDetails)return match;if(oppDetails.ranking)match.opponent_ranking=oppDetails.ranking;if(oppDetails.country)match.opponent_country=oppDetails.country;if(oppDetails.atp_slug)match.opponent_atp_slug=oppDetails.atp_slug;return match;}

export default async function handler(req,res){
  var apiKey=process.env.RAPIDAPI_KEY;
  if(!apiKey) return res.status(200).json({ok:false,error:"No RAPIDAPI_KEY"});
  try{
    var log=[],totalRequests=0,now=new Date();
    var ranking=await fetchRanking(apiKey,log);
    if(ranking&&ranking.ranking) await kv.set("fn:ranking",JSON.stringify(ranking),{ex:86400});
    if(ranking&&ranking.prizeMoney){await kv.set("fn:prizeMoney",JSON.stringify({amount:ranking.prizeMoney,currency:"USD",updatedAt:now.toISOString()}),{ex:86400*8});log.push("prizeMoney: $"+ranking.prizeMoney);}
    var lastResult=await findLastMatch(apiKey);totalRequests+=lastResult.requestsUsed;var lastMatch=null;
    if(lastResult.match){
      lastMatch=parseMatch(lastResult.match,false);
      if(lastMatch.opponent_id&&(!lastMatch.opponent_ranking||!lastMatch.opponent_country)){var lod=await fetchOpponentDetails(lastMatch.opponent_id,lastMatch.opponent_name,apiKey,log);if(lod){lastMatch=enrichMatch(lastMatch,lod);totalRequests++;}}
      await kv.set("fn:lastMatch",JSON.stringify(lastMatch),{ex:86400*3});
      log.push("lastMatch: "+lastMatch.result+" vs "+lastMatch.opponent_name+" ("+lastResult.daysAgo+"d ago)");
      var prevStatsId=null;try{prevStatsId=await kv.get("fn:lastStatsEventId");}catch(e){}
      if(String(lastResult.match.id)!==String(prevStatsId)){
        var rawStats=await fetchMatchStats(lastResult.match.id,apiKey);totalRequests++;
        if(rawStats){var fS=lastMatch.isFonsecaHome?rawStats.home:rawStats.away,oS=lastMatch.isFonsecaHome?rawStats.away:rawStats.home;
          await kv.set("fn:matchStats",JSON.stringify({event_id:lastResult.match.id,fonseca:fS,opponent:oS,opponent_name:lastMatch.opponent_name,opponent_id:lastMatch.opponent_id,opponent_ranking:lastMatch.opponent_ranking,opponent_country:lastMatch.opponent_country,tournament:lastMatch.tournament_name,date:lastMatch.date,result:lastMatch.result,score:lastMatch.score}),{ex:86400*7});
          await kv.set("fn:lastStatsEventId",String(lastResult.match.id));log.push("stats: "+Object.keys(fS).length+" metrics");
        }else{log.push("stats: not available");}
      }else{log.push("stats: already fetched");}
      try{
        var existingForm=await kv.get("fn:recentForm");var form=existingForm?(typeof existingForm==="string"?JSON.parse(existingForm):existingForm):[];
        var inForm=form.some(function(f){return f.event_id===lastMatch.event_id;});
        if(!inForm||form.length<5){
          var allF=[];var td=new Date();
          for(var fd=0;fd<14;fd++){var sd=new Date(td);sd.setDate(sd.getDate()-fd);var dm=await findFonsecaMatches(sd,apiKey);totalRequests++;var fin=dm.filter(function(m){return m.status&&(m.status.type==="finished"||m.status.isFinished);});allF=allF.concat(fin);if(allF.length>=5)break;}
          allF.sort(function(a,b){return(b.timestamp||0)-(a.timestamp||0);});
          var seen={},uniq=[];for(var ui=0;ui<allF.length;ui++){var mid=allF[ui].id;if(!seen[mid]){seen[mid]=true;uniq.push(allF[ui]);}}
          form=uniq.slice(0,10).map(function(m){return parseMatch(m,false);});
          await kv.set("fn:recentForm",JSON.stringify(form),{ex:86400*7});
          log.push("form: "+form.map(function(m){return m.result;}).join("")+" ("+form.length+")");
        }else{log.push("form: cache ok");}
      }catch(e){log.push("form: error "+e.message);}
    }else{log.push("lastMatch: none in 7 days");}
    var nextResult=await findNextMatch(apiKey);totalRequests+=nextResult.requestsUsed;var nextMatch=null;
    if(nextResult.match){
      nextMatch=parseMatch(nextResult.match,true);
      if(nextMatch.opponent_id){
        try{await kv.del("fn:oppCache:"+nextMatch.opponent_id);}catch(e){}
        var od=await fetchOpponentDetails(nextMatch.opponent_id,nextMatch.opponent_name,apiKey,log);
        if(od){nextMatch=enrichMatch(nextMatch,od);totalRequests++;}
        await kv.set("fn:prevOpponentId",String(nextMatch.opponent_id));
      }
      await kv.set("fn:nextMatch",JSON.stringify(nextMatch),{ex:86400});
      if(!nextMatch.opponent_ranking){try{var op=await kv.get("fn:opponentProfile");if(op){var opp=typeof op==="string"?JSON.parse(op):op;if(opp&&opp.ranking){nextMatch.opponent_ranking=opp.ranking;await kv.set("fn:nextMatch",JSON.stringify(nextMatch),{ex:86400});log.push("nextMatch: ranking fallback #"+opp.ranking);}}}catch(e){}}
      log.push("nextMatch: vs "+nextMatch.opponent_name+(nextMatch.opponent_ranking?" #"+nextMatch.opponent_ranking:"")+" @ "+nextMatch.tournament_name);
    }else{
      var mn=await kv.get("fn:nextMatch");if(mn){var mp=typeof mn==="string"?JSON.parse(mn):mn;if(mp&&mp.opponent_name){if(mp.opponent_id&&(!mp.opponent_ranking||!mp.opponent_country)){var mod=await fetchOpponentDetails(mp.opponent_id,mp.opponent_name,apiKey,log);if(mod){mp=enrichMatch(mp,mod);await kv.set("fn:nextMatch",JSON.stringify(mp),{ex:86400*7});totalRequests++;}}log.push("nextMatch: manual ("+mp.opponent_name+")");nextMatch=mp;}else{log.push("nextMatch: none");}}else{log.push("nextMatch: none");}
    }
    await fetchOdds(nextMatch,apiKey,log);
    var seasonData=await fetchSeasonStats(apiKey,log);if(seasonData)await kv.set("fn:season",JSON.stringify(seasonData),{ex:86400});
    await fetchBiography(log);
    if(nextMatch&&nextMatch.tournament_name)await fetchTournamentFacts(nextMatch.tournament_name,log);
    if(nextMatch&&nextMatch.opponent_name)await fetchOpponentProfile(nextMatch.opponent_name,nextMatch.opponent_id,log);
    await kv.set("fn:cronLastRun",now.toISOString());
    // Push notifications
    try{
      var pushSecret=process.env.PUSH_SECRET,baseUrl="https://fonsecanews.com.br",notifs=[];
      if(ranking&&ranking.ranking){var pr2=await kv.get("fn:prevRanking");var prn=pr2?parseInt(pr2):null;if(prn&&prn!==ranking.ranking){var dir=ranking.ranking<prn?"subiu":"caiu";var arr=ranking.ranking<prn?"📈":"📉";notifs.push({title:arr+" Ranking ATP: #"+ranking.ranking,body:"João Fonseca "+dir+" de #"+prn+" para #"+ranking.ranking});}await kv.set("fn:prevRanking",String(ranking.ranking));}
      if(lastMatch&&lastMatch.result&&lastMatch.event_id){var plm=await kv.get("fn:prevLastMatchId");if(plm===null){await kv.set("fn:prevLastMatchId",String(lastMatch.event_id));}else if(plm!==String(lastMatch.event_id)){var iw=lastMatch.result==="V";notifs.push({title:iw?"🏆 Vitória! "+lastMatch.score:"Derrota: "+lastMatch.score,body:(iw?"João Fonseca venceu ":"João Fonseca perdeu para ")+lastMatch.opponent_name+" no "+lastMatch.tournament_name});await kv.set("fn:prevLastMatchId",String(lastMatch.event_id));}}
      if(nextMatch&&nextMatch.opponent_name){var po=await kv.get("fn:prevOpponent");if(po===null){await kv.set("fn:prevOpponent",nextMatch.opponent_name);}else if(po!==nextMatch.opponent_name){var md2=nextMatch.date?new Date(nextMatch.date):null;var ds=md2?md2.toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long",timeZone:"America/Sao_Paulo"}):"";var ts=md2?md2.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit",timeZone:"America/Sao_Paulo"}):"";notifs.push({title:"🎾 Próximo adversário: "+nextMatch.opponent_name,body:(nextMatch.tournament_name||"ATP")+(nextMatch.opponent_ranking?" · #"+nextMatch.opponent_ranking+" do mundo":"")+(ds?" · "+ds:"")+(ts?" às "+ts:"")});await kv.set("fn:prevOpponent",nextMatch.opponent_name);}}
      if(nextMatch&&nextMatch.date){var mt=new Date(nextMatch.date).getTime(),nt=Date.now(),dm3=(mt-nt)/60000,pk="fn:pushSent30:"+nextMatch.date;var as=await kv.get(pk);if(dm3>0&&dm3<=30&&!as){notifs.push({title:"⏰ João Fonseca entra em quadra em breve!",body:"Jogo contra "+(nextMatch.opponent_name||"adversário")+" começa em "+Math.round(dm3)+" min · ESPN 2 e Disney+"});await kv.set(pk,"1",{ex:86400});}}
      for(var ni=0;ni<notifs.length;ni++){try{await fetch(baseUrl+"/api/push-send",{method:"POST",headers:{"Content-Type":"application/json","x-push-secret":pushSecret},body:JSON.stringify({title:notifs[ni].title,body:notifs[ni].body,url:baseUrl})});log.push("push: '"+notifs[ni].title+"'");}catch(pe){log.push("push: erro "+pe.message);}}
      if(notifs.length===0)log.push("push: sem mudanças");
    }catch(pushErr){log.push("push: erro "+pushErr.message);}
    console.log("[cron-v9] Done. Requests: "+totalRequests+". "+log.join(" | "));
    return res.status(200).json({ok:true,requests:totalRequests,log,timestamp:now.toISOString()});
  }catch(error){console.error("[cron-v9] Error:",error);return res.status(500).json({ok:false,error:error.message});}
}
