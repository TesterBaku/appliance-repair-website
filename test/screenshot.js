const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const root = path.resolve(__dirname, '..');
const staticPages = ['index', 'about', 'services', 'contact', 'faq', 'testimonials', 'blog'];
const articlePages = fs.readdirSync(root)
  .filter(f => f.startsWith('article-') && f.endsWith('.html'))
  .map(f => f.replace('.html', ''));
const pages = [...staticPages, ...articlePages];

const outDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

(async () => {
  const browser = await puppeteer.launch();
  const failures = [];

  for (const page of pages) {
    const filePath = path.resolve(__dirname, '..', `${page}.html`);
    if (!fs.existsSync(filePath)) {
      console.error(`MISSING: ${page}.html`);
      failures.push(page);
      continue;
    }
    try {
      const p = await browser.newPage();
      await p.setViewport({ width: 1280, height: 800 });
      await p.goto(`file://${filePath}`);
      await p.screenshot({ path: path.join(outDir, `${page}.png`), fullPage: true });
      console.log(`OK: ${page}.html`);
      await p.close();
    } catch (err) {
      console.error(`FAIL: ${page}.html — ${err.message}`);
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
