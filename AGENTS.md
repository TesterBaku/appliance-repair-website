## Operating Principles

Only the points not already covered elsewhere in this file (owner import, 2026-08-08).

- **Be candid, and challenge weak assumptions.** Distinguish what you have **verified** from what is
  merely plausible, in your own claims first. "Verified" means a command exited 0, a measurement was
  taken, or a primary source was read — not that it looks right and nothing contradicted it.
  Say "unconfirmed" rather than softening it into a confident sentence.
- **Ask only when a decision is materially ambiguous, risky, or requires approval.** Otherwise decide,
  act, and state the assumption you made. Blocking on a question you could have answered yourself is
  as much a failure as guessing on one you could not.
  This governs **execution-level** decisions, not the plan itself: "Plan Mode Default" and Task
  Management step 2 still require a check-in on the plan before implementing a non-trivial task.
  Agree the shape of the work once; do not then ask about every step inside it.
- **Preserve unrelated work.** Never take destructive, production, or external actions beyond what was
  authorized. Before any command that overwrites or discards (`git checkout -- .`, `git reset --hard`,
  force-push, overwriting a file you have not read), confirm what it would destroy. This applies to
  subagents, which share this working tree.

---

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
- **Preserve the original goal and constraints, and finish authorized work end to end.** Scope that
  quietly narrows mid-task is an unreported failure. If part of the work turns out to be blocked,
  complete everything else and say explicitly what you left out and why

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
- **Minimal Impact:** Only touch what's necessary. No side effects with new bugs. No unrelated edits,
  no unnecessary abstractions, and no low-signal tests that add runtime without adding confidence.

# Appliance Repair Website

Static HTML website for an appliance repair service. No framework and no CSS build for page styling — styles live in `shared.css` plus small per-page `<style>` blocks. (Tailwind, previously loaded via CDN and a compiled `tailwind.css`, was removed in 2026-05; do not reintroduce it.)

**Production domain:** `https://fixappliancesfast.com/`
**Public business name:** Universal Appliances Repair
**Legal name:** Universal Appliances Repair Group Inc.

> Brand canonicalization is enforced in `.claude/skills/seo-content/SKILL.md` (the flat "never write it as a brand" prohibition is also mirrored in `.claude/hooks/session-start.mjs`, item 6). Never write "Fix Appliances Fast" as a brand — it is only a URL.

## Commands

```bash
npm start                  # Serve locally at http://localhost:3000 (via npx serve .)
npm test                   # Link check + HTML integrity + content integrity + CSS vars + repo hygiene (large-file guard) + partial drift check (footer/nav) + site.js drift check + blog-count drift check + article-byline drift check + review-count drift check
npm run test:functional    # Playwright functional suite (auto-starts a server on :8788 via test/serve.js)
npm run screenshot         # Playwright batch screenshots
npm run test:all           # All of the above in one shot
npm run build:sitemap      # Regenerate sitemap.xml from the file tree + git history
npm run build:partials     # Re-stamp the shared footer + nav partials into every page (run after editing partials/footer.html or partials/nav-*.html)
npm run build:site-js      # Re-run the interaction-JS extraction (run after editing site.js or the inline-JS rollout)
npm run build:search       # Regenerate the Pagefind blog search index (run after adding/removing/renaming an article)
npm run build:blog-counts  # Sync blog article-count surfaces (search placeholder, category pills, "N <Cat> Articles" headers) to the live card counts
npm run build:article-bylines # Sync each article's visible "Originally published … Updated <Month Year>" hero byline to its own JSON-LD dates
npm run build:review-counts # Sync every site-wide Google review-count surface (AggregateRating, hero-rating copy + aria-label, "N verified 5-star" prose, "Read all N reviews", the testimonials-page stat) to data/testimonials.json's publishedCount
npm run sync:testimonials  # Alias for build:review-counts, kept for backward compatibility (this is the command documented historically for this purpose)
npm run clean:screenshots  # Report stray Playwright screenshots in the repo root (--delete to remove)
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

`data/testimonials.json` is the canonical source for all customer review TEXT. Never write review body text from scratch in HTML; always copy it verbatim from this file. `pages/testimonials.html` is **hand-maintained, not generated**: the displayed review cards are a curated subset of the JSON pool (with per-card review photos and ordering not derivable from the JSON), so add or edit cards directly. Run `npm run build:review-counts` (`scripts/build/sync-review-counts.js`; `npm run sync:testimonials` is an alias) to sync every site-wide GBP review-count surface (AggregateRating, hero-rating copy + aria-label, "N verified 5-star" prose including the testimonials-page meta/OG/Twitter descriptions, "Read all N reviews", and the testimonials-page stat) from `data/testimonials.json`'s `_meta.sources.google.publishedCount`. (The former `build-testimonials-html.js` generator was retired on 2026-05-31: it rendered an outdated page design and silently dropped the dropdown-nav JS and the review-photo images on quote cards.)

`_meta.sources.google` on that file carries three distinct review counters, split 2026-08-15 by the weekly review-batch cadence (`tasks/runbook-weekly-review-batch.md`, gitignored, renamed from `plan-2026-08-15-weekly-review-batch-cadence.md` on 2026-08-16 because it is a standing runbook rather than a plan that finishes; **the week-by-week procedure lives only in that file**, so read it before running a batch and never archive it): `totalReviewsOnListing` is the live GBP listing total, free to move daily as new reviews are captured, and may move DOWN if Google filters one; `publishedCount` is what the site currently claims, and moves only during a weekly publish batch (`npm run build:review-counts -- --publish` sets it to `totalReviewsOnListing`, warning loudly on any decrease); `capturedCount` is how many reviews are transcribed into the pool, internal only, never rendered. The `review-count` check in `test/content-integrity.js` validates every page's `reviewCount` against `publishedCount` and asserts `publishedCount <= totalReviewsOnListing`, so the site can never claim more reviews than the live listing shows. This closes the gap several `captureHistory` notes flagged: before this split, the sync script only rewrote `pages/testimonials.html`, leaving roughly 65 other pages carrying the same surfaces to be updated by hand or ad-hoc `sed` on every pass.

### Shared chrome (partials)

The site footer and nav are single-sourced as partials (`partials/footer.html`, `partials/nav-main.html` for root + `pages/` + `pages/blog/`, `partials/nav-article.html` for `articles/`) and stamped into every page at build time by `scripts/build/inject-partials.js` (depth-aware: `root → pages/`, `pages/ → ""`, `pages/blog/ → ../`, `articles/ → ../pages/`). The deployed artifact stays pure static HTML. Edit the partial, then `npm run build:partials`; `npm test` runs `inject-partials --check` and fails on drift (or a forgotten rebuild). Do NOT hand-edit a page's `<footer>` or `<nav>` — change the partial.

The shared **interaction JS** (nav drawer, nav dropdown, FAQ accordion) is single-sourced in `/site.js` — one defer-loaded file, feature-detected and idempotent, safe to load on every page. It is included at the correct depth on every nav page by `scripts/build/inject-site-js.js`; `npm test` runs `inject-site-js --check` and fails if a page reintroduces inline interaction JS or drops the include. Do NOT paste inline drawer/dropdown/FAQ scripts into a page — add behavior to `site.js`. The two nav-drawer markup families (main: `.nav-drawer` + `data-open`; article: `#mobile-nav-drawer` + `aria-hidden`) are auto-detected at runtime. Page-specific singletons (blog search filter, testimonials filter) intentionally remain inline.

### Blog search (Pagefind)

`pages/blog.html` search is powered by **Pagefind** full-text search over article bodies (`pagefind/`, a committed static index). The inline blog-search IIFE calls the Pagefind JS API (`import('../pagefind/pagefind.js')`), maps result URLs back to the existing `.blog-card`s, and renders them in relevance order; it falls back to the legacy substring match over card title/excerpt/badge if the bundle can't load. The index is generated by `scripts/build-search-index.js` (`npm run build:search`), which runs `pagefind --site . --glob "articles/**/*.html"` and excludes shared chrome (nav/footer/sticky bar/related cards) via `--exclude-selectors` so relevance reflects article content, not the repeated nav city list. The 7 `pages/blog/*.html` category pages are static landers (no search box — they just list their category's cards under an `N <Cat> Articles` header). `pagefind/` is committed output (like `sitemap.xml`); `.nojekyll` at the repo root keeps GitHub Pages from touching it.

**Blog article counts are derived, not hand-maintained.** `scripts/build/sync-blog-counts.js` (`npm run build:blog-counts`) rewrites every count surface from the live `.blog-card` set: the `#blog-search` placeholder, the 8 category pills on `blog.html`, and each category page's `N <Cat> Articles` section-label. `npm test` runs it with `--check` and fails on drift, so adding/removing a blog card no longer requires hand-bumping counts (just run `build:blog-counts` and commit). This retired the recurring count-drift bug (PRs #537, #539).

### Scripts

- `scripts/` — active automation: `build-sitemap.js`, `add-seo-improvements.js` (quarterly-audit SEO fixer), `add-hero-preload.mjs`, `add-nav-link.js`, `add-article-hamburger.js`, image/favicon helpers. Run these explicitly; none are wired to pre-commit hooks. (`sync-testimonials-count.js` moved to `scripts/build/sync-review-counts.js` 2026-08-15, alongside the other derived-surface syncers, when it was extended site-wide.)
- `scripts/build/` — build-time injectors and derived-surface syncers (`inject-partials.js` for footer/nav; `inject-site-js.js` for the interaction-JS extraction; `sync-blog-counts.js` for blog counts; `sync-article-bylines.js` for article hero bylines; `sync-review-counts.js` for every site-wide Google review-count surface, with `--check` and `--publish` modes).
- `scripts/oneoff/` — historical, already-run one-off scripts, kept for provenance (see its README). None are npm-wired.
- `test/` — the five `npm test` checks (`links.js`, `html-integrity.js`, `content-integrity.js`, `css-vars.js`, `repo-hygiene.js`) plus `faq-parity-baseline.json`, the Playwright screenshot runner (`screenshot.js`), the Playwright functional spec (`functional.spec.js`), and the static server (`serve.js`) the functional suite auto-starts on :8788. `repo-hygiene.js` enumerates git-tracked files only (`git ls-files`) and fails on any tracked file over 5 MB (with a narrow, path-specific allowlist for legitimate large assets) or carrying a banned extension (`.pdf`, `.zip`, and other archive/installer formats); it was added after a 13.6 MB research PDF was swept into a commit by `git add -A` on 2026-08-02. `npm test` additionally runs the five `scripts/build/*.js --check` drift guards listed above (`inject-partials`, `inject-site-js`, `sync-blog-counts`, `sync-article-bylines`, `sync-review-counts`), plus `check-agents.js --check` (documented separately below).

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

## Rules (converted to on-demand Skills, 2026-08-18; moved to a directory that actually works, 2026-08-19)

The six former `.claude/rules/*.md` files (git-workflow, seo-content, mobile-design,
testimonial-selection, gbp-platform-policy, trusted-sources) live at
`.claude/skills/<name>/SKILL.md` and load on demand for Claude Code instead of always
loading. **Why, precisely:** in one live Claude Code session, all six appeared in the opening
context block as project instructions before any tool call (roughly 82,000 chars combined).
That is a direct observation, re-checkable by opening a fresh Claude Code session in this
repo and inspecting whether the six appear before any tool call; it is not a proven harness
mechanism, and it is not established to hold for every agent, harness, or configuration.
`progress/agents-md-trim-audit.md` §1 searched the repo for a forcing mechanism (an `@`
import, a hook, a settings entry) and correctly found none; that finding stands for what it
examined, since a repo-level search cannot see a harness-level runtime behavior, so the two
accounts do not actually conflict. Nothing was deleted; every word moved.

> ⚠️ **The 2026-08-18 conversion shipped to the wrong directory and was inert for a day.** It put
> the six in `.agents/skills/`, which **Claude Code does not scan**, so the Skill tool could not
> load them at all. Not on demand; never. `Skill(gbp-platform-policy)` returned `Unknown skill`,
> and none of the six appeared in any session's skill listing. The net effect was the opposite of
> the intent: they went from always-loading to never-loading, leaving only the flattened
> prohibitions in `session-start.mjs` covering anything automatically. Fixed 2026-08-19 by moving
> them to `.claude/skills/`, which `code.claude.com/docs/en/skills` names as the project skills
> location (alongside `~/.claude/skills/`, `--add-dir` directories, plugins, and enterprise;
> `.agents/skills/` appears in none of them). Verified by invoking `Skill(gbp-platform-policy)`
> straight after the move and watching it load from `.claude/skills/gbp-platform-policy`, the
> identical call that had failed an hour earlier. No restart was needed: Claude Code picked the
> new directory up mid-session.
>
> **The lesson is not "we picked the wrong folder".** It is that the conversion's success was
> never tested. `check-agents.js` check 1b was added by that same change and passed the entire
> time, because it asserts a file *exists* at a path, which is not the same as the harness
> *reading* it. A gate that cannot fail when the mechanism is dead is not a gate. Check 1b now
> pins the discoverable location specifically, and the cheapest real test remains the one that
> was skipped: invoke one skill by name once and see whether it resolves.

**Full discovery
table, per-skill trigger conditions, and the mandatory manual-read requirement for
non-Claude agents live in the "Workflow Library" section below (see its "Rule Skills"
subsection); read that section, not just this pointer.** A handful of the flat, highest-risk
prohibitions from these files were additionally promoted into `.claude/hooks/session-start.mjs`,
which loads automatically on every Claude Code session.

## Active plans (tasks/ — gitignored, local)
- `tasks/backlog.md` — single source of truth for all open work: exhaustive, so nothing is lost, but
  not prioritized and not re-verified. For *what to do next*, read `tasks/top_3_tasks_priority.md`
  below, which is a re-measured subset of this file. (Includes the Months 2–3 themes; the May 11–Jun 7
  4-week schedule completed and was retired 2026-06-08.)
- `tasks/lessons.md` — patterns learned from corrections; review at session start
- `tasks/top_3_tasks_priority.md` — where the current round of top priorities is picked, with each
  figure re-measured against a named master commit. Supersedes the backlog for "what to do next".
  Read it before proposing work, and **reconcile any item you intend to start against `git log`
  first**: four consecutive rounds have found the source documents wrong, including one item marked
  queued whose shipping commit was already the HEAD of master.
- `tasks/todo.md` — the per-task working plan required by Task Management step 1. It is recreated per
  task; when its work is fully merged it moves to `tasks/archive/` under a distinguishing dated name,
  so a stale one never shadows the next task.
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

Any PR touching `.html` or `.css` files **must** run the impeccable gate on every changed page before the PR is created. Fix all FAIL items. Name the tool you ran in the PR description.

**`/impeccable critique` and `detect.mjs` are not the same thing and must never be reported as if they were.** `critique` is the gate: an LLM-driven review that emits the `??/40` score (10 Nielsen heuristics × 4 points) the PR template asks for, and which runs `detect.mjs` internally as its Assessment B. `detect.mjs` is that deterministic scanner alone — the same engine behind the per-edit hook. The detector is a *component* of the gate, not a substitute for it.

Which one a PR needs, and the exact wording to use, is specified in `.claude/skills/git-workflow/SKILL.md` ("UI/UX Development Requirement"). In short: full `critique` + score for anything that touches CSS, markup structure, layout, colour or typography; `detect.mjs` alone is enough for a copy-only diff inside existing markup, and the PR must say so explicitly.

> **Why this is spelled out.** 15 PRs reported `detect.mjs` output under the name `/impeccable critique`, so the gate the rule requires was never actually run on any of them while every description claimed it had been (P6-31). No design regression shipped — the detector returned 0 FAILs each time — but the compliance claim was false. A gate trusted beyond what it asserts is worse than no gate.

The `/review` subagent must also run the appropriate impeccable check when the diff includes HTML or CSS, and must flag as a **FAIL** any PR whose description names a tool the author did not run. An impeccable FAIL is a merge blocker — same weight as a broken link.

The impeccable design system is in `.agents/skills/impeccable/`. Context (brand, colors, typography) is in `PRODUCT.md` and `DESIGN.md` at the project root.

**Three layers, all project standards.** They differ in what they can see, and the top two share an engine, which is exactly why they got conflated:
1. **PR gate (comprehensive, required):** `/impeccable critique` on every changed HTML/CSS page, run by `/review`, per the scoping rule above. A FAIL blocks merge. This is the authoritative check.
1b. **Deterministic detector (`detect.mjs`), on its own:** the permitted substitute for the gate **only** on copy-only diffs. It catches the mechanical anti-patterns (gradient text, side-stripes, glassmorphism, contrast) and nothing that needs judgment. Sufficient for a price or wording change; not sufficient for a new section.
   - ⚠️ **It does NOT enforce this project's em-dash ban, and you must not assume it does.** Its rule is `em-dash-overuse` and fires only at **5 or more** em dashes in a file (`.agents/skills/impeccable/scripts/detector/engines/regex/detect-text.mjs`), because upstream treats occasional em dashes as normal prose. This project bans them outright in editorial copy. So 1–4 em dashes pass the detector clean while violating the rule. **On any detector-only PR, grep the changed files yourself** (`grep -n '—' <changed-files>`, see the Em dashes pattern above) and say in the PR that you did. Caught in review of the PR that introduced this tier.
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
npm test                 # link check (every page) + integrity + CSS vars + repo hygiene (large-file guard) + partial drift check (footer/nav) + site.js drift check + blog-count drift check + article-byline drift check
npm run screenshot       # Playwright batch screenshots
npm run test:functional  # Playwright functional suite — nav, dropdowns, forms, accordions, articles, hubs
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

**The article's visible hero byline is derived from its BLOG CARD, not from `dateModified`.** Six articles carry an `Originally published … · Updated [Month Year] by the Universal Appliances Repair Team` line in the hero. Do NOT edit it by hand: run `npm run build:article-bylines`, which sets the "Updated" half from that article's `.blog-date` / `.featured-date` on `pages/blog.html` (and the "Originally published" half from JSON-LD `datePublished`, which never moves). `npm test` runs `sync-article-bylines --check` and fails on drift. This closes **P6-23**.

⚠️ **Do not "simplify" the syncer to read `dateModified`.** That is the obvious-looking design and it is wrong: `dateModified` bumps on schema, meta and chrome-only edits, whereas the byline and the card both mean *when the content last changed*, so the two are deliberately allowed to differ. P6-23 states it outright. The first draft of the syncer made exactly this mistake and rewrote two articles from "May 2026" to "August 2026" whose `dateModified` had moved only for a `<title>`/meta rewrite (#669) and a FAQPage schema pass (#666) — introducing the very card-vs-byline contradiction #673 had fixed by hand. Caught in review before merge.

The card on `pages/blog.html` remains the hand-maintained source of truth, per the line above; the byline follows it. **This is a proxy, not a proof.** Nothing verifies the card itself against an article's real edit history, so freshness still rests on a human judging "substantive" correctly at edit time. The syncer closes the byline-vs-card gap; it does not make freshness self-verifying.

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
- `/review` — review changed files before merging. **Must flag as FAIL if `npm run test:functional` is not confirmed passing. Must run the impeccable tool the scoping rule requires on any changed HTML/CSS page (critique, or `detect.mjs` alone on a copy-only diff), flag impeccable FAILs as merge blockers, and FAIL any PR that names a tool the author did not run.**
- `/test` — run all three test commands: `npm test` (links + integrity + partial drift) + `npm run screenshot` + `npm run test:functional`. All must exit 0.
- `/impeccable` — design quality tool. Required before any PR that touches HTML or CSS. Fix all FAIL items before opening the PR. See `.agents/skills/impeccable/` for full documentation.
- `/visual-review` — Playwright MCP-driven deep visual check at desktop + mobile viewports, scoped to touched pages by default. Use after `/test` for any visual/CSS work; auto-invoked by `/seo-hub` Phase 5.
- `/new-content` — lightweight scaffolder for a single article, hub page, or static page (no research, no test loop — use when you just need a stub)

### Workflow Library — cross-agent portability

The workflow definitions live as committed markdown in **`.claude/commands/*.md`**, and the detailed
rule content they follow lives in **`.claude/skills/*/SKILL.md`** (moved from
`.claude/rules/*.md` on 2026-08-18, then out of the unscanned `.agents/skills/` on 2026-08-19, see
"Rule Skills" below; both trees are committed since the
cross-LLM-portability PR, 2026-07-10 — they were previously gitignored, which made them invisible to
every non-local tool and broke the cloud cron, since the runner clones only committed files). This
file (`AGENTS.md`) is the tool-neutral hub; it is read natively by Codex, GitHub Copilot, Cursor, and
Hermes, and is bridged into Claude Code via the root `CLAUDE.md` `@AGENTS.md` import.

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

#### Rule Skills (`.claude/skills/`): mandatory manual read for non-Claude agents

The six former `.claude/rules/*.md` files (git-workflow, seo-content, mobile-design,
testimonial-selection, gbp-platform-policy, trusted-sources) were converted to skills on
2026-08-18 so Claude Code's Skill tool loads each one on
demand, matching its `description:` frontmatter against the current task, instead of always
loading (see the "## Rules" section above for exactly what was observed versus confirmed
about the prior always-loading behavior). Nothing was deleted; every word moved verbatim.

**They live under `.claude/skills/` because that is one of the few directories Claude Code
actually scans**, per `code.claude.com/docs/en/skills`. The 2026-08-18 conversion put them in
`.agents/skills/` on the reasoning that a vendor-neutral directory is friendlier to Codex, Cursor,
Aider and Hermes. That reasoning does not survive contact with what this repo already does: those
same agents are already instructed, in the table above, to open `.claude/commands/seo-blog.md` and
friends. A vendor-prefixed path was already the established cross-agent pattern here, non-Claude
agents follow whatever path this file names either way, and the aesthetic win cost Claude Code the
entire mechanism. `.agents/skills/impeccable/` stays where it is: it is a third-party package
invoked by explicit file path from the `settings.json` hook and from `node …/scripts/*.mjs`, never
by skill discovery, so the scanned-directory rule does not apply to it.

**For Claude Code:** no action needed beyond trusting the mechanism; the Skill tool auto-invokes
the matching skill when its description matches the task. **Verify it rather than trusting it
after any change to where these files live**, because the 2026-08-18 conversion looked correct,
passed CI, and loaded nothing: type `/gbp-platform-policy` (or any of the six) and confirm it
resolves instead of returning `Unknown skill`. A handful of the flat, highest-risk prohibitions from these six files (the brand
ban, the AC/HVAC scope ban, the flat fee-tier values, the never-invent-a-testimonial rule, the
Yelp review-solicitation ban, and the source cross-check bar) are ALSO promoted into
`.claude/hooks/session-start.mjs`, which loads automatically on every session as a backstop for
tasks that don't obviously match any one skill's description.

**For every other agent (Codex, Cursor, Aider, Hermes): reading the matching file below is a
MANDATORY MANUAL STEP, not something that happens for you.** None of these tools has a
Skill-matching mechanism; they read `AGENTS.md` natively and follow plain file paths, and they do
NOT receive the `session-start.mjs` injection either (that hook is Claude-Code-specific). This
table is their only path to all six rule domains; treat "read when" as a requirement to open the
file before starting matching work, not a topic label to skim past:

| Skill | Path | Read when |
|---|---|---|
| `seo-content` | `.claude/skills/seo-content/SKILL.md` (schema templates split into `references/schema-templates.md`, read on demand) | Writing, editing, or reviewing an article, a service/brand/city hub, or the homepage; writing or editing a `<title>`, meta tag, schema block, brand mention, or any price/cost/fee text anywhere on the site, even for a small edit that never mentions SEO by name. |
| `testimonial-selection` | `.claude/skills/testimonial-selection/SKILL.md` | Adding, editing, choosing, reordering, removing, or auditing review/testimonial content on any page, including building a section from scratch, checking whether existing cards (name, quote, rating, location label, hub-reuse count) are still correct, or fixing a typo in a review body, even a request that only says "add a review card" or "check the location label on this hub". |
| `git-workflow` | `.claude/skills/git-workflow/SKILL.md` | Before any branch, commit, or PR for any change to this repo, and when deciding whether a review is needed before merge, even a request that only says "fix this" or "ship this". |
| `gbp-platform-policy` | `.claude/skills/gbp-platform-policy/SKILL.md` | Before any copy, caption, post, or reply meant for GBP, Yelp, Instagram, or another external platform, and before any request for a customer to leave feedback or a review in any channel, even one that never names a platform. |
| `mobile-design` | `.claude/skills/mobile-design/SKILL.md` | Writing, editing, or reviewing any HTML or CSS on any page, no matter how small the change looks, even a request that never mentions mobile or responsive design. |
| `trusted-sources` | `.claude/skills/trusted-sources/SKILL.md` | Before and during any web search or fetch made to find a fact for site content, and when judging whether a found source is trustworthy enough to cite, even a request that only asks to "look up" something. |

`scripts/build/check-agents.js` (`npm test`) validates every row above resolves to a real
`.claude/skills/<name>/SKILL.md` file **in the directory Claude Code actually scans**, the same
drift-guard discipline it already applies to the "Skills (slash commands)" list and the "Agent
definitions" list below. Pinning the directory is the point: the previous version accepted any
path the table happened to name, which is why it passed for a full day while the Skill tool could
load none of them.

#### Agent definitions: `.claude/agents/`

Claude Code agent definitions (subagents with their own frontmatter: `name`, `description`,
optional `model`) are committed under **`.claude/agents/*.md`**, the same way commands are.
`.claude/agents/` is already on the `.gitignore` exception list alongside `.claude/commands/`
(see the `!.claude/agents/` line in `.gitignore`), so these files are tracked and reach the cloud
cron runner and every clone, not just a local machine. `.claude/skills/` needs the same treatment
and has it: `!.claude/skills/` is on that exception list too, and dropping it would un-commit the
six rule skills and hide them from the cloud runner, which loads project skills from the cloned
repo. The only skill tree still outside `.claude/` is `.agents/skills/impeccable/`, which is not
gitignored at all; see "Rule Skills" above.

Agents committed here:
- `code-reviewer`: the independent reviewer mandated by `.claude/skills/git-workflow/SKILL.md` step 5
  ("PR on Every Change"). It pins `model: sonnet` deliberately: without an explicit pin, a
  subagent silently inherits whatever model the parent session happens to be running, which let
  one review run 128 turns on a heavier model than intended purely by inheritance. Pinning the
  model in the committed definition makes the choice explicit and portable, instead of an accident
  of which session launched the review.

`scripts/build/check-agents.js` (`npm test`) validates every file in `.claude/agents/`: a
`---`-delimited frontmatter block, a `name` matching the filename, a non-empty `description`, no
duplicate `name` across the directory, and (if present) a `model` from the allowed set. It is not
a YAML parse — the block is checked by line-based regex against those specific keys, so malformed
YAML that still presents them on their own lines passes, and a closing `---` carrying trailing
text is accepted as a closer. Flagged by Copilot on PR #664 and stated here rather than implied.
It also checks that every agent
name listed above resolves to a real `.claude/agents/<name>.md` file, the same way it already
checks that every `/skill` listed in "Skills (slash commands)" resolves to a real file. This is
the same drift-guard discipline the script already applies to `.claude/commands/` and to the
`.claude/skills/*/SKILL.md` Rule Skills table above.

## Status Reporting Policy

Brevity applies to **reporting only** — never shorten your internal reasoning,
planning, or verification steps. Compress what you say, not what you do.

### Default status (always, unless detailed status is requested)
- Maximum 2 sentences: (1) what was done / current state, (2) next step or blocker.
- No headers, bullets, file-by-file breakdowns, code snippets, or restating the task.
- If everything succeeded with nothing pending, one sentence is enough.

### Detailed status (only on explicit request)
Provide a full report ONLY when the user says **"detailed status"**, **"full report"**,
or **"walk me through"**. A detailed status includes: changes made, files touched,
key decisions and why, test results, and open risks.

### Non-negotiable carve-out
Always surface blockers, failures, skipped steps, or deviations from the plan —
even in a short status. Never omit bad news for the sake of brevity.

### Scope — ad-hoc status only, never a specified deliverable

This governs the ad-hoc status you volunteer about your own work. It never overrides a format some
other rule or workflow already specifies. Anything with a required shape keeps that shape in full,
whether it is written to disk, sent to an external surface, **or printed in chat**:

- PR titles and bodies (the template in `.claude/skills/git-workflow/SKILL.md`, including the three-test
  checklist)
- `/review` output: ranked findings and the explicit verdict line
- Commit messages (Conventional Commits)
- `progress.md`, `logs/*.md`, `tasks/*.md`
- Site content, schema, and any external-platform copy
- **Any deliverable a `.claude/commands/*.md` workflow specifies, including the ones delivered in
  chat** — notably `/seo-hub` Phase 5's one-page demo summary (the block the owner approves a hub
  merge from, stats + outstanding items) and `/visual-review` Phase 3's per-page PASS/FAIL/WARN
  report. These are decision inputs, not status: compressing one hides the very facts the owner is
  being asked to rule on.

Compressing a PR body, a review verdict, or a workflow-specified report to two sentences is a rule
violation, not brevity. The test is not "chat vs. disk" — it is whether another file dictates the
format. If one does, that file wins.

### Examples
✅ "Migrated the login suite to Playwright; 2 flaky tests quarantined, fixing next."
✅ "Done — all 14 API tests pass."
✅ "Blocked: the staging DB credentials are expired, need a refresh before I can continue."
❌ Any status with headers, bullet lists, or a per-file summary (unless detailed status was requested).
❌ "I began by analyzing the existing test structure, then I..." (narrating process)

## progress.md Contract

Verbose detail belongs on disk, not in chat.

- Append a full log of each work session to `progress.md` at the repo root:
  timestamp, task, files touched, decisions, test results, open items.
- Chat statuses reference it instead of repeating it: "Details in progress.md."
- When the user requests a "detailed status", summarize from `progress.md` —
  do not re-derive by re-reading the codebase.
- Never paste the contents of `progress.md` into chat unless explicitly asked.
- `progress.md` and `progress/` are **gitignored**, like `tasks/` and `logs/` — local working
  notes, never part of the deployed artifact and never committed.
- Section anchor format, so `details_path` actually resolves: `## YYYY-MM-DD HH:MM — <slug>`,
  referenced as `progress.md#yyyy-mm-dd-hhmm-slug`.

## Multi-Agent Reporting Contract

Applies to orchestrators and all subagents.

- Subagents MUST return results to the orchestrator in this shape, nothing more:

```json
  {
    "status": "ok | blocked | failed",
    "summary": "<max 2 sentences>",
    "details_path": "progress.md#<section-anchor>"
  }
```

- Subagents write their full detail to their OWN file, `progress/<agent-name>-<topic>.md`, and
  never append to `progress.md` directly. Concurrent subagents appending to one file interleave
  and silently clobber each other, and two ran concurrently the day this rule was written. Only
  the orchestrator writes `progress.md`. The summary must still be self-contained — the
  orchestrator should not need to open the log to know whether to proceed.
- `blocked` and `failed` statuses must name the cause in the summary.
- The orchestrator's status to the user follows the same 2-sentence default and
  MUST NOT concatenate or relay subagent summaries verbatim — synthesize them.
  **Exception: quote blockers verbatim.** Synthesis is for prose. A blocker, a failure, or a
  reviewer's finding is reported in the subagent's own words. Paraphrasing bad news is the
  mechanism by which it gets softened, and the non-negotiable carve-out above outranks brevity.
  (Owner-approved 2026-08-02.)
- The orchestrator only reads a `details_path` when a subagent reports
  `blocked`/`failed`, or when the user asks for a detailed status.

### Carve-out — review and audit agents

A review agent's findings ARE its deliverable, not a status, so it returns them in full: ranked
findings with file:line and a concrete failure scenario, plus the explicit verdict line
(`✅ APPROVED` / `🚫 CHANGES REQUESTED`). It does not compress them to a summary plus a path. The
orchestrator has to be able to act on a blocker without opening a second file, and a gitignored
file is the wrong home for the thing gating a merge. The JSON shape above applies to
implementation, research, and mechanical subagents.
