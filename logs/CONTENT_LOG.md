# Content Log

Running log of every `/seo-blog` run: articles created, PRs opened, commits, and workflow changes.

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
