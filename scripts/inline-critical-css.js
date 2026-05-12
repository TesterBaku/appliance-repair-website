#!/usr/bin/env node
/**
 * Two tasks in one pass:
 *
 * 1. index.html — inline tailwind.css + shared.css directly into the page.
 *    Replaces the two <link rel="stylesheet"> external requests with a single
 *    <style> block, eliminating 2 render-blocking HTTP round-trips.
 *
 * 2. All HTML pages — make the Google Fonts <link rel="stylesheet"> non-blocking
 *    using the media="print" + onload trick. Adds a <noscript> fallback.
 *    Inter still loads; it just no longer blocks first paint.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');

// ── Task 1: Inline CSS into index.html ─────────────────────────────────────

const tailwindCSS = fs.readFileSync(path.join(root, 'tailwind.css'), 'utf8').trim();
const sharedCSS   = fs.readFileSync(path.join(root, 'shared.css'),   'utf8').trim();

const indexPath = path.join(root, 'index.html');
let indexHtml = fs.readFileSync(indexPath, 'utf8');

// Replace the two <link> stylesheet tags with a single inlined <style> block.
// Also make the Google Fonts Inter <link> non-blocking in the same pass.
// Normalise to \n for matching, then preserve original line endings on write
const nl = indexHtml.includes('\r\n') ? '\r\n' : '\n';
const indexNorm = indexHtml.replace(/\r\n/g, '\n');

const TARGET_LINKS = `  <link rel="stylesheet" href="tailwind.css" />\n  <link rel="stylesheet" href="shared.css" />\n  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />`;
const REPLACEMENT   = `  <style>\n${tailwindCSS}\n${sharedCSS}\n  </style>\n  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" media="print" onload="this.media='all'" />\n  <noscript><link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" /></noscript>`;

if (indexNorm.includes(TARGET_LINKS)) {
  indexHtml = indexNorm.replace(TARGET_LINKS, REPLACEMENT).replace(/\n/g, nl);
  fs.writeFileSync(indexPath, indexHtml, 'utf8');
  console.log('index.html: inlined tailwind.css + shared.css, made Inter async.');
} else {
  console.log('index.html: CSS already inlined — skipping.');
}

// ── Task 2: Make Google Fonts async on all other HTML pages ─────────────────

const raw = execSync('git ls-files "**/*.html" "*.html"', { cwd: root }).toString().trim();
const allHtml = raw.split('\n').filter(Boolean).map(f => path.join(root, f));

// The exact Google Fonts href appears in different forms (with or without weights):
// We match any googleapis.com/css2?family=Inter... rel="stylesheet" link
const FONTS_SYNC_RE = /(<link\b[^>]*href="https:\/\/fonts\.googleapis\.com\/css2\?[^"]*Inter[^"]*"[^>]*rel="stylesheet"[^>]*>)(?!\s*<noscript>)/g;

let fontsPagesUpdated = 0;

for (const file of allHtml) {
  if (file === indexPath) continue; // already handled above

  let html = fs.readFileSync(file, 'utf8');
  if (!FONTS_SYNC_RE.test(html)) {
    FONTS_SYNC_RE.lastIndex = 0;
    continue;
  }
  FONTS_SYNC_RE.lastIndex = 0;

  // Replace synchronous link with async version + noscript fallback.
  // Keep rel="stylesheet" intact; inject media="print" + onload before the closing > or />
  const updated = html.replace(FONTS_SYNC_RE, (match) => {
    const asyncLink = match.replace(/(\s*\/?>)\s*$/, ` media="print" onload="this.media='all'"$1`);
    return `${asyncLink}\n  <noscript>${match}</noscript>`;
  });

  if (updated !== html) {
    fs.writeFileSync(file, updated, 'utf8');
    fontsPagesUpdated++;
  }
}

console.log(`Google Fonts made async on ${fontsPagesUpdated} additional pages.`);
console.log('\nDone.');
