---
name: git-workflow
description: Use whenever a task in this repository is about to produce a git branch, a commit, or a pull request, or whenever deciding whether a code/design review is needed before a change can merge. Applies even when the request never says "PR" or "git" and only says something like "fix this bug", "make the tests pass", "ship this", or "commit that". Also use when a test is failing and needs to be driven to green.
---

**When NOT to use this skill:** this skill governs process only (branch, commit, PR, review, and
which design check a PR needs), never the content of the change itself. For what to write or
build, use the matching domain skill instead: `seo-content` for site copy/schema, `mobile-design`
for HTML/CSS layout, `testimonial-selection` for review cards, `gbp-platform-policy` for
external-platform copy, `trusted-sources` for web research.

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
- Branch off `master` unless told otherwise

## Commit Messages
Follow Conventional Commits format:
```
<type>(<scope>): <short description>
```

Types: `feat`, `fix`, `chore`, `content`, `style`, `refactor`, `docs`

(`docs` for changes to `AGENTS.md`, `.claude/skills/*/SKILL.md`, `.claude/commands/` and similar. It was in use
before it was listed here — precedent `9a23446 docs(agents): add reporting contracts` — so this
records existing practice rather than introducing a type.)

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
- [ ] `npm run test:functional` — the functional suite passes (buttons, nav, forms, accordions)
- [ ] Impeccable — full `/impeccable critique` with its `??/40` score. Required on every HTML/CSS PR; there is no detector-only tier. Never report `detect.mjs` output under the critique's name, and never report a `⚠️ DEGRADED: single-context` score as a clean one.
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
npm run screenshot       # Playwright — loads each page and captures a screenshot
npm run test:functional  # functional — verifies buttons, nav, forms, accordions
npm run test:all         # runs all three above in sequence
```

**All three must exit 0 before a PR is created or approved.**

### Common Failure Patterns
| Test | Symptom | Likely Cause |
|------|---------|--------------|
| `npm test` | `broken link: <file>.html` | Linked file was renamed or deleted |
| `npm test` | `broken link: <path>` | Wrong relative path in `href` |
| `npm run screenshot` | `MISSING: <page>.html` | Page listed in `screenshot.js` but file not created |
| `npm run screenshot` | `FAIL: <page>.html — ...` | Playwright navigation error or page crash |
| `npm run test:functional` | `✗ <test name>` | Button/CTA points to wrong page; accordion broken; form field missing |

---

## UI/UX Development Requirement

Any PR that touches `.html` or `.css` files **must** use the impeccable skill before creating the PR.

### Two tools, and they are not interchangeable

Confusing these produced 15 PRs that claimed compliance with a gate nobody had run (P6-31). Name the one you actually ran, always.

| | `/impeccable critique` | `node .agents/skills/impeccable/scripts/detect.mjs` |
|---|---|---|
| What it is | The **gate**. An LLM-driven design review: two isolated assessments, Nielsen heuristics, cognitive load, persona red flags | A deterministic anti-pattern scanner. The same engine behind the per-edit hook |
| Output | A `??/40` score (10 heuristics × 4 points) plus FAIL / WARN / PASS findings | A findings list; exit 0 = clean, exit 2 = findings |
| Relationship | Runs the detector itself, as its **Assessment B** | **A component of critique, never a substitute for it** |

Reporting detector output under the word "critique" is under-running the gate, not satisfying it.

### Which one this PR needs

**The full `/impeccable critique`, with its `/40` score in the PR description. Always.** Every PR
that touches an `.html` or `.css` file, with no exceptions and no size threshold. `detect.mjs` on
its own is never a substitute, however small or invisible the diff looks.

**The detector-only tier was removed on 2026-08-20 by owner decision**, after PR #759 tried to claim
it for a one-line `<link rel="preload">` added to `<head>`, arguing the tag has no rendered surface.
The reviewer blocked it, correctly: the old rule's bright line was "no new elements", and a `<link>`
is a new element. **The instructive part is not that the call was wrong, it is how it was wrong.**
The tool was named honestly; what got argued down was the *scope*, by quietly substituting a
plausible-sounding test ("does it render?") for the written one ("is it a new element?"). That lands
in the same place as P6-31's 15 mislabelled PRs — the required gate does not run — but behind a
sentence that reads as reasonable. A tier whose boundary has to be argued will be argued, and the
arguing reliably runs one direction: toward the cheaper tool. So the boundary is gone. There is one
tool, and you run it.

**Two duties the critique does not discharge for you either. Both still apply, every time:**

1. **Grep for em dashes yourself.** The detector's rule is `em-dash-overuse` and fires only at
   **5 or more** in a file; this project bans them outright, so 1–4 pass clean while violating the
   rule. Run `grep -n '—' <changed-files>` and state in the PR that you did. `/review` re-runs this
   grep independently rather than taking your word for it, so a false claim surfaces immediately.
2. **Read the copy you changed.** Assessment A judges copy, but it judges what is on the page, not
   whether you meant it. Read your own wording for tone and clarity before opening the PR.

**Never suppress the critique's sub-agents.** `.agents/skills/impeccable/reference/critique.md:8`
requires Assessment A and Assessment B to run as **two isolated sub-agents whenever a sub-agent/Task
tool is exposed**; running them inline is a **degraded** run and the report must carry a
`⚠️ DEGRADED: single-context` banner. (Cite the **committed** copy at `.agents/skills/…`, not the user-local `~/.claude/…` install: only the former reaches a clone or a cloud run. The two are different provider builds, but lines 8 and 35 are byte-identical in both, verified.) That file also defines the legitimate triggers, and there
are exactly two: no sub-agent/Task tool is exposed in the session, or — on harnesses that ask — the
user declined. Neither is a controller deciding not to spawn them. It says so in as many words:
*"It does not mean inconvenient."*

If you dispatch the critique to a sub-agent, **do not paste a no-subagents instruction into its
prompt.** That contract belongs to *implementer* agents (it exists to stop a worker buying a
duplicate review seat); pasted into a critique agent it forces a degraded run and the degradation is
yours, not the environment's. This happened on PR #759 and produced a degraded 32/40 on record.
**A degraded critique does not satisfy this gate.** If a report comes back with that banner, the
gate has not been run — re-run it undegraded, or say plainly in the PR that the score is degraded
and which of the two legitimate triggers actually applied.

**State the score in the PR description**, e.g. `Impeccable: 34/40, 0 FAILs`. You must be able to
produce the report. A PR that names a tool the author did not run is a `/review` FAIL, and so is a
PR that reports a degraded score as though it were a clean one.

Then, on the critique's report:

1. **Fix all FAIL items.** Do not open the PR until zero FAILs remain on all changed pages.
2. **WARN items** are advisory — list them in the PR description so the reviewer can decide whether to address them.

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

### Review rules
- At least one approval required before merging
- Author should not merge their own PR without review
- Resolve all comments before merging
- Squash merge into `master`

## PR on Every Change

Every request that results in any code or file change — however small — must follow the full workflow:

1. Create a branch off `master`
2. Make the change and commit it
3. Run **all three** test commands — all must exit 0:
   - `npm test` — link checker
   - `npm run screenshot` — page screenshots
   - `npm run test:functional` — the functional suite (buttons, nav, forms, accordions)
4. Create a PR
5. **Run `/review` as an independent subagent** — spawn a fresh Agent with no context from the implementation conversation. The reviewer must not be the same agent that wrote the code.
6. The `/review` subagent **must verify** that the PR description shows all three tests passing. Flag as **FAIL** if `npm run test:functional` is missing from the checklist or not confirmed passing.
7. Fix any blockers the reviewer raises, re-run all three tests, then re-run `/review`
8. Merge only after the reviewer outputs `✅ APPROVED`

No direct commits to `master`. No skipping steps for "small" changes. No self-merging without a reviewer verdict.

---

## Protected Branches

**Never push directly to `master` or `main`.** All changes must go through a pull request.

- The `pre-push` git hook enforces this automatically — a direct push is rejected.
  It is **`.husky/pre-push`**, tracked in the repo and installed by `npm install`
  (via `"prepare": "husky"` in `package.json`), so it arrives with a clone.
  ⚠️ Do not look in `.git/hooks` to confirm it: husky sets `core.hooksPath=.husky/_`,
  so `.git/hooks` holds only `.sample` files and looks empty. Check with
  `git config --get core.hooksPath` and `cat .husky/pre-push` instead.
- Deliberate override, when you actually mean it: `git push --no-verify`
- The hook gates **pushes**, not commits. Nothing stops you committing on `master`
  locally, so branch before you start work, not after.
- Always branch off `master`, make your changes, then open a PR
- Force-pushing to `master` is also prohibited
