# Content Log

Running log of every `/seo-blog` run: articles created, PRs opened, commits, and workflow changes.

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
