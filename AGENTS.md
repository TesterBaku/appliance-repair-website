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

> Brand canonicalization is enforced in `.claude/rules/seo-content.md`. Never write "Fix Appliances Fast" as a brand — it is only a URL.

## Commands

```bash
npm start                  # Serve locally at http://localhost:3000 (via npx serve .)
npm test                   # Link check + HTML integrity + content integrity + CSS vars + partial drift check (footer/nav) + site.js drift check + blog-count drift check
npm run test:functional    # Playwright functional suite (currently ~585 tests; auto-starts a server on :8788 via test/serve.js)
npm run screenshot         # Playwright batch screenshots
npm run test:all           # All of the above in one shot
npm run build:sitemap      # Regenerate sitemap.xml from the file tree + git history
npm run build:partials     # Re-stamp the shared footer + nav partials into every page (run after editing partials/footer.html or partials/nav-*.html)
npm run build:site-js      # Re-run the interaction-JS extraction (run after editing site.js or the inline-JS rollout)
npm run build:search       # Regenerate the Pagefind blog search index (run after adding/removing/renaming an article)
npm run build:blog-counts  # Sync blog article-count surfaces (search placeholder, category pills, "N <Cat> Articles" headers) to the live card counts
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

The site footer and nav are single-sourced as partials (`partials/footer.html`, `partials/nav-main.html` for root + `pages/` + `pages/blog/`, `partials/nav-article.html` for `articles/`) and stamped into every page at build time by `scripts/build/inject-partials.js` (depth-aware: `root → pages/`, `pages/ → ""`, `pages/blog/ → ../`, `articles/ → ../pages/`). The deployed artifact stays pure static HTML. Edit the partial, then `npm run build:partials`; `npm test` runs `inject-partials --check` and fails on drift (or a forgotten rebuild). Do NOT hand-edit a page's `<footer>` or `<nav>` — change the partial.

The shared **interaction JS** (nav drawer, nav dropdown, FAQ accordion) is single-sourced in `/site.js` — one defer-loaded file, feature-detected and idempotent, safe to load on every page. It is included at the correct depth on every nav page by `scripts/build/inject-site-js.js`; `npm test` runs `inject-site-js --check` and fails if a page reintroduces inline interaction JS or drops the include. Do NOT paste inline drawer/dropdown/FAQ scripts into a page — add behavior to `site.js`. The two nav-drawer markup families (main: `.nav-drawer` + `data-open`; article: `#mobile-nav-drawer` + `aria-hidden`) are auto-detected at runtime. Page-specific singletons (blog search filter, testimonials filter) intentionally remain inline.

### Blog search (Pagefind)

`pages/blog.html` search is powered by **Pagefind** full-text search over article bodies (`pagefind/`, a committed static index). The inline blog-search IIFE calls the Pagefind JS API (`import('../pagefind/pagefind.js')`), maps result URLs back to the existing `.blog-card`s, and renders them in relevance order; it falls back to the legacy substring match over card title/excerpt/badge if the bundle can't load. The index is generated by `scripts/build-search-index.js` (`npm run build:search`), which runs `pagefind --site . --glob "articles/**/*.html"` and excludes shared chrome (nav/footer/sticky bar/related cards) via `--exclude-selectors` so relevance reflects article content, not the repeated nav city list. The 7 `pages/blog/*.html` category pages are static landers (no search box — they just list their category's cards under an `N <Cat> Articles` header). `pagefind/` is committed output (like `sitemap.xml`); `.nojekyll` at the repo root keeps GitHub Pages from touching it.

**Blog article counts are derived, not hand-maintained.** `scripts/build/sync-blog-counts.js` (`npm run build:blog-counts`) rewrites every count surface from the live `.blog-card` set: the `#blog-search` placeholder, the 8 category pills on `blog.html`, and each category page's `N <Cat> Articles` section-label. `npm test` runs it with `--check` and fails on drift, so adding/removing a blog card no longer requires hand-bumping counts (just run `build:blog-counts` and commit). This retired the recurring count-drift bug (PRs #537, #539).

### Scripts

- `scripts/` — active automation: `build-sitemap.js`, `add-seo-improvements.js` (quarterly-audit SEO fixer), `sync-testimonials-count.js`, `add-hero-preload.mjs`, `add-nav-link.js`, `add-article-hamburger.js`, image/favicon helpers. Run these explicitly; none are wired to pre-commit hooks.
- `scripts/build/` — build-time injectors (`inject-partials.js` for footer/nav; `inject-site-js.js` for the interaction-JS extraction).
- `scripts/oneoff/` — historical, already-run one-off scripts, kept for provenance (see its README). None are npm-wired.

## Critical technical patterns

**Every HTML page must have:**
1. GA tag as the first child of `<head>` (id: `G-TSFHKJ6ZEK`) — see "Required on every new HTML page".
2. `<link rel="canonical" href="https://fixappliancesfast.com/...">` after `<title>`.
3. The shared interaction JS via one `<script defer src="…/site.js">` before `</body>` (single-sourced in `/site.js`; see "Shared chrome"). The old per-page inline dropdown/drawer/FAQ scripts and the `<!-- DROPDOWN_JS_INJECTED -->` sentinel were retired in PR-9 (#461).

**Content timestamps (ISO 8601 with offset)** — every Google-consumed *content* timestamp must be full ISO 8601 with a timezone offset, `YYYY-MM-DDT00:00:00+00:00` (UTC, not PDT `-07:00`). This covers JSON-LD `datePublished` / `dateModified` on `Article`/`NewsArticle`/`BlogPosting`/`TechArticle` nodes (articles **and** hub pages), `VideoObject.uploadDate`, and the OG `article:published_time` / `article:modified_time` metas. A bare date (`2026-06-04`) is rejected by Google's Rich Results / GSC validator ("missing timezone"; it hard-fails `uploadDate`). Enforced site-wide by the `iso8601-timestamps` check in `test/content-integrity.js` (`npm test`). **Exception:** `Review.datePublished` is intentionally left as reduced-precision (`YYYY-MM`) — GBP only exposes "N months ago", so adding a fake day/time would fabricate precision; the CI check skips Review nodes. See also the "Article modified_time" standing rule.

**Sitemap** — always regenerate with `npm run build:sitemap` and commit the result on any PR that adds, removes, or renames an `.html` file. Never hand-edit `sitemap.xml`.

**Search index** — on any PR that adds, removes, or renames an `articles/article-*.html` file, also regenerate the Pagefind blog search index with `npm run build:search` and commit the resulting `pagefind/` changes (same discipline as the sitemap). The committed index can otherwise go stale and the new article won't be findable in blog search. Never hand-edit anything under `pagefind/`.

**Em dashes** — banned in all editorial copy (customer review body text is exempt, verbatim). Grep changed files before committing: `grep -n '—' <changed-files>`. Replace with commas, semicolons, colons, or parentheses. (En dashes like "Mon–Sat" are allowed.)

**CSS background-image heroes** (hub pages) require an explicit `<link rel="preload" as="image">` in `<head>` — the browser preload scanner cannot discover them from CSS. Use `scripts/add-hero-preload.mjs` to backfill.

**Inline CTA paragraph links** — any `.inline-cta` block must define `.inline-cta p a` before `.inline-cta a` to prevent paragraph links from inheriting button styles.

## Rules
All rule files live in `.claude/rules/` (gitignored — local-only, kept out of the public repo since #348; restore from git history at `c8962327^` if a local copy is lost).
- `.claude/rules/git-workflow.md` — branch naming, commits, PRs, code review
- `.claude/rules/seo-content.md` — SEO guidelines, brand canonicalization, hub-page architecture, AI answer block, llms.txt requirement, schema templates
- `.claude/rules/mobile-design.md` — required `@media` breakpoints, hamburger nav, sticky bottom Call/Book bar, tap-target sizes, form behavior on mobile
- `.claude/rules/testimonial-selection.md` — which captured reviews are quotable as testimonials (display/quotability rules referenced by `data/testimonials.json`)
- `.claude/rules/gbp-platform-policy.md` — verify platform content policies before writing any external-platform copy (GBP posts must be purely descriptive)

## Active plans (tasks/ — gitignored, local)
- `tasks/backlog.md` — single source of truth for all open work (includes the Months 2–3 themes; the May 11–Jun 7 4-week schedule completed and was retired 2026-06-08)
- `tasks/lessons.md` — patterns learned from corrections; review at session start
- Completed plans live in `tasks/archive/` (see its README) — e.g. the P0–P3 architecture/refactor roadmap and the GSC deep-dive action plan, both fully shipped and archived 2026-07-05.

## Logs
- `logs/CONTENT_LOG.md` — running log of every `/seo-blog` run: articles created, PRs, commits, workflow changes
- `logs/HUB_LOG.md` — running log of every `/seo-hub` run: hub pages created, PRs (open for owner review), outstanding placeholder items
- `logs/AUDIT_LOG.md` — quarterly SEO audit results: auto-fixes applied, items needing human review

## Scheduled Automation

> **⏸ BOTH ROUTINES PAUSED 2026-07-10 (owner decision).** Autonomous publishing is deferred — both
> triggers below are set `enabled: false`. They still exist (manage via `RemoteTrigger`, not the
> claude.ai UI — they were created via API and don't appear in the UI list). **Do not assume articles
> are being published on a schedule.** Background: even after the `/seo-blog` skill was committed
> (#575), the 2026-07-10 cloud run still produced nothing, and the run transcript isn't reachable, so
> autonomous publishing was paused pending a move to an observable scheduler (GitHub Actions is the
> documented option). Re-enable with `RemoteTrigger action:update body:{"enabled":true}`. Full
> write-up + the GitHub Actions plan: `tasks/archive/cross-llm-workflow-portability-plan-2026-07-10.md` §6b (residuals also tracked in `tasks/backlog.md` P6-5).

### Content publishing — `/seo-blog` — ⏸ PAUSED
When enabled, runs **Mon/Wed/Fri at 6 AM Pacific (13:00 UTC)**. Fully autonomous: research → propose → write → test → merge.

- **Routine ID:** `trig_015WszAyFWDSSsyfP9GF7F2u` (recreated 2026-06-03; the prior `trig_01ApQaWZG9LhY6jsp8tbxn8D` was found deleted — the trigger list was empty, so autonomous runs had silently stopped)
- **Manage / disable:** https://claude.ai/code/routines/trig_015WszAyFWDSSsyfP9GF7F2u
- **What it does:** Phase 0 web research, auto-selects topic 1, creates 1 article per run, runs tests, reviews, **merges automatically**, logs in `CONTENT_LOG.md`
- **Config:** model `claude-sonnet-4-6`; Gmail connector attached (Phase 12 summary email). If autonomous runs stop again, first check the routine still exists via `RemoteTrigger {action:"list"}` — a 404/empty list means it was deleted.
- **DST note:** cron is fixed at 13:00 UTC; update to `0 14 * * 1,3,5` in November when clocks fall back to PST

### Quarterly SEO audit — `/seo-audit` — ⏸ PAUSED
When enabled, runs **1st of Jan, Apr, Jul, Oct at 6 AM Pacific (13:00 UTC)**. Audits all articles, auto-fixes schema/meta gaps, opens a PR with a report of flagged items. (Q3 2026 audit shipped 2026-07-10 via PR #572 before the pause.)

- **Routine ID:** `trig_01ACtLHhzTt8XnwP5udBX3Fv` (recreated 2026-06-03; prior `trig_01Sh3FPw2RJwrnSPXG3KjnrD` was deleted alongside the content routine)
- **Manage / disable:** https://claude.ai/code/routines/trig_01ACtLHhzTt8XnwP5udBX3Fv
- **What it does:** scans all `article-*.html` for schema, OG tags, image dimensions, content quality; auto-fixes with `scripts/add-seo-improvements.js`; opens a PR with audit report — **does not merge** (needs owner review of flagged items)
- **Audit log:** `logs/AUDIT_LOG.md`

## Standing Rule — Impeccable for UI/UX Work

Any PR touching `.html` or `.css` files **must** run `/impeccable critique` on every changed page before the PR is created. Fix all FAIL items. Include the score in the PR description.

The `/review` subagent must also run `/impeccable critique` when the diff includes HTML or CSS. An impeccable FAIL is a merge blocker — same weight as a broken link.

The impeccable design system is in `.agents/skills/impeccable/`. Context (brand, colors, typography) is in `PRODUCT.md` and `DESIGN.md` at the project root.

**Two layers, both project standards:**
1. **PR gate (comprehensive, required):** `/impeccable critique` on every changed HTML/CSS page, run by `/review`. A FAIL blocks merge. This is the authoritative check (above).
2. **Per-edit hook (proactive, advisory):** a committed `PostToolUse` hook (`.claude/settings.json` for Claude Code, `.codex/hooks.json` for Codex) runs `.agents/skills/impeccable/scripts/hook.mjs` after each `Edit`/`Write` on a UI file and surfaces findings as **non-blocking** reminders. It uses the repo's committed skill via a relative path (portable across machines/CI — no dependency on a machine-global install). It does NOT replace the PR gate.
   - **Scoped for signal:** `.impeccable/config.json` suppresses two groups so the hook stays quiet on clean, on-brand pages and only speaks up for real new anti-patterns: (a) the **stale-sidecar** rules `design-system-color`, `design-system-font-size`, `design-system-radius` (the committed `.impeccable/design.json` is older than `DESIGN.md`, so they fired on every on-brand color/radius); and (b) the **font-choice** rules `overused-font`, `single-font` (the site uses Inter site-wide by deliberate brand decision, not a per-edit issue). The hook still flags the real anti-patterns (gradient text, side-stripes, glassmorphism, em-dashes, contrast, hero-metric).
   - **Follow-up to re-enable the 3 suppressed rules + silence the "refresh sidecar" nag:** run the full `impeccable document` workflow to regenerate `.impeccable/design.json` from the current `DESIGN.md`, then drop those entries from `.impeccable/config.json`. Until then the design-system-drift rules live only in the PR-gate critique (with human judgment), not the per-edit hook.
   - Machine-local hook overrides (disable it just on your machine) go in the gitignored `.claude/settings.local.json`.

**Keeping impeccable current (check periodically, ~monthly).** The skill is committed here (a clone-based runner / CI / a fresh machine has no access to a machine-global `~/.claude/skills/` copy, so committing it is deliberate — same portability reasoning as the `.claude/commands` library). It is a published package that ships new versions, so it drifts. To check + update:
- **Check for updates:** `npx impeccable check` — but run it from a **neutral directory** (e.g. your home folder), NOT inside this repo. The `check`/`update`/`install` commands scan for and prefer an existing project copy, so run inside the repo they target `.agents/skills/impeccable/` (which is fine for `update`, wrong for a global install).
- **Update the committed copy:** run `npx impeccable update` **inside the repo** (it bumps `.agents/skills/impeccable/`), then commit the skill dir. Note: `update` may rewrite the committed per-edit hook configs (`.codex/hooks.json`, `.claude/settings.json`) — keep OUR versions, which invoke the hook via the relative path `.agents/skills/impeccable/scripts/hook.mjs` (portable). If `update` swaps in a machine-global absolute path, restore the relative one. Land it as its own PR. Last bumped to v3.9.1 on 2026-07-10.
- A machine-global install (`npx impeccable install --global --providers=.claude`, run from a neutral dir) is for auditing **other** projects; this repo always uses its own committed copy (project skills take precedence over global).

## Standing Rule — PR on Every Change
Any request that results in a code or file change must go through the full workflow:
branch → commit → **all three tests** → PR → review → merge. No exceptions, even for small edits.

**Three required tests — all must exit 0 before opening a PR:**
```
npm test                 # link check (101 pages) + integrity + CSS vars + partial drift check (footer/nav) + site.js drift check + blog-count drift check
npm run screenshot       # Playwright batch screenshots
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

**Exception — site-wide chrome / template rollouts.** A change that only restamps shared chrome on every page (the injected footer / nav / head partials via `scripts/build/inject-partials.js`, or the shared interaction JS via `scripts/build/inject-site-js.js`) does **not** bump article `modified_time` / `dateModified`, even though it alters the rendered footer/nav DOM or removes inline scripts. `modified_time` signals *article content* freshness; marking dozens of articles "modified today" for a global chrome/infra change is a misleading freshness signal to search engines. Such PRs MUST state this exemption in the description and link to this rule. Owner-confirmed precedents: PR-5 footer partial injection (#457, 2026-05-31); PR-9 site.js interaction-JS extraction (#461, 2026-06-01). (Distinct from the cosmetic-href exemption, which requires zero DOM change; this one explicitly permits the chrome DOM change.)

**Exception — related-card thumbnail sync.** Swapping a `.related-card` thumbnail to match the target article's upgraded real-photo hero is a cross-linking-module change, NOT an article-content edit. It does NOT bump `article:modified_time` or `dateModified` on the host article. Rationale: marking dozens of host articles as "modified today" because a card linking to a different article now shows a better photo is a misleading freshness signal to search engines, the same spirit as the chrome-rollout exemption. PRs in this sweep must state the exemption and cite this rule. Owner-confirmed 2026-07-09.

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

### Workflow Library — cross-agent portability

The workflow definitions live as committed markdown in **`.claude/commands/*.md`**, and the detailed
rules they follow live in **`.claude/rules/*.md`** (both committed since the cross-LLM-portability PR,
2026-07-10 — they were previously gitignored, which made them invisible to every non-local tool and
broke the cloud cron, since the runner clones only committed files). This file (`AGENTS.md`) is the
tool-neutral hub; it is read natively by Codex, GitHub Copilot, Cursor, and Hermes, and is bridged
into Claude Code via the root `CLAUDE.md` `@AGENTS.md` import.

**How each agent runs a workflow (e.g. the SEO blog workflow in `.claude/commands/seo-blog.md`):**

| Agent | How to invoke |
|-------|---------------|
| **Claude Code** | `/seo-blog` (native slash command; reads `.claude/commands/seo-blog.md`) |
| **OpenAI Codex** | Reads `AGENTS.md` natively. Prompt: *"Follow the workflow in `.claude/commands/seo-blog.md`."* |
| **Hermes** (Nous) | Reads `AGENTS.md` + `.hermes/` natively. Prompt: *"Execute `.claude/commands/seo-blog.md`."* |
| **Cursor** | Reads `AGENTS.md` natively. Reference `.claude/commands/seo-blog.md` in chat. |
| **Aider** | Start with `aider --read AGENTS.md`, then reference the command file. |

No tool-specific adapter files are required — every supported agent reaches the same committed
workflow + rule files through `AGENTS.md`. (GitHub Copilot is not currently wired; its stale agent
port was removed on 2026-07-10.)

## Project Structure
- `index.html` — homepage
- `pages/about.html`, `pages/services.html`, `pages/contact.html`, `pages/faq.html`, `pages/testimonials.html`, `pages/blog.html` — main pages
- `pages/[appliance]-repair-orange-county.html` — per-service hub pages
- `pages/[brand]-appliance-repair-orange-county.html` — per-brand hub pages
- `pages/appliance-repair-[city]-ca.html` — per-city landing pages
- `pages/service-areas.html` — service-areas hub
- `pages/blog/*.html` — blog category pages
- `articles/article-*.html` — individual blog articles
- `partials/footer.html`, `partials/nav-main.html`, `partials/nav-article.html` — single-sourced chrome (injected by the build step)
- `shared.css` — shared styles used across all pages
- `site.js` — single-sourced interaction JS (nav drawer, dropdown, FAQ accordion), defer-loaded on every nav page
- `scripts/` — active node scripts; `scripts/build/` injectors; `scripts/oneoff/` historical one-offs
- `test/` — link/integrity/css checks, Playwright screenshots (`test/screenshot.js`), Playwright functional spec, static server

## Tech Stack
- Vanilla static HTML — no framework, no Tailwind
- `shared.css` + small per-page `<style>` blocks (no CSS compile step); shared interaction JS in `site.js` (no JS build/bundle step)
- Minimal build steps (run explicitly, output committed): `build:sitemap`, `build:partials`, `build:site-js`, `build:search`
- Pagefind (`pagefind` devDependency) generates the committed `pagefind/` blog search index; no deploy-time build (GitHub Pages serves the committed tree as-is)
- Playwright (batch screenshots via `test/screenshot.js` + functional testing, currently ~765 tests in `test/functional.spec.js`)
