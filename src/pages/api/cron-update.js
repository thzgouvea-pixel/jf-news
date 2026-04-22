// ===== FONSECA NEWS — CRON UPDATE v18 (CLEAN) =====
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
async function geminiSearch(prompt, opts) {
  opts = opts || {};
  var gk = process.env.GEMINI_API_KEY;
  if (!gk) return null;
  var timeoutMs = opts.timeoutMs || 15000;  // 15s. Gemini as vezes trava com grounding.
  var ctrl = new AbortController();
  var to = setTimeout(function() { ctrl.abort(); }, timeoutMs);
  try {
    var r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + gk, {
      method: "POST", headers: { "Content-Type": "application/json" },
      signal: ctrl.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        tools: [{ google_search: {} }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 4096 }
      })
    });
    clearTimeout(to);
    if (r.ok) {
      var d = await r.json();
      var parts = d.candidates && d.candidates[0] && d.candidates[0].content && d.candidates[0].content.parts;
      if (parts) {
        var txt = "";
        parts.forEach(function (p) { if (p.text && !p.thought) txt += p.text; });
        if (txt) return txt;
      }
    }
  } catch (e) {
    clearTimeout(to);
    log("Gemini " + (e.name === "AbortError" ? "timeout " + timeoutMs + "ms" : "error: " + e.message));
  }
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

// ===== SCRAPE FALLBACK: pega matchId da pagina publica do Fonseca no sofascore.com =====
// Necessario pq o proxy sofascore6 esconde jogos com adversario placeholder (R64P14, etc)
async function scrapeNextMatchIdFromSofa() {
  var ctrl = new AbortController();
  var to = setTimeout(function() { ctrl.abort(); }, 8000);
  try {
    var r = await fetch("https://www.sofascore.com/tennis/player/fonseca-joao/403869", {
      signal: ctrl.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        "Accept": "text/html",
      },
    });
    clearTimeout(to);
    if (!r.ok) { log("scrape: status " + r.status); return null; }
    var html = await r.text();
    var idx = html.indexOf("next match");
    if (idx < 0) { log("scrape: 'next match' nao encontrado"); return null; }
    var after = html.substring(idx);
    var m = after.match(/#id:(\d+)/);
    if (m && m[1]) return parseInt(m[1], 10);
    log("scrape: #id nao encontrado apos 'next match'");
  } catch (e) {
    clearTimeout(to);
    log("scrape " + (e.name === "AbortError" ? "timeout 8s" : "error: " + e.message));
  }
  return null;
}

// Normaliza match vindo do match/details: converte placeholder (R64P14) pra "A definir"
// e copia round -> roundInfo (match/details usa "round", extractMatch espera "roundInfo")
function normalizeScrapedMatch(m) {
  if (!m) return m;
  if (m.awayTeam && /^R\d+P\d+$/i.test(m.awayTeam.name || "")) {
    m.awayTeam.name = "A definir";
    m.awayTeam.shortName = "A definir";
    m.awayTeam.id = null;
  }
  if (m.homeTeam && /^R\d+P\d+$/i.test(m.homeTeam.name || "")) {
    m.homeTeam.name = "A definir";
    m.homeTeam.shortName = "A definir";
    m.homeTeam.id = null;
  }
  if (m.round && !m.roundInfo) m.roundInfo = m.round;
  return m;
}

// ===== PHASE 1: DISCOVER =====
async function discoverMatches() {
  log("DISCOVER: date scan -3 to +7 days...");
  var results = { upcoming: [], finished: [] };
  var seen = new Set();

  // Parallel date scan
  var dayPromises = [];
  for (var d = -2; d <= 5; d++) {
    var ds = new Date(Date.now() + d * 86400000).toISOString().split("T")[0];
    dayPromises.push(sofaFetch("/v1/match/list?sport_slug=tennis&date=" + ds));
  }
  var dayResults = await Promise.all(dayPromises);

  dayResults.forEach(function(dayData) {
    if (!dayData) return;
    var ev = dayData.events || (Array.isArray(dayData) ? dayData : []);
    if (!Array.isArray(ev)) { for (var k in dayData) { if (Array.isArray(dayData[k])) { ev = dayData[k]; break; } } }
    ev.forEach(function (m) {
      if (!m || !m.id || seen.has(m.id)) return;
      if (!isFonseca(m) || !isSingles(m)) return;
      seen.add(m.id);
      if (isFinished(m)) results.finished.push(m);
      else if (isUpcoming(m)) results.upcoming.push(m);
    });
  });
  log("scan: " + results.finished.length + " fin, " + results.upcoming.length + " upc (" + seen.size + " total)");

  // KV CROSS-REFERENCE
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
            if (!results.finished.some(function(f) { return f.id === m.id; })) {
              results.finished.push(m);
            }
            return false;
          }
          return true;
        });
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

  var NOW_TS = Math.floor(Date.now() / 1000);
  function getTs(m) { return m.startTimestamp || m.timestamp || 0; }

  // FALLBACK: se matchList nao achou upcoming, fazer scraping da pagina publica do Fonseca
  // (matchList do proxy sofascore6 esconde jogos com adversario placeholder tipo R64P14)
  if (results.upcoming.length === 0) {
    log("discover: 0 upcoming, tentando scrape fallback...");
    var scrapedId = await scrapeNextMatchIdFromSofa();
    if (scrapedId && !seen.has(scrapedId)) {
      log("scrape: matchId " + scrapedId + " encontrado");
      // Timeout estendido (15s) porque esse e o caminho critico pro card da proxima partida aparecer.
      // match/details as vezes tem picos lentos no proxy; 8s era agressivo demais.
      var scrapedMatch = await sofaFetch("/v1/match/details?match_id=" + scrapedId, { timeoutMs: 15000 });
      if (scrapedMatch) {
        var matchObj = scrapedMatch.event || scrapedMatch;
        matchObj = normalizeScrapedMatch(matchObj);
        if (matchObj.id && isFonseca(matchObj) && isSingles(matchObj) && isUpcoming(matchObj)) {
          seen.add(matchObj.id);
          results.upcoming.push(matchObj);
          log("scrape: upcoming adicionado via scrape (" + matchObj.id + ")");
        } else {
          log("scrape: match nao passou filtros (id:" + matchObj.id + " fonseca:" + isFonseca(matchObj) + " singles:" + isSingles(matchObj) + " upcoming:" + isUpcoming(matchObj) + ")");
        }
      } else {
        log("scrape: match/details retornou vazio pro id " + scrapedId);
      }
    }
  }

  results.finished.sort(function (a, b) { return (getTs(b) || NOW_TS) - (getTs(a) || NOW_TS); });
  results.upcoming.sort(function (a, b) { return (getTs(a) || 0) - (getTs(b) || 0); });
  results.upcoming = results.upcoming.filter(function (m) {
    var ex = extractMatch(m);
    return !(ex.score && ex.score.length > 2);
  });

  return results;
}

// ===== PHASE 2: ENRICH NEXT MATCH =====
async function enrichNextMatch(nm) {
  if (!nm || !nm.id) return { nm: nm, h2h: null, pregameForm: null };

  // a) Event detail — ALWAYS refresh time/court/round from SofaScore
  var detail = await sofaFetch("/v1/match/details?match_id=" + nm.id);
  if (detail) {
    var ev = detail.event || detail;
    if (ev.courtName) nm.court = ev.courtName;
    else if (!nm.court && ev.venue) nm.court = ev.venue.name || "";
    var newTs = ev.startTimestamp || ev.timestamp;
    if (newTs && newTs !== nm.startTimestamp) {
      log("time refresh: " + (nm.startTimestamp || "?") + " -> " + newTs);
      nm.startTimestamp = newTs;
      nm.date = new Date(newTs * 1000).toISOString();
    }
    var newRoundName = (ev.roundInfo && ev.roundInfo.name) || (ev.round && ev.round.name);
    if (newRoundName) {
      var translatedRound = translateRound(newRoundName);
      if (translatedRound && translatedRound !== nm.round) {
        log("round refresh: " + (nm.round || "?") + " -> " + translatedRound);
        nm.round = translatedRound;
      }
    }
    if (ev.status) {
      if (ev.status.isPostponed) { nm.postponed = true; log("status: POSTPONED"); }
      else nm.postponed = false;
      if (ev.status.isCancelled) { nm.cancelled = true; log("status: CANCELLED"); }
      else nm.cancelled = false;
    }
    log("match details: court=" + (nm.court || "\u2014") + " round=" + (nm.round || "\u2014") + " ts=" + (nm.startTimestamp || "\u2014"));
  } else {
    log("match details: no data for id=" + nm.id);
  }

  // a2) GEMINI BACKUP for court (only when SofaScore returned empty + match imminent)
  if (!nm.court && nm.startTimestamp && nm.opponent_name && nm.opponent_name !== "A definir") {
    var hoursUntil = (nm.startTimestamp * 1000 - Date.now()) / 3600000;
    if (hoursUntil > 0 && hoursUntil < 48) {
      var courtCacheKey = "fn:gemini:court:" + nm.id;
      var cached = null;
      try { cached = await kv.get(courtCacheKey); } catch (e) {}
      if (cached && typeof cached === "string" && cached.length > 0 && cached.length < 50) {
        nm.court = cached;
        log("court Gemini (cached): " + cached);
      } else {
        var matchDate = new Date(nm.startTimestamp * 1000).toISOString().split("T")[0];
        var courtPrompt = "Tenista Jo\u00e3o Fonseca joga contra " + nm.opponent_name + " no torneio " +
          (nm.tournament_name || "ATP") + " no dia " + matchDate + ". " +
          "Qual o nome da QUADRA (court) onde esse jogo espec\u00edfico ser\u00e1 disputado? " +
          "Responda APENAS com o nome da quadra em uma \u00fanica linha, sem explica\u00e7\u00f5es. " +
          "Exemplos v\u00e1lidos: Center Court, Court 1, Centre Court, Pista Central, Court Philippe-Chatrier. " +
          "Se n\u00e3o souber com certeza, responda apenas: DESCONHECIDO";
        var gTxt = await geminiSearch(courtPrompt);
        if (gTxt) {
          var clean = gTxt.trim().replace(/["'`]/g, "").split("\n")[0].trim();
          var invalidResponses = ["desconhecido", "n\u00e3o sei", "a definir", "n/a", "nao sei", "unknown", "tbd"];
          var isInvalid = !clean || clean.length < 3 || clean.length > 50 ||
            invalidResponses.some(function(r) { return clean.toLowerCase().includes(r); });
          if (!isInvalid) {
            nm.court = clean;
            try { await kv.set(courtCacheKey, clean, { ex: 43200 }); } catch (e) {}
            log("court Gemini: " + clean);
          } else {
            log("court Gemini: invalid response ('" + clean.substring(0, 30) + "')");
          }
        }
      }
    }
  }

  var h2h = null;
  var pregameForm = null;
  return { nm: nm, h2h: h2h, pregameForm: pregameForm };
}

// ===== PHASE 3: OPPONENT PROFILE =====
async function fetchOpponentProfile(nm, existingProfile) {
  if (!nm || !nm.opponent_name || nm.opponent_name === "A definir") return existingProfile || null;

  if (existingProfile && existingProfile.name) {
    var exLast = stripAccents(existingProfile.name.split(" ").pop().toLowerCase());
    var nmLast = stripAccents(nm.opponent_name.split(" ").pop().toLowerCase());
    if (exLast === nmLast) {
      log("opponent: cached (" + existingProfile.name + ")");
      return existingProfile;
    }
  }

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

      var gTxt = await geminiSearch(
        "Tenista " + (pr.name || nm.opponent_name) + ": estilo de jogo breve em portugu\u00eas, t\u00edtulos ATP, career-high ranking. " +
        "APENAS JSON: {\"style\":\"descri\u00e7\u00e3o breve\",\"titles\":NUMBER_OR_NULL,\"careerHigh\":NUMBER_OR_NULL}"
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

  log("opponent: Gemini fallback for " + nm.opponent_name);
  var gTxt2 = await geminiSearch(
    "Tenista " + nm.opponent_name + ". APENAS JSON: {\"name\":\"nome curto\",\"country\":\"pa\u00eds\",\"ranking\":N," +
    "\"age\":N,\"height\":\"X.XXm\",\"hand\":\"Destro ou Canhoto\",\"titles\":N,\"style\":\"breve em portugu\u00eas\",\"careerHigh\":N}"
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

  // SofaScore first (free, updates live during match)
  if (nm.id) {
    var sdEarly = await sofaFetch("/v1/match/odds?match_id=" + nm.id);
    var marketsEarly = Array.isArray(sdEarly) ? sdEarly : (sdEarly && sdEarly.markets);
    if (marketsEarly && Array.isArray(marketsEarly)) {
      var h2hEarly = marketsEarly.find(function (m) { return m.name === "Full time" || m.name === "1x2"; });
      if (h2hEarly && h2hEarly.choices && h2hEarly.choices.length >= 2) {
        var isFHE = nm.isFonsecaHome !== false;
        var homeE = h2hEarly.choices.find(function(c) { return c.name === "1"; });
        var awayE = h2hEarly.choices.find(function(c) { return c.name === "2"; });
        var fE = isFHE ? homeE : awayE;
        var oE = isFHE ? awayE : homeE;
        var fOddE = fE && fE.value && fE.value.decimal;
        var oOddE = oE && oE.value && oE.value.decimal;
        if (fOddE && oOddE) {
          var fiE = 1 / fOddE, oiE = 1 / oOddE, tE = fiE + oiE;
          var isLiveE = h2hEarly.isLive === true;
          log("odds: " + Math.round((fiE / tE) * 100) + "% Fonseca (SofaScore" + (isLiveE ? " LIVE" : "") + ")");
          return { fonseca: Math.round((fiE / tE) * 100), opponent: Math.round((oiE / tE) * 100), opponent_name: nm.opponent_name, source: "sofascore-odds", isLive: isLiveE, updatedAt: new Date().toISOString() };
        }
      }
    }
  }

  // Fallback: Odds API (costs requests)
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

  log("odds: no source available");
  return null;
}

// ===== PHASE 5: ATP RANKINGS =====
async function fetchATPRankings() {
  // Tenta SofaScore primeiro
  var data = await sofaFetch("/v1/rankings/type/6");
  if (data) {
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
      log("rankings: " + rankings.length + " players (sofa)");
      return { rankings: rankings, updatedAt: new Date().toISOString() };
    }
  }

  // Fallback: Gemini com grounding (SofaScore esta 404 desde 15/04/2026)
  log("rankings: sofa fail, trying Gemini");
  // Chamada inline com maxOutputTokens maior (geminiSearch padrao usa 4096, insuficiente pra 50 jogadores)
  var gTxt = null;
  var gk = process.env.GEMINI_API_KEY;
  if (gk) {
    try {
      var rankPrompt = "RANKING ATP SINGLES DESTA SEMANA (abril 2026). Preciso da lista COMPLETA das posicoes 1 ate 50. " +
        "NAO pare no top 10 nem no top 20. Preciso de 50 jogadores, incluindo Joao Fonseca (brasileiro, atualmente rank 31). " +
        "SOMENTE JSON compacto em uma linha. SEM markdown. SEM quebras de linha. " +
        "Formato: {\"r\":[{\"k\":1,\"n\":\"Jannik Sinner\",\"p\":13350},{\"k\":2,\"n\":\"Carlos Alcaraz\",\"p\":12960}, ... ate k:50]} " +
        "Nomes em ingles sem acentos. Responda APENAS o JSON com as 50 entradas, nada mais. " +
        "Confira: sua resposta DEVE ter 50 objetos dentro do array.";
      var r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + gk, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: rankPrompt }] }],
          tools: [{ google_search: {} }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 16384 }
        })
      });
      if (r.ok) {
        var d = await r.json();
        var parts = d.candidates && d.candidates[0] && d.candidates[0].content && d.candidates[0].content.parts;
        if (parts) {
          gTxt = "";
          parts.forEach(function (p) { if (p.text && !p.thought) gTxt += p.text; });
        }
      }
    } catch (e) { log("rankings: Gemini call error: " + e.message); }
  }
  if (!gTxt) { log("rankings: Gemini no response"); return null; }
  log("rankings: Gemini returned " + gTxt.length + " chars");

  // Parser tolerante: aceita JSON truncado e tenta recuperar o array parcial.
  function parseTolerant(txt) {
    if (!txt) return null;
    var cleaned = txt.replace(/```json|```/g, "").trim();
    try { return JSON.parse(cleaned); } catch (e) {}
    var arrMatch = cleaned.match(/"r"\s*:\s*\[([\s\S]*)/);
    if (!arrMatch) return null;
    var arrBody = arrMatch[1];
    var objs = [];
    var depth = 0, start = -1;
    for (var i = 0; i < arrBody.length; i++) {
      var c = arrBody.charAt(i);
      if (c === "{") { if (depth === 0) start = i; depth++; }
      else if (c === "}") {
        depth--;
        if (depth === 0 && start >= 0) {
          try { objs.push(JSON.parse(arrBody.substring(start, i + 1))); } catch (e) {}
          start = -1;
        }
      }
    }
    return objs.length > 0 ? { r: objs } : null;
  }

  var parsed = parseTolerant(gTxt);
  if (!parsed || !Array.isArray(parsed.r)) {
    log("rankings: Gemini parse failed. First 200 chars: " + gTxt.substring(0, 200));
    return null;
  }
  log("rankings: Gemini parsed " + parsed.r.length + " entries");
  var cleanRankings = parsed.r.map(function(o) {
    return { rank: o.k || 0, name: o.n || "", points: o.p || 0, prev: o.k || 0 };
  }).filter(function(r) { return r.rank > 0 && r.name; });
  if (cleanRankings.length >= 15) {
    log("rankings: " + cleanRankings.length + " players (gemini)");
    return { rankings: cleanRankings, updatedAt: new Date().toISOString() };
  }
  log("rankings: only " + cleanRankings.length + " valid entries (min 15)");
  return null;
}

// ===== SEASON CALCULATION =====
function calculateSeason(recentForm, storedSeason) {
  if (!recentForm || !Array.isArray(recentForm)) return storedSeason || null;
  var yearStart = new Date("2026-01-01T00:00:00Z").getTime();
  var wins2026 = 0, losses2026 = 0;
  var seen = {};
  recentForm.forEach(function(m) {
    if (!m.date || !m.opponent_name || !m.score) return;
    var ts = new Date(m.date).getTime();
    if (ts < yearStart) return;
    var key = m.opponent_name + "|" + m.score + "|" + m.date.substring(0, 10);
    if (seen[key]) return;
    seen[key] = true;
    if (m.result === "V") wins2026++;
    else if (m.result === "D") losses2026++;
  });
  var baseW = (storedSeason && storedSeason.baseline) ? (storedSeason.baseline.wins || 0) : 0;
  var baseL = (storedSeason && storedSeason.baseline) ? (storedSeason.baseline.losses || 0) : 0;
  var totalW = wins2026 + baseW;
  var totalL = losses2026 + baseL;
  var total = totalW + totalL;
  return {
    wins: totalW, losses: totalL,
    winPct: total > 0 ? Math.round(totalW / total * 100) : 0,
    recentFormCount: wins2026 + losses2026,
    baseline: { wins: baseW, losses: baseL },
    updatedAt: new Date().toISOString(),
  };
}

async function fetchSeasonFromGemini() {
  var gTxt = await geminiSearch(
    "Record ATUAL e ATUALIZADO da temporada 2026 do tenista Jo\u00e3o Fonseca em SINGLES (simples) ATP at\u00e9 hoje. " +
    "REGRA CR\u00cdTICA: Conte APENAS jogos de SIMPLES (singles). " +
    "NUNCA conte jogos de DUPLAS (doubles). " +
    "Conte APENAS jogos de 2026 (desde 1 de janeiro). " +
    "Considere apenas jogos do circuito ATP principal, Challenger, Grand Slams e Masters 1000 em singles. " +
    "APENAS JSON: {\"wins\":NUMBER,\"losses\":NUMBER}"
  );
  var parsed = parseGeminiJSON(gTxt);
  if (parsed && typeof parsed.wins === "number" && typeof parsed.losses === "number") {
    log("season Gemini (singles only): " + parsed.wins + "W-" + parsed.losses + "L");
    return parsed;
  }
  return null;
}

// ===== PHASE 6: PLAYER DATA — Wikipedia FIRST (reliable), Gemini fallback =====
async function fetchPlayerData() {
  // === WIKIPEDIA PRIMARY ===
  // Estrategia: HTML renderizado primeiro (formato mais estavel), wikitext como fallback
  var wp = {};
  var source = "";

  // --- TENTATIVA 1: HTML renderizado via action=parse&prop=text ---
  try {
    var ctrl1 = new AbortController();
    var to1 = setTimeout(function () { ctrl1.abort(); }, 10000);
    var res1 = await fetch(
      "https://en.wikipedia.org/w/api.php?action=parse&page=Jo%C3%A3o_Fonseca_(tennis)&prop=text&format=json&section=0",
      { headers: { "User-Agent": "FonsecaNews/1.0 (https://fonsecanews.com.br)" }, signal: ctrl1.signal }
    );
    clearTimeout(to1);
    if (res1.ok) {
      var data1 = await res1.json();
      var html = data1 && data1.parse && data1.parse.text && data1.parse.text["*"];
      if (html) {
        // Remove tags HTML pra texto simples (ex: "Career record: 38–27")
        var plainText = html
          .replace(/<[^>]*>/g, " ")          // remove tags
          .replace(/&nbsp;/g, " ")
          .replace(/&amp;/g, "&")
          .replace(/&#91;[^\]]*&#93;/g, "")  // remove [numero] citations
          .replace(/\[\d+\]/g, "")
          .replace(/\s+/g, " ");

        // Career record: "Career record: 38–27" (en-dash ou hyphen)
        var m = plainText.match(/Career\s+record\s*:?\s*(\d+)\s*[\u2013\-]\s*(\d+)/i);
        if (m) { wp.wins = parseInt(m[1], 10); wp.losses = parseInt(m[2], 10); }

        // Career titles: "Career titles: 2"
        m = plainText.match(/Career\s+titles\s*:?\s*(\d+)/i);
        if (m) wp.titles = parseInt(m[1], 10);

        // Highest ranking: "Highest ranking: No. 24"
        m = plainText.match(/Highest\s+ranking\s*:?\s*No\.\s*(\d+)/i);
        if (m) wp.bestRanking = parseInt(m[1], 10);

        // Current ranking: "Current ranking: No. 38"
        m = plainText.match(/Current\s+ranking\s*:?\s*No\.\s*(\d+)/i);
        if (m) wp.ranking = parseInt(m[1], 10);

        // Prize money: "Prize money: US $2,816,305"
        m = plainText.match(/Prize\s+money\s*:?\s*(?:US\s*)?\$?\s*([\d,]+)/i);
        if (m) {
          var amount = parseInt(m[1].replace(/,/g, ""), 10);
          if (!isNaN(amount) && amount > 0) wp.prizeMoney = amount;
        }

        if (wp.wins !== undefined || wp.ranking || wp.prizeMoney) source = "HTML";
      }
    }
  } catch (e) {
    log("player: Wikipedia HTML error: " + e.message);
  }

  // --- TENTATIVA 2: Wikitext como fallback se HTML incompleto ---
  if (wp.wins === undefined || !wp.ranking || !wp.prizeMoney) {
    try {
      var ctrl2 = new AbortController();
      var to2 = setTimeout(function () { ctrl2.abort(); }, 10000);
      var res2 = await fetch(
        "https://en.wikipedia.org/w/api.php?action=parse&page=Jo%C3%A3o_Fonseca_(tennis)&prop=wikitext&format=json&section=0",
        { headers: { "User-Agent": "FonsecaNews/1.0 (https://fonsecanews.com.br)" }, signal: ctrl2.signal }
      );
      clearTimeout(to2);
      if (res2.ok) {
        var data2 = await res2.json();
        var text = data2 && data2.parse && data2.parse.wikitext && data2.parse.wikitext["*"];
        if (text) {
          // CAMPOS REAIS DO INFOBOX (testados contra wikitext real 22/04/2026):
          // - singlesrecord usa TEMPLATE: {{tennis record|won=48|lost=31}}
          // - careerprizemoney (NAO prizemoney): "US $3,233,646"
          // - currentsinglesranking: "No. 31 (20 April 2026)"
          // - highestsinglesranking: "No. 24 (3 November 2025)"
          // - singlestitles: "2"

          // Career W-L: PRIMEIRO tenta template, DEPOIS formato direto (compatibilidade futura)
          if (wp.wins === undefined) {
            var srM = text.match(/\{\{tennis\s+record\|won=(\d+)\|lost=(\d+)\}\}/i);
            if (!srM) srM = text.match(/\|\s*singlesrecord\s*=\s*(\d+)\s*[\u2013\-]\s*(\d+)/i);
            if (srM) { wp.wins = parseInt(srM[1], 10); wp.losses = parseInt(srM[2], 10); }
          }
          if (wp.titles === undefined) {
            var stM = text.match(/\|\s*singlestitles\s*=\s*(\d+)/i);
            if (stM) wp.titles = parseInt(stM[1], 10);
          }
          if (!wp.bestRanking) {
            var hrM = text.match(/\|\s*highestsinglesranking\s*=\s*No\.\s*(\d+)/i);
            if (hrM) wp.bestRanking = parseInt(hrM[1], 10);
          }
          if (!wp.ranking) {
            var crM = text.match(/\|\s*currentsinglesranking\s*=\s*No\.\s*(\d+)/i);
            if (crM) wp.ranking = parseInt(crM[1], 10);
          }
          if (!wp.prizeMoney) {
            // ATENCAO: campo correto eh 'careerprizemoney', NAO 'prizemoney'
            var pmM = text.match(/\|\s*careerprizemoney\s*=\s*(?:US\s*)?\$\s*([\d,]+)/i);
            if (pmM) {
              var amt = parseInt(pmM[1].replace(/,/g, ""), 10);
              if (!isNaN(amt) && amt > 0) wp.prizeMoney = amt;
            }
          }
          if (source === "HTML" && (wp.wins !== undefined || wp.ranking)) source = "HTML+wikitext";
          else if (wp.wins !== undefined || wp.ranking) source = "wikitext";
        }
      }
    } catch (e) {
      log("player: Wikipedia wikitext error: " + e.message);
    }
  }

  // Validate: precisamos pelo menos de wins+losses OU ranking
  var hasMinimum = (wp.wins !== undefined && wp.losses !== undefined) || wp.ranking;
  if (hasMinimum) {
    log("player: Wikipedia OK (" + source + ") | " + (wp.wins !== undefined ? wp.wins : "?") + "W-" + (wp.losses !== undefined ? wp.losses : "?") + "L | #" + (wp.ranking || "?") + " | $" + (wp.prizeMoney || "?") + " | titles:" + (wp.titles !== undefined ? wp.titles : "?"));
    return wp;
  }
  log("player: Wikipedia matched but insufficient data, trying Gemini");

  // === GEMINI FALLBACK (only if Wikipedia fails) ===
  // NOTA: Gemini frequentemente alucina numeros. Use somente se Wikipedia falhar completamente.
  // Sem surface (Wikipedia nao tem dado consolidado e Gemini inventa).
  var gTxt = await geminiSearch(
    "Dados oficiais ATUALIZADOS de abril 2026 sobre o tenista brasileiro Jo\u00e3o Fonseca segundo a Wikipedia. " +
    "Ele tem cerca de 38-27 W-L na carreira. Confirme: ranking ATP atual, career-high, W-L total, prize money USD, t\u00edtulos ATP. " +
    "APENAS JSON: {\"ranking\":N,\"bestRanking\":N,\"wins\":N,\"losses\":N,\"prizeMoney\":N,\"titles\":N}"
  );
  var result = parseGeminiJSON(gTxt);
  if (result && (result.ranking || result.wins !== undefined)) {
    log("player: Gemini fallback | " + (result.wins || "?") + "W-" + (result.losses || "?") + "L | #" + (result.ranking || "?"));
    return result;
  }
  log("player: ALL SOURCES FAILED");
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

// ===== PUSH NOTIFICATION HELPER =====
// Chama /api/push-send internamente com o secret.
// Returns true on success (at least scheduled), false on error. Nao trava o cron se falhar.
async function sendPush(title, body, url, tag) {
  var secret = process.env.PUSH_SECRET;
  if (!secret) { log("push: no PUSH_SECRET, skip"); return false; }

  // SEMPRE usa o dominio publico. Nao usa VERCEL_URL porque a URL efemera de deployment
  // exige Vercel Authentication (Protection) e retorna 401 antes de validar o x-push-secret.
  var host = "https://fonsecanews.com.br";

  try {
    var res = await fetch(host + "/api/push-send", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-push-secret": secret },
      body: JSON.stringify({
        title: title || "Fonseca News",
        body: body || "",
        url: url || "https://fonsecanews.com.br",
        tag: tag || "fn-default"
      })
    });
    var data = await res.json().catch(function() { return {}; });
    log("push [" + (tag || "default") + "]: " + (data.sent || 0) + " sent, " + (data.failed || 0) + " failed");
    return res.ok;
  } catch (e) {
    log("push error: " + e.message);
    return false;
  }
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

    if (nm && lm && nm.opponent_name && lm.opponent_name) {
      var nmL = stripAccents(nm.opponent_name.split(" ").pop().toLowerCase());
      var lmL = stripAccents(lm.opponent_name.split(" ").pop().toLowerCase());
      if (nmL === lmL && nm.tournament_name === lm.tournament_name) {
        log("nm stale (" + nm.opponent_name + " = lm), advancing");
        nm = discovered.upcoming.length > 1 ? extractMatch(discovered.upcoming[1]) : null;
      }
    }

    var lmDetailFetched = false;  // flag pra evitar chamada duplicada de match/details
    if (lm && (!lm.result || lm.result === "") && lm.id) {
      log("lm has no score, fetching match/details for id=" + lm.id);
      var lmDetail = await sofaFetch("/v1/match/details?match_id=" + lm.id);
      lmDetailFetched = true;
      if (lmDetail) {
        var lmEv = lmDetail.event || lmDetail;
        if (lmEv.homeTeam && lmEv.awayTeam) {
          var lmFromDetail = extractMatch(lmEv);
          if (lmFromDetail.result || lmFromDetail.score) {
            lm = lmFromDetail;
            log("lm updated from details: " + lm.opponent_name + " " + lm.result + " " + lm.score);
          }
        }
        var ts = lmEv.startTimestamp || lmEv.timestamp || null;
        if (!lm.startTimestamp && ts) { lm.startTimestamp = ts; lm.date = new Date(ts * 1000).toISOString(); }
        var rObj = lmEv.roundInfo || lmEv.round || null;
        if (!lm.round && rObj && rObj.name) lm.round = translateRound(rObj.name);
        // Atualiza court aqui tambem (substitui o "FORCE REFRESH" redundante abaixo)
        if (lmEv.courtName && lmEv.courtName !== lm.court) lm.court = lmEv.courtName;
      }
    }

    if (lm) enrichMatch(lm);
    if (nm) enrichMatch(nm);

    // FORCE REFRESH round/court from SofaScore — SO SE NAO FOI BUSCADO AINDA ACIMA
    if (lm && lm.id && !lmDetailFetched) {
      var lmDetailForce = await sofaFetch("/v1/match/details?match_id=" + lm.id);
      if (lmDetailForce) {
        var lmEvForce = lmDetailForce.event || lmDetailForce;
        var rObjF = lmEvForce.roundInfo || lmEvForce.round || null;
        if (rObjF && rObjF.name) {
          var translated = translateRound(rObjF.name);
          if (translated && translated !== lm.round) {
            log("round refresh: '" + lm.round + "' \u2192 '" + translated + "' (from SofaScore)");
            lm.round = translated;
          }
        }
        if (lmEvForce.courtName && lmEvForce.courtName !== lm.court) {
          lm.court = lmEvForce.courtName;
        }
      }
    }

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
        ["date", "startTimestamp", "court", "opponent_ranking", "opponent_country",
         "opponent_id", "tournament_category", "broadcast", "result", "score"].forEach(function (f) {
          if ((!lm[f] || lm[f] === "") && exLastMatch[f] && exLastMatch[f] !== "") lm[f] = exLastMatch[f];
        });
        if (!lm.finished && exLastMatch.finished) lm.finished = true;
        if (exLastMatch.id && !lm.id) lm.id = exLastMatch.id;
        log("merged lm with KV (" + lm.opponent_name + ")");
      } else {
        if (lm.result && lm.result !== "") {
          log("scan lm has result (" + lm.opponent_name + " " + lm.result + "), keeping over KV (" + exLastMatch.opponent_name + ")");
        } else if (exLastMatch.result && exLastMatch.result !== "") {
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

    // ── ATP RANKINGS (weekly on monday 10h UTC) ──
    // Usa mesmo threshold do ranking individual ("lastMonday10UTC" definido mais abaixo em rankingFresh).
    // Como esse check acontece antes do rankingFresh, recalcula aqui.
    var _lastMonday10UTC_forList = (function() {
      var d = new Date();
      var day = d.getUTCDay();
      var daysSinceMonday = day === 0 ? 6 : day - 1;
      d.setUTCDate(d.getUTCDate() - daysSinceMonday);
      d.setUTCHours(10, 0, 0, 0);
      if (d.getTime() > Date.now()) d.setUTCDate(d.getUTCDate() - 7);
      return d.getTime();
    })();
    var rankingsListFresh = exRankingsList && exRankingsList.updatedAt &&
      new Date(exRankingsList.updatedAt).getTime() >= _lastMonday10UTC_forList &&
      exRankingsList.rankings && exRankingsList.rankings.length >= 40;
    if (!rankingsListFresh) {
      var newRankings = await fetchATPRankings();
      if (newRankings) { exRankingsList = newRankings; steps.rankings = newRankings.rankings.length + "p"; }
      else steps.rankings = "fail";
    } else {
      steps.rankings = "cached";
    }

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
      steps.stats = ms ? Object.keys(ms.fonseca).length + "k" : "\u2014";
    }

    // ── ENRICH NEXT MATCH ──
    var h2hData = null, pregameFormData = null;
    if (nm && nm.id) {
      var enriched = await enrichNextMatch(nm);
      nm = enriched.nm;
      h2hData = enriched.h2h;
      pregameFormData = enriched.pregameForm;
      steps.enrich = "h2h=" + (h2hData ? "\u2713" : "\u2014") + " form=" + (pregameFormData ? "\u2713" : "\u2014");
    }

    // ── OPPONENT PROFILE ──
    var op = await fetchOpponentProfile(nm, exOpp);
    steps.opp = op ? (op.name || "ok") : "\u2014";

    // ── WIN PROBABILITY ──
    var wp = null;
    var oddsFresh = lastOddsTs && (now - lastOddsTs) < H6;
    var oppChanged = nm && nm.opponent_name !== "A definir" && (!exOpp || !exOpp.name ||
      stripAccents(exOpp.name.split(" ").pop().toLowerCase()) !== stripAccents((nm.opponent_name || "").split(" ").pop().toLowerCase()));
    var hasOdds = false;
    try { var exWp2 = await kv.get("fn:winProb"); if (exWp2) hasOdds = true; } catch(e) {}
    if (nm && nm.opponent_name !== "A definir" && (!oddsFresh || oppChanged || !hasOdds)) {
      wp = await fetchWinProb(nm);
      await kv.set("fn:lastOddsCheck", String(now), { ex: 86400 });
      steps.odds = wp ? wp.fonseca + "%" : "\u2014";
    } else {
      try { var exWp = await kv.get("fn:winProb"); if (exWp) wp = pk(exWp); } catch (e) { }
      steps.odds = wp ? wp.fonseca + "%(c)" : "skip";
    }

    // ── PLAYER DATA (weekly) ──
    var wiki = null;
    // rankingFresh = true se o ranking foi atualizado apos a ultima segunda-feira 10:00 UTC (madrugada BRT).
    // ATP publica ranking oficial toda segunda-feira.
    var lastMonday10UTC = (function() {
      var d = new Date();
      var day = d.getUTCDay(); // 0=dom 1=seg 2=ter ...
      var daysSinceMonday = day === 0 ? 6 : day - 1;
      d.setUTCDate(d.getUTCDate() - daysSinceMonday);
      d.setUTCHours(10, 0, 0, 0);
      if (d.getTime() > Date.now()) d.setUTCDate(d.getUTCDate() - 7); // se ainda nao passou das 10h, usa semana passada
      return d.getTime();
    })();
    var rankingFresh = exRanking && exRanking.updatedAt && new Date(exRanking.updatedAt).getTime() >= lastMonday10UTC;
    // careerStats tambem revalida semanalmente (antes so checava se wins existia — cache perpetuo de dados falsos)
    var careerFresh = exCareer && exCareer.wins !== undefined && exCareer.updatedAt && new Date(exCareer.updatedAt).getTime() >= lastMonday10UTC;
    if (!rankingFresh || !careerFresh) {
      wiki = await fetchPlayerData();
      // FALLBACK: se Wikipedia nao retornou ranking, busca em fn:atpRankings (SofaScore semanal)
      if (!wiki) wiki = {};
      if (!wiki.ranking && exRankingsList && exRankingsList.rankings) {
        var fonsecaInList = exRankingsList.rankings.find(function (p) {
          return p.name && (p.name.indexOf("Fonseca") !== -1 || p.name.indexOf("fonseca") !== -1);
        });
        if (fonsecaInList && fonsecaInList.rank) {
          wiki.ranking = fonsecaInList.rank;
          log("player: ranking fallback from SofaScore atpRankings: #" + wiki.ranking);
        }
      }
      steps.player = wiki && wiki.ranking ? "#" + wiki.ranking : "fail";
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
    // So cria placeholder se o Joao ganhou o ultimo jogo E o torneio ainda esta rolando.
    // Isso cobre o gap entre o resultado e a API do SofaScore publicar o adversario do proximo round.
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

    // ── GEMINI SWEEP (apenas para matchDate quando faltar) ──
    // ANTES: tentava preencher wins/losses/prizeMoney/ranking via Gemini, mas alucinava muito.
    // AGORA: esses campos vem APENAS de Wikipedia (autom\u00e1tico) ou /api/manual-stats (manual).
    // Gemini sweep s\u00f3 atua se faltar a data de uma partida confirmada.
    var gaps = [];
    if (nm && nm.opponent_name !== "A definir" && !nm.date) gaps.push("date of match vs " + nm.opponent_name);

    if (gaps.length > 0) {
      log("sweep: " + gaps.join(", "));
      var sweepTxt = await geminiSearch(
        "Dados de abril 2026 sobre Jo\u00e3o Fonseca. Preciso: " + gaps.join("; ") + ". " +
        "APENAS JSON: {\"matchDate\":\"ISO_OR_NULL\"}"
      );
      var sweep = parseGeminiJSON(sweepTxt);
      if (sweep) {
        if (nm && !nm.date && sweep.matchDate) nm.date = sweep.matchDate;
        steps.sweep = gaps.length + " filled";
      }
    } else {
      steps.sweep = "\u2014";
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
    var rankingsLookup2 = buildRankingsLookup(exRankingsList);
    if (lm && !lm.opponent_ranking && lm.opponent_name) {
      var lmLn = stripAccents(lm.opponent_name.split(" ").pop().toLowerCase());
      if (rankingsLookup2[lmLn]) { lm.opponent_ranking = rankingsLookup2[lmLn]; log("forced lm ranking: #" + lm.opponent_ranking); }
    }
    if (nm && !nm.opponent_ranking && nm.opponent_name && nm.opponent_name !== "A definir") {
      var nmLn = stripAccents(nm.opponent_name.split(" ").pop().toLowerCase());
      if (rankingsLookup2[nmLn]) { nm.opponent_ranking = rankingsLookup2[nmLn]; log("forced nm ranking: #" + nm.opponent_ranking); }
    }

    function protectData(newData, existingData) {
      if (!newData || !existingData) return newData;
      var old = typeof existingData === "string" ? JSON.parse(existingData) : existingData;
      if (!old) return newData;
      for (var key in old) {
        if (old[key] !== null && old[key] !== undefined && old[key] !== "" && old[key] !== 0) {
          if (newData[key] === null || newData[key] === undefined || newData[key] === "" || newData[key] === 0) {
            newData[key] = old[key];
          }
        }
      }
      return newData;
    }

    async function protect(key, newData) {
      if (!newData) return newData;
      try {
        var raw = await kv.get(key);
        if (!raw) return newData;
        var old = typeof raw === "string" ? JSON.parse(raw) : raw;
        if (!old || typeof old !== "object") return newData;
        if (old.opponent_name && newData.opponent_name && old.opponent_name !== newData.opponent_name) {
          if (old.date && newData.date && new Date(old.date) > new Date(newData.date)) {
            log("protect: keeping newer " + old.opponent_name + " over older " + newData.opponent_name);
            return old;
          }
          return newData;
        }
        var REFRESHABLE = ["round", "court", "tournament_name", "tournament_category", "surface", "broadcast", "date", "startTimestamp"];
        for (var f in old) {
          var isRefreshable = REFRESHABLE.indexOf(f) !== -1;
          if (isRefreshable) {
            if (newData[f] === null || newData[f] === undefined || newData[f] === "" || newData[f] === 0) {
              newData[f] = old[f];
            }
          } else {
            if (old[f] !== null && old[f] !== undefined && old[f] !== "" && old[f] !== 0) {
              if (newData[f] === null || newData[f] === undefined || newData[f] === "" || newData[f] === 0) {
                newData[f] = old[f];
              }
            }
          }
        }
      } catch(e) {}
      return newData;
    }

    if (lm) lm = await protect("fn:lastMatch", lm);
    if (nm) nm = await protect("fn:nextMatch", nm);
    if (ms) ms = await protect("fn:matchStats", ms);
    if (!wp) { try { var kWp = await kv.get("fn:winProb"); if (kWp) wp = typeof kWp === "string" ? JSON.parse(kWp) : kWp; } catch(e){} }

    var w = [];

    if (lm) lm = protectData(lm, await kv.get("fn:lastMatch"));
    if (nm) nm = protectData(nm, await kv.get("fn:nextMatch"));
    if (!wp) { try { var exWp3 = await kv.get("fn:winProb"); if (exWp3) wp = typeof exWp3 === "string" ? JSON.parse(exWp3) : exWp3; } catch(e){} }

    if (lm) {
      w.push(kv.set("fn:lastMatch", JSON.stringify(lm), { ex: T7 }));
    }

    if (nm) {
      w.push(kv.set("fn:nextMatch", JSON.stringify(nm), { ex: T7 }));
      try { await kv.del("fn:nextTournament"); } catch (e) { }
    } else {
      // PROTECAO: antes de deletar fn:nextMatch, verifica se:
      //  a) O scrape achou um match_id (significa que SofaScore SABE que existe jogo) -> API so falhou, mantem KV antigo
      //  b) OU o KV atual tem um jogo futuro valido (data ainda no futuro) -> mantem
      // So deleta se REALMENTE nao ha proximo jogo (Fonseca eliminado ou sem torneio inscrito)
      var shouldKeepNextMatch = false;

      // (a) Scrape achou ID? Entao existe jogo, API so falhou temporariamente
      // (a variavel scrapedId so existe no escopo do discoverMatches, entao vamos checar exKvNextMatch)
      try {
        var exKvNextMatchRaw = await kv.get("fn:nextMatch");
        if (exKvNextMatchRaw) {
          var exKvNextMatch = typeof exKvNextMatchRaw === "string" ? JSON.parse(exKvNextMatchRaw) : exKvNextMatchRaw;
          // (b) Se o jogo no KV ainda e futuro (ou esta rolando agora), mantem
          if (exKvNextMatch && exKvNextMatch.startTimestamp) {
            var gameTimeMs = exKvNextMatch.startTimestamp * 1000;
            var nowCheck = Date.now();
            // Mantem se o jogo esta nas proximas 72h OU aconteceu nas ultimas 6h (ainda rolando)
            var hoursUntil = (gameTimeMs - nowCheck) / 3600000;
            if (hoursUntil >= -6 && hoursUntil <= 72) {
              shouldKeepNextMatch = true;
              log("nm null mas fn:nextMatch no KV ainda valido (jogo em " + Math.round(hoursUntil) + "h) — mantendo");
              steps.next = "kept (API falhou)";
            }
          }
        }
      } catch (e) { log("check kv nextMatch err: " + e.message); }

      if (!shouldKeepNextMatch) {
        try { await kv.del("fn:nextMatch"); await kv.del("fn:winProb"); await kv.del("fn:bracketUrl"); } catch (e) { }
      } else {
        // Mantem fn:nextMatch como esta, mas limpa winProb/bracketUrl (dados derivados que podem estar stale)
        // Na proxima execucao com API OK, eles sao recalculados
      }

      if (!shouldKeepNextMatch) {
        // Select only FUTURE tournaments (start date > today), never ongoing ones
        var todayForTourn = new Date();
        todayForTourn.setUTCHours(0, 0, 0, 0);
        var nextT = ATP_CALENDAR_2026.find(function (t) {
          if (!t.start) return false;
          return new Date(t.start + "T00:00:00Z") > todayForTourn;
        });

        if (nextT) {
        // Check if Fonseca is confirmed to play — cache 3 days per tournament
        var confirmedCacheKey = "fn:gemini:tournConfirmed:" + nextT.name.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
        var fonsecaConfirmed = null;
        try {
          var cachedConf = await kv.get(confirmedCacheKey);
          if (cachedConf !== null && cachedConf !== undefined) {
            fonsecaConfirmed = cachedConf === "yes" || cachedConf === true;
            log("tournament confirmed (cached): " + nextT.name + " = " + fonsecaConfirmed);
          }
        } catch (e) { }

        if (fonsecaConfirmed === null) {
          var confPrompt = "O tenista Jo\u00e3o Fonseca est\u00e1 inscrito/confirmado para jogar o torneio " +
            nextT.name + " em " + nextT.city + " (" + nextT.start + " a " + nextT.end + ")? " +
            "Responda APENAS: YES ou NO ou UNKNOWN. Sem explica\u00e7\u00f5es.";
          var confTxt = await geminiSearch(confPrompt);
          if (confTxt) {
            var confClean = confTxt.trim().toUpperCase().split(/\s+/)[0].replace(/[^A-Z]/g, "");
            if (confClean === "YES") {
              fonsecaConfirmed = true;
              try { await kv.set(confirmedCacheKey, "yes", { ex: 259200 }); } catch (e) { }
              log("tournament confirmed (Gemini): " + nextT.name + " = YES");
            } else if (confClean === "NO") {
              fonsecaConfirmed = false;
              try { await kv.set(confirmedCacheKey, "no", { ex: 259200 }); } catch (e) { }
              log("tournament confirmed (Gemini): " + nextT.name + " = NO");
            } else {
              fonsecaConfirmed = null;
              log("tournament confirmed (Gemini): " + nextT.name + " = UNKNOWN");
            }
          }
        }

        w.push(kv.set("fn:nextTournament", JSON.stringify({
          tournament_name: nextT.name, tournament_category: nextT.cat, surface: nextT.surface,
          city: nextT.city, country: nextT.country, start_date: nextT.start, end_date: nextT.end,
          fonsecaConfirmed: fonsecaConfirmed,
          source: "calendar", updatedAt: new Date().toISOString(),
        }), { ex: T2 }));
        log("nextTournament: " + nextT.name + " (confirmed=" + fonsecaConfirmed + ")");
      }
      }  // fim do if (!shouldKeepNextMatch)
    }

    if (ms && lm) {
      var statsOppMatch = ms.opponent_name && lm.opponent_name && ms.opponent_name.split(" ").pop() === lm.opponent_name.split(" ").pop();
      if (statsOppMatch || !ms.opponent_name) w.push(kv.set("fn:matchStats", JSON.stringify(ms), { ex: T7 }));
    }

    if (form.length > 0) w.push(kv.set("fn:recentForm", JSON.stringify(form), { ex: T7 }));

    if (wiki) {
      // RANKING: s\u00f3 sobrescreve se Wikipedia retornou ranking E (KV vazio OU source != manual)
      if (wiki.ranking && (!exRanking || exRanking.source !== "manual")) {
        // Preserva updatedAt antigo se o valor nao mudou e veio do cache.
        var rankingUpdatedAt;
        if (rankingFresh && exRanking && exRanking.ranking === wiki.ranking) {
          rankingUpdatedAt = exRanking.updatedAt;
        } else {
          rankingUpdatedAt = new Date().toISOString();
        }
        w.push(kv.set("fn:ranking", JSON.stringify({
          ranking: wiki.ranking,
          bestRanking: wiki.bestRanking || (exRanking && exRanking.bestRanking) || null,
          updatedAt: rankingUpdatedAt,
          source: "wikipedia"
        }), { ex: T7 }));
      }

      // PRIZE MONEY: s\u00f3 sobrescreve se Wikipedia retornou valor v\u00e1lido E source atual != manual
      if (wiki.prizeMoney) {
        try {
          var exPrize = await kv.get("fn:prizeMoney");
          var parsedPrize = exPrize ? (typeof exPrize === "string" ? JSON.parse(exPrize) : exPrize) : null;
          if (!parsedPrize || parsedPrize.source !== "manual") {
            w.push(kv.set("fn:prizeMoney", JSON.stringify({
              amount: wiki.prizeMoney,
              updatedAt: new Date().toISOString(),
              source: "wikipedia"
            }), { ex: T7 }));
          }
        } catch (e) { }
      }

      // CAREER STATS: s\u00f3 sobrescreve se Wikipedia retornou wins+losses (ambos) E source atual != manual
      // CRITICAL: nunca grava parcial. Se faltar wins ou losses, n\u00e3o sobrescreve.
      if (wiki.wins !== undefined && wiki.losses !== undefined && wiki.wins > 0 && wiki.losses > 0) {
        if (!exCareer || exCareer.source !== "manual") {
          var cW = wiki.wins, cL = wiki.losses;
          w.push(kv.set("fn:careerStats", JSON.stringify({
            wins: cW,
            losses: cL,
            winPct: (cW + cL) > 0 ? Math.round(cW / (cW + cL) * 100) : 0,
            titles: wiki.titles || (exCareer && exCareer.titles) || null,
            updatedAt: new Date().toISOString(),
            source: "wikipedia"
          }), { ex: T7 }));
        }
      }
    }

    // ── SEASON ──
    try {
      var exSeason = await kv.get("fn:season");
      var parsedSeason = exSeason ? (typeof exSeason === "string" ? JSON.parse(exSeason) : exSeason) : null;
      var needsBaseline = !parsedSeason || !parsedSeason.baseline ||
        !parsedSeason.baselineUpdatedAt ||
        (now - new Date(parsedSeason.baselineUpdatedAt).getTime()) > (7 * H24);
      var baseline = parsedSeason && parsedSeason.baseline ? parsedSeason.baseline : null;
      var baselineUpdatedAt = parsedSeason ? parsedSeason.baselineUpdatedAt : null;
      if (needsBaseline) {
        var geminiTotal = await fetchSeasonFromGemini();
        if (geminiTotal) {
          var recentWins = 0, recentLosses = 0;
          var yearStart = new Date("2026-01-01T00:00:00Z").getTime();
          form.forEach(function(m) {
            if (!m.date) return;
            if (new Date(m.date).getTime() < yearStart) return;
            if (m.result === "V") recentWins++;
            else if (m.result === "D") recentLosses++;
          });
          var newBaseW = Math.max(0, geminiTotal.wins - recentWins);
          var newBaseL = Math.max(0, geminiTotal.losses - recentLosses);
          baseline = { wins: newBaseW, losses: newBaseL };
          baselineUpdatedAt = new Date().toISOString();
          log("season baseline updated: " + newBaseW + "W-" + newBaseL + "L (Gemini total: " + geminiTotal.wins + "-" + geminiTotal.losses + ", recentForm: " + recentWins + "-" + recentLosses + ")");
        }
      }
      var seasonToWrite = calculateSeason(form, { baseline: baseline });
      if (seasonToWrite) {
        seasonToWrite.baselineUpdatedAt = baselineUpdatedAt || new Date().toISOString();
        if (parsedSeason && parsedSeason.wins !== undefined) {
          if ((seasonToWrite.wins + seasonToWrite.losses) < (parsedSeason.wins + parsedSeason.losses)) {
            log("season would regress, keeping existing");
            seasonToWrite = parsedSeason;
          }
        }
        w.push(kv.set("fn:season", JSON.stringify(seasonToWrite), { ex: T7 }));
        log("season: " + seasonToWrite.wins + "W-" + seasonToWrite.losses + "L");
      }
    } catch (e) { log("season error: " + e.message); }

    if (op) w.push(kv.set("fn:opponentProfile", JSON.stringify(op), { ex: T2 }));
    if (wp) w.push(kv.set("fn:winProb", JSON.stringify(wp), { ex: T2 }));
    if (exRankingsList && !rankingsListFresh) w.push(kv.set("fn:atpRankings", JSON.stringify(exRankingsList), { ex: T7 }));
    if (h2hData) w.push(kv.set("fn:h2h", JSON.stringify(h2hData), { ex: T2 }));
    if (pregameFormData) w.push(kv.set("fn:pregameForm", JSON.stringify(pregameFormData), { ex: T2 }));
    w.push(kv.set("fn:cronLastRun", new Date().toISOString(), { ex: T7 }));

    await Promise.all(w);
    steps.kv = w.length + "k";

    // ===== PUSH NOTIFICATION TRIGGERS =====
    // Compara estado atual vs ultimo estado ja notificado (fn:pushState).
    // Dispara push em 4 eventos: novo adversario, resultado de jogo, mudanca de ranking, jogo ao vivo.
    // fn:pushState guarda o que ja foi notificado pra evitar duplicatas.
    try {
      var pushStateRaw = await kv.get("fn:pushState");
      var pushState = {};
      if (pushStateRaw) {
        try { pushState = typeof pushStateRaw === "string" ? JSON.parse(pushStateRaw) : pushStateRaw; }
        catch (e) { pushState = {}; }
      }
      if (!pushState || typeof pushState !== "object") pushState = {};

      var pushesToSend = [];

      // --- TRIGGER 1: Novo adversario definido ---
      // Considera "novo" se nm.opponent_name existe, nao e "A definir", e e diferente do que ja foi notificado
      // SALVAGUARDA: se pushState nunca teve NENHUM trigger antes (primeira exec do sistema),
      // estabelece baseline sem notificar — evita spam em migracoes/restarts.
      if (nm && nm.opponent_name && nm.opponent_name !== "A definir") {
        var nmKey = (nm.tournament_name || "") + "|" + nm.opponent_name + "|" + (nm.round || "");
        if (pushState.lastNextMatch !== nmKey) {
          // "Baseline geral": pushState ja teve QUALQUER trigger antes (lastResult, lastRanking, lastLive, ou lastPushAt)
          var hasAnyBaseline = !!(pushState.lastResult || pushState.lastRanking || pushState.lastLive || pushState.lastPushAt);
          if (!hasAnyBaseline) {
            pushState.lastNextMatch = nmKey;
            try { await kv.set("fn:pushState", JSON.stringify(pushState)); } catch(e) {}
            log("pushState: baseline lastNextMatch = " + nmKey + " (sem notificar — primeira exec)");
          } else {
            var tournBit = nm.tournament_name ? " (" + nm.tournament_name + (nm.round ? " - " + nm.round : "") + ")" : "";
            var titleT1 = "\ud83c\udfbe Próximo jogo do João";
            var bodyT1 = "vs " + nm.opponent_name + tournBit;
            pushesToSend.push({ title: titleT1, body: bodyT1, url: "https://fonsecanews.com.br", tag: "next-match", stateKey: "lastNextMatch", stateValue: nmKey });
          }
        }
      }

      // --- TRIGGER 2: Resultado do ultimo jogo (acabou de finalizar) ---
      // Considera "novo resultado" se lm tem result + score, e nao foi notificado ainda (identifica por id ou opponent+date)
      // SALVAGUARDAS:
      //  a) Partida precisa ter terminado nas ultimas 6h (evita notificar jogos antigos quando baseline muda)
      //  b) Se pushState.lastResult nunca foi setado (primeira execucao apos push voltar), so estabelece baseline — nao notifica
      if (lm && (lm.result === "V" || lm.result === "D") && lm.score) {
        var lmKey = String(lm.id || "") + "|" + lm.opponent_name + "|" + lm.score;
        var lmTs = lm.startTimestamp ? lm.startTimestamp * 1000 : (lm.date ? new Date(lm.date).getTime() : 0);
        var lmAgeMs = lmTs ? (Date.now() - lmTs) : Infinity;
        var SIX_HOURS = 6 * 3600 * 1000;
        var isRecentResult = lmAgeMs > 0 && lmAgeMs < SIX_HOURS;
        var hasBaseline = !!pushState.lastResult;

        if (pushState.lastResult !== lmKey) {
          if (!hasBaseline) {
            // Primeira execucao: estabelece baseline sem notificar (evita spam em migracoes/restarts)
            pushState.lastResult = lmKey;
            try { await kv.set("fn:pushState", JSON.stringify(pushState)); } catch(e) {}
            log("pushState: baseline lastResult = " + lmKey + " (sem notificar — jogo ja passou)");
          } else if (!isRecentResult) {
            // Nao e recente — so avanca o baseline silenciosamente
            pushState.lastResult = lmKey;
            try { await kv.set("fn:pushState", JSON.stringify(pushState)); } catch(e) {}
            log("pushState: lastResult avancado sem push (jogo tem " + Math.round(lmAgeMs / 3600000) + "h)");
          } else {
            // Resultado realmente novo E recente: notifica
            var emojiT2 = lm.result === "V" ? "\ud83c\udfc6" : "\ud83d\ude14";
            var verbT2 = lm.result === "V" ? "Vitória do João" : "Derrota do João";
            var titleT2 = emojiT2 + " " + verbT2;
            var bodyT2 = lm.score + " vs " + lm.opponent_name + (lm.tournament_name ? " (" + lm.tournament_name + ")" : "");
            pushesToSend.push({ title: titleT2, body: bodyT2, url: "https://fonsecanews.com.br", tag: "result", stateKey: "lastResult", stateValue: lmKey });
          }
        }
      }

      // --- TRIGGER 3: Mudanca de ranking ATP ---
      // Compara valor ATUAL do ranking (wiki.ranking, que e o que acabou de ser salvo)
      // vs ULTIMO valor notificado (pushState.lastRanking).
      // Isso funciona independente se o valor veio de cache ou fetch fresh.
      // SALVAGUARDAS:
      //  a) Ignora mudanca de apenas 1 posicao (pode ser ruido de calculo da ATP/Gemini)
      //  b) Max 1 notificacao de ranking por 24h (evita spam se houver flutuacao)
      if (wiki && wiki.ranking) {
        var currentRank = wiki.ranking;
        var lastNotifiedRank = pushState.lastRanking ? parseInt(pushState.lastRanking) : null;
        if (lastNotifiedRank && lastNotifiedRank !== currentRank) {
          var rankDiff = Math.abs(currentRank - lastNotifiedRank);
          var lastRankingNotifAt = pushState.lastRankingNotifAt ? new Date(pushState.lastRankingNotifAt).getTime() : 0;
          var hoursSinceRankingPush = (Date.now() - lastRankingNotifAt) / 3600000;
          var canSendRanking = rankDiff >= 2 && hoursSinceRankingPush >= 24;

          if (canSendRanking) {
            var direction, emojiT3;
            if (currentRank < lastNotifiedRank) { direction = "subiu"; emojiT3 = "\ud83d\udcc8"; }
            else { direction = "caiu"; emojiT3 = "\ud83d\udcc9"; }
            var titleT3 = emojiT3 + " Ranking ATP atualizado";
            var bodyT3 = "João " + direction + " pra #" + currentRank + " (era #" + lastNotifiedRank + ")";
            pushesToSend.push({ title: titleT3, body: bodyT3, url: "https://fonsecanews.com.br", tag: "ranking", stateKey: "lastRanking", stateValue: String(currentRank), markRankingNotif: true });
          } else {
            // Atualiza baseline silenciosamente (nao notifica mas evita acumular "pendencia")
            pushState.lastRanking = String(currentRank);
            try { await kv.set("fn:pushState", JSON.stringify(pushState)); } catch(e) {}
            log("pushState: ranking " + lastNotifiedRank + "\u2192" + currentRank + " sem push (diff=" + rankDiff + ", " + Math.round(hoursSinceRankingPush) + "h desde ultima)");
          }
        } else if (!lastNotifiedRank) {
          // Primeira vez rodando: nao notifica, so salva o baseline.
          pushState.lastRanking = String(currentRank);
          try { await kv.set("fn:pushState", JSON.stringify(pushState)); } catch(e) {}
          log("pushState: baseline ranking = " + currentRank);
        }
      }

      // --- TRIGGER 4: Jogo ao vivo comecou ---
      // Detecta match em andamento: nm existe e o startTimestamp ja passou (jogo comecou)
      // SALVAGUARDA: janela de 60 min (nao 30). Cron roda a cada 30min, entao 60min garante
      // que NAO perdemos o trigger se um cron falhar ou atrasar.
      if (nm && nm.opponent_name && nm.opponent_name !== "A definir" && nm.startTimestamp) {
        var startMs = nm.startTimestamp * 1000;
        var nowMs = Date.now();
        var minutesSinceStart = (nowMs - startMs) / 60000;
        if (minutesSinceStart >= 0 && minutesSinceStart <= 60) {
          var liveKey = String(nm.id || "") + "|" + nm.opponent_name + "|" + nm.startTimestamp;
          if (pushState.lastLive !== liveKey) {
            var titleT4 = "\ud83d\udd34 AO VIVO agora";
            var bodyT4 = "João Fonseca x " + nm.opponent_name + " \u2014 acompanhe";
            pushesToSend.push({ title: titleT4, body: bodyT4, url: "https://fonsecanews.com.br", tag: "live", stateKey: "lastLive", stateValue: liveKey });
          }
        }
      }

      // SALVAGUARDA GLOBAL: maximo 1 push por execucao do cron.
      // Evita spam em caso multiplos triggers simultaneos (ex: jogo comecou + ranking mudou + resultado antigo).
      // Prioridade: live > result > next-match > ranking (do mais urgente pro menos).
      if (pushesToSend.length > 1) {
        var priorityOrder = { "live": 1, "result": 2, "next-match": 3, "ranking": 4 };
        pushesToSend.sort(function(a, b) {
          return (priorityOrder[a.tag] || 99) - (priorityOrder[b.tag] || 99);
        });
        var skipped = pushesToSend.slice(1);
        pushesToSend = pushesToSend.slice(0, 1);
        log("push: " + (skipped.length + 1) + " triggers, priorizando '" + pushesToSend[0].tag + "'");
        // Avanca silenciosamente o baseline dos triggers que nao foram enviados
        // (evita que fiquem "pendentes" e disparem no proximo cron)
        skipped.forEach(function(sk) {
          if (sk.stateKey && sk.stateValue !== undefined) {
            pushState[sk.stateKey] = sk.stateValue;
          }
        });
      }

      // Envia todos os pushes pendentes (sequencialmente pra nao spammar o push-send endpoint)
      if (pushesToSend.length > 0) {
        log("push triggers: " + pushesToSend.length);
        for (var pi = 0; pi < pushesToSend.length; pi++) {
          var pu = pushesToSend[pi];
          var ok = await sendPush(pu.title, pu.body, pu.url, pu.tag);
          // So marca como notificado se push foi bem sucedido (evita loss se houver erro transitorio)
          if (ok) {
            pushState[pu.stateKey] = pu.stateValue;
            if (pu.markRankingNotif) pushState.lastRankingNotifAt = new Date().toISOString();
          }
        }
        pushState.lastPushAt = new Date().toISOString();
        try { await kv.set("fn:pushState", JSON.stringify(pushState)); } catch (e) { log("pushState save err: " + e.message); }
        steps.push = pushesToSend.length + "p";
      } else {
        // Mesmo sem pushes enviados, se baselines foram atualizados silenciosamente salva pushState
        try { await kv.set("fn:pushState", JSON.stringify(pushState)); } catch (e) {}
      }
    } catch (e) {
      log("push trigger error: " + e.message);
    }

    var elapsed = Date.now() - start;
    log("Done " + elapsed + "ms | " + JSON.stringify(steps));
    if (elapsed > 50000) log("\u26a0 WARNING: " + elapsed + "ms > 50s");
    res.status(200).json({ ok: true, elapsed: elapsed + "ms", steps: steps });

  } catch (e) {
    log("FATAL: " + e.message);
    try { await kv.set("fn:cronLastRun", "error:" + new Date().toISOString()); } catch (_) { }
    res.status(200).json({ ok: false, error: e.message, elapsed: (Date.now() - start) + "ms", steps: steps });
  }
}
