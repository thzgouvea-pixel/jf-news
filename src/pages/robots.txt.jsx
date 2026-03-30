// src/pages/robots.txt.jsx
// Robots.txt for search engine crawlers

export async function getServerSideProps({ res }) {
  var robots = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /api/",
    "",
    "Sitemap: https://fonsecanews.com.br/sitemap.xml",
  ].join("\n");

  res.setHeader("Content-Type", "text/plain");
  res.setHeader("Cache-Control", "public, s-maxage=86400");
  res.write(robots);
  res.end();
  return { props: {} };
}

export default function Robots() {
  return null;
}
