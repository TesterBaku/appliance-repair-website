/**
 * css-vars.js — CSS custom property completeness check
 *
 * Walks every .css and .html file and verifies that every var(--token) reference
 * has a matching --token: definition somewhere in the codebase.
 *
 * This catches the exact class of bug fixed in the recent-repairs hero:
 * a var(--pressed-steel) reference with no :root definition caused the hero
 * background to silently fall back to transparent, rendering white text on white.
 *
 * A missing var() doesn't throw a JS error and isn't visible in static analysis —
 * it's a silent runtime failure. This test makes it a hard pre-merge gate.
 *
 * It also enforces a SINGLE SOURCE for the brand palette: the `--brand*` tokens
 * may only be DEFINED in shared.css. A page that re-declares `--brand: #...`
 * in its own <style> can silently drift the brand colour on that one page (the
 * "Laguna #cc3d12" class of bug). Defining brand tokens anywhere else is a hard
 * failure; pages must consume them via var(--brand*).
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const SKIP = new Set(['node_modules', '.git', '.claude', '.agents', '.audits', '.playwright-mcp', 'partials']);

function collectFiles(dir, exts) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && SKIP.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) { results.push(...collectFiles(full, exts)); continue; }
    if (entry.isFile() && exts.some(e => entry.name.endsWith(e))) results.push(full);
  }
  return results;
}

const files = collectFiles(root, ['.css', '.html']);

const used    = new Set();
const defined = new Set();

const USE_RE       = /var\((--[a-z0-9-]+)\)/g;
const DEF_RE       = /(--[a-z0-9-]+)\s*:/g;
const BRAND_DEF_RE = /(--brand[a-z0-9-]*)\s*:/g;

const brandOffenders = [];

for (const f of files) {
  const content = fs.readFileSync(f, 'utf8');
  for (const [, v] of content.matchAll(USE_RE)) used.add(v);
  for (const [, v] of content.matchAll(DEF_RE)) defined.add(v);

  // Brand tokens may only be DEFINED in shared.css.
  const relF = path.relative(root, f).split(path.sep).join('/');
  if (relF !== 'shared.css') {
    for (const [, v] of content.matchAll(BRAND_DEF_RE)) {
      brandOffenders.push(`${relF} — defines ${v} (brand tokens must live only in shared.css; consume via var(${v}))`);
    }
  }
}

const missing = [...used].filter(v => !defined.has(v)).sort();

let failed = false;

if (missing.length) {
  console.error(`css-vars: ${missing.length} CSS variable(s) used but never defined:`);
  missing.forEach(v => console.error('  ' + v));
  console.error('\nAdd each missing variable to the :root block in shared.css.');
  failed = true;
}

if (brandOffenders.length) {
  console.error(`css-vars: ${brandOffenders.length} brand-token definition(s) outside shared.css:`);
  brandOffenders.forEach(v => console.error('  ' + v));
  console.error('\nDefine --brand* only in shared.css; remove the override and use var(--brand*).');
  failed = true;
}

if (failed) process.exit(1);

console.log(`css-vars: ${used.size} variables used, all defined; brand tokens single-sourced in shared.css. OK`);
