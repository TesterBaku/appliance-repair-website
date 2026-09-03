---
target: "fix/article-img-dimensions (56 articles: img width/height attrs)"
total_score: 31
p0_count: 0
p1_count: 0
timestamp: 2026-09-03T03-37-29Z
slug: img-dimensions-56-articles-img-width-height-attrs
---
Method: dual-agent (A: general-purpose/sonnet "Impeccable critique Assessment A" · B: general-purpose/sonnet "Impeccable critique Assessment B")

## Design Health Score

Representative for the article template shared by all 3 sampled pages (`article-appliance-lifespan-data-2026.html`, `article-bosch-dishwasher-error-codes.html`, `article-bosch-dishwasher-repair-lake-forest.html`); no page-specific deviation found — all three share byte-identical `.article-hero-img` / `.related-card img` CSS. This score describes the (unchanged) template, not the PR's own near-zero design surface.

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | No skeleton/placeholder for lazy-loaded related-card thumbnails on slow connections (pre-existing, unrelated to this PR). |
| 2 | Match Between System and Real World | 4 | Plain-language content, no jargon in nav/labels. |
| 3 | User Control and Freedom | 3 | Standard article page; nav/back/home always available, no modal traps. |
| 4 | Consistency and Standards | 4 | Hero and related-card markup/CSS identical across all 3 sampled files; this PR does not disturb that. |
| 5 | Error Prevention | 3 | N/A for a static article; no forms in the diffed regions. |
| 6 | Recognition Rather Than Recall | 4 | Related cards carry image + category + title, no memorization needed. |
| 7 | Flexibility and Efficiency | 2 | No skip-to-content, no keyboard shortcuts (pre-existing, unrelated to this PR). |
| 8 | Aesthetic and Minimalist Design | 3 | Clean, on-brand; this fix quietly improves correctness of pre-load metadata. |
| 9 | Error Recovery | 3 | Site-wide 404 exists; nothing broken by this change to recover from. |
| 10 | Help and Documentation | 2 | No contextual help; not applicable to an article template, unrelated to this diff. |
| **Total** | | **31/40** | **Good** |

## Anti-Patterns Verdict

**LLM assessment (Assessment A)**: Not AI slop, and the PR doesn't move that needle either way — it is a pure metadata correction touching zero visible markup, copy, or layout across all 56 files. No new icon-heading-text grids, gradient text, or glassmorphism were introduced, because nothing visible was introduced.

**Deterministic scan (Assessment B, `detect.mjs --json` over all 56 changed `articles/*.html` files)**: exit code 2 (advisory findings present, not a crash). 3 total findings, all `numbered-section-markers` (advisory severity), on `article-appliance-failure-rates-by-year.html`, `article-appliance-lifespan-data-2026.html`, and `article-repair-replace.html` (identical snippet `"Sequence: 10, 11, 12"` on each, a page-text scan unrelated to image attributes). **Verified pre-existing, not introduced by this PR**: Assessment B extracted each flagged file's `master` copy via `git show` and re-ran the detector against it directly — identical 3 findings, byte-identical. The other 53 changed files produced zero findings of any severity. No false positives identified (the 3 pre-existing findings are legitimate, just untouched by this diff).

**Visual overlays**: Not available for this ad-hoc comparison. `detect.mjs` was grepped by Assessment B for a browser-injectable overlay entry point (`live-server`, `injectable`, `overlay`) and none exists; no `live-server.mjs` was started (a plain ad-hoc Node static server backed the branch/master comparison instead), so no `[Human]` overlay tab was produced. This is a tooling-absence fact, not a fabricated result.

## Overall Impression

This is a narrow, purely-corrective diff (56 `articles/*.html` files: `<img>` `width`/`height` attributes set to each file's real decoded pixel dimensions, plus the repo's mandatory `article:modified_time`/`dateModified` bump) with no design surface of its own. Every sampled page's hero and related-card images are governed by CSS that hard-sets both `width` and `height` with `object-fit: cover` (`.article-hero-img { width:100%; height:460px; object-fit:cover }`, `.related-card img { width:100%; height:140px; object-fit:cover }`), verified present and controlling in all 3 sampled files by both assessments independently. Both assessments concluded, independently, that rendered pixels are unaffected: Assessment A reasoned this from the CSS + unchanged image bytes; Assessment B confirmed it empirically via real Playwright browser measurement (`getBoundingClientRect()`) of the hero and related-card boxes on branch vs. master, at 1440×900 and 375×812, for all 3 sampled files — every measured box was byte-identical between versions. The single biggest opportunity, not a blocker, is that nothing in `npm test` currently catches a fabricated `width`/`height` attribute (this PR closed a real, previously-silent gap by hand, not via a gate).

## What's Working

1. **Root-cause fix, not a patch.** Corrects the actual wrong data (fabricated placeholder pixel dimensions, several badly wrong — e.g. `1600×460` declared for an image whose real ratio is `1200×801`, or a portrait `800×1200` photo declared as landscape `1200×800`) rather than papering over symptoms.
2. **Scoped and mechanical.** Touches only `width`/`height` attributes plus the standing-rule `modified_time`/`dateModified` bump; no scope creep into copy, layout, or unrelated files. Both assessments independently confirmed the `dateModified` and `article:modified_time` bumps are correctly paired (exact match) wherever checked.
3. **Template discipline preserved.** All 3 sampled files still share byte-identical `.article-hero-img` / `.related-card img` CSS after the fix; no template drift introduced.

## Priority Issues

No P0/P1/P2 found in the touched surface — the change is visually inert by construction (CSS-pinned box + `object-fit: cover` + unchanged image bytes), confirmed by real browser measurement on the 3 sampled pages and a clean, verified-pre-existing-only detector sweep across all 56.

- **[P3] No layout-shift regression test exists for this exact failure mode.** Why it matters: the repo caught this bug by inspection, not by a gate; a future article could reintroduce fabricated `width`/`height` values undetected — the existing `hero-preload` and `srcset-width` checks validate different things (URL matching, descriptor math), not real-vs-declared pixel dimensions. Fix: add a lightweight CI check that decodes each referenced image and asserts its real dimensions match the `width`/`height` attributes (a ratchet, similar in spirit to `tap-target-baseline.json`). Suggested command: `$impeccable harden`.
- **[P3] Hero/related-card images still rely on fixed-pixel `height` + `object-fit: cover` rather than an explicit `aspect-ratio`.** Why it matters: works today, but an explicit `aspect-ratio` would make the pre-CSS-load reservation self-documenting and remove any future dependency on correct `width`/`height` attributes (defense in depth against this exact bug class recurring). Fix: add `aspect-ratio: <real ratio>` alongside the existing fixed-height rules. Suggested command: `$impeccable harden`.

## Persona Red Flags

**Riley (Stress Tester)**: Tested the specific edge this PR touches — declared-vs-real image dimensions. No inconsistency between promise and behavior remains: the previously wrong attributes were a silent discrepancy (never user-visible, only a CLS/SEO-metadata correctness gap), and this PR closes it cleanly.

**Sam (Accessibility-Dependent User)**: `alt` text on every touched `<img>` is present and descriptive in all 3 sampled files and was not touched by this PR — no regression. Not verified beyond the 3-file sample whether `alt` text is adequate across the other 53 files in the batch (out of this critique's sampled scope).

## Minor Observations

- The related-card `alt` text in `article-appliance-lifespan-data-2026.html` ("Sub-Zero Repair vs Replace") is terser than its sibling cards on the same page ("Appliance Failure Rates by Year", "Appliance Repair or Replace") — pre-existing, not touched by this PR, not worth blocking on.
- The old, wrong attributes were also a real (if invisible) risk: before this fix, any render path relying on the declared aspect ratio before the CSS `height:460px`/`140px` rule painted (e.g. a slow first paint, or a UA without full implicit-aspect-ratio support) would have reserved a badly wrong box and produced a visible jump once the correct aspect asserted itself. The branch is a strict improvement to layout-shift risk, not merely neutral.

## Questions to Consider

- Is there value in adding the image-dimension-integrity check (first P3 above) now, while the memory of this exact bug class is fresh, rather than waiting for it to resurface across a future batch of 56+ files?
- Since the real fix here is invisible to end users (a metadata correctness fix, not a rendered-pixel fix), should the PR description lead with the CLS/SEO framing rather than "image dimensions," so a future reviewer doesn't assume a visual bug was fixed when none existed?
