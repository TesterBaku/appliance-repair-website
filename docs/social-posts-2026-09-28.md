# September 28, 2026 social posts

Prepared for Universal Appliances Repair. Two GBP/Instagram post pairs, using two real technician photos. **Not published or scheduled.** Both processed image trios exist locally in `images/real/business/`. Website placements and both destination anchors were implemented and verified locally on this branch (`content/jobs-reviews-2026-09-28`); live deployment verification remains pending. Review each platform preview before publishing.

## Evidence and placement

The LG dryer job (Anaheim) is corroborated by a customer's own 5-star Google review posted the same day, which includes a photo of the same dryer and describes the service as same-day and exceptional; see `data/testimonials.json` record `google-j-2026-09` for the full corroboration record. The Samsung dryer job (San Juan Capistrano): the owner-supplied filename read "washer," but the owner corrected this before the batch started, confirming the photo is a Samsung **dryer** that would not turn on, with the control (computer) board replaced. All copy below describes it as a dryer only. San Juan Capistrano has no city hub page on this site, so that job is not placed on a city hub; it still appears on the gallery, the Samsung brand hub, and the dryer appliance hub (see the same appliance hub's job-grid for both jobs).

Use the numbered order below subject to the owner's cadence, without invented service or publication dates beyond what is stated above. For GBP, choose **Update**, attach the selected JPEG and use **Learn more** with the exact destination. For Instagram, use the caption and hashtags together; both cities are legitimate taggable Instagram locations. All image paths are repository-relative. Use the processed JPEGs with metadata removed; no crop was needed for either photo (no faces, addresses, or documents visible).

## Policies checked

Per `.claude/skills/gbp-platform-policy/SKILL.md`: GBP posts are descriptive-only (brand, appliance, job type, city), no phone numbers in body text, Learn more CTA to a published page per owner preference (2026-09-07), no photo captions. Instagram hashtag cap is 5, re-verified live 2026-09-04 in that skill; both captions below use 5. Yelp's guidelines, verified in that skill, prohibit AI drafting or revising reviews or other content; no Yelp copy is included, and this draft text must not be pasted or adapted for Yelp: any Yelp text must be written by a human. No review solicitation anywhere.

## 1. Anaheim: LG dryer no-heat repair

Image: `images/real/business/completed-repair-dryer-lg-not-heating-anaheim.jpg`.

GBP body:

```text
LG dryer no-heat repair. Anaheim, CA.
```

Learn more: https://fixappliancesfast.com/pages/recent-repairs.html#job-dryer-lg-not-heating-anaheim

Instagram: single image; city tag Anaheim, CA.

```text
LG dryer no-heat repair in Anaheim, CA.

#AnaheimCA #OrangeCountyCA #LGAppliances #DryerRepair #ApplianceRepair
```

## 2. San Juan Capistrano: Samsung dryer control board replacement

Image: `images/real/business/completed-repair-dryer-samsung-control-board-san-juan-capistrano.jpg`.

The owner-supplied filename said "washer"; the owner corrected this before the batch started to confirm it is a Samsung dryer that would not turn on, with the control (computer) board replaced. Copy below describes it as a dryer only. San Juan Capistrano has no city hub on this site (see Evidence and placement above), so this job is not placed on a city hub.

GBP body:

```text
Samsung dryer control board replacement. San Juan Capistrano, CA.
```

Learn more: https://fixappliancesfast.com/pages/recent-repairs.html#job-dryer-samsung-control-board-san-juan-capistrano

Instagram: single image; city tag San Juan Capistrano, CA.

```text
Samsung dryer control board replacement in San Juan Capistrano, CA.

#SanJuanCapistranoCA #OrangeCountyCA #SamsungAppliances #DryerRepair #ApplianceRepair
```

## Implementation and publication checklist

- [x] Read current platform policies via `.claude/skills/gbp-platform-policy/SKILL.md` (GBP re-verified 2026-08-19 in that skill; Instagram hashtag cap re-verified live 2026-09-04 in that skill).
- [x] Prepare both job drafts from owner-supplied filenames plus the owner's direct correction (Samsung job) and the corroborating customer review (LG job); no invented parts, dates, or outcomes beyond what is stated above.
- [x] Generate both JPEG/WebP derivatives via `npm run photos:import -- --write`; verify local existence via the import report and no EXIF.
- [x] Confirm both destination anchors exist on this branch (`pages/recent-repairs.html`).
- [ ] Verify deployed destination pages and anchors before social publication.
- [ ] Human reviews each GBP preview, image, body and Learn more URL.
- [ ] Owner publishes or explicitly authorizes publication, then records GBP status and Instagram result.

Current status: preparation only. No external posts published or scheduled; deployment verification pending.
