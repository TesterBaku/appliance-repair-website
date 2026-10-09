# October 8, 2026 social posts

Prepared for Universal Appliances Repair. One GBP/Instagram post pair for one Chino Hills job, using one real technician photo. **Unpublished drafts for the owner. Not published or scheduled.** The processed image trio exists locally in `images/real/business/`. Website placements were implemented and verified locally on branch `content/chino-hills-frigidaire-damper-photo`; live deployment verification remains pending. Review each platform preview before publishing.

## Evidence and placement

The only facts supplied by the owner are, from the folder and file names: Frigidaire refrigerator, not cooling, damper control replaced, Chino Hills. No date, cause, part number, model number or customer detail was provided, and none is stated below. The photo shows a stainless side-by-side refrigerator with a through-door ice and water dispenser standing in a garage; it does not show the damper control or the repair, so no copy below claims it does.

The photo is placed on the recent-repairs gallery, the Frigidaire brand hub and the refrigerator hub. Chino Hills has no city hub, so there is no city placement.

For GBP, choose **Update**, attach the processed JPEG and use **Learn more** with the exact destination. For Instagram, use the caption and hashtags together; tag the city (Chino Hills, CA), never a customer's home, and confirm the place tag exists in Instagram's location search before posting (not checked here). The image path is repository-relative. Use the processed JPEG with metadata removed; the owner chose to publish the frame uncropped. Privacy check: no faces, addresses, documents or readable labels; household items stored in the garage are visible around the refrigerator.

## Policies checked

Per `.claude/skills/gbp-platform-policy/SKILL.md` (its dated verifications, not re-fetched today): GBP posts are descriptive-only (brand, appliance, job type, city), no phone numbers in body text, no promotional claims, Learn more CTA to a published page, no photo captions. Instagram uses 3 to 5 hashtags (the cap is 5). Chino Hills is in San Bernardino County, so no Orange County hashtag is used. Yelp's guidelines prohibit AI drafting or revising content; no Yelp copy is included, and this draft text must not be pasted or adapted for Yelp: any Yelp text must be written by a human. No review solicitation anywhere.

## 1. Chino Hills: Frigidaire refrigerator damper control replacement

Image: `images/real/business/completed-repair-refrigerator-frigidaire-damper-control-chino-hills.jpg`. The photo shows the refrigerator, not the part.

GBP body:

```text
Frigidaire refrigerator damper control replacement for a not-cooling issue. Chino Hills, CA.
```

Learn more: https://fixappliancesfast.com/pages/recent-repairs.html#job-refrigerator-frigidaire-damper-control-chino-hills

Instagram: single image; city tag Chino Hills, CA.

```text
Frigidaire refrigerator damper control replacement for a not-cooling issue in Chino Hills, CA.

#ChinoHillsCA #SanBernardinoCounty #Frigidaire #RefrigeratorRepair #ApplianceRepair
```

## Implementation and publication checklist

- [x] Read current platform policies via `.claude/skills/gbp-platform-policy/SKILL.md`.
- [x] Prepare the job draft from owner-supplied facts only; no invented parts, causes, dates or outcomes.
- [x] Generate the JPEG/WebP derivatives via `npm run photos:import -- --write`; no EXIF in outputs.
- [x] Confirm the destination anchor exists on this branch (`pages/recent-repairs.html`).
- [ ] Verify deployed destination page and anchor before social publication.
- [ ] Human reviews the GBP preview, image, body and Learn more URL.
- [ ] Owner publishes or explicitly authorizes publication, then records GBP status and Instagram results.

Current status: preparation only. No external posts published or scheduled; deployment verification pending.
