#!/usr/bin/env node
/**
 * Adds loading="lazy" to local <img> tags that are missing it.
 * Skips article-hero-img (above-the-fold) and any img that already has loading=.
 * Targets articles/*.html where related-card imgs were missing lazy loading.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');
const raw = execSync('git ls-files "articles/*.html" "pages/*.html" "pages/**/*.html" "index.html"', { cwd: root }).toString().trim();
const htmlFiles = raw.split('\n').filter(Boolean).map(f => path.join(root, f));

// Matches <img> tags that reference a local images/ path, lack loading=, and lack article-hero-img class
const IMG_RE = /<img\b(?![^>]*\bloading=)(?![^>]*class="article-hero-img")[^>]*src="(?:\.\.\/)*images\/[^"]+\.[a-z]+"[^>]*\/?>/gi;

let totalFiles = 0;
let totalFixed = 0;

for (const file of htmlFiles) {
  let html = fs.readFileSync(file, 'utf8');
  let count = 0;

  const newHtml = html.replace(IMG_RE, (match) => {
    count++;
    // Insert loading="lazy" before the closing /> or >
    return match.replace(/(\s*\/?>)$/, ` loading="lazy"$1`);
  });

  if (count > 0) {
    fs.writeFileSync(file, newHtml, 'utf8');
    const rel = path.relative(root, file);
    console.log(`  +${count} loading="lazy"  ${rel}`);
    totalFiles++;
    totalFixed += count;
  }
}

console.log(`\nDone. Added loading="lazy" to ${totalFixed} images across ${totalFiles} files.`);
