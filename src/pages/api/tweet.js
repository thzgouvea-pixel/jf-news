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

// ===== MAIN HANDLER =====
export default async function handler(req, res) {
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
    var posted = [];

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
          chars: tweetText.length
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
