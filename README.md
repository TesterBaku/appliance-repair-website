# Universal Appliances Repair — Website

Static HTML website for [Universal Appliances Repair](https://universalappliancesrepair.com), an appliance repair service based in Orange County, CA.

## Tech Stack

- **HTML** — no build step, no framework
- **Tailwind CSS** — loaded via CDN
- **Puppeteer** — visual screenshot tests
- **Husky** — pre-push git hooks

## Project Structure

```
index.html              # Homepage
pages/
  about.html
  services.html
  contact.html
  faq.html
  testimonials.html
  blog.html             # Blog listing page
articles/
  article-*.html        # Individual SEO blog articles
shared.css              # Shared styles
test/
  links.js              # Internal link checker
  screenshot.js         # Puppeteer page screenshots
scripts/
  add-seo-improvements.js  # Automated SEO schema/meta fixer
```

## Getting Started

```bash
npm install
npm start        # Serve locally at http://localhost:3000
```

## Tests

```bash
npm test              # Check all internal links
npm run screenshot    # Screenshot every page with Puppeteer
```

Both must pass before merging any PR.

## Content Automation

SEO blog articles are published automatically via Claude Code routines:

| Schedule | What it does |
|---|---|
| Mon / Wed / Fri at 6 AM Pacific | Researches, writes, and merges 3 new articles |
| 1st of Jan, Apr, Jul, Oct at 6 AM Pacific | Quarterly SEO audit — fixes schema gaps, opens a review PR |

Articles target Orange County cities and cover appliance repair topics (refrigerator, washer, dryer, dishwasher, oven, microwave, garbage disposal, freezer, wine cooler). AC/HVAC topics are out of scope.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for branch naming, commit format, PR template, and code review rules.

All changes — including small edits — must go through a PR. No direct commits to `master`.
