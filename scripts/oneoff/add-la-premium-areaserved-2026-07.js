#!/usr/bin/env node
/**
 * add-la-premium-areaserved-2026-07.js  (LA Premium layer, pilot hub)
 *
 * Extends the canonical LocalBusiness `areaServed` (shared @id="…/#business") with
 * the four LA Premium-tier cities: Beverly Hills, Santa Monica, Pasadena, and
 * Manhattan Beach.
 *
 * Owner Phase 0 (2026-07-30): premium-brand service only in those four cities, at a
 * flat $150 diagnostic. The fee is page copy, never expressed in areaServed.
 *
 * NO new county umbrella: all four are Los Angeles County, and
 * "Los Angeles County, CA" is already in the array. The four cities are therefore
 * slotted INSIDE the existing LA block, immediately before that umbrella, so the
 * doc-mandated structure (cities -> their county umbrella) still holds.
 *
 * Scope: only the LocalBusiness `areaServed` array/string form. The Service schema's
 * `areaServed` OBJECT is left untouched. `address` is never touched (stays Stanton).
 * Idempotent; re-running is a no-op once canonical.
 *
 * ⚠ Lesson from PR #581: that Riverside script was built on a STALE canonical array and
 * silently regressed the OC umbrella + Long Beach off every page. The CANON below was
 * copied from the live array in index.html on 2026-07-30, and --verify re-reads every
 * file afterwards to prove no previously-present entry was dropped.
 *
 * Usage:  node scripts/oneoff/add-la-premium-areaserved-2026-07.js [--dry] [--verify]
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const DRY = process.argv.includes('--dry');
const VERIFY = process.argv.includes('--verify');

// Canonical value: OC block + OC umbrella, LA Gateway Cities + the 4 premium cities +
// LA County umbrella, Riverside-tier cities + Riverside umbrella.
const CANON = `"areaServed": [
      "Stanton, CA","Irvine, CA","Anaheim, CA","Santa Ana, CA",
      "Huntington Beach, CA","Costa Mesa, CA","Fullerton, CA",
      "Garden Grove, CA","Tustin, CA","Orange, CA","Lake Forest, CA",
      "Mission Viejo, CA","Newport Beach, CA","Brea, CA","Yorba Linda, CA",
      "Westminster, CA","Seal Beach, CA","Dana Point, CA","Laguna Beach, CA",
      "Laguna Niguel, CA","Buena Park, CA","Los Alamitos, CA",
      "Rancho Santa Margarita, CA","Fountain Valley, CA","Orange County, CA",
      "Pico Rivera, CA","Whittier, CA","Downey, CA","Long Beach, CA","Montebello, CA",
      "Santa Fe Springs, CA","Norwalk, CA","Beverly Hills, CA","Santa Monica, CA",
      "Pasadena, CA","Manhattan Beach, CA","Los Angeles County, CA",
      "Corona, CA","Norco, CA","Eastvale, CA","Chino, CA","Chino Hills, CA",
      "Riverside County, CA"
    ]`;

// Every entry the canonical array must contain. --verify fails if a file is missing any.
const REQUIRED = CANON.match(/"([^"]+, CA)"/g).map(s => s.slice(1, -1));

const ARRAY_RE = /"areaServed":\s*\[[\s\S]*?\]/;             // LocalBusiness array form
const STRING_RE = /"areaServed":\s*"Orange County, CA"/;     // LocalBusiness string form (legacy)

function listHtml() {
  const files = ['index.html'];
  for (const dir of ['pages', 'articles']) {
    const abs = path.join(root, dir);
    if (!fs.existsSync(abs)) continue;
    for (const f of fs.readdirSync(abs)) if (f.endsWith('.html')) files.push(path.join(dir, f));
  }
  return files;
}

function jsonLdBlocksValid(html, rel) {
  const re = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    try { JSON.parse(m[1]); }
    catch (e) { return `${rel}: JSON-LD parse error after edit: ${e.message}`; }
  }
  return null;
}

// --verify: read-only audit. Every file carrying a LocalBusiness areaServed ARRAY must
// contain the full canonical entry set, so a regression like #581 is caught immediately.
if (VERIFY) {
  let checked = 0;
  const bad = [];
  for (const rel of listHtml()) {
    const html = fs.readFileSync(path.join(root, rel), 'utf8');
    const m = html.match(ARRAY_RE);
    if (!m) continue;
    checked++;
    const missing = REQUIRED.filter(city => !m[0].includes(`"${city}"`));
    if (missing.length) bad.push(`${rel}: missing ${missing.join(', ')}`);
  }
  console.log(`[verify] ${checked} file(s) carry a LocalBusiness areaServed array.`);
  if (bad.length) {
    console.error(`\nFAIL (${bad.length} file(s) incomplete):`);
    bad.forEach(b => console.error('  ' + b));
    process.exit(1);
  }
  console.log('[verify] PASS - every file carries all ' + REQUIRED.length + ' canonical entries.');
  process.exit(0);
}

let changed = 0, skipped = 0;
const errors = [];

for (const rel of listHtml()) {
  const abs = path.join(root, rel);
  const orig = fs.readFileSync(abs, 'utf8');
  if (!/"areaServed"/.test(orig)) { skipped++; continue; }

  // Preserve the file's line-ending convention (this repo is CRLF; keep it).
  const canon = CANON.replace(/\n/g, orig.includes('\r\n') ? '\r\n' : '\n');

  let out = orig;
  if (ARRAY_RE.test(out)) out = out.replace(ARRAY_RE, canon);
  else if (STRING_RE.test(out)) out = out.replace(STRING_RE, canon);
  else { skipped++; continue; } // only the Service object form present, or already canonical

  if (out === orig) { skipped++; continue; }

  const err = jsonLdBlocksValid(out, rel);
  if (err) { errors.push(err); continue; }

  if (!DRY) fs.writeFileSync(abs, out);
  changed++;
  console.log(`${DRY ? 'would update' : 'updated'}: ${rel}`);
}

console.log(`\n${DRY ? '[dry run] ' : ''}${changed} file(s) ${DRY ? 'to update' : 'updated'}, ${skipped} skipped.`);
if (errors.length) { console.error(`\nERRORS (${errors.length}):`); errors.forEach(e => console.error('  ' + e)); process.exit(1); }
