# Run Tests

CI's "Validate site" job runs these three commands on every PR, and a green run on the PR's head commit is the merge evidence (owner rule 2026-11-04). Use this command only when CI is unavailable or for a targeted local check, never to repeat a CI run. When you do run it locally, all three must exit 0.

## Steps

1. **`npm test`** — link check (all pages) + HTML integrity + content integrity + CSS vars + partial
   drift (footer/nav) + site.js drift + blog-count drift. Runs against the static files; no server.

2. **`npm run screenshot`** — Playwright batch screenshots; report any page that fails to render.

3. **`npm run test:functional`** — Playwright functional suite (nav, dropdowns, forms,
   accordions, articles, hubs). Auto-starts a server on :8788.

   (`npm run test:all` runs all three in sequence.)

4. After adding/editing/removing an `.html` page, also regenerate + commit the sitemap:
   `npm run build:sitemap` then confirm `git diff --quiet sitemap.xml`.

5. Report results:
   - List any failures with file name and line number.
   - If all pass: "All tests passed."
   - If failures: "X issues found — fix before merging."

---

## When to run /visual-review

`/test` is the fast smoke gate (link checker + batch screenshot). It does not catch viewport-specific issues like hamburger nav working on mobile, sticky CTA bar visibility, hero text sizing, or tap-target dimensions.

Run `/visual-review` after `/test` when:
- Touching `shared.css` or any `<style>` block (visual change)
- Working on action plan P1-* (mobile fixes)
- Building a hub page via `/seo-hub` (already wired into Phase 5)
- Before merging any PR that changed how the site looks

`/visual-review` scopes to touched pages by default and uses Playwright MCP to drive a real browser at desktop (1440×900) and mobile (375×812) viewports.
