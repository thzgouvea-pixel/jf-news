import { kv } from "@vercel/kv";
import { getCurrentMode, shouldRunKey, touchKey, writeJson } from "../../../lib/jobs/coreMatchShared";

function normalizeNewsItem(item) {
  return {
    title: item.title || item.name || "",
    summary: item.summary || item.description || item.snippet || "",
    source: item.source || item.publisher || "Notícia",
    url: item.url || item.link || "",
    image: item.image || item.thumbnail || item.imageUrl || null,
    date: item.date || item.pubDate || item.publishedAt || new Date().toISOString(),
    category: item.category || "Notícia",
  };
}

async function fetchFromGoogleNews(log) {
  const rssUrl = "https://news.google.com/rss/search?q=%22Jo%C3%A3o%20Fonseca%22%20when:7d&hl=pt-BR&gl=BR&ceid=BR:pt-419";
  try {
    const res = await fetch(rssUrl, {
      headers: { "User-Agent": "FonsecaNews/10.0" },
    });
    if (!res.ok) {
      log.push(`googleNews: HTTP ${res.status}`);
      return [];
    }

    const xml = await res.text();
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 20);
    const news = items.map((match) => {
      const block = match[1];
      const get = (tag) => {
        const found = block.match(new RegExp(`<${tag}>([\\s\\S]*?)<\/${tag}>`, "i"));
        return found ? found[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim() : "";
      };
      const rawTitle = get("title");
      const title = rawTitle.replace(/\s+-\s+[^-]+$/, "").trim();
      const source = (rawTitle.match(/-\s+([^-]+)$/) || [])[1] || "Google News";
      return normalizeNewsItem({
        title,
        source,
        url: get("link"),
        date: get("pubDate"),
        summary: get("description").replace(/<[^>]+>/g, "").trim(),
        category: "Notícia",
      });
    }).filter((item) => item.title);

    log.push(`googleNews: ${news.length} items`);
    return news;
  } catch (error) {
    log.push(`googleNews: ${error.message}`);
    return [];
  }
}

async function fetchFromNewsDataApi(log) {
  const apiKey = process.env.NEWSDATA_API_KEY;
  if (!apiKey) {
    log.push("newsDataApi: missing key");
    return [];
  }

  try {
    const url = `https://newsdata.io/api/1/news?apikey=${apiKey}&q=${encodeURIComponent('"João Fonseca"')}&language=pt,en`;
    const res = await fetch(url, {
      headers: { "User-Agent": "FonsecaNews/10.0" },
    });
    if (!res.ok) {
      log.push(`newsDataApi: HTTP ${res.status}`);
      return [];
    }

    const data = await res.json();
    const results = Array.isArray(data?.results) ? data.results.slice(0, 20) : [];
    const news = results.map((item) => normalizeNewsItem({
      title: item.title,
      summary: item.description,
      source: item.source_id || item.source_name || "NewsData",
      url: item.link,
      image: item.image_url,
      date: item.pubDate,
      category: "Notícia",
    })).filter((item) => item.title);

    log.push(`newsDataApi: ${news.length} items`);
    return news;
  } catch (error) {
    log.push(`newsDataApi: ${error.message}`);
    return [];
  }
}

function dedupeNews(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.title}`.toLowerCase().replace(/[^a-z0-9à-ÿ]+/gi, "_");
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default async function handler(req, res) {
  try {
    const modeState = await getCurrentMode();
    const forced = req.query.force === "1" || req.headers["x-force-refresh"] === "1";
    const ttl = modeState.policy.newsTtl;
    const allowed = forced || await shouldRunKey("fn:job:newsRefresh:lastRun", ttl);

    if (!allowed) {
      return res.status(200).json({
        ok: true,
        skipped: true,
        mode: modeState.mode,
        ttl,
        reason: "mode-aware throttle",
      });
    }

    const log = [];
    const [googleNews, newsData] = await Promise.all([
      fetchFromGoogleNews(log),
      fetchFromNewsDataApi(log),
    ]);

    const merged = dedupeNews([...googleNews, ...newsData])
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 20)
      .map((item) => ({ ...item, updatedAt: new Date().toISOString() }));

    await writeJson("fn:news", merged, ttl);
    await touchKey("fn:job:newsRefresh:lastRun");

    return res.status(200).json({
      ok: true,
      skipped: false,
      mode: modeState.mode,
      ttl,
      count: merged.length,
      log,
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
}
