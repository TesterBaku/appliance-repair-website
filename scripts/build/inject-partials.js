#!/usr/bin/env node
/*
 * inject-partials.js — single-source the site footer (and, later, nav/head).
 *
 * The deployed artifact stays pure static HTML: this stamps the canonical
 * partial into each page at build time between the `<footer class="footer">`
 * … `</footer>` region. Run it whenever `partials/footer.html` changes and
 * commit the result (same model as sitemap.xml).
 *
 *   node scripts/build/inject-partials.js            # rewrite all pages
 *   node scripts/build/inject-partials.js --check    # verify only (exit 1 on drift) — used by `npm test`
 *   node scripts/build/inject-partials.js <file…>    # rewrite only the named pages
 *
 * Depth handling: every footer link target lives in pages/, so the partial
 * stores a {{BASE}} token that resolves to the relative path from each page's
 * directory to pages/ (works at any nesting depth):
 *   repo-root pages (index.html, …) → "pages/"
 *   pages/*.html                     → ""
 *   pages/blog/*.html                → "../"
 *   articles/*.html                  → "../pages/"
 */
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');
const args = process.argv.slice(2);
const CHECK = args.includes('--check');
const explicitFiles = args.filter((a) => !a.startsWith('--'));

// Canonical footer, stored LF; ends exactly at `</footer>` (no trailing newline).
const partialLF = fs
  .readFileSync(path.join(repoRoot, 'partials', 'footer.html'), 'utf8')
  .replace(/\r\n/g, '\n')
  .replace(/\n+$/, '');

const FOOTER_RE = /[ \t]*<footer class="footer">[\s\S]*?<\/footer>/;
const pagesDir = path.join(repoRoot, 'pages');

// Served-page locations get the footer; everything else (test fixtures, etc.) is skipped.
function baseFor(absFile) {
  const rel = path.relative(repoRoot, absFile).split(path.sep).join('/');
  const served = !rel.includes('/') || rel.startsWith('pages/') || rel.startsWith('articles/');
  if (!served) return null;
  // {{BASE}} = relative path from this file's directory to pages/, at any depth.
  const b = path.relative(path.dirname(absFile), pagesDir).split(path.sep).join('/');
  return b === '' ? '' : b + '/';
}

function expectedFooter(absFile, eol) {
  const base = baseFor(absFile);
  if (base === null) return null;
  return partialLF.replace(/\{\{BASE\}\}/g, base).replace(/\n/g, eol);
}

function collectHtml(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!['.git', 'node_modules', '.claude', '.playwright-mcp', 'test-results', 'partials'].includes(entry.name))
        collectHtml(full, out);
    } else if (full.endsWith('.html')) {
      out.push(full);
    }
  }
}

let files;
if (explicitFiles.length) {
  files = explicitFiles.map((f) => path.resolve(repoRoot, f));
} else {
  files = [];
  collectHtml(repoRoot, files);
}

let changed = 0, checkedFooters = 0, drift = [], skipped = 0;
for (const file of files) {
  const rel = path.relative(repoRoot, file);
  let content = fs.readFileSync(file, 'utf8');
  if (!FOOTER_RE.test(content)) { skipped++; continue; }
  const eol = content.includes('\r\n') ? '\r\n' : '\n';
  const expected = expectedFooter(file, eol);
  if (expected === null) { skipped++; continue; }
  checkedFooters++;
  const next = content.replace(FOOTER_RE, () => expected);
  if (next !== content) {
    if (CHECK) drift.push(rel);
    else { fs.writeFileSync(file, next, 'utf8'); changed++; }
  }
}

if (CHECK) {
  if (drift.length) {
    console.error(`inject-partials --check: ${drift.length} page(s) have a footer that does not match partials/footer.html:`);
    drift.forEach((f) => console.error(`  - ${f}`));
    console.error('Run `npm run build:partials` and commit the result.');
    process.exit(1);
  }
  console.log(`inject-partials: ${checkedFooters} footers match partials/footer.html. OK`);
} else {
  console.log(`inject-partials: ${changed} file(s) updated, ${checkedFooters} footer region(s) processed, ${skipped} skipped (no footer).`);
}
