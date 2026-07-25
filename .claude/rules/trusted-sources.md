# Standing Rule — Trusted Web Sources (read access is pre-authorized)

Read-only web access (WebSearch + WebFetch) is granted standing permission in
`.claude/settings.json` so research does not stall on per-site permission prompts. Subagents
frequently cannot answer such prompts, so an un-allowed fetch fails silently and quietly
weakens the research. In exchange for that standing access, source **quality** is governed by
judgment, per this rule. Owner-approved 2026-07-25.

## Scope of the standing permission

- **Covered (no confirmation needed):** `WebSearch`, and `WebFetch` that only READS a page (a
  plain GET of public content).
- **NOT covered — still ask first:** anything that writes to or acts on an external service:
  submitting a form, logging in, posting, purchasing, sending a message, or hitting a URL that
  performs a state-changing action. External-publishing rules elsewhere still apply in full
  (see `gbp-platform-policy.md`); this rule does not loosen them.

## Use only official or well-established sources

When gathering facts that will go into site content (error codes, part names, specs, pricing
context, how-to steps), derive them from:

1. **Official / manufacturer** — the brand's own domain and support/help pages (e.g. `lg.com`,
   `samsung.com`, `whirlpool.com`, `bosch-home.com`, `subzero-wolf.com`, `geappliances.com`),
   plus official standards, government, and OEM service documentation.
2. **Well-established, reputable references** — long-standing, editorially-maintained sites with
   a track record: major appliance-parts retailers with technician-reviewed content
   (RepairClinic, PartSelect, Sears PartsDirect), iFixit, established trade/industry
   publications, and major reference works.

**Cross-check every published factual claim against at least TWO independent sources of this
quality.** Manufacturer + one reputable reference is the standard bar (the pattern the N5
error-code research used).

## Do NOT treat as authoritative

Forums and Q&A boards (Reddit, JustAnswer, Quora), social posts, AI-generated content farms,
document dumps (Scribd and similar), and unknown / low-reputation blogs are fine as **leads** —
finding what people actually ask, or spotting a candidate error code to then verify — but never
as the **sole** source for a fact published on the site. Anything found only in these must be
confirmed against an official or well-established source before it is used.

## Accuracy over completeness

If a fact cannot be confirmed against a trusted source, leave it out rather than publish it. A
missing detail is better than a wrong error-code meaning or an invented spec — the same spirit
as "a missing image is better than a wrong image" in the SEO rules.
