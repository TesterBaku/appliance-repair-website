# Lessons

Patterns learned from corrections and incidents. Applied to future work automatically.

---

## Always include `<link rel="canonical">` on every new HTML page at creation time

The site had 62 HTML pages and 4 were missing canonicals — all four were articles created before the canonical convention was established. The GSC report flagged at least one as "Duplicate without user-selected canonical."

**Rule:** Every new `.html` file — article, hub page, or static page — must include a canonical tag in `<head>` immediately after `<title>`. Placement: after `<title>`, before Google Fonts or any other `<link>`.

**Gate:** `/review` and `/seo-blog` must grep for `rel="canonical"` on every changed `.html` file. A new page missing a canonical is a **FAIL** — same level as a missing GA tag.

```html
<link rel="canonical" href="https://fixappliancesfast.com/[path-to-file]" />
```

Fixed by PR that addressed GSC indexing issue (2026-05-06).

---

## Mass working-tree deletions on `master` are almost always accidental — verify, don't push

Twice now (2026-05-06 and 2026-05-07) the working tree on `master` has shown a phantom dirty state with massive deletions across 20+ files: full pages stripped (`pages/testimonials.html` lost 1,155 lines), hub pages losing 100–157 lines each, `rules/seo-content.md` truncated mid-line. Both times: nothing committed, nothing stashed, no branch holding the changes — pure accidental wipe (likely from a sandbox/sync layer, not user edits).

**Rule:** When `git diff --stat` on `master` shows ≥ 1,000 deletions across ≥ 5 unstaged files and `git log` shows no in-progress branch holding the deletions, treat it as accidental. Recovery:

1. Spot-check a couple of the deletions (`git diff <file> | less`) to confirm they look unintentional (e.g., truncated mid-line, whole sections gone)
2. `git restore .` to revert to HEAD
3. Verify clean: `git status` shows "nothing to commit, working tree clean"
4. Document in the active todo so it's known if a third occurrence happens

**Gate idea:** harden `.husky/pre-commit` to refuse any commit that deletes ≥ 1,000 lines across ≥ 5 modified files unless an env var like `ALLOW_BIG_DELETE=1` is set. Catches the wipe before it can be staged. Tracked in `tasks/todo.md` § P0-3.

**Sandbox-mount note (2026-05-07):** the wipe pattern can also surface as a divergence between the user's actual disk (clean) and Claude's bash sandbox mount (corrupted). When that happens, `git status` from PowerShell reports clean and `git status` from sandbox bash reports the phantom diff. Trust the user's disk view; do doc edits via the file tools (Read/Write/Edit), and have the user run the git workflow from their local PowerShell/VS Code rather than driving git from a divergent mount.

---

## When the bash sandbox mount diverges from disk, switch to file tools + hand off git to the user

(Generalization of the previous lesson.) If `git status` in bash shows uncommitted changes that the user doesn't see locally, OR if `tail` of a file shows truncated content the user reports is intact, the bash mount is out of sync with disk. Symptoms include: stale `.git/index.lock` that can't be removed (`Operation not permitted`), `ls` and other commands disagreeing about file existence, mid-line truncations that don't appear in the file via the editor.

**Rule:** Don't run destructive bash ops (`git restore`, `git reset`, `rm`) on a divergent mount — they may not produce the result you expect, and worst case could write corrupted content back to the user's disk.

**Recovery path:**
1. Make file edits via the Read/Write/Edit tools (which see the user's actual disk via the `C:\` path).
2. Hand the user a clear PR checklist with the git commands to run from their local terminal.
3. If git ops are unavoidable from the agent side, prefer the GitHub MCP connector (operates via API, bypasses the local mount entirely).
