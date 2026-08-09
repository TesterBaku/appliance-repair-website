#!/usr/bin/env node
/*
 * sync-article-bylines.js — keep an article's VISIBLE hero byline in agreement with
 * its card on pages/blog.html, and close backlog item P6-23.
 *
 * The byline looks like:
 *   Originally published March 15, 2025 &middot; Updated May 2026 by the Universal Appliances Repair Team
 *
 *   "Originally published <date>"  <- JSON-LD `datePublished` (an immutable fact)
 *   "Updated <Month Year>"         <- the article's `.blog-date` / `.featured-date` on pages/blog.html
 *
 * ⚠️ READ THIS BEFORE "SIMPLIFYING" IT TO USE dateModified.
 * Sourcing the Updated half from `dateModified` is the obvious-looking design and it is
 * WRONG. `dateModified` bumps on schema, meta and chrome-only edits; the byline and the
 * blog card both mean "when did this CONTENT last change". They are deliberately allowed
 * to differ. P6-23 in tasks/backlog.md, opened out of the PR #673 review, states it
 * outright: "Do NOT compare either against dateModified — that is the comparison that
 * produces false positives."
 *
 * That is not hypothetical. The first version of THIS script derived the byline from
 * `dateModified` and, on 2026-08-09, rewrote two articles' bylines from "May 2026" to
 * "August 2026" — articles whose dateModified had moved only for a <title>/meta rewrite
 * (#669) and a FAQPage schema conformance pass (#666). Their content had not changed
 * since May, their cards still correctly said May, and the "fix" introduced exactly the
 * card-vs-byline contradiction #673 had fixed by hand. Caught in review before merge.
 *
 * DELIBERATELY NARROW. Only articles that ALREADY carry the byline are touched; ~6 of 73
 * do, and adding one to the rest is an editorial decision, not a drift fix. Nothing is
 * ever guessed: a missing card, disagreeing cards, a card with no "Updated" signal, or a
 * second byline in one file are all reported as errors rather than resolved by assumption.
 *
 *   node scripts/build/sync-article-bylines.js           # rewrite (apply)
 *   node scripts/build/sync-article-bylines.js --check   # verify only (exit 1 on drift) — used by `npm test`
 */
'use strict';

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');
const CHECK = process.argv.includes('--check');
const articlesDir = path.join(repoRoot, 'articles');
const blogPath = path.join(repoRoot, 'pages', 'blog.html');

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

/*
 * Parse Y-M-D straight out of the ISO string rather than via `new Date()`. Every timestamp
 * here is `...T00:00:00+00:00`, so building a Date and reading local getMonth()/getDate()
 * shifts it back a day in any negative-offset timezone — including this repo's own. Verified:
 * in America/Los_Angeles, new Date('2026-08-09T00:00:00+00:00').getDate() === 8.
 */
const publishedDate = (html) => {
  const m = html.match(/"datePublished"\s*:\s*"(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${MONTHS[Number(m[2]) - 1]} ${Number(m[3])}, ${m[1]}` : null;
};

// Strip script blocks so JSON-LD text can never be mistaken for the visible byline.
const visibleOnly = (html) => html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

const BYLINE = /(Originally published )([A-Z][a-z]+ \d{1,2}, \d{4})(\s*(?:&middot;|·)\s*Updated )([A-Z][a-z]+ \d{4})/;
const BYLINE_G = new RegExp(BYLINE.source, 'g');

/*
 * Map each article file to the "Month Year" shown on its pages/blog.html card(s).
 * Both card shapes put the date element before the link, so for each href we take the
 * nearest preceding .blog-date / .featured-date. An article can legitimately appear more
 * than once (repair-replace has a featured block AND a grid card); they must agree.
 */
function cardDatesByArticle() {
  const blog = fs.readFileSync(blogPath, 'utf8');
  const map = new Map();
  const linkRe = /<a\s+href="\.\.\/articles\/(article-[^"]+\.html)"/g;
  const dateRe = /class="(?:blog-date|featured-date)"[^>]*>([^<]+)</g;

  const dates = [...blog.matchAll(dateRe)].map((m) => ({ index: m.index, text: m[1] }));

  for (const link of blog.matchAll(linkRe)) {
    const preceding = dates.filter((d) => d.index < link.index).pop();
    if (!preceding) continue;
    const updated = preceding.text.match(/Updated\s+([A-Z][a-z]+)\s+(\d{4})/);
    const value = updated ? `${updated[1]} ${updated[2]}` : null; // null = card shows a plain publish date
    if (!map.has(link[1])) map.set(link[1], []);
    map.get(link[1]).push({ value, raw: preceding.text.trim() });
  }
  return map;
}

const cards = cardDatesByArticle();
const drift = [];
const errors = [];
const skipped = [];
let applied = 0;

for (const entry of fs.readdirSync(articlesDir)) {
  if (!/^article-.*\.html$/.test(entry)) continue;
  const filePath = path.join(articlesDir, entry);
  const orig = fs.readFileSync(filePath, 'utf8');
  const visible = visibleOnly(orig);

  const occurrences = visible.match(BYLINE_G) || [];
  if (occurrences.length === 0) continue;      // no visible byline; not this script's business
  if (occurrences.length > 1) {
    errors.push(`${entry}: ${occurrences.length} visible bylines found; expected exactly one. Refusing to guess which is authoritative.`);
    continue;
  }

  const published = publishedDate(orig);
  if (!published) {
    errors.push(`${entry}: has a visible byline but no JSON-LD datePublished`);
    continue;
  }

  const found = cards.get(entry);
  if (!found || !found.length) {
    errors.push(`${entry}: has a visible byline but no card on pages/blog.html to derive "Updated" from`);
    continue;
  }
  const distinct = [...new Set(found.map((f) => f.value))];
  if (distinct.length > 1) {
    errors.push(`${entry}: its ${found.length} cards on pages/blog.html disagree (${found.map((f) => `"${f.raw}"`).join(' vs ')}); fix the cards first`);
    continue;
  }
  if (distinct[0] === null) {
    skipped.push(`${entry}: card reads "${found[0].raw}" (a publication date, no "Updated" signal), so the byline's Updated half cannot be derived`);
    continue;
  }

  const next = orig.replace(BYLINE, (_m, pre, _oldPub, mid) => pre + published + mid + distinct[0]);

  if (next !== orig) {
    if (CHECK) {
      const was = orig.match(BYLINE);
      drift.push(`articles/${entry}: byline reads "${was[2]} … Updated ${was[4]}" but should be "${published} … ${distinct[0]}" (card: "${found[0].raw}")`);
    } else {
      fs.writeFileSync(filePath, next, 'utf8');
      applied++;
    }
  }
}

if (errors.length) {
  console.error('sync-article-bylines: cannot derive a byline for:');
  errors.forEach((e) => console.error('  - ' + e));
  process.exit(1);
}

skipped.forEach((s) => console.log('sync-article-bylines: skipped ' + s));

if (CHECK) {
  if (drift.length) {
    console.error(`sync-article-bylines --check: visible byline disagrees with its blog card on ${drift.length} article(s):`);
    drift.forEach((d) => console.error('  - ' + d));
    console.error('Run `npm run build:article-bylines` and commit the result.');
    process.exit(1);
  }
  console.log('sync-article-bylines: visible bylines agree with their blog cards on all articles that carry one. OK');
} else {
  console.log(`sync-article-bylines: ${applied} byline(s) updated to match their blog card.`);
}
