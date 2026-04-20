// ===== FONSECA NEWS — SOFASCORE SHARED MODULE =====
// Single source of truth for all SofaScore data logic.
// Used by: cron-update.js, live.js

export var RAPIDAPI_HOST = "sofascore6.p.rapidapi.com";
export var FONSECA_TEAM_ID = 403869;

// ===== TOURNAMENT MAP =====
export var TOURNAMENT_MAP = {
  "munich": { name: "BMW Open", cat: "ATP 500", surface: "Clay" },
  "bmw open": { name: "BMW Open", cat: "ATP 500", surface: "Clay" },
  "monte carlo": { name: "Monte Carlo Masters", cat: "Masters 1000", surface: "Clay" },
  "indian wells": { name: "Indian Wells Masters", cat: "Masters 1000", surface: "Hard" },
  "miami": { name: "Miami Open", cat: "Masters 1000", surface: "Hard" },
  "madrid": { name: "Madrid Open", cat: "Masters 1000", surface: "Clay" },
  "roma": { name: "Italian Open", cat: "Masters 1000", surface: "Clay" },
  "rome": { name: "Italian Open", cat: "Masters 1000", surface: "Clay" },
  "roland garros": { name: "Roland Garros", cat: "Grand Slam", surface: "Clay" },
  "french open": { name: "Roland Garros", cat: "Grand Slam", surface: "Clay" },
  "wimbledon": { name: "Wimbledon", cat: "Grand Slam", surface: "Grass" },
  "australian open": { name: "Australian Open", cat: "Grand Slam", surface: "Hard" },
  "us open": { name: "US Open", cat: "Grand Slam", surface: "Hard" },
  "barcelona": { name: "Barcelona Open", cat: "ATP 500", surface: "Clay" },
  "hamburg": { name: "Hamburg Open", cat: "ATP 500", surface: "Clay" },
  "halle": { name: "Halle Open", cat: "ATP 500", surface: "Grass" },
  "queens": { name: "Queen's Club", cat: "ATP 500", surface: "Grass" },
  "queen's": { name: "Queen's Club", cat: "ATP 500", surface: "Grass" },
  "basel": { name: "Swiss Indoors Basel", cat: "ATP 500", surface: "Hard" },
  "vienna": { name: "Vienna Open", cat: "ATP 500", surface: "Hard" },
  "rotterdam": { name: "Rotterdam Open", cat: "ATP 500", surface: "Hard" },
  "acapulco": { name: "Acapulco Open", cat: "ATP 500", surface: "Hard" },
  "dubai": { name: "Dubai Championships", cat: "ATP 500", surface: "Hard" },
  "rio open": { name: "Rio Open", cat: "ATP 500", surface: "Clay" },
  "rio de janeiro": { name: "Rio Open", cat: "ATP 500", surface: "Clay" },
  "washington": { name: "Washington Open", cat: "ATP 500", surface: "Hard" },
  "beijing": { name: "China Open", cat: "ATP 500", surface: "Hard" },
  "buenos aires": { name: "Argentina Open", cat: "ATP 250", surface: "Clay" },
  "lyon": { name: "Lyon Open", cat: "ATP 250", surface: "Clay" },
  "estoril": { name: "Estoril Open", cat: "ATP 250", surface: "Clay" },
  "geneva": { name: "Geneva Open", cat: "ATP 250", surface: "Clay" },
  "stuttgart": { name: "Stuttgart Open", cat: "ATP 250", surface: "Grass" },
  "eastbourne": { name: "Eastbourne International", cat: "ATP 250", surface: "Grass" },
  "canadian": { name: "Canadian Open", cat: "Masters 1000", surface: "Hard" },
  "montreal": { name: "Canadian Open", cat: "Masters 1000", surface: "Hard" },
  "toronto": { name: "Canadian Open", cat: "Masters 1000", surface: "Hard" },
  "cincinnati": { name: "Cincinnati Masters", cat: "Masters 1000", surface: "Hard" },
  "shanghai": { name: "Shanghai Masters", cat: "Masters 1000", surface: "Hard" },
  "paris": { name: "Paris Masters", cat: "Masters 1000", surface: "Hard" },
  "atp finals": { name: "ATP Finals", cat: "Finals", surface: "Hard" },
  "nitto": { name: "ATP Finals", cat: "Finals", surface: "Hard" },
};

// ===== BROADCAST MAP (canais brasileiros) =====
export var BROADCAST_MAP = {
  "BMW Open": "ESPN 2 / Disney+",
  "Monte Carlo Masters": "ESPN",
  "Indian Wells Masters": "ESPN",
  "Miami Open": "ESPN",
  "Madrid Open": "ESPN / Disney+",
  "Italian Open": "ESPN",
  "Roland Garros": "Globoplay",
  "Wimbledon": "ESPN",
  "Australian Open": "ESPN",
  "US Open": "ESPN",
  "Barcelona Open": "ESPN 4",
  "Hamburg Open": "ESPN 4",
  "Halle Open": "ESPN 4",
  "Queen's Club": "ESPN 4",
  "Swiss Indoors Basel": "ESPN 4",
  "Vienna Open": "ESPN 4",
  "Rotterdam Open": "ESPN 4",
  "Rio Open": "ESPN",
  "Argentina Open": "ESPN 4",
  "ATP Finals": "ESPN",
  "Canadian Open": "ESPN",
  "Cincinnati Masters": "ESPN",
  "Shanghai Masters": "ESPN",
  "Paris Masters": "ESPN",
};

// ===== ROUND MAP (English → Portuguese) =====
export var ROUND_MAP = {
  "round 1": "1ª rodada",
  "round of 128": "1ª rodada",
  "round of 64": "32avos de final",
  "round 2": "32avos de final",
  "round of 32": "16avos de final",
  "round 3": "16avos de final",
  "round of 16": "Oitavas de final",
  "round 4": "Oitavas de final",
  "quarterfinal": "Quartas de final",
  "quarterfinals": "Quartas de final",
  "quarter-final": "Quartas de final",
  "semifinal": "Semifinal",
  "semifinals": "Semifinal",
  "semi-final": "Semifinal",
  "final": "Final",
  "qualification": "Qualificatório",
  "qualifying": "Qualificatório",
  "q1": "Quali 1ª rodada",
  "q2": "Quali 2ª rodada",
  "q3": "Quali 3ª rodada",
  "1st round": "1ª rodada",
  "2nd round": "32avos de final",
  "3rd round": "16avos de final",
  "4th round": "Oitavas de final",
};

// Next round progression
export var NEXT_ROUND = {
  "1ª rodada": "32avos de final",
  "32avos de final": "16avos de final",
  "16avos de final": "Oitavas de final",
  "Oitavas de final": "Quartas de final",
  "Quartas de final": "Semifinal",
  "Semifinal": "Final",
};

// ATP Calendar 2026 (fallback for placeholder nextMatch)
export var ATP_CALENDAR_2026 = [
  { name: "Australian Open", cat: "Grand Slam", surface: "Hard", city: "Melbourne", country: "Austrália", start: "2026-01-18", end: "2026-02-01" },
  { name: "Buenos Aires", cat: "ATP 250", surface: "Clay", city: "Buenos Aires", country: "Argentina", start: "2026-02-09", end: "2026-02-15" },
  { name: "Rio Open", cat: "ATP 500", surface: "Clay", city: "Rio de Janeiro", country: "Brasil", start: "2026-02-16", end: "2026-02-22" },
  { name: "Indian Wells Masters", cat: "Masters 1000", surface: "Hard", city: "Indian Wells", country: "EUA", start: "2026-03-09", end: "2026-03-22" },
  { name: "Miami Open", cat: "Masters 1000", surface: "Hard", city: "Miami", country: "EUA", start: "2026-03-23", end: "2026-04-05" },
  { name: "Monte Carlo", cat: "Masters 1000", surface: "Clay", city: "Monte Carlo", country: "Mônaco", start: "2026-04-05", end: "2026-04-12" },
  { name: "Barcelona Open", cat: "ATP 500", surface: "Clay", city: "Barcelona", country: "Espanha", start: "2026-04-13", end: "2026-04-19" },
  { name: "BMW Open", cat: "ATP 500", surface: "Clay", city: "Munique", country: "Alemanha", start: "2026-04-13", end: "2026-04-19" },
  { name: "Madrid Open", cat: "Masters 1000", surface: "Clay", city: "Madri", country: "Espanha", start: "2026-04-22", end: "2026-05-03" },
  { name: "Roma Masters", cat: "Masters 1000", surface: "Clay", city: "Roma", country: "Itália", start: "2026-05-06", end: "2026-05-17" },
  { name: "Roland Garros", cat: "Grand Slam", surface: "Clay", city: "Paris", country: "França", start: "2026-05-24", end: "2026-06-07" },
  { name: "Wimbledon", cat: "Grand Slam", surface: "Grass", city: "Londres", country: "Reino Unido", start: "2026-06-29", end: "2026-07-12" },
  { name: "US Open", cat: "Grand Slam", surface: "Hard", city: "Nova York", country: "EUA", start: "2026-08-31", end: "2026-09-13" },
  { name: "ATP Finals", cat: "Finals", surface: "Hard", city: "Turim", country: "Itália", start: "2026-11-15", end: "2026-11-22" },
];

// ===== HELPER FUNCTIONS =====

export function log(prefix, msg) {
  console.log("[" + prefix + "] " + msg);
}

export function stripAccents(s) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function lookupTournament(rawName) {
  if (!rawName) return null;
  var low = rawName.toLowerCase();
  if (TOURNAMENT_MAP[low]) return TOURNAMENT_MAP[low];
  for (var key in TOURNAMENT_MAP) {
    if (low.includes(key)) return TOURNAMENT_MAP[key];
  }
  return null;
}

export function lookupBroadcast(tournamentName) {
  if (!tournamentName) return null;
  if (BROADCAST_MAP[tournamentName]) return BROADCAST_MAP[tournamentName];
  for (var k in BROADCAST_MAP) {
    if (tournamentName.toLowerCase().includes(k.toLowerCase())) return BROADCAST_MAP[k];
  }
  return null;
}

export function translateRound(rawRound) {
  if (!rawRound) return "";
  var low = rawRound.toLowerCase().trim();
  // Match exato primeiro
  if (ROUND_MAP[low]) return ROUND_MAP[low];
  // Se ja esta em portugues (ja foi traduzido antes), retorna as-is pra nao re-traduzir
  // (evita bug: "32avos de final" contem "final" -> retornaria "Final")
  if (/[áéíóúãõçâêôà]/i.test(low) ||
      /\b(rodada|oitavas|quartas|semifinal|final|qualificat|quali)\b/i.test(low) ||
      /\d+avos/i.test(low)) {
    return rawRound;
  }
  // Fallback: includes() apenas se nenhum match exato — pra termos em ingles raros
  for (var k in ROUND_MAP) {
    if (low.includes(k)) return ROUND_MAP[k];
  }
  return rawRound;
}

export function detectCategory(tName) {
  if (!tName) return "";
  var low = tName.toLowerCase();
  if (["australian open", "roland garros", "french open", "wimbledon", "us open"].some(function (g) { return low.includes(g); })) return "Grand Slam";
  if (low.includes("1000") || ["monte carlo", "madrid", "roma", "indian wells", "miami", "canadian", "cincinnati", "shanghai", "paris"].some(function (m) { return low.includes(m); })) return "Masters 1000";
  if (low.includes("500") || ["rio open", "barcelona", "hamburg", "halle", "queens", "queen's", "washington", "beijing", "basel", "vienna", "rotterdam", "acapulco", "dubai", "munich", "bmw open"].some(function (t) { return low.includes(t); })) return "ATP 500";
  if (low.includes("250") || ["buenos aires", "lyon", "estoril", "geneva", "stuttgart", "eastbourne"].some(function (t) { return low.includes(t); })) return "ATP 250";
  return "";
}

// ===== SOFASCORE API =====

export async function sofaFetch(path, opts) {
  opts = opts || {};
  var apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) return null;
  var timeoutMs = opts.timeoutMs || 8000;  // 8s default. Se API travar, aborta ao inves de ficar esperando.
  var maxRetries = opts.retries === undefined ? 1 : opts.retries;  // 1 retry em caso de 502/503.

  async function attempt(n) {
    var ctrl = new AbortController();
    var to = setTimeout(function() { ctrl.abort(); }, timeoutMs);
    try {
      var res = await fetch("https://" + RAPIDAPI_HOST + "/api/sofascore" + path, {
        headers: { "x-rapidapi-host": RAPIDAPI_HOST, "x-rapidapi-key": apiKey },
        signal: ctrl.signal,
      });
      clearTimeout(to);
      if (!res.ok) {
        log("sofa", res.status + " for " + path + (n > 0 ? " (retry " + n + ")" : ""));
        // Retry em erro transiente
        if ((res.status === 502 || res.status === 503 || res.status === 504) && n < maxRetries) {
          return attempt(n + 1);
        }
        return null;
      }
      return await res.json();
    } catch (e) {
      clearTimeout(to);
      var isAbort = e.name === "AbortError";
      log("sofa", (isAbort ? "timeout " + timeoutMs + "ms" : "error: " + e.message) + " for " + path + (n > 0 ? " (retry " + n + ")" : ""));
      if (isAbort && n < maxRetries) return attempt(n + 1);
      return null;
    }
  }
  return attempt(0);
}

// ===== MATCH DETECTION =====

export function isFonseca(m) {
  var s = (m.slug || "").toLowerCase();
  var h = (m.homeTeam && (m.homeTeam.slug || m.homeTeam.name || "")).toLowerCase();
  var a = (m.awayTeam && (m.awayTeam.slug || m.awayTeam.name || "")).toLowerCase();
  return s.includes("fonseca") || h.includes("fonseca") || a.includes("fonseca");
}

export function isSingles(m) {
  var slug = (m.slug || "").toLowerCase();
  var tName = (m.tournament && m.tournament.name || "").toLowerCase();
  if (slug.includes("doubles") || slug.includes("double") || tName.includes("doubles") || tName.includes("double")) return false;
  var h = (m.homeTeam && (m.homeTeam.name || "")).toLowerCase();
  if (h.includes(" / ") || h.includes(" & ")) return false;
  return true;
}

export function isFinished(m) {
  var s = m.status || {};
  return s.type === "finished" || s.isFinished === true;
}

export function isUpcoming(m) {
  var s = m.status || {};
  var t = (s.type || "").toLowerCase();
  return t === "notstarted" || t === "not_started" || (!s.isFinished && !s.isStarted);
}

export function isLive(m) {
  var s = m.status || {};
  if (s.isInProgress === true) return true;
  if (s.isStarted === true && !s.isFinished) return true;
  var t = (s.type || "").toLowerCase();
  var d = (s.description || "").toLowerCase();
  return t === "inprogress" || t === "in_progress" || t === "live" || t === "started" ||
    d.includes("live") || d.includes("progress") || d.includes("set ") || d.includes("andamento");
}

// ===== EXTRACT MATCH DATA =====
// Normalizes a raw SofaScore match object into our standard format
export function extractMatch(match) {
  var home = match.homeTeam || {};
  var away = match.awayTeam || {};
  var isFHome = (home.slug || home.name || "").toLowerCase().includes("fonseca");
  var opp = isFHome ? away : home;
  var fScore = isFHome ? (match.homeScore || {}) : (match.awayScore || {});
  var oScore = isFHome ? (match.awayScore || {}) : (match.homeScore || {});
  var tournament = match.tournament || {};
  var round = match.roundInfo || {};

  // Build set scores
  var fSets = [], oSets = [];
  for (var i = 1; i <= 5; i++) {
    var k = "period" + i;
    if (fScore[k] !== undefined && oScore[k] !== undefined) {
      fSets.push(fScore[k]);
      oSets.push(oScore[k]);
    }
  }
  var scoreStr = fSets.map(function (s, idx) { return s + "-" + oSets[idx]; }).join(" ");
  var fW = 0, oW = 0;
  fSets.forEach(function (s, idx) { if (s > oSets[idx]) fW++; else oW++; });

  // Surface
  var gt = (match.groundType || tournament.groundType || "").toLowerCase();
  var surface = gt.includes("clay") ? "Clay" : (gt.includes("grass") ? "Grass" : "Hard");

  // Tournament name + category
  var rawName = tournament.name || "";
  var utName = (tournament.uniqueTournament && tournament.uniqueTournament.name) || "";
  var tName = rawName || utName;
  var mapped = lookupTournament(rawName) || lookupTournament(utName);
  var cat = "";
  if (mapped) {
    tName = mapped.name;
    surface = mapped.surface;
    cat = mapped.cat;
  } else {
    cat = detectCategory(tName);
  }

  // Broadcast
  var broadcast = lookupBroadcast(tName) || "";

  // Round
  var roundStr = translateRound(round.name) || "";

  // Timestamps
  var date = (match.startTimestamp || match.timestamp) ? new Date((match.startTimestamp || match.timestamp) * 1000).toISOString() : null;

  return {
    id: match.id,
    result: fW > oW ? "V" : (fW < oW ? "D" : (scoreStr ? "D" : "")),
    score: scoreStr,
    opponent_name: opp.shortName || opp.name || "A definir",
    opponent_id: opp.id || null,
    opponent_ranking: opp.ranking || null,
    opponent_country: opp.country ? opp.country.name : "",
    tournament_name: tName,
    tournament_category: cat,
    surface: surface,
    round: roundStr,
    date: date,
    startTimestamp: match.startTimestamp || match.timestamp || null,
    court: match.courtName || (match.venue && match.venue.name) || "",
    isFonsecaHome: isFHome,
    finished: isFinished(match),
    broadcast: broadcast,
  };
}

// ===== PARSE MATCH STATISTICS =====
export function parseMatchStats(data, isFonsecaHome, meta) {
  if (!data) return null;
  if (!Array.isArray(data)) {
    if (data.statistics && Array.isArray(data.statistics)) data = data.statistics;
    else return null;
  }
  var ap = data.find(function (p) { return p.period === "ALL"; });
  if (!ap || !ap.groups) return null;

  var f = {}, o = {};
  ap.groups.forEach(function (g) {
    (g.statisticsItems || []).forEach(function (it) {
      var k = (it.key || "").toLowerCase().replace(/\s+/g, "");
      var hv = it.homeValue !== undefined ? it.homeValue : (parseInt(it.home) || 0);
      var av = it.awayValue !== undefined ? it.awayValue : (parseInt(it.away) || 0);
      f[k] = isFonsecaHome ? hv : av;
      o[k] = isFonsecaHome ? av : hv;
    });
  });

  return Object.assign({ fonseca: f, opponent: o }, meta || {});
}

// ===== ENRICH MATCH with TOURNAMENT_MAP + BROADCAST + ROUND =====
export function enrichMatch(match) {
  if (!match) return match;
  // Tournament
  var mapped = lookupTournament(match.tournament_name);
  if (mapped) {
    match.tournament_name = mapped.name;
    match.tournament_category = mapped.cat;
    match.surface = mapped.surface;
  }
  // Broadcast
  var bc = lookupBroadcast(match.tournament_name);
  if (bc) match.broadcast = bc;
  // Round
  if (match.round) match.round = translateRound(match.round);
  // Fix date from timestamp
  if (match.startTimestamp && match.startTimestamp > 1000000000) {
    match.date = new Date(match.startTimestamp * 1000).toISOString();
  }
  return match;
}

// ===== BUILD RANKINGS LOOKUP =====
export function buildRankingsLookup(rankingsList) {
  var lookup = {};
  if (!rankingsList || !rankingsList.rankings) return lookup;
  rankingsList.rankings.forEach(function (r) {
    var lastName = stripAccents(r.name.split(" ").pop().toLowerCase());
    lookup[lastName] = r.rank;
    lookup[stripAccents(r.name.toLowerCase())] = r.rank;
  });
  return lookup;
}

// Apply rankings lookup to a match object
export function applyRanking(match, lookup) {
  if (!match || !lookup || !match.opponent_name) return;
  if (match.opponent_ranking) return; // already has ranking
  var lastName = stripAccents(match.opponent_name.split(" ").pop().toLowerCase());
  if (lookup[lastName]) match.opponent_ranking = lookup[lastName];
}
