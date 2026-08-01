// WCAG AA sweep round 3 — P6-15 cross-rule bucket.
//
// Rounds 1 and 2 fixed pairs declared in the SAME rule, which is all a static scanner
// can see. This round targets the bucket that only exists at render time: a `color`
// declared in one rule against a `background` declared in another. Found by a rendered
// in-browser sweep (scripts/oneoff/_sweep-contrast.mjs history, PR #659), which
// measured ~1,100 failing text instances across 165 pages.
//
// Rewrites TEXT COLOUR ONLY. `(?<!-)color:` is load-bearing — without it the lazy match
// lands inside `border-color:` and inverts the fix, which is exactly what happened to
// `.filter-pill:hover` in PR #658 and shipped backwards.
//
//   #e84c1e -> #aa3210   3.83/3.65:1 -> 6.62/6.31:1   (brand text on light)
//   #767676 -> #666666   4.54/4.33:1 -> 5.74/5.48:1   (passes on white, FAILS on #f7fafc)
//   #888888 -> #666666   3.54:1      -> 5.74:1
//   #059669 -> #047857   3.77:1      -> 5.48:1        (the one green in the palette)
//
// Backgrounds are untouched: #e84c1e stays a legitimate surface colour for borders,
// icon fills and large text, and rounds 1-2 already darkened it where it sat under
// small white text.
const fs = require('fs'), path = require('path');
const REPO = path.resolve(__dirname, '..', '..');
const APPLY = process.argv.includes('--apply');
const SKIP = new Set(['node_modules', '.git', '.claude', '.agents', '.audits', '.playwright-mcp', '.staging', '.husky', 'test-results']);

function walk(d, out = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.html') || e.name.endsWith('.css')) out.push(p);
  }
  return out;
}

const MAP = { '#e84c1e': '#aa3210', '#767676': '#666666', '#888888': '#666666', '#888': '#666666', '#059669': '#047857' };

const tally = {};
const touched = new Set();
for (const p of walk(REPO)) {
  let s = fs.readFileSync(p, 'utf8');
  const orig = s;
  for (const [from, to] of Object.entries(MAP)) {
    // `(?<!-)` keeps this off border-color / outline-color / text-decoration-color etc.
    const re = new RegExp(`((?<!-)\\bcolor\\s*:\\s*)${from}\\b`, 'gi');
    const n = (s.match(re) || []).length;
    if (!n) continue;
    s = s.replace(re, `$1${to}`);
    tally[`${from} -> ${to}`] = (tally[`${from} -> ${to}`] || 0) + n;
  }
  if (s !== orig) { touched.add(path.relative(REPO, p).split(path.sep).join('/')); if (APPLY) fs.writeFileSync(p, s); }
}
console.log(APPLY ? 'APPLIED' : 'DRY RUN');
for (const [k, v] of Object.entries(tally).sort((a, b) => b[1] - a[1])) console.log(`  ${String(v).padStart(5)}  ${k}`);
console.log(`  files touched: ${touched.size}`);
