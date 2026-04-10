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

    var result = {};
    if (matchStats) result.matchStats = matchStats;
    if (recentForm) result.recentForm = recentForm;
    if (careerStats) result.careerStats = careerStats;
    if (ranking) result.ranking = ranking;
    if (season) result.season = season;
    if (lastMatch) result.lastMatch = lastMatch;
    if (nextMatch) result.nextMatch = nextMatch;
    if (winProb) result.winProb = winProb;
    if (biography) result.biography = biography;
    if (tournamentFacts) result.tournamentFacts = tournamentFacts;
    if (opponentProfile) result.opponentProfile = opponentProfile;
    if (prizeMoney && prizeMoney.amount) result.prizeMoney = prizeMoney.amount;
    if (nextTournament) result.nextTournament = nextTournament;

    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");
    return res.status(200).json(result);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
