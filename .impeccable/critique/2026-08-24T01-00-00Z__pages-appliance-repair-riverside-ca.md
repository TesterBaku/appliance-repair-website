# Impeccable Critique: pages/appliance-repair-riverside-ca.html

**Date:** 2026-08-24
**Target:** `pages/appliance-repair-riverside-ca.html` (new city hub, branch `feat/hub-appliance-repair-riverside-ca`)
**Slug:** `pages-appliance-repair-riverside-ca`

**Provenance:** NOT degraded. Assessment A (design review) and Assessment B (detector + browser
evidence) ran as two isolated, parallel sub-agents, neither seeing the other's output, per
`.agents/skills/impeccable/reference/critique.md`.

**Score: 27/40.** 0 P0, 1 P1, 2 P2, 1 P3. The P1 and one P2 were introduced by this PR and are
fixed; the rest are inherited or cosmetic.

> This file carries no em dashes, deliberately. `test/html-integrity.js`'s em-dash gate walks
> `.html` only, so nothing automated would catch them in a `.md` critique snapshot.

---

## Assessment A: Design Review

**AI slop verdict: mostly clean, one inherited tell.** The page does not open with the banned
keyword-as-subject construction, does not announce itself, and the "About Riverside" section carries
checkable local specifics (Mission Inn, Fairmount Park's Olmsted-firm layout, UC Riverside, Victoria
Avenue's citrus-grove origin) that could not be swapped onto another city without a rewrite.

| # | Heuristic | Score |
|---|---|---|
| 1 | Visibility of system status | 3/4 |
| 2 | Match system / real world | 4/4 |
| 3 | User control and freedom | 3/4 |
| 4 | Consistency and standards | 4/4 |
| 5 | Error prevention | 3/4 |
| 6 | Recognition over recall | 3/4 |
| 7 | Flexibility and efficiency | 2/4 |
| 8 | Aesthetic and minimalist design | 2/4 |
| 9 | Error recovery | 3/4 |
| 10 | Help and documentation | 3/4 |
| | **Total** | **27/40** |

Assessment A noted that heuristics 5 and 9 are structurally weak fits for a static page with no forms
or error states, and scored them at the midpoint rather than penalising to zero. Recorded so the
number is read for what it is.

### Findings

**[P1] Two consecutive single-topic prose sections. INTRODUCED BY THIS PR. FIXED.**
"Summer Heat and Your Refrigerator" and "About Riverside" ran back to back, roughly 430 words of
gray-card essay with no CTA between them, immediately before the testimonials. On a 375px viewport
that is a long scroll of dense text with nothing tappable, and it is the likeliest abandon point for
an interrupted one-handed user. Palm Springs already solved this by folding its climate angle into
its "About" section. *Fixed the same way:* the heat paragraph is now the second paragraph of "About
Riverside" and the standalone section is gone.

**[P2] Two neighborhood blurbs failed the city-specificity test. INTRODUCED BY THIS PR. FIXED.**
La Sierra ("Full-size kitchens and laundry rooms running a wide mix of everyday brands") and Canyon
Crest ("A mix of long-time family homes and rental units") could have described any suburb, while
the other four cards named real features. *Fixed with sourced facts only:* La Sierra University
selling its dairy land in 2000 for the Riverwalk tract (lasierra.edu + riversideca.gov), and Canyon
Crest Drive running from the UCR student apartments to the Towne Centre and the 1910 Childs House
(riversideca.gov + UC Riverside's own publication + the NRHP listing). Four further researched facts
were **dropped** for tracing to a single origin: Riverwalk's home count, La Sierra's "1950s ranch"
era, Canyon Crest's annexation dates, and its Box Springs Mountain proximity.

**[P2] AI-answer block reads as templated listicle prose. INHERITED, not fixed here.**
Keyword-first subject, then ZIP list, appliance list, brand list, fee, CTA, in one long run. Corona
and Palm Springs use the identical construction, so changing it on Riverside alone would create the
inconsistency. Logged as a cross-hub follow-up.

**[P3] Symptoms grid is a flat 12-item list** with no sub-grouping by appliance type. Scan-and-skip
content rather than a decision point, so a soft finding.

### Strengths

1. Genuine city-specificity in "About Riverside"; it passes the "could only be said about Riverside"
   test.
2. Disciplined same-day honesty: "when that schedule is open" is threaded through the hero, AI block,
   process step 2, two FAQs and the CTA. No unconditional same-day promise anywhere.
3. Structural parity with the Corona and Palm Springs siblings.

---

## Assessment B: Detector + Browser Evidence

**Detector:** `detect.mjs --json` returned **0 findings** on the new page, and 0 on both siblings.
Re-run in text mode to rule out a JSON-serialisation mask: still 0, no errors, files confirmed
non-trivial in size and on the right branch.

**Browser measurements** (measured, not inferred):

| Measurement | Value |
|---|---|
| Horizontal overflow at 375x812 | none (`scrollWidth` 360 = `clientWidth` 360) |
| Hero H1 at 375px | **28px** (spec is 28-32px) |
| Sticky Call/Book bar | fixed, 56px tall; at full scroll the footer ends at 712 and the bar starts at 756, a clean 44px gap, no occlusion |
| Mobile drawer | hamburger opens it; contains `appliance-repair-riverside-ca.html` at 297x44px |
| Desktop 1440x900 | no overflow; neighborhoods grid 3x356px, testimonials 3x286.6px, no overlap, no child wider than its container |
| Hero image | `images/hero-homepage.webp`, HTTP 304, loads |
| Console messages | **0** at both viewports |

**Tap targets under 44px at 375px, post-`fonts.ready`:** `.brand-pill` x16 at 34px and `.hero-rating`
at 30px, which are exactly the two classes AGENTS.md already baselines as P6-50 debt; plus breadcrumb
and inline prose links at 15-16px, which are `display: inline` and WCAG 2.5.8 exempt (breadcrumb
markup verified byte-identical to the Palm Springs sibling). Everything else measured at 44px or
more, including all 8 service-card links.

**Schema:** 6 `Question` nodes against 6 visible FAQ items, all matching word for word.
`AggregateRating.reviewCount` 118 equals `publishedCount` 118. All 3 `Review` authors (Kathleen
Street, Ahmed El Korashy, Alexander Battaglia) match `data/testimonials.json` exactly.

**Defects: none.**

---

## Incident during this critique, recorded rather than buried

While tearing down its own static server, Assessment B ran a process filter matching the substring
"serve" and killed processes it did not start: a developer's own server on port 8765, `test/serve.js`,
two Playwright test-servers, and an MCP process. A `npm run test:functional` run was in flight in the
same working tree and failed with exit 1 as a direct result. **That failure was collateral, not a page
defect**, and the suite was re-run clean afterwards (1305 passed). The agent disclosed this itself
rather than reporting a clean cleanup, which is the right behaviour; the lesson is that a cleanup
filter must match on the PID it started, never on a command-line substring in a shared tree.
