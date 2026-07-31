// Generate test/faq-parity-baseline.json from the CURRENT state of master.
// Reuses the exact parsing the check uses, by requiring nothing — the logic is
// duplicated deliberately so a bug in one is not silently mirrored by the other.
const fs = require('fs'), path = require('path');
const ROOT = 'C:/Rufat_docs/Projects/Applience_site/appliance-repair-website';
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
  if (qs.length !== ld.length) { countMismatch[rel] = { visible: qs.length, jsonld: ld.length }; continue; }
  let bad = 0;
  for (let i = 0; i < ld.length; i++) {
    if (norm(ld[i].q) !== qs[i]) bad++;
    if (norm(ld[i].a) !== (as[i] ?? '')) bad++;
  }
  if (bad) drift[rel] = bad;
}
const sorted = Object.fromEntries(Object.entries(drift).sort(([a], [b]) => a.localeCompare(b)));
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
