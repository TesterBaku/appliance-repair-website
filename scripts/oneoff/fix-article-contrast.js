'use strict';
/**
 * fix-article-contrast.js
 *
 * Fixes WCAG AA contrast failures in article inline CSS.
 * Hub pages use shared.css CSS variables that already pass AA.
 * Articles have hardcoded #e84c1e which measures 3.8:1 on white (needs 4.5:1).
 *
 * Fixes applied:
 *  - nav-cta button: background #e84c1e → #cc3d12 (4.65:1 with white text)
 *  - related-card-cat label: color #e84c1e → #aa3210 (6.21:1 on white, 10px small text)
 *  - nav-drawer-cta link: color #e84c1e → #aa3210 (15px)
 *  - article-toc link: color #e84c1e → #aa3210 (14px, text link)
 *  - tip-freq badge: color #e84c1e → #aa3210 (10px, small text)
 *
 * #cc3d12 = --brand-dark in shared.css
 * #aa3210 = --brand-deeper / --brand-text in shared.css
 *
 * Safe to run multiple times — replacements are idempotent.
 */

const fs   = require('fs');
const path = require('path');

const articlesDir = path.join(__dirname, '..', 'articles');
const files = fs.readdirSync(articlesDir).filter(f => f.endsWith('.html'));

const REPLACEMENTS = [
  // nav-cta button background (#fff text on orange bg)
  [
    '.nav-cta { background: #e84c1e;',
    '.nav-cta { background: #cc3d12;'
  ],
  // related-card category label (10px orange text)
  [
    '.related-card-cat { font-size: 10px; color: #e84c1e;',
    '.related-card-cat { font-size: 10px; color: #aa3210;'
  ],
  // nav-drawer CTA link (15px orange text)
  [
    '.nav-drawer a.nav-drawer-cta { color: #e84c1e;',
    '.nav-drawer a.nav-drawer-cta { color: #aa3210;'
  ],
  // article-toc links (14px orange text)
  [
    '.article-toc a { color: #e84c1e;',
    '.article-toc a { color: #aa3210;'
  ],
  // tip-freq badge (10px orange text on light bg)
  [
    '.tip-freq { display: inline-block; font-size: 10px; font-weight: 700; color: #e84c1e;',
    '.tip-freq { display: inline-block; font-size: 10px; font-weight: 700; color: #aa3210;'
  ],
];

let updated = 0;

for (const file of files) {
  const filePath = path.join(articlesDir, file);
  let html = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  for (const [from, to] of REPLACEMENTS) {
    if (html.includes(from)) {
      html = html.split(from).join(to);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, html, 'utf8');
    updated++;
    console.log('Fixed:', file);
  }
}

console.log(`\nDone. Updated: ${updated} files.`);
