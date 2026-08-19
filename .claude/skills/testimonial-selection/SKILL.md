---
name: testimonial-selection
description: Use whenever testimonial or review content is being added, edited, chosen, reordered, removed, or audited on any page, including the homepage and pages/testimonials.html. Covers building a testimonials section from scratch, checking whether existing cards are still correct (reviewer name, quote wording, star rating, location label, hub-reuse count, or schema), and fixing a typo in a review body. Applies even if the request only says something like "add a review card", "check the location label on this hub", "how many hubs already use this review", "swap out this review", or "fix this typo in the testimonial" and never mentions testimonial rules by name. Not for authoring new review text (bodies are always copied verbatim from data/testimonials.json).
---

**When NOT to use this skill:** this skill never authors new review text; review bodies are
always copied verbatim from `data/testimonials.json`. For drafting a request asking a customer
for a review, see `gbp-platform-policy` instead (soliciting reviews has platform-specific rules,
sharpest on Yelp).

# Testimonial Selection Rules

Single source of truth for picking testimonials from the canonical pool. Apply these rules in `/seo-hub`, the scheduled city-hub routine, and any other workflow that renders testimonials.

## Source of truth

All testimonials come from `data/testimonials.json`. Never invent reviewer names, quotes, or ratings.

**Both Google and Yelp reviews are eligible as quoted hub testimonials** (decided 2026-06-10). A `source: "yelp"` record may be displayed as a quoted testimonial on a hub page on the same footing as a Google record, subject to the identical quality floor, layout, and ≤2-hubs rules below. Yelp reviews count toward the ≤2-hubs limit like any other review. The only Yelp-specific handling is in the display + schema rules (location label uses the Yelp-displayed city; Yelp `Review` JSON-LD is included but Yelp is **never** folded into `AggregateRating` — see "Schema requirements"). This supersedes the older framing that treated Yelp solely as a separate visual element.

## Filtering steps (in order)

1. **Exclude non-body records.** Keep only entries where `bodyStatus: "complete"`. Records with `bodyStatus: "photo-only"` or `"no-body"` may be used as image sources but never as quoted testimonials. Also exclude records where `rating < 5` — non-5-star reviews are captured for accurate cross-source rating math and complete record-keeping, but are never displayed as quoted testimonials.

2. **Prefer appliance match.** For a service hub, filter for entries whose `appliance` field contains the hub's appliance type (e.g., `"washer"` for the washer hub). For a city hub, any appliance is fine.

3. **Apply the ≤2-hubs rule.** **A review may appear on at most 2 hubs.** A "hub" is a city hub (`pages/appliance-repair-*-ca.html`) or a service/brand/cost hub (`pages/*-orange-county.html`). The **homepage** (`index.html`) and the **testimonials page** (`pages/testimonials.html`) are NOT hubs and do NOT count toward the limit — a review may appear on both of them and still have its full 2 hub slots free. Before adding a review to a hub page, check `tasks/testimonial-usage.md` for how many hubs already use that review; if it is already on 2 hubs, pick a different review. (Four reviews — Molla Islam, Joellyn Meadows, Lilya Raupova, Katie Anne Salen — predate this rule and sit on 3 hubs each; they are grandfathered exceptions, documented in `tasks/testimonial-usage.md`, and must not be moved. The ≤2-hubs rule applies to every other review going forward.)

4. **Prefer brand variety.** If multiple reviews are eligible, prefer those that mention a specific brand (e.g., "Sub-Zero", "LG", "Samsung") — they signal range to readers and LLMs.

5. **Pick the target count:**
   - Homepage: 8–12 reviews
   - Service hub: 3 reviews (prefer appliance-matched) — one clean row in the 3-col grid. Existing hubs built with 4–6 reviews are grandfathered; apply the 3-card rule to new hubs and to any hub being substantially edited.
   - City hub: 3 reviews (any appliance) — one clean row in the 3-col grid. Existing hubs built with 4–6 reviews are grandfathered; apply the 3-card rule to new hubs and to any hub being substantially edited.
   - Testimonials page: all complete-body reviews

6. **Apply the quality floor.** A review is displayable as a quoted testimonial if it satisfies one of the following. Otherwise it stays in the pool as an image source only.

   a. **Photo + body ≥2 words** — the photo carries the specificity, so the body can be brief.
      (Lowered from ≥3 to ≥2 by owner decision, 2026-08-12, prompted by a 5-star review whose body
      was "Excellent service." and whose photo was a clear shot of the serviced appliance. The
      threshold's job is to keep a card from being nothing but a bare interjection when there is no
      photo doing the work; where a photo IS doing the work, 2 words versus 3 was an arbitrary line
      that would have discarded a usable review. Blast radius was checked before the change: across
      the 112-record pool, this reclassified exactly one review, because no other sub-floor
      complete-body record carries a photo. Photo-only and no-body records are still never quotable,
      per the closing paragraph of this section.)

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
/* 5 reviews: 6-track grid so row 1 keeps three equal cards and the trailing pair centers.
   All five cards must be placed explicitly. */
.testimonials-grid:has(.testimonial-card:nth-child(5):last-child) {
  grid-template-columns: repeat(6, 1fr);
}
.testimonials-grid:has(.testimonial-card:nth-child(5):last-child) .testimonial-card:nth-child(1) { grid-column: 1 / span 2; }
.testimonials-grid:has(.testimonial-card:nth-child(5):last-child) .testimonial-card:nth-child(2) { grid-column: 3 / span 2; }
.testimonials-grid:has(.testimonial-card:nth-child(5):last-child) .testimonial-card:nth-child(3) { grid-column: 5 / span 2; }
.testimonials-grid:has(.testimonial-card:nth-child(5):last-child) .testimonial-card:nth-child(4) { grid-column: 2 / span 2; }
.testimonials-grid:has(.testimonial-card:nth-child(5):last-child) .testimonial-card:nth-child(5) { grid-column: 4 / span 2; }
```

**Two traps when adapting the 5-card block (both verified by measurement, 2026-07-28):**

1. **Place all five cards, not just 4 and 5.** An earlier version of this snippet used a 4-track
   `1fr 2fr 2fr 1fr` grid and placed only cards 4–5. Cards 1–3 then auto-flowed into tracks 1, 2
   and 3, so row 1 rendered **140 / 280 / 280 px** (first card half-width, fourth track empty)
   instead of equal thirds. The 6-track version above renders row 1 as 287 / 287 / 287 spanning
   the full grid width (0px dead space on either side), and row 2 as an equal 287 / 287 pair with
   matching side gaps, i.e. centered.

2. **The mobile reset must repeat the `:nth-child()` selectors.** A bare
   `…:has(…) .testimonial-card { grid-column: auto; }` inside a media query is *lower*
   specificity than `…:has(…) .testimonial-card:nth-child(N)` and silently loses, leaving the
   desktop 6-track placement active on phones (measured: 394px scrollWidth at a 375px viewport).
   Reset each `:nth-child(1)`–`:nth-child(5)` explicitly, and re-declare
   `grid-template-columns` on the `:has()` selector too, since it also outranks the plain
   `.testimonials-grid` rule.

Reference implementation: `pages/dryer-repair-orange-county.html`.

Remember that 5 is still the **least preferred** count (see below): prefer 6, 4, or 3, and only
reach for this block when the pool genuinely yields 5.

### Prefer counts of 3, 4, or 6 over 5
Five reviews has the messiest layout (a row of three followed by an off-balance row of two). Pick 5 only when the candidate pool genuinely yields 5 strong-and-similar reviews **and not a 6th**. Default order of preference: **6 ≈ 4 > 3 > 5**.

### `pages/testimonials.html`: add cards in multiples of 3, and accept the orphan when you cannot

Owner decision, 2026-08-12. This section's other layout rules are for **curated hub grids** with a
fixed 3/4/5/6 count. The testimonials page is different: it is still hand-maintained and still a
curated subset of the pool (see AGENTS.md, "Data"), but unlike a hub it is a **near-complete** one,
carrying every review that clears the quality floor rather than a hand-picked 3 to 6. So its count
grows with almost every capture and lands off a multiple of 3 about two-thirds of the time. It is
**not** equal to the pool size: on 2026-08-12 the pool held 115 records against 108 cards, the
difference being the sub-floor and photo-only records that are deliberately never carded.

The rule is: **when adding cards, top the batch up so the visible count stays a multiple of 3.** If
three new reviews clear the quality floor, add three. If two do, prefer adding a third from the
existing pool that has not been carded yet.

**The quality floor still wins.** Never card a sub-floor review just to round the count out, and never
invent, pad or re-word one. If the pool cannot supply enough qualifying reviews, **ship the short row**
rather than padding it. A trailing row that is not full is explicitly acceptable, whether it holds one
card or two: from a base that is already a multiple of 3, adding two leaves a remainder of 2, which is
a left-aligned **pair**, and adding one leaves a remainder of 1, a single left-aligned card. Both are
fine. Do not read "orphan" here as meaning only the one-card case.

**Batches larger than 3 follow the same rule:** card everything that clears the floor, then top up
toward the next multiple of 3 if the pool allows. Never hold a qualifying review back to make the
arithmetic tidy. A stranded card costs less than a missing real review.

**Do not "fix" the trailing row.** Both candidate fixes, a flexbox conversion and a JS orphan class on
the grid, were presented to the owner and declined, twice: on 2026-08-11 and again on 2026-08-12. A
fresh `/impeccable critique` will keep flagging the stranded card as a P1 or P2 on any future
testimonials PR, because the tool is stateless and cannot know it was already ruled on. **Cite this
rule, by name and heading, and move on.** Do not re-propose either fix, and do not present the finding
to the owner as a new recommendation.

(The 2026-08-11 half is also recorded as `P6-43` in `tasks/backlog.md`, with the measurements and the
reasons the obvious CSS one-liner does not work. That file is **gitignored**, so most agents and every
CI or cloud run cannot read it. Treat the backlog ID as local-only colour: this rule is the citable
record and must stand on its own without it. That gap is exactly why the decision was moved here.)

**This covers the filtered views too, and that is explicit, not inferred.** The 2026-08-12 decision was
given in direct answer to a question about the *filtered* case, worded as: when a filter leaves a count
that does not divide by 3, such as Washer's 19, the last card sits alone on the left. The answer was to
leave it. So `washer`, `refrigerator`, `dishwasher` at the 2-col breakpoint, and `wine-cooler` are all
in scope, not just the unfiltered view the 2026-08-11 decision originally described.

### Row word-count balance
Reviews placed in the same row must be similar in length. A 25-word review next to a 50-word review on the same row makes the shorter card look thin and reads as low-quality.

When picking N reviews, sort the candidate pool by word count and group:
- Row 1 (cards 1–3): the 3 reviews closest in length.
- Row 2 (cards 4–6): the next group, also matched in length within the row.

Acceptable spread within a row: roughly 1.5× (e.g., 25-word and 40-word OK; 25-word and 60-word not OK). If the candidate pool can't supply a balanced group, drop the count to the next preferred number (6 → 4 → 3) rather than render a mismatched row.

## Display rules

- Show reviewer name exactly as it appears in the pool's `name` field. Last-initial abbreviations (e.g., "Jennifer T." for "Jennifer Trette") are acceptable if the page already uses that style — otherwise use the full name.
- Location label depends on the record's `source` field. **Google records (`source: "google"`):** Google does not expose reviewer city, so use `"Orange County, CA"` unless one of the two exceptions below applies, or unless the page is a hub outside Orange County, in which case the label is dropped entirely (see "Non-OC hubs omit the location label" at the end of this section). **Yelp records (`source: "yelp"`):** Yelp displays the reviewer's city directly — use the Yelp-displayed city verbatim (e.g., `"Dana Point, CA"`, `"Anaheim, CA"`).

  **Exception 1 — the review says so.** The reviewer's own **review text** explicitly names an **Orange County** city: any city on the Target Geography list in `.claude/skills/seo-content/SKILL.md`, plus **Stanton**, the business's own address, which is in Orange County but is absent from that list because the list exists for article city rotation, not for validating labels. Use that city. A city mentioned in passing that is not where the job happened ("we moved here from Riverside", "my sister in Fresno recommended you") does **not** qualify, and neither does anything read off the reviewer's profile.

  **Exception 2 — job-photo corroborated attestation** (owner decision 2026-08-03). A specific city may be used when **both** of these hold:

    1. The business holds its **own job photo** of that repair in `images/real/business/`, and the match to the review is **objectively describable**: the same appliance and the same visible surroundings as the reviewer's photo, stated concretely enough (cabinetry, adjacent appliances, room features, brand plate) that a second person can check it against the two images and agree. A technician saying "that's the same job" is **not** sufficient on its own.
    2. The **technician or owner confirms the city**, recorded with **who attested and on what date**.

  Record both in the record's `_note`: the corroborating business photo path, the concrete visual match, and the named, dated attestation. A later audit must be able to re-check the claim without asking anyone.

  This is deliberately a two-part bar, and the two parts must come from **different kinds of evidence**: one checkable against an image, one attributable to a named person. If the same person's say-so is doing both jobs, that is one source wearing two hats, and the label falls back to `"Orange County, CA"`.

  **Privacy constraint.** This exception attaches a location the reviewer did **not** publish themselves, unlike Exception 1 or a Yelp-displayed city. So: city level only, never a neighbourhood, street or cross-street; never combine the city with any other detail that would narrow it toward a household; and drop the city back to the default immediately on request from the reviewer. If the reviewer's own review reads as deliberately anonymous, prefer the default.

  **Still never permitted:** inferring a city from the reviewer's display name, surname, profile photo, or a guess about where a brand sells well.

  **Not retroactive.** Existing `"Orange County, CA"` labels stay as they are unless someone establishes both parts of the bar for that specific review. Do not sweep the pool relabelling records from memory.
- Star rating: always render 5 stars (all transcribed pool reviews are verified 5-star Google reviews).
- Light typo/grammar editing is allowed for reviews flagged `bodyHasTypos: true`. No paraphrasing or substantive rewording.
- For Yelp records with a `previousBody` field, display only `body` (the current version). `previousBody` is reference-only.

### Non-OC hubs omit the location label (owner decision, 2026-08-15)

On hub pages outside Orange County — currently Long Beach and Pico Rivera (LA County) and Corona
(Riverside County) — testimonial cards drop the location segment entirely. Render
`Name · Job type` and stop. Do not write `Orange County, CA`, and do not substitute the hub's own
city.

**Why.** The review pool is overwhelmingly OC-sourced. Labelling honestly on a Long Beach page tells
a Long Beach reader that nobody local has reviewed us, which defeats the purpose of the section;
labelling with the hub's city would be a fabrication and is banned outright above. Dropping the
segment is the only option that is neither misleading nor self-defeating: the reviews are real, they
are about this company's work, and nothing on the card claims where the job happened. The owner
judged the conversion value of showing real proof to outweigh the cost of omitting provenance.

**One condition attaches, and it is not optional:**

1. **The section heading must not localize the proof either.** A heading reading "What Orange County
   & LA County Customers Say" re-asserts exactly the claim the card just dropped. Non-OC hubs use
   the neutral "What Our Customers Say".

**No speed-claim filter applies, and the reason is worth recording.** A draft of this rule carried a
second condition barring reviews that mention how fast we arrived from Riverside hubs, on the premise
that Riverside was next-available-only for want of a local technician. **The owner corrected that
premise on 2026-08-15: there are local technicians in both LA County and Riverside County, and a
call is either dispatched to one of them or covered by our own technician, so same-day is not
off the table in either county.** The condition was removed rather than reworded, because with the
premise gone there is nothing left for it to protect against. Do not reintroduce it, and do not
"restore" it from the older wording still sitting in the gitignored plan files.

**Scope: hub pages outside Orange County only.** OC hubs, `index.html` and `pages/testimonials.html`
keep the `Orange County, CA` label. `Review` JSON-LD is unaffected; it never carried a location
field.

**The heading and any subtext under it are in scope too.** This rule governs everything the *page*
asserts about where the proof comes from, not just the one line under the reviewer's name. When the
labels came off the three non-OC hubs, the section heading and the small print directly beneath it
both still read "Orange County", which re-made the claim the cards had just dropped. Check the whole
section, not the card.

**A reviewer's own words are never edited to comply with this.** Bodies are verbatim, and that rule
outranks this one. Elvin Mammadov's quote on the Long Beach hub reads "The best company in Orange
County", and it stays exactly as he wrote it. The distinction is real rather than convenient: this
rule constrains what *we* assert about a reviewer's location, and says nothing about what the
reviewer chose to say. If a verbatim quote naming a county is genuinely unwanted on a page, the
remedy is to pick a different review, never to trim the quote.

**Supersede when real local reviews arrive.** If a review is later confirmed to come from an LA
County or Riverside County job under the job-photo corroborated attestation bar above, label that
one card with its city on that hub. This subsection is a fallback for an OC-only pool, not a
preference for anonymity.

## Schema requirements

Every page that displays testimonials must also include:

- **`AggregateRating`** in JSON-LD: `ratingValue: 5.0`, `reviewCount` = `data/testimonials.json` `_meta.sources.google.publishedCount` (read the live value from that field, do not copy a number out of this sentence) — what the site currently claims, promoted from the live GBP listing total (`totalReviewsOnListing`) only during a weekly publish batch, never read directly from `totalReviewsOnListing` — `bestRating: 5`. Never hardcode a stale literal — the `content-integrity` "review-count" check enforces this against `publishedCount`. **`AggregateRating` is Google-only** — never add Yelp's count/average into `ratingValue` or `reviewCount`. Mixing sources in `AggregateRating` is discouraged by Google's structured-data guidance.
- **Individual `Review` JSON-LD entries** for each displayed testimonial, with `author.name` matching the pool's `name` field exactly. This applies to displayed **Yelp** reviews too — emit a `Review` entry for each, but they stay out of `AggregateRating` (above).

## Tracking usage

After adding testimonials to any hub page, update `tasks/testimonial-usage.md` — add a row for each review used and check the hub column. This is how the ≤2-hubs rule is enforced across PRs. The tracker counts **hubs only** (city + service/brand/cost hubs); homepage and testimonials-page appearances are recorded separately and do not count toward the limit. The tracker can be rebuilt from live HTML at any time with `scripts/oneoff/audit-testimonial-hub-usage-2026-06-10.py` (parses `Review.author.name` across all hubs) — re-run it if the tracker and the live pages are suspected to have drifted.

## If the pool cannot supply enough reviews

If, after filtering by appliance, fewer than 3 complete-body reviews are available:
1. Relax the appliance filter and pick any unmatched reviews from the pool.
2. If still short of 3, use however many the pool supplies rather than fabricating names or using photo-only records.
3. Call out the shortfall in the PR description.

**An empty or short testimonials section is always better than a fake quote or a thin one.**
