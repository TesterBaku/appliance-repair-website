/**
 * One-time script: bring 6 city hub pages to spec
 * 1. Trim meta description + og:description to ≤ 160 chars
 * 2. Add Service schema (with city-specific areaServed) before </head>
 */

const fs = require('fs');
const path = require('path');

const PAGES_DIR = path.join(__dirname, '..', 'pages');

const cities = [
  {
    file: 'appliance-repair-irvine-ca.html',
    name: 'Irvine',
    desc: 'Same-day appliance repair in Irvine, CA. Refrigerators, washers, dryers, dishwashers, ovens & stoves. Licensed techs. Call (949) 629-5365.',
  },
  {
    file: 'appliance-repair-anaheim-ca.html',
    name: 'Anaheim',
    desc: 'Same-day appliance repair in Anaheim, CA. Refrigerators, washers, dryers, dishwashers, ovens & stoves. Licensed techs. Call (949) 629-5365.',
  },
  {
    file: 'appliance-repair-santa-ana-ca.html',
    name: 'Santa Ana',
    desc: 'Same-day appliance repair in Santa Ana, CA. Refrigerators, washers, dryers, dishwashers, ovens & stoves. Licensed techs. Call (949) 629-5365.',
  },
  {
    file: 'appliance-repair-huntington-beach-ca.html',
    name: 'Huntington Beach',
    desc: 'Same-day appliance repair in Huntington Beach, CA. Refrigerators, washers, dryers, dishwashers, ovens & stoves. Licensed techs. Call (949) 629-5365.',
  },
  {
    file: 'appliance-repair-costa-mesa-ca.html',
    name: 'Costa Mesa',
    desc: 'Same-day appliance repair in Costa Mesa, CA. Refrigerators, washers, dryers, dishwashers, ovens & stoves. Licensed techs. Call (949) 629-5365.',
  },
  {
    file: 'appliance-repair-garden-grove-ca.html',
    name: 'Garden Grove',
    desc: 'Same-day appliance repair in Garden Grove, CA. Refrigerators, washers, dryers, dishwashers, ovens & stoves. Licensed techs. Call (949) 629-5365.',
  },
];

function buildServiceSchema(cityName) {
  return `  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Appliance Repair in ${cityName}, CA",
    "serviceType": "Appliance Repair",
    "provider": {
      "@type": "LocalBusiness",
      "name": "Universal Appliances Repair",
      "telephone": "+1-949-629-5365",
      "url": "https://fixappliancesfast.com/"
    },
    "areaServed": {
      "@type": "City",
      "name": "${cityName}",
      "addressRegion": "CA",
      "addressCountry": "US"
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Appliance Repair Services",
      "itemListElement": [
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Refrigerator Repair" } },
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Washer Repair" } },
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Dryer Repair" } },
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Dishwasher Repair" } },
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Oven & Stove Repair" } }
      ]
    }
  }
  </script>`;
}

for (const city of cities) {
  const filePath = path.join(PAGES_DIR, city.file);
  let html = fs.readFileSync(filePath, 'utf8');

  // 1. Replace meta description
  html = html.replace(
    /(<meta\s+name="description"\s+content=")[^"]*(")/,
    `$1${city.desc}$2`
  );

  // 2. Replace og:description (same trimmed text)
  html = html.replace(
    /(<meta\s+property="og:description"\s+content=")[^"]*(")/,
    `$1${city.desc}$2`
  );

  // 3. Inject Service schema before </head> (skip if already present)
  if (!html.includes('"@type": "Service"')) {
    html = html.replace('</head>', `${buildServiceSchema(city.name)}\n</head>`);
  }

  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`✓ ${city.file} — desc: ${city.desc.length} chars, Service schema added`);
}

console.log('\nDone.');
