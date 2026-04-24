# Appliance Repair Website

Static HTML website for an appliance repair service. Built with Tailwind CSS via CDN.

## Rules
- `rules/git-workflow.md` — branch naming, commits, PRs, code review
- `rules/seo-content.md` — SEO guidelines, Orange County city targeting, keyword strategy, required schema markup

## Content Log
- `CONTENT_LOG.md` — running log of every `/seo-blog` run: articles created, PRs, commits, workflow changes

## Scheduled Automation

### Content publishing — `/seo-blog`
Runs **Mon/Wed/Fri at 6 AM Pacific (13:00 UTC)**. Fully autonomous: research → propose → write → test → merge.

- **Routine ID:** `trig_01ApQaWZG9LhY6jsp8tbxn8D`
- **Manage / disable:** https://claude.ai/code/routines/trig_01ApQaWZG9LhY6jsp8tbxn8D
- **What it does:** Phase 0 web research, auto-selects topics 1–3, creates 3 articles, runs tests, reviews, **merges automatically**, logs in `CONTENT_LOG.md`
- **DST note:** cron is fixed at 13:00 UTC; update to `0 14 * * 1,3,5` in November when clocks fall back to PST

### Quarterly SEO audit — `/seo-audit`
Runs **1st of Jan, Apr, Jul, Oct at 6 AM Pacific (13:00 UTC)**. Audits all articles, auto-fixes schema/meta gaps, opens a PR with a report of flagged items.

- **Routine ID:** see AUDIT_LOG.md after first run
- **Manage / disable:** https://claude.ai/code/routines
- **What it does:** scans all `article-*.html` for schema, OG tags, image dimensions, content quality; auto-fixes with `scripts/add-seo-improvements.js`; opens a PR with audit report — **does not merge** (needs owner review of flagged items)
- **Audit log:** `.claude/AUDIT_LOG.md`

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
