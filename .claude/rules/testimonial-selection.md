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
   - Service hub: 3 reviews (prefer appliance-matched) — one clean row in the 3-col grid
   - City hub: 4–6 reviews (any appliance) — see Visual layout rules below
   - Testimonials page: all complete-body reviews

6. **Apply the quality floor.** Each displayed testimonial body must be **≥25 words**. A 4–7 word review (e.g., "AG was awesome!") is worse than no review at all — Google can flag thin `Review` schema as a low-quality signal, and visually it shrinks the card next to longer ones. Photo-only and short-body reviews stay in the pool as image sources but are never displayed as quoted testimonials.

## Visual layout rules (3-column grid)

The testimonial section on hub pages uses a 3-column CSS grid. Counts that aren't multiples of 3 leave orphan card(s) on the last row, and orphans default to left-align — which looks broken. Apply these rules:

### Orphan centering
- **3 reviews:** clean single row, no centering needed.
- **4 reviews:** the 4th card must center horizontally on the second row, not left-align.
- **5 reviews:** the 4th and 5th cards must center as a pair on the second row, not left-align.
- **6 reviews:** clean 2×3 grid, no centering needed.

CSS pattern using `:has()` (universally supported):

```css
/* 4 reviews: center the orphan */
.testimonials-grid:has(.testimonial-card:nth-child(4):last-child) .testimonial-card:nth-child(4) {
  grid-column: 2;
}
/* 5 reviews: shift the second row right by half a column to center the pair */
.testimonials-grid:has(.testimonial-card:nth-child(5):last-child) .testimonial-card:nth-child(4) {
  grid-column: 1 / 3;
  justify-self: end;
}
.testimonials-grid:has(.testimonial-card:nth-child(5):last-child) .testimonial-card:nth-child(5) {
  grid-column: 2 / 4;
  justify-self: start;
}
```

### Prefer counts of 3, 4, or 6 over 5
Five reviews has the messiest layout (a row of three followed by an off-balance row of two). Pick 5 only when the candidate pool genuinely yields 5 strong-and-similar reviews **and not a 6th**. Default order of preference: **6 ≈ 4 > 3 > 5**.

### Row word-count balance
Reviews placed in the same row must be similar in length. A 25-word review next to a 50-word review on the same row makes the shorter card look thin and reads as low-quality.

When picking N reviews, sort the candidate pool by word count and group:
- Row 1 (cards 1–3): the 3 reviews closest in length.
- Row 2 (cards 4–6): the next group, also matched in length within the row.

Acceptable spread within a row: roughly 1.5× (e.g., 25-word and 40-word OK; 25-word and 60-word not OK). If the candidate pool can't supply a balanced group, drop the count to the next preferred number (6 → 4 → 3) rather than render a mismatched row.

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
2. If still short, drop to a 3-card layout rather than render an unbalanced row.
3. If still short of 3, leave the section with fewer reviews rather than fabricating names or using photo-only records.
4. Call out the shortfall in the PR description.

**An empty or short testimonials section is always better than a fake quote or a thin one.**
