---
target: pages/testimonials.html
total_score: 31
p0_count: 0
p1_count: 0
timestamp: 2026-08-16T02-42-52Z
slug: pages-testimonials-html
---
Method: dual-agent (A: general-purpose sub-agent · B: general-purpose sub-agent)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Filter active state clear via `aria-pressed`; docked for the 116-vs-112 count mismatch |
| 2 | Match System / Real World | 3 | Natural review language, familiar Google iconography; same count mismatch costs a point |
| 3 | User Control and Freedom | 3 | Filter pills work well; no pagination control over the 112-card list |
| 4 | Consistency and Standards | 4 | New card is a verbatim reuse of `.t-card`, zero markup/style drift |
| 5 | Error Prevention | 3 | Empty-filter-result state handled gracefully |
| 6 | Recognition Rather Than Recall | 4 | Google icon, stars, filter labels all self-explanatory |
| 7 | Flexibility and Efficiency | 2 | No sort, no jump-to-filter, no progressive disclosure of the 112 cards |
| 8 | Aesthetic and Minimalist Design | 3 | Individual card is clean; page-level density works against minimalism in aggregate |
| 9 | Error Recovery | 3 | Only error state (empty filter) is plain and clear |
| 10 | Help and Documentation | 3 | Not applicable at this complexity; no deduction |
| **Total** | | **31/40** | **Good — solid foundation, a few real gaps** |

## Anti-Patterns Verdict

**Start here.** Does this look AI-generated? **No.** The new Kathleen Street card is a verbatim reuse of the existing `.t-card` component: same star markup, same Google source line, same quote/photo/avatar/name/role structure as its 111 neighbors. No new CSS, no gradient text, no side-stripes, no glassmorphism, no icon+heading+text card-grid cliche (card content and photo presence already vary naturally across the grid). It reads as an authentic, unpolished customer quote ("AG fixed my Samsung dryer. Good service!") backed by a real job photo, exactly the texture the rest of the page has.

**Deterministic scan** (`node .agents/skills/impeccable/scripts/detect.mjs --json pages/testimonials.html`, exit code 2): one rule fired, `em-dash-overuse` (7 em dashes in visible body text). Verified by grep: every one of the 12 em-dash occurrences in the file (7 visible + 5 more only in JSON-LD `reviewBody` fields) sits inside verbatim customer review quote text across 6 pre-existing reviews, quoted twice each (once in `.t-quote` markup, once in matching `Review` JSON-LD). This project's em-dash ban explicitly exempts customer review body text as verbatim content (`AGENTS.md`, "Em dashes" section), so this is a confirmed **false positive** relative to project policy, not a defect introduced by this change. No `design-system-color`/`font-size`/`radius`, `overused-font`/`single-font`, or any other rule fired. No browser visualization: no browser automation tool was available in this session (CLI-only run).

**Visual overlays:** not applicable this run (no browser tool available).

## Overall Impression

A clean, low-risk addition: one new review card that perfectly matches an existing, mature component pattern. The gut reaction is "this looks like the same page as yesterday, plus one more real review", which is exactly right for a trust-signal list. The one real, pre-existing (not introduced by this change) issue worth owner attention is that the page states "116 reviews" in three places while its own filter pill and grid only show 112, with no reconciling copy.

## What's Working

1. **Perfect component fidelity** - the new card introduces zero new markup, classes, or styles; full reuse of `.t-card` and existing tokens.
2. **Freshness as a trust signal** - the newest review (dated Aug 2026) sits at the very top of the grid with a real photo of the specific appliance named in the quote, a strong, low-cost credibility device that visibly proves the review pipeline is active.
3. **Honest short-review handling** - the brief "Good service!" quote is backed by a photo rather than padded into artificial length, consistent with the project's own quality-floor policy and avoiding the "suspiciously uniform testimonial" tell.

## Priority Issues

**[P2] Stated review count (116) doesn't reconcile with the visible/countable total (112).**
Why it matters: the `<title>`/meta description, hero copy, and stats bar all say "116 verified 5-star Google reviews," but the filter bar says "All (112)" and the grid renders exactly 112 cards. This page's entire job is building trust through countable proof; a due-diligence-minded visitor (this page's own target user) who filters or scrolls and notices the gap may read it as selective curation, even though the real reason (116 = GBP listing total per `data/testimonials.json`, 112 = the subset that clears the quality floor per `.claude/rules/testimonial-selection.md`) is legitimate and already documented in the rules.
Fix: add a one-line reconciling note near the stat, e.g. "116 five-star reviews on Google, 112 shown below," so the arithmetic is self-explanatory. Copy-only; does not touch the count policy itself.
Suggested command: `$impeccable clarify`
Note: **pre-existing pattern, not introduced by this PR** - the gap already existed at 115-vs-111 before this change and simply carried forward at 116-vs-112. Not a blocker for this review-capture PR; flagged for a future copy-only pass.

**[P2] No pagination or progressive disclosure across 112 unfiltered cards.**
Why it matters: every card renders on load; the only control is the appliance filter. On mobile (this page's primary audience per `PRODUCT.md`), an unfiltered visitor faces one very long column with no checkpoint, working against the site's own "conversion at every scroll" and "mobile-first" principles.
Fix: cap the default view (e.g. 15-24 cards) behind a "Show more reviews" button.
Suggested command: `$impeccable layout`
Note: **pre-existing, page-wide pattern, not introduced by this PR.**

**[P3] Review ordering is never labeled.**
Why it matters: the new card's top position implies newest-first, but nothing states this, so a comparison-minded visitor can't confirm the ordering logic.
Fix: a small "Newest first" label near the filter bar.
Suggested command: `$impeccable clarify`

**[P3] Row 1 word-count variance.**
Row 1 (the new card + its two neighbors) runs roughly 7/7/13 words per quote, the most visually prominent row on the page. This page is explicitly exempted from the hub-page row-balance rule (`testimonial-selection.md`, near-complete curated listing, not a hand-picked hub grid), so this is a low-priority observation, not a rule violation.
Suggested command: none (informational only).

## Persona Red Flags

**Jordan (impatient mobile visitor, wants fast confidence to book):** Filtering to "Dryer" immediately surfaces the new Kathleen Street card confirming recent dryer work, a clean, fast win with zero friction added by this change. Jordan's real risk on this page is unrelated to the new card: the long unfiltered scroll before reaching the filter bar, and no "jump to CTA" once satisfied.

**Riley (research-oriented, cross-checks reviews before deciding):** Reads "116 reviews" as a due-diligence anchor, then notices the filter pill tops out at 112. Riley is the persona most likely to actively count and flag the P2 mismatch above, directly touching the verification behavior Riley is engaged in.

**Casey (skeptical, wants visible proof):** Cross-checks the new card's photo against its quote ("Samsung dryer" + a visible top-load dryer photo); this holds up well and is a genuine trust win for the new card specifically. Casey is also primed to notice the stated-vs-shown number mismatch and misread it as curation.

## Minor Observations

- The new card's schema `reviewBody` ("Ag fix my Samsung dryer.Good service!") differs from the displayed `.t-quote` ("AG fixed my Samsung dryer. Good service!"); this is the project's own permitted light-typo display correction (`bodyHasTypos`), not a defect.
- The new card's photo is 768x338 intrinsic while most other cards in the file use 125x125; display is fixed at 80x80 via `object-fit: cover` either way, so this is invisible to users and matches the current (2026-08+) capture convention, not a regression.
- The 112-cards-not-divisible-by-3 stranded final card in the unfiltered grid is a known, twice-decided (2026-08-11, 2026-08-12), intentionally accepted pattern per `.claude/rules/testimonial-selection.md`, "pages/testimonials.html: add cards in multiples of 3, and accept the orphan when you cannot." Noted for completeness only; not raised as a priority issue, and no flexbox/JS centering fix is recommended, per that rule.

## Questions to Consider

- As the review pool keeps growing past ~120, does a flat, unpaginated, filter-only list still serve the "book within 60 seconds" conversion goal, or does the review wall start competing with the CTA for attention?
- Should the page state explicitly why "116" (GBP listing total) and "112" (quality-floor-passing display count) differ, so the exact due-diligence behavior this page rewards doesn't produce suspicion instead?

## Run Notes

- Target slug: `pages-testimonials-html` (computed via `critique-storage.mjs slug`)
- Ignore list: `.impeccable/critique/ignore.md` not present; no findings suppressed
- Assessment independence: dual-agent, two isolated `general-purpose` sub-agents, no shared context
- CLI detector: ran clean, exit code 2, 1 finding (`em-dash-overuse`, confirmed false positive, verbatim exempt review-quote text)
- Browser visibility / overlay injection: skipped, no browser automation tool available in this session
- Live server cleanup: n/a (none started)
- Temp-file cleanup: pending (this file, deleted after the storage write)
