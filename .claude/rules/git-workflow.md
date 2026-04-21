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
