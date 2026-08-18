---
target: pages/appliance-repair-corona-ca.html
total_score: 33
p0_count: 0
p1_count: 0
timestamp: 2026-08-18T19-03-04Z
slug: pages-appliance-repair-corona-ca-html
---
# /impeccable critique — pages/appliance-repair-corona-ca.html

Method: dual-agent (A: design review, isolated sub-agent · B: detector + browser evidence, isolated sub-agent)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | No :focus/:active state on .faq-q beyond browser default; no async ops on this page |
| 2 | Match System / Real World | 4 | Real freeways (CA-91, I-15), ZIP-to-neighborhood mapping, honest fee-differential explanation |
| 3 | User Control and Freedom | 3 | Breadcrumb exit path present; no back-to-top on a 14-section page |
| 4 | Consistency and Standards | 3 | Testimonial grid CSS correct via duplicated selector rather than by structure |
| 5 | Error Prevention | 3 | No forms on this page; tel/mailto correctly formatted |
| 6 | Recognition Rather Than Recall | 4 | Phone + Call CTA reachable at every scroll position (header, hero, sticky bar, CTA box) |
| 7 | Flexibility and Efficiency | 3 | Deep-linkable sections, clickable brand/service pills; appropriate for content type |
| 8 | Aesthetic and Minimalist Design | 3 | Clean and on-brand, but long and templated (14 sections) |
| 9 | Error Recovery | 3 | No error states exist on this static page |
| 10 | Help and Documentation | 3 | FAQ anticipates real doubts; no jump-to-FAQ on a long page |
| **Total** | | **33/40** | **Good** |

## Anti-Patterns Verdict

**LLM assessment (A):** Not AI-generated on first read. No gradient text, glassmorphism, side-stripe
borders, or identical icon+heading+text card grids. Copy is locally specific rather than templated:
named freeways, named neighborhoods tied to real ZIPs, real mileage (22 miles), a named landmark
cluster, and an actual rationale for the $120 vs $99 fee delta. Brushes against convention in two
places that are pre-existing site decisions rather than new tells: the shared site-wide hero image,
and the standard hub-page section order.

**Deterministic scan (B):** `detect.mjs --json pages/appliance-repair-corona-ca.html` exited 0 with
an empty array. Zero findings, and no suppressed-rule hits either. An independent em-dash grep was
run separately because the detector's `em-dash-overuse` rule only fires at 5 or more: **0 matches**
in the file.

**Where A and B agree, independently:** the new `:has()` orphan-centering works at every breakpoint.
B measured 1280px card 4 at x=489.16 (identical to card 2's column-2 position), 900px scrollWidth
885/900, 768px scrollWidth 753/768, 375px scrollWidth **360 < 375**. A independently measured
1280/800/375 and reached the same result. The 394px overflow trap documented in
testimonial-selection.md does not reproduce.

## Overall Impression

A competent, honest local-service hub whose strength is copy rather than composition. The single
biggest asset is the fee-differential FAQ; the single biggest opportunity is that the page is long
and templated, so it reads as "credible local business" rather than "distinctive".

## What's Working

1. **The fee-differential FAQ is exemplary trust-building copy.** "Why is the diagnostic fee $120 in
   Corona instead of the $99 you charge in Orange County?" is a question most businesses would hide.
   Answering it with a reason (dedicated technician, longer round trip) rather than a shrug does more
   for conversion confidence than the entire testimonials section.
2. **The 4-card orphan-centering is verified, not assumed.** Measured empirically at four viewports
   by two independent assessments, including the tablet band flagged as the danger zone by PR #687.
3. **Copy is locally specific rather than filler.** Real neighborhoods tied to real ZIPs, correct
   landmark facts, an explanation of which ZIPs are PO-box-only. Credible to a human and citable by
   an LLM.

## Priority Issues

**[P2] The mobile reset is correct by copy-paste, not by construction.**
- What: the 480px reset repeats the full `:has()` selector verbatim, tying on specificity and winning
  on source order. It works, measured.
- Why it matters: testimonial-selection.md documents this exact trap from 2026-07-28. Nothing in the
  code stops the next edit "simplifying" the reset to a lower-specificity selector, silently losing,
  and reintroducing mobile horizontal overflow.
- Fix: an explanatory comment above the reset. **Applied in commit 255640f.**
- Suggested command: $impeccable harden

**[P2] The 900-481px tablet band is correct by arithmetic, not by design.**
- What: card 4's `grid-column: 2` is never reset for the tablet range. It renders as a clean 2x2
  only because 4 cards in 2 columns forms one regardless of explicit placement.
- Why it matters: true today; not a guarantee. Adding a 5th card here requires merging the 5-card
  `:has()` block from testimonial-selection.md, whose tablet behaviour nobody has verified in
  combination with this page's breakpoints.
- Fix: no code change today; re-verify before this hub's testimonial count changes again.
- Suggested command: $impeccable harden

**[P3] Two list sections exceed comfortable chunk size.**
- What: 12 ungrouped symptom items in one grid; a 9-item "All Major Brands" pill row.
- Why it matters: exceeds the 4-per-group chunking guideline. These are scan-and-confirm lists
  rather than decision points, so the cost is mild friction rather than task failure.
- Fix: sub-group symptoms by appliance type, matching the pattern already used for brand tiers.
- Suggested command: $impeccable clarify

**[P3] `.t-initial` background is hardcoded inline on all four cards.**
- What: `.t-initial` carries only layout properties; each card repeats an inline background style.
- Why it matters: the value is correct and on-brand, so there is no visible defect, but a
  design-system colour change would require hunting every inline occurrence across every hub. This
  diff adds one more copy.
- Fix: move the background into `.t-initial` and drop the inline attributes.
- Suggested command: $impeccable harden

## Persona Red Flags

**Casey (distracted mobile user):** primary actions are in thumb reach via the sticky bar, verified at
375px. Red flag: the header phone number wraps mid-number and crowds the hamburger at 375px. Shared
nav chrome, not introduced by this diff, but it is the first thing Casey sees.

**Jordan (confused first-timer):** the fee-difference FAQ is a genuine win. Red flag: four reviews with
no city attached and no way to tell they are plausibly Corona-adjacent. This is the settled non-OC
location-label rule working as designed, and it has a real cost. Raised as a question, not a defect.

**Corona-specific stressed homeowner:** the page directly answers the "am I a second-class booking
because I am outside your main area" anxiety. Red flag: nothing in the testimonials signals work
actually done in Riverside County. A forward-looking backfill target once a corroborated local review
exists, not actionable today given the pool.

## Minor Observations

- The Riverside-rate rationale appears three times (AI block, pricing paragraph, FAQ). Repetitive but
  defensible for a skimming reader.
- Hero uses the shared site-wide hero image. A real technician-van or local-job photo would land
  harder on the one page where "do you actually serve my city" is the live question.
- Secondary copy uses the Dust value, not the failing Chalk value DESIGN.md warns about. Clean.

## Questions to Consider

- The fee-differential FAQ is this page's best asset. Should it also appear as a visible line near the
  pricing section rather than only inside the accordion?
- Would a neutral line above the testimonial grid ("reviews from across our Orange County and
  Riverside County service area") close Jordan's credibility gap without fabricating a location or
  touching the settled rule?
- The tablet-width correctness is an emergent property of "4 divides into 2". Is that worth a visual
  regression check before this hub's testimonial count changes again?
