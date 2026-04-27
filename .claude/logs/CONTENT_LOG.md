# SEO Blog Content Log

---

## Run — April 21, 2026

**Articles created:** 3
**Cost content:** No (removed mid-run; no-cost is now the default — agent asks at start of every run)

| Title | Slug | Primary Keyword | Type | PR | Commit |
|---|---|---|---|---|---|
| Washer Repair in Irvine, CA — Costs, Timeline & What to Expect | `article-washer-repair-irvine.html` | washer repair Irvine CA | Local service | [#2](https://github.com/TesterBaku/appliance-repair-website/pull/2) | `1cbfec1` |
| Dishwasher Not Draining? 6 Common Causes & Fixes (Anaheim) | `article-dishwasher-not-draining-anaheim.html` | dishwasher not draining Anaheim | Symptom guide | [#3](https://github.com/TesterBaku/appliance-repair-website/pull/3) | `03bef78` |
| Dryer Repair in Orange County, CA — Common Problems & When to Call a Pro | `article-dryer-repair-cost-orange-county.html` | dryer repair Orange County CA | Symptom guide | [#4](https://github.com/TesterBaku/appliance-repair-website/pull/4) | `cdd5fa8` |

**Workflow changes:** Fixed `links.js` to skip absolute URLs (canonical tags); added cost-inclusion question to Phase 1; `screenshot.js` switched to dynamic article discovery; added `pre-push` hook blocking direct pushes to master.

---

## Run — April 23, 2026

**Articles created:** 9
**Cost content:** No
**Mode:** Interactive

| Title | Slug | Primary Keyword | Type | PR | Commit |
|---|---|---|---|---|---|
| Oven Repair in Santa Ana, CA — What to Expect | `article-oven-repair-santa-ana.html` | oven repair Santa Ana CA | Local service | [#11](https://github.com/TesterBaku/appliance-repair-website/pull/11) | `cc64d08` |
| Washing Machine Not Spinning in Huntington Beach? 5 Common Causes | `article-washer-not-spinning-huntington-beach.html` | washing machine not spinning Huntington Beach | Symptom guide | [#12](https://github.com/TesterBaku/appliance-repair-website/pull/12) | `9e966ce` |
| Refrigerator Repair in Garden Grove, CA — What to Expect | `article-fridge-repair-garden-grove.html` | refrigerator repair Garden Grove CA | Local service | [#13](https://github.com/TesterBaku/appliance-repair-website/pull/13) | `4be8727` |
| Garbage Disposal Repair in Costa Mesa, CA | `article-garbage-disposal-repair-costa-mesa.html` | garbage disposal repair Costa Mesa CA | Local service | [#14](https://github.com/TesterBaku/appliance-repair-website/pull/14) | `e526d86` |
| Refrigerator Not Cooling in Huntington Beach? 6 Common Causes | `article-fridge-not-cooling-huntington-beach.html` | refrigerator not cooling Huntington Beach | Symptom guide | [#15](https://github.com/TesterBaku/appliance-repair-website/pull/15) | `2873436` |
| Dryer Not Heating in Santa Ana? Here's Why and What to Do | `article-dryer-not-heating-santa-ana.html` | dryer not heating Santa Ana | Symptom guide | [#16](https://github.com/TesterBaku/appliance-repair-website/pull/16) | `db3ef17` |
| 5 Dishwasher Maintenance Tips to Avoid Breakdowns in Fullerton | `article-dishwasher-maintenance-fullerton.html` | dishwasher maintenance Fullerton CA | Maintenance | [#17](https://github.com/TesterBaku/appliance-repair-website/pull/17) | `1f1cbc0` |
| Microwave Not Heating in Costa Mesa? Here's Why | `article-microwave-not-heating-costa-mesa.html` | microwave not heating Costa Mesa | Symptom guide | [#18](https://github.com/TesterBaku/appliance-repair-website/pull/18) | `7098a81` |
| Washer Repair in Garden Grove, CA — Signs You Need a Pro | `article-washer-repair-garden-grove.html` | washer repair Garden Grove CA | Local service | [#19](https://github.com/TesterBaku/appliance-repair-website/pull/19) | `01fba35` |

**Workflow changes:** Added human-like writing rules to seo-content.md; added no-AC/HVAC rule to seo-content.md; PR body now written to temp file to avoid command-length errors; AC repair article proposed and scrapped at user request.

---

## Run — April 27, 2026

**Articles created:** 3
**Cost content:** No
**Mode:** Interactive (user approved Article 1, then authorized autonomous completion of Articles 2 & 3)

| Title | Slug | Primary Keyword | Type | PR | Commit |
|---|---|---|---|---|---|
| Freezer Not Freezing in Anaheim? 5 Common Causes & Fixes | `article-freezer-not-freezing-anaheim.html` | freezer not freezing Anaheim CA | Symptom guide | [#31](https://github.com/TesterBaku/appliance-repair-website/pull/31) | `25406ff` |
| Dishwasher Repair in Orange, CA — What to Expect | `article-dishwasher-repair-orange.html` | dishwasher repair Orange CA | Local service | [#32](https://github.com/TesterBaku/appliance-repair-website/pull/32) | `0bff6fb` |
| Washing Machine Leaking in Buena Park? Here's Why | `article-washer-leaking-buena-park.html` | washing machine leaking Buena Park CA | Symptom guide | [#33](https://github.com/TesterBaku/appliance-repair-website/pull/33) | `d5b93a8` |

**Workflow changes:** None — this run also recovered from a scheduled pipeline that timed out mid-execution (Phase 3 API stream timeout); user manually re-triggered via interactive /seo-blog.
