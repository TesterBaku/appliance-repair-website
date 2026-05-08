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

    test('5 hub-linked services have arrow indicator (.hub-link class)', async ({ page }) => {
      const count = await page.locator('.services-links-grid a.hub-link').count();
      expect(count).toBe(5);
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
    expect(links.some(h => h === 'index.html' || h === '/' || (h && h.includes('index')))).toBe(true);
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
