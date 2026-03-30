// ===== FONSECA NEWS - TWITTER BOT v5 =====
// More organic voice, promotes new features, larger tweet pool
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

async function postTweet(text) {
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

  var res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": authHeader,
      "Content-Type": "application/json",
      "User-Agent": "FonsecaNewsBot/2.0"
    },
    body: JSON.stringify({ text: text })
  });

  var raw = await res.text();
  console.log("[tweet] Status:", res.status, "Body:", raw.substring(0, 300));

  if (!res.ok) {
    throw new Error("Twitter error: " + res.status + " - " + raw.substring(0, 300));
  }

  return JSON.parse(raw);
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

// Multiple format templates per category for variety
var NEWS_TEMPLATES = {
  "Resultado": {
    win: [
      "VAMOS! {title} \u{1F1E7}\u{1F1F7}\u{1F3BE}\n\n{score}\n\nfonsecanews.com.br\n#Jo\u00e3oFonseca #ATP",
      "JOGOU DEMAIS! {title} \u{1F525}\n\n{score}\n\nfonsecanews.com.br\n#Jo\u00e3oFonseca #Tennis",
      "Mais uma do Jo\u00e3o! \u{1F1E7}\u{1F1F7}\n\n{title}\n\n{score}\n\nfonsecanews.com.br\n#Jo\u00e3oFonseca #ATP",
    ],
    loss: [
      "N\u00e3o foi dessa vez, mas o Jo\u00e3o segue evoluindo \u{1F4AA}\n\n{title}\n\n{score}\n\nfonsecanews.com.br\n#Jo\u00e3oFonseca #ATP",
      "Derrota faz parte do processo. Pr\u00f3ximo torneio vem a\u00ed \u{1F3BE}\n\n{title}\n\nfonsecanews.com.br\n#Jo\u00e3oFonseca",
      "Dia dif\u00edcil, mas a temporada \u00e9 longa. Bora, Jo\u00e3o! \u{1F1E7}\u{1F1F7}\n\n{title}\n\nfonsecanews.com.br\n#Jo\u00e3oFonseca #ATP",
    ],
    neutral: [
      "\u{1F3BE} {title}\n\nSaiba mais:\nfonsecanews.com.br\n#Jo\u00e3oFonseca #ATP",
    ]
  },
  "Ranking": [
    "\u{1F4CA} Atualiza\u00e7\u00e3o no ranking!\n\n{title}\n\n\u{1F1E7}\u{1F1F7} Jo\u00e3o Fonseca: #{ranking} ATP\n\nfonsecanews.com.br\n#Jo\u00e3oFonseca #ATP #Ranking",
    "Ranking atualizado \u{1F4C8}\n\n{title}\n\nfonsecanews.com.br\n#Jo\u00e3oFonseca #ATP",
  ],
  "Declara\u00e7\u00e3o": [
    "\u{1F5E3}\uFE0F {title}\n\nfonsecanews.com.br\n#Jo\u00e3oFonseca #Tennis",
    "\"{title}\"\n\nfonsecanews.com.br\n#Jo\u00e3oFonseca #ATP",
    "Olha o que falaram do Jo\u00e3o \u{1F440}\n\n{title}\n\nfonsecanews.com.br\n#Jo\u00e3oFonseca",
  ],
  "Torneio": [
    "\u{1F3BE} {title}\n\nAcompanhe ao vivo:\nfonsecanews.com.br\n#Jo\u00e3oFonseca #ATP",
    "{title}\n\nCountdown e palpite no site \u{1F525}\nfonsecanews.com.br\n#Jo\u00e3oFonseca #Tennis",
  ],
  "default": [
    "\u{1F4F0} {title}\n\nfonsecanews.com.br\n#Jo\u00e3oFonseca #Tennis",
    "{title}\n\nLeia mais:\nfonsecanews.com.br\n#Jo\u00e3oFonseca #ATP",
    "\u{1F1E7}\u{1F1F7} {title}\n\nfonsecanews.com.br\n#Jo\u00e3oFonseca",
  ]
};

function formatTweet(newsItem, lastMatch, player) {
  var title = cleanTitle(newsItem.title, newsItem.source);
  var category = newsItem.category || "default";
  var templates;
  var score = "";

  if (lastMatch && lastMatch.score) {
    score = lastMatch.score;
    if (lastMatch.tournament) score += " \u00B7 " + lastMatch.tournament;
  }

  if (category === "Resultado") {
    var isWin = /vence|vit\u00f3ria|elimina|avan\u00e7a|classificad/i.test(title);
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
    .replace(/\{ranking\}/g, player ? player.ranking : "??");

  // Clean empty lines from missing score
  tweet = tweet.replace(/\n\n\n/g, "\n\n").replace(/\n\n$/g, "");

  if (tweet.length > 280) {
    var suffix = "\n\nfonsecanews.com.br\n#Jo\u00e3oFonseca";
    var maxTitle = 280 - suffix.length - 10;
    tweet = title.substring(0, maxTitle) + "..." + suffix;
  }

  return tweet;
}

// ===== PROMOTIONAL TWEETS — 24 tweets, voice of a passionate fan =====
var PROMO_TWEETS = [
  // === Site features ===
  "Voc\u00ea j\u00e1 deu seu palpite pro pr\u00f3ximo jogo do Jo\u00e3o? \u{1F52E}\n\nEscolhe o placar e depois compartilha pra ver se acertou!\n\nfonsecanews.com.br\n#Jo\u00e3oFonseca #ATP #Tennis",

  "Fiz 95 pontos no Quiz do Fonseca News e achei que manjava de t\u00eanis \u{1F602}\n\nTenta a\u00ed superar:\nfonsecanews.com.br\n#Jo\u00e3oFonseca #Quiz #Tennis",

  "Monte Carlo come\u00e7a em poucos dias e o countdown t\u00e1 correndo no site \u{23F3}\u{1F525}\n\nPalpite + not\u00edcias + quiz:\nfonsecanews.com.br\n#Jo\u00e3oFonseca #MonteCarlo #ATP",

  "Novo no t\u00eanis? A gente fez um guia completo com todas as regras pra voc\u00ea acompanhar o Jo\u00e3o sem se perder \u{1F3BE}\n\nfonsecanews.com.br/regras\n#Tennis #Regras #Jo\u00e3oFonseca",

  "Tem raquete parada em casa? Anuncia gr\u00e1tis na comunidade do FN no Telegram \u{1F3F7}\uFE0F\n\nfonsecanews.com.br/raquetes\n#Tennis #Raquete #T\u00eanis",

  "A enquete de hoje t\u00e1 pol\u00eamica \u{1F525}\n\nVota l\u00e1 e v\u00ea o que a comunidade acha:\nfonsecanews.com.br\n#Jo\u00e3oFonseca #ATP #Tennis",

  "O Fonseca News \u00e9 o \u00fanico site brasileiro 100% dedicado ao Jo\u00e3o Fonseca \u{1F1E7}\u{1F1F7}\n\nNot\u00edcias, ranking, quiz, palpite, enquete... tudo num lugar s\u00f3\n\nfonsecanews.com.br\n#Jo\u00e3oFonseca #ATP",

  "Esse quiz do Fonseca News \u00e9 viciante, n\u00e3o vou mentir \u{1F3BE}\n\n10 perguntas com fun facts que voc\u00ea n\u00e3o sabia\n\nfonsecanews.com.br\n#Jo\u00e3oFonseca #Quiz #Tennis",

  // === Opinions & engagement ===
  "O forehand do Jo\u00e3o Fonseca \u00e9 o mais bonito do circuito atualmente. Mudo de opini\u00e3o? N\u00e3o. \u{1F1E7}\u{1F1F7}\u{1F3BE}\n\n#Jo\u00e3oFonseca #ATP #Tennis #Forehand",

  "Se o Jo\u00e3o fosse espanhol, j\u00e1 estaria na capa de todo jornal esportivo do mundo. O Brasil precisa valorizar mais \u{1F1E7}\u{1F1F7}\n\n#Jo\u00e3oFonseca #T\u00eanisBrasileiro #ATP",

  "Quem assistiu Jo\u00e3o vs Rublev no Australian Open sabe: aquele jogo mudou tudo. O mundo conheceu o Fonseca ali \u{1F525}\n\n#Jo\u00e3oFonseca #AusOpen #ATP",

  "O t\u00eanis brasileiro n\u00e3o tinha um fen\u00f4meno assim desde o Guga. E o Jo\u00e3o tem s\u00f3 19 anos. Imagina com 25 \u{1F92F}\n\n#Jo\u00e3oFonseca #Guga #T\u00eanisBrasileiro #ATP",

  "Hot take: Jo\u00e3o Fonseca vai ganhar Roland Garros antes dos 22 anos. Anotem \u{1F4DD}\n\n#Jo\u00e3oFonseca #RolandGarros #ATP #GrandSlam",

  "O Jo\u00e3o tem 19 anos e j\u00e1 venceu um top 10 em Grand Slam. Com 19 anos eu mal sabia sacar \u{1F602}\n\n#Jo\u00e3oFonseca #ATP #Tennis",

  "Discuss\u00e3o s\u00e9ria: Alcaraz, Sinner ou Fonseca \u2014 quem vai dominar o t\u00eanis em 2030? \u{1F3C6}\n\n#Alcaraz #Sinner #Jo\u00e3oFonseca #ATP #NextGen",

  "Saibro ou quadra dura? Acho que o Jo\u00e3o vai ser devastador no saibro. Monte Carlo vai provar \u{1F7E4}\n\n#Jo\u00e3oFonseca #MonteCarlo #ATP #ClayCourtSeason",

  "O Brasil tem o melhor sub-20 do mundo e pouca gente sabe. Isso precisa mudar \u{1F1E7}\u{1F1F7}\u{1F3BE}\n\n#Jo\u00e3oFonseca #T\u00eanisBrasileiro #ATP #NextGen",

  "Quem vai ser o maior rival do Jo\u00e3o na carreira? Tien? Mensik? Fils? Eu aposto no Tien \u{1F914}\n\n#Jo\u00e3oFonseca #LearnerTien #NextGen #ATP",

  "Voc\u00eas preferem assistir t\u00eanis na TV ou no est\u00e1dio? No est\u00e1dio a velocidade da bola \u00e9 surreal \u{1F3DF}\uFE0F\n\n#Tennis #ATP #T\u00eanis",

  "Unpopular opinion: o NextGen Finals deveria valer pontos pro ranking. Mudaria tudo \u{1F914}\n\n#ATP #NextGenATP #Tennis",

  "Algu\u00e9m mais v\u00ea semelhan\u00e7as entre o jogo do Jo\u00e3o e o do Federer? O estilo \u00e9 parecido, mas com mais pot\u00eancia \u{1F440}\n\n#Jo\u00e3oFonseca #Federer #Tennis #ATP",

  "Acordei pensando em t\u00eanis. De novo. Culpa do Jo\u00e3o \u{1F602}\u{1F3BE}\n\n#Jo\u00e3oFonseca #Tennis #ATP",

  "Ser\u00e1 que a gente vai ver o Jo\u00e3o nas Olimp\u00edadas de 2028 em LA? Eu j\u00e1 estou contando os dias \u{1F1E7}\u{1F1F7}\u{1F3C5}\n\n#Jo\u00e3oFonseca #Olympics #LA2028 #Tennis",

  "J\u00e1 votou na enquete de hoje? A comunidade t\u00e1 dividida \u{1F525}\n\nfonsecanews.com.br\n#Jo\u00e3oFonseca #ATP #Tennis",
];

var lastPollDay = "";
var lastPromoDay = "";

// ===== DAILY POLL TWEETS =====
var DAILY_POLLS = [
  "Jo\u00e3o vence o primeiro jogo em Monte Carlo?",
  "Jo\u00e3o chega ao Top 30 at\u00e9 o fim de 2026?",
  "Jo\u00e3o vai ganhar um Masters 1000 na carreira?",
  "Quem ter\u00e1 o melhor 2026: Jo\u00e3o ou Tien?",
  "Jo\u00e3o chega \u00e0s quartas em Roland Garros?",
  "Jo\u00e3o pode ser Top 10 at\u00e9 2027?",
  "Quem \u00e9 mais talentoso: Jo\u00e3o ou Alcaraz aos 19?",
];

function getTodayPollTweet() {
  var today = new Date().toISOString().split("T")[0];
  if (lastPollDay === today) return null;
  var dayIdx = Math.floor(Date.now() / 86400000) % DAILY_POLLS.length;
  var question = DAILY_POLLS[dayIdx];
  return {
    text: "\u{1F4CA} ENQUETE DO DIA\n\n" + question + "\n\n\u{1F5F3}\uFE0F Vote agora:\nfonsecanews.com.br\n\n#Jo\u00e3oFonseca #Tennis #ATP",
    day: today
  };
}

function getTodayPromoTweet() {
  var today = new Date().toISOString().split("T")[0];
  if (lastPromoDay === today) return null;
  var dayIdx = Math.floor(Date.now() / 86400000) % PROMO_TWEETS.length;
  return { text: PROMO_TWEETS[dayIdx], day: today };
}

// ===== MAIN HANDLER =====
export default async function handler(req, res) {
  // Check if within posting hours (6h-00h Bras\u00edlia = 9h-3h UTC)
  var nowUTC = new Date().getUTCHours();
  var brasilia = (nowUTC - 3 + 24) % 24;
  if (brasilia < 6) {
    return res.status(200).json({ message: "Outside posting hours (6h-00h BRT). Current: " + brasilia + "h", posted: 0 });
  }

  // Quick auth test mode
  if (req.query.test === "1") {
    try {
      var result = await postTweet("\u{1F3BE} Teste do Fonseca News Bot! fonsecanews.com.br #Jo\u00e3oFonseca");
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
        var pollResult = await postTweet(pollTweet.text);
        lastPollDay = pollTweet.day;
        posted.push({ title: "POLL", tweetId: pollResult.data ? pollResult.data.id : null, type: "poll" });
        return res.status(200).json({ message: "Posted daily poll", posted: posted });
      } catch (e) {
        console.log("[tweet] Poll error:", e.message);
        lastPollDay = pollTweet.day;
      }
    }

    // ===== 2. TRY PROMOTIONAL TWEET =====
    var promoTweet = getTodayPromoTweet();
    if (promoTweet) {
      try {
        var promoResult = await postTweet(promoTweet.text);
        lastPromoDay = promoTweet.day;
        posted.push({ title: "PROMO", tweetId: promoResult.data ? promoResult.data.id : null, type: "promo" });
        return res.status(200).json({ message: "Posted promo tweet", posted: posted });
      } catch (e) {
        console.log("[tweet] Promo error:", e.message);
        lastPromoDay = promoTweet.day;
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
      var tweetResult = await postTweet(tweetText);
      postedTitles.add(item.title);
      posted.push({ title: item.title, tweetId: tweetResult.data ? tweetResult.data.id : null, text: tweetText, type: "news" });
    } catch (e) {
      posted.push({ title: item.title, error: e.message });
    }

    if (postedTitles.size > 100) {
      postedTitles = new Set(Array.from(postedTitles).slice(-50));
    }

    res.status(200).json({ message: "Posted " + posted.filter(function(p) { return !p.error; }).length, posted: posted });

  } catch (error) {
    console.error("[tweet] Error:", error);
    res.status(500).json({ error: error.message });
  }
}
