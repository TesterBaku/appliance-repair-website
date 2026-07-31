// WCAG AA contrast sweep — P6-8 + P6-10.
// Surgical string replacement, never a CSS reparse. Each rule is anchored to the
// selector it belongs to so a shared literal (#767676 appears in many unrelated
// rules) cannot be collaterally rewritten.
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname);
const REPO = 'C:/Rufat_docs/Projects/Applience_site/appliance-repair-website';
const APPLY = process.argv.includes('--apply');
const SKIP = new Set(['node_modules', '.git', '.claude', '.agents', '.audits', '.playwright-mcp', '.staging', '.husky', 'test-results']);

function walk(d, out = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.html') || e.name === 'shared.css') out.push(p);
  }
  return out;
}

// #e84c1e = 3.83:1 against white — fails AA for the 14px .cta-box paragraph.
// #cc3d12 (ember-deep) = 4.95:1, #aa3210 (--brand-deeper) = 6.62:1. Both in the system.
const GRADIENT_NEW = 'linear-gradient(135deg, #cc3d12 0%, #aa3210 100%)';
const RULES = [
  { name: 'cta-gradient-c03a14', from: /\.cta-box \{ background: linear-gradient\(135deg, #e84c1e 0%, #c03a14 100%\);/g, to: `.cta-box { background: ${GRADIENT_NEW};` },
  { name: 'cta-gradient-cc3d12', from: /\.cta-box \{ background: linear-gradient\(135deg, #e84c1e 0%, #cc3d12 100%\);/g, to: `.cta-box { background: ${GRADIENT_NEW};` },
  { name: 'cta-flat',            from: /\.cta-box \{ background: #e84c1e;/g,                                              to: '.cta-box { background: #cc3d12;' },
  // Border is the button's only affordance boundary — WCAG SC 1.4.11 non-text, needs 3:1.
  { name: 'outline-border',      from: /(\.btn-white-outline \{[^}]*?border: 2px solid )rgba\(255,255,255,0\.6\)/g,       to: '$1rgba(255,255,255,0.85)' },
  // 11px #767676 on #090909 = 4.38:1. #999999 (footer-mist) = 6.99:1.
  { name: 'footer-bottom-lit',   from: /(\.footer-bottom \{[^}]*?color: )#767676/g,                                        to: '$1#999999' },
  // Literal, not a token: there is no --footer-mist in shared.css, and the footer is
  // deliberately var()-free anyway (it is stamped into 71 articles that never load
  // shared.css, where an undefined var() would render the text invisible — the exact
  // bug the footer-self-contained check exists to catch, PR #470).
  { name: 'footer-bottom-var',   from: /(\.footer-bottom \{[^}]*?color: )var\(--text-inactive\)/g,                         to: '$1#999999' },
];

const tally = {}, touched = new Set();
for (const p of walk(REPO)) {
  let s = fs.readFileSync(p, 'utf8');
  const before = s;
  for (const r of RULES) {
    const n = (s.match(r.from) || []).length;
    if (!n) continue;
    s = s.replace(r.from, r.to);
    tally[r.name] = (tally[r.name] || 0) + n;
  }
  if (s !== before) {
    touched.add(path.relative(REPO, p).split(path.sep).join('/'));
    if (APPLY) fs.writeFileSync(p, s);
  }
}
console.log(APPLY ? 'APPLIED' : 'DRY RUN');
for (const [k, v] of Object.entries(tally)) console.log(`  ${k.padEnd(22)} ${v}`);
console.log(`  files touched: ${touched.size}`);
