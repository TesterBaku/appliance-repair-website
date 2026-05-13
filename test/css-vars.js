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
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const SKIP = new Set(['node_modules', '.git', '.claude', '.agents', '.audits', '.playwright-mcp']);

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

const USE_RE  = /var\((--[a-z0-9-]+)\)/g;
const DEF_RE  = /(--[a-z0-9-]+)\s*:/g;

for (const f of files) {
  const content = fs.readFileSync(f, 'utf8');
  for (const [, v] of content.matchAll(USE_RE)) used.add(v);
  for (const [, v] of content.matchAll(DEF_RE)) defined.add(v);
}

const missing = [...used].filter(v => !defined.has(v)).sort();

if (missing.length) {
  console.error(`css-vars: ${missing.length} CSS variable(s) used but never defined:`);
  missing.forEach(v => console.error('  ' + v));
  console.error('\nAdd each missing variable to the :root block in shared.css.');
  process.exit(1);
} else {
  console.log(`css-vars: ${used.size} variables used, all defined. OK`);
}
