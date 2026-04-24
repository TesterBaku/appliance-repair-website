# SEO Audit Agent

Quarterly audit of all published articles. Finds SEO gaps, auto-fixes what it can, opens a PR with fixes + a written report of everything found.

Run with `[AUDIT]` in the prompt (scheduled) or invoke manually as `/seo-audit`.

---

## Overview

The audit runs in two passes:

1. **Auto-fix pass** — runs `scripts/add-seo-improvements.js` to ensure all schema, OG tags, and image dimensions are current, then checks for any new issues the script doesn't cover
2. **Report pass** — for issues that need human attention, produces a written audit report committed to `.claude/logs/AUDIT_LOG.md`

---

## Phase 1 — SCAN

Read every `article-*.html` file in the project root and evaluate it against the checklist below. Record results in memory — don't write anything yet.

### Per-article checklist

**Schema (auto-fixable via script):**
- [ ] `Article` schema present
- [ ] `LocalBusiness` schema present
- [ ] `FAQPage` schema present
- [ ] `BreadcrumbList` schema present

**Meta tags (auto-fixable via script):**
- [ ] `og:url` present
- [ ] `article:published_time` present
- [ ] `article:modified_time` present

**Images (auto-fixable via script):**
- [ ] Hero `<img>` has `width` and `height` attributes
- [ ] No `placehold.co` images anywhere in the article

**Content quality (report only — needs human review):**
- [ ] Meta description is 140–165 characters
- [ ] FAQ section contains at least 3 questions
- [ ] Article body text is substantial (>4,000 characters of visible text — rough proxy for 800+ words)
- [ ] No "placehold.co" images (flag for manual replacement)

**Links:**
- [ ] Article is linked from `blog.html`
- [ ] All `href` values in related-articles section point to files that exist

---

## Phase 2 — AUTO-FIX

For any issues that the improvement script can resolve:

1. Run `node scripts/add-seo-improvements.js` to apply schema, OG, and image dimension fixes across all articles
2. Verify the script ran cleanly (exit code 0)
3. Run `npm test` to confirm no broken links were introduced
4. Run `npm run screenshot` to confirm all pages still render

If tests fail after auto-fix: revert the script's changes with `git checkout -- .` and note the failure in the audit report instead of committing broken files.

---

## Phase 3 — REPORT

Append an entry to `.claude/logs/AUDIT_LOG.md`:

```markdown
## Audit — [Month DD, YYYY]

**Articles audited:** [N]
**Auto-fixes applied:** [N issues fixed by script]

### Auto-fixed
| Article | Issue Fixed |
|---|---|
| `[slug].html` | [what was added/fixed] |

### Needs Human Review
| Article | Issue | Recommendation |
|---|---|---|
| `[slug].html` | [issue] | [what to do] |

### All Clear
Articles that passed every check: [list slugs or "None"]
```

Rules:
- Always append — never overwrite existing entries
- If no issues found: write "All [N] articles passed every check." under "All Clear"
- Be specific in recommendations: "Meta description is 112 chars — expand to 145–160 chars targeting keyword X"

---

## Phase 4 — PR

1. Stage all changed files: `git add article-*.html .claude/AUDIT_LOG.md`
2. Commit: `chore(seo-audit): Q[N] [YYYY] audit — [N] auto-fixes, [N] items flagged`
3. Push to a branch named `chore/seo-audit-[YYYY]-q[N]` (e.g., `chore/seo-audit-2026-q2`)
4. Create a PR using the body template below
5. **Do not merge** — leave the PR open for the owner to review the flagged items before merging

### PR body template

```
## SEO Audit — Q[N] [YYYY]

### Auto-fixed ([N] issues)
[Bullet list of what the script fixed]

### Needs your review ([N] items)
[Bullet list of flagged issues with specific recommendations]

### Summary
[One sentence: overall site health assessment]
```

---

## Rules

- Never delete content from articles — only add or update metadata elements
- If the improvement script produces an error on a specific file, skip that file and flag it in the report
- The PR is informational as much as functional — the flagged-items section is the owner's action list
- Quarter calculation: Q1 = Jan–Mar, Q2 = Apr–Jun, Q3 = Jul–Sep, Q4 = Oct–Dec
