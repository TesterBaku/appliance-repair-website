# HOLD: Riverside western edge (Corona, Norco, Eastvale)

**This branch is parked. Do not merge it without an explicit owner decision.**

Owner directive, 2026-08-24: hold all three western Riverside County pages together until it is
settled whether our Riverside technician covers the western edge of the county.

## What is on this branch

| Page | State |
|---|---|
| `pages/appliance-repair-norco-ca.html` | Built, never shipped. Was PR #770, closed in favour of this branch. |
| `pages/appliance-repair-eastvale-ca.html` | Built, never shipped. Was PR #771, closed in favour of this branch. |
| `pages/appliance-repair-corona-ca.html` | **Already on `master`, taken offline** in PR #776: `robots noindex, follow`, unlinked everywhere, dropped from the sitemap. The page still returns 200. |

Corona is not duplicated here on purpose. Withdrawing it was a live change and had to land on
`master`; parking a second copy would create two sources of truth for the same file.

## The decision this is waiting on

`.claude/skills/seo-content/SKILL.md` splits Riverside County in two:

- **Eastern half** (Riverside city, Palm Springs, Cathedral City, Rancho Mirage, Palm Desert):
  same-day when the technician's schedule is open. The Riverside hub shipped on this basis in #775.
- **Western edge** (Corona, Norco, Eastvale): next-available by default, because **whether he covers
  them is an open owner question**. That question is what this branch waits on.

Note the reason carefully. It is **not** that no Riverside technician exists; one does, and he covers
the eastern half same-day. Do not restore the pre-2026-08-22 wording that said the county had no
local technician. That claim is wrong and was removed site-wide.

## Before this branch can ship, three things are stale and MUST be fixed

Measured 2026-08-24 against `master`. These pages were built on 2026-08-21 and `master` has moved:

1. **`reviewCount` is 116 on both pages; `master` publishes 118.** The `review-count` check in
   `test/content-integrity.js` validates every page against
   `data/testimonials.json` `_meta.sources.google.publishedCount`, so both pages **fail `npm test`
   as they stand.** Re-derive the number from the JSON at the time you unpark; do not copy 118 out
   of this file, it will be stale too.
2. **12 occurrences of `$120` on each page.** PR #772 collapsed every county tier into a flat `$99`
   on 2026-08-22. A `$120` in a *company-fee* sentence is now a defect. `$120` inside a *repair cost
   estimate* ("$120 to $300 for a drain pump") is still valid, so check each occurrence rather than
   running a blind replace.
3. **2 same-day mentions on each page.** These encode the very question being decided. Do not touch
   them until the decision lands, then write them to match it.

Also required at unpark, and easy to forget because none of it lives in these two files:

- Add both cities to `partials/nav-main.html` and `partials/nav-article.html`, then run
  `npm run build:partials`. **Do not hand-edit any page's nav.**
- Add city cards plus matching `LocalBusiness.areaServed` entries on `pages/service-areas.html`.
  A CI check asserts those two match exactly.
- Run `npm run build:sitemap` and commit the result.
- Check `tasks/testimonial-usage.md` before placing any testimonial: free hub slots were down to
  **4** pool-wide on 2026-08-24, and a review may sit on at most 2 hubs.

The original PR branches also carried ~80-file nav restamps that are now stale against `master`.
They were deliberately **not** brought over. Regenerate the wiring from the partials instead; that
is what the build scripts are for.

## If Corona comes back

Reverse PR #776: remove the `robots` meta, add Corona back to both nav partials, re-link its Service
Areas card, restore the Palm Springs sentence, then run `build:partials` and `build:sitemap`.

One nuance: `partials/nav-article.html` previously held Corona alone in its Riverside County group,
and now holds Riverside and Palm Springs. Restoring Corona gives three entries, not the original one.
That is the intended outcome, not an error.

## If the answer is that we do not cover the western edge

Then these two pages should be deleted rather than left parked indefinitely, and Corona's withdrawal
becomes permanent. At that point consider a 301 from the Corona URL rather than leaving it noindexed
forever, and say so in `llms.txt` and the Service Areas copy, which currently still state that we
serve all three cities.
