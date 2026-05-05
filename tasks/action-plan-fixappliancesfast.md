# Action Plan — fixappliancesfast.com

Combined remediation plan from two independent reviews of `fixappliancesfast.com` (the deployed static site for Universal Appliances Repair). Use this with Claude Code or Copilot. Each item is sized so a coding agent can pick it up and ship it as a single PR per the standing workflow rule (`branch → commit → test → PR → review → merge`).

**Site name canonicalization:** the public business name is **Universal Appliances Repair** (legal: *Universal Appliances Repair Group Inc.*). The domain `fixappliancesfast.com` is a marketing URL. Pick **one** brand name to use consistently in `<title>`, schema `name`, footer, GBP, and all directories. Recommendation: keep the domain, lead with "Universal Appliances Repair" everywhere, treat "Fix Appliances Fast" only as the URL.

---

## How to use this plan

- Each task has an ID, owner-suggested-tool, acceptance criteria, and the rule it ties back to in `.claude/rules/`.
- Phases are **sequential by priority**, not by team. P0 → P1 → P2 → P3 → P4.
- Every task ships as its own branch + PR. No batching unrelated changes.
- Mark items with `[x]` as PRs merge.

---

## P0 — Critical fixes (do first, this week)

### P0-1 Add `robots.txt` and `sitemap.xml`
- [x] Both currently return 404.
- Create `robots.txt` at repo root: `User-agent: *` / `Allow: /` / `Sitemap: https://fixappliancesfast.com/sitemap.xml`.
- Generate `sitemap.xml` listing every `*.html` file, with `lastmod` from git.
- Add a small node script (e.g., `scripts/build-sitemap.js`) that regenerates `sitemap.xml` from the file tree so future articles auto-include.
- **Acceptance:** both files return 200 from production; sitemap lists every article and page.
- **Rule reference:** `rules/seo-content.md` → "Required SEO Elements".

### P0-2 Fix homepage `<title>` and add meta description
- [x] Current title: `Universal Appliances Repair – OC California` (weak, no primary keyword).
- New title: `Appliance Repair Orange County CA | Universal Appliances Repair`.
- Add meta description (150–160 chars):
  > Universal Appliances Repair provides same-day appliance repair in Orange County, CA — refrigerators, washers, dryers, ovens, stoves, dishwashers. Call (949) 629-5365.
- **Acceptance:** view source on `/` shows new title and description; Google Rich Results test passes.

### P0-3 Add LocalBusiness JSON-LD to homepage
- [x] Currently zero structured data on `index.html`.
- Inline `<script type="application/ld+json">` block including: `name`, `legalName`, `url`, `telephone`, `email`, `address` (PostalAddress), `geo`, `areaServed` (full city list), `serviceType`, `openingHoursSpecification`, `priceRange`, `image`, `logo`, `sameAs` (social links once they exist).
- Add `BreadcrumbList` schema for homepage too.
- **Acceptance:** Schema Markup Validator returns zero errors for `/`.
- **Rule reference:** `rules/seo-content.md` → schema templates already exist for articles; add a homepage-specific block.

### P0-4 Add Open Graph + Twitter Card tags to homepage and pages
- [x] None present on `/`.
- Required tags: `og:title`, `og:description`, `og:type=website`, `og:url`, `og:image` (1200×630 PNG), `og:site_name`, plus `twitter:card=summary_large_image`, `twitter:title`, `twitter:description`, `twitter:image`.
- **Acceptance:** Facebook Sharing Debugger and Twitter Card Validator both render a clean preview.

### P0-5 Fix footer: copyright year and dead `#` links
- [x] Footer says `© 2024` — looks abandoned. Make it auto-update or set to 2026.
- [x] All Services links in footer point to `#`. Wire each to its real page (`pages/services.html` for now; later to per-service pages from P2).
- [x] "Privacy Policy" and "Terms of Service" link to `#`. Either create stub pages or remove the links until written.
- **Acceptance:** `npm test` (link checker) reports zero broken hrefs.

### P0-6 Audit and fix broken nav: Blog and Contact
- [x] PDF report flagged `/blog/` and `/contact.html` returning 404 in some entry paths.
- Verify all internal nav links resolve (run `npm test`).
- Add 301 redirects (or symlinks if hosted on GitHub Pages — use a small `_redirects` file or duplicate index entry) so `/contact`, `/contact.html`, and `pages/contact.html` all resolve.
- **Acceptance:** `npm test` passes from every entry page; manual click-through of nav reaches every page.

### P0-7 Add `llms.txt` at root
- [x] Create `/llms.txt` describing the business so AI engines can ingest cleanly. Format from the PDF report:

```
# Universal Appliances Repair

Universal Appliances Repair Group Inc. provides appliance repair services in Orange County, California.

Website: https://fixappliancesfast.com/
Phone: (949) 629-5365
Email: info@fixappliancesfast.com
Address: 10832 Asbury Avenue, Stanton, CA 90680

Services:
- Refrigerator repair
- Washer repair
- Dryer repair
- Dishwasher repair
- Oven repair
- Stove repair
- Freezer repair
- Garbage disposal repair

Service area:
Orange County, CA, including Stanton, Irvine, Anaheim, Santa Ana, Huntington Beach,
Costa Mesa, Fullerton, Garden Grove, Tustin, Orange, Lake Forest, Mission Viejo,
Newport Beach, and nearby cities.

Booking:
https://fixappliancesfast.com/pages/contact.html
```

- **Acceptance:** `https://fixappliancesfast.com/llms.txt` returns the file with `Content-Type: text/plain`.

### P0-8 Remove any leftover template / placeholder text
- [x] PDF flagged "My Blog" placeholder text on the live site.
- Grep the repo for `My Blog`, `Lorem`, `placeholder`, `TODO`, `FIXME`. Replace with the real business name or delete.
- **Acceptance:** `grep -ri "my blog\|lorem\|placeholder text" *.html pages/ articles/` returns nothing.

---

## P1 — Mobile responsiveness (do this week or next)

The current CSS has effectively zero `@media` queries. The whole site renders the same on a 1440px laptop and a 375px iPhone. Below are the specific fixes.

### P1-1 Add a real mobile breakpoint set to `shared.css` and inline styles in `index.html`
- [x] Add `@media (max-width: 768px)` and `@media (max-width: 480px)` blocks.
- Required overrides at `≤ 768px`:
  - `.nav-links { display: none; }` (replace with hamburger — see P1-2)
  - `.services-grid, .features-grid { grid-template-columns: 1fr; }`
  - `.hero h1 { font-size: 32px; line-height: 1.15; }`
  - `.value-h { font-size: 26px; }`
  - `.section { padding: 48px 16px; }`
  - `.letter-card { padding: 28px 22px; }`
  - Hide decorative emoji floats: `.float { display: none; }` (they overlap the heading on mobile)
- **Acceptance:** Chrome DevTools at 375px shows no horizontal scroll, no overlapping elements, h1 fits within viewport.

### P1-2 Add a hamburger menu for mobile
- [x] Replace `.nav-links` with a toggleable drawer below 768px.
- Vanilla JS, no framework. Hamburger button → `aria-expanded` toggle → drawer slides down.
- Keep "Call" button visible at all sizes — it's the primary CTA.
- **Acceptance:** Mobile nav opens/closes; keyboard accessible (`Esc` closes); `aria-expanded` toggles correctly.

### P1-3 Add a sticky bottom Call/Book bar on mobile
- [x] PDF report's strongest mobile recommendation. Below 768px, fixed-position bar at bottom of viewport with two buttons:
  - **Call Now** (`tel:+19496295365`) — left half, accent color
  - **Book Repair** (`pages/contact.html`) — right half, dark
- Hide the bar above 768px (desktop already has a header CTA).
- Add `padding-bottom: 64px` to `body` on mobile so content isn't covered.
- **Acceptance:** On mobile, bar is always visible; both buttons are 44×44px tap targets minimum.

### P1-4 Fix tap target sizes throughout
- [ ] Several inline-styled CTAs use `padding: 7px 16px` — under the 44px Apple HIG minimum for tap targets.
- Audit every `<a>` and `<button>`. Anything below 44px height in mobile breakpoint gets bumped.
- **Acceptance:** Lighthouse mobile audit shows zero "tap targets too small" warnings.

### P1-5 Fix the contact/booking form for mobile
- [ ] PDF report flagged: form may show duplicate "Please enable JavaScript" message and feels crowded.
- Stack form fields vertically (no side-by-side on mobile).
- Use proper `<select>` dropdowns for City and Appliance Type.
- Fields above the fold on mobile: Name, Phone, City, Appliance, Message. Nothing else.
- Verify the duplicate JS-disabled fallback is removed.
- **Acceptance:** Form fits on a single mobile screen above the keyboard; no duplicate fallback messages.

---

## P2 — Local SEO depth (the work that actually moves rankings)

This is the section that determines whether the site can rank for "appliance repair Anaheim" or only for "Universal Appliances Repair." Each page below is a separate PR.

### P2-1 Build `/service-areas/` hub page
- [x] New file: `pages/service-areas.html`.
- Lists every Orange County city served, grouped (Coastal / Central / South OC / North OC).
- Each city links to its dedicated landing page (built in P2-3).
- Embed an interactive map (Leaflet + OpenStreetMap, no API key needed).
- Add to main nav.
- **Acceptance:** Page lists ≥ 25 cities, each linking somewhere real (city page once it exists, or anchor to "we also serve" section if city page doesn't exist yet).

### P2-2 Build per-service hub pages
- [x] One PR per page. **Build with `/seo-hub --type=service --appliance=[name]`** — the command handles research, proposal, schemas, internal linking, and the test loop. It stops at "PR ready for owner review" (never auto-merges).
- Order:
  1. ✅ `pages/refrigerator-repair-orange-county.html`  →  `/seo-hub --type=service --appliance=refrigerator`
  2. ✅ `pages/washer-repair-orange-county.html`  →  PR #75 open, awaiting owner review
  3. ✅ `pages/dryer-repair-orange-county.html`  →  PR #78 open, awaiting owner review
  4. ✅ `pages/dishwasher-repair-orange-county.html`  →  PR #81 merged
  5. ✅ `pages/oven-stove-repair-orange-county.html`  →  PR #83 merged
- Spec the command enforces: 1,000–1,500 words covering symptoms, brands, repair flow, 8+ FAQs, CTA; required schemas (`Service` + `LocalBusiness` + `BreadcrumbList` + `FAQPage`); links from homepage services grid, footer, `services.html`, and 3 most-relevant existing articles.
- **Acceptance per page:** the `/seo-hub` Phase 5 demo summary shows ≥ 1,000 words, ≥ 8 FAQs, all four schemas validating, all internal links wired, and a green test pass; PR is open in GitHub for owner review.

### P2-3 Build city landing pages — start with the top 5
- [ ] One PR per page. **Build with `/seo-hub --type=city --city=[slug]`** — same command as P2-2, different `--type`. The command pulls real neighborhoods/ZIPs in Phase 0 so each page has authentic local detail.
- Order from PDF report:
  1. `pages/appliance-repair-irvine-ca.html`  →  `/seo-hub --type=city --city=irvine`
  2. `pages/appliance-repair-anaheim-ca.html`  →  `/seo-hub --type=city --city=anaheim`
  3. `pages/appliance-repair-santa-ana-ca.html`  →  `/seo-hub --type=city --city=santa-ana`
  4. `pages/appliance-repair-huntington-beach-ca.html`  →  `/seo-hub --type=city --city=huntington-beach`
  5. `pages/appliance-repair-costa-mesa-ca.html`  →  `/seo-hub --type=city --city=costa-mesa`
- Spec the command enforces: 800–1,200 words covering neighborhoods/ZIPs, services available locally, brands, 5+ city-specific FAQs, real local testimonials (or marked TODO placeholders); required schemas (`LocalBusiness` with city `addressLocality` + `BreadcrumbList` + `FAQPage`); links from `/service-areas/`, homepage, footer, and the 3 most-relevant articles tagged with that city.
- **Acceptance per page:** Phase 5 demo summary shows ≥ 800 words, ≥ 5 city FAQs, all schemas validating, internal links wired, sitemap updated, tests green; PR is open in GitHub for owner review.

### P2-4 Add the "AI answer block" to homepage
- [x] PDF report's key GEO insight. New section near the top of `index.html` (after hero, before existing services grid). Plain prose, factual, no marketing fluff.
- Suggested copy from PDF:
  > Universal Appliances Repair Group Inc. provides appliance repair services in Orange County, California, including refrigerator repair, washer repair, dryer repair, dishwasher repair, oven repair, stove repair, freezer repair, and garbage disposal repair. We serve Stanton, Irvine, Anaheim, Santa Ana, Huntington Beach, Costa Mesa, Fullerton, Garden Grove, Tustin, Lake Forest, Mission Viejo, and nearby Orange County cities. Call (949) 629-5365 or book online.
- This is the chunk LLMs lift verbatim when answering "best appliance repair in Orange County." Keep it factual.
- **Acceptance:** Section visible above the fold on desktop; included in homepage HTML so GPTBot/ClaudeBot/PerplexityBot can read it without JS.

### P2-5 Expand the homepage FAQ to 10–15 questions
- [x] Current homepage FAQ has 3. Each Q&A is a chunk an AI engine can quote.
- Required additions (from PDF report):
  - Do you offer same-day appliance repair in Orange County?
  - Do you repair Samsung refrigerators?
  - Do you repair LG washers?
  - Do you repair Whirlpool dryers?
  - How much does appliance repair cost in Orange County?
  - Is it better to repair or replace a refrigerator?
  - What cities in Orange County do you serve?
  - Do you provide warranty on parts and labor?
  - Can I book appliance repair online?
  - Do you repair built-in ovens and cooktops?
- Update the inline `FAQPage` schema to match.
- **Acceptance:** ≥ 10 Q&A pairs; schema validates with all questions; visible content matches schema content.

---

## P3 — Trust signals & content depth

### P3-1 Replace generic testimonials with verifiable ones
- [x] Current testimonial is a stock-photo "David Miller." This is a credibility liability.
- Pull real Google / Yelp reviews. Each testimonial should include: customer first name, city, appliance type, repair context, approximate date.
- Add `Review` and `AggregateRating` JSON-LD with star count + review count from GBP.
- **Acceptance:** ≥ 6 real testimonials on homepage; `AggregateRating` schema present.

### P3-2 Publish a "Brands We Service" section
- [ ] AI engines and customers both use brand names as filters. Currently no brands listed.
- Add a brand grid with logos (or text if licensing is a concern): Whirlpool, GE, Samsung, LG, Sub-Zero, Wolf, Bosch, Viking, KitchenAid, Maytag, Frigidaire, Kenmore, Thermador, Miele, Dacor.
- Add to `services.html` and the per-service hub pages.
- **Acceptance:** Brands section visible on homepage and all service pages; brand names appear as plain text in HTML (LLM-readable).

### P3-3 Replace stock photos with real ones
- [ ] Hero, service cards, and "how it works" all use Unsplash. Real photos = trust.
- Capture: technician at work, branded van, before/after of repaired appliances, the team in front of the shop.
- Optimize (`<img width height>`, `loading="lazy"`, WebP + JPEG fallback).
- **Acceptance:** Homepage and at least one service page show ≥ 5 photos that are clearly the real business.

### P3-4 Add author bios for blog content
- [ ] Currently articles have no `author` displayed on the page (only in schema).
- Create one or two technician profiles (`pages/team/[name].html`) with: name, photo, years experience, certifications, brands worked on.
- Update article `<head>` schema `author` to point to the bio page (`@id`).
- **Acceptance:** Each new article references a real author with a `sameAs` URL or page link; existing articles' schema points at a real author entity.

### P3-5 Add license / certification / trust badges
- [ ] PDF report and Google E-E-A-T both reward concrete trust markers.
- Add to homepage and footer: contractor license number, EPA Section 608 certification (for refrigerant work), BBB rating + URL, Google Guaranteed badge if eligible, factory-authorized brand badges if any.
- **Acceptance:** Trust strip with ≥ 4 verifiable badges visible on homepage.

---

## P4 — Off-site & operational

### P4-1 Align Google Business Profile with the website
- [ ] PDF report priority. GBP must mirror the site exactly: name, phone, address, hours, categories, services, booking URL.
- Primary GBP category: **Appliance repair service**.
- Secondary: Refrigerator repair service, Washer & dryer repair service, Small appliance repair service.
- Add booking URL pointing to `pages/contact.html`.
- Upload the same photos used on the site (P3-3).
- **Acceptance:** All GBP fields match site; tracked in a one-row spreadsheet under `tasks/gbp-sync.md`.

### P4-2 Submit sitemap to Search Console + Bing Webmaster Tools
- [ ] Once P0-1 is live, submit `sitemap.xml` in both consoles.
- Verify domain ownership in both.
- Set up alerts for crawl errors.
- **Acceptance:** Both consoles show the sitemap as `Success`; coverage report inspected after 7 days.

### P4-3 Build out the directory presence
- [ ] AI engines pull citations from these. NAP must be identical everywhere.
- Claim/update listings on: Yelp, Better Business Bureau, Angi (Angi's List), HomeAdvisor, Thumbtack, Nextdoor business profile, Bing Places, Apple Business Connect.
- Use the exact same business name, phone, address, hours, and a link to `https://fixappliancesfast.com/`.
- **Acceptance:** Tracked in `tasks/directory-listings.md` with status per directory.

### P4-4 Earn local citations and mentions
- [ ] Sponsor a Little League team, Chamber of Commerce membership, donate to a local charity that publishes a thank-you list — anything that generates a link from a `.com` with local intent.
- Reach out to 5 local home-services bloggers / Reddit r/orangecounty for honest mentions.
- **Acceptance:** ≥ 3 inbound links from local-domain referrers within 90 days.

---

## Verification checklist (run before declaring P0/P1/P2 "done")

- [ ] `npm test` exit 0
- [ ] `npm run screenshot` exit 0
- [ ] Lighthouse mobile score ≥ 90 (Performance, Accessibility, Best Practices, SEO)
- [ ] Schema Markup Validator: zero errors on `/`, `services.html`, every city/service hub
- [ ] Google Rich Results test: `LocalBusiness`, `FAQPage`, `BreadcrumbList` all eligible
- [ ] `https://fixappliancesfast.com/robots.txt` returns 200
- [ ] `https://fixappliancesfast.com/sitemap.xml` returns 200 with all current pages
- [ ] `https://fixappliancesfast.com/llms.txt` returns 200, plain text
- [ ] Manual mobile smoke test on a real iPhone — no horizontal scroll, sticky bar present, hamburger works

---

## Recommended SEO positioning phrase (use everywhere)

> **Same-day appliance repair in Orange County, CA — refrigerators, washers, dryers, dishwashers, ovens, and stoves.**

This phrase belongs in: hero subhead, AI answer block, GBP description, llms.txt summary, every social bio.

---

## Source reports

- ChatGPT review (PDF): `fixappliancesfast_high_level_report.pdf` (root of repo)
- Claude initial audit: in-conversation report dated 2026-05-04
