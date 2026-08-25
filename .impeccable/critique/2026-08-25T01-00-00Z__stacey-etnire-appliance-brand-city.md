# Impeccable Critique: Stacey Etnire's appliance, brand and city

> ## WITHDRAWN AFTER REVIEW. The change this critique scored is no longer in the PR.
>
> Both assessments below examined a diff that set `appliance='washer'`, `brand='Samsung'` and
> `location='Mission Viejo, CA'` under testimonial-selection Exception 2. Independent review
> rejected that evidence and was right, so all three fields were reverted to their captured values
> and the PR now carries only the finding.
>
> **Neither assessment was wrong about what it measured**, and that is the point worth keeping.
> Assessment B's browser evidence (the renamed image loads, decodes 768x338, 0 of 30 requests 404,
> the filter buckets move 21/32/115) was all accurate. Assessment A's P2, that the card claimed a
> specificity its own visible proof did not show, was pointing straight at the real defect. **I read
> it as a presentation trade-off and argued it away**; the reviewer read the same gap as an evidence
> failure and went and checked the photographs. Assessment A got there first and I did not listen.
>
> What the photographs showed, at full magnification: the shared black service sticker is Samsung's
> GENERIC product-support label, register-product / read-manual / headset icons plus a QR, factory
> applied in the same position on every unit of the model line, not a serial plate. The code beneath
> the QR is illegible in both images. The review photo is a close crop whose only non-appliance
> content is a narrow, out-of-focus strip of textured tan surface at the right edge, with no shape
> or fitting to match, so the "same visible surroundings" half of Exception 2 Part 1 gets no
> purchase. The match is consistent with the same unit; it does not establish it. That left the
> owner's say-so doing both of the rule's two jobs, which is the exact failure it names.
>
> **Corrected after a second review pass.** This banner first said the review photo had no
> surroundings in frame at all. It does have some, and the reviewer went and looked. Nothing about
> the conclusion moves, since the strip is featureless, but overstating a finding in the corrective
> direction is the same failure as the overstatement being corrected, so it is fixed here and in the
> record rather than quietly smoothed.
>
> The scores below are left as they were recorded rather than restated, because a critique of a
> withdrawn change is a record of what was thought at the time, not a verdict on what shipped.

**Date:** 2026-08-25
**Branch:** `content/stacey-etnire-mission-viejo`
**Target:** `pages/testimonials.html` (the only rendered file in the diff)

**Provenance:** NOT degraded. Assessment A and Assessment B ran as two isolated, parallel
sub-agents, neither seeing the other's output.

**Score: 32/40.** 0 P0, 0 P1, 1 P2, 1 P3. Nothing fixed, and the reasons are below.

---

## Assessment A: Design Review

| # | Heuristic | Score |
|---|---|---|
| 1 | Visibility of system status | 3/4 |
| 2 | Match system / real world | 3/4 |
| 3 | User control and freedom | 3/4 |
| 4 | Consistency and standards | 4/4 |
| 5 | Error prevention | 3/4 |
| 6 | Recognition over recall | 4/4 |
| 7 | Flexibility and efficiency | 3/4 |
| 8 | Aesthetic and minimalist design | 3/4 |
| 9 | Error recovery | 3/4 |
| 10 | Help and documentation | 3/4 |
| | **Total** | **32/40** |

**AI slop verdict: clean.** The visible copy change is 21 characters of role label.

### The role label lands exactly on the existing convention

Assessment A read the neighbouring cards and found the established shape for a brand-identified
card is `[Brand] [Appliance] Repair`:

- Cindi Nichols: `Verified Customer`
- Kathleen Street: `Dryer Repair`
- Ahmed El Korashy: `LG Washer Repair`
- Eleonora Abukova: `KitchenAid Refrigerator Repair`
- Raymond Olinger: `Samsung Refrigerator Repair`

`Samsung Washer Repair` is the same shape as Raymond Olinger's label one card away. No new label
grammar was invented; the generic fallback was replaced by the specific convention that already
existed for records where the appliance is known.

### Findings

**[P2] The card now claims a specificity its own visible proof does not show. INTRODUCED.
NOT FIXED, deliberately.**
The card reads "Samsung Washer Repair", but neither the quote ("Great service and very
informative") nor the review photo gives a visitor a visible reason to believe "Samsung" or
"washer": the photo is a close crop of a plain white panel with a service label and no wordmark.
The claim is true and is backed by a corroborating job photo plus a dated owner attestation, but
that corroboration lives in `data/testimonials.json` and is invisible on the rendered page. A
reader who zooms the photo looking for the badge will not find one.

Assessment A raised this and explicitly did not recommend changing it, and neither do I. The
alternative is to keep publishing "Verified Customer" on a record whose appliance and brand we now
actually know, which is worse: it withholds true information from every reader to avoid a doubt
only a zooming skeptic would form. Alt text and labels describe what a thing *is*, not only what a
naive viewer could deduce from the pixels. Recorded rather than fixed.

**[P3] The alt text names a brand not legible in its own image. PRE-EXISTING pattern, extended.
NOT FIXED.**
Same root cause, scoped to the alt attribute. Assessment A notes the site already does this:
`washer-lg-ahmed-el-korashy.webp`'s alt names "LG" for a crop where the branding is marginal at
best. It also notes this is **not** a differential accessibility harm, because a sighted visitor
inspecting the photo is in exactly the same position as a screen-reader user hearing the alt. If
this is worth tightening it is a site-wide `testimonial-selection` rule change, not a one-card
patch.

### Settled decision, checked and not re-raised

`.claude/skills/testimonial-selection/SKILL.md`, "add cards in multiples of 3, and accept the
orphan when you cannot": the owner ruled twice, on 2026-08-11 and again on 2026-08-12, that a
stranded trailing card on this page is accepted, in the unfiltered view **and** in filtered views,
and that neither the flexbox nor the JS fix is to be proposed again. Both filtered buckets here
leave a partial trailing row. Cited and moved on. This diff changes no card count, so it could not
have worsened it either way.

### Strengths

1. All three changed surfaces move together and land on conventions that already existed, rather
   than inventing new ones.
2. The blast radius is right: one card's three attributes. The pill counts, the empty-state copy,
   the JSON-LD and the other 114 cards are untouched.
3. The provenance is traceable in the data file, which is what makes the P2 a "the reader cannot
   see the proof" gap rather than a "the claim is unfounded" problem.

---

## Assessment B: Detector + Browser Evidence

**Detector:** 1 finding, `em-dash-overuse`, 7 em dashes in body text. **Verified pre-existing:**
the identical finding comes back from `git show master:pages/testimonials.html`. Engine
sanity-checked against `index.html`, which returned 2 findings, so the result is genuine.

**That finding does not describe a rule violation here, and it is worth saying why rather than
letting it sit as an unexplained detector hit.** All 7 em dashes were located and every one is
inside verbatim customer review text, in a `reviewBody` or a `.t-quote`. This project's em-dash ban
exempts customer review body text explicitly, because those are reproduced as written. The
detector's rule is the upstream generic one and has no concept of that exemption. The diff itself
adds 0 em dashes.

**Browser measurements, 1440x900 and 375x812:**

| Check | Desktop | Mobile |
|---|---|---|
| Stacey's image loads | yes | yes |
| naturalWidth x naturalHeight | 768x338 | 768x338 |
| Declared `width`/`height` | 768/338, match | 768/338, match |
| Rendered box | 80x80 | 80x80 |
| Images on page / broken | 20 / 0 | 20 / 0 |
| Network 404s | 0 of 30 requests | 0 |
| Horizontal overflow | none (1425/1425) | none (360/360) |
| Console errors / warnings | 0 / 0 | 0 / 0 |

The renamed file returned 200 on desktop and 304 on mobile. **The rename is the highest-risk item
in this diff** (a missed reference renders an empty box and no static gate catches it), which is
why it was checked in a browser rather than by grep alone.

**Filter behaviour, clicked in the browser:**

| Filter | Visible cards | Stacey's card |
|---|---|---|
| Washer | 21 | visible |
| General | 32 | hidden |
| All | 115 | n/a, total unchanged |

**Image file:** `sharp` reports 768x338 webp, matching the declared attributes. The old filename is
absent from disk, and no live path anywhere still references it; the only remaining mentions are
inside the narrative `_note` and `captureHistory` prose that documents the rename.

**Defects: none.**

**Teardown:** port 4173 was already held by an unrelated pre-existing `serve` (PID 44820), so the
launch fell back to port 65408. The listener there, PID 27464, had its command line re-verified via
`Get-CimInstance Win32_Process` immediately before the kill and was confirmed gone after, with no
orphaned parent. Every other `serve`, `node`, Playwright and MCP process on the machine was left
untouched, matched by exact PID and port ownership and never by command-line substring.
`browser_close` called; two stray `.playwright-mcp` snapshots deleted.

---

## Correction to Assessment A, caught before it was quoted anywhere

Assessment A reported the washer filter bucket as **29 cards**. It is **21**. Recounted twice,
independently: once here by parsing every `.t-card` div and splitting multi-value `data-category`
attributes, and once by Assessment B, which clicked the pill in a live browser and counted 21
visible cards. Assessment B's figure and this recount agree; Assessment A's does not. Its
`general` figure of 32 was correct.

The move itself was verified against master rather than assumed: `general` 33 to 32, `washer` 20 to
21, total unchanged at 115. Exactly one card moved and nothing else shifted.

**This is the point of the rule written into yesterday's Corona snapshot and again into this
morning's job-photo snapshot: re-derive every count you copy, including from an assessment you
commissioned yourself.** The difference this time is that the recount happened *before* the number
reached a PR body or a commit message, which is the first time in this session that loop closed
early instead of after a reviewer caught it.
