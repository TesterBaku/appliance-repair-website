---
target: articles/article-sub-zero-not-cooling-orange-county.html
total_score: 33
p0_count: 0
p1_count: 1
timestamp: 2026-09-03T19-34-33Z
slug: es-article-sub-zero-not-cooling-orange-county-html
---
Method: dual-agent (A: general-purpose/sonnet · B: general-purpose/sonnet)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 4 | Static content, renders cleanly |
| 2 | Match System / Real World | 3 | Explains a real pricing nuance in plain language, but see recall issue below |
| 3 | User Control and Freedom | 4 | No interactivity added, no regression |
| 4 | Consistency and Standards | 3 | New disclaimer is a bare `<p><strong>` while the page's similar "Note on parts" caveat 4 rows later gets the boxed `.callout` treatment — two comparable caveats, two visual weights |
| 5 | Error Prevention | 3 | Preemptively answers the row-1 confusion, undercut by low visual salience |
| 6 | Recognition Rather Than Recall | 2 | No marker on row 1 itself (asterisk, footnote) ties the caveat to the number once the reader's eye is inside the table |
| 7 | Flexibility and Efficiency | 4 | No regression |
| 8 | Aesthetic and Minimalist Design | 3 | Fits the page's prose rhythm; "About the first row:" is a mildly clinical/meta lead-in |
| 9 | Error Recovery | 4 | N/A — no error states touched |
| 10 | Help and Documentation | 3 | Functions as just-in-time help but is a one-shot explanation with no durable anchor to the row |
| **Total** | | **33/40** | **Good — accurate, correctly scoped, non-destructive; the main gap is recall/visibility of the caveat once the reader is scanning the table** |

## Anti-Patterns Verdict

**LLM assessment (Assessment A):** Mild, not severe. "About the first row:" is meta-referential (describes table structure rather than answering the reader's actual question) and the $99-applies-toward-repair fact is stated in near-duplicate phrasing versus the existing FAQ answer elsewhere on the page — a mild "explain the same fact slightly differently each time" pattern, not a blocker.

**Deterministic scan:** `node .agents/skills/impeccable/scripts/detect.mjs --json articles/article-sub-zero-not-cooling-orange-county.html` → exit 0, `[]`. Clean, no findings.

**Browser evidence:** 1440px — verified via DOM measurement: new paragraph 712/712 (no overflow), row-1 label cell 512/512, price pill "$95–$150" 78/78 — all clean. 375px — re-verified on a dedicated tab with URL guarding: page-level `scrollWidth` 360 < `innerWidth` 375, paragraph 328/328 (wraps to multiple lines as expected, no truncation), row-1 label 221/221, price pill 78/78 (identical to desktop, no truncation). No overflow, clipping, or awkward wrapping at either width.

## Overall Impression

Same pattern as the sister sub-zero cost article, applied cleanly and correctly here too: solves a real, previously-unaddressed confusion (row 1's $95–$150 vs. the site's flat $99 fee) with accurate, non-destructive prose. The single real design gap is that the disclaimer's visual weight doesn't match its importance — it's plain body text protecting against a misread of the very next thing on the page (a scannable price table), while the page's other caveat of comparable stakes gets a boxed treatment.

## What's Working
- Solves a real, previously-unaddressed trust gap between the table's market figure and the site's actual $99 fee.
- Placement is directionally correct: immediately above the table it clarifies, not buried in a footer.
- Zero markup/layout risk: pure additive prose, doesn't touch the table's data-bearing cells, confirmed no overflow at 1440px or 375px.

## Priority Issues

- **[P1] Disclaimer has no visual weight relative to what it's protecting against.** Why it matters: the sentence exists to prevent a reader from concluding the site is inconsistent about its own price; if skipped (likely, since it's plain prose above a table designed for scanning), the confusion it's meant to prevent still happens. This is the same table-scanning risk observed in the sister cost article. Fix: give it the same `.callout` treatment as the page's "Note on parts" caveat, or attach a lightweight marker directly to row 1 (a footnote glyph resolving under the table). Suggested command: /impeccable layout.
- **[P2] Copy leads with document structure ("About the first row:") instead of the reader's actual question ("why is this price different").** Fix: reword to lead with the answer, e.g. "Why the first price differs from our diagnostic fee: ...". Suggested command: /impeccable clarify.
- **[P3] Redundant near-duplicate phrasing of the same $99-applies-toward-repair fact vs. the FAQ answer already on the page**, ~50 lines apart in slightly different wording. Low priority; not worth a dedicated pass. Suggested command: bundle with next content touch.
- **[P3] Row 1's label is the longest in the table (7 words + parenthetical) and wraps on mobile**, unlike every other 1–4-word label. Fix: shorten to "Service call / diagnostic," move the OC qualifier into the intro sentence above. Suggested command: /impeccable clarify.

## Persona Red Flags

**Jordan (first-timer, price-anxious, scanning quickly):** Highest relevance — the exact reader this paragraph exists to protect, and the reader least likely to read intro prose before jumping to the price table. If Jordan sees "$95–$150" in row 1 without the paragraph and separately encounters "$99 flat" elsewhere, the site can read as cagey about price rather than transparent.

**Casey (mobile):** Secondary — table renders cleanly and pills wrap gracefully; the row-1-label-wrapping issue (P3) is a real but minor friction point, no hard mobile bug found.

## Minor Observations
- En dash usage in the price pill is correctly encoded and compliant with the site's em-dash ban.
- The table itself is unchanged by this edit; contrast on `.price-pill` and `.callout` was not independently re-verified since neither was touched.

## Questions to Consider
- Is this "About the first row" pattern being rolled out to every article/hub with a similar cost table — if so, should its visual treatment (plain paragraph vs. callout box) be standardized in one pass rather than landing with per-page variation?
- Would a footnote marker directly on the row-1 price pill be a cheaper, more robust fix than relying on intro-paragraph placement, given cost tables are specifically designed to be scanned independently of surrounding prose?
