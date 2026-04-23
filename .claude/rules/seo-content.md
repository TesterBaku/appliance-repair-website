---
# SEO Content Rules
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
| HVAC / AC | AC repair Orange County, air conditioner not cooling |

---

## SEO Article Types (use as angle for each piece)

| Type | Title Pattern | Intent |
|---|---|---|
| Local service | "[Appliance] Repair in [City], CA — What to Expect & Cost" | Transactional |
| How-to / DIY | "How to Fix [Problem] on Your [Appliance]" | Informational |
| Cost guide | "[Appliance] Repair Cost in Orange County (2025 Guide)" | Commercial |
| Symptom guide | "Why Is My [Appliance] [Symptom]? [N] Common Causes" | Informational |
| Maintenance | "[N] [Appliance] Maintenance Tips to Avoid Costly Repairs" | Informational |
| Repair vs Replace | "Repair or Replace Your [Appliance]? A Practical Guide" | Informational |
| Brand-specific | "[Brand] [Appliance] Repair in [City] — Common Issues & Fixes" | Transactional |

---

## Keyword Strategy

### Primary keyword
Use in: `<title>`, `<h1>`, first paragraph, meta description, URL slug.

Pattern: `[appliance] repair [city] CA` or `[symptom] [appliance] [city]`

### Secondary keywords (3–5 per article)
Use naturally in body text, subheadings, and alt text. Never stuff.

### Long-tail keywords
Include at least 2 question-format phrases that map to FAQ schema sections.

---

## Required SEO Elements in Every Article

### `<head>` tags (required)
```html
<title>[Primary Keyword] | Universal Appliances Repair</title>
<meta name="description" content="[150–160 chars, includes primary keyword and city]" />
<meta name="keywords" content="[5–8 comma-separated keywords]" />
<link rel="canonical" href="https://universalappliancesrepair.com/[slug].html" />
<meta property="og:title" content="[Same as <title>]" />
<meta property="og:description" content="[Same as meta description]" />
<meta property="og:type" content="article" />
```

### Schema markup (required — inline `<script type="application/ld+json">`)
Every article must include all three schemas:

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
    "logo": { "@type": "ImageObject", "url": "https://universalappliancesrepair.com/logo.png" }
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
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "[Target city]",
    "addressRegion": "CA",
    "addressCountry": "US"
  },
  "telephone": "+1-949-555-0100",
  "areaServed": "Orange County, CA",
  "url": "https://universalappliancesrepair.com"
}
```

**3. FAQPage schema** (only when article has FAQ section)
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

### Mobile layout (required)
- Every article must be fully responsive at 375px width
- Hero text must be readable without horizontal scrolling
- Cards and grid sections must stack vertically on mobile
- Nav must collapse on mobile (hamburger or hidden links)
- CTA box must be full-width on mobile
- Use responsive Tailwind prefixes (`sm:`, `md:`, `lg:`) or `@media` queries in the embedded `<style>` tag

### Writing rules
- Lead with the reader's problem, not company info
- Include the target city naturally 3–5 times (not forced)
- Use real, specific details (repair timelines, part names, symptoms)
- Every section should answer a question the reader has
- No filler phrases ("In conclusion", "It goes without saying")
- No dollar amounts or price ranges (unless cost content is explicitly approved for the run)

### Human-like writing rules (required)
- **Never open with a keyword phrase as the subject.** Sentences like "A washing machine not spinning in Huntington Beach is..." or "Refrigerator repair in Santa Ana, CA is..." are unnatural and robotic. Start with the reader's experience instead: "You open the lid and the clothes are still soaking wet." or "Your oven stopped heating right before dinner."
- **Write like you're talking to a neighbor, not optimizing a page.** Use contractions (don't, you'll, it's) where they'd sound natural in speech.
- **Mix sentence lengths.** Short punchy sentences after longer ones create rhythm. Three long sentences in a row reads like a legal document.
- **Be specific, not vague.** "The igniter weakens and can't open the gas valve" is better than "there may be issues with certain components."
- **Don't announce what you're about to do.** Never write "In this article, we will explore..." — just start explaining.
- **Avoid passive voice stacking.** "The belt can be replaced by a technician" → "A technician replaces the belt."
- **City names belong in context, not at the top of every sentence.** "Huntington Beach homeowners" once is fine; using the city in every paragraph signals keyword stuffing to both readers and Google.

---

## Avoiding Duplicate Coverage

Before proposing ideas, check existing articles for:
- Same appliance + same city combination
- Same article type (e.g., two "repair vs replace" articles for the same appliance)

If a city or appliance has already been covered, use a different article type or pair it with a different city.

---

## Slug & File Naming

Pattern: `article-[appliance]-[city]-[type].html`

Examples:
- `article-washer-repair-irvine.html`
- `article-dishwasher-cost-orange-county.html`
- `article-fridge-not-cooling-anaheim.html`
- `article-dryer-repair-huntington-beach.html`

Rules:
- All lowercase, hyphens only
- City name: use the city slug (huntington-beach, santa-ana, garden-grove)
- Keep under 60 characters total
