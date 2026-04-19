// ===== FONSECA NEWS — TWITTER BOT v11 =====
// Phoenix strategy: the bot NEVER skips. Every cron slot posts SOMETHING.
// Cascade: news → gemini commentary → promo → engagement pool → ultimate fallback
// Schedule: 6 slots/day at 6h, 9h, 12h, 15h, 18h, 21h BRT (cooldown 2h min)
//
// v11 changes (19/04/2026):
//  - New: geminiCommentary() generates fan/informative tweets about João from KV context
//  - New: ENGAGEMENT_TWEETS pool (25 entries) as static fallback
//  - New: tw:recent_commentary ringbuffer (last 10) to avoid Gemini repetition
//  - Cascade logic: if news can't post, try commentary, then promo, then engagement
//  - Daily limit 4 → 6 (matches 6 cron slots)
//  - Promo window expanded from 14h-20h to all day (now part of cascade)

import crypto from "crypto";
import { kv } from "@vercel/kv";

// ===== OAUTH 1.0a =====
function percentEncode(str) {
  return encodeURIComponent(str)
    .replace(/!/g, "%21").replace(/\*/g, "%2A")
    .replace(/'/g, "%27").replace(/\(/g, "%28").replace(/\)/g, "%29");
}

async function postTweet(text, replyTo) {
  var ck = process.env.TWITTER_CONSUMER_KEY;
  var cs = process.env.TWITTER_CONSUMER_SECRET;
  var at = process.env.TWITTER_ACCESS_TOKEN;
  var ats = process.env.TWITTER_ACCESS_TOKEN_SECRET;
  if (!ck || !cs || !at || !ats) throw new Error("Missing Twitter credentials");

  var url = "https://api.x.com/2/tweets";
  var ts = Math.floor(Date.now() / 1000).toString();
  var nonce = crypto.randomBytes(16).toString("hex");

  var oauthData = {
    oauth_consumer_key: ck, oauth_nonce: nonce,
    oauth_signature_method: "HMAC-SHA1", oauth_timestamp: ts,
    oauth_token: at, oauth_version: "1.0",
  };

  var sortedParams = Object.keys(oauthData).sort();
  var paramPairs = sortedParams.map(function (k) { return percentEncode(k) + "=" + percentEncode(oauthData[k]); });
  var paramString = paramPairs.join("&");
  var baseString = "POST&" + percentEncode(url) + "&" + percentEncode(paramString);
  var signingKey = percentEncode(cs) + "&" + percentEncode(ats);
  var sig = crypto.createHmac("sha1", signingKey).update(baseString).digest("base64");

  var headerParams = Object.assign({}, oauthData, { oauth_signature: sig });
  var headerParts = Object.keys(headerParams).sort().map(function (k) {
    return percentEncode(k) + '="' + percentEncode(headerParams[k]) + '"';
  });

  var body = { text: text };
  if (replyTo) body.reply = { in_reply_to_tweet_id: replyTo };

  var res = await fetch(url, {
    method: "POST",
    headers: { Authorization: "OAuth " + headerParts.join(", "), "Content-Type": "application/json", "User-Agent": "FonsecaNewsBot/3.0" },
    body: JSON.stringify(body),
  });

  var raw = await res.text();
  console.log("[tweet] Status:", res.status, "Body:", raw.substring(0, 300));
  if (!res.ok) throw new Error("Twitter " + res.status + ": " + raw.substring(0, 200));
  return JSON.parse(raw);
}

async function postWithLinkReply(mainText, linkText) {
  var result = await postTweet(mainText);
  if (result.data && result.data.id && linkText) {
    try { await postTweet(linkText, result.data.id); } catch (e) { console.log("[tweet] Reply error:", e.message); }
  }
  return result;
}

// ===== KV HELPERS =====
async function wasPosted(hash) { try { return !!(await kv.get("tw:" + hash)); } catch (e) { return false; } }
async function markPosted(hash) { try { await kv.set("tw:" + hash, Date.now(), { ex: 604800 }); } catch (e) { } }
async function getLastPostTime() { try { var v = await kv.get("tw:last_post"); return v ? parseInt(v, 10) : 0; } catch (e) { return 0; } }
async function setLastPostTime() { try { await kv.set("tw:last_post", Date.now()); } catch (e) { } }
async function getTodayCount() { try { var d = new Date().toISOString().split("T")[0]; var v = await kv.get("tw:count:" + d); return v ? parseInt(v, 10) : 0; } catch (e) { return 0; } }
async function incTodayCount() { try { var d = new Date().toISOString().split("T")[0]; await kv.incr("tw:count:" + d); await kv.expire("tw:count:" + d, 172800); } catch (e) { } }

// ===== RECENT TITLES (news dedup) =====
async function getRecentTitles() {
  try {
    var v = await kv.get("tw:recent_titles");
    if (!v) return [];
    if (typeof v === "string") { try { return JSON.parse(v); } catch (e) { return []; } }
    return Array.isArray(v) ? v : [];
  } catch (e) { return []; }
}
async function pushRecentTitle(title) {
  try {
    var current = await getRecentTitles();
    current.push(title);
    if (current.length > 15) current = current.slice(-15);
    await kv.set("tw:recent_titles", JSON.stringify(current), { ex: 604800 });
  } catch (e) { console.log("[tweet] pushRecentTitle error:", e.message); }
}

// ===== RECENT COMMENTARY (gemini commentary dedup) =====
async function getRecentCommentary() {
  try {
    var v = await kv.get("tw:recent_commentary");
    if (!v) return [];
    if (typeof v === "string") { try { return JSON.parse(v); } catch (e) { return []; } }
    return Array.isArray(v) ? v : [];
  } catch (e) { return []; }
}
async function pushRecentCommentary(text) {
  try {
    var current = await getRecentCommentary();
    current.push(text);
    if (current.length > 10) current = current.slice(-10);
    await kv.set("tw:recent_commentary", JSON.stringify(current), { ex: 604800 });
  } catch (e) { console.log("[tweet] pushRecentCommentary error:", e.message); }
}

// ===== KEYWORD EXTRACTION & SIMILARITY =====
var DEDUP_STOPWORDS = [
  "o","a","os","as","de","do","da","dos","das","em","no","na","nos","nas",
  "e","que","um","uma","com","por","para","se","ao","aos","sua","seu",
  "mais","como","sobre","entre","ate","apos","foi","ser","vai","tem",
  "pode","diz","disse","esta","sao","faz","ter","pelo","pela","contra",
  "muito","mas","tambem","ja","ainda","quando","onde","qual","essa","esse","isso",
  "joao","fonseca","tenis","tenista","brasileiro","brasileira","brasil",
  "esporte","esportes","ano","anos","hoje","amanha","ontem","semana",
  "jogador","jogo","partida","confronto","duelo"
];

var DEDUP_SYNONYMS = {
  "vence": "venceu", "venceu": "venceu", "vencer": "venceu",
  "supera": "venceu", "superou": "venceu", "superar": "venceu",
  "derrota": "venceu", "derrotou": "venceu", "derrotar": "venceu",
  "bate": "venceu", "bateu": "venceu", "bater": "venceu",
  "atropela": "venceu", "atropelou": "venceu",
  "elimina": "venceu", "eliminou": "venceu",
  "ganha": "venceu", "ganhou": "venceu",
  "passa": "venceu", "passou": "venceu",
  "despacha": "venceu", "despachou": "venceu",
  "conquista": "venceu", "conquistou": "venceu",
  "vitoria": "venceu", "vitorias": "venceu",
  "perde": "perdeu", "perdeu": "perdeu", "perder": "perdeu",
  "cai": "perdeu", "caiu": "perdeu",
  "eliminado": "perdeu", "derrotado": "perdeu",
  "avanca": "avancou", "avancou": "avancou", "avancar": "avancou",
  "classifica": "avancou", "classificou": "avancou",
  "vai": "avancou",
  "semis": "semifinal", "semifinais": "semifinal", "semifinal": "semifinal",
  "quartas": "quartas",
  "final": "final", "finais": "final", "decisao": "final",
  "oitavas": "oitavas",
  "ranking": "ranking", "posicao": "ranking",
};

function getKeywords(title) {
  return (title || "").toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(function (w) { return w.length > 2 && DEDUP_STOPWORDS.indexOf(w) === -1; })
    .map(function (w) { return DEDUP_SYNONYMS[w] || w; });
}

function similarityTo(title, existing) {
  var kw1 = getKeywords(title);
  if (kw1.length < 2) return { sim: 0, matched: null };
  var maxSim = 0, matchedTitle = null;
  for (var i = 0; i < existing.length; i++) {
    var kw2 = getKeywords(existing[i]);
    if (kw2.length < 2) continue;
    var overlap = 0;
    for (var j = 0; j < kw1.length; j++) {
      if (kw2.indexOf(kw1[j]) !== -1) overlap++;
    }
    var similarity = overlap / Math.min(kw1.length, kw2.length);
    if (similarity > maxSim) { maxSim = similarity; matchedTitle = existing[i]; }
  }
  return { sim: maxSim, matched: matchedTitle };
}

// ===== SOURCE QUALITY FILTER =====
var PREMIUM_SOURCES = [
  "espn", "ge", "globoesporte", "globo", "uol", "folha", "estadão", "estadao",
  "terra", "atptour", "atp tour", "tennis.com", "tennisworld", "tennis world",
  "l'equipe", "lequipe", "eurosport", "sportv", "band", "cnn", "bbc",
  "reuters", "associated press", "the athletic", "marca", "as.com",
  "gazzetta", "tuttosport", "record", "lance", "r7", "ig esportes",
];

var BLOCKED_SOURCES = [
  "msn.com", "yahoo", "aol", "newsbreak", "smartnews", "flipboard",
  "ground news", "newsnow", "news aggregator",
];

function sourceScore(source) {
  if (!source) return 0;
  var low = source.toLowerCase();
  for (var i = 0; i < BLOCKED_SOURCES.length; i++) {
    if (low.includes(BLOCKED_SOURCES[i])) return -1;
  }
  for (var j = 0; j < PREMIUM_SOURCES.length; j++) {
    if (low.includes(PREMIUM_SOURCES[j])) return 2;
  }
  return 1;
}

// ===== SOURCE DISPLAY NORMALIZATION =====
var SOURCE_DISPLAY_MAP = {
  "ge": "Globo Esporte", "ge.globo": "Globo Esporte", "ge.globo.com": "Globo Esporte",
  "globoesporte": "Globo Esporte", "globoesporte.com": "Globo Esporte", "globoesporte.globo.com": "Globo Esporte",
  "globo": "Globo", "globo.com": "Globo",
  "g1": "G1", "g1.globo": "G1", "g1.globo.com": "G1",
  "uol": "UOL", "uol.com.br": "UOL",
  "folha": "Folha de S.Paulo", "folha de são paulo": "Folha de S.Paulo", "folha de s.paulo": "Folha de S.Paulo",
  "folha de spaulo": "Folha de S.Paulo", "folhapress": "Folha de S.Paulo", "folha.uol.com.br": "Folha de S.Paulo",
  "estadão": "Estadão", "estadao": "Estadão", "estadao.com.br": "Estadão",
  "terra": "Terra", "terra.com.br": "Terra",
  "r7": "R7", "r7.com": "R7",
  "band": "Band", "band.uol.com.br": "Band",
  "cnn": "CNN Brasil", "cnn brasil": "CNN Brasil",
  "bbc": "BBC", "bbc brasil": "BBC Brasil",
  "espn": "ESPN", "espn.com.br": "ESPN",
  "lance": "Lance!", "lance!": "Lance!", "lance.com.br": "Lance!",
  "ig": "iG", "ig esportes": "iG Esportes",
  "atp": "ATP Tour", "atp tour": "ATP Tour", "atptour": "ATP Tour", "atptour.com": "ATP Tour",
  "tennis.com": "Tennis.com", "tennisworld": "Tennis World", "tennis world": "Tennis World",
  "tennisworld usa": "Tennis World", "eurosport": "Eurosport",
  "l'equipe": "L'Équipe", "lequipe": "L'Équipe",
  "marca": "Marca", "as.com": "AS",
  "gazzetta": "La Gazzetta dello Sport", "tuttosport": "Tuttosport",
  "record": "Record", "sportv": "SporTV", "sportv.globo.com": "SporTV",
  "reuters": "Reuters", "the athletic": "The Athletic",
  "associated press": "Associated Press", "ap": "Associated Press",
  "placar": "Placar", "placar.abril.com.br": "Placar",
};

function normalizeSource(source) {
  if (!source) return "Fonte";
  var low = source.toLowerCase().trim();
  if (SOURCE_DISPLAY_MAP[low]) return SOURCE_DISPLAY_MAP[low];
  for (var key in SOURCE_DISPLAY_MAP) {
    if (low === key) continue;
    if (low.indexOf(key) !== -1) return SOURCE_DISPLAY_MAP[key];
  }
  return source.split(/\s+/).map(function (w) {
    if (!w) return "";
    if (w.length <= 4 && w === w.toUpperCase()) return w;
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  }).join(" ");
}

function normalizeTitle(title) {
  return (title || "").toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

function titleHash(title) {
  var norm = normalizeTitle(title);
  var stop = ["joao", "fonseca", "para", "sobre", "apos", "como", "mais", "pela", "pelo", "com", "que", "uma", "dos", "das"];
  var words = norm.split(" ").filter(function (w) { return w.length > 3 && stop.indexOf(w) === -1; }).slice(0, 8);
  return words.join("_").substring(0, 80);
}

// ===== TWEET VALIDATION =====
function validateTweetText(txt, minLen) {
  minLen = minLen || 80;
  if (!txt || txt.length < minLen) return { ok: false, reason: "too_short" };

  var BAD_ENDINGS = [
    "a","o","e","os","as","ao","aos","no","na","nos","nas",
    "do","da","dos","das","de","em",
    "um","uma","uns","umas",
    "por","pela","pelo","pelas","pelos",
    "com","sem","sob","sobre","ante","apos","ate",
    "ou","mas","que","se","nem","pois",
    "num","numa","nuns","numas","meu","minha","seu","sua","teu","tua","cujo","cuja"
  ];

  var trimmed = txt.replace(/\s+$/g, "");
  var stripped = trimmed.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2300}-\u{23FF}\u{1F1E6}-\u{1F1FF}\uFE0F\u200D\s]+$/gu, "");
  var endsInEmoji = stripped.length < trimmed.length;
  var strippedLastChar = stripped.charAt(stripped.length - 1);
  var endsInPunct = /[.!?…]/.test(strippedLastChar);

  var wordForCheck = stripped.replace(/[.!?…,;:)\]"']+$/g, "").trim();
  var lastWord = (wordForCheck.split(/\s+/).pop() || "").toLowerCase();
  lastWord = lastWord.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");

  if (BAD_ENDINGS.indexOf(lastWord) !== -1) return { ok: false, reason: "preposition:" + lastWord };
  if (!endsInEmoji && !endsInPunct) return { ok: false, reason: "no_emoji_no_punct" };
  return { ok: true };
}

// ===== GEMINI: NEWS REWRITE =====
async function geminiTweet(headline, context) {
  var gk = process.env.GEMINI_API_KEY;
  if (!gk) return null;

  var prompt = "Voce e o social media do Fonseca News (@JFonsecaNews), site de fas do tenista brasileiro Joao Fonseca.\n\n" +
    "Reescreva esta noticia como um tweet em portugues brasileiro.\n\n" +
    "REGRAS ABSOLUTAS:\n" +
    "- MINIMO 120 caracteres, MAXIMO 240 caracteres\n" +
    "- O tweet precisa ser uma FRASE COMPLETA, nunca corte no meio de uma palavra ou frase\n" +
    "- SEMPRE termine com emoji OU com ponto final (. ! ?). NUNCA termine no meio.\n" +
    "- NUNCA termine em preposicao ou artigo: no, na, em, de, do, da, para, com, e, ou, que, se, o, a, um, uma, pelo, pela\n" +
    "- Tom de fa apaixonado mas informativo, como um amigo contando a novidade\n" +
    "- Aproveite o espaco: inclua contexto como placar, ranking, torneio, rodada, adversario\n" +
    "- NAO use hashtags (serao adicionadas automaticamente)\n" +
    "- Pode usar 1-2 emojis no meio ou fim, NUNCA no inicio\n" +
    "- NAO comece com emoji\n" +
    "- NAO use aspas ao redor do tweet\n" +
    "- Fale 'Joao' ou 'Fonseca', nunca 'Joao Fonseca' completo\n" +
    "- Responda APENAS o texto do tweet, nada mais\n\n" +
    "CONTEXTO ATUAL:\n" +
    (context.ranking ? "- Ranking ATP: #" + context.ranking + "\n" : "") +
    (context.lastResult ? "- Ultimo resultado: " + context.lastResult + "\n" : "") +
    (context.nextOpponent ? "- Proximo adversario: " + context.nextOpponent + "\n" : "") +
    (context.tournament ? "- Torneio atual: " + context.tournament + "\n" : "") +
    "\nNOTICIA: \"" + headline + "\"\n\nTWEET:";

  try {
    var r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + gk, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.5, maxOutputTokens: 500 },
      }),
    });
    if (!r.ok) { console.log("[tweet] Gemini news " + r.status); return null; }
    var d = await r.json();
    var parts = d.candidates && d.candidates[0] && d.candidates[0].content && d.candidates[0].content.parts;
    if (!parts) return null;
    var txt = "";
    parts.forEach(function (p) { if (p.text && !p.thought) txt += p.text; });
    txt = txt.trim().replace(/^["']|["']$/g, "").trim();

    var validation = validateTweetText(txt, 80);
    if (!validation.ok) {
      console.log("[tweet] Gemini news rejected: " + validation.reason + " | tail: '" + txt.substring(txt.length - 30) + "'");
      return null;
    }

    if (txt.length > 260) txt = txt.substring(0, 257) + "...";
    return txt;
  } catch (e) { console.log("[tweet] Gemini news error:", e.message); return null; }
}

// ===== GEMINI: COMMENTARY (new in v11) =====
var COMMENTARY_ANGLES = [
  { tone: "fan", angle: "ranking", hint: "Comente animado sobre o ranking atual dele. Ex: 'Nosso Joao cravando na #35 do mundo, que fase!'" },
  { tone: "fan", angle: "lastMatch", hint: "Comente emocionadamente sobre a ultima partida. Ex: 'Que atuacao do Joao ontem, so eu que ainda to pensando nisso?'" },
  { tone: "fan", angle: "future", hint: "Comente com expectativa sobre o proximo jogo ou torneio. Ex: 'Contagem regressiva pro proximo jogo do Joao!'" },
  { tone: "fan", angle: "style", hint: "Comente sobre o estilo de jogo do Joao. Ex: 'O forehand do Joao e arte pura, admito'" },
  { tone: "fan", angle: "ascension", hint: "Comente sobre a ascensao dele no circuito. Ex: 'A ascensao do Joao no tour e inacreditavel'" },
  { tone: "info", angle: "stat", hint: "Compartilhe um fato interessante sobre o Joao nesta temporada. Ex: 'Sabia que o Joao ja tem X vitorias em 2026?'" },
  { tone: "info", angle: "context", hint: "Coloque o Joao em contexto historico ou comparativo. Ex: 'Com 19 anos e top 40, o Joao e uma das promessas mais fortes da ATP'" },
  { tone: "info", angle: "milestone", hint: "Comente um marco proximo ou recente do Joao. Ex: 'Pertinho do top 30 da ATP'" },
  { tone: "info", angle: "calendar", hint: "Comente sobre o calendario de torneios que vem pela frente. Ex: 'O Joao tem uma sequencia intensa de torneios pela frente'" },
  { tone: "info", angle: "opponent", hint: "Comente sobre o proximo adversario com contexto. Ex: 'O desafio do Joao na proxima rodada sera pesado'" },
];

async function geminiCommentary(context, recentCommentary) {
  var gk = process.env.GEMINI_API_KEY;
  if (!gk) return null;

  var slotIdx = new Date().getUTCHours() % COMMENTARY_ANGLES.length;
  slotIdx = (slotIdx + Math.floor(Math.random() * 3)) % COMMENTARY_ANGLES.length;
  var angle = COMMENTARY_ANGLES[slotIdx];

  var toneInstruction = angle.tone === "fan"
    ? "Tom de FA APAIXONADO: como um amigo fanatico comentando, use expressoes como 'Nosso Joao', 'o moleque', 'esse menino', 'que fase'. Pode ser ate um pouco emocional."
    : "Tom INFORMATIVO de jornalista esportivo fan: apresente um fato ou contexto interessante, mas nao seco. Comece com 'Sabia que', 'Pouca gente lembra', 'Fato:' ou similar.";

  var contextStr = "";
  if (context.ranking) contextStr += "- Ranking ATP atual: #" + context.ranking + "\n";
  if (context.lastResult) contextStr += "- Ultimo resultado: " + context.lastResult + "\n";
  if (context.nextOpponent) contextStr += "- Proximo adversario: " + context.nextOpponent + "\n";
  if (context.tournament) contextStr += "- Torneio atual: " + context.tournament + "\n";
  if (context.seasonWins) contextStr += "- Vitorias na temporada 2026: " + context.seasonWins + "\n";
  if (context.careerHigh) contextStr += "- Melhor ranking da carreira: #" + context.careerHigh + "\n";

  if (!contextStr) {
    contextStr = "- Joao Fonseca, tenista brasileiro, 19 anos, top 40 ATP\n";
  }

  var recentStr = "";
  if (recentCommentary && recentCommentary.length > 0) {
    recentStr = "\n\nEVITE repetir estes comentarios recentes (nao diga a mesma coisa):\n" +
      recentCommentary.slice(-5).map(function (c) { return "- \"" + c.substring(0, 100) + "\""; }).join("\n") + "\n";
  }

  var prompt = "Voce e o social media do Fonseca News (@JFonsecaNews), site de fas do tenista brasileiro Joao Fonseca.\n\n" +
    "Gere um TWEET ORIGINAL sobre o Joao Fonseca. NAO existe uma noticia nova hoje, entao voce vai criar conteudo a partir do contexto abaixo.\n\n" +
    "FOCO DESTE TWEET: " + angle.hint + "\n\n" +
    toneInstruction + "\n\n" +
    "REGRAS ABSOLUTAS:\n" +
    "- MINIMO 100 caracteres, MAXIMO 230 caracteres\n" +
    "- FRASE COMPLETA, nunca corte no meio\n" +
    "- SEMPRE termine com emoji OU ponto final (. ! ?)\n" +
    "- NUNCA termine em preposicao (no, na, em, de, do, da, para, com, e, ou, que, se, pelo, pela)\n" +
    "- Pode usar 1-2 emojis no MEIO ou FIM, NUNCA no inicio\n" +
    "- NAO use hashtags (sao adicionadas automaticamente)\n" +
    "- NAO use aspas ao redor do tweet\n" +
    "- Fale 'Joao' ou 'Fonseca', nunca 'Joao Fonseca' completo\n" +
    "- Seja ORIGINAL, evite cliches tipo 'que jogador' ou 'futuro do tenis'\n" +
    "- Responda APENAS o texto do tweet\n\n" +
    "CONTEXTO DO JOAO HOJE:\n" + contextStr +
    recentStr +
    "\nTWEET:";

  try {
    var r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + gk, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.85, maxOutputTokens: 500 },
      }),
    });
    if (!r.ok) { console.log("[tweet] Gemini commentary " + r.status); return null; }
    var d = await r.json();
    var parts = d.candidates && d.candidates[0] && d.candidates[0].content && d.candidates[0].content.parts;
    if (!parts) return null;
    var txt = "";
    parts.forEach(function (p) { if (p.text && !p.thought) txt += p.text; });
    txt = txt.trim().replace(/^["']|["']$/g, "").trim();

    var validation = validateTweetText(txt, 60);
    if (!validation.ok) {
      console.log("[tweet] Gemini commentary rejected: " + validation.reason + " | tail: '" + txt.substring(txt.length - 30) + "'");
      return null;
    }

    if (recentCommentary && recentCommentary.length > 0) {
      var simResult = similarityTo(txt, recentCommentary);
      if (simResult.sim >= 0.5) {
        console.log("[tweet] Gemini commentary too similar (" + Math.round(simResult.sim * 100) + "%) — rejected");
        return null;
      }
    }

    if (txt.length > 260) txt = txt.substring(0, 257) + "...";
    return { text: txt, tone: angle.tone, angle: angle.angle };
  } catch (e) { console.log("[tweet] Gemini commentary error:", e.message); return null; }
}

// ===== FALLBACK: template-based tweet =====
function templateTweet(title, source) {
  var clean = title || "";
  if (source) {
    clean = clean.replace(" - " + source, "").replace(" | " + source, "").replace(" · " + source, "");
  }
  var dash = clean.lastIndexOf(" - ");
  if (dash > clean.length * 0.5) clean = clean.substring(0, dash);
  clean = clean.trim();

  var emojis = ["🎾", "🇧🇷", "🔥", "⚡", "💪"];
  var emoji = emojis[Math.floor(Math.random() * emojis.length)];
  var tweet = clean + " " + emoji;

  if (tweet.length > 270) tweet = clean.substring(0, 267) + "...";
  return tweet;
}

// ===== PROMO TWEETS =====
var PROMO_TWEETS = [
  "Ranking, calendário, forma recente e notícias filtradas. Tudo do João num lugar só 🎾",
  "O único site 100% dedicado ao João Fonseca. Notícias, stats e muito mais ⚡",
  "De Ipanema pro circuito ATP. A jornada completa do João está no site 🇧🇷",
  "Sem app, sem poluição. Acompanhe o João direto no navegador 📱",
  "O próximo grande nome do tênis brasileiro tem 19 anos. Acompanhe a jornada 🔥",
  "O tênis brasileiro não via um talento assim desde o Guga. É só o começo 🇧🇷",
  "Quem assistiu João vs Rublev no Australian Open sabe — aquele jogo mudou tudo 🔥",
  "O forehand do João é o mais bonito do circuito atualmente. Muda minha opinião 🎾",
  "Fonseca, Tien, Mensik, Fils. A próxima geração já chegou ⚡",
  "Se o João fosse espanhol, já estaria na capa de todo jornal esportivo do mundo 🇧🇷",
  "Alcaraz, Sinner ou Fonseca — quem vai dominar o tênis em 2030? 🏆",
  "O Brasil tem o melhor sub-20 do mundo e pouca gente sabe. Isso precisa mudar 🇧🇷",
  "Acordei pensando em tênis. De novo. Culpa do João 😂🎾",
  "Será que a gente vai ver o João nas Olimpíadas de 2028 em LA? Já tô contando os dias 🇧🇷🏅",
  "Hot take: João Fonseca vai ganhar Roland Garros antes dos 22 anos. Anotem 📝",
  "Dica: adiciona o Fonseca News na tela inicial do seu celular. Funciona como app, mas ocupa ZERO espaço 📱✨",
  "Tem iPhone? Abre o site no Safari, toca em compartilhar e escolhe 'Adicionar à Tela de Início'. Fica igual app 📲",
  "Tem Android? Abre no Chrome, menu (3 pontinhos) e clica em 'Adicionar à tela inicial'. Notificações em breve 🔔",
  "Fonseca News como app, sem baixar nada. Adiciona o site na tela inicial e acompanha o João num toque 🎾📱",
  "Quer acompanhar cada passo do João? Adiciona o site na tela inicial do seu celular. Rápido e prático 🇧🇷⚡",
];

// ===== ENGAGEMENT TWEETS (level 4) =====
var ENGAGEMENT_TWEETS = [
  "Bom dia, tribo do Fonseca! ☕ Já passou no site hoje pra ver as novidades do João?",
  "Boa tarde, galera! 🎾 Se você ainda não segue o @JFonsecaNews, tá perdendo as melhores atualizações do João",
  "Boa noite, fãs do João! 🌙 Amanhã tem mais — fica ligado no site pra não perder nada",
  "E aí, qual foi o melhor jogo do João Fonseca que você já viu? 🤔 Conta aqui pra gente",
  "Pergunta honesta: em quanto tempo o João chega ao top 10? 📊 Deixa seu palpite",
  "Quem aqui tá acompanhando o João desde o juvenil? 🙋 Levanta a mão",
  "Você sabia? O Fonseca News tem ranking, calendário e forma recente do João em tempo real 🔗 fonsecanews.com.br",
  "Tô curioso: qual torneio do João você mais quer assistir em 2026? 🏆",
  "Lembrete: o Fonseca News é feito por fã pra fã. Sem ads, sem spam, só conteúdo do João 🇧🇷",
  "Se você chegou aqui agora, seja bem-vindo! 👋 Aqui você acompanha tudo sobre o João Fonseca",
  "Salva essa dica: fonsecanews.com.br tem todos os jogos e stats do João num lugar só 📌",
  "Quem mais já acordou checando se o João tem jogo hoje? 😂 Só eu não, né?",
  "Qual golpe do João você mais gosta? Forehand, backhand ou aquele saque potente? 🎾",
  "Tá passando por aqui? Dá uma olhada no site — sempre tem algo novo sobre o João 🔗",
  "Fato: o João foi o primeiro brasileiro campeão do NextGen ATP Finals. Histórico 🏆🇧🇷",
  "Tô achando que o João vai fazer o Brasil voltar a sonhar com Grand Slams. E você? 🌎",
  "Quem tá no sofá esperando o próximo jogo do João comigo? 🛋️🎾",
  "Dica rápida: ative as notificações do Fonseca News pra saber na hora quando o João joga 🔔",
  "Tem gente nova chegando todo dia! Se é sua primeira vez aqui, bem-vindo à fanbase do João 🇧🇷",
  "Hoje é dia de João? Confere no site, tá tudo lá — fonsecanews.com.br ⚡",
  "Rápido: qual o próximo torneio do João? Resposta no Fonseca News 🏆",
  "Palpite: o João termina 2026 no top 20. Concorda, discorda? 📈",
  "Fonseca News: o que você precisa saber sobre o João, sem rodeios 🎾",
  "Bom domingo, galera! 🌞 Semana nova, torneio novo, vitória nova pro João — bora torcer",
  "Compartilha o Fonseca News com aquele amigo que também é fã de tênis 🤝 quanto mais fãs do João, melhor",
];

// ===== PICK FROM POOL (generic helper with recency tracking) =====
async function pickFromPool(pool, historyKey, maxHistory) {
  maxHistory = maxHistory || 8;
  var history = [];
  try {
    var h = await kv.get(historyKey);
    if (h) history = typeof h === "string" ? JSON.parse(h) : h;
  } catch (e) { }
  if (!Array.isArray(history)) history = [];

  var available = pool.filter(function (_, idx) { return history.indexOf(idx) === -1; });
  if (available.length === 0) { available = pool.slice(); history = []; }
  var pickedTweet = available[Math.floor(Math.random() * available.length)];
  var pickedIdx = pool.indexOf(pickedTweet);

  history.push(pickedIdx);
  if (history.length > maxHistory) history = history.slice(-maxHistory);
  try { await kv.set(historyKey, JSON.stringify(history), { ex: 604800 }); } catch (e) { }

  return pickedTweet;
}

// ===== HASHTAG BUILDER (for news tweets) =====
function addNewsHashtags(tweetText, sourceTitle) {
  if (tweetText.includes("#")) return tweetText;
  var hashtags = ["#JoãoFonseca"];
  var titleLow = (sourceTitle || "").toLowerCase();
  var combined = titleLow + " " + tweetText.toLowerCase();
  if (combined.includes("roland garros") || combined.includes("french open")) hashtags.push("#RolandGarros");
  else if (combined.includes("wimbledon")) hashtags.push("#Wimbledon");
  else if (combined.includes("us open")) hashtags.push("#USOpen");
  else if (combined.includes("australian open") || combined.includes("aus open")) hashtags.push("#AusOpen");
  else if (combined.includes("monte carlo")) hashtags.push("#MonteCarlo");
  else if (combined.includes("madrid")) hashtags.push("#MadridOpen");
  else if (combined.includes("roma") || combined.includes("italian open")) hashtags.push("#IBI");
  else if (combined.includes("miami")) hashtags.push("#MiamiOpen");
  else if (combined.includes("indian wells")) hashtags.push("#IndianWells");
  else if (combined.includes("bmw open") || combined.includes("munich")) hashtags.push("#BMWOpen");
  else if (combined.includes("rio open")) hashtags.push("#RioOpen");
  if (combined.includes("atp") || combined.includes("ranking")) hashtags.push("#ATP");
  if (combined.includes("brasil") || combined.includes("brasileiro")) hashtags.push("#TenisBrasil");

  var uniqueTags = [];
  hashtags.forEach(function (t) { if (uniqueTags.indexOf(t) === -1 && uniqueTags.length < 3) uniqueTags.push(t); });
  var tagsText = "\n\n" + uniqueTags.join(" ");
  if (tweetText.length + tagsText.length <= 280) return tweetText + tagsText;
  if (tweetText.length + 16 <= 280) return tweetText + "\n\n#JoãoFonseca";
  return tweetText;
}

// ===== MAIN HANDLER =====
export default async function handler(req, res) {
  var nowUTC = new Date().getUTCHours();
  var brasilia = (nowUTC - 3 + 24) % 24;

  // Silent hours: 0h-5h BRT (before 6h — we want 6h cron to post)
  if (brasilia < 6) {
    return res.status(200).json({ skip: true, reason: "silent_hours", brt: brasilia });
  }

  // Test mode
  if (req.query && req.query.test === "1") {
    try {
      var r = await postWithLinkReply("Teste do bot v11! 🎾", "🔗 fonsecanews.com.br");
      return res.status(200).json({ ok: true, tweetId: r.data ? r.data.id : null });
    } catch (e) { return res.status(200).json({ ok: false, error: e.message }); }
  }

  try {
    // ===== RATE LIMITS =====
    var todayCount = await getTodayCount();
    if (todayCount >= 6) {
      return res.status(200).json({ skip: true, reason: "daily_limit", count: todayCount });
    }
    var lastPost = await getLastPostTime();
    var minsSince = (Date.now() - lastPost) / 60000;
    if (minsSince < 120) {
      return res.status(200).json({ skip: true, reason: "cooldown", mins: Math.round(minsSince) });
    }

    // ===== GATHER CONTEXT FROM KV =====
    var context = {};
    try {
      var ranking = await kv.get("fn:ranking");
      if (ranking) {
        var rk = typeof ranking === "string" ? JSON.parse(ranking) : ranking;
        if (rk && rk.ranking) context.ranking = rk.ranking;
        if (rk && rk.careerHigh) context.careerHigh = rk.careerHigh;
      }
      var lm = await kv.get("fn:lastMatch");
      if (lm) {
        var lastMatch = typeof lm === "string" ? JSON.parse(lm) : lm;
        if (lastMatch) {
          context.lastResult = (lastMatch.result === "V" ? "Vitoria" : "Derrota") + " " + (lastMatch.score || "") + " vs " + (lastMatch.opponent_name || "");
          context.tournament = lastMatch.tournament_name || "";
        }
      }
      var nm = await kv.get("fn:nextMatch");
      if (nm) {
        var nextMatch = typeof nm === "string" ? JSON.parse(nm) : nm;
        if (nextMatch && nextMatch.opponent_name && nextMatch.opponent_name !== "A definir") {
          context.nextOpponent = nextMatch.opponent_name + (nextMatch.opponent_ranking ? " #" + nextMatch.opponent_ranking : "");
        }
      }
      var season = await kv.get("fn:season");
      if (season) {
        var seasonData = typeof season === "string" ? JSON.parse(season) : season;
        if (seasonData && seasonData.wins) context.seasonWins = seasonData.wins;
      }
    } catch (e) { console.log("[tweet] Context error:", e.message); }

    var attempted = { news: false, commentary: false, promo: false, engagement: false };

    // ===== CASCADE: LEVEL 1 — NEWS =====
    var newsFound = null;
    try {
      attempted.news = true;
      var host = "fonsecanews.com.br";
      var newsRes = await fetch("https://" + host + "/api/news");
      if (newsRes.ok) {
        var newsData = await newsRes.json();
        if (newsData.news && newsData.news.length > 0) {
          var recentTitles = await getRecentTitles();
          var SIMILARITY_THRESHOLD = 0.5;
          var candidates = [];
          var skipped = { old: 0, blocked: 0, hash_dup: 0, similar: 0, no_fonseca: 0 };

          for (var i = 0; i < newsData.news.length; i++) {
            var item = newsData.news[i];
            var ageH = (Date.now() - new Date(item.date).getTime()) / 3600000;
            if (ageH > 24) { skipped.old++; continue; }
            var sq = sourceScore(item.source);
            if (sq < 0) { skipped.blocked++; continue; }
            var hash = titleHash(item.title);
            if (!hash || hash.length < 5) { skipped.hash_dup++; continue; }
            if (await wasPosted(hash)) { skipped.hash_dup++; continue; }
            var tLow = (item.title || "").toLowerCase();
            if (!tLow.includes("fonseca")) { skipped.no_fonseca++; continue; }
            var simResult = similarityTo(item.title, recentTitles);
            if (simResult.sim >= SIMILARITY_THRESHOLD) {
              console.log("[tweet] SIMILAR (" + Math.round(simResult.sim * 100) + "%) skip: '" + item.title.substring(0, 60) + "'");
              skipped.similar++;
              continue;
            }
            var freshness = Math.max(0, 1 - (ageH / 24));
            var score = freshness * 10 + sq * 5;
            candidates.push({ item: item, hash: hash, score: score });
          }

          candidates.sort(function (a, b) { return b.score - a.score; });
          console.log("[tweet] News: " + candidates.length + " candidates, skipped: " + JSON.stringify(skipped));

          if (candidates.length > 0) {
            var best = candidates[0];
            var tweetText = await geminiTweet(best.item.title, context);
            if (!tweetText) {
              tweetText = templateTweet(best.item.title, best.item.source);
              console.log("[tweet] News: using template fallback");
            }
            newsFound = { text: tweetText, item: best.item, hash: best.hash };
          }
        }
      }
    } catch (e) { console.log("[tweet] News level error:", e.message); }

    if (newsFound) {
      var tweetText = addNewsHashtags(newsFound.text, newsFound.item.title);
      if (tweetText.length > 280) tweetText = tweetText.substring(0, 277) + "...";
      var prettySource = normalizeSource(newsFound.item.source);
      var linkReply = "📰 " + prettySource + "\n\n🔗 www.fonsecanews.com.br";

      try {
        console.log("[tweet] Posting NEWS: " + tweetText.substring(0, 100) + "...");
        var tweetResult = await postWithLinkReply(tweetText, linkReply);
        await markPosted(newsFound.hash);
        await pushRecentTitle(newsFound.item.title);
        await setLastPostTime();
        await incTodayCount();
        return res.status(200).json({
          ok: true, type: "news",
          title: newsFound.item.title,
          source: newsFound.item.source,
          pretty_source: prettySource,
          tweet: tweetText, chars: tweetText.length,
          tweetId: tweetResult.data ? tweetResult.data.id : null,
          todayTotal: todayCount + 1,
        });
      } catch (e) { console.log("[tweet] News post failed, falling through:", e.message); }
    }

    // ===== CASCADE: LEVEL 2 — GEMINI COMMENTARY =====
    try {
      attempted.commentary = true;
      var recentCommentary = await getRecentCommentary();
      var commentary = await geminiCommentary(context, recentCommentary);

      if (commentary) {
        var commText = commentary.text;
        if (!commText.includes("#") && commText.length + 16 <= 280) {
          commText = commText + "\n\n#JoãoFonseca";
        }
        if (commText.length > 280) commText = commText.substring(0, 277) + "...";

        console.log("[tweet] Posting COMMENTARY (" + commentary.tone + "/" + commentary.angle + "): " + commText.substring(0, 100));
        var commReply = "🎾 fonsecanews.com.br";
        var commResult = await postWithLinkReply(commText, commReply);
        await pushRecentCommentary(commentary.text);
        await setLastPostTime();
        await incTodayCount();
        return res.status(200).json({
          ok: true, type: "commentary",
          tone: commentary.tone, angle: commentary.angle,
          tweet: commText, chars: commText.length,
          tweetId: commResult.data ? commResult.data.id : null,
          todayTotal: todayCount + 1,
        });
      }
    } catch (e) { console.log("[tweet] Commentary level error:", e.message); }

    // ===== CASCADE: LEVEL 3 — PROMO =====
    try {
      attempted.promo = true;
      var promoText = await pickFromPool(PROMO_TWEETS, "tw:promo_history", 8);
      var promoMain = promoText;
      if (!promoMain.includes("#") && promoMain.length + 30 <= 280) {
        promoMain = promoMain + "\n\n#JoãoFonseca #TenisBrasil";
      }
      var promoReply = "🔗 www.fonsecanews.com.br";
      console.log("[tweet] Posting PROMO: " + promoText.substring(0, 100));
      var promoResult = await postWithLinkReply(promoMain, promoReply);
      await setLastPostTime();
      await incTodayCount();
      return res.status(200).json({
        ok: true, type: "promo",
        tweet: promoMain, chars: promoMain.length,
        tweetId: promoResult.data ? promoResult.data.id : null,
        todayTotal: todayCount + 1,
      });
    } catch (e) { console.log("[tweet] Promo level error:", e.message); }

    // ===== CASCADE: LEVEL 4 — ENGAGEMENT (FINAL FALLBACK) =====
    try {
      attempted.engagement = true;
      var engText = await pickFromPool(ENGAGEMENT_TWEETS, "tw:engagement_history", 10);
      if (!engText.includes("#") && engText.length + 16 <= 280) {
        engText = engText + "\n\n#JoãoFonseca";
      }
      if (engText.length > 280) engText = engText.substring(0, 277) + "...";

      console.log("[tweet] Posting ENGAGEMENT: " + engText.substring(0, 100));
      var engReply = "🎾 www.fonsecanews.com.br";
      var engResult = await postWithLinkReply(engText, engReply);
      await setLastPostTime();
      await incTodayCount();
      return res.status(200).json({
        ok: true, type: "engagement",
        tweet: engText, chars: engText.length,
        tweetId: engResult.data ? engResult.data.id : null,
        todayTotal: todayCount + 1,
      });
    } catch (e) {
      console.log("[tweet] Engagement level FAILED:", e.message);
      return res.status(200).json({
        ok: false,
        error: "all_cascade_levels_failed",
        attempted: attempted,
        message: e.message
      });
    }

  } catch (e) {
    console.error("[tweet] Top-level error:", e);
    return res.status(200).json({ ok: false, error: e.message });
  }
}
