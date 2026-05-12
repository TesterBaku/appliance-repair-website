#!/usr/bin/env node
/**
 * Swaps 7 service hub heroes from stock CSS background-images to real
 * owner-uploaded photos. For each hub:
 *   1. og:image + twitter:image meta updated
 *   2. .hub-hero-bg CSS changed from background-image to object-fit
 *   3. <div class="hub-hero-bg"> replaced with <img> (LCP-optimised)
 *   4. ImageObject JSON-LD added before </body>
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const HUBS = [
  {
    file: 'pages/refrigerator-repair-orange-county.html',
    photo: 'completed-repair-refrigerator-subzero-700bfi.jpg',
    w: 750, h: 1000,
    alt: 'Sub-Zero 700BFI built-in refrigerator during service by Universal Appliances Repair, Orange County',
    caption: 'Sub-Zero built-in refrigerator repair in Orange County, CA — Universal Appliances Repair',
    oldStock: 'fridge-sidebyside',
    objPos: 'center top',
  },
  {
    file: 'pages/washer-repair-orange-county.html',
    photo: 'completed-repair-washer-lg-frontload-door-seal.jpg',
    w: 750, h: 1000,
    alt: 'LG front-load washing machine door seal repair by Universal Appliances Repair, Orange County',
    caption: 'LG front-load washer door seal repair — Universal Appliances Repair, Orange County CA',
    oldStock: 'washer-frontload',
    objPos: 'center center',
  },
  {
    file: 'pages/dryer-repair-orange-county.html',
    photo: 'completed-repair-dryer-whirlpool-duet-electronics.jpg',
    w: 562, h: 1000,
    alt: 'Whirlpool Duet dryer electronics diagnostic by Universal Appliances Repair, Orange County',
    caption: 'Whirlpool Duet dryer electronics repair — Universal Appliances Repair, Orange County CA',
    oldStock: 'washer-dryer-pair',
    objPos: 'center center',
  },
  {
    file: 'pages/dishwasher-repair-orange-county.html',
    photo: 'completed-repair-dishwasher-pump-drain.jpg',
    w: 750, h: 1000,
    alt: 'Dishwasher pump and drain repair by Universal Appliances Repair, Orange County',
    caption: 'Dishwasher pump and drain repair — Universal Appliances Repair, Orange County CA',
    oldStock: 'dishwasher-open',
    objPos: 'center center',
  },
  {
    file: 'pages/oven-stove-repair-orange-county.html',
    photo: 'completed-repair-double-wall-oven-after.webp',
    w: 389, h: 510,
    alt: 'Double wall oven after completed repair by Universal Appliances Repair, Orange County',
    caption: 'Double wall oven repair completed — Universal Appliances Repair, Orange County CA',
    oldStock: 'oven-stainless-range',
    objPos: 'center center',
  },
  {
    file: 'pages/garbage-disposal-repair-orange-county.html',
    photo: 'completed-repair-disposal-kitchenaid-replacement.jpg',
    w: 750, h: 1000,
    alt: 'KitchenAid garbage disposal replacement by Universal Appliances Repair, Orange County',
    caption: 'KitchenAid garbage disposal replacement — Universal Appliances Repair, Orange County CA',
    oldStock: 'dishwasher-open',
    objPos: 'center center',
  },
  {
    file: 'pages/wine-cooler-repair-orange-county.html',
    photo: 'completed-repair-wine-cooler-undercounter-drawer.jpg',
    w: 750, h: 1000,
    alt: 'Undercounter wine cooler drawer repair by Universal Appliances Repair, Orange County',
    caption: 'Undercounter wine cooler repair — Universal Appliances Repair, Orange County CA',
    oldStock: 'hero-homepage',
    objPos: 'center center',
  },
];

const BASE_URL = 'https://fixappliancesfast.com';

for (const hub of HUBS) {
  const filePath = path.join(ROOT, hub.file);
  let html = fs.readFileSync(filePath, 'utf8');

  const photoPath = `images/real/business/${hub.photo}`;
  const photoUrl  = `${BASE_URL}/${photoPath}`;
  const srcPath   = `../${photoPath}`;
  const ext       = hub.photo.endsWith('.webp') ? 'webp' : 'jpg';

  // 1. og:image
  html = html.replace(
    /(<meta property="og:image" content=")([^"]+)(" \/>)/,
    `$1${photoUrl}$3`
  );

  // 2. twitter:image
  html = html.replace(
    /(<meta name="twitter:image" content=")([^"]+)(" \/>)/,
    `$1${photoUrl}$3`
  );

  // 3. CSS: replace background-image with object-fit properties
  html = html.replace(
    /\.hub-hero-bg \{[^}]*background-image:[^}]*\}/,
    `.hub-hero-bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: ${hub.objPos}; display: block; }`
  );

  // 4. Replace <div class="hub-hero-bg"></div> with <img>
  html = html.replace(
    /<div class="hub-hero-bg"><\/div>/,
    `<img class="hub-hero-bg"\n         src="${srcPath}"\n         alt="${hub.alt}"\n         loading="eager"\n         width="${hub.w}" height="${hub.h}"\n         decoding="async" />`
  );

  // 5. Add ImageObject schema before </body>
  const imageObject = `
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "ImageObject",
    "url": "${photoUrl}",
    "contentUrl": "${photoUrl}",
    "caption": "${hub.caption}",
    "creator": { "@type": "Organization", "name": "Universal Appliances Repair" },
    "creditText": "Universal Appliances Repair Group Inc."
  }
  </script>`;

  html = html.replace('</body>', `${imageObject}\n</body>`);

  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`✓  ${hub.file}`);
}

console.log('\nAll 7 hubs updated. Freezer hub intentionally untouched.');
