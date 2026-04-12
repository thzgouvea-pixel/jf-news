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
  var gt = (match.groundType || tournament.groundType || "").toLowerCase();
  var surface = gt === "clay" ? "Clay" : (gt === "grass" ? "Grass" : "Hard");
  var tName = tournament.name || (tournament.uniqueTournament && tournament.uniqueTournament.name) || "";
  var tLowSurf = tName.toLowerCase();
  if (surface === "Hard" && ["monte carlo","roland garros","barcelona","madrid","roma","buenos aires","rio open","lyon","hamburg","gstaad","umag","bucharest","estoril","munich","bmw open","kitzbühel","bastad","geneva","marrakech"].some(function(c){return tLowSurf.includes(c);})) surface = "Clay";
  if (surface === "Hard" && ["wimbledon","halle","queens","queen's","eastbourne","mallorca","newport","s-hertogenbosch"].some(function(g){return tLowSurf.includes(g);})) surface = "Grass";
  var cat = ""; var tLow = tName.toLowerCase();
  if (["australian open","roland garros","french open","wimbledon","us open"].some(function(g){return tLow.includes(g);})) cat = "Grand Slam";
  else if (tLow.includes("1000") || ["monte carlo","madrid","roma","indian wells","miami","canadian","cincinnati","shanghai","paris"].some(function(m){return tLow.includes(m);})) cat = "Masters 1000";
  else if (tLow.includes("500") || ["rio open","barcelona","hamburg","halle","queens","queen's","washington","beijing","basel","vienna","rotterdam","acapulco","dubai","munich","bmw open"].some(function(t){return tLow.includes(t);})) cat = "ATP 500";
  else if (tLow.includes("250") || ["buenos aires","lyon","estoril","geneva","stuttgart","eastbourne","atlanta","winston-salem","chengdu","antwerp","stockholm","metz"].some(function(t){return tLow.includes(t);})) cat = "ATP 250";
  return { id: match.id, result: fW > oW ? "V" : "D", score: scoreStr, opponent_name: opp.shortName || opp.name || "Oponente", opponent_id: opp.id || null, opponent_country: opp.country ? opp.country.name : "", tournament_name: tName, tournament_category: cat, surface: surface, round: round.name || "", date: match.startTimestamp ? new Date(match.startTimestamp * 1000).toISOString() : null, startTimestamp: match.startTimestamp || null, court: match.courtName || (match.venue && match.venue.name) || "", isFonsecaHome: isFHome, finished: isFinished(match) };
}

// ===== PLAYER DATA: Gemini (primary) → Wikipedia (fallback) =====
async function fetchPlayerData() {
  log("Fetching player data...");

  // CAMADA 1: Gemini com google_search (primary)
  var gTxt = await geminiSearch(
    "Busque dados ATUALIZADOS de abril 2026 sobre o tenista brasileiro João Fonseca. " +
    "Preciso de: ranking ATP atual, career-high ranking, record de carreira em singles (vitórias-derrotas total), " +
    "record por superfície (hard, clay, grass), prize money total de carreira em USD, número de títulos ATP. " +
    "Responda APENAS JSON: {\"ranking\":NUMBER,\"bestRanking\":NUMBER,\"wins\":NUMBER,\"losses\":NUMBER," +
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
          log("Gemini player data: #" + result.ranking + " | " + (result.wins||0) + "W-" + (result.losses||0) + "L | $" + (result.prizeMoney||0));
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

async function scanMatches(deep) {
  log("Scanning matches...");
  var all = []; var seen = new Set();
  function addFiltered(data) { if (!data) return; var ev = data.events || data; if (!Array.isArray(ev)) { for (var k in data) { if (Array.isArray(data[k])) { ev = data[k]; break; } } } if (Array.isArray(ev)) ev.forEach(function(m) { if (isFonseca(m) && m.id && !seen.has(m.id)) { seen.add(m.id); all.push(m); } }); }

  // Date scan: 3 days back + 2 forward (normal), 45 days (deep)
  var backDays = deep ? 45 : 3;
  var fwdDays = deep ? 45 : 2;
  for (var d = -backDays; d <= fwdDays; d++) {
    var ds = new Date(Date.now() + d * 86400000).toISOString().split("T")[0];
    addFiltered(await sofaFetch("/v1/match/list?sport_slug=tennis&date=" + ds));
  }

  log(all.length + " matches"); return all;
}

async function fetchMatchStats(lm) {
  if (!lm || !lm.id) return null;
  var data = await sofaFetch("/v1/match/statistics?match_id=" + lm.id);
  if (!data || !Array.isArray(data)) return null;
  var ap = data.find(function(p) { return p.period === "ALL"; });
  if (!ap || !ap.groups) return null;
  var f = {}, o = {};
  ap.groups.forEach(function(g) { (g.statisticsItems || []).forEach(function(it) { var k = (it.key || "").toLowerCase().replace(/\s+/g, ""); var hv = it.homeValue !== undefined ? it.homeValue : (parseInt(it.home) || 0); var av = it.awayValue !== undefined ? it.awayValue : (parseInt(it.away) || 0); f[k] = lm.isFonsecaHome ? hv : av; o[k] = lm.isFonsecaHome ? av : hv; }); });
  return { fonseca: f, opponent: o, opponent_name: lm.opponent_name, opponent_country: lm.opponent_country, tournament: lm.tournament_name, result: lm.result, score: lm.score, date: lm.date };
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

  // Source 1: The Odds API
  var ok = process.env.ODDS_API_KEY;
  if (ok) {
    try {
      var r = await fetch("https://api.the-odds-api.com/v4/sports/tennis_atp_singles/odds/?apiKey=" + ok + "&regions=eu&markets=h2h&oddsFormat=decimal");
      if (r.ok) {
        var d = await r.json();
        if (Array.isArray(d)) {
          var g = d.find(function(x) { return [x.home_team||"",x.away_team||""].some(function(n){return n.toLowerCase().includes("fonseca");}); });
          if (g && g.bookmakers && g.bookmakers.length) {
            var mk = g.bookmakers[0].markets && g.bookmakers[0].markets.find(function(m){return m.key==="h2h";});
            if (mk && mk.outcomes) {
              var fo=null,oo=null;
              mk.outcomes.forEach(function(o){if(o.name.toLowerCase().includes("fonseca"))fo=o.price;else oo=o.price;});
              if(fo&&oo) { var iF=1/fo,iO=1/oo,tot=iF+iO; return { fonseca: Math.round((iF/tot)*100), opponent: Math.round((iO/tot)*100), opponent_name: nm.opponent_name, source: "odds-api", updatedAt: new Date().toISOString() }; }
            }
          }
        }
      }
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

  // Source 3: Gemini search for odds
  var gTxt = await geminiSearch("Quais são as odds de apostas para João Fonseca vs " + (nm.opponent_name || "adversário") + " no " + (nm.tournament_name || "ATP") + " 2026? Responda APENAS JSON: {\"fonseca_odds\":NUMBER,\"opponent_odds\":NUMBER}. Use odds decimais reais de casas de apostas.");
  if (gTxt) {
    try {
      var cleaned = gTxt.replace(/```json|```/g, "").trim();
      var jsonMatch = cleaned.match(/\{[^}]+\}/);
      if (jsonMatch) {
        var gOdds = JSON.parse(jsonMatch[0]);
        if (gOdds && gOdds.fonseca_odds && gOdds.opponent_odds) {
          var gfi = 1/gOdds.fonseca_odds, goi = 1/gOdds.opponent_odds, gt = gfi+goi;
          log("Gemini odds: Fonseca " + gOdds.fonseca_odds + " / " + (nm.opponent_name||"opp") + " " + gOdds.opponent_odds);
          return { fonseca: Math.round((gfi/gt)*100), opponent: Math.round((goi/gt)*100), opponent_name: nm.opponent_name, source: "gemini-odds", updatedAt: new Date().toISOString() };
        }
      }
    } catch(e) { log("Gemini odds parse: " + e.message); }
  }

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

async function fetchFacts(nm) {
  if (!nm||!nm.tournament_name) return null;
  try { var ef = await kv.get("fn:tournamentFacts"); if (ef) { var p = typeof ef==="string"?JSON.parse(ef):ef; if (p&&p.tournament===nm.tournament_name) return p; } } catch(e) {}
  var catInfo = nm.tournament_category ? " (" + nm.tournament_category + ")" : "";
  var txt = await geminiGenerate("Gere 5 curiosidades curtas (1 frase, máximo 60 caracteres cada) sobre o torneio de tênis " + nm.tournament_name + catInfo + ". Português brasileiro. APENAS JSON: [{\"text\":\"...\"}]");
  if (!txt) return null;
  try {
    var facts = JSON.parse(txt.replace(/```json|```/g,"").trim()); if (!Array.isArray(facts)) return null;
    return { tournament: nm.tournament_name, facts: facts.filter(function(f){return f&&f.text;}).slice(0,5), generatedAt: new Date().toISOString() };
  } catch(e) { log("Facts parse: " + e.message); return null; }
}

export default async function handler(req, res) {
  var start = Date.now(); var steps = {};
  try {
    var matches = await scanMatches(req.query && req.query.deep === "1");
    var NOW_TS = Math.floor(Date.now()/1000);
    var fin = matches.filter(function(m){return isFinished(m)&&isSingles(m);}).sort(function(a,b){return (b.startTimestamp||NOW_TS)-(a.startTimestamp||NOW_TS);});
    var upc = matches.filter(function(m){if(!isUpcoming(m)||!isSingles(m)) return false; var ex=extractMatch(m); if(ex.score&&ex.score.length>2) return false; return true;}).sort(function(a,b){return (a.startTimestamp||0)-(b.startTimestamp||0);});
    var lm = fin.length > 0 ? extractMatch(fin[0]) : null;
    var nm = upc.length > 0 ? extractMatch(upc[0]) : null;
    var form = fin.slice(0,10).map(function(m){var d=extractMatch(m);return{result:d.result,score:d.score,opponent_name:d.opponent_name,opponent_ranking:d.opponent_ranking||null,tournament:d.tournament_name,date:d.date};});
    steps.scan = matches.length + " matches";
    steps.last = lm ? lm.opponent_name : "none";
    steps.next = nm ? nm.opponent_name : "none";

    var wiki = null; var ms = null;

    // ===== SMART SCHEDULING: only fetch what's stale =====
    var H6 = 6 * 3600000; var H24 = 24 * 3600000; var D7 = 7 * H24;
    var now = Date.now();

    // Read existing KV timestamps in parallel
    var smartReads = await Promise.all([
      kv.get("fn:ranking"), kv.get("fn:opponentProfile"), kv.get("fn:tournamentFacts"),
      kv.get("fn:nextMatch"), kv.get("fn:lastOddsCheck"), kv.get("fn:careerStats"),
      kv.get("fn:prizeMoney"),
    ]);
    var exRanking = smartReads[0] ? (typeof smartReads[0] === "string" ? JSON.parse(smartReads[0]) : smartReads[0]) : null;
    var exOpp = smartReads[1] ? (typeof smartReads[1] === "string" ? JSON.parse(smartReads[1]) : smartReads[1]) : null;
    var exFacts = smartReads[2] ? (typeof smartReads[2] === "string" ? JSON.parse(smartReads[2]) : smartReads[2]) : null;
    var exNm = smartReads[3] ? (typeof smartReads[3] === "string" ? JSON.parse(smartReads[3]) : smartReads[3]) : null;
    var lastOddsTs = smartReads[4] ? parseInt(smartReads[4]) : 0;
    var exCareer = smartReads[5] ? (typeof smartReads[5] === "string" ? JSON.parse(smartReads[5]) : smartReads[5]) : null;
    var exPrize = smartReads[6] ? (typeof smartReads[6] === "string" ? JSON.parse(smartReads[6]) : smartReads[6]) : null;

    // Detect what changed
    var oppChanged = nm && (!exNm || nm.opponent_name !== exNm.opponent_name);
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
    if (!nm) {
      // Check manual lock before deleting nextMatch
      var nextMatchLock = null;
      try { nextMatchLock = await kv.get("fn:nextMatchManualLock"); } catch(e) {}
      if (nextMatchLock) {
        log("Manual lock active for nextMatch, skipping deletion");
      } else {
        try { await kv.del("fn:nextMatch"); await kv.del("fn:winProb"); } catch(e){}
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
              lm = pLM;
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

    // Smart: odds only every 6 hours (4x/day = 120/month, within free 500 limit)
    var wp = null;
    if (nm && !oddsFresh) {
      wp = await fetchWinProb(nm);
      if (wp || !oddsFresh) await kv.set("fn:lastOddsCheck", String(now), { ex: 86400 });
      steps.odds = wp ? wp.fonseca + "%" : "skip";
    } else if (nm) {
      try { var exWp = await kv.get("fn:winProb"); if (exWp) wp = typeof exWp === "string" ? JSON.parse(exWp) : exWp; } catch(e){}
      steps.odds = wp ? wp.fonseca + "% (cached)" : "skip";
      log("Odds fresh (" + (wp ? wp.fonseca + "%" : "none") + "), next check in " + Math.round((H6 - (now - lastOddsTs)) / 60000) + "min");
    } else { steps.odds = "skip"; }

    // Smart: facts only if tournament changed
    var tf = null;
    if (nm && (!exFacts || exFacts.tournament !== (nm.tournament_name || ""))) {
      tf = await fetchFacts(nm);
      steps.facts = tf ? tf.facts.length + "" : "skip";
    } else if (exFacts) {
      tf = exFacts;
      steps.facts = tf.facts ? tf.facts.length + " (cached)" : "skip";
      log("Tournament unchanged, skipping facts");
    } else { steps.facts = "skip"; }

    // Gemini enrichment for nextMatch — fill gaps (official name, date, broadcast)
    if (nm && (!nm.date || !nm.tournament_category || (nm.tournament_name && nm.tournament_name.includes(",")))) {
      log("Enriching nextMatch via Gemini...");
      var enrichTxt = await geminiSearch(
        "Busque informações sobre a partida de tênis João Fonseca vs " + (nm.opponent_name || "adversário") +
        " no torneio " + (nm.tournament_name || "ATP") + " em 2026. " +
        "Responda APENAS JSON: {\"tournament_official_name\":\"nome oficial do torneio\",\"tournament_category\":\"Grand Slam ou Masters 1000 ou ATP 500 ou ATP 250\",\"surface\":\"Clay ou Hard ou Grass\",\"date\":\"YYYY-MM-DDTHH:MM:SSZ em UTC\",\"round\":\"rodada\",\"broadcast\":\"canal de transmissão no Brasil ou null\",\"city\":\"cidade\"}"
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
              if (!nm.round && enrich.round) nm.round = enrich.round;
              if (enrich.broadcast && enrich.broadcast !== "null") nm.broadcast = enrich.broadcast;
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
    if (!wiki || !wiki.prizeMoney) gaps.push("prize money total de carreira do João Fonseca em USD");
    if (!wiki || !wiki.titles) gaps.push("número de títulos ATP do João Fonseca");
    if (nm && !nm.date) gaps.push("data e horário UTC da partida " + (nm.opponent_name||"") + " vs Fonseca no " + (nm.tournament_name||"ATP") + " 2026");
    if (nm && !wp) gaps.push("odds de apostas para Fonseca vs " + (nm.opponent_name||"adversário") + " (odds decimais)");

    if (gaps.length > 0) {
      log("Gemini sweep: " + gaps.length + " gaps to fill");
      var sweepTxt = await geminiSearch(
        "Busque dados REAIS e ATUALIZADOS sobre o tenista João Fonseca (brasileiro, nascido 2006). Preciso de: " +
        gaps.join("; ") + ". " +
        "Responda APENAS JSON: {\"ranking\":NUMBER_OR_NULL,\"wins\":NUMBER_OR_NULL,\"losses\":NUMBER_OR_NULL,\"surface\":{\"hard\":{\"w\":N,\"l\":N},\"clay\":{\"w\":N,\"l\":N},\"grass\":{\"w\":N,\"l\":N}},\"prizeMoney\":NUMBER_OR_NULL,\"titles\":NUMBER_OR_NULL,\"matchDate\":\"ISO_STRING_OR_NULL\",\"fonseca_odds\":NUMBER_OR_NULL,\"opponent_odds\":NUMBER_OR_NULL}"
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
              if (!wiki.prizeMoney && sweep.prizeMoney) wiki.prizeMoney = sweep.prizeMoney;
              if (!wiki.titles && sweep.titles) wiki.titles = sweep.titles;
              if (sweep.surface && (!wiki.surface || (!wiki.surface.hard.w && !wiki.surface.clay.w))) wiki.surface = sweep.surface;
              // Fill nextMatch date
              if (nm && !nm.date && sweep.matchDate) { nm.date = sweep.matchDate; log("Sweep: match date " + sweep.matchDate); }
              // Fill odds
              if (!wp && sweep.fonseca_odds && sweep.opponent_odds && nm) {
                var sfi = 1/sweep.fonseca_odds, soi = 1/sweep.opponent_odds, st = sfi+soi;
                wp = { fonseca: Math.round((sfi/st)*100), opponent: Math.round((soi/st)*100), opponent_name: nm.opponent_name, source: "gemini-sweep", updatedAt: new Date().toISOString() };
                log("Sweep: odds " + wp.fonseca + "% / " + wp.opponent + "%");
              }
              steps.sweep = gaps.length + " gaps filled";
            }
          }
        } catch(e) { log("Sweep parse error: " + e.message); steps.sweep = "error"; }
      }
    } else {
      steps.sweep = "no gaps";
    }

    var w = []; var T7=604800; var T2=172800;
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
            form.forEach(function(m){ var k = m.opponent_name + "|" + m.score; var oldEntry = oldLookup[k]; if (oldEntry && !m.opponent_ranking && oldEntry.opponent_ranking) m.opponent_ranking = oldEntry.opponent_ranking; });
            var keys = new Set(form.map(function(m){ return m.opponent_name + "|" + m.score; }));
            old.forEach(function(m){
              var k = m.opponent_name + "|" + m.score;
              if (!keys.has(k)) { form.push(m); keys.add(k); }
            });
            var nowISO = new Date().toISOString();
            form.sort(function(a,b){ return new Date(b.date||nowISO) - new Date(a.date||nowISO); });
            form = form.slice(0,10);
          }
        }
      } catch(e){}
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
        var seasonPct = (wiki.wins+(wiki.losses||0))>0 ? Math.round(wiki.wins/(wiki.wins+(wiki.losses||0))*100) : 0;
        w.push(kv.set("fn:season",JSON.stringify({wins:wiki.wins,losses:wiki.losses||0,winPct:seasonPct}),{ex:T2}));
        w.push(kv.set("fn:careerStats",JSON.stringify({wins:careerW,losses:careerL,winPct:careerPct,surface:wiki.surface||null,titles:wiki.titles||null}),{ex:T7}));
      }
    }
    if (op) w.push(kv.set("fn:opponentProfile",JSON.stringify(op),{ex:T2}));
    if (wp) w.push(kv.set("fn:winProb",JSON.stringify(wp),{ex:T2}));
    if (tf) w.push(kv.set("fn:tournamentFacts",JSON.stringify(tf),{ex:T2}));
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
