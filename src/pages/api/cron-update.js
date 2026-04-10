// ===== FONSECA NEWS — CRON UPDATE v12 =====
// FAST: max ~6 API calls, target <15 seconds
// Wikipedia for ranking, SofaScore team events for matches

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

function isFinished(m) { var s = m.status || {}; return s.type === "finished" || s.isFinished === true; }
function isUpcoming(m) { var s = m.status || {}; var t = (s.type || "").toLowerCase(); return t === "notstarted" || t === "not_started" || (!s.isFinished && !s.isStarted); }
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
  var cat = ""; var tLow = tName.toLowerCase();
  if (["australian open","roland garros","french open","wimbledon","us open"].some(function(g){return tLow.includes(g);})) cat = "Grand Slam";
  else if (tLow.includes("1000") || ["monte carlo","madrid","roma","indian wells","miami","canadian","cincinnati","shanghai","paris"].some(function(m){return tLow.includes(m);})) cat = "Masters 1000";
  else if (tLow.includes("500")) cat = "ATP 500"; else if (tLow.includes("250")) cat = "ATP 250";
  return { id: match.id, result: fW > oW ? "V" : "D", score: scoreStr, opponent_name: opp.shortName || opp.name || "Oponente", opponent_id: opp.id || null, opponent_country: opp.country ? opp.country.name : "", tournament_name: tName, tournament_category: cat, surface: surface, round: round.name || "", date: match.startTimestamp ? new Date(match.startTimestamp * 1000).toISOString() : null, startTimestamp: match.startTimestamp || null, court: match.courtName || (match.venue && match.venue.name) || "", isFonsecaHome: isFHome, finished: isFinished(match) };
}

async function fetchRankingWikipedia() {
  log("Wikipedia ranking...");
  try {
    var res = await fetch("https://en.wikipedia.org/w/api.php?action=parse&page=Jo%C3%A3o_Fonseca_(tennis)&prop=wikitext&format=json&section=0", { headers: { "User-Agent": "FonsecaNews/1.0" } });
    if (!res.ok) return null;
    var data = await res.json();
    var text = data && data.parse && data.parse.wikitext && data.parse.wikitext["*"];
    if (!text) return null;
    var result = {};

    // Helper: extract W-L from "16–11" or "{{tennis record|wins=16|losses=11}}"
    function extractWL(field) {
      var pattern1 = new RegExp("\\|\\s*" + field + "\\s*=\\s*\\{\\{[^}]*wins\\s*=\\s*(\\d+)\\s*\\|\\s*losses\\s*=\\s*(\\d+)", "i");
      var pattern2 = new RegExp("\\|\\s*" + field + "\\s*=\\s*(\\d+)\\s*[–\\-]\\s*(\\d+)", "i");
      var m = text.match(pattern1) || text.match(pattern2);
      if (m) return { w: parseInt(m[1]), l: parseInt(m[2]) };
      return null;
    }

    // Overall record
    var overall = extractWL("singlesrecord");
    if (overall) { result.wins = overall.w; result.losses = overall.l; }

    // Surface records
    var hard = extractWL("singlesrecord_hard");
    var clay = extractWL("singlesrecord_clay");
    var grass = extractWL("singlesrecord_grass");
    if (hard || clay || grass) {
      result.surface = {
        hard: hard || { w: 0, l: 0 },
        clay: clay || { w: 0, l: 0 },
        grass: grass || { w: 0, l: 0 },
      };
    }

    // Ranking
    var rm = text.match(/\|\s*current_ranking\s*=\s*(?:No\.\s*)?(\d+)/i); if (rm) result.ranking = parseInt(rm[1]);
    var hm = text.match(/\|\s*highest_ranking\s*=\s*(?:No\.\s*)?(\d+)/i); if (hm) result.bestRanking = parseInt(hm[1]);

    // Prize money
    var pm = text.match(/\|\s*prize\s*=\s*\$?([\d,]+)/i); if (pm) result.prizeMoney = parseInt(pm[1].replace(/,/g, ""));

    // Titles
    var tm = text.match(/\|\s*titles\s*=\s*(\d+)/i); if (tm) result.titles = parseInt(tm[1]);

    log("Ranking: #" + (result.ranking || "?") + " | Surface: " + (result.surface ? "yes" : "no"));
    return result;
  } catch (e) { log("Wikipedia error: " + e.message); return null; }
}

async function scanMatches() {
  log("Scanning matches...");
  var all = []; var seen = new Set();
  function add(data) { if (!data) return; var ev = data.events || data; if (!Array.isArray(ev)) { for (var k in data) { if (Array.isArray(data[k])) { ev = data[k]; break; } } } if (!Array.isArray(ev)) return; ev.forEach(function(m) { if (m.id && !seen.has(m.id)) { seen.add(m.id); all.push(m); } }); }
  add(await sofaFetch("/v1/team/events/last/0?team_id=" + FONSECA_TEAM_ID));
  add(await sofaFetch("/v1/team/events/next/0?team_id=" + FONSECA_TEAM_ID));
  if (all.length === 0) { log("Fallback: today ± 1 day"); for (var d = -1; d <= 1; d++) { var ds = new Date(Date.now() + d * 86400000).toISOString().split("T")[0]; var dd = await sofaFetch("/v1/match/list?sport_slug=tennis&date=" + ds); if (dd) { var ev = dd.events || dd; if (!Array.isArray(ev)) { for (var k in dd) { if (Array.isArray(dd[k])) { ev = dd[k]; break; } } } if (Array.isArray(ev)) ev.forEach(function(m) { if (isFonseca(m) && m.id && !seen.has(m.id)) { seen.add(m.id); all.push(m); } }); } } }
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
  if (!nm || !nm.opponent_id) return null;
  var ck = "fn:oppCache:" + nm.opponent_id;
  try { var c = await kv.get(ck); if (c) { var p = typeof c === "string" ? JSON.parse(c) : c; if (p && p.name) return p; } } catch(e) {}
  var data = await sofaFetch("/v1/team/" + nm.opponent_id);
  if (!data || !data.team) return null;
  var t = data.team; var pr = { name: t.shortName || t.name, country: t.country ? t.country.name : nm.opponent_country, ranking: t.ranking || null, age: null, height: null, hand: null };
  if (t.playerTeamInfo) { if (t.playerTeamInfo.birthDateTimestamp) pr.age = Math.floor((Date.now() - t.playerTeamInfo.birthDateTimestamp * 1000) / (365.25*24*3600000)); if (t.playerTeamInfo.height) pr.height = (t.playerTeamInfo.height / 100).toFixed(2) + "m"; if (t.playerTeamInfo.plays) pr.hand = t.playerTeamInfo.plays === "right-handed" ? "Destro" : "Canhoto"; }
  try { await kv.set(ck, JSON.stringify(pr), { ex: 172800 }); } catch(e) {}
  return pr;
}

async function fetchWinProb(nm) {
  if (!nm) return null; var ok = process.env.ODDS_API_KEY; if (!ok) return null;
  try { var r = await fetch("https://api.the-odds-api.com/v4/sports/tennis_atp_singles/odds/?apiKey=" + ok + "&regions=eu&markets=h2h&oddsFormat=decimal"); if (!r.ok) return null; var d = await r.json(); if (!Array.isArray(d)) return null; var g = d.find(function(x) { return [x.home_team||"",x.away_team||""].some(function(n){return n.toLowerCase().includes("fonseca");}); }); if (!g||!g.bookmakers||!g.bookmakers.length) return null; var mk = g.bookmakers[0].markets && g.bookmakers[0].markets.find(function(m){return m.key==="h2h";}); if (!mk||!mk.outcomes) return null; var fo=null,oo=null; mk.outcomes.forEach(function(o){if(o.name.toLowerCase().includes("fonseca"))fo=o.price;else oo=o.price;}); if(!fo||!oo) return null; var iF=1/fo,iO=1/oo,tot=iF+iO; return { fonseca: Math.round((iF/tot)*100), opponent: Math.round((iO/tot)*100), opponent_name: nm.opponent_name, source: "odds-api", updatedAt: new Date().toISOString() }; } catch(e) { return null; }
}

async function fetchFacts(nm) {
  if (!nm||!nm.tournament_name) return null; var gk = process.env.GEMINI_API_KEY; if (!gk) return null;
  try { var ef = await kv.get("fn:tournamentFacts"); if (ef) { var p = typeof ef==="string"?JSON.parse(ef):ef; if (p&&p.tournament===nm.tournament_name) return p; } } catch(e) {}
  try {
    var prompt = "Gere 5 curiosidades curtas (1 frase, máximo 60 caracteres cada) sobre o torneio de tênis " + nm.tournament_name + ". Português brasileiro. APENAS JSON: [{\"text\":\"...\"}]";
    var r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + gk, { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{temperature:0.7,maxOutputTokens:300}}) });
    if (!r.ok) return null; var d = await r.json(); var t = d.candidates&&d.candidates[0]&&d.candidates[0].content&&d.candidates[0].content.parts&&d.candidates[0].content.parts[0]&&d.candidates[0].content.parts[0].text; if (!t) return null;
    var facts = JSON.parse(t.replace(/```json|```/g,"").trim()); if (!Array.isArray(facts)) return null;
    return { tournament: nm.tournament_name, facts: facts.filter(function(f){return f&&f.text;}).slice(0,5), generatedAt: new Date().toISOString() };
  } catch(e) { log("Gemini: " + e.message); return null; }
}

export default async function handler(req, res) {
  var start = Date.now(); var steps = {};
  try {
    var matches = await scanMatches();
    var fin = matches.filter(isFinished).sort(function(a,b){return (b.startTimestamp||0)-(a.startTimestamp||0);});
    var upc = matches.filter(isUpcoming).sort(function(a,b){return (a.startTimestamp||0)-(b.startTimestamp||0);});
    var lm = fin.length > 0 ? extractMatch(fin[0]) : null;
    var nm = upc.length > 0 ? extractMatch(upc[0]) : null;
    var form = fin.slice(0,10).map(function(m){var d=extractMatch(m);return{result:d.result,score:d.score,opponent_name:d.opponent_name,tournament:d.tournament_name,date:d.date};});
    steps.scan = matches.length + " matches";
    steps.last = lm ? lm.opponent_name : "none";
    steps.next = nm ? nm.opponent_name : "none";

    var wiki = await fetchRankingWikipedia(); steps.ranking = wiki&&wiki.ranking ? "#"+wiki.ranking : "skip";
    var ms = lm ? await fetchMatchStats(lm) : null; steps.stats = ms ? "ok" : "skip";
    var op = nm ? await fetchOppProfile(nm) : null; steps.opp = op ? op.name : "skip";
    var wp = nm ? await fetchWinProb(nm) : null; steps.odds = wp ? wp.fonseca+"%" : "skip";
    var tf = nm ? await fetchFacts(nm) : null; steps.facts = tf ? tf.facts.length+"" : "skip";

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
        var fields = ["date","round","surface","court","opponent_ranking","opponent_country","opponent_id","tournament_category","startTimestamp"];
        fields.forEach(function(f) {
          if ((!newData[f] || newData[f] === "" || newData[f] === "Hard") && old[f] && old[f] !== "") {
            newData[f] = old[f];
          }
        });
      } catch(e) { log("Merge error: " + e.message); }
      return newData;
    }

    if (nm) nm = await mergeWithKV("fn:nextMatch", nm);
    if (lm) lm = await mergeWithKV("fn:lastMatch", lm);
    steps.merge = "done";

    var w = []; var T7=604800; var T2=172800;
    if (lm) w.push(kv.set("fn:lastMatch",JSON.stringify(lm),{ex:T7}));
    if (nm) w.push(kv.set("fn:nextMatch",JSON.stringify(nm),{ex:T7}));
    if (form.length) w.push(kv.set("fn:recentForm",JSON.stringify(form),{ex:T7}));
    if (ms) w.push(kv.set("fn:matchStats",JSON.stringify(ms),{ex:T7}));
    if (wiki) {
      if (wiki.ranking) w.push(kv.set("fn:ranking",JSON.stringify({ranking:wiki.ranking,bestRanking:wiki.bestRanking||null,updatedAt:new Date().toISOString()}),{ex:T2}));
      if (wiki.prizeMoney) w.push(kv.set("fn:prizeMoney",JSON.stringify({amount:wiki.prizeMoney}),{ex:T7}));
      if (wiki.wins!==undefined) { var pct=(wiki.wins+wiki.losses)>0?Math.round(wiki.wins/(wiki.wins+wiki.losses)*100):0; w.push(kv.set("fn:season",JSON.stringify({wins:wiki.wins,losses:wiki.losses,winPct:pct}),{ex:T2})); w.push(kv.set("fn:careerStats",JSON.stringify({wins:wiki.wins,losses:wiki.losses,winPct:pct,surface:wiki.surface||null,titles:wiki.titles||null}),{ex:T7})); }
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
