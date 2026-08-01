// WCAG AA sweep round 2 — P6-14, widened.
// Rewrites ONLY inside rules that actually fail, never a blanket literal replace:
// #e84c1e is also used for borders, icon fills and large-text surfaces that legitimately
// pass at the 3:1 threshold (.step-number is white on #e84c1e at 20px/800 = large text).
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
const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const h2r = (h) => { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16)); };
const L = (r) => 0.2126 * lin(r[0]) + 0.7152 * lin(r[1]) + 0.0722 * lin(r[2]);
const ratio = (a, b) => { const [x, y] = [L(h2r(a)), L(h2r(b))].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };

// from -> to, applied only where the pairing actually fails.
//   #e84c1e as a BACKGROUND under white text  -> #cc3d12 (4.95:1)
//   #e84c1e as FOREGROUND on white / #fff7ed  -> #aa3210 (6.62 / 6.23:1), which is
//     exactly what --brand-text exists for: "WCAG AA for small text on any light bg"
//   #888 on #f8f9fa                            -> #666666 (5.45:1). #767676 is only
//     4.31:1 there, so chalk is NOT a valid target.
const BG_FIX = { '#e84c1e': '#cc3d12' };
const FG_FIX = { '#e84c1e': '#aa3210', '#888': '#666666', '#888888': '#666666' };
// .inline-cta already ships a corrected form on 19 articles; converge on it exactly
// rather than leaving two passing-but-different gradients.
const GRADIENT_PAIR = [/linear-gradient\(135deg, #e84c1e, #c2410c\)/g, 'linear-gradient(135deg, #cc3d12, #9e300a)'];

const HEXRE = /#[0-9a-fA-F]{3,8}\b/;
const tally = {}, touched = new Set();

for (const p of walk(REPO)) {
  let src = fs.readFileSync(p, 'utf8');
  const orig = src;
  const rel = path.relative(REPO, p).split(path.sep).join('/');

  src = src.replace(/([^{}]+)\{([^}]*)\}/g, (whole, sel, body) => {
    const cm = body.match(/(?:^|[;{\s])color\s*:\s*([^;]+)/);
    const bm = body.match(/(?:^|[;{\s])background(?:-color)?\s*:\s*([^;]+)/);
    if (!cm || !bm) return whole;
    const cRaw = cm[1].trim(), bRaw = bm[1].trim();
    if (!HEXRE.test(cRaw) || !HEXRE.test(bRaw)) return whole;
    const cHex = (cRaw.match(HEXRE) || [])[0];
    const bHexes = bRaw.match(/#[0-9a-fA-F]{3,8}\b/g) || [];
    if (!cHex || !bHexes.length) return whole;
    const size = parseFloat((body.match(/font-size\s*:\s*([\d.]+)px/) || [, '16'])[1]);
    const weight = parseInt((body.match(/font-weight\s*:\s*(\d+)/) || [, '400'])[1], 10);
    const need = (size >= 24 || (size >= 18.66 && weight >= 700)) ? 3 : 4.5;

    const failing = bHexes.filter(b => { try { return ratio(cHex, b) < need; } catch { return false; } });
    if (!failing.length) return whole;

    let nb = body;
    const name = sel.trim().split('\n').pop().trim();
    // Prefer darkening the background when the text is white; otherwise darken the text.
    // Normalise before testing. An earlier version tested a 3-digit hex by
    // substituting the literal string #fff, which made EVERY 3-digit colour look
    // white and routed #888 down the background branch, silently skipping it.
    const norm = (h) => { h = h.replace("#", ""); return h.length === 3 ? h.split("").map(c => c + c).join("") : h; };
    const isWhiteText = norm(cHex).toLowerCase() === "ffffff";
    if (isWhiteText) {
      for (const f of failing) {
        if (!BG_FIX[f.toLowerCase()]) continue;
        nb = nb.replace(new RegExp(f.replace('#', '#'), 'gi'), BG_FIX[f.toLowerCase()]);
        tally[`bg ${f}->${BG_FIX[f.toLowerCase()]} (${name})`] = (tally[`bg ${f}->${BG_FIX[f.toLowerCase()]} (${name})`] || 0) + 1;
      }
    } else {
      const to = FG_FIX[cHex.toLowerCase()];
      if (!to) return whole;
      nb = nb.replace(new RegExp(`(color\\s*:\\s*)${cHex}\\b`, 'gi'), `$1${to}`);
      tally[`fg ${cHex}->${to} (${name})`] = (tally[`fg ${cHex}->${to} (${name})`] || 0) + 1;
    }
    return nb === body ? whole : whole.replace(body, nb);
  });

  // converge the .inline-cta gradient on the already-shipped corrected pair
  const before = src;
  src = src.replace(GRADIENT_PAIR[0], GRADIENT_PAIR[1]);
  if (src !== before) tally['inline-cta gradient -> #cc3d12,#9e300a'] = (tally['inline-cta gradient -> #cc3d12,#9e300a'] || 0) + 1;

  if (src !== orig) { touched.add(rel); if (APPLY) fs.writeFileSync(p, src); }
}
console.log(APPLY ? 'APPLIED' : 'DRY RUN');
for (const [k, v] of Object.entries(tally).sort((a, b) => b[1] - a[1])) console.log(`  ${String(v).padStart(4)}  ${k}`);
console.log(`  files touched: ${touched.size}`);
