import { kv } from "@vercel/kv";
import { getCurrentMode, readJson, writeJson, shouldRunKey, touchKey } from "../../../lib/jobs/coreMatchShared";

function buildSeasonFromForm(form) {
  const currentYear = new Date().getFullYear();
  let wins = 0;
  let losses = 0;

  for (const match of form) {
    if (!match?.date) continue;
    const year = new Date(match.date).getFullYear();
    if (year !== currentYear) continue;
    if (match.result === "V") wins += 1;
    else if (match.result === "D") losses += 1;
  }

  if (!wins && !losses) return null;
  return {
    wins,
    losses,
    year: currentYear,
    updatedAt: new Date().toISOString(),
  };
}

function buildEditorialBiography(lastMatch, ranking) {
  if (!lastMatch) return null;

  const lines = [];
  if (lastMatch.result === "V") {
    lines.push(`João Fonseca venceu ${lastMatch.opponent_name} em ${lastMatch.tournament_name}.`);
  } else if (lastMatch.result === "D") {
    lines.push(`João Fonseca foi superado por ${lastMatch.opponent_name} em ${lastMatch.tournament_name}.`);
  }

  if (lastMatch.score) lines.push(`Placar da última partida: ${lastMatch.score}.`);
  if (ranking?.ranking) lines.push(`Ranking ATP atual: #${ranking.ranking}.`);

  return {
    summary: lines.join(" "),
    last_event_id: lastMatch.event_id || null,
    updatedAt: new Date().toISOString(),
  };
}

function buildJoaoEmNumeros(lastMatch, season, recentForm) {
  const wins = season?.wins || 0;
  const losses = season?.losses || 0;
  const total = wins + losses;
  const winPct = total > 0 ? Math.round((wins / total) * 100) : null;

  return {
    season_wins: wins,
    season_losses: losses,
    season_win_pct: winPct,
    recent_form: Array.isArray(recentForm) ? recentForm.slice(0, 10).map((m) => m.result) : [],
    last_result: lastMatch?.result || null,
    last_opponent: lastMatch?.opponent_name || null,
    updatedAt: new Date().toISOString(),
  };
}

export default async function handler(req, res) {
  try {
    const modeState = await getCurrentMode();
    const forced = req.query.force === "1" || req.headers["x-force-refresh"] === "1";
    const ttl = modeState.mode === "postmatch" ? 60 * 15 : 60 * 60 * 6;
    const allowed = forced || await shouldRunKey("fn:job:postMatch:lastRun", ttl);

    if (!allowed) {
      return res.status(200).json({
        ok: true,
        skipped: true,
        mode: modeState.mode,
        ttl,
        reason: "mode-aware throttle",
      });
    }

    const log = [];
    const [lastMatch, recentForm, ranking] = await Promise.all([
      readJson("fn:lastMatch"),
      readJson("fn:recentForm"),
      readJson("fn:ranking"),
    ]);

    const normalizedForm = Array.isArray(recentForm) ? recentForm : [];
    const season = buildSeasonFromForm(normalizedForm);
    if (season) {
      await writeJson("fn:season", season, 86400);
      log.push(`season: ${season.wins}W-${season.losses}L`);
    }

    const editorialBiography = buildEditorialBiography(lastMatch, ranking);
    if (editorialBiography) {
      const previous = await readJson("fn:biographyEditorial");
      const sameEvent = previous?.last_event_id && String(previous.last_event_id) === String(editorialBiography.last_event_id);
      if (!sameEvent || forced) {
        await writeJson("fn:biographyEditorial", editorialBiography, 86400);
        log.push("biographyEditorial: refreshed");
      } else {
        log.push("biographyEditorial: unchanged");
      }
    }

    const joaoEmNumeros = buildJoaoEmNumeros(lastMatch, season, normalizedForm);
    await writeJson("fn:joaoEmNumeros", joaoEmNumeros, 86400);
    log.push("joaoEmNumeros: refreshed");

    await touchKey("fn:job:postMatch:lastRun");

    return res.status(200).json({
      ok: true,
      skipped: false,
      mode: modeState.mode,
      ttl,
      updated: {
        season: !!season,
        biographyEditorial: !!editorialBiography,
        joaoEmNumeros: true,
      },
      log,
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
}
