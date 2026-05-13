# SEO Hub Page Agent

Full-cycle agent for **service hub pages** and **city landing pages**.

Workflow: research → propose → create → test → demo → iterate → PR → review → **stop for owner review**.

Follow every phase in order. Do not skip phases or combine steps.

> **Hub pages never auto-merge.** Unlike `/seo-blog`, this command always stops at "PR ready for owner review." Hub pages are evergreen, conversion-critical, and worth a human eye before going live.

---

## Invocation

```
/seo-hub --type=service --appliance=refrigerator
/seo-hub --type=city --city=irvine
```

If arguments are missing, ask the user:
- **Type**: `service` or `city`
- **Target**:
  - For `service`: which appliance? (refrigerator, washer, dryer, dishwasher, oven-stove)
  - For `city`: which city? (must be from the Primary or Secondary list in `rules/seo-content.md`)

---

## Phase 0 — RESEARCH

**Goal:** Understand what already ranks, what questions real customers ask, and what brands/neighborhoods need to appear on the page.

### Steps

1. **Read the rules first.** Open and read:
   - `rules/seo-content.md` — brand canonicalization, AI answer block template, FAQ count requirements, schema templates
   - `rules/mobile-design.md` — mobile breakpoints, hamburger, sticky CTA bar
   - `tasks/backlog.md` — confirm which hub pages are already in flight (P3 section)

2. **Confirm no duplicate.** Check `pages/` for an existing file with the target slug:
   - Service: `pages/[appliance]-repair-orange-county.html`
   - City: `pages/appliance-repair-[city-slug]-ca.html`
   - If it exists, stop and ask the user whether to overwrite or pick a different target.

3. **Competitor analysis** — run a `WebSearch`:
   - Service query: `"[appliance] repair Orange County CA"` (no quotes around the full phrase — let it match naturally)
   - City query: `"appliance repair [city] CA"`
   - For each of the top 5 organic results (skip directories like Yelp/HomeAdvisor for this pass), open the page and note:
     - Word count (rough)
     - H2 sections used
     - Schema types present (LocalBusiness, Service, FAQPage, AggregateRating?)
     - FAQ questions asked
     - Brand names mentioned
     - For city pages: neighborhoods/ZIPs mentioned
   - Identify 3 **structural gaps** the competitors collectively miss — those are angles we can own.

4. **Real questions** — run a second `WebSearch`:
   - `"[appliance] repair [city|Orange County] site:reddit.com OR people also ask"`
   - Extract 8–12 candidate FAQ questions. We'll trim later.

5. **Brand intel** (service hub only) — list which brands the top competitors prominently service. Cross-reference with our supported list in `rules/seo-content.md` (Whirlpool, GE, Samsung, LG, Sub-Zero, Wolf, Bosch, Viking, KitchenAid, Maytag, Frigidaire, Kenmore, Thermador, Miele, Dacor). Pick **6–10 brands to feature on the page**, with a short note on common issues for the top 3 (e.g., "Sub-Zero compressor sealed-system repairs", "Samsung ice-maker recall").

6. **Neighborhood / ZIP intel** (city hub only) — pull the city's neighborhoods, key ZIP codes, and 2–3 recognizable landmarks. Source these from a quick `WebSearch` like `"[city] CA neighborhoods ZIP codes"`. We need real names, not generic filler.

7. **Summarize Phase 0 findings** in 5–8 bullets before moving to PROPOSE. Include:
   - Competition level: **Low** / **Medium** / **High**
   - Average competitor word count
   - 3 structural gaps we'll exploit
   - 6–10 candidate FAQ questions
   - Brand list to feature (service hub) OR neighborhood/ZIP list (city hub)

---

## Phase 1 — PROPOSE

**Goal:** Get user alignment on the page outline *before* writing 1,000+ words.

Present a structured proposal:

```
=== Hub Page Proposal — [type] [target] ===

URL:        pages/[slug].html
Title:      [proposed <title>]
H1:         [proposed H1]
Meta desc:  [150–160 chars, draft]

AI answer block (60–110 words):
[Draft prose paragraph — plain, factual, conversion-aware]

Section outline:
  1. Hero (image + H1 + sub + CTA)
  2. AI answer block
  3. [Section 3 — service-specific OR city-specific]
  4. [Section 4]
  5. [Section 5]
  6. Brands serviced  (service hub only)
     OR Neighborhoods served  (city hub only)
  7. FAQ ([N] questions)
  8. Testimonials (4–6 from `data/testimonials.json`, pool-filtered)
  9. CTA box

Candidate FAQs ([N] proposed, will keep [target count]):
  1. [question]
  2. [question]
  ...

Brands to feature (service hub):
  [list]

Neighborhoods to feature (city hub):
  [list]

Internal links to add elsewhere:
  - homepage services grid → this page
  - footer Services column → this page
  - pages/services.html → this page
  - articles tagged [appliance] OR [city] → this page (top 3 most relevant)
```

Ask the user: _"Approve this outline, or describe changes? (e.g., 'add a section on warranty', 'drop FAQ 4', 'feature LG instead of GE')"_

Wait for approval before continuing.

---

## Phase 2 — BRANCH

```bash
git checkout master && git pull origin master
git checkout -b feat/hub-[slug]
```

Examples:
- `feat/hub-refrigerator-repair-orange-county`
- `feat/hub-appliance-repair-irvine-ca`

---

## Phase 3 — CREATE

**Goal:** Build the hub page to spec, with all required schemas and the approved outline.

### Reference template
- For service hubs: copy structure from `pages/services.html` for nav/footer, then expand the body using the proposal outline.
- For city hubs: copy from the same file. Both types share the nav/footer/style.
- Once the first hub page of each type ships, **subsequent hub pages of that type should copy from the most recent one** rather than from `services.html` — they'll have already absorbed the patterns.

### Required `<head>` (production URLs only)
```html
<title>[Approved title from Phase 1]</title>
<meta name="description" content="[Approved meta — 150–160 chars]" />
<meta name="keywords" content="[5–8 keywords]" />
<link rel="canonical" href="https://fixappliancesfast.com/pages/[slug].html" />

<!-- Open Graph -->
<meta property="og:site_name" content="Universal Appliances Repair" />
<meta property="og:title" content="[Same as <title>]" />
<meta property="og:description" content="[Same as meta description]" />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://fixappliancesfast.com/pages/[slug].html" />
<meta property="og:image" content="https://fixappliancesfast.com/[1200x630 image]" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="[Same as <title>]" />
<meta name="twitter:description" content="[Same as meta description]" />
<meta name="twitter:image" content="https://fixappliancesfast.com/[1200x630 image]" />
```

### Required schemas (inline `<script type="application/ld+json">`)
All hub pages: `LocalBusiness` + `BreadcrumbList` + `FAQPage`.

**Service hubs additionally include `Service` schema:**
```json
{
  "@context": "https://schema.org",
  "@type": "Service",
  "serviceType": "[Appliance] Repair",
  "provider": { "@type": "LocalBusiness", "name": "Universal Appliances Repair" },
  "areaServed": { "@type": "AdministrativeArea", "name": "Orange County, CA" },
  "url": "https://fixappliancesfast.com/pages/[slug].html"
}
```

**City hubs use `LocalBusiness` with `addressLocality` set to that city** (in addition to the org-wide LocalBusiness on the homepage).

If 6+ verifiable reviews exist for the page's target, also add `AggregateRating`.

Use the schema templates in `rules/seo-content.md` as the source of truth — copy them, fill in the variables, do not invent fields.

### Required content sections (in order)

1. **Hero** — full-width image, H1 (primary keyword), sub-line, primary CTA (Call) + secondary CTA (Book online)
2. **AI answer block** — plain prose, 60–110 words, names entity / services / area / phone / booking. Use the template in `rules/seo-content.md`, adapted:
   - **Service hub:** lead with the appliance ("Universal Appliances Repair Group Inc. provides [appliance] repair across Orange County…")
   - **City hub:** lead with the city ("Universal Appliances Repair Group Inc. serves [city], CA, including [neighborhoods]…")
3. **[Service hub]** Common symptoms (8+ bulleted symptoms) → **[City hub]** Neighborhoods served (list with ZIPs)
4. **Brands serviced** (service hub) OR **Services we offer** (city hub) — plain text list, not images
5. **Repair process** — 3–5 numbered steps from booking to done
6. **What this typically costs** — *only if cost content is approved for this run* (default: skip per `rules/seo-content.md`)
7. **FAQ section** — minimum count per type:
   - Service hub: **8+** FAQs
   - City hub: **5+** FAQs
   - Each Q&A becomes a `mainEntity` in FAQPage schema
8. **Testimonials** — 4–6 real reviews pulled from `data/testimonials.json`. Follow the full selection algorithm in `rules/testimonial-selection.md`:
   - Filter to `bodyStatus: "complete"` entries only
   - Prefer reviews whose `appliance` field matches the hub type (service hub); any appliance is fine for city hubs
   - Apply the ≤2-overlap rule against `tasks/testimonial-usage.md` before picking
   - Prefer reviews that mention specific brands
   - Render visible HTML cards + individual `Review` JSON-LD entries for each
   - Add `AggregateRating` JSON-LD (`ratingValue: 5.0`, `reviewCount: 76`)
   - After the hub ships, update `tasks/testimonial-usage.md` with the reviews used
   - **Never** fabricate testimonials. If the pool can't supply 4 qualifying reviews, render fewer and note the shortfall in the PR description.
9. **CTA box** — same pattern as articles: "Need [appliance] repair in [Orange County | city]? Call (949) 629-5365 or book online."

### Mobile compliance (required)
Apply `rules/mobile-design.md` in full:
- `@media (max-width: 768px)` and `@media (max-width: 480px)` blocks present
- Sticky bottom Call/Book bar enabled (hub pages use it — see the rule)
- All grids stack to 1 column on mobile
- Hero h1 scales to 28–32px on mobile
- All tap targets ≥ 44×44px

### Internal linking (required — this is the whole point of hub pages)
1. **Homepage** (`index.html`) — add a card or link in the services grid pointing to the new hub.
2. **Footer** — wire one of the dead `#` links (or add a row) for the new hub.
3. **`pages/services.html`** — add a card linking to the hub.
4. **Existing articles** — find the top 3 articles in `articles/` whose primary keyword overlaps with the new hub's target. Add **one** in-body internal link from each article to the new hub. Use natural anchor text like "our [appliance] repair service in Orange County" — never raw URLs.
5. **`sitemap.xml`** — run `npm run build:sitemap` to regenerate the full sitemap with current `lastmod` dates. Include `sitemap.xml` in the internal-links commit below.

### Commit
One commit per logical chunk:
```
git add pages/[slug].html
git commit -m "feat(hub): add [appliance|city] hub page"

git add index.html pages/services.html articles/[modified].html sitemap.xml
git commit -m "feat(hub): wire internal links to [slug]"
```

---

## Phase 4 — TEST

```bash
npm test            # link checker
npm run screenshot  # puppeteer screenshots
```

Apply the Bug Fix Workflow from `rules/git-workflow.md`. Do not proceed until both commands exit 0.

Additional checks specific to hubs:
- Run the new page through Google's [Rich Results Test](https://search.google.com/test/rich-results) (paste URL or HTML) — `Service`, `LocalBusiness`, `BreadcrumbList`, `FAQPage` should all be eligible.
- Word count check: `lynx --dump pages/[slug].html | wc -w` (or equivalent) — confirm ≥ 1,000 for service hub, ≥ 800 for city hub.
- Grep for placeholder strings: `grep -E "My Blog|Lorem|TODO|FIXME|placeholder text" pages/[slug].html` should return nothing.

---

## Phase 5 — DEMO

1. **Run `/visual-review pages/[slug].html`** to drive Playwright MCP through the new page at desktop (1440×900) and mobile (375×812) viewports. The visual review returns inline screenshots plus a structured PASS/FAIL/WARN report covering layout integrity, hamburger behavior, sticky bar visibility, hero sizing, and tap-target compliance.
2. **If `/visual-review` reports any FAIL items**, return to Phase 6 (iterate) — do not show the demo summary yet. Hub pages must pass all FAIL checks before owner review.
3. **If only WARN items are present**, list them in the demo summary so the owner can decide whether to address them before merge.
4. Show the user a one-page summary:

```
=== Hub Page Built — [slug] ===

Stats:
  Word count:        [N]
  FAQ count:         [N]
  Brands featured:   [N]   (service hub)
  Neighborhoods:     [N]   (city hub)
  Internal links in: homepage, footer, services.html, [N] articles
  Schemas:           Service, LocalBusiness, BreadcrumbList, FAQPage [+ AggregateRating if applicable]

Outstanding items for owner:
  - [any known gaps — e.g., real photos needed, schema fields to verify]
  - [if pool supplied fewer than 4 testimonials: note shortfall and which appliance types are thin in the pool]
```

5. Ask: _"Approve to move to PR, or describe changes?"_

---

## Phase 6 — ITERATE

Standard loop:
1. Make requested changes
2. Commit: `fix(hub): [short description]`
3. Return to **Phase 4 (test)** → **Phase 5 (demo)**
4. Repeat until explicit approval

---

## Phase 7 — PR

Invoke `/pr`. Title format:

`feat(hub): add [appliance|city] hub page`

Examples:
- `feat(hub): add refrigerator repair Orange County hub page`
- `feat(hub): add Irvine appliance repair hub page`

PR body must include:
- The Phase 5 stats summary
- The list of outstanding owner items (photos needed, pool shortfall if any, etc.)
- A note: **"Hub pages do not auto-merge — please review and approve before merging."**

---

## Phase 8 — REVIEW

Spawn `/review` as an **independent subagent** — a fresh Agent with no context from this implementation session. The reviewer acts as a senior engineer with 20 years of experience who was not involved in building the hub page.

- If verdict is **`✅ APPROVED`**: proceed to Phase 9.
- If verdict is **`🚫 CHANGES REQUIRED`**: fix every blocker, commit separately, re-spawn `/review` as a new independent subagent. Repeat until `✅ APPROVED`.

---

## Phase 9 — STOP

**This is where the workflow ends.** Do **not** invoke `gh pr merge`.

Output to user:

```
=== Hub Page Ready for Owner Review ===

PR:         [URL]
Branch:     feat/hub-[slug]
Outstanding items:
  - [from Phase 5]

The PR is open and tests are green. Hub pages do not auto-merge —
please review the page and merge from GitHub when you're ready.
```

---

## Phase 10 — LOG

Append an entry to `.claude/logs/HUB_LOG.md` (create the file if it doesn't exist).

### Git workflow for the log commit
Branch first, then commit. Never commit on master.

```bash
git checkout master && git pull origin master
git checkout -b chore/hub-log-[slug]
# edit .claude/logs/HUB_LOG.md
git add .claude/logs/HUB_LOG.md
git commit -m "chore(logs): record hub page [slug] in HUB_LOG"
git push -u origin chore/hub-log-[slug]
gh pr create --title "chore(logs): record hub page [slug]" --body "Logs the hub page build."
gh pr merge [N] --squash
git checkout master && git pull origin master
```

### Entry format

```markdown
## [Month DD, YYYY] — [type] hub: [slug]

**Type:** [service | city]
**Target:** [appliance | city]
**PR:** [#N](url) — open, awaiting owner review
**Word count:** [N]
**FAQ count:** [N]
**Internal links wired:** homepage, footer, services.html, [N] articles
**Schemas:** Service / LocalBusiness / BreadcrumbList / FAQPage [+ AggregateRating if applicable]

**Outstanding for owner:**
- [bulleted list of any gaps — e.g., photos needed, pool shortfall]

**Phase 0 highlights:**
- Competition: [Low/Medium/High]
- Structural gaps exploited: [1-line summary]
```

---

## Rules

- Never skip a phase
- Never push directly to `master` (pre-push hook will block it)
- Never auto-merge a hub PR — always stop at Phase 9
- Never fabricate testimonials, ratings, or licenses — pull from `data/testimonials.json` (74 complete-body reviews available); if the pool has no suitable match, leave the section short and call it out in the PR description
- Never write "Fix Appliances Fast" as a brand name (it's a URL only — see `rules/seo-content.md`)
- Always include the AI answer block — it's the highest-leverage section for AI-engine recommendations
- One hub page per PR. If the user wants 5 hub pages, run the workflow 5 times sequentially
- Always wire the internal links in Phase 3 — a hub page that nothing links to is useless
- Always run `/visual-review` in Phase 5 — single screenshots miss mobile-specific issues (hamburger, sticky bar, tap targets) that hub pages rely on
- No path through this workflow may emit a placeholder testimonial — `data/testimonials.json` has 74 complete reviews; use them. Success criterion: grep for `TODO` in the output HTML returns zero matches.
