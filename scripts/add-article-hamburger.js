'use strict';
/**
 * add-article-hamburger.js
 *
 * Adds the mobile hamburger button, the article nav drawer markup and its inline CSS to any
 * article in /articles/ that does not have them yet. The CSS is a verbatim copy of the live
 * article block (keep it in sync if the article template changes).
 *
 * It deliberately adds NO JavaScript: drawer behaviour is single-sourced in /site.js, and
 * inject-site-js --check (npm test) fails a page that carries inline drawer JS. After running
 * this, run `npm run build:site-js` (adds the site.js include) and `npm run build:partials`
 * (restamps the drawer from partials/nav-article.html, the source of truth for its rows).
 *
 * Safe to run multiple times: skips files that already have hamburger markup.
 */

const fs   = require('fs');
const path = require('path');

const articlesDir = path.join(__dirname, '..', 'articles');

const HAMBURGER_CSS = `
    /* HAMBURGER NAV (mobile) */
    .nav-hamburger { display: none; background: none; border: none; cursor: pointer; padding: 0; width: 48px; height: 48px; align-items: center; justify-content: center; flex-direction: column; gap: 5px; flex-shrink: 0; }
    .nav-hamburger span { display: block; width: 22px; height: 2px; background: #111; border-radius: 2px; transition: transform 0.2s, opacity 0.2s; }
    .nav-hamburger[aria-expanded="true"] span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
    .nav-hamburger[aria-expanded="true"] span:nth-child(2) { opacity: 0; }
    .nav-hamburger[aria-expanded="true"] span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }
    .nav-drawer { display: none; flex-direction: column; background: #fff; padding: 8px 24px 20px; border-top: 1px solid #eee; position: fixed; top: 70px; left: 0; right: 0; z-index: 99; max-height: calc(100vh - 70px); overflow-y: auto; }
    .nav-drawer[data-open] { display: flex; }
    .nav-drawer a { font-size: 15px; color: #666; text-decoration: none; padding: 12px 0; border-bottom: 1px solid #eee; font-weight: 500; min-height: 44px; display: flex; align-items: center; }
    .nav-drawer a:last-child { border-bottom: none; }
    .nav-drawer a.nav-drawer-cta { border: none; background: #cc3d12; color: #fff; font-weight: 700; justify-content: center; border-radius: 8px; margin-top: 12px; }
    .nav-drawer a.nav-drawer-cta--outline { background: transparent; color: #aa3210; border: 1.5px solid #aa3210; margin-top: 8px; }
    @media (max-width: 768px) { .nav-links { display: none; } .nav-cta { display: none; } .nav-hamburger { display: flex; } }
    @media (prefers-reduced-motion: reduce) { .nav-hamburger span { transition: none; } }`;

const HAMBURGER_BUTTON = `<button class="nav-hamburger" aria-expanded="false" aria-controls="mobile-nav-drawer" aria-label="Open menu" type="button"><span></span><span></span><span></span></button>`;

const NAV_DRAWER = `
  <div class="nav-drawer" id="mobile-nav-drawer" aria-hidden="true">
    <a href="../pages/about.html">About</a>
    <a href="../pages/services.html">Services</a>
    <a href="../pages/services.html#brands">Brands</a>
    <a href="../pages/service-areas.html">Service Areas</a>
    <a href="../pages/faq.html">FAQ</a>
    <a href="../pages/testimonials.html">Testimonials</a>
    <a href="../pages/contact.html">Contact</a>
    <a href="../pages/blog.html">Blog</a>
    <a href="tel:+19496295365" class="nav-drawer-cta">Call (949) 629-5365</a>
    <a href="../pages/contact.html" class="nav-drawer-cta nav-drawer-cta--outline">Book a Repair</a>
  </div>`;

const files = fs.readdirSync(articlesDir).filter(f => f.endsWith('.html'));
let updated = 0;
let skipped = 0;

for (const file of files) {
  const filePath = path.join(articlesDir, file);
  let html = fs.readFileSync(filePath, 'utf8');

  if (html.includes('nav-hamburger')) {
    skipped++;
    continue;
  }

  // 1. Insert hamburger CSS before </style>
  html = html.replace('</style>', HAMBURGER_CSS + '\n  </style>');

  // 2. Add hamburger button after the "Book a Repair" nav-cta link
  html = html.replace(
    /(<a href="\.\.\/pages\/contact\.html" class="nav-cta">Book a Repair<\/a>)/,
    '$1\n      ' + HAMBURGER_BUTTON
  );

  // 3. Add nav drawer after </nav>
  html = html.replace('</nav>', '</nav>' + NAV_DRAWER);

  fs.writeFileSync(filePath, html, 'utf8');
  updated++;
  console.log('Updated:', file);
}

console.log(`\nDone. Updated: ${updated}, Skipped (already had hamburger): ${skipped}`);
if (updated) console.log('Next: npm run build:site-js && npm run build:partials');
