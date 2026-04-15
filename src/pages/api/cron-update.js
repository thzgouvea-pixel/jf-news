// ===== FONSECA NEWS — CRON UPDATE v17 (REWRITE) =====
// Architecture: SofaScore (primary) → Gemini (backup only) → Placeholder (visible error)
// Flow: DISCOVER → CLASSIFY → ENRICH → VALIDATE → WRITE
// Target: < 50s execution, ~8 API calls per run

import { kv } from "@vercel/kv";
import {
  FONSECA_TEAM_ID, sofaFetch, isFonseca, isSingles, isFinished, isUpcoming,
  extractMatch, parseMatchStats, enrichMatch, buildRankingsLookup, applyRanking,
  lookupTournament, lookupBroadcast, translateRound, stripAccents,
  NEXT_ROUND, ATP_CALENDAR_2026, log as _log,
} from "../../lib/sofascore.js";

function log(msg) { _log("cron", msg); }

// ===== GEMINI (backup only) =====
async function geminiSearch(prompt) {
  var gk = process.env.GEMINI_API_KEY;
  if (!gk) return null;
  try {
    var r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + gk, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        tools: [{ google_search: {} }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 4096 }
      })
    });
    if (r.ok) {
      var d = await r.json();
      var parts = d.candidates && d.candidates[0] && d.candidates[0].content && d.candidates[0].content.parts;
      if (parts) {
        var txt = "";
        parts.forEach(function (p) { if (p.text && !p.thought) txt += p.text; });
        if (txt) return txt;
      }
    }
  } catch (e) { log("Gemini error: " + e.message); }
  return null;
}

function parseGeminiJSON(txt) {
  if (!txt) return null;
  try {
    var cleaned = txt.replace(/```json|```/g, "").trim();
    var match = cleaned.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
  } catch (e) { log("Gemini parse error: " + e.message); }
  return null;
}

// ===== PHASE 1: DISCOVER =====
// PRIMARY: date scan (always works on RapidAPI)
// The team/near-events and team/events endpoints return 404 on sofascore6.p.rapidapi.com
async function discoverMatches() {
  log("DISCOVER: date scan -3 to +7 days...");
  var results = { upcoming: [], finished: [] };
  var seen = new Set();

  // Date scan: -3 days back, +7 days forward
  for (var d = -3; d <= 7; d++) {
    var ds = new Date(Date.now() + d * 86400000).toISOString().split("T")[0];
    var dayData = await sofaFetch("/v1/match/list?sport_slug=tennis&date=" + ds);
    if (!dayData) continue;
    var ev = dayData.events || (Array.isArray(dayData) ? dayData : []);
    if (!Array.isArray(ev)) { for (var k in dayData) { if (Array.isArray(dayData[k])) { ev = dayData[k]; break; } } }
    ev.forEach(function (m) {
      if (!m || !m.id || seen.has(m.id)) return;
      if (!isFonseca(m) || !isSingles(m)) return;
      seen.add(m.id);
      if (isFinished(m)) results.finished.push(m);
      else if (isUpcoming(m)) results.upcoming.push(m);
    });
  }
  log("scan: " + results.finished.length + " fin, " + results.upcoming.length + " upc (" + seen.size + " total)");

  // KV CROSS-REFERENCE: detect stale "upcoming" matches that already finished
  // SofaScore RapidAPI can be slow to update status — a match might show as "upcoming"
  // even after it finished. Check against KV lastMatch to catch this.
  try {
    var kvLM = await kv.get("fn:lastMatch");
    if (kvLM) {
      var parsedLM = typeof kvLM === "string" ? JSON.parse(kvLM) : kvLM;
      if (parsedLM && parsedLM.finished && parsedLM.opponent_name) {
        var kvOppLast = stripAccents(parsedLM.opponent_name.split(" ").pop().toLowerCase());
        var kvTournament = (parsedLM.tournament_name || "").toLowerCase();
        results.upcoming = results.upcoming.filter(function (m) {
          var ex = extractMatch(m);
          var mOppLast = stripAccents(ex.opponent_name.split(" ").pop().toLowerCase());
          var mTourn = (ex.tournament_name || "").toLowerCase();
          if (mOppLast === kvOppLast && mTourn.includes(kvTournament.split(" ")[0])) {
            log("stale upcoming: " + ex.opponent_name + " (already finished in KV)");
            // Move to finished if not already there
            if (!results.finished.some(function(f) { return f.id === m.id; })) {
              results.finished.push(m);
            }
            return false;
          }
          return true;
        });
        // Also: if KV lastMatch is newer than any scanned finished match, inject it
        if (parsedLM.id && !seen.has(parsedLM.id)) {
          var kvDate = parsedLM.date ? new Date(parsedLM.date).getTime() : 0;
          var scanLatest = results.finished.length > 0 ? (results.finished[0].startTimestamp || 0) * 1000 : 0;
          if (kvDate > scanLatest) {
            log("KV lastMatch is newer than scan (" + parsedLM.opponent_name + ")");
          }
        }
      }
    }
  } catch (e) { log("KV cross-ref error: " + e.message); }

  // Sort: finished by most recent, upcoming by soonest
  var NOW_TS = Math.floor(Date.now() / 1000);
  function getTs(m) { return m.startTimestamp || m.timestamp || 0; }
  results.finished.sort(function (a, b) { return (getTs(b) || NOW_TS) - (getTs(a) || NOW_TS); });
  results.upcoming.sort(function (a, b) { return (getTs(a) || 0) - (getTs(b) || 0); });

  // Filter out "upcoming" that already have scores (SofaScore status lag)
  results.upcoming = results.upcoming.filter(function (m) {
    var ex = extractMatch(m);
    return !(ex.score && ex.score.length > 2);
  });

  return results;
}

// ===== PHASE 2: ENRICH NEXT MATCH =====
async function enrichNextMatch(nm) {
  if (!nm || !nm.id) return { nm: nm, h2h: null, pregameForm: null };

  // a) Event detail — court, confirmed time, round
  // Correct RapidAPI path: /v1/match/details?match_id=ID
  if (!nm.court || !nm.startTimestamp || !nm.round) {
    var detail = await sofaFetch("/v1/match/details?match_id=" + nm.id);
    if (detail) {
      var ev = detail.event || detail;
      if (!nm.court && ev.courtName) nm.court = ev.courtName;
      if (!nm.court && ev.venue) nm.court = ev.venue.name || "";
      // SofaScore RapidAPI uses "timestamp" not "startTimestamp"
      var ts = ev.startTimestamp || ev.timestamp || null;
      if (!nm.startTimestamp && ts) {
        nm.startTimestamp = ts;
        nm.date = new Date(ts * 1000).toISOString();
      }
      // SofaScore RapidAPI uses "round" not "roundInfo"
      var roundObj = ev.roundInfo || ev.round || null;
      if (!nm.round && roundObj && roundObj.name) {
        nm.round = translateRound(roundObj.name);
      }
      // Rankings come from team objects
      if (!nm.opponent_ranking) {
        var oppTeam = nm.isFonsecaHome ? ev.awayTeam : ev.homeTeam;
        if (oppTeam && oppTeam.ranking) nm.opponent_ranking = oppTeam.ranking;
      }
      log("match details: court=" + (nm.court || "—") + " round=" + (nm.round || "—") + " ts=" + (nm.startTimestamp || "—"));
    } else {
      log("match details: no data for id=" + nm.id);
    }
  }

  // b) H2H — NOT available on sofascore6 RapidAPI wrapper
  // Will be implemented via Gemini or match history in future
  var h2h = null;

  // c) Pregame form — NOT available on sofascore6 RapidAPI wrapper
  var pregameForm = null;

  return { nm: nm, h2h: h2h, pregameForm: pregameForm };
}

// ===== PHASE 3: OPPONENT PROFILE =====
async function fetchOpponentProfile(nm, existingProfile) {
  if (!nm || !nm.opponent_name || nm.opponent_name === "A definir") return existingProfile || null;

  // Check if cached profile matches current opponent
  if (existingProfile && existingProfile.name) {
    var exLast = stripAccents(existingProfile.name.split(" ").pop().toLowerCase());
    var nmLast = stripAccents(nm.opponent_name.split(" ").pop().toLowerCase());
    if (exLast === nmLast) {
      log("opponent: cached (" + existingProfile.name + ")");
      return existingProfile;
    }
  }

  // SofaScore team API (1 API call)
  if (nm.opponent_id) {
    var data = await sofaFetch("/v1/team/" + nm.opponent_id);
    if (data && data.team) {
      var t = data.team;
      var pr = {
        name: t.shortName || t.name,
        country: t.country ? t.country.name : (nm.opponent_country || ""),
        ranking: t.ranking || nm.opponent_ranking || null,
        age: null, height: null, hand: null, titles: null, style: null, careerHigh: null,
      };
      if (t.playerTeamInfo) {
        if (t.playerTeamInfo.birthDateTimestamp) pr.age = Math.floor((Date.now() - t.playerTeamInfo.birthDateTimestamp * 1000) / (365.25 * 24 * 3600000));
        if (t.playerTeamInfo.height) pr.height = (t.playerTeamInfo.height / 100).toFixed(2) + "m";
        if (t.playerTeamInfo.plays) pr.hand = t.playerTeamInfo.plays === "right-handed" ? "Destro" : "Canhoto";
      }

      // Gemini enrichment for style (only if SofaScore worked)
      var gTxt = await geminiSearch(
        "Tenista " + (pr.name || nm.opponent_name) + ": estilo de jogo breve em português, títulos ATP, career-high ranking. " +
        "APENAS JSON: {\"style\":\"descrição breve\",\"titles\":NUMBER_OR_NULL,\"careerHigh\":NUMBER_OR_NULL}"
      );
      var gData = parseGeminiJSON(gTxt);
      if (gData) {
        if (gData.style) pr.style = gData.style;
        if (gData.titles) pr.titles = gData.titles;
        if (gData.careerHigh) pr.careerHigh = gData.careerHigh;
      }

      log("opponent: SofaScore (" + pr.name + " #" + (pr.ranking || "?") + ")");
      try { await kv.set("fn:oppCache:" + nm.opponent_id, JSON.stringify(pr), { ex: 172800 }); } catch (e) { }
      return pr;
    }
  }

  // Gemini full fallback
  log("opponent: Gemini fallback for " + nm.opponent_name);
  var gTxt2 = await geminiSearch(
    "Tenista " + nm.opponent_name + ". APENAS JSON: {\"name\":\"nome curto\",\"country\":\"país\",\"ranking\":N," +
    "\"age\":N,\"height\":\"X.XXm\",\"hand\":\"Destro ou Canhoto\",\"titles\":N,\"style\":\"breve em português\",\"careerHigh\":N}"
  );
  var gProfile = parseGeminiJSON(gTxt2);
  if (gProfile && gProfile.name) {
    gProfile.ranking = gProfile.ranking || nm.opponent_ranking || null;
    gProfile.country = gProfile.country || nm.opponent_country || "";
    return gProfile;
  }
  return null;
}

// ===== PHASE 4: WIN PROBABILITY =====
async function fetchWinProb(nm) {
  if (!nm || !nm.opponent_name || nm.opponent_name === "A definir") return null;

  // Source 1: The Odds API
  var ok = process.env.ODDS_API_KEY;
  if (ok) {
    try {
      var sportsRes = await fetch("https://api.the-odds-api.com/v4/sports/?apiKey=" + ok);
      var sportKeys = [];
      if (sportsRes.ok) {
        var sports = await sportsRes.json();
        sportKeys = sports.filter(function (s) { return s.key && s.key.startsWith("tennis_atp") && s.active; }).map(function (s) { return s.key; });
      }
      if (sportKeys.length === 0) sportKeys = ["tennis_atp_singles"];

      for (var si = 0; si < sportKeys.length; si++) {
        var r = await fetch("https://api.the-odds-api.com/v4/sports/" + sportKeys[si] + "/odds/?apiKey=" + ok + "&regions=eu&markets=h2h&oddsFormat=decimal");
        if (!r.ok) continue;
        var d = await r.json();
        if (!Array.isArray(d)) continue;
        var g = d.find(function (x) { return [x.home_team || "", x.away_team || ""].some(function (n) { return n.toLowerCase().includes("fonseca"); }); });
        if (!g || !g.bookmakers || !g.bookmakers.length) continue;

        var fOdds = [], oOdds = [];
        g.bookmakers.forEach(function (bk) {
          var mk = bk.markets && bk.markets.find(function (m) { return m.key === "h2h"; });
          if (mk && mk.outcomes) mk.outcomes.forEach(function (o) {
            if (o.name.toLowerCase().includes("fonseca")) fOdds.push(o.price);
            else oOdds.push(o.price);
          });
        });
        if (fOdds.length > 0 && oOdds.length > 0) {
          var avgF = fOdds.reduce(function (a, b) { return a + b; }, 0) / fOdds.length;
          var avgO = oOdds.reduce(function (a, b) { return a + b; }, 0) / oOdds.length;
          var iF = 1 / avgF, iO = 1 / avgO, tot = iF + iO;
          log("odds: " + Math.round((iF / tot) * 100) + "% Fonseca (Odds API)");
          return { fonseca: Math.round((iF / tot) * 100), opponent: Math.round((iO / tot) * 100), opponent_name: nm.opponent_name, source: "odds-api", updatedAt: new Date().toISOString() };
        }
      }
    } catch (e) { log("odds: Odds API error: " + e.message); }
  }

  // Source 2: SofaScore match odds
  if (nm.id) {
    var sd = await sofaFetch("/v1/match/odds?match_id=" + nm.id);
    if (sd && sd.markets) {
      var h2h = sd.markets.find(function (m) { return m.marketName === "Full time" || m.marketName === "1x2" || m.key === "1x2"; });
      if (h2h && h2h.choices) {
        var fOdd = null, oOdd = null;
        h2h.choices.forEach(function (c) {
          if ((c.name || "").toLowerCase().includes("fonseca") || c.name === "1") fOdd = c.odds || c.fractionalValue;
          else if (c.name === "2" || c.name !== "X") oOdd = c.odds || c.fractionalValue;
        });
        if (fOdd && oOdd) {
          var fi = 1 / fOdd, oi = 1 / oOdd, t2 = fi + oi;
          log("odds: " + Math.round((fi / t2) * 100) + "% Fonseca (SofaScore)");
          return { fonseca: Math.round((fi / t2) * 100), opponent: Math.round((oi / t2) * 100), opponent_name: nm.opponent_name, source: "sofascore-odds", updatedAt: new Date().toISOString() };
        }
      }
    }
  }

  log("odds: no source available");
  return null;
}

// ===== PHASE 5: ATP RANKINGS =====
async function fetchATPRankings() {
  var data = await sofaFetch("/v1/rankings/type/6");
  if (!data) return null;
  var rankings = [];
  var rows = data.rankings || data.rankingRows || data.rows || (Array.isArray(data) ? data : null);
  if (!rows) { for (var k in data) { if (Array.isArray(data[k]) && data[k].length > 10) { rows = data[k]; break; } } }
  if (rows && Array.isArray(rows)) {
    rows.slice(0, 100).forEach(function (r) {
      var team = r.team || r.player || r;
      var name = team.name || team.shortName || "";
      var rank = r.ranking || r.rank || r.position || 0;
      var pts = r.points || r.rowPoints || 0;
      if (name && rank) rankings.push({ rank: rank, name: name, points: pts, prev: rank });
    });
  }
  if (rankings.length >= 20) {
    log("rankings: " + rankings.length + " players");
    return { rankings: rankings, updatedAt: new Date().toISOString() };
  }
  return null;
}

// ===== PHASE 6: PLAYER DATA (career stats via Gemini) =====
async function fetchPlayerData() {
  var gTxt = await geminiSearch(
    "Dados ATUALIZADOS de abril 2026 sobre o tenista brasileiro João Fonseca. " +
    "Preciso: ranking ATP atual, career-high, record carreira singles (W-L total), " +
    "record temporada 2026 (W-L), record por superfície (hard/clay/grass), prize money USD, títulos ATP. " +
    "APENAS JSON: {\"ranking\":N,\"bestRanking\":N,\"wins\":N,\"losses\":N,\"seasonWins\":N,\"seasonLosses\":N," +
    "\"surface\":{\"hard\":{\"w\":N,\"l\":N},\"clay\":{\"w\":N,\"l\":N},\"grass\":{\"w\":N,\"l\":N}},\"prizeMoney\":N,\"titles\":N}"
  );
  var result = parseGeminiJSON(gTxt);
  if (result && result.ranking) {
    log("player: #" + result.ranking + " | " + (result.wins || 0) + "W-" + (result.losses || 0) + "L");
    return result;
  }

  // Wikipedia fallback
  try {
    var res = await fetch("https://en.wikipedia.org/w/api.php?action=parse&page=Jo%C3%A3o_Fonseca_(tennis)&prop=wikitext&format=json&section=0", { headers: { "User-Agent": "FonsecaNews/1.0" } });
    if (!res.ok) return null;
    var data = await res.json();
    var text = data && data.parse && data.parse.wikitext && data.parse.wikitext["*"];
    if (!text) return null;
    var wp = {};
    function extractWL(field) {
      var p1 = new RegExp("\\|\\s*" + field + "\\s*=\\s*\\{\\{[^}]*wins\\s*=\\s*(\\d+)\\s*\\|\\s*losses\\s*=\\s*(\\d+)", "i");
      var p2 = new RegExp("\\|\\s*" + field + "\\s*=\\s*(\\d+)\\s*[–\\-]\\s*(\\d+)", "i");
      var m = text.match(p1) || text.match(p2);
      return m ? { w: parseInt(m[1]), l: parseInt(m[2]) } : null;
    }
    var overall = extractWL("singlesrecord");
    if (overall) { wp.wins = overall.w; wp.losses = overall.l; }
    var hard = extractWL("singlesrecord_hard"), clay = extractWL("singlesrecord_clay"), grass = extractWL("singlesrecord_grass");
    if (hard || clay || grass) wp.surface = { hard: hard || { w: 0, l: 0 }, clay: clay || { w: 0, l: 0 }, grass: grass || { w: 0, l: 0 } };
    var rm = text.match(/\|\s*current_ranking\s*=\s*(?:No\.\s*)?(\d+)/i); if (rm) wp.ranking = parseInt(rm[1]);
    var hm = text.match(/\|\s*highest_ranking\s*=\s*(?:No\.\s*)?(\d+)/i); if (hm) wp.bestRanking = parseInt(hm[1]);
    var pm = text.match(/\|\s*prize\s*=\s*\$?([\d,]+)/i); if (pm) wp.prizeMoney = parseInt(pm[1].replace(/,/g, ""));
    var tm = text.match(/\|\s*titles\s*=\s*(\d+)/i); if (tm) wp.titles = parseInt(tm[1]);
    log("player: Wikipedia #" + (wp.ranking || "?"));
    return wp;
  } catch (e) { log("player: Wikipedia error: " + e.message); }
  return null;
}

// ===== VALIDATION =====
function validateCard(label, match, items) {
  var missing = [];
  items.forEach(function (item) {
    var val = match[item.key];
    if (val === null || val === undefined || val === "" || val === 0) {
      if (!item.optional) missing.push(item.key);
    }
  });
  if (missing.length > 0) log("VALIDATE " + label + ": MISSING [" + missing.join(", ") + "]");
  else log("VALIDATE " + label + ": OK (" + items.length + " items)");
  return missing;
}

// ===== MAIN HANDLER =====
export default async function handler(req, res) {
  var start = Date.now();
  var steps = {};
  try {
    // ── DISCOVER ──
    var discovered = await discoverMatches();
    steps.discover = discovered.finished.length + "f/" + discovered.upcoming.length + "u";

    // ── CLASSIFY ──
    var lm = discovered.finished.length > 0 ? extractMatch(discovered.finished[0]) : null;
    var nm = discovered.upcoming.length > 0 ? extractMatch(discovered.upcoming[0]) : null;

    // Cross-check: skip nm if same opponent as lm (SofaScore lag)
    if (nm && lm && nm.opponent_name && lm.opponent_name) {
      var nmL = stripAccents(nm.opponent_name.split(" ").pop().toLowerCase());
      var lmL = stripAccents(lm.opponent_name.split(" ").pop().toLowerCase());
      if (nmL === lmL && nm.tournament_name === lm.tournament_name) {
        log("nm stale (" + nm.opponent_name + " = lm), advancing");
        nm = discovered.upcoming.length > 1 ? extractMatch(discovered.upcoming[1]) : null;
      }
    }

    // CRITICAL: if lm has no score (SofaScore returned it as "notstarted"),
    // fetch match/details to get real data
    if (lm && (!lm.result || lm.result === "") && lm.id) {
      log("lm has no score, fetching match/details for id=" + lm.id);
      var lmDetail = await sofaFetch("/v1/match/details?match_id=" + lm.id);
      if (lmDetail) {
        var lmEv = lmDetail.event || lmDetail;
        if (lmEv.homeTeam && lmEv.awayTeam) {
          var lmFromDetail = extractMatch(lmEv);
          // Use detail data, but preserve id
          if (lmFromDetail.result || lmFromDetail.score) {
            lm = lmFromDetail;
            log("lm updated from details: " + lm.opponent_name + " " + lm.result + " " + lm.score);
          }
        }
        // Also check for timestamp/round even if no score yet
        var ts = lmEv.startTimestamp || lmEv.timestamp || null;
        if (!lm.startTimestamp && ts) { lm.startTimestamp = ts; lm.date = new Date(ts * 1000).toISOString(); }
        var rObj = lmEv.roundInfo || lmEv.round || null;
        if (!lm.round && rObj && rObj.name) lm.round = translateRound(rObj.name);
      }
    }

    // Enrich with TOURNAMENT_MAP
    if (lm) enrichMatch(lm);
    if (nm) enrichMatch(nm);

    // ── READ KV (parallel) ──
    var kvReads = await Promise.all([
      kv.get("fn:ranking"), kv.get("fn:opponentProfile"), kv.get("fn:atpRankings"),
      kv.get("fn:lastOddsCheck"), kv.get("fn:careerStats"), kv.get("fn:recentForm"),
      kv.get("fn:lastMatch"),
    ]);
    function pk(val) { if (!val) return null; return typeof val === "string" ? JSON.parse(val) : val; }
    var exRanking = pk(kvReads[0]);
    var exOpp = pk(kvReads[1]);
    var exRankingsList = pk(kvReads[2]);
    var lastOddsTs = kvReads[3] ? parseInt(kvReads[3]) : 0;
    var exCareer = pk(kvReads[4]);
    var exForm = pk(kvReads[5]);
    var exLastMatch = pk(kvReads[6]);

    // SMART MERGE lastMatch with KV
    if (lm && exLastMatch && exLastMatch.opponent_name) {
      var lmOpp = stripAccents(lm.opponent_name.split(" ").pop().toLowerCase());
      var kvOpp = stripAccents(exLastMatch.opponent_name.split(" ").pop().toLowerCase());
      if (lmOpp === kvOpp) {
        // Same opponent — KV fills gaps in scan data
        ["date", "startTimestamp", "court", "opponent_ranking", "opponent_country",
         "opponent_id", "tournament_category", "broadcast", "result", "score"].forEach(function (f) {
          if ((!lm[f] || lm[f] === "") && exLastMatch[f] && exLastMatch[f] !== "") lm[f] = exLastMatch[f];
        });
        if (!lm.finished && exLastMatch.finished) lm.finished = true;
        if (exLastMatch.id && !lm.id) lm.id = exLastMatch.id;
        log("merged lm with KV (" + lm.opponent_name + ")");
      } else {
        // Different opponents — only use KV if scan's lm has NO result at all
        if (lm.result && lm.result !== "") {
          // Scan has a real result — it's the latest match, keep it
          log("scan lm has result (" + lm.opponent_name + " " + lm.result + "), keeping over KV (" + exLastMatch.opponent_name + ")");
        } else if (exLastMatch.result && exLastMatch.result !== "") {
          // Scan has no result, KV does — KV is authoritative
          log("scan lm has no result, using KV: " + exLastMatch.opponent_name + " " + exLastMatch.result);
          lm = exLastMatch;
          enrichMatch(lm);
        }
      }
    } else if (!lm && exLastMatch && exLastMatch.opponent_name) {
      lm = exLastMatch;
      enrichMatch(lm);
      log("no scan lm, using KV: " + lm.opponent_name);
    }

    steps.last = lm ? lm.opponent_name + " " + lm.result + " " + lm.score : "none";
    steps.next = nm ? nm.opponent_name : "none";

    var now = Date.now();
    var H6 = 6 * 3600000, H24 = 24 * 3600000, D7 = 7 * H24;
    var T7 = 604800, T2 = 172800;

    // ── ATP RANKINGS (daily) ──
    var rankingsListFresh = exRankingsList && exRankingsList.updatedAt &&
      (now - new Date(exRankingsList.updatedAt).getTime()) < H24 &&
      exRankingsList.rankings && exRankingsList.rankings.length >= 40;
    if (!rankingsListFresh) {
      var newRankings = await fetchATPRankings();
      if (newRankings) { exRankingsList = newRankings; steps.rankings = newRankings.rankings.length + "p"; }
      else steps.rankings = "fail";
    } else {
      steps.rankings = "cached";
    }

    // Apply rankings to matches
    var rankingsLookup = buildRankingsLookup(exRankingsList);
    if (lm) applyRanking(lm, rankingsLookup);
    if (nm) applyRanking(nm, rankingsLookup);

    // ── MATCH STATS (lastMatch) ──
    var ms = null;
    if (lm && lm.id) {
      var statsData = await sofaFetch("/v1/match/statistics?match_id=" + lm.id);
      ms = parseMatchStats(statsData, lm.isFonsecaHome, {
        opponent_name: lm.opponent_name, opponent_country: lm.opponent_country,
        tournament: lm.tournament_name, result: lm.result, score: lm.score, date: lm.date,
      });
      steps.stats = ms ? Object.keys(ms.fonseca).length + "k" : "—";
    }

    // ── ENRICH NEXT MATCH ──
    var h2hData = null, pregameFormData = null;
    if (nm && nm.id) {
      var enriched = await enrichNextMatch(nm);
      nm = enriched.nm;
      h2hData = enriched.h2h;
      pregameFormData = enriched.pregameForm;
      steps.enrich = "h2h=" + (h2hData ? "✓" : "—") + " form=" + (pregameFormData ? "✓" : "—");
    }

    // ── OPPONENT PROFILE ──
    var op = await fetchOpponentProfile(nm, exOpp);
    steps.opp = op ? (op.name || "ok") : "—";

    // ── WIN PROBABILITY ──
    var wp = null;
    var oddsFresh = lastOddsTs && (now - lastOddsTs) < H6;
    var oppChanged = nm && nm.opponent_name !== "A definir" && (!exOpp || !exOpp.name ||
      stripAccents(exOpp.name.split(" ").pop().toLowerCase()) !== stripAccents((nm.opponent_name || "").split(" ").pop().toLowerCase()));
    if (nm && nm.opponent_name !== "A definir" && (!oddsFresh || oppChanged)) {
      wp = await fetchWinProb(nm);
      await kv.set("fn:lastOddsCheck", String(now), { ex: 86400 });
      steps.odds = wp ? wp.fonseca + "%" : "—";
    } else {
      try { var exWp = await kv.get("fn:winProb"); if (exWp) wp = pk(exWp); } catch (e) { }
      steps.odds = wp ? wp.fonseca + "%(c)" : "skip";
    }

    // ── PLAYER DATA (weekly) ──
    var wiki = null;
    var rankingFresh = exRanking && exRanking.updatedAt && (now - new Date(exRanking.updatedAt).getTime()) < D7;
    var careerFresh = exCareer && exCareer.wins !== undefined;
    if (!rankingFresh || !careerFresh) {
      wiki = await fetchPlayerData();
      steps.player = wiki ? "#" + (wiki.ranking || "?") : "fail";
    } else {
      wiki = { ranking: exRanking.ranking, bestRanking: exRanking.bestRanking };
      if (exCareer) { wiki.wins = exCareer.wins; wiki.losses = exCareer.losses; wiki.surface = exCareer.surface; wiki.titles = exCareer.titles; }
      steps.player = "cached";
    }

    // ── RECENT FORM ──
    var form = discovered.finished.slice(0, 10).map(function (m) {
      var d = extractMatch(m);
      return { result: d.result, score: d.score, opponent_name: d.opponent_name, opponent_ranking: d.opponent_ranking || null, tournament: d.tournament_name, round: d.round || "", date: d.date };
    }).filter(function (f) { return f.score && f.score.length > 1; });

    // Merge with existing form
    if (exForm && Array.isArray(exForm)) {
      var keys = new Set(form.map(function (m) { return m.opponent_name + "|" + m.score; }));
      exForm.forEach(function (m) {
        var k = m.opponent_name + "|" + m.score;
        if (!keys.has(k)) { form.push(m); keys.add(k); }
      });
    }
    form.forEach(function (m) {
      if (!m.opponent_ranking && m.opponent_name) {
        var ln = stripAccents(m.opponent_name.split(" ").pop().toLowerCase());
        if (rankingsLookup[ln]) m.opponent_ranking = rankingsLookup[ln];
      }
      if (m.tournament) { var mp = lookupTournament(m.tournament); if (mp) m.tournament = mp.name; }
    });
    form.sort(function (a, b) { return new Date(b.date || 0) - new Date(a.date || 0); });
    form = form.filter(function (f) { return f.score && f.score.length > 1; }).slice(0, 10);

    // ── PLACEHOLDER nextMatch ──
    if (!nm && lm && lm.result === "V") {
      var todayStr = new Date().toISOString().split("T")[0];
      var tournOn = ATP_CALENDAR_2026.some(function (t) {
        return (lm.tournament_name || "").toLowerCase().includes(t.name.toLowerCase()) && t.end >= todayStr;
      });
      if (tournOn) {
        var nextR = NEXT_ROUND[lm.round] || "";
        var mT = lookupTournament(lm.tournament_name);
        nm = {
          opponent_name: "A definir", opponent_ranking: null, opponent_country: "",
          tournament_name: mT ? mT.name : lm.tournament_name,
          tournament_category: mT ? mT.cat : (lm.tournament_category || ""),
          surface: mT ? mT.surface : (lm.surface || ""), round: nextR,
          date: null, startTimestamp: null, court: "", finished: false,
          broadcast: lookupBroadcast(mT ? mT.name : lm.tournament_name) || "",
        };
        log("placeholder: " + nm.tournament_name + " " + nm.round);
      }
    }

    // ── GEMINI SWEEP (remaining gaps) ──
    var gaps = [];
    if (!wiki || !wiki.ranking) gaps.push("ranking ATP");
    if (!wiki || wiki.wins === undefined) gaps.push("career record");
    if (wiki && wiki.wins !== undefined && wiki.seasonWins === undefined) gaps.push("season 2026");
    if (!wiki || !wiki.prizeMoney) gaps.push("prize money");
    if (nm && nm.opponent_name !== "A definir" && !nm.date) gaps.push("date of match vs " + nm.opponent_name);

    if (gaps.length > 0) {
      log("sweep: " + gaps.join(", "));
      var sweepTxt = await geminiSearch(
        "Dados de abril 2026 sobre João Fonseca. Preciso: " + gaps.join("; ") + ". " +
        "JSON: {\"ranking\":N,\"wins\":N,\"losses\":N,\"seasonWins\":N,\"seasonLosses\":N," +
        "\"surface\":{\"hard\":{\"w\":N,\"l\":N},\"clay\":{\"w\":N,\"l\":N},\"grass\":{\"w\":N,\"l\":N}}," +
        "\"prizeMoney\":N,\"titles\":N,\"matchDate\":\"ISO_OR_NULL\"}"
      );
      var sweep = parseGeminiJSON(sweepTxt);
      if (sweep) {
        if (!wiki) wiki = {};
        if (!wiki.ranking && sweep.ranking) wiki.ranking = sweep.ranking;
        if (wiki.wins === undefined && sweep.wins != null) { wiki.wins = sweep.wins; wiki.losses = sweep.losses || 0; }
        if (wiki.seasonWins === undefined && sweep.seasonWins != null) { wiki.seasonWins = sweep.seasonWins; wiki.seasonLosses = sweep.seasonLosses || 0; }
        if (!wiki.prizeMoney && sweep.prizeMoney) wiki.prizeMoney = sweep.prizeMoney;
        if (!wiki.titles && sweep.titles) wiki.titles = sweep.titles;
        if (sweep.surface && (!wiki.surface || !wiki.surface.hard || (!wiki.surface.hard.w && !wiki.surface.clay.w))) wiki.surface = sweep.surface;
        if (nm && !nm.date && sweep.matchDate) nm.date = sweep.matchDate;
        steps.sweep = gaps.length + " filled";
      }
    } else {
      steps.sweep = "—";
    }

    // ── VALIDATE ──
    if (nm && nm.opponent_name !== "A definir") {
      validateCard("NEXT", nm, [
        { key: "opponent_name" }, { key: "opponent_ranking" }, { key: "opponent_country" },
        { key: "tournament_name" }, { key: "tournament_category" }, { key: "round" },
        { key: "surface" }, { key: "date", optional: true }, { key: "broadcast" },
      ]);
    }
    if (lm) {
      validateCard("LAST", lm, [
        { key: "opponent_name" }, { key: "result" }, { key: "score" },
        { key: "tournament_name" }, { key: "tournament_category" }, { key: "round" },
        { key: "surface" }, { key: "date" },
      ]);
    }

    // ── KV WRITE ──
    // FORCE apply rankings right before KV write (ensure no merge overwrote them)
    var rankingsLookup2 = buildRankingsLookup(exRankingsList);
    if (lm && !lm.opponent_ranking && lm.opponent_name) {
      var lmLn = stripAccents(lm.opponent_name.split(" ").pop().toLowerCase());
      if (rankingsLookup2[lmLn]) { lm.opponent_ranking = rankingsLookup2[lmLn]; log("forced lm ranking: #" + lm.opponent_ranking); }
    }
    if (nm && !nm.opponent_ranking && nm.opponent_name && nm.opponent_name !== "A definir") {
      var nmLn = stripAccents(nm.opponent_name.split(" ").pop().toLowerCase());
      if (rankingsLookup2[nmLn]) { nm.opponent_ranking = rankingsLookup2[nmLn]; log("forced nm ranking: #" + nm.opponent_ranking); }
    }
    var w = [];

    // lastMatch — merge already happened in classify phase
    if (lm) {
      w.push(kv.set("fn:lastMatch", JSON.stringify(lm), { ex: T7 }));
    }

    // nextMatch
    if (nm) {
      w.push(kv.set("fn:nextMatch", JSON.stringify(nm), { ex: T7 }));
      try { await kv.del("fn:nextTournament"); } catch (e) { }
    } else {
      try { await kv.del("fn:nextMatch"); await kv.del("fn:winProb"); } catch (e) { }
      var nextT = ATP_CALENDAR_2026.find(function (t) { return new Date(t.end + "T23:59:59Z") >= new Date(); });
      if (nextT) w.push(kv.set("fn:nextTournament", JSON.stringify({
        tournament_name: nextT.name, tournament_category: nextT.cat, surface: nextT.surface,
        city: nextT.city, country: nextT.country, start_date: nextT.start, end_date: nextT.end,
        source: "calendar", updatedAt: new Date().toISOString(),
      }), { ex: T2 }));
    }

    // matchStats
    if (ms && lm) {
      var statsOppMatch = ms.opponent_name && lm.opponent_name && ms.opponent_name.split(" ").pop() === lm.opponent_name.split(" ").pop();
      if (statsOppMatch || !ms.opponent_name) w.push(kv.set("fn:matchStats", JSON.stringify(ms), { ex: T7 }));
    }

    // recentForm
    if (form.length > 0) w.push(kv.set("fn:recentForm", JSON.stringify(form), { ex: T7 }));

    // Player data
    if (wiki) {
      if (wiki.ranking) w.push(kv.set("fn:ranking", JSON.stringify({ ranking: wiki.ranking, bestRanking: wiki.bestRanking || null, updatedAt: new Date().toISOString() }), { ex: T7 }));
      if (wiki.prizeMoney) w.push(kv.set("fn:prizeMoney", JSON.stringify({ amount: wiki.prizeMoney }), { ex: T7 }));
      if (wiki.wins !== undefined) {
        var cW = wiki.wins, cL = wiki.losses || 0;
        if (wiki.surface) {
          var sW = (wiki.surface.hard ? wiki.surface.hard.w : 0) + (wiki.surface.clay ? wiki.surface.clay.w : 0) + (wiki.surface.grass ? wiki.surface.grass.w : 0);
          if (sW > cW) { cW = sW; cL = (wiki.surface.hard ? wiki.surface.hard.l : 0) + (wiki.surface.clay ? wiki.surface.clay.l : 0) + (wiki.surface.grass ? wiki.surface.grass.l : 0); }
        }
        w.push(kv.set("fn:careerStats", JSON.stringify({ wins: cW, losses: cL, winPct: (cW + cL) > 0 ? Math.round(cW / (cW + cL) * 100) : 0, surface: wiki.surface || null, titles: wiki.titles || null }), { ex: T7 }));
        var seW = wiki.seasonWins !== undefined ? wiki.seasonWins : wiki.wins;
        var seL = wiki.seasonLosses !== undefined ? wiki.seasonLosses : (wiki.losses || 0);
        w.push(kv.set("fn:season", JSON.stringify({ wins: seW, losses: seL, winPct: (seW + seL) > 0 ? Math.round(seW / (seW + seL) * 100) : 0 }), { ex: T2 }));
      }
    }

    if (op) w.push(kv.set("fn:opponentProfile", JSON.stringify(op), { ex: T2 }));
    if (wp) w.push(kv.set("fn:winProb", JSON.stringify(wp), { ex: T2 }));
    if (exRankingsList && !rankingsListFresh) w.push(kv.set("fn:atpRankings", JSON.stringify(exRankingsList), { ex: T7 }));
    if (h2hData) w.push(kv.set("fn:h2h", JSON.stringify(h2hData), { ex: T2 }));
    if (pregameFormData) w.push(kv.set("fn:pregameForm", JSON.stringify(pregameFormData), { ex: T2 }));
    w.push(kv.set("fn:cronLastRun", new Date().toISOString(), { ex: T7 }));

    await Promise.all(w);
    steps.kv = w.length + "k";

    var elapsed = Date.now() - start;
    log("Done " + elapsed + "ms | " + JSON.stringify(steps));
    if (elapsed > 50000) log("⚠ WARNING: " + elapsed + "ms > 50s");
    res.status(200).json({ ok: true, elapsed: elapsed + "ms", steps: steps });

  } catch (e) {
    log("FATAL: " + e.message);
    try { await kv.set("fn:cronLastRun", "error:" + new Date().toISOString()); } catch (_) { }
    res.status(200).json({ ok: false, error: e.message, elapsed: (Date.now() - start) + "ms", steps: steps });
  }
}
