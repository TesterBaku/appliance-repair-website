# Run Tests

Run visual screenshots and link checks across all pages.

## Steps

1. **Screenshot all pages** — run `node test/screenshot.js` and report any pages that fail to render.

2. **Check for broken internal links** — run `node test/links.js` and list any broken hrefs.

3. **Manual checklist** (verify by reading the HTML files):
   - [ ] Every page has a `<title>` tag
   - [ ] Every page includes `shared.css`
   - [ ] Every `<img>` has an `alt` attribute
   - [ ] Nav links point to existing `.html` files
   - [ ] No `placehold.co` images remain in production-ready pages (warn if found)

4. Report results:
   - List any failures with file name and line number
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
