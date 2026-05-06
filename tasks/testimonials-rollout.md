# Testimonials Rollout — retrofit existing pages with the canonical 76-review pool

## Context

`data/testimonials.json` is now the single source of truth for testimonials. It contains 76 verified 5-star Google reviews. 74 have complete bodies; 2 are flagged `bodyStatus: "photo-only"` / `"no-body"` and may be used for image display only, never as quoted testimonials.

The `rules/seo-content.md` Trust Signals section now codifies how testimonials must be selected and displayed. Read it before starting any task in this plan.

This plan retrofits every existing page that currently displays testimonials so it pulls from the pool, applies the reuse rules, and hits the new schema requirements.

## Standing rules — non-negotiable

1. **Zero placeholder testimonials.** Never invent reviewer names. If the pool can't supply a matching review for a section, leave the section EMPTY and call it out in the PR description. An empty testimonials section is always better than a fake quote.
2. **PR on every change.** Per `rules/git-workflow.md`. Each numbered task below = one branch + one PR.
3. **`/review` runs as an independent subagent** before merging any PR — spawn a fresh Agent. The reviewer must not be the agent that wrote the code.
4. **Tests are gates.** `npm test` and `npm run screenshot` must both exit 0 before opening a PR.
5. **No two hub pages share more than 2 testimonials with each other.** Track usage as you go.

## Pages currently in scope

**Pages with testimonials today** (confirmed by grep):
- `index.html` — 8 testimonials currently (Jovita Osorio, Noelle B, Jennifer Trette, Marcy Kucik, Wendy Henderson, Cindy Montefu, Russell Kadota, Robert Clemmons — all already real)
- `pages/about.html` — has testimonial markup, audit before changing
- `pages/refrigerator-repair-orange-county.html` — service hub
- `pages/testimonials.html` — dedicated page, currently advertises 76 reviews in meta but only renders 3

**Hub pages that need testimonials added or refreshed:**
- 8 city hubs: `pages/appliance-repair-{anaheim,santa-ana,irvine,huntington-beach,garden-grove,fullerton,orange,costa-mesa}-ca.html`
- 5 service hubs: `pages/{refrigerator,washer,dryer,dishwasher,oven-stove}-repair-orange-county.html`

---

## Phase 0 — Audit (1 PR)

### Task 0.1 — Audit every page for placeholder/invented testimonials
Goal: confirm zero placeholders remain anywhere on the site before we start adding the new pool.

- [ ] For each page in scope above, extract every reviewer name and quote currently displayed
- [ ] Cross-check each name against `data/testimonials.json` (the `name` field)
- [ ] Flag any name not found in the pool as a placeholder candidate
- [ ] Also check schema (`<script type="application/ld+json">` blocks) for `Review.author.name` values that aren't in the pool
- [ ] Output the audit report to `tasks/testimonial-audit-2026-05-06.md`
- [ ] If any placeholders found: remove them in this PR (do not replace yet — that's Phase 1+)

**PR title:** `chore(testimonials): audit existing pages and remove any remaining placeholders`
**Files affected:** any page with placeholders found, plus `tasks/testimonial-audit-2026-05-06.md` (new)
**Tests:** `npm test`, `npm run screenshot`
**Success criteria:** zero invented testimonials anywhere on the site; audit doc committed

### Task 0.2 — Sync the `/seo-hub` slash command with the canonical pool
The interactive `/seo-hub` skill at `.claude/commands/seo-hub.md` currently has its own logic for building a new hub page's testimonial section. With `data/testimonials.json` now the source of truth, the slash command's instructions need to match what the scheduled task does. Goal: any interactive run of `/seo-hub` produces a hub identical in structure to one built by the cron.

- [ ] Read the current `/seo-hub` prompt at `.claude/commands/seo-hub.md`
- [ ] Locate the testimonials section of the workflow (likely Phase 3 or 4 in the existing skill)
- [ ] Replace any "leave a placeholder block" or "ask Rufat for testimonials" language with: read `data/testimonials.json`, filter `bodyStatus: "complete"`, prefer matching appliance, apply ≤2-overlap rule against existing hub pages, render visible HTML + `Review`/`AggregateRating` schema
- [ ] Update the success criteria / checklist at the end of the skill to include "no placeholder testimonials in output"
- [ ] Optional: extract the testimonial-selection logic into a small helper doc (e.g., `.claude/rules/testimonial-selection.md`) that both `/seo-hub` and the scheduled task can reference, to keep them in sync

**PR title:** `chore(seo-hub): wire skill to canonical testimonial pool, drop placeholder fallback`
**Files affected:** `.claude/commands/seo-hub.md`, optionally `.claude/rules/testimonial-selection.md` (new)
**Tests:** `npm test` (no HTML touched, but run anyway), manual: dry-run the skill mentally against one already-built hub to confirm output would match
**Success criteria:** `/seo-hub` and the `city-hub-publication-tue-thu` scheduled task produce structurally identical testimonial sections; no path through `/seo-hub` can emit a placeholder

---

## Phase 1 — Homepage (1 PR)

### Task 1.1 — Refresh homepage testimonials and AggregateRating
Goal: homepage shows 8–12 testimonials (more than hub pages — homepage is high-traffic and benefits from social proof density), all real, with `AggregateRating` schema reflecting the full 76-review pool.

- [ ] Pick 8–12 testimonials from `data/testimonials.json` filtered to `bodyStatus: "complete"`
- [ ] Mix appliances (refrigerator, washer, dryer, dishwasher, oven, microwave, freezer) so every category is represented
- [ ] Prefer reviews that mention specific brands (Thermador, Sub-Zero, GE Monogram, LG, Samsung, Viking, Whirlpool, Frigidaire) — they signal range to readers
- [ ] Use reviewer profile photos from `images/real/reviewer-profiles/` where available; styled initial avatar otherwise
- [ ] Apply `bodyHasTypos: true` light-edit rule for display only
- [ ] Update `AggregateRating` in homepage JSON-LD: `reviewCount: 76`, `ratingValue: 5.0`
- [ ] Add individual `Review` JSON-LD entries for each displayed testimonial

**PR title:** `feat(homepage): refresh testimonials from canonical pool, update AggregateRating to 76`
**Files affected:** `index.html`
**Tests:** `npm test`, `npm run screenshot`, manual visual at 375px

---

## Phase 2 — City hubs (8 PRs, one per hub)

For each city hub, pick 4–6 testimonials. Track usage across hubs in a small markdown table to enforce the ≤2-overlap rule.

Suggested workflow per task: open a fresh checklist of unused/lightly-used reviews from the pool, pick 4–6 that match, commit the page change + record the usage in `tasks/testimonial-usage.md`.

### Task 2.1 — `pages/appliance-repair-anaheim-ca.html`
- [ ] Pick 4–6 testimonials (mix appliances; prefer high-rev-count brands)
- [ ] Update visible HTML and schema
- [ ] Add `AggregateRating` if missing

**PR title:** `feat(hub-anaheim): wire testimonials from canonical pool`

### Task 2.2 — `pages/appliance-repair-santa-ana-ca.html`
Same shape as 2.1.
**PR title:** `feat(hub-santa-ana): wire testimonials from canonical pool`

### Task 2.3 — `pages/appliance-repair-irvine-ca.html`
Same shape.
**PR title:** `feat(hub-irvine): wire testimonials from canonical pool`

### Task 2.4 — `pages/appliance-repair-huntington-beach-ca.html`
Same shape.
**PR title:** `feat(hub-huntington-beach): wire testimonials from canonical pool`

### Task 2.5 — `pages/appliance-repair-garden-grove-ca.html`
Same shape.
**PR title:** `feat(hub-garden-grove): wire testimonials from canonical pool`

### Task 2.6 — `pages/appliance-repair-fullerton-ca.html`
Same shape.
**PR title:** `feat(hub-fullerton): wire testimonials from canonical pool`

### Task 2.7 — `pages/appliance-repair-orange-ca.html`
Same shape — note: this hub had its placeholders removed today (commit 8c7e449), so it likely currently has no testimonials.
**PR title:** `feat(hub-orange): wire testimonials from canonical pool`

### Task 2.8 — `pages/appliance-repair-costa-mesa-ca.html`
Same shape.
**PR title:** `feat(hub-costa-mesa): wire testimonials from canonical pool`

---

## Phase 3 — Service hubs (5 PRs, one per hub)

Service hubs should prefer testimonials that match their appliance.

### Task 3.1 — `pages/refrigerator-repair-orange-county.html`
- [ ] Filter pool: `appliance` contains "refrigerator" — 8 candidates: Lale, Marcy Kucik, William Nugent, Brian Brassil, Lilya Raupova (Sub-Zero), Arzuman Qarayev (Frigidaire), Laman Anvarli (GE Monogram), Joellyn Meadows
- [ ] Plus Molla Islam (refrigerator + cooktop) and Dave Brisbin (refrigerator/freezer)
- [ ] Pick 4–6, prefer brand-specific reviews; include AggregateRating

**PR title:** `feat(hub-refrigerator): wire testimonials from canonical pool`

### Task 3.2 — `pages/washer-repair-orange-county.html`
- [ ] Filter pool: `appliance` contains "washer" — 13 candidates including Danette Vanover, Russell Kadota, Justine Shaw, Tony Tomassini, Kelly Heyden, Craig Tudor, Patricio Jr Villanueva (LG), rick deangelo, mark rivera (Whirlpool), Greg Schnabel, Veronique Reaver, Stephen Stephen, Susie Arii, George
- [ ] Pick 4–6 prioritizing variety of issues (leak, drain, spinning) and brand mentions

**PR title:** `feat(hub-washer): wire testimonials from canonical pool`

### Task 3.3 — `pages/dryer-repair-orange-county.html`
- [ ] Filter pool: `appliance` contains "dryer" — 10 candidates: Jennifer Trette, Cindy Montefu, Katie Anne Salen, Julie L., Ernesto Ruiz, Matt Snyder, Stephen Stephen, Susie Arii, Dena Fisher, cheryl lemire
- [ ] Pick 4–6

**PR title:** `feat(hub-dryer): wire testimonials from canonical pool`

### Task 3.4 — `pages/dishwasher-repair-orange-county.html`
- [ ] Filter pool: `appliance` contains "dishwasher" — 8 candidates: Noelle B (Thermador), Robert Clemmons, Tony Tomassini, Katie Holst, Jonathan Stone, Karen Myhra, George
- [ ] Pick 4–6 — Thermador is a strong pull for high-end customer signal

**PR title:** `feat(hub-dishwasher): wire testimonials from canonical pool`

### Task 3.5 — `pages/oven-stove-repair-orange-county.html`
- [ ] Filter pool: `appliance` contains oven/range/cooktop/stove — 8 candidates: Steve D (cooktop, long-form), Jeff Lane Songs, Susan Ryan (oven igniter), Roger Antonie, Kenan Ken (Viking), George Mendoza (Samsung range), Theresa Robinson (photo-only — exclude), Elizabeth Lovejoy (cooktop), Molla Islam (cooktop+fridge)
- [ ] Pick 4–6 — Steve D's review is a strong long-form quote for this hub

**PR title:** `feat(hub-oven-stove): wire testimonials from canonical pool`

---

## Phase 4 — Testimonials standalone page (1 PR)

### Task 4.1 — Refresh `pages/testimonials.html`
Currently advertises 76 reviews in meta but renders 3. Goal: render the full pool.

- [ ] Render all 74 reviews with complete bodies as cards (`bodyStatus: "complete"`)
- [ ] Group / filter by appliance type (refrigerator, washer, dryer, etc.) — UI affordance for visitors
- [ ] Include all 74 in JSON-LD `Review` schema (in addition to existing `AggregateRating`)
- [ ] The 2 photo-only / no-body records may be used as image-only entries below the quoted reviews, clearly separated
- [ ] Handle `bodyHasTypos: true` reviews with light edits
- [ ] Verify mobile layout — long page, must remain performant

**PR title:** `feat(testimonials-page): render full canonical pool of 76 reviews`
**Files affected:** `pages/testimonials.html`
**Tests:** `npm test`, `npm run screenshot`, manual mobile + desktop viewport

---

## Phase 5 — About page audit (1 PR)

### Task 5.1 — `pages/about.html`
The grep found testimonial markup on this page. Audit and either:
- (a) Remove testimonial section if it's redundant with homepage / testimonials page
- (b) Replace with 2–3 reviews from the pool that emphasize trust/longevity themes (e.g., Steve D's long-form, Kathy Calderon's "special trip on Saturday" story, Suzan Hier's "second time using their services")

**PR title:** `feat(about): rationalize testimonials section against canonical pool`

---

## Phase 6 — Documentation & logs (1 PR)

### Task 6.1 — Record the rollout
- [ ] Append a new entry to `.claude/logs/HUB_LOG.md` summarizing this rollout — listing each page updated, the testimonials assigned, and the PRs that delivered the work
- [ ] Update `tasks/action-plan-fixappliancesfast.md` if any open items relate (e.g., AggregateRating requirement, AI answer block, hub-page testimonials)
- [ ] Save the testimonial-usage tracking table to `tasks/testimonial-usage.md` so future hub PRs can keep applying the ≤2-overlap rule

**PR title:** `chore(docs): record testimonials rollout in HUB_LOG and usage tracker`

---

## Tracking the ≤2-overlap rule

Maintain `tasks/testimonial-usage.md` as a matrix during Phases 1–3. Suggested format:

```
| Review ID | Homepage | Anaheim | Santa Ana | Irvine | HB | GG | Fullerton | Orange | Costa Mesa | Refrig | Washer | Dryer | Dishw | Oven |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| google-jovita-osorio-2026-04 | ✓ |   |   |   |   |   |   |   |   |   |   |   |   |   |
| google-noelle-b-2026-03      | ✓ |   |   |   |   |   |   |   | ✓ |   |   |   | ✓ |   |
...
```

Before adding a review to a hub, run a quick consistency check: count how many other hubs already use it. If ≥2, pick a different one.

---

## Applianc