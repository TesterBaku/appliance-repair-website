# Visual Review Agent

Drive a real browser via Playwright MCP to visually verify pages at desktop and mobile viewports. Scope: only the pages **touched in the current branch** (or an explicit list). Returns screenshots inline plus a structured PASS / FAIL / WARN report.

This is the **deep visual gate**. It complements `/test` — it does not replace it.

| Command | What it does | When to run | Speed |
|---|---|---|---|
| `/test` | Link checker + Puppeteer batch screenshot | After every code change (in `/seo-blog` Phase 4 loop) | Fast |
| `/visual-review` | Live browser inspection at 2 viewports + structured checks | Before merging mobile/visual PRs; in `/seo-hub` Phase 5 | Slower |

---

## Invocation

```
/visual-review                                              # auto-detect touched pages from git diff
/visual-review pages/refrigerator-repair-orange-county.html # explicit single page
/visual-review index.html,pages/services.html               # explicit list
/visual-review --since=master                               # explicit base for git diff
```

If no pages are passed, scope automatically:

```bash
git diff --name-only $(git merge-base HEAD master)...HEAD -- '**/*.html' '*.html'
```

If `shared.css` is in the diff, expand the scope to include `index.html` plus every page known to use shared.css (every file in `pages/` and `articles/`). A change to shared styles affects everything.

If the list ends up empty, fall back to `index.html` and report "No HTML changes detected — reviewing homepage as a sanity check."

---

## Phase 0 — SCOPE

1. Compute the page list (per the rules above).
2. Print the list to the user before opening the browser:
   ```
   Visual review will cover [N] page(s):
     index.html
     pages/services.html
     pages/refrigerator-repair-orange-county.html

   Viewports: desktop (1440×900), mobile (375×812).
   ```
3. If the list is longer than 8 pages, ask: _"That's [N] pages × 2 viewports = [2N] checks. Continue, or narrow the list?"_ Wait for confirmation.

---

## Phase 1 — SETUP

1. Confirm Playwright MCP is available. The browser tools live under `mcp__playwright__*` (or whatever namespace the user's install exposes — call any browser tool once and inspect the response). If unavailable, abort with: _"Playwright MCP is not loaded. Install it or run `/test` for the smoke-test alternative."_

2. Determine the local serve URL. The site is static, so options are:
   - **Preferred:** spin up a temporary local server: `python3 -m http.server 8765 --directory .` in the background. Base URL: `http://localhost:8765`
   - **Fallback:** if a server is already running on a known port (check `package.json` for `npm start` or `npm run serve`), use that.
   - **Last resort:** open files via `file://` URLs. Note that this breaks any absolute paths in the HTML and is not representative of production.

3. Capture the server PID so it can be killed at the end.

---

## Phase 2 — CHECK MATRIX

For each page in scope, run **both** viewports. Use a fresh browser context per page so cookies/localStorage don't leak between pages.

### Viewport definitions

| Name | Width × Height | User-agent hint | Use case |
|---|---|---|---|
| `desktop` | 1440 × 900 | default | Standard laptop |
| `mobile` | 375 × 812 | iPhone 13 | Primary mobile target |

(Tablet at 768×1024 is optional. Skip unless the user asks.)

### Per-viewport steps

1. **Resize** the browser to the viewport dimensions.
2. **Navigate** to the page URL.
3. **Wait** for `networkidle` or a 2-second settle, whichever comes first.
4. **Screenshot** full-page. Save to `.audits/visual-review/[viewport]/[slug].png`.
5. **Run JavaScript checks** — see check list below.
6. **Read the console** for errors only (warnings are noise for this gate).
7. **Compile findings** for the page+viewport combo.

### Check list — Layout integrity (both viewports)

| Check | How to verify | Severity if fails |
|---|---|---|
| No horizontal scroll | `document.documentElement.scrollWidth <= window.innerWidth + 1` | **FAIL** |
| All images loaded | every `<img>` has `naturalWidth > 0` | **FAIL** if hero; **WARN** for non-hero |
| No element clips off the right edge | for every visible element, `getBoundingClientRect().right <= window.innerWidth + 1` | **WARN** (sample 50 largest elements only — full audit too slow) |
| No console errors | filter to `level === "error"` | **WARN** |

### Check list — Mobile-only (375px)

| Check | How to verify | Severity |
|---|---|---|
| Hamburger button visible | `getComputedStyle(document.querySelector(".nav-hamburger")).display !== "none"` | **FAIL** |
| Desktop nav hidden | `getComputedStyle(document.querySelector(".nav-links")).display === "none"` | **FAIL** |
| Sticky Call/Book bar visible (homepage + hub pages only) | `getComputedStyle(document.querySelector(".sticky-mobile-bar")).display !== "none"` | **FAIL** on homepage/hub pages; skip on articles |
| Hero h1 ≤ 34px | `parseFloat(getComputedStyle(document.querySelector(".hero h1, h1")).fontSize) <= 34` | **FAIL** |
| Tap targets ≥ 44px | sample 20 largest `<a>` and `<button>` by DOM order; each must have `offsetHeight >= 44 && offsetWidth >= 44` | **WARN** (under 44px) |
| Decorative `.float` hidden | `Array.from(document.querySelectorAll(".float")).every(el => getComputedStyle(el).display === "none")` | **WARN** (overlap risk) |
| Body has bottom padding for sticky bar | `parseFloat(getComputedStyle(document.body).paddingBottom) >= 64` | **WARN** on pages with sticky bar |

### Check list — Desktop-only (1440px)

| Check | How to verify | Severity |
|---|---|---|
| Desktop nav visible | `getComputedStyle(document.querySelector(".nav-links")).display !== "none"` | **FAIL** |
| Hamburger hidden | `getComputedStyle(document.querySelector(".nav-hamburger")).display === "none"` | **FAIL** |
| Sticky bar hidden | `getComputedStyle(document.querySelector(".sticky-mobile-bar")).display === "none"` | **FAIL** |
| Hero h1 ≥ 40px | `parseFloat(getComputedStyle(document.querySelector(".hero h1, h1")).fontSize) >= 40` | **WARN** |

### Check list — Interaction (mobile only, homepage + hub pages)

| Check | How to verify | Severity |
|---|---|---|
| Hamburger toggles correctly | Click `.nav-hamburger`. Confirm `aria-expanded="true"` and the drawer is visible. Press `Escape`. Confirm `aria-expanded="false"` and drawer hidden. | **FAIL** |

If any DOM selector is missing (e.g., a page has no `.sticky-mobile-bar`), record it as **N/A** rather than FAIL — but flag it in the report so the user can confirm whether the missing element is intentional.

---

## Phase 3 — REPORT

Print to the user:

```
=== Visual Review — branch [branch-name] ===

Scope: [N] page(s) × 2 viewports = [2N] checks
Local server: http://localhost:8765

────────────────────────────────────────────
[1/N] index.html — desktop (1440×900)
[screenshot inline]
PASS  no horizontal scroll
PASS  all images loaded (12/12)
PASS  desktop nav visible
PASS  hamburger hidden
PASS  sticky bar hidden
PASS  hero h1 = 50px (≥ 40px)
PASS  no console errors

[1/N] index.html — mobile (375×812)
[screenshot inline]
FAIL  hero h1 = 50px (limit 34px) — see rules/mobile-design.md
FAIL  hamburger button not found in DOM
FAIL  sticky-mobile-bar not in DOM (required on homepage)
WARN  3 tap targets under 44px:
        footer a "Privacy Policy" — 32px height
        footer a "Terms of Service" — 32px height
        nav-cta — 30px height
WARN  6 decorative .float elements visible (overlap risk on small screens)
PASS  no horizontal scroll
PASS  no console errors

────────────────────────────────────────────
[summary repeated for each page]

────────────────────────────────────────────
=== Summary ===

Pages reviewed: [N]
Total checks:   [N]
  PASS:  [N]
  WARN:  [N]
  FAIL:  [N]

Action: [N] FAIL items must be fixed before merge. [N] WARN items should be reviewed.

Top blockers:
  1. Mobile hero h1 sizing — affects [N] pages
  2. Missing hamburger menu — affects [N] pages
  3. Missing sticky-mobile-bar on homepage and hub pages

Screenshots saved to: .audits/visual-review/
```

---

## Phase 4 — TEARDOWN

1. Close the browser context.
2. Kill the local server: `kill <pid>`.
3. **Do not** stage or commit the screenshots — `.audits/` is gitignored. Never save screenshots to the repo root.

---

## Integration with other commands

- **`/test`** — fast smoke gate. Runs in the `/seo-blog` Phase 4 bug-fix loop. `/test` does not call `/visual-review` — they're separate gates.
- **`/seo-blog` Phase 5 (interactive mode only)** — may invoke `/visual-review` before asking for approval. Skip in scheduled mode (keeps the autonomous run fast).
- **`/seo-hub` Phase 5** — invokes `/visual-review` for the new hub page at both viewports. Hub pages are conversion-critical; the extra latency is worth it.
- **Mobile/visual PRs (action plan P1-1 through P1-5)** — run `/visual-review` before opening the PR.

---

## Rules

- Never run `/visual-review` against the production URL (`fixappliancesfast.com`) — always use a local server. Production checks happen via Lighthouse / manual.
- Never auto-fix what `/visual-review` finds. Reporting only — fixes are a separate, deliberate step so the user can review each change.
- Always include the screenshot in the report — the structured checks miss things that are obvious to a human eye.
- WARN items are not blockers but should be addressed within a release cycle. FAIL items are blockers.
- If Playwright MCP returns an error (browser crash, navigation timeout, etc.), retry once, then report the failure clearly — don't silently degrade to a partial check.
- Touched-pages scoping is the default. Reviewing all pages every time is wasteful; whole-site reviews belong in the quarterly `/seo-audit` flow.
