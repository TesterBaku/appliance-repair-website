# October 6, 2026 social posts

Prepared for Universal Appliances Repair. One GBP/Instagram post pair, using one real technician photo. **Not published or scheduled.** The processed image trio exists locally in `images/real/business/`. Website placements and the destination anchor were implemented and verified locally on this branch (`content/job-photo-2026-10-06-kitchenaid-fridge-brea`); live deployment verification remains pending. Review each platform preview before publishing.

## Evidence and placement

The only facts supplied by the owner are: KitchenAid refrigerator, water leak, Brea, CA. No date, cause, part, model number or customer detail was provided, and none is stated anywhere below. The photo shows a stainless built-in side-by-side refrigerator in a kitchen, with its water and ice dispenser panel removed and the wiring exposed. It is placed on the recent-repairs gallery, the Brea city hub (a new "Recent Job in Brea" section), the KitchenAid brand hub, and the refrigerator appliance hub.

For GBP, choose **Update**, attach the processed JPEG and use **Learn more** with the exact destination. For Instagram, use the caption and hashtags together; tag the city (Brea, CA), never a customer's home, and confirm the place tag exists in Instagram's location search before posting (not checked here). All image paths are repository-relative. Use the processed JPEG with metadata removed; no crop was needed (no faces, addresses, documents or readable screens visible; the phone on the counter shows nothing readable).

## Policies checked

Per `.claude/skills/gbp-platform-policy/SKILL.md`: GBP posts are descriptive-only (brand, appliance, job type, city), no phone numbers in body text, Learn more CTA to a published page per owner preference (2026-09-07), no photo captions. Google's post content policy (`support.google.com/business/answer/7213077`) was re-read on 2026-10-06: it still says posts with unverified contact information such as phone numbers may be removed, and its only categorical promotions ban is for hotels; the house descriptive-only rule stays in force. Instagram hashtag cap is 5, last verified in a real browser on 2026-09-04 per that skill (not re-checked today; the help page is JS-rendered); the caption below uses 5. Yelp's guidelines, verified in that skill, prohibit AI drafting or revising content; no Yelp copy is included, and this draft text must not be pasted or adapted for Yelp: any Yelp text must be written by a human. No review solicitation anywhere.

## 1. Brea: KitchenAid refrigerator water leak repair

Image: `images/real/business/completed-repair-refrigerator-kitchenaid-water-leak-brea.jpg`.

GBP body:

```text
KitchenAid refrigerator water leak repair. Brea, CA.
```

Learn more: https://fixappliancesfast.com/pages/recent-repairs.html#job-refrigerator-kitchenaid-water-leak-brea

Instagram: single image; city tag Brea, CA.

```text
KitchenAid refrigerator water leak repair in Brea, CA.

#BreaCA #OrangeCountyCA #KitchenAid #RefrigeratorRepair #ApplianceRepair
```

## Implementation and publication checklist

- [x] Read current platform policies via `.claude/skills/gbp-platform-policy/SKILL.md`; GBP post content policy re-read 2026-10-06.
- [x] Prepare the job draft from owner-supplied facts only; no invented parts, causes, dates, or outcomes.
- [x] Generate the JPEG/WebP derivatives via `npm run photos:import -- --write`; verify local existence via the import report and no EXIF.
- [x] Confirm the destination anchor exists on this branch (`pages/recent-repairs.html`).
- [ ] Verify deployed destination page and anchor before social publication.
- [ ] Human reviews the GBP preview, image, body and Learn more URL.
- [ ] Owner publishes or explicitly authorizes publication, then records GBP status and Instagram result.

Current status: preparation only. No external posts published or scheduled; deployment verification pending.
