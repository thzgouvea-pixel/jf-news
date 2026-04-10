// ===== FONSECA NEWS - TWITTER BOT v8 =====
// v8 changes: new evergreen promo tweets, removed repetitive poll/quiz mentions
// Anti-repetition: KV-based history, similarity check, rate limits
// Algorithm-optimized: link in reply, max 1-2 hashtags, conversational
// Schedule: max 4 tweets/day (1 promo + 3 news), min 2h between posts

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

async function wasRecentlyPosted(titleHash) {
  try {
    var val = await kv.get("tw:" + titleHash);
    return !!val;
  } catch (e) { return false; }
}

async function markAsPosted(titleHash) {
  try {
    await kv.set("tw:" + titleHash, Date.now(), { ex: 60 * 60 * 24 * 7 });
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
    await kv.expire("tw:count:" + today, 60 * 60 * 48);
  } catch (e) {}
}

// ===== SIMILARITY CHECK =====

function normalizeTitle(title) {
  return (title || "").toLowerCase()
    .replace(/[^a-záàãâéêíóôõúüç\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function titleHash(title) {
  var norm = normalizeTitle(title);
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

// ===== PROMOTIONAL TWEETS (evergreen, emojis, no stats/polls) =====
var PROMO_TWEETS = [
  { main: "🎾 Ranking, calendario, forma recente e noticias filtradas. Tudo do Joao num lugar so.\n\n#JoãoFonseca", link: "🔗 fonsecanews.com.br" },
  { main: "🇧🇷 De Ipanema pro circuito ATP. A historia completa do Joao Fonseca.\n\n#JoãoFonseca", link: "🔗 fonsecanews.com.br" },
  { main: "📊 Timeline, conquistas e comparativo Next Gen. Tudo sobre o Joao em um unico site.\n\n#JoãoFonseca", link: "🔗 fonsecanews.com.br" },
  { main: "🔥 O proximo grande nome do tenis brasileiro tem 19 anos. Acompanhe a jornada.\n\n#JoãoFonseca", link: "🔗 fonsecanews.com.br" },
  { main: "📱 Sem app, sem poluicao. O site de fas do Joao Fonseca direto no navegador.\n\n#JoãoFonseca", link: "🔗 fonsecanews.com.br" },
  { main: "🏆 2 titulos ATP, NextGen campeao, Top 40 mundial. E so o comeco.\n\n#JoãoFonseca", link: "🔗 fonsecanews.com.br" },
  { main: "⭐ O unico site 100% dedicado ao Joao Fonseca. Noticias, stats e mais.\n\n#JoãoFonseca", link: "🔗 fonsecanews.com.br" },
  { main: "🇧🇷🔥 O tenis brasileiro nao via um talento assim desde o Guga.\n\n#JoãoFonseca", link: "🔗 fonsecanews.com.br" },
  { main: "⚡ Fonseca, Tien, Mensik, Fils. Quem chega primeiro no Top 10?\n\n#JoãoFonseca #NextGen" },
  { main: "🎯 19 anos, Top 40, e subindo. Ate onde o Joao vai?\n\n#JoãoFonseca" },
  { main: "🤔 Joao Fonseca no Top 10 ate 2027. Voce acredita?\n\n#JoãoFonseca #ATP" },
  { main: "🎾 O forehand do Joao Fonseca e o mais bonito do circuito atualmente\n\nMuda minha opiniao? Nao 🇧🇷\n\n#JoãoFonseca #ATP" },
  { main: "🇧🇷 Se o Joao fosse espanhol, ja estaria na capa de todo jornal esportivo do mundo\n\nO Brasil precisa valorizar mais\n\n#JoãoFonseca" },
  { main: "🔥 Quem assistiu Joao vs Rublev no Australian Open sabe: aquele jogo mudou tudo\n\nO mundo conheceu o Fonseca ali\n\n#JoãoFonseca #AusOpen" },
  { main: "🤯 O tenis brasileiro nao tinha um fenomeno assim desde o Guga\n\nE o Joao tem so 19 anos. Imagina com 25\n\n#JoãoFonseca" },
  { main: "📝 Hot take: Joao Fonseca vai ganhar Roland Garros antes dos 22 anos\n\nAnotem\n\n#JoãoFonseca #RolandGarros" },
  { main: "😂 O Joao tem 19 anos e ja venceu um top 10 em Grand Slam\n\nCom 19 anos eu mal sabia sacar\n\n#JoãoFonseca" },
  { main: "🏆 Alcaraz, Sinner ou Fonseca — quem vai dominar o tenis em 2030?\n\n#Alcaraz #Sinner #JoãoFonseca" },
  { main: "🟤 Saibro ou quadra dura? Acho que o Joao vai ser devastador no saibro\n\n#JoãoFonseca" },
  { main: "🇧🇷🎾 O Brasil tem o melhor sub-20 do mundo e pouca gente sabe\n\nIsso precisa mudar\n\n#JoãoFonseca" },
  { main: "🤔 Quem vai ser o maior rival do Joao na carreira? Tien? Mensik? Fils?\n\n#JoãoFonseca #NextGen" },
  { main: "😂🎾 Acordei pensando em tenis. De novo\n\nCulpa do Joao\n\n#JoãoFonseca" },
  { main: "🇧🇷🏅 Sera que a gente vai ver o Joao nas Olimpiadas de 2028 em LA?\n\nJa estou contando os dias\n\n#JoãoFonseca #LA2028" },
  { main: "🌱 Grama, saibro ou duro — acompanhe o Joao em qualquer superficie.\n\n#JoãoFonseca", link: "🔗 fonsecanews.com.br" },
  { main: "🎾 A biografia completa do Joao ta no site — de Ipanema ao top 40 do mundo 🇧🇷\n\n#JoãoFonseca", link: "🔗 fonsecanews.com.br" },
  { main: "🔥 O Joao fez Sinner suar em dois tiebreaks em Indian Wells\n\nA evolucao e real\n\n#JoãoFonseca #ATP" },
  { main: "🏟️ Voces preferem assistir tenis na TV ou no estadio?\n\nNo estadio a velocidade da bola e surreal\n\n#Tennis #ATP" },
];

// ===== MAIN HANDLER =====
export default async function handler(req, res) {
  // Check posting hours (6h-00h Brasilia)
  var nowUTC = new Date().getUTCHours();
  var brasilia = (nowUTC - 3 + 24) % 24;
  if (brasilia < 6) {
    return res.status(200).json({ message: "Fora do horario (6h-00h BRT). Atual: " + brasilia + "h" });
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
    var todayCount = await getTodayPostCount();
    if (todayCount >= 4) {
      return res.status(200).json({ message: "Limite diario atingido (4 posts)", count: todayCount });
    }

    var lastPost = await getLastPostTime();
    var hoursSinceLast = (Date.now() - lastPost) / (1000 * 60 * 60);
    if (hoursSinceLast < 2) {
      return res.status(200).json({ message: "Intervalo minimo de 2h. Ultima: " + Math.round(hoursSinceLast * 60) + "min atras" });
    }

    var posted = [];

    // ===== 1. PROMO (once per day, afternoon/evening 14h-20h BRT) =====
    if (brasilia >= 14 && brasilia <= 20) {
      var today = new Date().toISOString().split("T")[0];
      var promoPosted = await kv.get("tw:promo:" + today);
      if (!promoPosted) {
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

    // ===== 2. NEWS =====
    var allowedHosts = ["fonsecanews.com.br", "www.fonsecanews.com.br", "localhost:3000"];
    var host = req.headers.host;
    if (!host || !allowedHosts.some(function(h) { return host === h || host.endsWith(".vercel.app"); })) {
      host = "fonsecanews.com.br";
    }
    var protocol = req.headers["x-forwarded-proto"] === "http" ? "http" : "https";
    var newsRes = await fetch(protocol + "://" + host + "/api/news");
    if (!newsRes.ok) throw new Error("Failed to fetch news");
    var newsData = await newsRes.json();

    if (!newsData.news || newsData.news.length === 0) {
      return res.status(200).json({ message: "Sem noticias" });
    }

    var newsToPost = null;
    for (var i = 0; i < newsData.news.length; i++) {
      var item = newsData.news[i];
      var hash = titleHash(item.title);
      if (await wasRecentlyPosted(hash)) continue;
      if (await isTooSimilar(item.title)) continue;
      newsToPost = item;
      break;
    }

    if (!newsToPost) {
      return res.status(200).json({ message: "Todas as noticias ja postadas ou similares" });
    }

    try {
      var tweetText = formatTweet(newsToPost, newsData.lastMatch, newsData.player);
      var linkReply = formatLinkReply(newsToPost);
      var tweetResult = await postWithLinkReply(tweetText, linkReply);

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
