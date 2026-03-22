// Server-side cache - shared across ALL users
let cachedData = null;
let cacheTimestamp = 0;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export default async function handler(req, res) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured" });
  }

  const now = Date.now();
  const cacheAge = now - cacheTimestamp;
  const forceRefresh = req.method === "POST" && req.body?.force === true;

  if (cachedData && cacheAge < CACHE_TTL && !forceRefresh) {
    return res.status(200).json({
      ...cachedData,
      _cache: { hit: true, age: cacheAge, expiresIn: CACHE_TTL - cacheAge }
    });
  }

  try {
    const today = new Date().toLocaleDateString("pt-BR");
    
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4000,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{
          role: "user",
          content: `Hoje é ${today}. Busque TODAS as informações mais recentes sobre João Fonseca, tenista brasileiro. Faça MÚLTIPLAS buscas: "João Fonseca tênis hoje", "João Fonseca notícias", "João Fonseca ranking ATP", "João Fonseca próximo torneio". Priorize notícias das últimas 48 horas. Busque em sites como ESPN, GE, UOL, Lance, O Tempo, CNN Brasil, Olympics.com, Tenis News, ATP Tour.

Responda APENAS com JSON (sem markdown, sem backticks):
{
  "player": { "ranking": numero, "rankingChange": N (positivo = subiu, negativo = caiu) },
  "season": { "wins": N, "losses": N, "titles": N, "year": 2026 },
  "lastMatch": { "result": "V" ou "D", "score": "6-3 6-4", "opponent": "T. Sobrenome", "tournament": "nome curto", "round": "R1/R2/QF/SF/F" },
  "nextMatch": { "tournament_category": "ATP 250/500/Masters 1000/Grand Slam", "tournament_name": "nome", "surface": "Saibro/Dura/Grama", "city": "cidade", "country": "país", "date": "YYYY-MM-DD ou vazio", "round": "fase ou vazio" },
  "news": [{ "title": "em português", "summary": "1-2 frases", "source": "veículo", "url": "OBRIGATÓRIO: URL completa (https://...) da notícia encontrada na busca. Nunca vazio.", "image": "URL da imagem/thumbnail ou vazio", "date": "ISO", "category": "Torneio/Resultado/Treino/Declaração/Ranking/Notícia" }]
}
10-15 notícias, mais recente primeiro. IMPORTANTE: faça várias buscas web para encontrar o máximo de notícias recentes. Cada notícia DEVE ter URL real. APENAS JSON.`
        }]
      }),
    });

    if (!response.ok) {
      const errData = await response.json();
      console.error("Anthropic API error:", JSON.stringify(errData));
      if (cachedData) {
        return res.status(200).json({ ...cachedData, _cache: { hit: true, stale: true } });
      }
      return res.status(response.status).json(errData);
    }

    const data = await response.json();
    let text = "";
    if (data.content) {
      for (const block of data.content) {
        if (block.type === "text" && block.text) text += block.text;
      }
    }

    let cleaned = text.trim().replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const objStart = cleaned.indexOf("{");
    const objEnd = cleaned.lastIndexOf("}");
    
    if (objStart !== -1 && objEnd !== -1) {
      const parsed = JSON.parse(cleaned.substring(objStart, objEnd + 1));
      if (parsed?.news?.length) {
        parsed.news.sort((a, b) => new Date(b.date) - new Date(a.date));
        cachedData = parsed;
        cacheTimestamp = now;
        return res.status(200).json({ ...parsed, _cache: { hit: false, freshAt: now } });
      }
    }
    throw new Error("Could not parse response");

  } catch (error) {
    console.error("Fetch error:", error);
    if (cachedData) {
      return res.status(200).json({ ...cachedData, _cache: { hit: true, stale: true } });
    }
    res.status(500).json({ error: "Failed to fetch news" });
  }
}
