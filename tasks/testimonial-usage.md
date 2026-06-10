# Testimonial Hub-Usage Tracker

> **Auto-generated from live HTML on 2026-06-10** by `scripts/oneoff/audit-testimonial-hub-usage-2026-06-10.py`
> (parses `Review.author.name` JSON-LD across every hub page). Do not hand-edit the tables below —
> re-run the script (`python scripts/oneoff/audit-testimonial-hub-usage-2026-06-10.py --emit-tracker`)
> after any hub testimonial change so this stays ground-truth, not a drifted hand-log.

## The rule (canonical: `.claude/rules/testimonial-selection.md`)

**A review may appear on at most 2 HUBS.** A hub is a city hub
(`pages/appliance-repair-*-ca.html`) or a service/brand/cost hub (`pages/*-orange-county.html`).
The **homepage** and the **testimonials page** are NOT hubs and do NOT count toward the limit.

## Capacity at a glance

| Metric | Value |
|---|---|
| Distinct reviews currently on >=1 hub | 77 |
| On exactly 1 hub (1 free slot each) | 41 |
| On exactly 2 hubs (at cap) | 32 |
| On 3 hubs (grandfathered exceptions) | 4 |
| **Free hub-slots available now** | **41** |
| Approx. new city hubs supportable @ 3/hub | **~13** (before appliance-match / brand-variety / row-balance filters) |

The pool is **not** exhausted: the ~39 reviews sitting on a single hub each have a free
second slot. Allocate from the "1 free slot" list below when building new hubs.

## Accepted exceptions (3 hubs each — grandfathered, DO NOT move)

These four predate the ≤2-hubs rule and are sanctioned. Future audits must treat them as allowed,
not as violations to fix. No other review may exceed 2 hubs.

| Review | Hubs (3) |
|---|---|
| Joellyn Meadows | huntington-beach, mission-viejo, refrigerator-repair-hub |
| Katie Anne Salen | irvine, mission-viejo, dryer-repair-hub |
| Lilya Raupova | garden-grove, newport-beach, refrigerator-repair-hub |
| Molla Islam | irvine, newport-beach, refrigerator-repair-hub |

## Reviews with a free slot (on exactly 1 hub) — allocate these first

| Review | On hub |
|---|---|
| Andrea Hall | cost-hub |
| Arzuman Qarayev | anaheim |
| Brian Brassil | sub-zero-hub |
| Cheryl Kirkpatrick | wine-cooler-repair-hub |
| Cheryl Lemire | dryer-repair-hub |
| Dana McNeill | fountain-valley |
| Danette Vanover | washer-repair-hub |
| Dena Fisher | dryer-repair-hub |
| Elvin Mammadov | wolf-hub |
| Ernesto Ruiz | dryer-repair-hub |
| George | miele-hub |
| Jeff C | sub-zero-hub |
| Jennifer Trette | costa-mesa |
| John Dinger | cost-hub |
| Jonra Babiracki | garbage-disposal-repair-hub |
| Jovita Osorio | wine-cooler-repair-hub |
| Justine Shaw | garbage-disposal-repair-hub |
| Karen Myhra | dishwasher-repair-hub |
| Kathy Calderon | dacor-hub |
| Kenan Ken | oven-stove-repair-hub |
| Laurie Summers | wolf-hub |
| Mark Koss | thermador-hub |
| Matt Snyder | garbage-disposal-repair-hub |
| Mike Bonilla | brea |
| Naoki MacInnes | wine-cooler-repair-hub |
| Noelle B. | yorba-linda |
| Patricio Jr Villanueva | washer-repair-hub |
| Pawan Deepak | fountain-valley |
| Roger Antonie | oven-stove-repair-hub |
| Satara Armstrong Charlson | viking-hub |
| Shawne King | cost-hub |
| Stephen Stephen | garbage-disposal-repair-hub |
| Surma Karimova | tustin |
| Susie Arii | orange |
| Suzan Hier | sub-zero-hub |
| William L. | dacor-hub |
| William Nugent | freezer-repair-hub |
| andrea hall | freezer-repair-hub |
| mike bonilla | lake-forest |
| mrs d. | dacor-hub |
| paul guns | cost-hub |

## Reviews at cap (on 2 hubs) — do not add to a 3rd hub

| Review | Hubs (2) |
|---|---|
| A T | costa-mesa, fountain-valley |
| B P | tustin, viking-hub |
| Cindy Montefu | santa-ana, dryer-repair-hub |
| Clifford Wright | thermador-hub, wolf-hub |
| Craig Tudor | garden-grove, washer-repair-hub |
| D Light | cost-hub, thermador-hub |
| Darina Martirosyan | brea, tustin |
| Dave Brisbin | irvine, refrigerator-repair-hub |
| Elizabeth Lovejoy | laguna-beach, oven-stove-repair-hub |
| Emily Palmer | laguna-beach, freezer-repair-hub |
| Erin Ponchak | laguna-niguel, yorba-linda |
| George Mendoza | garden-grove, oven-stove-repair-hub |
| Greg Schnabel | costa-mesa, miele-hub |
| Jonathan Stone | santa-ana, dishwasher-repair-hub |
| Julie L. | huntington-beach, dryer-repair-hub |
| Kat Tesh | brea, viking-hub |
| Katherine Bosboom | cost-hub, dishwasher-repair-hub |
| Katie Holst | fullerton, dishwasher-repair-hub |
| Kelly Heyden | huntington-beach, washer-repair-hub |
| Ken Turknette | laguna-niguel, yorba-linda |
| Lale | santa-ana, refrigerator-repair-hub |
| Laman Anvarli | fullerton, freezer-repair-hub |
| Linda B. | laguna-niguel, lake-forest |
| Marcy Kucik | anaheim, refrigerator-repair-hub |
| Mark Rivera | lake-forest, washer-repair-hub |
| Robert Clemmons | mission-viejo, dishwasher-repair-hub |
| Russell Kadota | laguna-beach, washer-repair-hub |
| Steve D | newport-beach, oven-stove-repair-hub |
| Susan Ryan | orange, oven-stove-repair-hub |
| Tony Tomassini | anaheim, dishwasher-repair-hub |
| Veronique Reaver | fullerton, miele-hub |
| rick deangelo | orange, wine-cooler-repair-hub |

## Name-normalization note

A few reviewers appear under display-name variants that don't string-match the pool `name`
(e.g. `Andrea Hall`/`andrea hall`, `Mike Bonilla`/`mike bonilla`). Each variant is still on
<=2 hubs, so none breach the cap, but when allocating treat case-variants as the SAME person
and sum their hub counts. Normalize the displayed name to the pool `name` on the next edit to
each affected page.

