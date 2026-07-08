// Batch full-page screenshot gate. Runs on Playwright's Chromium (the same
// browser the functional suite uses) so the repo ships a single browser
// toolchain. CLI contract is unchanged from the previous Puppeteer version:
// same page discovery, same MISSING/OK/FAIL output lines, same exit codes.
const { chromium } = require('@playwright/test');
const { pathToFileURL } = require('url');
const path = require('path');
const fs = require('fs');

const root = path.resolve(__dirname, '..');

// Auto-discover: root index + all pages/ + all articles/
const pagesDir = path.join(root, 'pages');
const articleDir = path.join(root, 'articles');

const rootPages = ['index.html', '404.html'];
const staticPages = fs.existsSync(pagesDir)
  ? fs.readdirSync(pagesDir)
      .filter(f => f.endsWith('.html'))
      .map(f => path.join('pages', f))
  : [];
const articlePages = fs.existsSync(articleDir)
  ? fs.readdirSync(articleDir)
      .filter(f => f.startsWith('article-') && f.endsWith('.html'))
      .map(f => path.join('articles', f))
  : [];
const pages = [...rootPages, ...staticPages, ...articlePages];

const outDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

(async () => {
  const browser = await chromium.launch();
  const failures = [];

  for (const page of pages) {
    const filePath = path.resolve(root, page);
    if (!fs.existsSync(filePath)) {
      console.error(`MISSING: ${page}`);
      failures.push(page);
      continue;
    }
    try {
      const p = await browser.newPage({ viewport: { width: 1280, height: 800 } });
      await p.goto(pathToFileURL(filePath).href);
      const shotName = page.replace(/[\\/]/g, '__');
      await p.screenshot({ path: path.join(outDir, `${shotName}.png`), fullPage: true });
      console.log(`OK: ${page}`);
      await p.close();
    } catch (err) {
      console.error(`FAIL: ${page} - ${err.message}`);
      failures.push(page);
    }
  }

  await browser.close();

  if (failures.length) {
    console.error(`\n${failures.length} page(s) failed: ${failures.join(', ')}`);
    process.exit(1);
  } else {
    console.log('\nAll screenshots captured successfully.');
  }
})();
