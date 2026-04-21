# Contributing

## Branches

Branch off `main` using the format `<type>/<short-description>`:

| Type | When to use |
|------|-------------|
| `feat/` | New page or section |
| `fix/` | Bug or visual fix |
| `chore/` | Cleanup or dependency update |
| `content/` | Copy or asset-only change |

Example: `feat/services-page`, `fix/nav-mobile-layout`

- Lowercase and hyphens only
- Keep it short (2–4 words)

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>
```

Examples:
```
feat(services): add services page layout
fix(nav): correct mobile menu alignment
content(blog): add fridge maintenance article
```

- Present tense, under 72 characters, no trailing period

## Pull Requests

**Title:** same format as commit messages.

**Body must include:**
- Summary of what changed and why
- List of affected files/pages
- Screenshots for any visual changes
- Test checklist (browser check, mobile, no broken links)

## Code Review

Before approving, verify:
- Matches the reference design visually
- Works on mobile (375px)
- No broken links or missing images
- No unused or redundant Tailwind classes

**Rules:**
- 1 approval required to merge
- Don't merge your own PR without review
- Squash merge into `main`
