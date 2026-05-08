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
- [ ] `npm test` — link checker exits 0
- [ ] `npm run screenshot` — all page screenshots captured
- [ ] `npm run test:functional` — all 165 functional tests pass (buttons, nav, forms, accordions)
- [ ] Opened in browser and checked visually
- [ ] Tested on mobile viewport (375px)
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
5. **Repeat** until all three test commands exit with code 0

### Rules
- Never skip validation after a fix — always re-run the test before moving on
- Never apply the same fix twice; a repeated failure means a different root cause
- Fix one issue at a time; do not batch unrelated fixes in a single commit
- Commit each fix separately using `fix(<scope>): <description>` format

### Test Commands
```
npm test                 # link checker — checks all internal .html hrefs
npm run screenshot       # puppeteer — loads each page and captures a screenshot
npm run test:functional  # functional — verifies buttons, nav, forms, accordions (165 tests)
npm run test:all         # runs all three above in sequence
```

**All three must exit 0 before a PR is created or approved.**

### Common Failure Patterns
| Test | Symptom | Likely Cause |
|------|---------|--------------|
| `npm test` | `broken link: <file>.html` | Linked file was renamed or deleted |
| `npm test` | `broken link: <path>` | Wrong relative path in `href` |
| `npm run screenshot` | `MISSING: <page>.html` | Page listed in `screenshot.js` but file not created |
| `npm run screenshot` | `FAIL: <page>.html — ...` | Puppeteer navigation error or page crash |
| `npm run test:functional` | `✗ <test name>` | Button/CTA points to wrong page; accordion broken; form field missing |

---

## UI/UX Development Requirement

Any PR that touches `.html` or `.css` files **must** use the impeccable skill before creating the PR:

1. **Run `/impeccable critique` on every changed page.** Read the full FAIL / WARN / PASS report.
2. **Fix all FAIL items.** Do not open the PR until impeccable returns zero FAILs on all changed pages.
3. **Include the impeccable score** in the PR description (e.g. "Impeccable: 35/40, 0 FAILs").
4. **WARN items** are advisory — list them in the PR description so the reviewer can decide whether to address them.

**What impeccable flags as FAIL (design blockers):**
- Side-stripe accent borders (`border-left` / `border-right` > 1px as colored decoration)
- Gradient text (`background-clip: text` + gradient fill)
- Glassmorphism used decoratively
- Identical icon+heading+text card grids
- Em dashes (`—`) in user-visible copy
- Off-palette colors not defined in `DESIGN.md`
- `color: #888` or dimmer for meaningful text (minimum `#666` on white backgrounds)
- "Book" / "Schedule" CTAs linking to the wrong destination

This applies to: new pages, redesigned sections, copy changes, CSS refactors, and hub pages.

## Code Review

### What to check
- Visual fidelity against the reference design
- Tailwind classes are correct and not redundant
- No hardcoded colors outside of `DESIGN.md` palette
- No unused CSS or dead code
- Mobile layout works at 375px width
- **Impeccable critique shows 0 FAILs on all changed HTML/CSS pages**

### Review rules
- At least one approval required before merging
- Author should not merge their own PR without review
- Resolve all comments before merging
- Squash merge into `main`

## PR on Every Change

Every request that results in any code or file change — however small — must follow the full workflow:

1. Create a branch off `master`
2. Make the change and commit it
3. Run **all three** test commands — all must exit 0:
   - `npm test` — link checker
   - `npm run screenshot` — page screenshots
   - `npm run test:functional` — 165 functional tests (buttons, nav, forms, accordions)
4. Create a PR
5. **Run `/review` as an independent subagent** — spawn a fresh Agent with no context from the implementation conversation. The reviewer must not be the same agent that wrote the code.
6. The `/review` subagent **must verify** that the PR description shows all three tests passing. Flag as **FAIL** if `npm run test:functional` is missing from the checklist or not confirmed passing.
7. Fix any blockers the reviewer raises, re-run all three tests, then re-run `/review`
8. Merge only after the reviewer outputs `✅ APPROVED`

No direct commits to `master`. No skipping steps for "small" changes. No self-merging without a reviewer verdict.

---

## Protected Branches

**Never push directly to `master` or `main`.** All changes must go through a pull request.

- The `pre-push` git hook enforces this automatically — a direct push will be rejected
- Always branch off `main`, make your changes, then open a PR
- Force-pushing to `main` is also prohibited
