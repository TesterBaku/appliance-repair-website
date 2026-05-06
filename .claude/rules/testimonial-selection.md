# Testimonial Selection Rules

Single source of truth for picking testimonials from the canonical pool. Apply these rules in `/seo-hub`, the scheduled city-hub routine, and any other workflow that renders testimonials.

## Source of truth

All testimonials come from `data/testimonials.json`. Never invent reviewer names, quotes, or ratings.

## Filtering steps (in order)

1. **Exclude non-body records.** Keep only entries where `bodyStatus: "complete"`. Records with `bodyStatus: "photo-only"` or `"no-body"` may be used as image sources but never as quoted testimonials.

2. **Prefer appliance match.** For a service hub, filter for entries whose `appliance` field contains the hub's appliance type (e.g., `"washer"` for the washer hub). For a city hub, any appliance is fine.

3. **Apply the ≤2-overlap rule.** Before adding a review to a hub page, check `tasks/testimonial-usage.md` for how many other hub pages already use that review. If the count is already 2, pick a different review.

4. **Prefer brand variety.** If multiple reviews are eligible, prefer those that mention a specific brand (e.g., "Sub-Zero", "LG", "Samsung") — they signal range to readers and LLMs.

5. **Pick the target count:**
   - Homepage: 8–12 reviews
   - Service hub: 4–6 reviews (prefer appliance-matched)
   - City hub: 4–6 reviews (any appliance)
   - Testimonials page: all 74 complete-body reviews

## Display rules

- Show reviewer name exactly as it appears in the pool's `name` field. Last-initial abbreviations (e.g., "Jennifer T." for "Jennifer Trette") are acceptable if the page already uses that style — otherwise use the full name.
- Location label: use `"Orange County, CA"` unless the reviewer's review text explicitly names an OC city, in which case use that city.
- Star rating: always render 5 stars (all 76 pool reviews are verified 5-star Google reviews).
- Light typo/grammar editing is allowed for reviews flagged `bodyHasTypos: true`. No paraphrasing or substantive rewording.

## Schema requirements

Every page that displays testimonials must also include:

- **`AggregateRating`** in JSON-LD: `ratingValue: 5.0`, `reviewCount: 76`, `bestRating: 5`.
- **Individual `Review` JSON-LD entries** for each displayed testimonial, with `author.name` matching the pool's `name` field exactly.

## Tracking usage

After adding testimonials to any hub page, update `tasks/testimonial-usage.md` — add a row for each review used and check the hub column. This is how the ≤2-overlap rule is enforced across PRs.

## If the pool cannot supply enough reviews

If, after filtering by appliance, fewer than 4 complete-body reviews are available:
1. First, relax the appliance filter and pick any unmatched reviews from the pool.
2. If still short, leave the section with fewer reviews rather than fabricating names or using photo-only records.
3. Call out the shortfall in the PR description.

**An empty or short testimonials section is always better than a fake quote.**
