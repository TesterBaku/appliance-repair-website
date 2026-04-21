# Appliance Repair Website

Static HTML website for an appliance repair service. Built with Tailwind CSS via CDN.

## Rules
- `rules/git-workflow.md` — branch naming, commits, PRs, code review

## Skills (slash commands)
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
