# Content Log

Running log of every `/seo-blog` run: articles created, PRs opened, commits, and workflow changes.

---

## Luxury Content Cluster — May 25, 2026 (Piece #8: Miele dishwasher error codes)

**Article created:** `articles/article-miele-dishwasher-error-codes.html`
**Cluster:** Luxury appliance content cluster, piece #8 of 8 (final piece)
**Mode:** Interactive (owner review required before merge)

| Change | Detail |
|---|---|
| Branch | `content/miele-dishwasher-error-codes` |
| PR | [#401](https://github.com/TesterBaku/appliance-repair-website/pull/401) |
| Primary keyword | miele dishwasher error codes |
| Secondary keywords | miele f11 error, miele f14 error, miele f70 error, miele dishwasher fault codes, miele G series error codes |
| Article type | Reference guide / symptom |
| Word count | ~1,700 words |
| Codes covered | F11, F12, F13, F14, F15, F18, F24, F32, F36, F70, F78, F84 (all 12 specified) |
| AI answer block | Present (60-word callout-blue block, structured for snippet pickup) |
| Hero image | `dishwasher-open.jpg/webp` (existing verified image) |
| Internal links OUT | Miele hub (3 links), dishwasher service hub (1 link) |
| Schema | Article, LocalBusiness, FAQPage (5 Q), BreadcrumbList |
| Cost disclaimer | Present verbatim at every cost table/estimate |
| Price ranges | All ranges: diagnostic $95-$150, drain pump $250-$450, inlet valve $200-$400, NTC sensor $150-$300, circulation pump $400-$750, door seal $200-$450, control board $500-$1,100 |
| GA tag | Deferred load pattern (matches Wolf article template exactly) |
| BOM | None (verified via Node.js hex check) |
| Tests | `npm test` EXIT 0 (95 pages, link + html-integrity + content-integrity + css-vars); `npm run screenshot` EXIT 0 |
| Fixes during write | (1) em-dash in JSON-LD replaced with semicolon; (2) meta description shortened from 196 to 153 chars |

**Cluster status after this run:** All 8 pieces written. Pieces #1-#7 previously merged. Piece #8 PR open for owner review.

---

## Statistics Cluster — May 23, 2026 (Slot 3: maintenance-skip cost statistics)

**Article created:** `article-maintenance-skip-cost-statistics.html`
**Plan:** `tasks/statistics-articles-plan.md` Slot 3 (originally scheduled Jun 29; shipped early since Slot 2 was published ahead of schedule and research was ready)
**Mode:** Interactive (owner review required before merge per cluster policy)

| Change | Detail |
|---|---|
| Branch | `feat/statistics-article-maintenance-cost` |
| Primary keyword | appliance maintenance cost vs repair |
| Centerpiece | Preventable-cause breakdown table (5 appliances) — pairs each category with the strongest published preventability evidence |
| Supporting tables | 3-stat headline grid (NFPA 32%, Energy Star 35%, CR 49%); 5-row cost comparison (preventive task vs major repair) |
| Lead reframe | Plan called for "30-50% more life when maintained" lead stat — research found NO primary source for that figure. Lead reframed around 3 verified statistics (NFPA dryer-fire 32% leading factor; Energy Star refrigerator 35% energy increase; Consumer Reports 49% problem rate by year 5). |
| Citations | NFPA Home Dryer Fires 2014-2018; USFA/FEMA confirming; Energy Star (EPA) refrigerator page; Consumer Reports 2026 (n=71,534); Yale Appliance 2026 (n=33,190); HomeAdvisor 2025 cost guides; NAHB 2021 |
| ASHRAE / DOE | Plan called for ASHRAE + DOE citations — research found ASHRAE has no residential appliance maintenance standard (covers commercial HVAC only). DOE has guidance but no quotable maintenance frequency. Both removed from references. |
| Schema | Article, FAQPage (5 Q), BreadcrumbList, LocalBusiness |
| Price disclaimer | Present verbatim under the cost-comparison table per S-4 rule |
| Service-fee compliance | $99 flat fee referenced (our pricing); national $50-$200 diagnostic range cited per HomeAdvisor for comparison |
| Internal links | 9 (Slot 1, Slot 2, fridge-maintenance, dishwasher-maintenance-fullerton, dryer-cost guide, repair-replace, cost-OC hub, sub-zero hub, 4 city hubs) |
| Author E-E-A-T | Byline links to About page (per cluster plan line 151) |
| Blog index | Card added; All Posts pill 40→41; Other pill 9→10; search placeholder 40→41 |
| Blog/other.html subpage | Card added; section label 9→10 Articles |
| Sitemap | Added; lastmod 2026-05-23, priority 0.6 |

**Cluster status after this run:** Slot 1 MERGED (#384, #387). Slot 2 MERGED (#386, #388, #389). Slot 3 PR open for owner review (final piece — closes the cluster).

---

## Statistics Cluster — May 23, 2026 (Slot 2: lifespan data 2026)

**Article created:** `article-appliance-lifespan-data-2026.html`
**Plan:** `tasks/statistics-articles-plan.md` Slot 2
**Mode:** Interactive (owner review required before merge; autonomous merging banned for this cluster)

| Change | Detail |
|---|---|
| Branch | `feat/statistics-article-lifespan-data` |
| Primary keyword | how long do appliances last |
| Centerpiece | Brand-tier lifespan table (rows = appliance, cols = budget / mid / premium) |
| Supporting data | 10-row NAHB vs InterNACHI hero table; 6 per-appliance stat cards |
| Citations | NAHB 2021 lifespan study; InterNACHI Standard Life Expectancy Chart; Consumer Reports reliability surveys 2022/2024; Miele 10,000-hour design spec; Sub-Zero 12-year sealed-system warranty; Yale Appliance 2024; Energy Star |
| Schema | Article, FAQPage (5 Q), BreadcrumbList, LocalBusiness |
| Internal links | 11 (failure-rates Slot 1, repair-replace pillar, sub-zero-repair-vs-replace, fridge-maintenance, dryer-cost guide, 5 luxury brand hubs, cost-OC hub, about) |
| Cluster cross-link | Slot 1 (failure-rates) linked from "How Lifespan Connects to Failure Rates" section |
| Impeccable | PASS — 27/32 heuristics (~84%), 0 FAILs (5 WARNs, all polish-level / shared with sibling) |
| Tests | npm test ✓ (93 pages, link + html-integrity + content-integrity + css-vars all clean); npm run screenshot ✓; npm run test:functional 564 ✓ |
| Blog index | Added card; counter bumped 35 → 36 |
| Sitemap | Added; lastmod 2026-05-23, priority 0.6 |

**Cluster status after this run:** Slot 1 MERGED (#384). Slot 2 PR open for owner review. Slot 3 (maintenance cost) still scheduled per plan.

---

## Legacy Rewrite — May 21, 2026 (Tier A: dryer-repair-cost)

**Article rewritten:** `article-dryer-repair-cost-orange-county.html`
**Plan:** `tasks/legacy-article-rewrite-plan.md` Tier A, W1
**Mode:** Interactive (owner-reviewed during session)

| Change | Detail |
|---|---|
| PR | [#385](https://github.com/TesterBaku/appliance-repair-website/pull/385) — MERGED |
| Lines changed | ~85% of body (392 insertions, 167 deletions) |
| Cost table | 9-row price table, diagnostic $75–$125, through control board $250–$450 |
| New sections | Gas vs electric cost differential; 6-question interactive FAQ accordion |
| Citations | NAHB 2021 lifespan data; Consumer Reports reliability surveys |
| S-4 backlog | Price-disclaimer retrofit closed |
| Impeccable | 4 findings (site-wide baseline; 0 article-specific) |
| Tests | npm test ✓, screenshot ✓, functional 561 ✓ |

**Pre-merge owner action pending:** fill in `tasks/legacy-rewrite-baselines-2026-05.md` GSC/GA4 rows for Day-60 comparison.

---

## Run — May 20, 2026

**Articles created:** 1
**Cost content:** Yes (cost table with ranges)
**Mode:** Autonomous (scheduled W2 Wed per schedule-4-weeks.md)

| Title | Slug | Primary Keyword | Type | PR | Commit |
|---|---|---|---|---|---|
| Wolf Range Igniter Not Working? 4 Causes and How to Fix It | `article-wolf-range-igniter-not-working-orange-county.html` | wolf range igniter not working orange county | Symptom guide | [#354](https://github.com/TesterBaku/appliance-repair-website/pull/354) | `a0f3bd7` |

**Workflow changes:** None. All impeccable fixes pre-applied at creation time. Impeccable result: 3 findings (1 false positive, 2 by-design Inter font warnings).

---

## Run — May 20, 2026 (impeccable audit — May 13 article)

**Articles created:** 0 (post-publish quality pass)
**Mode:** Interactive

| Article | PR | Fixes applied |
|---|---|---|
| `article-sub-zero-repair-cost-orange-county.html` | [#351](https://github.com/TesterBaku/appliance-repair-website/pull/351) | Contrast (footer, CTA gradient, CTA button, breadcrumb); 6-item TOC; related card #3 image; ISO 8601 dates |

**Impeccable result:** 10 findings → 4 (remaining: 2 false positives, 2 by-design Inter font warnings).

---

## Run — May 13, 2026

**Articles created:** 1
**Cost content:** Yes (full cost table by repair type, price pills, repair-vs-replace 50% rule)
**Mode:** Autonomous (scheduled W1 Wed per schedule-4-weeks.md)

| Title | Slug | Primary Keyword | Type | PR | Commit |
|---|---|---|---|---|---|
| Sub-Zero Refrigerator Repair Cost in Orange County (2026 Guide) | `article-sub-zero-repair-cost-orange-county.html` | sub-zero refrigerator repair cost orange county | Cost guide | [#292](https://github.com/TesterBaku/appliance-repair-website/pull/292) | `9ae697a` |

**Workflow changes:** None.

---

## Run — May 18, 2026

**Articles created:** 1
**Cost content:** Yes (cost table with ranges — premium brand tier)
**Mode:** Autonomous (scheduled W2 Mon per schedule-4-weeks.md)

| Title | Slug | Primary Keyword | Type | PR | Commit |
|---|---|---|---|---|---|
| Built-In Refrigerator Repair in Orange County: Sub-Zero, Thermador and Miele | `article-built-in-refrigerator-repair-orange-county.html` | built-in refrigerator repair orange county | Umbrella / pillar | [#346](https://github.com/TesterBaku/appliance-repair-website/pull/346) | `630283b` |

**Workflow changes:** None. Review required two fixes before merge: meta description trimmed from 174 to 154 chars; ISO 8601 timezone suffix added to all four date fields (article:published_time, article:modified_time, datePublished, dateModified).

---

## Run — May 11, 2026

**Articles created:** 1
**Cost content:** Yes
**Mode:** Interactive

| Title | Slug | Primary Keyword | Type | PR | Commit |
|---|---|---|---|---|---|
| Sub-Zero Refrigerator Not Cooling? 5 Causes and What to Do in Orange County | `article-sub-zero-not-cooling-orange-county.html` | sub-zero refrigerator not cooling | Symptom guide | [#278](https://github.com/TesterBaku/appliance-repair-website/pull/278) | `fea047f` |

**Workflow changes:** Cadence slowed from 3 articles/run to 1 article/run per `chore/slow-seo-blog-to-1-per-run` (PR #277, merged same day).

---
