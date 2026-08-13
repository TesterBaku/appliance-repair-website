---
target: pages/lg-appliance-repair-orange-county.html
total_score: 36
p0_count: 0
p1_count: 0
timestamp: 2026-08-13T17-56-14Z
slug: pages-lg-appliance-repair-orange-county-html
---
Scoped to the diff on branch `content/photos-lg-washer-dispenser-orange` (PR #724): the "Recent LG Repairs" band was a 4-card flex-wrap row (`max-width:720px`, cards `flex:1 1 300px;max-width:340px`). A fifth card was inserted (LG washer dispenser, Orange CA) and the intro updated from "Four LG appliances" to "Five". The open question was whether a 5th card in a 2-per-row wrap reads as a stranded orphan.

**Provenance.** Dual-agent run: Assessment A (design review) and Assessment B (detector + browser evidence) ran as two isolated sub-agents that never saw each other's output, per `critique.md` Hard Invariants. **One deviation to declare:** Assessment B returned into the parent synthesis context before Assessment A did, inverting the ordering `critique.md:10` asks for. Sub-agent completion order was not controllable from the parent. Declared rather than hidden.

This snapshot supersedes an earlier one for this page written the same day at 16:40Z, which came from a degraded single-context run and was removed.

## Design Health Score: 36/40 - Excellent

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Static content, no async states. |
| 2 | Match Between System and Real World | 4 | "shook hard with a UE code" is genuinely specific (LG's real imbalance code) and reads as technician-authored, not marketing copy. |
| 3 | User Control and Freedom | 3 | No traps; nav and in-copy service links all present. |
| 4 | Consistency and Standards | 4 | The cleanest of the diffs: it reuses the exact flex-row mechanism already governing 4 cards, and the mechanism scales to 5 with zero additional CSS. |
| 5 | Error Prevention | 4 | Links verified functional by navigation. |
| 6 | Recognition Rather Than Recall | 4 | Appliance, brand, city, and fault all on the card face. |
| 7 | Flexibility and Efficiency | 3 | N/A, static content. |
| 8 | Aesthetic and Minimalist Design | 4 | The trailing 5th card is genuinely well-composed, better than expected going in. |
| 9 | Error Recovery | 4 | N/A. |
| 10 | Help and Documentation | 3 | N/A for this component. |
| **Total** | | **36/40** | **Excellent** |

## Anti-Patterns Verdict

**Assessment A (independent judgment):** Passes, and specifically the orphan-card question resolves cleanly in the layout's favour.

The container is `display:flex; flex-wrap:wrap; justify-content:center; max-width:720px`, with cards at `flex:1 1 300px; max-width:340px`. Two 340px cards plus a 20px gap (700px) fit inside 720px, but three (940px minimum) do not, so **this row was already capped at 2-per-row before this diff**: the pre-existing 4-card version rendered 2x2, not a 4-wide row. Adding a 5th therefore produces 2/2/1, and, critically, **flexbox centers each wrapped line independently**, unlike CSS Grid's fixed-track placement. That is precisely why the Grid-based `.testimonials-grid` needs the `:has()` centering workarounds in `.claude/rules/testimonial-selection.md` and this band does not. Structurally different mechanism from every orphan precedent in the backlog, all of which are Grid-based.

**Assessment B (deterministic):** `detect.mjs --json` exit 0, zero findings. Also run against the `master` copy: exit 0, zero findings.

**Backlog cross-check before flagging:** grepped `tasks/backlog.md` and `.claude/rules/testimonial-selection.md`. P6-43 is scoped to `pages/testimonials.html`'s Grid layout (WON'T FIX, owner 2026-08-11 and 2026-08-12) and does not cover this flexbox band. The "prefer counts of 3, 4, or 6 over 5" guidance is likewise scoped to the `.testimonials-grid` review component and does not transfer to a job-photo band with different and more forgiving mechanics. Cited to pre-empt a false positive, not because either rule applies.

## Priority Issues

No P0 or P1 issues, and no orphan defect.

**[P3] The same cross-page image-crop issue as the Orange city hub, shared root cause.** This page reuses the identical wide-shot asset with identical alt text, so the same centered-crop problem applied here. Lower severity than on the Orange hub (where it was P2), because this card sits in a 5-card gallery with attention distributed across many photos rather than head-to-head against one other card. **FIXED before merge** by the same `object-position: top` change applied to the Orange hub.

Assessment A explicitly declined to pad the list beyond this: "there genuinely isn't a 3rd, 4th, 5th distinct issue on this page."

## Persona Red Flags

**Casey (distracted mobile user):** No red flags. At 375px, 5 full-width stacked cards is a longer scroll than the 4-card version, but each card is self-contained, tap targets are adequate, and nothing requires horizontal interaction.

**Jordan (confused first-timer):** None specific to the diff. "Five LG appliances our technician recently serviced" is clear before Jordan reaches the cards.

**Riley (deliberate stress tester):** Tested the uneven-count edge case by direct measurement rather than assumption. See the table below.

## What is working

**The 5th-card insertion is layout-neutral.** No CSS was touched and none needed to be.

**The copy restructuring demotes the new washer into the existing list** rather than bolting on a fourth top-level sentence: "Four" to "Five", "Two front-load washers" to "Three front-load washers", with the Orange job folded into the existing colon-list beside Fountain Valley and Ladera Ranch. That is the right edit, not the lazy one.

**Card ordering is sensible:** the new card slots in third, after the two pre-existing washers and before the refrigerator and dryer, keeping the washers grouped and matching the copy's own grouping.

## Measurements (Assessment B, evidence not claims)

Server on port 8814, stopped after use. Images are `loading="lazy"`, so each was scrolled into view before reading.

**1440x900**, row container x=360, width=720, right=1080:

| card | x | width |
|---|---|---|
| 0 Fountain Valley washer | 370 | 340 |
| 1 Ladera Ranch washer | 730 | 340 |
| 2 Orange dispenser washer (new) | 370 | 340 |
| 3 Orange refrigerator | 730 | 340 |
| 4 Newport Beach dryer (trailing) | 550 | 340 |

Container center = 360 + 720/2 = **720**. Trailing card center = 550 + 340/2 = **720**. Exact match, so centered rather than left-aligned.

**768x1024**, row container x=32, width=704: cards at 34 / 394 / 34 / 394 / 214, all width 340. Container center = 384. Trailing card center = 214 + 170 = **384**. Exact match.

**375x812**: all 5 cards x=32, width=311, one per row. No row exists to strand a card in.

- `scrollWidth` equals `clientWidth` at all three viewports (1440/1440, 768/768, 375/375).
- All 5 images `complete: true`, natural sizes 480x640 or 480x360, matching declared attributes and real file headers.
- Console errors: 0 at all three viewports.
- Em dashes: 0 in the diff, and none anywhere in the full file.

## Caveat worth carrying forward

The graceful behaviour above is an emergent property of the specific numbers (a 720px cap against 340px cards gives exactly 2 per row), not a designed invariant. A 6th card would be 3 clean rows of 2 and still fine, but a future author should re-check the arithmetic rather than assume flexbox always self-centers.

## Questions to Consider

- Worth a one-line comment near the flex container noting that the 720px cap is what fixes this at 2 per row, so the next edit does not have to re-derive it?
