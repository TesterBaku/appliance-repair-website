#!/usr/bin/env node
/**
 * One-shot script: update data/testimonials.json to point the 13
 * reclassified review photos at their new local paths under images/real/reviews/.
 * Sets profilePhoto: null, updates reviewPhoto, replaces _note.
 * Also updates _meta fields.
 * Run from project root.
 */

const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '..', 'data', 'testimonials.json');
const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));

// ── Record-level changes ─────────────────────────────────────────────────────

const changes = [
  {
    id: 'google-arzuman-qarayev-2025-05',
    reviewPhoto: 'images/real/reviews/refrigerator-frigidaire-arzuman-qarayev.webp',
    note: 'Non-native English. Review photo shows a white Frigidaire top-mount refrigerator.',
  },
  {
    id: 'google-cheryl-lemire-2026-04',
    reviewPhoto: 'images/real/reviews/dryer-cheryl-lemire.webp',
    note: 'Review photo shows a white front-load dryer control panel close-up.',
  },
  {
    id: 'google-craig-tudor-2026-02',
    reviewPhoto: 'images/real/reviews/washer-craig-tudor.webp',
    note: 'Review photo shows a white washer/dryer with a black door panel.',
  },
  {
    id: 'google-darina-martirosyan-2026-03',
    reviewPhoto: 'images/real/reviews/microwave-darina-martirosyan.webp',
    note: 'Review photo shows a stainless built-in microwave in wood cabinetry.',
  },
  {
    id: 'google-elizabeth-lovejoy-2026-04-30',
    reviewPhoto: 'images/real/reviews/cooktop-elizabeth-lovejoy.webp',
    note: 'Review photo shows a gas cooktop with terracotta-tile backsplash.',
  },
  {
    id: 'google-george-2025-05',
    reviewPhoto: 'images/real/reviews/dishwasher-george.webp',
    appendNote: 'Photo file: images/real/reviews/dishwasher-george.webp (extracted from screenshot).',
  },
  {
    id: 'google-karen-myhra-2025-11',
    reviewPhoto: 'images/real/reviews/dishwasher-karen-myhra.webp',
    note: 'Review photo shows a stainless built-in dishwasher under a granite countertop.',
  },
  {
    id: 'google-michele-ohanian-2025-12',
    reviewPhoto: 'images/real/reviews/washer-michele-ohanian.webp',
    note: 'Review photo shows a front-load washer/dryer pair. Reviewer has 13 reviews, 2 photos — second photo may exist on the listing.',
  },
  {
    id: 'google-patricio-jr-villanueva-2025-12',
    reviewPhoto: 'images/real/reviews/washer-lg-patricio-villanueva.webp',
    note: 'Non-native English. \'fix\' should be \'fixing\'. Review photo shows an LG front-load washer with a paper receipt on top — light trust signal.',
  },
  {
    id: 'google-rick-deangelo-2025-05',
    reviewPhoto: 'images/real/reviews/washer-rick-deangelo.webp',
    note: 'Review photo shows a black front-load washer.',
  },
  {
    id: 'google-roger-antonie-2026-03',
    reviewPhoto: 'images/real/reviews/range-roger-antonie.webp',
    note: 'Review photo shows a high-end stainless gas range with red knobs (pro-style).',
  },
  {
    id: 'google-theresa-robinson-2026-02',
    reviewPhoto: 'images/real/reviews/range-theresa-robinson.webp',
    note: 'Photo-only review — no body text. Photo shows a stainless pro-style range with red knobs. Usable as hub-page imagery only; never as a quoted testimonial.',
  },
  {
    id: 'google-william-nugent-2026-01',
    reviewPhoto: 'images/real/reviews/refrigerator-william-nugent.webp',
    note: 'Review photo shows a stainless built-in side-by-side refrigerator.',
  },
];

let updatedCount = 0;

for (const change of changes) {
  const record = data.reviews.find(r => r.id === change.id);
  if (!record) {
    console.error(`MISSING record: ${change.id}`);
    process.exit(1);
  }

  record.profilePhoto = null;
  record.reviewPhoto = change.reviewPhoto;

  if (change.note !== undefined) {
    record._note = change.note;
  } else if (change.appendNote) {
    record._note = (record._note ? record._note + ' ' : '') + change.appendNote;
  }

  updatedCount++;
  console.log(`  updated  ${change.id}`);
}

// ── _meta changes ────────────────────────────────────────────────────────────

const meta = data._meta;

// lastUpdated
meta.lastUpdated = '2026-05-12';

// captureMethod — update date and append note
meta.captureMethod = meta.captureMethod
  .replace('2026-05-06', '2026-05-12')
  + '; 13 review photos relocated from reviewer-profiles/ to reviews/ and renamed by appliance on 2026-05-12 (PR: chore/move-review-photos)';

// policyNotes — find and replace the reviewer-profiles line
const profilesLineOld = 'Reviewer profile photos (.webp avatars) for 13 reviewers stored at images/real/reviewer-profiles/. Each is referenced via its profilePhoto field where available.';
const profilesLineNew = 'Review photos (.webp) for 13 reviewers stored at images/real/reviews/, named [appliance]-[brand-if-confirmed]-[reviewer].webp. Each is referenced via its reviewPhoto field. The profilePhoto field is currently null for every record — no actual reviewer avatars have been captured.';

const idx1 = meta.policyNotes.indexOf(profilesLineOld);
if (idx1 === -1) {
  console.error('MISSING policyNotes line: reviewer-profiles reference');
  process.exit(1);
}
meta.policyNotes[idx1] = profilesLineNew;
console.log('  updated  _meta.policyNotes[reviewer-profiles line]');

// policyNotes — find and replace the review-photos extraction line
const extractLineOld = 'Review photos: 7 captured as Google CDN URLs from initial browser scrape (may need re-download to local before they expire); ~12 more are visible in screenshots but need to be extracted or re-saved as separate files.';
const extractLineNew = 'Review photos: 7 captured as Google CDN URLs from initial browser scrape (may need re-download to local before they expire); 13 previously embedded in screenshots have been extracted and saved locally at images/real/reviews/ (2026-05-12).';

const idx2 = meta.policyNotes.indexOf(extractLineOld);
if (idx2 === -1) {
  console.error('MISSING policyNotes line: review-photos extraction line');
  process.exit(1);
}
meta.policyNotes[idx2] = extractLineNew;
console.log('  updated  _meta.policyNotes[extraction line]');

// policyNotes — add new display-rule entry
const displayRuleNote = 'Display rule for testimonials (mirrors .claude/rules/testimonial-selection.md step 6): a record is quotable as a testimonial only if it satisfies one of (a) has a reviewPhoto and body ≥3 words; (b) no reviewPhoto and body ≥8 words; (c) no reviewPhoto and body <8 words but the body names a specific appliance (refrigerator/fridge/washer/washing machine/dryer/dishwasher/oven/stove/range/cooktop/microwave/freezer/garbage disposal/wine cooler) or brand (Whirlpool/GE/Samsung/LG/Sub-Zero/Wolf/Bosch/Viking/KitchenAid/Maytag/Frigidaire/Kenmore/Thermador/Miele/Dacor). Records with bodyStatus \'photo-only\' or \'no-body\' are never quotable; their photos may be used as imagery. Row-balance and ≤2-overlap rules in the same rules file also apply.';

if (!meta.policyNotes.includes(displayRuleNote)) {
  meta.policyNotes.push(displayRuleNote);
  console.log('  added    _meta.policyNotes[display-rule entry]');
}

// Write back
fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8');
console.log(`\nDone. ${updatedCount} review records updated + _meta patched.`);
