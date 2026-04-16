// ===== FONSECA NEWS — TWITTER BOT v9 =====
// Gemini-powered tweet generation, quality source filtering
// Schedule: max 4 tweets/day, min 2h between posts, 6h-00h BRT
// Algorithm: link in reply, max 1 hashtag, conversational tone

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

// ===== TITLE HASHING & SIMILARITY =====
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
    "- O tweet precisa ser uma FRASE COMPLETA, nunca corte no meio de uma palavra\n" +
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
    "- \"O Fonseca ta voando em M\" (cortado no meio, sem sentido)\n" +
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

    // QUALITY VALIDATION — reject garbage
    if (!txt || txt.length < 80) {
      console.log("[tweet] Gemini too short (" + (txt ? txt.length : 0) + " chars)");
      return null;
    }

    // Reject if truncated — last word is suspiciously short (cut mid-sentence)
    var words = txt.replace(/[🔥🎾🇧🇷⚡💪🏆😂📝🏅✨🏟️👏🫡📱📲🔔]+$/g, "").trim().split(/\s+/);
    var lastWord = words[words.length - 1] || "";
    var shortWordsOk = ["e", "o", "a", "no", "na", "um", "ja", "so", "la", "ai", "ao", "em", "de", "do", "da", "os", "as", "se", "ou"];
    var lastClean = lastWord.toLowerCase().replace(/[.!?…,;:)]/g, "");
    if (lastClean.length > 0 && lastClean.length <= 2 && shortWordsOk.indexOf(lastClean) === -1) {
      console.log("[tweet] Gemini truncated, ends with: '" + lastWord + "'");
      return null;
    }

    // Reject if doesn't look like a complete sentence
    if (!/[.!?…🔥🎾🇧🇷⚡💪🏆😂📝🏅✨a-záàâãéêíóôõúç0-9)"]$/i.test(txt.charAt(txt.length - 1))) {
      console.log("[tweet] Gemini bad ending: '" + txt.substring(txt.length - 10) + "'");
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
      var r = await postWithLinkReply("Teste do bot v9! 🎾", "🔗 fonsecanews.com.br");
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

    // Filter and score news
    var candidates = [];
    for (var i = 0; i < newsData.news.length; i++) {
      var item = newsData.news[i];

      // Age filter: max 24h
      var ageH = (Date.now() - new Date(item.date).getTime()) / 3600000;
      if (ageH > 24) continue;

      // Source quality
      var sq = sourceScore(item.source);
      if (sq < 0) continue; // blocked source

      // Already posted?
      var hash = titleHash(item.title);
      if (!hash || hash.length < 5) continue;
      if (await wasPosted(hash)) continue;

      // Title must mention Fonseca
      var tLow = (item.title || "").toLowerCase();
      if (!tLow.includes("fonseca")) continue;

      // Score: freshness + source quality
      var freshness = Math.max(0, 1 - (ageH / 24));
      var score = freshness * 10 + sq * 5;

      candidates.push({ item: item, hash: hash, score: score });
    }

    // Sort by score (best first)
    candidates.sort(function (a, b) { return b.score - a.score; });

    if (candidates.length === 0) {
      return res.status(200).json({ skip: true, reason: "no_new_news", checked: newsData.news.length });
    }

    var best = candidates[0];

    // ===== GENERATE TWEET TEXT =====
    var tweetText = await geminiTweet(best.item.title, context);

    // Fallback if Gemini fails
    if (!tweetText) {
      tweetText = templateTweet(best.item.title, best.item.source);
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
      hashtags.forEach(function(t) { if (uniqueTags.indexOf(t) === -1 && uniqueTags.length < 3) uniqueTags.push(t); });

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

    // Link in reply (better for algorithm)
    var linkReply = "📰 " + (best.item.source || "Fonte") + "\n\n🔗 www.fonsecanews.com.br";

    console.log("[tweet] Posting: " + tweetText.substring(0, 100) + "...");

    var tweetResult = await postWithLinkReply(tweetText, linkReply);

    await markPosted(best.hash);
    await setLastPostTime();
    await incTodayCount();

    return res.status(200).json({
      ok: true,
      type: "news",
      title: best.item.title,
      source: best.item.source,
      tweet: tweetText,
      chars: tweetText.length,
      tweetId: tweetResult.data ? tweetResult.data.id : null,
      todayTotal: todayCount + 1,
    });

  } catch (e) {
    console.error("[tweet] Error:", e);
    return res.status(200).json({ ok: false, error: e.message });
  }
}
