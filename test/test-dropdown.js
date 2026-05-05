const puppeteer = require('puppeteer');
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:8765/index.html', { waitUntil: 'networkidle0' });

  // 1. Dropdown hidden before hover
  const hiddenBefore = await page.evaluate(() => {
    const menu = document.querySelector('.nav-dropdown-menu');
    return window.getComputedStyle(menu).display;
  });

  // 2. Hover over Services dropdown
  await page.hover('.nav-dropdown');
  await sleep(250);

  const visibleAfter = await page.evaluate(() => {
    const menu = document.querySelector('.nav-dropdown-menu');
    return menu.style.display;
  });

  const serviceLinks = await page.evaluate(() => {
    const menu = document.querySelector('.nav-dropdown-menu');
    return Array.from(menu.querySelectorAll('a')).map(a => a.textContent.trim());
  });

  // 3. Move mouse away — dropdown should hide
  await page.mouse.move(100, 300);
  await sleep(350);

  const hiddenAfter = await page.evaluate(() => {
    const menu = document.querySelector('.nav-dropdown-menu');
    return menu.style.display || window.getComputedStyle(menu).display;
  });

  // 4. Service Areas dropdown
  const ddHandles = await page.$$('.nav-dropdown');
  await ddHandles[1].hover();
  await sleep(250);

  const areasVisible = await page.evaluate(() => {
    const menus = document.querySelectorAll('.nav-dropdown-menu');
    return menus[1].style.display;
  });

  const areasLinks = await page.evaluate(() => {
    const menus = document.querySelectorAll('.nav-dropdown-menu');
    return Array.from(menus[1].querySelectorAll('a')).map(a => a.textContent.trim());
  });

  const firstLinkHref = await page.evaluate(() => {
    return document.querySelector('.nav-dropdown-menu a').getAttribute('href');
  });

  console.log('--- Dropdown Functional Test ---');
  console.log('1. Hidden before hover:', hiddenBefore === 'none' ? 'PASS (none)' : 'FAIL (' + hiddenBefore + ')');
  console.log('2. Visible after hover:', visibleAfter === 'block' ? 'PASS (block)' : 'FAIL (' + visibleAfter + ')');
  console.log('3. Hidden after mouse away:', (hiddenAfter === 'none' || hiddenAfter === '') ? 'PASS' : 'FAIL (' + hiddenAfter + ')');
  console.log('4. Service Areas visible on hover:', areasVisible === 'block' ? 'PASS' : 'FAIL (' + areasVisible + ')');
  console.log('Services links:', serviceLinks);
  console.log('Service Areas links:', areasLinks);
  console.log('First link href:', firstLinkHref);

  await browser.close();
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
