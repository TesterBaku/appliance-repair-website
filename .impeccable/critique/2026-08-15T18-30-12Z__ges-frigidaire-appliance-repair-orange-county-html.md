---
target: pages/frigidaire-appliance-repair-orange-county.html
total_score: 35
p0_count: 0
p1_count: 1
timestamp: 2026-08-15T18-30-12Z
slug: ges-frigidaire-appliance-repair-orange-county-html
---
Method: dual-agent (A: design review · B: detector + Playwright browser evidence)

Targets: `pages/oven-repair-cost-orange-county.html`, `pages/dishwasher-repair-cost-orange-county.html`, `pages/frigidaire-appliance-repair-orange-county.html`. Each gained a 3-card testimonials section, an `AggregateRating` node and three `Review` nodes; Frigidaire also gained a new testimonial CSS block.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 4 | Count copy and `AggregateRating.reviewCount` both read 115, matching the listing total |
| 2 | Match System / Real World | 3 | Two of the three oven quotes describe installations on a repair-cost page |
| 3 | User Control and Freedom | 4 | "Read all 115 reviews" gives an exit to the full pool |
| 4 | Consistency and Standards | 3 | Frigidaire imported the cost-hub badge ramp and a lighter heading than its own page uses; both fixed post-critique |
| 5 | Error Prevention | 4 | Schema and markup well-formed on all three pages |
| 6 | Recognition Rather Than Recall | 4 | Section sits where testimonials always sit, directly above the CTA |
| 7 | Flexibility and Efficiency | 3 | Grid degrades 3 to 2 to 1 correctly; the 2-column state occupies only the narrow 769-900px band |
| 8 | Aesthetic and Minimalist Design | 3 | Oven's row spans 11/5/6 words, a 2.2x spread against the 1.5x guideline |
| 9 | Error Recovery | 4 | No error states in this component |
| 10 | Help and Documentation | 4 | Not applicable; no negative signal |
| **Total** | | **35/40** | **Good, shipped with the two consistency fixes applied** |

## Anti-Patterns Verdict

**LLM assessment (A):** PASS. Not an AI-slop grid. The cards carry real, name-verified Google reviews spot-checked against `data/testimonials.json`, the component is an established shipped pattern rather than a fresh invention, and the two appliance-match compromises are disclosed in HTML comments with their reasoning rather than silently faked.

**Deterministic scan (B):** `detect.mjs --json` across all three files returned `[]`, **exit 0**. Zero findings, all rules, all severities. Nothing to classify as real or false-positive.

**Em dashes, checked independently** (the detector only fires at 5+, below this project's outright ban): `grep -n '—'` returns zero matches in all three files, and `git diff master | grep '^+' | grep '—'` returns zero. None introduced, none present.

**Browser evidence (B):** Playwright against `localhost:8788`, all three pages. No horizontal overflow at 375px (`scrollWidth` 360 vs `innerWidth` 375 on each). Exactly 3 `.testimonial-card` per page, all quotes non-empty. At 1280px the grid computes to three equal 287px columns and all three cards render identical width and height on every page (0% height variance). Responsive collapse verified 3-col at 1280 to 2-col at 900 to 1-col at 375. On Frigidaire specifically, the newly added CSS resolves correctly: card background `rgb(255,255,255)`, stars `rgb(245,158,11)`, quote `rgb(68,68,68)`, so the `var()` tokens are defined on that page.

**Schema (B):** all three pages parse clean, 7 JSON-LD blocks each, exactly one `LocalBusiness` carrying `@id: .../#business`, `aggregateRating.reviewCount` `"115"`, and exactly 3 `Review` nodes each with `itemReviewed.@id` pointing at `#business`.

## Overall Impression

Three pages that carried an empty scaffold now carry real proof, placed where the page was already built to put it. The work that mattered was not the markup, which is a solved pattern here, but deciding which reviews may honestly appear on which page. Two of the three pages ship with a documented appliance-match compromise, and one page was deliberately left out of the batch entirely.

## What's Working

1. **Section-colour rhythm is correct on all three pages.** Every `section-white` / `section-gray` boundary was checked; testimonials land white to gray to white in each case with no adjacent same-colour sections.
2. **The two documented compromises are the right calls.** Showing a quote reading "washing machine" on a dishwasher page, or a competitor-brand quote on a Frigidaire page, would both have been worse than the neutral fallback actually shipped, and each comment cites the specific rule it applies.
3. **The Frigidaire CSS addition is sound.** The `.hub-page`-scoped selectors out-specify the base rules in `shared.css` without `!important`, and the three breakpoints resolve to the right column count at every width.

## Priority Issues

**[P1, FIXED] Frigidaire imported the cost-hub badge ramp onto a brand hub.** Assessment A claimed every badge site-wide uses `#444444` and that all three pages deviated. **Verified, and that claim is half wrong**: a site-wide grep returns 182 `#444444` alongside 7 `#1a0a02`, 7 `#3d1a08` and 3 `#90500c`, and the varied ramp is the established **cost-hub** convention, already shipped on refrigerator-cost, washer-cost, dryer-cost and appliance-repair-cost. So the two cost hubs were correct as written. Frigidaire was not: all seven brand-hub siblings (Maytag, Samsung, KitchenAid, Whirlpool, LG, GE, Bosch) use flat `#444444`, matching `DESIGN.md:205`. Fixed on Frigidaire only. The two cost hubs were additionally aligned from `#444444` to `#90500c` on the third card, matching 3 of the 4 existing cost hubs rather than dryer-cost's minority variant. All four badge colours were then contrast-checked by hand, since `npm test`'s WCAG pass explicitly excludes inline styles: 19.30:1, 15.56:1, 6.29:1 and 9.74:1 against white, all clearing AA for normal text.

**[P2, FIXED] Frigidaire's testimonials heading was lighter than every other heading on that page.** `<h2 class="h2-standard">` resolves to weight 700 with no tracking, while the other 8 headings on that page are inline-styled at weight 800 with `-0.5px`. Confirmed by counting `<h2>` variants: the new one was the only `h2-standard` on the page. Replaced with the page's own inline pattern. Note this is Frigidaire-specific: on both cost hubs `h2-standard` **is** the page convention, so no change was made there.

**[P2, ACCEPTED AND DISCLOSED] Oven's row spans 11/5/6 words, a 2.2x spread against the 1.5x guideline.** Real, and not fixable from the current pool. The free oven/range candidates are Frank Rokhideh (11w), Alexander Battaglia (5w), Muhammed Nusratli (6w) and Rachel Padilla (2w); every trio drawn from those four either breaks the ratio or is worse, and dropping Frank loses the only genuine repair quote among them. `testimonial-selection.md` provides for exactly this case: use what the pool supplies and call out the shortfall. Disclosed in the PR body rather than shipped silently.

**[P3, NOTED] Two of three oven quotes describe installations, not repairs.** Topical drift on a repair-cost page. Not wrong, since the services overlap and the cards are labelled "Oven Installation" honestly, but a repair-specific quote would reinforce the page's promise more directly. Prefer one at the next testimonial refresh.

**[P3, OUT OF SCOPE] The cost-hub scaffold CSS hardcodes hex where Frigidaire's new CSS uses tokens.** `#fff` / `#f59e0b` / `#444` / `#666` versus `var(--surface)` / `var(--amber)` / `var(--text-dim)` / `var(--text-sub)`. No rendered difference today; the values are byte-identical to what the tokens resolve to. The scaffold predates this diff, so it belongs in a token-migration pass across the cost-hub family, not here.

## Persona Red Flags

**Jordan (first-timer):** none. Stars, quote, name and job type are legible without prior site context.

**Casey (distracted mobile):** none. Clean single column at 375-480px, no truncation, no overflow, and the narrow 769-900px two-column band sits outside phone widths entirely.

**Stressed OC homeowner (project-specific):** the section does its job, sitting as proof directly before the ask. The oven row's imbalance means a fast skim lands on the long quote first and may read the other two as thin, slightly under-delivering the instant-confidence goal `PRODUCT.md` names for this visitor.

## Minor Observations

- `.testimonial-card` uses a 14px radius and a 1px/10px shadow, while `DESIGN.md` §5 documents 16px and a 24px shadow for the homepage variant. This is a pre-existing site-wide bifurcation already shipped identically on the Maytag, Samsung, KitchenAid and dryer hubs, so matching the siblings was right. It is a `DESIGN.md` documentation gap, not a defect in this diff.
- Two testimonial-grid breakpoint patterns coexist site-wide (900/480 versus the canonical 768/480 in `mobile-design.md`). Worth standardising in a future pass.
- Assessment A asked whether the 2-hub cap was checked. It was, after the fact and from live HTML: `audit-testimonial-hub-usage-2026-06-10.py --emit-tracker` reports no new over-cap reviews, still exactly the 4 grandfathered exceptions.

## Questions to Consider

- Is there a near-term plan to capture a genuine dishwasher review, so the dishwasher page's documented workaround stays provisional rather than becoming permanent by default?
- Should the two testimonial-grid breakpoint patterns be unified across the cost-hub and brand-hub templates?
- The five LA luxury hubs stay empty pending premium-brand reviews. Is anything actively driving those to be collected, or is that hub group waiting on chance?
