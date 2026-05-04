# Create New Content

Scaffold a new article, hub page, or city/service landing page based on user input.

## Step 0 — Read the rules first
Before writing anything, read:
- `.claude/rules/seo-content.md` (brand canonicalization, AI answer block, schema templates, FAQ counts)
- `.claude/rules/mobile-design.md` (breakpoints, hamburger, sticky bar, tap-target sizes)

## Ask the user for (if not already provided):
- **Type**: `article`, `service-hub`, `city-page`, or `page`
- **Title**: the page/article title
- **Slug**: filename without `.html`
  - Article: `article-[appliance]-[city]-[type]` → goes in `articles/`
  - Service hub: `[appliance]-repair-orange-county` → goes in `pages/`
  - City page: `appliance-repair-[city-slug]-ca` → goes in `pages/`
- **Summary**: 1–2 sentence description of the content
- **Topic keywords**: to guide the body content
- **Target city** (for articles and city pages)

## Steps

### 1. Pick the right template
- **Article**: copy structure from `articles/article-fridge-maintenance.html`
- **Service hub** (e.g., refrigerator-repair-orange-county): copy from an existing hub page once one exists; otherwise build from `rules/seo-content.md` schema templates
- **City page**: copy from an existing city page once one exists; otherwise build from rules
- **Page**: copy from the most similar existing `pages/*.html`

### 2. Required content blocks
Every new file must include:
- `<title>` matching the pattern in `seo-content.md`
- Meta description (150–160 chars) — production URLs only (`fixappliancesfast.com`)
- Canonical link, Open Graph tags, Twitter Card tags
- All four JSON-LD schemas (Article OR Service, LocalBusiness, FAQPage, BreadcrumbList) — production URLs
- AI answer block (homepage and hub pages only — see template in `seo-content.md`)
- FAQ section with the right minimum count for page type:
  - Article: 3–5 FAQs
  - Service hub: 8+ FAQs
  - City page: 5+ FAQs (city-specific)
  - Homepage: 10–15 FAQs
- Real testimonials only (no stock-photo placeholders)
- Brand mentions (Whirlpool, GE, Samsung, LG, Sub-Zero, etc.) where contextually relevant
- CTA box and 3 related-article links
- Mobile breakpoints from `rules/mobile-design.md`

### 3. Update related files
- **Article**: add a card to `pages/blog.html`
- **Hub or city page**: add to nav in `index.html` and `shared.css`-using pages; add to footer
- **Any new page**: add an entry to `sitemap.xml` (or run the sitemap builder if it exists)

### 4. Branch and commit
- Create branch: `content/<slug>` (or `feat/<slug>` for a hub page)
- Use placeholder images (`placehold.co`) only as a last resort; prefer real photos or relevant Unsplash images with proper attribution

### 5. Pre-merge verification
- Confirm file is at the correct path
- List all files created/modified
- Run `/test` to verify no broken links and no rendering failures
- Run Schema Markup Validator on the new page (paste URL or HTML)
- Confirm no leftover template strings (`My Blog`, `Lorem`, `TODO`)
- Confirm canonical and OG URLs use `fixappliancesfast.com`
