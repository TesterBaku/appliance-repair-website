---
target: articles/article-rental-appliance-law-los-angeles-county.html
total_score: 34
p0_count: 1
p1_count: 2
timestamp: 2026-08-18T22-31-10Z
slug: ticle-rental-appliance-law-los-angeles-county-html
---
Method: dual-agent (A: a2eb7c0b9ddecf58e · B: aead3bd0a6cfa4c26)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3/4 | Hamburger↔X and FAQ `+` transitions are clear; no other feedback gaps found |
| 2 | Match System / Real World | 4/4 | "Stove vs. fridge" comparison table and plain-language FAQ phrasing genuinely match a worried renter's mental model |
| 3 | User Control and Freedom | 2/4 | Drawer closes via hamburger, outside-click, and Escape — but no focus trap; Tab from the last drawer link escapes to page content still hidden behind the open drawer, with no visible focus indicator anywhere |
| 4 | Consistency and Standards | 3/4 | Nav/drawer/sticky bar/FAQ match the site's standard article template; the 3-line phone-number wrap is inconsistent with the page's otherwise tidy polish |
| 5 | Error Prevention | 4/4 | No forms on this page; all CTAs are simple `tel:`/anchor links, no destructive actions |
| 6 | Recognition Rather Than Recall | 4/4 | Sticky TOC, breadcrumb, and persistent mobile call/book bar keep the reader oriented |
| 7 | Flexibility and Efficiency | 3/4 | TOC anchors and inline CTAs serve skimmers and readers; no skip-to-content link |
| 8 | Aesthetic and Minimalist Design | 4/4 | Restrained callout/table system, strong signal-to-noise for a legal-explainer article |
| 9 | Error Recovery | 4/4 | N/A — no error states exist on this page |
| 10 | Help and Documentation | 3/4 | "Not legal advice" callout + References block with the primary statute link is exactly the reassurance this topic needs |
| **Total** | | **34/40** | **Good — solid foundation, address weak areas** |

## Anti-Patterns Verdict

**LLM assessment (Assessment A):** No AI-slop tells at ban threshold — no side-stripe borders, gradient text, glassmorphism, hero-metric template, or numbered 01/02/03 scaffolding, and no text overflow at either breakpoint tested. The uppercase meta-tag pills ("Legal & Compliance", "Los Angeles County") and uppercase table headers are a mechanical touch but consistent with the rest of the site's design system, not a generated-looking default.

**Deterministic scan (Assessment B):** `node .agents/skills/impeccable/scripts/detect.mjs --json articles/article-rental-appliance-law-los-angeles-county.html` — exit code 0, **0 findings, clean** (no `numbered-section-markers` false-positive here, unlike the sister article).

The live-server browser overlay (`detect.js`, injected via a fresh tab) reported 23 anti-pattern findings the static CLI scan couldn't see:
- `low-contrast` ×1 — h1 "1.0:1 (need 3:1) — text #ffffff on #f7fafc". **Confirmed as a false positive**, same root cause as the sister article: the h1 sits inside `.article-hero`, whose `.article-hero-overlay` div (line 177) applies `linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.85) 100%)` over the hero photo. The detector's static walk-up hit `body`'s declared `#f7fafc` and missed the dark overlay sitting between them; the rendered page has white text on a near-black gradient, not on `#f7fafc`.
- `line-length` ×21 — mostly `p` at ~95-100 chars/line, one `p.table-source-note`, two `li` at ~103 chars/line. **Confirmed as real**: same `.article-wrap` (max-width 760px, line 178) + `.article-body p` (font-size 15px, line 181) combination as the sister article — genuinely exceeds the 65-75ch readability guideline, a pre-existing typography gap unrelated to this PR's nav-cascade fix.
- `overused-font` ×1 — Inter at 95% of text. **False positive per project standing rule**: `AGENTS.md` states Inter is deliberately used site-wide, and this rule is already suppressed in `.impeccable/config.json` for the per-edit hook; the live-server overlay is an unconfigured copy of the same engine.

**Visual overlays:** No live overlay is left open in a browser tab for the user — Assessment B's live-server + injected `detect.js` was stopped (`taskkill`, port confirmed unreachable) and the tab closed before this report was compiled. The findings above are console-log evidence, not an inspectable overlay.

## Overall Impression

This article scores higher than its sister piece (34/40 vs 30/40) — the legal-explainer content is unusually candid and well-matched to an anxious renter's mental model, and the CLI detector found zero static-markup issues. The mobile hamburger drawer reproduces the exact same shared-component defects found on the sister article (no focus trap, an ARIA violation on the outside-click close path), confirming these are bugs in the shared `site.js` drawer component, not anything specific to either page's markup. This page's own distinct twist is a worse phone-number wrap (three fragmented lines rather than a tight-spacing issue) right next to the hamburger, in a header that is otherwise the tidiest thing on the page.

## What's Working

- The stove-vs-refrigerator comparison table converts a wordy legal asymmetry into an instantly scannable structure — exactly the "clarity over cleverness" brand principle in practice.
- FAQ content mirrors real reader questions ("Can my landlord make me buy my own refrigerator?") and is honest about legal uncertainty ("we won't guess at an answer") — unusually candid for marketing copy, which builds real credibility on a legal topic.
- The `.article-toc` anchor nav gives a stressed skimmer an immediate sense of scope on a long, dense legal article and a way to jump straight to their situation.

## Priority Issues

- **[P0] Mobile nav drawer has no focus trap; Tab from the last drawer link escapes to page content that is completely hidden behind the still-open, opaque drawer.** Why it matters: Assessment A confirmed via `document.elementFromPoint` at the escaped-to link's coordinates that it returns a drawer link, not the focused element — so there is zero visual indicator anywhere on screen of where focus went. This is worse than a generic "focus escapes to page content" bug because the destination is literally invisible. This exactly reproduces the P0 already found on the sister article (`articles/article-appliance-lifespan-los-angeles-county.html`), confirming it as a shared `site.js` drawer defect, not page-specific. Fix: trap focus within `#mobile-nav-drawer` while open (cycle Tab/Shift+Tab between first and last drawer link). File: shared `site.js` (`initDrawer`, article-family branch — no keydown Tab handling currently exists). **Suggested command**: `/impeccable harden`
- **[P1] `aria-hidden` is set on the drawer while it still contains focus, on the outside-click close path.** Why it matters: Assessment A observed a live console warning ("Blocked aria-hidden on an element because its descendant retained focus") when clicking outside the drawer while a drawer link has focus — a real WAI-ARIA violation Chrome itself blocks rather than let corrupt the accessibility tree; the Escape-key close path correctly moves focus first and does not trigger this. Reproduces the sister article's P1 verbatim, confirming a shared-component fix is needed once, not twice. Fix: move focus to the hamburger button before (or in the same tick as) setting `aria-hidden` on every close path, not just Escape. File: shared `site.js` (`setNavOpen` + outside-click handler). **Suggested command**: `/impeccable harden`
- **[P1] Header phone number fragments into 3 stacked lines at 375px, immediately next to the hamburger.** Why it matters: `(949) 629-5365` renders as three broken fragments ("(949)" / "629-" / "5365") in a 62px-wide box. For a "stressed homeowner/renter, mobile-first" audience whose brand principle explicitly promises the phone/booking path is never more than one action away, a visually fractured number reads as broken rather than intentional at exactly the moment a reader wants to call. This is a distinct variant of the sister article's phone-number finding (that page had adequate 14px spacing but the same 44×44px-boundary risk; this page's phone text itself wraps). Fix: either hide the header phone text at this breakpoint (the sticky bottom bar already offers "Call Now") or apply `white-space: nowrap` with an adjusted font-size/flex-basis so it stays on one line. File: `articles/article-rental-appliance-law-los-angeles-county.html`, inline `<style>`, phone `<a>` near line 445 (unclassed, styled inline). **Suggested command**: `/impeccable adapt`
- **[P2] Hamburger tap target sits at the exact 44×44px WCAG floor with no margin for error.** Why it matters: Assessment B independently measured the bounding box at exactly 44×44px (288,13), matching the sister article's measurement precisely — confirming this is a shared-CSS sizing choice, not a per-page accident, and 44px is the minimum, not a comfortable target for an imprecise real-world tap. Fix: bump to ~48×48px with the icon centered. File: `articles/article-rental-appliance-law-los-angeles-county.html` line 271 (`.nav-hamburger`, shared inline style block). **Suggested command**: `/impeccable adapt`
- **[P2] Article body prose runs ~95–103 characters per line, well past the 65–75ch readability guideline.** Why it matters: detector-confirmed and verified against the CSS (`.article-wrap` max-width 760px at 15px body font) — identical root cause to the sister article, a pre-existing typography gap unrelated to the mobile-nav fix. Fix: narrow the effective prose column or bump body font-size to bring lines under ~75ch. **Suggested command**: `/impeccable typeset`

## Persona Red Flags

**Casey (distracted mobile user, primary weight given the hamburger focus):** Casey taps the hamburger one-handed while multitasking, glances away, then taps the visible article text below the drawer to dismiss it — this works today (outside-click closes it), but if that tap lands while a drawer link had accidental focus, the ARIA violation above means a VoiceOver/TalkBack user would be told focus is on a hidden element with no easy way back to visible content. Separately, Casey glancing at the header for the phone number sees three broken text fragments instead of a clean, tappable number — a "is this broken?" moment for someone who wants to call right now.

**Riley (stress tester, weighted for this legal-anxiety topic):** Riley, navigating by keyboard, opens the drawer, tabs through all 8 links plus the Call CTA, and on the next Tab loses all visual focus feedback entirely — the escaped-to link is invisible behind the drawer. Riley has no way to know if they're still "in the menu" or now somewhere in page content, and could trigger a `tel:` call unintentionally by pressing Enter on an element they can't see. For a reader dealing with a landlord dispute who needs precise navigation to the FAQ or References section, this is task-blocking, not cosmetic.

**Jordan (first-timer):** Largely unaffected — the TOC, plain-English FAQ, and stove/fridge table make this an approachable legal explainer. The one friction point: opening the drawer makes the hero image and headline vanish completely with no indication content still exists below, which could briefly read as "the page reset" rather than "a menu opened over part of the page."

## Minor Observations

- `.meta-tag` pills ("Legal & Compliance", "Los Angeles County") use `rgba(0,0,0,0.35)` fill over a hero photo with a gradient overlay already applied underneath — contrast is fine for this specific hero image but is image-dependent; worth a contrast-checker pass if the hero photo is ever swapped.
- Related-article cards reuse the same generic stock photo (`appliance-repair-generic.jpg`) despite this article having a unique, on-topic hero photo already — a missed opportunity, not a "slop" violation.
- Unused `.callout-blue`/`.callout-green` variants are defined in this page's own `<style>` block but only the amber legal-disclaimer callout is used — trivial dead CSS.
- Drawer list items separate only via a bottom border, with no distinct hover/active state (unlike the FAQ accordion's `:hover` background) — a minor missed consistency opportunity.

## Questions to Consider

1. This is the second article in a row to surface the identical shared-component P0/P1 pair (no focus trap, aria-hidden-while-focused) — is the real fix here "fix this article," or does continuing to run per-article critiques on a shared `site.js` bug mean the fix belongs in `site.js` once, gated by a single functional test, rather than being rediscovered per page?
2. The phone-number wrap looks like it's never been checked at 375px before (the same blind spot the hamburger itself had, pre-cascade-fix) — how many other article pages sharing this inline nav markup carry the same wrap bug, and would fixing it once in the shared nav partial be cheaper than patching each article's inline `<style>` block individually?
3. If Escape and outside-click both already close the drawer, why does only the Escape path correctly return focus first — was a full focus-trap partially implemented and then dropped?
