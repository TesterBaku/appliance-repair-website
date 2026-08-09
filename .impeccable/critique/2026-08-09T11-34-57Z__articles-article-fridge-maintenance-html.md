---
target: P6-37 part 2 false-2021 sweep (4 pages)
total_score: 25
p0_count: 1
p1_count: 1
timestamp: 2026-08-09T11-34-57Z
slug: articles-article-fridge-maintenance-html
---
Method: dual-agent (A: design review, isolated · B: detector + browser, isolated)

Scope: the four pages changed by the P6-37 part 2 "false 2021 edition" sweep —
`articles/article-fridge-maintenance.html` (primary), `articles/article-dryer-repair-cost-orange-county.html`,
`articles/article-maintenance-skip-cost-statistics.html`, `pages/blog.html`.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Fridge article's visible byline read "Updated May 2026" while its metadata and blog card said August |
| 2 | Match System / Real World | 3 | Plain neighbour-voiced language; one sentence broke into research-methodology register |
| 3 | User Control and Freedom | 3 | Standard nav/FAQ affordances, unchanged |
| 4 | Consistency and Standards | 1 | Page cites DOE 14.3 years, then links straight to a page still citing "13 years (NAHB)" |
| 5 | Error Prevention | 3 | No form surface changed |
| 6 | Recognition Rather Than Recall | 3 | TOC anchors, FAQ accordion, references list intact |
| 7 | Flexibility and Efficiency | 2 | Unchanged by this diff |
| 8 | Aesthetic and Minimalist Design | 2 | `.data-callout` / `.callout-blue` colours are off the DESIGN.md palette (pre-existing drift) |
| 9 | Error Recovery | 3 | No error states touched |
| 10 | Help and Documentation | 3 | References list is dated, linked and specific about what each source supports |
| **Total** | | **25/40** | **Acceptable — sound factual-integrity fix, undercut by an adjacent contradiction and a stale timestamp** |

Heuristics 1 and 4 are dragged down by things a reader hits by following this page's own byline and its own internal link, which is what heuristic scoring is meant to catch.

## Anti-Patterns Verdict

**LLM assessment:** not AI slop. No gradient text, no icon-card grid, no template scaffolding. The one tell runs the other way: a sentence that read like a compliance process rather than a person.

**Deterministic scan:** 1 finding total across the four pages (`numbered-section-markers`, `pages/blog.html`). Assessment B extracted master's copies of all four files to a temp dir outside the repo and re-ran the detector: **identical output, so zero findings are new in this PR.** B also refused to inherit the earlier "false positive" verdict and re-derived it: the rule scans all visible text for standalone 01-12 tokens, and the captured set here is `{10, 11, 12}` coming from category pills (`Dishwasher (10)`, `Other (11)`, `Washer (12)`), calendar dates (`July 10, 2026`) and `$10,000` — no `0X` values matched at all, so no section-marker scaffold exists. Confirmed false positive.

**Browser overlay:** injection preflight succeeded, so the full overlay flow ran on all four pages (not skipped). Console findings: `low-contrast`, `overused-font`, `cramped-padding`, `tight-leading`, `hero-eyebrow-chip`, `single-font` — all on CSS this PR never touches (the diff contains no `<style>` block or structural change). The `low-contrast` hits are a detector limitation: `.article-hero` and `.inline-cta` paint via `background-image` gradients, so a `backgroundColor` ancestor walk falls through to `<body>` `#f7fafc` and scores white text at 1.0:1 against a background that is actually a dark photo overlay.

## What's Working

1. The DOE citations are well built: Federal Register direct-final-rule citations with page numbers and dates, each matched precisely to the figure it supports, plus a PNNL Building America source for the coil-cleaning claim. A skeptical reader can click through and check any single number.
2. Declining to replace a fabricated "maintenance adds 3 to 5 years" with an equally invented DOE-flavoured number is the right instinct.
3. Swapping "NAHB / industry data" for "No published source found" in the range/oven row is the honest move where no evidence exists, and it renders without layout strain.

## Priority Issues

**[P0] The sweep stops one click short of where the reader goes.** `article-fridge-maintenance.html:610` links to `article-repair-replace.html`, which still says "Average lifespan: 13 years (NAHB)" and credits the fabricated study as its primary source; `article-dishwasher-cost-orange-county.html` is the same. A reader following the fix's own link lands back on the false citation. **Status: known and deliberate — these two files are PR C of the agreed three-PR split.** Recorded here because the reader-journey cost of the split is real and should be visible, not because it was overlooked.

**[P1] The candour sentence ended on the writer's process, not the reader's answer.** "We have not found a published figure ... so we are not going to invent one" landed in the first data callout, where the page most needs to establish trust, and a literal reader could take it as "we don't know if maintenance helps." **FIXED** — now ends on the payoff: "...and we won't guess at one. What we can tell you is that those three failures are avoidable, and avoiding them takes a few minutes twice a year."

**[P2] Stale visible byline.** The PR bumped `dateModified` and the blog card to August 2026 but left the on-page byline at "Updated May 2026", contradicting the card a reader saw seconds earlier. **FIXED.**

**[P3] An over-attributed Consumer Reports claim sat one paragraph below the tightened data.** The copy asserted CR data shows compressor failures are "disproportionately concentrated" in units with uncleaned coils, and that a $5 brush "can prevent that repair entirely". CR publishes the mechanism, not that statistic, and the absolute is unsupportable. **FIXED** — restated to CR's actual mechanism claim, and CR added to the references list, which previously cited it in the body but not in the sources.

**[P2] `.data-callout` / `.callout-blue` colours are off-palette.** `#f0f4ff` / `#bfcfff` / `#1e3a8a` appear nowhere in DESIGN.md's 16 colours, and this is the component holding the corrected data. Pre-existing and used systematically across several articles, so it is design-system drift rather than a slip. Contrast is fine (9.42:1). **NOT fixed here** — belongs in an `impeccable document` pass that reconciles the sidecar with DESIGN.md.

## Persona Red Flags

**Riley (stress tester):** clicks the repair-vs-replace link, lands on "13 years (NAHB)" moments after reading "14.3 years, per DOE". Inconsistent claims between two pages of the same site — the P0 above, and exactly Riley's failure mode. Resolved only when PR C lands.

**Jordan (first-timer):** took the original candour sentence literally as "so they don't know if this helps". Addressed by the P1 rewrite.

**Casey (mobile):** no red flags. Verified at 375x812: no horizontal overflow on any of the four pages (scrollWidth 360 = clientWidth 360), text wraps cleanly, the callout does not crowd the in-guide nav, sticky Call/Book bar intact.

## Measurements

- Horizontal scroll at 375px: none on any of the four pages.
- Body-text contrast on every changed block: 5.74:1 to 9.74:1, all above the 4.5:1 floor. The new reference items measure 7.11:1, identical to their siblings.
- New reference `<li>` vs siblings: identical computed left offset (59px), width (260px), margin, font-size, colour and line-height. No visual inconsistency from the added markup.
- Tap targets: the two new citation links are inline text links at 187x16 and 86x16, undersized but pixel-identical to every pre-existing sibling citation link; no CSS changed, so no regression is structurally possible.

## Minor Observations

- `pages/blog.html`'s dryer card title does not match that article's actual `<title>` (the card omits that it is the cost guide). Pre-existing, unrelated to this diff.
- Nav carries 8 top-level items, at the edge of the working-memory threshold. Pre-existing, already a documented tradeoff.
- Zero em dashes in all four files.

## Questions to Consider

- Should "no published figure exists for years-added-by-maintenance" become one stated policy line reused across the whole lifespan cluster, instead of being re-litigated per article in different words?
- Given `article-repair-replace.html` is the natural next click from several appliance articles, should the sweep have started there rather than ending at the leaf articles?
- Should the visible "Updated [Month Year]" byline be derived from `dateModified` at build time, the way blog counts and partials already are, so this staleness cannot recur?
