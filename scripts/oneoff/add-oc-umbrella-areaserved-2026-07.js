#!/usr/bin/env node
/**
 * add-oc-umbrella-areaserved-2026-07.js  (LA County expansion, Phase 4)
 *
 * Adds the "Orange County, CA" umbrella entry to the shared LocalBusiness
 * `areaServed` array, mirroring the existing "Los Angeles County, CA" umbrella.
 * This closes the reviewer note left on PR #557 (P1.2): the unified array added
 * a county-level umbrella for the subordinate LA tier but never added one for
 * the *primary* OC tier, so the array named 24 OC cities + an LA umbrella but no
 * OC umbrella — an asymmetric, incomplete signal for a single shared @id.
 *
 * The OC umbrella is placed at the END of the OC city block (right after
 * "Fountain Valley, CA"), so each county umbrella sits immediately after its own
 * city list: OC cities → "Orange County, CA" → LA cities → "Los Angeles County, CA".
 * OC stays first/primary; LA stays subordinate.
 *
 * Canon below is the CURRENT live array (post-#557 + the Long Beach insertion of
 * 2026-07-08) with the one new umbrella added. Full-array replace normalizes any
 * incidental whitespace drift and is validated to still parse as JSON-LD.
 *
 * Scope: only the LocalBusiness `areaServed` (array form). The Service schema's
 * `areaServed` OBJECT ({ @type: AdministrativeArea }) is left untouched — its
 * "areaServed": { form matches neither the array regex nor CANON. `address` is
 * never touched (stays Stanton).
 *
 * Idempotent (re-running is a no-op once CANON is in place). Validates every
 * JSON-LD block still parses after the edit.
 * Usage:  node scripts/oneoff/add-oc-umbrella-areaserved-2026-07.js [--dry]
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const DRY = process.argv.includes('--dry');

// Canonical value — current live OC+LA array (incl. Long Beach) with the new
// "Orange County, CA" umbrella appended to the OC block.
const CANON = `"areaServed": [
      "Stanton, CA","Irvine, CA","Anaheim, CA","Santa Ana, CA",
      "Huntington Beach, CA","Costa Mesa, CA","Fullerton, CA",
      "Garden Grove, CA","Tustin, CA","Orange, CA","Lake Forest, CA",
      "Mission Viejo, CA","Newport Beach, CA","Brea, CA","Yorba Linda, CA",
      "Westminster, CA","Seal Beach, CA","Dana Point, CA","Laguna Beach, CA",
      "Laguna Niguel, CA","Buena Park, CA","Los Alamitos, CA",
      "Rancho Santa Margarita, CA","Fountain Valley, CA","Orange County, CA",
      "Pico Rivera, CA","Whittier, CA","Downey, CA","Long Beach, CA","Montebello, CA",
      "Santa Fe Springs, CA","Norwalk, CA","Los Angeles County, CA"
    ]`;

const ARRAY_RE = /"areaServed":\s*\[[\s\S]*?\]/;   // LocalBusiness array form (Service form is an object → no match)

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
    catch (e) { return `${rel}: JSON-LD parse error after edit — ${e.message}`; }
  }
  return null;
}

let changed = 0, skipped = 0;
const errors = [];

for (const rel of listHtml()) {
  const abs = path.join(root, rel);
  const orig = fs.readFileSync(abs, 'utf8');
  if (!ARRAY_RE.test(orig)) { skipped++; continue; }

  // Preserve the file's line-ending convention (this repo is CRLF; keep it).
  const canon = CANON.replace(/\n/g, orig.includes('\r\n') ? '\r\n' : '\n');

  const out = orig.replace(ARRAY_RE, canon);
  if (out === orig) { skipped++; continue; } // already canonical

  const err = jsonLdBlocksValid(out, rel);
  if (err) { errors.push(err); continue; }

  if (!DRY) fs.writeFileSync(abs, out);
  changed++;
  console.log(`${DRY ? 'would update' : 'updated'}: ${rel}`);
}

console.log(`\n${DRY ? '[dry run] ' : ''}${changed} file(s) ${DRY ? 'to update' : 'updated'}, ${skipped} skipped.`);
if (errors.length) { console.error(`\nERRORS (${errors.length}):`); errors.forEach(e => console.error('  ' + e)); process.exit(1); }
