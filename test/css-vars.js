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
// Canonical values from shared.css. Collected from EVERY rule that declares custom
// properties, not just the first `:root {` substring — see the collector below for why.
const CANON_RAW = collectVars(fs.readFileSync(path.join(root, 'shared.css'), 'utf8'));
const CANON = CANON_RAW;

// Tokens whose value carries an accessibility or brand guarantee. A page may add its own
// tokens freely; it may not hold a DIFFERENT value for one of these.
const GUARDED = /^--(text|brand|footer|bg|surface|border)/;

// Collect custom-property declarations from ALL rules in a stylesheet or <style> block.
//
// An earlier version matched only /:root\s*\{([\s\S]*?)\}/ — first match, `{` required
// immediately after `:root`, everything else ignored. The PR #659 review proved four
// evasions that each changed the painted colour while the check exited 0:
//   body { --text-muted: … }          (any selector other than :root)
//   a SECOND :root block later on
//   :root inside @media (max-width:768px)
//   :root, html { … }                 (selector list)
// Custom properties cascade like any other declaration, so the selector is irrelevant to
// whether the value drifts. Collect them all.
function collectVars(css, aliasBase) {
  const out = {};
  // strip comments so a commented-out declaration cannot register
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const m of clean.matchAll(/(--[\w-]+)\s*:\s*([^;{}]+)[;}]/g)) {
    out[m[1]] = m[2].trim();
  }
  // Resolve alias chains before normalising: shared.css declares
  // `--brand-text: var(--brand-deeper)`, so a page writing the literal #aa3210 has the
  // SAME resolved colour and must not be reported as drift. Falls back to the page's own
  // map first, then the canonical one, so a self-contained page can alias its own tokens.
  const deref = (v, depth = 0) => {
    if (depth > 8) return v;
    const m = String(v).match(/var\(\s*(--[\w-]+)\s*(?:,\s*([^)]+))?\)/);
    if (!m) return v;
    const src = out[m[1]] !== undefined ? out[m[1]] : (aliasBase && aliasBase[m[1]] !== undefined ? aliasBase[m[1]] : m[2]);
    return src === undefined ? v : deref(String(v).replace(m[0], String(src).trim()), depth + 1);
  };
  for (const k of Object.keys(out)) out[k] = normaliseColour(deref(out[k]));
  return out;
}

// #666 and #666666 and rgb(102,102,102) are the same colour. A raw string compare
// reported all three as drift against each other, which would have made the guard
// cry wolf and get suppressed.
function normaliseColour(v) {
  const t = v.trim().toLowerCase();
  let m = t.match(/^#([0-9a-f]{3})$/);
  if (m) return '#' + m[1].split('').map(c => c + c).join('');
  m = t.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*1(?:\.0+)?\s*)?\)$/);
  if (m) return '#' + [1, 2, 3].map(i => (+m[i]).toString(16).padStart(2, '0')).join('');
  return t;
}

for (const f of files) {
  const content = fs.readFileSync(f, 'utf8');
  for (const [, v] of content.matchAll(USE_RE)) used.add(v);
  for (const [, v] of content.matchAll(DEF_RE)) defined.add(v);

  const relF = path.relative(root, f).split(path.sep).join('/');
  if (relF === 'shared.css') continue;

  // A page that LINKS shared.css must not re-declare --brand* at all (drift risk).
  if (LINKS_SHARED.test(content)) {
    for (const [, v] of content.matchAll(BRAND_DEF_RE)) {
      brandOffenders.push(`${relF} — re-declares ${v} while linking shared.css (drift risk; remove the override and use var(${v}))`);
    }
  }

  // And EVERY page — linked or self-contained — must not hold a different value for a
  // guarded token. The previous version applied this only to self-contained pages, which
  // meant exactly one page on the site was checked; a linked page overriding
  // --text-muted is if anything more clearly drift, and it exited 0.
  const own = collectVars(content, CANON);
  for (const [name, val] of Object.entries(own)) {
    if (!GUARDED.test(name) || CANON[name] === undefined) continue;
    if (val !== CANON[name]) {
      paletteDrift.push(`${relF} — ${name}: ${val} but shared.css says ${CANON[name]} (palette drift; a page must not hold its own value for a guarded token)`);
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
  console.error(`css-vars: ${paletteDrift.length} palette drift(s):`);
  paletteDrift.forEach(v => console.error('  ' + v));
  console.error('\nA page must not hold its own value for a guarded token. Self-contained pages copy the palette and must be updated when shared.css changes; linked pages should drop the override and inherit.');
  failed = true;
}

if (failed) process.exit(1);

console.log(`css-vars: ${used.size} variables used, all defined; no --brand* overrides on shared.css-linked pages; no palette drift on any page. OK`);
