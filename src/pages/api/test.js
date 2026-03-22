export default async function handler(req, res) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    return res.status(200).json({ error: "No API key found" });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2025-03-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 100,
        messages: [{ role: "user", content: "Diz oi" }],
      }),
    });

    const data = await response.json();
    res.status(200).json({ status: response.status, data });
  } catch (error) {
    res.status(200).json({ error: error.message });
  }
}
