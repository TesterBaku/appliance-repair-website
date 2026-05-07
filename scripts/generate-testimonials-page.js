#!/usr/bin/env node
/**
 * Generates pages/testimonials.html from data/testimonials.json
 * Run: node scripts/generate-testimonials-page.js
 */
const fs = require('fs');
const path = require('path');

const pool = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/testimonials.json'), 'utf8'));

// Light edits for bodyHasTypos:true reviews (display-only corrections)
const TYPO_EDITS = {
  'google-danette-vanover-2026-01': "Have used Appliance Repair in the past. AG is a 5-star technician. On time, polite. Offered a detailed description of the problem. For a 12-year-old washer the repair cost would far exceed in comparison to today's market value of a new washer. Appreciated the up-front honesty. At no charge he did a minor adjustment to prevent stagnant water accumulating in the soap dispenser thus eliminating the foul odor emitting in my washer. Have no problem calling AG in the future. It's reassuring to find a service with integrity that is honest up front. Thank you. D. Vanover",
  'google-kelly-heyden-2025-07': "We had an issue where our washing machine would not drain. AG came and was communicative about his timing. He diagnosed the problem, found the part and said he'd return the following day once he had the part. Again, he was communicating the second day and completed the job in one hour. He was prompt, efficient and helped get our washing machine up and running as quickly as possible for our busy family of 4. Thank you!!",
  'google-patricio-jr-villanueva-2025-12': "Thank you for fixing my LG washer",
  'google-arzuman-qarayev-2025-05': "Thank you for fixing my Frigidaire fridge. Did not cool. Fast and good service",
  'google-kenan-ken-2026-03': "Thank you AG for fixing my old Viking oven. Recommended",
  'google-brian-brassil-2026-03': "AG fixed our fridge same day. Thank you",
  'google-elvin-mammadov-2026-01': "The best company in Orange County. Recommended AG technician.",
  'google-lilya-raupova-2025-05': "Thank you for fixing my Sub-Zero refrigerator. AG was on time. Changed fan motor. Fast service. I will call them again if I need something repaired!",
  'google-george-mendoza-2026-04': "Thank you for fixing my Samsung range",
  'google-clifford-wright-2026-04': "Very courteous, knowledgeable and fast. Great service. Recommend him!",
  'google-suzan-hier-2025-05': "They were fast and efficient and very pleasant. This is the second time I have used their services and will not hesitate to use them again.",
  'google-susie-arii-2026-04': "Thank you AG for servicing my washer and dryer!!!",
  'google-mark-rivera-2026-03': "Thank you for fixing my Whirlpool washer",
};

// Map pool appliance field → filter categories (can be multiple, space-separated)
function getCategories(review) {
  if (!review.appliance) return 'general';
  const appliances = review.appliance.split(',').map(s => s.trim());
  const cats = new Set();
  for (const ap of appliances) {
    if (ap === 'washer') cats.add('washer');
    else if (ap === 'dryer') cats.add('dryer');
    else if (ap === 'refrigerator' || ap === 'freezer') cats.add('refrigerator');
    else if (ap === 'dishwasher') cats.add('dishwasher');
    else if (['oven','stove','cooktop','range'].includes(ap)) cats.add('oven-stove');
    else if (ap === 'microwave') cats.add('general');
    else cats.add('general');
  }
  return [...cats].join(' ');
}

// Get display body (with typo edits applied)
function getBody(review) {
  if (review.bodyHasTypos && TYPO_EDITS[review.id]) return TYPO_EDITS[review.id];
  return review.body;
}

// Get initials from name
function getInitials(name) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

// Date label
function getDateLabel(review) {
  if (!review.approxDate) return 'Google Review';
  const [year, month] = review.approxDate.split('-');
  const months = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `Google Review · ${months[parseInt(month)]} ${year}`;
}

// Appliance label for card footer
function getApplianceLabel(review) {
  if (!review.appliance) return 'Appliance Repair';
  const parts = review.appliance.split(',').map(s => {
    s = s.trim();
    const map = {
      washer: 'Washer Repair', dryer: 'Dryer Repair', refrigerator: 'Refrigerator Repair',
      dishwasher: 'Dishwasher Repair', oven: 'Oven Repair', stove: 'Stove Repair',
      cooktop: 'Cooktop Repair', range: 'Range Repair', freezer: 'Freezer Repair',
      microwave: 'Microwave Repair',
    };
    return map[s] || 'Appliance Repair';
  });
  return [...new Set(parts)].join(' & ');
}

// Google icon SVG (inline, same as current page)
const GOOGLE_SVG = `<svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>`;

// HTML escape
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Filter complete-body reviews, exclude non-persons
const reviews = pool.reviews.filter(r =>
  r.bodyStatus === 'complete' && r.nameFlag !== 'non-person'
);

console.log(`Generating ${reviews.length} review cards...`);

// Generate JSON-LD review array
const reviewSchema = reviews.map(r => ({
  '@type': 'Review',
  author: { '@type': 'Person', name: r.name },
  reviewBody: getBody(r),
  reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5' },
}));

// Generate HTML cards
function renderCard(r) {
  const body = getBody(r);
  const initials = getInitials(r.name);
  const cats = getCategories(r);
  const dateLabel = getDateLabel(r);
  const appLabel = getApplianceLabel(r);
  return `
        <div class="t-card" data-category="${cats}">
          <div class="t-stars" role="img" aria-label="5 out of 5 stars">★★★★★</div>
          <div class="t-source">${GOOGLE_SVG} ${esc(dateLabel)}</div>
          <p class="t-quote">"${esc(body)}"</p>
          <div class="t-footer">
            <div class="t-avatar" aria-hidden="true">${esc(initials)}</div>
            <div>
              <div class="t-name">${esc(r.name)}</div>
              <div class="t-role">${esc(appLabel)}</div>
            </div>
          </div>
        </div>`;
}

const cardsHtml = reviews.map(renderCard).join('\n');
const schemaJson = JSON.stringify(reviewSchema, null, 2);

// Output parts for embedding
const output = {
  reviewCount: reviews.length,
  schemaJson,
  cardsHtml,
};

fs.writeFileSync(
  path.join(__dirname, '../scripts/_testimonials-generated.json'),
  JSON.stringify(output, null, 2),
  'utf8'
);

console.log(`Done. ${reviews.length} cards generated.`);
console.log('Output written to scripts/_testimonials-generated.json');
