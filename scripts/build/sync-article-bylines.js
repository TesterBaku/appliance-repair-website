#!/usr/bin/env node
/*
 * sync-article-bylines.js — derive an article's VISIBLE hero byline from its own
 * JSON-LD dates, so the two can never disagree.
 *
 * The byline looks like:
 *   Originally published March 15, 2025 &middot; Updated May 2026 by the Universal Appliances Repair Team
 *
 * "Originally published <date>" is derived from `datePublished`.
 * "Updated <Month Year>"        is derived from `dateModified`.
 *
 * WHY THIS EXISTS. The standing rule in AGENTS.md requires bumping `article:modified_time`
 * and the JSON-LD `dateModified` on every edit under `articles/`, and `npm test` already
 * enforces that those two MATCH EACH OTHER. Nothing enforced the third surface — the byline
 * a reader actually sees — so it silently rotted. Measured on 2026-08-09: of the 6 articles
 * carrying this byline, 4 had drifted, two of them by three months. A reader arriving from
 * pages/blog.html saw "Updated August 2026" on the card and "Updated May 2026" in the hero
 * seconds later, on pages whose subject is trusting our data. Found during the P6-37
 * citation sweep (PRs #701-#703); the byline had been missed by the same sweeps that
 * correctly bumped the metadata.
 *
 * DELIBERATELY NARROW. This only rewrites articles that ALREADY have the byline. 67 of 73
 * articles have no visible byline at all, and adding one to them is an editorial decision,
 * not a drift fix. It also never invents a date: an article with the byline but no
 * `dateModified` is reported as an error rather than guessed at.
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

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

/*
 * Parse Y-M-D straight out of the ISO string rather than via `new Date()`.
 * Every timestamp here is `...T00:00:00+00:00`, so constructing a Date and reading
 * local getMonth()/getDate() shifts it back a day in any negative-offset timezone —
 * which is this repo's own timezone. That would silently rewrite "August 9" to
 * "August 8" on a machine in California.
 */
const isoParts = (html, field) => {
  const m = html.match(new RegExp(`"${field}"\\s*:\\s*"(\\d{4})-(\\d{2})-(\\d{2})`));
  return m ? { y: m[1], m: Number(m[2]), d: Number(m[3]) } : null;
};

const longDate = (p) => `${MONTHS[p.m - 1]} ${p.d}, ${p.y}`;
const monthYear = (p) => `${MONTHS[p.m - 1]} ${p.y}`;

// The two dates inside one byline. Captured separately so each is replaced independently
// and the surrounding markup, separator and trailing attribution are preserved verbatim.
const BYLINE = /(Originally published )([A-Z][a-z]+ \d{1,2}, \d{4})(\s*(?:&middot;|·)\s*Updated )([A-Z][a-z]+ \d{4})/;

const drift = [];
const errors = [];
let applied = 0;

for (const entry of fs.readdirSync(articlesDir)) {
  if (!/^article-.*\.html$/.test(entry)) continue;
  const filePath = path.join(articlesDir, entry);
  const orig = fs.readFileSync(filePath, 'utf8');

  if (!BYLINE.test(orig)) continue; // no visible byline; not this script's business

  const published = isoParts(orig, 'datePublished');
  const modified = isoParts(orig, 'dateModified');
  if (!published || !modified) {
    errors.push(`${entry}: has a visible byline but no JSON-LD ${!published ? 'datePublished' : 'dateModified'}`);
    continue;
  }

  const next = orig.replace(BYLINE, (_m, pre, _oldPub, mid, _oldMod) =>
    pre + longDate(published) + mid + monthYear(modified));

  if (next !== orig) {
    if (CHECK) {
      const was = orig.match(BYLINE);
      drift.push(`articles/${entry}: byline reads "${was[2]} … Updated ${was[4]}" but schema says "${longDate(published)} … ${monthYear(modified)}"`);
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

if (CHECK) {
  if (drift.length) {
    console.error(`sync-article-bylines --check: visible byline disagrees with JSON-LD dates on ${drift.length} article(s):`);
    drift.forEach((d) => console.error('  - ' + d));
    console.error('Run `npm run build:article-bylines` and commit the result.');
    process.exit(1);
  }
  console.log('sync-article-bylines: visible bylines match JSON-LD dates on all articles that carry one. OK');
} else {
  console.log(`sync-article-bylines: ${applied} byline(s) updated to match JSON-LD dates.`);
}
