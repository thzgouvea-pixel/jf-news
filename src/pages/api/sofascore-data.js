// /api/sofascore-data.js — v2 with biography, tournamentFacts, opponentProfile
import { kv } from "@vercel/kv";

async function getKV(key) {
  try {
    var val = await kv.get(key);
    if (!val) return null;
    return typeof val === "string" ? JSON.parse(val) : val;
  } catch (e) { return null; }
}

export default async function handler(req, res) {
  try {
    var [
      matchStats, recentForm, prizeMoney, careerStats,
      ranking, season, lastMatch, nextMatch, winProb,
      biography, tournamentFacts, opponentProfile, nextTournament
    ] = await Promise.all([
      getKV("fn:matchStats"),
      getKV("fn:recentForm"),
      getKV("fn:prizeMoney"),
      getKV("fn:careerStats"),
      getKV("fn:ranking"),
      getKV("fn:season"),
      getKV("fn:lastMatch"),
      getKV("fn:nextMatch"),
      getKV("fn:winProb"),
      getKV("fn:biography"),
      getKV("fn:tournamentFacts"),
      getKV("fn:opponentProfile"),
      getKV("fn:nextTournament"),
    ]);

    var result = {
      matchStats: matchStats ?? null,
      recentForm: recentForm ?? null,
      careerStats: careerStats ?? null,
      ranking: ranking ?? null,
      season: season ?? null,
      lastMatch: lastMatch ?? null,
      nextMatch: nextMatch ?? null,
      winProb: winProb ?? null,
      biography: biography ?? null,
      tournamentFacts: tournamentFacts ?? null,
      opponentProfile: opponentProfile ?? null,
      prizeMoney: (prizeMoney && prizeMoney.amount != null) ? prizeMoney.amount : null,
      nextTournament: nextTournament ?? null,
    };

    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");
    return res.status(200).json(result);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
