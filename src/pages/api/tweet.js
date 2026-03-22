// ===== FONSECA NEWS - TWITTER BOT =====
// Posts new news to @FonsecaNews on X/Twitter
// Trigger: GET /api/tweet (can be called by Vercel Cron)

import crypto from "crypto";

// Track already posted news (in-memory, resets on deploy)
let postedTitles = new Set();

function generateOAuthSignature(method, url, params, consumerSecret, tokenSecret) {
  const sortedParams = Object.keys(params).sort().map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`).join("&");
  const baseString = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(sortedParams)}`;
  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;
  return crypto.createHmac("sha1", signingKey).update(baseString).digest("base64");
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
  const oauthParams = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: accessToken,
    oauth_version: "1.0",
  };

  const signature = generateOAuthSignature("POST", url, oauthParams, consumerSecret, accessTokenSecret);
  oauthParams.oauth_signature = signature;

  const authHeader = "OAuth " + Object.keys(oauthParams).sort().map(k => `${encodeURIComponent(k)}="${encodeURIComponent(oauthParams[k])}"`).join(", ");

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": authHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("Twitter API error:", JSON.stringify(data));
    throw new Error(`Twitter error: ${res.status} - ${JSON.stringify(data)}`);
  }
  return data;
}

function formatTweet(newsItem) {
  // Category emoji
  const catEmoji = {
    "Resultado": "🏆",
    "Ranking": "📊",
    "Declaração": "🗣️",
    "Torneio": "🎾",
    "Treino": "💪",
    "Notícia": "📰",
  };
  const emoji = catEmoji[newsItem.category] || "🎾";
  
  // Clean title - remove source suffix if present (e.g. " - CNN Brasil")
  let title = newsItem.title;
  const dashIdx = title.lastIndexOf(" - ");
  if (dashIdx > 0) title = title.substring(0, dashIdx);
  
  // Build tweet
  const source = newsItem.source ? `\n\n📰 ${newsItem.source}` : "";
  const link = "\n\n🔗 fonsecanews.com.br";
  const hashtags = "\n\n#JoãoFonseca #Tênis #ATP";
  
  let tweet = `${emoji} ${title}${source}${link}${hashtags}`;
  
  // Twitter limit is 280 chars
  if (tweet.length > 280) {
    // Shorten by removing hashtags first
    tweet = `${emoji} ${title}${source}${link}`;
    if (tweet.length > 280) {
      // Shorten title
      const maxTitle = 280 - source.length - link.length - emoji.length - 5;
      title = title.substring(0, maxTitle) + "...";
      tweet = `${emoji} ${title}${source}${link}`;
    }
  }
  
  return tweet;
}

export default async function handler(req, res) {
  // Security: only allow GET with a secret or from Vercel Cron
  const cronSecret = req.headers["authorization"];
  const isVercelCron = cronSecret === `Bearer ${process.env.CRON_SECRET}`;
  const hasSecret = req.query.secret === process.env.CRON_SECRET;
  
  // For testing, also allow without secret (remove in production)
  // if (!isVercelCron && !hasSecret) {
  //   return res.status(401).json({ error: "Unauthorized" });
  // }

  try {
    // Fetch current news from our own API
    const protocol = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers.host;
    const newsRes = await fetch(`${protocol}://${host}/api/news`);
    if (!newsRes.ok) throw new Error("Failed to fetch news");
    const newsData = await newsRes.json();

    if (!newsData.news || newsData.news.length === 0) {
      return res.status(200).json({ message: "No news to post", posted: 0 });
    }

    // Find news that hasn't been posted yet
    const newItems = newsData.news.filter(item => !postedTitles.has(item.title));

    if (newItems.length === 0) {
      return res.status(200).json({ message: "All news already posted", posted: 0 });
    }

    // Post only the most recent unposted news (max 3 per run to avoid spam)
    const toPost = newItems.slice(0, 3);
    const posted = [];

    for (const item of toPost) {
      try {
        const tweetText = formatTweet(item);
        const result = await postTweet(tweetText);
        postedTitles.add(item.title);
        posted.push({ title: item.title, tweetId: result.data?.id });
        
        // Wait 2 seconds between tweets to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        console.error("Failed to post tweet:", e.message);
        posted.push({ title: item.title, error: e.message });
      }
    }

    // Keep postedTitles manageable (max 100)
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
