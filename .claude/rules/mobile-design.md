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

---

## Sticky bottom Call / Book bar (required on homepage and hub pages)

Below 768px, a fixed-position bar at the bottom of the viewport:

```html
<div class="sticky-mobile-bar">
  <a href="tel:+19496295365" class="sticky-call">📞 Call Now</a>
  <a href="pages/contact.html" class="sticky-book">Book Repair</a>
</div>
```

Rules:
- `position: fixed; bottom: 0; left: 0; right: 0; z-index: 200;`
- 50/50 split, each half is a 44×44px+ tap target
- Add `padding-bottom: 64px` to `<body>` so content isn't covered
- Hidden at `min-width: 769px` (desktop already has a header CTA)
- Optional on long-form articles (avoid covering the FAQ on small screens)

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
