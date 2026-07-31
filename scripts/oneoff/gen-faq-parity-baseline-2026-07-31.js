// Generate test/faq-parity-baseline.json from the CURRENT state of master.
// Reuses the exact parsing the check uses, by requiring nothing — the logic is
// duplicated deliberately so a bug in one is not silently mirrored by the other.
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const SKIP = new Set(['node_modules', '.git', '.claude', '.agents', '.audits', '.playwright-mcp', '.staging', '.husky', 'test-results', 'partials']);
function walk(d, out = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, out); else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}
const decode = (s) => s.replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>')
  .replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&rsquo;/g,'\u2019').replace(/&lsquo;/g,'\u2018')
  .replace(/&ldquo;/g,'\u201c').replace(/&rdquo;/g,'\u201d').replace(/&middot;/g,'\u00b7')
  .replace(/&ndash;/g,'\u2013').replace(/&mdash;/g,'\u2014').replace(/&rarr;/g,'\u2192').replace(/&hellip;/g,'\u2026');
const stripDeco = (s) => s.replace(/<span\b[^>]*\baria-hidden="true"[^>]*>[\s\S]*?<\/span>/g,'')
  .replace(/<span\b[^>]*\bclass="[^"]*\bicon\b[^"]*"[^>]*>[\s\S]*?<\/span>/g,'')
  .replace(/<span\b[^>]*\bclass="[^"]*\bfaq-icon\b[^"]*"[^>]*>[\s\S]*?<\/span>/g,'');
const norm = (s) => decode(s.replace(/<[^>]+>/g,'')).replace(/\s+/g,' ').trim();

const drift = {}, countMismatch = {};
for (const p of walk(ROOT)) {
  const c = fs.readFileSync(p, 'utf8');
  const rel = path.relative(ROOT, p).split(path.sep).join('/');
  const ld = []; let saw = false;
  for (const m of c.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    let j; try { j = JSON.parse(m[1]); } catch { continue; }
    for (const n of (Array.isArray(j) ? j : [j])) {
      if (!n || n['@type'] !== 'FAQPage' || !Array.isArray(n.mainEntity)) continue;
      saw = true;
      for (const q of n.mainEntity) ld.push({ q: q.name || '', a: (q.acceptedAnswer && q.acceptedAnswer.text) || '' });
    }
  }
  if (!saw) continue;
  const Q = /<(button|div|h[2-4])\b[^>]*\bclass="[^"]*\bfaq-q\b[^"]*"[^>]*>([\s\S]*?)<\/\1>/g;
  const A = /<(div|p)\b[^>]*\bclass="[^"]*\bfaq-a\b[^"]*"[^>]*>([\s\S]*?)<\/\1>/g;
  let qs = [...c.matchAll(Q)].map(m => norm(stripDeco(m[2])));
  let as = [...c.matchAll(A)].map(m => norm(m[2]));
  if (!qs.length && !as.length) {
    const ITEM = /<div\b[^>]*\bclass="[^"]*\bfaq-item\b[^"]*"[^>]*>([\s\S]*?)<\/div>/g;
    for (const m of c.matchAll(ITEM)) {
      const h = m[1].match(/<(h[2-4])\b[^>]*>([\s\S]*?)<\/\1>/);
      const ps = [...m[1].matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)].map(x => norm(x[1]));
      if (!h || !ps.length) continue;
      qs.push(norm(stripDeco(h[2]))); as.push(ps.join(' '));
    }
  }
  if (!qs.length) continue;
  // A count mismatch is recorded AND the overlapping pairs are still compared. The
  // first version `continue`d here, which meant a count-mismatch file was exempt from
  // text checking in both the generator and the check — a fabricated JSON-LD answer
  // on that file passed clean. Caught in the PR #656 review.
  if (qs.length !== ld.length) countMismatch[rel] = { visible: qs.length, jsonld: ld.length };
  let bad = 0;
  for (let i = 0; i < Math.min(qs.length, ld.length); i++) {
    if (norm(ld[i].q) !== qs[i]) bad++;
    if (norm(ld[i].a) !== (as[i] ?? '')) bad++;
  }
  if (bad) drift[rel] = bad;
}
const sorted = Object.fromEntries(Object.entries(drift).sort(([a], [b]) => a.localeCompare(b)));

// THE GENERATOR IS ITSELF A RATCHET.
// A regenerator that rewrites the baseline unconditionally defeats the entire check:
// run it after introducing new drift and the debt silently grows while the next
// `npm test` reports a clean pass, because the summary echoes the file it just wrote.
// So refuse to write anything that would ADD a file or RAISE a count. Shrinking is
// always allowed — that is the whole point of paying the debt down.
const BASELINE_PATH = path.join(ROOT, 'test', 'faq-parity-baseline.json');
if (fs.existsSync(BASELINE_PATH) && !process.argv.includes('--allow-growth')) {
  const prev = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'));
  const prevDrift = prev.drift || {};
  const prevCount = prev.countMismatch || {};
  const grew = [];
  for (const [f, n] of Object.entries(sorted)) {
    if (!(f in prevDrift)) grew.push(`  NEW FILE  ${f} (${n} field(s))`);
    else if (n > prevDrift[f]) grew.push(`  WORSE     ${f} (${prevDrift[f]} → ${n})`);
  }
  for (const f of Object.keys(countMismatch)) {
    if (!(f in prevCount)) grew.push(`  NEW COUNT MISMATCH  ${f}`);
  }
  if (grew.length) {
    console.error('\nREFUSING TO WRITE — this would GROW the baseline:\n');
    grew.forEach(l => console.error(l));
    console.error('\nThe baseline may only shrink. Fix the new drift instead of recording it.');
    console.error('If you genuinely must record growth (e.g. a bulk import), re-run with --allow-growth.\n');
    process.exit(1);
  }
}
const out = {
  _README: [
    "BASELINE OF PRE-EXISTING FAQ / FAQPage JSON-LD DRIFT. This is a RATCHET, not an allowlist.",
    "Recorded 2026-07-31 when the faq-jsonld-parity check was first written. Until then NOTHING in",
    "npm test compared visible FAQ text to the FAQPage structured data, so this drift accumulated",
    "silently. Google reads the JSON-LD and the user reads the DOM; when they disagree the rich",
    "result misrepresents the page, which is a documented rich-result violation.",
    "",
    "The check FAILS if: a file not listed here has drift; a listed file's count INCREASES; or a",
    "listed file becomes clean but is still listed. That last rule is what stops this file from",
    "rotting into permanent silence - the baseline can only ever shrink.",
    "",
    "To pay a file down: fix its FAQPage JSON-LD to match the visible copy verbatim, then delete",
    "its line here (or lower the number). Tracked in tasks/backlog.md as P6-12."
  ],
  recorded: "2026-07-31",
  totalFields: Object.values(sorted).reduce((a, b) => a + b, 0),
  totalFiles: Object.keys(sorted).length,
  countMismatch,
  drift: sorted
};
fs.writeFileSync(path.join(ROOT, 'test', 'faq-parity-baseline.json'), JSON.stringify(out, null, 2) + '\n');
console.log(`wrote test/faq-parity-baseline.json — ${out.totalFields} fields across ${out.totalFiles} files; ${Object.keys(countMismatch).length} count mismatch`);
