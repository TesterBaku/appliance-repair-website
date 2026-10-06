---
name: mobile-design
description: Use whenever writing, editing, or reviewing any HTML or CSS on any page of this site, including the homepage, a hub page, a static page, or an article, and no matter how small the change looks (a spacing tweak, a new section, a form field, a nav change). Applies even when the request never mentions mobile, phones, or responsive design and only describes a desktop-looking change.
---

**When NOT to use this skill:** this skill governs layout, breakpoints, and mobile chrome only.
For what the page should say, use `seo-content`; for whether a piece of content (a testimonial
card, a price) belongs on the page at all, use the matching content skill instead.

# Mobile Design Rules

The site must work on a real phone first, not just a desktop browser shrunk down. Every page Claude touches must satisfy these rules before the PR can merge.

---

## Required breakpoints

Add these `@media` queries to `shared.css` and to any inline `<style>` block in a page:

| Breakpoint | When it applies | Use it for |
|---|---|---|
| `(max-width: 768px)` | Tablets and phones | Stack grids, hide desktop nav, scale heroes |
| `(max-width: 480px)` | Phones only | Tighter padding, smaller hero, hide non-essential floats |

A page that only uses `(max-width: 1024px)` or relies entirely on Tailwind's `md:` prefix is **not** compliant. The shared overrides below must exist as real CSS.

---

## Required overrides at `≤ 768px`

```css
@media (max-width: 768px) {
  .nav-links            { display: none; }       /* desktop nav hidden — see hamburger rule */
  .nav-hamburger        { display: flex; }       /* hamburger appears */
  .services-grid,
  .features-grid,
  .value-row            { grid-template-columns: 1fr; }
  .hero h1              { font-size: 32px; line-height: 1.15; }
  .value-h              { font-size: 26px; }
  .section              { padding: 48px 16px; }
  .container, .container-lg { padding: 0 16px; }
  .letter-card          { padding: 28px 22px; }
  .float                { display: none; }       /* decorative emoji floats overlap heading on phones */
  body                  { padding-bottom: 64px; } /* space for sticky CTA bar */
  .sticky-mobile-bar    { display: flex; }       /* sticky CTA appears */
}
```

## Required overrides at `≤ 480px`

```css
@media (max-width: 480px) {
  .hero h1              { font-size: 28px; }
  .nav-cta              { display: none; }       /* phone has the sticky bar already */
  .testimonial-card     { padding: 24px 18px; }
  .footer-grid          { gap: 28px; }
}
```

---

## Hamburger menu (required at `≤ 768px`)

- Replace the desktop `.nav-links` flex row with a toggleable drawer.
- Vanilla JS, no framework. Toggle `aria-expanded` on the button; toggle `data-open` on the drawer.
- Drawer slides down from below the nav bar; closes on `Esc`, on link click, and on a click outside.
- Hamburger button must be 44×44px minimum.
- Keep the `Call` link (`tel:`) visible at every breakpoint — the call is the primary conversion.
- **Hide the header `Book a Repair` button (`.nav-cta`) on mobile.** At `≤ 768px` the nav must set `.nav-cta { display: none; }` (alongside `.nav-links { display: none; }`). The header only has room for logo + phone + hamburger; leaving the Book button visible crams and overflows the header. On mobile, Book lives in the sticky bottom bar + the hamburger drawer, not the header.
  - **Article pages carry their own inline nav CSS** (they do NOT link `shared.css`), so this rule must be present in each article's own `<style>` `@media (max-width: 768px)` block. `shared.css` already does this for every hub/static page. (Fixed site-wide 2026-07-19, PR #610 — 46 legacy articles were missing it.)

---

## Sticky bottom Call / Book bar (required on homepage, hub pages, AND articles)

Below 768px, a fixed-position bar at the bottom of the viewport:

```html
<div class="sticky-mobile-bar" role="region" aria-label="Quick contact">
  <a href="tel:+19496295365" class="sticky-call">📞 Call Now</a>
  <a href="pages/contact.html" class="sticky-book">Book Repair</a>
</div>
```

Rules:
- Keep `role="region" aria-label="Quick contact"`. An `aria-label` on a bare `div` is ignored by assistive tech (ARIA prohibits naming generic elements), so the role is what makes the bar announced and reachable as a landmark. All 166 pages carry it since 2026-10-06.
- `position: fixed; bottom: 0; left: 0; right: 0; z-index: 200;`
- 50/50 split, each half is a 44×44px+ tap target
- Add `padding-bottom: 64px` to `<body>` so content isn't covered
- Hidden at `min-width: 769px` (desktop already has a header CTA)
- **Required on every article too** (standard since 2026-07-19, PR #611). Because the header `Book a Repair` button is hidden on mobile (see the Hamburger rule), this bar is the primary mobile booking CTA on articles — do not ship an article without it. The `padding-bottom: 64px` keeps the FAQ and body content clear of the 56px bar, so the earlier "covers the FAQ" concern does not apply.
  - **Article-specific wiring:** articles carry their own inline CSS (no `shared.css`), so the three `.sticky-mobile-bar` / `.sticky-call` / `.sticky-book` rules, the `@media (max-width: 768px)` activation (`body { padding-bottom: 64px }` + `.sticky-mobile-bar { display: flex }`), and the markup `<div>` must all be present in the article itself. Book link path is `../pages/contact.html` (articles sit one level down).
- Enforced site-wide by the `article-mobile-chrome` check in `test/content-integrity.js` (`npm test`): every `articles/article-*.html` must hide `.nav-cta` at `≤768px` AND include the `.sticky-mobile-bar`. New articles cloned from a recent article (e.g. the newest hub/article template) inherit both automatically.

---

## Tap target sizes

Every clickable element must be at least **44 × 44px** on mobile per Apple HIG and WCAG 2.1.

Common offenders to audit:
- Inline-styled CTAs with `padding: 7px 16px` — bump to `12px 20px` minimum at `≤ 768px`
- Footer "Privacy Policy" / "Terms" links — bump font-size to 13px and add `padding: 6px 0`
- FAQ accordion buttons — already wide; ensure height ≥ 44px

---

## Hero and heading scaling

- Desktop `<h1>` may run 48–56px; mobile `<h1>` must be 28–34px.
- Subhead `<p>` under the hero: 13–14px on mobile, never below 13px.
- Trust badges: must wrap with `flex-wrap: wrap` and never overflow the viewport.

---

## Form rules (contact / booking)

- Stack fields vertically on mobile — no two-column layouts.
- Above-the-fold fields on mobile: Name, Phone, City, Appliance Type, Message. Anything else moves below the fold.
- City and Appliance Type are `<select>` dropdowns, never free-text.
- Inputs must be 16px font minimum on mobile (smaller fonts trigger iOS auto-zoom).
- Verify the page does not show duplicate "Please enable JavaScript" fallbacks. One fallback element only.

---

## Portrait job photos

A free-standing job photo on a city hub (`<figure class="job-photo">`, not in a fixed-height grid)
should size its `<img>` with `width:100%;max-width:360px;height:auto`. A fixed `height` is allowed
only when paired with `object-fit` to keep a multi-photo row aligned (e.g.
`pages/appliance-repair-mission-viejo-ca.html` uses `height:480px;object-fit:cover`). A bare fixed
height, with no `object-fit`, stretches or squishes a portrait-orientation photo (taller than wide, e.g. 768x1024) to fill
a box whose aspect ratio doesn't match the source image; `height:auto` lets the browser derive
height from the image's own intrinsic ratio instead.

```html
<img src="..." style="width:100%;max-width:360px;height:auto;border-radius:12px;display:block;margin:0 auto;">
```

**This does not apply to `.card-photo`** (the fixed 240px-tall grid used on `pages/recent-repairs.html`
and similar galleries): that box is deliberately a fixed height so cards align in a row, so a portrait
source there is corrected with `style="object-fit:contain;"` on the `<img>` instead, not `height:auto`
(which would break the row alignment `.card-photo` exists to guarantee). Use `height:auto` only where
the image controls its own container height; use `object-fit:contain` where the container height is
fixed and the image must fit inside it without stretching.

## Decorative elements

- Floating emoji / shape decorations (`.float`) must be hidden at `≤ 768px`. They overlap the heading on phones.
- "Sticky note" style elements positioned with negative offsets (`right: -24px`) must be re-anchored or hidden on mobile to avoid clipping off-screen.

---

## Testing checklist (run before every PR)

A PR that touches HTML or CSS is not ready to merge until:

- [ ] `npm run screenshot` exits 0
- [ ] Manual check at 375 × 812 (iPhone) and 414 × 896 (iPhone Plus) shows no horizontal scroll
- [ ] Hamburger opens, closes, and is keyboard accessible
- [ ] Sticky bar visible on mobile, hidden on desktop
- [ ] All tap targets pass Lighthouse mobile audit
- [ ] Lighthouse mobile score ≥ 90 across Performance, Accessibility, Best Practices, SEO
- [ ] Hero `<h1>` is fully visible without scrolling on a 375px viewport
- [ ] No element clips off the right edge of the viewport
