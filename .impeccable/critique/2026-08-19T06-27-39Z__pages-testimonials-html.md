---
target: pages/testimonials.html
total_score: 31
p0_count: 0
p1_count: 1
timestamp: 2026-08-19T06-27-39Z
slug: pages-testimonials-html
---
Method: dual-agent (A: general-purpose sonnet subagent a3d85976d554fc411 · B: general-purpose sonnet subagent a8f5e611fddb2504e), run sequentially (not concurrently) to avoid shared-browser contention, per explicit task instruction.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Filter pills show active state; instant client-side filtering needs no spinner. |
| 2 | Match Between System & Real World | 4 | Plain language throughout ("Call Now", "Book Repair"), no jargon. |
| 3 | User Control and Freedom | 3 | Drawer has visible close and filter reset; no "back to top" after a ~36,000px unpaginated scroll at 320px (pre-existing). |
| 4 | Consistency and Standards | 3 | Sticky bar markup/CSS verified byte-identical to `pages/about.html`. Docked for a redundant inline `style` on `.nav-phone` duplicating the CSS class (pre-existing, site-wide). |
| 5 | Error Prevention | 4 | No destructive actions on this page. |
| 6 | Recognition Rather Than Recall | 4 | Filter pills always visible with counts. |
| 7 | Flexibility and Efficiency | 2 | All 113+ reviews render in the DOM at once (measured 36,204px scrollHeight at 320px), no pagination (pre-existing). |
| 8 | Aesthetic and Minimalist Design | 3 | Clean cards, good whitespace; undercut slightly by the 0px logo/hamburger gap at 320px (pre-existing). |
| 9 | Error Recovery | 3 | n/a, no error states on this static page. |
| 10 | Help and Documentation | 2 | No FAQ/help affordance directly on the page. |
| **Total** | | **31/40** | **Good** |

## Anti-Patterns Verdict

**LLM assessment (Assessment A):** Not AI slop. Real photographed reviews, restrained accent-color use, header/sticky-bar pattern identical across 150+ pages. Reads as a mature, lived-in site.

**Deterministic scan (Assessment B):**
- Static CLI `node .agents/skills/impeccable/scripts/detect.mjs --json pages/testimonials.html` → **exit code 2**, one finding: `em-dash-overuse` (warning), file-level count "7 em-dashes in body text," no line pinpointed. **False positive / non-issue**: this project's em-dash ban explicitly exempts customer review body text (verbatim quotes), which is exactly what this page is (`AGENTS.md`, "Em dashes" section).
- Live browser overlay (via `live-server.mjs` injecting `detect.js` into the already-loaded page) reported **142 findings**: 141× `tiny-text` (11px/11.5px body text, almost certainly the "Google Review · [Month Year]" meta line repeated across ~113-116 review cards) and 1× `overused-font` ("Primary font: inter (97% of text)"). The `overused-font` hit is a **known false positive**: `AGENTS.md` documents that Inter-everywhere is a deliberate, site-wide brand decision and the per-edit hook already suppresses this exact rule for that reason (the live-overlay path just isn't wired to that suppression list). The 141 `tiny-text` hits collapse to one root cause (one repeated CSS class on review-card meta text), not 141 independent problems, and Assessment A did not flag it independently — this is the one place the detector caught something the LLM review missed. Both are **pre-existing**, not introduced by this PR.
- No visible on-page overlay markers rendered in the screenshot; findings were console-only in the observed window.

**Overlap with LLM review:** Both assessments independently measured the same 0px logo/hamburger gap at 320px and confirmed no sticky-bar/footer overlap at 375px (Assessment B measured an 8.11px positive gap between the footer bottom and the sticky bar top), so the two assessments corroborate rather than conflict on the PR-relevant questions.

## Overall Impression

The retrofit is executed cleanly. The single riskiest part of this PR for this page, adding a sticky mobile bar to a page that never had one, was verified correct both visually and by exact pixel measurement (no footer overlap, byte-identical to the established pattern on `about.html`). The one real UI issue at ≤480px (zero-gap logo/hamburger crowding) pre-dates this PR and reproduces on other nav pages; the PR does not introduce it and does not make it worse.

## What's Working

1. **Sticky-bar rollout verified correct.** 56px height, 50/50 button split, correct `tel:`/`contact.html` targets, zero footer overlap at 375px (8.11px clear gap, independently measured).
2. **The 481px reappearance boundary is smooth.** 14px measured clearance between the phone link and hamburger the moment `.nav-phone` reappears; no wrap, no layout shift.
3. **Touch targets exceed minimums.** 48×48px hamburger, 152.5×56px sticky-bar buttons, both above the 44×44px floor this project requires.

## Priority Issues

**[P1] Zero-gap crowding between logo and hamburger at 320px — [pre-existing, NOT caused by this PR]**
- **What**: At 320px, the logo's right edge and the hamburger's left edge sit at the identical x-coordinate (233px), a measured 0px gap, confirmed independently by both assessments.
- **Why it matters**: Reads as a layout accident rather than a deliberate minimal header; for a first-time visitor it's a small polish signal that erodes trust before it erodes function.
- **Causation tested**: Assessment A overrode `.nav-hamburger` back to 44×44px via injected CSS and the gap stayed 0px, reproducing identically on `pages/about.html`. The flex `.logo` box has no `max-width` and simply fills available space up to whatever sits next to it; this PR's 44→48px hamburger change is not the cause.
- **Fix**: Add `max-width` to `.logo` (e.g. `calc(100% - 64px)`) or a minimum `margin-right` between `.logo` and `.nav-hamburger` in `shared.css`.
- **Suggested command**: `/impeccable polish` (site-wide nav fix, out of scope for this PR).
- **File**: `shared.css:36` (`.logo`), `shared.css:193` (`.nav-hamburger`).

**[P2] Header loses the phone number below 480px with no affordance that it moved — [PR-caused, mitigated]**
- **What**: Below 480px `.nav-phone` is `display:none` with nothing (icon or otherwise) marking that calling is still possible.
- **Why it matters**: Functionally covered by the sticky Call Now bar on this page (and on the ~150 other pages that already carry it), so this does not read as broken. It is a latent gap only if a future page ever loses its sticky bar while keeping the hidden header phone.
- **Fix**: No action needed on this page; if useful, consider a minimal phone-icon affordance in the header at ≤480px as future-proofing.
- **Suggested command**: `/impeccable clarify` (optional, low priority).
- **File**: `shared.css:305`.

**[P2] 141 instances of 11-11.5px body text on review-card meta lines — [pre-existing]**
- **What**: The detector's live overlay flagged 141 `tiny-text` hits, one repeated CSS class on the "Google Review · [Month Year]" meta line across ~113-116 review cards.
- **Why it matters**: Below the project's readable-text floor; Assessment A did not surface this independently, so it's the one place the deterministic scan added signal the design review missed.
- **Fix**: Bump the review-card meta text to at least 12-13px.
- **Suggested command**: `/impeccable typeset`.
- **File**: `pages/testimonials.html` review-card meta styling (shared across cards; not this PR's diff).

**[P2] All 113+ reviews render unpaginated (~36,200px scroll at 320px) — [pre-existing]**
- **What**: No pagination or "load more"; full review set renders and filters client-side.
- **Why it matters**: Amplifies scroll fatigue on mobile and raises the stakes on the sticky bar working correctly (which it does).
- **Fix**: Out of scope for this PR.
- **Suggested command**: `/impeccable optimize`.
- **File**: `pages/testimonials.html` review grid.

**[P3] Redundant inline `style` on `.nav-phone` — [pre-existing, site-wide]**
- **What**: The nav partial carries an inline `style="font-size:13px;font-weight:600;color:#111;text-decoration:none;"` duplicating what the `.nav-phone` class (and `shared.css:44`) already declares.
- **Why it matters**: Pure maintainability smell; if `shared.css` changes `.nav-phone` styling later, the inline style silently wins.
- **Fix**: Strip the inline style from the nav partial.
- **Suggested command**: `/impeccable harden`.
- **File**: `partials/nav-main.html` (site-wide via partial injection).

## Persona Red Flags

**Casey (Distracted Mobile User)**: Primary actions sit in the thumb zone at every mobile width tested, matching the brand's "sticky bar is the persistent conversion anchor" principle; state isn't lost on scroll. Red flag: the ~36,000px unpaginated scroll gives her no progress marker if she's interrupted and returns mid-scroll (pre-existing, not this PR).

**Jordan (Confused First-Timer)**: No jargon anywhere; hamburger drawer opens with clearly labeled links, not icon-only. Red flag: the 0px logo/hamburger crowding at 320px (P1) is exactly the kind of small imperfection that can quietly read as "not polished" during a first visit (pre-existing).

**Sam (Accessibility-Dependent User)**: Hamburger carries `aria-label` and `aria-expanded`; sticky-bar links pair an emoji with visible text rather than relying on the icon alone. Not deeply tested (no screen-reader pass, no formal WCAG contrast measurement in this run) — flagged as untested, not claimed passing.

## Minor Observations

- The mobile nav drawer is in-flow, not a true modal overlay; consistent with the site's documented pattern, not a regression.
- The 8-option filter-pill row (All + 7 categories) exceeds the cognitive-load guide's ≤4-per-decision-point recommendation (pre-existing).
- Desktop (1280px) header, hero, and stat row rendered cleanly with no regressions from the hamburger/phone CSS changes.

## Questions to Consider

- If the sticky bar is the mobile conversion anchor per brand principle, does the header need a phone number at all below 768px, or could `.nav-phone` hide for the whole mobile range for a simpler, more consistent header?
- Given ~36,000px of unpaginated content at 320px, would a lightweight "jump to top" affordance meaningfully help Casey re-orient after an interruption?
- Is the 0px logo/hamburger gap worth fixing site-wide now that this page was freshly touched, or does it stay parked as a separate, pre-existing item?
