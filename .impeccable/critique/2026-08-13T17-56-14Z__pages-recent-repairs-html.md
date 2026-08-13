---
target: pages/recent-repairs.html
total_score: 33
p0_count: 0
p1_count: 0
timestamp: 2026-08-13T17-56-14Z
slug: pages-recent-repairs-html
---
Scoped to the diff on branch `content/photos-lg-washer-dispenser-orange` (PR #724): two new `.repair-card` divs for the LG washer dispenser assembly replacement in Orange, CA, taking the grid from 45 to 47 cards, plus two matching `ImageObject` JSON-LD entries.

**Provenance.** Dual-agent run: Assessment A (design review) and Assessment B (detector + browser evidence) ran as two isolated sub-agents that never saw each other's output, per `critique.md` Hard Invariants. **One deviation to declare:** Assessment B returned into the parent synthesis context before Assessment A did, which inverts the ordering `critique.md:10` asks for ("Assessment A must finish before detector findings enter the parent synthesis context"). Sub-agent completion order was not controllable from the parent. Declared rather than hidden.

This snapshot supersedes an earlier one for this page written the same day at 16:39Z, which came from a degraded single-context run and was removed.

## Design Health Score: 33/40 - Good

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Filter grid updates instantly, but there is no "showing N of 47" count when a filter is active, so the user has to count cards. Pre-existing. |
| 2 | Match Between System and Real World | 4 | Captions read like a technician talking, not SEO copy: "the blue residue streaking the drawer front is what pointed at the dispenser in the first place." |
| 3 | User Control and Freedom | 3 | The "All" chip resets cleanly. No back-to-top affordance after scrolling 47 cards. Pre-existing. |
| 4 | Consistency and Standards | 4 | New cards are structurally identical to the existing 45, and the `ImageObject` entries sit at the matching DOM position. |
| 5 | Error Prevention | 3 | No `onerror` fallback for a missing image, but that is page-wide, not diff-specific. Both new images verified loading. |
| 6 | Recognition Rather Than Recall | 4 | Filter labels are plain text, not icon-only. Card pills are always-visible metadata. |
| 7 | Flexibility and Efficiency | 3 | Filter state is not reflected in the URL, so a filtered view cannot be bookmarked or shared. Pre-existing. |
| 8 | Aesthetic and Minimalist Design | 3 | The grid is clean. The filter bar (9 appliance + 13 brand chips = 22 simultaneous options) is a real violation of the "4 or fewer visible options per decision point" guideline, but the diff did not touch it. |
| 9 | Error Recovery | 3 | N/A, no user-input errors possible here. |
| 10 | Help and Documentation | 3 | No contextual help; appropriate for a gallery page with a nav-level FAQ. |
| **Total** | | **33/40** | **Good. The weak areas are pre-existing filter-bar complexity, not this diff.** |

## Anti-Patterns Verdict

**Assessment A (independent judgment):** Not AI slop. Real photography of real repair jobs with specific, sensory captions. No gradient text, no side-stripes, no glassmorphism, no icon+heading+text card monoculture (these are photo-led), no eyebrow-kicker trope. The small uppercase "LG / Washer" pill is functional metadata applied consistently across all 47 cards, not a decorative section kicker. Colours are all DESIGN.md tokens. The two new cards are indistinguishable in craft from the other 45, which is the bar to clear.

**Assessment B (deterministic):** `detect.mjs --json` exit 2, one finding total, and it belongs to the other file in the run, not to this page. Zero findings on `recent-repairs.html`.

**Cognitive load:** two checklist failures, "minimal choices" and "progressive disclosure", both caused by the 22-chip filter wall, both pre-existing and untouched. Everything else passes.

## Priority Issues

No P0 or P1 issues.

**[P3] NEW. The new alt text is the longest on the page.** The two new `alt` attributes run 225 and 246 characters against a page average of 127; the next-longest pre-existing alt is 209. The page already has a verbose-alt house style (10 of 48 exceed 150 chars), so this is a continuation rather than a new pattern, but it is now the outlier even within that style. Left as-is: specificity is the point of these alts, and the project's own standard asks them to name the machine, its state, the part, and the city.

**[P3] PRE-EXISTING. Filter chips are under the 44x44px mobile tap-target minimum.** `.chip { padding: 5px 14px; font-size: 12px; }` computes to roughly 25-27px tall, under the `mobile-design.md` floor. 22 undersized targets is a real thumb-accuracy problem. Out of scope for a content diff; belongs in a separate PR.

**[P3] PRE-EXISTING. No "showing N results" text when a filter narrows the grid.** The grid itself is the feedback, so this does not block understanding, but a one-line count would close heuristic 1.

## Persona Red Flags

**Casey (distracted mobile user):** At 375px the sticky Call/Book bar is present and correctly anchored, cards are single-column, no horizontal scroll, images lazy-load. Her one friction point is pre-existing: she scrolls past two full rows of filter chips (wrapping across roughly 5 lines at 375px) before reaching any photo. The diff did not add or remove a chip.

**Jordan (confused first-timer):** No red flags introduced. Pill, title, and plain-language caption together say exactly what happened without jargon.

**Riley (deliberate stress tester):** Tested the boundary directly. At 47 visible cards (remainder 2) the grid engages `pair-row` and centers the last two. No left-stranded orphan, no overlap, no phantom track. Also checked whether a wide-shot plus close-up pair of the same job reads as padding for count: the same convention already exists on this page (the Viking wine cooler compressor pair, both Costa Mesa), so it is established editorial practice, not a new trick.

## Measurements (Assessment B, evidence not claims)

Server on port 8813, stopped after use.

- 1280x900: `.repair-card` count 47. `scrollWidth 1265 = clientWidth 1265`, no overflow. Grid carries `gallery-grid pair-row`. Trailing row of 2 at left 285.83 and 644.48, width ~334.66 each; right margin computes to 285.85 against a left margin of 285.83, so symmetric within rounding.
- 375x800: 47 cards, `scrollWidth 360 = clientWidth 360`, single column at left 16 / width 328.
- Filter exercised (Washer chip + LG chip): 5 visible, `pair-row` still true, `grid-orphan` count 0 (this page centers via the `pair-row` CSS pattern, not a `grid-orphan` class, so 0 is expected). Row 1 three cards at left 106.5 / 465.16 / 823.83; row 2 two cards at left 285.83 / 644.48, same centered-pair geometry. Resized to 375px with the filter still active: `scrollWidth 360 = clientWidth 360`.
- New images: the live `<picture>` elements report density-corrected intrinsic sizes (375x500 at a 375px viewport, 360x480 at 929px), which is the spec-defined behaviour for `srcset`/`sizes`, not a defect. Isolated `new Image()` fetches of the exact URLs return the true file pixels: 768x1024 for both `.jpg` and `.webp`, 480x640 for both `-480w.webp`.
- `grep -c 'class="repair-card"'` 47 on HEAD, 45 on master. `grep -c '"@type": "ImageObject"'` 47 on HEAD, 45 on master. Counts match on both sides.
- Console errors: 0.
- Em dashes in the diff: 0 hits.

## Post-critique change

Assessment A on the Orange city hub (separate target, same photo) found that the wide shot's centered `object-fit: cover` crop cuts the actual repair evidence out of frame. The same crop maths applies to this page's card (`.card-photo`, `height: 240px`), so `object-position: top` was added to this card's `<img>` after the critique. The detail-shot card is unaffected: its evidence sits mid-frame and crops correctly centered.

## Questions to Consider

- Is there appetite for making the filter state URL-addressable (`?appliance=washer&brand=lg`), so this LG-plus-washer pair could be linked directly from the washer hub instead of duplicating a photo there?
