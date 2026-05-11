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

Static HTML website for an appliance repair service. Built with Tailwind CSS via CDN.

**Production domain:** `https://fixappliancesfast.com/`
**Public business name:** Universal Appliances Repair
**Legal name:** Universal Appliances Repair Group Inc.

> Brand canonicalization is enforced in `rules/seo-content.md`. Never write "Fix Appliances Fast" as a brand — it is only a URL.

## Rules
- `rules/git-workflow.md` — branch naming, commits, PRs, code review
- `rules/seo-content.md` — SEO guidelines, brand canonicalization, hub-page architecture, AI answer block, llms.txt requirement, schema templates
- `rules/mobile-design.md` — required `@media` breakpoints, hamburger nav, sticky bottom Call/Book bar, tap-target sizes, form behavior on mobile

## Active remediation plan
- `tasks/action-plan-fixappliancesfast.md` — combined SEO/mobile/agent-readiness remediation plan from the May 2026 audit. Work is grouped P0 → P4. Treat each item as one PR.

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
- **Audit log:** `.claude/logs/AUDIT_LOG.md`

## Standing Rule — Impeccable for UI/UX Work

Any PR touching `.html` or `.css` files **must** run `/impeccable critique` on every changed page before the PR is created. Fix all FAIL items. Include the score in the PR description.

The `/review` subagent must also run `/impeccable critique` when the diff includes HTML or CSS. An impeccable FAIL is a merge blocker — same weight as a broken link.

The impeccable design system is in `.claude/skills/impeccable/`. Context (brand, colors, typography) is in `PRODUCT.md` and `DESIGN.md` at the project root.

## Standing Rule — PR on Every Change
Any request that results in a code or file change must go through the full workflow:
branch → commit → **all three tests** → PR → review → merge. No exceptions, even for small edits.

**Three required tests — all must exit 0 before opening a PR:**
```
npm test                 # link checker (64 pages, no broken hrefs)
npm run screenshot       # puppeteer batch screenshots
npm run test:functional  # 165 functional tests — buttons, nav, forms, accordions across all pages
```

The `/review` subagent must flag as **FAIL** any PR whose description does not confirm `npm run test:functional` passing.

## Site-wide required files (must return 200)
- `/robots.txt`
- `/sitemap.xml`
- `/llms.txt` — plain-text business summary for AI crawlers (template in `tasks/action-plan-fixappliancesfast.md`)

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
- `/seo-hub` — full hub-page workflow for service and city landing pages. Same shape as `/seo-blog` but **interactive-only and never auto-merges** — hub pages always wait for owner review. Use this for P2-2 (per-service hubs) and P2-3 (per-city hubs) in the action plan.
- `/seo-audit` — quarterly SEO audit: scan all articles, auto-fix schema/meta gaps, open PR with report
- `/pr` — generate and create a pull request for the current branch
- `/review` — review changed files before merging. **Must flag as FAIL if `npm run test:functional` is not confirmed passing. Must run `/impeccable critique` on any changed HTML/CSS page and flag impeccable FAILs as merge blockers.**
- `/test` — run all three test commands: `npm test` (links) + `npm run screenshot` + `npm run test:functional` (165 functional tests). All must exit 0.
- `/impeccable` — design quality tool. Required before any PR that touches HTML or CSS. Fix all FAIL items before opening the PR. See `.claude/skills/impeccable/` for full documentation.
- `/visual-review` — Playwright MCP-driven deep visual check at desktop + mobile viewports, scoped to touched pages by default. Use after `/test` for any visual/CSS work; auto-invoked by `/seo-hub` Phase 5.
- `/new-content` — lightweight scaffolder for a single article, hub page, or static page (no research, no test loop — use when you just need a stub)

## Project Structure
- `index.html` — homepage
- `pages/about.html`, `pages/services.html`, `pages/contact.html`, `pages/faq.html`, `pages/testimonials.html`, `pages/blog.html` — main pages
- `pages/[appliance]-repair-orange-county.html` — per-service hub pages (P2 of action plan)
- `pages/appliance-repair-[city]-ca.html` — per-city landing pages (P2 of action plan)
- `pages/service-areas.html` — service-areas hub (P2 of action plan)
- `articles/article-*.html` — individual blog articles
- `shared.css` — shared styles used across all pages
- `scripts/` — node scripts: `add-seo-improvements.js`, future `build-sitemap.js`
- `test/` — screenshot and link-check scripts

## Tech Stack
- Tailwind CSS via CDN (consider compiling to a static stylesheet — see action plan)
- Vanilla HTML — no build step
- Puppeteer for visual testing