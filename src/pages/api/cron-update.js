export default async function handler(req, res) {
  try {
    const forwardedProto = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers.host || "fonsecanews.com.br";
    const baseUrl = `${forwardedProto}://${host}`;
    const secret = process.env.ORCHESTRATOR_SECRET || "";

    const response = await fetch(`${baseUrl}/api/jobs/orchestrate-refresh`, {
      method: "GET",
      headers: secret ? { "x-orchestrator-secret": secret } : {},
    });

    let payload = null;
    try {
      payload = await response.json();
    } catch {
      payload = { ok: false, error: "Invalid JSON response from orchestrator" };
    }

    return res.status(response.ok ? 200 : 500).json({
      ok: response.ok,
      legacyCron: true,
      delegatedTo: "/api/jobs/orchestrate-refresh",
      payload,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      legacyCron: true,
      error: error.message,
    });
  }
}
