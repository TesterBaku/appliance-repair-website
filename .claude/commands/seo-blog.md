# SEO Blog Agent

Full-cycle agent: research → propose → create → test → demo → iterate → PR → review → merge.

Follow every phase in order. Do not skip phases or combine steps.

---

## Run Modes

### Interactive (manual `/seo-blog` invocation)
- Ask about cost inclusion (Phase 1, step 0)
- Present topic list and wait for user selection
- Show screenshot and wait for user approval before creating PR
- Run review → merge after user approves

### Scheduled (automated Mon/Wed/Fri run)
- Skip cost question — default is **keep out** (no dollar amounts)
- Skip topic selection — default is **topics 1, 2, 3**
- Show screenshot inline in output, then proceed directly to PR (no approval gate)
- Run `/review`, fix any FAILs
- **Merge each PR automatically** after review passes — no human gate
- Log the run in `CONTENT_LOG.md` after all articles are merged

Detect scheduled mode when the prompt contains `[SCHEDULED]`.

**Active routine:** `trig_01ApQaWZG9LhY6jsp8tbxn8D` — runs Mon/Wed/Fri at 13:00 UTC (6 AM PDT)
Manage at: https://claude.ai/code/routines/trig_01ApQaWZG9LhY6jsp8tbxn8D

---

## Phase 0 — RESEARCH

**Goal:** Use live web search to find ranking gaps and real user questions before proposing ideas. This makes proposals data-driven rather than rotational.

### Steps

1. Read all existing `article-*.html` filenames and `rules/seo-content.md` to identify the top 5 uncovered city × appliance combinations that look most promising.

2. For each of 3 candidate keyword combinations, run a `WebSearch` to assess the competitive landscape:
   - Search query: `"[appliance] repair [city] CA"`
   - Note: what article types are in the top results? Are they thin (no FAQ, no schema, short word count)? Local directories vs. actual repair businesses?
   - A keyword where the top results are weak (low-quality pages, Yelp/Angi dominating, no how-to content) is a high-opportunity target.

3. For each of the same 3 combinations, search for "people also ask" style questions:
   - Search query: `"[appliance] repair [city] site:reddit.com OR people also ask [appliance] [symptom]"`
   - Extract 2–3 real questions that people actually ask — these go directly into the FAQ section of the article, making it eligible for FAQ rich results.

4. Check for seasonal relevance:
   - If the current month is May–September: prioritize cooling-related appliances (fridge, freezer)
   - If October–March: prioritize heating-related (oven, dryer, range)
   - This angles articles toward what's actively being searched right now

5. Summarize findings in 3–5 bullet points before moving to PROPOSE. For each candidate keyword note:
   - Competition level: **Low** / **Medium** / **High**
   - Top result types: (e.g., "Yelp + one thin blog post")
   - 2 real FAQ questions found

---

## Phase 1 — PROPOSE

**Goal:** Generate targeted, research-backed blog ideas.

### Steps

0. **Ask about costs** — In **interactive mode**: ask _"Should articles include cost/pricing information (repair price ranges, dollar amounts), or keep it out?"_ and wait for the answer. In **scheduled mode**: skip the question, default is keep out.

1. Using findings from Phase 0 and the coverage map from `article-*.html` files, generate **8–10 article ideas** that:
   - Cover a city + appliance + article-type combination not yet published
   - Prioritize keywords where Phase 0 found weak competition or strong question volume
   - Mix article types (at least 3 types represented)
   - Are realistic for a local appliance repair business to rank for

2. Present ideas as a numbered list. For each idea include:
   - **Title** — final H1 / `<title>` text
   - **Slug** — filename without `.html` (e.g., `article-washer-repair-irvine`)
   - **Primary keyword** — the exact phrase to optimize for
   - **Type** — which article type from the rules (local service, cost guide, etc.)
   - **Why it'll rank** — 1 sentence grounded in Phase 0 findings (competition level, gap found, question volume)
   - **FAQ seeds** — 2 real questions from Phase 0 research to include in the article's FAQ section

3. **Interactive mode**: Ask _"Which topic(s) do you want to create? Enter numbers (e.g., 1 or 1,3,5). Or type 'all'."_ and wait for the user's selection.  
   **Scheduled mode**: Auto-select topics 1, 2, 3. Log the selection in output.

---

## Phase 2 — BRANCH

For each selected topic (run one at a time if multiple):

1. Check out `master` and pull latest: `git checkout master && git pull origin master`
2. Create branch: `git checkout -b content/<slug>`
   - Use the slug from the selected idea
   - Example: `git checkout -b content/article-washer-repair-irvine`

---

## Phase 3 — CREATE

**Goal:** Build a fully SEO-optimized article page.

### Reference template
Use `article-fridge-maintenance.html` as the structural template. Keep the same:
- Nav (exact copy)
- Footer (exact copy)
- Hero section pattern (full-width image, H1, date, read time, gradient overlay)
- Breadcrumb pattern
- Related articles grid (3 cards)
- Embedded `<style>` tag (copy base styles, adjust only what's needed)

### Content to write
Write real, helpful content — not placeholder text. Include:
- **Intro** (2–3 sentences, primary keyword in first sentence)
- **3–6 body sections** with H2 subheadings (each targets a secondary keyword)
- **Practical details**: common part names, typical repair timelines, when to DIY vs call a pro
- **FAQ section** (3–5 Q&As drawn from "people also ask" patterns for the keyword)
- **CTA box**: "Serving [City] and all of Orange County — call or book online"

### SEO elements (required — see `rules/seo-content.md`)
- `<title>`, `<meta name="description">`, `<meta name="keywords">`, `<link rel="canonical">`
- Open Graph tags including `og:url`, `article:published_time`, `article:modified_time`
- All four schema blocks: Article, LocalBusiness, FAQPage, BreadcrumbList
- Primary keyword in H1, first paragraph, one H2, and meta description
- City name used 3–5 times naturally in body text
- **Use the FAQ seeds from Phase 0 research** as the basis for the FAQ section — these are real questions people search, which maximises FAQPage rich result eligibility

### Mobile layout (required — see `rules/seo-content.md`)
- All layouts must be responsive at 375px width
- Use responsive Tailwind prefixes (`sm:`, `md:`, `lg:`) or CSS media queries in the embedded `<style>` tag
- Test mentally: hero text readable, cards stack vertically, nav collapses, CTA box full-width on mobile

### Images
- Use `https://images.unsplash.com/photo-[id]?w=1200&q=80` for hero images — only use Unsplash photo IDs you are confident are topically correct
- Do **not** include in-body images unless you are certain of the photo ID and its relevance — a missing image is better than a wrong one
- All images must have descriptive `alt` attributes including the primary keyword
- Add `width="1600"` and the correct `height` (matching the CSS `.article-hero-img` height) to the hero `<img>` tag

### Update `blog.html`
Append a new card in the blog grid `.blog-grid` section:
```html
<div class="blog-card">
  <div class="blog-img-wrap">
    <img class="blog-img" src="[hero image url]" alt="[descriptive alt]" />
    <span class="blog-cat-badge">[Appliance type]</span>
  </div>
  <div class="blog-body">
    <p class="blog-date">[Month DD, YYYY]</p>
    <h3 class="blog-title">[Article title]</h3>
    <p class="blog-excerpt">[2-sentence excerpt]</p>
    <a href="[slug].html" class="blog-link">Read more →</a>
  </div>
</div>
```

### Note on `test/screenshot.js`
No update needed — screenshot.js auto-discovers all `article-*.html` files in the project root.

### Commit
```
git add [slug].html blog.html
git commit -m "content([slug]): add [short description of topic]"
```

---

## Phase 4 — TEST

Run both test suites and fix any failures before continuing.

```bash
npm test          # link checker
npm run screenshot  # puppeteer screenshots
```

Apply the Bug Fix Workflow from `rules/git-workflow.md`:
- Fix one issue at a time
- Re-run the failing test after each fix
- Commit each fix separately: `fix([scope]): [description]`
- Do not proceed to Phase 5 until both commands exit 0

---

## Phase 5 — DEMO

1. Read the screenshot file at `test/screenshots/[slug].png` and display it to the user using the Read tool (it will render inline).
2. **Interactive mode**: Ask _"Here's how the article looks. Approve to move to PR, or describe any changes you'd like."_ Wait for response.  
   **Scheduled mode**: Log the screenshot in output and proceed directly to Phase 7.

---

## Phase 6 — ITERATE (interactive mode only)

1. Make the requested changes to `[slug].html` (and `blog.html` if needed).
2. Commit: `fix([slug]): [short description of change]`
3. Return to **Phase 4** (test) → then **Phase 5** (demo).
4. Repeat until the user explicitly approves.

---

## Phase 7 — PR

Invoke `/pr` to create the pull request.

The PR title must follow: `content([slug]): add [topic description]`

Example: `content(blog): add washer repair Irvine article`

---

## Phase 8 — REVIEW

Invoke `/review` to check the branch against `main`.

- If review result is **"Ready to merge"**: proceed to Phase 9.
- If review result is **"Needs changes"**: fix every FAIL item, commit each fix, re-run `/review`, repeat until clean.

---

## Phase 9 — MERGE

Merge via squash using the GitHub CLI:

```bash
gh pr merge --squash
```

Confirm the merge succeeded:

```bash
git checkout master && git pull origin master
git log --oneline -3
```

**Interactive mode**: Report the merged commit hash and PR URL to the user. Then proceed to Phase 10.  
**Scheduled mode**: Log the merged commit hash internally and proceed to Phase 10. No user report needed.

---

## Phase 10 — LOG

Append an entry to `.claude/CONTENT_LOG.md`.

**Both modes**: Log after all merges complete.

### Entry format

```markdown
## Run — [Month DD, YYYY]

**Articles created:** [N]
**Cost content:** [Yes / No]
**Mode:** [Interactive / Scheduled]

| Title | Slug | Primary Keyword | Type | PR | Commit |
|---|---|---|---|---|---|
| [Title] | `[slug].html` | [keyword] | [type] | [#N](url) | `[hash]` |

**Workflow changes:** [brief note, or "None"]
```

### Rules
- Always append — never overwrite existing entries
- If the file doesn't exist yet, create it with a `# SEO Blog Content Log` heading first
- One entry per run, even if multiple articles were created in that run
- Keep the "Workflow changes" line to one sentence; use "None" if nothing changed

---

## Phase 11 — SCHEDULED SUMMARY

**Scheduled mode only.** After Phase 10, output a final summary:

```
=== SEO Run Complete — [Date] ===

Articles created and merged: [N]
  - [Article title] → merged at [commit hash]
  - [Article title] → merged at [commit hash]
  - [Article title] → merged at [commit hash]

Screenshots captured in test/screenshots/.
No action needed — all articles are live on master.
```

---

## Rules

- Never skip a phase — each gate exists for a reason
- Never push directly to `master` (pre-push hook will block it)
- Never merge a PR with open FAIL items from `/review`
- Always show the screenshot before asking for approval — never ask "does it look good?" without showing it
- If creating multiple articles (user selected more than one topic): complete all phases for article #1 before starting article #2
- Scheduled mode never merges — stop at PRs ready
