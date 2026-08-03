// Full-corpus mobile occlusion harness. Run: node scripts/oneoff/measure-mobile-occlusion-2026-08-03.js
// Task 3 measurement: which article pages have hero content occluded by the fixed nav at 375px?
// The backlog inherited "~9 articles" from the PR #659 sweep. Measure it rather than trust it.
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const PORT = 8791;

(async () => {
  const srv = spawn(process.execPath, [path.join(ROOT, 'test/serve.js')], {
    cwd: ROOT, env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore',
  });
  await new Promise(r => setTimeout(r, 1500));

  const files = fs.readdirSync(path.join(ROOT, 'articles'))
    .filter(f => f.startsWith('article-') && f.endsWith('.html'));

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  const bad = [];

  for (const f of files) {
    try {
      await page.goto(`http://localhost:${PORT}/articles/${f}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      const r = await page.evaluate(() => {
        const nav = document.querySelector('nav, .nav');
        if (!nav) return null;
        const ns = getComputedStyle(nav);
        if (ns.position !== 'fixed') return null;
        const navBottom = nav.getBoundingClientRect().bottom;
        const out = { navBottom, occluded: [], h1: null, overflowX: false };
        out.overflowX = document.documentElement.scrollWidth > window.innerWidth + 1;
        const h1 = document.querySelector('h1');
        if (h1) {
          const b = h1.getBoundingClientRect();
          out.h1 = { top: Math.round(b.top), h: Math.round(b.height), lines: Math.round(b.height / (parseFloat(getComputedStyle(h1).lineHeight) || 1)) };
          if (b.top < navBottom) out.occluded.push('h1');
        }
        // meta chips / byline directly under the hero
        for (const sel of ['.article-meta', '.meta', '.article-hero .meta', '.hero-meta', '.breadcrumb']) {
          const el = document.querySelector(sel);
          if (!el) continue;
          const b = el.getBoundingClientRect();
          if (b.height > 0 && b.top < navBottom && b.bottom > 0) out.occluded.push(sel);
        }
        return out;
      });
      if (r && (r.occluded.length || r.overflowX)) {
        bad.push({ f, occluded: r.occluded, overflowX: r.overflowX, h1: r.h1, navBottom: Math.round(r.navBottom) });
      }
    } catch (e) {
      bad.push({ f, error: String(e).slice(0, 80) });
    }
  }

  await browser.close();
  srv.kill();

  console.log(`scanned ${files.length} articles at 375x812`);
  console.log(`pages with occluded hero content or horizontal overflow: ${bad.length}\n`);
  for (const b of bad) console.log('  ', JSON.stringify(b));
})();
