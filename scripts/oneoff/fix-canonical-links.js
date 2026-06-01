#!/usr/bin/env node
// One-shot script: replace /index.html nav hrefs with canonical equivalents.
// Patterns (attribute-anchored, no risk of hitting text nodes or code blocks):
//   href="../index.html"  →  href="../"
//   href="index.html"     →  href="./"
// Files in .claude/ and node_modules/ are excluded.
// Does NOT touch canonical tags, og:url, JSON-LD, or sitemap.xml.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const EXCLUDE_DIRS = new Set(['.claude', 'node_modules', '.git', 'scripts']);

let filesChanged = 0;
let totalReplacements = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!EXCLUDE_DIRS.has(entry.name)) walk(path.join(dir, entry.name));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      processFile(path.join(dir, entry.name));
    }
  }
}

function processFile(filePath) {
  // Read as bytes to detect/strip BOM if present, then decode as UTF-8
  const raw = fs.readFileSync(filePath);
  const hasBom = raw[0] === 0xEF && raw[1] === 0xBB && raw[2] === 0xBF;
  const content = hasBom ? raw.slice(3).toString('utf8') : raw.toString('utf8');

  let updated = content;
  updated = updated.replaceAll('href="../../index.html"', 'href="../../"');
  updated = updated.replaceAll('href="../index.html"', 'href="../"');
  updated = updated.replaceAll('href="index.html"', 'href="./"');

  if (updated === content) return; // nothing changed

  const replacements = (
    (content.match(/href="\.\.\/\.\.\/index\.html"/g) || []).length +
    (content.match(/href="\.\.\/index\.html"/g) || []).length +
    (content.match(/href="index\.html"/g) || []).length
  );

  // Write as plain UTF-8 bytes (no BOM)
  fs.writeFileSync(filePath, Buffer.from(updated, 'utf8'));
  filesChanged++;
  totalReplacements += replacements;
  console.log(`  [${replacements}] ${path.relative(ROOT, filePath)}`);
}

console.log('Replacing internal index.html hrefs with canonical equivalents...\n');
walk(ROOT);
console.log(`\nDone. ${filesChanged} files changed, ${totalReplacements} replacements total.`);
