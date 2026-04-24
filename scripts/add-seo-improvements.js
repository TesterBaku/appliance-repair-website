/**
 * Step 3 SEO improvements — applied to all article-*.html files:
 *
 * 1. BreadcrumbList schema (all articles)
 * 2. Article schema (old articles that are missing it)
 * 3. og:url, article:published_time, article:modified_time meta tags
 * 4. width + height attributes on hero <img>
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BASE_URL = 'https://universalappliancesrepair.com';

// Old articles that predate the SEO workflow — need full Article schema added
const OLD_ARTICLE_DATES = {
  'article-dorm-appliances.html':       '2025-04-02',
  'article-mini-fridge.html':           '2025-03-30',
  'article-repair-replace.html':        '2025-03-05',
  'article-fridge-maintenance.html':    '2025-03-15',
};

function extractTitle(html) {
  const m = html.match(/<title>([^<]+)<\/title>/);
  return m ? m[1].trim() : '';
}

function extractH1(html) {
  // Match full H1 content including inline tags, then strip all HTML
  const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  if (!m) return '';
  return m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function cleanTitle(title) {
  // Strip common brand suffixes from <title> when used as fallback
  return title.replace(/\s*[|–-]\s*Universal Appliances Repair\s*$/i, '').trim();
}

function extractMeta(html, name) {
  const re = new RegExp(`<meta\\s+name="${name}"\\s+content="([^"]+)"`, 'i');
  const m = html.match(re);
  return m ? m[1] : '';
}

function extractOGMeta(html, property) {
  const re = new RegExp(`<meta\\s+property="${property}"\\s+content="([^"]+)"`, 'i');
  const m = html.match(re);
  return m ? m[1] : '';
}

function extractCanonical(html) {
  const m = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/);
  return m ? m[1] : '';
}

function extractDatePublished(html) {
  const m = html.match(/"datePublished"\s*:\s*"([^"]+)"/);
  return m ? m[1] : '';
}

function hasSchema(html, type) {
  return html.includes(`"@type": "${type}"`);
}

function hasOGTag(html, property) {
  return html.includes(`property="${property}"`);
}

function hasHeroWidthHeight(html) {
  return /class="article-hero-img"[^>]+width=/.test(html) ||
         /width="\d+"[^>]+class="article-hero-img"/.test(html);
}

function buildBreadcrumbSchema(slug, h1) {
  return `  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "${BASE_URL}/" },
      { "@type": "ListItem", "position": 2, "name": "Blog", "item": "${BASE_URL}/blog.html" },
      { "@type": "ListItem", "position": 3, "name": "${h1.replace(/"/g, '\\"')}", "item": "${BASE_URL}/${slug}.html" }
    ]
  }
  </script>`;
}

function buildArticleSchema(title, slug, description, date) {
  return `  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "${title.replace(/"/g, '\\"')}",
    "description": "${description.replace(/"/g, '\\"')}",
    "author": { "@type": "Organization", "name": "Universal Appliances Repair" },
    "publisher": {
      "@type": "Organization",
      "name": "Universal Appliances Repair",
      "logo": { "@type": "ImageObject", "url": "${BASE_URL}/logo.png" }
    },
    "datePublished": "${date}",
    "dateModified": "${date}"
  }
  </script>`;
}

function processFile(filePath) {
  const filename = path.basename(filePath);
  const slug = filename.replace('.html', '');
  let html = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  const title = extractTitle(html);
  const h1 = extractH1(html) || cleanTitle(title);
  const description = extractMeta(html, 'description') || extractOGMeta(html, 'og:description') || '';
  const canonical = extractCanonical(html);
  const isOldArticle = filename in OLD_ARTICLE_DATES;
  const date = isOldArticle
    ? OLD_ARTICLE_DATES[filename]
    : (extractDatePublished(html) || '2026-04-23');

  // 1. Add Article schema to old articles that are missing it
  if (isOldArticle && !hasSchema(html, 'Article')) {
    const articleSchema = buildArticleSchema(title, slug, description, date);
    // Insert before </head>
    html = html.replace('</head>', `${articleSchema}\n</head>`);
    changed = true;
    console.log(`  + Article schema`);
  }

  // 2. Add BreadcrumbList schema if missing
  if (!hasSchema(html, 'BreadcrumbList')) {
    const breadcrumb = buildBreadcrumbSchema(slug, h1);
    html = html.replace('</head>', `${breadcrumb}\n</head>`);
    changed = true;
    console.log(`  + BreadcrumbList schema`);
  }

  // 3. Add missing OG / article meta tags
  const missingTags = [];

  if (!hasOGTag(html, 'og:title')) {
    missingTags.push(`  <meta property="og:title" content="${title.replace(/"/g, '&quot;')}" />`);
  }
  if (!hasOGTag(html, 'og:description') && description) {
    missingTags.push(`  <meta property="og:description" content="${description.replace(/"/g, '&quot;')}" />`);
  }
  if (!hasOGTag(html, 'og:type')) {
    missingTags.push(`  <meta property="og:type" content="article" />`);
  }
  if (!hasOGTag(html, 'og:url') && canonical) {
    missingTags.push(`  <meta property="og:url" content="${canonical}" />`);
  }
  if (!hasOGTag(html, 'article:published_time')) {
    missingTags.push(`  <meta property="article:published_time" content="${date}" />`);
  }
  if (!hasOGTag(html, 'article:modified_time')) {
    missingTags.push(`  <meta property="article:modified_time" content="${date}" />`);
  }

  if (missingTags.length > 0) {
    // Insert after the last existing <meta property="og:..."> tag, or before </head>
    const insertPoint = html.lastIndexOf('<meta property="og:') !== -1
      ? html.indexOf('\n', html.lastIndexOf('<meta property="og:')) + 1
      : html.indexOf('</head>');
    html = html.slice(0, insertPoint) + missingTags.join('\n') + '\n' + html.slice(insertPoint);
    changed = true;
    console.log(`  + ${missingTags.length} OG/article meta tags`);
  }

  // 4. Add width + height to hero <img> if missing
  if (!hasHeroWidthHeight(html)) {
    // Determine height from CSS
    const cssHeightMatch = html.match(/\.article-hero-img\s*\{[^}]*height:\s*(\d+)px/);
    const heroHeight = cssHeightMatch ? cssHeightMatch[1] : '460';
    html = html.replace(
      /(<img\s+class="article-hero-img"\s+src="[^"]+"\s+alt="[^"]+")\s*(\/?>)/,
      `$1 width="1600" height="${heroHeight}" $2`
    );
    changed = true;
    console.log(`  + hero img width/height (height: ${heroHeight}px)`);
  }

  if (changed) {
    fs.writeFileSync(filePath, html, 'utf8');
    return true;
  }
  return false;
}

// Run on all article-*.html files
const articles = fs.readdirSync(ROOT)
  .filter(f => f.startsWith('article-') && f.endsWith('.html'))
  .sort();

let totalChanged = 0;
for (const filename of articles) {
  const filePath = path.join(ROOT, filename);
  console.log(`\nProcessing: ${filename}`);
  const changed = processFile(filePath);
  if (changed) totalChanged++;
  else console.log('  (no changes needed)');
}

console.log(`\nDone. ${totalChanged}/${articles.length} files updated.`);
