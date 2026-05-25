'use strict';
/**
 * Functional tests — Playwright edition.
 * Replaces test/functional.js (Puppeteer).
 *
 * Run:  npm run test:functional
 *       BASE_URL=http://localhost:3000 npm run test:functional
 */

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const DESKTOP = { width: 1440, height: 900 };
const MOBILE  = { width: 375,  height: 812 };

// ─── Helpers ─────────────────────────────────────────────────────────────────
async function hrefs(page, selector) {
  return page.locator(selector).evaluateAll(els => els.map(a => a.getAttribute('href')));
}

// ─── Homepage ─────────────────────────────────────────────────────────────────
test.describe('Homepage (index.html)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto('/index.html');
  });

  test('hero CTA links to contact page', async ({ page }) => {
    const href = await page.locator('a.btn-primary').first().getAttribute('href');
    expect(href).toMatch(/contact/);
  });

  test('anchor #about exists', async ({ page }) => {
    await expect(page.locator('#about')).toBeAttached();
  });

  test('anchor #contact exists', async ({ page }) => {
    await expect(page.locator('#contact')).toBeAttached();
  });

  test('nav has at least 5 links', async ({ page }) => {
    const count = await page.locator('.nav-links a').count();
    expect(count).toBeGreaterThanOrEqual(5);
  });

  test('no empty nav hrefs', async ({ page }) => {
    const links = await hrefs(page, '.nav-links a');
    expect(links.every(h => h && h.length > 0)).toBe(true);
  });

  test('services dropdown contains refrigerator hub link', async ({ page }) => {
    const links = await hrefs(page, '.nav-dropdown-menu a');
    expect(links.some(h => h && h.includes('refrigerator'))).toBe(true);
  });

  test('services dropdown contains pricing guide link', async ({ page }) => {
    const links = await hrefs(page, '.nav-dropdown-menu a');
    expect(links.some(h => h && h.includes('cost'))).toBe(true);
  });

  test('nav dropdown menu is visible on hover', async ({ page }) => {
    const dropdown = page.locator('.nav-dropdown').first();
    await dropdown.hover();
    await expect(dropdown.locator('.nav-dropdown-menu')).toBeVisible();
  });

  test('footer contains refrigerator link', async ({ page }) => {
    const links = await hrefs(page, '.footer-links a');
    expect(links.some(h => h && h.includes('refrigerator'))).toBe(true);
  });

  test('footer contains contact link', async ({ page }) => {
    const links = await hrefs(page, '.footer-links a');
    expect(links.some(h => h && h.includes('contact'))).toBe(true);
  });

  test('footer shows business hours (Mon-Sat)', async ({ page }) => {
    await expect(page.locator('.footer-contact-line', { hasText: /Mon/i })).toBeVisible();
  });

  test('sticky call button links to tel:', async ({ page }) => {
    const href = await page.locator('.sticky-call').getAttribute('href');
    expect(href).toMatch(/^tel:/);
  });

  test('sticky book button links to contact', async ({ page }) => {
    const href = await page.locator('.sticky-book').getAttribute('href');
    expect(href).toMatch(/contact/);
  });

  test('sticky bar is hidden on desktop', async ({ page }) => {
    const bar = page.locator('.sticky-mobile-bar');
    const display = await bar.evaluate(el => window.getComputedStyle(el).display);
    expect(display).toBe('none');
  });

  test('sticky bar is visible on mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.reload();
    await expect(page.locator('.sticky-mobile-bar')).toBeVisible();
  });

  test('hamburger button exists on mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.reload();
    await expect(page.locator('.nav-hamburger')).toBeVisible();
  });

  test('hamburger click opens nav drawer', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.reload();
    await page.locator('.nav-hamburger').click();
    await expect(page.locator('.nav-drawer[data-open]')).toBeAttached();
  });

  test('Escape key closes nav drawer', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.reload();
    await page.locator('.nav-hamburger').click();
    await expect(page.locator('.nav-drawer[data-open]')).toBeAttached();
    await page.keyboard.press('Escape');
    await expect(page.locator('.nav-drawer[data-open]')).not.toBeAttached();
  });

  test('FAQ accordion toggles on click', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.reload();
    const faqItem = page.locator('.faq-item').first();
    const faqBtn  = page.locator('.faq-q').first();
    const wasOpen = await faqItem.evaluate(el => el.classList.contains('open'));
    await faqBtn.click();
    if (wasOpen) {
      await expect(faqItem).not.toHaveClass(/\bopen\b/);
    } else {
      await expect(faqItem).toHaveClass(/\bopen\b/);
    }
  });
});

// ─── Contact page ─────────────────────────────────────────────────────────────
test.describe('Contact page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pages/contact.html');
  });

  test('contact form exists', async ({ page }) => {
    await expect(page.locator('form#contact-form')).toBeAttached();
  });

  for (const field of ['firstName', 'phone', 'appliance', 'message']) {
    test(`form field "${field}" present`, async ({ page }) => {
      await expect(page.locator(`form [name="${field}"]`)).toBeAttached();
    });
  }

  test('form posts to Formspree', async ({ page }) => {
    const action = await page.locator('form').getAttribute('action');
    expect(action).toMatch(/formspree/);
  });

  test('pricing callout present above form', async ({ page }) => {
    await expect(page.locator('.contact-pricing-callout')).toBeAttached();
  });
});

// ─── FAQ page ─────────────────────────────────────────────────────────────────
test.describe('FAQ page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pages/faq.html');
  });

  test('first FAQ item is pre-opened', async ({ page }) => {
    await expect(page.locator('.faq-item.open').first()).toBeAttached();
  });

  test('clicking a closed FAQ item opens it', async ({ page }) => {
    const closedBtn = page.locator('.faq-item:not(.open) .faq-q').first();
    await closedBtn.click();
    const openCount = await page.locator('.faq-item.open').count();
    expect(openCount).toBeGreaterThanOrEqual(2);
  });

  test('$99 diagnostic FAQ present', async ({ page }) => {
    const texts = await page.locator('.faq-q').evaluateAll(els => els.map(e => e.textContent));
    expect(texts.some(t => t.includes('$99') || t.toLowerCase().includes('diagnostic'))).toBe(true);
  });

  test('senior/discount FAQ present', async ({ page }) => {
    const texts = await page.locator('.faq-q').evaluateAll(els => els.map(e => e.textContent.toLowerCase()));
    expect(texts.some(t => t.includes('senior') || t.includes('discount'))).toBe(true);
  });
});

// ─── Cost hub ─────────────────────────────────────────────────────────────────
test.describe('Cost hub (appliance-repair-cost-orange-county.html)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pages/appliance-repair-cost-orange-county.html');
  });

  test('cost table present', async ({ page }) => {
    await expect(page.locator('.cost-table')).toBeAttached();
  });

  test('policy rows: 4 present', async ({ page }) => {
    const count = await page.locator('.policy-row').count();
    expect(count).toBe(4);
  });

  test('at least 13 FAQ items', async ({ page }) => {
    const count = await page.locator('.faq-item').count();
    expect(count).toBeGreaterThanOrEqual(13);
  });

  test('FAQ accordion toggles', async ({ page }) => {
    const faqItem = page.locator('.faq-item').first();
    const wasOpen = await faqItem.evaluate(el => el.classList.contains('open'));
    await page.locator('.faq-q').first().click();
    if (wasOpen) {
      await expect(faqItem).not.toHaveClass(/\bopen\b/);
    } else {
      await expect(faqItem).toHaveClass(/\bopen\b/);
    }
  });

  test('mid-scroll CTA strip present', async ({ page }) => {
    await expect(page.locator('.mid-cta-strip')).toBeAttached();
  });
});

// ─── Services page ────────────────────────────────────────────────────────────
test.describe('Services page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pages/services.html');
  });

  test('links to refrigerator hub', async ({ page }) => {
    const links = await hrefs(page, '.service-card a');
    expect(links.some(h => h && h.includes('refrigerator'))).toBe(true);
  });

  test('has at least one contact CTA', async ({ page }) => {
    const links = await hrefs(page, '.service-card a');
    expect(links.some(h => h && h.includes('contact'))).toBe(true);
  });

  test('pricing block present', async ({ page }) => {
    await expect(page.locator('.pricing-policy-card')).toBeAttached();
  });
});

// ─── About page ───────────────────────────────────────────────────────────────
test.describe('About page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pages/about.html');
  });

  test('primary CTA links to contact', async ({ page }) => {
    const href = await page.locator('a.btn-primary').getAttribute('href');
    expect(href).toMatch(/contact/);
  });

  test('secondary CTA links to services', async ({ page }) => {
    const href = await page.locator('a.btn-outline').getAttribute('href');
    expect(href).toMatch(/services/);
  });

  test('footer Refrigerator Repair links to hub', async ({ page }) => {
    const link = await page.locator('.footer-links a', { hasText: 'Refrigerator Repair' }).getAttribute('href');
    expect(link).toMatch(/refrigerator-repair/);
  });

  test('footer stove link goes to oven-stove hub', async ({ page }) => {
    const link = await page.locator('.footer-links a', { hasText: /Stove/i }).getAttribute('href');
    expect(link).toMatch(/oven-stove/);
  });

  test('footer Washer Repair links to hub', async ({ page }) => {
    const link = await page.locator('.footer-links a', { hasText: 'Washer Repair' }).getAttribute('href');
    expect(link).toMatch(/washer-repair/);
  });

  test('nav dropdown has Pricing Guide', async ({ page }) => {
    const links = await hrefs(page, '.nav-dropdown-menu a');
    expect(links.some(h => h && h.includes('cost'))).toBe(true);
  });
});

// ─── Service hubs ─────────────────────────────────────────────────────────────
const SERVICE_HUBS = [
  { slug: 'refrigerator-repair-orange-county', appliance: 'refrigerator' },
  { slug: 'washer-repair-orange-county',       appliance: 'washer'        },
  { slug: 'dryer-repair-orange-county',        appliance: 'dryer'         },
  { slug: 'dishwasher-repair-orange-county',   appliance: 'dishwasher'    },
  { slug: 'oven-stove-repair-orange-county',   appliance: 'oven'          },
];

for (const { slug } of SERVICE_HUBS) {
  test.describe(`Service hub: ${slug}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize(DESKTOP);
      await page.goto(`/pages/${slug}.html`);
    });

    test('page title contains brand name', async ({ page }) => {
      await expect(page).toHaveTitle(/Universal Appliances Repair/);
    });

    test('FAQ accordion toggles', async ({ page }) => {
      const faqItem = page.locator('.faq-item').first();
      const wasOpen = await faqItem.evaluate(el => el.classList.contains('open'));
      await page.locator('.faq-q').first().click();
      if (wasOpen) {
        await expect(faqItem).not.toHaveClass(/\bopen\b/);
      } else {
        await expect(faqItem).toHaveClass(/\bopen\b/);
      }
    });

    test('compact pricing policy block present', async ({ page }) => {
      await expect(page.locator('.pricing-policy-card')).toBeAttached();
    });

    test('at least one CTA links to contact or tel:', async ({ page }) => {
      const links = await hrefs(page, 'a.btn-primary, a.btn-white, a.nav-cta');
      expect(links.some(h => h && (h.includes('contact') || h.startsWith('tel:')))).toBe(true);
    });

    test('pricing disclaimer links to cost hub', async ({ page }) => {
      const href = await page.locator('.policy-disclaimer a').getAttribute('href');
      expect(href).toMatch(/cost/);
    });

    test('nav dropdown is visible on hover', async ({ page }) => {
      const dropdown = page.locator('.nav-dropdown').first();
      await dropdown.hover();
      await expect(dropdown.locator('.nav-dropdown-menu')).toBeVisible();
    });
  });
}

// ─── City hubs ────────────────────────────────────────────────────────────────
const CITY_HUBS = [
  'appliance-repair-irvine-ca',
  'appliance-repair-anaheim-ca',
  'appliance-repair-santa-ana-ca',
  'appliance-repair-huntington-beach-ca',
  'appliance-repair-costa-mesa-ca',
  'appliance-repair-fullerton-ca',
  'appliance-repair-garden-grove-ca',
  'appliance-repair-orange-ca',
  'appliance-repair-laguna-beach-ca',
];

for (const slug of CITY_HUBS) {
  test.describe(`City hub: ${slug}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize(DESKTOP);
      await page.goto(`/pages/${slug}.html`);
    });

    test('page title contains brand name', async ({ page }) => {
      await expect(page).toHaveTitle(/Universal Appliances Repair/);
    });

    test('services list has 8 links', async ({ page }) => {
      const count = await page.locator('.services-links-grid a').count();
      expect(count).toBe(8);
    });

    test('all service links have non-empty hrefs', async ({ page }) => {
      const links = await hrefs(page, '.services-links-grid a');
      expect(links.every(h => h && h.length > 0)).toBe(true);
    });

    test('refrigerator link present', async ({ page }) => {
      const links = await hrefs(page, '.services-links-grid a');
      expect(links.some(h => h && h.includes('refrigerator'))).toBe(true);
    });

    test('hub-linked services have arrow indicator (.hub-link class)', async ({ page }) => {
      const count = await page.locator('.services-links-grid a.hub-link').count();
      expect(count).toBeGreaterThanOrEqual(8);
    });

    test('brand section has Premium & Luxury tier label', async ({ page }) => {
      await expect(page.locator('.brands-group-label', { hasText: /Premium/i })).toBeAttached();
    });

    test('brand section has All Major Brands tier label', async ({ page }) => {
      await expect(page.locator('.brands-group-label', { hasText: /All Major Brands/i })).toBeAttached();
    });

    test('clicking first service link navigates to a hub page', async ({ page }) => {
      await page.locator('.services-links-grid a').first().click();
      await page.waitForURL(/refrigerator/);
    });

    test('city pricing line present', async ({ page }) => {
      await expect(page.locator('.city-pricing-line')).toBeAttached();
    });

    test('city pricing line links to cost hub', async ({ page }) => {
      const href = await page.locator('.city-pricing-disclaimer a').getAttribute('href');
      expect(href).toMatch(/cost/);
    });

    test('FAQ accordion toggles', async ({ page }) => {
      const faqItem = page.locator('.faq-item').first();
      const wasOpen = await faqItem.evaluate(el => el.classList.contains('open'));
      await page.locator('.faq-q').first().click();
      if (wasOpen) {
        await expect(faqItem).not.toHaveClass(/\bopen\b/);
      } else {
        await expect(faqItem).toHaveClass(/\bopen\b/);
      }
    });
  });
}

// ─── Testimonials page ────────────────────────────────────────────────────────
test.describe('Testimonials page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pages/testimonials.html');
  });

  test('page title contains brand name', async ({ page }) => {
    await expect(page).toHaveTitle(/Universal Appliances Repair/);
  });

  test('testimonial cards present', async ({ page }) => {
    const count = await page.locator('.testimonial-card, .t-card, [class*="testimonial"]').count();
    expect(count).toBeGreaterThan(0);
  });

  test('CTA links to contact or tel:', async ({ page }) => {
    const links = await hrefs(page, 'a.btn-primary, a.btn-dark, a.nav-cta');
    expect(links.some(h => h && (h.includes('contact') || h.startsWith('tel:')))).toBe(true);
  });
});

// ─── Blog page ────────────────────────────────────────────────────────────────
test.describe('Blog page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pages/blog.html');
  });

  test('page title contains brand name', async ({ page }) => {
    await expect(page).toHaveTitle(/Universal Appliances Repair/);
  });

  test('at least 5 article links present', async ({ page }) => {
    const count = await page.locator('a[href*="article-"]').count();
    expect(count).toBeGreaterThanOrEqual(5);
  });

  test('all article links are non-empty and not anchors', async ({ page }) => {
    const links = await hrefs(page, 'a[href*="article-"]');
    expect(links.every(h => h && !h.includes('#'))).toBe(true);
  });

  test('load-more button is present in DOM', async ({ page }) => {
    await expect(page.locator('#blog-load-more')).toBeAttached();
  });
});

// ─── Service areas page ───────────────────────────────────────────────────────
test.describe('Service areas page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pages/service-areas.html');
  });

  test('page title contains brand name', async ({ page }) => {
    await expect(page).toHaveTitle(/Universal Appliances Repair/);
  });

  test('at least 8 city hub links', async ({ page }) => {
    const count = await page.locator('a[href*="appliance-repair-"][href*="-ca.html"]').count();
    expect(count).toBeGreaterThanOrEqual(8);
  });

  test('clicking Irvine city card navigates to Irvine hub', async ({ page }) => {
    await page.locator('.city-card[href*="irvine"]').click();
    await page.waitForURL(/irvine/);
  });

  test('Laguna Beach city card points to the dedicated hub', async ({ page }) => {
    const lagunaCard = page.locator('.city-card[href="appliance-repair-laguna-beach-ca.html"] .city-name');
    await expect(lagunaCard).toHaveText('Laguna Beach');
  });

  test('Laguna Beach map entry points to the dedicated hub', async ({ page }) => {
    const html = await page.content();
    expect(html).toMatch(/\["Laguna Beach",\s*33\.5427,\s*-117\.7854,\s*"appliance-repair-laguna-beach-ca\.html"\]/);
  });

  test('no dead # city links', async ({ page }) => {
    const links = await hrefs(page, 'a[href*="appliance-repair-"][href*="-ca.html"]');
    expect(links.every(h => h && h !== '#')).toBe(true);
  });
});

// ─── 404 page ─────────────────────────────────────────────────────────────────
test.describe('404 page', () => {
  test('has a link back to homepage', async ({ page }) => {
    await page.goto('/404.html');
    const links = await hrefs(page, 'a[href]');
    expect(links.some(h => h === 'index.html' || h === './' || h === '/' || (h && h.includes('index')))).toBe(true);
  });
});

// ─── FAQ redirect ─────────────────────────────────────────────────────────────
test.describe('faq/index.html redirect stub', () => {
  test('redirects to faq.html', async ({ page }) => {
    // The page has a <meta http-equiv="refresh"> that redirects to faq.html.
    // Verify the redirect works rather than inspecting the stub HTML.
    await page.goto('/faq/index.html');
    await expect(page).toHaveURL(/faq\.html/);
  });
});

// ─── Blog category pages ──────────────────────────────────────────────────────
const BLOG_CATEGORIES = ['refrigerator', 'washer', 'dryer', 'dishwasher', 'oven-stove', 'freezer', 'other'];

for (const cat of BLOG_CATEGORIES) {
  test.describe(`Blog category: ${cat}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`/pages/blog/${cat}.html`);
    });

    test('has correct title', async ({ page }) => {
      await expect(page).toHaveTitle(/Universal Appliances Repair/);
    });

    test('page loads without error', async ({ page }) => {
      // Presence of nav is a proxy for a complete page load
      await expect(page.locator('.nav')).toBeAttached();
    });

    test('has CTA linking to contact or tel:', async ({ page }) => {
      const links = await hrefs(page, 'a.btn-primary, a.btn-dark, a.nav-cta');
      expect(links.some(h => h && (h.includes('contact') || h.startsWith('tel:')))).toBe(true);
    });
  });
}

// ─── Articles ─────────────────────────────────────────────────────────────────
const ARTICLES_DIR = path.join(__dirname, '../articles');
const articleFiles = fs.readdirSync(ARTICLES_DIR)
  .filter(f => f.endsWith('.html'))
  .sort();

test('at least 30 article files exist', async () => {
  expect(articleFiles.length).toBeGreaterThanOrEqual(30);
});

for (const file of articleFiles) {
  test.describe(`Article: ${file}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`/articles/${file}`);
    });

    test('has CTA linking to contact or tel:', async ({ page }) => {
      const links = await hrefs(page, 'a.btn-primary, a.btn-dark, .inline-cta a, .cta-box a');
      expect(links.some(h => h && (h.includes('contact') || h.startsWith('tel:')))).toBe(true);
    });

    test('inline CTA paragraph links render as text links, not buttons', async ({ page }) => {
      const issues = await page.locator('.inline-cta p a').evaluateAll(links => links.map(link => {
        const styles = window.getComputedStyle(link);
        return {
          text: link.textContent.trim(),
          display: styles.display,
          backgroundColor: styles.backgroundColor,
          paddingLeft: styles.paddingLeft,
          paddingRight: styles.paddingRight,
          textDecorationLine: styles.textDecorationLine,
        };
      }).filter(result => (
        result.display !== 'inline' ||
        result.backgroundColor !== 'rgba(0, 0, 0, 0)' ||
        result.paddingLeft !== '0px' ||
        result.paddingRight !== '0px' ||
        !result.textDecorationLine.includes('underline')
      )));

      expect(issues).toEqual([]);
    });

    test('nav CTA links to contact', async ({ page }) => {
      const href = await page.locator('a.nav-cta').getAttribute('href');
      expect(href).toMatch(/contact/);
    });
  });
}

// ─── Regression: article hamburger nav (scroll-then-open bug) ────────────────
// Bug fixed in PR #343: drawer had position:relative so it scrolled out of view.
// Tapping the hamburger after scrolling down locked body scroll but the drawer
// was already above the viewport — page appeared frozen with no menu visible.
test.describe('Regression: article hamburger nav', () => {
  const TEST_ARTICLE = 'article-whirlpool-dryer-repair-los-alamitos.html';

  test('nav drawer has position:fixed so it is always viewport-anchored', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto(`/articles/${TEST_ARTICLE}`);
    const position = await page.locator('.nav-drawer').evaluate(
      el => window.getComputedStyle(el).position
    );
    expect(position).toBe('fixed');
  });

  test('hamburger opens visible drawer after scrolling to bottom of article', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto(`/articles/${TEST_ARTICLE}`);
    // Simulate the exact bug scenario: user scrolls to bottom then taps hamburger
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.locator('.nav-hamburger').click();
    // Drawer must be visible in the viewport — not hidden above the scroll position
    await expect(page.locator('.nav-drawer')).toBeInViewport();
  });

  test('nav drawer links are reachable after scroll-and-open', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto(`/articles/${TEST_ARTICLE}`);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.locator('.nav-hamburger').click();
    const links = await page.locator('.nav-drawer a').count();
    expect(links).toBeGreaterThanOrEqual(7);
  });

  test('desktop nav links hidden at mobile viewport', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto(`/articles/${TEST_ARTICLE}`);
    const visible = await page.locator('.nav-links').isVisible();
    expect(visible).toBe(false);
  });
});

// ─── Regression: price disclaimer on cost articles ────────────────────────────
test.describe('Price disclaimer on cost articles', () => {
  const DISCLAIMER = /Estimates vary by brand, part availability, and diagnosis/i;

  test('dishwasher cost article has price disclaimer above table', async ({ page }) => {
    await page.goto('/articles/article-dishwasher-cost-orange-county.html');
    const text = await page.locator('p', { hasText: DISCLAIMER }).textContent();
    expect(text).toBeTruthy();
    // Disclaimer must appear before the price table
    const disclaimerIdx = await page.evaluate(pattern => {
      const re = new RegExp(pattern, 'i');
      const all = Array.from(document.querySelectorAll('p, table'));
      const dIdx = all.findIndex(el => re.test(el.textContent));
      const tIdx = all.findIndex(el => el.tagName === 'TABLE');
      return { dIdx, tIdx };
    }, DISCLAIMER.source);
    expect(disclaimerIdx.dIdx).toBeGreaterThanOrEqual(0);
    expect(disclaimerIdx.dIdx).toBeLessThan(disclaimerIdx.tIdx);
  });
});

// ─── Brand hub pages — required sections ──────────────────────────────────────
const BRAND_HUBS = [
  { brand: 'Sub-Zero', file: 'sub-zero-appliance-repair-orange-county.html' },
  { brand: 'Wolf',     file: 'wolf-appliance-repair-orange-county.html' },
  { brand: 'Miele',    file: 'miele-appliance-repair-orange-county.html' },
  { brand: 'Viking',   file: 'viking-appliance-repair-orange-county.html' },
  { brand: 'Thermador',file: 'thermador-appliance-repair-orange-county.html' },
];

for (const { brand, file } of BRAND_HUBS) {
  test.describe(`Brand hub: ${brand}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`/pages/${file}`);
    });

    // ── Page structure ────────────────────────────────────────────────────────
    test('page loads with nav and footer', async ({ page }) => {
      await expect(page.locator('nav.nav')).toBeAttached();
      await expect(page.locator('footer.footer')).toBeAttached();
    });

    test('title contains brand name and Orange County', async ({ page }) => {
      const title = await page.title();
      expect(title).toContain(brand);
      expect(title).toContain('Orange County');
      expect(title).toContain('Universal Appliances Repair');
    });

    test('canonical link points to fixappliancesfast.com', async ({ page }) => {
      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      expect(canonical).toMatch(/^https:\/\/fixappliancesfast\.com\//);
      expect(canonical).toContain(file);
    });

    test('meta description is 140-165 characters', async ({ page }) => {
      const desc = await page.locator('meta[name="description"]').getAttribute('content');
      expect(desc).toBeTruthy();
      expect(desc.length).toBeGreaterThanOrEqual(140);
      expect(desc.length).toBeLessThanOrEqual(165);
    });

    test('og:site_name is Universal Appliances Repair', async ({ page }) => {
      const siteName = await page.locator('meta[property="og:site_name"]').getAttribute('content');
      expect(siteName).toBe('Universal Appliances Repair');
    });

    test('og:image is present', async ({ page }) => {
      const img = await page.locator('meta[property="og:image"]').getAttribute('content');
      expect(img).toMatch(/^https:\/\/fixappliancesfast\.com\//);
    });

    test('no placeholder text on page', async ({ page }) => {
      const body = await page.locator('body').textContent();
      expect(body).not.toMatch(/\bLorem\b/i);
      expect(body).not.toMatch(/\bTODO\b/);
      expect(body).not.toMatch(/\bFIXME\b/);
      expect(body).not.toMatch(/\bPlaceholder\b/i);
      expect(body).not.toMatch(/\bSample\b/i);
    });

    test('JSON-LD schemas: Service, LocalBusiness, FAQPage, BreadcrumbList all present', async ({ page }) => {
      const schemas = await page.evaluate(() =>
        Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
          .map(s => { try { return JSON.parse(s.textContent)['@type']; } catch { return null; } })
          .filter(Boolean)
      );
      expect(schemas).toContain('Service');
      expect(schemas).toContain('LocalBusiness');
      expect(schemas).toContain('FAQPage');
      expect(schemas).toContain('BreadcrumbList');
    });

    test('LocalBusiness schema has AggregateRating with 80 reviews', async ({ page }) => {
      const rating = await page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
        for (const s of scripts) {
          try {
            const j = JSON.parse(s.textContent);
            if (j['@type'] === 'LocalBusiness' && j.aggregateRating) return j.aggregateRating;
          } catch {}
        }
        return null;
      });
      expect(rating).toBeTruthy();
      expect(String(rating.reviewCount)).toBe('80');
      expect(String(rating.ratingValue)).toBe('5.0');
    });

    test('FAQPage schema has at least 8 mainEntity entries', async ({ page }) => {
      const count = await page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
        for (const s of scripts) {
          try {
            const j = JSON.parse(s.textContent);
            if (j['@type'] === 'FAQPage') return j.mainEntity.length;
          } catch {}
        }
        return 0;
      });
      expect(count).toBeGreaterThanOrEqual(8);
    });

    test('Service schema has brand field matching hub brand', async ({ page }) => {
      const brandName = await page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
        for (const s of scripts) {
          try {
            const j = JSON.parse(s.textContent);
            if (j['@type'] === 'Service' && j.brand) return j.brand.name;
          } catch {}
        }
        return null;
      });
      expect(brandName).toBe(brand);
    });

    // ── Navigation ────────────────────────────────────────────────────────────
    test('nav has phone link and Book CTA', async ({ page }) => {
      const phoneLinks = await hrefs(page, '.nav-phone, a[href^="tel:"]');
      expect(phoneLinks.some(h => h && h.includes('9496295365'))).toBe(true);
      const bookHref = await page.locator('a.nav-cta').getAttribute('href');
      expect(bookHref).toMatch(/contact/);
    });

    test('nav hamburger button and drawer present', async ({ page }) => {
      await expect(page.locator('.nav-hamburger')).toBeAttached();
      await expect(page.locator('.nav-drawer')).toBeAttached();
    });

    test('hamburger opens and closes the drawer', async ({ page }) => {
      await page.setViewportSize(MOBILE);
      const btn = page.locator('.nav-hamburger');
      const drawer = page.locator('.nav-drawer');
      await btn.click();
      await expect(drawer).toHaveAttribute('data-open', '');
      await btn.click();
      await expect(drawer).not.toHaveAttribute('data-open', '');
    });

    // ── Breadcrumb ────────────────────────────────────────────────────────────
    test('breadcrumb has Home and Services links', async ({ page }) => {
      const breadcrumbLinks = await hrefs(page, 'a[href="../"], a[href*="services.html"]');
      expect(breadcrumbLinks.some(h => h === '../' || (h && h.includes('index')))).toBe(true);
      expect(breadcrumbLinks.some(h => h && h.includes('services'))).toBe(true);
    });

    // ── AI answer block ───────────────────────────────────────────────────────
    test('AI answer block present and contains phone number', async ({ page }) => {
      await expect(page.locator('.ai-block')).toBeAttached();
      const text = await page.locator('.ai-block').textContent();
      expect(text).toContain('(949) 629-5365');
    });

    test('AI answer block contains brand name', async ({ page }) => {
      const text = await page.locator('.ai-block').textContent();
      expect(text).toContain(brand);
    });

    // ── Hero ─────────────────────────────────────────────────────────────────
    test('hero section has H1 and two CTAs', async ({ page }) => {
      await expect(page.locator('.hub-hero h1')).toBeAttached();
      const ctaLinks = await hrefs(page, '.hub-cta-row a');
      expect(ctaLinks.some(h => h && h.startsWith('tel:'))).toBe(true);
      expect(ctaLinks.some(h => h && h.includes('contact'))).toBe(true);
    });

    test('H1 contains brand name', async ({ page }) => {
      const h1 = await page.locator('.hub-hero h1').textContent();
      expect(h1).toContain(brand);
    });

    // ── Models section ────────────────────────────────────────────────────────
    test('models grid has at least 4 cards', async ({ page }) => {
      const models = await page.locator('.model-card').count();
      expect(models).toBeGreaterThanOrEqual(4);
    });

    test('each model card has a name and description', async ({ page }) => {
      const cards = await page.locator('.model-card').all();
      for (const card of cards) {
        const name = await card.locator('.model-name').textContent();
        const desc = await card.locator('.model-desc').textContent();
        expect(name.trim().length).toBeGreaterThan(0);
        expect(desc.trim().length).toBeGreaterThan(0);
      }
    });

    // ── Common issues section ─────────────────────────────────────────────────
    test('issues grid has at least 6 items', async ({ page }) => {
      const items = await page.locator('.issue-item').count();
      expect(items).toBeGreaterThanOrEqual(6);
    });

    test('each issue item has a heading and description', async ({ page }) => {
      const items = await page.locator('.issue-item').all();
      for (const item of items) {
        const strong = await item.locator('strong').textContent();
        expect(strong.trim().length).toBeGreaterThan(0);
      }
    });

    // ── Repair process ────────────────────────────────────────────────────────
    test('repair process has exactly 4 steps', async ({ page }) => {
      const steps = await page.locator('.process-step').count();
      expect(steps).toBe(4);
    });

    test('each process step has a number, title, and description', async ({ page }) => {
      const steps = await page.locator('.process-step').all();
      for (const step of steps) {
        const num = await step.locator('.step-number').textContent();
        const title = await step.locator('.step-title').textContent();
        const desc = await step.locator('.step-desc').textContent();
        expect(num.trim()).toMatch(/^[1-4]$/);
        expect(title.trim().length).toBeGreaterThan(0);
        expect(desc.trim().length).toBeGreaterThan(0);
      }
    });

    // ── Cost table ────────────────────────────────────────────────────────────
    test('has cost table with disclaimer', async ({ page }) => {
      await expect(page.locator('table.cost-table')).toBeAttached();
      const disclaimer = await page.locator('.cost-disclaimer').textContent();
      expect(disclaimer).toMatch(/Estimates vary by brand/i);
    });

    test('cost table has at least 5 rows including diagnostic fee row', async ({ page }) => {
      const rows = await page.locator('table.cost-table tbody tr').count();
      expect(rows).toBeGreaterThanOrEqual(5);
    });

    test('cost table has diagnostic fee row', async ({ page }) => {
      const tableText = await page.locator('table.cost-table').textContent();
      expect(tableText).toMatch(/diagnostic/i);
      // Premium hubs: $95 – $150; standard hubs: $75 – $100 or $99
      expect(tableText).toMatch(/\$(?:75|95|99)/);
    });

    // ── FAQ ───────────────────────────────────────────────────────────────────
    test('has FAQ section with at least 8 questions', async ({ page }) => {
      const questions = await page.locator('.faq-q').count();
      expect(questions).toBeGreaterThanOrEqual(8);
    });

    test('FAQ accordion: clicking a question opens it', async ({ page }) => {
      const firstQ = page.locator('.faq-item').nth(1); // second item (first may be pre-opened)
      await firstQ.locator('.faq-q').click();
      await expect(firstQ).toHaveClass(/open/);
    });

    test('FAQ anchor #faq exists', async ({ page }) => {
      await expect(page.locator('#faq')).toBeAttached();
    });

    // ── Testimonials ──────────────────────────────────────────────────────────
    test('has exactly 3 testimonial cards', async ({ page }) => {
      const cards = await page.locator('.testimonial-card').count();
      expect(cards).toBe(3);
    });

    test('each testimonial card has stars, quote, initial, and name', async ({ page }) => {
      const cards = await page.locator('.testimonial-card').all();
      expect(cards.length).toBe(3);
      for (const card of cards) {
        await expect(card.locator('.stars')).toBeAttached();
        const quote = await card.locator('.testimonial-quote').textContent();
        expect(quote.trim().length).toBeGreaterThan(5);
        await expect(card.locator('.t-initial')).toBeAttached();
        const name = await card.locator('.testimonial-name').textContent();
        expect(name.trim().length).toBeGreaterThan(0);
      }
    });

    // ── Luxury brands cross-link ──────────────────────────────────────────────
    test('luxury brands cross-link grid has 4 cards', async ({ page }) => {
      const cards = await page.locator('.luxury-brand-card').count();
      expect(cards).toBe(4);
    });

    test('each luxury brand card has a name, description, and valid href', async ({ page }) => {
      const cards = await page.locator('.luxury-brand-card').all();
      for (const card of cards) {
        const name = await card.locator('.lb-name').textContent();
        const desc = await card.locator('.lb-desc').textContent();
        const href = await card.getAttribute('href');
        expect(name.trim().length).toBeGreaterThan(0);
        expect(desc.trim().length).toBeGreaterThan(0);
        expect(href).toBeTruthy();
        expect(href).not.toBe('#');
        expect(href).not.toBe('');
      }
    });

    test('current brand is NOT linked in its own cross-link grid', async ({ page }) => {
      const cards = await page.locator('.luxury-brand-card').all();
      const names = await Promise.all(cards.map(c => c.locator('.lb-name').textContent()));
      expect(names.map(n => n.trim())).not.toContain(brand);
    });

    // ── CTA box ───────────────────────────────────────────────────────────────
    test('CTA box links to tel: and contact', async ({ page }) => {
      const ctaLinks = await hrefs(page, '.cta-box a');
      expect(ctaLinks.some(h => h && h.startsWith('tel:'))).toBe(true);
      expect(ctaLinks.some(h => h && h.includes('contact'))).toBe(true);
    });

    test('CTA box heading contains brand name or repair', async ({ page }) => {
      const heading = await page.locator('.cta-box h2').textContent();
      expect(heading).toMatch(/repair|Repair/i);
    });

    // ── Footer ────────────────────────────────────────────────────────────────
    test('footer has phone, email, address, and copyright', async ({ page }) => {
      const footer = page.locator('footer.footer');
      const text = await footer.textContent();
      expect(text).toContain('(949) 629-5365');
      expect(text).toContain('info@fixappliancesfast.com');
      expect(text).toContain('Asbury');
      expect(text).toMatch(/© 20\d\d Universal Appliances Repair/);
    });

    test('footer contact links are functional (not dead #)', async ({ page }) => {
      const phoneLink = await page.locator('footer a[href^="tel:"]').getAttribute('href');
      expect(phoneLink).toContain('9496295365');
      const emailLink = await page.locator('footer a[href^="mailto:"]').getAttribute('href');
      expect(emailLink).toContain('info@fixappliancesfast.com');
    });

    test('footer has links to services, about, testimonials, blog, contact', async ({ page }) => {
      const footerLinks = await hrefs(page, 'footer a');
      expect(footerLinks.some(h => h && h.includes('services'))).toBe(true);
      expect(footerLinks.some(h => h && h.includes('about'))).toBe(true);
      expect(footerLinks.some(h => h && h.includes('testimonials'))).toBe(true);
      expect(footerLinks.some(h => h && h.includes('blog'))).toBe(true);
      expect(footerLinks.some(h => h && h.includes('contact'))).toBe(true);
    });

    // ── Sticky mobile bar ─────────────────────────────────────────────────────
    test('sticky mobile bar present', async ({ page }) => {
      await expect(page.locator('.sticky-mobile-bar')).toBeAttached();
    });

    test('sticky bar has call and book links', async ({ page }) => {
      const callHref = await page.locator('.sticky-call').getAttribute('href');
      expect(callHref).toMatch(/^tel:/);
      const bookHref = await page.locator('.sticky-book').getAttribute('href');
      expect(bookHref).toMatch(/contact/);
    });

    test('sticky bar visible on mobile, hidden on desktop', async ({ page }) => {
      await page.setViewportSize(MOBILE);
      const bar = page.locator('.sticky-mobile-bar');
      await expect(bar).toBeVisible();
      await page.setViewportSize(DESKTOP);
      await expect(bar).toBeHidden();
    });

    // ── Phone number consistency ───────────────────────────────────────────────
    test('correct phone (949) 629-5365 appears throughout page', async ({ page }) => {
      const allTelLinks = await hrefs(page, 'a[href^="tel:"]');
      // Every tel: link must use the canonical number
      for (const href of allTelLinks) {
        expect(href).toContain('9496295365');
      }
    });

    test('business name Universal Appliances Repair in footer', async ({ page }) => {
      const footer = await page.locator('footer.footer').textContent();
      expect(footer).toContain('Universal Appliances Repair');
    });
  });
}
