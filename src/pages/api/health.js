// src/pages/api/health.js
// Diagnostico de saude do site. Lista cada KV usado pelo front, idade do dado,
// fonte (quando disponivel), e se esta dentro do "budget" de frescor para o
// contexto atual (live/pre/post/tournament/idle).
//
// Uso: abrir https://fonsecanews.com.br/api/health no celular.
//
// Resposta JSON com:
//   context: { kind, untilHuman, sinceHuman }
//   keys:    objeto { fn:nome -> { ageMs, ageHuman, status, ... } }
//   summary: { fresh, stale, missing, total }
//
// status:
//   "fresh"   — dentro do budget
//   "stale"   — fora do budget (cron deveria estar refrescando mais rapido)
//   "missing" — chave nao existe no KV

import { kv } from "@vercel/kv";
import { getMatchContext, FRESHNESS_BUDGET } from "../../lib/matchContext.js";

async function getKV(key) {
  try {
    var v = await kv.get(key);
    if (!v) return null;
    return typeof v === "string" ? JSON.parse(v) : v;
  } catch (e) { return null; }
}

function humanizeMs(ms) {
  if (ms == null || isNaN(ms)) return "?";
  var abs = Math.abs(ms);
  var sign = ms < 0 ? "-" : "";
  if (abs < 60 * 1000) return sign + Math.round(abs / 1000) + "s";
  if (abs < 3600 * 1000) return sign + Math.round(abs / 60000) + "min";
  if (abs < 86400 * 1000) return sign + Math.round(abs / 3600000 * 10) / 10 + "h";
  return sign + Math.round(abs / 86400000 * 10) / 10 + "d";
}

function pickUpdatedAt(val) {
  // Heuristica: aceita updatedAt, foundAt, checkedAt, fetchedAt — usados em
  // diferentes chaves. Se nenhum existir, retorna null (idade indeterminada).
  if (!val || typeof val !== "object") return null;
  return val.updatedAt || val.foundAt || val.checkedAt || val.fetchedAt || null;
}

function pickSource(val) {
  if (!val || typeof val !== "object") return null;
  return val.source || null;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");

  try {
    var now = Date.now();
    var keysToCheck = Object.keys(FRESHNESS_BUDGET);
    // Adiciona algumas extras pra completude (sem budget = nao classificadas)
    var extraKeys = [
      "fn:highlight-video", "fn:bracketUrl", "fn:tournamentFacts", "fn:season",
      "fn:prizeMoney", "fn:careerStats", "fn:biography", "fn:pregameForm",
      "fn:careerNarrative", "fn:rankingHistory",
    ];
    var all = keysToCheck.concat(extraKeys);

    var values = await Promise.all(all.map(getKV));

    var nm = values[all.indexOf("fn:nextMatch")];
    var lm = values[all.indexOf("fn:lastMatch")];
    var ctx = getMatchContext({ nextMatch: nm, lastMatch: lm, now: now });

    var keysReport = {};
    var fresh = 0, stale = 0, missing = 0;
    for (var i = 0; i < all.length; i++) {
      var key = all[i];
      var val = values[i];
      var budget = FRESHNESS_BUDGET[key] ? FRESHNESS_BUDGET[key][ctx.kind] : null;
      var report = {};
      if (val == null) {
        report.status = "missing";
        report.hasValue = false;
        missing++;
      } else {
        report.hasValue = true;
        var src = pickSource(val);
        if (src) report.source = src;
        var u = pickUpdatedAt(val);
        if (u) {
          var age = now - new Date(u).getTime();
          report.ageMs = age;
          report.ageHuman = humanizeMs(age);
          if (budget != null) {
            report.budgetMs = budget;
            report.budgetHuman = humanizeMs(budget);
            report.status = age <= budget ? "fresh" : "stale";
            if (age <= budget) fresh++; else stale++;
          } else {
            report.status = "ok"; // nao classificado, mas tem valor
            fresh++;
          }
        } else {
          report.status = budget ? "no-timestamp" : "ok";
          if (budget) stale++; else fresh++;
        }
        // Campos contextuais uteis pra debug visual
        if (key === "fn:nextMatch" && val.opponent_name) {
          report.opponent = val.opponent_name;
          report.opponent_ranking = val.opponent_ranking || null;
          if (val.startTimestamp) {
            report.startsIn = humanizeMs(val.startTimestamp * 1000 - now);
          }
        }
        if (key === "fn:lastMatch" && val.opponent_name) {
          report.opponent = val.opponent_name;
          report.result = val.result;
          report.score = val.score;
        }
        if (key === "fn:opponentProfile" && val.name) {
          report.name = val.name;
          report.ranking = val.ranking || null;
        }
        if (key === "fn:opponentSeasonStats" && val.opponent_name) {
          report.opponent_name = val.opponent_name;
          report.year = val.year;
        }
        if (key === "fn:winProb" && typeof val.fonseca === "number") {
          report.fonseca_pct = Math.round(val.fonseca);
          report.opponent_pct = Math.round(val.opponent || (100 - val.fonseca));
          report.opp_name = val.opponent_name || null;
        }
        if (key === "fn:ranking" && val.ranking) {
          report.ranking = val.ranking;
          report.bestRanking = val.bestRanking || null;
        }
        if (key === "fn:atpRankings" && val.rankings) {
          report.size = Array.isArray(val.rankings) ? val.rankings.length : 0;
        }
        if (key === "fn:nextTournament" && val.tournament_name) {
          report.tournament = val.tournament_name;
          report.start = val.start_date;
          report.confirmed = val.fonsecaConfirmed;
        }
      }
      keysReport[key] = report;
    }

    var contextOut = { kind: ctx.kind };
    if (ctx.untilMs != null) contextOut.untilHuman = humanizeMs(ctx.untilMs);
    if (ctx.sinceMs != null) contextOut.sinceHuman = humanizeMs(ctx.sinceMs);

    return res.status(200).json({
      ok: true,
      now: new Date(now).toISOString(),
      context: contextOut,
      summary: {
        total: all.length,
        fresh: fresh,
        stale: stale,
        missing: missing,
      },
      keys: keysReport,
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
}
