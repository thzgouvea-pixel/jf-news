import { getCurrentMode } from "../../../lib/jobs/coreMatchShared";

function getBaseUrl(req) {
  const forwardedProto = req.headers["x-forwarded-proto"];
  const proto = forwardedProto || "https";
  const host = req.headers.host || "fonsecanews.com.br";
  return `${proto}://${host}`;
}

async function callJob(baseUrl, path, secret) {
  const res = await fetch(`${baseUrl}${path}`, {
    method: "GET",
    headers: secret ? { "x-orchestrator-secret": secret } : {},
  });

  let json = null;
  try {
    json = await res.json();
  } catch {
    json = { ok: false, error: "Invalid JSON response" };
  }

  return {
    path,
    status: res.status,
    ok: res.ok,
    body: json,
  };
}

export default async function handler(req, res) {
  try {
    const baseUrl = getBaseUrl(req);
    const secret = process.env.ORCHESTRATOR_SECRET || "";
    const modeState = await getCurrentMode();

    const jobs = ["/api/jobs/core-match", "/api/jobs/news-refresh"];

    if (modeState.mode === "postmatch") {
      jobs.push("/api/jobs/post-match-recalc");
    }

    if (modeState.mode === "ranking_day" || modeState.mode === "idle" || modeState.mode === "draw_pending") {
      jobs.push("/api/jobs/slow-refresh");
    }

    const results = [];
    for (const job of jobs) {
      results.push(await callJob(baseUrl, job, secret));
    }

    return res.status(200).json({
      ok: true,
      mode: modeState.mode,
      jobs,
      results,
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
}
