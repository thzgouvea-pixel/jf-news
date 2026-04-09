import { kv } from "@vercel/kv";
import { detectUpdateMode, getMatchContext, getRefreshPolicy } from "../updatePolicy";

const RAPIDAPI_HOST = "sofascore6.p.rapidapi.com";
const FONSECA_SLUG = "fonseca";

export async function sofaFetch(path, apiKey, log = []) {
  const url = `https://${RAPIDAPI_HOST}/api/sofascore${path}`;
  try {
    const res = await fetch(url, {
      headers: {
        "x-rapidapi-host": RAPIDAPI_HOST,
        "x-rapidapi-key": apiKey,
      },
    });
    if (!res.ok) {
      log.push(`sofaFetch: ${path} -> HTTP ${res.status}`);
      return null;
    }
    const text = await res.text();
    if (!text || text.length < 2) return null;
    return JSON.parse(text);
  } catch (error) {
    log.push(`sofaFetch: ${path} -> ${error.message}`);
    return null;
  }
}

export async function readJson(key) {
  try {
    const value = await kv.get(key);
    if (!value) return null;
    return typeof value === "string" ? JSON.parse(value) : value;
  } catch {
    return null;
  }
}

export async function writeJson(key, value, ex) {
  await kv.set(key, JSON.stringify(value), ex ? { ex } : undefined);
}

export async function getCurrentMode() {
  const [nextMatch, lastMatch, liveMatch] = await Promise.all([
    readJson("fn:nextMatch"),
    readJson("fn:lastMatch"),
    readJson("fn:liveMatch"),
  ]);
  const now = new Date();
  const mode = detectUpdateMode({ nextMatch, liveMatch, lastMatch }, now);
  const context = getMatchContext(nextMatch, liveMatch, now);
  const policy = getRefreshPolicy(mode, context);
  return { mode, context, policy, nextMatch, lastMatch, liveMatch, now };
}

export async function shouldRunKey(key, ttlSeconds) {
  if (!ttlSeconds) return true;
  const stamp = await kv.get(key);
  if (!stamp) return true;
  const previousTs = new Date(String(stamp)).getTime();
  if (Number.isNaN(previousTs)) return true;
  return Date.now() - previousTs >= ttlSeconds * 1000;
}

export async function touchKey(key, value = new Date().toISOString()) {
  await kv.set(key, value);
}

export async function findFonsecaMatches(date, apiKey, log = []) {
  const dateStr = date.toISOString().split("T")[0];
  const data = await sofaFetch(`/v1/match/list?sport_slug=tennis&date=${dateStr}`, apiKey, log);
  if (!data) return [];

  let matches = [];
  if (Array.isArray(data)) matches = data;
  else if (data.events && Array.isArray(data.events)) matches = data.events;
  else {
    for (const key of Object.keys(data)) {
      if (Array.isArray(data[key])) {
        matches = data[key];
        break;
      }
    }
  }

  return matches.filter((m) => {
    const slug = (m.slug || "").toLowerCase();
    const homeName = (m.homeTeam && (m.homeTeam.slug || m.homeTeam.name || "")).toLowerCase();
    const awayName = (m.awayTeam && (m.awayTeam.slug || m.awayTeam.name || "")).toLowerCase();
    return slug.includes(FONSECA_SLUG) || homeName.includes(FONSECA_SLUG) || awayName.includes(FONSECA_SLUG);
  });
}

export async function findLastMatch(apiKey, log = []) {
  const today = new Date();
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const matches = await findFonsecaMatches(d, apiKey, log);
    if (!matches.length) continue;

    const finished = matches.filter((m) => m.status && (m.status.type === "finished" || m.status.isFinished));
    if (!finished.length) continue;

    finished.sort((a, b) => {
      const ta = a.startTimestamp || a.timestamp || 0;
      const tb = b.startTimestamp || b.timestamp || 0;
      return tb - ta;
    });

    return { match: finished[0], daysAgo: i, requestsUsed: i + 1 };
  }

  return { match: null, daysAgo: -1, requestsUsed: 7 };
}

export async function findNextMatch(apiKey, log = []) {
  const today = new Date();
  for (let i = 0; i <= 7; i += 1) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const matches = await findFonsecaMatches(d, apiKey, log);
    if (!matches.length) continue;

    const upcoming = matches.filter((m) => m.status && (m.status.type === "notstarted" || !m.status.isFinished));
    if (upcoming.length) return { match: upcoming[0], requestsUsed: i + 1 };
  }

  return { match: null, requestsUsed: 7 };
}

export function parseMatch(m, isNext) {
  if (!m) return null;
  const homeTeam = m.homeTeam || {};
  const awayTeam = m.awayTeam || {};
  const tournament = m.tournament || {};
  const season = m.season || {};
  const roundInfo = m.roundInfo || {};
  const homeScore = m.homeScore || {};
  const awayScore = m.awayScore || {};
  const isFonsecaHome = (homeTeam.slug || "").toLowerCase().includes(FONSECA_SLUG);
  const opponent = isFonsecaHome ? awayTeam : homeTeam;

  let detectedSurface = m.groundType || tournament.groundType || season.groundType || "";
  if (!detectedSurface) {
    const tName = (tournament.name || "").toLowerCase();
    const clay = ["monte carlo", "madrid", "roma", "roland garros", "french open", "buenos aires", "rio open", "barcelona"];
    const grass = ["wimbledon", "halle", "queen", "eastbourne", "mallorca", "stuttgart"];
    if (clay.some((name) => tName.includes(name))) detectedSurface = "Saibro";
    else if (grass.some((name) => tName.includes(name))) detectedSurface = "Grama";
    else if (tName) detectedSurface = "Duro";
  }

  const normalizeSurface = {
    clay: "Saibro",
    grass: "Grama",
    hard: "Duro",
    hardcourt: "Duro",
  };
  detectedSurface = normalizeSurface[String(detectedSurface).toLowerCase()] || detectedSurface;

  let roundName = roundInfo.name || "";
  if (!roundName && m.round !== undefined && m.round !== null) {
    let rVal = m.round;
    if (typeof rVal === "object") rVal = rVal.round || rVal.name || rVal.slug || "";
    if (typeof rVal === "number") {
      const roundNumMap = { 1: "Final", 2: "Semifinal", 4: "Quartas de final", 8: "Oitavas de final", 16: "2ª Rodada", 32: "2ª Rodada", 64: "1ª Rodada", 128: "1ª Rodada" };
      roundName = roundNumMap[rVal] || `Rodada ${rVal}`;
    } else {
      roundName = rVal || "";
    }
  }

  const roundTranslate = {
    "Round of 128": "1ª Rodada",
    "Round of 64": "2ª Rodada",
    "Round of 32": "2ª Rodada",
    "Round of 16": "Oitavas de final",
    Quarterfinals: "Quartas de final",
    Semifinals: "Semifinal",
    Final: "Final",
    Qualification: "Qualificatório",
    "1st round": "1ª Rodada",
    "2nd round": "2ª Rodada",
    "3rd round": "3ª Rodada",
  };

  const courtName = typeof m.venue === "string"
    ? m.venue
    : m.venue?.stadium || m.venue?.name || m.venue?.court || m.courtName || null;

  const result = {
    event_id: m.id,
    tournament_name: tournament.name || "",
    tournament_category: season.name || tournament.name || "",
    surface: detectedSurface,
    city: (tournament.name || "").split(",")[0] || "",
    round: roundTranslate[roundName] || roundName,
    date: m.timestamp ? new Date(m.timestamp * 1000).toISOString() : (m.startTimestamp ? new Date(m.startTimestamp * 1000).toISOString() : null),
    opponent_name: opponent.shortName || opponent.name || "A definir",
    opponent_id: opponent.id || null,
    opponent_ranking: opponent.ranking || null,
    opponent_country: opponent.country ? opponent.country.name : "",
    court: courtName,
    isFonsecaHome,
    updatedAt: new Date().toISOString(),
  };

  if (!isNext) {
    const fScore = isFonsecaHome ? homeScore : awayScore;
    const oScore = isFonsecaHome ? awayScore : homeScore;
    const sets = [];
    for (let i = 1; i <= 5; i += 1) {
      const key = `period${i}`;
      if (fScore[key] !== undefined && oScore[key] !== undefined) sets.push(`${fScore[key]}-${oScore[key]}`);
    }
    let fSW = 0;
    let oSW = 0;
    for (let i = 1; i <= 5; i += 1) {
      const key = `period${i}`;
      if (fScore[key] !== undefined && oScore[key] !== undefined) {
        if (fScore[key] > oScore[key]) fSW += 1;
        else if (oScore[key] > fScore[key]) oSW += 1;
      }
    }
    let wonMatch = fSW > oSW;
    if (fSW === oSW && m.winnerCode) {
      wonMatch = (m.winnerCode === 1 && isFonsecaHome) || (m.winnerCode === 2 && !isFonsecaHome);
    }
    result.result = wonMatch ? "V" : "D";
    result.score = sets.join(" ");
  }

  return result;
}

export async function fetchMatchStats(matchId, apiKey, log = []) {
  if (!matchId) return null;
  const data = await sofaFetch(`/v1/match/statistics?match_id=${matchId}`, apiKey, log);
  if (!data || !Array.isArray(data)) return null;
  const allPeriod = data.find((p) => p.period === "ALL");
  if (!allPeriod || !allPeriod.groups) return null;

  const home = {};
  const away = {};
  allPeriod.groups.forEach((group) => {
    (group.statisticsItems || []).forEach((item) => {
      const key = (item.key || item.name || "").toLowerCase().replace(/\s+/g, "_");
      home[key] = item.homeValue !== undefined ? item.homeValue : (parseInt(item.home, 10) || 0);
      away[key] = item.awayValue !== undefined ? item.awayValue : (parseInt(item.away, 10) || 0);
    });
  });
  return { home, away };
}
