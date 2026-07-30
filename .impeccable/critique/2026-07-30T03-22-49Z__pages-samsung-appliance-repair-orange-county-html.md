---
target: pages/samsung-appliance-repair-orange-county.html
total_score: 34
p0_count: 0
p1_count: 0
timestamp: 2026-07-30T03-22-49Z
slug: pages-samsung-appliance-repair-orange-county-html
---
⚠️ DEGRADED: single-context (sub-agent spawning disallowed by session operator instructions)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | FAQ accordion + nav dropdown give state; cards now have `:hover` and `:focus-within`. No status affordance needed elsewhere on a static page. |
| 2 | Match System / Real World | 4 | Symptom-first labels ("Dryer Not Spinning", "Drain Repair (5C Error)") speak the homeowner's language, not the trade's. |
| 3 | User Control and Freedom | 3 | Back/nav always available; FAQ collapsible. No trap states. |
| 4 | Consistency and Standards | 4 | Was the defect. The job band had drifted from the dryer-hub reference; now byte-level parity on CSS + markup. |
| 5 | Error Prevention | 3 | No forms on this page; all internal hrefs resolve (link checker green). |
| 6 | Recognition Rather Than Recall | 4 | Nothing icon-only; brands, cities, and services all spelled out. |
| 7 | Flexibility and Efficiency | 3 | Four conversion paths (header tel, nav CTA, sticky bar, in-band cross-links). |
| 8 | Aesthetic and Minimalist Design | 3 | Band is clean and earns its space; the three real photos differ in lighting/framing. |
| 9 | Error Recovery | 3 | n/a for a static page; no dead ends. |
| 10 | Help and Documentation | 4 | 8+ FAQs, phone, service cross-links, and now "See all recent repairs". |
| **Total** | | **34/40** | **Good** |

## Anti-Patterns Verdict

**Does this look AI-generated?** No.

**LLM assessment**: The band is the opposite of the slop pattern. It is three real job photos from named cities with real symptom labels, not an icon+heading+text card grid. The kicker was the one genuine tell in the pre-fix state, and not for the usual reason: the "tiny uppercase tracked eyebrow" ban targets a decorative eyebrow above every *section*, whereas this is a per-card metadata label ("SAMSUNG · WASHER") that carries actual information. What was wrong was the color, not the existence: it took `var(--brand-text)` (ember `#e84c1e`), spending the brand's action color on a static label. DESIGN.md reserves orange for clickable or critical elements. Now `var(--text-sub)` (`#666`), which measures 5.74:1 on white, above the 4.5:1 AA floor.

**Deterministic scan**: `detect.mjs --json pages/samsung-appliance-repair-orange-county.html` → `[]`, exit 0. Zero findings. Note the project's `.impeccable/config.json` suppresses five rules (`design-system-{color,font-size,radius}`, `overused-font`, `single-font`) as documented stale-sidecar / deliberate-brand suppressions, so this clean result covers the real anti-pattern rules (gradient text, side-stripes, glassmorphism, em dashes, contrast, hero-metric) but not design-system drift. I checked palette drift by hand instead: the band uses only `--surface`, `--brand`, `--brand-text`, `--text-primary`, `--text-sub`, all DESIGN.md tokens.

**Visual overlays**: Not attempted. Injection-based overlay was skipped in favor of direct measurement via Playwright `evaluate` at 375px and 1280px; no user-visible overlay exists, and I am not claiming one. Fallback signal: quantitative geometry + hit-testing + `currentSrc` resolution, reported below.

## Overall Impression

This band was already the right idea (real proof-of-work beats stock imagery for a stressed homeowner deciding whether to let someone into their house) but it had been built to an earlier spec than the dryer hub, so it under-delivered on its own affordance. Every card *looked* clickable and only a 188×15px text run actually was. That is fixed, and the measured tap area is now the full 296×378px card.

Biggest remaining opportunity is not on this page: the shared header at 375px.

## What's Working

1. **The proof band earns its place.** Three real photos, three real cities, three real symptoms, each cross-linking to the matching service hub. This directly serves design principle #1 ("Trust before pitch") and gives the page internal-link equity to washer/oven/dryer hubs.
2. **Symptom-first card titles.** "Drain Repair (5C Error)" is the phrase a Samsung owner actually types into Google. The kicker/title/location stack reads in the order a worried homeowner asks: what brand, what went wrong, was it near me.
3. **The stretched-link overlay is documented, not just implemented.** The CSS comment names the Bootstrap precedent, states the text-selection trade-off, and pre-empts the wrong fix (`.job-card-body { position: relative }`). That is the difference between a fix and a fix that survives the next contributor.

## Priority Issues

- **[P2] Shared header cramps at 375px.** The brand name wraps to two lines and the phone number to three, consuming roughly the top 55px of the mobile viewport before any content.
  - **Why it matters**: Casey (distracted mobile user) is the majority visitor per PRODUCT.md, and this is the first thing rendered. It reads as a broken template on the highest-traffic viewport.
  - **Fix**: Shorten the mobile brand lockup (mark or single-line wordmark) and/or render the header phone as an icon + "Call" at ≤480px, since the sticky bar already carries the full number.
  - **Out of scope here**: this is `partials/nav-main.html`, injected into all 148 pages. Fixing it in this branch would restamp every page and bury a one-band fix inside a site-wide diff.
  - **Suggested command**: `$impeccable adapt partials/nav-main.html`

- **[P3] Stretched-link overlay blocks text selection on the card body.** Accepted and documented trade-off; the overlay sits above the title/location text.
  - **Why it matters**: A homeowner who wants to copy "Buena Park, CA" or the error code can't. Low impact because all three lines are duplicated in the link text and image alt.
  - **Fix**: If ever wanted, constrain the overlay to the photo band with `inset: 0 0 auto 0; height: 260px` (already written into the comment as the sanctioned escape hatch).
  - **Suggested command**: none; leave as-is.

- **[P3] A misnamed sibling asset is a trap for the next contributor.** `completed-repair-oven-samsung-double-wall-install-newport-beach-800w.webp` is actually **768×1024**, not 800w, and is referenced nowhere.
  - **Why it matters**: The obvious next move for someone adding responsive sources to this photo is to wire that file up as an `800w` candidate. That would hand the browser a false width and defeat the `sizes` calculation. I deliberately generated a genuine `-480w.webp` (480×640) rather than reuse it.
  - **Fix**: Delete the misnamed file, or regenerate it at a true 800px width. Left untouched here because it is unreferenced and deleting a committed asset is outside a job-band fix.
  - **Suggested command**: none; separate chore PR.

- **[P3] The three job photos differ in exposure.** The oven shot is markedly darker than the washer and dryer shots.
  - **Why it matters**: Mild inconsistency in a band whose whole job is to look credible. Real photos beat matched stock, so this is a deliberate trade, not a bug.
  - **Fix**: A light exposure lift on the oven photo would even the row without faking anything.
  - **Suggested command**: none; asset-level, not code.

## Persona Red Flags

**Casey (Distracted Mobile User)** — the primary persona for this site.
- *Fixed by this change*: the card tap target went from 188×15px to 296×378px. Previously a thumb aimed anywhere at the photo did nothing; three of the band's three conversion paths were effectively dead on a phone.
- *Fixed by this change*: the oven card was shipping a 768×1024 image into a 360px slot. It now serves 480×640, verified via `currentSrc`.
- *Still failing*: the header eats ~55px at the top with a wrapped brand name and a three-line phone number (P2 above).
- *Passing*: sticky Call/Book bar present and thumb-reachable; no horizontal scroll (scrollWidth 360 ≤ 375).

**Sam (Accessibility-Dependent User)**
- *Fixed by this change*: the decorative `→` is now wrapped in `<span aria-hidden="true">`, so a screen reader announces "See our washer repair service" instead of "See our washer repair service right arrow".
- *Fixed by this change*: `.job-card:focus-within` gives a visible 2px outline, so keyboard focus on the card link is now visible at card level rather than on a 15px text run.
- *Passing*: all three images carry descriptive alt text naming appliance, brand, job, and city. Kicker contrast 5.74:1, above AA.
- *Watch*: the `:focus-within` outline uses `var(--brand)` on a white card, which is a color-only focus cue; the 2px width plus `outline-offset: 3px` carries it, but it is worth confirming against a 3:1 non-text contrast check.

**Jordan (Confused First-Timer)**
- *Fixed by this change*: the band was previously a dead end for anyone wanting more proof. "See all recent repairs →" now routes to the full gallery, matching the dryer hub.
- *Passing*: no jargon beyond "5C Error", which is immediately disambiguated by the plain-language title "Drain Repair".

## Minor Observations

- `.job-see-all` measures exactly 44px tall — at the WCAG/HIG floor, not above it. Fine, but it has no headroom if the font size is ever nudged down.
- The kicker's `#666` is exactly the project's stated minimum for meaningful text on white. Also no headroom.
- Card height is uniform at 378px across all three because the titles happen to be one line each. A two-line title on a future card will desync the row; `.job-card-body` has no min-height.
- The band's intro paragraph restates all three jobs in prose immediately above the cards. Slightly redundant, but it is the LLM-liftable summary the SEO rules ask for, so the duplication is intentional.

## Questions to Consider

- The dryer hub and this hub are now identical implementations of the same band. That is two copies of ~35 lines of CSS. At the third hub, is this a `shared.css` component rather than a per-page block?
- The band cross-links to service hubs by appliance. Would linking to the *city* page instead (as the dryer hub does) convert better for a brand-hub visitor, or does brand→appliance match intent more closely?
- Three cards is one clean row. When a fourth Samsung job photo arrives, does this band adopt the testimonial grid's orphan-centering rules, or cap at three and lean on "See all recent repairs"?
