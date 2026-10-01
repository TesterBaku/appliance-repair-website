# October 1, 2026 social posts

Prepared for Universal Appliances Repair. One GBP/Instagram post pair, using one real technician photo. **Not published or scheduled.** The processed image trio exists locally in `images/real/business/`. Website placements and the destination anchor were implemented and verified locally on this branch (`content/job-photo-2026-10-01-kitchenaid-dishwasher-santa-ana`); live deployment verification remains pending. Review each platform preview before publishing.

## Evidence and placement

The only facts supplied by the owner are: KitchenAid dishwasher, control board replaced, Santa Ana, CA. No date, symptom, model number or customer detail was provided, and none is stated anywhere below. The photo shows the front of a stainless KitchenAid dishwasher under a countertop with its display lit. It is placed on the recent-repairs gallery, the Santa Ana city hub, the KitchenAid brand hub, and the dishwasher appliance hub.

For GBP, choose **Update**, attach the processed JPEG and use **Learn more** with the exact destination. For Instagram, use the caption and hashtags together; Santa Ana, CA is a legitimate taggable Instagram location. All image paths are repository-relative. Use the processed JPEG with metadata removed; no crop was needed (no faces, addresses, or documents visible).

## Policies checked

Per `.claude/skills/gbp-platform-policy/SKILL.md`: GBP posts are descriptive-only (brand, appliance, job type, city), no phone numbers in body text, Learn more CTA to a published page per owner preference (2026-09-07), no photo captions. Instagram hashtag cap is 5, re-verified live 2026-09-04 in that skill; the caption below uses 5. Yelp's guidelines, verified in that skill, prohibit AI drafting or revising reviews or other content; no Yelp copy is included, and this draft text must not be pasted or adapted for Yelp: any Yelp text must be written by a human. No review solicitation anywhere.

## 1. Santa Ana: KitchenAid dishwasher control board replacement

Image: `images/real/business/completed-repair-dishwasher-kitchenaid-control-board-santa-ana.jpg`.

GBP body:

```text
KitchenAid dishwasher control board replacement. Santa Ana, CA.
```

Learn more: https://fixappliancesfast.com/pages/recent-repairs.html#job-dishwasher-kitchenaid-control-board-santa-ana

Instagram: single image; city tag Santa Ana, CA.

```text
KitchenAid dishwasher control board replacement in Santa Ana, CA.

#SantaAnaCA #OrangeCountyCA #KitchenAid #DishwasherRepair #ApplianceRepair
```

## Implementation and publication checklist

- [x] Read current platform policies via `.claude/skills/gbp-platform-policy/SKILL.md` (GBP re-verified 2026-08-19 in that skill; Instagram hashtag cap re-verified live 2026-09-04 in that skill).
- [x] Prepare the job draft from owner-supplied facts only; no invented parts, symptoms, dates, or outcomes.
- [x] Generate the JPEG/WebP derivatives via `npm run photos:import -- --write`; verify local existence via the import report and no EXIF.
- [x] Confirm the destination anchor exists on this branch (`pages/recent-repairs.html`).
- [ ] Verify deployed destination page and anchor before social publication.
- [ ] Human reviews the GBP preview, image, body and Learn more URL.
- [ ] Owner publishes or explicitly authorizes publication, then records GBP status and Instagram result.

Current status: preparation only. No external posts published or scheduled; deployment verification pending.
