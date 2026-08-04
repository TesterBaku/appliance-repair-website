#!/usr/bin/env node
/**
 * One-off: fit the nav row on articles after the "Brands" dropdown made 8 top-level items.
 *
 * Articles link no stylesheet at all (they carry their own inline nav CSS), so the three
 * changes made in shared.css and index.html for the rest of the site cannot reach them:
 *
 *   1. `.nav-links` gap 22px -> 16px. With 8 items at 22px the row needs more than the
 *      1100px container, so the wordmark, "Service Areas" and the phone number wrap.
 *   2. `.logo` font-size 16px -> 14px. Articles ran the same oversized wordmark the
 *      homepage did; at 16px the row clears the container by only 6px. (The taller
 *      70px bar is unchanged: that is vertical and costs no width.)
 *   3. A compact-nav band, 769px to 1099px. Even after 1 and 2 the row needs ~1016px of
 *      content, which fits the container cap but nothing narrower, so below 1100px the
 *      wordmark is hidden and spacing tightens. That keeps all 8 nav links visible down
 *      to the mobile breakpoint rather than hiding them behind the hamburger.
 *
 * The compact block is appended at the END of the article's <style> (immediately before
 * `</style>`), NOT next to the `.nav-links` rule. Articles declare `.logo`, `.nav-links`
 * and `.nav-cta` further down the sheet, and a media-query rule carries no extra
 * specificity, so an earlier block loses to them and the compaction never applies.
 * Every article has exactly one `</style>`.
 *
 * Idempotent: files that already carry the block are skipped. Writes UTF-8 with no BOM.
 *
 * Run: node scripts/oneoff/fit-nav-row-2026-08-03.js [--check]
 */
const fs = require('fs');
const path = require('path');

const ARTICLES_DIR = path.join(__dirname, '..', '..', 'articles');
const MARKER = '/* COMPACT NAV:';

const GAP_FROM = '    .nav-links { display: flex; gap: 22px; }';
const GAP_TO = [
  '    /* gap was 22px until the Brands dropdown made 8 top-level items: at 22px the row',
  '       overflows the 1100px container and the labels wrap to two lines. */',
  '    .nav-links { display: flex; gap: 16px; }',
].join('\n');

const LOGO_FROM = '.logo { display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 16px; color: #111; text-decoration: none; }';
const LOGO_TO = '.logo { display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 14px; color: #111; text-decoration: none; }';

const STYLE_CLOSE = '\n  </style>';
const COMPACT = [
  '',
  '    /* COMPACT NAV: 769px to 1099px. Below 1100px the row (~1016px of content) no',
  '       longer fits, so the wordmark gives way first and spacing tightens, which keeps',
  '       every nav link visible down to the mobile breakpoint instead of hiding them all',
  '       behind the hamburger. Must stay last: `.logo`, `.nav-links` and `.nav-cta` are',
  '       declared above and a media query adds no specificity, so an earlier copy of this',
  '       block would lose to them. */',
  '    @media (min-width: 769px) and (max-width: 1099px) {',
  '      .nav-inner { padding: 0 16px; }',
  '      .logo span { display: none; }',
  '      .nav-links { gap: 8px; }',
  '      .nav-links a, .nav-dropdown-toggle { font-size: 11px; }',
  '      .nav-cta { padding: 7px 12px; }',
  '      /* the logo carries an inline height to avoid layout shift, so this needs the override */',
  '      .logo img { height: 42px !important; }',
  '    }',
  '  </style>',
].join('\n');

const check = process.argv.includes('--check');
const files = fs.readdirSync(ARTICLES_DIR).filter(f => /^article-.*\.html$/.test(f));

let updated = 0, skipped = 0;
const problems = [];

for (const file of files) {
  const full = path.join(ARTICLES_DIR, file);
  const html = fs.readFileSync(full, 'utf8');

  if (html.includes(MARKER)) { skipped++; continue; }

  const counts = {
    gap: html.split(GAP_FROM).length - 1,
    logo: html.split(LOGO_FROM).length - 1,
    style: html.split(STYLE_CLOSE).length - 1,
  };
  const wrong = Object.entries(counts).filter(([, n]) => n !== 1);
  if (wrong.length) {
    problems.push(`${file}: expected 1 each, got ${wrong.map(([k, n]) => `${k}=${n}`).join(', ')}`);
    continue;
  }

  if (check) { problems.push(`${file}: missing the compact-nav block`); continue; }

  const out = html
    .replace(GAP_FROM, GAP_TO)
    .replace(LOGO_FROM, LOGO_TO)
    .replace(STYLE_CLOSE, COMPACT);

  fs.writeFileSync(full, out, 'utf8');
  updated++;
}

console.log(`fit-nav-row: ${files.length} article(s) scanned, ${updated} updated, ${skipped} already had the block.`);
if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  problems.forEach(p => console.error('  ' + p));
  process.exit(1);
}
