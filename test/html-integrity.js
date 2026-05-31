/**
 * html-integrity.js — raw HTML quality checks
 *
 * Two checks, two severity levels:
 *
 *   doctype  — every .html file must start with exactly `<!DOCTYPE html>` (no BOM,
 *              no truncation). EXIT 1 on any failure. Added after PR #294 fixed 32
 *              broken DOCTYPEs that caused quirks-mode rendering.
 *
 *   emdash   — article files must not contain U+2014 `—` in editorial copy.
 *              EXIT 1 on any failure. Added after PR #292 was blocked by 14 em
 *              dashes. Run `npm run test:integrity` to check; violations in files
 *              predating this rule are tracked in tasks/lessons.md.
 *
 * Usage:
 *   node test/html-integrity.js           — run both checks
 *   node test/html-integrity.js doctype   — DOCTYPE only
 *   node test/html-integrity.js emdash    — em-dash only
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const root   = path.resolve(__dirname, '..');
const BOM    = Buffer.from([0xEF, 0xBB, 0xBF]);
const mode   = process.argv[2] || 'all';   // 'all' | 'doctype' | 'emdash'

const SKIP_DIRS = new Set(['node_modules', '.git', '.claude', '.agents', '.audits', '.playwright-mcp']);

function collectHtmlFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) { results.push(...collectHtmlFiles(full)); continue; }
    if (entry.isFile() && entry.name.endsWith('.html')) results.push(full);
  }
  return results;
}

const allHtml    = collectHtmlFiles(root);
const articleDir = path.join(root, 'articles');
const articles   = allHtml.filter(
  f => path.dirname(f) === articleDir && path.basename(f).startsWith('article-')
);

const issues = [];
let   doctypeChecked = 0;
let   emdashChecked  = 0;
let   gridChecked    = 0;

// Inline `grid-template-columns` with 2+ FIXED tracks cannot be overridden by a
// CSS @media query, so it never collapses on mobile (cards render crammed side by
// side). Responsive forms (`auto-fit`/`auto-fill` with minmax) are fine. Move any
// fixed multi-column grid into a CSS class with a mobile breakpoint instead.
// Added after the about.html testimonials + laguna/newport gallery bug (2026-05-31).
function inlineFixedGridIssues(content, rel) {
  const out = [];
  content.split('\n').forEach((line, i) => {
    const re = /grid-template-columns\s*:\s*([^;"']+)/gi;
    let m;
    while ((m = re.exec(line)) !== null) {
      // only inline style attributes (a `style=` must precede the match on this line);
      // CSS inside <style> blocks (overridable by @media) is exempt.
      if (!/style\s*=/i.test(line.slice(0, m.index))) continue;
      const val = m[1].trim();
      if (/auto-fit|auto-fill/i.test(val)) continue;               // responsive — OK
      const repeatN = val.match(/repeat\(\s*(\d+)/i);
      const tracks  = val.replace(/\b(?:repeat|minmax|fit-content|calc)\([^)]*\)/gi, 'X')
                         .split(/\s+/).filter(Boolean);
      if ((repeatN && parseInt(repeatN[1], 10) >= 2) || tracks.length >= 2) {
        out.push(`[GRID] ${rel}:${i + 1} — inline fixed-column grid won't collapse on mobile: ${val}`);
      }
    }
  });
  return out;
}

// ── Check 1: DOCTYPE integrity ────────────────────────────────────────────────
if (mode === 'all' || mode === 'doctype') {
  for (const filePath of allHtml) {
    const rel = path.relative(root, filePath);
    const buf = fs.readFileSync(filePath);
    doctypeChecked++;

    if (buf.slice(0, 3).equals(BOM)) {
      issues.push(`[DOCTYPE] ${rel} — UTF-8 BOM present (\\xEF\\xBB\\xBF); strip it`);
      continue;
    }
    const head = buf.slice(0, 15).toString('utf8');
    if (head !== '<!DOCTYPE html>') {
      issues.push(`[DOCTYPE] ${rel} — starts with ${JSON.stringify(head)} (expected "<!DOCTYPE html>")`);
    }
  }
}

// ── Check 2: No em dashes in article editorial copy ───────────────────────────
if (mode === 'all' || mode === 'emdash') {
  for (const filePath of articles) {
    const rel     = path.relative(root, filePath);
    const content = fs.readFileSync(filePath, 'utf8');
    const lines   = content.split('\n');
    emdashChecked++;

    lines.forEach((line, i) => {
      if (!line.includes('—')) return;
      issues.push(`[EM-DASH] ${rel}:${i + 1} — ${line.trim().slice(0, 80)}`);
    });
  }
}

// ── Check 3: No inline fixed-column grids (won't collapse on mobile) ───────────
if (mode === 'all' || mode === 'grid') {
  for (const filePath of allHtml) {
    const rel     = path.relative(root, filePath);
    const content = fs.readFileSync(filePath, 'utf8');
    gridChecked++;
    issues.push(...inlineFixedGridIssues(content, rel));
  }
}

// ── Report ────────────────────────────────────────────────────────────────────
if (issues.length) {
  const doctypeIssues = issues.filter(i => i.startsWith('[DOCTYPE]'));
  const emdashIssues  = issues.filter(i => i.startsWith('[EM-DASH]'));
  const gridIssues    = issues.filter(i => i.startsWith('[GRID]'));

  if (doctypeIssues.length) {
    console.error(`\nDOCTYPE failures (${doctypeIssues.length}):`);
    doctypeIssues.forEach(i => console.error('  ' + i));
  }
  if (emdashIssues.length) {
    console.error(`\nEm-dash violations (${emdashIssues.length}) — replace with comma, semicolon, colon, or parenthetical:`);
    emdashIssues.slice(0, 20).forEach(i => console.error('  ' + i));
    if (emdashIssues.length > 20) {
      console.error(`  ... and ${emdashIssues.length - 20} more (run with emdash mode to see all)`);
    }
  }
  if (gridIssues.length) {
    console.error(`\nInline fixed-column grid violations (${gridIssues.length}) — move to a CSS class with a mobile @media breakpoint (or use repeat(auto-fit, minmax(...))):`);
    gridIssues.forEach(i => console.error('  ' + i));
  }
  console.error('');
  process.exit(1);
} else {
  const parts = [];
  if (doctypeChecked) parts.push(`${doctypeChecked} files DOCTYPE-clean`);
  if (emdashChecked)  parts.push(`no em dashes in ${emdashChecked} articles`);
  if (gridChecked)    parts.push(`no inline fixed-column grids in ${gridChecked} files`);
  console.log(`html-integrity: ${parts.join(', ')}.`);
}
