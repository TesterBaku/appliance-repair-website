# Review-batch validation

Use `npm run reviews:check` for a fast, read-only check of `data/testimonials.json`.
It checks unique IDs, required name/rating/body fields, declared sources, source counts, and the distinction between Google's listing,
captured and published totals. A retained historical pool may exceed the live listing
after Google removes reviews; that produces a warning, not a fabricated count change.

For a new capture batch, create a private manifest under `.audits/work/<dated-task>/`:

```json
{
  "capturedReviewIds": ["google-reviewer-one", "google-reviewer-two"],
  "quotedReviewIds": ["google-reviewer-one"],
  "observedGoogleTotal": 128,
  "evidence": [
    {
      "file": "screenshot.png",
      "sha256": "replace-with-the-actual-64-character-sha256",
      "reviewIds": ["google-reviewer-one", "google-reviewer-two"],
      "reviewedByHuman": true
    }
  ]
}
```

The IDs and count above are illustrative, not current source data. Evidence file paths
are relative to the manifest, or absolute paths to owner-supplied screenshots. Keep
personal paths and screenshots out of committed examples. Calculate the actual hash
with `Get-FileHash -Algorithm SHA256 -LiteralPath <screenshot-path>` on Windows.

```powershell
npm.cmd run reviews:check -- --batch .audits/work/<dated-task>/review-batch.json
```

Set `reviewedByHuman` only after someone has visually compared the reviewer's name,
stars, exact body, attached-photo attribution and listing total with the screenshot.
The validator recognizes PNG, JPEG and WebP file signatures, then checks file hashes
and ID coverage. It does not decode image contents or perform OCR. It cannot read or authenticate a
screenshot, verify customer consent, or establish that a profile's photo count means
the review has an attached photo.

Every captured review must have hash-matched, human-reviewed evidence. Quoted IDs must
belong to that batch and pass the mechanical quality floor in
`.claude/skills/testimonial-selection/SKILL.md`: a complete five-star body with a photo
reference and at least two words, at least eight words without a photo, or a shorter
body naming a listed appliance or brand. The text match is a candidate check, not a
semantic judgment. Ambiguous short uses of "range" are handled conservatively: clear
equipment or repair wording is required, rather than phrases such as "a wide range
of services." Confirm that the named item was actually the subject of the review
and that a photo reference represents a usable review photo. `profilePhoto` never
qualifies as repair evidence. Short, ineligible reviews can remain captured with no
entry in `quotedReviewIds`.

Exit 0 means the requested checks passed; exit 1 means an invalid input or failed check.
Output is JSON, including eligibility reasons and limitations. No pool, HTML, count,
or evidence file is modified. `--data path/to/pool.json` supports an alternative pool
for testing. Running without `--batch` does not verify screenshot provenance.

Continue using the existing weekly runbook, `tasks/runbook-weekly-review-batch.md`,
for capture and publication. This helper does not replace it or change its cadence.
Use the existing `npm run build:review-counts -- --publish` only at the authorized
publish step. Existing `npm test` checks still own rendered quote/schema consistency,
hub reuse, published count surfaces, and testimonial-card totals.
