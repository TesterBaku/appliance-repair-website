## Workflow Orchestration

### 1. Plan Mode Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 3. Subagent Strategy
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

## Rules
- `rules/git-workflow.md` — branch naming, commits, PRs, code review
- `rules/seo-content.md` — SEO guidelines, Orange County city targeting, keyword strategy, required schema markup

## Logs
- `logs/CONTENT_LOG.md` — running log of every `/seo-blog` run: articles created, PRs, commits, workflow changes
- `logs/AUDIT_LOG.md` — quarterly SEO audit results: auto-fixes applied, items needing human review

## Scheduled Automation

### Content publishing — `/seo-blog`
Runs **Mon/Wed/Fri at 6 AM Pacific (13:00 UTC)**. Fully autonomous: research → propose → write → test → merge.

- **Routine ID:** `trig_01ApQaWZG9LhY6jsp8tbxn8D`
- **Manage / disable:** https://claude.ai/code/routines/trig_01ApQaWZG9LhY6jsp8tbxn8D
- **What it does:** Phase 0 web research, auto-selects topics 1–3, creates 3 articles, runs tests, reviews, **merges automatically**, logs in `CONTENT_LOG.md`
- **DST note:** cron is fixed at 13:00 UTC; update to `0 14 * * 1,3,5` in November when clocks fall back to PST

### Quarterly SEO audit — `/seo-audit`
Runs **1st of Jan, Apr, Jul, Oct at 6 AM Pacific (13:00 UTC)**. Audits all articles, auto-fixes schema/meta gaps, opens a PR with a report of flagged items.

- **Routine ID:** `trig_01Sh3FPw2RJwrnSPXG3KjnrD`
- **Manage / disable:** https://claude.ai/code/routines/trig_01Sh3FPw2RJwrnSPXG3KjnrD
- **What it does:** scans all `article-*.html` for schema, OG tags, image dimensions, content quality; auto-fixes with `scripts/add-seo-improvements.js`; opens a PR with audit report — **does not merge** (needs owner review of flagged items)
- **Audit log:** `.claude/logs/AUDIT_LOG.md`

## Standing Rule — PR on Every Change
Any request that results in a code or file change must go through the full workflow:
branch → commit → test → PR → review → merge. No exceptions, even for small edits.

## Skills (slash commands)
- `/seo-blog` — full SEO blog workflow: research → propose → create → test → demo → iterate → PR → review → merge
- `/seo-audit` — quarterly SEO audit: scan all articles, auto-fix schema/meta gaps, open PR with report
- `/pr` — generate and create a pull request for the current branch
- `/review` — review changed files before merging
- `/test` — run screenshot and link checks across all pages
- `/new-content` — scaffold a new article or page from a template

## Project Structure
- `index.html` — homepage
- `about.html`, `services.html`, `contact.html`, `faq.html`, `testimonials.html` — main pages
- `blog.html` — blog listing page
- `article-*.html` — individual blog articles
- `shared.css` — shared styles used across all pages
- `test/` — screenshot and link-check scripts

## Tech Stack
- Tailwind CSS via CDN
- Vanilla HTML — no build step
- Puppeteer for visual testing
