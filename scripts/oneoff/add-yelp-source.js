#!/usr/bin/env node
/**
 * Extends data/testimonials.json with Yelp support.
 * Run from project root. Idempotent (safe to re-run).
 *
 * Steps performed:
 * 1. Backfill source: "google" on every existing record that lacks it.
 * 2. Restructure _meta to multi-source shape.
 * 3. Add 4 Yelp review records (no-op if already present).
 * 4. Update policy notes.
 */

const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '..', 'data', 'testimonials.json');
const raw = fs.readFileSync(JSON_PATH, 'utf8');
const data = JSON.parse(raw);

// ── Step 1: Backfill source: "google" on existing records ──────────────────

let backfilled = 0;
for (const r of data.reviews) {
  if (!r.source) {
    // Insert source after id (rebuild record key order)
    const { id, ...rest } = r;
    Object.assign(r, { id, source: 'google', ...rest });
    // Force key order: id first, source second
    const ordered = { id: r.id, source: 'google' };
    for (const [k, v] of Object.entries(r)) {
      if (k !== 'id' && k !== 'source') ordered[k] = v;
    }
    Object.keys(r).forEach(k => delete r[k]);
    Object.assign(r, ordered);
    backfilled++;
  }
}
console.log(`Backfilled source:'google' on ${backfilled} records.`);

// ── Step 2: Restructure _meta ───────────────────────────────────────────────

const oldMeta = data._meta;

// Extract the captureMethod string (may have been updated in prior PR)
const googleCaptureMethod = (oldMeta.captureMethod || '')
  .replace(/; ?13 review photos relocated.*$/i, '')  // remove old migration note
  .trim() + '; 13 review photos relocated from reviewer-profiles/ to reviews/ on 2026-05-12 (PR #review-photos-reclassify-plan)';

const newMeta = {
  lastUpdated: '2026-05-12',
  sources: {
    google: {
      name: 'Google Business Profile',
      listingId: oldMeta.googleListingId || '0x8b077922f41c72e9:0x553def80f47c770e',
      businessName: 'Universal Appliances Repair Group INC',
      totalReviewsOnListing: oldMeta.totalReviewsOnListing || 78,
      capturedCount: oldMeta.capturedCount || 78,
      ratingAverage: 5.0,
      captureMethod: googleCaptureMethod,
    },
    yelp: {
      name: 'Yelp',
      businessUrl: 'https://www.yelp.com/biz/universal-appliances-repair-tustin',
      totalReviewsOnListing: 4,
      capturedCount: 4,
      ratingAverage: 4.0,
      ratingDistribution: { '5': 3, '4': 0, '3': 0, '2': 0, '1': 1 },
      captureMethod: 'User-supplied screenshot + Yelp listing capture on 2026-05-12',
    },
  },
  policyNotes: oldMeta.policyNotes || [],
};

// Update the policyNotes array
const policyNotes = newMeta.policyNotes;

// Replace Google-only location note
const locationOld = 'Reviewer city not exposed by Google. All locations standardized to \'Orange County, CA\' per project rule.';
const locationNew = 'Location policy is source-specific. Google records: city not exposed by Google, all standardized to \'Orange County, CA\'. Yelp records: use the city displayed on the reviewer\'s Yelp profile (real OC cities like Dana Point, Anaheim, Irvine).';
const locIdx = policyNotes.findIndex(n => n.includes('Reviewer city not exposed by Google') || n.includes('All locations standardized'));
if (locIdx !== -1) { policyNotes[locIdx] = locationNew; console.log('Updated location policyNote.'); }
else if (!policyNotes.some(n => n.includes('Location policy is source-specific'))) {
  policyNotes.push(locationNew); console.log('Added location policyNote.');
}

// Replace all-5-star note
const starsOld = 'All reviews are 5-star (verified on listing).';
const starsNew = 'Rating filter is enforced by display rule, not by capture. All Google records (78) are 5-star; Yelp has 3 × 5-star + 1 × 1-star captured. The 1-star reviewer (Tony B.) is from San Bernardino, CA — outside the OC service area, which likely explains the \'didn\'t show up\' complaint (logistics, not service quality). The 1-star record is captured for accurate rating math but never displayed as a testimonial (see testimonial-selection.md step 1).';
const starsIdx = policyNotes.findIndex(n => n.includes('All reviews are 5-star') || n.includes('Rating filter is enforced'));
if (starsIdx !== -1) { policyNotes[starsIdx] = starsNew; console.log('Updated stars policyNote.'); }
else if (!policyNotes.some(n => n.includes('Rating filter is enforced'))) {
  policyNotes.push(starsNew); console.log('Added stars policyNote.');
}

// Add source-field schema note
const schemaNote = 'Schema: every record has a \'source\' field (\'google\' | \'yelp\'). Yelp records may have a \'previousBody\' field for updated reviews. Records linked across sources have a \'_crossSourceMatch\' field pointing to the corresponding record\'s id.';
if (!policyNotes.some(n => n.includes('source\' field') && n.includes('previousBody'))) {
  policyNotes.push(schemaNote); console.log('Added schema policyNote.');
}

// Add AggregateRating scope note
const aggNote = 'AggregateRating in HTML schema markup is Google-only (5.0 × 78). Yelp is not folded into AggregateRating due to small sample size, 4.0 average, and Google\'s discouragement of mixed-source aggregates. Yelp may be surfaced as a separate visual trust signal.';
if (!policyNotes.some(n => n.includes('AggregateRating in HTML schema markup is Google-only'))) {
  policyNotes.push(aggNote); console.log('Added AggregateRating policyNote.');
}

data._meta = newMeta;
console.log('_meta restructured to multi-source shape.');

// ── Step 3: Add 4 Yelp records ─────────────────────────────────────────────

const yelpRecords = [
  {
    id: 'yelp-linda-b-2025-05',
    source: 'yelp',
    name: 'Linda B.',
    location: 'Dana Point, CA',
    appliance: 'dishwasher',
    brand: null,
    rating: 5,
    approxDate: '2025-05',
    dateText: 'May 2, 2025',
    body: 'AG was thorough and professional and best of all he quickly fixed my dishwasher. I will definitely use him again.',
    bodyStatus: 'complete',
    bodyHasTypos: false,
    profilePhoto: null,
    reviewPhoto: null,
    _note: 'Yelp profile shows 0 photos for this reviewer.',
  },
  {
    id: 'yelp-william-l-2024-08',
    source: 'yelp',
    name: 'William L.',
    location: 'Anaheim, CA',
    appliance: 'cooktop',
    brand: null,
    rating: 5,
    approxDate: '2024-08',
    dateText: 'Aug 23, 2024 (Updated review)',
    body: 'We had a cooktop installed, and the wiring was a little short on the model we bought and the workmen had to get additional wiring to complete the job and did a wonderful job installing the cooktop. His price was so considerate I gave him a tip.',
    previousBody: 'Old cooktop needed to be replaced. The old cooktop was 36 inch and the new one was also advertised as 36 inch but was actually 34 inches. The serviceman pulled out the old one out only to find the new one was too small and replaced the old one back in the hole. He helped me order the correct cooktop and will come back to reinstall it. Great service and a great value highly recommended.',
    bodyStatus: 'complete',
    bodyHasTypos: false,
    profilePhoto: null,
    reviewPhoto: null,
    _note: 'Yelp updated review (previous Aug 17, 2024). No photo attached to this review on Yelp (reviewer\'s profile photo count is lifetime, not per-review). Note: this is a cooktop installation/replacement, not a repair — still credible trust signal.',
  },
  {
    id: 'yelp-mrs-d-2024-08',
    source: 'yelp',
    name: 'mrs d.',
    location: 'Irvine, CA',
    appliance: 'range,dishwasher',
    brand: null,
    rating: 5,
    approxDate: '2024-08',
    dateText: 'Aug 26, 2024',
    body: 'AG did a great job moving my gas range from one house to another house. He also uninstalled a dishwasher for me. Various contractors lately have damaged my house which created more work for me, thus, I am extremely pleased that AG and his helpers were very careful. I appreciate that he was punctual and did the work in the time he said it would take.',
    bodyStatus: 'complete',
    bodyHasTypos: false,
    profilePhoto: null,
    reviewPhoto: null,
    _note: 'Service type is appliance moving + uninstall, not repair. Display preferred on city pages (Irvine) over service hubs. No photo attached to this review on Yelp (the 8 photos shown on reviewer\'s profile are lifetime across all her Yelp reviews, not attached to this one).',
  },
  {
    id: 'yelp-tony-b-2024-08',
    source: 'yelp',
    name: 'Tony B.',
    location: 'San Bernardino, CA',
    appliance: null,
    brand: null,
    rating: 1,
    approxDate: '2024-08',
    dateText: 'Aug 17, 2024',
    body: 'Had scheduled an appointment for 3pm-4pm today. Never showed up and tried to reach out to them multiple times.',
    bodyStatus: 'complete',
    bodyHasTypos: false,
    profilePhoto: null,
    reviewPhoto: null,
    _note: '1-star review. Reviewer\'s displayed location is San Bernardino, CA — outside the business\'s Orange County service area, which likely explains the no-show (logistics/range mismatch, not a service quality issue). Captured for accurate rating math; never displayed as testimonial (filtered by 5-star precondition in testimonial-selection.md step 1).',
  },
];

let added = 0;
for (const rec of yelpRecords) {
  if (!data.reviews.find(r => r.id === rec.id)) {
    data.reviews.push(rec);
    added++;
    console.log(`Added Yelp record: ${rec.id}`);
  } else {
    console.log(`Skipped (already exists): ${rec.id}`);
  }
}
console.log(`Added ${added} Yelp records. Total reviews: ${data.reviews.length}.`);

// ── Write back ──────────────────────────────────────────────────────────────

fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8');
console.log('\nDone.');
