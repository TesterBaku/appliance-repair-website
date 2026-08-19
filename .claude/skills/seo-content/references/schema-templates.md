# SEO Schema Templates and head-tag Block

Reference file for the seo-content skill. Read this when actually writing or checking a
page's <head> tags or JSON-LD schema, not before (the parent SKILL.md covers when this
applies). Copy the templates below verbatim and fill in the bracketed variables; do not
invent fields.

## Required SEO Elements in Every Article

### `<head>` tags (required — production URLs only)

**`<link rel="canonical">` is mandatory on every new HTML page.** Missing it caused a GSC "Duplicate without user-selected canonical" flag on 4 articles. The `/review` skill treats a missing canonical as a FAIL — same gate as the GA tag. Place it immediately after `<title>`.

```html
<title>[Primary Keyword] | Universal Appliances Repair</title>
<link rel="canonical" href="https://fixappliancesfast.com/[path]" />
<meta name="description" content="[150–160 chars, includes primary keyword and city]" />
<meta name="keywords" content="[5–8 comma-separated keywords]" />

<!-- Open Graph -->
<meta property="og:site_name" content="Universal Appliances Repair" />
<meta property="og:title" content="[Same as <title>]" />
<meta property="og:description" content="[Same as meta description]" />
<meta property="og:type" content="article" />
<meta property="og:url" content="https://fixappliancesfast.com/[path]" />
<meta property="og:image" content="https://fixappliancesfast.com/[1200x630 image]" />
<meta property="article:published_time" content="[ISO date]" />
<meta property="article:modified_time" content="[ISO date]" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="[Same as <title>]" />
<meta name="twitter:description" content="[Same as meta description]" />
<meta name="twitter:image" content="https://fixappliancesfast.com/[1200x630 image]" />
```

### Schema markup (required — inline `<script type="application/ld+json">`)
Every article must include all four schemas:

**1. Article schema**
```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "[Article title]",
  "description": "[Meta description]",
  "author": { "@type": "Organization", "name": "Universal Appliances Repair" },
  "publisher": {
    "@type": "Organization",
    "name": "Universal Appliances Repair",
    "logo": { "@type": "ImageObject", "url": "https://fixappliancesfast.com/logo.png" }
  },
  "datePublished": "[ISO date]",
  "dateModified": "[ISO date]"
}
```

**2. LocalBusiness schema**
```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Universal Appliances Repair",
  "legalName": "Universal Appliances Repair Group Inc.",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "10832 Asbury Avenue",
    "addressLocality": "Stanton",
    "addressRegion": "CA",
    "postalCode": "90680",
    "addressCountry": "US"
  },
  "telephone": "+1-949-629-5365",
  "email": "info@fixappliancesfast.com",
  "areaServed": [
    "Orange County CA", "Stanton CA", "Irvine CA", "Anaheim CA", "Santa Ana CA",
    "Huntington Beach CA", "Costa Mesa CA", "Fullerton CA", "Garden Grove CA",
    "Tustin CA", "Orange CA", "Lake Forest CA", "Mission Viejo CA", "Newport Beach CA"
  ],
  "url": "https://fixappliancesfast.com/"
}
```

**LocalBusiness consistency policy (decided 2026-06-09, resolves audit P3-7).** Every page's `LocalBusiness` node MUST use the shared `"@id": "https://fixappliancesfast.com/#business"` (this is what lets Google merge all pages into one entity) and the canonical NAP — `name`, `legalName`, `address`, `telephone`, `email`, `url` (always the **homepage** `https://fixappliancesfast.com/`, never the page's own URL), `geo`, `areaServed`, `priceRange: "$$"`. Field-placement rules by page type:
- **`openingHoursSpecification`** — use the structured form (not the bare `openingHours` string). It lives authoritatively on the **homepage** and **contact** pages; the shared `@id` propagates it to the merged entity, so org/hub pages don't need to repeat it (they may). Hours are **Mon–Sat 08:00–19:00**; "Sunday by appointment" is visible copy only (not expressible in `OpeningHoursSpecification`).
- **`aggregateRating`** — ONLY on review-bearing pages (homepage, service/brand/city hubs, cost hub, about, testimonials). **Never add it to articles** — Google flags `AggregateRating` without on-page review markup ("Review snippet should have reviews"). Articles carry a lightweight `LocalBusiness` (NAP + geo + priceRange) with no `aggregateRating` and no hours. This split is intentional, not drift.
- **`hasMap`** — optional; points to the GBP listing (`https://www.google.com/maps?cid=6142328803939874574`). Present on the thin-tier city hubs; may be added to other hubs for uniformity.
- **One `LocalBusiness` node per page.** Attach reviews either inline via `LocalBusiness.review[]` or as a separate `ItemList` of `Review` with `itemReviewed: {"@id": ".../#business"}` — never a second `LocalBusiness` block (that was the Lake Forest bug fixed 2026-06-09).

**3. FAQPage schema** (required — every article must have a FAQ section)
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "[Question]",
      "acceptedAnswer": { "@type": "Answer", "text": "[Answer]" }
    }
  ]
}
```

**4. BreadcrumbList schema** (required)
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://fixappliancesfast.com/" },
    { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://fixappliancesfast.com/pages/blog.html" },
    { "@type": "ListItem", "position": 3, "name": "[Article title]", "item": "https://fixappliancesfast.com/articles/[slug].html" }
  ]
}
```

Hub pages additionally include `Service` schema; pages with 6+ verifiable reviews also include `AggregateRating`.

**5. VideoObject schema** (optional — only when a real video is embedded on the page)

```json
{
  "@context": "https://schema.org",
  "@type": "VideoObject",
  "name": "[Video title]",
  "description": "[One sentence describing what the video shows]",
  "thumbnailUrl": "https://fixappliancesfast.com/videos/posters/[slug]-poster.jpg",
  "contentUrl": "https://fixappliancesfast.com/videos/[slug].mp4",
  "uploadDate": "[YYYY-MM-DDT00:00:00+00:00]",
  "duration": "PT[N]S",
  "publisher": {
    "@type": "Organization",
    "name": "Universal Appliances Repair",
    "logo": { "@type": "ImageObject", "url": "https://fixappliancesfast.com/logo.png" }
  }
}
```

**`uploadDate` rule (mandatory):** Always use the full ISO 8601 format with timezone: `"2026-05-14T00:00:00+00:00"`. A date-only value like `"2026-05-14"` fails GSC validation with "missing timezone" and "invalid datetime value". Never omit the `T00:00:00+00:00` suffix.

---
