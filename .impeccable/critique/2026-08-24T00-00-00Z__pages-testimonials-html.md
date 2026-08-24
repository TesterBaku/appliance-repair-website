# Impeccable Critique: pages/testimonials.html

**Date:** 2026-08-24
**Target:** `pages/testimonials.html`
**Slug:** `pages-testimonials-html`
**Context:** weekly customer-review publish batch (116 to 118); two new `.t-card`s, two new `Review`
JSON-LD nodes, `All (113)` to `All (115)`, count surfaces swept site-wide by
`npm run build:review-counts -- --publish`.

**Provenance:** NOT degraded. Assessment A (design review) and Assessment B (detector + browser
evidence) ran as two isolated, parallel sub-agents, neither seeing the other's output, per
`.agents/skills/impeccable/reference/critique.md`. No degraded banner applies.

**Score: 32/40.** 0 P0, 0 P1, 2 P2, 2 P3.

> **Note on this file's own prose:** it carries no em dashes, deliberately. This project bans them in
> editorial copy and the practical instruction is to grep *changed files*, not changed `.html` files.
> `test/html-integrity.js` only walks `.html`, so nothing automated would have caught them here.

---

## Assessment A: Design Review

**AI slop verdict: No.** The review copy is unsanitized (typos preserved verbatim), the photos are
real job photos rather than stock, and the card/filter/hero pattern follows the site's own system.
No gradient text, no side-stripes, no glassmorphism, no eyebrow labels, no hero-metric cliche. The
two new cards are structurally identical to the other 113.

**Methodology gap, disclosed rather than hidden:** Assessment A could not bind a local static server
in its environment after two attempts, so its read was source-based rather than visually rendered.
Assessment B *did* obtain browser evidence successfully (see below), so the critique as a whole is
not missing browser coverage. Recorded because a silent fallback is the failure mode this file
exists to prevent.

| # | Heuristic | Score |
|---|---|---|
| 1 | Visibility of system status | 3/4 |
| 2 | Match system / real world | 4/4 |
| 3 | User control and freedom | 3/4 |
| 4 | Consistency and standards | 3/4 |
| 5 | Error prevention | 3/4 |
| 6 | Recognition over recall | 4/4 |
| 7 | Flexibility and efficiency | 3/4 |
| 8 | Aesthetic and minimalist design | 3/4 |
| 9 | Error recovery | 3/4 |
| 10 | Help and documentation | 3/4 |
| | **Total** | **32/40** |

### Findings

**[P2] Alt text less specific than the page's own convention. INTRODUCED BY THIS PR. FIXED.**
`pages/testimonials.html:1072`. Every comparable photo card names the appliance and often the brand
("the top-load dryer we repaired", "the stainless LG front-load washer"). Stacey Etnire's read
"showing the appliance we repaired", giving a screen-reader user nothing.

*Resolution:* the appliance genuinely is not known here (the body names none, the photo shows no
wordmark or console, and the owner confirmed it on 2026-08-24), so naming one would be fabrication,
which is a worse failure than a vague alt. Fixed instead by describing **what is actually visible**:
"showing the white top panel and service label of the appliance we repaired". Honest and specific,
with nothing invented.

**[P2] Filter pills under the 44px tap-target floor. PRE-EXISTING, not touched by this PR.**
`.filter-pill` measures **30px** at 375px (Assessment B, measured post-`fonts.ready`, not estimated
from CSS). `AGENTS.md` already documents this by name as **P6-53**: these are `<button>` elements
and the site-wide tap-target sweep covers `<a>` only. Real friction for the phone persona; not a
blocker for this PR, and not silently dropped either.

**[P3] 8-option filter bar exceeds the >4-visible-options guideline. PRE-EXISTING.** Unchanged by
this PR; both new cards reuse the existing `general` category.

**[P3] Unbounded, un-chunked card growth. PRE-EXISTING and compounding by design.** 115 cards, no
pagination, "show more", or sort. This page is deliberately a near-complete archive that grows most
weeks, so the flat scroll lengthens every batch. **Distinct from the settled trailing-orphan-row
decision** (that one is about alignment of the last row; this is about total volume).

### Strengths

1. Total internal consistency across every review-count surface: meta, OG, Twitter, hero, stats
   bar, filter pill, `AggregateRating`, `LocalBusiness`. Nothing drifted in this batch.
2. Authentic, unsanitized voice; verbatim typos build more trust than polished copy would.
3. Schema discipline: every displayed card has a matching `Review` node with verbatim `reviewBody`,
   Google-only in `AggregateRating`.

---

## Assessment B: Detector + Browser Evidence

**Detector, `pages/testimonials.html`:** 1 finding, `em-dash-overuse` (warning).

**Adjudicated as a FALSE POSITIVE.** 14 em dashes in the file, split exactly 7/7: seven in JSON-LD
`reviewBody` fields (lines 246, 306, 324, 384 x2, 420, 654) and the same seven in the rendered
`.t-quote` blockquotes (lines 1558, 1678, 1714, 1834 x2, 1894, 2362). **Zero in editorial or chrome
copy.** Every one sits inside a verbatim customer review, which this project exempts and forbids
editing. Not suppressed in `.impeccable/config.json`, deliberately: the rule must keep firing so it
still catches a real editorial em dash later.

**Detector, count-surface sample** (`index.html`, `pages/dryer-repair-orange-county.html`,
`pages/appliance-repair-irvine-ca.html`): the two hub pages returned zero findings. `index.html`
returned 2 `design-system-font` hits (Brush Script MT line 141, Georgia line 385), both pre-existing
in unrelated `<style>` blocks and untouched by this PR's digit-only edit.

**Browser measurements** (measured, not inferred):

| Measurement | Value |
|---|---|
| Horizontal scroll at 375x812 | `scrollWidth` 360 = `clientWidth` 360, none |
| `.filter-pill` height at 375px, post-`fonts.ready` | **30px** (all 8), see P2 above |
| Card 1 image | `appliance-stacey-etnire.webp`, `complete: true`, natural **768x338**, rendered **80x80** |
| Card 2 | Cindi Nichols, `hasImage: false`, matches spec |
| Console messages | **0** at every level, at both 1440x900 and 375x812 |

Server and browser both confirmed stopped.

**Defects: none.**

---

## Settled decisions cited, not re-litigated

The grid's trailing row holds a single left-aligned card at 115. That is the case the owner
explicitly accepted **twice** (2026-08-11, 2026-08-12), with both candidate fixes (a flexbox
conversion and a JS orphan class) presented and declined. See
`.claude/skills/testimonial-selection/SKILL.md`, "`pages/testimonials.html`: add cards in multiples
of 3, and accept the orphan when you cannot". Assessment A was briefed on this, checked the area,
and confirmed it found no different problem there. Not a finding.
