// P6-15 candidate sweep. Uses elementsFromPoint at the element's own centre to find
// the REAL painted backdrop, which a DOM-ancestor walk cannot do: the hub hero paints
// via absolutely-positioned SIBLINGS (.hub-hero-bg / .hub-hero-overlay), so an ancestor
// walk finds no background, defaults to white, and reports white-on-white at 1:1.
// That false-positive class swamped the first run.
import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const SKIP = new Set(['node_modules', '.git', '.claude', '.agents', '.audits', '.playwright-mcp', '.staging', '.husky', 'test-results', 'partials']);
function walk(d, out = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, out); else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}
const pages = walk(ROOT).map(p => '/' + path.relative(ROOT, p).split(path.sep).join('/'));

const PROBE = () => {
  const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const L = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  const ratio = (a, b) => { const [x, y] = [L(a), L(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
  const parse = (s) => { const p = (s.match(/[\d.]+/g) || []).map(Number); return { rgb: p.slice(0, 3), a: p.length > 3 ? p[3] : 1 }; };
  const over = (top, under) => top.rgb.map((v, i) => Math.round(v * top.a + under[i] * (1 - top.a)));

  // Composite every painted layer under the point, back to front. Returns null when a
  // raster image is in the stack, because its pixel colour is not knowable from CSS.
  const paintedAt = (x, y, stopEl) => {
    const stack = document.elementsFromPoint(x, y);
    if (!stack.length) return null;
    const idx = stack.indexOf(stopEl);
    // INCLUDE stopEl: an element's own background paints behind its own text, so
    // skipping it reported .nav-cta (white on brand orange) as white-on-white 1.02:1.
    const under = (idx >= 0 ? stack.slice(idx) : stack).reverse();  // farthest -> nearest
    let acc = [255, 255, 255];
    for (const el of under) {
      // A replaced element (a real <img>/<video>/<svg>, e.g. .article-hero-img) paints
      // pixels that CSS cannot tell us. Walking past it lands on white and reports every
      // hero caption as white-on-white — the artefact class that dominated earlier runs.
      if (/^(IMG|VIDEO|SVG|CANVAS|PICTURE)$/.test(el.tagName)) return null;
      const cs = getComputedStyle(el);
      const bi = cs.backgroundImage;
      if (bi && /url\(/.test(bi)) return null;
      if (bi && bi.includes('gradient')) {
        const st = (bi.match(/rgba?\([^)]+\)/g) || []).map(parse);
        if (st.length) {                       // worst (lightest) stop
          let worst = null, worstL = -1;
          for (const s of st) { const c = over(s, acc); const l = L(c); if (l > worstL) { worstL = l; worst = c; } }
          acc = worst;
          continue;
        }
      }
      const bc = parse(cs.backgroundColor);
      if (bc.a > 0) acc = over(bc, acc);
    }
    return acc;
  };

  const sel = (el) => {
    if (el.id) return '#' + el.id;
    const cls = (el.getAttribute('class') || '').trim().split(/\s+/).filter(Boolean).slice(0, 2).join('.');
    return el.tagName.toLowerCase() + (cls ? '.' + cls : '');
  };
  // Emoji / symbol glyphs render from a colour font in their own palette; the CSS
  // `color` barely applies, so a contrast number for them is meaningless.
  const GLYPH = /^[\s\p{Extended_Pictographic}★☆←-⇿✀-➿️‍]+$/u;

  const out = [];
  for (const el of document.querySelectorAll('body *')) {
    const own = [...el.childNodes].filter(n => n.nodeType === 3 && n.textContent.trim().length > 1);
    if (!own.length) continue;
    const txt = own.map(n => n.textContent).join(' ').trim();
    if (GLYPH.test(txt)) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) === 0) continue;
    const rects = el.getClientRects();
    if (!rects.length) continue;
    const r0 = rects[0];
    if (r0.width < 2 || r0.height < 2) continue;
    const bg = paintedAt(Math.round(r0.left + r0.width / 2), Math.round(r0.top + Math.min(r0.height / 2, 8)), el);
    if (!bg) continue;                                   // raster backdrop, not knowable
    const size = parseFloat(cs.fontSize);
    const weight = parseInt(cs.fontWeight, 10) || 400;
    const need = (size >= 24 || (size >= 18.66 && weight >= 700)) ? 3 : 4.5;
    const fg = over(parse(cs.color), bg);
    const r = ratio(fg, bg);
    if (r >= need) continue;
    const hex=(c)=>'#'+c.map(v=>v.toString(16).padStart(2,'0')).join('');
    out.push({ sel: sel(el), r: +r.toFixed(2), need, size, weight, fg: hex(fg), bg: hex(bg), text: txt.slice(0, 40) });
  }
  return out;
};

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 1440, height: 12000 });   // tall: elementsFromPoint needs the element IN the viewport
const bySel = new Map();
let scanned = 0, total = 0;
for (const u of pages) {
  try {
    await page.goto('http://localhost:8788' + u, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const rows = await page.evaluate(PROBE);
    scanned++; total += rows.length;
    for (const r of rows) {
      const k = `${r.sel} :: ${r.fg} on ${r.bg} = ${r.r}:1 need ${r.need} (${r.size}px/${r.weight})`;
      if (!bySel.has(k)) bySel.set(k, { n: 0, ex: r.text, page: u });
      bySel.get(k).n++;
    }
  } catch (e) { console.error('SKIP', u, String(e).slice(0, 50)); }
}
await browser.close();
console.log(`\npages scanned: ${scanned}`);
console.log(`failing text elements: ${total}`);
console.log(`distinct combinations: ${bySel.size}\n`);
for (const [k, v] of [...bySel].sort((a, b) => b[1].n - a[1].n)) {
  console.log(`${String(v.n).padStart(5)}  ${k}`);
  console.log(`        e.g. ${v.page}  "${v.ex}"`);
}
