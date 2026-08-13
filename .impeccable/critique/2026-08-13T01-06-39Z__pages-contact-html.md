---
target: pages/contact.html
total_score: 29
p0_count: 0
p1_count: 1
timestamp: 2026-08-13T01-06-39Z
slug: pages-contact-html
---
Method: dual-agent (A: ac5ed88cbcedbe32f · B: abe08b3de532e712f)

Target: `pages/contact.html`. Diff under review: the `#city` select expanded from 13 flat Orange County options to 3 `<optgroup>`s (OC 29 cities, LA 11, Riverside & nearby 5, each with an "Other (County)" entry) plus a trailing ungrouped "Other / not listed". 50 options total.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | `#form-success` / `#form-error` are styled and written but nothing wires them up; the form is a bare POST to Formspree with no `_next`, so the user is navigated off-domain. Dead code. Pre-existing. |
| 2 | Match System / Real World | 4 | n/a. Plain-English county labels, familiar placeholders. |
| 3 | User Control and Freedom | 3 | No required/optional cue before the user hits a field. Native select is trivially correctable. |
| 4 | Consistency and Standards | 3 | Optgroup + alphabetical is the standard state/country-picker convention and is applied identically across all three groups. Docked for the "Call Us Now" gradient drifting from DESIGN.md's documented dark-CTA recipe. |
| 5 | Error Prevention | 3 | `required` present; City/Appliance are selects not free text per mobile-design.md. No phone-format validation. |
| 6 | Recognition Rather Than Recall | 4 | n/a. Grouped, labelled, alphabetised. |
| 7 | Flexibility and Efficiency | 2 | No typeahead on a 50-option control. Native single-letter jump is the only accelerator and most users do not know it exists. |
| 8 | Aesthetic and Minimalist Design | 3 | The card's inline `padding:36px 40px` has no mobile override, so `#city` renders 236px wide at 375px. Pre-existing, but it compounds the larger list on the device class this diff most needs to serve. |
| 9 | Error Recovery | 2 | The `#form-error` copy is good and can never display (see #1). A Formspree-side rejection shows Formspree's generic page. |
| 10 | Help and Documentation | 3 | The `$99 diagnostic` callout does real anxiety-reduction work above the form. No inline help on City, but the placeholder suffices. |
| **Total** | | **29/40** | **Good** |

## Anti-Patterns Verdict

**LLM assessment:** Not AI slop. Two adjacent tells exist and neither is in this diff: the `.contact-info-card` icon-chip rows are a vertical cousin of the identical-card-grid pattern DESIGN.md names as the site's most recognisable tell, and the "Call Us Now" gradient (`135deg, #cc3d12, #9e300a`) is a close-but-not-identical improvisation of the documented three-stop dark-CTA recipe. The diff itself has zero visual footprint in the closed state, which is a point in its favour: it fixed a data-correctness problem without adding decorative surface.

**Deterministic scan:** `node .agents/skills/impeccable/scripts/detect.mjs --json pages/contact.html` returned `[]`, exit 0. Zero findings, zero rules fired.

**Project-specific check the detector cannot do:** `grep -n '—' pages/contact.html` returned no matches. `test/functional.spec.js` carries 20 em dashes, all pre-existing and all inside `//` code comments, not editorial copy; the added lines in this diff contain zero (verified against `git diff -U0`).

**DOM verification:** 50 `<option>`, 3 `<optgroup>`. Orange County 30 (29 cities + Other), Los Angeles County 12 (11 + Other), Riverside County & nearby 6 (5 + Other), plus 2 ungrouped (placeholder, "Other / not listed"). Matches intent exactly.

**Measured at 375px:** select height 46px (clears the 44px minimum), computed font-size 16px (no iOS auto-zoom), `scrollWidth` 360 = `clientWidth` 360 so no horizontal overflow, which specifically clears the P6-42 bug class. Text contrast 18.88:1; `.form-label` 7.11:1. Both pass AA.

**Visual overlays:** none. Overlay injection was not attempted; the skill ships a multi-file `live-*` session subsystem rather than a one-shot evidence overlay, and standing it up was out of scope for a read-only pass. Fallback signal: direct Playwright DOM/CSS measurement, reported as exact numbers above.

## Overall Impression

The diff does what it set out to do and the deterministic evidence is clean. The interesting finding is elsewhere: this critique surfaced that the page's designed post-submit reassurance never fires. That is the single biggest opportunity on this surface and it has nothing to do with the dropdown.

## What's Working

1. **The restructuring is a correctness fix wearing a UX-polish costume.** The previous 13-city list silently told every LA and Riverside customer they were not welcome, while the nav mega-menu and the fee-tier rules already marketed to them. The form's data model now matches the business's actual service area for the first time.
2. **"Other (County)" repeated inside each group, not one generic catch-all.** A user who cannot find their city still lands in the right county, so the geographic signal the business needs for routing and fee tiering survives the fallback.
3. **`<optgroup>` chunking is a real mitigation, not a cosmetic one.** Screen readers announce the group label on entry, converting an undifferentiated 50-item stream into three bounded, labelled regions. Most users skip two of three groups entirely.

## Priority Issues

**[P1] Form submission has no working success or error feedback.** Pre-existing, outside this diff.
- *Why it matters:* the highest-stakes moment on the page, the click of Send Message, ends on an off-brand Formspree page the business does not control. PRODUCT.md principle 4 is "conversion at every scroll"; this is a peak-end failure where the last thing the user experiences is the least reassuring.
- *Fix:* either add a Formspree `_next` hidden field pointing at a branded thanks page, or intercept submit with `fetch()` to the JSON endpoint and toggle the existing `#form-success` / `#form-error` blocks, which is clearly what the markup was built for.
- *Suggested command:* `$impeccable harden`

**[P2] No typeahead on a 50-option control.** Diff-adjacent.
- *Why it matters:* the OC group alone is 30 items. Drives the 2/4 on Nielsen 7.
- *Fix:* owner-decided this session: ship native, revisit only if form completion suggests friction. Recorded rather than actioned.
- *Suggested command:* none for now.

**[P2] The card's inline padding has no mobile override.** Pre-existing.
- *Why it matters:* `shared.css` defines no `.card` padding, so the inline `36px 40px` is the only rule and survives to 375px, rendering the select 236px wide. mobile-design.md requires tightened padding at mobile widths; an inline style is exempt from any breakpoint.
- *Fix:* move it to a `.contact-form-card` class, then override at `max-width: 480px` to `28px 22px`, matching the documented `.letter-card` pattern.
- *Suggested command:* `$impeccable adapt`

**[P3] Focus indicator is a border-color shift only.** Site-wide, pre-existing.
- *Why it matters:* `.form-input` sets `outline: none` globally and `:focus` changes only `border-color`, with no box-shadow. It clears the 3:1 non-text minimum but is a thin cue on a control that now takes longer to operate by keyboard.
- *Fix:* add `box-shadow: 0 0 0 3px rgba(232,76,30,0.25)` to `.form-input:focus`.
- *Suggested command:* `$impeccable audit`

**[P3] No required/optional indicator.** Pre-existing.
- *Fix:* add "(optional)" to the Message and Email labels. Describe the Issue is the field that helps the technician most, and a stressed user may skip it thinking it is mandatory friction.
- *Suggested command:* `$impeccable clarify`

## Persona Red Flags

**Jordan (confused first-timer):** net positive from this diff if they live in LA or Riverside, where they previously had only a mis-filing "Other (Orange County)". Unchanged for the typical OC homeowner, since OC remains the first and largest group. Jordan's real red flag is the P1 issue: landing on an unfamiliar Formspree domain with no branded confirmation, unsure whether the request went through.

**Sam (screen reader, keyboard):** the optgroup change *helps*. NVDA, JAWS and VoiceOver all announce the group label when arrow-key navigation crosses into it. `<label for>`, `required` semantics and the native control are all correct. Sam's weak link is the P3 focus indicator: a 1.5px border shift with `outline: none` is a thin signal for confirming focus before opening a 50-option control.

**Casey (distracted, one-handed, mobile):** tap target 46px and font-size 16px both pass. Real red flag is the 236px-wide field inside the over-padded card. Casey is also the persona most exposed to P1: rushed and one-handed, they will assume the submission worked and move on, a quieter and harder-to-detect failure than Jordan's confusion.

## Minor Observations

- `.form-label { color: #555 }` and `.callout-line { color: #9a3412 }` are off-palette against DESIGN.md's token set (nearest are Workshop Charcoal `#444` / Dust `#666`, and Ember Deeper `#aa3210`). Pre-existing.
- The nav's Service Areas menu lists 6 LA cities and 1 Riverside city; the form now lists 11 and 5. The asymmetry is intentional (the fee rule names Gateway Cities the nav does not surface) but it is the same surface-drift shape as P6-45.
- Options carry no `value` attribute. Per spec an option without one submits its text content, so Formspree receives the city name correctly. Confirmed, flagged only because it reads like an oversight at a glance.

## Questions to Consider

- Has anyone completed a real end-to-end submission recently? The gap between the designed `#form-success` state and the shipped behaviour suggests not.
- The nav already groups OC into Coastal / Central / North / South, which is how homeowners actually think. Would sub-grouping the 30-item OC list the same way beat alphabetical, at zero implementation cost?
