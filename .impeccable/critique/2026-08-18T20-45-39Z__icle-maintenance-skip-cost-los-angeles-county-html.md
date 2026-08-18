---
target: articles/article-maintenance-skip-cost-los-angeles-county.html
total_score: 32
p0_count: 0
p1_count: 1
timestamp: 2026-08-18T20-45-39Z
slug: icle-maintenance-skip-cost-los-angeles-county-html
---
Method: dual-agent (A: afd9f9a8e940dda9d · B: a027566135eb05008)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Accordion icon rotates on open; TOC anchors have no scroll-spy/active-section indicator |
| 2 | Match Between System and Real World | 4 | Plain, grounded language ("coil brush," "fifteen minutes"), no unglossed jargon |
| 3 | User Control and Freedom | 3 | Accordion/breadcrumbs work; no "back to top" on a 10-section page |
| 4 | Consistency and Standards | 3 | Shares chrome/classes with sibling article, but the cost-table's meaning silently diverges from what the sibling and the title train the reader to expect |
| 5 | Error Prevention | 4 | Static content, no destructive actions; legal disclaimer pre-empts misreading the AB 628 section as legal advice |
| 6 | Recognition Rather Than Recall | 2 | References list has no inline citation markers tying specific claims to specific sources |
| 7 | Flexibility and Efficiency of Use | 3 | TOC anchors + sticky mobile CTA give a fast path; no scroll-spy or bulk affordances |
| 8 | Aesthetic and Minimalist Design | 3 | Restrained and well-organized, undercut slightly by uppercase-eyebrow proliferation (6 components) |
| 9 | Error Recovery | 3 | N/A-heavy page type; nothing to recover from, scored at a reasonable default |
| 10 | Help and Documentation | 4 | Strong FAQ + fully-cited references block with direct primary-source links |
| **Total** | | **32/40** | **Good** |

## Anti-Patterns Verdict

**Does this look AI-generated?** No, not on first read. This is the strongest signal in the whole critique.

**LLM assessment (Assessment A):** Checked every DESIGN.md absolute ban against the actual markup/CSS. Clean on gradient text, glassmorphism-as-decoration, identical icon-card grids, second accent color, cards-in-cards, and em dashes (zero found, correctly using `&ndash;` entities for price ranges). `.price-disclaimer`'s `border-left: 3px solid #d1d5db` is a technical side-stripe but neutral-gray and single-use, not a decorative brand-colored pattern — borderline, not a real violation. The one real, if muted, tell: the tiny-uppercase-tracked-eyebrow pattern (`.meta-tag`, `.article-toc__label`, `.references-block h3`, `.cost-table th`, `.footer-col-label`, `.related-card-cat`) recurs six times across the page. It reads as inherited site-wide chrome rather than something invented fresh for this page, which softens the verdict, but DESIGN.md bans exactly this as "default section grammar" and the pattern is present regardless of origin. The strongest positive tell: every one of the ~15 uses of the three ember shades (`#e84c1e` / `#cc3d12` / `#aa3210`) as text or background respects the project's own contrast rules with zero violations — raw Ember never carries text, Deep is background-only under white text, Deeper is text-only on light. That discipline is not what careless AI output looks like.

**Deterministic scan (Assessment B):** `node .agents/skills/impeccable/scripts/detect.mjs --json articles/article-maintenance-skip-cost-los-angeles-county.html` ran clean: `[]`, zero findings, no crash. No false positives to adjudicate since nothing fired.

**Independent em-dash check (orchestrator, per this run's specific requirement):** `grep -n '—' articles/article-maintenance-skip-cost-los-angeles-county.html` → **0 matches.** The detector's own `em-dash-overuse` rule only fires at 5+, which would have stayed silent even if the file carried 1-4; the raw count here is genuinely zero, not merely under the detector's threshold.

**Visual overlays:** No live overlay/injection was run this pass (Assessment B used direct Playwright measurement instead of the detect.js browser overlay); nothing to report as user-visible in a `[Human]` tab.

## Overall Impression

This is a well-executed, restrained brand-register article that earns its "Good" band honestly: sourcing discipline, color-contrast discipline, and emotional pacing around two genuinely high-stakes topics (a habitability law and a fire-risk statistic) are all handled with real care. The single biggest opportunity is also the one this run was specifically asked to adjudicate: the new `.cost-table` does not complete the argument its own title makes.

## What's Working

1. **Legal-disclaimer placement.** The "this is general information, not legal advice" notice sits at the very top of the AB 628 section, before any legal-sounding claim is made — right sequencing, defuses risk exactly where a reader would otherwise start drawing conclusions.
2. **Fire-risk statistic handled without alarmism.** Hard casualty/dollar numbers (7 deaths, $233M/year) are boxed with a plain statement of stakes and immediately followed by the cheap, concrete fix (a 15-30 minute vent cleaning) — serious without being hysterical, matching the brand's "clarity over cleverness" principle.
3. **Ember-palette contrast discipline.** All three brand-orange shades are used exactly per DESIGN.md's contrast rules across every occurrence in the file, with zero violations — a level of consistency that's easy to get wrong and wasn't here.

## Priority Issues

**[P1] The cost table doesn't earn the article's title**
- **What**: `.cost-table` (`<h2 id="cost-table">`, roughly line 570-620) has columns "Appliance / Common Repair / Typical Cost Range" — a generic repair-price list, not a cost-of-skipping-maintenance comparison.
- **Why it matters**: the title promises "The Real Cost of Skipping Appliance Maintenance in Los Angeles County." A reader who skims straight to the table, the highest-intent behavior this component exists to serve, sees only what a repair costs, never what the preventive task would have cost instead. The sibling Orange County article on the identical topic (`article-maintenance-skip-cost-statistics.html`, `#cost-comparison`, lines 588-630) already built the correct structure: a `Preventive task (annual)` column paired against a `Median major repair` column, with a follow-up paragraph that walks the reader through the delta ("the most expensive maintenance task on the list... is still cheaper than the cheapest major repair on the corresponding row"). The LA County table reuses the *repair* numbers from that same source material but drops the *maintenance* column and the delta framing entirely. That is a structural gap, not a matter of taste: the headline sells a cost comparison and the flagship visual element delivers half of one.
- **Fix**: rebuild the table as a two-column delta (preventive task vs. major repair) mirroring the OC sibling's structure, reusing the OC dollar figures already cited elsewhere on this page for the preventive side, or add a third column to the existing table rather than replacing it.
- **Suggested command**: `/impeccable clarify`

**[P2] Table of Contents is an unchunked 10-item flat list**
- **What**: `<nav class="article-toc">` lists all 10 sections in a single `<ol>` with no sub-grouping.
- **Why it matters**: violates the cognitive-load chunking guideline (≤4 items per group); a first-time reader deciding whether the article covers their situation faces a wall of undifferentiated links rather than a scannable shape.
- **Fix**: cluster into 2-3 visually separated groups (e.g., "The law & who pays," "What the data shows," "Cost & next steps").
- **Suggested command**: `/impeccable layout`

**[P2] References are never linked from the specific claims they support**
- **What**: body prose names sources inline ("The National Fire Protection Association tracked...") but no sentence links to a specific numbered item in `#references`.
- **Why it matters**: a Recognition-rather-than-recall gap — a skeptical reader (landlord or tenant checking a specific number before acting on it) has to re-scan the whole references block instead of clicking a marker next to the claim.
- **Fix**: add superscript numbered anchors (`<sup><a href="#ref1">1</a></sup>`) at each cited statistic.
- **Suggested command**: `/impeccable harden`

**[P3] No scroll-spy or return-to-top on a long page**
- **What**: TOC anchors jump to sections but never indicate the current one; there's no back-to-top affordance across ~250 lines of body copy and 10 sections.
- **Why it matters**: minor navigation-recall friction, particularly once a reader has scrolled to the FAQ or references and wants to jump back to a specific earlier section.
- **Fix**: lightweight IntersectionObserver active-state on TOC links, or at minimum a floating back-to-top control.
- **Suggested command**: `/impeccable polish`

**[P3] `.price-disclaimer` text color sits at the edge of the project's own contrast floor**
- **What**: `color: #6b7280` on `background: #f9fafb`, 12px italic.
- **Why it matters**: DESIGN.md's stated floor for secondary text is 5.48-5.74:1 (Dust `#666`); `#6b7280` is close to but likely under that floor even if it clears generic WCAG AA by a hair, and italic+12px makes any shortfall harder to read in practice.
- **Fix**: swap to Dust `#666` to guarantee the project's own stated floor rather than the generic AA minimum.
- **Suggested command**: `/impeccable harden`

## Persona Red Flags

**Jordan (Confused First-Timer)**
- The 10-item, unglossed TOC ("What AB 628 Changes," "What Consumer Reports' Data Says") gives no quick signal of whether the article even applies to Jordan's situation before committing to reading it.
- The cost table, read on its own without the paragraph above it, presents as verified LA-County-specific pricing; only the preceding prose (easy to skim past) discloses it's reused Orange County data with just the diagnostic fee swapped in.
- The content clearly serves two different readers (landlord vs. tenant) with no visual split or "which one are you" cue — Jordan has to read the whole article to find the half that applies to them.

**Casey (Distracted Mobile User)**
- `.cost-table-wrap` scrolls horizontally on mobile (confirmed by Assessment B's 375px measurement: wrap `clientWidth` 320px vs. table `offsetWidth` 560px) with no visible scroll affordance, no fade edge, no arrow, no "swipe" hint, so nothing signals to Casey that more columns exist off-screen.
- At the 480px breakpoint the hero `h1` drops to 24px while meta pills and byline stay at 11-12px directly above it over a background photo, a dense stacked-text moment at the smallest breakpoint worth a real-device legibility check even though Assessment B found no horizontal page overflow there.

## Minor Observations

- `.callout-green` is defined in the CSS but never used in this page's markup, harmless dead weight worth a cleanup pass if it's unused site-wide too.
- The cost table mixes a flat service fee ("Diagnostic visit (LA County) — $99") into a "Typical Cost Range" column alongside genuinely variable repair ranges, a small category mismatch inside one table.
- The references block itself is strong: 7 citations with direct primary-source links (NFPA, USFA/FEMA, Energy Star, Consumer Reports, DOE, CA Legislature, Census Bureau), each annotated with exactly what it supports. It just isn't linked from the claims it backs (see P2 above).
- All JSON-LD dates use full ISO 8601 with UTC offset per the project's standing rule; the GA tag is correctly the first child of `<head>`.

## Deterministic + Browser Evidence Detail

- `detect.mjs --json`: `[]` (zero findings, clean run, no crash).
- 1280px: no horizontal overflow (`scrollWidth` 1265 vs `innerWidth` 1280); cost table fits `.cost-table-wrap` without internal scroll at this width.
- 768px: no horizontal overflow (`scrollWidth` 753 vs `innerWidth` 768); same, fits without internal scroll.
- 375px (the case this run specifically had to confirm): no page-level horizontal overflow (`scrollWidth` 360 vs `innerWidth` 375, `overflow-x` genuinely `visible` not force-masked); `.cost-table-wrap` correctly contains the oversized table (`clientWidth` 320 vs table `min-width`/`offsetWidth` 560) via its own `overflow-x: auto`, verified both via measurement and a cropped screenshot showing clean containment with no page-level scrollbar. The table is readable and scrolls within its own container as designed, not forcing the page to scroll sideways.
- Nav, hamburger, hero, sticky mobile CTA bar, and FAQ accordion structural markup all present and undamaged at 375px (structural presence checked; full click-through interaction wasn't in scope for this pass).

## Questions to Consider

- The sibling Orange County article on this exact topic already built the "preventive task vs. major repair" comparison table this article's title demands. Why wasn't that structure reused directly instead of shipping a table that only answers half the question?
- The article states outright it has no LA-County-specific cost page and reuses OC numbers with only the diagnostic fee swapped in. At what point does a "county hub" article stop being genuinely county-specific and become an OC page with a find-and-replace on the county name?
- DESIGN.md explicitly bans uppercase-tracked eyebrow labels as default section grammar, yet six components on this one page use that exact pattern. Is it grandfathered as established site-wide vocabulary the ban doesn't reach, or is every new page quietly re-committing an anti-pattern the design system already flagged?
