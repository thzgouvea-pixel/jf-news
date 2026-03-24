// ===== CRON: Daily SofaScore Update =====
// Runs once per day via Vercel Cron
// Updates ranking and last match data

export default async function handler(req, res) {
  try {
    // Call our own news API with cron flag
    const protocol = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers.host;
    const baseUrl = protocol + "://" + host;

    const response = await fetch(baseUrl + "/api/news", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cron: true })
    });

    const data = await response.json();

    console.log("[cron-update] SofaScore data refreshed:", JSON.stringify(data));

    res.status(200).json({
      ok: true,
      message: "Daily SofaScore update complete",
      data: data
    });
  } catch (error) {
    console.error("[cron-update] Error:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
}
