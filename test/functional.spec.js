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

// Canonical AggregateRating.reviewCount — mirrors the public GBP listing total.
// Read from the data file so this never goes stale on a review-count bump
// (matches the content-integrity "review-count" check).
const EXPECTED_REVIEW_COUNT = String(
  JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'testimonials.json'), 'utf8'))
    ._meta.sources.google.totalReviewsOnListing
);

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

  // The city select shipped Orange-County-only long after the business added LA and
  // Riverside coverage. Guard the county groups so a future edit cannot silently
  // narrow the form back to one county.
  for (const county of ['Orange County', 'Los Angeles County', 'Riverside County & nearby']) {
    test(`city select offers the "${county}" group`, async ({ page }) => {
      await expect(page.locator(`form [name="city"] optgroup[label="${county}"]`)).toBeAttached();
    });
  }

  test('form posts to Formspree', async ({ page }) => {
    const action = await page.locator('form').getAttribute('action');
    expect(action).toMatch(/formspree/);
  });

  test('pricing callout present above form', async ({ page }) => {
    await expect(page.locator('.contact-pricing-callout')).toBeAttached();
  });

  // The success/error blocks shipped as dead code: nothing intercepted the submit,
  // so the browser did a native POST and navigated the customer off to Formspree's
  // own page at the moment of conversion. These three lock the AJAX flow in.
  // Formspree is always route-intercepted here; no real submission ever leaves.
  async function fillContactForm(page) {
    await page.fill('#firstName', 'Test');
    await page.fill('#lastName', 'Harness');
    await page.fill('#phone', '(949) 000-0000');
    await page.selectOption('#city', 'Irvine');
    await page.selectOption('#appliance', 'Refrigerator');
  }

  test('successful submit shows the success state without leaving the page', async ({ page }) => {
    await page.route('**formspree.io/**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' })
    );
    await fillContactForm(page);
    await page.click('#form-submit');

    await expect(page.locator('#form-success')).toBeVisible();
    await expect(page.locator('#contact-form')).toBeHidden();
    // Copy that only makes sense while the form exists must go with it.
    await expect(page.locator('#form-intro')).toBeHidden();
    await expect(page.locator('.contact-pricing-callout')).toBeHidden();
    expect(page.url()).toContain('contact.html');
  });

  test('a rejected submit shows the error state and keeps the form filled', async ({ page }) => {
    await page.route('**formspree.io/**', (route) =>
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: '{"errors":[{"message":"Phone is invalid"}]}',
      })
    );
    await fillContactForm(page);
    await page.click('#form-submit');

    await expect(page.locator('#form-error')).toBeVisible();
    await expect(page.locator('#contact-form')).toBeVisible();
    await expect(page.locator('#firstName')).toHaveValue('Test');
    expect(page.url()).toContain('contact.html');
  });

  test('the rejection reason from Formspree is shown, not swallowed', async ({ page }) => {
    await page.route('**formspree.io/**', (route) =>
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: '{"errors":[{"message":"Phone is invalid"}]}',
      })
    );
    await fillContactForm(page);
    await page.click('#form-submit');

    // "Phone is invalid" is actionable; a bare apology just looks broken.
    await expect(page.locator('#form-error')).toContainText('Phone is invalid');
    // The phone-number fallback must survive alongside the specific reason.
    await expect(page.locator('#form-error')).toContainText('(949) 629-5365');
  });

  test('a hostile rejection reason is rendered as text, never as markup', async ({ page }) => {
    // Formspree echoes submitted values back inside error messages, so the
    // reason is a remote string. It must never reach innerHTML.
    await page.route('**formspree.io/**', (route) =>
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ errors: [{ message: '<img src=x onerror="window.__xss=1">' }] }),
      })
    );
    await fillContactForm(page);
    await page.click('#form-submit');

    await expect(page.locator('#form-error')).toBeVisible();
    expect(await page.locator('#form-error img').count()).toBe(0);
    expect(await page.evaluate(() => window.__xss)).toBeUndefined();
  });

  test('focus lands on the status block so keyboard users are not stranded', async ({ page }) => {
    await page.route('**formspree.io/**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' })
    );
    await fillContactForm(page);
    await page.click('#form-submit');

    await expect(page.locator('#form-success')).toBeFocused();
  });

  test('"Send another request" restores an empty form without a reload', async ({ page }) => {
    await page.route('**formspree.io/**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' })
    );
    await fillContactForm(page);
    await page.click('#form-submit');
    await expect(page.locator('#form-success')).toBeVisible();

    await page.click('#form-again');

    await expect(page.locator('#contact-form')).toBeVisible();
    await expect(page.locator('#form-success')).toBeHidden();
    await expect(page.locator('#form-intro')).toBeVisible();
    await expect(page.locator('.contact-pricing-callout')).toBeVisible();
    // Reset, not just re-shown: the previous answers must not be resubmitted.
    await expect(page.locator('#firstName')).toHaveValue('');
    await expect(page.locator('#city')).toHaveValue('');
    await expect(page.locator('#appliance')).toHaveValue('');
    expect(page.url()).toContain('contact.html');
  });

  test('a SECOND request can actually be submitted after a reset', async ({ page }) => {
    // The reset originally restored the form but left the submit button disabled
    // and still reading "Sending...", so the second request was silently
    // impossible. Asserting the form is visible again is not enough.
    let submissions = 0;
    await page.route('**formspree.io/**', (route) => {
      submissions++;
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    });

    await fillContactForm(page);
    await page.click('#form-submit');
    await expect(page.locator('#form-success')).toBeVisible();

    await page.click('#form-again');
    await expect(page.locator('#form-submit')).toBeEnabled();
    await expect(page.locator('#form-submit')).toHaveText('Send Message');

    await fillContactForm(page);
    await page.click('#form-submit');
    await expect(page.locator('#form-success')).toBeVisible();
    expect(submissions).toBe(2);
  });

  test('a specific reason replaces the vague sentence rather than stacking with it', async ({ page }) => {
    await page.route('**formspree.io/**', (route) =>
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: '{"errors":[{"message":"Phone is invalid"}]}',
      })
    );
    await fillContactForm(page);
    await page.click('#form-submit');

    await expect(page.locator('#form-error')).toContainText('Phone is invalid');
    // Two diagnoses in one breath reads as guesswork.
    await expect(page.locator('#form-error-generic')).toBeHidden();
    await expect(page.locator('#form-error')).toContainText('(949) 629-5365');
  });

  test('with no reason given, the generic sentence still appears', async ({ page }) => {
    await page.route('**formspree.io/**', (route) => route.abort('failed'));
    await fillContactForm(page);
    await page.click('#form-submit');

    await expect(page.locator('#form-error-generic')).toBeVisible();
    await expect(page.locator('#form-error-reason')).toBeHidden();
  });

  test('"Send another request" meets the 44px tap target at 375px', async ({ page }) => {
    // It shipped at 32px on first pass; mobile-design.md requires 44px minimum.
    await page.setViewportSize({ width: 375, height: 812 });
    await page.route('**formspree.io/**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' })
    );
    await fillContactForm(page);
    await page.click('#form-submit');
    await expect(page.locator('#form-again')).toBeVisible();

    const box = await page.locator('#form-again').boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(44);
  });

  test('a network failure shows the error state rather than a dead button', async ({ page }) => {
    await page.route('**formspree.io/**', (route) => route.abort('failed'));
    await fillContactForm(page);
    await page.click('#form-submit');

    await expect(page.locator('#form-error')).toBeVisible();
    await expect(page.locator('#form-submit')).toBeEnabled();
    expect(page.url()).toContain('contact.html');
  });

  // contact_form_submit (analytics.js) fires on the submit event and counts attempts,
  // before Formspree responds. contact_form_delivered must fire ONLY when Formspree
  // accepts (response.ok), so the two events are never conflated.
  test('a confirmed Formspree acceptance fires contact_form_delivered', async ({ page }) => {
    await page.route('**formspree.io/**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' })
    );
    await fillContactForm(page);
    await page.click('#form-submit');
    await expect(page.locator('#form-success')).toBeVisible();

    const delivered = await page.evaluate(() =>
      (window.dataLayer || []).some((e) => e && e[0] === 'event' && e[1] === 'contact_form_delivered')
    );
    expect(delivered).toBe(true);
  });

  test('a rejected submit does NOT fire contact_form_delivered', async ({ page }) => {
    await page.route('**formspree.io/**', (route) =>
      route.fulfill({ status: 400, contentType: 'application/json', body: '{"errors":[{"message":"Phone is invalid"}]}' })
    );
    await fillContactForm(page);
    await page.click('#form-submit');
    await expect(page.locator('#form-error')).toBeVisible();

    const delivered = await page.evaluate(() =>
      (window.dataLayer || []).some((e) => e && e[0] === 'event' && e[1] === 'contact_form_delivered')
    );
    expect(delivered).toBe(false);
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

  test('clicking a closed FAQ item opens it (accordion: single-open)', async ({ page }) => {
    const items = page.locator('.faq-item');
    // Resolve the first currently-closed item by index (a stable positional
    // locator — a :not(.open) selector would re-resolve after the click).
    const classes = await items.evaluateAll(els => els.map(e => e.className));
    const idx = classes.findIndex(c => !/\bopen\b/.test(c));
    const target = items.nth(idx);
    await target.locator('.faq-q').click();
    await expect(target).toHaveClass(/\bopen\b/);
    // Accordion behaviour (site.js): opening one item closes the rest, so
    // exactly one item is open at a time.
    const openCount = await page.locator('.faq-item.open').count();
    expect(openCount).toBe(1);
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

  test('nav dropdown is visible on hover', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const dropdown = page.locator('.nav-dropdown').first();
    await dropdown.hover();
    await expect(dropdown.locator('.nav-dropdown-menu')).toBeVisible();
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
    const link = await page.locator('.footer-links a').filter({ hasText: /^Washer Repair$/ }).getAttribute('href');
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

    test('page title contains the appliance and Orange County location', async ({ page }) => {
      await expect(page).toHaveTitle(/Repair in Orange County, CA/);
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
  'appliance-repair-newport-beach-ca',
  'appliance-repair-mission-viejo-ca',
  'appliance-repair-lake-forest-ca',
  'appliance-repair-yorba-linda-ca',
  'appliance-repair-brea-ca',
  'appliance-repair-laguna-niguel-ca',
  'appliance-repair-tustin-ca',
  'appliance-repair-fountain-valley-ca',
  'appliance-repair-westminster-ca',
  'appliance-repair-buena-park-ca',
  // Stanton, the company's own address city, added with the hub itself (P6-44) rather
  // than after a bug, which is the lesson of the Long Beach note below.
  'appliance-repair-stanton-ca',
  // LA County. Uses the same template as the OC city hubs, so it takes the same
  // assertions. Added 2026-08-09 with the tel-link fix (#708): this page shipped
  // 2026-07-08 with 3 dead `tel:` links (of 7 across both pages in that PR) partly
  // because it was never in this list, so the suite's own phone-consistency test
  // never ran against it.
  'appliance-repair-long-beach-ca',
];

for (const slug of CITY_HUBS) {
  test.describe(`City hub: ${slug}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize(DESKTOP);
      await page.goto(`/pages/${slug}.html`);
    });

    test('page title contains city name', async ({ page }) => {
      // P2-3 SEO audit: city page titles are now differentiated without brand suffix.
      // Verify the title contains "Appliance Repair" and "CA" instead.
      await expect(page).toHaveTitle(/Appliance Repair.*CA/);
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

// ─── WCAG AA contrast regression guard ────────────────────────────────────────
// P6-8 / P6-10. The CTA box shipped white 14px body text on a gradient starting at
// #e84c1e = 3.83:1, and the footer copyright ran #767676 on #090909 = 4.38:1. Both
// under the 4.5:1 AA floor for body text, on every hub and every article. Nothing
// measured contrast, so it went unnoticed until the #655 design critique.
//
// This measures the REAL painted values in the browser rather than asserting on hex
// literals, so it stays true if the colors are re-tuned later — it only fails if the
// resulting contrast drops below the threshold.
const CONTRAST_PAGES = [
  '/index.html',
  '/pages/refrigerator-repair-orange-county.html',
  '/pages/appliance-repair-garden-grove-ca.html',
  '/pages/luxury-appliance-repair-beverly-hills-ca.html',
  '/articles/article-dorm-appliances.html',
  '/pages/appliance-repair-cost-orange-county.html',   // the flat-fill .cta-box variant
];

const CONTRAST_PROBE = () => {
  const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const L = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  const ratio = (a, b) => { const [x, y] = [L(a), L(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
  // Parse an rgb()/rgba() string into channels + alpha. Do NOT try to pull alpha
  // with a trailing-number regex: `rgb(255, 255, 255)` matches /([\d.]+)\)$/ and
  // yields alpha=255, which composites to a nonsense colour and reports a
  // million-to-one ratio — a guard that cannot fail. Alpha is the 4th component
  // when there is one, and 1 otherwise.
  const parse = (s) => {
    const p = (s.match(/[\d.]+/g) || []).map(Number);
    return { rgb: p.slice(0, 3), a: p.length > 3 ? p[3] : 1 };
  };
  const flatten = ({ rgb: c, a }, under) => c.map((v, i) => Math.round(v * a + under[i] * (1 - a)));
  // Walk up to the first painted backdrop. A gradient returns EVERY stop, so the
  // lightest stop is tested too — that is where the original failure lived.
  // A background-image: url(...) is treated as UNKNOWN and reported, never skipped:
  // silently attributing a photo backdrop to an ancestor is a false pass waiting to
  // happen if a hero selector is ever added to the probe list.
  const backdrop = (el) => {
    let n = el;
    while (n) {
      const cs = getComputedStyle(n);
      const bi = cs.backgroundImage;
      if (bi && bi.includes('gradient')) {
        const stops = bi.match(/rgba?\([^)]+\)/g) || [];
        // Composite each stop over white so a translucent stop is not scored as opaque.
        if (stops.length) return stops.map(s => flatten(parse(s), [255, 255, 255]));
      }
      if (bi && /url\(/.test(bi)) return null;   // unknown backdrop, caller must report
      const bc = cs.backgroundColor;
      if (bc && !/rgba\(0, 0, 0, 0\)|transparent/.test(bc)) return [flatten(parse(bc), [255, 255, 255])];
      n = n.parentElement;
    }
    return [[255, 255, 255]];
  };
  const out = [];
  const text = (sel, need, label) => {
    const el = document.querySelector(sel);
    if (!el) return;
    const fg = parse(getComputedStyle(el).color);
    const bgs = backdrop(el);
    if (!bgs) { out.push({ label: `${label} (UNRESOLVED image backdrop)`, r: 0, need }); return; }
    // Composite the foreground over ITS OWN backdrop, not over white. A translucent
    // text colour on a dark backdrop composited over white would overstate contrast —
    // the same false-pass shape as the alpha bug this guard was fixed for.
    for (const bg of bgs) out.push({ label, r: ratio(flatten(fg, bg), bg), need });
  };
  // P6-15: sweep EVERY element that owns visible text, not a hardcoded selector list.
  // The list below stays as named regression anchors; this catches the rest.
  //
  // Backdrop resolution uses elementsFromPoint and composites the real paint stack,
  // because a DOM-ancestor walk cannot see how this site actually paints. Four
  // false-positive classes had to be closed before the numbers meant anything:
  //   1. sibling overlays — the hub hero paints via absolutely-positioned .hub-hero-bg
  //      / .hub-hero-overlay siblings, so an ancestor walk finds nothing and reports
  //      white-on-white at 1:1
  //   2. the element's OWN background — skipping it reported .nav-cta (white on brand)
  //      as 1.02:1
  //   3. off-viewport elements — elementsFromPoint needs the element in the viewport,
  //      hence the tall viewport below
  //   4. replaced elements — text over a real <img> (.article-hero-img) has no
  //      CSS-knowable backdrop; it must be skipped, not walked past
  // Together those four accounted for ~1,580 of the first run's 1,614 "failures".
  //   5. horizontally clipped elements — an element inside an `overflow-x:auto`
  //      container can have its centre point outside the container's clip, so
  //      elementsFromPoint returns what is painted BEHIND the scroller and the
  //      element is absent from its own stack. Scoring against that stack is not a
  //      near-miss, it is a different backdrop: on the cost hub at 375px the table
  //      header (#fff on #1a0a02, really ~19:1) read as white-on-white, 1.00:1, and
  //      seven data cells read as dark-on-white and FALSELY PASSED. Found by the
  //      375px viewport added below; count at 1440px is 0, which is why it stayed
  //      invisible while the gate was desktop-only. Handled by sampleStack() below.
  //
  // sampleStack(): return the first hit-test stack that actually contains `el`,
  // trying the centre first (so every already-resolving element is bit-identical)
  // then points walking in from the element's own edges, each clamped inside the
  // viewport. Null means no sample point paints this element — the caller skips it
  // rather than scoring it against a stranger's backdrop.
  const SAMPLE_FRACTIONS = [0.5, 0.02, 0.1, 0.25, 0.75, 0.98];
  const sampleStack = (el, r0, y) => {
    for (const f of SAMPLE_FRACTIONS) {
      const x = Math.round(Math.min(Math.max(r0.left + r0.width * f, 1), window.innerWidth - 2));
      const s = document.elementsFromPoint(x, y);
      if (s.indexOf(el) >= 0) return s;
    }
    return null;
  };
  let sweptScored = 0;
  // Denominator computed over body * UNCONDITIONALLY, independent of the sweep's own
  // scope. Counting it inside the scoped loop made the ratio scope-invariant by
  // construction — narrowing the scope narrowed both terms, so the ratio could not fall
  // and the only thing catching an under-scoping regression was the absolute floor on
  // the denominator. Measured in the PR #659 review: ratio caught 0 of 6 pages.
  const textOwningTotal = () => {
    const GLYPH2 = /^[\s\p{Extended_Pictographic}★☆←-⇿✀-➿️‍]+$/u;
    let n = 0;
    for (const el of document.querySelectorAll('body *')) {
      const own = [...el.childNodes].filter(x => x.nodeType === 3 && x.textContent.trim().length > 1);
      if (!own.length) continue;
      if (GLYPH2.test(own.map(x => x.textContent).join(' ').trim())) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) === 0) continue;
      const r = el.getClientRects();
      if (!r.length || r[0].width < 2 || r[0].height < 2) continue;
      n++;
    }
    return n;
  };
  const textOwning = textOwningTotal();
  const sweep = () => {
    const GLYPH = /^[\s\p{Extended_Pictographic}★☆←-⇿✀-➿️‍]+$/u;
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
      const y = Math.round(r0.top + Math.min(r0.height / 2, 8));
      const stack = sampleStack(el, r0, y);
      // Null = no sample point paints this element (class 5 above). Skip it: an
      // element absent from the stack it is scored against is measured against a
      // backdrop it does not sit on, which reports both false failures and false
      // passes. sweptScored is incremented below, so a regression that starts
      // dropping elements shows up in the coverage-ratio guard.
      if (!stack || !stack.length) continue;
      const under = stack.slice(stack.indexOf(el)).reverse();
      let acc = [255, 255, 255], unknown = false;
      for (const n of under) {
        if (/^(IMG|VIDEO|SVG|CANVAS|PICTURE)$/.test(n.tagName)) { unknown = true; break; }
        const ncs = getComputedStyle(n), bi = ncs.backgroundImage;
        if (bi && /url\(/.test(bi)) { unknown = true; break; }
        if (bi && bi.includes('gradient')) {
          const st = (bi.match(/rgba?\([^)]+\)/g) || []).map(parse);
          if (st.length) {           // keep the LIGHTEST stop: worst case for light text
            let w = null, wl = -1;
            for (const s of st) { const c = flatten(s, acc); const l = L(c); if (l > wl) { wl = l; w = c; } }
            acc = w; continue;
          }
        }
        const bc = parse(ncs.backgroundColor);
        if (bc.a > 0) acc = flatten(bc, acc);
      }
      if (unknown) continue;
      sweptScored++;
      const size = parseFloat(cs.fontSize);
      const weight = parseInt(cs.fontWeight, 10) || 400;
      const need = (size >= 24 || (size >= 18.66 && weight >= 700)) ? 3 : 4.5;
      const r = ratio(flatten(parse(cs.color), acc), acc);
      if (r < need) {
        const cls = (el.getAttribute('class') || '').trim().split(/\s+/)[0] || '';
        out.push({ label: `${el.tagName.toLowerCase()}${cls ? '.' + cls : ''} "${txt.slice(0, 30)}"`, r, need });
      }
    }
  };

  text('.cta-box p', 4.5, '.cta-box p');
  text('.cta-box h2', 3, '.cta-box h2 (large text)');
  text('.footer-bottom', 4.5, '.footer-bottom');
  // Round 2 (P6-14): all three ran #e84c1e = 3.83:1 and were unguarded.
  // .sticky-call is 14px/600 — neither >=24px nor >=18.66px bold, so it is NOT
  // large text and needs the full 4.5:1, contrary to how it was first filed.
  text('.sticky-call', 4.5, '.sticky-call (mobile Call button label)');
  text('.inline-cta p', 4.5, '.inline-cta p');
  text('.inline-cta a', 4.5, '.inline-cta a');
  sweep();
  const bo = document.querySelector('.btn-white-outline');
  if (bo) {
    const border = parse(getComputedStyle(bo).borderTopColor);
    const bgs = backdrop(bo);
    if (!bgs) out.push({ label: '.btn-white-outline border (UNRESOLVED image backdrop)', r: 0, need: 3 });
    else for (const bg of bgs) out.push({ label: '.btn-white-outline border', r: ratio(flatten(border, bg), bg), need: 3 });
  }
  return { rows: out, sweptScored, textOwning };
};

// Both widths, because Google indexes mobile-first and every contrast gate in this repo
// probed at 1440 only. The mobile column is not a formality: the site paints DIFFERENT
// elements at 375 (.sticky-mobile-bar appears, .nav-cta and .nav-links go display:none),
// reflows every grid to one column, and pushes tables into overflow-x scrollers. The
// desktop entry keeps its exact previous behaviour — same width, same derived height —
// so this is additive, not a rewrite of the passing gate.
const CONTRAST_VIEWPORTS = [1440, 375];

for (const width of CONTRAST_VIEWPORTS) {
for (const url of CONTRAST_PAGES) {
  test(`WCAG AA contrast @${width}px: ${url}`, async ({ page }) => {
    // elementsFromPoint only resolves elements INSIDE the viewport, so the viewport has to
    // cover the whole document. Hardcoding 12000 silently under-measured any taller page
    // (blog.html is 14,394px), and those elements hit `continue` BEFORE sweptScored++, so
    // the floor would not have noticed. Derive it — and derive it per WIDTH, since a
    // narrow viewport reflows the page taller: measured 2026-08-11, these six run
    // 6,382–9,105px at 1440 and 10,452–14,021px at 375, all under the 30,000 cap.
    await page.setViewportSize({ width, height: 2000 });
    await page.goto(url);
    const docH = await page.evaluate(() => document.documentElement.scrollHeight);
    await page.setViewportSize({ width, height: Math.min(Math.max(docH + 200, 2000), 30000) });
    const { rows, sweptScored, textOwning } = await page.evaluate(CONTRAST_PROBE);
    // Two guards, because they prove different things.
    // `rows` is populated by the named text() anchors on every run, pass or fail, so a
    // non-empty rows array only proves those anchors resolved — it says nothing about
    // whether the sweep ran at all.
    // `sweptScored` counts elements the sweep measured; `textOwning` counts every
    // text-owning element on the page, computed over `body *` regardless of the sweep's
    // scope. That independence is the whole point: an earlier version counted the
    // denominator inside the scoped loop, which made the ratio scope-invariant and
    // therefore blind to exactly the under-scoping bug it was added to catch.
    expect(rows.length).toBeGreaterThan(0);                       // named anchors resolved
    expect(textOwning).toBeGreaterThan(50);                       // the page really has text
    expect(sweptScored / textOwning).toBeGreaterThan(0.75);       // and the sweep saw most of it
    const failures = rows
      .filter(r => r.r < r.need)
      .map(r => `${r.label}: ${r.r.toFixed(2)}:1 (needs ${r.need}:1)`);
    expect(failures).toEqual([]);
  });
}
}

// The gate above is only worth its runtime if it can still go red. Nothing on the site
// currently fails at 375px, so a passing suite proves nothing on its own — exactly the
// shape of gate that rots into decoration. This injects a mobile-only contrast failure
// and asserts the probe reports it, at the same width and against the same page the
// gate uses. #3a3a3a on the footer's near-black is 1.75:1, well under 4.5:1; the @media
// wrapper means a desktop-only probe would NOT see it.
//
// The width comes from CONTRAST_VIEWPORTS rather than a literal, and the array is
// asserted to contain it. An earlier draft hardcoded 375 here, which the PR #714
// reviewer showed would let someone revert CONTRAST_VIEWPORTS to [1440] with this test
// still green: it would go on proving the probe works at a width the gate no longer
// visits. A self-test that survives the deletion of the thing it certifies is not a
// self-test.
const MOBILE_CONTRAST_WIDTH = 375;
test('mobile contrast gate can actually fail', async ({ page }) => {
  expect(CONTRAST_VIEWPORTS).toContain(MOBILE_CONTRAST_WIDTH);
  await page.setViewportSize({ width: MOBILE_CONTRAST_WIDTH, height: 2000 });
  await page.goto('/index.html');
  const docH = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.setViewportSize({ width: MOBILE_CONTRAST_WIDTH, height: Math.min(Math.max(docH + 200, 2000), 30000) });

  const clean = await page.evaluate(CONTRAST_PROBE);
  expect(clean.rows.filter(r => r.r < r.need)).toEqual([]);   // baseline: page is green

  await page.addStyleTag({ content: '@media (max-width: 768px) { .footer-bottom, .footer-bottom * { color: #3a3a3a !important; } }' });
  const dirty = await page.evaluate(CONTRAST_PROBE);
  const caught = dirty.rows.filter(r => r.r < r.need);
  expect(caught.length).toBeGreaterThan(0);
  expect(caught.some(r => /footer-bottom/.test(r.label))).toBe(true);
});

// ─── Premium (luxury-brand) hubs ──────────────────────────────────────────────
// The LA Premium layer uses a DIFFERENT template from CITY_HUBS above and cannot
// simply be appended to that list: it has 6 service links not 8, no brand-tier
// labels, and deliberately no testimonials. Until 2026-07-31 no test touched any
// of these pages at all — CITY_HUBS is a hardcoded `appliance-repair-*` list, so
// the county hub (#652) and both city hubs (#655) shipped with zero coverage.
// Flagged in the #655 review; tracked as P6-9.
const PREMIUM_HUBS = [
  'luxury-appliance-repair-los-angeles-ca',
  'luxury-appliance-repair-beverly-hills-ca',
  'luxury-appliance-repair-pasadena-ca',
  // wave 2, the coastal pair (#662)
  'luxury-appliance-repair-santa-monica-ca',
  'luxury-appliance-repair-manhattan-beach-ca',
];

// 'Bosch Premium', not bare 'Bosch': mainstream Bosch is not a premium-tier brand (see
// .claude/rules/seo-content.md), and only the Bosch premium built-in lines are in scope
// in the LA premium cities. The label deliberately covers the whole premium tier, not
// just Benchmark, so a panel-ready 800-series owner does not self-select out.
const PREMIUM_BRANDS = ['Sub-Zero', 'Viking', 'Wolf', 'Miele', 'Thermador', 'Dacor', 'DCS', 'Bosch Premium'];

for (const slug of PREMIUM_HUBS) {
  test.describe(`Premium hub: ${slug}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize(DESKTOP);
      await page.goto(`/pages/${slug}.html`);
    });

    test('title names a premium brand or luxury repair, plus CA', async ({ page }) => {
      await expect(page).toHaveTitle(/(Sub-Zero|Viking|Wolf|Luxury).*(CA|Los Angeles)/);
    });

    test('canonical is present and self-referential', async ({ page }) => {
      const href = await page.locator('link[rel="canonical"]').getAttribute('href');
      expect(href).toBe(`https://fixappliancesfast.com/pages/${slug}.html`);
    });

    test('all 8 premium brands are named as links', async ({ page }) => {
      const pills = await page.locator('.brand-pill.premium').allTextContents();
      for (const b of PREMIUM_BRANDS) {
        expect(pills.some(p => p.trim() === b)).toBe(true);
      }
      expect(pills.length).toBe(8);
    });

    test('every brand pill points at a real brand hub', async ({ page }) => {
      const links = await hrefs(page, '.brand-pill.premium');
      expect(links.length).toBe(8);
      expect(links.every(h => h && /-appliance-repair-orange-county\.html$/.test(h))).toBe(true);
    });

    test('scope note states premium-brand only', async ({ page }) => {
      await expect(page.locator('.scope-note').first()).toContainText(/premium.brand only/i);
    });

    test('real-work proof band renders 3 job cards', async ({ page }) => {
      await expect(page.locator('.job-grid .job-card')).toHaveCount(3);
    });

    test('every job card carries a real city label', async ({ page }) => {
      const locs = await page.locator('.job-card-loc').allTextContents();
      expect(locs.length).toBe(3);
      expect(locs.every(l => /,\s*CA$/.test(l.trim()))).toBe(true);
    });

    // The count assertion is load-bearing: evaluateAll over an empty set returns []
    // and [] equals [], so without it this test passes when every <img> is deleted.
    // scrollIntoView + poll handle the lazy-load race — these images are below the
    // fold, so from a cold cache they are legitimately not `complete` at goto() time.
    test('job card photos all resolve (no broken images)', async ({ page }) => {
      await page.locator('.job-grid').scrollIntoViewIfNeeded();
      const imgs = page.locator('.job-card img');
      await expect(imgs).toHaveCount(3);
      await expect.poll(() => imgs.evaluateAll(
        a => a.filter(i => !i.complete || i.naturalWidth === 0).map(i => i.currentSrc || i.src)
      )).toEqual([]);
    });

    // textContent, NOT innerText: the FAQ answers are display:none until opened, and
    // the fee is stated inside them. innerText skips collapsed content, so it was
    // blind to the single highest-risk location. The JSON-LD is checked too, since a
    // wrong fee in schema is what Google would surface.
    test('diagnostic fee is the flat $99, never $150 or a range', async ({ page }) => {
      const body = await page.locator('body').evaluate(el => el.textContent);
      const ld = (await page.locator('script[type="application/ld+json"]').allTextContents()).join(' ');
      expect(body).toContain('$99');
      for (const source of [body, ld]) {
        expect(source).not.toContain('$150');
        expect(source).not.toMatch(/\$99\s*(to|-|–)\s*\$\d/);
      }
    });

    test('pricing disclaimer is present verbatim', async ({ page }) => {
      await expect(page.locator('.city-pricing-disclaimer')).toContainText(
        'Estimates vary by brand, part availability, and diagnosis. Final quote is provided before repair.'
      );
    });

    // Parse and walk the JSON-LD rather than substring-matching it: a minified
    // `"@type":"Review"` (no space) evades a .toContain on the spaced form.
    test('no testimonials and no aggregateRating (pool cannot supply luxury quotes)', async ({ page }) => {
      expect(await page.locator('.testimonial-card, .t-card').count()).toBe(0);
      const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
      expect(blocks.length).toBeGreaterThan(0);
      const types = [];
      let sawAggregate = false;
      const walk = (n) => {
        if (Array.isArray(n)) return n.forEach(walk);
        if (!n || typeof n !== 'object') return;
        if (typeof n['@type'] === 'string') types.push(n['@type']);
        if ('aggregateRating' in n) sawAggregate = true;
        Object.values(n).forEach(v => { if (v && typeof v === 'object') walk(v); });
      };
      for (const b of blocks) walk(JSON.parse(b));
      expect(types).not.toContain('Review');
      expect(sawAggregate).toBe(false);
    });

    // Scoped to the breadcrumb strip. An unscoped a[href="service-areas.html"]
    // matches the nav dropdown toggle, the "All Cities" link and the drawer long
    // before the breadcrumb, so deleting the breadcrumb entirely still passed.
    test('breadcrumb links back up its hierarchy', async ({ page }) => {
      const crumb = page.locator('nav[aria-label="Breadcrumb"]');
      await expect(crumb).toHaveCount(1);
      const links = await crumb.locator('a').evaluateAll(a => a.map(x => x.getAttribute('href')));
      expect(links).toContain('../');
      expect(links).toContain('service-areas.html');
      if (slug !== 'luxury-appliance-repair-los-angeles-ca') {
        expect(links).toContain('luxury-appliance-repair-los-angeles-ca.html');
      }
    });

    test('FAQ accordion toggles', async ({ page }) => {
      const faqItem = page.locator('.faq-item').first();
      await page.locator('.faq-q').first().click();
      await expect(faqItem).toHaveClass(/\bopen\b/);
    });

    test('has at least 6 FAQ items', async ({ page }) => {
      expect(await page.locator('.faq-item').count()).toBeGreaterThanOrEqual(6);
    });

    test('CTA box links to tel: and contact', async ({ page }) => {
      const links = await hrefs(page, '.cta-box a');
      expect(links.some(h => h && h.startsWith('tel:'))).toBe(true);
      expect(links.some(h => h && h.includes('contact'))).toBe(true);
    });

    test('sticky mobile bar visible on mobile, hidden on desktop', async ({ page }) => {
      await expect(page.locator('.sticky-mobile-bar')).toBeHidden();
      await page.setViewportSize(MOBILE);
      await expect(page.locator('.sticky-mobile-bar')).toBeVisible();
    });

    test('header Book button hidden on mobile', async ({ page }) => {
      await page.setViewportSize(MOBILE);
      await expect(page.locator('.nav-cta')).toBeHidden();
    });

    test('no horizontal overflow at 375px', async ({ page }) => {
      await page.setViewportSize(MOBILE);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  });
}

// ─── Testimonials page ────────────────────────────────────────────────────────
test.describe('Testimonials page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pages/testimonials.html');
  });

  test('page title is the testimonials/reviews title', async ({ page }) => {
    await expect(page).toHaveTitle(/Customer Reviews/);
  });

  test('testimonial cards present', async ({ page }) => {
    const count = await page.locator('.testimonial-card, .t-card, [class*="testimonial"]').count();
    expect(count).toBeGreaterThan(0);
  });

  test('CTA links to contact or tel:', async ({ page }) => {
    const links = await hrefs(page, 'a.btn-primary, a.btn-dark, a.nav-cta');
    expect(links.some(h => h && (h.includes('contact') || h.startsWith('tel:')))).toBe(true);
  });

  test('nav dropdown is visible on hover', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const dropdown = page.locator('.nav-dropdown').first();
    await dropdown.hover();
    await expect(dropdown.locator('.nav-dropdown-menu')).toBeVisible();
  });
});

// ─── Blog page ────────────────────────────────────────────────────────────────
test.describe('Blog page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pages/blog.html');
  });

  test('page title is the blog title', async ({ page }) => {
    await expect(page).toHaveTitle(/Appliance Repair Blog/);
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

  test('page title is the service-areas title', async ({ page }) => {
    await expect(page).toHaveTitle(/Service Areas/);
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
    expect(links.some(h => h === './' || h === '/')).toBe(true);
  });
});

// ─── FAQ redirect ─────────────────────────────────────────────────────────────
test.describe('faq/index.html redirect stub', () => {
  test('redirects to faq.html', async ({ page }) => {
    // Deterministic: fetch the stub's raw HTML (no JS execution, no navigation)
    // and assert it redirects to faq.html via BOTH mechanisms it ships with.
    // Executing the redirect and racing page.goto()'s load wait against the
    // in-<head> window.location.replace() was flaky — it intermittently threw
    // "navigation interrupted", and cold (uncached) the redirect target's load
    // event could exceed the timeout. Asserting the stub is configured to
    // redirect to faq.html is the meaningful, race-free check.
    const res = await page.request.get('/faq/index.html');
    expect(res.ok()).toBeTruthy();
    const html = await res.text();
    expect(html).toMatch(/http-equiv=["']refresh["'][^>]*faq\.html/i);
    expect(html).toMatch(/location\.replace\(["'][^"']*faq\.html["']\)/i);
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
      await expect(page).toHaveTitle(/Tips/);
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

    // Regression: PR #470. The footer is injected into article pages, which do NOT
    // load shared.css, so var(--surface)/var(--footer-text) in the brand column were
    // undefined and the brand name + tagline fell back to the dark body color on the
    // #090909 footer (invisible). Assert they compute to a light, visible color.
    test('footer brand column renders light, visible text', async ({ page }) => {
      const lum = await page.locator('.footer-brand').evaluate(el => {
        const avg = node => {
          if (!node) return -1;
          const m = window.getComputedStyle(node).color.match(/\d+(\.\d+)?/g);
          if (!m) return -1;
          const [r, g, b] = m.map(Number);
          return (r + g + b) / 3;
        };
        return { name: avg(el.querySelector('span')), tagline: avg(el.querySelector('p')) };
      });
      // brand name is #fff (255); tagline is #b3b3b3 (179). Dark fallback ≈ 0.
      expect(lum.name).toBeGreaterThan(150);
      expect(lum.tagline).toBeGreaterThan(120);
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

// ─── Regression: every mobile drawer link must be REACHABLE, not merely present ──
// P6-52. The drawer sits inside a position:fixed nav, so page scrolling can never
// reveal content below the fold, so the drawer has to scroll itself. Measured before
// the fix at 375x812: the drawer rendered 2213px tall (3408px with all <details>
// open) with overflow-y:visible and scrollHeight === clientHeight, leaving 35 of
// 69 links permanently unreachable. Scrolling to the bottom of the page (scrollY
// 11764) did not move it.
//
// Why a new test rather than tightening the existing one: 'nav drawer links are
// reachable after scroll-and-open' above is named for reachability but only counts
// links (>= 7). The whole suite passed 1112 tests with this bug live. Counting a
// link proves it exists in the DOM; it says nothing about whether a thumb can get
// to it.
//
// Both drawer families are covered on purpose. They are different markup with
// different CSS (main: .nav-drawer via shared.css, except index.html which inlines
// its own copy; article: #mobile-nav-drawer with per-file inline CSS), so passing
// on one proves nothing about the other.
test.describe('Regression: mobile nav drawer reachability (P6-52)', () => {
  const DRAWER_PAGES = [
    { url: '/index.html', drawer: '.nav-drawer', note: 'inlines its own nav CSS, does not link shared.css' },
    { url: '/pages/appliance-repair-irvine-ca.html', drawer: '.nav-drawer', note: 'hub page via shared.css' },
    { url: '/pages/service-areas.html', drawer: '.nav-drawer', note: 'static page via shared.css' },
    { url: '/articles/article-fridge-repair-garden-grove.html', drawer: '#mobile-nav-drawer', note: 'article family' },
  ];

  for (const { url, drawer, note } of DRAWER_PAGES) {
    test(`every drawer link is reachable at 375px: ${url} (${note})`, async ({ page }) => {
      await page.setViewportSize(MOBILE);
      await page.goto(url);
      await page.locator('.nav-hamburger').click();
      // Expand every disclosure, which is the worst case and the state that broke.
      await page.evaluate((sel) => {
        const d = document.querySelector(sel);
        if (d) for (const el of d.querySelectorAll('details')) el.open = true;
      }, drawer);

      const unreachable = await page.evaluate((sel) => {
        const d = document.querySelector(sel);
        const bad = [];
        // Do NOT filter on height here. An earlier version of this test skipped any
        // link with height 0, which meant a link collapsed to nothing was silently
        // dropped from the check instead of failing it: a genuinely untappable link
        // reported clean. Only links that are deliberately hidden (display:none or
        // visibility:hidden, on the link or any ancestor) are out of scope; anything
        // rendered must be reachable. All <details> are forced open above, so a
        // collapsed disclosure is not a legitimate reason to be hidden here.
        const isDeliberatelyHidden = (el) => {
          for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
            const cs = getComputedStyle(n);
            if (cs.display === 'none' || cs.visibility === 'hidden') return true;
          }
          return false;
        };
        const links = [...d.querySelectorAll('a')].filter(a => !isDeliberatelyHidden(a));
        for (const a of links) {
          const box = a.getBoundingClientRect();
          if (box.width === 0 || box.height === 0) {
            bad.push(`${a.textContent.trim()} (rendered but zero-size ${box.width}x${box.height})`);
            continue;
          }
          a.scrollIntoView({ block: 'center' });
          const b = a.getBoundingClientRect();
          // Vertical only, deliberately. Checking left/right straight after
          // scrollIntoView is circular: scrollIntoView scrolls whatever container it
          // must to satisfy the check, so it can never fail. Horizontal reach is
          // asserted properly in the sibling test below, which requires the drawer
          // not to scroll sideways at all.
          const inViewport = b.top >= 0 && b.bottom <= window.innerHeight;
          // Geometry alone is not reachability. The sticky Call/Book bar is fixed at
          // the bottom with z-index 200, so a link can sit inside the viewport and
          // still be untappable because the bar is painted over it. Hit-test the
          // centre point and require it to actually resolve to this link.
          const hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
          const tappable = hit && (hit === a || a.contains(hit) || hit.contains(a));
          if (!inViewport) bad.push(`${a.textContent.trim()} (off-viewport)`);
          else if (!tappable) bad.push(`${a.textContent.trim()} (occluded by .${hit ? hit.className || hit.tagName : 'nothing'})`);
        }
        return bad;
      }, drawer);

      expect(unreachable, `unreachable drawer links: ${unreachable.join(', ')}`).toEqual([]);
    });
  }

  test('drawer scrolls itself when its content exceeds the viewport', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/index.html');
    await page.locator('.nav-hamburger').click();
    await page.evaluate(() => {
      for (const el of document.querySelectorAll('.nav-drawer details')) el.open = true;
    });
    const box = await page.locator('.nav-drawer').evaluate(el => ({
      clientHeight: el.clientHeight,
      scrollHeight: el.scrollHeight,
      overflowY: window.getComputedStyle(el).overflowY,
    }));
    // The content is far taller than any phone, so the container must clip and scroll.
    expect(box.scrollHeight).toBeGreaterThan(box.clientHeight);
    expect(['auto', 'scroll']).toContain(box.overflowY);
  });

  test('the drawer never scrolls sideways', async ({ page }) => {
    // Setting overflow-y also makes overflow-x computed non-visible, so the drawer
    // becomes a horizontal scroll container as a side effect. If anything inside it
    // ever overflows horizontally the drawer will silently scroll sideways to reach
    // it, which is both a layout bug and a hole in the reachability test above (that
    // check uses scrollIntoView, which would happily scroll sideways to pass).
    await page.setViewportSize(MOBILE);
    await page.goto('/index.html');
    await page.locator('.nav-hamburger').click();
    await page.evaluate(() => {
      for (const el of document.querySelectorAll('.nav-drawer details')) el.open = true;
    });
    const h = await page.locator('.nav-drawer').evaluate(el => ({
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
    }));
    expect(h.scrollWidth).toBeLessThanOrEqual(h.clientWidth);
  });

  test('the drawer stays hidden on desktop and the fix does not leak there', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto('/index.html');
    const css = await page.locator('.nav-drawer').evaluate(el => {
      const s = window.getComputedStyle(el);
      return { display: s.display, maxHeight: s.maxHeight };
    });
    expect(css.display).toBe('none');
    expect(css.maxHeight).toBe('none');
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
  { brand: 'DCS',      file: 'dcs-appliance-repair-orange-county.html' },
];
// NOT in this list, deliberately: the 7 MAINSTREAM brand hubs (Whirlpool, GE, Samsung,
// LG, Maytag, Frigidaire, KitchenAid). Adding Frigidaire here was tried during #708 and
// failed 5 assertions. FOUR of those are correct-by-design: this list encodes LUXURY-hub
// decisions the mainstream hubs intentionally do not follow — built article-style with no
// testimonials (so both testimonial assertions fail, and AggregateRating is absent with
// them) and carrying an 8-card luxury cross-link grid rather than 6.
//
// The FIFTH is not a design difference and should not be read as one: Frigidaire's meta
// description is 186 chars against this suite's 140-165 assertion. That is a real
// pre-existing bug, unrelated to the luxury/mainstream split, and it is invisible today
// because content-integrity.js's `meta-desc-len` check only scans articles/, not pages/.
// #708 did not fix it (out of scope — that PR changed href values only); it is recorded
// in tasks/action-plan-2026-08-09-analytics.md as M-7.
//
// Covering these 7 hubs needs its own list with its own assertions, the same way
// PREMIUM_HUBS above needed one. Until then they have no functional coverage — which is
// how Frigidaire shipped 4 dead `tel:` links.

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

    test('LocalBusiness schema has AggregateRating matching the canonical review count', async ({ page }) => {
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
      expect(String(rating.reviewCount)).toBe(EXPECTED_REVIEW_COUNT);
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
      expect(breadcrumbLinks.some(h => h === '../')).toBe(true);
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
    test('luxury brands cross-link grid has 6 cards', async ({ page }) => {
      const cards = await page.locator('.luxury-brand-card').count();
      expect(cards).toBe(6);
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

// ── Mobile hero occlusion + horizontal overflow, at 375px ─────────────────────
// Google indexes mobile-first. This file already had SOME 375px coverage (the
// no-horizontal-overflow test on the luxury city hubs, above), but nothing checked
// article hero geometry against the fixed nav, so that class was invisible to CI
// until 2026-08-03. Claiming the file had no mobile coverage at all was wrong and
// was corrected in the PR #678 review. A measured walk
// of all 71 articles at 375x812 then found 15 broken pages: 13 where the <h1> or the
// meta chips rendered UNDERNEATH the fixed nav (worst case meta.top -51px, i.e. off
// the top of the screen) and 2 where a wide table pushed the whole document sideways.
//
// Root cause was an INLINE font-size:38px on the article H1 inside a fixed-height
// hero. Inline styles beat every stylesheet rule, so no media query could scale it,
// and a long heading grew upward out of the box. Fixed in PR #677 with !important
// overrides in each article's own @media block.
//
// This is the gate that keeps it fixed. It asserts the two things that were actually
// broken, on the specific articles that were broken plus the newest template, rather
// than re-deriving contrast: hero content must start BELOW the fixed nav, and the
// document must not scroll horizontally.
// EVERY article, not a sample. A 6-page list was the first attempt; the PR #678
// reviewer demonstrated the hole by removing the fix from an uncovered article and
// watching the whole suite report green. A static source-level check was the second
// attempt and is worse: measured across 71 articles, whether a heading overflows
// depends on hero height AND heading length together (clean articles run to 84
// chars; fixed ones start at 41), so no grep-able rule separates them without false
// positives. The behaviour is what matters, so measure the behaviour, everywhere.
const MOBILE_OCCLUSION_PAGES = fs.readdirSync(path.join(__dirname, '..', 'articles'))
  .filter(f => f.startsWith('article-') && f.endsWith('.html'))
  .map(f => `/articles/${f}`);

for (const url of MOBILE_OCCLUSION_PAGES) {
  test(`mobile 375px: hero clears the fixed nav and nothing overflows sideways: ${url}`, async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto(url);

    const r = await page.evaluate(() => {
      // .nav, not 'nav, .nav': three articles carry a second <nav class="article-toc">,
      // and the broader selector worked only by DOM order. Raised in the #678 review.
      const nav = document.querySelector('.nav');
      const navFixed = nav && getComputedStyle(nav).position === 'fixed';
      const navBottom = navFixed ? nav.getBoundingClientRect().bottom : 0;
      const out = { navFixed, navBottom, h1Top: null, metaTop: null, scrollW: 0, clientW: 0, widest: null };
      out.scrollW = document.documentElement.scrollWidth;
      out.clientW = document.documentElement.clientWidth;

      const h1 = document.querySelector('h1');
      out.hasH1 = !!h1;
      if (h1) out.h1Top = h1.getBoundingClientRect().top;
      const meta = document.querySelector('.article-meta');
      out.hasMeta = !!meta;
      if (meta && meta.getBoundingClientRect().height > 0) out.metaTop = meta.getBoundingClientRect().top;

      // Name the widest offender so a failure says WHAT is wide, not just that something is.
      // Diagnosing PR #677's residual overflow by re-reading CSS instead of asking the DOM
      // cost a whole review round and produced a wrong root cause in the backlog.
      if (out.scrollW > out.clientW + 1) {
        let worst = null;
        for (const el of document.querySelectorAll('*')) {
          const b = el.getBoundingClientRect();
          if (b.width > 0 && b.right > out.clientW + 1 && (!worst || b.right > worst.right)) {
            worst = { right: Math.round(b.right), width: Math.round(b.width), tag: el.tagName, cls: String(el.className).slice(0, 60) };
          }
        }
        out.widest = worst;
      }
      return out;
    });

    // The guard has to prove it actually measured something. A page whose nav stopped
    // being fixed would silently pass every assertion below against navBottom = 0.
    expect(r.navFixed, `${url}: no fixed nav found, so this test proves nothing`).toBe(true);
    expect(r.navBottom).toBeGreaterThan(0);

    // Existence guards, applying the same principle as navFixed above. The #678
    // reviewer disproved my assumption that "a different check would catch it": it
    // retagged an <h1> to <h2> and content-integrity's schema-headline-sync reported
    // clean, because that check silently skips on a missing H1 too. So nothing in
    // this repo fails when an article loses its heading. Now something does.
    expect(r.hasH1, `${url}: no <h1> on the page`).toBe(true);
    expect(r.hasMeta, `${url}: no .article-meta on the page`).toBe(true);

    if (r.h1Top !== null) {
      expect(r.h1Top, `${url}: <h1> starts at ${Math.round(r.h1Top)}px, under the ${Math.round(r.navBottom)}px fixed nav`).toBeGreaterThanOrEqual(r.navBottom);
    }
    if (r.metaTop !== null) {
      expect(r.metaTop, `${url}: .article-meta starts at ${Math.round(r.metaTop)}px, under the ${Math.round(r.navBottom)}px fixed nav`).toBeGreaterThanOrEqual(r.navBottom);
    }
    expect(r.scrollW, `${url}: document scrolls sideways (${r.scrollW}px vs ${r.clientW}px viewport). Widest offender: ${JSON.stringify(r.widest)}`).toBeLessThanOrEqual(r.clientW + 1);
  });
}
