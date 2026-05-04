// ===== FONSECA NEWS — CRON CALENDAR v2 =====
// Fetches Joao Fonseca's 2026 ATP calendar via Gemini with grounding.
// Runs weekly via Vercel cron (Monday 6h UTC).
// Also callable manually: /api/cron-calendar?secret=PUSH_SECRET
//
// Output: fn:atpCalendar in KV with:
//  - canonical names matching SofaScore (e.g. "Roma Masters", not "Internazionali BNL")
//  - Portuguese cities (e.g. "Roma", not "Rome")
//  - Portuguese countries (e.g. "Italia", not "Italy")
//  - minimum 18 tournaments, coverage from January to November

import { kv } from "@vercel/kv";
import crypto from "crypto";

// ===== NORMALIZATION MAP: official ATP name -> canonical name used elsewhere =====
// Match by lowercase `includes()`. Order matters — first match wins.
var NAME_NORMALIZATION = [
  // Grand Slams
  { match: ["australian open"], canonical: "Australian Open" },
  { match: ["roland garros", "roland-garros", "french open"], canonical: "Roland Garros" },
  { match: ["wimbledon"], canonical: "Wimbledon" },
  { match: ["us open"], canonical: "US Open" },

  // Masters 1000 — SEMPRE canonico curto
  { match: ["bnp paribas open", "indian wells"], canonical: "Indian Wells" },
  { match: ["miami open"], canonical: "Miami Open" },
  { match: ["monte-carlo masters", "monte carlo masters", "rolex monte-carlo", "monte-carlo", "monte carlo"], canonical: "Monte Carlo" },
  { match: ["mutua madrid open", "madrid open"], canonical: "Madrid Open" },
  { match: ["internazionali bnl", "italian open", "rome masters", "roma masters"], canonical: "Roma Masters" },
  { match: ["national bank open", "canadian open", "rogers cup", "toronto masters", "montreal masters"], canonical: "Canadian Open" },
  { match: ["western & southern open", "western and southern open", "cincinnati open", "cincinnati masters"], canonical: "Cincinnati Masters" },
  { match: ["shanghai rolex masters", "shanghai masters"], canonical: "Shanghai Masters" },
  { match: ["rolex paris masters", "paris masters"], canonical: "Paris Masters" },

  // Finals
  { match: ["nitto atp finals", "atp finals"], canonical: "ATP Finals" },

  // ATP 500 (Joao costuma jogar)
  { match: ["rio open"], canonical: "Rio Open" },
  { match: ["bmw open", "munich open"], canonical: "BMW Open" },
  { match: ["queen's club", "queens club", "cinch championships"], canonical: "Queen's Club" },
  { match: ["hamburg open", "hamburg european open"], canonical: "Hamburg Open" },
  { match: ["dubai duty free", "dubai championships", "dubai tennis"], canonical: "Dubai Championships" },
  { match: ["abierto mexicano", "acapulco open"], canonical: "Acapulco Open" },
  { match: ["china open", "beijing open"], canonical: "China Open" },
  { match: ["japan open", "kinoshita group japan", "tokyo open"], canonical: "Japan Open" },
  { match: ["erste bank open", "vienna open"], canonical: "Vienna Open" },
  { match: ["swiss indoors", "basel open"], canonical: "Basel Open" },
  { match: ["barcelona open", "godo"], canonical: "Barcelona Open" },
  { match: ["halle open", "terra wortmann"], canonical: "Halle Open" },
  { match: ["washington open", "citi open", "mubadala citi"], canonical: "Washington Open" },

  // ATP 250 comuns na america latina
  { match: ["argentina open"], canonical: "Argentina Open" },
  { match: ["chile open"], canonical: "Chile Open" },
  { match: ["brasil open"], canonical: "Brasil Open" },
  { match: ["los cabos open", "los cabos"], canonical: "Los Cabos Open" },
];

// City normalization (English -> Portuguese Brazilian)
var CITY_PT = {
  "rome": "Roma",
  "munich": "Munique",
  "monte carlo": "Mônaco",
  "monte-carlo": "Mônaco",
  "madrid": "Madri",
  "london": "Londres",
  "paris": "Paris",
  "new york": "Nova York",
  "vienna": "Viena",
  "shanghai": "Xangai",
  "tokyo": "Tóquio",
  "beijing": "Pequim",
  "buenos aires": "Buenos Aires",
  "santiago": "Santiago",
  "hamburg": "Hamburgo",
  "dubai": "Dubai",
  "acapulco": "Acapulco",
  "los cabos": "Los Cabos",
  "basel": "Basileia",
  "turin": "Turim",
  "toronto": "Toronto",
  "montreal": "Montreal",
  "cincinnati": "Cincinnati",
  "miami": "Miami",
  "indian wells": "Indian Wells",
  "melbourne": "Melbourne",
  "rio de janeiro": "Rio de Janeiro",
  "barcelona": "Barcelona",
  "halle": "Halle",
  "washington": "Washington",
};

// Country normalization (English -> Portuguese Brazilian)
var COUNTRY_PT = {
  "usa": "Estados Unidos",
  "us": "Estados Unidos",
  "u.s.a.": "Estados Unidos",
  "united states": "Estados Unidos",
  "united states of america": "Estados Unidos",
  "uk": "Reino Unido",
  "united kingdom": "Reino Unido",
  "great britain": "Reino Unido",
  "germany": "Alemanha",
  "italy": "Itália",
  "france": "França",
  "spain": "Espanha",
  "monaco": "Mônaco",
  "australia": "Austrália",
  "switzerland": "Suíça",
  "austria": "Áustria",
  "china": "China",
  "japan": "Japão",
  "uae": "Emirados Árabes",
  "united arab emirates": "Emirados Árabes",
  "mexico": "México",
  "brazil": "Brasil",
  "argentina": "Argentina",
  "chile": "Chile",
  "canada": "Canadá",
};

function normalizeName(rawName) {
  if (!rawName) return rawName;
  var lower = rawName.toLowerCase();
  for (var i = 0; i < NAME_NORMALIZATION.length; i++) {
    var entry = NAME_NORMALIZATION[i];
    for (var j = 0; j < entry.match.length; j++) {
      if (lower.indexOf(entry.match[j]) !== -1) return entry.canonical;
    }
  }
  return rawName;
}

function normalizeCity(rawCity) {
  if (!rawCity) return rawCity;
  return CITY_PT[rawCity.toLowerCase()] || rawCity;
}

function normalizeCountry(rawCountry) {
  if (!rawCountry) return rawCountry;
  return COUNTRY_PT[rawCountry.toLowerCase()] || rawCountry;
}

function safeCompare(a, b) {
  if (!a || !b) return false;
  var bufA = Buffer.from(String(a));
  var bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// Validacao: lista cobre o ano todo? Pelo menos 1 torneio em out/nov/dez.
function hasLateYearCoverage(list) {
  return list.some(function(t) {
    if (!t.start) return false;
    var month = parseInt(t.start.substring(5, 7), 10);
    return month >= 10;
  });
}

export default async function handler(req, res) {
  var isCron = !!req.headers["x-vercel-cron"];

  // GET sem secret -> retorna calendario do KV (rota publica de leitura)
  if (!isCron && !req.query.secret) {
    try {
      var data = await kv.get("fn:atpCalendar");
      if (!data) return res.status(200).json({ calendar: null });
      var parsed = typeof data === "string" ? JSON.parse(data) : data;
      return res.status(200).json(parsed);
    } catch (e) {
      return res.status(200).json({ calendar: null });
    }
  }

  // Manual call -> exige secret
  if (!isCron) {
    var secret = req.query.secret;
    if (!safeCompare(secret, process.env.PUSH_SECRET)) {
      return res.status(401).json({ error: "Senha errada" });
    }
  }

  // Cron: skip se atualizado ha menos de 5 dias
  if (isCron) {
    try {
      var existing = await kv.get("fn:atpCalendar");
      if (existing) {
        var ex = typeof existing === "string" ? JSON.parse(existing) : existing;
        if (ex.updatedAt && (Date.now() - new Date(ex.updatedAt).getTime()) < 5 * 86400000) {
          return res.status(200).json({ skip: true, reason: "fresh", updatedAt: ex.updatedAt });
        }
      }
    } catch (e) {}
  }

  var gk = process.env.GEMINI_API_KEY;
  if (!gk) return res.status(500).json({ error: "GEMINI_API_KEY not set" });

  try {
    // ===== PROMPT V2: nomes canonicos PT-BR + ano completo + minimo 18 =====
    var prompt =
      "Pesquise no site oficial da ATP (atptour.com) e retorne o CALENDARIO COMPLETO 2026 dos torneios que Joao Fonseca jogou ou pode jogar. " +
      "REGRAS OBRIGATORIAS:\n\n" +
      "1. COBRIR O ANO INTEIRO (janeiro a novembro). NAO PARE EM AGOSTO. " +
      "Inclua US Open Series (Cincinnati, Toronto/Canada), Asian Swing (Shanghai, Tokyo, Beijing), " +
      "Indoor Swing (Vienna, Basel, Paris Masters) e ATP Finals em novembro.\n\n" +
      "2. INCLUA TODOS: 4 Grand Slams, 9 Masters 1000, ATP 500 relevantes, ATP 250 que Fonseca tem chance. MINIMO 18 torneios no total.\n\n" +
      "3. NOMES DOS TORNEIOS em formato CURTO e CANONICO em portugues:\n" +
      "   - 'Indian Wells' (NAO 'BNP Paribas Open')\n" +
      "   - 'Madrid Open' (NAO 'Mutua Madrid Open')\n" +
      "   - 'Roma Masters' (NAO 'Internazionali BNL d'Italia')\n" +
      "   - 'Monte Carlo' (NAO 'Rolex Monte-Carlo Masters')\n" +
      "   - 'Cincinnati Masters' (NAO 'Western & Southern Open')\n" +
      "   - 'Canadian Open' (NAO 'National Bank Open' ou 'Rogers Cup')\n" +
      "   - 'Paris Masters' (NAO 'Rolex Paris Masters')\n" +
      "   - 'Shanghai Masters', 'ATP Finals', 'Roland Garros', 'Wimbledon', 'US Open', 'Australian Open'\n" +
      "   - 'Rio Open', 'BMW Open', 'Hamburg Open', 'Vienna Open', 'Basel Open', 'Argentina Open'\n\n" +
      "4. CIDADE em PORTUGUES: 'Munique', 'Madri', 'Roma', 'Londres', 'Nova York', 'Viena', 'Xangai', 'Toquio', 'Pequim', 'Monaco', 'Hamburgo', 'Basileia'.\n\n" +
      "5. PAIS em PORTUGUES: 'Estados Unidos', 'Reino Unido', 'Alemanha', 'Italia', 'Franca', 'Espanha', 'Australia', 'Suica', 'Austria', 'Japao', 'Mexico', 'Canada'.\n\n" +
      "6. SUPERFICIE em portugues: 'Duro', 'Saibro', 'Grama'.\n\n" +
      "7. CATEGORIA EXATA: 'Grand Slam', 'Masters 1000', 'ATP 500', 'ATP 250', 'Finals'.\n\n" +
      "8. DATAS REAIS confirmadas pela ATP. Nao invente.\n\n" +
      "Responda SOMENTE com JSON array COMPACTO em uma unica linha, sem quebras, sem markdown, sem explicacao. " +
      "Formato: [{\"name\":\"Australian Open\",\"cat\":\"Grand Slam\",\"surface\":\"Duro\",\"city\":\"Melbourne\",\"country\":\"Australia\",\"start\":\"2026-01-18\",\"end\":\"2026-02-01\"}]";

    var r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + gk, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        tools: [{ google_search: {} }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 16384 }
      })
    });

    if (!r.ok) {
      var errText = await r.text();
      return res.status(500).json({ error: "Gemini HTTP " + r.status, detail: errText.substring(0, 300) });
    }

    var d = await r.json();
    var parts = d.candidates && d.candidates[0] && d.candidates[0].content && d.candidates[0].content.parts;
    if (!parts) return res.status(500).json({ error: "Gemini: no parts", raw: JSON.stringify(d).substring(0, 500) });

    var txt = "";
    parts.forEach(function(p) { if (p.text && !p.thought) txt += p.text; });
    if (!txt) return res.status(500).json({ error: "Gemini: empty text" });

    // Parse JSON tolerante a truncamento
    var cleaned = txt.replace(/```json|```/g, "").trim();
    var arrMatch = cleaned.match(/\[[\s\S]*\]/);
    if (!arrMatch && cleaned.indexOf("[") !== -1) {
      var lastBrace = cleaned.lastIndexOf("}");
      if (lastBrace > 0) {
        try {
          var salvaged = cleaned.substring(cleaned.indexOf("["), lastBrace + 1) + "]";
          arrMatch = [salvaged];
        } catch(e) {}
      }
    }
    if (!arrMatch) return res.status(500).json({ error: "No JSON array found", raw: txt.substring(0, 500) });

    var arr;
    try {
      arr = JSON.parse(arrMatch[0]);
    } catch (parseErr) {
      return res.status(500).json({ error: "JSON parse failed: " + parseErr.message, raw: arrMatch[0].substring(0, 500) });
    }
    if (!Array.isArray(arr)) return res.status(500).json({ error: "Parsed but not array" });

    // ===== NORMALIZATION =====
    var validRaw = arr.filter(function(t) { return t.name && t.start; });

    var normalized = validRaw.map(function(t) {
      return {
        name: normalizeName(t.name),
        cat: t.cat || "",
        surface: t.surface || "",
        city: normalizeCity(t.city),
        country: normalizeCountry(t.country),
        start: t.start,
        end: t.end || t.start,
      };
    });

    // Dedupe por nome canonico (mantem primeira ocorrencia)
    var seenNames = {};
    var deduped = [];
    normalized.forEach(function(t) {
      var key = (t.name || "").toLowerCase();
      if (key && !seenNames[key]) { seenNames[key] = true; deduped.push(t); }
    });

    // ===== VALIDATION =====
    var minTournaments = 18;
    var passesCount = deduped.length >= minTournaments;
    var passesCoverage = hasLateYearCoverage(deduped);

    if (!passesCount || !passesCoverage) {
      // Gemini retornou ruim. Decidir: o KV existente tambem e ruim?
      // Se sim, deletar pra forcar fallback ao hardcoded no frontend.
      // Se o existente e bom, mantem (nao sobrescreve).
      try {
        var existingForCheck = await kv.get("fn:atpCalendar");
        if (existingForCheck) {
          var exParsed = typeof existingForCheck === "string" ? JSON.parse(existingForCheck) : existingForCheck;
          var exList = (exParsed && exParsed.tournaments) || [];
          var exPassesCount = exList.length >= minTournaments;
          var exPassesCoverage = hasLateYearCoverage(exList);
          if (!exPassesCount || !exPassesCoverage) {
            await kv.del("fn:atpCalendar");
          }
        }
      } catch (e) {}

      return res.status(200).json({
        ok: false,
        rejected: true,
        reason: !passesCount
          ? ("too few tournaments: " + deduped.length + " < " + minTournaments)
          : "missing late year coverage (Oct/Nov/Dec)",
        count: deduped.length,
        names: deduped.map(function(t) { return t.name; }),
      });
    }

    // ===== ADD DISPLAY FIELDS =====
    var monthNames = ["JAN","FEV","MAR","ABR","MAI","JUN","JUL","AGO","SET","OUT","NOV","DEZ"];
    var mShort = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
    deduped.forEach(function(t) {
      var sd = new Date(t.start);
      var ed = t.end ? new Date(t.end) : sd;
      t.month = monthNames[sd.getUTCMonth()] || "";
      t.date = sd.getUTCDate() + " " + mShort[sd.getUTCMonth()] + " - " + ed.getUTCDate() + " " + mShort[ed.getUTCMonth()];
    });
    deduped.sort(function(a, b) { return a.start.localeCompare(b.start); });

    // ===== SAVE TO KV (14 days TTL) =====
    var payload = { tournaments: deduped, updatedAt: new Date().toISOString() };
    await kv.set("fn:atpCalendar", JSON.stringify(payload), { ex: 86400 * 14 });

    return res.status(200).json({
      ok: true,
      count: deduped.length,
      tournaments: deduped.map(function(t) { return t.name + " (" + t.cat + ") " + t.date; }),
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
