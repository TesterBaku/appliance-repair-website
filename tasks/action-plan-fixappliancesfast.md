# Action Plan — fixappliancesfast.com (v3)

Consolidated remediation plan for **Universal Appliances Repair** (`fixappliancesfast.com`). Audit refreshed 2026-05-06 — every item marked `[x]` has been verified live or in current `main`; everything else is open work.

**Site name canonicalization:** public business name is **Universal Appliances Repair**; legal name is *Universal Appliances Repair Group Inc.*; `fixappliancesfast.com` is a marketing URL only. Never write "Fix Appliances Fast" as a brand.

---

## How to use this plan

- One PR per task per `.claude/rules/git-workflow.md`. No batching unrelated changes.
- Phases sequential by priority: P0 → P1 → P2 → P3 → P4 → P5 → P6.
- v3 captures the state on 2026-05-06: a lot landed since v2, plan compacted accordingly.
- **2026-05-07 audit refresh** — see new section directly below; folds in two external review docs.

---

## 2026-05-07 audit refresh — short-term + long-term roadmap

**Source.** Two external audit reports analyzed in chat session 2026-05-07:
- `fixappliancesfast_website_analysis_recommendations.md` — comprehensive report with concrete templates and phased monetization roadmap.
- `Website_Analysis_Recommendations.md` — short strategic memo with operational/business-side ideas (subscriptions, SMS reviews, luxury-brand targeting, booking widget).

Most items in both reports are **already shipped or in-flight** under existing P-sections (hub pages, schema, AI answer block, `llms.txt`, mobile sticky bar, AggregateRating). What follows is what's net-new or unresolved after that comparison.

### Pacing guardrails — apply across every item below

Google's risk vector for sites like ours isn't *frequency of changes* — it's *pattern*. The Helpful Content System penalizes mass programmatic content drops, sudden site-wide internal-link explosions, schema spam without matching visible content, and thin doorway pages. Our existing pacing (3 articles/week auto-merge, hub pages manual review) is the opposite of the risk pattern. To stay there:

- **Hub pages:** max 1–2 per week, never batch-merged on the same day.
- **Existing-article retrofits** (e.g. adding price ranges): max 2–3 per week, mixed in with new-content publishing — never a "retrofit week" sweep.
- **Internal-link rebuilds:** stagger across 2–3 PRs over 2 weeks. No single sitewide sweep.
- **Schema changes:** roll out alongside content updates, not as standalone sitewide PRs.
- **Auto-merge cadence stays at Mon/Wed/Fri** for new articles. Don't accelerate.

### SHORT TERM — next 4–6 weeks

#### S-1 ✅ Allow estimated price ranges in cost content — **rule update PR (this is the focused PR after this plan lands)**
Update `.claude/rules/seo-content.md` § "Writing rules" — replace the blanket "No dollar amounts or price ranges" with a carve-out: estimated *ranges* (not flat rates) are allowed in cost-focused articles and on cost hub pages, with a required disclaimer template. Final quote is always provided before repair. This is a small, single-file rule change — its own PR.

- **Acceptance:** rule reads as policy + disclaimer template; `/review` flags any article using a flat rate (e.g. "$280") or omitting the disclaimer when prices are present.

#### S-2 Build the cost cornerstone hub — `pages/appliance-repair-cost-orange-county.html`
Cornerstone for cost-keyword traffic. Hub structure: hero + AI answer block, average cost in OC, cost-by-appliance table, cost-by-symptom table, diagnostic fee explanation, repair-vs-replace guidance, brand/part availability notes, 8+ FAQs, real testimonials, CTA. Required schema set (Service, FAQPage, BreadcrumbList, AggregateRating). Cross-link from homepage and every service hub.

- **Acceptance:** page live; ≥ 1,500 words; in `sitemap.xml` and `llms.txt`; passes `/visual-review` desktop + mobile.
- **Pacing:** ship as one hub PR. Hold per-appliance cost sub-pages (L-1) until this hub has indexed and ranked.

#### S-3 Verify shipped state — single audit subagent pass
Confirm what's actually in production matches the plan's "snapshot" claims:
- AggregateRating renders on homepage and all hub pages (has it slipped on any newer hub?).
- `/llms.txt` returns 200 and is current.
- GA tag is the first child of `<head>` on every page.
- About page has zero stale personas (user already confirmed "Ashley Davis" not present, but worth a sweep).

- **Acceptance:** subagent report saved to `tasks/seo-verification-2026-05-07.md`; any gaps become single-fix follow-up PRs.

#### S-4 Selective price retrofits on top-traffic articles
After S-1 lands, identify the 4–5 highest-traffic cost-relevant existing articles via GSC (currently 33 articles; some already cost-themed by slug — `article-dishwasher-cost-orange-county.html`, `article-dryer-repair-cost-orange-county.html`, `article-freezer-cost-rancho-santa-margarita.html`). Retrofit price ranges + disclaimer into those.

- **Acceptance:** at most 1 retrofit PR per week, mixed in with new-content publishing. No batch-update PR touching ≥ 5 articles at once (Google-flag risk).

#### S-5 Author bios on articles — already P4-2 in v3 plan
Mentioned here so it's not lost. Both audit reports flagged trust signals. Already an open item under P4-2 — start once S-1, S-2, S-3 are done.

### LONG TERM — months 2–12

#### L-1 Per-appliance cost sub-pages
After S-2 indexes (allow ~3 months for measurable GSC data):
- `pages/refrigerator-repair-cost-orange-county.html`
- `pages/washer-repair-cost-orange-county.html`
- `pages/dryer-repair-cost-orange-county.html`
- `pages/dishwasher-repair-cost-orange-county.html`
- `pages/oven-repair-cost-orange-county.html`

Pacing: max 1 per 2–3 weeks. Each is its own hub PR with manual review.

#### L-2 Luxury-brand vertical hubs
Higher-margin work; less competition than the generic city-hub keyword set. Ship one to test demand, then expand if GSC impressions are positive after 60 days:
- `pages/sub-zero-repair-orange-county.html`
- `pages/viking-repair-orange-county.html`
- `pages/thermador-repair-orange-county.html`
- (Wolf, Miele, Dacor as later additions if the first three pull traffic)

Required: don't claim "factory authorized" or "certified" — write "we service" per existing brand rule in `seo-content.md`.

#### L-3 Booking widget integration (Housecall Pro / Calendly) — **needs owner sign-off before website work**
Real conversion lift per audit doc 2. Trade-offs:
- **Housecall Pro:** ties into dispatch + invoicing if the business already uses it; embed is straightforward.
- **Calendly:** simpler embed, no dispatch integration, generic look-and-feel.
- **Custom form (current):** zero third-party dependency; no real-time slot picker.

Decision is operational, not technical. Needs Rufat to confirm which platform (or "stay with current form") before we touch the contact and homepage.

#### L-4 Phase-2 buying guides + cross-link to repair hubs
Doc 1's Phase 2/3 monetization arc. Only after S-2 is producing measurable organic traffic (≥ 3 months of GSC data). Articles like *"Best refrigerator brands for easy repair"*, *"Best washers for families"*. Each guide cross-links back to the relevant repair hub. Affiliate links optional.

- **Pre-condition:** S-2 ranking signals available; minimum 6 months of cost-hub data.

### OUT OF SCOPE for website work — track separately

These came from audit doc 2 and are operational/business decisions that don't belong in this plan but shouldn't be forgotten:
- **Maintenance subscription plan** ("Appliance Health Check" annual fee). Needs a pricing model + ops workflow before any website landing page is justified.
- **SMS-based review acquisition** after every completed job. Tooling decision (Podium / Birdeye / NiceJob / homegrown). Not website work.
- **High-end-brand ad targeting** (Sub-Zero, Viking, Thermador). Paid-marketing work; pairs with L-2 once those hubs exist.
- **Technician at-the-door upsells** (vent cleaning, coil vacuuming). Pure operations / training. Out of scope.

If/when these get green-lit operationally, spin them into their own task files (e.g. `tasks/ops-subscription-plan.md`).

### Sequencing summary

```
S-1 (rule)  →  S-2 (cost hub)  →  S-3 (audit pass)  →  S-4 (selective retrofits, paced)
                                                 │
                                                 └─►  S-5 (author bios — P4-2)
                                                        │
                                              wait ~3 months for GSC data
                                                        │
                                                        ▼
                                                L-1 (appliance cost sub-pages, paced)
                                                L-2 (luxury-brand vertical, paced)
                                                L-3 (booking widget — pending owner)
                                                        │
                                              wait ~6 months for cost-hub data
                                                        │
                                                        ▼
                                                L-4 (buying guides + affiliate)
```

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
- 6 testimonials rendered on homepage (real names + cities + appliance types). **Superseded by testimonials rollout below.**
- `logs/CONTENT_LOG.md` and `logs/AUDIT_LOG.md` created — P0-1 (PR #121, merged 2026-05-06).
- `logo.png` optimized 973 KB → 10.7 KB — P6-1 (PR #110, merged 2026-05-05). Already well under 100 KB.
- `AggregateRating` added to homepage `LocalBusiness` schema (4.9 / 76 reviews from GBP) — P1-1 (PR #124, merged 2026-05-06).
- Page-type schemas added to 4 static pages (`ContactPage`, `AboutPage`+`Organization` w/ founder Gasan Aliyev, `Blog`, `OfferCatalog`); `faq.html` and `testimonials.html` already compliant — P1-2 (PR #125, merged 2026-05-06).
- City-page meta descriptions verified ≤ 160 chars on all 6 pages; no changes needed — P1-3 (verified 2026-05-06).

That's basically all of P0, all of P1, and most of P6 from the previous v2 plan. What's below is what's still open.

### Testimonials rollout — PRs #151–#165, #166, #171–#174, #176–#178 (May 2026) ✅
Canonical 76-review pool (`data/testimonials.json`) wired to all 16 pages that display reviews:
- **Homepage** (PRs #153–#155): 9 canonical reviews in 3×3 grid, AggregateRating updated to 76, initials avatars.
- **8 city hubs** (PRs #156–#165): 6 reviews each, AggregateRating + Review JSON-LD. A11y sweep: contrast #888→#666, aria-labels, avatar Workshop Charcoal #444444. Jeff Lane Songs (non-person) replaced with Arzuman Qarayev on Anaheim hub.
- **5 service hubs** (PRs #166, #171–#174): 6 appliance-matched reviews each, align-items:stretch, aria-hidden avatars, no location suffix.
- **Testimonials page** (PR #176): full rewrite — 73 cards, 7 filter pills, 73 Review JSON-LD entries, `scripts/build-testimonials-html.js` generator added.
- **About page** (PR #177): fabricated Noelle B sentences removed; 3 overused reviews replaced; AggregateRating + Review schema added.
- **Skill + rules** (PRs #151–#152): `rules/testimonial-selection.md` created; `/seo-hub` skill wired to pool; pool fixes (Mark Rivera title-case, Jeff Lane Songs `nameFlag: "non-person"`).
- **≤2-overlap rule** tracked in `tasks/testimonial-usage.md` — all pages compliant.

### Impeccable design remediation — PRs #137–#144 (2026-05-06)
All five impeccable audit PRs merged and `tasks/impeccable-audit-plan.md` retired:
- PR #137 `fix(a11y)`: contrast ratios + responsive grid (`#888` → `#666`, testimonials grid class, sticky-note clip on mobile)
- PR #138 `fix(a11y)`: keyboard navigation, focus-visible, ARIA attributes on nav dropdown + FAQ accordion
- PR #139 `fix(perf)`: shared.css dedup, preconnect hints, hero image preload
- PRs #140–#143 `feat(tokens)`: full CSS custom property system (`:root` tokens, replaced all hardcoded hex in shared.css + index.html)
- PR #141 `fix(design)`: broke identical 6-card feature grid into 2-featured + 4-supporting; removed redundant hero floats
- PR #142 `fix(polish)`: final quality pass — contrast, sticky-note clip, motion, copy
- PR #144 `chore(design)`: added PRODUCT.md, DESIGN.md, and impeccable sidecar script

---

## P2 — Blog discoverability + scale infrastructure

### ~~P2-1~~ ✅ Wire blog filter pills to appliance taxonomy — shipped PR #127 (2026-05-06)
8 appliance-category pills with `data-filter`; all 33 cards have `data-category`; 4 missing article cards added. Refrigerator/Washer/Dryer/Oven pills now point to real category pages (P2-2); Dishwasher/Freezer/Other remain `#` pending their category pages.

### ~~P2-2~~ ✅ Build blog category-page template + ship all 7 category pages — shipped PR #128 + PR #129 (2026-05-06)
- `pages/blog/refrigerator.html` — 6 articles, 800+ word intro
- `pages/blog/washer.html` — 4 articles, 800+ word intro
- `pages/blog/dryer.html` — 4 articles, 800+ word intro
- `pages/blog/oven-stove.html` — 3 articles, 800+ word intro
- `pages/blog/dishwasher.html` — 5 articles, 800+ word intro
- `pages/blog/freezer.html` — 4 articles, 800+ word intro
- `pages/blog/other.html` — 7 articles (microwave, wine cooler, disposal, buying guides), 800+ word intro

All pages: `CollectionPage` + `BreadcrumbList` schema, full OG tags, GA tag, service hub cross-link callout, mobile responsive. All 8 blog filter pills now point to real pages (zero `href="#"` on category pills). Sitemap updated to 58 URLs.

### ~~P2-3~~ ✅ Add client-side article search to `pages/blog.html` — shipped PR #131 (2026-05-06)
Real-time search input above the grid; filters `.blog-card` elements by title + excerpt + category; "No articles match" empty state; hash-sync (`blog.html?q=fridge`); composes with category filter pills. Under 60 lines of JS.

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
- [x] `pages/appliance-repair-fullerton-ca.html` — shipped PR #132 (2026-05-06)
- [x] `pages/appliance-repair-orange-ca.html` — shipped PR #146 (2026-05-06)

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
