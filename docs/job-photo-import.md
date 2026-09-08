# Job photo import

Use `scripts/import-job-photos.js` to turn owner-supplied job photos into the image trio used by the site: a full-size progressive JPEG, a full-size WebP, and a WebP capped at 480 pixels wide. The script auto-orients each source before applying an optional crop and strips EXIF metadata from every output.

Create a UTF-8 JSON manifest (with or without a byte-order mark). Relative source paths resolve from the manifest's directory, while absolute source paths may point outside the repository (for example, to an owner's Downloads folder).

```json
{
  "jobs": [
    {
      "source": "./washer-source.jpeg",
      "base": "completed-repair-washer-lg-drain-pump-ladera-ranch",
      "privacyReviewed": true,
      "crop": { "left": 40, "top": 20, "width": 1200, "height": 900 }
    }
  ]
}
```

`privacyReviewed: true` is a human attestation. Add it only after checking the photo for faces, addresses, documents, reflections, location clues, and other private material. The importer never infers or adds this approval.

Run a dry run first:

```powershell
npm run photos:import -- C:\path\to\manifest.json
```

Dry run is the default. It validates every entry and writes only a JSON evidence report under `.audits/work/job-photo-import/`. It checks the whole batch for invalid manifests, missing or unreadable inputs, duplicate bases, duplicate normalized source-path/crop combinations, invalid or out-of-bounds crops, unsafe output names, and existing destination files. Duplicate detection does not identify identical photos stored at different paths. Nothing is imported when any preflight check fails.

After reviewing the planned paths and dimensions, write the images explicitly:

```powershell
npm run photos:import -- C:\path\to\manifest.json --write
```

The default image directory is `images/real/business`. `--output <path>` may select another directory for testing, but it must remain inside a workspace subdirectory. `--report <path.json>` similarly selects a workspace-local report. Neither option may resolve through a link outside the workspace or into `.git`, `.agents`, `.claude`, `.codex`, or `node_modules`. Existing images and reports are never overwritten.

The report records a SHA-256 hash of each source. A write run reads each source once and encodes all three variants from that same byte snapshot, so a source change during the run cannot produce mismatched variants. Each output entry records its own SHA-256 hash, dimensions and byte size from the actual encoded file, then verifies that the file contains no EXIF. The `-480w.webp` file uses `withoutEnlargement`, so a source narrower than 480 pixels keeps its actual width; use the report's `outputs` values in HTML rather than assuming it is 480 pixels wide.

If encoding or report creation fails after output paths have been reserved, the importer removes only the new files it reserved for that run. It does not delete or replace pre-existing files. The importer does not decide whether a photo is suitable for publication, add HTML, or optimize visual composition beyond the explicit crop.
