// ===== FONSECA NEWS — TWITTER BOT v10 =====
// Gemini-powered tweet generation, quality source filtering
// Schedule: max 4 tweets/day, min 2h between posts, 6h-00h BRT
// Algorithm: link in reply, max 1 hashtag, conversational tone
//
// v10 changes (19/04/2026):
//  1. Fixed truncated-tweet validation — was letting prepositions ("no", "na", "em"...) pass as valid endings
//  2. Added source normalization — "ge" -> "Globo Esporte", "uol" -> "UOL", etc
//  3. Added semantic dedup vs last 15 posted titles (keyword overlap, threshold 50%)

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

// ===== KV DEDUP & RATE LIMITING =====
async function wasPosted(hash) { try { return !!(await kv.get("tw:" + hash)); } catch (e) { return false; } }
async function markPosted(hash) { try { await kv.set("tw:" + hash, Date.now(), { ex: 604800 }); } catch (e) { } }
async function getLastPostTime() { try { var v = await kv.get("tw:last_post"); return v ? parseInt(v, 10) : 0; } catch (e) { return 0; } }
async function setLastPostTime() { try { await kv.set("tw:last_post", Date.now()); } catch (e) { } }
async function getTodayCount() { try { var d = new Date().toISOString().split("T")[0]; var v = await kv.get("tw:count:" + d); return v ? parseInt(v, 10) : 0; } catch (e) { return 0; } }
async function incTodayCount() { try { var d = new Date().toISOString().split("T")[0]; await kv.incr("tw:count:" + d); await kv.expire("tw:count:" + d, 172800); } catch (e) { } }

// ===== SEMANTIC DEDUP (NEW in v10) =====
// Keeps a ringbuffer of last 15 posted titles in KV.
// New candidate is rejected if keyword overlap > 50% with any recent title.

async function getRecentTitles() {
  try {
    var v = await kv.get("tw:recent_titles");
    if (!v) return [];
    if (typeof v === "string") {
      try { return JSON.parse(v); } catch (e) { return []; }
    }
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

// Keyword extraction — same logic as news.js so behavior is consistent.
// v10: added generic sport/nationality stopwords + synonym canonicalization
// so that "Fonseca vence Shelton" and "Fonseca supera Shelton" dedupe correctly.
var DEDUP_STOPWORDS = [
  "o","a","os","as","de","do","da","dos","das","em","no","na","nos","nas",
  "e","que","um","uma","com","por","para","se","ao","aos","sua","seu",
  "mais","como","sobre","entre","ate","apos","foi","ser","vai","tem",
  "pode","diz","disse","esta","sao","faz","ter","pelo","pela","contra",
  "muito","mas","tambem","ja","ainda","quando","onde","qual","essa","esse","isso",
  // Identity/sport generics — these appear in almost every Fonseca headline
  "joao","fonseca","tenis","tenista","brasileiro","brasileira","brasil",
  "esporte","esportes","ano","anos","hoje","amanha","ontem","semana",
  "jogador","jogo","partida","confronto","duelo"
];

// Canonicalize synonyms so variants of same verb map to one token.
// Key insight: news rewrites the same event with different verbs ("vence"/"supera"/"derrota"/"bate").
var DEDUP_SYNONYMS = {
  // WIN verbs
  "vence": "venceu", "venceu": "venceu", "vencer": "venceu", "vencera": "venceu",
  "supera": "venceu", "superou": "venceu", "superar": "venceu", "superara": "venceu",
  "derrota": "venceu", "derrotou": "venceu", "derrotar": "venceu", "derrotara": "venceu",
  "bate": "venceu", "bateu": "venceu", "bater": "venceu",
  "atropela": "venceu", "atropelou": "venceu",
  "elimina": "venceu", "eliminou": "venceu", "eliminar": "venceu",
  "ganha": "venceu", "ganhou": "venceu", "ganhar": "venceu",
  "passa": "venceu", "passou": "venceu",
  "despacha": "venceu", "despachou": "venceu",
  "conquista": "venceu", "conquistou": "venceu",
  "vitoria": "venceu", "vitorias": "venceu",
  // LOSE verbs
  "perde": "perdeu", "perdeu": "perdeu", "perder": "perdeu",
  "cai": "perdeu", "caiu": "perdeu",
  "eliminado": "perdeu", "derrotado": "perdeu",
  "derrota": "perdeu", // NOTE: same key as above, last wins — ambiguous, keep "venceu" since verb "derrota" = to defeat (win)
  // ADVANCE verbs
  "avanca": "avancou", "avancou": "avancou", "avancar": "avancou",
  "classifica": "avancou", "classificou": "avancou",
  "vai": "avancou", // "vai as semis"
  // Round equivalents
  "semis": "semifinal", "semifinais": "semifinal", "semifinal": "semifinal",
  "quartas": "quartas", "quartasdefinal": "quartas",
  "final": "final", "finais": "final", "decisao": "final",
  "oitavas": "oitavas",
  "rodada": "rodada",
  // Ranking
  "ranking": "ranking", "rank": "ranking", "posicao": "ranking",
  "ascensao": "ranking", "sobe": "ranking", "subiu": "ranking"
};

// fix the "derrota" ambiguity — default it to "venceu" (the common verb sense)
DEDUP_SYNONYMS["derrota"] = "venceu";

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
  if (kw1.length < 2) return 0;
  var maxSim = 0;
  var matchedTitle = null;
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

// ===== SOURCE DISPLAY NORMALIZATION (NEW in v10) =====
// Google News RSS returns sources in raw/lowercase form ("ge", "uol", "globo").
// Normalize to pretty display names for the reply tweet.
var SOURCE_DISPLAY_MAP = {
  "ge": "Globo Esporte",
  "ge.globo": "Globo Esporte",
  "ge.globo.com": "Globo Esporte",
  "globoesporte": "Globo Esporte",
  "globoesporte.com": "Globo Esporte",
  "globoesporte.globo.com": "Globo Esporte",
  "globo": "Globo",
  "globo.com": "Globo",
  "g1": "G1",
  "g1.globo": "G1",
  "g1.globo.com": "G1",
  "uol": "UOL",
  "uol.com.br": "UOL",
  "folha": "Folha de S.Paulo",
  "folha de são paulo": "Folha de S.Paulo",
  "folha de s.paulo": "Folha de S.Paulo",
  "folha de spaulo": "Folha de S.Paulo",
  "folhapress": "Folha de S.Paulo",
  "folha.uol.com.br": "Folha de S.Paulo",
  "estadão": "Estadão",
  "estadao": "Estadão",
  "estadao.com.br": "Estadão",
  "terra": "Terra",
  "terra.com.br": "Terra",
  "r7": "R7",
  "r7.com": "R7",
  "band": "Band",
  "band.uol.com.br": "Band",
  "cnn": "CNN Brasil",
  "cnn brasil": "CNN Brasil",
  "bbc": "BBC",
  "bbc brasil": "BBC Brasil",
  "espn": "ESPN",
  "espn.com.br": "ESPN",
  "lance": "Lance!",
  "lance!": "Lance!",
  "lance.com.br": "Lance!",
  "ig": "iG",
  "ig esportes": "iG Esportes",
  "atp": "ATP Tour",
  "atp tour": "ATP Tour",
  "atptour": "ATP Tour",
  "atptour.com": "ATP Tour",
  "tennis.com": "Tennis.com",
  "tennisworld": "Tennis World",
  "tennis world": "Tennis World",
  "tennisworld usa": "Tennis World",
  "eurosport": "Eurosport",
  "l'equipe": "L'Équipe",
  "lequipe": "L'Équipe",
  "marca": "Marca",
  "as.com": "AS",
  "gazzetta": "La Gazzetta dello Sport",
  "tuttosport": "Tuttosport",
  "record": "Record",
  "sportv": "SporTV",
  "sportv.globo.com": "SporTV",
  "reuters": "Reuters",
  "the athletic": "The Athletic",
  "associated press": "Associated Press",
  "ap": "Associated Press",
  "placar": "Placar",
  "placar.abril.com.br": "Placar",
};

function normalizeSource(source) {
  if (!source) return "Fonte";
  var low = source.toLowerCase().trim();

  // Exact match first
  if (SOURCE_DISPLAY_MAP[low]) return SOURCE_DISPLAY_MAP[low];

  // Partial match (handles "ge.globo.com/rio" or "uol.com.br/esporte" variants)
  for (var key in SOURCE_DISPLAY_MAP) {
    if (low === key) continue;
    if (low.indexOf(key) !== -1) return SOURCE_DISPLAY_MAP[key];
  }

  // Fallback: Title Case (capitalizes each word)
  return source.split(/\s+/).map(function (w) {
    if (!w) return "";
    // Preserve all-caps short acronyms
    if (w.length <= 4 && w === w.toUpperCase()) return w;
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  }).join(" ");
}

// ===== TITLE HASHING (kept for backward compat) =====
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

// ===== GEMINI TWEET GENERATION =====
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
    "EXEMPLOS DE TWEETS BONS:\n" +
    "- \"Fonseca atropela Rinderknech no BMW Open com duplo 6-3 6-2 e avanca pras quartas! Proximo desafio: Shelton, #6 do mundo 🔥\"\n" +
    "- \"Com a vitoria de hoje, Joao chega a 10 vitorias em 2026 e segue firme no top 35 da ATP. A evolucao nao para 🇧🇷\"\n" +
    "- \"Quartas de final no BMW Open confirmadas! Joao encara Shelton na sexta as 08:20 BRT. Vai ser um jogaco 🎾\"\n" +
    "- \"Analistas apontam Fonseca como favorito contra Shelton nas quartas do BMW Open. O moleque ta pronto pro desafio 💪\"\n\n" +
    "EXEMPLOS DE TWEETS RUINS (NUNCA faca assim):\n" +
    "- \"O Fonseca ta voando em M\" (cortado no meio de palavra)\n" +
    "- \"Nosso Fonseca tem um calendario promissor, muitas oportunidades de subir ainda mais no\" (cortado em preposicao)\n" +
    "- \"Nosso Joao ta voando no BMW\" (muito curto, sem informacao)\n" +
    "- \"Grande jogo\" (vazio, sem contexto)\n\n" +
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
    if (!r.ok) { console.log("[tweet] Gemini " + r.status); return null; }
    var d = await r.json();
    var parts = d.candidates && d.candidates[0] && d.candidates[0].content && d.candidates[0].content.parts;
    if (!parts) return null;
    var txt = "";
    parts.forEach(function (p) { if (p.text && !p.thought) txt += p.text; });
    txt = txt.trim().replace(/^["']|["']$/g, "").trim();

    // ===== QUALITY VALIDATION =====
    if (!txt || txt.length < 80) {
      console.log("[tweet] Gemini too short (" + (txt ? txt.length : 0) + " chars)");
      return null;
    }

    // v10 FIX: robust truncation detection.
    // Rule: strip trailing emojis+whitespace, then the text must end in
    // strong punctuation (. ! ? …) OR the very last char (before stripping) must be an emoji.
    // If the "last word" (post-emoji-strip) is a preposition/article/conjunction → reject.

    // Blacklist of words that NEVER legitimately end a Portuguese sentence.
    // NOTE: "para" and "pra" intentionally EXCLUDED — they're ambiguous with the
    // verb "parar" (to stop), e.g. "A evolução não para 🇧🇷" is valid.
    var BAD_ENDINGS = [
      "a", "o", "e", "os", "as", "ao", "aos",
      "no", "na", "nos", "nas",
      "do", "da", "dos", "das",
      "de", "em",
      "um", "uma", "uns", "umas",
      "por", "pela", "pelo", "pelas", "pelos",
      "com", "sem", "sob", "sobre", "ante", "apos", "ate",
      "ou", "mas", "que", "se", "nem", "pois",
      "num", "numa", "nuns", "numas",
      "meu", "minha", "seu", "sua", "teu", "tua",
      "cujo", "cuja"
    ];

    // Strip trailing emoji cluster + whitespace. The broad Unicode ranges below
    // cover emoticons, transport, supplemental, regional indicators, variation selectors, and ZWJ.
    var emojiStrip = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2300}-\u{23FF}\u{1F1E6}-\u{1F1FF}\uFE0F\u200D]+/gu;
    var trimmed = txt.replace(/\s+$/g, "");
    var stripped = trimmed.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2300}-\u{23FF}\u{1F1E6}-\u{1F1FF}\uFE0F\u200D\s]+$/gu, "");

    // If stripping emojis+whitespace made text shorter than just trimming whitespace,
    // then there was emoji content at the end. This is surrogate-pair safe.
    var endsInEmoji = stripped.length < trimmed.length;

    // Detect if stripped text ends in strong punctuation
    var strippedLastChar = stripped.charAt(stripped.length - 1);
    var endsInPunct = /[.!?…]/.test(strippedLastChar);

    // Extract last word (after stripping punctuation too)
    var wordForCheck = stripped.replace(/[.!?…,;:)\]"']+$/g, "").trim();
    var lastWord = (wordForCheck.split(/\s+/).pop() || "").toLowerCase();
    lastWord = lastWord.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");

    if (BAD_ENDINGS.indexOf(lastWord) !== -1) {
      console.log("[tweet] Gemini TRUNCATED — ends in preposition/article: '" + lastWord + "' | tail: '" + txt.substring(txt.length - 30) + "'");
      return null;
    }

    if (!endsInEmoji && !endsInPunct) {
      console.log("[tweet] Gemini BAD ENDING — no emoji/punct at end | tail: '" + txt.substring(txt.length - 30) + "'");
      return null;
    }

    // Also reject if the last word is suspiciously short AND not a legit complete word
    var shortWordsOk = ["ja", "so", "la", "ai", "so", "ne", "ha", "pa", "va"]; // "already", "only", "there", etc
    if (lastWord.length > 0 && lastWord.length <= 2 && shortWordsOk.indexOf(lastWord) === -1 && BAD_ENDINGS.indexOf(lastWord) === -1) {
      // Only reject if it's clearly not a real 2-letter Portuguese word
      // (the emoji/punct check above already handled most of these, this is a safety net)
      console.log("[tweet] Gemini suspicious short ending: '" + lastWord + "'");
      return null;
    }

    if (txt.length > 260) txt = txt.substring(0, 257) + "...";

    return txt;
  } catch (e) { console.log("[tweet] Gemini error:", e.message); return null; }
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

// ===== MAIN HANDLER =====
export default async function handler(req, res) {
  var nowUTC = new Date().getUTCHours();
  var brasilia = (nowUTC - 3 + 24) % 24;

  // Silent hours: 0h-6h BRT
  if (brasilia < 6) {
    return res.status(200).json({ skip: true, reason: "silent_hours", brt: brasilia });
  }

  // Test mode
  if (req.query && req.query.test === "1") {
    try {
      var r = await postWithLinkReply("Teste do bot v10! 🎾", "🔗 fonsecanews.com.br");
      return res.status(200).json({ ok: true, tweetId: r.data ? r.data.id : null });
    } catch (e) { return res.status(200).json({ ok: false, error: e.message }); }
  }

  try {
    // ===== RATE LIMITS =====
    var todayCount = await getTodayCount();
    if (todayCount >= 4) {
      return res.status(200).json({ skip: true, reason: "daily_limit", count: todayCount });
    }
    var lastPost = await getLastPostTime();
    var minsSince = (Date.now() - lastPost) / 60000;
    if (minsSince < 120) {
      return res.status(200).json({ skip: true, reason: "cooldown", mins: Math.round(minsSince) });
    }

    // ===== GATHER CONTEXT =====
    var context = {};
    try {
      var ranking = await kv.get("fn:ranking");
      if (ranking) {
        var rk = typeof ranking === "string" ? JSON.parse(ranking) : ranking;
        if (rk && rk.ranking) context.ranking = rk.ranking;
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
    } catch (e) { console.log("[tweet] Context error:", e.message); }

    // ===== 1. PROMO (once per day, 14h-20h BRT) =====
    if (brasilia >= 14 && brasilia <= 20) {
      var today = new Date().toISOString().split("T")[0];
      var promoPosted = await kv.get("tw:promo:" + today);
      if (!promoPosted) {
        // Pick random promo, avoid last 5 used
        var lastPromos = [];
        try { var lp = await kv.get("tw:promo_history"); if (lp) lastPromos = typeof lp === "string" ? JSON.parse(lp) : lp; } catch (e) { }
        if (!Array.isArray(lastPromos)) lastPromos = [];

        var available = PROMO_TWEETS.filter(function (_, idx) { return lastPromos.indexOf(idx) === -1; });
        if (available.length === 0) { available = PROMO_TWEETS; lastPromos = []; }
        var promoIdx = PROMO_TWEETS.indexOf(available[Math.floor(Math.random() * available.length)]);
        var promoText = PROMO_TWEETS[promoIdx];

        try {
          var promoMain = promoText;
          if (!promoMain.includes("#") && promoMain.length + 30 <= 280) {
            promoMain = promoMain + "\n\n#JoãoFonseca #TenisBrasil";
          }
          var promoReply = "🔗 www.fonsecanews.com.br";
          var promoResult = await postWithLinkReply(promoMain, promoReply);
          lastPromos.push(promoIdx);
          if (lastPromos.length > 5) lastPromos = lastPromos.slice(-5);
          await kv.set("tw:promo_history", JSON.stringify(lastPromos), { ex: 604800 });
          await kv.set("tw:promo:" + today, "1", { ex: 172800 });
          await setLastPostTime();
          await incTodayCount();
          return res.status(200).json({ ok: true, type: "promo", tweetId: promoResult.data ? promoResult.data.id : null });
        } catch (e) {
          console.log("[tweet] Promo error:", e.message);
          await kv.set("tw:promo:" + today, "error", { ex: 172800 });
        }
      }
    }

    // ===== 2. NEWS =====
    var host = "fonsecanews.com.br";
    var protocol = "https";

    var newsRes = await fetch(protocol + "://" + host + "/api/news");
    if (!newsRes.ok) throw new Error("News API " + newsRes.status);
    var newsData = await newsRes.json();

    if (!newsData.news || newsData.news.length === 0) {
      return res.status(200).json({ skip: true, reason: "no_news" });
    }

    // Load recent posted titles for semantic dedup (v10)
    var recentTitles = await getRecentTitles();
    var SIMILARITY_THRESHOLD = 0.5; // 50% keyword overlap = duplicate

    // Filter and score news
    var candidates = [];
    var skipped = { old: 0, blocked: 0, hash_dup: 0, similar: 0, no_fonseca: 0 };
    for (var i = 0; i < newsData.news.length; i++) {
      var item = newsData.news[i];

      // Age filter: max 24h
      var ageH = (Date.now() - new Date(item.date).getTime()) / 3600000;
      if (ageH > 24) { skipped.old++; continue; }

      // Source quality
      var sq = sourceScore(item.source);
      if (sq < 0) { skipped.blocked++; continue; }

      // Already posted (literal hash)?
      var hash = titleHash(item.title);
      if (!hash || hash.length < 5) { skipped.hash_dup++; continue; }
      if (await wasPosted(hash)) { skipped.hash_dup++; continue; }

      // Title must mention Fonseca
      var tLow = (item.title || "").toLowerCase();
      if (!tLow.includes("fonseca")) { skipped.no_fonseca++; continue; }

      // NEW in v10: semantic similarity dedup vs last 15 posted titles
      var simResult = similarityTo(item.title, recentTitles);
      if (simResult.sim >= SIMILARITY_THRESHOLD) {
        console.log("[tweet] SIMILAR (" + Math.round(simResult.sim * 100) + "%) skip: '" + item.title.substring(0, 60) + "' vs '" + (simResult.matched || "").substring(0, 60) + "'");
        skipped.similar++;
        continue;
      }

      // Score: freshness + source quality
      var freshness = Math.max(0, 1 - (ageH / 24));
      var score = freshness * 10 + sq * 5;

      candidates.push({ item: item, hash: hash, score: score });
    }

    // Sort by score (best first)
    candidates.sort(function (a, b) { return b.score - a.score; });

    if (candidates.length === 0) {
      return res.status(200).json({ skip: true, reason: "no_new_news", checked: newsData.news.length, skipped: skipped });
    }

    var best = candidates[0];

    // ===== GENERATE TWEET TEXT =====
    var tweetText = await geminiTweet(best.item.title, context);
    var usedFallback = false;

    // Fallback if Gemini fails or returns garbage
    if (!tweetText) {
      tweetText = templateTweet(best.item.title, best.item.source);
      usedFallback = true;
      console.log("[tweet] Using template fallback for: " + best.item.title.substring(0, 60));
    }

    // Smart hashtags — pick 2-3 based on news content
    if (!tweetText.includes("#")) {
      var hashtags = ["#JoãoFonseca"];
      var titleLow = (best.item.title || "").toLowerCase();
      var tweetLow = tweetText.toLowerCase();
      var combined = titleLow + " " + tweetLow;

      // Tournament-specific
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

      // Context-based
      if (combined.includes("atp") || combined.includes("ranking")) hashtags.push("#ATP");
      if (combined.includes("brasil") || combined.includes("brasileiro")) hashtags.push("#TenisBrasil");

      // Dedup and limit to 3
      var uniqueTags = [];
      hashtags.forEach(function (t) { if (uniqueTags.indexOf(t) === -1 && uniqueTags.length < 3) uniqueTags.push(t); });

      var tagsText = "\n\n" + uniqueTags.join(" ");
      if (tweetText.length + tagsText.length <= 280) {
        tweetText = tweetText + tagsText;
      } else if (tweetText.length + 16 <= 280) {
        tweetText = tweetText + "\n\n#JoãoFonseca";
      }
    }

    // Safety: enforce 280 char limit
    if (tweetText.length > 280) {
      tweetText = tweetText.substring(0, 277) + "...";
    }

    // v10: normalized source name in reply
    var prettySource = normalizeSource(best.item.source);
    var linkReply = "📰 " + prettySource + "\n\n🔗 www.fonsecanews.com.br";

    console.log("[tweet] Posting: " + tweetText.substring(0, 100) + "...");

    var tweetResult = await postWithLinkReply(tweetText, linkReply);

    // v10: also save to recent titles ringbuffer
    await markPosted(best.hash);
    await pushRecentTitle(best.item.title);
    await setLastPostTime();
    await incTodayCount();

    return res.status(200).json({
      ok: true,
      type: "news",
      title: best.item.title,
      source: best.item.source,
      pretty_source: prettySource,
      tweet: tweetText,
      chars: tweetText.length,
      used_fallback: usedFallback,
      tweetId: tweetResult.data ? tweetResult.data.id : null,
      todayTotal: todayCount + 1,
      skipped: skipped,
    });

  } catch (e) {
    console.error("[tweet] Error:", e);
    return res.status(200).json({ ok: false, error: e.message });
  }
}
