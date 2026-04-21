# Code Review

Review the changes on the current branch against `main`. Check every changed HTML/CSS file.

## Steps

1. Run `git diff main...HEAD` to get all changes.
2. For each changed file, evaluate against these criteria:

### HTML Quality
- [ ] Valid semantic HTML (headings in order, landmarks used correctly)
- [ ] No inline styles — use Tailwind classes only
- [ ] Images have `alt` attributes
- [ ] Links have meaningful text (no "click here")
- [ ] No hardcoded colors outside Tailwind utilities

### Design Consistency
- [ ] Uses `shared.css` for any styles not covered by Tailwind
- [ ] Font sizes, weights, and spacing match the rest of the site
- [ ] Mobile layout works (uses responsive Tailwind prefixes: `sm:`, `md:`, `lg:`)
- [ ] Nav and footer match the pattern used in `index.html`

### Git / PR Hygiene
- [ ] Branch name follows `<type>/<short-description>` convention
- [ ] No debug code, console.logs, or commented-out blocks left in
- [ ] No unrelated changes mixed into this branch

## Output Format

Report results as:
- **PASS** — criterion met
- **FAIL** — criterion not met, with specific file + line reference and what to fix
- **WARN** — minor issue worth noting

End with a summary: Ready to merge / Needs changes.
