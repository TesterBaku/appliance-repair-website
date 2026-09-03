---
target: "articles/article-sub-zero-repair-cost-orange-county.html (PR #797 diagnostic-fee cross-links)"
total_score: 28
p0_count: 0
p1_count: 1
timestamp: 2026-09-03T19-53-18Z
slug: es-article-sub-zero-repair-cost-orange-county-html
---
Method: dual-agent (A: general-purpose/sonnet · B: general-purpose/sonnet)

Target: `articles/article-sub-zero-repair-cost-orange-county.html`
Scope: PR #797 follow-up edits — the worked cost example ("$99 + $600 = $600, not $699"), the "About the first row" paragraph's new closing cross-link, and the cost table's row-1 Notes-cell cross-link, both pointing to `#diagnostic-fee`.

#### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Anchor jump lands with the destination `<h2 id="diagnostic-fee">` hidden behind the site's 71px fixed header at both 1440px and 375px — no `scroll-margin-top` on headings. Pre-existing (the TOC link had the same bug), but this diff adds two more entry points into it. |
| 2 | Match Between System and Real World | 4 | The $99+$600=$600-not-$699 example matches exactly how a homeowner reasons about the bill. |
| 3 | User Control and Freedom | 2 | Clicking the table-cell link pulls the reader out of the cost-comparison table with no "back to table" affordance. |
| 4 | Consistency and Standards | 2 | Three link-color systems coexist in this one article: default UA blue/underline (the two new links + most body links), a bespoke #1e40af (callout box link), and brand rust/orange (TOC links) for the same "in-page link" role. |
| 5 | Error Prevention | 3 | The cross-reference actively prevents a real misreading (flat $99 fee vs. the table's $95–$150 market-range row). |
| 6 | Recognition Rather Than Recall | 3 | Link text is descriptive ("our own flat fee," "the diagnostic-fee section above"); intent is clear without hovering. |
| 7 | Flexibility and Efficiency | 3 | Unchanged from baseline; TOC and table still work independently. |
| 8 | Aesthetic and Minimalist Design | 3 | Clean, no clutter added; the price-pill table stays legible at both widths. |
| 9 | Error Recovery | 3 | Nothing new can fail structurally (no forms/destructive actions). |
| 10 | Help and Documentation | 3 | The cross-linking is itself a lightweight, working "help" pattern. |
| **Total** | | **28/40** | **Good** |

This is a scoped diff score (two paragraphs + one table cell) on an article previously critiqued at 27/40 with zero FAILs; the delta is net-neutral-to-slightly-positive except for the header-occlusion finding, which both assessments' evidence supports.

#### Anti-Patterns Verdict

**LLM assessment**: Not AI slop. The worked example is specific and correctly computed, not a vague platitude, and the cross-references solve a real reader-confusion point (flat fee vs. table range) rather than adding filler.

**Deterministic scan**: `node .agents/skills/impeccable/scripts/detect.mjs --json articles/article-sub-zero-repair-cost-orange-county.html` → `[]`, exit code 0. Zero findings, zero false positives.

**Browser evidence**: Both new links are present in the DOM with `href="#diagnostic-fee"`, resolve to the existing `<h2 id="diagnostic-fee">`, and render as standard blue/underlined text in both the paragraph and the table-cell context, at both 1440px and 375px — consistent with the article's other unstyled body links (this article carries no `<link>` to `shared.css`, so `.article-body a` brand styling never applies here; confirmed pre-existing and site-wide, not a regression). Programmatic click-navigation confirmed `location.hash` updates and the page scrolls the heading to `top ≈ 0px` — which is exactly the geometry Assessment A used to confirm the header-occlusion problem (heading lands at `top: -0.28` to `0.4`, under a `71px` fixed header with `scroll-margin-top: 0`). The row-1 Notes cell wraps cleanly to 2–3 lines at 375px with no overflow, no horizontal scroll, and no broken column layout; the link portion wraps to its own line, still underlined/blue and clearly tappable. No `:target` CSS rule exists anywhere on the site, so there's no arrival highlight for any anchor link — a site-wide characteristic, not specific to this change. Live overlay injection was skipped as optional/best-effort per the task scope; the CLI scan plus dual-viewport screenshots are the load-bearing evidence and both are clean.

#### Overall Impression

The content change is a clean, well-reasoned win: it closes a real logical gap between the table's market-range row and the flat-fee prose, with correctly-linked, correctly-styled, non-overflowing cross-references in both directions. The one real defect surfaced by testing this specific interaction — the destination heading hidden behind the fixed header — is structural and pre-existing, not introduced by this diff, but this diff does materially increase how often a reader hits it (two new entry points, on top of the existing TOC link).

#### What's Working

1. **The worked example is exactly the right level of concrete** — "$99 + $600 = $600, not $699" answers the reader's actual mental math in one sentence.
2. **The cross-links close a real comprehension gap** for a reader scanning only the table, who would otherwise have no way to know the row-1 range and the flat $99 fee mentioned elsewhere are related but distinct figures.
3. **Mobile table resilience** — the Notes cell absorbs a materially longer sentence without breaking column proportions or triggering horizontal scroll at 375px; this is a tested, robust layout, not a lucky one-off.

#### Priority Issues

- **[P1] Anchor-link destination hidden behind fixed header**
  **Why it matters**: Every click on either new link (and the pre-existing TOC entry) scrolls `#diagnostic-fee` to the very top of the viewport, directly under the 71px fixed header, at both widths. The reader lands mid-paragraph with the heading invisible — a visibility-of-system-status failure, worsened by this diff adding two more funnel points into it.
  **Fix**: Add `scroll-margin-top: 80px` (or the header's computed height plus a buffer) to headings site-wide, or at minimum to `#diagnostic-fee`.
  **Suggested command**: `/impeccable harden`

- **[P2] No "return to table" path after the Notes-cell jump**
  **Why it matters**: A reader comparing rows who clicks "our own flat fee" is taken out of the table entirely; they must scroll back manually or hit browser-back to resume comparing.
  **Fix**: Either avoid the jump for this specific case (tooltip/inline expand instead) or accept it as low-cost once the P1 fix makes the landing legible.
  **Suggested command**: `/impeccable clarify`

- **[P3] Three inconsistent link-color systems in one article**
  **Why it matters**: The two new links use plain UA-default blue+underline; the TOC links use brand rust/orange with no underline; the callout-box link uses a third blue (#1e40af). Not introduced by this diff, but it adds two more instances of the "default blue" pattern, deepening an existing inconsistency.
  **Fix**: Define one `.article-body a` treatment (brand color + underline) and apply it site-wide instead of leaving inline prose links unstyled.
  **Suggested command**: `/impeccable polish`

- **[P3] `:visited` state goes default purple with no brand override**
  **Why it matters**: Once a reader follows either new anchor, it turns default purple on return visits; one more instance of the unstyled-inline-link gap above.
  **Fix**: Fold into the same link-color pass as the P3 above.
  **Suggested command**: `/impeccable polish`

#### Persona Red Flags

**Jordan (First-Timer)**: Clicks "our own flat fee" expecting the diagnostic-fee explanation to appear; the page jumps but the first visible text is mid-sentence prose with no heading in view — a cautious first-timer may wonder if the click did anything.

**Riley (Deliberate Stress Tester)**: Would specifically test "click the table link, then try to get back to comparing rows" (the P2 flow), and would note the table-cell link and the paragraph link point to the identical anchor with no differentiated outcome — a minor but real catch.

**Casey (Distracted Mobile User)**: The header-occlusion (P1) is exactly the class of ambiguous, invisible-cue failure this persona is most vulnerable to on a fast tap-and-scroll.

#### Minor Observations

- The table's price-pill green background reads as "positive," an odd association for cost figures — pre-existing, outside this diff's scope.
- "our own flat fee" is good, brand-voiced copy against the generic "market range" language in the same cell.
- The worked example repeats "$99" across two nearby sentences (About-the-first-row paragraph and the example itself) — mildly redundant, not worth fixing.

#### Questions to Consider

- If the fixed-header occlusion is fixed via `scroll-margin-top` site-wide, does it need a broader regression check across other anchor-heavy pages (FAQ jump links, other article TOCs)?
- Is a same-page jump the right pattern for the table-cell cross-reference, or would a tooltip preserve table-scanning context better for a reader actively comparing rows?
- Is unifying link color worth doing as a standalone site-wide pass, now that this diff adds two more instances of the article-body "default blue" treatment sitting next to two other treatments in the same scroll?
