---
target: articles/article-appliance-lifespan-los-angeles-county.html
total_score: 30
p0_count: 1
p1_count: 2
timestamp: 2026-08-18T22-22-00Z
slug: article-appliance-lifespan-los-angeles-county-html
---
Method: dual-agent (A: a9492b35c09c82b30 · B: a95115f57fcf06a60)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3/4 | Hamburger↔X transition is clear, but focus can move to obscured content with no visible indicator during drawer-open |
| 2 | Match System / Real World | 4/4 | Plain-language copy, LA-specific framing (Gateway Cities, Pasadena) matches how a homeowner actually thinks |
| 3 | User Control and Freedom | 2/4 | Drawer closes on Escape and outside-click, but no focus trap — Tab can walk a keyboard user out of the drawer into obscured content while it's still visually open |
| 4 | Consistency and Standards | 3/4 | Drawer/hamburger pattern and inline-CTA styling are consistent with the shared site pattern |
| 5 | Error Prevention | 2/4 | No forms/destructive actions on this page, but the focus-escape bug is an unprevented state-management error |
| 6 | Recognition Rather Than Recall | 4/4 | Sticky TOC anchors, mobile call/book bar, breadcrumb — reader never has to remember where they are |
| 7 | Flexibility and Efficiency | 3/4 | TOC jump links and inline CTAs give shortcuts; no skip-to-content link for keyboard/screen-reader users |
| 8 | Aesthetic and Minimalist Design | 4/4 | Clean data-table styling, restrained callouts, good whitespace |
| 9 | Error Recovery | 2/4 | No applicable error states, but the drawer bug produces a "lost" state with no visible way to recover except manual scroll |
| 10 | Help and Documentation | 3/4 | References block and inline source-methodology caveats are unusually strong "documentation" for a marketing page |
| **Total** | | **30/40** | **Good — solid foundation, address weak areas** |

## Anti-Patterns Verdict

**LLM assessment (Assessment A):** Not AI-slop-coded. No gradient text, side-stripes, glassmorphism, 01/02/03 numbered scaffolding, tracked eyebrows, or repeated hero-metric cards. The two inline-CTA blocks (lines 190, 568, 684) are visually identical (same gradient, same "Book a [X]" copy pattern) — a reused component, not hand-designed, but acceptable for a content site.

**Deterministic scan (Assessment B):** `node .agents/skills/impeccable/scripts/detect.mjs --json articles/article-appliance-lifespan-los-angeles-county.html` — exit code 2, 1 finding: `numbered-section-markers` (advisory, snippet "Sequence: 10, 11, 12" — this is the article's own numbered FAQ/heading sequence, not a decorative 01/02/03 scaffold; treated as a false positive, matching Assessment A's independent verdict of no AI-slop numbered markers).

The live-server browser overlay (`detect.js`, injected via a fresh tab) additionally reported 28 anti-pattern findings not visible to the static CLI scanner:
- `low-contrast` ×1 — h1 "1.0:1 (need 3:1) — text #ffffff on #f7fafc". **Investigated and confirmed as a false positive**: the h1 sits inside `.article-hero`, which has a `.article-hero-overlay` div (lines 174-177) applying `linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.85) 100%)` over a background photo. The detector's static contrast check walked up the DOM to the nearest declared `background-color` (`body`'s `#f7fafc`, line 166) and missed the absolutely-positioned dark overlay + background image sitting between them. In the actual rendered page, white text sits on a near-black gradient, which passes contrast comfortably.
- `line-length` ×26 — "~95–103 chars/line (aim for <80)" across `.article-body p`/`li` elements. **Confirmed as real**, not a false positive: `.article-wrap` is `max-width: 760px` (line 178) with `.article-body p` at `font-size: 15px` (line 181) and no narrower content column — at that width/size, prose measures noticeably past the skill's 65–75ch guidance and past even the detector's 80-char threshold. This is a genuine, previously-unflagged typography issue, not a mobile-nav-related regression.
- `overused-font` ×1 — Inter at 96% of text. **False positive per project standing rule**: `AGENTS.md` states Inter is used site-wide by deliberate brand decision, and this exact rule is already suppressed in `.impeccable/config.json` for the per-edit hook; the live-server's `detect.js` overlay is an unconfigured copy of the same engine, so it still fires here.

**Visual overlays:** No user-visible browser overlay was left open for the user to inspect — Assessment B's live-server + injected `detect.js` was already stopped and the tab closed before this report was compiled (per its recorded stop method: `taskkill` on the live-server PID, tab closed). The findings above are console-log evidence, not a live overlay still visible in a browser tab.

## Overall Impression

The article's content and information architecture are genuinely strong for a marketing/SEO page — clear hierarchy, honest sourcing, good conversion placement. The single biggest opportunity is the mobile hamburger drawer, which is now rendering for the first time on this page after the cascade fix: its happy-path (tap to open, tap a link, Escape to close) works, but its keyboard/focus edge cases were never exercised before this PR and have real gaps (no focus trap, an inconsistent aria-hidden-while-focused path on outside-click). None of these are things the CSS reorder introduced — they're pre-existing drawer-JS gaps in the shared `site.js` component that simply couldn't be seen until the drawer became visible on this page.

## What's Working

- The DOE-vs-Consumer-Reports methodology explainer (lines 631-639) is differentiated, trust-building content — it explains a disagreement instead of picking a convenient number, directly reinforcing the brand's "trust before pitch" principle.
- `.stat-table` design (zebra striping, bold numeric cells) makes dense Census/DOE data scannable on a phone instead of a wall of numbers.
- The two inline CTAs sit at natural decision points (after the renters section, after the FAQ), not just top/bottom — good conversion placement without feeling pushy.

## Priority Issues

- **[P0] Mobile drawer has no focus trap; Tab can move keyboard focus into page content hidden behind the still-open drawer with no visible focus indicator.** Why it matters: Assessment A reproduced this live — tabbing from the last drawer link ("Call (949) 629-5365") moves focus to the hero byline link, force-scrolling that element into view even though `body{overflow:hidden}` is supposed to lock background scroll while the drawer is open. A keyboard-only or low-vision user loses their place entirely. This exact interaction was never exercised before this PR (the drawer was `display:none` at every viewport until the cascade fix). Fix: trap focus inside `#mobile-nav-drawer` while `[data-open]` is set, cycling from the last link back into the drawer rather than out to the page. File: shared `site.js` drawer handler (drawer JS is single-sourced there per AGENTS.md), markup at `articles/article-appliance-lifespan-los-angeles-county.html` lines 447-461. **Suggested command**: `/impeccable harden`
- **[P1] Closing the drawer via outside-click can leave `aria-hidden="true"` set on a container that still contains the focused element**, a real WAI-ARIA violation path distinct from the Escape-key close (which correctly moves focus to the hamburger first). Why it matters: screen readers can behave unpredictably (announcing hidden content, or losing track) when this happens. Fix: on every drawer-close path, blur/move focus to the hamburger button before setting `aria-hidden`, matching the Escape handler's existing order. File: shared `site.js`. **Suggested command**: `/impeccable harden`
- **[P1] Hamburger tap target measures exactly 44×44px with no margin, 14px from a phone number that wraps to three lines at 375px.** Why it matters: Assessment B independently measured the bounding box at exactly 44×44px (x:284, y:13 in a 367px-wide viewport) — the AA floor, not a safe target; any font-load reflow or rounding risks dropping under the minimum, and the tight phone-number wrap next to it raises mis-tap risk for a stressed mobile user. Fix: add a few px of padding/margin around the hamburger tap area, and shorten the header phone display at ≤375px (e.g., icon-only) so it stops wrapping to 3 lines. File: `articles/article-appliance-lifespan-los-angeles-county.html` line 271 (`.nav-hamburger`), line 445 (phone link). **Suggested command**: `/impeccable adapt`
- **[P2] No scrim/overlay behind the open drawer.** Why it matters: Assessment B confirmed no separate `.overlay`/backdrop element exists alongside the drawer. Combined with the P0 focus-trap gap, the drawer visually and semantically behaves like a modal (fixed position, z-index 99, opaque background, `aria-expanded`/`aria-hidden` wiring) without actually committing to modal behavior, which reads as unfinished rather than a deliberate lightweight-disclosure choice. Fix: add a semi-transparent backdrop when open, or make the panel commit to full-height. File: shared `site.js`/drawer CSS. **Suggested command**: `/impeccable polish`
- **[P2] Article body prose runs ~95–103 characters per line, well past the 65–75ch readability guideline.** Why it matters: detector-confirmed and independently verified against the CSS (`.article-wrap` max-width 760px at 15px body font, line 178/181) — long lines increase re-fixation effort for a reader skimming on the go. Not related to the mobile-nav change; a pre-existing typography gap the detector surfaced. Fix: narrow the effective prose column (e.g., a dedicated `max-width` on `.article-body` narrower than `.article-wrap`, or bump body font-size slightly) to bring lines under ~75ch. **Suggested command**: `/impeccable typeset`

## Persona Red Flags

**Casey (distracted mobile user, primary weight given the hamburger focus):** Casey taps the hamburger looking for the phone number or "Contact" while multitasking. If Casey uses assistive swipe navigation or an external keyboard rather than pure touch, the P0 focus-escape bug means Casey's next input jumps them into unrelated article paragraph text with the drawer still visually open on top — exactly the "wait, what happened" moment that loses a distracted user. Even in pure-touch mode, the missing scrim (P2) means the drawer doesn't read as fully "paused," so an accidental tap on the visible sliver of body content below it could register while Casey still thinks they're in the menu.

**Riley (stress tester):** Tabbing past the last drawer link, or closing via outside-click while focus is inside, both produce inconsistent focus state — Escape correctly returns focus to the hamburger, outside-click and tab-out do not (P1). Riley would flag this immediately as an untested path, which per this PR's own description it literally is: the hamburger was `display:none` at every viewport before this fix, so none of this interaction was ever exercised in production.

**Jordan (first-timer):** Jordan's actual reading path (scroll the article, use TOC anchors, tap an inline CTA) is unaffected by any of the above — the drawer bug only surfaces for keyboard/non-pointer navigation, which a first-time touchscreen reader is unlikely to trigger. Jordan's experience of the article content itself (hierarchy, TOC, FAQ, CTA placement) is solid.

## Minor Observations

- `.inline-cta` gradient (`linear-gradient(135deg, #cc3d12, #9e300a)`, line 190) does not match the documented brand token `craftsmans-ember #e84c1e` — the footer's small icon swatch (line 737) does use `#e84c1e` correctly, so the article CTA and the footer icon use two different oranges. Worth a DESIGN.md drift check, unrelated to this PR.
- No skip-to-content link before the nav, so a keyboard/screen-reader user must tab through the full nav-dropdown structure (or the mobile drawer's 9 links) before reaching the article. Minor for a marketing page, easy to add.
- Unused `.callout-amber`/`.callout-green` variants are defined but only `.callout-blue` is used in this article — likely shared across templates, not a page-specific problem.

## Questions to Consider

1. Given the drawer's Escape handler already does "move focus to hamburger, then hide" correctly, why does the outside-click/tab-out path not reuse the same close function — two separate code paths, or one path with an ordering bug?
2. If body-scroll-lock is intended while the drawer is open, should the drawer also trap focus as a matter of course, since both are the same underlying promise ("nothing else on the page moves while this is open")?
3. Is the missing scrim a deliberate "lightweight disclosure, not a modal" choice, or an oversight — the ARIA wiring (`aria-expanded`, `aria-hidden`, `aria-controls`) already describes modal-ish semantics that the visual/focus behavior doesn't fully back up?
