# scripts/oneoff

Historical, already-run one-off scripts, kept for provenance rather than deleted.
**None are wired into `package.json` or invoked by any skill/command** — each was
a migration or fix script run once. Moved here 2026-05-31 to declutter `scripts/`
so the active set is obvious.

| Script | One-time job |
|--------|--------------|
| `convert-to-webp.js`, `add-webp-picture.js`, `update-css-bg-webp.js` | webp image migration (`<picture>` + CSS backgrounds) |
| `add-lazy-load.js` | added `loading="lazy"` to below-the-fold images |
| `localize-images.js` | localized remote/CDN images into `images/` |
| `fix-canonical-links.js` | canonical-URL normalization (2026-05-25) |
| `fix-city-hubs.js` | one-time city-hub content fixes |
| `fix-article-contrast.js` | a11y contrast fix pass |
| `inline-critical-css.js` | critical-CSS inlining experiment |
| `reclassify-review-photos.js` | moved review photos `reviewer-profiles/` → `reviews/` |
| `add-yelp-source.js` | added the Yelp source block to `data/testimonials.json` |
| `repair-pr313-bugs.mjs` | PR #313-specific repair |
| `trim_testimonials_safe.js` | one-time removal of specific brand-hub testimonial cards |
| `trim-titles-2026-06-08.py` | P1-4 title sweep: trimmed all `<title>`/`og:title`/`twitter:title` to ≤60 chars site-wide (dropped the brand suffix), bumped article dates |
| `fix-blog-emdashes-2026-06-08.py` | P1-5 residual: removed banned em dashes from the 4 blog category pages (headings/card-titles → colon, prose → comma) |
| `city-parity-2026-06-08.py` | P2-2: brings a thin-tier city hub to rich-tier parity (Common Issues prose, Service Area Details + CSS locator, Repair Resources, hasMap). Run per city: `python city-parity-2026-06-08.py <slug>` |

**Active scripts** live in `scripts/` (root): build-sitemap, clean-images,
optimize-logo, build-favicons, apply-favicon-metadata, sync-testimonials-count,
add-seo-improvements, add-hero-preload, add-article-hamburger, add-nav-link.

> The obsolete `build-testimonials-html.js` and `generate-testimonials-page.js`
> generators were **deleted** (not archived) 2026-05-31 — they would have
> destroyed the now hand-maintained `pages/testimonials.html`. Use
> `scripts/sync-testimonials-count.js` to sync review counts.

## `fix-wcag-contrast-2026-07-31.js` (PR #657)
WCAG AA contrast sweep, P6-8 + P6-10. Darkened the `.cta-box` gradient from `#e84c1e`
(3.83:1 against white 14px body text) to `#cc3d12 → #aa3210` (4.95:1 → 6.62:1), raised the
`.btn-white-outline` border alpha 0.6 → 0.85 (WCAG SC 1.4.11 non-text, 3:1), and lightened
`.footer-bottom` from `#767676` to `#999999` on `#090909` (4.38:1 → 6.99:1). 136 files.
Every replacement is anchored to its selector, never a bare literal, because `#767676` and
`rgba(255,255,255,0.6)` both appear in many unrelated rules. Superseded by the permanent
in-browser contrast guard in `test/functional.spec.js`; kept for provenance.

## `gen-faq-parity-baseline-2026-07-31.js` (PR #656)
Regenerates `test/faq-parity-baseline.json` for the `faq-jsonld-parity` ratchet. Refuses to
write if the baseline would GROW (new file or raised count) unless passed `--allow-growth`.
Re-run after each P6-12 paydown batch, from a clean tree.

## `fix-wcag-contrast-round2-2026-07-31.js` (PR #658)
Second WCAG AA pass, P6-14. Where round 1 fixed the two selectors the design critique named, a
systematic scan found 18 failing rule/colour combinations across 86 files, all from `#e84c1e`
being 3.83:1 against white in both directions. Rewrites **only inside rules that actually fail**,
never a blanket literal replace, because `#e84c1e` is also used for borders and large-text
surfaces that legitimately pass at 3:1. White-on-brand darkens the background to `#cc3d12`;
brand-on-light darkens the text to `#aa3210`. Superseded by the `contrast-aa` check in
`npm test`; kept for provenance.

## `fix-wcag-contrast-round3-2026-08-01.js` (PR #659)
Third WCAG AA pass, P6-15 cross-rule bucket: a `color` in one rule against a `background` in
another, which no static scanner can resolve. Rewrites TEXT COLOUR ONLY, with a `(?<!-)color:`
anchor — without it the lazy match lands inside `border-color:` and inverts the fix, which is
exactly what happened to `.filter-pill:hover` in #658. 306 `#e84c1e`, 204 `#767676`, 26 `#888`,
8 `#059669`. ⚠️ Its blind spot is the reason two regressions had to be reverted: it cannot know
what sits BEHIND the text, so it darkened links that live on the dark `.inline-cta` gradient.
Always re-run `sweep-rendered-contrast` after it.

## `sweep-rendered-contrast-2026-08-01.mjs` (PR #659)
Investigative sweep behind P6-15. Loads every page in a headless browser and measures the REAL
painted contrast of every element owning visible text, compositing the actual paint stack via
`elementsFromPoint`. Requires a running server on :8788 (`node test/serve.js`). Not a gate — the
gate is the equivalent probe in `test/functional.spec.js`; this is the whole-site version for
investigation. Handles the four false-positive classes documented in P6-15 (sibling overlays, own
background, off-viewport, replaced elements); without all four it reports mostly noise.
