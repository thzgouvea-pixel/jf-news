import { kv } from "@vercel/kv";
import { detectUpdateMode, getMatchContext, getRefreshPolicy } from "../../lib/updatePolicy";

async function readJson(key) {
  try {
    const value = await kv.get(key);
    if (!value) return null;
    return typeof value === "string" ? JSON.parse(value) : value;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  try {
    const [nextMatch, lastMatch, liveMatch, ranking, season, biography, opponentProfile, tournamentFacts] = await Promise.all([
      readJson("fn:nextMatch"),
      readJson("fn:lastMatch"),
      readJson("fn:liveMatch"),
      readJson("fn:ranking"),
      readJson("fn:season"),
      readJson("fn:biography"),
      readJson("fn:opponentProfile"),
      readJson("fn:tournamentFacts"),
    ]);

    const now = new Date();
    const mode = detectUpdateMode({ nextMatch, liveMatch, lastMatch }, now);
    const context = getMatchContext(nextMatch, liveMatch, now);
    const policy = getRefreshPolicy(mode, context);

    return res.status(200).json({
      ok: true,
      now: now.toISOString(),
      mode,
      context,
      policy,
      observed: {
        nextMatch: nextMatch ? {
          opponent_name: nextMatch.opponent_name || null,
          tournament_name: nextMatch.tournament_name || null,
          round: nextMatch.round || null,
          date: nextMatch.date || null,
          court: nextMatch.court || null,
          updatedAt: nextMatch.updatedAt || null,
        } : null,
        lastMatch: lastMatch ? {
          opponent_name: lastMatch.opponent_name || null,
          result: lastMatch.result || null,
          date: lastMatch.date || null,
          updatedAt: lastMatch.updatedAt || null,
        } : null,
        liveMatch: liveMatch ? {
          live: !!liveMatch.live,
          status: liveMatch.status || null,
        } : null,
        rankingUpdatedAt: ranking?.updatedAt || null,
        seasonUpdatedAt: season?.updatedAt || null,
        biographyUpdatedAt: biography?.updatedAt || null,
        opponentProfileUpdatedAt: opponentProfile?.updatedAt || null,
        tournamentFactsUpdatedAt: tournamentFacts?.updatedAt || null,
      },
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
}
