---
target: articles/article-dryer-repair-cost-orange-county.html
total_score: 37
p0_count: 0
p1_count: 0
timestamp: 2026-09-03T19-35-05Z
slug: icles-article-dryer-repair-cost-orange-county-html
---
Method: dual-agent (A: general-purpose/sonnet · B: general-purpose/sonnet)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Numbered cards (1-6), breadcrumbs, TOC orient the reader on a static article |
| 2 | Match System / Real World | 4 | Technician-accurate terms (door switch, thermal fuse, control board) framed for a homeowner |
| 3 | User Control and Freedom | 3 | Breadcrumbs and related-guide links let the reader exit; nothing traps |
| 4 | Consistency and Standards | 4 | New badge reuses the exact existing `.tip-badge`/`.tip-cost` pattern used by all 6 cards, no new markup |
| 5 | Error Prevention | 4 | The $99 diagnostic-fee policy plus the new "by cause" qualifier both work against bill-shock |
| 6 | Recognition Rather Than Recall | 4 | Badge lets a skimmer get the range without reading the paragraph — the badge's explicit job, done well |
| 7 | Flexibility and Efficiency | 4 | Skimmers get badges, detail-seekers get the paragraph and full cost table further up |
| 8 | Aesthetic and Minimalist Design | 4 | Clean two-pill badge row, consistent brand/cost coloring, no clutter |
| 9 | Error Recovery | 3 | N/A strictly (no forms), page's CTA + diagnostic-fee framing softens worst-case framing |
| 10 | Help and Documentation | 4 | Cross-links to dedicated "dryer not heating" / "takes too long to dry" deep-dives, FAQ below |
| **Total** | | **37/40** | **Excellent — precise, surgical correction; the one real gap is that the badge's ceiling number can read as typical rather than the rare/expensive branch** |

## Anti-Patterns Verdict

**LLM assessment (Assessment A):** Clean. The new badge value ($120–$450) is the union of two numbers that already exist elsewhere on the page (intro, cost table row for "Control board replacement," FAQ) — not invented, not padded, no em dashes, no hedge language. If anything the copy ("by cause") is under-explained rather than over-explained, the opposite of the typical AI-slop failure mode.

**Deterministic scan:** `node .agents/skills/impeccable/scripts/detect.mjs --json articles/article-dryer-repair-cost-orange-county.html` → exit 2. The only finding is the pre-existing `numbered-section-markers` advisory ("Sequence: 10, 11, 12"), confirmed present on master before this edit and unrelated to the "$120–$450 by cause" badge change. No other findings — nothing related to the badge, prose, or layout.

**Browser evidence:** 1440px — tip card 2's badge span measured `scrollWidth`/`clientWidth` 122/122 (no overflow), renders on one line, pixel-consistent with sibling cards' badges. 375px — same measurement, 122/122, no overflow/clipping; the badge sits on its own row beneath the "VERY COMMON" pill (the container wraps to two rows because it holds two pills, an existing pattern identical on every other tip card at mobile width, not new to this edit). **Confirmed: the "$120–$450 by cause" badge renders on one line at 375px** — verified both by DOM measurement and screenshot.

## Overall Impression

The single highest-scoring page of the four. This is a surgical, internally-consistent correction: the badge now accurately represents a card whose prose spans a $15 door-switch fix up to a $250–$450 control-board replacement (the page's sanctioned exception), and the number is cross-checked against the cost table and FAQ, all agreeing. The one real UX risk is that a reader who lands on this card cold (deep link, search snippet) sees the badge's ceiling number ($450) before the reassuring context that the cheap fix is the common case.

## What's Working
- Badge-to-prose honesty: before this edit, no single narrow badge could represent the card's real cost range without misleading in one direction; the umbrella figure is accurate.
- Internal number consistency across three other surfaces on the page (intro, cost table row, FAQ) — all agree exactly, nothing rounded or drifted.
- Zero markup risk: pure text-content change inside an existing `.tip-cost` span, no new elements, no CSS touched.

## Priority Issues

- **[P2] Badge doesn't signal that $450 is the outlier, not the median.** Why it matters: a reader who lands on this card directly (bypassing the article intro's "one exception above that range" framing) and reads only the badge — the explicit design intent of a badge, per Recognition Rather Than Recall — can conclude a "won't start" dryer typically costs up to $450, when the paragraph directly above says the common case is a cheap door-switch fix. Fix: reframe to anchor on the common case, e.g. "$120–$180 typical, up to $450 for control board" (mirrors card 1's "typical" convention), or shorten to "$120+ by cause." Suggested command: /impeccable clarify.
- **[P3] Terminology drift vs. card 5, which expresses the identical "wide range, cause-dependent" concept as "depending on cause"** while this card now says "by cause" — two near-synonyms for the same rhetorical pattern on one page. Fix: standardize on one phrase. Suggested command: /impeccable clarify.
- **[P3] At 375px card 2's two badges wrap to a second line while card 1's shorter badges stay inline**, making card 2 visibly taller than its neighbor — purely cosmetic, no overflow/truncation, and the same wrapping pattern already exists (and is tolerated) on card 5. No fix required.

## Persona Red Flags

**Riley (stress tester, dryer broken now, anxious about cost):** The paragraph correctly leads with the cheap, likely fix before mentioning the control board, but the badge read in isolation surfaces the ceiling number with no "usually much less" signal — ties to P2.

**Jordan (first-timer, may deep-link via search):** Same underlying issue — may never see the article's opening "one exception" framing if arriving via an internal anchor or search snippet keyed to "dryer won't start cost."

**Casey (mobile):** No red flag. Screenshot-confirmed at 375px: badge wraps cleanly to its own line, full text visible, no truncation, no horizontal scroll, no overlap with the card's numbered icon.

## Minor Observations
- The pre-existing `numbered-section-markers` detector finding is unrelated to this edit and out of scope (confirmed by Assessment B as the sole finding, present on master).
- Badge order (frequency tag first, cost second) is preserved and matches all 5 sibling cards.
- En dash usage is correct and compliant with the site's em-dash ban.

## Questions to Consider
- Is "$120–$450 by cause" legible enough on its own that a reader understands $450 is the rare, expensive branch rather than the typical outcome, for someone who lands on this specific card via a direct link?
- Should this badge adopt card 5's exact "depending on cause" phrasing so both badges expressing the same wide-range-by-cause concept read as one consistent pattern?
