#!/usr/bin/env node
/**
 * Builds pages/testimonials.html from data/testimonials.json.
 *
 * Counts (GBP total, displayed cards, etc.) are computed from the JSON —
 * not hardcoded — so the next time the GBP review count changes, only the
 * JSON needs updating and re-running this script produces a fully-synced
 * testimonials.html.
 *
 * Renders two card variants:
 *   - Quote cards (.t-card) for records with `bodyStatus: complete`
 *   - No-quote cards (.t-card--no-quote) for `photo-only` / `no-body` records
 *
 * `nameFlag: 'non-person'` records (e.g. business reviewers like Jeff Lane
 * Songs) ARE displayed on testimonials.html — the _note on those records
 * excludes them from brand / service hub pages, not from the dedicated
 * testimonials page.
 */
const fs = require('fs');
const path = require('path');

const pool = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/testimonials.json'), 'utf8'));

// ── Config ──────────────────────────────────────────────────────────────────
const META               = pool._meta.sources.google;
const REVIEW_COUNT       = META.capturedCount;            // drives every count surface on the page; sourced from data/testimonials.json
const YEARS_IN_BUSINESS  = '9+';                          // not in JSON; bump here when the business hits 10+

// ── Body cleanups (one-off typo edits keyed by review id) ───────────────────
const TYPO_EDITS = {
  'google-danette-vanover-2026-01': "Have used Appliance Repair in the past. AG is a 5-star technician. On time, polite. Offered a detailed description of the problem. For a 12-year-old washer the repair cost would far exceed in comparison to today's market value of a new washer. Appreciated the up-front honesty. At no charge he did a minor adjustment to prevent stagnant water accumulating in the soap dispenser thus eliminating the foul odor emitting in my washer. Have no problem calling AG in the future. It's reassuring to find a service with integrity that is honest up front. Thank you. D. Vanover",
  'google-kelly-heyden-2025-07': "We had an issue where our washing machine would not drain. AG came and was communicative about his timing. He diagnosed the problem, found the part and said he&#39;d return the following day once he had the part. Again, he was communicating the second day and completed the job in one hour. He was prompt, efficient and helped get our washing machine up and running as quickly as possible for our busy family of 4. Thank you!!",
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

function getBody(r) {
  if (r.bodyHasTypos && TYPO_EDITS[r.id]) return TYPO_EDITS[r.id];
  return r.body || '';
}

function getCategories(r) {
  if (!r.appliance) return 'general';
  const cats = new Set();
  for (const ap of r.appliance.split(',').map(s => s.trim())) {
    if (ap === 'washer') cats.add('washer');
    else if (ap === 'dryer') cats.add('dryer');
    else if (ap === 'refrigerator' || ap === 'freezer') cats.add('refrigerator');
    else if (ap === 'dishwasher') cats.add('dishwasher');
    else if (['oven','stove','cooktop','range'].includes(ap)) cats.add('oven-stove');
    else cats.add('general');
  }
  return [...cats].join(' ');
}

function getInitials(name) {
  const p = name.trim().split(/\s+/);
  return p.length >= 2 ? (p[0][0] + p[p.length-1][0]).toUpperCase() : name.slice(0,2).toUpperCase();
}

function getDateLabel(r) {
  if (!r.approxDate) return 'Google Review';
  const [year, month] = r.approxDate.split('-');
  const months = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `Google Review · ${months[parseInt(month)]} ${year}`;
}

function getApplianceLabel(r) {
  if (!r.appliance) return 'Verified Customer';
  const map = { washer:'Washing Machine Repair', dryer:'Dryer Repair', refrigerator:'Refrigerator Repair',
    dishwasher:'Dishwasher Repair', oven:'Oven Repair', stove:'Stove Repair',
    cooktop:'Cooktop Repair', range:'Range Repair', freezer:'Freezer Repair', microwave:'Microwave Repair',
    'wine cooler':'Wine Cooler Repair', 'garbage disposal':'Garbage Disposal Repair' };
  const parts = [...new Set(r.appliance.split(',').map(s => map[s.trim()] || 'Appliance Repair'))];
  return parts.join(' &amp; ');
}

function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

const GOOGLE_SVG = `<svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>`;

// ── Record selection ────────────────────────────────────────────────────────
// All Google reviews are eligible for testimonials.html.
// `nameFlag: 'non-person'` records (Jeff Lane Songs) are NOT excluded here —
// the _note on those records excludes them from hub pages, not from this page.
const allGoogleReviews = pool.reviews.filter(r => r.source === 'google');
const quoteReviews     = allGoogleReviews.filter(r => r.bodyStatus === 'complete');
const noQuoteReviews   = allGoogleReviews.filter(r =>
  r.bodyStatus === 'photo-only' || r.bodyStatus === 'no-body'
);

function renderCard(r) {
  const body = getBody(r);
  const initials = getInitials(r.name);
  const cats = getCategories(r);
  const dateLabel = getDateLabel(r);
  const appLabel = getApplianceLabel(r);
  return `        <div class="t-card" data-category="${cats}">
          <div class="t-stars" role="img" aria-label="5 out of 5 stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
          <div class="t-source">${GOOGLE_SVG} ${esc(dateLabel)}</div>
          <p class="t-quote">&ldquo;${esc(body)}&rdquo;</p>
          <div class="t-footer">
            <div class="t-avatar" aria-hidden="true">${esc(initials)}</div>
            <div>
              <div class="t-name">${esc(r.name)}</div>
              <div class="t-role">${appLabel}</div>
            </div>
          </div>
        </div>`;
}

function renderNoQuoteCard(r) {
  const initials = getInitials(r.name);
  const cats = getCategories(r);
  const dateLabel = getDateLabel(r);
  const appLabel = getApplianceLabel(r);
  // Only embed reviewPhoto if it's a local asset (not a Google CDN URL that may expire)
  const photoHtml = (r.reviewPhoto && !r.reviewPhoto.startsWith('http'))
    ? `\n          <img class="t-review-photo" src="../${r.reviewPhoto}" alt="Photo from ${esc(r.name)}'s review" width="125" height="125" loading="lazy">`
    : '';
  return `        <div class="t-card t-card--no-quote" data-category="${cats}">
          <div class="t-stars" role="img" aria-label="5 out of 5 stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
          <div class="t-source">${GOOGLE_SVG} ${esc(dateLabel)}</div>${photoHtml}
          <div class="t-footer">
            <div class="t-avatar" aria-hidden="true">${esc(initials)}</div>
            <div>
              <div class="t-name">${esc(r.name)}</div>
              <div class="t-role">${appLabel}</div>
            </div>
          </div>
        </div>`;
}

// JSON-LD review[] only includes records with a body (the schema requires reviewBody)
const reviewSchemaEntries = quoteReviews.map(r => `      {
        "@type": "Review",
        "author": { "@type": "Person", "name": ${JSON.stringify(r.name)} },
        "reviewBody": ${JSON.stringify(getBody(r))},
        "reviewRating": { "@type": "Rating", "ratingValue": "5", "bestRating": "5" }
      }`).join(',\n');

const cardsHtml = [
  ...quoteReviews.map(renderCard),
  ...noQuoteReviews.map(renderNoQuoteCard),
].join('\n');

const filterAllCount = quoteReviews.length + noQuoteReviews.length;

// ── Preserve nav + footer from the existing testimonials.html ───────────────
const currentPage = fs.readFileSync(path.join(__dirname, '../pages/testimonials.html'), 'utf8');
const navMatch = currentPage.match(/<body>([\s\S]*?)<div class="page-hero">/);
const navHtml = navMatch ? navMatch[1] : '';
const footerMatch = currentPage.match(/(  <footer[\s\S]*<\/footer>)/);
const footerHtml = footerMatch ? footerMatch[1] : '';

// Stats bar inline style — fixed height + flex centering so number rows have
// uniform vertical metrics regardless of glyph ("★ 5.0" vs "78" vs "9+").
const STAT_NUMBER_STYLE = 'font-size:32px;font-weight:800;color:var(--brand-text);letter-spacing:-1px;line-height:1.15;height:38px;display:flex;align-items:center;justify-content:center;';

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-TSFHKJ6ZEK"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-TSFHKJ6ZEK');
</script>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="icon" href="../favicon.ico" sizes="any" />
  <link rel="apple-touch-icon" href="../apple-touch-icon.png" />
  <link rel="icon" type="image/png" sizes="192x192" href="../icon-192.png" />
  <title>Customer Reviews — Appliance Repair Orange County | Universal Appliances Repair</title>
  <meta name="description" content="${REVIEW_COUNT} verified 5-star Google reviews for Universal Appliances Repair in Orange County, CA. See what customers say about our refrigerator, washer, dryer, and dishwasher repair." />
  <link rel="canonical" href="https://fixappliancesfast.com/pages/testimonials.html" />
  <meta property="og:site_name" content="Universal Appliances Repair" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="Customer Reviews — Appliance Repair Orange County | Universal Appliances Repair" />
  <meta property="og:description" content="${REVIEW_COUNT} verified 5-star Google reviews for Universal Appliances Repair in Orange County, CA." />
  <meta property="og:url" content="https://fixappliancesfast.com/pages/testimonials.html" />
  <meta property="og:image" content="https://fixappliancesfast.com/images/hero-homepage.jpg" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Customer Reviews — Appliance Repair Orange County | Universal Appliances Repair" />
  <meta name="twitter:description" content="${REVIEW_COUNT} verified 5-star Google reviews for Universal Appliances Repair in Orange County, CA." />
  <meta name="twitter:image" content="https://fixappliancesfast.com/images/hero-homepage.jpg" />

  <!-- SCHEMA: LocalBusiness + AggregateRating + all reviews -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Universal Appliances Repair",
    "legalName": "Universal Appliances Repair Group Inc.",
    "url": "https://fixappliancesfast.com/",
    "telephone": "+1-949-629-5365",
    "email": "info@fixappliancesfast.com",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "10832 Asbury Avenue",
      "addressLocality": "Stanton",
      "addressRegion": "CA",
      "postalCode": "90680",
      "addressCountry": "US"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "5.0",
      "reviewCount": "${REVIEW_COUNT}",
      "bestRating": "5",
      "worstRating": "1"
    },
    "review": [
${reviewSchemaEntries}
    ]
  }
  </script>

  <!-- SCHEMA: BreadcrumbList -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://fixappliancesfast.com/" },
      { "@type": "ListItem", "position": 2, "name": "Testimonials", "item": "https://fixappliancesfast.com/pages/testimonials.html" }
    ]
  }
  </script>

  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="../shared.css" />

  <style>
    /* TESTIMONIALS GRID */
    .testimonials-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 32px; }
    .t-card { background: #fff; border-radius: 16px; box-shadow: 0 2px 20px rgba(0,0,0,0.07); padding: 28px 26px; display: flex; flex-direction: column; }
    .t-stars { color: #f59e0b; font-size: 15px; letter-spacing: 2px; margin-bottom: 8px; }
    .t-source { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; color: #888; margin-bottom: 14px; }
    .t-quote { font-size: 13.5px; color: #444; line-height: 1.8; font-style: italic; flex: 1; }
    .t-card--no-quote .t-footer { margin-top: auto; }
    .t-review-photo { width: 80px; height: 80px; object-fit: cover; border-radius: 8px; margin: 4px 0 14px; }
    .t-footer { display: flex; align-items: center; gap: 12px; margin-top: 20px; }
    .t-avatar { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; color: #fff; background: #444444; flex-shrink: 0; }
    .t-name { font-size: 13px; font-weight: 700; color: #111; }
    .t-role { font-size: 11.5px; color: #666; margin-top: 2px; }

    /* FILTER PILLS */
    .filter-bar { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 32px; justify-content: center; }
    .filter-pill { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 20px; padding: 8px 18px; font-size: 13px; font-weight: 500; color: #555; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
    .filter-pill:hover { border-color: #e84c1e; color: #e84c1e; }
    .filter-pill.active { background: #e84c1e; border-color: #e84c1e; color: #fff; font-weight: 600; }

    /* NO RESULTS */
    .no-results { display: none; text-align: center; padding: 48px 24px; color: #888; font-size: 14px; grid-column: 1 / -1; }

    @media (max-width: 1024px) { .testimonials-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 640px) {
      .testimonials-grid { grid-template-columns: 1fr; }
      .filter-pill { font-size: 12px; padding: 7px 14px; }
    }
  </style>
</head>
<body>
${navHtml}  <div class="page-hero">
    <h1>What Our Customers Say</h1>
    <p>${REVIEW_COUNT} verified 5-star Google reviews from Orange County homeowners. Filter by appliance to find repairs like yours.</p>
  </div>

  <!-- STATS BAR -->
  <section class="section-white" style="padding:32px 24px;border-bottom:1px solid #f0f0f0;">
    <div class="container-lg" style="display:flex;justify-content:center;gap:60px;flex-wrap:wrap;text-align:center;">
      <div>
        <div style="${STAT_NUMBER_STYLE}">&#9733; 5.0</div>
        <div style="font-size:12px;color:#888;margin-top:4px;">Average Google Rating</div>
      </div>
      <div>
        <div style="${STAT_NUMBER_STYLE}">${REVIEW_COUNT}</div>
        <div style="font-size:12px;color:#888;margin-top:4px;">Verified Google Reviews</div>
      </div>
      <div>
        <div style="${STAT_NUMBER_STYLE}">${YEARS_IN_BUSINESS}</div>
        <div style="font-size:12px;color:#888;margin-top:4px;">Years in Business</div>
      </div>
    </div>
  </section>

  <!-- FILTER + GRID -->
  <section class="section section-gray">
    <div class="container-lg">

      <!-- Filter pills -->
      <div class="filter-bar" role="group" aria-label="Filter reviews by appliance">
        <button class="filter-pill active" data-filter="all">All (${filterAllCount})</button>
        <button class="filter-pill" data-filter="washer">Washer</button>
        <button class="filter-pill" data-filter="dryer">Dryer</button>
        <button class="filter-pill" data-filter="refrigerator">Refrigerator &amp; Freezer</button>
        <button class="filter-pill" data-filter="dishwasher">Dishwasher</button>
        <button class="filter-pill" data-filter="oven-stove">Oven &amp; Stove</button>
        <button class="filter-pill" data-filter="general">General</button>
      </div>

      <!-- Review cards -->
      <div class="testimonials-grid" id="reviews-grid">
${cardsHtml}
        <p class="no-results" id="no-results">No reviews match this filter.</p>
      </div>

    </div>
  </section>

  <!-- CTA -->
  <section class="section section-white" style="text-align:center;">
    <div class="container">
      <h2 class="h2-standard">Ready to experience the difference?</h2>
      <p style="font-size:13.5px;color:#888;margin-top:12px;line-height:1.7;">Join hundreds of satisfied customers across Orange County.</p>
      <div style="margin-top:24px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
        <a href="contact.html" class="btn-primary">Book a Repair</a>
        <a href="tel:+19496295365" style="display:inline-block;background:#111;color:#fff;font-size:13px;font-weight:700;padding:12px 28px;border-radius:8px;text-decoration:none;">Call (949) 629-5365</a>
      </div>
    </div>
  </section>

${footerHtml}

  <script>
    // Filter pill logic
    const pills = document.querySelectorAll('.filter-pill');
    const cards = document.querySelectorAll('#reviews-grid .t-card');
    const noResults = document.getElementById('no-results');

    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        pills.forEach(p => { p.classList.remove('active'); p.removeAttribute('aria-pressed'); });
        pill.classList.add('active');
        pill.setAttribute('aria-pressed', 'true');

        const filter = pill.dataset.filter;
        let visible = 0;
        cards.forEach(card => {
          const cats = card.dataset.category || '';
          const show = filter === 'all' || cats.split(' ').includes(filter);
          card.style.display = show ? '' : 'none';
          if (show) visible++;
        });
        noResults.style.display = visible === 0 ? 'block' : 'none';
      });
    });
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(__dirname, '../pages/testimonials.html'), html, 'utf8');
console.log(`Written pages/testimonials.html with ${quoteReviews.length} quote cards + ${noQuoteReviews.length} no-quote cards = ${filterAllCount} total. AggregateRating reviewCount = ${REVIEW_COUNT}.`);
