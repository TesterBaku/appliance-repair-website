#!/usr/bin/env node
/*
 * sync-review-counts.js: derive every site-wide Google-review COUNT surface from
 * data/testimonials.json so they can never drift the way they did for ~65 files at a
 * time before this existed (see the "why" section of
 * tasks/plan-2026-08-15-weekly-review-batch-cadence.md).
 *
 * SOURCE OF TRUTH: `_meta.sources.google.publishedCount`, NEVER `capturedCount` and
 * NEVER `totalReviewsOnListing` directly. As of 2026-08-15 there are three distinct
 * counters under `_meta.sources.google`, added by the weekly review-batch cadence plan
 * so daily capture and weekly publishing can move independently:
 *
 *   - `totalReviewsOnListing`: the live GBP listing total. Free to move daily as
 *     reviews are captured. May move DOWN if Google filters a review.
 *   - `publishedCount`: what the website currently claims. Moves ONLY during a
 *     weekly publish batch (via `--publish`, below). This is the number every surface
 *     in this file must equal, and what `test/content-integrity.js`'s `review-count`
 *     check validates against.
 *   - `capturedCount`: how many reviews are transcribed into the pool.
 *     Internal only, never rendered on any page.
 *
 * Using `capturedCount` here would write a value that fails `review-count` whenever it
 * diverges from what's published (e.g. a review counted on the listing but not yet
 * transcribed). Using `totalReviewsOnListing` directly would make every daily capture
 * bump immediately rewrite the whole site ahead of the weekly batch, defeating the
 * entire point of the cadence split (and risking publishing MORE reviews than the
 * listing shows if Google later filters one). Keep this pointed at `publishedCount`.
 *
 * SURFACES KEPT IN SYNC (site-wide, every .html file that carries them):
 *   - AggregateRating "reviewCount" in JSON-LD
 *   - "N verified 5-star Google reviews" prose (also covers the testimonials-page
 *     meta description / og:description / twitter:description, which embed this
 *     same phrase, and the hub-page "From our N verified 5-star Google reviews" variant)
 *   - "N Google reviews" hero-rating copy AND the matching aria-label
 *     (aria-label="Rated 5.0 out of 5 from N Google reviews")
 *   - "Read all N reviews" link text
 *   - the testimonials-page "Verified Google Reviews" stat number
 *
 * EXPLICITLY OUT OF SCOPE: the "All (N)" filter pill on pages/testimonials.html. That
 * counts DISPLAYED CARDS on the curated page, not the GBP total, and is enforced
 * separately by the `testimonial-pill-count` check in test/content-integrity.js. This
 * script asserts on every run (see assertPillsUnchanged below) that no "All (N)" pill
 * substring anywhere in the site was touched: a hard failure, not just a lint warning,
 * because a syncer silently touching the wrong count is exactly the failure mode this
 * whole script exists to prevent.
 *
 * IMPORTANT: pages/testimonials.html is otherwise hand-maintained (see AGENTS.md
 * "Data" and the retirement note below): the displayed review CARDS are a hand-curated
 * subset (the JSON pool is a superset of what is shown), with per-card review photos,
 * ordering, and copy that are not derivable from the JSON alone; the nav (including the
 * dropdown hover JS), footer, hero, and styles are the site's current hand-crafted
 * design. The previous generative build script (scripts/build-testimonials-html.js)
 * rendered an outdated design and silently dropped the dropdown JS and the
 * review-photo images on quote cards, so it was retired (2026-05-31) in favor of this
 * surgical count-syncer, which was itself extended site-wide (2026-08-15) as part of
 * the weekly review-batch cadence plan. Previously it rewrote only
 * pages/testimonials.html, leaving ~65 other pages carrying the same surfaces to be
 * updated by hand or ad-hoc sed on every pass.
 *
 * Usage:
 *   node scripts/build/sync-review-counts.js            # rewrite (apply), idempotent
 *   node scripts/build/sync-review-counts.js --check     # verify only (exit 1 on drift),
 *                                                          used by `npm test`
 *   node scripts/build/sync-review-counts.js --publish   # weekly Track B promotion step:
 *                                                          sets publishedCount =
 *                                                          totalReviewsOnListing (warns
 *                                                          loudly on a decrease, but
 *                                                          allows it, since Google can
 *                                                          filter reviews and the site
 *                                                          must follow the listing down),
 *                                                          then performs the full sync.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');
const CHECK = process.argv.includes('--check');
const PUBLISH = process.argv.includes('--publish');

const SKIP_DIRS = new Set(['node_modules', 'test-results', '.staging', 'pagefind', '.git']);

function collectHtmlFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      results.push(...collectHtmlFiles(path.join(dir, entry.name)));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      results.push(path.join(dir, entry.name));
    }
  }
  return results;
}

// Each surface's regex captures the target digits as group 1. Replacement is done by
// swapping that exact captured substring inside the full match, so every surface below
// shares one apply/detect code path.
const SURFACES = [
  {
    name: 'AggregateRating reviewCount',
    regex: /"reviewCount"\s*:\s*"(\d+)"/g,
  },
  {
    name: 'N verified 5-star Google reviews (prose / meta description / og / twitter)',
    regex: /\b(\d+) verified 5-star Google reviews/g,
  },
  {
    name: 'N Google reviews (hero-rating copy + aria-label)',
    regex: /\b(\d+) Google reviews\b/g,
  },
  {
    name: 'Read all N reviews (link text)',
    regex: /Read all (\d+) reviews/g,
  },
  {
    name: 'testimonials-page "Verified Google Reviews" stat number',
    regex: />(\d+)<\/div>\s*<div[^>]*>\s*Verified Google Reviews/g,
  },
];

// The "All (N)" pill counts DISPLAYED CARDS, not the GBP total: it must never move as
// a side effect of this script. This is the regression guard called out in the plan.
const PILL_REGEX = /All \(\d+\)/g;

function extractPills(content) {
  return content.match(PILL_REGEX) || [];
}

function assertPillsUnchanged(filePath, before, after) {
  const beforePills = extractPills(before);
  const afterPills = extractPills(after);
  if (JSON.stringify(beforePills) !== JSON.stringify(afterPills)) {
    throw new Error(
      `sync-review-counts: REGRESSION - the "All (N)" filter pill in ${path.relative(repoRoot, filePath)} ` +
      `changed from ${JSON.stringify(beforePills)} to ${JSON.stringify(afterPills)}. That pill counts displayed ` +
      `cards, not the GBP total, and must never be touched by this script. Aborting without writing anything.`
    );
  }
}

// Applies every surface's substitution to `content`, returning the new content plus the
// set of surface names that actually changed (for reporting).
function syncContent(content, N) {
  let next = content;
  const changedSurfaces = new Set();
  for (const surface of SURFACES) {
    next = next.replace(surface.regex, (fullMatch, digits) => {
      if (digits === N) return fullMatch;
      changedSurfaces.add(surface.name);
      return fullMatch.replace(digits, N);
    });
  }
  return { next, changedSurfaces };
}

// For --check: find drift without writing, reporting the actual (wrong) value found.
function findDrift(content, N) {
  const drift = [];
  for (const surface of SURFACES) {
    for (const m of content.matchAll(surface.regex)) {
      if (m[1] !== N) {
        drift.push({ surface: surface.name, found: m[1] });
      }
    }
  }
  return drift;
}

function main() {
  const dataPath = path.join(repoRoot, 'data', 'testimonials.json');
  const pool = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const google = pool._meta.sources.google;

  if (PUBLISH) {
    const oldPublished = google.publishedCount;
    const newPublished = google.totalReviewsOnListing;
    if (typeof newPublished !== 'number' || !Number.isInteger(newPublished) || newPublished <= 0) {
      console.error(`sync-review-counts --publish: totalReviewsOnListing is missing or invalid (got: ${JSON.stringify(newPublished)}). Refusing to publish.`);
      process.exit(1);
    }
    if (newPublished !== oldPublished) {
      if (newPublished < oldPublished) {
        console.warn('');
        console.warn('*************************************************************************');
        console.warn(`*  WARNING: publishedCount is DECREASING (${oldPublished} -> ${newPublished}).`);
        console.warn('*  Google appears to have filtered one or more reviews from the live');
        console.warn('*  listing since the last publish. The site is following the listing');
        console.warn('*  down, per the weekly review-batch cadence plan. This is expected');
        console.warn('*  behavior, not an error, but confirm it against the owner-supplied');
        console.warn('*  GBP screenshot before committing.');
        console.warn('*************************************************************************');
        console.warn('');
      } else {
        console.log(`sync-review-counts --publish: publishedCount increasing ${oldPublished} -> ${newPublished}.`);
      }
      google.publishedCount = newPublished;
      fs.writeFileSync(dataPath, JSON.stringify(pool, null, 2) + '\n', 'utf8');
    } else {
      console.log(`sync-review-counts --publish: publishedCount already matches totalReviewsOnListing (${newPublished}). No JSON change.`);
    }
  }

  const publishedCount = google.publishedCount;
  if (!Number.isInteger(publishedCount) || publishedCount <= 0) {
    console.error(`sync-review-counts: _meta.sources.google.publishedCount is missing or not a positive integer (got: ${JSON.stringify(publishedCount)}). Refusing to sync against an invalid value.`);
    process.exit(1);
  }
  const N = String(publishedCount);

  const htmlFiles = collectHtmlFiles(repoRoot);

  if (CHECK) {
    const driftByFile = [];
    for (const filePath of htmlFiles) {
      const content = fs.readFileSync(filePath, 'utf8');
      const drift = findDrift(content, N);
      if (drift.length) {
        driftByFile.push({ file: path.relative(repoRoot, filePath).split(path.sep).join('/'), drift });
      }
      // Run the pill guard in --check too: it should never fire (the regexes above
      // never touch the pill), but if a future surface regex ever does, --check must
      // catch it before anyone runs the apply mode.
      const { next } = syncContent(content, N);
      assertPillsUnchanged(filePath, content, next);
    }

    if (driftByFile.length) {
      console.error(`sync-review-counts --check: stale review counts on ${driftByFile.length} file(s) (expected publishedCount=${N}):`);
      for (const { file, drift } of driftByFile) {
        for (const d of drift) {
          console.error(`  - ${file}: ${d.surface} - found "${d.found}", expected "${N}"`);
        }
      }
      console.error('Run `npm run build:review-counts` and commit the result.');
      process.exit(1);
    }
    console.log(`sync-review-counts --check: all review-count surfaces match publishedCount (${N}). OK`);
    return;
  }

  // Apply mode.
  let filesChanged = 0;
  const changedSummary = [];
  for (const filePath of htmlFiles) {
    const content = fs.readFileSync(filePath, 'utf8');
    const { next, changedSurfaces } = syncContent(content, N);
    if (next === content) continue;
    assertPillsUnchanged(filePath, content, next);
    fs.writeFileSync(filePath, next, 'utf8');
    filesChanged++;
    changedSummary.push(`${path.relative(repoRoot, filePath).split(path.sep).join('/')} (${[...changedSurfaces].join(', ')})`);
  }

  if (filesChanged === 0) {
    console.log(`sync-review-counts: already in sync at ${N} reviews. No changes.`);
  } else {
    console.log(`sync-review-counts: synced ${filesChanged} file(s) to ${N} reviews:`);
    changedSummary.forEach((line) => console.log(`  - ${line}`));
  }
}

main();
