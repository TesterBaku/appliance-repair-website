# impeccable critique — `pages/kenmore-appliance-repair-orange-county.html`

Method: full gate, dual isolated assessments. A: judgment-driven design review, no access to B.
B: deterministic detector plus Playwright browser measurement, no access to A. Synthesis below.

Target: a new brand hub for Kenmore, the 16th on this site. New page, new markup, so the full
critique applies rather than the detector-only tier.

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | FAQ `aria-expanded` and nav dropdown states correctly wired; nothing dynamic to fault |
| 2 | Match system / real world | 4 | The core idea, that the badge is not the factory and the model prefix reveals the real maker, matches the actual confusion a Kenmore owner has |
| 3 | User control and freedom | 3 | Call and Book paired throughout, FAQ collapsible, cross-links out |
| 4 | Consistency and standards | 2 | Two verified deviations from the sibling template, both since fixed (P1, P2) |
| 5 | Error prevention | 4 | Disclaimer verbatim, all ranges never flat rates, correct `$75 - $100` service-call row, correct flat `$99` OC fee in prose |
| 6 | Recognition rather than recall | 3 | Nav dropdown surfaces every brand and city; breadcrumb present |
| 7 | Flexibility and efficiency | 3 | Dual CTA at every major section, sticky mobile bar, related-services grid |
| 8 | Aesthetic and minimalist design | 4 | No gradient text, no side-stripes, no glassmorphism, no icon-grid slop, no eyebrow scaffolding |
| 9 | Error recovery | 3 | Little surface for user error; no forms on the page |
| 10 | Help and documentation | 4 | 9 FAQs against a floor of 8, plus the explainer, the prefix table and the cost table |
| **Total** | | **33/40** | Scored before the two fixes below were applied |

## Anti-patterns verdict

**Assessment A (judgment): PASS.** Not AI slop. No identical icon-heading-text card grid, no tiny
uppercase tracked eyebrow above every section, no numbered section scaffolding, no hero-metric
template, no gradient text, no glassmorphism, no side-stripe borders.

**Assessment B (deterministic): `detect.mjs --json` returned `[]`, exit 0.** Zero findings, all rules,
all severities. Re-run after the fixes: still `[]`, exit 0.

**Em dashes, checked independently** because the detector only fires at 5 or more while this project
bans them outright: `rg -c` returns 0 on the page, before and after the fixes.

## Priority issues

**[P1, FIXED] The testimonial cards used the city-hub format on a brand hub.** They rendered
`Name, job type, Orange County, CA` with middle dots. Every one of the 15 sibling brand hubs renders
`Name, Orange County, CA`, with no job-type segment. Verified directly against frigidaire, maytag,
ge, whirlpool, kitchenaid and samsung before acting, rather than taking the finding on trust.

Cause worth recording: the job-type labels were dictated in the build brief, copied from the city-hub
convention. This is the same class of error that took three review rounds on PR #732, where cost-hub
conventions were applied to a brand hub. The families look interchangeable and are not.

**[P2, FIXED] The page was the only brand hub of 16 with no `issues-grid` section.** Verified by
grepping all 16: every sibling returns 3 matches, Kenmore returned 0.

Cause: an instruction of mine banning a "common Kenmore problems" section. That was correct about
brand-specific *failure patterns*, since none cleared the two-independent-source bar in
`.claude/rules/trusted-sources.md`, and wrong about the section, since the sibling version lists
symptoms the company fixes rather than defects unique to the brand. The replacement section applies
the page's own thesis to symptoms: the symptom is ordinary, the parts depend on who actually built
the unit. It carries an explicit constraint against asserting platform internals the research could
not source.

**[P3, NOTED, not a defect] No "Recent Job Photo" section**, unlike 12 of 15 siblings. No
`images/real/**/*kenmore*` asset exists in the repo, so the alternative was a stock or mismatched
photo. A missing image beats a wrong one. Revisit when a real Kenmore job is photographed.

**[Dismissed after verification] Assessment B noted the `ItemList` entries carry `"@type": "Review"`
directly rather than a `ListItem` wrapper.** Checked against frigidaire, maytag, ge and whirlpool:
all four use the identical shape. This is the established convention here, not a deviation.

## Browser evidence (Assessment B, measured)

- **No horizontal overflow** at any tested width. 1280: `scrollWidth` 1265 vs `innerWidth` 1280.
  768: 753 vs 768. 414: 399 vs 414. 375: 360 vs 375.
- **Testimonial cards**: 3, all rendering 287x213 px at 1280. No height raggedness.
- **The model-prefix table** sits in a wrapper with computed `overflow-x: auto` and measures 296px
  inside a 296px wrapper at 375px. It scrolls within itself rather than pushing the page wide.
- **Grid collapse** confirmed on `.models-grid`, `.luxury-brands-grid` and `.testimonials-grid`,
  each reaching a single column at 375px.
- **The new `issues-grid`** measured after the fix: `544px 544px` (2 columns) at 1280, one 311px
  column at 375, no overflow. Item heights equal within each row.
- **Sticky mobile Call/Book bar**: `display: none` at 1280, `flex` at 768 and 375.
- **Header `.nav-cta`**: visible at 1280, `none` at 768 and 375, per `mobile-design.md`.
- **Hero `h1`**: 28px at 375 (rule wants 28 to 32), 46px at 1280, no clipping.
- **9 interactive elements below 44px** at 375px. All are inline text links in the breadcrumb, body
  copy and footer. No primary CTA, sticky-bar link, or hamburger is among them, so the rule's
  button and CTA requirement is met. Recorded as a site-wide pattern rather than a page defect.

## Schema and parity (Assessment B, measured)

5 JSON-LD blocks, all parsing: `Service`, `LocalBusiness`, `ItemList`, `FAQPage`, `BreadcrumbList`.
Exactly one `LocalBusiness` carrying the shared `"@id": "https://fixappliancesfast.com/#business"`.
`aggregateRating.reviewCount` is `"115"`. All 3 `Review` nodes sit inside the single `ItemList`, each
with `itemReviewed.@id` pointing at `#business`. FAQ parity is 9 visible against 9 `mainEntity`, text
matching one to one.

## Contrast, computed by hand

`npm test`'s WCAG check explicitly excludes inline-style pairs, so 8 pairs were computed directly.
Lowest is 5.48:1 (breadcrumb `#666666` on `#f7fafc`); the testimonial initial badge is 9.74:1
(`#fff` on `#444444`); body greys are 5.74:1. All clear AA for normal text at their real background.

## What is working

1. **The prefix table earns the page.** A homeowner can read the plate and match a row. The italic
   caveat under it admits that prefix charts circulating online disagree, which makes the table more
   credible rather than less, and converts an unverifiable claim into a reason to call.
2. **Pricing compliance is clean.** Verbatim disclaimer, ranges never flat rates, the standard-brand
   `$75 - $100` service-call row, and the flat `$99` Orange County company fee stated only in prose,
   never mixed into the cost table.
3. **Restraint.** Two conventions that would have been easy to get wrong, the flat `#444444` badge
   colour and the inline weight-800 heading style, are both correct for a brand hub.

## Persona red flags

**First-time visitor:** none. The hero explains itself in one sentence.
**Distracted mobile user:** none. No overflow, the table scrolls in its own container, hero `h1` in
range.
**Stressed Orange County homeowner:** one judgment call. The explainer runs five content blocks deep
before the page moves on, against a persona `PRODUCT.md` describes as wanting to book quickly. CTAs
stay reachable throughout via the sticky bar and repeated buttons, and the depth is the trust
mechanism itself, so this is a tension rather than a defect.

## Uncertain, stated rather than smoothed over

Assessment A did not fact-check the prefix-to-manufacturer claims or the two part-number
cross-references. Those were sourced separately under `.claude/rules/trusted-sources.md` before the
page was written, reduced to the seven rows that survive an independent-lineage check, and the four
prefixes resting on a single shared lineage were deliberately dropped.
