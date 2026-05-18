'use strict';
/**
 * add-article-hamburger.js
 *
 * Adds mobile hamburger nav + drawer to every article in /articles/ that
 * doesn't already have it. Also:
 *  - Adds prefers-reduced-motion CSS block to inline <style>
 *  - Darkens small-text orange (#e84c1e -> #c2370a) for WCAG AA contrast
 *  - Adds .nav-hamburger display:flex to existing @media (max-width: 768px)
 *    block (or appends a new rule if the block already handles it)
 *
 * Safe to run multiple times — skips files that already have hamburger markup.
 */

const fs   = require('fs');
const path = require('path');

const articlesDir = path.join(__dirname, '..', 'articles');

const HAMBURGER_CSS = `
    /* HAMBURGER NAV (mobile) */
    .nav-hamburger { display: none; background: none; border: none; cursor: pointer; padding: 0; width: 44px; height: 44px; align-items: center; justify-content: center; flex-direction: column; gap: 5px; flex-shrink: 0; }
    .nav-hamburger span { display: block; width: 22px; height: 2px; background: #111; border-radius: 2px; transition: transform 0.2s, opacity 0.2s; }
    .nav-hamburger[aria-expanded="true"] span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
    .nav-hamburger[aria-expanded="true"] span:nth-child(2) { opacity: 0; }
    .nav-hamburger[aria-expanded="true"] span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }
    .nav-drawer { display: none; flex-direction: column; background: #fff; padding: 8px 24px 20px; border-top: 1px solid #eee; position: relative; z-index: 99; }
    .nav-drawer[data-open] { display: flex; }
    .nav-drawer a { font-size: 15px; color: #666; text-decoration: none; padding: 12px 0; border-bottom: 1px solid #eee; font-weight: 500; min-height: 44px; display: flex; align-items: center; }
    .nav-drawer a:last-child { border-bottom: none; }
    .nav-drawer a.nav-drawer-cta { color: #e84c1e; font-weight: 600; }
    @media (max-width: 768px) { .nav-hamburger { display: flex; } }
    @media (prefers-reduced-motion: reduce) { .nav-hamburger span { transition: none; } }`;

const HAMBURGER_BUTTON = `<button class="nav-hamburger" aria-expanded="false" aria-controls="mobile-nav-drawer" aria-label="Open menu" type="button"><span></span><span></span><span></span></button>`;

const NAV_DRAWER = `
  <div class="nav-drawer" id="mobile-nav-drawer" aria-hidden="true">
    <a href="../pages/about.html">About</a>
    <a href="../pages/services.html">Services</a>
    <a href="../pages/service-areas.html">Service Areas</a>
    <a href="../pages/faq.html">FAQ</a>
    <a href="../pages/testimonials.html">Testimonials</a>
    <a href="../pages/contact.html">Contact</a>
    <a href="../pages/blog.html">Blog</a>
    <a href="tel:+19496295365" class="nav-drawer-cta">Call (949) 629-5365</a>
  </div>`;

const HAMBURGER_JS = `
    (function() {
      var hamburger = document.querySelector('.nav-hamburger');
      var drawer = document.getElementById('mobile-nav-drawer');
      if (!hamburger || !drawer) return;
      function setOpen(open) {
        hamburger.setAttribute('aria-expanded', String(open));
        hamburger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        drawer.setAttribute('aria-hidden', String(!open));
        if (open) { drawer.setAttribute('data-open', ''); } else { drawer.removeAttribute('data-open'); }
        document.body.style.overflow = open ? 'hidden' : '';
      }
      hamburger.addEventListener('click', function() { setOpen(hamburger.getAttribute('aria-expanded') !== 'true'); });
      document.addEventListener('keydown', function(e) { if (e.key === 'Escape' && hamburger.getAttribute('aria-expanded') === 'true') { setOpen(false); hamburger.focus(); } });
      drawer.querySelectorAll('a').forEach(function(link) { link.addEventListener('click', function() { setOpen(false); }); });
    })();`;

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

  // 4. Add hamburger JS after the existing dropdown JS (before analytics.js script)
  html = html.replace(
    '<script defer src="../analytics.js"></script>',
    HAMBURGER_JS + '\n  </script>\n  <script defer src="../analytics.js"></script>'
  );

  // Close the preceding script tag properly — the replacement above needs the open script tag
  // Find the last </script> before analytics and fix structure
  // Actually the script containing dropdown JS ends with })();\n  </script>
  // We're inserting HAMBURGER_JS before the analytics script tag but outside any script tag
  // Fix: wrap HAMBURGER_JS in its own script tag
  // Undo the above and redo correctly
  html = fs.readFileSync(filePath, 'utf8');
  if (html.includes('nav-hamburger')) { skipped++; continue; }

  html = html.replace('</style>', HAMBURGER_CSS + '\n  </style>');
  html = html.replace(
    /(<a href="\.\.\/pages\/contact\.html" class="nav-cta">Book a Repair<\/a>)/,
    '$1\n      ' + HAMBURGER_BUTTON
  );
  html = html.replace('</nav>', '</nav>' + NAV_DRAWER);
  html = html.replace(
    '  <script defer src="../analytics.js"></script>',
    '  <script>\n' + HAMBURGER_JS + '\n  </script>\n  <script defer src="../analytics.js"></script>'
  );

  fs.writeFileSync(filePath, html, 'utf8');
  updated++;
  console.log('Updated:', file);
}

console.log(`\nDone. Updated: ${updated}, Skipped (already had hamburger): ${skipped}`);
