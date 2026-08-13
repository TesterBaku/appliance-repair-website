---
target: pages/appliance-repair-stanton-ca.html
total_score: 33
p0_count: 0
p1_count: 0
timestamp: 2026-08-13T05-55-25Z
slug: pages-appliance-repair-stanton-ca-html
---
Method: dual-agent (A: design review, isolated · B: detector + browser evidence, isolated). Neither saw the other's output before synthesis.

Target: `pages/appliance-repair-stanton-ca.html` (new city hub, first critique for this slug).

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | FAQ `+` rotates on open and nav dropdown opens on hover, both verified live. No hover state on area cards or brand pills beyond default link colour. |
| 2 | Match System / Real World | 4 | "Streets and Areas We Cover" instead of inventing neighbourhood names for a city that has none. Reads like a local wrote it. |
| 3 | User Control and Freedom | 3 | Accordions toggle independently, breadcrumb backs out. No back-to-top on a long page (sitewide, not new). |
| 4 | Consistency and Standards | 3 | Matches the sibling hub component library. |
| 5 | Error Prevention | 4 | No forms on this page; nothing to get wrong. |
| 6 | Recognition Rather Than Recall | 4 | Phone and Call/Book repeat at hero, sticky bar and CTA box. |
| 7 | Flexibility and Efficiency | 3 | Sticky mobile bar plus header CTA serve both first-time and returning visitors. |
| 8 | Aesthetic and Minimalist Design | 2 | 14 stacked sections is a lot of surface, one more than the sibling. Prose column measured 89ch against a 65-75ch cap (now fixed). |
| 9 | Error Recovery | 4 | n/a, no error states. |
| 10 | Help and Documentation | 3 | FAQ and AI answer block do real work; the new compact-appliance section acts as embedded documentation for renters and older-home owners. |
| **Total** | | **33/40** | **Good, upper band** |

## Anti-Patterns Verdict

**LLM assessment:** mostly clean. No side-stripe borders, no gradient text, no decorative glassmorphism, no text overflow, no uppercase eyebrow above every section. The new `.fit-block` section is the strongest evidence of real authoring: prose plus a bulleted list, visibly resisting the card-grid reflex. The one seam was the repurposed area grid, which reused a card component whose ZIP subline was built for multi-ZIP cities and printed "ZIP 90680" six identical times on a single-ZIP city. That is the AI-slop mechanism in miniature: a component stretched over content it does not fit. Fixed.

**Deterministic scan:** `node .agents/skills/impeccable/scripts/detect.mjs --json pages/appliance-repair-stanton-ca.html` returned **0 findings, exit 0**. A second run over `pages/service-areas.html` and `index.html` returned 2 `design-system-font` warnings, both in `index.html` (Brush Script MT at L141, Georgia at L347). Both are pre-existing CSS untouched by this branch, whose `index.html` diff is a single line at L907.

**Independent em-dash grep** (the detector's own rule only fires at 5+, so it cannot enforce this project's outright ban): 0 in the Stanton page, 0 in `service-areas.html`, 2 in `index.html`, both inside verbatim customer review text, which the rule exempts. Across the whole branch, zero em dashes appear in any added line.

**Visual overlay:** injection succeeded and reported 20 findings, of which the great majority were rejected with evidence. Two `low-contrast` hits claiming 1.0:1 on the hero were disproved by canvas pixel-sampling the real composited background (image plus gradient overlay), which measured **11.29-11.41:1**; the overlay's checker walks to the nearest CSS `background-color` and lands on the page default. `gradient-text` and `theater-slop-phrase` could not be corroborated against any source in the page or its includes and carry no resolvable DOM position. `overused-font` is the Inter rule this project deliberately suppresses. 14 `line-length` hits are a source-code style heuristic, not a rendered-design check. The calibrated CLI gate returning 0 on the same file is the authoritative signal.

## Overall Impression

A genuinely well-executed hub page. The deductions were about repetition and density, not broken UX. The single biggest opportunity was already the most interesting thing on the page: the compact/stacked/older-appliance section is the best-written new content here and has no equivalent on any competitor page.

## What's Working

1. **The compact-appliance section is real editorial craft.** It names actual failure modes (worn dryer belt, weak igniter, condenser clearance in a tight cabinet) instead of generic filler, and chose prose over yet another card grid.
2. **Refusing to invent neighbourhoods.** Stanton has none; the page says so plainly and covers the city by corridor and landmark instead. That honesty is also the strongest local-SEO signal on the page.
3. **Clean mechanical hygiene.** Zero em dashes, zero contrast failures, zero horizontal overflow, zero console errors, working accordion and dropdown, at both viewports.

## Priority Issues

**[P2] Six area cards each opened with the same "ZIP 90680" token.** Cognitive-load failure: the section intro already establishes the single-ZIP fact, so six repetitions carried no new information and read as filler next to otherwise specific card copy. **Fixed:** cards now open on their landmark; the page-local class was renamed `.neighborhood-zip` to `.neighborhood-anchor` to match what it holds. Suggested command: `$impeccable clarify`.

**[P2] New prose column ran ~89ch against the 65-75ch cap.** At 13.5px, a 760px column produces long saccades and is harder to track back to the line start, which works against a stressed skimming reader. **Fixed:** `.fit-block` narrowed to 620px, re-measured at 72.8ch. Suggested command: `$impeccable typeset`.

**[P3] `.btn-outline-white` hit 44px by coincidence, not by rule.** Its siblings `.btn-white` / `.btn-white-outline` carry an explicit mobile `min-height: 44px`; this one landed on 44 through padding and line-height alone, so a future tweak could silently drop it under the floor with no test catching it. **Fixed:** added to the same rule. Suggested command: `$impeccable adapt`.

**[P3, NOT fixed here] 24 elements under the 44px tap-target floor at 375px.** Verified pre-existing: the sibling template has the same 24, differing only by one inline city link in prose. Brand pills render ~34px tall; footer and breadcrumb links 15-16px. This is a shared-component and partial-level issue across all 32 city hubs, logged as **P6-50** rather than fixed on one hub out of 32. Note that WCAG 2.5.8 exempts inline-in-sentence links, so part of the fix is amending `mobile-design.md`, not the CSS. Suggested command: `$impeccable adapt`.

**Rejected finding:** the premium brand row lists 5 pills (Sub-Zero, Wolf, Viking, Thermador, Miele) and Assessment A flagged Dacor and DCS as missing against a supposed 7-brand list. False positive. `.claude/rules/seo-content.md:344` defines the premium tier as exactly those 5; Dacor and DCS sit on the general serviced-brands line. `content-integrity` validates this across 306 premium lists and passes.

## Persona Red Flags

**Jordan (confused first-timer):** none. "Streets and Areas" is easier for Jordan than a neighbourhood name they would not recognise, since they would search by cross-street anyway. The compact-appliance section pre-answers the unspoken "is my old stacked unit even worth fixing."

**Riley (stress tester):** would have caught the ZIP repetition immediately ("why does every card repeat the same ZIP?"). That was the one place Riley's scepticism had real ammunition. Now removed.

**Casey (distracted mobile user):** no overflow, sticky bar present and correctly sized, hero CTAs at 44px. The h1 sits at exactly 28px, the floor of the project's 28-34px mobile rule, so any future copy lengthening needs a mobile check before it ships.

## Minor Observations

- Section background alternation ends in three consecutive white sections (pricing, FAQ, CTA). The sibling has four in a row at the same position, so inserting the grey `.fit-block` and flipping testimonials to grey slightly reduced the monotony rather than adding to it.
- Stray blank-line whitespace in the source around the brand-pill lists, identical in the sibling. Zero rendering impact.
- The header logo wraps to two lines at 375px, cramping the mobile header. Shared nav chrome from the partial, not fixable on this page alone.

## Questions to Consider

1. If Stanton genuinely has no neighbourhoods, is a six-card grid the right shape at all, or would a single organised paragraph, the way the About block already works, have suited the content better than the card mould built for a different kind of city?
2. The compact-appliance section is the best-written new content on the site. Should "explain the local housing stock" become a standard component for other older, denser Orange County cities such as Santa Ana and Garden Grove, rather than staying a Stanton one-off?
