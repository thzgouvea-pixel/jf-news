// ===== FONSECA NEWS — CRON UPDATE v16 =====
// Architecture: SofaScore (primary) → Gemini with google_search (fallback)
// Wikipedia for career stats, Gemini grounding for ranking/opponent/tournament

import { kv } from "@vercel/kv";

var RAPIDAPI_HOST = "sofascore6.p.rapidapi.com";
var FONSECA_TEAM_ID = 403869;

function log(msg) { console.log("[cron] " + msg); }

async function sofaFetch(path) {
  var apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) return null;
  try {
    var res = await fetch("https://" + RAPIDAPI_HOST + "/api/sofascore" + path, {
      headers: { "x-rapidapi-host": RAPIDAPI_HOST, "x-rapidapi-key": apiKey },
    });
    if (!res.ok) { log("SofaScore " + res.status + " for " + path); return null; }
    return await res.json();
  } catch (e) { log("SofaScore error: " + e.message); return null; }
}

// Gemini with google_search grounding — searches the web for real-time data
// Falls back to plain generation if grounding fails
async function geminiSearch(prompt) {
  var gk = process.env.GEMINI_API_KEY;
  if (!gk) return null;

  // Try with google_search grounding first
  try {
    var r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + gk, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        tools: [{ google_search: {} }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 8192 }
      })
    });
    if (r.ok) {
      var d = await r.json();
      var parts = d.candidates && d.candidates[0] && d.candidates[0].content && d.candidates[0].content.parts;
      if (parts) {
        var textPart = "";
        parts.forEach(function(p) { if (p.text && !p.thought) textPart += p.text; });
        if (textPart) return textPart;
      }
    } else {
      log("Gemini grounding " + r.status + ", falling back to plain generation");
    }
  } catch (e) { log("Gemini grounding error: " + e.message); }

  // Fallback: plain generation without grounding
  return await geminiGenerate(prompt);
}

// Gemini simple (no grounding, just generation)
async function geminiGenerate(prompt) {
  var gk = process.env.GEMINI_API_KEY;
  if (!gk) { log("GEMINI_API_KEY not set!"); return null; }
  try {
    var r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + gk, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.1, maxOutputTokens: 8192 } })
    });
    if (!r.ok) { log("Gemini generate " + r.status + ": " + (await r.text()).slice(0, 200)); return null; }
    var d = await r.json();
    var parts = d.candidates && d.candidates[0] && d.candidates[0].content && d.candidates[0].content.parts;
    if (!parts) return null;
    var txt = "";
    parts.forEach(function(p) { if (p.text && !p.thought) txt += p.text; });
    return txt || null;
  } catch (e) { log("Gemini gen error: " + e.message); return null; }
}

function isFinished(m) { var s = m.status || {}; return s.type === "finished" || s.isFinished === true; }
function isUpcoming(m) { var s = m.status || {}; var t = (s.type || "").toLowerCase(); return t === "notstarted" || t === "not_started" || (!s.isFinished && !s.isStarted); }
function isSingles(m) { var slug = (m.slug||"").toLowerCase(); var tName = (m.tournament&&m.tournament.name||"").toLowerCase(); if (slug.includes("doubles")||slug.includes("double")||tName.includes("doubles")||tName.includes("double")) return false; var h = (m.homeTeam&&(m.homeTeam.name||"")).toLowerCase(); if (h.includes(" / ")||h.includes(" & ")) return false; return true; }
function isFonseca(m) { var s = (m.slug || "").toLowerCase(); var h = (m.homeTeam && (m.homeTeam.slug || m.homeTeam.name || "")).toLowerCase(); var a = (m.awayTeam && (m.awayTeam.slug || m.awayTeam.name || "")).toLowerCase(); return s.includes("fonseca") || h.includes("fonseca") || a.includes("fonseca"); }

// Official tournament names and surfaces — instant enrichment, no API cost
var TOURNAMENT_MAP = {
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

// Brazilian broadcast channels by tournament
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

function lookupBroadcast(tournamentName) {
  if (!tournamentName) return null;
  if (BROADCAST_MAP[tournamentName]) return BROADCAST_MAP[tournamentName];
  for (var k in BROADCAST_MAP) { if (tournamentName.toLowerCase().includes(k.toLowerCase())) return BROADCAST_MAP[k]; }
  return null;
}

var ROUND_MAP = {
  "round 1": "1ª rodada",
  "round of 128": "1ª rodada",
  "round of 64": "2ª rodada",
  "round 2": "2ª rodada",
  "round of 32": "3ª rodada",
  "round 3": "3ª rodada",
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
  "2nd round": "2ª rodada",
  "3rd round": "3ª rodada",
  "4th round": "Oitavas de final",
};

function translateRound(rawRound) {
  if (!rawRound) return "";
  var low = rawRound.toLowerCase().trim();
  if (ROUND_MAP[low]) return ROUND_MAP[low];
  // Partial match for variations like "Round of 16" with extra spaces
  for (var k in ROUND_MAP) { if (low.includes(k)) return ROUND_MAP[k]; }
  // If already in Portuguese (e.g. from manual input), return as-is
  return rawRound;
}

function lookupTournament(rawName) {
  if (!rawName) return null;
  var low = rawName.toLowerCase();
  // Direct match
  if (TOURNAMENT_MAP[low]) return TOURNAMENT_MAP[low];
  // Partial match
  for (var key in TOURNAMENT_MAP) { if (low.includes(key)) return TOURNAMENT_MAP[key]; }
  return null;
}

function extractMatch(match) {
  var home = match.homeTeam || {}; var away = match.awayTeam || {};
  var isFHome = (home.slug || home.name || "").toLowerCase().includes("fonseca");
  var opp = isFHome ? away : home;
  var fScore = isFHome ? (match.homeScore || {}) : (match.awayScore || {});
  var oScore = isFHome ? (match.awayScore || {}) : (match.homeScore || {});
  var tournament = match.tournament || {}; var round = match.roundInfo || {};
  var fSets = [], oSets = [];
  for (var i = 1; i <= 5; i++) { var k = "period" + i; if (fScore[k] !== undefined && oScore[k] !== undefined) { fSets.push(fScore[k]); oSets.push(oScore[k]); } }
  var scoreStr = fSets.map(function(s, idx) { return s + "-" + oSets[idx]; }).join(" ");
  var fW = 0, oW = 0; fSets.forEach(function(s, idx) { if (s > oSets[idx]) fW++; else oW++; });

  // Surface: check groundType first, then tournament map
  var gt = (match.groundType || tournament.groundType || "").toLowerCase();
  var surface = gt.includes("clay") ? "Clay" : (gt.includes("grass") ? "Grass" : "Hard");

  // Tournament name: check raw name AND uniqueTournament name
  var rawName = tournament.name || "";
  var utName = (tournament.uniqueTournament && tournament.uniqueTournament.name) || "";
  var tName = rawName || utName;

  // Lookup in tournament map using both names
  var mapped = lookupTournament(rawName) || lookupTournament(utName);
  if (mapped) {
    tName = mapped.name;
    surface = mapped.surface;
    var cat = mapped.cat;
  } else {
    // Fallback category detection
    var tLow = tName.toLowerCase();
    var cat = "";
    if (["australian open","roland garros","french open","wimbledon","us open"].some(function(g){return tLow.includes(g);})) cat = "Grand Slam";
    else if (tLow.includes("1000") || ["monte carlo","madrid","roma","indian wells","miami","canadian","cincinnati","shanghai","paris"].some(function(m){return tLow.includes(m);})) cat = "Masters 1000";
    else if (tLow.includes("500") || ["rio open","barcelona","hamburg","halle","queens","queen's","washington","beijing","basel","vienna","rotterdam","acapulco","dubai","munich","bmw open"].some(function(t){return tLow.includes(t);})) cat = "ATP 500";
    else if (tLow.includes("250") || ["buenos aires","lyon","estoril","geneva","stuttgart","eastbourne","atlanta","winston-salem","chengdu","antwerp","stockholm","metz"].some(function(t){return tLow.includes(t);})) cat = "ATP 250";
  }

  var fallbackDate = match._scanDate ? match._scanDate + "T12:00:00Z" : null;
  var fallbackTs = match._scanDate ? Math.floor(new Date(match._scanDate + "T12:00:00Z").getTime() / 1000) : null;
  return { id: match.id, result: fW > oW ? "V" : "D", score: scoreStr, opponent_name: opp.shortName || opp.name || "Oponente", opponent_id: opp.id || null, opponent_ranking: opp.ranking || null, opponent_country: opp.country ? opp.country.name : "", tournament_name: tName, tournament_category: cat, surface: surface, round: translateRound(round.name) || "", date: match.startTimestamp ? new Date(match.startTimestamp * 1000).toISOString() : fallbackDate, startTimestamp: match.startTimestamp || fallbackTs, court: match.courtName || (match.venue && match.venue.name) || "", isFonsecaHome: isFHome, finished: isFinished(match) };
}

// ===== PLAYER DATA: Gemini (primary) → Wikipedia (fallback) =====
async function fetchPlayerData() {
  log("Fetching player data...");

  // CAMADA 1: Gemini com google_search (primary)
  var gTxt = await geminiSearch(
    "Busque dados ATUALIZADOS de abril 2026 sobre o tenista brasileiro João Fonseca. " +
    "Preciso de: ranking ATP atual, career-high ranking, record de CARREIRA completa em singles (vitórias-derrotas TOTAL de toda a carreira), " +
    "record da TEMPORADA 2026 (vitórias-derrotas apenas em jogos de 2026), " +
    "record por superfície na carreira (hard, clay, grass), prize money total de carreira em USD, número de títulos ATP. " +
    "IMPORTANTE: 'wins' e 'losses' devem ser os totais de TODA A CARREIRA, e 'seasonWins' e 'seasonLosses' devem ser APENAS de 2026. " +
    "Responda APENAS JSON: {\"ranking\":NUMBER,\"bestRanking\":NUMBER,\"wins\":NUMBER,\"losses\":NUMBER," +
    "\"seasonWins\":NUMBER,\"seasonLosses\":NUMBER," +
    "\"surface\":{\"hard\":{\"w\":NUMBER,\"l\":NUMBER},\"clay\":{\"w\":NUMBER,\"l\":NUMBER},\"grass\":{\"w\":NUMBER,\"l\":NUMBER}}," +
    "\"prizeMoney\":NUMBER,\"titles\":NUMBER}"
  );
  if (gTxt) {
    try {
      var cleaned = gTxt.replace(/```json|```/g, "").trim();
      log("Gemini player raw: " + cleaned.slice(0, 200));
      var jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        var result = JSON.parse(jsonMatch[0]);
        if (result && result.ranking) {
          log("Gemini player data: #" + result.ranking + " | Career:" + (result.wins||0) + "W-" + (result.losses||0) + "L | Season:" + (result.seasonWins||"?") + "W-" + (result.seasonLosses||"?") + "L | $" + (result.prizeMoney||0));
          return result;
        }
      }
    } catch (e) { log("Gemini player parse error: " + e.message); }
  } else {
    log("Gemini player returned null");
  }

  // CAMADA 2: Wikipedia (fallback)
  log("Gemini failed, trying Wikipedia...");
  try {
    var res = await fetch("https://en.wikipedia.org/w/api.php?action=parse&page=Jo%C3%A3o_Fonseca_(tennis)&prop=wikitext&format=json&section=0", { headers: { "User-Agent": "FonsecaNews/1.0" } });
    if (!res.ok) return null;
    var data = await res.json();
    var text = data && data.parse && data.parse.wikitext && data.parse.wikitext["*"];
    if (!text) return null;
    var result = {};

    function extractWL(field) {
      var pattern1 = new RegExp("\\|\\s*" + field + "\\s*=\\s*\\{\\{[^}]*wins\\s*=\\s*(\\d+)\\s*\\|\\s*losses\\s*=\\s*(\\d+)", "i");
      var pattern2 = new RegExp("\\|\\s*" + field + "\\s*=\\s*(\\d+)\\s*[–\\-]\\s*(\\d+)", "i");
      var m = text.match(pattern1) || text.match(pattern2);
      if (m) return { w: parseInt(m[1]), l: parseInt(m[2]) };
      return null;
    }

    var overall = extractWL("singlesrecord");
    if (overall) { result.wins = overall.w; result.losses = overall.l; }
    var hard = extractWL("singlesrecord_hard");
    var clay = extractWL("singlesrecord_clay");
    var grass = extractWL("singlesrecord_grass");
    if (hard || clay || grass) { result.surface = { hard: hard || { w: 0, l: 0 }, clay: clay || { w: 0, l: 0 }, grass: grass || { w: 0, l: 0 } }; }
    var rm = text.match(/\|\s*current_ranking\s*=\s*(?:No\.\s*)?(\d+)/i); if (rm) result.ranking = parseInt(rm[1]);
    var hm = text.match(/\|\s*highest_ranking\s*=\s*(?:No\.\s*)?(\d+)/i); if (hm) result.bestRanking = parseInt(hm[1]);
    var pm = text.match(/\|\s*prize\s*=\s*\$?([\d,]+)/i); if (pm) result.prizeMoney = parseInt(pm[1].replace(/,/g, ""));
    var tm = text.match(/\|\s*titles\s*=\s*(\d+)/i); if (tm) result.titles = parseInt(tm[1]);

    log("Wikipedia: #" + (result.ranking || "?") + " | " + (result.wins||"?") + "W");
    return result;
  } catch (e) { log("Wikipedia error: " + e.message); }

  return null;
}

async function scanMatches(backDaysOverride) {
  log("Scanning matches...");
  var all = []; var seen = new Set();
  function addFiltered(data, scanDate) { if (!data) return; var ev = data.events || data; if (!Array.isArray(ev)) { for (var k in data) { if (Array.isArray(data[k])) { ev = data[k]; break; } } } if (Array.isArray(ev)) ev.forEach(function(m) { if (isFonseca(m) && m.id && !seen.has(m.id)) { seen.add(m.id); if (!m.startTimestamp && scanDate) { m._scanDate = scanDate; m.startTimestamp = Math.floor(new Date(scanDate + "T12:00:00Z").getTime() / 1000); } all.push(m); } }); }

  // Date scan: custom backDays + 2 forward
  var backDays = backDaysOverride || 3;
  var fwdDays = Math.min(backDays, 7);
  for (var d = -backDays; d <= fwdDays; d++) {
    var ds = new Date(Date.now() + d * 86400000).toISOString().split("T")[0];
    addFiltered(await sofaFetch("/v1/match/list?sport_slug=tennis&date=" + ds), ds);
  }

  log(all.length + " matches (" + backDays + "d back)"); return all;
}

async function fetchMatchStats(lm) {
  if (!lm || !lm.id) { log("matchStats: no match ID"); return null; }
  log("matchStats: fetching for match " + lm.id + " (" + lm.opponent_name + ")");
  var data = await sofaFetch("/v1/match/statistics?match_id=" + lm.id);
  if (!data) { log("matchStats: endpoint returned null/empty for id=" + lm.id); return null; }
  if (!Array.isArray(data)) {
    // Try alternate response format — some plans return { statistics: [...] }
    if (data.statistics && Array.isArray(data.statistics)) { data = data.statistics; }
    else { log("matchStats: unexpected format: " + JSON.stringify(data).substring(0, 200)); return null; }
  }
  var ap = data.find(function(p) { return p.period === "ALL"; });
  if (!ap || !ap.groups) { log("matchStats: no ALL period in " + data.length + " periods"); return null; }
  var f = {}, o = {};
  ap.groups.forEach(function(g) { (g.statisticsItems || []).forEach(function(it) { var k = (it.key || "").toLowerCase().replace(/\s+/g, ""); var hv = it.homeValue !== undefined ? it.homeValue : (parseInt(it.home) || 0); var av = it.awayValue !== undefined ? it.awayValue : (parseInt(it.away) || 0); f[k] = lm.isFonsecaHome ? hv : av; o[k] = lm.isFonsecaHome ? av : hv; }); });
  log("matchStats: OK, " + Object.keys(f).length + " stat keys");
  return { fonseca: f, opponent: o, opponent_name: lm.opponent_name, opponent_country: lm.opponent_country, tournament: lm.tournament_name, result: lm.result, score: lm.score, date: lm.date };
}

async function fetchMatchDetail(matchId) {
  if (!matchId) return null;
  // Try multiple endpoint variations
  var endpoints = [
    "/v1/event/" + matchId,
    "/v1/match/" + matchId,
    "/v1/event/details?event_id=" + matchId,
    "/v1/match/detail?match_id=" + matchId,
  ];
  for (var i = 0; i < endpoints.length; i++) {
    var data = await sofaFetch(endpoints[i]);
    if (data) {
      var event = data.event || data;
      var court = event.courtName || (event.venue && event.venue.name) || (event.venue && event.venue.stadium && event.venue.stadium.name) || null;
      if (court) {
        log("Match detail via " + endpoints[i] + ": court=" + court);
        return {
          court: court,
          startTimestamp: event.startTimestamp || null,
          date: event.startTimestamp ? new Date(event.startTimestamp * 1000).toISOString() : null,
        };
      }
    }
  }
  log("Match detail: no court found for id " + matchId);
  return null;
}

async function fetchATPRankings() {
  log("Fetching ATP rankings...");
  // Try multiple endpoint variations
  var endpoints = [
    "/v1/rankings/type/6",
    "/v1/sport/rankings?sport_slug=tennis",
    "/v1/rankings?sport=tennis&type=atp",
  ];
  for (var ei = 0; ei < endpoints.length; ei++) {
    var data = await sofaFetch(endpoints[ei]);
    if (!data) continue;
    var rankings = [];
    var rows = data.rankings || data.rankingRows || data.rows || (Array.isArray(data) ? data : null);
    if (!rows) { for (var k in data) { if (Array.isArray(data[k]) && data[k].length > 10) { rows = data[k]; break; } } }
    if (rows && Array.isArray(rows)) {
      rows.slice(0, 100).forEach(function(r) {
        var team = r.team || r.player || r;
        var name = team.name || team.shortName || "";
        var rank = r.ranking || r.rank || r.position || 0;
        var pts = r.points || r.rowPoints || 0;
        if (name && rank) rankings.push({ rank: rank, name: name, points: pts, prev: rank });
      });
    }
    if (rankings.length >= 20) {
      log("SofaScore rankings via " + endpoints[ei] + ": " + rankings.length + " players, #1=" + rankings[0].name);
      return { rankings: rankings, updatedAt: new Date().toISOString() };
    }
    log("SofaScore rankings " + endpoints[ei] + ": only " + rankings.length + " players, trying next...");
  }
  log("All SofaScore ranking endpoints failed, trying Gemini...");
  return await fetchATPRankingsGemini();
}

async function fetchATPRankingsGemini() {
  var gTxt = await geminiSearch(
    "Busque o ranking ATP Singles masculino ATUALIZADO. Liste os top 50 jogadores com rank, nome completo e pontos. " +
    "Responda APENAS um array JSON, sem texto: [{\"rank\":1,\"name\":\"Nome\",\"points\":1234},{\"rank\":2,\"name\":\"Nome\",\"points\":5678},...até rank 50]"
  );
  if (!gTxt) return null;
  try {
    var cleaned = gTxt.replace(/```json|```/g, "").trim();
    var arr = JSON.parse(cleaned.match(/\[[\s\S]*\]/)[0]);
    if (arr && arr.length >= 20) {
      log("Gemini rankings: " + arr.length + " players");
      return { rankings: arr.map(function(r,i){ return { rank: r.rank||i+1, name: r.name, points: r.points||0, prev: r.rank||i+1 }; }), updatedAt: new Date().toISOString() };
    }
  } catch(e) { log("Rankings parse error: " + e.message); }
  return null;
}

async function fetchOppProfile(nm) {
  if (!nm || !nm.opponent_name) return null;
  var ck = nm.opponent_id ? "fn:oppCache:" + nm.opponent_id : "fn:oppCache:" + nm.opponent_name.replace(/\s+/g, "_");
  try { var c = await kv.get(ck); if (c) { var p = typeof c === "string" ? JSON.parse(c) : c; if (p && p.name) return p; } } catch(e) {}

  // Try SofaScore API first
  if (nm.opponent_id) {
    var data = await sofaFetch("/v1/team/" + nm.opponent_id);
    if (data && data.team) {
      var t = data.team; var pr = { name: t.shortName || t.name, country: t.country ? t.country.name : nm.opponent_country, ranking: t.ranking || nm.opponent_ranking || null, age: null, height: null, hand: null, titles: null };
      if (t.playerTeamInfo) { if (t.playerTeamInfo.birthDateTimestamp) pr.age = Math.floor((Date.now() - t.playerTeamInfo.birthDateTimestamp * 1000) / (365.25*24*3600000)); if (t.playerTeamInfo.height) pr.height = (t.playerTeamInfo.height / 100).toFixed(2) + "m"; if (t.playerTeamInfo.plays) pr.hand = t.playerTeamInfo.plays === "right-handed" ? "Destro" : "Canhoto"; }
      try { await kv.set(ck, JSON.stringify(pr), { ex: 172800 }); } catch(e) {}
      return pr;
    }
    log("SofaScore team API failed for " + nm.opponent_id + ", trying Gemini...");
  }

  // Gemini fallback with google_search grounding
  log("Trying Gemini with web search for " + nm.opponent_name + "...");
  var gTxt = await geminiSearch("Busque informações atualizadas sobre o tenista " + nm.opponent_name + ". Responda APENAS JSON: {\"name\":\"nome curto\",\"country\":\"país\",\"ranking\":NUMBER,\"age\":NUMBER,\"height\":\"X.XXm\",\"hand\":\"Destro ou Canhoto\",\"titles\":NUMBER,\"style\":\"breve descrição do estilo de jogo em português\",\"careerHigh\":NUMBER}. Use dados reais e atuais de 2026.");
  if (gTxt) {
    try {
      var cleaned = gTxt.replace(/```json|```/g, "").trim();
      var jsonMatch = cleaned.match(/\{[^}]+\}/);
      if (jsonMatch) {
        var pr = JSON.parse(jsonMatch[0]);
        if (pr && pr.name) {
          pr.ranking = pr.ranking || nm.opponent_ranking || null;
          pr.country = pr.country || nm.opponent_country || "";
          log("Gemini oppProfile: " + pr.name + " #" + (pr.ranking || "?") + " | " + pr.country);
          try { await kv.set(ck, JSON.stringify(pr), { ex: 172800 }); } catch(e) {}
          return pr;
        }
      }
    } catch(e) { log("Gemini oppProfile parse error: " + e.message); }
  }
  return null;
}

async function fetchWinProb(nm) {
  if (!nm) return null;

  // Source 1: The Odds API — discover active ATP tennis sport keys and try all
  var ok = process.env.ODDS_API_KEY;
  if (ok) {
    try {
      // Step 1: Get all active sports (free, no quota cost)
      var sportsRes = await fetch("https://api.the-odds-api.com/v4/sports/?apiKey=" + ok);
      var sportKeys = [];
      if (sportsRes.ok) {
        var sports = await sportsRes.json();
        sportKeys = sports.filter(function(s) { return s.key && s.key.startsWith("tennis_atp") && s.active; }).map(function(s) { return s.key; });
        log("Odds API active tennis keys: " + sportKeys.join(", "));
      }
      // Fallback if sports endpoint fails
      if (sportKeys.length === 0) sportKeys = ["tennis_atp_singles"];

      // Step 2: Try each sport key until we find Fonseca
      for (var si = 0; si < sportKeys.length; si++) {
        var r = await fetch("https://api.the-odds-api.com/v4/sports/" + sportKeys[si] + "/odds/?apiKey=" + ok + "&regions=eu&markets=h2h&oddsFormat=decimal");
        if (r.ok) {
          var d = await r.json();
          if (Array.isArray(d)) {
            var g = d.find(function(x) { return [x.home_team||"",x.away_team||""].some(function(n){return n.toLowerCase().includes("fonseca");}); });
            if (g && g.bookmakers && g.bookmakers.length) {
              // Average odds across multiple bookmakers for accuracy
              var fOddsArr = [], oOddsArr = [];
              g.bookmakers.forEach(function(bk) {
                var mk = bk.markets && bk.markets.find(function(m){return m.key==="h2h";});
                if (mk && mk.outcomes) {
                  mk.outcomes.forEach(function(o){
                    if(o.name.toLowerCase().includes("fonseca")) fOddsArr.push(o.price);
                    else oOddsArr.push(o.price);
                  });
                }
              });
              if (fOddsArr.length > 0 && oOddsArr.length > 0) {
                var avgF = fOddsArr.reduce(function(a,b){return a+b;},0) / fOddsArr.length;
                var avgO = oOddsArr.reduce(function(a,b){return a+b;},0) / oOddsArr.length;
                var iF=1/avgF,iO=1/avgO,tot=iF+iO;
                log("Odds API: Fonseca " + avgF.toFixed(2) + " / " + (nm.opponent_name||"opp") + " " + avgO.toFixed(2) + " (avg of " + fOddsArr.length + " bookmakers via " + sportKeys[si] + ")");
                return { fonseca: Math.round((iF/tot)*100), opponent: Math.round((iO/tot)*100), opponent_name: nm.opponent_name, source: "odds-api", updatedAt: new Date().toISOString() };
              }
            }
          }
        }
      }
      log("Odds API: Fonseca not found in any of " + sportKeys.length + " sport keys");
    } catch(e) { log("Odds API error: " + e.message); }
  }

  // Source 2: SofaScore match odds
  if (nm.id) {
    try {
      var sd = await sofaFetch("/v1/match/odds?match_id=" + nm.id);
      if (sd && sd.markets) {
        var h2h = sd.markets.find(function(m) { return m.marketName === "Full time" || m.marketName === "1x2" || m.key === "1x2"; });
        if (h2h && h2h.choices) {
          var fOdd = null, oOdd = null;
          h2h.choices.forEach(function(c) {
            if ((c.name || "").toLowerCase().includes("fonseca") || c.name === "1") fOdd = c.odds || c.fractionalValue;
            else if (c.name === "2" || c.name !== "X") oOdd = c.odds || c.fractionalValue;
          });
          if (fOdd && oOdd) {
            var fi = 1/fOdd, oi = 1/oOdd, t = fi+oi;
            return { fonseca: Math.round((fi/t)*100), opponent: Math.round((oi/t)*100), opponent_name: nm.opponent_name, source: "sofascore-odds", updatedAt: new Date().toISOString() };
          }
        }
      }
    } catch(e) { log("SofaScore odds error: " + e.message); }
  }

  log("No reliable odds source for " + (nm.opponent_name || "match"));
  return null;
}

var ATP_CALENDAR_2026 = [
  { name: "Australian Open", cat: "Grand Slam", surface: "Hard", city: "Melbourne", country: "Austrália", start: "2026-01-18", end: "2026-02-01" },
  { name: "Buenos Aires", cat: "ATP 250", surface: "Clay", city: "Buenos Aires", country: "Argentina", start: "2026-02-09", end: "2026-02-15" },
  { name: "Rio Open", cat: "ATP 500", surface: "Clay", city: "Rio de Janeiro", country: "Brasil", start: "2026-02-16", end: "2026-02-22" },
  { name: "Indian Wells", cat: "Masters 1000", surface: "Hard", city: "Indian Wells", country: "EUA", start: "2026-03-04", end: "2026-03-15" },
  { name: "Miami Open", cat: "Masters 1000", surface: "Hard", city: "Miami", country: "EUA", start: "2026-03-18", end: "2026-03-29" },
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

async function fetchNextTournament(upcomingMatches) {
  log("fetchNextTournament...");
  var now = new Date();

  // a) Try SofaScore: look for an upcoming match that has tournament info but no confirmed opponent
  if (upcomingMatches && upcomingMatches.length > 0) {
    for (var i = 0; i < upcomingMatches.length; i++) {
      var m = upcomingMatches[i];
      if (!isSingles(m)) continue;
      var t = m.tournament || {};
      var tName = t.name || (t.uniqueTournament && t.uniqueTournament.name) || "";
      if (tName) {
        var ex = extractMatch(m);
        return {
          tournament_name: tName,
          tournament_category: ex.tournament_category || "",
          surface: ex.surface || "Hard",
          city: (t.city || ""),
          country: (t.country ? (t.country.name || "") : ""),
          start_date: ex.date ? ex.date.split("T")[0] : null,
          end_date: null,
          source: "sofascore",
          updatedAt: new Date().toISOString(),
        };
      }
    }
  }

  // b) ATP Calendar hardcoded fallback: pick next tournament whose end date is after today
  var nextT = null;
  for (var j = 0; j < ATP_CALENDAR_2026.length; j++) {
    var cal = ATP_CALENDAR_2026[j];
    var endDate = new Date(cal.end + "T23:59:59Z");
    if (endDate >= now) {
      nextT = cal;
      break;
    }
  }
  if (!nextT) { log("No upcoming tournament in calendar"); return null; }

  var result = {
    tournament_name: nextT.name,
    tournament_category: nextT.cat,
    surface: nextT.surface,
    city: nextT.city,
    country: nextT.country,
    start_date: nextT.start,
    end_date: nextT.end,
    source: "calendar",
    updatedAt: new Date().toISOString(),
  };

  // c) Gemini enrichment (optional)
  var gt = await geminiSearch("Confirme informações do torneio ATP " + nextT.name + " 2026: categoria (Grand Slam, Masters 1000, ATP 500 ou 250), superfície, cidade, país, datas. Responda APENAS JSON: {\"tournament_name\":\"...\",\"tournament_category\":\"...\",\"surface\":\"...\",\"city\":\"...\",\"country\":\"...\",\"start_date\":\"YYYY-MM-DD\",\"end_date\":\"YYYY-MM-DD\"}");
  if (gt) {
    try {
      var cleaned = gt.replace(/```json|```/g, "").trim();
      var jsonMatch = cleaned.match(/\{[^}]+\}/);
      if (jsonMatch) {
        var enriched = JSON.parse(jsonMatch[0]);
        if (enriched && enriched.tournament_name) {
          result = Object.assign({}, result, enriched, { source: "gemini", updatedAt: new Date().toISOString() });
        }
      }
    } catch(parseErr) { log("Gemini tournament parse: " + parseErr.message); }
  }

  log("nextTournament: " + result.tournament_name);
  return result;
}

// Tournament facts removed — feature disabled

export default async function handler(req, res) {
  var start = Date.now(); var steps = {};
  try {
    // Auto-detect if recentForm needs recovery
    var scanDays = 3; // normal
    if (req.query && req.query.deep === "1") {
      scanDays = 45; // manual deep
    } else {
      try {
        var existingForm = await kv.get("fn:recentForm");
        var parsed = existingForm ? (typeof existingForm === "string" ? JSON.parse(existingForm) : existingForm) : null;
        if (!parsed || !Array.isArray(parsed) || parsed.length < 5) {
          scanDays = 30; // auto-recovery
          log("recentForm has " + (parsed ? parsed.length : 0) + " entries, auto-expanding scan to " + scanDays + " days");
        }
      } catch(e) {}
    }
    var matches = await scanMatches(scanDays);
    var NOW_TS = Math.floor(Date.now()/1000);
    function roundWeight(m) { var r = ((m.roundInfo||{}).name||"").toLowerCase(); if (r.includes("final") && !r.includes("quarter") && !r.includes("semi")) return 7; if (r.includes("semi")) return 6; if (r.includes("quarter")) return 5; if (r.includes("r4")||r.includes("round 4")||r.includes("4th")) return 4; if (r.includes("r3")||r.includes("round 3")||r.includes("3rd")) return 3; if (r.includes("r2")||r.includes("round 2")||r.includes("2nd")) return 2; if (r.includes("r1")||r.includes("round 1")||r.includes("1st")) return 1; return 0; }
    var fin = matches.filter(function(m){return isFinished(m)&&isSingles(m);}).sort(function(a,b){ var d = (b.startTimestamp||NOW_TS)-(a.startTimestamp||NOW_TS); return d !== 0 ? d : roundWeight(b)-roundWeight(a); });
    var upc = matches.filter(function(m){if(!isUpcoming(m)||!isSingles(m)) return false; var ex=extractMatch(m); if(ex.score&&ex.score.length>2) return false; return true;}).sort(function(a,b){return (a.startTimestamp||0)-(b.startTimestamp||0);});

    // SMART: cross-reference upc with KV lastMatch — skip "upcoming" matches that already finished
    // (SofaScore RapidAPI can be slow to update match status)
    try {
      var kvLastMatch = await kv.get("fn:lastMatch");
      if (kvLastMatch) {
        var kvLM = typeof kvLastMatch === "string" ? JSON.parse(kvLastMatch) : kvLastMatch;
        if (kvLM && kvLM.finished && kvLM.opponent_name) {
          var kvOppLast = kvLM.opponent_name.split(" ").pop().toLowerCase();
          upc = upc.filter(function(m) {
            var ex = extractMatch(m);
            var mOppLast = ex.opponent_name.split(" ").pop().toLowerCase();
            if (mOppLast === kvOppLast) {
              log("Skipping stale upcoming match vs " + ex.opponent_name + " (already finished in KV)");
              return false;
            }
            return true;
          });
        }
      }
    } catch(e) {}

    // Re-sort fin in case we added stale matches from upc
    fin.sort(function(a,b){ var d = (b.startTimestamp||NOW_TS)-(a.startTimestamp||NOW_TS); return d !== 0 ? d : roundWeight(b)-roundWeight(a); });

    var lm = fin.length > 0 ? extractMatch(fin[0]) : null;
    var nm = upc.length > 0 ? extractMatch(upc[0]) : null;

    // CRITICAL: if nm opponent matches KV lastMatch (already finished), advance to next upc entry
    if (nm) {
      try {
        var kvCheck = await kv.get("fn:lastMatch");
        if (kvCheck) {
          var kvParsed = typeof kvCheck === "string" ? JSON.parse(kvCheck) : kvCheck;
          if (kvParsed && kvParsed.finished && kvParsed.opponent_name) {
            var kvOpp = kvParsed.opponent_name.split(" ").pop().toLowerCase();
            var nmOpp = nm.opponent_name.split(" ").pop().toLowerCase();
            if (kvOpp === nmOpp) {
              log("nm " + nm.opponent_name + " already finished in KV, advancing to next upc");
              if (!lm || new Date(kvParsed.date) > new Date(lm.date || 0)) lm = kvParsed;
              nm = upc.length > 1 ? extractMatch(upc[1]) : null;
              log("New nm: " + (nm ? nm.opponent_name : "none"));
            }
          }
        }
      } catch(e) { log("nm check error: " + e.message); }
    }

    var form = fin.slice(0,10).map(function(m){var d=extractMatch(m);return{result:d.result,score:d.score,opponent_name:d.opponent_name,opponent_ranking:d.opponent_ranking||null,tournament:d.tournament_name,round:d.round||"",date:d.date};}).filter(function(f){ return f.score && f.score.length > 1; });
    steps.scan = matches.length + " matches";
    steps.last = lm ? lm.opponent_name : "none";
    steps.next = nm ? nm.opponent_name : "none";

    var wiki = null; var ms = null;

    // ===== SMART SCHEDULING: only fetch what's stale =====
    var H6 = 6 * 3600000; var H24 = 24 * 3600000; var D7 = 7 * H24;
    var now = Date.now();

    // Read existing KV timestamps in parallel
    var smartReads = await Promise.all([
      kv.get("fn:ranking"), kv.get("fn:opponentProfile"),
      kv.get("fn:nextMatch"), kv.get("fn:lastOddsCheck"), kv.get("fn:careerStats"),
      kv.get("fn:prizeMoney"), kv.get("fn:atpRankings"),
    ]);
    var exRanking = smartReads[0] ? (typeof smartReads[0] === "string" ? JSON.parse(smartReads[0]) : smartReads[0]) : null;
    var exOpp = smartReads[1] ? (typeof smartReads[1] === "string" ? JSON.parse(smartReads[1]) : smartReads[1]) : null;
    var exNm = smartReads[2] ? (typeof smartReads[2] === "string" ? JSON.parse(smartReads[2]) : smartReads[2]) : null;
    var lastOddsTs = smartReads[3] ? parseInt(smartReads[3]) : 0;
    var exCareer = smartReads[4] ? (typeof smartReads[4] === "string" ? JSON.parse(smartReads[4]) : smartReads[4]) : null;
    var exPrize = smartReads[5] ? (typeof smartReads[5] === "string" ? JSON.parse(smartReads[5]) : smartReads[5]) : null;
    var exRankingsList = smartReads[6] ? (typeof smartReads[6] === "string" ? JSON.parse(smartReads[6]) : smartReads[6]) : null;
    // Build rankings lookup for enriching recentForm
    function stripAccents(s) { return s.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
    var rankingsLookup = {};
    if (exRankingsList && exRankingsList.rankings) {
      exRankingsList.rankings.forEach(function(r) {
        var lastName = stripAccents(r.name.split(" ").pop().toLowerCase());
        rankingsLookup[lastName] = r.rank;
        rankingsLookup[stripAccents(r.name.toLowerCase())] = r.rank;
      });
    }

    // Detect what changed
    var oppChanged = nm && (!exNm || nm.opponent_name !== exNm.opponent_name);
    // ALSO check if opponent profile is stale (different opponent name)
    if (!oppChanged && nm && exOpp && exOpp.name) {
      var profLast = stripAccents(exOpp.name.split(" ").pop().toLowerCase());
      var nmLast = stripAccents(nm.opponent_name.split(" ").pop().toLowerCase());
      if (profLast !== nmLast) {
        oppChanged = true;
        log("opponentProfile stale (" + exOpp.name + " vs " + nm.opponent_name + "), forcing refresh");
      }
    }
    // Clear odds timer when opponent changes so new odds are fetched immediately
    if (oppChanged) { lastOddsTs = 0; }
    // Also force refresh if profile doesn't match current opponent
    if (!oppChanged && nm && exOpp && exOpp.name) {
      var profLast = exOpp.name.split(" ").pop().toLowerCase();
      var nmLast = nm.opponent_name.split(" ").pop().toLowerCase();
      if (profLast !== nmLast) { oppChanged = true; log("Profile mismatch: " + exOpp.name + " vs nm " + nm.opponent_name + ", forcing refresh"); }
    }
    var rankingFresh = exRanking && exRanking.updatedAt && (now - new Date(exRanking.updatedAt).getTime()) < D7;
    var careerFresh = exCareer && exCareer.wins !== undefined;
    var oddsFresh = lastOddsTs && (now - lastOddsTs) < H6;

    // Smart: only fetch player data if ranking stale (>7 days) or career stats missing
    if (!rankingFresh || !careerFresh) {
      wiki = await fetchPlayerData();
      steps.ranking = wiki && wiki.ranking ? "#" + wiki.ranking : "skip";
    } else {
      wiki = { ranking: exRanking.ranking, bestRanking: exRanking.bestRanking };
      if (exCareer) { wiki.wins = exCareer.wins; wiki.losses = exCareer.losses; wiki.surface = exCareer.surface; wiki.titles = exCareer.titles; }
      if (exPrize && exPrize.amount) wiki.prizeMoney = exPrize.amount;
      steps.ranking = "#" + exRanking.ranking + " (cached)";
      log("Ranking fresh (#" + exRanking.ranking + "), skipping Gemini player data");
    }

    ms = lm ? await fetchMatchStats(lm) : null; steps.stats = ms ? "ok" : "skip";

    // Smart: refresh ATP rankings daily
    var rankingsListFresh = exRankingsList && exRankingsList.updatedAt && (now - new Date(exRankingsList.updatedAt).getTime()) < H24 && exRankingsList.rankings && exRankingsList.rankings.length >= 40;
    if (!rankingsListFresh) {
      var newRankings = await fetchATPRankings();
      if (newRankings && newRankings.rankings && newRankings.rankings.length >= 20) {
        exRankingsList = newRankings;
        // Rebuild lookup with fresh data
        rankingsLookup = {};
        exRankingsList.rankings.forEach(function(r) {
          var lastName = stripAccents(r.name.split(" ").pop().toLowerCase());
          rankingsLookup[lastName] = r.rank;
          rankingsLookup[stripAccents(r.name.toLowerCase())] = r.rank;
        });
        steps.atpRankings = newRankings.rankings.length + " players";
      } else {
        steps.atpRankings = "skip";
      }
    } else {
      steps.atpRankings = exRankingsList.rankings.length + " (cached)";
      log("ATP rankings fresh (" + exRankingsList.rankings.length + " players), skipping refresh");
    }

    // ===== MERGE with existing KV (preserve manual overrides) =====
    async function mergeWithKV(key, newData) {
      if (!newData) return newData;
      try {
        var existing = await kv.get(key);
        if (!existing) return newData;
        var old = typeof existing === "string" ? JSON.parse(existing) : existing;
        if (!old) return newData;
        // Only merge if same match (same opponent or same id)
        var sameMatch = (old.opponent_name && newData.opponent_name && old.opponent_name === newData.opponent_name) || (old.id && newData.id && old.id === newData.id);
        if (!sameMatch) return newData;
        // Keep manual fields if cron has empty/null
        var fields = ["date","round","court","opponent_ranking","opponent_country","opponent_id","tournament_category","startTimestamp"];
        fields.forEach(function(f) {
          if ((!newData[f] || newData[f] === "") && old[f] && old[f] !== "") {
            newData[f] = old[f];
          }
        });
        // Surface: only preserve old value if new is empty/null (not if "Hard")
        if (!newData.surface && old.surface && old.surface !== "") {
          newData.surface = old.surface;
        }
        // Preserve enriched tournament name (SofaScore returns "City, Country" but KV has official name)
        if (old.tournament_name && !old.tournament_name.includes(",") && newData.tournament_name && newData.tournament_name.includes(",")) {
          newData.tournament_name = old.tournament_name;
        }
        // Preserve broadcast from enrichment
        if (old.broadcast && !newData.broadcast) newData.broadcast = old.broadcast;
      } catch(e) { log("Merge error: " + e.message); }
      return newData;
    }

    if (nm) {
      try { var eLM3 = await kv.get("fn:lastMatch"); if (eLM3) { var pLM3 = typeof eLM3 === "string" ? JSON.parse(eLM3) : eLM3; if (pLM3.opponent_name && nm.opponent_name && pLM3.opponent_name === nm.opponent_name && pLM3.tournament_name && nm.tournament_name && pLM3.tournament_name === nm.tournament_name) nm = null; } } catch(e){}
      if (nm) {
        // Check manual lock — if active, preserve ALL manual fields
        var nmLock = null;
        try { nmLock = await kv.get("fn:nextMatchManualLock"); } catch(e) {}
        if (nmLock) {
          try {
            var existingNm = await kv.get("fn:nextMatch");
            if (existingNm) {
              var oldNm = typeof existingNm === "string" ? JSON.parse(existingNm) : existingNm;
              if (oldNm && oldNm.opponent_name) {
                // Preserve all manual fields, only update from cron if manual is empty
                var manualFields = ["tournament_name","tournament_category","surface","round","court","date","opponent_ranking","opponent_country","opponent_id","opponent_name","startTimestamp"];
                manualFields.forEach(function(f) {
                  if (oldNm[f] && oldNm[f] !== "" && oldNm[f] !== "Hard") { nm[f] = oldNm[f]; }
                });
                log("Manual lock active for nextMatch, preserving manual fields");
              }
            }
          } catch(e) {}
        } else {
          nm = await mergeWithKV("fn:nextMatch", nm);
        }
      }
    }
    if (lm) lm = await mergeWithKV("fn:lastMatch", lm);

    // Enrich nextMatch with court/venue from match detail (1 API call)
    if (nm && nm.id && !nm.court) {
      var detail = await fetchMatchDetail(nm.id);
      if (detail && detail.court) { nm.court = detail.court; log("Court: " + detail.court); }
      if (detail && detail.startTimestamp && !nm.startTimestamp) nm.startTimestamp = detail.startTimestamp;
      if (detail && detail.date && !nm.date) nm.date = detail.date;
    }

    if (!nm) {
      // Check manual lock before deleting nextMatch
      var nextMatchLock = null;
      try { nextMatchLock = await kv.get("fn:nextMatchManualLock"); } catch(e) {}
      if (nextMatchLock) {
        // SMART: check if the locked opponent's match already finished
        var kvNm = null;
        try {
          var kvNmRaw = await kv.get("fn:nextMatch");
          if (kvNmRaw) kvNm = typeof kvNmRaw === "string" ? JSON.parse(kvNmRaw) : kvNmRaw;
        } catch(e) {}

        var lockedOppFinished = false;
        if (kvNm && kvNm.opponent_name && fin.length > 0) {
          var lockedLast = kvNm.opponent_name.split(" ").pop().toLowerCase();
          lockedOppFinished = fin.some(function(m) {
            var home = (m.homeTeam && (m.homeTeam.shortName || m.homeTeam.name || "")).toLowerCase();
            var away = (m.awayTeam && (m.awayTeam.shortName || m.awayTeam.name || "")).toLowerCase();
            return home.includes(lockedLast) || away.includes(lockedLast);
          });
        }

        if (lockedOppFinished) {
          // Match finished! Clear locks and let natural transition happen
          log("Locked opponent " + (kvNm.opponent_name || "?") + " match FINISHED, clearing locks");
          try {
            await kv.del("fn:nextMatchManualLock");
            await kv.del("fn:lastMatchManualLock");
            await kv.del("fn:nextMatch");
            await kv.del("fn:winProb");
          } catch(e) {}
          // nm stays null — lm from fin[0] will be the new lastMatch
        } else {
          // Match not finished yet — restore nm from KV so odds/enrichment work
          nm = kvNm;
          if (nm) log("Restored nm from KV: " + (nm.opponent_name || "?") + " @ " + (nm.tournament_name || "?"));
        }
      } else {
        try { await kv.del("fn:nextMatch"); await kv.del("fn:winProb"); } catch(e){}
      }

      // SMART: If nm is still null, check if João WON his last match in an ongoing tournament
      // If so, create a placeholder nextMatch for the next round (adversário a definir)
      if (!nm) {
        try {
          var kvLM = await kv.get("fn:lastMatch");
          var parsedLM = kvLM ? (typeof kvLM === "string" ? JSON.parse(kvLM) : kvLM) : lm;
          if (parsedLM && parsedLM.result === "V" && parsedLM.tournament_name) {
            var todayStr = new Date().toISOString().split("T")[0];
            var tournOngoing = ATP_CALENDAR_2026.some(function(t) {
              var nameMatch = parsedLM.tournament_name.toLowerCase().includes(t.name.toLowerCase()) || t.name.toLowerCase().includes(parsedLM.tournament_name.toLowerCase().split(",")[0].trim());
              return nameMatch && t.end && t.end >= todayStr;
            });
            if (tournOngoing) {
              var NEXT_ROUND = {
                "1ª rodada": "Oitavas de final", "2ª rodada": "Oitavas de final", "3ª rodada": "Oitavas de final",
                "16avos de final": "Oitavas de final", "Oitavas de final": "Quartas de final",
                "Quartas de final": "Semifinal", "Semifinal": "Final",
              };
              var currentRound = parsedLM.round || "";
              var nextRound = NEXT_ROUND[currentRound] || "";
              var mappedTourn = lookupTournament(parsedLM.tournament_name);
              nm = {
                opponent_name: "A definir",
                opponent_ranking: null,
                opponent_country: "",
                tournament_name: mappedTourn ? mappedTourn.name : parsedLM.tournament_name,
                tournament_category: mappedTourn ? mappedTourn.cat : (parsedLM.tournament_category || ""),
                surface: mappedTourn ? mappedTourn.surface : (parsedLM.surface || ""),
                round: nextRound,
                date: null,
                court: "",
                finished: false,
              };
              var bc = lookupBroadcast(nm.tournament_name);
              if (bc) nm.broadcast = bc;
              log("Placeholder nextMatch: " + nm.tournament_name + " " + nm.round + " (opponent TBD)");
              await kv.set("fn:nextMatch", JSON.stringify(nm), { ex: 172800 });
            }
          }
        } catch(placeholderErr) { log("Placeholder nextMatch error: " + placeholderErr.message); }
      }

      var nt = await fetchNextTournament(upc);
      if (nt) { try { await kv.set("fn:nextTournament", JSON.stringify(nt), { ex: 172800 }); } catch(e){ log("KV nextTournament error: " + e.message); } }
    } else {
      try { await kv.del("fn:nextTournament"); } catch(e){}
    }
    // ===== LAST MATCH with manual lock protection =====
    var skipLastMatchWrite = false;
    if (lm) {
      try {
        var manualLock = await kv.get("fn:lastMatchManualLock");
        if (manualLock) {
          var eLM2 = await kv.get("fn:lastMatch");
          if (eLM2) {
            var pLM2 = typeof eLM2 === "string" ? JSON.parse(eLM2) : eLM2;
            if (pLM2.date && lm.date && new Date(lm.date) > new Date(pLM2.date)) {
              log("Cron has newer match than manual lock, clearing lock");
              await kv.del("fn:lastMatchManualLock");
              // lm stays as cron data, will be written below
            } else {
              log("Manual lock active, keeping manual lastMatch (" + (pLM2.opponent_name || "?") + ")");
              lm = pLM2;
              skipLastMatchWrite = true; // Skip KV overwrite to preserve manual lock
            }
          }
        }
      } catch(e) { log("Lock check error: " + e.message); }

      // Only do merge logic if lock is NOT active
      if (!skipLastMatchWrite) {
        try {
          var eLM = await kv.get("fn:lastMatch");
          if (eLM) {
            var pLM = typeof eLM === "string" ? JSON.parse(eLM) : eLM;
            if (pLM.date && lm.date && new Date(pLM.date) > new Date(lm.date)) {
              log("Existing lastMatch is newer, keeping it");
              // Enrich KV version with cron data for any empty fields
              var enrichFields = ["round", "tournament_category", "surface", "opponent_ranking", "opponent_country", "court"];
              enrichFields.forEach(function(f) {
                if ((!pLM[f] || pLM[f] === "") && lm[f] && lm[f] !== "") pLM[f] = lm[f];
              });
              // Apply TOURNAMENT_MAP if tournament name is raw
              if (pLM.tournament_name && pLM.tournament_name.includes(",")) {
                var mapped = lookupTournament(pLM.tournament_name);
                if (mapped) { pLM.tournament_name = mapped.name; pLM.tournament_category = mapped.cat; pLM.surface = mapped.surface; }
              }
              lm = pLM;
              skipLastMatchWrite = false; // Allow write to save enriched data
            } else if (pLM.round && !lm.round && pLM.opponent_name && lm.opponent_name && pLM.opponent_name.split(" ").pop() === lm.opponent_name.split(" ").pop()) {
              log("Existing lastMatch has round info, merging");
              lm.round = pLM.round;
              if (pLM.tournament_category && !lm.tournament_category) lm.tournament_category = pLM.tournament_category;
              if (pLM.opponent_ranking && !lm.opponent_ranking) lm.opponent_ranking = pLM.opponent_ranking;
              if (pLM.opponent_country && !lm.opponent_country) lm.opponent_country = pLM.opponent_country;
            }
          }
        } catch(e) {}
      }
    }
    steps.merge = "done";

    // Fetch opponent profile, win probability, and facts AFTER merge (so nm has opponent_id from manual data)
    // Smart: opponent profile only if opponent changed or missing
    var op = null;
    if (nm && (oppChanged || !exOpp)) {
      op = await fetchOppProfile(nm);
      steps.opp = op ? op.name : "skip";
    } else if (exOpp) {
      op = exOpp;
      steps.opp = op.name + " (cached)";
      log("Opponent unchanged (" + (op.name || "?") + "), skipping profile fetch");
    } else { steps.opp = "skip"; }

    // Smart: odds only every 6 hours, BUT always refresh when opponent changes
    var wp = null;
    if (nm && (!oddsFresh || oppChanged)) {
      wp = await fetchWinProb(nm);
      if (wp || !oddsFresh) await kv.set("fn:lastOddsCheck", String(now), { ex: 86400 });
      steps.odds = wp ? wp.fonseca + "%" : "skip";
    } else if (nm) {
      try { var exWp = await kv.get("fn:winProb"); if (exWp) wp = typeof exWp === "string" ? JSON.parse(exWp) : exWp; } catch(e){}
      steps.odds = wp ? wp.fonseca + "% (cached)" : "skip";
      log("Odds fresh (" + (wp ? wp.fonseca + "%" : "none") + "), next check in " + Math.round((H6 - (now - lastOddsTs)) / 60000) + "min");
    } else { steps.odds = "skip"; }

    // Gemini enrichment for nextMatch — fill gaps (official name, date, broadcast, court)
    if (nm && (!nm.date || !nm.tournament_category || !nm.court || (nm.tournament_name && nm.tournament_name.includes(",")))) {
      log("Enriching nextMatch via Gemini...");
      var enrichTxt = await geminiSearch(
        "Busque informações sobre a partida de tênis João Fonseca vs " + (nm.opponent_name || "adversário") +
        " no torneio " + (nm.tournament_name || "ATP") + " em 2026. " +
        "Responda APENAS JSON: {\"tournament_official_name\":\"nome oficial do torneio\",\"tournament_category\":\"Grand Slam ou Masters 1000 ou ATP 500 ou ATP 250\",\"surface\":\"Clay ou Hard ou Grass\",\"date\":\"YYYY-MM-DDTHH:MM:SSZ em UTC\",\"round\":\"rodada\",\"broadcast\":\"canais de transmissão no Brasil ou null\",\"city\":\"cidade\",\"court\":\"nome da quadra onde será jogada a partida\"}"
      );
      if (enrichTxt) {
        try {
          var cleaned = enrichTxt.replace(/```json|```/g, "").trim();
          var jsonMatch = cleaned.match(/\{[^}]+\}/);
          if (jsonMatch) {
            var enrich = JSON.parse(jsonMatch[0]);
            if (enrich) {
              if (enrich.tournament_official_name && enrich.tournament_official_name !== nm.tournament_name) {
                log("Gemini tournament name: " + enrich.tournament_official_name);
                nm.tournament_name = enrich.tournament_official_name;
              }
              if (!nm.date && enrich.date) nm.date = enrich.date;
              if (!nm.tournament_category && enrich.tournament_category) nm.tournament_category = enrich.tournament_category;
              if (!nm.surface && enrich.surface) nm.surface = enrich.surface;
              if (!nm.round && enrich.round) nm.round = translateRound(enrich.round) || enrich.round;
              if (enrich.broadcast && enrich.broadcast !== "null") nm.broadcast = enrich.broadcast;
              if (!nm.court && enrich.court && enrich.court !== "null") { nm.court = enrich.court; log("Gemini court: " + enrich.court); }
              steps.enrich = "ok";
            }
          }
        } catch(e) { log("Gemini enrich parse: " + e.message); steps.enrich = "error"; }
      }
    }

    // ===== GEMINI SWEEP: fill ALL remaining gaps in one call =====
    var gaps = [];
    if (!wiki || !wiki.ranking) gaps.push("ranking ATP atual do João Fonseca (número)");
    if (!wiki || wiki.wins === undefined) gaps.push("record de carreira singles do João Fonseca (wins-losses total, wins-losses em hard/clay/grass)");
    if (wiki && wiki.wins !== undefined && wiki.seasonWins === undefined) gaps.push("record da temporada 2026 do João Fonseca em singles (vitórias-derrotas apenas em 2026, campos seasonWins e seasonLosses)");
    if (!wiki || !wiki.prizeMoney) gaps.push("prize money total de carreira do João Fonseca em USD");
    if (!wiki || !wiki.titles) gaps.push("número de títulos ATP do João Fonseca");
    if (nm && !nm.date) gaps.push("data e horário UTC da partida " + (nm.opponent_name||"") + " vs Fonseca no " + (nm.tournament_name||"ATP") + " 2026");
    // Gemini sweep does NOT handle odds — unreliable source removed

    if (gaps.length > 0) {
      log("Gemini sweep: " + gaps.length + " gaps to fill");
      var sweepTxt = await geminiSearch(
        "Busque dados REAIS e ATUALIZADOS sobre o tenista João Fonseca (brasileiro, nascido 2006). Preciso de: " +
        gaps.join("; ") + ". " +
        "Responda APENAS JSON: {\"ranking\":NUMBER_OR_NULL,\"wins\":NUMBER_OR_NULL,\"losses\":NUMBER_OR_NULL,\"seasonWins\":NUMBER_OR_NULL,\"seasonLosses\":NUMBER_OR_NULL,\"surface\":{\"hard\":{\"w\":N,\"l\":N},\"clay\":{\"w\":N,\"l\":N},\"grass\":{\"w\":N,\"l\":N}},\"prizeMoney\":NUMBER_OR_NULL,\"titles\":NUMBER_OR_NULL,\"matchDate\":\"ISO_STRING_OR_NULL\"}"
      );
      if (sweepTxt) {
        try {
          var cleaned = sweepTxt.replace(/```json|```/g, "").trim();
          var jsonMatch = cleaned.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            var sweep = JSON.parse(jsonMatch[0]);
            if (sweep) {
              // Fill wiki gaps
              if (!wiki) wiki = {};
              if (!wiki.ranking && sweep.ranking) { wiki.ranking = sweep.ranking; log("Sweep: ranking #" + sweep.ranking); }
              if (wiki.wins === undefined && sweep.wins !== null && sweep.wins !== undefined) { wiki.wins = sweep.wins; wiki.losses = sweep.losses || 0; }
              if (wiki.seasonWins === undefined && sweep.seasonWins !== null && sweep.seasonWins !== undefined) { wiki.seasonWins = sweep.seasonWins; wiki.seasonLosses = sweep.seasonLosses || 0; log("Sweep: season " + sweep.seasonWins + "W-" + (sweep.seasonLosses||0) + "L"); }
              if (!wiki.prizeMoney && sweep.prizeMoney) wiki.prizeMoney = sweep.prizeMoney;
              if (!wiki.titles && sweep.titles) wiki.titles = sweep.titles;
              if (sweep.surface && (!wiki.surface || (!wiki.surface.hard.w && !wiki.surface.clay.w))) wiki.surface = sweep.surface;
              // Fill nextMatch date
              if (nm && !nm.date && sweep.matchDate) { nm.date = sweep.matchDate; log("Sweep: match date " + sweep.matchDate); }
              // Gemini odds REMOVED — unreliable source
              steps.sweep = gaps.length + " gaps filled";
            }
          }
        } catch(e) { log("Sweep parse error: " + e.message); steps.sweep = "error"; }
      }
    } else {
      steps.sweep = "no gaps";
    }

    var w = []; var T7=604800; var T2=172800;
    // Update opponent rankings from fresh ATP list before writing to KV
    if (rankingsLookup) {
      if (nm) { var oppLast = stripAccents((nm.opponent_name||"").split(" ").pop().toLowerCase()); if (rankingsLookup[oppLast]) nm.opponent_ranking = rankingsLookup[oppLast]; }
      if (lm) { var lmLast = stripAccents((lm.opponent_name||"").split(" ").pop().toLowerCase()); if (rankingsLookup[lmLast]) lm.opponent_ranking = rankingsLookup[lmLast]; }
    }
    // ALWAYS apply TOURNAMENT_MAP to ensure clean data regardless of source
    function applyTournamentMap(match) {
      if (!match || !match.tournament_name) return;
      var mapped = lookupTournament(match.tournament_name);
      if (mapped) {
        match.tournament_name = mapped.name;
        match.tournament_category = mapped.cat;
        match.surface = mapped.surface;
      }
      // ALWAYS apply broadcast from BROADCAST_MAP (auto-correct stale data)
      var bc = lookupBroadcast(match.tournament_name);
      if (bc) match.broadcast = bc;
      // ALWAYS translate round to Portuguese
      if (match.round) match.round = translateRound(match.round);
    }
    applyTournamentMap(lm);
    applyTournamentMap(nm);
    if (lm && !skipLastMatchWrite) w.push(kv.set("fn:lastMatch",JSON.stringify(lm),{ex:T7}));
    if (nm) w.push(kv.set("fn:nextMatch",JSON.stringify(nm),{ex:T7}));
if (form.length) {
      // Check manual lock before overwriting recentForm
      var recentFormLock = null;
      try { recentFormLock = await kv.get("fn:recentFormManualLock"); } catch(e) {}
      if (recentFormLock) {
        log("Manual lock active for recentForm, skipping update");
      } else {
      try {
        var ef = await kv.get("fn:recentForm");
        if (ef) {
          var old = typeof ef === "string" ? JSON.parse(ef) : ef;
          if (Array.isArray(old)) {
            var oldLookup = {};
            old.forEach(function(m){ var k = m.opponent_name + "|" + m.score; oldLookup[k] = m; });
            // Bidirectional merge: preserve best data from both old and new
            form.forEach(function(m){
              var k = m.opponent_name + "|" + m.score;
              var oldEntry = oldLookup[k];
              if (oldEntry) {
                if (!m.opponent_ranking && oldEntry.opponent_ranking) m.opponent_ranking = oldEntry.opponent_ranking;
                if (!m.date && oldEntry.date) m.date = oldEntry.date;
              }
            });
            var keys = new Set(form.map(function(m){ return m.opponent_name + "|" + m.score; }));
            old.forEach(function(m){
              var k = m.opponent_name + "|" + m.score;
              if (!keys.has(k)) { form.push(m); keys.add(k); }
            });
          }
        }
      } catch(e){}
      // Enrich ALL entries with rankings from top 100 list
      form.forEach(function(m) {
        if (!m.opponent_ranking && m.opponent_name) {
          var lastName = stripAccents(m.opponent_name.split(" ").pop().toLowerCase());
          if (rankingsLookup[lastName]) m.opponent_ranking = rankingsLookup[lastName];
        }
        // Apply TOURNAMENT_MAP to clean tournament names in recentForm
        if (m.tournament) {
          var mapped = lookupTournament(m.tournament);
          if (mapped) m.tournament = mapped.name;
        }
      });
      form.sort(function(a,b){ return new Date(b.date||0) - new Date(a.date||0); });
      // Remove ghost entries (empty score = stale SofaScore data)
      form = form.filter(function(f) { return f.score && f.score.length > 1; });
      form = form.slice(0,10);
      w.push(kv.set("fn:recentForm",JSON.stringify(form),{ex:T7}));
      }
    }
    if (ms) {
      var skipMs = false;
      if (lm && lm.opponent_name && ms.opponent_name && lm.opponent_name.split(" ").pop() !== ms.opponent_name.split(" ").pop()) {
        log("matchStats opponent (" + ms.opponent_name + ") differs from lastMatch (" + lm.opponent_name + "), skipping");
        skipMs = true;
      }
      if (!skipMs) w.push(kv.set("fn:matchStats",JSON.stringify(ms),{ex:T7}));
    } else if (lm) {
      // Only delete matchStats if it belongs to a DIFFERENT opponent (stale data)
      // If same opponent, keep existing stats even if API didn't return new ones
      try {
        var existingMs = await kv.get("fn:matchStats");
        if (existingMs) {
          var parsedMs = typeof existingMs === "string" ? JSON.parse(existingMs) : existingMs;
          if (parsedMs && parsedMs.opponent_name && lm.opponent_name &&
              parsedMs.opponent_name.split(" ").pop() !== lm.opponent_name.split(" ").pop()) {
            log("matchStats belongs to different opponent (" + parsedMs.opponent_name + " vs " + lm.opponent_name + "), clearing");
            await kv.del("fn:matchStats");
          } else {
            log("Keeping existing matchStats (API returned null but same opponent)");
          }
        }
      } catch(e) {}
    }
    if (wiki) {
      if (wiki.ranking) w.push(kv.set("fn:ranking",JSON.stringify({ranking:wiki.ranking,bestRanking:wiki.bestRanking||null,updatedAt:new Date().toISOString()}),{ex:T7}));
      if (wiki.prizeMoney) w.push(kv.set("fn:prizeMoney",JSON.stringify({amount:wiki.prizeMoney}),{ex:T7}));
      if (wiki.wins!==undefined) {
        var careerW = wiki.wins; var careerL = wiki.losses || 0;
        if (wiki.surface) {
          var surfW = (wiki.surface.hard?wiki.surface.hard.w:0) + (wiki.surface.clay?wiki.surface.clay.w:0) + (wiki.surface.grass?wiki.surface.grass.w:0);
          var surfL = (wiki.surface.hard?wiki.surface.hard.l:0) + (wiki.surface.clay?wiki.surface.clay.l:0) + (wiki.surface.grass?wiki.surface.grass.l:0);
          if (surfW > careerW) { careerW = surfW; careerL = surfL; }
        }
        var careerPct = (careerW+careerL)>0 ? Math.round(careerW/(careerW+careerL)*100) : 0;
        w.push(kv.set("fn:careerStats",JSON.stringify({wins:careerW,losses:careerL,winPct:careerPct,surface:wiki.surface||null,titles:wiki.titles||null}),{ex:T7}));
        var seW = wiki.seasonWins !== undefined ? wiki.seasonWins : wiki.wins;
        var seL = wiki.seasonLosses !== undefined ? wiki.seasonLosses : (wiki.losses || 0);
        var seasonPct = (seW+seL)>0 ? Math.round(seW/(seW+seL)*100) : 0;
        w.push(kv.set("fn:season",JSON.stringify({wins:seW,losses:seL,winPct:seasonPct}),{ex:T2}));
      }
    }
    if (op) w.push(kv.set("fn:opponentProfile",JSON.stringify(op),{ex:T2}));
    if (wp) w.push(kv.set("fn:winProb",JSON.stringify(wp),{ex:T2}));
    else if (nm) {
      // Clear stale/unreliable odds when no real odds source available
      try { var exWpCheck = await kv.get("fn:winProb"); if (exWpCheck) { var parsed = typeof exWpCheck === "string" ? JSON.parse(exWpCheck) : exWpCheck; if (parsed && (parsed.source === "gemini-odds" || parsed.source === "gemini-sweep")) { await kv.del("fn:winProb"); log("Cleared stale Gemini odds from KV"); } } } catch(e) {}
    }
    if (exRankingsList && exRankingsList.updatedAt && !rankingsListFresh) w.push(kv.set("fn:atpRankings",JSON.stringify(exRankingsList),{ex:T7}));
    w.push(kv.set("fn:cronLastRun",new Date().toISOString(),{ex:T7}));
    await Promise.all(w); steps.kv = w.length + " keys";

    var el = Date.now()-start; log("Done " + el + "ms");
    res.status(200).json({ok:true,elapsed:el+"ms",steps:steps});
  } catch(e) {
    log("FATAL: " + e.message);
    try{await kv.set("fn:cronLastRun","error:"+new Date().toISOString());}catch(_){}
    res.status(200).json({ok:false,error:e.message,elapsed:(Date.now()-start)+"ms",steps:steps});
  }
}
