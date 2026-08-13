---
target: pages/appliance-repair-orange-ca.html
total_score: 34
p0_count: 0
p1_count: 0
timestamp: 2026-08-13T17-56-14Z
slug: pages-appliance-repair-orange-ca-html
---
Scoped to the diff on branch `content/photos-lg-washer-dispenser-orange` (PR #724): the "Recent Orange Service Call" band was a single centered card in a `max-width:340px` wrapper and is now a two-card `display:flex;flex-wrap:wrap;justify-content:center;max-width:720px` row. A new LG washer dispenser card joins the existing LG refrigerator compressor card, the h2 was pluralized, and the intro paragraph rewritten. A real layout change, not a copy edit.

**Provenance.** Dual-agent run: Assessment A (design review) and Assessment B (detector + browser evidence) ran as two isolated sub-agents that never saw each other's output, per `critique.md` Hard Invariants. **One deviation to declare:** Assessment B returned into the parent synthesis context before Assessment A did, inverting the ordering `critique.md:10` asks for. Sub-agent completion order was not controllable from the parent. Declared rather than hidden.

This snapshot supersedes an earlier one for this page written the same day at 16:40Z, which came from a degraded single-context run and was removed. **The degraded run scored this page 32/40 and found only a copy nit. This properly-isolated run found a P2 the degraded run missed entirely.** That difference is the argument for the invariant.

## Design Health Score: 34/40 - Good

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Static content page. Hover and focus states present and consistent (`:focus-visible` at `shared.css:31`). No async operations to signal. |
| 2 | Match Between System and Real World | 4 | Copy reads like a technician talking: "brazed in a new one", "clogged with hardened build-up". Matches the homeowner's mental model of a repair story. |
| 3 | User Control and Freedom | 3 | Clear escape hatches (nav, gallery link, service links). Nothing modal or trapping. |
| 4 | Consistency and Standards | 3 | The card component is identical to the pre-existing LG hub pattern, which is good reuse. Docked one point for the image-crop inconsistency between the two cards, below. |
| 5 | Error Prevention | 4 | No forms in this section; links resolve to real service pages, verified by navigation. |
| 6 | Recognition Rather Than Recall | 4 | Appliance, brand, city, and job type all visible on the card face. No memory burden. |
| 7 | Flexibility and Efficiency | 3 | Mostly N/A; a straightforward content band with no shortcuts needed. |
| 8 | Aesthetic and Minimalist Design | 3 | Clean, but the two cards read at different zoom levels, which slightly undercuts an otherwise tidy composition. |
| 9 | Error Recovery | 4 | N/A, no error states in this component. |
| 10 | Help and Documentation | 3 | N/A for this component; the site has FAQ and nav elsewhere. |
| **Total** | | **34/40** | **Good.** Several heuristics score high only because this is a static proof-band with no error or async surface to fail on. The real signal is 4 and 8. |

## Anti-Patterns Verdict

**Assessment A (independent judgment):** Passes, and is close to the opposite of AI slop. Real photos of real disassembled hardware, with specific checkable technical detail in the copy (brazing, R134a, part-level description). No gradient text, no glassmorphism, no icon grid, no fake stats, no eyebrow labels. The card component itself is a template, but it is the site's own documented template (DESIGN.md, Service Cards), so reuse here is consistency rather than slop.

**Assessment B (deterministic):** `detect.mjs --json` exit 0, zero findings. Also run against the `master` copy: exit 0, zero findings. Both sides clean.

## Priority Issues

No P0 or P1 issues.

**[P2] NEW. Mismatched photo zoom levels between the two cards.** The refrigerator card's source is 480x360 (landscape, AR 1.33); the washer card's is 480x640 (portrait, AR 0.75). Both render through `object-fit: cover` into an identical 340x260 box (AR 1.31). Because the box AR is close to the landscape source, that photo crops minimally and stays a wide contextual shot. Because the box AR is far from the portrait source, the browser scales it to a computed height of roughly 453px against a 260px box, cropping about 57% of the frame, centered.

Assessment A opened the full source image and confirmed the actual repair evidence (open top panel, disconnected wiring, the housing tilted out) sits in the **top third** of the frame, while the centered crop instead shows mostly the washer's front door and control panel, which is generic and does not visually support the card's own title, "Dispenser Assembly Replacement". Compare the compressor card, where the crop *is* the evidence.

**Why it matters:** this directly undercuts the section's stated purpose. A homeowner scanning two thumbnails sees one card that visibly proves its claim and one that could be a stock photo of any washer. It is a trust-signal asymmetry introduced by this specific diff, since the section previously held only the compressor card.

**FIXED before merge** with `object-position: top` on this card's `<img>`, which shifts the crop window from roughly 21-79% of the frame height to 0-57%, putting the water box, the opened top, the lifted housing, and the white replacement assembly inside the frame. The alternative considered and not taken was swapping the `src` to the `-detail` variant; `object-position` was preferred because it keeps the wide establishing shot doing the job it was chosen for while still showing the evidence.

**[P3] Sentence-fragment cadence in the intro paragraph.** "An LG refrigerator whose linear compressor failed, so we brazed in a new one..." and "And an LG front-load washer whose detergent dispenser had clogged..." are both fronted-noun-phrase constructions. Readable and consistent with the site's deliberate conversational register, but two in a row built the same way starts to read as a tic. No documented rule is violated (the em-dash ban and the keyword-first-sentence ban are both satisfied). Left as-is; noted for a future copy pass.

## Persona Red Flags

**Casey (distracted mobile user):** No red flags. At 375px the two cards stack cleanly, full-width, no overflow, and each card's link sits inside generous padding. No horizontal scrolling or pinch-zoom required.

**Jordan (confused first-timer):** Mild friction, and it is the P2 above. Seeing a torn-apart appliance next to a normal-looking washer front, Jordan may not connect the second photo to "dispenser replacement" the way the first obviously reads as "compressor replacement". This is the kind of thing a first-timer notices without being able to articulate it: one of these looks like less work was shown. Addressed by the `object-position` fix.

**Riley (deliberate stress tester):** Checked the edge case of two very different native aspect ratios sharing one `object-fit: cover` box, and confirmed a real measurable crop disparity (about 57% vertical crop on the portrait source against minimal crop on the landscape source), not a hypothetical.

## Measurements (Assessment B, evidence not claims)

Server on port 8814, stopped after use. Images are `loading="lazy"`, so each was scrolled into view before reading.

- 1440x900: row container x=360, width=720, right=1080. Card 0 (refrigerator) x=370 width=340; card 1 (washer) x=730 width=340. Equal width, and the row sits centered with equal 360px margins. Both images render 340x260.
- 768x1024: row x=32, width=704. Card 0 x=34, card 1 x=394, both width 340. Equal and centered.
- 375x812: row x=32, width=311. Both cards x=32, width=311, stacked one per row.
- `scrollWidth` equals `clientWidth` at all three viewports (1440/1440, 768/768, 375/375). No horizontal overflow.
- Image natural sizes: 480x360 (refrigerator) and 480x640 (washer), both `complete: true`, both matching their declared `width`/`height` attributes and the real file headers.
- Console errors: 0 at all three viewports.
- Em dashes: 0 in the diff. One in the full file at line 285, inside a JSON-LD `Review.reviewBody`, which is verbatim customer review text and exempt.

## Minor Observations

- The pill label colour (`var(--brand-text)`, 6.62:1 contrast) and the location metadata (`#666`, at the DESIGN.md floor) are both correct per the design system. No contrast issue introduced.
- Assessment A initially flagged a possible missing focus outline, then retracted it as a false alarm from its own method: Chrome's `:focus-visible` heuristic does not fire on scripted `.focus()`. The sitewide rule is real and applies under actual keyboard navigation.

## Questions to Consider

- Is there a house convention for which crop orientation is preferred for these proof-photo cards? If landscape-sourced photos consistently crop better into this box, should the job-photo capture habit default to landscape framing, rather than correcting crops after the fact each time?
