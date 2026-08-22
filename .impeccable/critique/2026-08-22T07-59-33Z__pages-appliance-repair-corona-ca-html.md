---
timestamp: 2026-08-22T07-59-33Z
slug: pages-appliance-repair-corona-ca-html
---
# Critique — uniform $99 fee + Corona coverage softening (PR #772)

Method: dual-agent (Assessment A and Assessment B run as two isolated sub-agents). NOT degraded.
Targets: pages/appliance-repair-corona-ca.html (primary), pages/service-areas.html, index.html.

## Design Health Score: 30/40

| # | Heuristic | Score |
|---|---|---|
| 1 | Visibility of System Status | 4 |
| 2 | Match System / Real World | 3 |
| 3 | User Control and Freedom | 3 |
| 4 | Consistency and Standards | 2 |
| 5 | Error Prevention | 4 |
| 6 | Recognition Rather Than Recall | 4 |
| 7 | Flexibility and Efficiency | 3 |
| 8 | Aesthetic and Minimalist Design | 3 |
| 9 | Error Recovery | 4 |
| 10 | Help and Documentation | 4 |
| **Total** | | **30/40** |

## Anti-Patterns Verdict
Copy-only diff; no new elements, classes or visual structures. No Absolute Ban triggered.
Deterministic scan (detect.mjs): 2 `design-system-font` warnings on index.html (Brush Script Mt
line 141, Georgia line 385), both PRE-EXISTING on lines this branch does not touch. Corona and
service-areas returned zero findings.

## Findings and disposition
- P0 pages/appliance-repair-corona-ca.html:751 — "How It Works" step 2 still promised
  "same-day when that schedule is open", contradicting every other surface. FIXED.
- P1 the next-available clause repeated 6x verbatim on one page. PARTLY FIXED (CTA reworded);
  the hero/AI-block/FAQ/schema repeats are intentional consistency.
- P2 the replacement FAQ buried its strongest line. FIXED, now leads with
  "next available, usually within a day or two, not same-day".
- P3 three phrasings for the technician's base on one page. FIXED, now one.

## Evidence (Assessment B)
- 147 `$120` occurrences repo-wide, every one a repair COST ESTIMATE, zero company-fee
  statements. CI regex confirmed scoped to the word "fee" so cost estimates cannot trip it.
- 375x812: scrollWidth 360 vs innerWidth 375. 1440x900: 1425 vs 1440. No overflow.
- 0 console errors. FAQ 6 items, replaced question opens correctly.
- Sub-44px anchors: .hero-rating (30px) and .brand-pill (34px) only, both baselined debt.

## Known gap in this run, recorded rather than hidden
Assessment B's two DIFF-based greps ran before the work was committed, so `git diff master...HEAD`
compared nothing and those two checks proved less than they appeared to. Its file-level sweep and
browser evidence read the real working tree and stand. The em-dash check and the index.html edit
were re-verified directly against the working tree afterwards.
