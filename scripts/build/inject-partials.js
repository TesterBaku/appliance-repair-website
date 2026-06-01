#!/usr/bin/env node
/*
 * inject-partials.js — single-source the site's shared chrome (footer + nav).
 *
 * The deployed artifact stays pure static HTML: this stamps canonical partials
 * into each page at build time. Run it whenever a file in partials/ changes and
 * commit the result (same model as sitemap.xml).
 *
 *   node scripts/build/inject-partials.js            # rewrite all pages
 *   node scripts/build/inject-partials.js --check    # verify only (exit 1 on drift) — used by `npm test`
 *   node scripts/build/inject-partials.js <file…>    # rewrite only the named pages
 *
 * Partials:
 *   partials/footer.html       → the <footer class="footer">…</footer> region (all served pages)
 *   partials/nav-main.html     → the <nav class="nav">…</nav> region (drawer INSIDE nav) for
 *                                root + pages/ + pages/blog/ pages
 *   partials/nav-article.html  → the <nav class="nav">…</nav> + sibling #mobile-nav-drawer region
 *                                for articles/ pages (drawer sits OUTSIDE </nav>)
 *
 * Tokens substituted per page location:
 *   {{BASE}}        → relative path from the page's dir to pages/ (root→"pages/", pages/→"",
 *                     pages/blog/→"../", articles/→"../pages/")
 *   {{ROOT}}        → relative path from the page's dir to the site root (root→"./", pages/→"../",
 *                     pages/blog/→"../../", articles/→"../") — used by the logo link/img
 *   {{ACTIVE_BLOG}} → ' class="active"' on the blog section (pages/blog.html + pages/blog/*), else ""
 */
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');
const pagesDir = path.join(repoRoot, 'pages');
const args = process.argv.slice(2);
const CHECK = args.includes('--check');
const explicitFiles = args.filter((a) => !a.startsWith('--'));

function loadPartial(name) {
  return fs
    .readFileSync(path.join(repoRoot, 'partials', name), 'utf8')
    .replace(/\r\n/g, '\n')
    .replace(/\n+$/, '');
}
const PARTIALS = {
  footer: loadPartial('footer.html'),
  navMain: loadPartial('nav-main.html'),
  navArticle: loadPartial('nav-article.html'),
};

const FOOTER_RE = /[ \t]*<footer class="footer">[\s\S]*?<\/footer>/;
const NAV_MAIN_RE = /[ \t]*<nav class="nav">[\s\S]*?<\/nav>/;
const NAV_ARTICLE_RE = /[ \t]*<nav class="nav">[\s\S]*?<\/nav>\s*<div class="nav-drawer" id="mobile-nav-drawer"[\s\S]*?<\/div>/;

// Served-page locations get the partials; everything else (test fixtures, etc.) is skipped.
function locationOf(absFile) {
  const rel = path.relative(repoRoot, absFile).split(path.sep).join('/');
  const served = !rel.includes('/') || rel.startsWith('pages/') || rel.startsWith('articles/');
  return served ? rel : null;
}

function tokensFor(absFile, rel) {
  const base = path.relative(path.dirname(absFile), pagesDir).split(path.sep).join('/');
  const root = path.relative(path.dirname(absFile), repoRoot).split(path.sep).join('/');
  return {
    BASE: base === '' ? '' : base + '/',
    ROOT: root === '' ? './' : root + '/',
    ACTIVE_BLOG: rel === 'pages/blog.html' || rel.startsWith('pages/blog/') ? ' class="active"' : '',
  };
}

function render(partialLF, tokens, eol) {
  return partialLF
    .replace(/\{\{BASE\}\}/g, tokens.BASE)
    .replace(/\{\{ROOT\}\}/g, tokens.ROOT)
    .replace(/\{\{ACTIVE_BLOG\}\}/g, tokens.ACTIVE_BLOG)
    .replace(/\n/g, eol);
}

function collectHtml(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!['.git', 'node_modules', '.claude', '.playwright-mcp', 'test-results', 'partials'].includes(entry.name))
        collectHtml(full, out);
    } else if (full.endsWith('.html')) {
      out.push(full);
    }
  }
}

let files;
if (explicitFiles.length) {
  files = explicitFiles.map((f) => path.resolve(repoRoot, f));
} else {
  files = [];
  collectHtml(repoRoot, files);
}

const counts = { footer: 0, nav: 0 };
let changed = 0, skipped = 0;
const drift = [];

for (const file of files) {
  const rel = locationOf(file);
  if (rel === null) { skipped++; continue; }
  let content = fs.readFileSync(file, 'utf8');
  const eol = content.includes('\r\n') ? '\r\n' : '\n';
  const tokens = tokensFor(file, rel);
  let next = content;

  // Footer (all served pages that have one)
  if (FOOTER_RE.test(next)) {
    const expected = render(PARTIALS.footer, tokens, eol);
    next = next.replace(FOOTER_RE, () => expected);
    counts.footer++;
  }

  // Nav — family-aware region + partial
  const isArticle = rel.startsWith('articles/');
  const navRe = isArticle ? NAV_ARTICLE_RE : NAV_MAIN_RE;
  const navPartial = isArticle ? PARTIALS.navArticle : PARTIALS.navMain;
  if (navRe.test(next)) {
    const expected = render(navPartial, tokens, eol);
    next = next.replace(navRe, () => expected);
    counts.nav++;
  }

  if (next !== content) {
    if (CHECK) drift.push(rel);
    else { fs.writeFileSync(file, next, 'utf8'); changed++; }
  }
}

if (CHECK) {
  if (drift.length) {
    console.error(`inject-partials --check: ${drift.length} page(s) have chrome that does not match partials/:`);
    drift.forEach((f) => console.error(`  - ${f}`));
    console.error('Run `npm run build:partials` and commit the result.');
    process.exit(1);
  }
  console.log(`inject-partials: chrome matches partials/ on all pages (${counts.footer} footers, ${counts.nav} navs). OK`);
} else {
  console.log(`inject-partials: ${changed} file(s) updated (${counts.footer} footer regions, ${counts.nav} nav regions processed, ${skipped} skipped).`);
}
