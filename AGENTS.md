## Workflow Orchestration

### 1. Plan Mode Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### 3. Self-Improvement Loop
- After ANY correction from the user: update tasks/lessons.md with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes -- don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests -- then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

---

## Task Management

1. **Plan First:** Write plan to tasks/todo.md with checkable items
2. **Verify Plan:** Check in before starting implementation
3. **Track Progress:** Mark items complete as you go
4. **Explain Changes:** High-level summary at each step
5. **Document Results:** Add review section to tasks/todo.md
6. **Capture Lessons:** Update tasks/lessons.md after corrections

---

## Core Principles

- **Simplicity First:** Make every change as simple as possible. Impact minimal code.
- **No Laziness:** Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact:** Only touch what's necessary. No side effects with new bugs.

# Appliance Repair Website

Static HTML website for an appliance repair service. No framework and no CSS build for page styling — styles live in `shared.css` plus small per-page `<style>` blocks. (Tailwind, previously loaded via CDN and a compiled `tailwind.css`, was removed in 2026-05; do not reintroduce it.)

**Production domain:** `https://fixappliancesfast.com/`
**Public business name:** Universal Appliances Repair
**Legal name:** Universal Appliances Repair Group Inc.

> Brand canonicalization is enforced in `rules/seo-content.md`. Never write "Fix Appliances Fast" as a brand — it is only a URL.

## Commands

```bash
npm start                  # Serve locally at http://localhost:3000 (via npx serve .)
npm test                   # Link check + HTML integrity + content integrity + CSS vars + footer-partial drift check
npm run test:functional    # Playwright functional suite (currently ~585 tests; auto-starts a server on :8788 via test/serve.js)
npm run screenshot         # Puppeteer batch screenshots
npm run test:all           # All of the above in one shot
npm run build:sitemap      # Regenerate sitemap.xml from the file tree + git history
npm run build:partials     # Re-stamp the shared footer partial into every page (run after editing partials/footer.html)
npm run sync:testimonials  # Sync the GBP review-count surfaces from data/testimonials.json
```

`npm test` runs against the static files and does NOT spin up a server. `npm run test:functional` auto-starts a server on port 8788. To run a single Playwright spec or a filtered subset:

```bash
npx playwright test --grep "nav dropdown"
npx playwright test test/functional.spec.js
```

## Architecture

### Page types

| Type | Location | Purpose |
|------|----------|---------|
| Homepage | `index.html` | Main landing, conversion-focused |
| Static pages | `pages/about.html`, `pages/services.html`, etc. | Standard site pages |
| Per-appliance hub | `pages/<appliance>-repair-orange-county.html` | SEO hubs per appliance type |
| Per-brand hub | `pages/<brand>-appliance-repair-orange-county.html` | Luxury/premium brand hubs |
| Per-city hub | `pages/appliance-repair-<city>-ca.html` | Local SEO city landing pages |
| Blog listing | `pages/blog.html` (+ category pages under `pages/blog/`) | Article index with cards |
| Articles | `articles/article-*.html` | Individual SEO blog posts |

Hub pages share the same section structure: hero → trust bar → services → testimonials → FAQ → dark CTA. Articles have their own layout with inline CTAs.

### Styles

`shared.css` is the primary stylesheet — custom components (`.btn-primary`, `.nav-dropdown`, `.inline-cta`, `.hub-hero-bg`, footer/shadow vars, etc.). Pages also carry small per-page `<style>` blocks. There is no Tailwind and no CSS compile step.

### Data

`data/testimonials.json` is the canonical source for all customer review TEXT. Never write review body text from scratch in HTML; always copy it verbatim from this file. `pages/testimonials.html` is **hand-maintained, not generated**: the displayed review cards are a curated subset of the JSON pool (with per-card review photos and ordering not derivable from the JSON), so add or edit cards directly. Run `npm run sync:testimonials` (`scripts/sync-testimonials-count.js`) to sync only the GBP review-count surfaces (AggregateRating + count copy + stat) from the JSON. (The former `build-testimonials-html.js` generator was retired on 2026-05-31: it rendered an outdated page design and silently dropped the dropdown-nav JS and the review-photo images on quote cards.)

### Shared chrome (partials)

The site footer is single-sourced in `partials/footer.html` and stamped into every page at build time by `scripts/build/inject-partials.js` (depth-aware: `root → pages/`, `pages/ → ""`, `pages/blog/ → ../`, `articles/ → ../pages/`). The deployed artifact stays pure static HTML. Edit the partial, then `npm run build:partials`; `npm test` runs `inject-partials --check` and fails on drift (or a forgotten rebuild). Do NOT hand-edit a page's `<footer>` — change the partial.

### Scripts

- `scripts/` — active automation: `build-sitemap.js`, `add-seo-improvements.js` (quarterly-audit SEO fixer), `sync-testimonials-count.js`, `add-hero-preload.mjs`, `add-nav-link.js`, `add-article-hamburger.js`, image/favicon helpers. Run these explicitly; none are wired to pre-commit hooks.
- `scripts/build/` — build-time injectors (`inject-partials.js`).
- `scripts/oneoff/` — historical, already-run one-off scripts, kept for provenance (see its README). None are npm-wired.

## Critical technical patterns

**Every HTML page must have:**
1. GA tag as the first child of `<head>` (id: `G-TSFHKJ6ZEK`) — see "Required on every new HTML page".
2. `<link rel="canonical" href="https://fixappliancesfast.com/...">` after `<title>`.
3. Dropdown nav JS injected before `</body>` (sentinel: `<!-- DROPDOWN_JS_INJECTED -->`).

**Article dates** — all timestamps use the UTC offset (`+00:00`), not PDT (`-07:00`). See the "Article modified_time" standing rule.

**Sitemap** — always regenerate with `npm run build:sitemap` and commit the result on any PR that adds, removes, or renames an `.html` file. Never hand-edit `sitemap.xml`.

**Em dashes** — banned in all editorial copy (customer review body text is exempt, verbatim). Grep changed files before committing: `grep -n '—' <changed-files>`. Replace with commas, semicolons, colons, or parentheses. (En dashes like "Mon–Sat" are allowed.)

**CSS background-image heroes** (hub pages) require an explicit `<link rel="preload" as="image">` in `<head>` — the browser preload scanner cannot discover them from CSS. Use `scripts/add-hero-preload.mjs` to backfill.

**Inline CTA paragraph links** — any `.inline-cta` block must define `.inline-cta p a` before `.inline-cta a` to prevent paragraph links from inheriting button styles.

## Rules
- `rules/git-workflow.md` — branch naming, commits, PRs, code review
- `rules/seo-content.md` — SEO guidelines, brand canonicalization, hub-page architecture, AI answer block, llms.txt requirement, schema templates
- `rules/mobile-design.md` — required `@media` breakpoints, hamburger nav, sticky bottom Call/Book bar, tap-target sizes, form behavior on mobile
- `.claude/rules/gbp-platform-policy.md` — verify platform content policies before writing any external-platform copy (GBP posts must be purely descriptive)

## Active plans (tasks/ — gitignored, local)
- `tasks/backlog.md` — single source of truth for all open work
- `tasks/schedule-4-weeks.md` — current dated execution plan
- `tasks/architecture-cleanup-plan-2026-05-31.md` — the P0–P3 architecture/refactor roadmap (footer/nav/head partials, CSS/JS consolidation, schema)
- `tasks/lessons.md` — patterns learned from corrections; review at session start

## Logs
- `logs/CONTENT_LOG.md` — running log of every `/seo-blog` run: articles created, PRs, commits, workflow changes
- `logs/HUB_LOG.md` — running log of every `/seo-hub` run: hub pages created, PRs (open for owner review), outstanding placeholder items
- `logs/AUDIT_LOG.md` — quarterly SEO audit results: auto-fixes applied, items needing human review

## Scheduled Automation

### Content publishing — `/seo-blog`
Runs **Mon/Wed/Fri at 6 AM Pacific (13:00 UTC)**. Fully autonomous: research → propose → write → test → merge.

- **Routine ID:** `trig_01ApQaWZG9LhY6jsp8tbxn8D`
- **Manage / disable:** https://claude.ai/code/routines/trig_01ApQaWZG9LhY6jsp8tbxn8D
- **What it does:** Phase 0 web research, auto-selects topic 1, creates 1 article per run, runs tests, reviews, **merges automatically**, logs in `CONTENT_LOG.md`
- **DST note:** cron is fixed at 13:00 UTC; update to `0 14 * * 1,3,5` in November when clocks fall back to PST

### Quarterly SEO audit — `/seo-audit`
Runs **1st of Jan, Apr, Jul, Oct at 6 AM Pacific (13:00 UTC)**. Audits all articles, auto-fixes schema/meta gaps, opens a PR with a report of flagged items.

- **Routine ID:** `trig_01Sh3FPw2RJwrnSPXG3KjnrD`
- **Manage / disable:** https://claude.ai/code/routines/trig_01Sh3FPw2RJwrnSPXG3KjnrD
- **What it does:** scans all `article-*.html` for schema, OG tags, image dimensions, content quality; auto-fixes with `scripts/add-seo-improvements.js`; opens a PR with audit report — **does not merge** (needs owner review of flagged items)
- **Audit log:** `logs/AUDIT_LOG.md`

## Standing Rule — Impeccable for UI/UX Work

Any PR touching `.html` or `.css` files **must** run `/impeccable critique` on every changed page before the PR is created. Fix all FAIL items. Include the score in the PR description.

The `/review` subagent must also run `/impeccable critique` when the diff includes HTML or CSS. An impeccable FAIL is a merge blocker — same weight as a broken link.

The impeccable design system is in `.agents/skills/impeccable/`. Context (brand, colors, typography) is in `PRODUCT.md` and `DESIGN.md` at the project root.

## Standing Rule — PR on Every Change
Any request that results in a code or file change must go through the full workflow:
branch → commit → **all three tests** → PR → review → merge. No exceptions, even for small edits.

**Three required tests — all must exit 0 before opening a PR:**
```
npm test                 # link check (101 pages) + integrity + CSS vars + footer-partial drift check
npm run screenshot       # puppeteer batch screenshots
npm run test:functional  # Playwright functional suite (currently ~585 tests) — nav, dropdowns, forms, accordions, articles, hubs
```

After adding/editing/removing an `.html` page, also regenerate and commit the sitemap:
```
npm run build:sitemap
git diff --quiet sitemap.xml && echo "PASS" || echo "FAIL — commit the sitemap"
```

The `/review` subagent must flag as **FAIL** any PR whose description does not confirm `npm run test:functional` passing.

## Standing Rule — Article modified_time on Every Edit

Whenever any file in `articles/` is edited — content, meta tags, images, links, or schema — update **both** of these fields to today's UTC date timestamp before committing:

1. `<meta property="article:modified_time" content="YYYY-MM-DDT00:00:00+00:00" />`
2. `"dateModified": "YYYY-MM-DDT00:00:00+00:00"` in the JSON-LD Article schema block

Both must match exactly, including the `T00:00:00+00:00` UTC offset. Applies to every edit, even one-liners. Do NOT change `article:published_time` or `datePublished`.

When the content change is substantive (not just metadata), also update the matching blog card date in `pages/blog.html` to `Updated [Month YYYY]`.

**Exception — cosmetic href-target changes.** A change that swaps only the target of an `<a href="…">` to an equivalent canonical URL (e.g., `/index.html` → `/`) and does not alter any rendered DOM, text, image, or schema field is exempt. Such PRs MUST state the exemption in the description. Precedent: the internal-link-canonicalization PR, 2026-05-25.

**Exception — site-wide chrome / template rollouts.** A change that only restamps shared chrome on every page (the injected footer / nav / head partials via `scripts/build/inject-partials.js`) does **not** bump article `modified_time` / `dateModified`, even though it alters the rendered footer/nav DOM. `modified_time` signals *article content* freshness; marking dozens of articles "modified today" for a global footer change is a misleading freshness signal to search engines. Such PRs MUST state this exemption in the description and link to this rule. Owner-confirmed precedent: PR-5 footer partial injection, 2026-05-31. (Distinct from the cosmetic-href exemption, which requires zero DOM change; this one explicitly permits the chrome DOM change.)

## Standing Rule — UTF-8 Without BOM

All HTML files must be plain UTF-8, no BOM. When writing files programmatically on Windows:
- Check that the tool or script does not prepend `EF BB BF` bytes (UTF-8 BOM preamble).
- When using PowerShell 5.1, `[System.Text.Encoding]::UTF8` with `WriteAllText` adds a BOM — use `[System.IO.File]::WriteAllBytes` with bytes from `[System.Text.Encoding]::UTF8.GetBytes($content)` instead.
- After writing, verify first 3 bytes are not `EF BB BF`.

## Site-wide required files (must return 200)
- `/robots.txt`
- `/sitemap.xml`
- `/llms.txt` — plain-text business summary for AI crawlers

## Required on every new HTML page
Every new `.html` file — article, hub page, or static page — must include the Google Analytics tag as the **first child of `<head>`**, before any other tags:

```html
<head>
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-TSFHKJ6ZEK"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-TSFHKJ6ZEK');
  </script>
  <!-- rest of head -->
```

- Never add more than one Google tag per page.
- The `/review` skill must flag any new page missing this tag as a **FAIL**.

## Skills (slash commands)
- `/seo-blog` — full SEO blog workflow for articles: research → propose → create → test → demo → iterate → PR → review → merge. Auto-merges in scheduled mode (Mon/Wed/Fri).
- `/seo-hub` — full hub-page workflow for service and city landing pages. Same shape as `/seo-blog` but **interactive-only and never auto-merges** — hub pages always wait for owner review. Use this for the per-service and per-city hubs in `tasks/backlog.md`.
- `/seo-audit` — quarterly SEO audit: scan all articles, auto-fix schema/meta gaps, open PR with report
- `/pr` — generate and create a pull request for the current branch
- `/review` — review changed files before merging. **Must flag as FAIL if `npm run test:functional` is not confirmed passing. Must run `/impeccable critique` on any changed HTML/CSS page and flag impeccable FAILs as merge blockers.**
- `/test` — run all three test commands: `npm test` (links + integrity + partial drift) + `npm run screenshot` + `npm run test:functional` (currently ~585 tests). All must exit 0.
- `/impeccable` — design quality tool. Required before any PR that touches HTML or CSS. Fix all FAIL items before opening the PR. See `.agents/skills/impeccable/` for full documentation.
- `/visual-review` — Playwright MCP-driven deep visual check at desktop + mobile viewports, scoped to touched pages by default. Use after `/test` for any visual/CSS work; auto-invoked by `/seo-hub` Phase 5.
- `/new-content` — lightweight scaffolder for a single article, hub page, or static page (no research, no test loop — use when you just need a stub)

## Project Structure
- `index.html` — homepage
- `pages/about.html`, `pages/services.html`, `pages/contact.html`, `pages/faq.html`, `pages/testimonials.html`, `pages/blog.html` — main pages
- `pages/[appliance]-repair-orange-county.html` — per-service hub pages
- `pages/[brand]-appliance-repair-orange-county.html` — per-brand hub pages
- `pages/appliance-repair-[city]-ca.html` — per-city landing pages
- `pages/service-areas.html` — service-areas hub
- `pages/blog/*.html` — blog category pages
- `articles/article-*.html` — individual blog articles
- `partials/footer.html` — single-sourced footer (injected by the build step)
- `shared.css` — shared styles used across all pages
- `scripts/` — active node scripts; `scripts/build/` injectors; `scripts/oneoff/` historical one-offs
- `test/` — link/integrity/css checks, Puppeteer screenshots, Playwright functional spec, static server

## Tech Stack
- Vanilla static HTML — no framework, no Tailwind
- `shared.css` + small per-page `<style>` blocks (no CSS compile step)
- Minimal build steps (run explicitly, output committed): `build:sitemap`, `build:partials`
- Puppeteer (screenshots) + Playwright (functional testing, currently ~585 tests in `test/functional.spec.js`)
