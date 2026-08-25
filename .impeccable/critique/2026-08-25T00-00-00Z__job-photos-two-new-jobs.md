# Impeccable Critique: two new real job photos across eight surfaces

**Date:** 2026-08-25
**Branch:** `content/job-photos-2026-08-25`
**Targets:** `pages/recent-repairs.html`, `pages/appliance-repair-irvine-ca.html`,
`pages/bosch-appliance-repair-orange-county.html`, `pages/dishwasher-repair-orange-county.html`,
`pages/appliance-repair-mission-viejo-ca.html`, `pages/samsung-appliance-repair-orange-county.html`,
`pages/washer-repair-orange-county.html`

**Provenance:** NOT degraded. Assessment A and Assessment B ran as two isolated, parallel
sub-agents, neither seeing the other's output.

**Score: 30/40.** 0 P0, 0 P1, 1 P2, 2 P3.

---

## Assessment A: Design Review

**AI slop verdict: no absolute-ban violations.** None of the eight insertions introduce new
structure; each clones the sibling card markup already on its page. One real tell was found in the
new copy, below.

| # | Heuristic | Score |
|---|---|---|
| 1 | Visibility of system status | 3/4 |
| 2 | Match system / real world | 3/4 |
| 3 | User control and freedom | 3/4 |
| 4 | Consistency and standards | 3/4 |
| 5 | Error prevention | 4/4 |
| 6 | Recognition over recall | 3/4 |
| 7 | Flexibility and efficiency | 3/4 |
| 8 | Aesthetic and minimalist design | 3/4 |
| 9 | Error recovery | 3/4 |
| 10 | Help and documentation | 2/4 |
| | **Total** | **30/40** |

### Findings

**[P2] The Samsung washer copy never names what was repaired. INTRODUCED BY THIS CHANGE.
PARTIALLY FIXED, and the remainder is deliberate.**
Three prose surfaces read "We diagnosed and repaired the issue so the drum spins smooth and
balanced again", where neighbouring captions all commit to a named part ("replaced the spray arm",
"replaced the water inlet valve", "replaced the spark module and igniter"). Assessment A is right
that this is the register a generic copy generator falls into when it lacks the fact, and right
that the gallery's whole trust mechanism is technical specificity.

*Fixed as far as the evidence allows:* the empty "we diagnosed and repaired the issue" clause is
gone. The sentence now reads "It holds steady through a full spin cycle now", which states an
outcome that is true of a completed job rather than hedging around a fact we do not have.

*Not fixed, deliberately:* the part is not named, because **it is not recorded anywhere.** The
owner's source filename, `samsung_washer_mission_viejo_shaking_when_spinning.jpeg`, carries the
symptom and not the fix. Suspension rods, shock absorbers, a tub bearing and levelling feet all
produce this symptom, and picking one to make the caption match its siblings would be inventing a
repair record on a page whose entire value is that its records are real. Listed as an owner item:
one word from the technician closes it in a one-line edit.

**One correction to Assessment A's framing.** It described this as the single vague caption among
53. It is the second: `pages/recent-repairs.html:1098`, the Viking Professional range card, already
reads "diagnosed and repaired so the burners and both ovens come back to life". So this is an
established fallback in this repo for jobs whose part was not recorded, not a new lapse. That does
not make the copy better, and the fix above stands, but the severity is P2 rather than higher.

**[P3] Two hub grids have no orphan-centering rule. PRE-EXISTING. NOT FIXED, deliberately.**
`pages/appliance-repair-irvine-ca.html` and `pages/dishwasher-repair-orange-county.html` use a bare
`repeat(auto-fit, minmax(260px, 1fr))` with none of the `:has()` centering that
`samsung-appliance-repair-orange-county.html`'s `.job-grid` carries. This diff happens to take both
from 5 cards to 6, which *incidentally repairs* a trailing row that was stranded before this PR.
The repair is arithmetic, not structural, so the next single-photo add re-strands it. Porting the
`:has()` rule is a grid change on pages this PR only adds a card to; logged as follow-up rather
than widened into here.

**[P3] The card title names the symptom, not the part. NOT FIXED.**
"Washer Vibration Repair" against a page-majority convention of "Spray Arm Replacement". Assessment
A notes several existing titles are already symptom-named ("Dishwasher Not Draining", "Custom Panel
Front"), so this is a soft inconsistency, and it is downstream of the P2 above: the part cannot be
in the title while it is unknown.

### Strengths

1. Structural fidelity: all eight insertions replicate sibling markup, inline styles, radius, shadow
   and the full `<picture>`/`srcset`/`sizes` pattern, and read as originally authored.
2. The diff incidentally repairs two pre-existing stranded trailing rows (Irvine 5 to 6, dishwasher
   hub 5 to 6).
3. Layout-shift discipline intact: every new `<img>` carries explicit `width`/`height` plus the same
   480w-webp / full-webp / jpg trio used everywhere else.
4. JSON-LD `image[]` order on `recent-repairs.html` matches DOM visual order, which is easy to drift.

---

## Assessment B: Detector + Browser Evidence

**Detector:** 1 finding across the 7 files, `numbered-section-markers` on
`washer-repair-orange-county.html`. **Verified pre-existing:** the same run against
`git show master:pages/washer-repair-orange-county.html` returns the identical finding, so this diff
did not introduce it. Sanity-checked against `index.html`, which returned 2 findings, confirming the
near-empty result is genuine rather than a silently broken tool.

**Browser measurements, 1440x900 and 375x812, all 7 pages:**

| Page | Overflow | New image loads | New card vs sibling |
|---|---|---|---|
| recent-repairs | none (1425/1425, 360/360) | yes | 334.66x481.13 vs 334.66x481.13, exact |
| appliance-repair-irvine-ca | none | yes | 286.66 vs 286.67, exact |
| bosch-appliance-repair-oc | none | yes | 340x367.55 vs 340x367.55, exact |
| dishwasher-repair-oc | none | yes | 350x350.55 vs 350x350.55, exact |
| appliance-repair-mission-viejo-ca | none | yes | 360x531 vs 360x531, exact |
| samsung-appliance-repair-oc | none | yes | 273.33x377.55 vs 273.33x377.55, exact |
| washer-repair-oc | none | yes | height differs by caption length only, benign |

**0 console errors and 0 warnings on all 7 pages at both viewports.**

**Image headers decoded with `sharp`, not read off the HTML:** all six new files match spec,
768x1024 for the jpg and full webp, 480x640 for the `-480w.webp`.

**Two methodology notes Assessment B raised, recorded so a re-test does not misread them:**

1. On `appliance-repair-mission-viejo-ca.html` the new image sits at y around 3141px and reports
   `img.complete === false` with no network request until scrolled to. That is `loading="lazy"`
   working correctly, not a broken image. After `scrollIntoView` it fetched 200 and decoded.
2. In this headless Chromium build, `naturalWidth`/`naturalHeight` on `<picture>`-sourced images
   sometimes returned the CSS layout width instead of the intrinsic size, inconsistently across
   repeated reads of the same element. Ground truth was taken two other ways instead: `new Image()`
   off-DOM against the raw URLs (returned 480x640 and 768x1024 correctly) and network status codes
   (200/304, no 404s).

**Defects: none.**

**Teardown:** own static server on port 5591, PID 31972, command line re-verified via
`Get-CimInstance Win32_Process` before the kill and confirmed gone after. No other process, port or
PID touched, and no command-line substring matching was used. `browser_close` called; the 8
`.playwright-mcp` snapshots this run wrote were deleted and the 10 pre-existing ones from another
session left alone.

---

## Verification of the alt text, done before the critique ran

Both photos were opened and read directly rather than described from their filenames. The Bosch
panel does read "SilencePlus 50 dBA", the counter is a speckled quartz and the floor is tile, so
that alt text stands as written. The Samsung alt originally said the washer stands beside a
"matching dryer"; the neighbouring unit is a visibly different control-panel generation and carries
no readable badge, so the claim was cut to "a white dryer" across all five surfaces before this
critique began. This is not a critique finding; it is recorded here because the corrected text is
what both assessments measured.

---

## Correction, after review

`/review` recounted the insertions and found this file said **seven** where the diff makes
**eight**: there are 7 touched files, but `pages/recent-repairs.html` gains two cards, the Bosch
and the Samsung, not one. Recounted independently and the reviewer is right. Corrected in both
places above.

Nothing load-bearing moved. The schema parity figure (53 cards / 53 `ImageObject`), the layout
measurements and the test results were all re-derived by the reviewer and matched to the decimal.
But this is the fourth miscount in this session's documents, and it landed in the one file whose
entire claim to authority is that its numbers were measured rather than inferred, so it is recorded
here rather than quietly patched.

The mechanism was the same each time: a count was carried across from an assessment's prose into a
summary sentence without being re-derived against the artifact. The rule that follows from it is
already written in the 2026-08-24 Corona snapshot and was not applied here: **re-derive every count
you copy, including from your own earlier work.** Writing it down twice has not been enough; the
cheap mechanical version is to count from the file with a command at the moment of writing the
sentence, not to remember a number from a paragraph above.
