---
target: pages/testimonials.html
total_score: 32
p0_count: 0
p1_count: 1
timestamp: 2026-08-11T21-09-25Z
slug: pages-testimonials-html
---
Method: dual-agent (A: a5da560b6af404766 · B: aeaf8135b187a7f57)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Only the "All" filter pill shows a count (106); the 7 category pills (Washer, Dryer, Refrigerator & Freezer, Dishwasher, Oven & Stove, Wine Cooler, General) show none, and there's no `aria-live` region announcing the result count after filtering. |
| 2 | Match Between System and Real World | 4 | Plain-language labels throughout ("Verified Customer," "Google Review · Aug 2026"); reads like real reviews, not marketing copy. |
| 3 | User Control and Freedom | 3 | Filtering is reversible in one click via "All." No URL/hash state, so a filtered view (e.g. "just dryer reviews") can't be bookmarked or shared. |
| 4 | Consistency and Standards | 3 | Card markup/colors/typography are consistent across all 106 cards including the new one. Docked because the new card silently pushes the grid from an evenly-divisible 105 to a 106-with-remainder-1, producing a desktop orphan (see P1). |
| 5 | Error Prevention | 3 | No destructive actions on this page. The "no results" fallback is currently unreachable dead code (all 7 categories are populated) — untested, not urgent. |
| 6 | Recognition Rather Than Recall | 4 | Google "G" icon, star glyphs, initials-avatar are all instantly recognizable. |
| 7 | Flexibility and Efficiency of Use | 3 | Filter pills serve first-time and returning visitors well. No sort control (Most recent / Highest rated) and no search-within-reviews. |
| 8 | Aesthetic and Minimalist Design | 3 | Clean 3-col grid, generous whitespace. The new single-card orphan row at the bottom of the default view is the one blemish. |
| 9 | Error Recovery | 4 | "No reviews match this filter" fallback exists and is styled appropriately, even though currently unreachable. |
| 10 | Help and Documentation | 3 | Self-explanatory page; no on-page hint of what the "General" category means for a first-time visitor. |
| **Total** | | **32/40** | **Good — solid foundation, one real regression from this PR's diff (grid orphan), rest is pre-existing polish debt.** |

## Anti-Patterns Verdict

**Start here.** Does this look AI-generated? No — this page passes the brand slop test. No gradient text, no side-stripe decoration, no glassmorphism, no identical icon+heading+text card grid, no off-palette accent colors on any new element. Star color, avatar fill, quote text, name/role text all map exactly to DESIGN.md tokens (Star Gold `#f59e0b`, Workshop Charcoal `#444444`, Dust `#666666`, Pressed Steel `#111111`). Filter-pill active/hover states correctly use Ember Deeper `#aa3210` / Ember Deep `#cc3d12` rather than raw Ember `#e84c1e` for text-bearing states, respecting the "orange never as small text" rule.

**LLM assessment (Assessment A):** Clean on every hard ban. The em dashes that appear in body copy are exclusively inside verbatim customer review text (6 reviews, 7 dash characters), correctly exempt per this repo's rule — none appear in site-authored headings, CTAs, or meta copy. One pre-existing (not-this-PR) design-system drift: `.filter-pill` uses `border: #e2e8f0` and `color: #555`, neither of which is a documented DESIGN.md token (closest matches would be Linen `#eeeeee` / Dust `#666666`).

**Deterministic scan (Assessment B):** `node .agents/skills/impeccable/scripts/detect.mjs --json pages/testimonials.html` → exit code 2, one finding:
```json
{
  "antipattern": "em-dash-overuse",
  "severity": "warning",
  "file": "pages/testimonials.html",
  "line": 0,
  "snippet": "7 em-dashes in body text"
}
```
No other rule fired (no side-stripe, gradient-text, glassmorphism, identical-card-grid, off-palette-color, dim-text, or wrong-CTA-destination findings).

**Classification of the em-dash finding — false positive, confirmed by manual grep.** `grep -n '—' pages/testimonials.html` returned 12 matching lines (6 underlying customer reviews, each appearing twice: once in the JSON-LD `reviewBody` field, once in the rendered `<p class="t-quote">` markup — same content, two representations). Every single match sits inside a customer review quotation (`"reviewBody": "..."` or `<p class="t-quote">&ldquo;...&rdquo;</p>`); none are in site-authored copy. This repo's em-dash ban (AGENTS.md, `.claude/rules/seo-content.md`, `.claude/rules/git-workflow.md`) explicitly exempts verbatim customer review body text, and all 12 matched instances predate this PR (none belong to the new James Wehrman card, which contains no em dash). The detector has no such exemption logic and can't distinguish quoted review text from authored copy — this is a known, documented gap (AGENTS.md: "It does NOT enforce this project's em-dash ban... its rule fires only at 5+ occurrences... so 1-4 pass clean while violating the rule" — here the situation is the inverse but the same root cause: the detector has zero domain awareness of the quote-exemption). **Verdict: WARNING, waived — not a blocker.**

**Visual overlays:** Not attempted. No browser automation tool was exposed to either sub-agent in this session; both worked from static source review only. This is a real limitation of this run, not a silent skip — flagged explicitly in Run Notes below.

## Overall Impression

This is a mature, previously-audited page (106 hand-authored review cards holding a consistent DOM shape is a genuinely hard thing to maintain, and it held). The PR itself is clean: the new James Wehrman card matches every structural and stylistic convention already established, the "Verified Customer" role-label issue flagged in an earlier round is confirmed fixed, and all six on-page occurrences of the public review count (109) were bumped together with zero stale numbers left behind anywhere in the file. The one real defect this PR introduces is arithmetic, not craft: 105 cards divided evenly into a 3-column grid; 106 does not, and nothing on the page centers a trailing orphan. That defect sits at the worst possible spot: the last thing rendered before the page's closing CTA, on the exact desktop viewport where the 3-column grid is active — invisible at 768px/375px mobile checks, which is likely why it slipped through.

## What's Working

1. **Structural discipline at scale.** All 106 cards — photo and no-photo, one-line and multi-paragraph — share the exact same DOM shape (`t-stars` → `t-source` → optional `t-review-photo` → `t-quote` → `t-footer`/`t-avatar`/`t-name`/`t-role`). The new card follows this exactly.
2. **Count parity held across every surface.** Meta description, OG description, Twitter description, `aggregateRating.reviewCount`, hero paragraph, and the "Verified Google Reviews" stat all read 109, consistently. This is the kind of drift that's easy to lose across five separate surfaces and it didn't happen here.
3. **Accessibility care beyond the minimum.** A code comment explains why `aria-pressed="false"` is explicitly set rather than omitted; a `t-photo-credit` label exists specifically so sighted users get the same "this is our photo, not the reviewer's" distinction that alt text alone would hide from screen-reader users.

## Priority Issues

**[P1] New grid orphan on the default ("All") desktop view, directly caused by this PR's card count**
- **Why it matters:** `.testimonials-grid` (line 709) is `grid-template-columns: repeat(3, 1fr)` with zero `:nth-child`/`:has()` centering logic anywhere in the file (verified independently — no matches for either selector in the whole page). 105 cards divided evenly by 3; 106 does not (106 mod 3 = 1), so the 36th and final row now renders one card alone, left-aligned, with two empty grid tracks beside it. This is the default landing state nearly every visitor sees, positioned directly above the closing CTA — the exact peak-end moment of the page — and it's desktop-only (>1024px, where 3 columns is active; at ≤1024px 106 is evenly divisible by 2, no orphan; at ≤735px it's 1-col), so a 768px/375px mobile check alone will not catch it.
- **Fix:** Don't hand-code for "106" specifically; it breaks again at 107, 109, 112. A generalizable rule that centers any trailing single orphan: `.testimonials-grid > .t-card:last-child:nth-child(3n+1) { grid-column: 2; }`, with the matching mobile-reset trap from `.claude/rules/testimonial-selection.md` avoided (re-declare the same `:nth-child` selector inside each breakpoint's media query rather than a bare `.t-card { grid-column: auto }`, which loses on specificity and leaves the desktop placement active on phones).
- **Suggested command:** `$impeccable layout` (targeted grid-centering fix), verified afterward with `$impeccable audit` or a real ≥1024px desktop viewport check — this specific defect requires an actual rendered viewport, not source reading, which is exactly how it shipped unnoticed.

**[P2] Category filter pills carry no count — filtering is a leap of faith**
- **Why it matters:** Only "All" shows `(106)`; the 7 category pills (Washer, Dryer, Refrigerator & Freezer, Dishwasher, Oven & Stove, Wine Cooler, General) show nothing. A homeowner worried specifically about their washer can't gauge "is this worth clicking" before clicking — a direct hit on heuristic #1 (visibility of system status), landing at exactly the moment a stressed visitor is trying to self-select relevant proof.
- **Fix:** Compute and inject a per-category count the same way "All (106)" is computed, e.g. `Washer (18)`.
- **Suggested command:** `$impeccable clarify` (labeling/IA gap on existing markup) or `$impeccable critique` if bundled with other filter-UX work.

**[P3] No mobile sticky Call/Book bar on the site's single heaviest-scroll page**
- **Why it matters:** Confirmed via full-file grep: zero occurrences of `.sticky-mobile-bar`/`.sticky-call`/`.sticky-book`. `.nav-cta` (header "Book a Repair") is hidden at ≤768px sitewide per the mobile-design rule, and nothing replaces it here. `.claude/rules/mobile-design.md` requires the sticky bar on "homepage, hub pages, AND articles"; `testimonials.html` is a static page and sits outside the letter of that rule, but it's exactly the page where losing the primary mobile CTA for the longest stretch of scroll on the site (106 cards) hurts most. Pre-existing, not introduced by this PR.
- **Fix:** Add the standard sticky-bar markup/CSS matching the article pattern (`padding-bottom: 64px` on body, `display:flex` at ≤768px).
- **Suggested command:** `$impeccable layout` or `$impeccable adapt` (mobile-specific chrome gap).

**[P3] Filter pills use off-palette colors (pre-existing, not part of this PR's diff)**
- **Why it matters:** `.filter-pill` border `#e2e8f0`, inactive text `#555` (line 726) — neither is a documented DESIGN.md token. Both happen to pass contrast (`#555` on white ≈ 5.9:1) so this is design-system drift, not an accessibility bug. `detect.mjs`'s `design-system-color` rule would likely flag this, but it's currently suppressed in `.impeccable/config.json` as a stale-sidecar rule per AGENTS.md, so only this human critique pass surfaces it.
- **Fix:** Swap to Linen `#eeeeee` (border) / Dust `#666666` (text).
- **Suggested command:** `$impeccable polish`.

## Persona Red Flags

**Jordan (first-timer, unfamiliar with the business):** Lands on "All," sees 106 cards with no way to gauge relevance to their own appliance without scrolling or guessing from unlabeled category pills (P2). On a laptop ≥1024px, the very last thing rendered before the CTA is a visually orphaned single card (P1) — a small "did something break?" moment at exactly the point they're being asked to trust this company with a home repair.

**Riley (stress-tester, appliance broken today):** Wants to jump straight to "did they fix a fridge like mine." The filter pills help, but zero counts (P2) mean Riley can't tell whether "Wine Cooler" yields 2 reviews or 20 before clicking. Nothing at the filter/scan level distinguishes a review with a real job photo from a text-only one — that distinction only appears via the `t-photo-credit` label once a card is already open in view, not while skimming.

**Casey (mobile, one-thumb, in a hurry):** Loses the header "Book a Repair" button per sitewide mobile rules with no sticky replacement on this specific page (P3), across the single longest-scroll page on the site. Casey scrolls past all 106 cards (or hunts for the filter) to reach the only mobile CTA, at the very bottom.

## Minor Observations

- "General" filter category (used by the James Wehrman card and ~30 others) has no on-page explanation of what it means to a first-time visitor; low-urgency IA note.
- The `noResults` fallback element is currently dead code — untested by construction, since all 7 categories are populated. Not urgent, just note it's unverified.
- The em-dash detector finding (see Anti-Patterns Verdict) is a false positive for this file and should not block merge; it is entirely inside quoted, pre-existing customer review text.

## Verification checks specific to this PR (requested)

- **"Verified Customer" role-label fix:** CONFIRMED FIXED. The James Wehrman card's role label reads `Verified Customer`, matching every other no-photo review card on the page (spot-checked against ~25 other instances). The earlier "Appliance Repair" label does not appear anywhere in the current file.
- **Count consistency (105→106, 108→109):** CONFIRMED CONSISTENT, no stale numbers found. All six on-page occurrences of the public review total read "109" (meta description, OG description, Twitter description, `AggregateRating.reviewCount`, hero paragraph, "Verified Google Reviews" stat). The visible filter count "All (106)" matches the actual DOM card count (106, confirmed by count). The 3-review gap between the public total (109) and the rendered card count (106) is a pre-existing, by-design gap (photo-only/no-body reviews aren't rendered as cards) and was already present at the same delta before this PR (108 vs. 105) — not a new inconsistency.
- **Em-dash ban:** The detector's `em-dash-overuse` warning is a false positive for this repo/page — all 7 counted dashes sit inside verbatim customer review body text, which this repo's em-dash ban explicitly exempts, and all are pre-existing on master (none belong to the new card). Waived.

## Questions to Consider

- Is the grid-orphan defect (P1) worth fixing in this same PR, given it's a direct, mechanical consequence of this diff (105→106 cards), or should it ship as a fast-follow since the page still functions correctly, just with one misaligned card?
- Should per-category counts (P2) become a standing convention any time this page's filter UI is touched, given how directly it affects a stressed visitor's ability to self-select relevant proof?
- Is `testimonials.html` an intentional exception to the sitewide sticky-mobile-bar rule (P3), or was it simply missed when the rule was written, given it's now the single heaviest-scroll page on the site?

## Run Notes

- Target slug: `pages-testimonials-html` (computed via `critique-storage.mjs slug`).
- Ignore list: `.impeccable/critique/ignore.md` does not exist — no findings suppressed.
- Assessment independence: Assessment A and B ran as two isolated parallel sub-agents (dual-agent path; no degradation banner needed). Confirmed neither saw the other's output.
- CLI detector: ran successfully, exit 2, one finding (em-dash-overuse, classified false positive/waived above).
- Manual em-dash grep: ran successfully per this repo's project rule (detector's em-dash rule doesn't enforce this repo's stricter, quote-exempted ban); 12 raw matches, all inside customer review text, all pre-existing.
- Browser visibility / overlay injection: SKIPPED — no browser automation tool was exposed in either sub-agent's session. This is a real limitation of this critique run (both assessments worked from static source review only), not a silent omission.
- Live server: not started (no browser step attempted).
- Temp-file cleanup: pending (this file itself is deleted after the storage write completes).
- Grid-orphan finding (P1): independently re-verified by the parent context outside both sub-agents (`grep -c 'class="t-card' pages/testimonials.html` = 106; `106 % 3 = 1`; `106 % 2 = 0`; confirmed zero `:nth-child`/`:has()` rules exist anywhere in the file) before inclusion in this synthesis.
