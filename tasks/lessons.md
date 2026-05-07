# Lessons

Patterns learned from corrections and incidents. Applied to future work automatically.

---

## Always include `<link rel="canonical">` on every new HTML page at creation time

The site had 62 HTML pages and 4 were missing canonicals — all four were articles created before the canonical convention was established. The GSC report flagged at least one as "Duplicate without user-selected canonical."

**Rule:** Every new `.html` file — article, hub page, or static page — must include a canonical tag in `<head>` immediately after `<title>`. Placement: after `<title>`, before Google Fonts or any other `<link>`.

**Gate:** `/review` and `/seo-blog` must grep for `rel="canonical"` on every changed `.html` file. A new page missing a canonical is a **FAIL** — same level as a missing GA tag.

```html
<link rel="canonical" href="https://fixappliancesfast.com/[path-to-file]" />
```

Fixed by PR that addressed GSC indexing issue (2026-05-06).
