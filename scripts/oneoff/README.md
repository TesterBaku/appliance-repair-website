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

**Active scripts** live in `scripts/` (root): build-sitemap, clean-images,
optimize-logo, build-favicons, apply-favicon-metadata, sync-testimonials-count,
add-seo-improvements, add-hero-preload, add-article-hamburger, add-nav-link.

> The obsolete `build-testimonials-html.js` and `generate-testimonials-page.js`
> generators were **deleted** (not archived) 2026-05-31 — they would have
> destroyed the now hand-maintained `pages/testimonials.html`. Use
> `scripts/sync-testimonials-count.js` to sync review counts.
