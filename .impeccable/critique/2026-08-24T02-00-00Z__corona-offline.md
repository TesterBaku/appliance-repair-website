# Impeccable Critique: Corona offline change

**Date:** 2026-08-24
**Branch:** `chore/corona-offline`
**Targets:** `pages/service-areas.html` (primary), `pages/appliance-repair-palm-springs-ca.html`,
`pages/appliance-repair-corona-ca.html`

**Provenance:** NOT degraded. Assessment A and Assessment B ran as two isolated, parallel
sub-agents, neither seeing the other's output.

**Score: 30/40.** 0 P0, 1 P1, 2 P2, 1 P3.

> **Why this critique exists at all.** The first draft of this PR's description claimed the impeccable
> gate was "N/A by scope" because the diff adds no new element and no styling. That is exactly the
> argument PR #759 made for a single `<link rel="preload">`, which the reviewer blocked, and it is the
> reason the lighter tier was abolished on 2026-08-20: a boundary that has to be argued gets argued,
> always toward the cheaper tool. The claim was also wrong on the facts. Turning an `<a>` into a
> `<div>` changes what the page does when a user taps it, which is a rendered change by any
> definition. Running the gate found a P1.

---

## Assessment A: Design Review

**AI slop verdict: none.** The copy is specific and non-generic (real mileage, road names,
technician-routing logic, groundwater hardness, dust advisories), which is the register PRODUCT.md
asks for.

| # | Heuristic | Score |
|---|---|---|
| 1 | Visibility of system status | 3/4 |
| 2 | Match system / real world | 3/4 |
| 3 | User control and freedom | 3/4 |
| 4 | Consistency and standards | 3/4 |
| 5 | Error prevention | 4/4 |
| 6 | Recognition over recall | 3/4 |
| 7 | Flexibility and efficiency | 2/4 |
| 8 | Aesthetic and minimalist design | 3/4 |
| 9 | Error recovery | 3/4 |
| 10 | Help and documentation | 3/4 |
| | **Total** | **30/40** |

### Findings

**[P1] Orphaned non-sequitur sentence. INTRODUCED BY THIS CHANGE. FIXED.**
`pages/appliance-repair-palm-springs-ca.html`. The climate paragraph ended with "We also cover Corona
and the rest of Riverside County." That clause existed to carry a link; with the link stripped it was
a flat tack-on at the end of a vivid paragraph about 109 degree summers, hard groundwater and dust on
condenser coils, reading like a leftover SEO stub in the strongest passage on the page. *Fixed by
cutting it*, not rewording: the paragraph is about Palm Springs and never needed it.

**[P2] "Click any city" contradicted by 13 of 50 cards. WORSENED BY THIS CHANGE. FIXED.**
`pages/service-areas.html`. The grid caption read "Click any city to book a repair or learn more
about service in your area" above a grid of 50 cards, 13 of them plain `div`s. Twelve predate this change;
Corona is the thirteenth, which is what made it worth fixing now. A Corona homeowner following the
instruction literally taps the card, nothing happens, and no on-card text explains why. *Fixed*: the
caption now describes what the grid does and reassures the reader that an unlinked city is still
served.

**[P2] Weak at-rest differentiation between linked and unlinked cards. PRE-EXISTING. NOT FIXED.**
At rest the two card types differ only by a small arrow glyph and a 10.5px tag. True for 12 other
cities already. A real gap, but it is a grid-wide redesign and does not belong in a page-withdrawal
PR.

**[P3] Corona's mileage line is now orphaned supporting copy. NOT FIXED, deliberately.**
"Corona is about 22 miles from our Stanton base via the CA-91" sits in region prose rather than on a
card, the distance is still true, and it still supports the claim that we serve the city. Assessment
A rated it low-severity tonal drift.

### Strengths

1. Honest, calibrated service-tier language: same-day versus next-available is stated per region from
   actual technician routing, not a blanket promise.
2. The withdrawal reuses an existing state (`city-card--info`, already used 12 times on the same page)
   instead of inventing one.
3. No dead links: the element type changed rather than leaving a stale `href`, so there is no
   clickable-but-broken affordance anywhere.

---

## Assessment B: Detector + Browser Evidence

**Detector:** 0 findings on all three files. Sanity-checked against `index.html` in the same session,
which returned 2 real findings, confirming the empty result is genuine rather than a silent failure.

**Browser measurements:**

| | Corona (changed) | Riverside (linked control) | Norco (info control) |
|---|---|---|---|
| Element | `div.city-card--info` | `a.city-card.primary-city` | `div.city-card--info` |
| `cursor` | `default` | `pointer` | `default` |
| Size at 1440 | 358.66x66 | 358.66x66 | 358.67x66 |
| `tabIndex` | -1 | 0 | -1 |
| Hover shadow | none | `rgba(0,0,0,0.08) 0 4px 16px` | none |

Corona now behaves identically to its sibling info cards and differently from linked ones, with no
misleading hover affordance. Grid alignment intact, no hole. No horizontal overflow at 1440 or 375.
0 console errors or warnings on all three pages at both viewports.

**The noindex-over-delete pattern verified working:** `pages/appliance-repair-corona-ca.html` returns
**200**, carries `robots: noindex, follow`, and renders in full.

**Deterministic checks:** sitemap 159 `<loc>` entries, zero Corona, Riverside present. **Zero actual
`<a href>` hyperlinks to the Corona page anywhere in the tree**; the single regex match is the page's
own `<link rel="canonical">`. `"Corona, CA"` still in `service-areas.html`'s `areaServed`, and its
rendered city card still present, satisfying the CI parity check. `git diff master...HEAD -- articles/`
contains zero `article:modified_time` or `dateModified` lines.

**Defects: none.**

**Teardown:** browser closed; server killed by exact PID (cmd wrapper 42180, child node 25872, both
verified by command line before the kill and confirmed gone). A stale reused PID that turned out to be
an unrelated Notepad process was correctly identified as not its own and left untouched. This is the
behaviour the earlier incident in this session lacked.

---

## Correction, after review

`/review` recounted the grid and found this file said **44** cards where the page actually renders
**50** (37 `.city-card.primary-city` + 13 `.city-card--info`). Recounted independently here and the
reviewer is right. Corrected above.

The finding and its fix are unaffected: 13 unclickable cards under a "Click any city" caption is the
defect either way. But a document whose own framing is "measured, not inferred" got a number wrong,
which is the third wrong count in this session, so it is recorded rather than silently patched. The
figure came from Assessment A's prose and was carried into this snapshot without being re-derived.
**Re-derive every count you copy from an assessment, including your own.**
