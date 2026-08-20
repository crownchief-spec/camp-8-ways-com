#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import matter from "gray-matter";
import { marked } from "marked";

const ROOT = path.resolve(import.meta.dirname, "..");
const DATA_PATH = path.join(ROOT, "assets", "data", "camp-stories-articles.json");
const STORIES_DIR = path.join(ROOT, "stories");
const SITE = "https://camp.8-ways.com";
const ALLOWED_CATEGORIES = ["客戶推薦分享", "森林故事", "新設施", "優惠消息"];

function option(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const explicitContentDir = option("--content-dir") || process.env.CAMP_STORIES_CONTENT_DIR;
const contentDir = explicitContentDir
  ? path.resolve(explicitContentDir)
  : path.join(ROOT, "content", "camp-stories");

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function findArticles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name.startsWith("_")) return [];
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return findArticles(full);
    return entry.isFile() && entry.name === "article.md" ? [full] : [];
  });
}

function required(data, field, file) {
  if (data[field] === undefined || data[field] === null || data[field] === "") {
    throw new Error(`${file}: 缺少 ${field}`);
  }
}

function isoDate(value, field, file) {
  const text = String(value || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) throw new Error(`${file}: ${field} 必須是 YYYY-MM-DD`);
  return text;
}

function validatePublished(data, file) {
  ["storyId", "slug", "title", "description", "publishedDate", "category", "coverImage", "coverImageAlt", "coverImageWidth", "coverImageHeight", "privacy"].forEach((field) => required(data, field, file));
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug)) throw new Error(`${file}: slug 只可使用英文小寫、數字與連字號`);
  if (!ALLOWED_CATEGORIES.includes(data.category)) throw new Error(`${file}: category 必須是 ${ALLOWED_CATEGORIES.join("、")}`);
  if (data.privacy !== "public") throw new Error(`${file}: 只有 privacy: public 的內容可發布`);
  isoDate(data.publishedDate, "publishedDate", file);
  if (data.modifiedDate) isoDate(data.modifiedDate, "modifiedDate", file);
  if (!String(data.coverImage).startsWith("/assets/")) throw new Error(`${file}: coverImage 必須使用 /assets/ 開頭的網站路徑`);
  const localImage = path.join(ROOT, String(data.coverImage).replace(/^\//, ""));
  if (!fs.existsSync(localImage)) throw new Error(`${file}: 找不到封面圖片 ${data.coverImage}`);
}

function loadArticles() {
  const ids = new Set();
  const slugs = new Set();
  const articles = [];
  for (const file of findArticles(contentDir)) {
    const source = fs.readFileSync(file, "utf8");
    const parsed = matter(source);
    const status = parsed.data.status || "draft";
    if (status !== "published") continue;
    validatePublished(parsed.data, file);
    if (ids.has(parsed.data.storyId)) throw new Error(`${file}: storyId 重複`);
    if (slugs.has(parsed.data.slug)) throw new Error(`${file}: slug 重複`);
    ids.add(parsed.data.storyId);
    slugs.add(parsed.data.slug);
    articles.push({
      ...parsed.data,
      status,
      tags: Array.isArray(parsed.data.tags) ? parsed.data.tags.map(String) : [],
      featured: Boolean(parsed.data.featured),
      readingTime: parsed.data.readingTime || `${Math.max(1, Math.ceil(parsed.content.length / 650))} 分鐘`,
      bodyHtml: marked.parse(parsed.content, { gfm: true, breaks: false }),
      sourceFile: file,
    });
  }
  return articles.sort((a, b) => b.publishedDate.localeCompare(a.publishedDate));
}

function publicItem(article) {
  return {
    storyId: article.storyId,
    slug: article.slug,
    status: article.status,
    privacy: article.privacy,
    title: article.title,
    description: article.description,
    publishedDate: article.publishedDate,
    modifiedDate: article.modifiedDate || article.publishedDate,
    category: article.category,
    tags: article.tags,
    coverImage: article.coverImage,
    coverImageAlt: article.coverImageAlt,
    coverImageWidth: Number(article.coverImageWidth),
    coverImageHeight: Number(article.coverImageHeight),
    featured: article.featured,
    readingTime: article.readingTime,
    path: `/stories/${article.slug}/`,
    url: `${SITE}/stories/${article.slug}/`,
  };
}

function articlePage(article, related) {
  const canonical = `${SITE}/stories/${article.slug}/`;
  const published = `${article.publishedDate}T09:00:00+08:00`;
  const modified = `${article.modifiedDate || article.publishedDate}T09:00:00+08:00`;
  const tags = article.tags.map((tag) => `<span class="story-card__tag">${escapeHtml(tag)}</span>`).join("");
  const relatedHtml = related.length ? `
    <section class="section section-alt" aria-labelledby="related-stories-title">
      <div class="container">
        <h2 id="related-stories-title">繼續閱讀森林故事</h2>
        <div class="story-card-grid">${related.map((item) => `
          <article class="story-card"><a class="story-card__media" href="/stories/${escapeHtml(item.slug)}/"><img src="${escapeHtml(item.coverImage)}" alt="${escapeHtml(item.coverImageAlt)}" width="${Number(item.coverImageWidth)}" height="${Number(item.coverImageHeight)}" loading="lazy" decoding="async"></a><div class="story-card__body"><div class="story-card__meta"><span>${escapeHtml(item.category)}</span><time datetime="${escapeHtml(item.publishedDate)}">${escapeHtml(item.publishedDate)}</time></div><h3><a href="/stories/${escapeHtml(item.slug)}/">${escapeHtml(item.title)}</a></h3><p>${escapeHtml(item.description)}</p></div></article>`).join("")}</div>
      </div>
    </section>` : "";
  const schema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    image: `${SITE}${article.coverImage}`,
    datePublished: published,
    dateModified: modified,
    mainEntityOfPage: canonical,
    author: { "@type": "Organization", name: "揪好森 Joyforest", url: SITE },
    publisher: { "@type": "Organization", name: "揪好森 Joyforest", url: SITE },
    articleSection: article.category,
    keywords: article.tags.join(", "),
  }).replaceAll("<", "\\u003c");

  return `<!DOCTYPE html>
<!-- generated-by: build-camp-stories -->
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" href="/favicon.ico"><meta name="theme-color" content="#2d4a3e">
  <title>${escapeHtml(article.title)}｜揪好森森林故事</title>
  <meta name="description" content="${escapeHtml(article.description)}">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="article"><meta property="og:url" content="${canonical}">
  <meta property="og:title" content="${escapeHtml(article.title)}"><meta property="og:description" content="${escapeHtml(article.description)}">
  <meta property="og:image" content="${SITE}${escapeHtml(article.coverImage)}"><meta property="og:image:width" content="${Number(article.coverImageWidth)}"><meta property="og:image:height" content="${Number(article.coverImageHeight)}"><meta property="og:image:alt" content="${escapeHtml(article.coverImageAlt)}">
  <meta property="article:published_time" content="${published}"><meta property="article:modified_time" content="${modified}">
  <meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escapeHtml(article.title)}"><meta name="twitter:description" content="${escapeHtml(article.description)}"><meta name="twitter:image" content="${SITE}${escapeHtml(article.coverImage)}">
  <script type="application/ld+json">${schema}</script>
  <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="preload" as="image" href="${escapeHtml(article.coverImage)}"><link rel="stylesheet" href="/assets/css/main.css">
</head>
<body class="site-wrap page-story-article" data-base="../../">
  <div id="site-header"></div>
  <main class="main">
    <header class="story-article-hero"><div class="container story-article-hero__inner"><nav class="story-article-breadcrumb" aria-label="麵包屑"><a href="/">首頁</a> / <a href="/pages/stories.html">森林故事</a> / ${escapeHtml(article.category)}</nav><span class="story-article-category">${escapeHtml(article.category)}</span><h1>${escapeHtml(article.title)}</h1><p class="story-article-deck">${escapeHtml(article.description)}</p><div class="story-article-meta"><time datetime="${article.publishedDate}">${article.publishedDate}</time><span>${escapeHtml(article.readingTime)}閱讀</span></div>${tags ? `<div class="story-card__tags">${tags}</div>` : ""}</div></header>
    <figure class="story-article-cover"><img src="${escapeHtml(article.coverImage)}" alt="${escapeHtml(article.coverImageAlt)}" title="${escapeHtml(article.title)}" width="${Number(article.coverImageWidth)}" height="${Number(article.coverImageHeight)}" fetchpriority="high" decoding="async"></figure>
    <article class="container story-article-content">${article.bodyHtml}</article>
    ${relatedHtml}
    <section class="cta-block"><div class="container"><h2>想親自來森林裡住一晚？</h2><div class="page-cta-row"><a href="/index.html#room-entrances" class="btn btn-secondary">看雲朵房＋熱氣球房</a><a href="/pages/availability.html" class="btn btn-outline">查看空房與價格</a></div></div></section>
  </main>
  <div id="site-footer"></div><script src="/assets/js/main.js"></script>
</body></html>`;
}

function ensureHubInSitemap(articles) {
  const sitemapPath = path.join(ROOT, "sitemap.xml");
  if (!fs.existsSync(sitemapPath)) return;
  let xml = fs.readFileSync(sitemapPath, "utf8");
  xml = xml.replace(/<url>\s*<loc>https:\/\/camp\.8-ways\.com\/stories\/[a-z0-9-]+\/<\/loc>[\s\S]*?<\/url>/g, "");
  const urls = [
    { loc: `${SITE}/pages/stories.html`, changefreq: "weekly", priority: "0.9" },
    ...articles.map((item) => ({ loc: `${SITE}/stories/${item.slug}/`, changefreq: "monthly", priority: "0.8" })),
  ];
  for (const entry of urls) {
    if (xml.includes(`<loc>${entry.loc}</loc>`)) continue;
    const node = `<url><loc>${entry.loc}</loc><changefreq>${entry.changefreq}</changefreq><priority>${entry.priority}</priority></url>`;
    xml = xml.replace("</urlset>", `${node}</urlset>`);
  }
  fs.writeFileSync(sitemapPath, xml);
}

fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
if (!fs.existsSync(contentDir) && !explicitContentDir) {
  if (!fs.existsSync(DATA_PATH)) fs.writeFileSync(DATA_PATH, JSON.stringify({ schemaVersion: 1, articles: [] }, null, 2) + "\n");
  const current = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  ensureHubInSitemap(current.articles || []);
  console.log(`森林故事來源資料夾尚未建立；保留既有 ${current.articles?.length || 0} 篇發布內容。`);
  process.exit(0);
}

if (!fs.existsSync(contentDir)) throw new Error(`找不到文章來源資料夾：${contentDir}`);
const previousArticles = fs.existsSync(DATA_PATH)
  ? JSON.parse(fs.readFileSync(DATA_PATH, "utf8")).articles || []
  : [];
const articles = loadArticles();
const publicArticles = articles.map(publicItem);
fs.writeFileSync(DATA_PATH, JSON.stringify({ schemaVersion: 1, articles: publicArticles }, null, 2) + "\n");
fs.mkdirSync(STORIES_DIR, { recursive: true });
for (const article of articles) {
  const outputDir = path.join(STORIES_DIR, article.slug);
  fs.mkdirSync(outputDir, { recursive: true });
  const related = articles.filter((item) => item.slug !== article.slug).slice(0, 3);
  fs.writeFileSync(path.join(outputDir, "index.html"), articlePage(article, related));
}
const currentSlugs = new Set(publicArticles.map((item) => item.slug));
for (const previous of previousArticles) {
  if (currentSlugs.has(previous.slug)) continue;
  const previousDir = path.join(STORIES_DIR, previous.slug);
  const previousPage = path.join(previousDir, "index.html");
  if (fs.existsSync(previousPage) && fs.readFileSync(previousPage, "utf8").includes("generated-by: build-camp-stories")) {
    fs.rmSync(previousDir, { recursive: true });
  }
}
ensureHubInSitemap(publicArticles);
console.log(`森林故事建置完成：${articles.length} 篇，來源 ${contentDir}`);
