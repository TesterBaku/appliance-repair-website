#!/usr/bin/env node
/**
 * sync-testimonials-count.js
 *
 * Syncs the Google review COUNT surfaces in pages/testimonials.html to match
 * data/testimonials.json (_meta.sources.google.capturedCount). Idempotent and
 * safe to run any time.
 *
 * IMPORTANT — this is NOT a page generator. pages/testimonials.html is
 * hand-maintained:
 *   - the displayed review CARDS are a hand-curated subset (the JSON pool is a
 *     superset of what is shown), with per-card review photos, ordering, and
 *     copy that are not derivable from the JSON alone;
 *   - the nav (including the dropdown hover JS), footer, hero, and styles are
 *     the site's current hand-crafted design.
 *
 * The previous generative build script (scripts/build-testimonials-html.js)
 * rendered an outdated design and silently dropped the dropdown JS and the
 * review-photo images on quote cards, so it was retired (2026-05-31) in favor
 * of this surgical count-syncer. To add or curate a review card, edit
 * pages/testimonials.html directly and copy the body text verbatim from the
 * JSON pool.
 *
 * This script updates ONLY the GBP-total surfaces. It deliberately does NOT
 * touch the "All (N)" filter pill (that counts the displayed/curated cards,
 * not the GBP total) or anything else:
 *   - AggregateRating "reviewCount"
 *   - "<N> verified 5-star Google reviews" (meta description, OG, Twitter, hero)
 *   - the "Verified Google Reviews" stat number
 */
const fs = require('fs');
const path = require('path');

const pool = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/testimonials.json'), 'utf8'));
const N = String(pool._meta.sources.google.capturedCount);
const file = path.join(__dirname, '../pages/testimonials.html');

let s = fs.readFileSync(file, 'utf8');
const before = s;
const changed = new Set();

s = s.replace(/("reviewCount"\s*:\s*")\d+(")/g, (m, a, b) => { if (m !== a + N + b) changed.add('AggregateRating reviewCount'); return a + N + b; });
s = s.replace(/\b\d+( verified 5-star Google reviews)/g, (m, rest) => { if (m !== N + rest) changed.add('count copy'); return N + rest; });
s = s.replace(/(>)\d+(<\/div>\s*<div[^>]*>\s*Verified Google Reviews)/g, (m, a, b) => { if (m !== a + N + b) changed.add('stat number'); return a + N + b; });

if (s === before) {
  console.log(`sync-testimonials-count: already in sync at ${N} reviews. No changes.`);
} else {
  fs.writeFileSync(file, s, 'utf8');
  console.log(`sync-testimonials-count: synced testimonials.html GBP review count to ${N} (updated: ${[...changed].join(', ')}).`);
}
