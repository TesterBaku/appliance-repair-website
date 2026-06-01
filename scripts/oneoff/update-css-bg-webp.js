#!/usr/bin/env node
/**
 * Updates CSS background-image references from .jpg to .webp.
 * Only touches inline <style> blocks — not OG/Twitter meta tags, schemas, or <img> src.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');
const raw = execSync('git ls-files "*.html" "**/*.html"', { cwd: root }).toString().trim();
const htmlFiles = raw.split('\n').filter(Boolean).map(f => path.join(root, f));

// Matches: background-image: url('....jpg') inside a <style> block context
// We replace .jpg -> .webp only inside url() within style tags
const STYLE_RE = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
const BG_URL_RE = /(background-image\s*:\s*[^;]*url\(['"]?[^'")\s]+?)\.jpg(['"]?\))/gi;

let totalChanged = 0;

for (const file of htmlFiles) {
  let html = fs.readFileSync(file, 'utf8');
  let changed = false;

  const newHtml = html.replace(STYLE_RE, (styleBlock) => {
    const updated = styleBlock.replace(BG_URL_RE, (m, before, after) => {
      changed = true;
      return `${before}.webp${after}`;
    });
    return updated;
  });

  if (changed) {
    fs.writeFileSync(file, newHtml, 'utf8');
    const rel = path.relative(root, file);
    console.log(`  updated  ${rel}`);
    totalChanged++;
  }
}

console.log(`\nDone. Updated CSS background-image in ${totalChanged} files.`);
