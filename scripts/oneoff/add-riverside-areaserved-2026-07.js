#!/usr/bin/env node
/**
 * add-riverside-areaserved-2026-07.js  (Riverside County expansion, Corona pilot)
 *
 * Extends the canonical LocalBusiness `areaServed` (shared @id="…/#business") to
 * add the Riverside-tier service cities and the "Riverside County, CA" umbrella,
 * on top of the existing OC + LA County array set by add-la-county-areaserved.
 *
 * Owner Phase 0 (2026-07-10): city list Corona, Norco, Eastvale, Chino, Chino
 * Hills. Chino + Chino Hills are San Bernardino County, so they are listed as
 * individual served cities but the county UMBRELLA added is Riverside only (no
 * false San Bernardino county claim). Fee tier for Riverside is $120 (page copy;
 * not expressed in areaServed).
 *
 * Scope: only the LocalBusiness `areaServed` array/string form. The Service
 * schema's `areaServed` OBJECT is left untouched. `address` is never touched
 * (stays Stanton). Idempotent; re-running is a no-op once canonical.
 * Usage:  node scripts/oneoff/add-riverside-areaserved-2026-07.js [--dry]
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const DRY = process.argv.includes('--dry');

// Canonical value: the OC + LA block (unchanged from add-la-county-areaserved)
// plus the 5 Riverside-tier cities + the "Riverside County, CA" umbrella.
const CANON = `"areaServed": [
      "Stanton, CA","Irvine, CA","Anaheim, CA","Santa Ana, CA",
      "Huntington Beach, CA","Costa Mesa, CA","Fullerton, CA",
      "Garden Grove, CA","Tustin, CA","Orange, CA","Lake Forest, CA",
      "Mission Viejo, CA","Newport Beach, CA","Brea, CA","Yorba Linda, CA",
      "Westminster, CA","Seal Beach, CA","Dana Point, CA","Laguna Beach, CA",
      "Laguna Niguel, CA","Buena Park, CA","Los Alamitos, CA",
      "Rancho Santa Margarita, CA","Fountain Valley, CA","Orange County, CA",
      "Pico Rivera, CA","Whittier, CA","Downey, CA","Long Beach, CA","Montebello, CA",
      "Santa Fe Springs, CA","Norwalk, CA","Los Angeles County, CA",
      "Corona, CA","Norco, CA","Eastvale, CA","Chino, CA","Chino Hills, CA",
      "Riverside County, CA"
    ]`;

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
