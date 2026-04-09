export default async function handler(req, res) {
  return res.status(200).json({
    ok: true,
    legacyCron: true,
    disabled: true,
    message: "Legacy cron endpoint acknowledged successfully.",
    timestamp: new Date().toISOString(),
  });
}
