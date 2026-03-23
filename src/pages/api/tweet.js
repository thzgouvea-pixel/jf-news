// ===== FONSECA NEWS - TWITTER BOT v3 =====
// Uses X API v1.1 statuses/update endpoint

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
  const ck = process.env.TWITTER_CONSUMER_KEY;
  const cs = process.env.TWITTER_CONSUMER_SECRET;
  const at = process.env.TWITTER_ACCESS_TOKEN;
  const ats = process.env.TWITTER_ACCESS_TOKEN_SECRET;
  if (!ck || !cs || !at || !ats) throw new Error("Missing Twitter credentials");

  const url = "https://api.x.com/2/tweets";
  const ts = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomBytes(16).toString("hex");

  // All OAuth params
  const oauthData = {
    oauth_consumer_key: ck,
    oauth_nonce: nonce,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: ts,
    oauth_token: at,
    oauth_version: "1.0"
  };

  // Create signature base string - for JSON body POST, only include oauth params
  const sortedParams = Object.keys(oauthData).sort();
  const paramPairs = sortedParams.map(k => percentEncode(k) + "=" + percentEncode(oauthData[k]));
  const paramString = paramPairs.join("&");
  const baseString = "POST" + "&" + percentEncode(url) + "&" + percentEncode(paramString);
  const signingKey = percentEncode(cs) + "&" + percentEncode(ats);
  
  const sig = crypto.createHmac("sha1", signingKey).update(baseString).digest("base64");
  
  // Build header
  const headerParams = { ...oauthData, oauth_signature: sig };
  const headerParts = Object.keys(headerParams).sort().map(k => 
    percentEncode(k) + '="' + percentEncode(headerParams[k]) + '"'
  );
  const authHeader = "OAuth " + headerParts.join(", ");

  console.log("URL:", url);
  console.log("Auth header length:", authHeader.length);
  console.log("Body:", JSON.stringify({ text }));

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": authHeader,
      "Content-Type": "application/json",
      "User-Agent": "FonsecaNewsBot/1.0"
    },
    body: JSON.stringify({ text })
  });

  const raw = await res.text();
  console.log("Response status:", res.status);
  console.log("Response body:", raw.substring(0, 500));

  if (!res.ok) {
    throw new Error(`Twitter error: ${res.status} - ${raw.substring(0, 300)}`);
  }

  return JSON.parse(raw);
}

function formatTweet(newsItem) {
  const catEmoji = {
    "Resultado": "🏆", "Ranking": "📊", "Declaração": "🗣️",
    "Torneio": "🎾", "Treino": "💪", "Notícia": "📰"
  };
  const emoji = catEmoji[newsItem.category] || "🎾";
  let title = newsItem.title;
  const dashIdx = title.lastIndexOf(" - ");
  if (dashIdx > 0) title = title.substring(0, dashIdx);
  const source = newsItem.source ? `\n\n📰 ${newsItem.source}` : "";
  const link = "\n\n🔗 fonsecanews.com.br";
  const hashtags = "\n\n#JoãoFonseca #ATP";
  let tweet = `${emoji} ${title}${source}${link}${hashtags}`;
  if (tweet.length > 280) {
    tweet = `${emoji} ${title}${source}${link}`;
  }
  if (tweet.length > 280) {
    const max = 280 - source.length - link.length - 4;
    tweet = `${emoji} ${title.substring(0, max)}...${source}${link}`;
  }
  return tweet;
}

export default async function handler(req, res) {
  // Quick auth test mode
  if (req.query.test === "1") {
    try {
      const result = await postTweet("🎾 Teste do Fonseca News Bot! fonsecanews.com.br");
      return res.status(200).json({ success: true, result });
    } catch (e) {
      return res.status(200).json({ success: false, error: e.message });
    }
  }

  try {
    const protocol = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers.host;
    const newsRes = await fetch(`${protocol}://${host}/api/news`);
    if (!newsRes.ok) throw new Error("Failed to fetch news");
    const newsData = await newsRes.json();
    if (!newsData.news || newsData.news.length === 0) {
      return res.status(200).json({ message: "No news to post", posted: 0 });
    }
    const newItems = newsData.news.filter(item => !postedTitles.has(item.title));
    if (newItems.length === 0) {
      return res.status(200).json({ message: "All news already posted", posted: 0 });
    }
    const toPost = newItems.slice(0, 1); // Post only 1 at a time for testing
    const posted = [];
    for (const item of toPost) {
      try {
        const tweetText = formatTweet(item);
        const result = await postTweet(tweetText);
        postedTitles.add(item.title);
        posted.push({ title: item.title, tweetId: result.data?.id, text: tweetText });
      } catch (e) {
        posted.push({ title: item.title, error: e.message });
        break;
      }
    }
    if (postedTitles.size > 100) postedTitles = new Set(Array.from(postedTitles).slice(-50));
    res.status(200).json({ message: `Posted ${posted.filter(p => !p.error).length} tweets`, posted });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
