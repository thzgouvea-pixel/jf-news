// /api/all-data.js — Consolidated data endpoint
// Replaces separate calls to /api/sofascore-data, /api/stats, /api/rankings
// s-maxage=120 (2min edge cache) — cron updates KV every 4h, live.js handles real-time scores

import { kv } from "@vercel/kv";

async function getKV(key) {
  try {
    var val = await kv.get(key);
    if (!val) return null;
    return typeof val === "string" ? JSON.parse(val) : val;
  } catch (e) { return null; }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=300");

  try {
    var now = new Date();
    var brasilia = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    var today = brasilia.toISOString().split("T")[0];
    var dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);

    // Fetch all KV data in parallel — single function invocation instead of 10
    var results = await Promise.all([
      // sofascore-data keys (13 reads)
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
      // rankings key
      getKV("fn:atpRankings"),
      // stats keys — mget batches 4 reads into a single round-trip
      kv.mget("visitors:total", "site:feedback", "poll:" + today, "likes:all"),
      // interactive features (saves 3 separate API calls)
      getKV("fn:quizCount"),
      getKV("fn:poll:" + dayOfYear),
      getKV("fn:predict:next"),
      getKV("fn:highlight-video"),
      getKV("fn:bracketUrl"),
      getKV("fn:h2h"),
      getKV("fn:pregameForm"),
    ]);

    var matchStats = results[0];
    var recentForm = results[1];
    var prizeMoney = results[2];
    var careerStats = results[3];
    var ranking = results[4];
    var season = results[5];
    var lastMatch = results[6];
    var nextMatch = results[7];
    var winProb = results[8];
    var biography = results[9];
    var tournamentFacts = results[10];
    var opponentProfile = results[11];
    var nextTournament = results[12];
    var atpRankings = results[13];
    var statsValues = results[14] || [];
    var quizCount = results[15];
    var pollData = results[16];
    var predictData = results[17];
    var highlightVideo = results[18];
    var bracketUrl = results[19];
    var h2h = results[20];
    var pregameForm = results[21];

    var parse = function(val) {
      if (!val) return null;
      if (typeof val === "string") { try { return JSON.parse(val); } catch(e) { return val; } }
      return val;
    };

    // Build poll response (same shape as /api/vote GET)
    var pollParsed = pollData || { a: 0, b: 0 };
    var pollTotal = (pollParsed.a || 0) + (pollParsed.b || 0);

    // Build predict response (same shape as /api/predict GET)
    var predParsed = predictData || {};
    var predTotal = 0;
    var predictions = {};
    for (var pk in predParsed) { predTotal += predParsed[pk]; }
    for (var pk2 in predParsed) { predictions[pk2] = { count: predParsed[pk2], pct: predTotal > 0 ? Math.round((predParsed[pk2] / predTotal) * 100) : 0 }; }

    return res.status(200).json({
      // sofascore-data fields (same shape as /api/sofascore-data)
      matchStats: matchStats || null,
      recentForm: recentForm || null,
      careerStats: careerStats || null,
      ranking: ranking || null,
      season: season || null,
      lastMatch: lastMatch || null,
      nextMatch: nextMatch || null,
      winProb: winProb || null,
      biography: biography || null,
      bracketUrl: bracketUrl || null,
      tournamentFacts: tournamentFacts || null,
      opponentProfile: opponentProfile || null,
      prizeMoney: (prizeMoney && prizeMoney.amount != null) ? prizeMoney.amount : null,
      nextTournament: nextTournament || null,
      // rankings (same shape as /api/rankings response)
      rankings: atpRankings || { rankings: [], updatedAt: null },
      // stats (same shape as /api/stats response, nested under "stats")
      stats: {
        visitors: parse(statsValues[0]) || 0,
        feedback: parse(statsValues[1]) || { up: 0, down: 0 },
        poll: parse(statsValues[2]) || { a: 0, b: 0, total: 0 },
        likes: parse(statsValues[3]) || {}
      },
      // interactive features (saves 3-4 separate API calls)
      quizCount: quizCount ? parseInt(quizCount, 10) || 0 : 0,
      pollResults: { a: pollParsed.a || 0, b: pollParsed.b || 0, total: pollTotal, pctA: pollTotal > 0 ? Math.round(((pollParsed.a||0) / pollTotal) * 100) : 50, pctB: pollTotal > 0 ? Math.round(((pollParsed.b||0) / pollTotal) * 100) : 50 },
      predictResults: { predictions: predictions, total: predTotal },
      highlightVideo: highlightVideo || null,
      h2h: h2h || null,
      pregameForm: pregameForm || null,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
