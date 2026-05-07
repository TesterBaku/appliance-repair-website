# GSC Indexing Remediation — 2026-05-06

Source: Google Search Console alert flagging four "Why pages aren't indexed" reasons on `fixappliancesfast.com`:
- Not found (404) — 3 pages
- Page with redirect — 2 pages
- Duplicate without user-selected canonical — 1 page
- Blocked by robots.txt — 1 page

Plus visible in the same report (not in the alert) — Crawled - currently not indexed — 7 pages.

Audit performed against the working tree on 2026-05-06. See "Findings" at the bottom.

---

## P0 — Environment cleanup (must happen before any branch/commit work)

- [x] **Delete stale git lock file.** From PowerShell:
  ```powershell
  Remove-Item C:\Rufat_docs\appliance-repair-website\.git\index.lock
  ```
  This is a 0-byte leftover from an interrupted git operation. Safe to delete.

- [x] **Resolve the dirty working tree on `master`.** `git diff --stat` shows **3,200 deletions across 17 files, 16 insertions** — all uncommitted. This is almost certainly accidental:
  - `pages/testimonials.html` lost **1,155 lines** (essentially the whole page)
  - `index.html` lost 192 lines (FAQs 9–10, full contact section, sticky CTA bar)
  - All hub pages (`appliance-repair-*-ca.html`, `*-repair-orange-county.html`) lost 100–157 lines each
  - `tasks/testimonials-rollout.md` truncated mid-sentence at "Jovita Osorio,"

  Recommended action — verify nothing of value is in the dirty tree, then revert:
  ```bash
  cd C:\Rufat_docs\appliance-repair-website
  git diff index.html | less                  # spot-check what was deleted
  git diff pages/testimonials.html | less     # the big one
  git diff --stat                             # full file-by-file count
  git restore .                               # revert all 17 files when ready
  git status                                  # confirm clean tree
  ```

- [x] Confirm the working tree is clean (`git status` shows "nothing to commit, working tree clean") before moving to P1.

---

## P1 — Add missing canonical tags (autonomous fix, likely closes the GSC duplicate-canonical flag)

Four articles are missing `<link rel="canonical">` entirely. Every other page on the site has one. One of these four is almost certainly the page GSC flagged as "Duplicate without user-selected canonical (1)"; the other three are likely-future flags waiting to happen.

Files to edit and the exact tag to insert into each:

- [ ] `articles/article-dorm-appliances.html`
  ```html
  <link rel="canonical" href="https://fixappliancesfast.com/articles/article-dorm-appliances.html" />
  ```
- [ ] `articles/article-fridge-maintenance.html`
  ```html
  <link rel="canonical" href="https://fixappliancesfast.com/articles/article-fridge-maintenance.html" />
  ```
- [ ] `articles/article-mini-fridge.html`
  ```html
  <link rel="canonical" href="https://fixappliancesfast.com/articles/article-mini-fridge.html" />
  ```
- [ ] `articles/article-repair-replace.html`
  ```html
  <link rel="canonical" href="https://fixappliancesfast.com/articles/article-repair-replace.html" />
  ```

**Insertion point in each file:** immediately after the `<title>...</title>` line (currently line 14 in each), before the Google Fonts `<link>`. This matches the placement used by every other page on the site (verified with `grep -h 'rel="canonical"' --include="*.html" -r .`).

---

## P2 — Full git workflow per `rules/git-workflow.md`

- [ ] Branch off `master`:
  ```bash
  git checkout -b fix/missing-canonicals
  ```
- [ ] Apply the 4 edits from P1.
- [ ] Run tests:
  ```bash
  npm test            # link checker
  npm run screenshot  # puppeteer visual smoke
  ```
  Both must exit code 0. Fix any failures one at a time per the bug-fix loop in `rules/git-workflow.md`.
- [ ] Commit:
  ```bash
  git add articles/article-dorm-appliances.html articles/article-fridge-maintenance.html articles/article-mini-fridge.html articles/article-repair-replace.html
  git commit -m "fix(seo): add canonical tags to 4 articles missing them"
  ```
- [ ] Push:
  ```bash
  git push -u origin fix/missing-canonicals
  ```
- [ ] Open PR using `/pr` skill. PR title: `fix(seo): add canonical tags to 4 articles missing them`. PR body should reference this todo and note that the change likely resolves the GSC "Duplicate without user-selected canonical" flag.
- [ ] Run `/review` **as an independent subagent** (per the standing rule in `rules/git-workflow.md` § "PR on Every Change"). Reviewer must be a fresh Agent with no context from the implementation conversation.
- [ ] Address blockers if any; re-run `/review` until verdict is `✅ APPROVED`.
- [ ] Merge.

---

## P3 — GSC follow-ups (need the actual URL lists from Search Console)

These three buckets cannot be addressed without knowing the specific URLs. Click into each row in GSC → "Page indexing" → export the URL list, then handle as below.

- [ ] **Not found (404) — 3 pages.** For each URL:
  - If it's an old slug from before a rename, add a redirect to the live equivalent. GitHub Pages doesn't support `_redirects` natively — easiest path is a static HTML file at the old slug containing `<meta http-equiv="refresh" content="0; url=/new-slug">` plus `<link rel="canonical" href="https://fixappliancesfast.com/new-slug">`.
  - If the page is genuinely gone, leave the 404 and use GSC's URL removal tool to drop it from the index.
- [ ] **Blocked by robots.txt — 1 page.** Current `robots.txt` is `User-agent: * / Allow: /` — there is no rule that should be blocking anything. Most likely a stale Google-side state. Confirm the URL, then in GSC use "Validate fix" to trigger a recrawl.
- [ ] **Page with redirect — 2 pages.** Almost certainly the GitHub Pages forced HTTP→HTTPS redirect on stale `http://` URLs Google has from before. Confirm by inspecting the URLs in GSC. If they redirect to the canonical HTTPS URL, no action needed — use "Validate fix" to clear them.

---

## P4 — Crawled - currently not indexed (7 pages, not in the alert but visible in the same report)

Strong hypothesis: this matches exactly the 7 blog category pages added today (2026-05-06):
`pages/blog/refrigerator.html`, `washer.html`, `dryer.html`, `oven-stove.html`, `dishwasher.html`, `freezer.html`, `other.html`.

- [ ] Confirm the 7 URLs in GSC match the new blog category pages.
- [ ] Verify each is linked from `pages/blog.html` (the main blog hub) — Google deprioritizes pages with weak internal-link signals. If any aren't linked, add them.
- [ ] Verify each has substantive unique content and a unique meta description (not just a list of article links). The 7 share a template — if their bodies are mostly the same, that depresses indexing priority.
- [ ] Submit each URL via "Request indexing" in GSC URL Inspection.

---

## P5 — Capture lessons (after P1–P2 ship)

- [ ] Add to `tasks/lessons.md`:
  > **Always include `<link rel="canonical">` on every new HTML page at creation time.** The site has 62 HTML pages and 4 were missing canonicals — all four were articles likely created before the canonical convention was uniform. Gate this in `/review` and `/seo-blog`'s test phase: any new `.html` file missing `rel="canonical"` is a FAIL.

- [ ] Update the `/review` skill so it greps for `rel="canonical"` on every changed `.html` file and fails the review if missing (parallel to the existing Google Analytics tag check in `CLAUDE.md`).

- [ ] Update `.claude/rules/seo-content.md` § "`<head>` tags (required — production URLs only)" to call out canonical as a hard requirement, not just a list item.

---

## Findings (audit performed 2026-05-06)

Recorded here so future runs don't have to re-audit:

- **Sitemap is clean.** `sitemap.xml` lists 60 URLs; every URL has a corresponding file on disk. The two HTML files not in the sitemap are `404.html` (correct) and `index.html` (correct — listed as `/` in the sitemap).
- **`robots.txt` is permissive.** Just `User-agent: * / Allow: /` plus a sitemap reference. Nothing on the site is currently disallowed.
- **No `meta robots noindex`** anywhere except `404.html` (correct).
- **All canonicals on the site point to `https://fixappliancesfast.com/...`** — no off-domain or http:// canonicals.
- **No deploy-time redirect config** (no `_redirects`, `_headers`, `vercel.json`, `netlify.toml`, `.htaccess`, etc.). The site is hosted on **GitHub Pages** (per `.github/workflows/deploy.yml`), which only does HTTP→HTTPS and trailing-slash normalization automatically.
- **Only 4 pages are missing canonicals** — the 4 listed in P1.

---

## Review (fill in after P1–P2 merge)

- _Date merged:_
- _PR number:_
- _GSC validation result for each fixed URL (re-check 7–14 days after merge):_
- _Did the duplicate-canonical flag clear?_
