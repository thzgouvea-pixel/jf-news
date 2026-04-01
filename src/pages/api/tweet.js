// ===== FONSECA NEWS - TWITTER BOT v7 =====
// Anti-repetition: KV-based history, similarity check, rate limits
// Algorithm-optimized: link in reply, max 1-2 hashtags, conversational
// Schedule: max 4 tweets/day (1 poll/promo + 3 news), min 2h between posts

import crypto from "crypto";
import { kv } from "@vercel/kv";

function percentEncode(str) {
  return encodeURIComponent(str)
    .replace(/!/g, '%21')
    .replace(/\*/g, '%2A')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29');
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
    oauth_consumer_key: ck,
    oauth_nonce: nonce,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: ts,
    oauth_token: at,
    oauth_version: "1.0"
  };

  var sortedParams = Object.keys(oauthData).sort();
  var paramPairs = sortedParams.map(function(k) { return percentEncode(k) + "=" + percentEncode(oauthData[k]); });
  var paramString = paramPairs.join("&");
  var baseString = "POST" + "&" + percentEncode(url) + "&" + percentEncode(paramString);
  var signingKey = percentEncode(cs) + "&" + percentEncode(ats);

  var sig = crypto.createHmac("sha1", signingKey).update(baseString).digest("base64");

  var headerParams = Object.assign({}, oauthData, { oauth_signature: sig });
  var headerParts = Object.keys(headerParams).sort().map(function(k) {
    return percentEncode(k) + '="' + percentEncode(headerParams[k]) + '"';
  });
  var authHeader = "OAuth " + headerParts.join(", ");

  var body = { text: text };
  if (replyTo) body.reply = { in_reply_to_tweet_id: replyTo };

  var res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": authHeader,
      "Content-Type": "application/json",
      "User-Agent": "FonsecaNewsBot/3.0"
    },
    body: JSON.stringify(body)
  });

  var raw = await res.text();
  console.log("[tweet] Status:", res.status, "Body:", raw.substring(0, 300));

  if (!res.ok) {
    throw new Error("Twitter error: " + res.status + " - " + raw.substring(0, 300));
  }

  return JSON.parse(raw);
}

async function postWithLinkReply(mainText, linkText) {
  var result = await postTweet(mainText);
  if (result.data && result.data.id && linkText) {
    try {
      await postTweet(linkText, result.data.id);
    } catch (e) {
      console.log("[tweet] Reply failed:", e.message);
    }
  }
  return result;
}

// ===== KV-BASED DEDUPLICATION =====
// Persists across deploys/cold starts

async function wasRecentlyPosted(titleHash) {
  try {
    var val = await kv.get("tw:" + titleHash);
    return !!val;
  } catch (e) { return false; }
}

async function markAsPosted(titleHash) {
  try {
    await kv.set("tw:" + titleHash, Date.now(), { ex: 60 * 60 * 24 * 7 }); // 7 days expiry
  } catch (e) {}
}

async function getLastPostTime() {
  try {
    var val = await kv.get("tw:last_post");
    return val ? parseInt(val, 10) : 0;
  } catch (e) { return 0; }
}

async function setLastPostTime() {
  try {
    await kv.set("tw:last_post", Date.now());
  } catch (e) {}
}

async function getTodayPostCount() {
  try {
    var today = new Date().toISOString().split("T")[0];
    var val = await kv.get("tw:count:" + today);
    return val ? parseInt(val, 10) : 0;
  } catch (e) { return 0; }
}

async function incrementTodayPostCount() {
  try {
    var today = new Date().toISOString().split("T")[0];
    await kv.incr("tw:count:" + today);
    // Set expiry so old counts auto-delete
    await kv.expire("tw:count:" + today, 60 * 60 * 48);
  } catch (e) {}
}

// ===== SIMILARITY CHECK =====
// Prevents posting titles that are too similar

function normalizeTitle(title) {
  return (title || "").toLowerCase()
    .replace(/[^a-záàãâéêíóôõúüç\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function titleHash(title) {
  var norm = normalizeTitle(title);
  // Use first 8 significant words as hash key
  var words = norm.split(" ").filter(function(w) {
    return w.length > 3 && !["joão", "fonseca", "para", "sobre", "após", "como", "mais", "pela", "pelo", "com", "que", "uma", "dos", "das", "este", "esta", "isso"].includes(w);
  }).slice(0, 8);
  return words.join("_").substring(0, 80);
}

async function isTooSimilar(title) {
  var hash = titleHash(title);
  if (!hash || hash.length < 5) return false;
  return await wasRecentlyPosted(hash);
}

// ===== TWEET FORMATTING =====

function cleanTitle(title, source) {
  if (!title) return "";
  var cleaned = title;
  if (source) {
    cleaned = cleaned.replace(" - " + source, "");
    cleaned = cleaned.replace(" | " + source, "");
    cleaned = cleaned.replace(" · " + source, "");
  }
  var dashIdx = cleaned.lastIndexOf(" - ");
  if (dashIdx > cleaned.length * 0.5) {
    cleaned = cleaned.substring(0, dashIdx);
  }
  return cleaned.trim();
}

var NEWS_TEMPLATES = {
  "Resultado": {
    win: [
      "{title} 🇧🇷🎾\n\n{score}\n\n#JoãoFonseca",
      "{title}\n\n{score}\n\n#JoãoFonseca",
    ],
    loss: [
      "{title}\n\n{score}\n\n#JoãoFonseca",
    ],
    neutral: [
      "{title} 🎾\n\n#JoãoFonseca",
    ]
  },
  "Ranking": [
    "{title} 📈\n\n#JoãoFonseca",
  ],
  "Declaração": [
    "{title}\n\n#JoãoFonseca",
  ],
  "Torneio": [
    "{title} 🎾\n\n#JoãoFonseca",
  ],
  "default": [
    "{title}\n\n#JoãoFonseca",
    "{title} 🇧🇷\n\n#JoãoFonseca",
  ]
};

function formatTweet(newsItem, lastMatch, player) {
  var title = cleanTitle(newsItem.title, newsItem.source);
  var category = newsItem.category || "default";
  var templates;
  var score = "";

  if (lastMatch && lastMatch.score) {
    score = lastMatch.score;
    if (lastMatch.tournament) score += " · " + lastMatch.tournament;
  }

  if (category === "Resultado") {
    var isWin = /vence|vitória|elimina|avança|classificad/i.test(title);
    var isLoss = /perde|derrota|eliminad|cai|queda/i.test(title);
    if (isWin) templates = NEWS_TEMPLATES["Resultado"].win;
    else if (isLoss) templates = NEWS_TEMPLATES["Resultado"].loss;
    else templates = NEWS_TEMPLATES["Resultado"].neutral;
  } else {
    templates = NEWS_TEMPLATES[category] || NEWS_TEMPLATES["default"];
  }

  var template = templates[Math.floor(Math.random() * templates.length)];
  var tweet = template
    .replace(/\{title\}/g, title)
    .replace(/\{score\}/g, score)
    .replace(/\{ranking\}/g, player ? player.ranking : "41");

  tweet = tweet.replace(/\n\n\n/g, "\n\n").replace(/\n\n$/g, "");

  if (tweet.length > 280) {
    var suffix = "\n\n#JoãoFonseca";
    var maxTitle = 280 - suffix.length - 5;
    tweet = title.substring(0, maxTitle) + "..." + suffix;
  }

  return tweet;
}

function formatLinkReply(newsItem) {
  var parts = [];
  if (newsItem.source) parts.push("📰 " + newsItem.source);
  parts.push("🔗 fonsecanews.com.br");
  return parts.join("\n");
}

// ===== PROMOTIONAL TWEETS =====
var PROMO_TWEETS = [
  { main: "Você já deu seu palpite pro próximo jogo do João? 🔮\n\nEscolhe o placar e compartilha pra ver se acertou\n\n#JoãoFonseca #Tennis", link: "🔗 fonsecanews.com.br" },
  { main: "Fiz 95 pontos no Quiz do Fonseca News e achei que manjava de tênis 😂\n\nAlguém consegue mais?\n\n#JoãoFonseca", link: "🔗 fonsecanews.com.br" },
  { main: "Monte Carlo começa em poucos dias e o countdown tá correndo ⏳🔥\n\nQuem mais tá ansioso?\n\n#JoãoFonseca #MonteCarlo", link: "🔗 fonsecanews.com.br" },
  { main: "Novo no tênis e quer entender o que tá acontecendo em cada ponto? A gente fez um guia completo 🎾\n\n#Tennis #JoãoFonseca", link: "🔗 fonsecanews.com.br/regras" },
  { main: "Tem raquete parada em casa? Anuncia grátis na comunidade do FN no Telegram 🏷️\n\n#Tennis #Raquete", link: "🔗 fonsecanews.com.br/raquetes" },
  { main: "A enquete de hoje tá polêmica 🔥\n\nVota lá e vê o que a comunidade acha\n\n#JoãoFonseca #Tennis", link: "🔗 fonsecanews.com.br" },
  { main: "O Fonseca News é o único site brasileiro 100% dedicado ao João Fonseca 🇧🇷\n\nNotícias, ranking, quiz, palpite, enquete... tudo num lugar só\n\n#JoãoFonseca", link: "🔗 fonsecanews.com.br" },
  { main: "Esse quiz é viciante, não vou mentir 🎾\n\n10 perguntas com fun facts que você não sabia sobre o João\n\n#JoãoFonseca", link: "🔗 fonsecanews.com.br" },
  { main: "O forehand do João Fonseca é o mais bonito do circuito atualmente\n\nMudo de opinião? Não 🇧🇷🎾\n\n#JoãoFonseca #ATP" },
  { main: "Se o João fosse espanhol, já estaria na capa de todo jornal esportivo do mundo\n\nO Brasil precisa valorizar mais 🇧🇷\n\n#JoãoFonseca" },
  { main: "Quem assistiu João vs Rublev no Australian Open sabe: aquele jogo mudou tudo\n\nO mundo conheceu o Fonseca ali 🔥\n\n#JoãoFonseca #AusOpen" },
  { main: "O tênis brasileiro não tinha um fenômeno assim desde o Guga\n\nE o João tem só 19 anos. Imagina com 25 🤯\n\n#JoãoFonseca" },
  { main: "Hot take: João Fonseca vai ganhar Roland Garros antes dos 22 anos\n\nAnotem 📝\n\n#JoãoFonseca #RolandGarros" },
  { main: "O João tem 19 anos e já venceu um top 10 em Grand Slam\n\nCom 19 anos eu mal sabia sacar 😂\n\n#JoãoFonseca" },
  { main: "Alcaraz, Sinner ou Fonseca — quem vai dominar o tênis em 2030? 🏆\n\n#Alcaraz #Sinner #JoãoFonseca" },
  { main: "Saibro ou quadra dura? Acho que o João vai ser devastador no saibro\n\nMonte Carlo vai provar 🟤\n\n#JoãoFonseca #MonteCarlo" },
  { main: "O Brasil tem o melhor sub-20 do mundo e pouca gente sabe\n\nIsso precisa mudar 🇧🇷🎾\n\n#JoãoFonseca" },
  { main: "Quem vai ser o maior rival do João na carreira? Tien? Mensik? Fils?\n\nEu aposto no Tien 🤔\n\n#JoãoFonseca #NextGen" },
  { main: "Acordei pensando em tênis. De novo\n\nCulpa do João 😂🎾\n\n#JoãoFonseca" },
  { main: "Será que a gente vai ver o João nas Olimpíadas de 2028 em LA?\n\nJá estou contando os dias 🇧🇷🏅\n\n#JoãoFonseca #LA2028" },
  { main: "A biografia completa do João tá no site — de Ipanema ao top 25 do mundo 🇧🇷\n\n#JoãoFonseca", link: "🔗 fonsecanews.com.br/biografia" },
  { main: "Já votou na enquete de hoje? A comunidade tá dividida 🔥\n\n#JoãoFonseca #Tennis", link: "🔗 fonsecanews.com.br" },
  { main: "O João fez Sinner suar em dois tiebreaks em Indian Wells\n\nA evolução é real 🔥\n\n#JoãoFonseca #ATP" },
  { main: "Vocês preferem assistir tênis na TV ou no estádio?\n\nNo estádio a velocidade da bola é surreal 🏟️\n\n#Tennis #ATP" },
];

var DAILY_POLLS = [
  "João vence o primeiro jogo em Monte Carlo?",
  "João chega ao Top 30 até o fim de 2026?",
  "João vai ganhar um Masters 1000 na carreira?",
  "Quem terá o melhor 2026: João ou Tien?",
  "João chega às quartas em Roland Garros?",
  "João pode ser Top 10 até 2027?",
  "Quem é mais talentoso: João ou Alcaraz aos 19?",
];

// ===== MAIN HANDLER =====
export default async function handler(req, res) {
  // Check posting hours (6h-00h Brasília)
  var nowUTC = new Date().getUTCHours();
  var brasilia = (nowUTC - 3 + 24) % 24;
  if (brasilia < 6) {
    return res.status(200).json({ message: "Fora do horário (6h-00h BRT). Atual: " + brasilia + "h" });
  }

  // Test mode
  if (req.query.test === "1") {
    try {
      var result = await postWithLinkReply("🎾 Teste do bot!\n\n#JoãoFonseca", "🔗 fonsecanews.com.br");
      return res.status(200).json({ success: true, result: result });
    } catch (e) {
      return res.status(200).json({ success: false, error: e.message });
    }
  }

  try {
    // ===== RATE LIMITING =====
    // Max 4 posts per day
    var todayCount = await getTodayPostCount();
    if (todayCount >= 4) {
      return res.status(200).json({ message: "Limite diário atingido (4 posts)", count: todayCount });
    }

    // Min 2 hours between posts
    var lastPost = await getLastPostTime();
    var hoursSinceLast = (Date.now() - lastPost) / (1000 * 60 * 60);
    if (hoursSinceLast < 2) {
      return res.status(200).json({ message: "Intervalo mínimo de 2h. Última: " + Math.round(hoursSinceLast * 60) + "min atrás" });
    }

    var posted = [];

    // ===== 1. POLL (once per day, morning) =====
    if (brasilia >= 8 && brasilia <= 11) {
      var today = new Date().toISOString().split("T")[0];
      var pollPosted = await kv.get("tw:poll:" + today);
      if (!pollPosted) {
        var dayIdx = Math.floor(Date.now() / 86400000) % DAILY_POLLS.length;
        var question = DAILY_POLLS[dayIdx];
        try {
          var pollResult = await postWithLinkReply(
            "📊 ENQUETE DO DIA\n\n" + question + "\n\nVota lá 👇\n\n#JoãoFonseca #Tennis",
            "🗳️ fonsecanews.com.br"
          );
          await kv.set("tw:poll:" + today, "1", { ex: 60 * 60 * 48 });
          await setLastPostTime();
          await incrementTodayPostCount();
          posted.push({ type: "poll", tweetId: pollResult.data ? pollResult.data.id : null });
          return res.status(200).json({ message: "Poll posted", posted: posted });
        } catch (e) {
          console.log("[tweet] Poll error:", e.message);
          await kv.set("tw:poll:" + today, "error", { ex: 60 * 60 * 48 });
        }
      }
    }

    // ===== 2. PROMO (once per day, afternoon/evening) =====
    if (brasilia >= 14 && brasilia <= 20) {
      var today = new Date().toISOString().split("T")[0];
      var promoPosted = await kv.get("tw:promo:" + today);
      if (!promoPosted) {
        // Use random instead of dayIdx to avoid same promo every week
        var promoIdx = Math.floor(Math.random() * PROMO_TWEETS.length);
        var promo = PROMO_TWEETS[promoIdx];
        try {
          var promoResult = promo.link
            ? await postWithLinkReply(promo.main, promo.link)
            : await postTweet(promo.main);
          await kv.set("tw:promo:" + today, "1", { ex: 60 * 60 * 48 });
          await setLastPostTime();
          await incrementTodayPostCount();
          posted.push({ type: "promo", tweetId: promoResult.data ? promoResult.data.id : null });
          return res.status(200).json({ message: "Promo posted", posted: posted });
        } catch (e) {
          console.log("[tweet] Promo error:", e.message);
          await kv.set("tw:promo:" + today, "error", { ex: 60 * 60 * 48 });
        }
      }
    }

    // ===== 3. NEWS =====
    var protocol = req.headers["x-forwarded-proto"] || "https";
    var host = req.headers.host;
    var newsRes = await fetch(protocol + "://" + host + "/api/news");
    if (!newsRes.ok) throw new Error("Failed to fetch news");
    var newsData = await newsRes.json();

    if (!newsData.news || newsData.news.length === 0) {
      return res.status(200).json({ message: "Sem notícias" });
    }

    // Find first news that hasn't been posted AND isn't too similar
    var newsToPost = null;
    for (var i = 0; i < newsData.news.length; i++) {
      var item = newsData.news[i];
      var hash = titleHash(item.title);

      // Check if exact title was posted
      if (await wasRecentlyPosted(hash)) continue;

      // Check if something too similar was posted
      if (await isTooSimilar(item.title)) continue;

      newsToPost = item;
      break;
    }

    if (!newsToPost) {
      return res.status(200).json({ message: "Todas as notícias já postadas ou similares" });
    }

    try {
      var tweetText = formatTweet(newsToPost, newsData.lastMatch, newsData.player);
      var linkReply = formatLinkReply(newsToPost);
      var tweetResult = await postWithLinkReply(tweetText, linkReply);

      // Mark as posted
      await markAsPosted(titleHash(newsToPost.title));
      await setLastPostTime();
      await incrementTodayPostCount();

      posted.push({
        type: "news",
        title: newsToPost.title,
        tweetId: tweetResult.data ? tweetResult.data.id : null,
        chars: tweetText.length
      });
    } catch (e) {
      posted.push({ title: newsToPost.title, error: e.message });
    }

    res.status(200).json({
      message: "Posted " + posted.filter(function(p) { return !p.error; }).length,
      todayTotal: todayCount + 1,
      posted: posted
    });

  } catch (error) {
    console.error("[tweet] Error:", error);
    res.status(500).json({ error: error.message });
  }
}
