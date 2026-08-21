---
name: Universal Appliances Repair
description: Local appliance repair for Orange County homeowners — same-day service, trusted hands.
colors:
  craftsmans-ember:  "#e84c1e"
  ember-deep:        "#cc3d12"
  ember-deeper:      "#aa3210"
  teal-deep:         "#0e7490"
  forest-deep:       "#047857"
  coastal-mist:      "#f7fafc"
  surface:           "#ffffff"
  pressed-steel:     "#111111"
  workshop-charcoal: "#444444"
  dust:              "#666666"
  chalk:             "#767676"
  ghost:             "#aaaaaa"
  night-workshop:    "#090909"
  footer-mist:       "#999999"
  star-gold:         "#f59e0b"
  linen:             "#eeeeee"
typography:
  display:
    fontFamily: "Inter, sans-serif"
    fontSize: "50px"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-1.5px"
  headline:
    fontFamily: "Inter, sans-serif"
    fontSize: "32px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.5px"
  title:
    fontFamily: "Inter, sans-serif"
    fontSize: "28px"
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.75
  label:
    fontFamily: "Inter, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.5
rounded:
  pill:    "20px"
  card-lg: "18px"
  card:    "14px"
  card-sm: "12px"
  button:  "8px"
  icon:    "10px"
spacing:
  xs: "8px"
  sm: "16px"
  md: "24px"
  lg: "48px"
  xl: "80px"
components:
  button-primary:
    backgroundColor: "{colors.craftsmans-ember}"
    textColor: "{colors.surface}"
    rounded: "{rounded.button}"
    padding: "12px 26px"
  button-primary-hover:
    backgroundColor: "{colors.ember-deep}"
    textColor: "{colors.surface}"
    rounded: "{rounded.button}"
    padding: "12px 26px"
  button-dark:
    backgroundColor: "{colors.pressed-steel}"
    textColor: "{colors.surface}"
    rounded: "{rounded.button}"
    padding: "10px 22px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.pressed-steel}"
    rounded: "{rounded.button}"
    padding: "10px 22px"
  card-service:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.card}"
  card-feature:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.card}"
    padding: "{spacing.md}"
  brand-tag:
    backgroundColor: "{colors.surface}"
    textColor: "#1e293b"
    rounded: "{rounded.button}"
    padding: "10px 20px"
---

# Design System: Universal Appliances Repair

## 1. Overview

**Creative North Star: "The Craftsperson's Workshop"**

This is a system built like a good repair: nothing wasted, everything earned. Every surface, shadow, and color exists because it solves a problem for a stressed homeowner on a 375px screen who needs to book a repair in the next thirty seconds. Decoration that doesn't serve conversion is not decoration; it's friction. The design earns trust the same way a skilled technician does: by being exactly what it promises, no more, no less.

The palette is restrained orange over light gray. The typography is weight-driven, not size-driven. The component set is small and confident. There is one button color in the system, and it means one thing: take action now. This economy is deliberate. A homeowner scanning for a phone number should not have to wonder which orange thing is clickable.

This system explicitly rejects the aesthetics of national appliance-chain franchises (cold blues, aggressive discounting energy), HVAC corporate sterility (white-on-white with teal accents), and over-engineered local service site templates that feel more like a tech startup than someone who shows up with tools. The warmth comes from proportion and weight, not from gradients or glassmorphism.

**Key Characteristics:**
- Single accent color used only for action (calls, bookings, CTAs)
- Weight contrast drives heading hierarchy; Inter at 800 and 400 feel like different typefaces
- Shadows are ambient and structural, never decorative
- Mobile sticky bar anchors conversion at every scroll position
- Dark section (footer CTA) uses deep brown warmth, not generic dark navy

---

## 2. Colors: The Ember and the Mist

A committed palette: one saturated accent on a cool-tinted light field, grounded by near-black surfaces in the footer.

### Primary
- **Craftsman's Ember** (`#e84c1e`): The brand's identity color. If something is this orange, it is clickable or critical, and its rarity on any given screen is what makes it work.
  - ⚠️ **It cannot carry small text, in either direction.** `#e84c1e` is **3.83:1** against white, so white text ON it and it AS text on white both fail the 4.5:1 WCAG AA floor. Reserve it for borders, focus rings, icon fills, decorative surfaces, and large text (≥24px, or ≥18.66px at weight ≥700, where the bar is 3:1). This is enforced by the `contrast-aa` check in `npm test`.
- **Ember Deep** (`#cc3d12`): **4.95:1** against white. The surface color wherever a brand-colored background carries small white text: primary buttons, the CTA box, the mobile sticky Call bar, cost-table headers, numbered badges. Also the primary's hover state, where the shift from Ember signals responsiveness without a dramatic jump.
  - Corrected 2026-07-31. This line previously read *"Hover state for the primary only. Never used independently"*, which the code had already outgrown (`shared.css` shipped `.btn-primary { background: var(--brand-dark) }`) and which PRs #657/#658 made comprehensively untrue. Leaving it stale is how the next contributor reaches for `#e84c1e` and reintroduces a 3.83:1 failure.
- **Ember Deeper** (`#aa3210`, `--brand-deeper` / `--brand-text`): **6.62:1** against white. The text color wherever brand orange must appear as small text on a light background: inline-CTA links, badges, tags, breadcrumb hovers.

### Neutral
- **Coastal Mist** (`#f7fafc`): Page background and gray-section backgrounds. Slightly blue-shifted — a deliberate echo of the Pacific coast in Orange County. Never pure white; the tint keeps it from feeling like a blank document.
- **Surface** (`#ffffff`): Card and nav surface. Used where layering over Coastal Mist needs a clear lift.
- **Pressed Steel** (`#111111`): Primary text: headings, nav, bold UI labels. Near-black, not pure black.
- **Workshop Charcoal** (`#444444`): Long-form quotes (testimonials). Dark enough for authority, softer than Pressed Steel.
- **Dust** (`#666666`): Secondary body copy and metadata alike: descriptions, section subheads, supporting text, testimonial roles, bylines, timestamps. **5.74:1 on white, 5.48:1 on Coastal Mist.** This is the floor for any text that carries meaning.
  - ⚠️ **Chalk (`#767676`) is NOT a valid text colour.** It measures 4.54:1 on pure white, which reads as passing, but only **4.33:1 on Coastal Mist (`#f7fafc`)** — and Coastal Mist is where most secondary text on this site actually sits. That gap put 204 declarations under the AA floor. Corrected 2026-08-01 (PR #659); `--text-muted`, `--text-faint` and `--text-inactive` all now resolve to Dust. Chalk survives only as a non-text value (borders, decorative fills).
- **Ghost** (`#aaaaaa`): Inactive UI elements: decorative dividers and disabled states, button outlines in hover. Never for text that carries meaning.
- **Linen** (`#eeeeee`): Borders and nav separators. Barely-there boundary lines.
- **Night Workshop** (`#090909`): Footer background. Deep near-black with a faint warm undertone. Paired with footer-mist text for ~9:1 contrast.
- **Footer Mist** (`#999999`): All footer text on Night Workshop. Light enough to read, muted enough to recede.
- **Star Gold** (`#f59e0b`): Rating stars only. Never used elsewhere — its restriction gives the rating sections immediate recognition.

### Named Rules
**The One Ember Rule.** Craftsman's Ember appears on ≤10% of any given screen. Every CTA is orange; decorations are not. If a new component is orange, ask whether it is an action. If not, rethink the color choice.

**The Warm Footer Rule.** The footer dark section uses `#090909` (brown-shifted near-black), not a generic `#000` or cold `#0a0a0a`. This warmth is intentional: it connects to the Ember on dark surfaces rather than creating a cold contrast.

---

## 3. Typography

**Body and Display Font:** Inter (Google Fonts, weights 300–900)
**Fallback:** system-ui, sans-serif

**Character:** A single-family system that achieves hierarchy through weight contrast alone. Inter at 800 with tight letter-spacing (-1.5px) reads as a different typeface from Inter at 400 at normal spacing. This economy avoids the "two fonts neither quite right" problem common on local service sites.

### Hierarchy
- **Display** (800 weight, 50px, line-height 1.1, -1.5px tracking): Homepage H1 only. "Same-Day Appliance Repair in Orange County, CA." Full viewport width on desktop; scales to 32px at tablet, 28px at mobile via breakpoint. Tight tracking at this size prevents the headline from spreading across too many lines.
- **Headline** (700 weight, 32px, line-height 1.2, -0.5px tracking): Section headings (h2.h2-section). "Why Choose Universal Appliances Repair?" and peer headings. The -0.5px tracking is subtle but prevents optical looseness at this size.
- **Title** (700–800 weight, 26–30px, line-height 1.3): Subsection headings (h2.h2-hub, h2.h2-standard, h2.h2-sm). Hub page H1s use 800 weight; secondary titles use 700.
- **Body** (400 weight, 14px, line-height 1.75–1.85): All paragraph copy. 14px is the minimum for mobile readability without triggering iOS auto-zoom (16px on input fields, enforced separately). Line-height 1.75 gives the long FAQ answers and article copy room to breathe without feeling airy.
- **Label** (500–600 weight, 11–13px, line-height 1.5): Nav links, button text, card metadata, form labels, brand tags. 600 weight for primary labels (buttons, nav CTA); 500 for secondary labels (nav links, card Learn More).

### Named Rules
**The Weight-Over-Size Rule.** When in doubt, add weight rather than increasing size. A 14px 700-weight label reads more hierarchically distinct from 14px 400-weight body than a 16px 400-weight label does. This keeps the type scale compact and mobile-friendly.

**The Tracking Rule.** Tight tracking (-1.5px to -0.5px) is reserved for display and headline sizes only. Body and label text runs at default or zero tracking. Tight-tracking small text is an anti-pattern.

---

## 4. Elevation

This system uses **ambient shadows** rather than hard-edged or tonal layering. Depth is expressed through shadow opacity: low-opacity black shadows at increasing blur radii suggest surface height without drawing attention to themselves. Nothing floats for decorative reasons.

### Shadow Vocabulary
- **Surface Low** (`0 1px 12px rgba(0,0,0,0.06)`): FAQ accordion items. The subtlest lift; almost no shadow.
- **Surface** (`0 2px 16px rgba(0,0,0,0.07)`): Feature cards, stat cards. Standard card shadow.
- **Surface Medium** (`0 2px 20px rgba(0,0,0,0.08)`): Service cards. Slightly more prominent for image-bearing cards.
- **Surface High** (`0 2px 24px rgba(0,0,0,0.08)`): Testimonial cards. Matches Medium at this size; the extra value is for visual distinction if cards stack.
- **Overlay** (`0 8px 28px rgba(0,0,0,0.10)`): Nav dropdown menus. Signals floating above the page.
- **Dark Feature** (`0 24px 70px rgba(0,0,0,0.50)`): The letter card inside the dark CTA section only. Dramatic depth to lift the white card off the brown-black background. This shadow exists nowhere else in the system.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest. Shadows appear only as a structural signal: "this element is above the surface beneath it." No shadows for hover feedback on cards (the system uses background color shifts instead). No drop-shadows on text.

**The Dark Feature Exception.** The Dark Feature shadow is permissible on the letter card over the dark section only. Using it anywhere else would import dramatic intent where none exists.

---

## 5. Components

### Buttons
Three variants; clear hierarchy. Firm, gently curved edges (8px radius).

- **Primary** (`btn-primary`): Craftsman's Ember fill, Surface text, 12px 26px padding, 13px 600-weight text. The only orange element that is also a button. Hover shifts to Ember Deep in 150ms.
- **Dark** (`btn-dark`): Pressed Steel fill, Surface text, 10px 22px padding, 12.5px 500-weight text. Secondary conversion action (e.g. "Book a Repair" below the hero). Hover shifts to `#222`.
- **Outline** (`btn-outline`): Transparent fill, Pressed Steel text, 1.5px Linen border. Tertiary or "Discover More" actions that must not compete with the primary. Border shifts to Ghost on hover.
- **Mobile tap targets:** All buttons grow to `min-height: 44px` at 768px, enforced via shared breakpoint rule.

### Cards and Containers
Cards are the primary surface of this system. Corner radius signals importance tier.

- **Service Cards** (16px radius, 20px shadow): Image-bearing cards for appliance types. Full-width image (200px height, cover fit), then padded body. The largest card unit in the system.
- **Feature/Stat Cards** (14px radius, 16px shadow): Content-only cards for "Why Us" highlights and statistics. Padding: 24–28px internal. Never nested inside another card.
- **Testimonial Cards** (16px radius, 24px shadow): Full-bleed width at any column count. Centered text, star row above quote, name below. On desktop, two columns via `.testimonials-grid`. Collapses to single column at 480px.
- **Testimonial Avatars** (`#444444`): Initial badges inside testimonial cards. Use Workshop Charcoal for reviewer initials so city pages match the homepage review treatment.
- **Letter Card** (18px radius, 70px Dark Feature shadow): The signature component. White card on the dark brown section. Internal padding 44px 52px (desktop), 28px 22px (mobile). Houses the "Get in touch" copy, contact info, and a sticky-note decoration. Never replicate this shadow outside this context.
- **FAQ Items** (12px radius, 6px shadow): Accordion containers. No outer border; shadow provides boundary. The button question row has `min-height: 44px` for mobile tap targets.
- **Brand Tags** (8px radius, `#e2e8f0` 1.5px border): Pill-adjacent tags for brand names. White surface, `#1e293b` text — slightly navy, not Pressed Steel. No shadow.

### Navigation
- **Desktop**: Fixed 70px header (homepage) or 52px (inner pages) with `rgba(255,255,255,0.92)` + `backdrop-filter: blur(10px)`. Brand logo left, nav links center-left (13px 500-weight), phone number + "Book a Repair" CTA right.
- **Dropdowns**: Appear on hover AND keyboard focus. Surface background, Linen 1px border, 10px radius, `0 8px 28px rgba(0,0,0,0.1)` shadow. `aria-expanded` is toggled and Escape closes them.
- **Mobile (≤768px)**: Nav links and CTA hidden; hamburger button (44×44px minimum) opens a full-width drawer with 15px 500-weight links. Details/summary accordion for sub-menus.
- **Sticky Mobile Bar**: `position: fixed; bottom: 0; height: 56px`. Left half: Craftsman's Ember, "Call Now" with phone icon. Right half: Pressed Steel, "Book Repair". Always visible below 768px; hidden on desktop. Body gets `padding-bottom: 64px` to prevent content overlap.

### Signature Component: The Dark Section CTA
The only section that breaks the light theme. Background: `linear-gradient(145deg, #1a0a02, #3d1a08, #0f0503)` — a rich brown-black with subtle gradient depth. Contains the letter card (white), a contact form CTA quote in white, and an orange "Schedule a Repair" button. The warm dark tone connects to Craftsman's Ember rather than reading as a generic dark section.

### FAQ Accordion
Question buttons use `aria-expanded` (true/false) and `aria-controls` pointing to the answer panel id. The icon (`+`) rotates 45° via CSS transform when open. `transition: transform 0.2s` respects `prefers-reduced-motion: reduce` (transition set to `none` in that media query).

---

## 6. Do's and Don'ts

### Do:
- **Do** use Craftsman's Ember (`#e84c1e`) exclusively for calls to action, phone numbers in emphasis, focus rings, and the brand icon. One color, one meaning.
- **Do** drive heading hierarchy with weight contrast (800 vs 700 vs 400) before reaching for size increases. Keep the type scale compact.
- **Do** keep card shadows ambient and low-opacity. The shadow scale tops out at `rgba(0,0,0,0.08)` for standard surfaces. Reserve the 0.5-opacity Dark Feature shadow for the letter card only.
- **Do** maintain a `min-height: 44px` on all interactive elements at mobile viewports. Anything smaller fails the stressed-homeowner-on-mobile test.
- **Do** use Ghost (`#aaaaaa`) only for genuinely decorative, non-informational marks. Note the FAQ accordion icon and dropdown arrows are driven by `--text-inactive`, which is now Dust `#666666`, not Ghost. Use **Dust (`#666666`)** minimum for any text that carries meaning. Never let secondary text drop below 4.5:1. Check the ratio against the background it will actually sit on, not against white: Chalk (`#767676`) passes on white and fails on Coastal Mist, which is exactly how 204 declarations slipped under the floor.
- **Do** let the sticky mobile bar be the persistent conversion anchor on mobile. Its presence means the headline CTA doesn't need to over-compete for attention.
- **Do** include `aria-expanded`, `aria-controls`, and keyboard event handlers on any element with toggled visibility (dropdowns, accordions, drawers).
- **Do** write `prefers-reduced-motion: reduce` overrides for every CSS `transition` in shared.css. Motion is enhancement, not requirement.

### Don't:
- **Don't** use Craftsman's Ember as a decorative color. No orange section backgrounds, no orange text for emphasis, no orange borders that don't communicate "interact with me."
- **Don't** use the national-chain or corporate-HVAC aesthetic: no cold blue primary colors, no aggressive promotional starburst graphics, no clean-white-with-teal-accents look. This system should feel like a local expert, not a franchise.
- **Don't** introduce a second accent color. Star Gold (`#f59e0b`) exists only for rating stars. Everything else is Ember or neutral.
- **Don't** stack cards inside cards. Nested cards are never correct in this system.
- **Don't** apply `border-left` or `border-right` greater than 1px as a colored stripe on cards, list items, or callouts. Use background tints, full borders, or leading icons instead.
- **Don't** use gradient text (`background-clip: text` with a gradient fill). Use Pressed Steel for emphasis, weight for hierarchy.
- **Don't** use glassmorphism as decoration. The nav's backdrop-filter is structural (it keeps the nav readable over the hero image). Don't add blur cards, frosted panels, or glass-style decorations.
- **Don't** introduce an identical icon-heading-text card grid. That pattern was the most recognizable AI-generated design tell on this site.
  - ⚠️ **This rule is currently violated on the homepage, and this bullet used to hide that.** It read "The feature section now uses a mixed highlight-plus-list layout", stated as settled fact. It is not: `index.html`'s `.why-highlights` section is six uniform icon-heading-text cards (`index.html:1074`), and the `.features-grid` / `.feature-card` rules the sentence described are declared in the CSS but referenced by **zero** elements in the markup. Found in the `/review` of PR #765, by a reviewer reading this file against the page. A design doc that claims a fix which was never shipped is worse than one that admits the debt, because it retires the item in everyone's head. Tracked as **P6-63**; the rule above stands for all new work.
- **Don't** write body copy with em dashes. Use commas, semicolons, colons, and periods. Em dashes register as editorial voice the brand doesn't have.
- **Don't** make the footer dark with cold blacks or generic navy. The Night Workshop tone (`#090909`) has brown warmth; replacing it with `#000` or a blue-shifted dark strips the connection to the brand orange.
