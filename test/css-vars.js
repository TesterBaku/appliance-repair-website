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
 * It also guards the brand palette against drift: a page that LINKS shared.css
 * (and therefore inherits the canonical `--brand*` tokens) must NOT also
 * re-declare `--brand: #...` in its own <style> — an override there silently
 * drifts the brand colour on that one page (the "Laguna #cc3d12" class of bug).
 * Such a redefinition is a hard failure.
 *
 * Self-contained pages that do NOT link shared.css (e.g. index.html, articles)
 * are exempt: they legitimately define their own `--brand*` because there is no
 * shared.css to inherit from. shared.css itself is the canonical source.
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const SKIP = new Set(['node_modules', '.git', '.claude', '.agents', '.audits', '.playwright-mcp', 'partials', 'pagefind']);

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
// A page that pulls in shared.css as a stylesheet (either attribute order).
const LINKS_SHARED = /<link\b[^>]*\brel="stylesheet"[^>]*\bhref="[^"]*shared\.css"|<link\b[^>]*\bhref="[^"]*shared\.css"[^>]*\brel="stylesheet"/i;

const brandOffenders = [];
const paletteDrift   = [];

// Canonical :root values from shared.css, used to catch the INVERSE of the brand-drift
// bug above: a SELF-CONTAINED page (one that never links shared.css, so the guard above
// deliberately exempts it) quietly holding a stale copy of a shared token.
//
// index.html is the only such page, and it held --text-muted: #767676 (4.33:1 on --bg),
// --text-faint: #999 (2.85:1) and --text-inactive: #aaa long after shared.css moved to
// #666666. Nothing noticed, because it links no stylesheet to drift FROM. Found in the
// PR #659 review, where DESIGN.md had just been rewritten to assert those tokens all
// resolve to Dust — an invariant the highest-traffic page violated.
const rootBlock = (fs.readFileSync(path.join(root, 'shared.css'), 'utf8').match(/:root\s*\{([\s\S]*?)\}/) || [, ''])[1];
const CANON = {};
for (const d of rootBlock.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) CANON[d[1]] = d[2].trim();
// Tokens whose value carries an accessibility or brand guarantee. A self-contained page
// may add its own tokens freely; it may not hold a DIFFERENT value for one of these.
const GUARDED = /^--(text|brand|footer|bg|surface|border)/;

for (const f of files) {
  const content = fs.readFileSync(f, 'utf8');
  for (const [, v] of content.matchAll(USE_RE)) used.add(v);
  for (const [, v] of content.matchAll(DEF_RE)) defined.add(v);

  const relF = path.relative(root, f).split(path.sep).join('/');
  if (relF === 'shared.css') continue;

  if (LINKS_SHARED.test(content)) {
    // A page that LINKS shared.css must not also re-declare --brand* (drift risk).
    for (const [, v] of content.matchAll(BRAND_DEF_RE)) {
      brandOffenders.push(`${relF} — re-declares ${v} while linking shared.css (drift risk; remove the override and use var(${v}))`);
    }
  } else {
    // Self-contained page: its own copy of a guarded token must match shared.css.
    const own = (content.match(/:root\s*\{([\s\S]*?)\}/) || [, ''])[1];
    for (const d of own.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
      const [, name, val] = d;
      if (!GUARDED.test(name) || CANON[name] === undefined) continue;
      if (val.trim() !== CANON[name]) {
        paletteDrift.push(`${relF} — ${name}: ${val.trim()} but shared.css says ${CANON[name]} (self-contained page holding a stale palette value)`);
      }
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
  console.error(`css-vars: ${brandOffenders.length} brand-token override(s) on shared.css-linked page(s):`);
  brandOffenders.forEach(v => console.error('  ' + v));
  console.error('\nA page that links shared.css must inherit --brand*; remove the local override and use var(--brand*).');
  failed = true;
}

if (paletteDrift.length) {
  console.error(`css-vars: ${paletteDrift.length} stale palette value(s) on self-contained page(s):`);
  paletteDrift.forEach(v => console.error('  ' + v));
  console.error('\nA self-contained page copies the palette instead of linking it, so it must be updated whenever shared.css changes a guarded token.');
  failed = true;
}

if (failed) process.exit(1);

console.log(`css-vars: ${used.size} variables used, all defined; no --brand* overrides on shared.css-linked pages; no stale palette values on self-contained pages. OK`);
