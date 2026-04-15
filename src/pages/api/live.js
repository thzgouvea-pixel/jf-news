// ===== FONSECA NEWS — LIVE v2 =====
// GOLDEN RULE: never overwrite good KV data with empty data

import { kv } from "@vercel/kv";
import {
  FONSECA_TEAM_ID, sofaFetch, isFonseca, isSingles, isFinished, isLive as isMatchLive,
  extractMatch, parseMatchStats, enrichMatch, lookupTournament, lookupBroadcast,
  translateRound, stripAccents, NEXT_ROUND, BROADCAST_MAP, log as _log,
} from "../../lib/sofascore.js";

function log(msg) { _log("live", msg); }

function findFonseca(data) {
  var matches = [];
  if (Array.isArray(data)) matches = data;
  else if (data && data.events) matches = data.events;
  else if (data) { for (var k in data) { if (Array.isArray(data[k])) { matches = data[k]; break; } } }
  for (var i = 0; i < matches.length; i++) {
    if (isFonseca(matches[i])) return matches[i];
  }
  return null;
}

// GOLDEN RULE: merge new data with existing KV, never lose fields
async function protectKV(key, newData) {
  if (!newData) return newData;
  try {
    var raw = await kv.get(key);
    if (!raw) return newData;
    var old = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!old || typeof old !== "object") return newData;
    for (var f in old) {
      if (old[f] !== null && old[f] !== undefined && old[f] !== "" && old[f] !== 0) {
        if (newData[f] === null || newData[f] === undefined || newData[f] === "" || newData[f] === 0) {
          newData[f] = old[f];
        }
      }
    }
  } catch (e) { }
  return newData;
}

export default async function handler(req, res) {
  try {
    var cached = await kv.get("fn:live");
    if (cached) {
      var data = typeof cached === "string" ? JSON.parse(cached) : cached;
      var cacheAge = data.checkedAt ? Date.now() - new Date(data.checkedAt).getTime() : Infinity;
      var maxAge = data.live ? 15000 : 90000;
      if (cacheAge < maxAge) {
        var smaxage = data.live ? 10 : (data.matchFound ? 120 : 300);
        res.setHeader("Cache-Control", "public, s-maxage=" + smaxage + ", stale-while-revalidate=" + (smaxage * 2));
        return res.status(200).json(data);
      }
    }

    var now = new Date();
    var fonsecaMatch = null;

    var liveData = await sofaFetch("/v1/match/live?sport_slug=tennis");
    if (liveData) {
      fonsecaMatch = findFonseca(liveData);
      if (fonsecaMatch) log("Found via match/live: " + fonsecaMatch.id);
    }

    if (!fonsecaMatch) {
      var today = now.toISOString().split("T")[0];
      var todayData = await sofaFetch("/v1/match/list?sport_slug=tennis&date=" + today);
      if (todayData) fonsecaMatch = findFonseca(todayData);
      if (!fonsecaMatch) {
        var yesterday = new Date(now.getTime() - 86400000).toISOString().split("T")[0];
        var yData = await sofaFetch("/v1/match/list?sport_slug=tennis&date=" + yesterday);
        if (yData) fonsecaMatch = findFonseca(yData);
      }
    }

    if (!fonsecaMatch) {
      var result = { live: false, checkedAt: now.toISOString() };
      await kv.set("fn:live", JSON.stringify(result), { ex: 300 });
      res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
      return res.status(200).json(result);
    }

    var status = fonsecaMatch.status || {};
    var live = isMatchLive(fonsecaMatch);
    var finished = isFinished(fonsecaMatch);

    log("match " + fonsecaMatch.id + " | status=" + (status.type || "?") + " | live=" + live + " | finished=" + finished);

    if (!live) {
      if (finished && fonsecaMatch.id) {
        await handleMatchFinished(fonsecaMatch, now);
      }
      var result2 = {
        live: false, matchFound: true, matchId: fonsecaMatch.id,
        status: finished ? "finished" : (status.type || "notstarted"),
        checkedAt: now.toISOString(),
      };
      await kv.set("fn:live", JSON.stringify(result2), { ex: 120 });
      res.setHeader("Cache-Control", "public, s-maxage=120, stale-while-revalidate=240");
      return res.status(200).json(result2);
    }

    // ── MATCH IS LIVE ──
    var home = fonsecaMatch.homeTeam || {};
    var away = fonsecaMatch.awayTeam || {};
    var isFH = (home.slug || home.name || "").toLowerCase().includes("fonseca");
    var opponent = isFH ? away : home;
    var fScore = isFH ? (fonsecaMatch.homeScore || {}) : (fonsecaMatch.awayScore || {});
    var oScore = isFH ? (fonsecaMatch.awayScore || {}) : (fonsecaMatch.homeScore || {});

    var fSets = [], oSets = [];
    for (var i = 1; i <= 5; i++) {
      var k = "period" + i;
      if (fScore[k] !== undefined && oScore[k] !== undefined) { fSets.push(fScore[k]); oSets.push(oScore[k]); }
    }

    var currentGame = {};
    if (fScore.point !== undefined) currentGame.fonseca = fScore.point;
    if (oScore.point !== undefined) currentGame.opponent = oScore.point;

    var fSetsWon = 0, oSetsWon = 0;
    for (var j = 0; j < fSets.length - 1; j++) {
      if (fSets[j] > oSets[j]) fSetsWon++; else oSetsWon++;
    }

    var tournament = fonsecaMatch.tournament || {};
    var roundInfo = fonsecaMatch.roundInfo || {};
    var liveTournName = tournament.name || (tournament.uniqueTournament && tournament.uniqueTournament.name) || "";
    var liveMapped = lookupTournament(liveTournName);
    var liveGt = (fonsecaMatch.groundType || tournament.groundType || "").toLowerCase();
    var liveSurface = liveMapped ? liveMapped.surface : (liveGt === "clay" ? "Clay" : (liveGt === "grass" ? "Grass" : "Hard"));
    var liveSurfaceLabel = liveSurface === "Clay" ? "Saibro" : (liveSurface === "Grass" ? "Grama" : "Duro");

    var venue = fonsecaMatch.courtName || null;
    if (!venue && fonsecaMatch.venue) venue = typeof fonsecaMatch.venue === "string" ? fonsecaMatch.venue : (fonsecaMatch.venue.name || null);

    var serving = "";
    if (fonsecaMatch.servingTeam) {
      serving = (fonsecaMatch.servingTeam === "homeTeam" && isFH) || (fonsecaMatch.servingTeam === "awayTeam" && !isFH) ? "fonseca" : "opponent";
    }

    var bc = lookupBroadcast(liveMapped ? liveMapped.name : liveTournName) || "";

    var liveResult = {
      live: true, matchId: fonsecaMatch.id,
      status: status.description || "Em andamento",
      opponent: { name: opponent.shortName || opponent.name || "Oponente", country: opponent.country ? opponent.country.name : "" },
      score: { fonseca_sets: fSets, opponent_sets: oSets, sets_won: { fonseca: fSetsWon, opponent: oSetsWon }, current_game: currentGame, serving: serving },
      tournament: liveMapped ? liveMapped.name : liveTournName,
      tournament_category: liveMapped ? liveMapped.cat : "",
      surface: liveSurfaceLabel,
      round: translateRound(roundInfo.name) || "",
      court: venue, broadcast: bc, checkedAt: now.toISOString(),
    };

    try {
      var statsData = await sofaFetch("/v1/match/statistics?match_id=" + fonsecaMatch.id);
      var stats = parseMatchStats(statsData, isFH);
      if (stats) liveResult.stats = { fonseca: stats.fonseca, opponent: stats.opponent };
    } catch (e) { }

    await kv.set("fn:live", JSON.stringify(liveResult), { ex: 30 });
    res.setHeader("Cache-Control", "public, s-maxage=10, stale-while-revalidate=20");
    return res.status(200).json(liveResult);

  } catch (e) {
    log("error: " + e.message);
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
    return res.status(200).json({ live: false, error: e.message, checkedAt: new Date().toISOString() });
  }
}

// ===== HANDLE MATCH FINISHED =====
async function handleMatchFinished(match, now) {
  try {
    var prevId = await kv.get("fn:lastStatsEventId");
    if (prevId === String(match.id)) return;

    log("Match finished! Auto-updating...");

    var lm = extractMatch(match);
    lm.finished = true;
    enrichMatch(lm);

    // PROTECT: merge with existing KV data before saving
    lm = await protectKV("fn:lastMatch", lm);

    await Promise.all([
      kv.set("fn:lastMatch", JSON.stringify(lm), { ex: 604800 }),
      kv.set("fn:lastStatsEventId", String(match.id), { ex: 604800 }),
      kv.del("fn:nextMatch"),
      kv.del("fn:winProb"),
    ]);

    try {
      var statsData = await sofaFetch("/v1/match/statistics?match_id=" + match.id);
      var ms = parseMatchStats(statsData, lm.isFonsecaHome, {
        opponent_name: lm.opponent_name, opponent_country: lm.opponent_country,
        tournament: lm.tournament_name, result: lm.result, score: lm.score, date: lm.date,
      });
      if (ms) await kv.set("fn:matchStats", JSON.stringify(ms), { ex: 604800 });
    } catch (e) { log("stats error: " + e.message); }

    try {
      var exForm = await kv.get("fn:recentForm");
      var formArr = exForm ? (typeof exForm === "string" ? JSON.parse(exForm) : exForm) : [];
      if (!Array.isArray(formArr)) formArr = [];
      var newEntry = {
        result: lm.result, score: lm.score, opponent_name: lm.opponent_name,
        opponent_ranking: lm.opponent_ranking || null, tournament: lm.tournament_name,
        round: lm.round || "", date: lm.date,
      };
      var exists = formArr.some(function (f) { return f.opponent_name === newEntry.opponent_name && f.score === newEntry.score; });
      if (!exists) {
        formArr.unshift(newEntry);
        formArr = formArr.slice(0, 10);
        await kv.set("fn:recentForm", JSON.stringify(formArr), { ex: 604800 });
      }
    } catch (e) { log("recentForm error: " + e.message); }

    log("lastMatch saved: " + lm.result + " " + lm.score + " vs " + lm.opponent_name);
    await scanNextMatch(lm, now);

  } catch (e) { log("handleMatchFinished error: " + e.message); }
}

// ===== SCAN FOR NEXT MATCH =====
async function scanNextMatch(lastMatch, now) {
  try {
    // PROTECT: don't overwrite if KV already has good data
    try {
      var existingNm = await kv.get("fn:nextMatch");
      if (existingNm) {
        var exNm = typeof existingNm === "string" ? JSON.parse(existingNm) : existingNm;
        if (exNm && exNm.opponent_name && exNm.opponent_ranking) {
          log("nextMatch already exists with good data, skipping overwrite");
          return;
        }
      }
    } catch (e) { }

    for (var d = 0; d <= 3; d++) {
      var ds = new Date(now.getTime() + d * 86400000).toISOString().split("T")[0];
      var dayData = await sofaFetch("/v1/match/list?sport_slug=tennis&date=" + ds);
      if (!dayData) continue;
      var ev = dayData.events || (Array.isArray(dayData) ? dayData : []);
      if (!Array.isArray(ev)) { for (var k in dayData) { if (Array.isArray(dayData[k])) { ev = dayData[k]; break; } } }
      for (var i = 0; i < ev.length; i++) {
        var m = ev[i];
        if (!isFonseca(m) || !isSingles(m) || isFinished(m)) continue;
        var mOpp = (m.awayTeam && (m.awayTeam.slug || m.awayTeam.name || "")).toLowerCase().includes("fonseca")
          ? (m.homeTeam && (m.homeTeam.shortName || m.homeTeam.name || ""))
          : (m.awayTeam && (m.awayTeam.shortName || m.awayTeam.name || ""));
        if (lastMatch && lastMatch.opponent_name) {
          var finLast = stripAccents(lastMatch.opponent_name.split(" ").pop().toLowerCase());
          var mLast = stripAccents((mOpp || "").split(" ").pop().toLowerCase());
          if (mLast === finLast) continue;
        }
        var nm2 = extractMatch(m);
        enrichMatch(nm2);
        nm2 = await protectKV("fn:nextMatch", nm2);
        await kv.set("fn:nextMatch", JSON.stringify(nm2), { ex: 604800 });
        log("Next match: " + nm2.opponent_name + " @ " + nm2.tournament_name);
        return;
      }
    }

    if (lastMatch && lastMatch.result === "V") {
      var nextRound = NEXT_ROUND[lastMatch.round] || "";
      var placeholder = {
        opponent_name: "A definir", opponent_ranking: null, opponent_country: "",
        tournament_name: lastMatch.tournament_name,
        tournament_category: lastMatch.tournament_category || "",
        surface: lastMatch.surface || "", round: nextRound,
        date: null, startTimestamp: null, court: "", finished: false,
        broadcast: lookupBroadcast(lastMatch.tournament_name) || "",
      };
      await kv.set("fn:nextMatch", JSON.stringify(placeholder), { ex: 172800 });
      log("Placeholder: " + placeholder.tournament_name + " " + nextRound);
    } else {
      log("No next match (João lost or no upcoming found)");
    }

  } catch (e) { log("scanNextMatch error: " + e.message); }
}
