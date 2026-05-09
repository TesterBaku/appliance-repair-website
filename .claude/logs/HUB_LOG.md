# Hub Page Log

Running log of every `/seo-hub` run. PRs are open for owner review; hub pages never auto-merge.

---

## May 09, 2026 — brand hub: thermador-appliance-repair-orange-county

**Type:** service (brand-vertical)
**Target:** Thermador
**PR:** [#262](https://github.com/TesterBaku/appliance-repair-website/pull/262) — open, awaiting owner review
**Word count:** ~1,400
**FAQ count:** 8
**Models featured:** 6 Thermador product lines (Pro Grand/Harmony ranges, Masterpiece ovens, Sapphire dishwashers, Freedom Column fridges, Star Burner cooktops, CIT induction)
**Testimonials:** 5 (D Light, Elvin Mammadov, Clifford Wright, Laurie Summers, Mark Koss)
**Internal links wired:** services.html, oven-stove hub, dishwasher hub, Sub-Zero/Wolf/Miele/Viking hubs, 2 oven articles, sitemap.xml
**Schemas:** Service (with brand), LocalBusiness, BreadcrumbList, FAQPage, AggregateRating, 5x Review

**Outstanding for owner:**
- Hero photo: reuses oven-stainless-range.jpg -- replace with Thermador-specific photo
- Cost ranges are industry estimates -- review before merge

**Phase 0 highlights:**
- L-2 program -- 5th and final PR. All 5 brand hubs fully cross-linked to each other.

---

## May 09, 2026 — brand hub: sub-zero-appliance-repair-orange-county

**Type:** service (brand-vertical)
**Target:** Sub-Zero
**PR:** [#257](https://github.com/TesterBaku/appliance-repair-website/pull/257) — open, awaiting owner review
**Word count:** ~1,400
**FAQ count:** 8
**Models featured:** 6 Sub-Zero product lines (BI Series, 700 Series, 400 Series, PRO 48, Designer, Classic)
**Common issues:** 8
**Testimonials:** 5 (from data/testimonials.json — 0 invented)
**Internal links wired:** services.html, refrigerator hub, article-fridge-repair-garden-grove, article-wine-cooler-repair-newport-beach, sitemap.xml
**Schemas:** Service (with brand field), LocalBusiness, BreadcrumbList, FAQPage, AggregateRating, 5x Review

**Outstanding for owner:**
- Hero photo: reuses fridge-sidebyside.jpg — replace with Sub-Zero built-in photo when available
- Cost ranges are industry estimates — review against actual job records before merge
- Wolf/Miele/Viking/Thermador cross-links temporarily point to services.html (update in PRs #2–5)

**Phase 0 highlights:**
- L-2 luxury brand hubs program — first of 5 sequential PRs
- Pricing rule update (PR #256) applied before this PR: cost ranges now allowed by default on all hub pages
- Testimonial pool was exhausted for fridge-specific reviews (all at cap from city/service hubs); relaxed appliance filter to pick 5 general-quality reviews
- Brian Brassil (bodyHasTypos: true): light correction applied — "ARE PRIDGE" → "our fridge", case normalized. Pool raw body unchanged.
- Susan Gerakos: pool name normalized from "susan gerakos" to "Susan Gerakos" (GBP scrape artifact)

---

## May 09, 2026 — city hub: appliance-repair-newport-beach-ca

**Type:** city
**Target:** Newport Beach, CA
**PR:** [#247](https://github.com/TesterBaku/appliance-repair-website/pull/247) — open, awaiting owner review
**Word count:** ~1,000
**FAQ count:** 7
**Internal links wired:** service-areas.html, article-wine-cooler-repair-newport-beach.html, article-lg-fridge-repair-laguna-beach.html, sitemap.xml
**Schemas:** LocalBusiness, BreadcrumbList, FAQPage, Service, 5x Review, AggregateRating

**Outstanding for owner:**
- Hero image reuses homepage photo — replace with coastal OC kitchen photo when available (P4-1)

**Phase 0 highlights:**
- Competition: HIGH (Caesar's 50yr, Mr. Appliance, D&V Sub-Zero specialist)
- Structural gaps: luxury brand specificity (Sub-Zero/Wolf/Thermador), neighborhood precision (Balboa Peninsula/Island/CDM by name + ZIP), AI answer block absent from all competitors
- Testimonials (all at cap after this PR): Lilya Raupova (Sub-Zero fridge), Molla Islam, Tony Tomassini, Dave Brisbin, Steve D

---

## May 09, 2026 — city hub: appliance-repair-mission-viejo-ca

**Type:** city
**Target:** Mission Viejo, CA
**PR:** [#248](https://github.com/TesterBaku/appliance-repair-website/pull/248) — open, awaiting owner review
**Word count:** ~1,000
**FAQ count:** 7
**Internal links wired:** service-areas.html, article-microwave-not-heating-mission-viejo.html, article-oven-repair-laguna-niguel.html, sitemap.xml
**Schemas:** LocalBusiness, BreadcrumbList, FAQPage, Service, 5x Review, AggregateRating

**Outstanding for owner:**
- Hero image reuses homepage photo — replace with South OC / Saddleback Valley photo when available (P4-1)

**Phase 0 highlights:**
- Competition: MEDIUM (thin pages, no neighborhood detail from any competitor)
- Structural gaps: Casta del Sol gated/active-adult angle, 6 named neighborhoods + ZIPs, south OC positioning, AI answer block absent from competitors
- Testimonials (all at cap after this PR): Robert Clemmons, Katie Anne Salen, Joellyn Meadows, Russell Kadota, Marcy Kucik
