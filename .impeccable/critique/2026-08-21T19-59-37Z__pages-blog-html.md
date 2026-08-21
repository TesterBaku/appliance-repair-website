---
timestamp: 2026-08-21T19-59-37Z
slug: pages-blog-html
---
Method: dual-agent (A: design review, isolated sub-agent · B: detector + browser evidence, isolated sub-agent). Not degraded.

Target: `pages/blog.html` @ http://localhost:8788/pages/blog.html
Context: round 4 of the `/impeccable critique` gate on PR #766 (P6-62 tap targets), run after the final `aria-label` fix on the featured card.

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Active category pill has no `aria-current` / `aria-pressed` (pre-existing) |
| 2 | Match System / Real World | 3 | n/a - copy is plain and local |
| 3 | User Control and Freedom | 2 | No clear-filter affordance; search has no clear button (pre-existing) |
| 4 | Consistency and Standards | 2 | "Read Article" vs "Read more" copy split, 44/31 cards (pre-existing) |
| 5 | Error Prevention | 3 | n/a - nothing destructive on the page |
| 6 | Recognition Rather Than Recall | 2 | Search box and category pills are two filter UIs in disconnected page zones (pre-existing) |
| 7 | Flexibility and Efficiency | 2 | No shortcut to search; pills are real `<a href>` and degrade to static category pages without JS (a good, easy-to-miss choice) |
| 8 | Aesthetic and Minimalist Design | 3 | One Ember Rule respected - only the active pill and CTAs carry it |
| 9 | Error Recovery | 2 | `#search-empty` exists but was not exercised this run |
| 10 | Help and Documentation | 2 | No search hints, no clear-filter affordance |
| **Total** | | **24/40** | **Acceptable** |

**AI-slop verdict: no.** Palette, weight-driven hierarchy and copy voice match the committed `DESIGN.md` system; no gradient text, no glassmorphism, no icon-heading-text card wall; the thumbnails are real job photos.

## FAILs attributable to this PR: none

Every priority issue Assessment A raised is pre-existing and untouched by the diff, and each was labelled as such by the assessment itself. Assessment B's deterministic scan returned exactly one finding.

**Detector:** `detect.mjs --json pages/blog.html` exit 2, 1 advisory: `numbered-section-markers`, snippet `"Sequence: 10, 11, 12"`. **False positive, traced to the rule source.** `detect-text.mjs:285` fires on 3+ sequential numbers in the 01-12 range; the matched text is the category-pill article counts (`Dishwasher (10)`, `Oven (12)`, `Washer (12)`) and a publish date, not `01/02/03` section labels. There is no numbered-marker scaffold anywhere on the page.

## What the PR's own changes measure at, in a browser

All measured after `document.fonts.ready`, at 375x812 and 1440x900.

- **Focus rings:** tabbing `.featured .read-more` and `.blog-card .blog-link` - the link's own `outline-style` computes `none`, the ancestor card's computes `2px solid rgb(232,76,30)` at 4px offset. Exactly one ring, on the card, in both patterns and at both widths.
- **Hit areas:** 76 card anchors. Own boxes are 15-35px, as the stretched-link pattern intends; the positioned ancestor is the real target. **0/76 failures, 0 missing ancestors.** Smallest ancestor 312x454 (mobile), 335x443 (desktop).
- **Accessible names:** 76/76 anchors carry an `aria-label`; **0/76 WCAG 2.5.3 Label in Name violations.** Two templates, each matching its own anchor's visible text: `"Read Article: <title>"` and `"Read more: <title>"`.
- **Tap targets:** `.cat-pill` and `.cta-text-link` both measure exactly 44px, via `min-height` + `inline-flex` + `align-items: center` rather than raw padding, and the pills did not visually inflate.
- **Overflow:** none. `scrollWidth == clientWidth` at both widths (360/360, 1425/1425).
- **Contrast:** every text pair resolvable to solid colors is >= 4.95:1.

## One Assessment A finding rejected, with the evidence

Assessment A raised a P3: `.cta-text-link`'s new 44px box is invisible to a **sighted mouse user**, who gets no hover cue that the hit area extends past the text.

**The premise does not hold.** That rule lives inside `@media (max-width: 768px)` (`pages/blog.html:134-136`), so the enlarged box exists only at touch widths, where there is no hover pointer to cue. At the desktop widths where a mouse is used, the rule does not apply and the link is unchanged. No action taken.

## Pre-existing, confirmed still present, out of this PR's scope

- **Mobile pagination is broken:** all 75 cards render on first load. `render()`/`applyFilter()` is only reachable from an input event, a pill click, load-more, or a `?q=` param (`pages/blog.html:1838-1867`), so the `showing = isMobile() ? BATCH : cards.length` cap never reaches the DOM. Reproduced on `c52c6a2`, the commit before this branch. Biggest single cognitive-load contributor on the page.
- `#blog-search::placeholder { color: #bbb }` - 1.92:1 (`pages/blog.html:122`).
- No `<h2>`/`<h3>` anywhere; the `<h1>` is the only heading, so the 75-card list is not navigable by heading.
- `.cat-pill.active` is a CSS class only - no `aria-current`, so a screen-reader user hears seven identical link announcements with no active-filter signal. One line, adjacent to code this PR touches; deliberately deferred to keep the diff narrow.
- "Read Article" (44) vs "Read more" (31) for the identical action.

## Sam, Casey, Jordan

- **Sam (assistive tech):** direct win. One unambiguous ring per card, a distinct accessible name per card, 44px on the two short controls. Remaining, not from this PR: no `aria-current` on pills, no skip link.
- **Casey (distracted, one-handed, mobile):** the two controls Casey would have mis-tapped now measure 44px live at 375px. Still hit by the pagination bug, which this PR neither caused nor worsened.
- **Jordan (first-timer):** no new red flags from this diff.
