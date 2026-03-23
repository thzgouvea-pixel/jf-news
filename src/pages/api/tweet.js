// ===== FONSECA NEWS - TWITTER BOT v2 =====
// Posts new news to @FonsecaNews on X/Twitter

import crypto from "crypto";

let postedTitles = new Set();

function percentEncode(str) {
  return encodeURIComponent(str).replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

function generateNonce() {
  return crypto.randomBytes(32).toString("hex");
}

async function postTweet(text) {
  const consumerKey = process.env.TWITTER_CONSUMER_KEY;
  const consumerSecret = process.env.TWITTER_CONSUMER_SECRET;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN;
  const accessTokenSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET;

  if (!consumerKey || !consumerSecret || !accessToken || !accessTokenSecret) {
    throw new Error("Twitter credentials not configured");
  }

  const url = "https://api.x.com/2/tweets";
  const method = "POST";
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = generateNonce();

  // OAuth parameters
  const oauthParams = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: nonce,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: timestamp,
    oauth_token: accessToken,
    oauth_version: "1.0",
  };

  // For POST with JSON body, only oauth params go into signature base string
  const paramString = Object.keys(oauthParams)
    .sort()
    .map(k => `${percentEncode(k)}=${percentEncode(oauthParams[k])}`)
    .join("&");

  const signatureBaseString = [
    method.toUpperCase(),
    percentEncode(url),
    percentEncode(paramString)
  ].join("&");

  const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(accessTokenSecret)}`;
  const signature = crypto.createHmac("sha1", signingKey).update(signatureBaseString).digest("base64");

  // Build Authorization header
  const authParams = { ...oauthParams, oauth_signature: signature };
  const authHeader = "OAuth " + Object.keys(authParams)
    .sort()
    .map(k => `${percentEncode(k)}="${percentEncode(authParams[k])}"`)
    .join(", ");

  const body = JSON.stringify({ text });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": authHeader,
      "Content-Type": "application/json",
    },
    body: body,
  });

  const responseText = await res.text();
  let data;
  try { data = JSON.parse(responseText); } catch { data = { raw: responseText }; }

  if (!res.ok) {
    console.error("Twitter API error:", res.status, responseText);
    throw new Error(`Twitter error: ${res.status} - ${responseText.substring(0, 200)}`);
  }
  return data;
}

function formatTweet(newsItem) {
  const catEmoji = {
    "Resultado": "🏆",
    "Ranking": "📊",
    "Declaração": "🗣️",
    "Torneio": "🎾",
    "Treino": "💪",
    "Notícia": "📰",
  };
  const emoji = catEmoji[newsItem.category] || "🎾";

  let title = newsItem.title;
  const dashIdx = title.lastIndexOf(" - ");
  if (dashIdx > 0) title = title.substring(0, dashIdx);

  const source = newsItem.source ? `\n\n📰 ${newsItem.source}` : "";
  const link = "\n\n🔗 fonsecanews.com.br";
  const hashtags = "\n\n#JoãoFonseca #Tênis #ATP";

  let tweet = `${emoji} ${title}${source}${link}${hashtags}`;

  if (tweet.length > 280) {
    tweet = `${emoji} ${title}${source}${link}`;
    if (tweet.length > 280) {
      const maxTitle = 280 - source.length - link.length - emoji.length - 5;
      title = title.substring(0, maxTitle) + "...";
      tweet = `${emoji} ${title}${source}${link}`;
    }
  }

  return tweet;
}

export default async function handler(req, res) {
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

    const toPost = newItems.slice(0, 3);
    const posted = [];

    for (const item of toPost) {
      try {
        const tweetText = formatTweet(item);
        const result = await postTweet(tweetText);
        postedTitles.add(item.title);
        posted.push({ title: item.title, tweetId: result.data?.id, text: tweetText });
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        console.error("Failed to post tweet:", e.message);
        posted.push({ title: item.title, error: e.message });
        break; // Stop on first error to avoid wasting credits
      }
    }

    if (postedTitles.size > 100) {
      const arr = Array.from(postedTitles);
      postedTitles = new Set(arr.slice(-50));
    }

    res.status(200).json({ message: `Posted ${posted.filter(p => !p.error).length} tweets`, posted });

  } catch (error) {
    console.error("Tweet handler error:", error);
    res.status(500).json({ error: error.message });
  }
}
