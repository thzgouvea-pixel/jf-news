import { kv } from "@vercel/kv";
import { getCurrentMode, readJson, writeJson, shouldRunKey, touchKey } from "../../../lib/jobs/coreMatchShared";

async function fetchWikipediaWikitext(page) {
  const res = await fetch(
    `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(page)}&prop=wikitext&format=json`,
    { headers: { "User-Agent": "FonsecaNews/10.0" } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data?.parse?.wikitext?.["*"] || null;
}

function getField(wikitext, field) {
  const match = wikitext.match(new RegExp(`\\|\\s*${field}\\s*=\\s*([^\\n|]+)`, "i"));
  return match
    ? match[1]
        .replace(/\[\[([^\]|]*\|)?([^\]]*)\]\]/g, "$2")
        .replace(/\{\{[^}]*\}\}/g, "")
        .trim()
    : null;
}

async function refreshRanking(log) {
  const wikitext = await fetchWikipediaWikitext("Jo%C3%A3o_Fonseca_(tennis)");
  if (!wikitext) {
    log.push("ranking: wikipedia unavailable");
    return null;
  }

  const rankMatch = wikitext.match(/currentsinglesranking\s*=\s*No\.\s*(\d{1,4})/i);
  if (!rankMatch) {
    log.push("ranking: field not found");
    return null;
  }

  const ranking = parseInt(rankMatch[1], 10);
  const highMatch = wikitext.match(/highestsinglesranking\s*=\s*No\.\s*(\d{1,4})/i);
  const bestRanking = highMatch ? parseInt(highMatch[1], 10) : null;
  const prizeMatch = wikitext.match(/careerprizemoney\s*=\s*(?:US\s*)?\$\s*([\d,]+)/i);
  const prizeMoney = prizeMatch ? parseInt(prizeMatch[1].replace(/,/g, ""), 10) : null;

  const payload = {
    ranking,
    points: null,
    previousRanking: null,
    bestRanking,
    rankingChange: 0,
    prizeMoney,
    updatedAt: new Date().toISOString(),
  };

  await writeJson("fn:ranking", payload, 86400 * 7);
  if (prizeMoney) {
    await writeJson("fn:prizeMoney", { amount: prizeMoney, currency: "USD", updatedAt: new Date().toISOString() }, 86400 * 8);
  }
  log.push(`ranking: #${ranking}`);
  return payload;
}

async function refreshBiographyBase(log) {
  const wikitext = await fetchWikipediaWikitext("Jo%C3%A3o_Fonseca_(tennis)");
  if (!wikitext) {
    log.push("biographyBase: wikipedia unavailable");
    return null;
  }

  const bdMatch = wikitext.match(/birth.date.*?\|(\d{4})\|(\d{1,2})\|(\d{1,2})/i);
  const birthDate = bdMatch ? `${String(bdMatch[3]).padStart(2, "0")}/${String(bdMatch[2]).padStart(2, "0")}/${bdMatch[1]}` : null;
  const birthPlace = getField(wikitext, "birth_place") || "Ipanema, Rio de Janeiro";
  const hMatch = wikitext.match(/height.*?(\d\.\d{2})/i);
  const height = hMatch ? `${hMatch[1]}m` : null;
  const plays = getField(wikitext, "plays");
  const hand = plays ? (plays.toLowerCase().includes("right") ? "Destro" : plays.toLowerCase().includes("left") ? "Canhoto" : plays) : null;
  const coach = getField(wikitext, "coach") || getField(wikitext, "trainer");
  const proYear = getField(wikitext, "turned_pro") || getField(wikitext, "turnedpro") || null;
  const bestRanking = (getField(wikitext, "highestsinglesranking")?.match(/(\d+)/) || [])[1] || null;

  const payload = {
    birthDate,
    birthPlace: birthPlace.replace(/,?\s*Brazil$/i, ""),
    height,
    hand,
    coach,
    proSince: proYear ? `Profissional desde ${proYear}` : null,
    bestRanking,
    updatedAt: new Date().toISOString(),
  };

  await writeJson("fn:biographyBase", payload, 86400 * 14);
  log.push("biographyBase: refreshed");
  return payload;
}

async function refreshTournamentFacts(nextMatch, log) {
  const tournamentName = nextMatch?.tournament_name;
  if (!tournamentName) {
    log.push("tournamentFacts: no tournament");
    return null;
  }

  const curated = {
    "monte carlo": [
      { icon: "🏔️", text: "Jogado num penhasco com vista pro Mediterrâneo" },
      { icon: "👑", text: "Nadal venceu 11 vezes — recorde absoluto" },
      { icon: "🎾", text: "1º Masters 1000 de saibro da temporada" },
    ],
    wimbledon: [
      { icon: "🍓", text: "Morangos e creme são tradição histórica do torneio" },
      { icon: "🌱", text: "A grama é uma das marcas registradas do evento" },
      { icon: "👔", text: "Código de vestimenta: quase tudo branco" },
    ],
    "roland garros": [
      { icon: "🧱", text: "Roland Garros é o grande Slam do saibro" },
      { icon: "👑", text: "Nadal é o maior campeão da história do torneio" },
      { icon: "🇧🇷", text: "Guga é o único brasileiro campeão em simples" },
    ],
  };

  const lower = tournamentName.toLowerCase();
  const key = Object.keys(curated).find((k) => lower.includes(k));
  if (!key) {
    log.push("tournamentFacts: no curated facts for current tournament");
    return null;
  }

  const payload = {
    name: tournamentName,
    facts: curated[key],
    source: "curated",
    updatedAt: new Date().toISOString(),
  };
  await writeJson("fn:tournamentFacts", payload, 86400 * 14);
  log.push(`tournamentFacts: ${curated[key].length} curated facts`);
  return payload;
}

async function refreshOpponentProfile(nextMatch, log) {
  const opponentName = nextMatch?.opponent_name;
  if (!opponentName || opponentName === "A definir") {
    log.push("opponentProfile: no defined opponent");
    return null;
  }

  const cached = await readJson("fn:opponentProfile");
  if (cached?.name === opponentName) {
    log.push("opponentProfile: same opponent in cache");
    return cached;
  }

  const cleanName = opponentName.replace(/^[A-Z]\.\s*/, "").trim();
  const searchTerms = [`${cleanName} tennis player`, `${cleanName} tennis`];
  let wikitext = null;

  for (const term of searchTerms) {
    try {
      const res = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(term)}&srlimit=3&format=json`,
        { headers: { "User-Agent": "FonsecaNews/10.0" } }
      );
      if (!res.ok) continue;
      const data = await res.json();
      const pageTitle = data?.query?.search?.[0]?.title;
      if (!pageTitle) continue;
      wikitext = await fetchWikipediaWikitext(pageTitle);
      if (wikitext && wikitext.length > 200) break;
    } catch {
      continue;
    }
  }

  if (!wikitext) {
    log.push(`opponentProfile: no wikipedia page for ${opponentName}`);
    return null;
  }

  const hMatch = wikitext.match(/height.*?(\d\.\d{2})/i);
  const plays = getField(wikitext, "plays");
  const currentRanking = (wikitext.match(/currentsinglesranking\s*=\s*No\.\s*(\d+)/i) || [])[1] || null;
  const careerHigh = (wikitext.match(/(?:highest|career.high).*?singles.*?No\.\s*(\d+)/i) || [])[1] || null;
  const country = getField(wikitext, "birth_place") || "";

  const payload = {
    name: opponentName,
    ranking: currentRanking ? parseInt(currentRanking, 10) : null,
    country: country.split(",").pop()?.trim() || country,
    height: hMatch ? `${hMatch[1]}m` : null,
    hand: plays ? (plays.toLowerCase().includes("right") ? "Destro" : plays.toLowerCase().includes("left") ? "Canhoto" : plays) : null,
    careerHigh: careerHigh ? parseInt(careerHigh, 10) : null,
    updatedAt: new Date().toISOString(),
  };

  await writeJson("fn:opponentProfile", payload, 86400 * 3);
  log.push(`opponentProfile: refreshed for ${opponentName}`);
  return payload;
}

export default async function handler(req, res) {
  try {
    const modeState = await getCurrentMode();
    const forced = req.query.force === "1" || req.headers["x-force-refresh"] === "1";
    const ttl = modeState.policy.rankingTtl;
    const allowed = forced || await shouldRunKey("fn:job:slowRefresh:lastRun", ttl);

    if (!allowed) {
      return res.status(200).json({
        ok: true,
        skipped: true,
        mode: modeState.mode,
        ttl,
        reason: "mode-aware throttle",
      });
    }

    const log = [];
    const updates = {};

    const shouldDoRanking = modeState.mode === "ranking_day" || forced;
    if (shouldDoRanking) {
      updates.ranking = await refreshRanking(log);
    } else {
      log.push("ranking: skipped outside ranking_day");
    }

    updates.biographyBase = await refreshBiographyBase(log);
    updates.tournamentFacts = await refreshTournamentFacts(modeState.nextMatch, log);
    updates.opponentProfile = await refreshOpponentProfile(modeState.nextMatch, log);

    await touchKey("fn:job:slowRefresh:lastRun");

    return res.status(200).json({
      ok: true,
      skipped: false,
      mode: modeState.mode,
      ttl,
      updated: {
        ranking: !!updates.ranking,
        biographyBase: !!updates.biographyBase,
        tournamentFacts: !!updates.tournamentFacts,
        opponentProfile: !!updates.opponentProfile,
      },
      log,
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
}
