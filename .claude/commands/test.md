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
