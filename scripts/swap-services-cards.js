#!/usr/bin/env node
/**
 * Swaps 7 service card images on pages/services.html from stock to real photos.
 * Also updates og:image and twitter:image in <head>.
 * Run from project root. Idempotent.
 */

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'pages', 'services.html');
let html = fs.readFileSync(FILE, 'utf8');

// ── Meta tags ────────────────────────────────────────────────────────────────

html = html.replace(
  /(<meta property="og:image" content=")([^"]+)(")/,
  '$1https://fixappliancesfast.com/images/real/reviews/range-roger-antonie.webp$3'
);
html = html.replace(
  /(<meta name="twitter:image" content=")([^"]+)(")/,
  '$1https://fixappliancesfast.com/images/real/reviews/range-roger-antonie.webp$3'
);
console.log('Updated og:image + twitter:image');

// ── Card swaps ───────────────────────────────────────────────────────────────
// Pattern: find the <picture>...</picture> block for each stock image and replace it.

function swapCard(oldImgBase, newSrc, newAlt, w, h) {
  // Match the full <picture>…</picture> block containing the old stock img
  const re = new RegExp(
    `<picture>[\\s\\S]*?src="\\.\\./images/${oldImgBase}(?:\\.jpg|\\.webp)"[\\s\\S]*?<\\/picture>`,
    'g'
  );
  const replacement = `<picture>\n  <img class="service-img" src="${newSrc}" alt="${newAlt}" loading="lazy" width="${w}" height="${h}" />\n</picture>`;
  const prev = html;
  html = html.replace(re, replacement);
  if (html === prev) {
    console.error(`  ERROR: no match for ${oldImgBase}`);
  } else {
    console.log(`  swapped: ${oldImgBase} → ${newSrc.split('/').pop()}`);
  }
}

swapCard(
  'fridge-sidebyside',
  '../images/real/reviews/refrigerator-william-nugent.webp',
  'Stainless built-in side-by-side refrigerator serviced by Universal Appliances Repair, Orange County',
  125, 125
);

swapCard(
  'oven-stainless-range',
  '../images/real/reviews/range-roger-antonie.webp',
  'Pro-style stainless gas range repaired by Universal Appliances Repair, Orange County',
  125, 125
);

swapCard(
  'kitchen-with-washer',
  '../images/real/reviews/washer-michele-ohanian.webp',
  'LG front-load washer and dryer pair serviced by Universal Appliances Repair, Orange County',
  125, 125
);

swapCard(
  'washer-dryer-pair',
  '../images/real/reviews/dryer-cheryl-lemire.webp',
  'Front-load dryer control panel — repair by Universal Appliances Repair, Orange County',
  125, 125
);

swapCard(
  'dishwasher-open',
  '../images/real/reviews/dishwasher-karen-myhra.webp',
  'Stainless built-in dishwasher serviced by Universal Appliances Repair, Orange County',
  125, 125
);

swapCard(
  'wine-cooler-glasses',
  '../images/real/business/completed-repair-wine-cooler-undercounter-drawer.jpg',
  'Undercounter wine cooler drawer unit serviced by Universal Appliances Repair, Orange County',
  750, 1000
);

swapCard(
  'repair-tech',
  '../images/real/business/completed-repair-disposal-kitchenaid-replacement.jpg',
  'KitchenAid garbage disposal replacement by Universal Appliances Repair, Orange County',
  750, 1000
);

fs.writeFileSync(FILE, html, 'utf8');
console.log('\nDone. services.html updated.');
