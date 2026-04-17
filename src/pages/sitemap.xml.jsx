// src/pages/sitemap.xml.jsx
// Dynamic sitemap generation for Google indexing
var SITE = "https://fonsecanews.com.br";
function generateSitemap() {
  var pages = [
    var pages = [
    { url: SITE, changefreq: "hourly", priority: "1.0" },
    { url: SITE + "/biografia", changefreq: "monthly", priority: "0.9" },
    { url: SITE + "/regras", changefreq: "monthly", priority: "0.8" },
    { url: SITE + "/raquetes", changefreq: "weekly", priority: "0.7" },
    { url: SITE + "/game", changefreq: "monthly", priority: "0.6" },
    { url: SITE + "/sobre", changefreq: "monthly", priority: "0.5" },
  ];
  var xml = '<?xml version="1.0" encoding="UTF-8"?>';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
  pages.forEach(function(page) {
    xml += "<url>";
    xml += "<loc>" + page.url + "</loc>";
    xml += "<lastmod>" + new Date().toISOString().split("T")[0] + "</lastmod>";
    xml += "<changefreq>" + page.changefreq + "</changefreq>";
    xml += "<priority>" + page.priority + "</priority>";
    xml += "</url>";
  });
  xml += "</urlset>";
  return xml;
}
export async function getServerSideProps({ res }) {
  var sitemap = generateSitemap();
  res.setHeader("Content-Type", "text/xml");
  res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate");
  res.write(sitemap);
  res.end();
  return { props: {} };
}
export default function Sitemap() {
  return null;
}
