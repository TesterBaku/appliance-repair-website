---
target: "branch content/article-lifespan-doe-thresholds: 22 articles + pages/blog.html copy-only DOE lifespan/threshold diff"
total_score: 31
p0_count: 0
p1_count: 1
timestamp: 2026-09-03T05-13-41Z
slug: ticles-pages-blog-html-copy-only-lifespan-doe-diff
---
Method: dual-agent (A: Impeccable Assessment A design review, sub-agent id a984d8a66ade319eb, sonnet · B: Impeccable Assessment B detector scan, sub-agent id a46e962e2d4f3cb63, sonnet)

Target: branch content/article-lifespan-doe-thresholds (commit bfa976a on master 8064a24). 22 articles/article-*.html files plus pages/blog.html. Copy-only edit: lifespan figures and repair-or-replace age thresholds in FAQ text and their JSON-LD FAQPage twins, a few prose sentences and bullets, date-bump metas, and 22 blog-card dates on pages/blog.html now reading "Updated September 2026". No CSS or structural change.

## Design Health Score (per sampled page)

### articles/article-gas-vs-electric-range-repair-cost-orange-county.html: 31/40 (Good)

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Static page, sticky nav/CTA confirms location |
| 2 | Match System / Real World | 4 | Plain language, DOE citation adds authority without jargon |
| 3 | User Control and Freedom | 3 | Standard nav, no dead ends |
| 4 | Consistency and Standards | 4 | All age/lifespan numbers agree across prose, JSON-LD, and visible FAQ |
| 5 | Error Prevention | 3 | n/a for static content |
| 6 | Recognition Rather Than Recall | 3 | FAQ answers self-contained |
| 7 | Flexibility and Efficiency | 2 | No in-page jump nav for a long article (pre-existing) |
| 8 | Aesthetic and Minimalist Design | 3 | Consistent with brand system |
| 9 | Error Recovery | 3 | n/a |
| 10 | Help and Documentation | 3 | FAQ plus inline CTA |
| **Total** | | **31/40** | **Good** |

### articles/article-refrigerator-repair-cost-orange-county.html: 33/40 (Good)

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | n/a for static page |
| 2 | Match System / Real World | 4 | "Quick gut check" callout translates the 50 percent rule into a plain heuristic |
| 3 | User Control and Freedom | 3 | Standard |
| 4 | Consistency and Standards | 4 | All four "11 years" mentions match verbatim (JSON-LD, prose, callout, visible FAQ) |
| 5 | Error Prevention | 3 | n/a |
| 6 | Recognition Rather Than Recall | 4 | Callout restates the decision rule near the CTA |
| 7 | Flexibility and Efficiency | 2 | No jump-to-FAQ anchor from the callout (pre-existing) |
| 8 | Aesthetic and Minimalist Design | 3 | Consistent card/callout styling |
| 9 | Error Recovery | 3 | n/a |
| 10 | Help and Documentation | 4 | Callout, FAQ, and CTA layer well |
| **Total** | | **33/40** | **Good** |

### articles/article-fridge-not-cooling-la-habra.html: 31/40 (Good)

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | n/a for static page |
| 2 | Match System / Real World | 4 | Symptom-first framing matches how a homeowner actually searches |
| 3 | User Control and Freedom | 3 | Inline link to the La Habra hub gives a clear next step |
| 4 | Consistency and Standards | 4 | Both instances of the updated figure match verbatim |
| 5 | Error Prevention | 3 | n/a |
| 6 | Recognition Rather Than Recall | 3 | FAQ answer is self-contained |
| 7 | Flexibility and Efficiency | 2 | Same pre-existing lack of jump nav |
| 8 | Aesthetic and Minimalist Design | 3 | Consistent with brand system |
| 9 | Error Recovery | 3 | n/a |
| 10 | Help and Documentation | 3 | FAQ plus local-hub link |
| **Total** | | **31/40** | **Good** |

No FAIL on any sampled page. All internal age/lifespan claims on each page (prose, visible FAQ text, and JSON-LD FAQPage twin) were checked pairwise and agree verbatim; no on-page numeric contradiction was found.

## Anti-Patterns Verdict

**LLM assessment (Assessment A):** No AI slop tell on any of the three sampled pages. Copy reads as genuine local-service content; the DOE citation on the range article is a specific, checkable source rather than vague "studies show" filler. No gradient text, no generic icon-grid additions, no template smell introduced by this diff.

**Deterministic scan (Assessment B):** `node .agents/skills/impeccable/scripts/detect.mjs --json` run over all 23 changed files in one pass. Exit code 2 (findings present). Total 3 findings, all rule `numbered-section-markers` (advisory severity, snippet "Sequence: 10, 11, 12"):

| File | Count | Pre-existing on master? |
|---|---|---|
| pages/blog.html | 1 | Yes, pre-existing (identical finding on the master copy, unrelated to this diff) |
| articles/article-dryer-repair-cost-orange-county.html | 1 | No, new on branch |
| articles/article-fridge-not-cooling-fountain-valley.html | 1 | No, new on branch |

Pre-existing check method: `git show master:<path>` extracted to a temp file outside the repo, re-scanned with the same detector. The blog.html hit reproduces identically on master. The other two files scan clean (exit 0, no findings) on their master copies.

Root cause of the 2 new findings: both are false positives caused by this branch's own numeric copy edit, not a real editorial-scaffold anti-pattern. Both articles change a DOE lifespan reference from "10 years old" to "11 years old" inside FAQ or schema text. Grepping the file for the digits 10 to 12 shows they are scattered, unrelated numeric mentions ($10 parts, "11 years old", a $10 to $30 price range, a March 2024 citation date), not an actual "01 / 02 / 03" section-marker UI element rendered anywhere in either file. The 10 to 11 edit coincidentally created a 10-11-12 numeric adjacency that the heuristic misreads as a sequence. No rendered numbered-marker element exists in either file. These 2 findings should be treated as false positives, not new anti-patterns introduced by this PR. The remaining 20 of 23 changed files scan clean (0 findings each).

**Visual overlays:** No console-message overlay injection was attempted (this is a copy-only diff with no CSS/DOM change, so the CLI scan plus a page-load and console sanity check served as primary evidence, per the reference doc's provision for skipping the overlay step). Browser evidence pass (Playwright, server at http://localhost:8801) covered 5 pages: the two files with new detector hits, the blog.html hit, and two other changed articles. All returned HTTP 200 with correct titles and no visible breakage. Console clean on 4 of 5; one page showed a single unrelated hero-image preload timing warning, not a rendering failure and not a detector finding.

## Overall Impression

A clean, professional, copy-only content update. Every changed lifespan and repair-or-replace figure was verified consistent across its own page (prose, visible FAQ, and JSON-LD twin). The detector's only new findings on this branch are two false-positive misreads of ordinary digits in the updated copy, confirmed by diffing against master, not a real design regression. No FAIL anywhere in this scope.

## What's Working

- **Numeric consistency discipline held under a 22-file sweep.** Every page checked had its visible-text and JSON-LD-schema figures updated together and verbatim; the site's established "twin" pattern (schema mirrors visible copy) survived a batch edit across very different article templates without drifting.
- **Decision aids stay concrete.** The refrigerator-cost article's "Quick gut check" callout and the range article's DOE citation both give the reader an actionable, source-backed number rather than vague guidance, which is exactly the kind of copy that reads as genuinely useful rather than templated.
- **Symptom-first framing on the fridge-not-cooling article** matches how an anxious homeowner actually searches and reads, and pairs the reassurance with a concrete next step (the local hub link).

## Priority Issues

- **[P1] The refrigerator-cost callout's 8 to 11 year gap is more exposed after this edit.** `articles/article-refrigerator-repair-cost-orange-county.html`: the callout reads "Under 8 years old and the repair is under $400? Repair... Over 11 years old and looking at a compressor or a board? Get the diagnosis..." Moving the upper bound from 10 to 11 widened the unaddressed middle band from a 2-year gap to a 3-year gap, with no guidance for, say, a 9-year-old fridge with a $600 repair. Not a factual contradiction, an omission made slightly worse by the edit. Fix: add one clause covering the 8 to 11 middle case. Suggested command: `$impeccable clarify`.
- **[P2] Two sibling articles frame the same "11 years" figure from opposite directions.** `article-refrigerator-repair-cost-orange-county.html` states "more than about 11 years old, replacement usually wins" (a replace-threshold framing) while `article-fridge-not-cooling-la-habra.html` states "under about 11 years old the repair is well worth it" (a repair-is-worth-it framing). Logically compatible (same crossover point, opposite sides), but a reader who lands on both would see the identical number framed oppositely. Verify both are sourced from the same DOE figure, then reconcile the framing if these ever get cross-linked. Suggested command: `$impeccable clarify`.
- **[P2] The range article states a replace-threshold (12 years) and an average-lifespan figure (14.5 to 16.8 years, DOE-sourced) two paragraphs apart without reconciling them.** A careful reader could ask why replacement is worth considering at 12 years if the average lifespan is 14.5 to 16.8 years; the two numbers measure different things (repair economics vs. an unconditional average) but the page never says so. Fix: add a clause distinguishing the two claims. Suggested command: `$impeccable clarify`.
- **[P3] Narrowing "12 to 15 years old" to a single point value "11 years old" on the fridge-not-cooling article loses the previous range's built-in hedge.** If the underlying DOE source is itself a range rather than a single figure (as it is on the sibling range article, 14.5 to 16.8 years), presenting "about 11 years old" as a point value may overstate precision. Confirm against the source before treating this as settled. Suggested command: `$impeccable clarify`.
- **[P3] No inline source link for the DOE citations.** The range article names "the U.S. Department of Energy's 2024 rulemaking" in FAQ text with no footnote or link; the refrigerator-cost and fridge-not-cooling articles do not name a source at all for their updated figures, an inconsistency in citation practice between articles in this same branch. Suggested command: `$impeccable clarify`.

## Persona Red Flags

**Riley (Deliberate Stress Tester):** On the refrigerator-cost callout, would immediately probe the unaddressed 8 to 11 year middle band and ask which recommendation applies to a repair in that window (P1 above). Reading the range article, would ask "which number do I actually trust, 12 or 14.5 to 16.8" given both appear without reconciliation two paragraphs apart (P2 above). Reading the two sibling articles back to back, would flag that "11 years" is argued from opposite directions.

**Jordan (Confused First-Timer):** No new red flag from this edit specifically; plain language and self-contained FAQ answers were preserved on all three sampled pages.

## Minor Observations

- `article:modified_time` and `dateModified` correctly bumped to `2026-09-02T00:00:00+00:00` in both the meta tag and the JSON-LD block on the refrigerator-cost and fridge-not-cooling articles, matching the project's Article modified_time rule.
- blog.html render check (live browser measurement, not a static reasoning fallback): navigated to http://localhost:8801/pages/blog.html and measured all 77 `.blog-date` / `.featured-date` elements at 1440px and again at 375px after resize. Zero overflow at either width; all 22 "Updated September 2026" instances render single-line with no wrap, no truncation, no clipping. "September" (9 characters) is only 3 characters longer than "August" (6 characters), well inside the class's existing headroom from prior "Updated [Month]" strings. Clean pass at both viewports.

## Questions to Consider

- Is the 11-year refrigerator threshold used identically across both sibling articles actually sourced from one DOE figure, or were they derived independently and happen to land on the same number?
- Should the site standardize on always citing DOE inline with a link wherever these updated lifespan figures appear, rather than only on the range article?
- Does the refrigerator-cost callout's decision tree need an explicit middle-band case (8 to 11 years), or is the two-endpoint framing intentional simplicity?

## Run Notes

- Target: branch diff, 23 files (22 articles/article-*.html plus pages/blog.html). Slug: ticles-pages-blog-html-copy-only-lifespan-doe-diff.
- Ignore list: `.impeccable/critique/ignore.md` does not exist; nothing consumed.
- Assessment independence: Assessment A and Assessment B ran as two separate, parallel sub-agents (Agent tool, model sonnet each), neither given the other's output, neither instructed to avoid sub-agents. Dual-agent, not degraded.
- CLI detector: ran once by Assessment B over all 23 changed files, exit code 2, 3 findings (see Anti-Patterns Verdict). Re-run by Assessment B against master copies of the 3 hit files to classify pre-existing vs. new.
- Browser visibility: local static server for this repo, started via `PORT=8801 node test/serve.js`, used by both sub-agents at http://localhost:8801/. Server stopped after both assessments completed; confirmed down (connection refused) before this report was written.
- Overlay injection: not attempted (copy-only diff, no CSS/DOM change; CLI scan plus page-load and console check used as primary evidence per the reference doc's provision).
- Live server cleanup: confirmed stopped (process terminated, port 8801 unreachable).
- Temp-file cleanup: Assessment B's master-copy temp directory under the OS temp path was deleted after comparison. `.playwright-mcp/console-*.log` and matching `.playwright-mcp/page-*.yml` entries created by this run's two sub-agents (identified by an "8801" reference inside each console log, plus their matching timestamp windows) were deleted from the repo tree; that directory is gitignored and pre-existing entries from unrelated prior work were left untouched.
- Degraded status: no. Both assessments ran as isolated sub-agents; no single-context fallback was used.
