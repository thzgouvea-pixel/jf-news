// ===== FONSECA NEWS - TWITTER BOT v6 =====
// Algorithm-optimized: link in reply, max 1-2 hashtags, conversational voice
// Uses X API v2 tweets endpoint

import crypto from "crypto";

let postedTitles = new Set();

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

// ===== REPLY WITH LINK =====
// Algorithm penalizes links in main tweet by 30-50%
// Post link as reply to own tweet instead
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

// ===== SMART TWEET FORMATTING =====
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

// Multiple conversational templates per category
// NO links in main tweet, max 1-2 hashtags
var NEWS_TEMPLATES = {
  "Resultado": {
    win: [
      "VAMOS! 🇧🇷🎾\n\n{title}\n\n{score}\n\n#JoãoFonseca",
      "Jogou demais! {title} 🔥\n\n{score}\n\n#JoãoFonseca #Tennis",
      "Mais uma vitória do João! 🇧🇷\n\n{title}\n\n{score}",
      "O cara não para! {title}\n\nVamos, João! 🔥\n\n#JoãoFonseca",
    ],
    loss: [
      "Não foi dessa vez, mas o João segue evoluindo 💪\n\n{title}\n\n#JoãoFonseca",
      "Derrota faz parte. A temporada é longa e o João vai voltar mais forte 🇧🇷\n\n{title}",
      "Dia difícil, mas quem acompanha sabe o quanto ele evolui a cada torneio\n\n{title}\n\n#JoãoFonseca",
    ],
    neutral: [
      "{title} 🎾\n\n#JoãoFonseca",
    ]
  },
  "Ranking": [
    "Ranking atualizado! 📈\n\n{title}\n\nJoão Fonseca: #{ranking} ATP 🇧🇷\n\n#JoãoFonseca",
    "Subiu! {title}\n\n🇧🇷 #{ranking} no mundo\n\n#JoãoFonseca #ATP",
  ],
  "Declaração": [
    "Olha o que falaram do João 👀\n\n{title}\n\n#JoãoFonseca",
    "\"{title}\"\n\n#JoãoFonseca #Tennis",
    "{title}\n\nConcordam? 🤔\n\n#JoãoFonseca",
  ],
  "Torneio": [
    "{title} 🎾\n\nBora acompanhar!\n\n#JoãoFonseca",
    "{title}\n\nQuem tá ansioso? 🔥\n\n#JoãoFonseca #ATP",
  ],
  "default": [
    "{title}\n\n#JoãoFonseca",
    "{title} 🇧🇷\n\n#JoãoFonseca #Tennis",
    "{title}\n\nO que vocês acham? 👇\n\n#JoãoFonseca",
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
    .replace(/\{ranking\}/g, player ? player.ranking : "59");

  // Clean empty lines from missing score
  tweet = tweet.replace(/\n\n\n/g, "\n\n").replace(/\n\n$/g, "");

  if (tweet.length > 280) {
    var suffix = "\n\n#JoãoFonseca";
    var maxTitle = 280 - suffix.length - 5;
    tweet = title.substring(0, maxTitle) + "..." + suffix;
  }

  return tweet;
}

// Link reply text (short, just the source + site link)
function formatLinkReply(newsItem) {
  var parts = [];
  if (newsItem.source) parts.push("📰 " + newsItem.source);
  parts.push("🔗 fonsecanews.com.br");
  return parts.join("\n");
}

// ===== PROMOTIONAL TWEETS — conversational, no links in main =====
var PROMO_TWEETS = [
  // === Features — conversational, questions, opinions ===
  { main: "Você já deu seu palpite pro próximo jogo do João? 🔮\n\nEscolhe o placar e compartilha pra ver se acertou\n\n#JoãoFonseca #Tennis", link: "🔗 fonsecanews.com.br" },

  { main: "Fiz 95 pontos no Quiz do Fonseca News e achei que manjava de tênis 😂\n\nAlguém consegue mais?\n\n#JoãoFonseca", link: "🔗 fonsecanews.com.br" },

  { main: "Monte Carlo começa em poucos dias e o countdown tá correndo ⏳🔥\n\nQuem mais tá ansioso?\n\n#JoãoFonseca #MonteCarlo", link: "Palpite + notícias + quiz:\n🔗 fonsecanews.com.br" },

  { main: "Novo no tênis e quer entender o que tá acontecendo em cada ponto? A gente fez um guia completo 🎾\n\n#Tennis #JoãoFonseca", link: "🔗 fonsecanews.com.br/regras" },

  { main: "Tem raquete parada em casa? Anuncia grátis na comunidade do FN no Telegram 🏷️\n\n#Tennis #Raquete", link: "🔗 fonsecanews.com.br/raquetes" },

  { main: "A enquete de hoje tá polêmica 🔥\n\nVota lá e vê o que a comunidade acha\n\n#JoãoFonseca #Tennis", link: "🔗 fonsecanews.com.br" },

  { main: "O Fonseca News é o único site brasileiro 100% dedicado ao João Fonseca 🇧🇷\n\nNotícias, ranking, quiz, palpite, enquete... tudo num lugar só\n\n#JoãoFonseca", link: "🔗 fonsecanews.com.br" },

  { main: "Esse quiz é viciante, não vou mentir 🎾\n\n10 perguntas com fun facts que você não sabia sobre o João\n\n#JoãoFonseca #Quiz", link: "🔗 fonsecanews.com.br" },

  // === Opinions & engagement — NO links, pure engagement ===
  { main: "O forehand do João Fonseca é o mais bonito do circuito atualmente\n\nMudo de opinião? Não 🇧🇷🎾\n\n#JoãoFonseca #ATP" },

  { main: "Se o João fosse espanhol, já estaria na capa de todo jornal esportivo do mundo\n\nO Brasil precisa valorizar mais 🇧🇷\n\n#JoãoFonseca" },

  { main: "Quem assistiu João vs Rublev no Australian Open sabe: aquele jogo mudou tudo\n\nO mundo conheceu o Fonseca ali 🔥\n\n#JoãoFonseca #AusOpen" },

  { main: "O tênis brasileiro não tinha um fenômeno assim desde o Guga\n\nE o João tem só 19 anos. Imagina com 25 🤯\n\n#JoãoFonseca #Guga" },

  { main: "Hot take: João Fonseca vai ganhar Roland Garros antes dos 22 anos\n\nAnotem 📝\n\n#JoãoFonseca #RolandGarros" },

  { main: "O João tem 19 anos e já venceu um top 10 em Grand Slam\n\nCom 19 anos eu mal sabia sacar 😂\n\n#JoãoFonseca" },

  { main: "Discussão séria: Alcaraz, Sinner ou Fonseca — quem vai dominar o tênis em 2030? 🏆\n\n#Alcaraz #Sinner #JoãoFonseca" },

  { main: "Saibro ou quadra dura? Acho que o João vai ser devastador no saibro\n\nMonte Carlo vai provar 🟤\n\n#JoãoFonseca #MonteCarlo" },

  { main: "O Brasil tem o melhor sub-20 do mundo e pouca gente sabe\n\nIsso precisa mudar 🇧🇷🎾\n\n#JoãoFonseca" },

  { main: "Quem vai ser o maior rival do João na carreira? Tien? Mensik? Fils?\n\nEu aposto no Tien 🤔\n\n#JoãoFonseca #NextGen" },

  { main: "Vocês preferem assistir tênis na TV ou no estádio?\n\nNo estádio a velocidade da bola é surreal 🏟️\n\n#Tennis #ATP" },

  { main: "Unpopular opinion: o NextGen Finals deveria valer pontos pro ranking\n\nMudaria tudo 🤔\n\n#ATP #NextGen" },

  { main: "Alguém mais vê semelhanças entre o jogo do João e o do Federer?\n\nO estilo é parecido, mas com mais potência 👀\n\n#JoãoFonseca #Federer" },

  { main: "Acordei pensando em tênis. De novo\n\nCulpa do João 😂🎾\n\n#JoãoFonseca" },

  { main: "Será que a gente vai ver o João nas Olimpíadas de 2028 em LA?\n\nEu já estou contando os dias 🇧🇷🏅\n\n#JoãoFonseca #Olympics #LA2028" },

  { main: "Já votou na enquete de hoje? A comunidade tá dividida 🔥\n\n#JoãoFonseca #Tennis", link: "🔗 fonsecanews.com.br" },
];

var lastPollDay = "";
var lastPromoDay = "";

// ===== DAILY POLL TWEETS =====
var DAILY_POLLS = [
  "João vence o primeiro jogo em Monte Carlo?",
  "João chega ao Top 30 até o fim de 2026?",
  "João vai ganhar um Masters 1000 na carreira?",
  "Quem terá o melhor 2026: João ou Tien?",
  "João chega às quartas em Roland Garros?",
  "João pode ser Top 10 até 2027?",
  "Quem é mais talentoso: João ou Alcaraz aos 19?",
];

function getTodayPollTweet() {
  var today = new Date().toISOString().split("T")[0];
  if (lastPollDay === today) return null;
  var dayIdx = Math.floor(Date.now() / 86400000) % DAILY_POLLS.length;
  var question = DAILY_POLLS[dayIdx];
  return {
    main: "📊 ENQUETE DO DIA\n\n" + question + "\n\nVota lá 👇\n\n#JoãoFonseca #Tennis",
    link: "🗳️ fonsecanews.com.br",
    day: today
  };
}

function getTodayPromoTweet() {
  var today = new Date().toISOString().split("T")[0];
  if (lastPromoDay === today) return null;
  var dayIdx = Math.floor(Date.now() / 86400000) % PROMO_TWEETS.length;
  return { tweet: PROMO_TWEETS[dayIdx], day: today };
}

// ===== MAIN HANDLER =====
export default async function handler(req, res) {
  var nowUTC = new Date().getUTCHours();
  var brasilia = (nowUTC - 3 + 24) % 24;
  if (brasilia < 6) {
    return res.status(200).json({ message: "Fora do horário (6h-00h BRT). Atual: " + brasilia + "h", posted: 0 });
  }

  if (req.query.test === "1") {
    try {
      var result = await postWithLinkReply(
        "🎾 Teste do Fonseca News Bot!\n\n#JoãoFonseca",
        "🔗 fonsecanews.com.br"
      );
      return res.status(200).json({ success: true, result: result });
    } catch (e) {
      return res.status(200).json({ success: false, error: e.message });
    }
  }

  try {
    var protocol = req.headers["x-forwarded-proto"] || "https";
    var host = req.headers.host;
    var newsRes = await fetch(protocol + "://" + host + "/api/news");
    if (!newsRes.ok) throw new Error("Failed to fetch news");
    var newsData = await newsRes.json();

    var posted = [];

    // ===== 1. TRY DAILY POLL TWEET =====
    var pollTweet = getTodayPollTweet();
    if (pollTweet) {
      try {
        var pollResult = await postWithLinkReply(pollTweet.main, pollTweet.link);
        lastPollDay = pollTweet.day;
        posted.push({ type: "poll", tweetId: pollResult.data ? pollResult.data.id : null });
        return res.status(200).json({ message: "Poll posted", posted: posted });
      } catch (e) {
        console.log("[tweet] Poll error:", e.message);
        lastPollDay = pollTweet.day;
      }
    }

    // ===== 2. TRY PROMOTIONAL TWEET =====
    var promoData = getTodayPromoTweet();
    if (promoData) {
      try {
        var promo = promoData.tweet;
        var promoResult = promo.link
          ? await postWithLinkReply(promo.main, promo.link)
          : await postTweet(promo.main);
        lastPromoDay = promoData.day;
        posted.push({ type: "promo", tweetId: promoResult.data ? promoResult.data.id : null });
        return res.status(200).json({ message: "Promo posted", posted: posted });
      } catch (e) {
        console.log("[tweet] Promo error:", e.message);
        lastPromoDay = promoData.day;
      }
    }

    // ===== 3. POST NEWS TWEET =====
    if (!newsData.news || newsData.news.length === 0) {
      return res.status(200).json({ message: "No news", posted: 0 });
    }

    var newItems = newsData.news.filter(function(item) { return !postedTitles.has(item.title); });
    if (newItems.length === 0) {
      return res.status(200).json({ message: "All posted", posted: 0 });
    }

    var item = newItems[0];
    try {
      var tweetText = formatTweet(item, newsData.lastMatch, newsData.player);
      var linkReply = formatLinkReply(item);
      var tweetResult = await postWithLinkReply(tweetText, linkReply);
      postedTitles.add(item.title);
      posted.push({
        type: "news",
        title: item.title,
        tweetId: tweetResult.data ? tweetResult.data.id : null,
        text: tweetText,
        chars: tweetText.length
      });
    } catch (e) {
      posted.push({ title: item.title, error: e.message });
    }

    if (postedTitles.size > 100) {
      postedTitles = new Set(Array.from(postedTitles).slice(-50));
    }

    res.status(200).json({
      message: "Posted " + posted.filter(function(p) { return !p.error; }).length,
      posted: posted
    });

  } catch (error) {
    console.error("[tweet] Error:", error);
    res.status(500).json({ error: error.message });
  }
}
