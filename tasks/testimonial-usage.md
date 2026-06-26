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
| Distinct reviews currently on >=1 hub | 80 |
| On exactly 1 hub (1 free slot each) | 14 |
| On exactly 2 hubs (at cap) | 62 |
| On 3 hubs (grandfathered exceptions) | 4 |
| **Free hub-slots available now** | **14** |
| Approx. new city hubs supportable @ 3/hub | **~4** (before appliance-match / brand-variety / row-balance filters) |

The pool is **not** exhausted: the 14 reviews sitting on a single hub each have a free
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
| Brian Brassil | sub-zero-hub |
| Christian Dorn | los-alamitos |
| Elvin Mammadov | wolf-hub |
| George | miele-hub |
| Jeff C | sub-zero-hub |
| Karen Myhra | dishwasher-repair-hub |
| Laurie Summers | wolf-hub |
| Matt Snyder | garbage-disposal-repair-hub |
| Naoki MacInnes | wine-cooler-repair-hub |
| Noelle B | san-clemente |
| Noelle B. | yorba-linda |
| Satara Armstrong Charlson | viking-hub |
| Wendy Henderson | los-alamitos |
| William L. | dacor-hub |

## Reviews at cap (on 2 hubs) — do not add to a 3rd hub

| Review | Hubs (2) |
|---|---|
| A T | costa-mesa, fountain-valley |
| Arzuman Qarayev | anaheim, westminster |
| B P | tustin, viking-hub |
| Cheryl Kirkpatrick | seal-beach, wine-cooler-repair-hub |
| Cindy Montefu | santa-ana, dryer-repair-hub |
| Clifford Wright | thermador-hub, wolf-hub |
| Craig Tudor | garden-grove, washer-repair-hub |
| D Light | cost-hub, thermador-hub |
| Dana McNeill | fountain-valley, rancho-santa-margarita |
| Danette Vanover | aliso-viejo, washer-repair-hub |
| Darina Martirosyan | brea, tustin |
| Dave Brisbin | irvine, refrigerator-repair-hub |
| Dena Fisher | buena-park, dryer-repair-hub |
| Elizabeth Lovejoy | laguna-beach, oven-stove-repair-hub |
| Emily Palmer | laguna-beach, freezer-repair-hub |
| Erin Ponchak | laguna-niguel, yorba-linda |
| Ernesto Ruiz | placentia, dryer-repair-hub |
| George Mendoza | garden-grove, oven-stove-repair-hub |
| Gina Kim | los-alamitos, san-clemente |
| Greg Schnabel | costa-mesa, miele-hub |
| J. Feria | dana-point, rancho-santa-margarita |
| Jennifer Trette | costa-mesa, cypress |
| John Dinger | cost-hub, dana-point |
| Jonathan Stone | santa-ana, dishwasher-repair-hub |
| Jonra Babiracki | westminster, garbage-disposal-repair-hub |
| Jovita Osorio | placentia, wine-cooler-repair-hub |
| Julie L. | huntington-beach, dryer-repair-hub |
| Justine Shaw | buena-park, garbage-disposal-repair-hub |
| Kat Tesh | brea, viking-hub |
| Katherine Bosboom | cost-hub, dishwasher-repair-hub |
| Kathy Calderon | aliso-viejo, dacor-hub |
| Katie Holst | fullerton, dishwasher-repair-hub |
| Kelly Heyden | huntington-beach, washer-repair-hub |
| Ken Turknette | laguna-niguel, yorba-linda |
| Kenan Ken | westminster, oven-stove-repair-hub |
| Lale | santa-ana, refrigerator-repair-hub |
| Laman Anvarli | fullerton, freezer-repair-hub |
| Linda B. | laguna-niguel, lake-forest |
| Marcy Kucik | anaheim, refrigerator-repair-hub |
| Mark Koss | rancho-santa-margarita, thermador-hub |
| Mark Rivera | lake-forest, washer-repair-hub |
| Patricio Jr Villanueva | la-habra, washer-repair-hub |
| Pawan Deepak | fountain-valley, placentia |
| Robert Clemmons | mission-viejo, dishwasher-repair-hub |
| Roger Antonie | la-habra, oven-stove-repair-hub |
| Russell Kadota | laguna-beach, washer-repair-hub |
| Shawne King | cost-hub, cypress |
| Stephen Stephen | cypress, garbage-disposal-repair-hub |
| Steve D | newport-beach, oven-stove-repair-hub |
| Surma Karimova | dana-point, tustin |
| Susan Ryan | orange, oven-stove-repair-hub |
| Susie Arii | orange, seal-beach |
| Suzan Hier | buena-park, sub-zero-hub |
| Tony Tomassini | anaheim, dishwasher-repair-hub |
| Veronique Reaver | fullerton, miele-hub |
| William Nugent | la-habra, freezer-repair-hub |
| andrea hall | cost-hub, freezer-repair-hub |
| cheryl lemire | san-clemente, dryer-repair-hub |
| mike bonilla | brea, lake-forest |
| mrs d. | aliso-viejo, dacor-hub |
| paul guns | cost-hub, seal-beach |
| rick deangelo | orange, wine-cooler-repair-hub |

## Name-normalization note

Counts above are computed **case-insensitively against the pool `name`**, so display-name
case variants (e.g. `Andrea Hall` on the cost hub vs pool `andrea hall` on the freezer hub,
and `Mike Bonilla` vs `mike bonilla`) are correctly folded to ONE person — both of those
people are therefore counted at their true 2-hub (at-cap) position, not as two free singles.

Display names still not matched to any pool `name` (normalize in source on next edit): `Noelle B.`.

