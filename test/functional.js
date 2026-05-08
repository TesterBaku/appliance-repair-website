/**
 * Functional tests — verifies buttons, accordions, forms, and navigation.
 * Runs against a local HTTP server (port 8788 by default).
 *
 * Usage: npm run test:functional
 *        BASE_URL=http://localhost:3000 npm run test:functional
 */

'use strict';

const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const BASE = process.env.BASE_URL || 'http://localhost:8788';
const ROOT = path.resolve(__dirname, '..');

// ─── tiny static server ──────────────────────────────────────────────────────
let server;
async function startServer() {
  server = http.createServer((req, res) => {
    let filePath = path.join(ROOT, url.parse(req.url).pathname);
    if (filePath.endsWith('/') || !path.extname(filePath)) filePath += '/index.html';
    if (!fs.existsSync(filePath)) { res.writeHead(404); res.end('Not found'); return; }
    const ext = path.extname(filePath).toLowerCase();
    const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
    res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });
  await new Promise(r => server.listen(8788, r));
}
function stopServer() { if (server) server.close(); }

// ─── test harness ─────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, label) {
  if (condition) {
    process.stdout.write('  ✓ ' + label + '\n');
    passed++;
  } else {
    process.stdout.write('  ✗ ' + label + '\n');
    failed++;
    failures.push(label);
  }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ─── test suites ─────────────────────────────────────────────────────────────
async function testHomepage(page) {
  console.log('\nhomepage (index.html)');
  await page.goto(`${BASE}/index.html`, { waitUntil: 'domcontentloaded' });

  // Hero primary CTA must go to contact
  const primaryCta = await page.$eval('a.btn-primary', a => a.getAttribute('href')).catch(() => null);
  assert(primaryCta && primaryCta.includes('contact'), 'Hero "Book a Service" links to contact page');

  // Anchor targets exist
  for (const anchor of ['#about', '#contact']) {
    const exists = await page.evaluate(a => !!document.querySelector(a), anchor);
    assert(exists, `Anchor ${anchor} exists on page`);
  }

  // Nav links present and non-empty
  const navLinks = await page.$$eval('.nav-links a', els => els.map(a => a.getAttribute('href')));
  assert(navLinks.length >= 5, 'Nav has at least 5 links');
  assert(navLinks.every(h => h && h.length > 0), 'No empty nav hrefs');

  // Services dropdown contains hub links
  const dropdownLinks = await page.$$eval('.nav-dropdown-menu a', els => els.map(a => a.getAttribute('href')));
  assert(dropdownLinks.some(h => h && h.includes('refrigerator')), 'Services dropdown contains refrigerator hub link');
  assert(dropdownLinks.some(h => h && h.includes('cost')), 'Services dropdown contains pricing guide link');

  // Footer services links
  const footerLinks = await page.$$eval('.footer-links a', els => els.map(a => a.getAttribute('href')));
  assert(footerLinks.some(h => h && h.includes('refrigerator')), 'Footer contains refrigerator link');
  assert(footerLinks.some(h => h && h.includes('contact')), 'Footer contains contact link');

  // Sticky bar links
  const stickyCall = await page.$eval('.sticky-call', a => a.getAttribute('href')).catch(() => null);
  const stickyBook = await page.$eval('.sticky-book', a => a.getAttribute('href')).catch(() => null);
  assert(stickyCall && stickyCall.startsWith('tel:'), 'Sticky call button links to tel:');
  assert(stickyBook && stickyBook.includes('contact'), 'Sticky book button links to contact');

  // Hamburger opens drawer on mobile viewport
  await page.setViewport({ width: 375, height: 812 });
  await page.reload({ waitUntil: 'domcontentloaded' });
  const hamBtn = await page.$('.nav-hamburger');
  assert(!!hamBtn, 'Hamburger button exists on mobile');
  if (hamBtn) {
    await hamBtn.click();
    await sleep(300);
    const drawerOpen = await page.evaluate(() => !!document.querySelector('.nav-drawer[data-open]'));
    assert(drawerOpen, 'Hamburger click opens nav drawer');
    // Escape closes it
    await page.keyboard.press('Escape');
    await sleep(200);
    const drawerClosed = await page.evaluate(() => !document.querySelector('.nav-drawer[data-open]'));
    assert(drawerClosed, 'Escape key closes nav drawer');
  }
  await page.setViewport({ width: 1440, height: 900 });

  // FAQ accordion works
  await page.goto(`${BASE}/index.html`, { waitUntil: 'domcontentloaded' });
  const faqBtn = await page.$('.faq-q');
  if (faqBtn) {
    const initialOpen = await page.evaluate(() => !!document.querySelector('.faq-item.open'));
    await faqBtn.click();
    await sleep(300);
    const afterClick = await page.evaluate(() => !!document.querySelector('.faq-item.open'));
    assert(initialOpen !== afterClick, 'FAQ accordion toggles on click');
  }
}

async function testContactPage(page) {
  console.log('\ncontact.html');
  await page.goto(`${BASE}/pages/contact.html`, { waitUntil: 'domcontentloaded' });

  // Form exists with required fields
  const formExists = await page.$('form#contact-form').then(el => !!el);
  assert(formExists, 'Contact form exists');

  const fields = await page.$$eval('form input[name], form select[name], form textarea[name]', els =>
    els.map(e => e.getAttribute('name'))
  );
  for (const required of ['firstName', 'phone', 'appliance', 'message']) {
    assert(fields.includes(required), `Form field "${required}" present`);
  }

  // Form action is formspree
  const formAction = await page.$eval('form', f => f.action);
  assert(formAction && formAction.includes('formspree'), 'Form posts to Formspree');

  // Pricing callout is present
  const callout = await page.$('.contact-pricing-callout');
  assert(!!callout, 'Pricing callout present above form');
}

async function testFaqPage(page) {
  console.log('\npages/faq.html');
  await page.goto(`${BASE}/pages/faq.html`, { waitUntil: 'domcontentloaded' });

  // First item pre-opened
  const firstOpen = await page.evaluate(() => !!document.querySelector('.faq-item.open'));
  assert(firstOpen, 'First FAQ item is pre-opened');

  // Click a closed item and verify it opens
  const closedBtn = await page.$('.faq-item:not(.open) .faq-q');
  if (closedBtn) {
    await closedBtn.click();
    await sleep(300);
    const opened = await page.evaluate(() => {
      const items = document.querySelectorAll('.faq-item.open');
      return items.length >= 2; // at least 2 open (the initial + newly clicked)
    });
    assert(opened, 'Clicking closed FAQ item opens it');
  }

  // Pricing FAQs present
  const faqTexts = await page.$$eval('.faq-q', btns => btns.map(b => b.textContent.trim()));
  assert(faqTexts.some(t => t.includes('$99') || t.includes('diagnostic')), '$99 diagnostic FAQ present');
  assert(faqTexts.some(t => t.toLowerCase().includes('senior') || t.toLowerCase().includes('discount')), 'Senior discount FAQ present');
}

async function testServiceHub(page, slug, appliance) {
  const file = `pages/${slug}.html`;
  console.log(`\n${file}`);
  await page.goto(`${BASE}/${file}`, { waitUntil: 'domcontentloaded' });

  // Page loaded with correct title
  const title = await page.title();
  assert(title.includes('Universal Appliances Repair'), 'Page title contains brand name');

  // FAQ accordion
  const faqBtn = await page.$('.faq-q');
  if (faqBtn) {
    const before = await page.evaluate(() => !!document.querySelector('.faq-item.open'));
    await faqBtn.click();
    await sleep(300);
    const after = await page.evaluate(() => !!document.querySelector('.faq-item.open'));
    assert(before !== after, `FAQ accordion toggles on ${slug}`);
  }

  // Pricing policy block present
  const pricingBlock = await page.$('.pricing-policy-card');
  assert(!!pricingBlock, 'Compact pricing policy block present');

  // CTA buttons link to contact or tel:
  const ctaBtns = await page.$$eval('a.btn-primary, a.btn-white, a.nav-cta', els =>
    els.map(a => a.getAttribute('href'))
  );
  const hasContactOrTel = ctaBtns.some(h => h && (h.includes('contact') || h.startsWith('tel:')));
  assert(hasContactOrTel, 'At least one CTA links to contact or tel:');

  // Pricing guide link present
  const pricingLink = await page.$eval('.policy-disclaimer a', a => a.getAttribute('href')).catch(() => null);
  assert(pricingLink && pricingLink.includes('cost'), 'Pricing disclaimer links to cost hub');
}

async function testCityHub(page, slug) {
  const file = `pages/${slug}.html`;
  console.log(`\n${file}`);
  await page.goto(`${BASE}/${file}`, { waitUntil: 'domcontentloaded' });

  const title = await page.title();
  assert(title.includes('Universal Appliances Repair'), 'Page title contains brand name');

  // Services list: 8 links, all valid
  const serviceLinks = await page.$$eval('.services-links-grid a', els =>
    els.map(a => ({ text: a.textContent.trim(), href: a.getAttribute('href') }))
  );
  assert(serviceLinks.length === 8, `Services list has 8 links (got ${serviceLinks.length})`);
  assert(serviceLinks.every(l => l.href && l.href.length > 0), 'All service links have non-empty hrefs');
  assert(serviceLinks.some(l => l.href.includes('refrigerator')), 'Refrigerator link present');

  // Click refrigerator link and verify navigation
  await page.click('.services-links-grid a:first-child');
  await sleep(400);
  const newUrl = page.url();
  assert(newUrl.includes('refrigerator'), 'Clicking Refrigerator Repair navigates to refrigerator hub');
  await page.goBack();

  // City pricing line present
  const pricingLine = await page.$('.city-pricing-line');
  assert(!!pricingLine, 'City pricing line present');

  // Pricing line links to cost hub
  const pricingLink = await page.$eval('.city-pricing-disclaimer a', a => a.getAttribute('href')).catch(() => null);
  assert(pricingLink && pricingLink.includes('cost'), 'City pricing line links to cost hub');

  // FAQ accordion
  const faqBtn = await page.$('.faq-q');
  if (faqBtn) {
    const before = await page.evaluate(() => !!document.querySelector('.faq-item.open'));
    await faqBtn.click();
    await sleep(300);
    const after = await page.evaluate(() => !!document.querySelector('.faq-item.open'));
    assert(before !== after, `FAQ accordion toggles on ${slug}`);
  }
}

async function testCostHub(page) {
  console.log('\npages/appliance-repair-cost-orange-county.html');
  await page.goto(`${BASE}/pages/appliance-repair-cost-orange-county.html`, { waitUntil: 'domcontentloaded' });

  // Cost table present
  const table = await page.$('.cost-table');
  assert(!!table, 'Cost table present');

  // All 4 policy rows (including warranty)
  const policyRows = await page.$$('.policy-row');
  assert(policyRows.length === 4, `Policy rows: expected 4, got ${policyRows.length}`);

  // FAQ count (13 entries)
  const faqCount = await page.$$eval('.faq-item', items => items.length);
  assert(faqCount >= 13, `Cost hub has at least 13 FAQ items (got ${faqCount})`);

  // FAQ accordion
  const faqBtn = await page.$('.faq-q');
  if (faqBtn) {
    const before = await page.evaluate(() => !!document.querySelector('.faq-item.open'));
    await faqBtn.click();
    await sleep(300);
    const after = await page.evaluate(() => !!document.querySelector('.faq-item.open'));
    assert(before !== after, 'Cost hub FAQ accordion toggles');
  }

  // Mid-scroll CTA present
  const midCta = await page.$('.mid-cta-strip');
  assert(!!midCta, 'Mid-scroll CTA strip present');
}

async function testServicesPage(page) {
  console.log('\npages/services.html');
  await page.goto(`${BASE}/pages/services.html`, { waitUntil: 'domcontentloaded' });

  // Service cards link to hub pages
  const serviceLinks = await page.$$eval('.service-card a', els =>
    els.map(a => a.getAttribute('href')).filter(Boolean)
  );
  assert(serviceLinks.some(h => h.includes('refrigerator')), 'Services page links to refrigerator hub');
  assert(serviceLinks.some(h => h.includes('contact')), 'Services page has at least one contact CTA');

  // Pricing block present
  const pricingBlock = await page.$('.pricing-policy-card');
  assert(!!pricingBlock, 'Pricing block present on services page');
}

// ─── main ────────────────────────────────────────────────────────────────────
(async () => {
  console.log('Starting functional tests…');
  await startServer();

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  try {
    await testHomepage(page);
    await testContactPage(page);
    await testFaqPage(page);
    await testCostHub(page);
    await testServicesPage(page);

    const serviceHubs = [
      { slug: 'refrigerator-repair-orange-county', appliance: 'refrigerator' },
      { slug: 'washer-repair-orange-county', appliance: 'washer' },
      { slug: 'dryer-repair-orange-county', appliance: 'dryer' },
      { slug: 'dishwasher-repair-orange-county', appliance: 'dishwasher' },
      { slug: 'oven-stove-repair-orange-county', appliance: 'oven' },
    ];
    for (const hub of serviceHubs) {
      await testServiceHub(page, hub.slug, hub.appliance);
    }

    const cityHubs = [
      'appliance-repair-irvine-ca',
      'appliance-repair-anaheim-ca',
      'appliance-repair-santa-ana-ca',
      'appliance-repair-huntington-beach-ca',
      'appliance-repair-costa-mesa-ca',
      'appliance-repair-fullerton-ca',
      'appliance-repair-garden-grove-ca',
      'appliance-repair-orange-ca',
    ];
    for (const slug of cityHubs) {
      await testCityHub(page, slug);
    }

  } finally {
    await browser.close();
    stopServer();
  }

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);

  if (failures.length > 0) {
    console.log('\nFailed tests:');
    failures.forEach(f => console.log('  ✗ ' + f));
    process.exit(1);
  } else {
    console.log('\nAll functional tests passed.');
    process.exit(0);
  }
})();
