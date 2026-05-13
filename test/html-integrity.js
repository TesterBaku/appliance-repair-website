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

// ── Report ────────────────────────────────────────────────────────────────────
if (issues.length) {
  const doctypeIssues = issues.filter(i => i.startsWith('[DOCTYPE]'));
  const emdashIssues  = issues.filter(i => i.startsWith('[EM-DASH]'));

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
  console.error('');
  process.exit(1);
} else {
  const parts = [];
  if (doctypeChecked) parts.push(`${doctypeChecked} files DOCTYPE-clean`);
  if (emdashChecked)  parts.push(`no em dashes in ${emdashChecked} articles`);
  console.log(`html-integrity: ${parts.join(', ')}.`);
}
