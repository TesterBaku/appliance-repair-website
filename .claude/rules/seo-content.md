---
# SEO Content Rules
---

## Brand canonicalization (read first)

The business has two names plus a domain. They must never be mixed up.

- **Public business name (use everywhere user-facing):** `Universal Appliances Repair`
- **Legal name (use only in schema `legalName` and the footer copyright line):** `Universal Appliances Repair Group Inc.`
- **Production domain:** `https://fixappliancesfast.com/`

Hard rules:
- Every `<title>`, `og:site_name`, schema `name`, footer brand line, GBP listing, directory citation, llms.txt, and email signature must use **Universal Appliances Repair**.
- Never write "Fix Appliances Fast" as a brand name in HTML or schema. It is only a URL.
- All canonical URLs and schema URLs must use `https://fixappliancesfast.com/...`. The old placeholder domain `universalappliancesrepair.com` is **not** in production — do not emit it in schema, canonical, or OG tags.
- No leftover template/placeholder strings anywhere in HTML: `My Blog`, `Lorem`, `Placeholder`, `Sample`, `TODO`, `FIXME`. CI greps for these.

---

## Target Geography — Orange County Cities

Always include at least one of these cities in every SEO article. Rotate across them to build broad local coverage:

**Primary (highest population/search volume):**
- Anaheim, Santa Ana, Irvine, Huntington Beach, Garden Grove, Fullerton, Orange, Costa Mesa

**Secondary:**
- Newport Beach, Laguna Beach, Mission Viejo, Lake Forest, Yorba Linda, Brea, Laguna Niguel, Tustin, Westminster, Fountain Valley, Buena Park, Cypress, Placentia, La Habra, Seal Beach, San Clemente, Dana Point, Aliso Viejo, Rancho Santa Margarita, Los Alamitos

**Rule:** Never repeat the same city in consecutive articles. Check existing articles before picking a city.

---

## Out-of-Scope Topics

**Never create articles about AC / HVAC / air conditioning.** This includes window units, central air, heat pumps, and any cooling/heating system. AC repair is outside the business scope.

---

## Target Appliances

Cover these appliance types across articles:

| Appliance | Common search terms |
|---|---|
| Refrigerator | fridge repair, refrigerator not cooling, ice maker broken |
| Washer | washing machine repair, washer not spinning, washer leaking |
| Dryer | dryer not heating, dryer repair, dryer takes too long |
| Dishwasher | dishwasher not draining, dishwasher repair, dishwasher leaking |
| Oven / Range | oven not heating, stove burner not working, oven repair |
| Microwave | microwave not heating, microwave repair |
| Garbage Disposal | disposal not working, garbage disposal repair, disposal humming |
| Freezer | freezer not freezing, freezer repair |
| Wine Cooler | wine cooler repair, wine fridge not cooling |

---

## Brands Serviced (use in body copy and schema)

List one or more of these brands by name on every service or city page. Plain text, not images — LLMs read text, not pixels.

Whirlpool, GE, Samsung, LG, Sub-Zero, Wolf, Bosch, Viking, KitchenAid, Maytag, Frigidaire, Kenmore, Thermador, Miele, Dacor.

Rule: never claim "factory authorized" or "certified" for a brand without proof. If unverifiable, write "we service" not "we are authorized for".

---

## SEO Article Types (use as angle for each piece)

| Type | Title Pattern | Intent |
|---|---|---|
| Local service | "[Appliance] Repair in [City], CA — What to Expect" | Transactional |
| How-to / DIY | "How to Fix [Problem] on Your [Appliance]" | Informational |
| Cost guide | "[Appliance] Repair Cost in Orange County (2025 Guide)" | Commercial |
| Symptom guide | "Why Is My [Appliance] [Symptom]? [N] Common Causes" | Informational |
| Maintenance | "[N] [Appliance] Maintenance Tips to Avoid Costly Repairs" | Informational |
| Repair vs Replace | "Repair or Replace Your [Appliance]? A Practical Guide" | Informational |
| Brand-specific | "[Brand] [Appliance] Repair in [City] — Common Issues & Fixes" | Transactional |

---

## Site Architecture — Required Hub Pages

Articles alone cannot rank for high-intent commercial searches. The site must also have **hub pages** at fixed URLs. These are not blog posts — they are evergreen landing pages.

### Per-service hub pages (one per appliance)
Pattern: `pages/[appliance]-repair-orange-county.html`
- `pages/refrigerator-repair-orange-county.html`
- `pages/washer-repair-orange-county.html`
- `pages/dryer-repair-orange-county.html`
- `pages/dishwasher-repair-orange-county.html`
- `pages/oven-stove-repair-orange-county.html`

Each: 1,000–1,500 words. Required sections: hero, AI answer block, common symptoms list, brands serviced, repair process, pricing range guidance, 8+ FAQs, real testimonials, CTA.

### Per-city landing pages (one per Primary OC city)
Pattern: `pages/appliance-repair-[city-slug]-ca.html`
- `pages/appliance-repair-irvine-ca.html`
- `pages/appliance-repair-anaheim-ca.html`
- `pages/appliance-repair-santa-ana-ca.html`
- `pages/appliance-repair-huntington-beach-ca.html`
- `pages/appliance-repair-costa-mesa-ca.html`
- (continue with remaining Primary cities, then Secondary)

Each: 800–1,200 words. Must include: neighborhoods/ZIP codes, recognizable landmarks, services offered in that city, brands serviced, 5+ city-specific FAQs, real local testimonials, CTA.

### Service Areas hub
- `pages/service-areas.html` — links every city served, grouped (Coastal / Central / North OC / South OC). Required for AI engines that look for explicit service-area definitions.

---

## "AI Answer Block" — required on homepage and every hub page

A concise, factual prose block near the top of the page that LLMs (ChatGPT, Claude, Perplexity, Gemini) can lift verbatim when answering "best appliance repair in Orange County."

Rules:
- Plain prose, no marketing fluff, no bullets
- Names the legal entity, services, service area, phone, and booking URL
- Visible HTML, not hidden in JS
- 60–110 words

Template (homepage):
> Universal Appliances Repair Group Inc. provides appliance repair services in Orange County, California, including refrigerator repair, washer repair, dryer repair, dishwasher repair, oven repair, stove repair, freezer repair, and garbage disposal repair. We serve Stanton, Irvine, Anaheim, Santa Ana, Huntington Beach, Costa Mesa, Fullerton, Garden Grove, Tustin, Lake Forest, Mission Viejo, and nearby Orange County cities. Call (949) 629-5365 or book online.

Adapt for service pages (lead with the appliance) and city pages (lead with the city + neighborhoods).

---

## Keyword Strategy

### Primary keyword
Use in: `<title>`, `<h1>`, first paragraph, meta description, URL slug.

Pattern: `[appliance] repair [city] CA` or `[symptom] [appliance] [city]`

### Secondary keywords (3–5 per article)
Use naturally in body text, subheadings, and alt text. Never stuff.

### Long-tail keywords
Include at least 2 question-format phrases that map to FAQ schema sections.

### Recommended SEO positioning phrase (use everywhere)
> Same-day appliance repair in Orange County, CA — refrigerators, washers, dryers, dishwashers, ovens, and stoves.

---

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

---

## Site-wide required files (root)

These three files must exist at the root and return 200:

1. `/robots.txt` — allow crawling, point to sitemap
2. `/sitemap.xml` — every published HTML file, with `lastmod`
3. `/llms.txt` — plain-text business summary for AI crawlers

---

## Article Content Requirements

### Word count
- Minimum: 800 words of body copy
- Target: 1,200–1,800 words
- Longer is better for informational articles; keep transactional articles tighter

### Structure (required sections in order)
1. **Hero** — full-width image, H1 with primary keyword, publish date, read time
2. **Breadcrumb** — Home > Blog > Article Title
3. **Intro paragraph** — 2–3 sentences, includes primary keyword, hooks the reader
4. **Body** — 3–6 sections with H2 subheadings, each targeting a secondary keyword
5. **FAQ section** — 3–5 Q&A pairs matching common search questions (triggers FAQPage schema)
6. **CTA box** — "Need help in [City]? Call us or book online"
7. **Related articles** — 3 links to other blog posts

### FAQ requirements by page type
- **Articles:** 3–5 FAQs
- **Per-service hub pages:** 8+ FAQs covering brands serviced, cost ranges, warranty, same-day availability, repair vs replace, common symptoms
- **City landing pages:** 5+ FAQs specific to that city (response time, neighborhoods, ZIP codes covered)
- **Homepage:** 10–15 FAQs covering same-day, brand-specific (Samsung/LG/Whirlpool), pricing, warranty, online booking, built-in vs freestanding

### Mobile layout (required — see `rules/mobile-design.md`)
- Every article must be fully responsive at 375px width
- Hero text must be readable without horizontal scrolling
- Cards and grid sections must stack vertically on mobile
- Nav must collapse on mobile (hamburger or hidden links)
- CTA box must be full-width on mobile
- Sticky bottom Call/Book bar on mobile (homepage and hub pages — optional on articles)
- Use responsive Tailwind prefixes (`sm:`, `md:`, `lg:`) or `@media` queries in the embedded `<style>` tag

### Writing rules
- Lead with the reader's problem, not company info
- Include the target city naturally 3–5 times (not forced)
- Use real, specific details (repair timelines, part names, symptoms)
- Every section should answer a question the reader has
- No filler phrases ("In conclusion", "It goes without saying")
- **Estimated price ranges are allowed by default on hub pages** (service hubs, brand hubs, city hubs, cost hubs) **and on cost-focused articles** (repair-cost articles, repair-vs-replace guides). Use *ranges* (e.g. "$150–$650"), never flat rates (e.g. "$280"). Prices are estimates, not quotes.
- Every page or section that displays prices **must include this disclaimer verbatim** somewhere on the page (above the table is preferred):

  > *Estimates vary by brand, part availability, and diagnosis. Final quote is provided before repair.*

- Non-cost articles (DIY guides, symptom guides, maintenance guides) should still avoid prices unless cost is integral to the topic.
- `/review` flags as **FAIL**: any flat rate; any cost section missing the disclaimer; any non-cost article with prices but no clear cost-content angle.
- **Service-fee references — tiered rule (2026-05-14):** Two distinct contexts, never mixed:
  1. **Cost-estimate table row** (OC market framing) → always a **range**, tiered by brand:

     | Tier | Cost-table range | Applies to |
     |---|---|---|
     | Standard brands | `$75 – $100` | Service hubs + articles for refrigerator, washer, dryer, dishwasher, oven, freezer, microwave, disposal |
     | Premium brands | `$95 – $150` | Hubs + articles for Sub-Zero, Wolf, Viking, Thermador, Miele |

     Row label: `Service call / diagnostic (generally credited toward repair if you proceed)`

  2. **"Our company fee" statement** (policy framing, anywhere in body copy, FAQ answers, schema, step descriptions) → always flat **`$99`**, regardless of brand tier.

  Never state our fee as a range. Never put a flat value in a cost-table row when surrounding rows are ranges. These two contexts must stay separate.

### Human-like writing rules (required)
- **Never open with a keyword phrase as the subject.** Sentences like "A washing machine not spinning in Huntington Beach is..." or "Refrigerator repair in Santa Ana, CA is..." are unnatural and robotic. Start with the reader's experience instead: "You open the lid and the clothes are still soaking wet." or "Your oven stopped heating right before dinner."
- **Write like you're talking to a neighbor, not optimizing a page.** Use contractions (don't, you'll, it's) where they'd sound natural in speech.
- **Mix sentence lengths.** Short punchy sentences after longer ones create rhythm. Three long sentences in a row reads like a legal document.
- **Be specific, not vague.** "The igniter weakens and can't open the gas valve" is better than "there may be issues with certain components."
- **Don't announce what you're about to do.** Never write "In this article, we will explore..." — just start explaining.
- **Avoid passive voice stacking.** "The belt can be replaced by a technician" → "A technician replaces the belt."
- **City names belong in context, not at the top of every sentence.** "Huntington Beach homeowners" once is fine; using the city in every paragraph signals keyword stuffing to both readers and Google.

---

## Trust signals (required on homepage and all hub pages)

- **Real testimonials only.** Each testimonial must include first name (with last initial as the reviewer displays it on Google — e.g., "Jennifer T." or full "Jennifer Trette" if that's how they appear), location, appliance type where mentioned, and approximate date. No invented names. Pull from Google or Yelp. The canonical pool lives at `data/testimonials.json` and is sourced from the Google Business Profile listing.
- **Location label: "Orange County, CA" by default.** Google Business Profile reviews don't expose the reviewer's city. Use "Orange County, CA" as the location label on every testimonial unless the reviewer's profile or review text names a specific OC city — then use that city. Never invent a city for a reviewer. Source-of-truth for review data is `data/testimonials.json`, which now spans Google and Yelp; the location-label rule is source-specific (see `testimonial-selection.md`).
- **Testimonial reuse across pages.** Each hub page should display 3 testimonials drawn from `data/testimonials.json` (new hubs); existing hubs built with 4–6 are grandfathered. The same testimonial may appear on multiple hub pages (this is normal for a small business with a finite review pool), but no two hubs should share more than 2 testimonials with each other. Prefer testimonials that mention the hub's primary appliance type when available.
- **Bodies verbatim — light editing allowed for clear typos.** Reviews flagged with `bodyHasTypos: true` in `data/testimonials.json` may receive light grammar/spelling correction for display. No paraphrasing or substantive rewording.
- **Photo-only / no-body reviews are not testimonials.** Records with `bodyStatus: "photo-only"` or `"no-body"` in the pool may be used as image sources but never as quoted testimonials.
- **Real photos.** Replace Unsplash hero/service images with photos of the actual technicians, vans, tools, or completed repairs as soon as available. Review photos (appliances customers showed in their reviews) live at `images/real/reviews/`, named `[appliance]-[brand-if-confirmed]-[reviewer-slug].webp`. The `images/real/reviewer-profiles/` path is reserved for genuine reviewer headshots — currently none exist, so the folder is absent from the repo. Never store appliance/repair photos under `reviewer-profiles/`.
- **Owner-uploaded business photos** (technicians, vans, tools, completed-repair shots — not tied to a specific customer review) live at `images/real/business/`, named `[category]-[description].jpg`. Use these as drop-in replacements for Unsplash hero/section imagery.
- **Verifiable badges.** Display contractor license number, EPA Section 608 cert (for refrigerant work), BBB rating + URL, Google Guaranteed if eligible. Never display badges without proof.
- **Aggregate rating in schema.** Once 6+ real reviews exist, add `AggregateRating` JSON-LD pulled from GBP. The pool currently has 76 verified 5-star reviews — `AggregateRating` is required on the homepage and every hub page. Yelp is **not** folded into `AggregateRating` (4-review pool, 4.0 average, mixing sources is discouraged by Google's structured-data guidance). If Yelp is surfaced as a trust signal, do it as a separate visual element ("See our Yelp reviews [link]"), not in schema.
- **Author bios on articles.** Each article's schema `author` must reference a real person/page (`@id` or `sameAs`), not just the org.

---

## Avoiding Duplicate Coverage

Before proposing ideas, check existing articles for:
- Same appliance + same city combination
- Same article type (e.g., two "repair vs replace" articles for the same appliance)

If a city or appliance has already been covered, use a different article type or pair it with a different city.

---

## Slug & File Naming

### Articles
Pattern: `articles/article-[appliance]-[city]-[type].html`

Examples:
- `articles/article-washer-repair-irvine.html`
- `articles/article-dishwasher-cost-orange-county.html`
- `articles/article-fridge-not-cooling-anaheim.html`
- `articles/article-dryer-repair-huntington-beach.html`

### Hub pages
- Service hub: `pages/[appliance]-repair-orange-county.html`
- City hub: `pages/appliance-repair-[city-slug]-ca.html`
- Service Areas hub: `pages/service-areas.html`

Rules:
- All lowercase, hyphens only
- City name: use the city slug (huntington-beach, santa-ana, garden-grove)
- Keep article slugs under 60 characters total; hub-page slugs may run slightly longer but should stay under 80
