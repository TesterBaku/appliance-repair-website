const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const root = path.resolve(__dirname, '..');
const staticPages = [
  'index.html',
  'pages/about.html',
  'pages/services.html',
  'pages/contact.html',
  'pages/faq.html',
  'pages/testimonials.html',
  'pages/blog.html'
];
const articleDir = path.join(root, 'articles');
const articlePages = fs.existsSync(articleDir)
  ? fs.readdirSync(articleDir)
      .filter(f => f.startsWith('article-') && f.endsWith('.html'))
      .map(f => path.join('articles', f))
  : [];
const pages = [...staticPages, ...articlePages];

const outDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

(async () => {
  const browser = await puppeteer.launch();
  const failures = [];

  for (const page of pages) {
    const filePath = path.resolve(root, page);
    if (!fs.existsSync(filePath)) {
      console.error(`MISSING: ${page}`);
      failures.push(page);
      continue;
    }
    try {
      const p = await browser.newPage();
      await p.setViewport({ width: 1280, height: 800 });
      await p.goto(`file://${filePath}`);
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
