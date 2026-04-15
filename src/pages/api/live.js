// pages/api/live.js — Live match detection via SofaScore (fix: UTC date + status)
import { kv } from "@vercel/kv";

var RAPIDAPI_HOST = "sofascore6.p.rapidapi.com";

// ===== MAPS (same as cron-update.js) =====
var TOURNAMENT_MAP = {
  "munich": { name: "BMW Open", cat: "ATP 500", surface: "Clay" },
  "bmw open": { name: "BMW Open", cat: "ATP 500", surface: "Clay" },
  "monte carlo": { name: "Monte Carlo Masters", cat: "Masters 1000", surface: "Clay" },
  "indian wells": { name: "Indian Wells Masters", cat: "Masters 1000", surface: "Hard" },
  "miami": { name: "Miami Open", cat: "Masters 1000", surface: "Hard" },
  "madrid": { name: "Madrid Open", cat: "Masters 1000", surface: "Clay" },
  "roma": { name: "Italian Open", cat: "Masters 1000", surface: "Clay" },
  "roland garros": { name: "Roland Garros", cat: "Grand Slam", surface: "Clay" },
  "french open": { name: "Roland Garros", cat: "Grand Slam", surface: "Clay" },
  "wimbledon": { name: "Wimbledon", cat: "Grand Slam", surface: "Grass" },
  "australian open": { name: "Australian Open", cat: "Grand Slam", surface: "Hard" },
  "us open": { name: "US Open", cat: "Grand Slam", surface: "Hard" },
  "barcelona": { name: "Barcelona Open", cat: "ATP 500", surface: "Clay" },
  "rio de janeiro": { name: "Rio Open", cat: "ATP 500", surface: "Clay" },
  "rio open": { name: "Rio Open", cat: "ATP 500", surface: "Clay" },
  "buenos aires": { name: "Argentina Open", cat: "ATP 250", surface: "Clay" },
  "basel": { name: "Swiss Indoors Basel", cat: "ATP 500", surface: "Hard" },
  "hamburg": { name: "Hamburg Open", cat: "ATP 500", surface: "Clay" },
  "halle": { name: "Halle Open", cat: "ATP 500", surface: "Grass" },
  "queen": { name: "Queen's Club", cat: "ATP 500", surface: "Grass" },
  "vienna": { name: "Vienna Open", cat: "ATP 500", surface: "Hard" },
  "rotterdam": { name: "Rotterdam Open", cat: "ATP 500", surface: "Hard" },
  "canadian": { name: "Canadian Open", cat: "Masters 1000", surface: "Hard" },
  "montreal": { name: "Canadian Open", cat: "Masters 1000", surface: "Hard" },
  "toronto": { name: "Canadian Open", cat: "Masters 1000", surface: "Hard" },
  "cincinnati": { name: "Cincinnati Masters", cat: "Masters 1000", surface: "Hard" },
  "shanghai": { name: "Shanghai Masters", cat: "Masters 1000", surface: "Hard" },
  "paris": { name: "Paris Masters", cat: "Masters 1000", surface: "Hard" },
};
var BROADCAST_MAP = {
  "BMW Open": "ESPN 2 / Disney+",
  "Monte Carlo Masters": "ESPN",
  "Indian Wells Masters": "ESPN",
  "Miami Open": "ESPN",
  "Madrid Open": "ESPN",
  "Italian Open": "ESPN",
  "Roland Garros": "Globoplay",
  "Wimbledon": "ESPN",
  "Australian Open": "ESPN",
  "US Open": "ESPN",
  "Barcelona Open": "ESPN 4",
  "Rio Open": "ESPN",
  "Argentina Open": "ESPN 4",
  "ATP Finals": "ESPN",
  "Canadian Open": "ESPN",
  "Cincinnati Masters": "ESPN",
  "Shanghai Masters": "ESPN",
  "Paris Masters": "ESPN",
};
var ROUND_MAP = {
  "round 1": "1ª rodada", "round of 128": "1ª rodada", "round of 64": "2ª rodada",
  "round 2": "2ª rodada", "round of 32": "3ª rodada", "round 3": "3ª rodada",
  "round of 16": "Oitavas de final", "round 4": "Oitavas de final",
  "quarterfinal": "Quartas de final", "quarterfinals": "Quartas de final",
  "semifinal": "Semifinal", "semifinals": "Semifinal",
  "final": "Final", "1st round": "1ª rodada", "2nd round": "2ª rodada",
  "3rd round": "3ª rodada", "4th round": "Oitavas de final",
};
function lookupTournament(rawName) {
  if (!rawName) return null;
  var low = rawName.toLowerCase();
  if (TOURNAMENT_MAP[low]) return TOURNAMENT_MAP[low];
  for (var key in TOURNAMENT_MAP) { if (low.includes(key)) return TOURNAMENT_MAP[key]; }
  return null;
}
function translateRound(rawRound) {
  if (!rawRound) return "";
  var low = rawRound.toLowerCase().trim();
  if (ROUND_MAP[low]) return ROUND_MAP[low];
  for (var k in ROUND_MAP) { if (low.includes(k)) return ROUND_MAP[k]; }
  return rawRound;
}

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
            // Smart manual lock: only block if the finished match is the SAME opponent as the locked match
            var manualLock = await kv.get("fn:lastMatchManualLock");
            var blockUpdate = false;
            if (manualLock) {
              try {
                var lockedLM = await kv.get("fn:lastMatch");
                var lockedData = lockedLM ? (typeof lockedLM === "string" ? JSON.parse(lockedLM) : lockedLM) : null;
                var lockedOpp = lockedData ? (lockedData.opponent_name || "").split(" ").pop().toLowerCase() : "";
                var finishedOpp = (oppF.shortName || oppF.name || "").split(" ").pop().toLowerCase();
                if (lockedOpp && finishedOpp && lockedOpp === finishedOpp) {
                  blockUpdate = true;
                  console.log("[live] Manual lock active and same opponent (" + lockedOpp + "), skipping auto-update");
                } else {
                  console.log("[live] Manual lock active but DIFFERENT opponent (locked=" + lockedOpp + " finished=" + finishedOpp + "), clearing lock and updating");
                  await kv.del("fn:lastMatchManualLock");
                }
              } catch(lockErr) {
                console.log("[live] Lock check error: " + lockErr.message);
              }
            }
            // Also check nextMatch manual lock — clear it if the finished match matches the locked nextMatch opponent
            try {
              var nmLock = await kv.get("fn:nextMatchManualLock");
              if (nmLock) {
                var lockedNM = await kv.get("fn:nextMatch");
                var lockedNMData = lockedNM ? (typeof lockedNM === "string" ? JSON.parse(lockedNM) : lockedNM) : null;
                var lockedNMOpp = lockedNMData ? (lockedNMData.opponent_name || "").split(" ").pop().toLowerCase() : "";
                var finOpp = (oppF.shortName || oppF.name || "").split(" ").pop().toLowerCase();
                if (lockedNMOpp && finOpp && lockedNMOpp === finOpp) {
                  console.log("[live] Clearing nextMatch manual lock (match vs " + finOpp + " finished)");
                  await kv.del("fn:nextMatchManualLock");
                }
              }
            } catch(nmLockErr) {}
            if (!blockUpdate) {
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
              opponent_ranking: oppF.ranking || null,
              opponent_country: oppF.country ? oppF.country.name : "",
              tournament_name: tournF.name || (tournF.uniqueTournament && tournF.uniqueTournament.name) || "",
              tournament_category: "",
              surface: surfF,
              round: translateRound(roundF.name) || "",
              date: fonsecaMatch.startTimestamp ? new Date(fonsecaMatch.startTimestamp * 1000).toISOString() : now.toISOString(),
              court: venueF,
              finished: true,
              isFonsecaHome: isFH,
            };
            // Apply TOURNAMENT_MAP for clean names
            var rawTName = lastMatchData.tournament_name;
            var utName = (tournF.uniqueTournament && tournF.uniqueTournament.name) || "";
            var mapped = lookupTournament(rawTName) || lookupTournament(utName);
            if (mapped) {
              lastMatchData.tournament_name = mapped.name;
              lastMatchData.tournament_category = mapped.cat;
              lastMatchData.surface = mapped.surface;
            } else {
              // Fallback category detection
              var tLow = lastMatchData.tournament_name.toLowerCase();
              if (["australian open","roland garros","french open","wimbledon","us open"].some(function(g){return tLow.includes(g);})) lastMatchData.tournament_category = "Grand Slam";
              else if (tLow.includes("1000") || ["monte carlo","madrid","roma","indian wells","miami","canadian","cincinnati","shanghai","paris"].some(function(m){return tLow.includes(m);})) lastMatchData.tournament_category = "Masters 1000";
              else if (tLow.includes("500")) lastMatchData.tournament_category = "ATP 500";
              else if (tLow.includes("250")) lastMatchData.tournament_category = "ATP 250";
            }
            // Apply BROADCAST_MAP
            var bc = BROADCAST_MAP[lastMatchData.tournament_name];
            if (bc) lastMatchData.broadcast = bc;

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
              var newEntry = { result: lastMatchData.result, score: lastMatchData.score, opponent_name: lastMatchData.opponent_name, opponent_ranking: lastMatchData.opponent_ranking || null, tournament: lastMatchData.tournament_name, round: lastMatchData.round || "", date: lastMatchData.date };
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

            // CRITICAL: Immediately scan for NEXT upcoming match
            try {
              var scanDates = [today];
              for (var di = 1; di <= 3; di++) {
                var futureDate = new Date(now.getTime() + di * 86400000);
                scanDates.push(futureDate.toISOString().split("T")[0]);
              }
              var nextFound = null;
              for (var sdi = 0; sdi < scanDates.length && !nextFound; sdi++) {
                var scanData = await sofaFetch("/v1/match/list?sport_slug=tennis&date=" + scanDates[sdi], apiKey);
                if (scanData) {
                  var allMatches = [];
                  if (Array.isArray(scanData)) allMatches = scanData;
                  else if (scanData.events) allMatches = scanData.events;
                  else { var sKeys = Object.keys(scanData); for (var ski = 0; ski < sKeys.length; ski++) { if (Array.isArray(scanData[sKeys[ski]])) { allMatches = scanData[sKeys[ski]]; break; } } }

                  for (var mi = 0; mi < allMatches.length; mi++) {
                    var mm = allMatches[mi];
                    var hSlug = (mm.homeTeam && (mm.homeTeam.slug || mm.homeTeam.name || "")).toLowerCase();
                    var aSlug = (mm.awayTeam && (mm.awayTeam.slug || mm.awayTeam.name || "")).toLowerCase();
                    var mSlug = (mm.slug || "").toLowerCase();
                    var isFonseca = mSlug.includes("fonseca") || hSlug.includes("fonseca") || aSlug.includes("fonseca");
                    if (!isFonseca) continue;
                    var mStatus = mm.status || {};
                    var mFinished = mStatus.type === "finished" || mStatus.isFinished;
                    if (mFinished) continue;
                    // Found upcoming Fonseca match
                    var nmHome = mm.homeTeam || {};
                    var nmAway = mm.awayTeam || {};
                    var nmIsFH = (nmHome.slug || nmHome.name || "").toLowerCase().includes("fonseca");
                    var nmOpp = nmIsFH ? nmAway : nmHome;
                    var nmTourn = mm.tournament || {};
                    var nmRound = mm.roundInfo || {};
                    var nmGt = (mm.groundType || nmTourn.groundType || "").toLowerCase();
                    var nmSurf = nmGt === "clay" ? "Clay" : (nmGt === "grass" ? "Grass" : "Hard");
                    var nmRaw = nmTourn.name || (nmTourn.uniqueTournament && nmTourn.uniqueTournament.name) || "";
                    var nmMapped = lookupTournament(nmRaw) || lookupTournament((nmTourn.uniqueTournament && nmTourn.uniqueTournament.name) || "");
                    nextFound = {
                      id: mm.id,
                      opponent_name: nmOpp.shortName || nmOpp.name || "A definir",
                      opponent_id: nmOpp.id || null,
                      opponent_ranking: nmOpp.ranking || null,
                      opponent_country: nmOpp.country ? nmOpp.country.name : "",
                      tournament_name: nmMapped ? nmMapped.name : nmRaw,
                      tournament_category: nmMapped ? nmMapped.cat : "",
                      surface: nmMapped ? nmMapped.surface : nmSurf,
                      round: translateRound(nmRound.name) || "",
                      date: mm.startTimestamp ? new Date(mm.startTimestamp * 1000).toISOString() : null,
                      startTimestamp: mm.startTimestamp || null,
                      court: mm.courtName || "",
                      isFonsecaHome: nmIsFH,
                      finished: false,
                    };
                    var nmBC = BROADCAST_MAP[nextFound.tournament_name];
                    if (nmBC) nextFound.broadcast = nmBC;
                    break;
                  }
                }
              }
              if (nextFound) {
                await kv.set("fn:nextMatch", JSON.stringify(nextFound), { ex: 604800 });
                console.log("[live] Next match found: " + nextFound.opponent_name + " @ " + nextFound.tournament_name + " " + (nextFound.round || ""));
              } else if (lastMatchData.result === "V") {
                // João WON but no next match found yet — create placeholder for next round
                var NEXT_ROUND = {
                  "1ª rodada": "Oitavas de final", "2ª rodada": "Oitavas de final", "3ª rodada": "Oitavas de final",
                  "16avos de final": "Oitavas de final", "Oitavas de final": "Quartas de final",
                  "Quartas de final": "Semifinal", "Semifinal": "Final",
                };
                var placeholderRound = NEXT_ROUND[lastMatchData.round] || "";
                var placeholder = {
                  opponent_name: "A definir",
                  opponent_ranking: null,
                  opponent_country: "",
                  tournament_name: lastMatchData.tournament_name,
                  tournament_category: lastMatchData.tournament_category || "",
                  surface: lastMatchData.surface || "",
                  round: placeholderRound,
                  date: null,
                  court: "",
                  finished: false,
                };
                var phBC = BROADCAST_MAP[placeholder.tournament_name];
                if (phBC) placeholder.broadcast = phBC;
                await kv.set("fn:nextMatch", JSON.stringify(placeholder), { ex: 172800 });
                console.log("[live] Placeholder nextMatch: " + placeholder.tournament_name + " " + placeholderRound + " (opponent TBD)");
              } else {
                console.log("[live] No upcoming match found (João lost, no next round)");
              }
            } catch(nextErr) { console.log("[live] Next match scan error: " + nextErr.message); }
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

    // Apply maps for clean data
    var liveTournName = tournament.name || (tournament.uniqueTournament && tournament.uniqueTournament.name) || "";
    var liveMapped = lookupTournament(liveTournName);
    var liveGt = (fonsecaMatch.groundType || tournament.groundType || "").toLowerCase();
    var liveSurface = liveMapped ? liveMapped.surface : (liveGt === "clay" ? "Clay" : (liveGt === "grass" ? "Grass" : "Hard"));
    var liveSurfaceLabel = liveSurface === "Clay" ? "Saibro" : (liveSurface === "Grass" ? "Grama" : "Duro");

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
      tournament: liveMapped ? liveMapped.name : liveTournName,
      tournament_category: liveMapped ? liveMapped.cat : "",
      surface: liveSurfaceLabel,
      round: translateRound(roundInfo.name) || "",
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
