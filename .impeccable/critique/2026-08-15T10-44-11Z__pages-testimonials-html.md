---
target: pages/testimonials.html
total_score: 30
p0_count: 0
p1_count: 2
timestamp: 2026-08-15T10-44-11Z
slug: pages-testimonials-html
---
Method: dual-agent (A: design review · B: detector + Playwright browser evidence)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Only the `All (111)` pill carries a count; no `aria-live` confirms "showing N reviews" after a filter click |
| 2 | Match System / Real World | 4 | Real names, real dates, real Google branding, plain language |
| 3 | User Control and Freedom | 3 | "All" resets cleanly, but filter state is never in the URL, so refresh and shared links drop back to unfiltered |
| 4 | Consistency and Standards | 3 | `.sticky-mobile-bar` is present on 7 of 8 sibling static pages and missing here |
| 5 | Error Prevention | 4 | Nothing destructive; the filter cannot reach an invalid state |
| 6 | Recognition Rather Than Recall | 3 | 7 of 8 pills carry no size hint, so a visitor clicks blind |
| 7 | Flexibility and Efficiency | 2 | No search, sort, or pagination across 111 cards; appliance is the only filter dimension though brand sits in every `.t-role` |
| 8 | Aesthetic and Minimalist Design | 2 | Row-height whiplash from unsorted quote lengths; 111x duplicated inline Google SVG |
| 9 | Error Recovery | 4 | Plain-language "No reviews match this filter" empty state present |
| 10 | Help and Documentation | 3 | Nothing needed for a page this simple, nothing especially helped |
| **Total** | | **30/40** | **Good — solid foundation, weak areas listed below** |

## Anti-Patterns Verdict

**LLM assessment (A):** partial pass. The card pattern repeated 111 times with zero structural variation is, on shape alone, what a generated page looks like. But the genre comparison is a Yelp/Trustpilot review archive, where repetition is the convention, and the content is unmistakably real: verbatim typos left in, inconsistent punctuation, a 105-word narrative next to two-word reviews, ~15 genuine job photos with specific alt text. Content earns the trust; the container only partly backs it up.

**Deterministic scan (B):** `detect.mjs --json pages/testimonials.html` exited 2 with exactly **1 finding**: `em-dash-overuse` (7 em dashes, severity warning). **False positive.** All 7 were located by grep and every one sits inside customer review text: 6 in JSON-LD `reviewBody` fields, 6 in the mirrored visible `.t-quote` elements. None appear in the page's own headings, intro copy, filter labels, or CTA text. `AGENTS.md` exempts customer review body text verbatim. No `overused-font`, `single-font`, or `design-system-*` findings fired. Zero real detector violations.

**Browser evidence (B):** Playwright against `localhost:8788`. No horizontal overflow at 375px (`scrollWidth` 360 vs `innerWidth` 375). First card is the new Ahmed El Korashy LG washer card; its photo loads (`naturalWidth` 768, `complete: true`). `.t-card` count is 111 and `111 % 3 === 0`, so the trailing row is full. Filter pills work: "Washer" narrows to 20 visible cards, "All" restores 111 with the active class moving correctly. No user-visible overlay was injected; this run used screenshot plus DOM measurement instead.

## Overall Impression

The diff under review is clean: one card added to an established pattern with zero drift, and the count now lands on an exact multiple of 3 so the trailing-row question does not arise. Everything the critique flags is pre-existing page-level debt, and the biggest of it is a conversion hole rather than an aesthetic one — this is the only page in `pages/` with no mobile Call/Book bar, on the exact surface where a homeowner decides to trust the business.

## What's Working

1. **Real photographic proof, well integrated.** ~15 cards carry genuine job photos with specific, brand-correct alt text rather than stock imagery.
2. **The new card matches the established pattern exactly.** Same avatar treatment, same source line, same 768x338 photo sizing, same category taxonomy. No drift from the existing 110.
3. **Content authenticity.** Left-in typos, inconsistent nickname spelling, and un-sanitized punctuation read as genuinely captured Google reviews, which is a real asset against the AI-slop test.

## Priority Issues

All five are pre-existing and none is introduced by this diff.

**[P1] No sticky mobile Call/Book bar.** Verified: `pages/testimonials.html` has 0 occurrences of `class="sticky-mobile-bar"`, while about, contact, faq, services, service-areas, recent-repairs, and blog each have 1. `shared.css` hides `.nav-cta` at <=768px site-wide, so between the hero and the footer CTA a mobile reader has no persistent way to call or book, and `body { padding-bottom: 64px }` leaves a blank strip where the bar should be. Contradicts PRODUCT.md principle 4, "Conversion at every scroll." Fix: add the standard markup matching `about.html`. Suggested command: `/impeccable harden`.

**[P1] Filter pills fail the project's own 44x44px tap-target rule.** Verified at `pages/testimonials.html:756`, `padding: 8px 18px; font-size: 13px` computes to roughly 34px tall, and the <=640px override at line 766 (`padding: 7px 14px; font-size: 12px`) is smaller still. `.claude/rules/mobile-design.md` states 44x44px as a hard requirement. These pills are the page's only interactive control besides nav. Fix: `min-height: 44px` with flex centering at both the base rule and the override. Suggested command: `/impeccable harden`.

**[P2] Row-height whiplash from unsorted quote lengths.** Cards render in raw insertion order. Row 15 puts Wendy Henderson (~34 words), Danette Vanover (~105 words), and Russell Kadota (~20 words) in one row; grid `align-items: stretch` plus `.t-quote { flex: 1 }` stretches the two short cards to match. Distinct from the settled "multiples of 3 / accept the orphan" decision, which governs count, not ordering. Suggested command: `/impeccable layout`.

**[P2] No per-category counts or live status on the filter bar.** Only `All (111)` carries a number; the other 7 pills are bare labels, and no `aria-live` region announces the result count. Suggested command: `/impeccable clarify`.

**[P3] Byte-duplicated inline SVG across all 111 cards.** The Google "G" path data is inlined verbatim in every card, roughly 77 KB of exact-duplicate markup, and any icon change needs 111 identical edits. Fix: one `<symbol>` plus `<use>`. Suggested command: `/impeccable optimize`.

## Persona Red Flags

**Jordan (first-timer):** 7 of 8 pills give no size hint, so which filter is worth clicking is a guess; after clicking there is no text confirmation, only a silent re-render.

**Riley (stress tester):** filter state lives only in JS memory and never in the URL, so refresh or a shared link always resets to All. The row-height defect is exactly the "fine on the happy path, breaks on longer input" class this persona exists to catch.

**Casey (distracted mobile):** all 8 pills sit under the 44px floor at the viewport where she lives one-handed, and with no sticky bar she has no thumb-reachable way to act between the hero and the footer. All 111 cards ship in the DOM regardless of filter (hidden via `display:none`, not lazy-mounted).

**Dana (stressed OC homeowner, project-specific):** she can filter by appliance but not by brand, though brand already appears in every `.t-role` ("LG Washer Repair"). Once convinced, her fastest path to action is scrolling to the bottom CTA or opening the hamburger.

## Minor Observations

- `.filter-pill` uses `color: #555` and `border: 1.5px solid #e2e8f0`, neither in `DESIGN.md`'s neutral set (closest: Dust `#666666`, Linen `#eeeeee`). Contrast passes comfortably; palette-drift nit, pre-existing.
- Assessment A flagged the new card's JSON-LD `reviewBody` as missing spaces after periods while the visible `.t-quote` renders them. **Not a defect and not to be "fixed":** verbatim `reviewBody` with display-only correction is the deliberate convention, set by the `fix(testimonials): verbatim JSON-LD reviewBody` commit in PR #727. The new card follows it exactly.
- Nothing on the page states how reviews are verified. A one-line "pulled directly from our Google Business Profile" note near the stats bar would reinforce a claim the content already earns.

## Questions to Consider

- At 111 cards and growing every few weeks, is a flat unpaginated page still right, or does this need progressive reveal before the DOM triples again?
- Every card already names the brand in `.t-role`. Should brand become a second filter dimension, since a homeowner who knows her Sub-Zero is broken is the more qualified click?
- Would 3-4 featured reviews with more visual weight above the archive change how far down the scroll a visitor reads before deciding?
