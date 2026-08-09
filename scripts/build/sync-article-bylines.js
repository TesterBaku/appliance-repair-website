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
 * do, and adding one to the rest is an editorial decision, not a drift fix. Nothing is ever
 * guessed: a missing card, a card with no date element of its own, disagreeing cards, a card
 * with no "Updated" signal, or a second byline in one file each exit non-zero rather than
 * being resolved by assumption. All five are errors; none is a silent skip.
 *
 * WHAT THIS DOES NOT GUARANTEE. The card is the best available proxy for "when did the
 * content last change", not a verified one. Nothing checks the card itself against the
 * article's real edit history, so it still rests on a human judging "substantive" correctly
 * at edit time under the standing rule in AGENTS.md. This closes the byline-vs-card gap;
 * it does not make freshness self-verifying.
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

const BYLINE = /(Originally published )([A-Z][a-z]+ \d{1,2}, \d{4})(\s*(?:&middot;|·)\s*Updated )([A-Z][a-z]+ \d{4})/;
const BYLINE_G = new RegExp(BYLINE.source, 'g');

/*
 * Byline matches that are NOT inside a <script> block.
 *
 * ⚠️ Counting visible matches while replacing on the raw string is a trap, and this script
 * fell into it once: an earlier version stripped <script> only for the occurrence COUNT and
 * still ran .replace() against the raw text, so a JSON-LD field containing byline-shaped
 * text (which sits in <head>, i.e. BEFORE the real byline) was mutated instead of the byline.
 * Reproduced in review: it rewrote a `description` field and left the real, unverified byline
 * untouched while reporting "1 byline(s) updated". Worse, once the script block had been
 * converged to the right value it stopped registering as a change, so a genuinely stale
 * byline would never be reached again and --check would report clean forever.
 *
 * Returning real offsets into the ORIGINAL string keeps counting, replacement and reporting
 * on one source of truth. Do not reintroduce a stripped copy for one of the three.
 */
function visibleBylineMatches(html) {
  // Comments as well as scripts, matching the test/css-vars.js precedent. Commenting out old
  // markup during a template edit is normal, and a commented byline is not a visible one; the
  // previous version counted it and failed with a spurious "2 bylines found".
  const hiddenRanges = [];
  for (const h of html.matchAll(/<script[^>]*>[\s\S]*?<\/script>|<!--[\s\S]*?-->/gi)) {
    hiddenRanges.push([h.index, h.index + h[0].length]);
  }
  const hidden = (i) => hiddenRanges.some(([a, b]) => i >= a && i < b);
  return [...html.matchAll(BYLINE_G)].filter((m) => !hidden(m.index));
}

/*
 * Map each article file to the "Month Year" shown on its pages/blog.html card(s).
 * Both card shapes put the date element before the link, so for each href we take the
 * nearest preceding .blog-date / .featured-date. An article can legitimately appear more
 * than once (repair-replace has a featured block AND a grid card); they must agree.
 */
/*
 * Associate each card's date with that card's own article, SCOPED TO THE CARD CONTAINER.
 *
 * ⚠️ Do not replace this with "nearest date above the link". Two earlier versions did, and
 * text proximity produced a fresh misattribution bug each time it was patched:
 *   1. a card missing its own date element silently inherited the card above it;
 *   2. with a guard added for that, an article mentioned only by an inline cross-link inside
 *      another card's excerpt inherited that card's date, while the card legitimately owning
 *      the date was falsely flagged as orphaned.
 * Both were found by review with constructed fixtures. The root cause was the same each time:
 * linear proximity standing in for DOM structure. Container scoping removes the whole class
 * rather than the latest instance of it.
 *
 * The page is segmented at each card container (`class="blog-card"` / `class="featured"`), and
 * within one segment we pair the card's own date element with the card's own link. A card's
 * link is specifically `class="blog-link"` or `class="read-more"` — an incidental article link
 * inside an excerpt is neither, so it can never be mistaken for a card's subject. Measured on
 * the live file: 74 card containers, 74 dates, 74 card links, 1:1:1.
 */
function cardDatesByArticle() {
  /*
   * Blank out script blocks and comments before segmenting, symmetric with
   * visibleBylineMatches(). Nothing in blog.html triggers this today (0 of its 7 script
   * blocks contain card markup), but a future client-side feature embedding a literal card
   * template would otherwise register as a real card. Replacing with same-length padding
   * rather than deleting keeps every offset valid.
   */
  const blog = fs.readFileSync(blogPath, 'utf8')
    .replace(/<script[^>]*>[\s\S]*?<\/script>|<!--[\s\S]*?-->/gi, (m) => ' '.repeat(m.length));
  const map = new Map();

  const starts = [...blog.matchAll(/class="(?:blog-card|featured)"/g)].map((m) => m.index);
  if (!starts.length) return map;

  for (let i = 0; i < starts.length; i++) {
    const segment = blog.slice(starts[i], i + 1 < starts.length ? starts[i + 1] : blog.length);

    const link = segment.match(/<a\s+href="\.\.\/articles\/(article-[^"]+\.html)"\s+class="(?:blog-link|read-more)"/);
    if (!link) continue; // a container with no card link of its own is not our concern

    const date = segment.match(/class="(?:blog-date|featured-date)"[^>]*>([^<]+)</);
    const file = link[1];
    if (!map.has(file)) map.set(file, []);

    if (!date) {
      map.get(file).push({ value: undefined, raw: null }); // card carries no date element
      continue;
    }
    const updated = date[1].match(/Updated\s+([A-Z][a-z]+)\s+(\d{4})/);
    const value = updated ? `${updated[1]} ${updated[2]}` : null; // null = plain publication date
    map.get(file).push({ value, raw: date[1].trim() });
  }
  return map;
}

const cards = cardDatesByArticle();
const drift = [];
const errors = [];
let applied = 0;

for (const entry of fs.readdirSync(articlesDir)) {
  if (!/^article-.*\.html$/.test(entry)) continue;
  const filePath = path.join(articlesDir, entry);
  const orig = fs.readFileSync(filePath, 'utf8');

  const occurrences = visibleBylineMatches(orig);
  if (occurrences.length === 0) continue;      // no visible byline; not this script's business
  if (occurrences.length > 1) {
    errors.push(`${entry}: ${occurrences.length} visible bylines found; expected exactly one. Refusing to guess which is authoritative.`);
    continue;
  }
  const byline = occurrences[0];

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
  if (found.some((f) => f.value === undefined)) {
    errors.push(`${entry}: one of its cards on pages/blog.html has no .blog-date / .featured-date element inside the card container, so there is nothing to derive the byline from; add one to that card`);
    continue;
  }
  const distinct = [...new Set(found.map((f) => f.value))];
  if (distinct.length > 1) {
    errors.push(`${entry}: its ${found.length} cards on pages/blog.html disagree (${found.map((f) => `"${f.raw}"`).join(' vs ')}); fix the cards first`);
    continue;
  }
  /*
   * A card showing a plain publication date carries no "Updated" signal, so the byline's
   * Updated half cannot be derived. This is an error, not a skip: a soft skip would mean CI
   * silently stops verifying that article the moment its card loses the "Updated" prefix,
   * which is the same quiet-rot failure this script exists to prevent.
   */
  if (distinct[0] === null) {
    errors.push(`${entry}: its card reads "${found[0].raw}" (a publication date, no "Updated" signal), so the byline's Updated half cannot be derived. Either give the card an "Updated <Month> <Year>" date or remove the byline from the article.`);
    continue;
  }

  // Splice at the matched offset rather than .replace(), which would re-scan from the start.
  const rebuilt = byline[1] + published + byline[3] + distinct[0];
  const next = orig.slice(0, byline.index) + rebuilt + orig.slice(byline.index + byline[0].length);

  if (next !== orig) {
    if (CHECK) {
      drift.push(`articles/${entry}: byline reads "${byline[2]} … Updated ${byline[4]}" but should be "${published} … ${distinct[0]}" (card: "${found[0].raw}")`);
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
    console.error(`sync-article-bylines --check: visible byline disagrees with its blog card on ${drift.length} article(s):`);
    drift.forEach((d) => console.error('  - ' + d));
    console.error('Run `npm run build:article-bylines` and commit the result.');
    process.exit(1);
  }
  console.log('sync-article-bylines: visible bylines agree with their blog cards on all articles that carry one. OK');
} else {
  console.log(`sync-article-bylines: ${applied} byline(s) updated to match their blog card.`);
}
