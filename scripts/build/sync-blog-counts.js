#!/usr/bin/env node
/*
 * sync-blog-counts.js — derive the blog's article-count surfaces from the actual
 * number of cards so they can never drift when an article is added/removed.
 *
 * Before this existed, these counts were hand-maintained and repeatedly went stale
 * (PR #537: pill counts; PR #539: a category-page "N <Cat> Articles" header). The
 * category-page header is especially easy to miss because the number is not adjacent
 * to the word "articles" (e.g. "8 Oven, Stove & Range Articles").
 *
 * Surfaces kept in sync:
 *   pages/blog.html        — the #blog-search placeholder ("Search N articles…") and
 *                            every category pill "Label (N)" (All Posts = total cards;
 *                            each <Cat> = count of cards with that data-category)
 *   pages/blog/<cat>.html  — the leading number of the "<N> … Articles" section-label
 *                            (only the number is replaced; the rest of the label and
 *                            the file's line endings are preserved)
 *
 * Each surface is made consistent with the cards ON ITS OWN PAGE. blog.html's per-
 * category pill and the matching category page can legitimately differ (a category
 * lander may curate a subset), so this never forces cross-page set equality.
 *
 *   node scripts/build/sync-blog-counts.js           # rewrite (apply)
 *   node scripts/build/sync-blog-counts.js --check    # verify only (exit 1 on drift) — used by `npm test`
 */
'use strict';

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');
const CHECK = process.argv.includes('--check');

const blogPath = path.join(repoRoot, 'pages', 'blog.html');
const catDir = path.join(repoRoot, 'pages', 'blog');

const countCards = (html) => (html.match(/class="blog-card"/g) || []).length;

function countByCategory(html) {
  const tally = {};
  for (const m of html.matchAll(/data-category="([a-z-]+)"/g)) {
    tally[m[1]] = (tally[m[1]] || 0) + 1;
  }
  return tally;
}

const drift = [];
let applied = 0;

// --- pages/blog.html: search placeholder + category pills ---
{
  const orig = fs.readFileSync(blogPath, 'utf8');
  const total = countCards(orig);
  const byCat = countByCategory(orig);

  let next = orig
    .replace(/(placeholder="Search )\d+( articles)/, (_m, a, b) => a + total + b)
    // Category pills: "<Label> (N)" keyed by data-filter ("all" → total, else per category).
    .replace(/(data-filter="([a-z]+)">)([^<]*?)\(\d+\)/g, (_m, pre, filter, label) => {
      const n = filter === 'all' ? total : (byCat[filter] || 0);
      return pre + label + '(' + n + ')';
    });

  if (next !== orig) {
    if (CHECK) drift.push('pages/blog.html');
    else { fs.writeFileSync(blogPath, next, 'utf8'); applied++; }
  }
}

// --- pages/blog/<cat>.html: "<N> … Articles" section-label (leading number only) ---
for (const entry of fs.readdirSync(catDir)) {
  if (!entry.endsWith('.html')) continue;
  const p = path.join(catDir, entry);
  const orig = fs.readFileSync(p, 'utf8');
  const n = countCards(orig);
  const next = orig.replace(/(<div class="section-label">)\d+/, (_m, pre) => pre + n);
  if (next !== orig) {
    if (CHECK) drift.push('pages/blog/' + entry);
    else { fs.writeFileSync(p, next, 'utf8'); applied++; }
  }
}

if (CHECK) {
  if (drift.length) {
    console.error(`sync-blog-counts --check: stale article counts on ${drift.length} page(s):`);
    drift.forEach((f) => console.error('  - ' + f));
    console.error('Run `npm run build:blog-counts` and commit the result.');
    process.exit(1);
  }
  console.log('sync-blog-counts: all blog article counts match card counts. OK');
} else {
  console.log(`sync-blog-counts: ${applied} file(s) updated to match live card counts.`);
}
