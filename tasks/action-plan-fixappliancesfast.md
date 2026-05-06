# Action Plan — fixappliancesfast.com (v3)

Consolidated remediation plan for **Universal Appliances Repair** (`fixappliancesfast.com`). Audit refreshed 2026-05-06 — every item marked `[x]` has been verified live or in current `main`; everything else is open work.

**Site name canonicalization:** public business name is **Universal Appliances Repair**; legal name is *Universal Appliances Repair Group Inc.*; `fixappliancesfast.com` is a marketing URL only. Never write "Fix Appliances Fast" as a brand.

---

## How to use this plan

- One PR per task per `.claude/rules/git-workflow.md`. No batching unrelated changes.
- Phases sequential by priority: P0 → P1 → P2 → P3 → P4 → P5 → P6.
- v3 captures the state on 2026-05-06: a lot landed since v2, plan compacted accordingly.

---

## Snapshot of what's already shipped (verified live, 2026-05-06)

The following items from earlier plans are **done** and removed from the active list. Confirming inline so future audits can spot-check:

- Contact form is live and wired to Formspree (`https://formspree.io/f/xqenbpka`); 7 named fields + hidden `_subject`; method POST.
- Repo root is clean — only `logo.png`, `robots.txt`, `sitemap.xml`, `llms.txt`, `404.html`, `CNAME`, plus repo plumbing. The original logo source is preserved at `images/source/logo-original.jpg`.
- All 33 articles have `og:image` and `twitter:image` populated.
- All 6 static pages (`services`, `blog`, `about`, `contact`, `faq`, `testimonials`) have JSON-LD schemas, OG tags, and proper titles leading with the primary keyword.
- All 6 city hubs are over 2,200 words (well past the 800-word minimum).
- Homepage `<h1>` now reads `Same-Day Appliance Repair in Orange County, CA` — leads with primary keyword as recommended.
- Tailwind compiled to a static `tailwind.css` + `tailwind.input.css`; zero `cdn.tailwindcss.com` references remain in HTML.
- Branded `404.html` ships at root — has GA tag, "Page Not Found" h1, 62 links to popular hubs/articles.
- `images/hero-homepage.jpg` exists in production (verified — 200 OK, 317 KB JPEG).
- Sitemap on disk and live both list 51 URLs and stay in sync.
- 6 testimonials rendered on homepage (real names + cities + appliance types).
- `logs/CONTENT_LOG.md` and `logs/AUDIT_LOG.md` created — P0-1 (PR #121, merged 2026-05-06).
- `logo.png` optimized 973 KB → 10.7 KB — P6-1 (PR #110, merged 2026-05-05). Already well under 100 KB.
- `AggregateRating` added to homepage `LocalBusiness` schema (4.9 / 76 reviews from GBP) — P1-1 (PR #124, merged 2026-05-06).
- Page-type schemas added to 4 static pages (`ContactPage`, `AboutPage`+`Organization` w/ founder Gasan Aliyev, `Blog`, `OfferCatalog`); `faq.html` and `testimonials.html` already compliant — P1-2 (PR #125, merged 2026-05-06).
- City-page meta descriptions verified ≤ 160 chars on all 6 pages; no changes needed — P1-3 (verified 2026-05-06).

That's basically all of P0, all of P1, and most of P6 from the previous v2 plan. What's below is what's still open.

---

## P2 — Blog discoverability + scale infrastructure

This phase has not been started. The filter pills on `pages/blog.html` are still placeholders — all five `<a class="cat-pill" href="#">`. No JS handler, no category pages, no search input.

### P2-1 Wire blog filter pills to appliance taxonomy
- Replace the 5 placeholder pills (`Tips & Guides / Buying Guides / Maintenance / Advice`) with appliance-axis taxonomy that matches what's actually on the cards: `All Posts (33)`, `Refrigerator (5)`, `Washer (5)`, `Dryer (4)`, `Oven (3)`, `Dishwasher (4)`, `Freezer (3)`, `Other (9)`.
- Each pill ALSO points to a real category page (P2-2) instead of `#`, so click → navigation. JS in P2-3 handles in-page filtering.
- Add `data-category` to each `.blog-card` so filtering can match.
- **Acceptance:** counts match reality; clicking each pill loads the matching category page.

### P2-2 Build blog category-page template + ship 4 priority pages
Different intent from per-service hubs (which target commercial / "hire someone now"). Category pages target informational intent.

Build first (highest article volume):
- `pages/blog/refrigerator.html`
- `pages/blog/washer.html`
- `pages/blog/dryer.html`
- `pages/blog/oven-stove.html`

Each page:
- 600–800 words; H1 + intro covering common problems in that appliance category
- Lists every article in that category with thumbnail, excerpt, date
- Cross-links to the matching service hub at the top ("Need help right now? See our [appliance] repair service in Orange County")
- `CollectionPage` + `BreadcrumbList` schema; OG tags; GA tag
- Linked from main nav, blog page filter pills, and footer

Build the template first as a reusable scaffold so later categories drop in cleanly.

- **Acceptance per page:** schema validates; clean OG card; appears in `sitemap.xml`; ranks for `[appliance] repair tips Orange County` after 30 days.

### P2-3 Add client-side article search to `pages/blog.html`
At 33 articles no library is needed.

- Add `<input type="search" placeholder="Search 33 articles…">` above the grid.
- On keystroke, filter `.blog-card` elements by matching against title + excerpt + category badge.
- Show "No articles match" empty state.
- Hash-sync the query so `blog.html?q=fridge` is shareable.
- Combine with P2-1 filter pills so search + category filter compose.
- **Acceptance:** typing instantly filters cards; works without page reload; under 60 lines of JS.

### P2-4 Pagefind upgrade — trigger at 50 articles
Tracking, not building. When `articles/` hits 50 files (likely mid-summer at the Mon/Wed/Fri cadence):
- Install `pagefind` as a devDependency.
- Add a one-shot script (`scripts/build-search-index.js` or postbuild step) that runs `pagefind --site .` after content lands.
- Replace the simple JS filter from P2-3 with the Pagefind UI bundle.
- Pagefind: free, runs over static HTML, ~100 KB JS, no backend, perfect for GitHub Pages.
- **Acceptance trigger:** `ls articles/article-*.html | wc -l` returns ≥ 50.

### P2-5 Future content lanes (after city × appliance saturation)
Backlog for `/seo-blog` to draw from once city + appliance combos stop yielding new variations. Ranked by ROI:

1. **Brand-specific error codes** — biggest unclaimed long-tail. *"Samsung refrigerator DE error", "LG washer UE code", "Whirlpool F dl error", "Bosch dishwasher E15"*. Hundreds of viable articles.
2. **Brand × appliance landing pages (commercial intent hubs)** — *"Sub-Zero refrigerator repair Orange County"*. Premium brands convert at higher ticket sizes.
3. **Symptom-deep articles** — *"Dryer makes thumping noise — 6 causes ranked"*. Highly shareable; AI engines lift verbatim.
4. **"Vs." comparison guides** — *"French door vs side-by-side fridge", "Front-load vs top-load washer"*. High commercial intent at start of buying decision.
5. **Lifespan articles** — *"How long does a refrigerator last"*. Perennial demand, natural CTA hand-off.
6. **Seasonal / lifestyle content** — *"Prep your fridge for vacation", "End-of-summer appliance checklist"*. Newsletter-friendly.
7. **DIY-vs-call-a-pro decision trees** — interactive content; Google + AI both reward these.

---

## P3 — Local SEO depth (continue building geographic coverage)

### P3-1 Remaining city landing pages
Built with `/seo-hub --type=city --city=[slug]`. **Wait until P1-3 sweep is done** so all city pages match the same spec (≤ 160 char meta) before adding more.

#### Primary (priority 1 — high search volume)
- [ ] `pages/appliance-repair-fullerton-ca.html`
- [ ] `pages/appliance-repair-orange-ca.html`

#### Secondary (priority 2)
- [ ] `pages/appliance-repair-newport-beach-ca.html`
- [ ] `pages/appliance-repair-mission-viejo-ca.html`
- [ ] `pages/appliance-repair-lake-forest-ca.html`
- [ ] `pages/appliance-repair-tustin-ca.html`
- [ ] `pages/appliance-repair-fountain-valley-ca.html`
- [ ] `pages/appliance-repair-westminster-ca.html`
- [ ] `pages/appliance-repair-buena-park-ca.html`
- [ ] `pages/appliance-repair-yorba-linda-ca.html`
- [ ] `pages/appliance-repair-brea-ca.html`
- [ ] `pages/appliance-repair-laguna-niguel-ca.html`
- [ ] `pages/appliance-repair-laguna-beach-ca.html`
- [ ] `pages/appliance-repair-aliso-viejo-ca.html`
- [ ] `pages/appliance-repair-rancho-santa-margarita-ca.html`
- [ ] `pages/appliance-repair-san-clemente-ca.html`
- [ ] `pages/appliance-repair-dana-point-ca.html`
- [ ] `pages/appliance-repair-seal-beach-ca.html`
- [ ] `pages/appliance-repair-cypress-ca.html`
- [ ] `pages/appliance-repair-placentia-ca.html`
- [ ] `pages/appliance-repair-la-habra-ca.html`
- [ ] `pages/appliance-repair-los-alamitos-ca.html`

---

## P4 — Trust signals & E-E-A-T

### P4-1 Replace stock photos with real ones
- Hero, service cards, "how it works" still use Unsplash today (verified live)
- Capture: technician at work, branded van, before/after, team in front of shop
- Optimize: explicit `width`+`height`, `loading="lazy"`, WebP with JPEG fallback
- Replace on homepage and at least one service hub
- **Acceptance:** ≥ 5 photos that are clearly the actual business

### P4-2 Add author bios
- Articles have `author` only in schema, never on the visible page
- Create 1–2 technician profile pages (`pages/team/[name].html`) with photo, years experience, certifications, brands worked on
- Update article schema `author.@id` to point at the bio page
- **Acceptance:** every article schema references a real person/page

### P4-3 Add license / certification / trust badges
- Display contractor license #, EPA Section 608 cert, BBB rating + URL, Google Guaranteed (if eligible)
- Add to homepage hero strip and footer
- Include factory-authorized brand badges *only if proof exists* (per `seo-content.md` rule)
- **Acceptance:** ≥ 4 verifiable badges visible on homepage

---

## P5 — Off-site & operational

### P5-1 Bing Webmaster Tools sitemap submission
- Same `sitemap.xml`, ~2 minutes
- Bing's index also feeds ChatGPT search results — direct AI-visibility lever
- **Acceptance:** Bing Webmaster shows sitemap status `Success`

### P5-2 Google Search Console — alerts and ongoing monitoring
- ✅ Sitemap submitted 2026-05-05
- Configure email alerts for Coverage report errors (404s, soft-404s, server errors)
- After 7–14 days: review which URLs are `Discovered – currently not indexed` (signals thin content)
- After 30 days: pull top 10 articles by impressions; that's the topic-quality signal for `/seo-blog` selection
- **Acceptance:** alerts enabled; 30-day impressions snapshot saved to `tasks/seo-impressions-monthly.md`

### P5-3 Align Google Business Profile with the website
- Primary GBP category: **Appliance repair service**
- Secondary: Refrigerator repair, Washer & dryer repair, Small appliance repair
- Mirror site exactly: name, phone, address, hours, services, booking URL
- Upload the same photos used on the site (P4-1)
- **Acceptance:** all GBP fields match site; tracked in `tasks/gbp-sync.md`

### P5-4 Build out the directory presence
NAP must be identical everywhere. Claim/update:
- Yelp, BBB, Angi, HomeAdvisor, Thumbtack, Nextdoor, Bing Places, Apple Business Connect
- **Acceptance:** tracked in `tasks/directory-listings.md` with status per directory

### P5-5 Earn local citations
- Sponsor a Little League team / Chamber of Commerce / charity that publishes a thank-you list
- Pitch 5 local home-services bloggers and r/orangecounty for honest mentions
- **Acceptance:** ≥ 3 inbound links from local-domain referrers within 90 days

---

## P6 — Performance & housekeeping

### P6-2 Mobile sticky bar — confirm on real device
- CSS shows `display: flex` and `position: fixed; bottom: 0` correctly
- Earlier audit couldn't confirm on Chrome desktop emulation
- Validate on a real iPhone at 390px and 414px (Safari + Chrome)
- If sticky bar fails to appear in Safari, debug `position: fixed` interaction with the address bar
- **Acceptance:** sticky bar visible on real iPhone; both buttons tappable; doesn't overlap form inputs on `contact.html`

### P6-3 Add a `LICENSE` file or pick one for the repo
- Currently no license file. For a private business site this is fine, but if any of the static scripts/HTML is going to be open-sourced or reused (the `/seo-blog` skill, for example, is reasonably reusable), pick MIT or Apache-2.0 and add a `LICENSE` file at root.
- **Acceptance:** `LICENSE` exists at root with chosen license text.

---

## Verification checklist (run before declaring P0/P1 "done")

- [ ] `npm test` exit 0
- [ ] `npm run screenshot` exit 0
- [ ] Lighthouse mobile ≥ 90 across Performance, Accessibility, Best Practices, SEO on `/`, one service hub, one city hub, one article
- [ ] Schema Markup Validator: zero errors on `/`, every static page, every hub
- [ ] Google Rich Results: `LocalBusiness`, `FAQPage`, `BreadcrumbList`, `Service`, `AggregateRating` all eligible
- [ ] `/robots.txt`, `/sitemap.xml`, `/llms.txt` all return 200
- [ ] Manual mobile smoke test on a real iPhone

---

## Recommended SEO positioning phrase (use everywhere)

> **Same-day appliance repair in Orange County, CA — refrigerators, washers, dryers, dishwashers, ovens, and stoves.**

Belongs in: hero subhead, AI answer block, GBP description, llms.txt summary, every social bio.

---

## Suggested PR sequence (top to bottom)

The order maximizes user-visible impact, then site authority, then content surface area:

1. `chore(logs): touch CONTENT_LOG and AUDIT_LOG` — P0-1 (1 minute)
2. `feat(homepage): add AggregateRating to LocalBusiness schema` — P1-1
3. `feat(static-pages): add page-type-specific schemas` — P1-2 (one PR or six)
4. `fix(city-hubs): tighten meta description lengths` — P1-3
5. `feat(blog): wire filter pills + appliance taxonomy + JS search` — P2-1 + P2-3 combined
6. `feat(blog): category-page template + 4 priority category pages` — P2-2
7. `chore(seo): submit sitemap to Bing Webmaster + enable Search Console alerts` — P5-1, P5-2
8. `chore(perf): optimize logo.png` — P6-1
9. Resume `/seo-hub --type=city` for the remaining 22 city pages — P3-1
10. P4 trust signals + P5 off-site work in parallel as you have time

---

## Source reports

- ChatGPT review (PDF): `fixappliancesfast_high_level_report.pdf` (root of repo)
- Audit refresh: 2026-05-06 (folded into this plan; sitemap at 51 URLs, 33 articles, 6 city hubs, 5 service hubs, 6 static pages, all schemas validating)
