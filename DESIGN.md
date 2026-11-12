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
  star-gold-on-light: "#d97706"
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
- **Star Gold** (`#f59e0b`, `--amber`): Rating stars only. Never used elsewhere; its restriction gives the rating sections immediate recognition. Use it for stars on dark backgrounds (the hero rating chip). It measures only 2.15:1 on white, under WCAG 1.4.11's 3:1 for graphical objects, so it is not used on white cards.
- **Star Gold on Light** (`#d97706`, `--star-on-light`): The same rating stars when they sit on a white or light card (hub testimonial cards, the homepage review cards, the testimonials page). 3.19:1 on white. Rating stars only, like Star Gold; it is a contrast-corrected variant, not a second accent.

### Named Rules
**The One Ember Rule.** Craftsman's Ember appears on ≤10% of any given screen. Every CTA is orange; decorations are not. If a new component is orange, ask whether it is an action. If not, rethink the color choice.

**The Warm Footer Rule.** The footer dark section uses `#090909` (brown-shifted near-black), not a generic `#000` or cold `#0a0a0a`. This warmth is intentional: it connects to the Ember on dark surfaces rather than creating a cold contrast.

---

## 3. Typography

**Body and Display Font:** Inter (Google Fonts, weights 300–900; the homepage self-hosts the variable latin file `fonts/inter-latin-var.woff2`, weights 400–900, preloaded)
**Fallback:** sans-serif. The homepage puts `'Inter Fallback'` (local Arial, or Liberation Sans on Linux) and `'Inter Fallback Roboto'` (Android) first, each with `size-adjust` / `ascent-override` matched to Inter's measured metrics, so the swap to Inter does not shift layout. It is a loading stand-in, not a second brand font.

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
- **Dark** (`btn-dark`): Pressed Steel fill, Surface text, 10px 22px padding, 12.5px 500-weight text. Secondary conversion action (e.g. "Request a Repair" below the hero). Hover shifts to `#222`.
- **Outline** (`btn-outline`): Transparent fill, Pressed Steel text, 1.5px Linen border. Tertiary or "Discover More" actions that must not compete with the primary. Border shifts to Ghost on hover.
- **Mobile tap targets:** All buttons grow to `min-height: 44px` at 768px, enforced via shared breakpoint rule.

### Cards and Containers
Cards are the primary surface of this system. Corner radius signals importance tier.

- **Service Cards** (16px radius, 20px shadow): Image-bearing cards for appliance types. Full-width image (200px height, cover fit), then padded body. The largest card unit in the system.
- **Feature/Stat Cards** (14px radius, 16px shadow): Content-only cards for "Why Us" highlights and statistics. Padding: 24–28px internal. Never nested inside another card.
- **Testimonial Cards** (16px radius, 24px shadow): Full-bleed width at any column count. Centered text, star row above quote, name below. On desktop, two columns via `.testimonials-grid`. Collapses to single column at 480px. This describes the homepage card. The hub-page card (`.hub-page .testimonial-card`, 14px radius, left-aligned text, 36px initials badge) is a deliberate variant: grid of three at desktop, two at tablet with a lone third card centred on its own row, one on phones; the badge and name are pinned to the card bottom so names line up across a row. Star rows on these white cards use Star Gold on Light.
- **Testimonial Avatars** (`#444444`): Initial badges inside testimonial cards. Use Workshop Charcoal for reviewer initials so city pages match the homepage review treatment.
- **Letter Card** (18px radius, 70px Dark Feature shadow): The signature component. White card on the dark brown section. Internal padding 44px 52px (desktop), 28px 22px (mobile). Houses the "Get in touch" copy, contact info, and a sticky-note decoration. Never replicate this shadow outside this context.
- **FAQ Items** (12px radius, 6px shadow): Accordion containers. No outer border; shadow provides boundary. The button question row has `min-height: 44px` for mobile tap targets.
- **Brand Tags** (8px radius, `#e2e8f0` 1.5px border): Pill-adjacent tags for brand names. White surface, `#1e293b` text — slightly navy, not Pressed Steel. No shadow.

### Navigation
- **Desktop**: Fixed 70px header (homepage) or 52px (inner pages) with `rgba(255,255,255,0.92)` + `backdrop-filter: blur(10px)`. Brand logo left, nav links center-left (13px 500-weight), phone number + "Request a Repair" CTA right.
- **Dropdowns**: Appear on hover AND keyboard focus. Surface background, Linen 1px border, 10px radius, `0 8px 28px rgba(0,0,0,0.1)` shadow. `aria-expanded` is toggled and Escape closes them.
- **Mobile (≤768px)**: Nav links and CTA hidden; hamburger button (44×44px minimum) opens a full-width drawer with 15px 500-weight links. Details/summary accordion for sub-menus.
- **Sticky Mobile Bar**: `position: fixed; bottom: 0; height: 56px`. Left half: Craftsman's Ember, "Call Now" with phone icon. Right half: Pressed Steel, "Request Repair". Always visible below 768px; hidden on desktop. Body gets `padding-bottom: 64px` to prevent content overlap.

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
- **Don't** introduce a second accent color. Star Gold (`#f59e0b`, and its on-light variant `#d97706`) exists only for rating stars. Everything else is Ember or neutral.
- **Don't** stack cards inside cards. Nested cards are never correct in this system.
- **Don't** apply `border-left` or `border-right` greater than 1px as a colored stripe on cards, list items, or callouts. Use background tints, full borders, or leading icons instead.
- **Don't** use gradient text (`background-clip: text` with a gradient fill). Use Pressed Steel for emphasis, weight for hierarchy.
- **Don't** use glassmorphism as decoration. The nav's backdrop-filter is structural (it keeps the nav readable over the hero image). Don't add blur cards, frosted panels, or glass-style decorations.
- **Don't** introduce an identical icon-heading-text card grid. That pattern was the most recognizable AI-generated design tell on this site.
  - ⚠️ **This rule is currently violated on the homepage, and this bullet used to hide that.** It read "The feature section now uses a mixed highlight-plus-list layout", stated as settled fact. It is not: `index.html`'s `.why-highlights` section is six uniform icon-heading-text cards (`index.html:1074`), and the `.features-grid` / `.feature-card` rules the sentence described are declared in the CSS but referenced by **zero** elements in the markup. Found in the `/review` of PR #765, by a reviewer reading this file against the page. A design doc that claims a fix which was never shipped is worse than one that admits the debt, because it retires the item in everyone's head. Tracked as **P6-63**; the rule above stands for all new work.
- **Don't** write body copy with em dashes. Use commas, semicolons, colons, and periods. Em dashes register as editorial voice the brand doesn't have.
- **Don't** make the footer dark with cold blacks or generic navy. The Night Workshop tone (`#090909`) has brown warmth; replacing it with `#000` or a blue-shifted dark strips the connection to the brand orange.

---

## 7. v2 Hub Template (rollout in progress)

Owner-approved 2026-11-11/12. The v2 template is being rolled out in releases: the 8 appliance service pages first, then brand pages, city pages, the homepage and static pages, and finally the nav, footer and sticky bar restyle. Source of truth for every value below is the v2 stylesheet; approved markup is the freezer and refrigerator fragments from the redesign preview.

### Which palette applies where during the rollout

Sections 1 to 6 above remain in force. v2 does not replace them; it overrides them only inside the v2 scope.

- **Inside `.v2` (the `<main>` of a migrated page):** the ink palette in this section.
- **Everywhere else:** the existing Ember and Mist palette from section 2. That means pages not yet migrated, and, on migrated pages too, the nav, the footer and the sticky mobile bar, until their own release.
- All v2 tokens are custom properties declared on `.v2`, so they cannot leak into the nav, footer or sticky bar. Do not move them to `:root`.
- One shared value: v2's `--ember` (`#cc3d12`) is the same value as Ember Deep above, and `--ember-dark` (`#aa3210`) is the same value as Ember Deeper. v2 never uses `#e84c1e`.

### Ink palette (tokens on `.v2`)

Contrast ratios below were computed from the hex values with the WCAG relative-luminance formula, not copied from CSS comments. Each names its pair.

| Token | Value | Role | Computed contrast |
|---|---|---|---|
| `--ink` | `#14303b` | Headings (h1 to h3), dark band and CTA panel background (`--dark` aliases it) | 13.86:1 on white; 12.72:1 on ice |
| `--text` | `#3b4d56` | Body copy | 8.82:1 on white; 8.09:1 on ice |
| `--muted` | `#55676f` | Secondary copy, metadata, table headers | 5.91:1 on white; 5.42:1 on ice |
| `--line` | `#dbe4e8` | Every border and divider | 1.29:1 on white (decorative, never carries meaning) |
| `--ice` | `#f1f6f8` | Every tinted background | n/a |
| `--ember` | `#cc3d12` | Actions only: button fill, icons | 4.95:1 white text on it; 4.95:1 on white and 4.54:1 on ice as an icon or text colour |
| `--ember-dark` | `#aa3210` | Action hover, small accent text (prose links, "Read full review", hover states) | 6.62:1 on white (and white text on it); 6.08:1 on ice |
| `--star` | `#b45309` | Rating stars on light | 5.02:1 on white; 4.61:1 on ice |
| `--on-dark` | `#c6d3d9` | Copy on the dark band | 9.05:1 on ink |
| `--dark-line` | `#44606c` | Dividers on dark, the step connector | 2.07:1 on ink (decorative) |
| `--dark-ring` | `#7d95a0` | Step circle border, outline button border on dark | 4.41:1 on ink |
| `--dark-hover` | `#1f4250` | Hover fill of the on-dark button | 10.75:1 white text on it |
| `--ghost-line` | `#b3c3cb` | Outline (ghost) button border | 1.81:1 on white |
| `--ghost-line-hover` | `#8fa3ad` | Ghost button border on hover | not computed |
| `--focus` | `#1479a8` | Focus ring | 4.85:1 on white; 4.45:1 on ice; 2.86:1 on ink, so `#fff` (13.86:1) is used there |
| `--scrim` | `rgba(20, 48, 59, .9)` | Photo caption chip background (white 12px text on it) | not computed (alpha over a photo) |

Other tokens: `--r` 10px (the one radius), `--gut` 24px (16px between 769px and 1099px, matching the nav's side padding), `--max` 1052px, `--pad` `clamp(44px, 5.2vw, 68px)` (44px on phones), `--col-gap` `clamp(32px, 6vw, 96px)`.

Roles to keep straight:
- **Ink** is for headings and the one dark band. **Ice** is the only tint; there is no second tinted background. **Ember is for actions only** (buttons, the check and arrow icons, the FAQ and disclosure plus sign, the `.v2-tel` underline); it is never a section background or decorative fill.
- **Open contrast items, stated rather than implied:** (a) resolved: the focus ring is white on ink surfaces (see the Focus ring rule in the template rules); (b) `--ghost-line` is 1.81:1 on white, so the ghost button's boundary is carried by its text and fill, not its border; (c) the stylesheet's own comment calls `--text` 8.6:1 on white, while the computed value is 8.82:1. Use the table, not the comments.

### The one grid

- **One wrap.** `.v2-wrap` is `max-width: 1052px`, the same as `.nav-inner`, so the logo and the page content share one left edge. Every section uses it.
- **Heading left, content right.** `.v2-head` and `.v2-split` are a two-column grid at `5fr / 7fr` with `--col-gap` between. A section's heading (and its short lead) sits in the left column; the content sits in the right. The hero is the inverse split (`7fr / 5fr`), and the closing CTA panel is also `7fr / 5fr`.
- **Nothing is centred.** Text, headings and cards are left-aligned. (The only centred strings are phone-width brand cards and the CTA panel's small print.)
- **One line colour, one radius.** Every border and divider is `--line`; every card, panel, photo and table is `--r` (10px). Buttons are 8px. Do not introduce a second radius or a second line colour.
- **Phones (768px and below):** every split collapses to one column; brands go to three columns, facts to two, the job gallery to two; reviews to one column; `.v2-sticky` becomes static.

### Section order

Hero, four fact cards, recent repairs, reviews, process (dark band), Pricing & Discounts, problems, types, brands, repair-or-replace (market cost table behind a disclosure), service area, FAQ, guides, closing CTA. Sections alternate white and `v2-sec--ice`, separated by a `--line` top border; the process band (`v2-sec--ink`) has no top border.

### Components

- **Hero** (`.v2-hero`, `.v2-hero-grid`): ice background, breadcrumb (`.v2-crumbs`), h1, lead (`.v2-hero-lead`), rating link (`.v2-rating`), two buttons (`.v2-hero-cta`), note, and a photo (`.v2-hero-photo`) with a caption chip (`figcaption`, `--scrim` background, white 12px text). The photo is 4:3 on phones.
- **Four fact cards** (`.v2-facts`): the old "What to expect" strip. Four white cards (two columns on phones), bold label plus one supporting line, with `.v2-facts-trust` beneath.
- **Recent-repair cards** (`.v2-job`, `.v2-job-photo`, `.v2-job-body`, `.v2-job-loc`, `.v2-job-links`): photo left (42%) and text right; below 960px they stack. **Two-up variant:** two cards in `.v2-grid2`. **Gallery variant** (`.v2-jobs`): four columns (three below 960px, two on phones) of compact tiles with the caption hidden, for pages with many jobs; the first eight show and the rest sit behind `.v2-more` (a `<details>`).
- **Review cards** (`.v2-reviews`, `.v2-reviews--3`, `.v2-review`, `.v2-stars`, `.v2-review-more`): white cards, stars, blockquote, reviewer footer. `.is-clamped` holds the quote to five lines until "Read full review" opens it.
- **Process band** (`.v2-sec--ink`, `.v2-steps`): the one dark section. Heading, lead and action on the left; numbered steps on the right, each in a 36px circle (`--dark-ring` border) joined by a 1px `--dark-line` connector.
- **Pricing panel** (`.v2-price`, `.v2-price-top`): large price figure (64px, 54px on small phones), checklist, full-width button. Beside it `.v2-policy` rows. `.v2-panel` is the guideline box.
- **Checklist** (`.v2-checks`): the problems list; two columns, ruled rows, ember check icon.
- **Definition rows** (`.v2-defs`, `dt` / `dd`): the types list; two columns, ruled rows.
- **Brand cards** (`.v2-brands`, `.v2-brands--4`, `.v2-brands-all`): uniform text cards, five columns (four with `--4`, three on phones), 60px minimum height, arrow on desktop. `.v2-brands-all` is the link to all brands.
- **Note panel** (`.v2-note`, `.v2-fine`): ice panel with `--line` border (white inside an ice section); `.v2-fine` is 13px fine print.
- **Disclosure** (`.v2-disc`): a `<details>` with a 64px summary row and an ember plus that rotates 45 degrees when open. Holds the market cost table (`.v2-table-wrap`, `.v2-table`, right-aligned bold tabular prices).
- **FAQ**: keeps the `site.js` hooks (`.faq-item`, `button.faq-q`, `.faq-a`), restyled under `.v2` as ruled rows with an ember plus icon. Do not rename these classes.
- **Guides list** (`.v2-guides`): ruled link rows, 60px minimum, ember arrow icon.
- **Closing CTA panel** (`.v2-cta`, `.v2-cta-actions`): ink panel, 7fr / 5fr, heading and copy left, stacked actions right, small print centred under them.
- **Buttons:** `.v2-btn` (ember fill, white text, 50px minimum, 8px radius), `.v2-btn--ghost` (white fill, ink text, `--ghost-line` border), `.v2-btn--onink` (transparent, white text, `--dark-ring` border; for the dark band and CTA panel).
- **Text links:** `.v2-link` (ink, 600, 44px minimum, underline on hover, hover colour `--ember-dark`); `.v2-prose a` (ember-dark, underlined); `.v2-tel` (phone numbers: inherit colour, 600, no wrap, underline in ember; white on the dark band and CTA panel).

### Rules

- **Brands:** uniform text cards, no logos. Each links to its brand hub. A brand without a hub is an unlinked card (a `span`) and goes last.
- **Reviews:** under an appliance heading, show only reviews about that appliance. A page with no review about its own appliance shows general reviews (ones that name no appliance) under the neutral heading "What Our Customers Say", with a neutral service label on each card, to be swapped for appliance-specific reviews when they exist (owner decision, 2026-11-12). Quotes are held to five lines with "Read full review". Show 3 on desktop and 2 on phones; the rest sit behind a reversible "Show N more reviews" button (`.v2-reviews-more`, toggled by the `hidden` attribute). The rating line under the reviews links to Google, and the button beside it reads "More customer reviews". Review text is still copied verbatim from `data/testimonials.json`.
- **Phone numbers:** every phone number is a tap-to-call `tel:` link (`.v2-tel`), including inside prose.
- **Button wording:** "Request a Repair" (header, drawer, footer, page buttons); the sticky mobile bar reads "Request Repair". Never "Book a Repair", "Book Online" or "Book Now".
- **Tap targets:** 44px minimum for every link and button on a phone (`.v2-link`, `.v2-rating`, `.v2-review-more` and the FAQ and disclosure rows all carry it; `.v2-btn` is 50px).
- **Focus ring:** `a:focus-visible` and `button:focus-visible` inside `.v2` draw a 3px solid `--focus` outline with 3px offset. Do not remove it or replace it with a colour that is not a token. On the ink surfaces (`.v2-sec--ink` and `.v2-cta`) `--focus` is redefined to `#fff` (13.86:1 on ink) because `#1479a8` is only 2.86:1 there and WCAG 1.4.11 needs 3:1.
- **Motion:** every v2 transition is disabled under `prefers-reduced-motion: reduce`.
- **Still true from section 6:** no em dashes in copy, no gradient text, no nested cards, no side-stripe borders.
