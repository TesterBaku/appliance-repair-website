# October 7, 2026 social posts

Prepared for Universal Appliances Repair. Two GBP/Instagram post pairs for two jobs at one San Clemente home, using three real technician photos. **Unpublished drafts for the owner. Not published or scheduled.** The processed image trios exist locally in `images/real/business/`. Website placements were implemented and verified locally on branch `content/photos-san-clemente-kitchenaid`; live deployment verification remains pending. Review each platform preview before publishing.

## Evidence and placement

The only facts supplied by the owner are: KitchenAid double wall oven, control board replaced; KitchenAid French-door refrigerator, door gasket replaced; San Clemente, CA. No date, cause, part number, model number or customer detail was provided, and none is stated below. The oven photos show the control panel pulled forward to expose the board (overview) and a close-up of two control boards, wiring and a transformer inside the opened panel. The refrigerator photo shows the stainless French-door refrigerator set into white cabinetry; it does not show the gasket or the repair, so no copy below claims it does.

Photos are placed on the recent-repairs gallery (3 cards), the San Clemente city hub (oven overview and refrigerator), the KitchenAid brand hub (same two), the oven and stove hub (oven overview) and the refrigerator hub (refrigerator).

For GBP, choose **Update**, attach the processed JPEG and use **Learn more** with the exact destination. For Instagram, use the caption and hashtags together; tag the city (San Clemente, CA), never a customer's home, and confirm the place tag exists in Instagram's location search before posting (not checked here). All image paths are repository-relative. Use the processed JPEG with metadata removed; no crop was needed. The owner reviewed the photos for privacy: no faces, addresses or documents; the refrigerator door carries a faint, unidentifiable reflection.

## Policies checked

Per `.claude/skills/gbp-platform-policy/SKILL.md`: GBP posts are descriptive-only (brand, appliance, job type, city), no phone numbers in body text, no promotional claims, Learn more CTA to a published page, no photo captions. Instagram uses 3 to 5 hashtags (the cap is 5). Yelp's guidelines prohibit AI drafting or revising content; no Yelp copy is included, and this draft text must not be pasted or adapted for Yelp: any Yelp text must be written by a human. No review solicitation anywhere.

## 1. San Clemente: KitchenAid double wall oven control board replacement

Image: `images/real/business/completed-repair-wall-oven-kitchenaid-control-board-san-clemente.jpg` (overview). Optional second image: `images/real/business/completed-repair-wall-oven-kitchenaid-control-boards-detail-san-clemente.jpg` (close-up of the boards).

GBP body:

```text
KitchenAid double wall oven control board replacement. San Clemente, CA.
```

Learn more: https://fixappliancesfast.com/pages/recent-repairs.html#job-wall-oven-kitchenaid-control-board-san-clemente

Instagram: single image or two-image carousel (overview, then close-up); city tag San Clemente, CA.

```text
KitchenAid double wall oven control board replacement in San Clemente, CA.

#SanClemente #OrangeCountyCA #KitchenAid #WallOven #ApplianceRepair
```

## 2. San Clemente: KitchenAid French-door refrigerator door gasket replacement

Image: `images/real/business/completed-repair-refrigerator-kitchenaid-door-gasket-san-clemente.jpg`. The photo shows the refrigerator, not the gasket.

GBP body:

```text
KitchenAid French-door refrigerator door gasket replacement. San Clemente, CA.
```

Learn more: https://fixappliancesfast.com/pages/recent-repairs.html#job-refrigerator-kitchenaid-door-gasket-san-clemente

Instagram: single image; city tag San Clemente, CA.

```text
KitchenAid French-door refrigerator door gasket replacement in San Clemente, CA.

#SanClemente #OrangeCountyCA #KitchenAid #RefrigeratorRepair #ApplianceRepair
```

## Implementation and publication checklist

- [x] Read current platform policies via `.claude/skills/gbp-platform-policy/SKILL.md`.
- [x] Prepare the job drafts from owner-supplied facts only; no invented parts, causes, dates or outcomes.
- [x] Generate the JPEG/WebP derivatives via `npm run photos:import -- --write`; no EXIF in outputs.
- [x] Confirm both destination anchors exist on this branch (`pages/recent-repairs.html`).
- [ ] Verify deployed destination page and anchors before social publication.
- [ ] Human reviews the GBP previews, images, bodies and Learn more URLs.
- [ ] Owner publishes or explicitly authorizes publication, then records GBP status and Instagram results.

Current status: preparation only. No external posts published or scheduled; deployment verification pending.
