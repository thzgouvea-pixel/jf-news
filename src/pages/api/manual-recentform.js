import { kv } from "@vercel/kv";
import crypto from "crypto";

function safeCompare(a, b) {
  if (!a || !b) return false;
  var bufA = Buffer.from(String(a));
  var bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export default async function handler(req, res) {
  var secret = req.query.secret || req.headers["x-secret"];
  if (!safeCompare(secret, process.env.PUSH_SECRET)) {
    return res.status(401).json({ error: "unauthorized" });
  }
  try {
    // Accept JSON body (POST) or set hardcoded correct data (GET)
    if (req.method === "POST" && req.body && req.body.matches) {
      var matches = req.body.matches;
      await kv.set("fn:recentForm", JSON.stringify(matches.slice(0, 10)), { ex: 86400 * 7 });
      await kv.set("fn:recentFormManualLock", new Date().toISOString(), { ex: 86400 * 3 });
      return res.status(200).json({ ok: true, count: matches.length });
    }

    // GET: set the verified correct recent form
    var form = [
      { result: "D", score: "5-7 7-6 3-6", opponent_name: "A. Zverev", opponent_ranking: 3, opponent_country: "Germany", tournament: "Monte Carlo, Monaco", date: "2026-04-10T06:15:00Z" },
      { result: "V", score: "6-3 6-2", opponent_name: "M. Berrettini", opponent_ranking: 90, tournament: "Monte Carlo, Monaco", date: "2026-04-09T06:10:00Z" },
      { result: "V", score: "7-5 4-6 6-3", opponent_name: "A. Rinderknech", opponent_ranking: 27, tournament: "Monte Carlo, Monaco", date: "2026-04-08T07:45:00Z" },
      { result: "V", score: "6-2 6-3", opponent_name: "G. Diallo", opponent_ranking: 36, tournament: "Monte Carlo, Monaco", date: "2026-04-06T11:25:00Z" },
      { result: "D", score: "4-6 4-6", opponent_name: "C. Alcaraz", opponent_ranking: 1, tournament: "Miami, USA", date: "2026-03-20T21:25:00Z" },
      { result: "V", score: "6-4 3-6 6-2", opponent_name: "F. Marozsán", opponent_ranking: 43, tournament: "Miami, USA", date: "2026-03-19T17:00:00Z" },
      { result: "D", score: "6-7 6-7", opponent_name: "J. Sinner", opponent_ranking: 2, tournament: "Indian Wells, USA", date: "2026-03-10T22:10:00Z" },
      { result: "V", score: "6-2 6-3", opponent_name: "T. Paul", opponent_ranking: 18, tournament: "Indian Wells, USA", date: "2026-03-08T23:40:00Z" },
      { result: "V", score: "4-6 7-6 6-4", opponent_name: "K. Khachanov", opponent_ranking: 14, tournament: "Indian Wells, USA", date: "2026-03-07T18:00:00Z" },
      { result: "V", score: "7-6 6-4", opponent_name: "R. Collignon", opponent_ranking: 68, tournament: "Indian Wells, USA", date: "2026-03-04T23:55:00Z" },
    ];

    await kv.set("fn:recentForm", JSON.stringify(form), { ex: 86400 * 7 });
    await kv.set("fn:recentFormManualLock", new Date().toISOString(), { ex: 86400 * 3 });
    return res.status(200).json({ ok: true, count: form.length, matches: form.map(function(m) { return m.result + " " + m.opponent_name; }) });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
