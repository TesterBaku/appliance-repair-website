# Active Todo — 2026-05-07 audit refresh

Source: two external audit reports analyzed in chat session 2026-05-07. Refined plan in `tasks/action-plan-fixappliancesfast.md` § "2026-05-07 audit refresh".

The previous GSC remediation todo (May 6) shipped via PRs #181–#184 and is now done — its content moved to git history.

**Pacing reminder.** Hub pages: max 1–2/week. Article retrofits: max 2–3/week. No same-day batch merges. See action plan § "Pacing guardrails" for the full set.

---

## P0 — Foundation (this week)

### P0-1 PR-A: Rule update — allow estimated price ranges in cost content
Single-file edit to `.claude/rules/seo-content.md`. Replaces blanket "no dollar amounts" rule with a carve-out + disclaimer template.

- [ ] Branch off `master`: `chore/rule-allow-cost-ranges`
- [ ] Edit `.claude/rules/seo-content.md` § "Writing rules" — replace the no-prices line with the new policy + disclaimer template (see PR draft below)
- [ ] Run `npm test` and `npm run screenshot` (smoke-only — rule files don't affect the site, but the workflow requires it)
- [ ] Commit: `chore(rules): allow estimated price ranges in cost content with required disclaimer`
- [ ] Push, open PR via `/pr`
- [ ] Run `/review` as an **independent subagent** (per `rules/git-workflow.md` § "PR on Every Change")
- [ ] Address blockers, re-run `/review` until `✅ APPROVED`
- [ ] Merge

### P0-2 PR-B: Verification audit — single subagent pass
Confirm the action plan's "snapshot" claims are still true on production.

- [ ] Spawn an independent subagent with this scope: verify AggregateRating renders on homepage + all hub pages, verify `/llms.txt` returns 200, verify GA tag is first child of `<head>` on every HTML page, sweep About page for any stale personas
- [ ] Save report to `tasks/seo-verification-2026-05-07.md`
- [ ] If gaps found: each gap becomes its own follow-up PR (one fix per PR — no batching)

### P0-3 PR-C: Update `tasks/lessons.md` with mount-wipe pattern
The accidental working-tree wipe has now happened twice (May 6, May 7). Capture the pattern + recovery steps so future runs don't burn cycles re-diagnosing.

- [ ] Add lesson to `tasks/lessons.md`
- [ ] Consider hardening `.husky/pre-commit` to refuse a commit that deletes ≥ 1,000 lines across ≥ 5 unstaged files — would catch this before it could even be staged
- [ ] Ship as part of the same docs PR that lands the action-plan refresh + this todo

---

## P1 — Cost hub (next 1–2 weeks, after P0-1 lands)

### P1-1 Build `pages/appliance-repair-cost-orange-county.html`
The cornerstone for cost-keyword traffic. Only start after P0-1 (rule update) is merged.

- [ ] Run `/seo-hub --type=service --slug=appliance-repair-cost-orange-county` (or scaffold manually if the skill doesn't fit)
- [ ] Required sections: hero + AI answer block, average cost in OC, cost-by-appliance table, cost-by-symptom table, diagnostic-fee explanation, repair-vs-replace guidance, brand/part availability notes, 8+ FAQs, real testimonials, CTA
- [ ] Schema: Service + FAQPage + BreadcrumbList + AggregateRating + LocalBusiness
- [ ] Cross-link from homepage and all 5 service hubs (1 link each — light touch, not a sitewide rebuild)
- [ ] `npm test`, `npm run screenshot`, `/visual-review` desktop + mobile
- [ ] PR title: `feat(hub): add appliance-repair-cost-orange-county cornerstone hub`
- [ ] `/review` as independent subagent
- [ ] **Manual review** — hub pages never auto-merge per existing rule
- [ ] After merge: update `sitemap.xml`, `llms.txt`, `logs/HUB_LOG.md`

---

## P2 — Selective price retrofits (next 4 weeks, paced)

### P2-1 Identify retrofit candidates from GSC
Pull the top 5 cost-relevant articles by impressions from Google Search Console.

- [ ] Articles already cost-themed by slug: `article-dishwasher-cost-orange-county.html`, `article-dryer-repair-cost-orange-county.html`, `article-freezer-cost-rancho-santa-margarita.html` — likely top of the list
- [ ] Save chosen list to `tasks/retrofit-candidates-2026-05.md`

### P2-2 Retrofit price ranges + disclaimer — one article per week
- [ ] Week 1: highest-traffic candidate
- [ ] Week 2: next
- [ ] Week 3: next
- [ ] Week 4: next
- [ ] Each as its own PR. Mixed in with regular `/seo-blog` publishing, never as a batch update

---

## P3+ — Long-term items

Tracked in the action plan, not duplicated here. Don't start L-1, L-2, L-3, L-4 until S-1 through S-4 are done **and** GSC data is available. See `tasks/action-plan-fixappliancesfast.md` § "LONG TERM".

---

## Out of scope (operational / business decisions)

Documented in the action plan § "OUT OF SCOPE for website work". Don't add website-side work for these until they're green-lit operationally.

---

## PR-A draft — exact rule change for P0-1

The current rule in `.claude/rules/seo-content.md` § "Writing rules" reads:

> - No dollar amounts or price ranges (unless cost content is explicitly approved for the run)

Proposed replacement:

> - **Estimated price ranges are allowed in cost-focused content** (cost hub pages, repair-cost articles, repair-vs-replace guides). Use *ranges* (e.g. "$150–$650"), never flat rates (e.g. "$280"). Prices are estimates, not quotes.
> - Every page or section that displays prices **must include this disclaimer verbatim** somewhere on the page (above the table is preferred):
>
>   > *Estimates vary by brand, part availability, and diagnosis. Final quote is provided before repair.*
>
> - Non-cost articles (DIY guides, symptom guides, maintenance guides) should still avoid prices unless cost is integral to the topic — keep dollars where readers expect them.
> - `/review` flags as **FAIL**: any flat rate; any cost section missing the disclaimer; any non-cost article with prices but no clear cost-content angle.

---

## Review (fill in after P0-1 ships)

- _Date merged:_
- _PR number:_
- _Followed by:_ (P0-2, P0-3, P1-1)
