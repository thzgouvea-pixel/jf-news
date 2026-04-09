import { kv } from "@vercel/kv";
import { readJson, writeJson, getCurrentMode, shouldRunKey, touchKey, findLastMatch, findNextMatch, parseMatch, fetchMatchStats } from "../../../lib/jobs/coreMatchShared";

async function upsertRecentForm(lastMatch) {
  if (!lastMatch) return { changed: false, form: [] };
  const existingForm = await readJson("fn:recentForm");
  const form = Array.isArray(existingForm) ? existingForm : [];
  const alreadyInForm = form.some((item) => String(item.event_id) === String(lastMatch.event_id));
  if (alreadyInForm) return { changed: false, form };
  const nextForm = [lastMatch, ...form].slice(0, 10);
  await writeJson("fn:recentForm", nextForm, 86400 * 7);
  return { changed: true, form: nextForm };
}

function buildPlaceholder(lastMatch, lastResult) {
  if (lastMatch && lastMatch.result === "V" && lastResult.daysAgo <= 2 && lastMatch.tournament_name) {
    const roundProgression = {
      "1ª Rodada": "2ª Rodada",
      "2ª Rodada": "Oitavas de final",
      "Oitavas de final": "Quartas de final",
      "Quartas de final": "Semifinal",
      Semifinal: "Final",
      R1: "R2",
      R2: "R3",
      R3: "QF",
      QF: "SF",
      SF: "F",
      "Round of 128": "Round of 64",
      "Round of 64": "Round of 32",
      "Round of 32": "Round of 16",
      "Round of 16": "Quarterfinals",
      Quarterfinals: "Semifinals",
      Semifinals: "Final",
    };

    return {
      opponent_name: "A definir",
      opponent_id: null,
      opponent_ranking: null,
      opponent_country: "",
      tournament_name: lastMatch.tournament_name,
      tournament_category: lastMatch.tournament_category || "",
      surface: lastMatch.surface || "",
      city: lastMatch.city || "",
      round: roundProgression[lastMatch.round] || "",
      date: null,
      court: null,
      isFonsecaHome: true,
      updatedAt: new Date().toISOString(),
    };
  }

  return {
    opponent_name: "A definir",
    tournament_name: "",
    date: null,
    updatedAt: new Date().toISOString(),
  };
}

export default async function handler(req, res) {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) return res.status(200).json({ ok: false, error: "No RAPIDAPI_KEY" });

  try {
    const log = [];
    const modeState = await getCurrentMode();
    const ttl = modeState.policy.coreMatchTtl;
    const forced = req.query.force === "1" || req.headers["x-force-refresh"] === "1";
    const allowed = forced || await shouldRunKey("fn:job:coreMatch:lastRun", ttl);

    if (!allowed) {
      return res.status(200).json({
        ok: true,
        skipped: true,
        mode: modeState.mode,
        ttl,
        reason: "mode-aware throttle",
      });
    }

    let totalRequests = 0;

    const lastResult = await findLastMatch(apiKey, log);
    totalRequests += lastResult.requestsUsed;
    let lastMatch = null;

    if (lastResult.match) {
      lastMatch = parseMatch(lastResult.match, false);
      await writeJson("fn:lastMatch", lastMatch, 86400 * 3);
      log.push(`lastMatch: ${lastMatch.result} vs ${lastMatch.opponent_name}`);

      const prevStatsId = await kv.get("fn:lastStatsEventId");
      if (String(lastResult.match.id) !== String(prevStatsId)) {
        const rawStats = await fetchMatchStats(lastResult.match.id, apiKey, log);
        totalRequests += 1;
        if (rawStats) {
          const fonseca = lastMatch.isFonsecaHome ? rawStats.home : rawStats.away;
          const opponent = lastMatch.isFonsecaHome ? rawStats.away : rawStats.home;
          await writeJson("fn:matchStats", {
            event_id: lastResult.match.id,
            fonseca,
            opponent,
            opponent_name: lastMatch.opponent_name,
            opponent_id: lastMatch.opponent_id,
            opponent_ranking: lastMatch.opponent_ranking,
            opponent_country: lastMatch.opponent_country,
            tournament: lastMatch.tournament_name,
            date: lastMatch.date,
            result: lastMatch.result,
            score: lastMatch.score,
          }, 86400 * 7);
          await kv.set("fn:lastStatsEventId", String(lastResult.match.id));
          log.push("matchStats: refreshed");
        }
      }

      const formResult = await upsertRecentForm(lastMatch);
      if (formResult.changed) log.push(`recentForm: added ${lastMatch.opponent_name}`);
    }

    const nextResult = await findNextMatch(apiKey, log);
    totalRequests += nextResult.requestsUsed;
    let nextMatch = null;

    if (nextResult.match) {
      nextMatch = parseMatch(nextResult.match, true);
      await writeJson("fn:nextMatch", nextMatch, 86400);
      log.push(`nextMatch: ${nextMatch.opponent_name} @ ${nextMatch.tournament_name}`);
    } else {
      nextMatch = buildPlaceholder(lastMatch, lastResult);
      await writeJson("fn:nextMatch", nextMatch, 86400);
      log.push("nextMatch: placeholder or cleared");
    }

    await touchKey("fn:job:coreMatch:lastRun");
    await kv.set("fn:cronLastRun", new Date().toISOString());

    return res.status(200).json({
      ok: true,
      skipped: false,
      mode: modeState.mode,
      ttl,
      requests: totalRequests,
      updated: {
        lastMatch: !!lastMatch,
        nextMatch: !!nextMatch,
      },
      log,
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
}
