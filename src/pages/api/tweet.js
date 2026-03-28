// ===== FONSECA NEWS - TWITTER BOT v4 =====
// Improved tweet formatting with result emojis, varied styles
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
      "User-Agent": "FonsecaNewsBot/1.0"
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
  // Remove source name from title (e.g., "Título da notícia - UOL" → "Título da notícia")
  if (!title) return "";
  var cleaned = title;
  if (source) {
    cleaned = cleaned.replace(" - " + source, "");
    cleaned = cleaned.replace(" | " + source, "");
    cleaned = cleaned.replace(" · " + source, "");
  }
  // Also try common patterns
  var dashIdx = cleaned.lastIndexOf(" - ");
  if (dashIdx > cleaned.length * 0.5) {
    cleaned = cleaned.substring(0, dashIdx);
  }
  return cleaned.trim();
}

function formatTweet(newsItem, lastMatch, player) {
  var title = cleanTitle(newsItem.title, newsItem.source);
  var category = newsItem.category || "Notícia";

  // Category-specific formatting
  var tweet = "";

  switch (category) {
    case "Resultado":
      // Check if it's a win or loss from the title
      var isWin = /vence|vitória|elimina|avança|classificad/i.test(title);
      var isLoss = /perde|derrota|eliminad|cai|queda/i.test(title);
      if (isWin) {
        tweet = "🟢 VITÓRIA! 🇧🇷🎾\n\n" + title;
      } else if (isLoss) {
        tweet = "🔴 " + title;
      } else {
        tweet = "🎾 " + title;
      }
      // Add last match score if available
      if (lastMatch && lastMatch.score) {
        tweet += "\n\n📊 " + lastMatch.score;
        if (lastMatch.tournament) tweet += " · " + lastMatch.tournament;
      }
      break;

    case "Ranking":
      tweet = "📊 RANKING ATP\n\n" + title;
      if (player && player.ranking) {
        tweet += "\n\n🇧🇷 João Fonseca: #" + player.ranking + " ATP";
      }
      break;

    case "Declaração":
      tweet = "🗣️ " + title;
      break;

    case "Torneio":
      tweet = "🎾 " + title;
      break;

    case "Treino":
      tweet = "💪 " + title;
      break;

    default:
      tweet = "📰 " + title;
      break;
  }

  // Add source
  if (newsItem.source) {
    tweet += "\n\n📌 " + newsItem.source;
  }

  // Add site link
  tweet += "\n🔗 fonsecanews.com.br";

  // Add hashtags
  tweet += "\n\n#JoãoFonseca #Tennis #ATP";

  // Ensure within 280 chars
  if (tweet.length > 280) {
    // Remove hashtags first
    tweet = tweet.replace("\n\n#JoãoFonseca #Tennis #ATP", "");
    tweet += "\n\n#JoãoFonseca";
  }
  if (tweet.length > 280) {
    // Truncate title
    var suffix = "\n\n📌 " + (newsItem.source || "") + "\n🔗 fonsecanews.com.br\n\n#JoãoFonseca";
    var maxTitle = 280 - suffix.length - 5;
    var headerEnd = tweet.indexOf(title);
    var header = tweet.substring(0, headerEnd);
    tweet = header + title.substring(0, maxTitle) + "..." + suffix;
  }

  return tweet;
}

// ===== DAILY POLL TWEETS =====
// Same polls as in index.jsx — keep in sync!
var DAILY_POLLS = [
  "João vence o primeiro jogo em Monte Carlo?",
  "João chega ao Top 30 até o fim de 2026?",
  "João vai ganhar um Masters 1000 na carreira?",
  "Quem terá o melhor 2026: João ou Tien?",
  "João chega às quartas em Roland Garros?",
  "João pode ser Top 10 até 2027?",
  "Quem é mais talentoso: João ou Alcaraz aos 19?",
];

var lastPollDay = "";
var lastPromoDay = "";

function getTodayPollTweet() {
  var today = new Date().toISOString().split("T")[0];
  if (lastPollDay === today) return null;

  var dayIdx = Math.floor(Date.now() / 86400000) % DAILY_POLLS.length;
  var question = DAILY_POLLS[dayIdx];

  return {
    text: "📊 ENQUETE DO DIA\n\n" + question + "\n\n🗳️ Vote agora no Fonseca News!\n🔗 fonsecanews.com.br\n\n#JoãoFonseca #Tennis #ATP",
    day: today
  };
}

// ===== PROMOTIONAL TWEETS (rotate daily) =====
var PROMO_TWEETS = [
  // Features do site
  "🎮 Já jogou Tennis Career 26?\n\nCrie seu jogador e chegue ao topo do ranking!\n\n▶️ Jogue grátis\n🔗 fonsecanews.com.br/game\n\n#JoãoFonseca #Tennis #ATP #TennisGame #Tênis",
  "📈 O João Fonseca subiu +120 posições no ranking em 1 ano!\n\nVeja a evolução completa\n\n🔗 fonsecanews.com.br\n\n#JoãoFonseca #ATP #ATPTour #Tennis #Ranking",
  "⚡ Fonseca vs Tien vs Mensik vs Fils\n\nQuem é o melhor da nova geração?\n\n🔗 fonsecanews.com.br\n\n#JoãoFonseca #NextGenATP #LearnerTien #ArthurFils #ATP #Tennis",
  "🧠 Quiz: Quanto você conhece o João Fonseca?\n\n10 perguntas, 120 pontos\n\n🔗 fonsecanews.com.br\n\n#JoãoFonseca #Tennis #Tênis #ATP #QuizTennis",
  "🗓️ Monte Carlo Masters 1000 vem aí!\n\nCountdown + calendário ATP completo\n\n🔗 fonsecanews.com.br\n\n#JoãoFonseca #MonteCarlo #RolexMCMasters #ATP #Tennis #Saibro",
  "🇧🇷 Fonseca News — Tudo sobre João Fonseca\n\n📰 Notícias\n📊 Ranking\n🎮 Jogo\n📅 Calendário\n\n🔗 fonsecanews.com.br\n\n#JoãoFonseca #TênisBrasileiro #ATP #Tennis",
  "📺 Assista o João ao vivo no TennisTV!\n\nStreaming oficial do ATP Tour\n\n🔗 fonsecanews.com.br\n\n#JoãoFonseca #TennisTV #ATPTour #Tennis #Tênis",
  "📊 Vote na enquete do dia sobre o João!\n\nNova pergunta todo dia\n\n🔗 fonsecanews.com.br\n\n#JoãoFonseca #ATP #Tennis #Enquete #Tênis",
  // Telegram / Raquetes
  "🏷️ Tem uma raquete parada em casa?\n\nAnuncie grátis no Telegram!\n\n⚠️ Fórum entre fãs, sem responsabilidade do site\n\n🔗 fonsecanews.com.br/raquetes\n\n#Tennis #Raquete #Tênis #Wilson #Babolat #Head",
  "🎾 Raquete usada com bom preço?\n\nComunidade Fonseca News no Telegram!\n\n📲 t.me/raquetesfn\n\n#Tennis #Raquete #Tênis #TennisGear #JoãoFonseca",
  // Opiniões e engajamento — polêmicas leves
  "Só eu acho que o tênis era mais lento antigamente? Hoje o jogo tá num nível absurdo de velocidade 🔥\n\n#Tennis #ATP #ATPTour #Tênis #WTA",
  "O forehand do João Fonseca é o mais bonito do circuito atualmente. Mudo de opinião? Não. 🇧🇷🎾\n\n#JoãoFonseca #ATP #Tennis #Forehand #BrazilianTennis",
  "Unpopular opinion: o NextGen Finals deveria valer pontos pro ranking. Mudaria tudo.\n\n#ATP #Tennis #NextGenATP #ATPTour #Tênis",
  "Se o João Fonseca fosse espanhol, já estaria na capa de todo jornal esportivo do mundo. O Brasil precisa valorizar mais. 🇧🇷\n\n#JoãoFonseca #TênisBrasileiro #ATP #Tennis",
  "Quem assistiu João vs Rublev no Australian Open sabe: aquele jogo mudou tudo. O mundo conheceu o Fonseca ali. 🔥\n\n#JoãoFonseca #AusOpen #AustralianOpen #ATP #Tennis",
  "Saibro ou quadra dura? Eu acho que o João vai ser devastador no saibro. Monte Carlo vai provar. 🟤\n\n#JoãoFonseca #MonteCarlo #ATP #Tennis #ClayCourtSeason",
  "Alguém mais vê semelhanças entre o jogo do João Fonseca e o do Federer? O estilo é parecido, mas com mais potência. 🤔\n\n#JoãoFonseca #Federer #RogerFederer #Tennis #ATP",
  "O tênis brasileiro não tinha um fenômeno assim desde o Guga. E o João tem só 19 anos. Imagina com 25. 🤯\n\n#JoãoFonseca #Guga #GustavoKuerten #TênisBrasileiro #ATP",
  "Hot take: João Fonseca vai ganhar Roland Garros antes dos 22 anos. Anotem. 📝\n\n#JoãoFonseca #RolandGarros #FrenchOpen #ATP #Tennis #GrandSlam",
  "Vocês preferem assistir tênis na TV ou no estádio? No estádio a velocidade da bola é surreal. 🏟️\n\n#Tennis #ATP #Tênis #ATPTour #TennisLife",
  "O João Fonseca tem 19 anos e já venceu um top 10 em Grand Slam. Com 19 anos eu mal sabia sacar. 😂\n\n#JoãoFonseca #ATP #Tennis #Tênis",
  "Discussão séria: Alcaraz, Sinner ou Fonseca — quem vai dominar o tênis em 2030? 🏆\n\n#Alcaraz #Sinner #JoãoFonseca #ATP #Tennis #NextGen",
  "O Brasil tem o melhor sub-20 do mundo e pouca gente sabe. Isso precisa mudar. 🇧🇷🎾\n\n#JoãoFonseca #TênisBrasileiro #Tennis #ATP #NextGenATP",
  "Quem vai ser o maior rival do João na carreira? Tien? Mensik? Fils? Ou alguém que ainda nem conhecemos? 🤔\n\n#JoãoFonseca #LearnerTien #NextGenATP #ATP #Tennis",
];

function getTodayPromoTweet() {
  var today = new Date().toISOString().split("T")[0];
  if (lastPromoDay === today) return null;

  var dayIdx = Math.floor(Date.now() / 86400000) % PROMO_TWEETS.length;

  return {
    text: PROMO_TWEETS[dayIdx],
    day: today
  };
}

// ===== MAIN HANDLER =====
export default async function handler(req, res) {
  // Check if within posting hours (6h-00h Brasília = 9h-3h UTC)
  var nowUTC = new Date().getUTCHours();
  var brasilia = (nowUTC - 3 + 24) % 24; // UTC-3
  if (brasilia < 6) {
    return res.status(200).json({ message: "Outside posting hours (6h-00h BRT). Current: " + brasilia + "h", posted: 0 });
  }

  // Quick auth test mode
  if (req.query.test === "1") {
    try {
      var result = await postTweet("🎾 Teste do Fonseca News Bot! fonsecanews.com.br #JoãoFonseca");
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

    // ===== 1. TRY DAILY POLL TWEET FIRST =====
    var pollTweet = getTodayPollTweet();
    if (pollTweet) {
      try {
        var pollResult = await postTweet(pollTweet.text);
        lastPollDay = pollTweet.day;
        posted.push({
          title: "ENQUETE: " + DAILY_POLLS[Math.floor(Date.now() / 86400000) % DAILY_POLLS.length],
          tweetId: pollResult.data ? pollResult.data.id : null,
          text: pollTweet.text,
          chars: pollTweet.text.length,
          type: "poll"
        });
        console.log("[tweet] Poll posted for " + pollTweet.day);
        // Return after posting poll — next cron call will post news
        return res.status(200).json({
          message: "Posted daily poll",
          posted: posted
        });
      } catch (e) {
        console.log("[tweet] Poll already posted or error:", e.message);
        lastPollDay = pollTweet.day; // Mark as attempted
      }
    }

    // ===== 2. TRY PROMOTIONAL TWEET =====
    var promoTweet = getTodayPromoTweet();
    if (promoTweet) {
      try {
        var promoResult = await postTweet(promoTweet.text);
        lastPromoDay = promoTweet.day;
        posted.push({
          title: "PROMO: " + promoTweet.text.substring(0, 50) + "...",
          tweetId: promoResult.data ? promoResult.data.id : null,
          text: promoTweet.text,
          chars: promoTweet.text.length,
          type: "promo"
        });
        console.log("[tweet] Promo posted for " + promoTweet.day);
        return res.status(200).json({
          message: "Posted promo tweet",
          posted: posted
        });
      } catch (e) {
        console.log("[tweet] Promo already posted or error:", e.message);
        lastPromoDay = promoTweet.day;
      }
    }

    // ===== 3. POST NEWS TWEET =====
    if (!newsData.news || newsData.news.length === 0) {
      return res.status(200).json({ message: "No news to post", posted: 0 });
    }

    // Filter out already posted
    var newItems = newsData.news.filter(function(item) {
      return !postedTitles.has(item.title);
    });

    if (newItems.length === 0) {
      return res.status(200).json({ message: "All news already posted", posted: 0 });
    }

    // Post 1 tweet per cron call
    var toPost = newItems.slice(0, 1);

    for (var i = 0; i < toPost.length; i++) {
      var item = toPost[i];
      try {
        var tweetText = formatTweet(item, newsData.lastMatch, newsData.player);
        var tweetResult = await postTweet(tweetText);
        postedTitles.add(item.title);
        posted.push({
          title: item.title,
          tweetId: tweetResult.data ? tweetResult.data.id : null,
          text: tweetText,
          chars: tweetText.length,
          type: "news"
        });
        console.log("[tweet] Posted successfully:", item.title.substring(0, 50));
      } catch (e) {
        posted.push({ title: item.title, error: e.message });
        console.error("[tweet] Error posting:", e.message);
        break;
      }
    }

    // Keep posted titles set manageable
    if (postedTitles.size > 100) {
      postedTitles = new Set(Array.from(postedTitles).slice(-50));
    }

    res.status(200).json({
      message: "Posted " + posted.filter(function(p) { return !p.error; }).length + " tweets",
      posted: posted
    });

  } catch (error) {
    console.error("[tweet] Handler error:", error);
    res.status(500).json({ error: error.message });
  }
}
