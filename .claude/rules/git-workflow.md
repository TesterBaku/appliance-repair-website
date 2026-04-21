# Git Workflow

## Branch Naming
Format: `<type>/<short-description>`

Types:
- `feat/` — new page, section, or feature
- `fix/` — bug or visual mismatch fix
- `chore/` — refactor, cleanup, dependency update
- `content/` — copy or asset changes only

Examples:
- `feat/services-page`
- `fix/nav-mobile-layout`
- `content/update-blog-articles`

Rules:
- Use lowercase and hyphens only (no spaces, no underscores)
- Keep descriptions short (2–4 words)
- Branch off `main` unless told otherwise

## Commit Messages
Follow Conventional Commits format:
```
<type>(<scope>): <short description>
```

Types: `feat`, `fix`, `chore`, `content`, `style`, `refactor`

Examples:
- `feat(services): add services page layout`
- `fix(nav): correct mobile menu alignment`
- `content(blog): add fridge maintenance article`
- `style(index): adjust hero section spacing`

Rules:
- Use present tense ("add" not "added")
- Keep the subject line under 72 characters
- No period at the end

## Pull Requests

### Title
Same format as commit messages:
```
feat(about): add team section with cards
```

### Body Template
```
## Summary
- What changed and why

## Pages / Files Affected
- List changed files

## Visual Changes
- Attach before/after screenshots if layout changed

## Test Checklist
- [ ] Opened in browser and checked visually
- [ ] Tested on mobile viewport
- [ ] No broken links or missing images
- [ ] Matches reference design
```

## Bug Fix Workflow

When a test (`npm test` or `npm run screenshot`) reports a failure, follow this loop until all tests pass:

### Fix Loop
1. **Run tests** — identify failing test(s) and capture the exact error output
2. **Diagnose** — locate the root cause in the relevant HTML, CSS, or test script
3. **Fix** — make the minimal change needed to address the root cause
4. **Validate** — re-run the same test immediately after the fix
   - If it passes → mark fixed, move to next failure
   - If it still fails → do NOT re-run the same fix; change approach and repeat from step 2
5. **Repeat** until `npm test` and `npm run screenshot` both exit with code 0

### Rules
- Never skip validation after a fix — always re-run the test before moving on
- Never apply the same fix twice; a repeated failure means a different root cause
- Fix one issue at a time; do not batch unrelated fixes in a single commit
- Commit each fix separately using `fix(<scope>): <description>` format

### Test Commands
```
npm test            # link checker — checks all internal .html hrefs
npm run screenshot  # puppeteer — loads each page and captures a screenshot
```

### Common Failure Patterns
| Test | Symptom | Likely Cause |
|------|---------|--------------|
| `npm test` | `broken link: <file>.html` | Linked file was renamed or deleted |
| `npm test` | `broken link: <path>` | Wrong relative path in `href` |
| `npm run screenshot` | `MISSING: <page>.html` | Page listed in `screenshot.js` but file not created |
| `npm run screenshot` | `FAIL: <page>.html — ...` | Puppeteer navigation error or page crash |

---

## Code Review

### What to check
- Visual fidelity against the reference image
- Tailwind classes are correct and not redundant
- No hardcoded colors outside of Tailwind config
- Images use `placehold.co` if source not available
- No unused CSS or dead code
- Mobile layout works at 375px width

### Review rules
- At least one approval required before merging
- Author should not merge their own PR without review
- Resolve all comments before merging
- Squash merge into `main`

## PR on Every Change

Every request that results in any code or file change — however small — must follow the full workflow:

1. Create a branch off `master`
2. Make the change and commit it
3. Run `npm test` and `npm run screenshot`
4. Create a PR
5. Run `/review`
6. Merge if review passes

No direct commits to `master`. No skipping steps for "small" changes.

---

## Protected Branches

**Never push directly to `master` or `main`.** All changes must go through a pull request.

- The `pre-push` git hook enforces this automatically — a direct push will be rejected
- Always branch off `main`, make your changes, then open a PR
- Force-pushing to `main` is also prohibited
