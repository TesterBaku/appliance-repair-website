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
   - Service hub: 3 reviews (prefer appliance-matched) — one clean row in the 3-col grid. Existing hubs built with 4–6 reviews are grandfathered; apply the 3-card rule to new hubs and to any hub being substantially edited.
   - City hub: 4–6 reviews (any appliance) — see Visual layout rules below
   - Testimonials page: all complete-body reviews

6. **Apply the quality floor.** A review is displayable as a quoted testimonial if it satisfies one of the following. Otherwise it stays in the pool as an image source only.

   a. **Photo + body ≥3 words** — the photo carries the specificity, so the body can be brief.

   b. **No photo + body ≥8 words** — without a photo the body has to do the credibility work alone. The pool's median body is 14 words; 8 admits genre-normal short praise (e.g., "Friendly, on time, efficient, and successful repair.") while excluding pure single-thought reviews ("AG was awesome!").

   c. **No photo + body <8 words + names a specific appliance or brand** — short reviews that explicitly identify what was repaired carry SEO and trust value even when terse. "Appliance" means one of: refrigerator, fridge, washer, washing machine, dryer, dishwasher, oven, stove, range, cooktop, microwave, freezer, garbage disposal, wine cooler. "Brand" means one of: Whirlpool, GE, Samsung, LG, Sub-Zero, Wolf, Bosch, Viking, KitchenAid, Maytag, Frigidaire, Kenmore, Thermador, Miele, Dacor. Generic phrases like "my appliance" or "the unit" do not qualify.

   Photo-only (`bodyStatus: "photo-only"`) and no-body (`bodyStatus: "no-body"`) records are never displayable as quoted testimonials regardless of any other property; their photos may be used as imagery.

## Visual layout rules (3-column grid)

The testimonial section on hub pages uses a 3-column CSS grid. Counts that aren't multiples of 3 leave orphan card(s) on the last row, and orphans default to left-align — which looks broken. Apply these rules:

### Orphan centering
- **3 reviews:** clean single row, no centering needed.
- **4 reviews:** the 4th card must center horizontally on the second row, not left-align.
- **5 reviews:** the 4th and 5th cards must center as a pair on the second row, not left-align.
- **6 reviews:** clean 2×3 grid, no centering needed.

CSS pattern using `:has()` (Chrome 105+, Firefox 121+, Safari 15.4+ — fallback is orphan left-aligned, which is acceptable):

```css
/* 4 reviews: center the orphan in column 2 */
.testimonials-grid:has(.testimonial-card:nth-child(4):last-child) .testimonial-card:nth-child(4) {
  grid-column: 2;
}
/* 5 reviews: widen to a 4-track grid and place the pair in tracks 2 and 3 */
.testimonials-grid:has(.testimonial-card:nth-child(5):last-child) {
  grid-template-columns: 1fr 2fr 2fr 1fr;
}
.testimonials-grid:has(.testimonial-card:nth-child(5):last-child) .testimonial-card:nth-child(4) {
  grid-column: 2;
}
.testimonials-grid:has(.testimonial-card:nth-child(5):last-child) .testimonial-card:nth-child(5) {
  grid-column: 3;
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
- Location label depends on the record's `source` field. **Google records (`source: "google"`):** Google does not expose reviewer city, so use `"Orange County, CA"` unless the reviewer's review text explicitly names an OC city, in which case use that city. **Yelp records (`source: "yelp"`):** Yelp displays the reviewer's city directly — use the Yelp-displayed city verbatim (e.g., `"Dana Point, CA"`, `"Anaheim, CA"`).
- Star rating: always render 5 stars (all 76 pool reviews are verified 5-star Google reviews).
- Light typo/grammar editing is allowed for reviews flagged `bodyHasTypos: true`. No paraphrasing or substantive rewording.
- For Yelp records with a `previousBody` field, display only `body` (the current version). `previousBody` is reference-only.

## Schema requirements

Every page that displays testimonials must also include:

- **`AggregateRating`** in JSON-LD: `ratingValue: 5.0`, `reviewCount: 76`, `bestRating: 5`.
- **Individual `Review` JSON-LD entries** for each displayed testimonial, with `author.name` matching the pool's `name` field exactly.

## Tracking usage

After adding testimonials to any hub page, update `tasks/testimonial-usage.md` — add a row for each review used and check the hub column. This is how the ≤2-overlap rule is enforced across PRs.

## If the pool cannot supply enough reviews

If, after filtering by appliance, fewer than 3 complete-body reviews are available:
1. Relax the appliance filter and pick any unmatched reviews from the pool.
2. If still short of 3, use however many the pool supplies rather than fabricating names or using photo-only records.
3. Call out the shortfall in the PR description.

**An empty or short testimonials section is always better than a fake quote or a thin one.**
