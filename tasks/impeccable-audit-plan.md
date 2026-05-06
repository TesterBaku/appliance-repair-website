# Impeccable Audit — Implementation Plan
**Audit date:** 2026-05-06 | **Score:** 9/20 (Poor) | **Target:** 16+/20

Each item is one PR. Run sequentially; each branch cuts from master after the previous merge.

---

## PR 1 — `fix/a11y-contrast-and-responsive` [adapt]
**Priority: P1+P2 | Command: `/impeccable adapt`**

Contrast failures and responsive gaps — all CSS-only fixes, no JS.

- [ ] Change all `#888` body text to `#666` in `shared.css` and `index.html` inline styles (`.service-desc`, `.feature-desc`, `.stat-label`, section subheads)
- [ ] Change `.testimonial-role` and `.letter-greeting` `color: #aaa` → `#767676`
- [ ] Lighten footer text: `.footer-links a`, `.footer-contact-line`, `.footer-col-label` → `#999`; `.footer-bottom` → `#aaa`
- [ ] Add `.services-grid { grid-template-columns: 1fr; }` to `@media (max-width: 768px)` in `shared.css`
- [ ] Replace fragile `#testimonials > .container > div[style]` 480px selector: add `.testimonials-grid` class to `shared.css` and update `index.html`
- [ ] Fix sticky note clip on mobile: at `≤ 768px` move to `right: 12px; bottom: -20px` or hide

---

## PR 2 — `fix/a11y-keyboard-and-focus` [harden]
**Priority: P1 | Command: `/impeccable harden`**

Keyboard accessibility — interactive elements must be reachable without a mouse.

- [ ] Add `:focus-visible { outline: 2px solid #e84c1e; outline-offset: 2px; }` to `shared.css` (applies globally to all pages)
- [ ] Add `focus`/`blur` events to nav dropdown JS so menus open on keyboard focus
- [ ] Add `aria-haspopup="true"` and `aria-expanded="false"` to `.nav-dropdown-toggle` links
- [ ] Wire FAQ `aria-expanded`: in `toggleFaq()` toggle `aria-expanded` on the button; add `id` on `.faq-a` and `aria-controls` on button
- [ ] Fix logo `href="#"` → `href="index.html"` (or `/`)
- [ ] Add `aria-hidden="true"` to decorative emojis in floating elements and footer contact lines

---

## PR 3 — `fix/perf-css-and-loading` [optimize]
**Priority: P2 | Command: `/impeccable optimize`**

Performance — remove duplicate CSS, add preload hints.

- [ ] Audit `index.html` inline `<style>` block — remove every rule that already exists verbatim in `shared.css` (keep only page-specific overrides)
- [ ] Add `<link rel="preconnect" href="https://fonts.googleapis.com">` and `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>` to `index.html` `<head>`
- [ ] Add `<link rel="preload" as="image" href="images/hero-homepage.jpg">` to `index.html` `<head>` for LCP

---

## PR 4 — `feat/design-tokens` [extract]
**Priority: P2 | Command: `/impeccable extract`**

Introduce CSS custom properties — the systemic fix for all color management.

- [ ] Add `:root` token block to `shared.css` with: `--color-brand`, `--color-brand-dark`, `--color-text-primary`, `--color-text-secondary`, `--color-text-muted`, `--color-bg`, `--color-surface`, `--color-footer-bg`
- [ ] Replace all hardcoded hex values in `shared.css` with tokens
- [ ] Replace all hardcoded hex values in `index.html` inline style block with tokens
- [ ] Remove leftover `!important` declarations in nav dropdown CSS (specificity battle — use tokens + proper cascade instead)

---

## PR 5 — `fix/anti-patterns-hero-and-features` [bolder]
**Priority: P3 | Command: `/impeccable bolder`**

Break the identical card grid; clean up dated hero decorations.

- [ ] Redesign the "Why Choose Us" features section — break the 6 identical emoji-icon cards into a more distinct layout (e.g. 2 featured large cards + 4 supporting items, or a list with icon + bold stat)
- [ ] Replace floating emoji circles/squares in hero with intentional shapes or remove — retain `🔧` as the one functional brand icon, remove the blue circles and random geometric shapes

---

## Final — after all 5 PRs merge

- [ ] Re-run `/impeccable audit` — target score ≥ 16/20
- [ ] Run `/impeccable document` to generate `DESIGN.md` from the updated token system

---

## Score Projections

| After PR | Expected Score | Change |
|---|---|---|
| Baseline | 9/20 | — |
| After PR 1 | 11/20 | +2 (contrast fixes clear 6 A11y issues, responsive fixes) |
| After PR 2 | 13/20 | +2 (keyboard gaps removed, A11y → 4/4) |
| After PR 3 | 14/20 | +1 (perf improvements) |
| After PR 4 | 16/20 | +2 (theming from 1 → 3, perf edge from tokens) |
| After PR 5 | 17/20 | +1 (anti-patterns → 3/4) |
