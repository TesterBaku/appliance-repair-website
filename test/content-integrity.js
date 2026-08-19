/**
 * content-integrity.js — content/SEO regression guards
 *
 * Twenty-five enforced checks (EXIT 1 on any failure) plus one informational report
 * (title-length, never fails). Each enforced check exists because a real bug
 * shipped before it was added:
 *
 *   review-count   — every page with a JSON-LD `AggregateRating.reviewCount` must match
 *                    `data/testimonials.json` `_meta.sources.google.publishedCount`
 *                    (what the site currently claims). This check parses only that one
 *                    JSON-LD field; it does NOT touch the prose count surfaces (the
 *                    "N verified 5-star Google reviews" copy, "Read all N reviews",
 *                    hero-rating text/aria-label, the testimonials stat, or the
 *                    meta/og/twitter descriptions) — those are enforced separately by
 *                    `scripts/build/sync-review-counts.js --check`, which rewrites them
 *                    from the same `publishedCount` field. There are three counters
 *                    under `_meta.sources.google`, split 2026-08-15 by the weekly
 *                    review-batch cadence plan so daily capture and weekly
 *                    publishing can move independently:
 *                      - `totalReviewsOnListing` — the live GBP listing total,
 *                        free to move daily as reviews are captured, and may move
 *                        DOWN if Google filters a review.
 *                      - `publishedCount` — what the website currently claims.
 *                        Moves only during a weekly publish batch. This is what
 *                        `AggregateRating.reviewCount` and every visible count
 *                        surface must equal, and what this check validates against.
 *                      - `capturedCount` — how many reviews are transcribed into
 *                        the pool. Internal only, never rendered on any page.
 *                    This check also asserts `publishedCount <= totalReviewsOnListing`
 *                    (the site must never claim more reviews than the live listing
 *                    shows) and that both `publishedCount` and `totalReviewsOnListing`
 *                    are present and positive integers (a missing or garbled field on
 *                    either side fails loudly, not silently — see the guard code).
 *                    Before the split, this check compared against
 *                    `totalReviewsOnListing` directly, which meant a daily capture
 *                    bump (before that week's publish batch ran) would fail CI on
 *                    every branch for up to six days. Added 2026-05-21 after PRs
 *                    #374–377 spent 4 commits reconciling 5 different count values
 *                    across 32 files; split into `publishedCount` 2026-08-15.
 *
 *   testimonial-pill-count — the "All (N)" filter pill on pages/testimonials.html must equal
 *                    the number of `.t-card` elements rendered in #reviews-grid. This is a
 *                    DIFFERENT number from review-count: that mirrors the public GBP listing
 *                    total, this counts the curated cards on the page. Nothing enforced it
 *                    before, so it drifted silently (All (95) against 98 cards, then All (97)
 *                    against 100). Added 2026-07-29 after reviewers flagged it on two PRs.
 *
 *   business-tenure — no HTML file may contain "8+ years" or "over 8 years" in a
 *                    business-tenure context. The string itself is the regression
 *                    signal. Allowed phrasing: "9+ years" / "over 9 years".
 *                    (Appliance-age "8 years old" patterns are NOT flagged.)
 *                    Added 2026-05-21 after PR #374.
 *
 *   meta-desc-len  — every article's AND every pages/ file's `<meta name="description">`
 *                    must be ≤ 160 chars so Google SERPs render it without truncation.
 *                    Added 2026-05-21 after PR #359 trimmed 26 articles. Widened from
 *                    articles-only to include pages/ on 2026-08-09: 18 of 80 files in
 *                    pages/ were over the limit and invisible to this check, worst at
 *                    186 chars. An articles-only guard on a site whose commercial
 *                    landing pages all live in pages/ was guarding the wrong half.
 *
 *   og-desc-sync   — every article's and every pages/ file's `og:description` must equal
 *                    its `name="description"`. Divergence was the bug in PR #359 review.
 *                    Added 2026-05-21; widened to pages/ 2026-08-09 alongside
 *                    meta-desc-len, which immediately found one stale og:description
 *                    (dryer-repair-orange-county). NOTE: `twitter:description` is
 *                    deliberately NOT checked — 9 files currently diverge and
 *                    reconciling them is out of scope here. See tasks/backlog.md.
 *
 *   schema-headline-sync — every article's JSON-LD `headline` must equal the H1 text.
 *                    Catches the schema-drift bug fixed in PR #363.
 *                    Added 2026-05-21.
 *
 *   modified-time-sync — every article's `article:modified_time` meta must equal its
 *                    JSON-LD `dateModified`. Catches the drift bug fixed in PR #358
 *                    review.
 *                    Added 2026-05-21.
 *
 *   analytics-present — every page that renders the site nav (`<nav class="nav">`)
 *                    must load `analytics.js` (GA event tracking, contact-form
 *                    tracking, and keyboard-accessible dropdown nav all live there).
 *                    Added 2026-05-31 after 6 pages (testimonials + 5 articles)
 *                    shipped without it.
 *
 *   ga-tag         — every nav-bearing page must carry the Google tag: the gtag.js
 *                    loader for G-TSFHKJ6ZEK, a matching `gtag('config', …)` call,
 *                    positioned as the FIRST child of `<head>`, exactly once.
 *                    AGENTS.md has made this a FAIL gate on every new page since the
 *                    rule was written and `/review` is told to flag a missing tag,
 *                    but nothing verified it until 2026-08-02: `analytics-present`
 *                    above checks `analytics.js`, our own click-event script, which
 *                    is a DIFFERENT file. A documented gate enforced only by memory.
 *
 *   jsonld-valid   — every `<script type="application/ld+json">` block on every
 *                    page must be valid JSON. No other test parses JSON-LD, so
 *                    broken structured data ships silently. Added 2026-05-31 after
 *                    a pre-existing missing comma in a Review[] array on the Miele
 *                    hub was found during the LocalBusiness @id consolidation.
 *
 *   footer-self-contained — the single-sourced footer (partials/footer.html) and
 *                    every injected footer must contain no CSS var() references.
 *                    The footer is stamped into the 46 article pages, which do not
 *                    load shared.css, so any var() resolves to nothing and the text
 *                    falls back to the dark body color (invisible) on the dark
 *                    footer. Added 2026-06-03 after the brand column shipped
 *                    invisible on every article (PR #470).
 *
 *   iso8601-timestamps — every Google-consumed content timestamp (Article/
 *                    VideoObject datePublished/dateModified/uploadDate + OG
 *                    article:*_time) must be full ISO 8601 with a timezone offset
 *                    (2026-06-04T00:00:00+00:00). Bare dates fail Google's
 *                    validator (missing timezone; hard-fails uploadDate).
 *                    Review.datePublished is exempt (reduced-precision GBP dates).
 *                    Added 2026-06-04 after two hubs shipped date-only.
 *
 *   article-mobile-chrome — every articles/article-*.html must (a) hide the header
 *                    "Book a Repair" button (`.nav-cta { display: none }`) at
 *                    <=768px so the mobile header does not cram, and (b) include the
 *                    sticky bottom Call/Book bar (`class="sticky-mobile-bar"`), the
 *                    primary mobile booking CTA. Articles carry their own inline nav
 *                    CSS (no shared.css), so this drifts silently. See
 *                    .claude/skills/mobile-design/SKILL.md. Added 2026-07-19 after 46
 *                    articles shipped a cramming mobile header (PR #610) and 44
 *                    lacked the sticky bar (PR #611).
 *
 *   hamburger-cascade: a real production bug, found 2026-08-18 during review of
 *                    PR #752 (backlog P6-56): two articles declared an
 *                    unconditional `.nav-hamburger { display: none; ... }` rule
 *                    AFTER the `@media (max-width: 768px) { .nav-hamburger {
 *                    display: flex; } }` rule meant to show it on mobile. CSS
 *                    resolves two equal-specificity rules by SOURCE ORDER, not
 *                    by which one sits inside a media query, so the later
 *                    unconditional rule always won and the hamburger was
 *                    display:none at every viewport, on any screen size, so the
 *                    mobile nav drawer could never be opened. The correct
 *                    order (unconditional rule FIRST, media-query override
 *                    LAST) is proven in-repo by
 *                    articles/article-maintenance-skip-cost-los-angeles-county.html,
 *                    whose "HAMBURGER NAV (mobile)" block carries the same
 *                    explanatory comment this check exists to enforce. Scoped
 *                    to every HTML file this script already enumerates that
 *                    inlines its OWN `.nav-hamburger` display rule (articles
 *                    carry their own nav CSS; see article-mobile-chrome above);
 *                    hub/static pages that get the hamburger from
 *                    shared.css declare no inline rule and are skipped
 *                    cleanly, the same widening precedent as meta-desc-len.
 *                    Parses the `<style>` block with a brace-depth walk (not
 *                    a raw line-number comparison of two greps), stripping
 *                    comments first so a comment sitting between two rules
 *                    can never glue onto the next selector's text, so
 *                    whether a rule sits inside `@media` is judged
 *                    structurally rather than by position alone. It reasons
 *                    only about inline `<style>` rules selecting exactly
 *                    `.nav-hamburger` (comma-separated groups included), so
 *                    external sheets, higher-specificity compound selectors,
 *                    `!important` and inline `style=` are outside its reach:
 *                    the full boundary is written out above the check itself.
 *
 *   nav-phone-mobile (P6-57b): the header `tel:` link had no width constraint
 *                    and no rule hiding it at any breakpoint, so it wrapped
 *                    inside the header rather than shrinking to fit: measured
 *                    at 63x30 across 2 lines at 375px, and 43x45 across 3 lines
 *                    at 320px, identically on all 151 pages that carry it.
 *                    Fixed with (a) a stable `class="nav-phone"` hook on the
 *                    header phone link (single-sourced in
 *                    partials/nav-main.html and partials/nav-article.html) and
 *                    (b) a `@media (max-width: 480px) { .nav-phone { display:
 *                    none; } }` rule, since the sticky bottom Call/Book bar
 *                    already carries the call path below that width. This
 *                    check asserts both halves hold on every page whose
 *                    `<nav class="nav">` carries a `tel:` link (the separate
 *                    drawer CTA and sticky-bar `tel:` links, both outside
 *                    `<nav>`, are deliberately out of scope). LIMITATION: it
 *                    can only see whether the hiding rule's TEXT exists in a
 *                    stylesheet the page loads; it does not resolve the CSS
 *                    cascade, so a later or higher-specificity rule that
 *                    re-shows `.nav-phone` in the same stylesheet is invisible
 *                    to it, the same class of gap hamburger-cascade exists to
 *                    close for a different selector. Added 2026-08-18.
 *                    WIDENED 2026-08-19 (PR #755 follow-up): the hide rule's
 *                    entire justification is that the sticky bottom Call/Book
 *                    bar carries the call path below 480px, but nothing
 *                    actually verified that bar existed. The measurement that
 *                    justified the site-wide hide enumerated articles/ +
 *                    pages/ + index.html (151 pages) and never descended into
 *                    the pages/blog/ subdirectory, while the CSS sweep itself
 *                    correctly hid the header phone on all 159 pages
 *                    including those 7 category landers, which carry no
 *                    sticky-mobile-bar at all, leaving them with zero call
 *                    path in the viewport below 480px. Now, on any page where
 *                    the hide rule is `covered` (in scope of a stylesheet the
 *                    page loads), the check additionally requires a
 *                    `class="sticky-mobile-bar"` element containing a `tel:`
 *                    link, the same invariant article-mobile-chrome enforces
 *                    for articles, applied here to every page in scope of
 *                    this check.
 *
 *   non-person-reviewers — no page may display a `Review` (in JSON-LD) whose
 *                    `author.name` matches a data/testimonials.json record
 *                    flagged do-not-display (`nameFlag: "non-person"`, or a
 *                    `_note` field matching /do not display/i, e.g. a Google
 *                    Maps business/music-entity listing that isn't a real
 *                    customer). Catches drift where a flagged record is
 *                    scrubbed from one page (e.g. a brand hub) but left on
 *                    another. Added 2026-07-25 after "Jeff Lane Songs" (a
 *                    Google Maps music-entity listing, not a customer) was
 *                    found still displayed on pages/testimonials.html, even
 *                    though it had already been removed from the brand hubs.
 *
 *   faq-jsonld-parity — every visible FAQ accordion item must match its FAQPage
 *                    JSON-LD entry, comparing RENDERED text (tags stripped,
 *                    entities decoded, whitespace collapsed) so wrapping existing
 *                    words in a link is correctly a non-event while a real wording
 *                    change fails. Also rejects raw HTML inside a Question/Answer,
 *                    and fails loudly if a page has a FAQPage node but no accordion
 *                    items could be parsed (vacuous-pass guard). A RATCHET against
 *                    test/faq-parity-baseline.json: fails on new drift, on any file
 *                    that gets worse, and on any file fixed but left in the
 *                    baseline, so the debt can only shrink. Added 2026-07-31 during
 *                    the PR #655 review, which found that NOTHING in npm test had
 *                    ever compared the two — the first complete run turned up 375 drifted fields
 *                    across 87 of 137 FAQ pages. Paying that down is P6-12.
 *
 *   contrast-aa    — every CSS rule declaring BOTH a literal-hex color and a
 *                    literal-hex background must clear WCAG AA: 4.5:1 for body
 *                    text, 3:1 for large text (>=24px, or >=18.66px at weight
 *                    >=700). Gradients are checked at EVERY stop, because the
 *                    original failure was at the light end while the dark end
 *                    passed. Added 2026-07-31: the #655 critique found .cta-box at
 *                    3.83:1 and the footer at 4.38:1, and fixing only those two
 *                    (PR #657) proved to be treating symptoms — a systematic scan
 *                    then found 18 failing rule/colour combinations across 86
 *                    files, all one root cause. #e84c1e (craftsmans-ember) is
 *                    3.83:1 against white in BOTH directions, so it cannot carry
 *                    small text as a background OR as a foreground, and it was
 *                    doing both. LIMITATION: literal hex only. var()/rgba() rules
 *                    need runtime resolution and are covered by the in-browser
 *                    probes in test/functional.spec.js; the deferred count is
 *                    printed in the summary so the gap stays a known number.
 *
 *   faq-schema-presence — any page rendering >=3 FAQ accordion items must carry a
 *                    FAQPage JSON-LD node. faq-jsonld-parity compares the two when
 *                    BOTH exist, so deleting the whole schema block passed it clean.
 *                    Presence is a different assertion from parity, hence a separate
 *                    check rather than a muddier one. Added 2026-08-01 (P6-13, raised
 *                    in the PR #656 review). All 137 FAQ pages already comply, so it
 *                    ships green as a pure regression guard.
 *
 *   gallery-parity — any page with an ImageGallery JSON-LD node must list exactly
 *                    the photos it renders: same set both ways, no duplicate
 *                    contentUrl, and every listed file present in the repo. Added
 *                    2026-08-03 (P6-6) after pages/recent-repairs.html was found
 *                    rendering 33 repair photos against 29 ImageObject entries —
 *                    4 repairs absent from the structured data. jsonld-valid only
 *                    parses the block and the link checker only follows <a href>,
 *                    so the gap was invisible. Keyed on the schema type and on the
 *                    image directories the gallery itself references, not on a
 *                    filename or a card class, so a future gallery page is covered
 *                    on arrival.
 *
 *   brand-tier     — a brand may only appear inside a PREMIUM enumeration if
 *                    seo-content.md tiers it premium, and every stated company
 *                    diagnostic fee must be one of the three rule-defined values
 *                    ($99 OC/LA, $120 Riverside, $49 additional unit). Added
 *                    2026-08-03 after Bosch was found marketed as premium on 3
 *                    cost hubs and 6 city hubs, in copy AND FAQPage JSON-LD,
 *                    while the rule tiers it standard. Gates only the two
 *                    machine-checkable shapes (.brand-tier.premium card and a
 *                    "Premium (…)" parenthetical); prose is left to review,
 *                    because a checker that guesses at English produces false
 *                    failures and gets muted.
 *
 *   tel-target     — every `tel:` href must be a dialable E.164 US number
 *                    (tel:+1 then 10 digits) AND the whole site must agree on one
 *                    number. Added 2026-08-09 after a scan found 7
 *                    `tel:+194****5365` links live on two hub pages, including the
 *                    Long Beach hub's sticky mobile call bar — the primary mobile
 *                    booking CTA. A masked number does not dial. Nothing caught it:
 *                    links.js only resolves internal .html hrefs, and analytics.js
 *                    fires `phone_click` on the click regardless of whether the
 *                    target is dialable, so GA4 looked normal while taps went
 *                    nowhere. The equality half matters as much as the format half:
 *                    a transposed digit is well-formed and still wrong.
 *
 *   umbrella-range : inside a single FAQ answer or a single AI-answer-block
 *                    paragraph, a "governing" summary range ("Most washer repairs
 *                    run between $120 and $450") must actually bound the CEILING of
 *                    every other dollar range itemized in that same block. A
 *                    sub-item range whose top exceeds the stated umbrella ("a
 *                    control board reaches $230 to $490 ... and a transmission job
 *                    runs $400 to $800") gives the reader two different answers
 *                    from one paragraph. Added 2026-08-16 (branch
 *                    fix/cost-hub-price-contradictions) after this exact
 *                    contradiction was found live on 11 cost-hub FAQ/AI-answer
 *                    blocks and hand-fixed.
 *                    SCOPE, deliberately narrow: only FAQPage JSON-LD answer text
 *                    and `.ai-block p` prose are scanned (matching the defect
 *                    class, not every dollar figure on the page). The governing
 *                    range must be the first dollar range in the block, verb-
 *                    anchored (run/runs/land/lands/fall/falls/cost/costs, optional
 *                    "between", then a range), the ONLY range in its own sentence
 *                    (not a "$A for X, $B for Y" parallel list), and its subject
 *                    must name "repair(s)" within the first 40 characters (the
 *                    true grammatical subject, not a trailing aside on one named
 *                    part). Only the upper bound is enforced: a sub-item priced
 *                    below the governing floor is a typical/median statement
 *                    admitting a cheaper outlier, not the "reader gets two
 *                    ceilings" contradiction this check targets. A known,
 *                    documented gap remains on 2 files this branch did not touch;
 *                    see the check's own comment block for the exact strings and
 *                    reasoning.
 *
 *                    Second known gap, found in review of #744 and NOT closed
 *                    here: the AI-answer scan matches class="ai-block" only, but
 *                    69 files carry that content in a class="callout-blue"
 *                    callout instead, so those blocks are not scanned at all.
 *                    That is how a "$150 to $600" claim survived on
 *                    article-gas-vs-electric-range-repair-cost-orange-county.html
 *                    while the FAQ three sections down said "$100 to $600".
 *                    Widening the selector needs its own false-positive sweep
 *                    across those 69 files, so it is logged in tasks/backlog.md
 *                    under P6-24 Slice A-2 rather than bolted on here.
 *                    Two exemptions are structural, not textual: the sanctioned
 *                    "The one exception above that range is X, which runs $A-$B"
 *                    clause (PR #696) is carved out before governing detection so
 *                    it can never be mistaken for the umbrella or flagged against
 *                    it; a range whose 80 characters of leading context name a
 *                    premium brand (Sub-Zero, Wolf, Viking, Thermador, Miele) is
 *                    treated as deliberate brand segmentation, not a violation.
 *                    Bare single figures ($99 diagnostic fee) never match the
 *                    two-number range pattern, so they are excluded automatically.
 *
 *   srcset-width   — every `srcset="…"` / `imagesrcset="…"` candidate of the form
 *                    "<url> <N>w" must declare the image's REAL intrinsic pixel
 *                    width, decoded from the file's own WebP/PNG/JPEG header, not
 *                    copied from a filename or eyeballed. This exact defect class
 *                    was found, half-fixed, and re-found at 5x scale across THREE
 *                    separate audits before this check existed, because every
 *                    pass fixed the instances in front of it and none added a
 *                    gate: 2026-08-11 recorded 4 files; a 2026-08-16 full-site
 *                    scan (branch fix/srcset-width-descriptors) found 22 files
 *                    across 42 occurrences, several of them files whose own NAME
 *                    claims a width ("-800w.webp") the header disagrees with. An
 *                    overstated descriptor makes the browser pick a too-small
 *                    file for a slot it cannot fill, so job-photo galleries
 *                    render soft on retina; an understated one wastes bytes
 *                    already paid for. `x` density descriptors and SVG sources
 *                    are skipped (counted in the summary, not silently dropped).
 *                    A missing file or an undecodable header fails LOUDLY rather
 *                    than being skipped — a silent skip is how this class of bug
 *                    survived three audits. Added 2026-08-16.
 *
 *   area-served-parity — on any page that renders at least one
 *                    `<div class="city-name">…</div>` (a rendered city card —
 *                    anchor-wrapped hub link or plain info-only card, either
 *                    counts), every rendered `.city-name` must have a matching
 *                    `"City, CA"` entry in that page's LocalBusiness JSON-LD
 *                    `areaServed` array, and vice versa (except entries ending in
 *                    `County, CA`, which are region-level and card-less by
 *                    design). A qualifying page with zero `areaServed` entries
 *                    at all fails with a single summary line rather than one
 *                    per card. Parses the JSON-LD with JSON.parse rather than
 *                    regexing the array out of raw HTML, so a hand-wrapped
 *                    multi-line array or reordered field never confuses it.
 *                    Added 2026-08-17 after pages/service-areas.html was found
 *                    naming San Clemente, Aliso Viejo, Cypress, and Placentia in
 *                    its lede, its FAQ JSON-LD, and its own city-card grid, while
 *                    omitting all four from `areaServed` — the machine-readable
 *                    half of the page contradicted the human-readable half.
 *                    Originally gated qualification on an anchor-wrapped
 *                    `.city-card…` element; that gate had a silent no-op
 *                    (converting every anchor card to a plain info-only div
 *                    left all city names rendered but made zero pages qualify,
 *                    so the check passed on the page it exists to protect).
 *                    Widened to qualify on `.city-name` alone the same day —
 *                    a silent skip is how this class of bug survived three
 *                    audits.
 *
 *   title-length   — INFORMATIONAL ONLY (never fails the build). Reports every
 *                    page whose <title> exceeds 60 chars (Google SERP truncation
 *                    threshold), so the over-length titles are visible ahead of a
 *                    deliberate editorial shorten-pass. Added 2026-06-01; shortening
 *                    titles is a separate owner-reviewed batch (SEO/keyword judgment),
 *                    so this check only surfaces the list and does NOT block.
 *
 * Usage:
 *   node test/content-integrity.js          : run all twenty-five enforced checks + the report
 *   node test/content-integrity.js <name>   — run one check (review-count,
 *                                             testimonial-pill-count, business-tenure,
 *                                             meta-desc-len, og-desc-sync,
 *                                             schema-headline-sync, modified-time-sync,
 *                                             analytics-present, ga-tag, jsonld-valid,
 *                                             footer-self-contained, iso8601-timestamps,
 *                                             article-mobile-chrome, hamburger-cascade,
 *                                             nav-phone-mobile,
 *                                             non-person-reviewers,
 *                                             faq-jsonld-parity, contrast-aa,
 *                                             faq-schema-presence, gallery-parity, brand-tier,
 *                                             tel-target, umbrella-range, srcset-width,
 *                                             area-served-parity, title-length)
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const root       = path.resolve(__dirname, '..');
const mode       = process.argv[2] || 'all';
const SKIP_DIRS  = new Set(['node_modules', '.git', '.claude', '.agents', '.audits', '.playwright-mcp', '.staging', '.husky', 'test-results', 'partials']);

function collectHtmlFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) { results.push(...collectHtmlFiles(full)); continue; }
    if (entry.isFile() && entry.name.endsWith('.html')) results.push(full);
  }
  return results;
}

const allHtml    = collectHtmlFiles(root);
const articleDir = path.join(root, 'articles');
const articles   = allHtml.filter(
  f => path.dirname(f) === articleDir && path.basename(f).startsWith('article-')
);

const pagesDir = path.join(root, 'pages');
// Every .html under pages/, recursively — this includes the 7 pages/blog/ category landers.
const pages    = allHtml.filter(f => f.startsWith(pagesDir + path.sep));

// meta-desc-len and og-desc-sync were articles-only until 2026-08-09; see the docblock above.
const descChecked = [...articles, ...pages];

const issues = [];
const checked = {};

function rel(p) { return path.relative(root, p).split(path.sep).join('/'); }
function run(check) { return mode === 'all' || mode === check; }

// ── Check 1: review-count ─────────────────────────────────────────────────────
if (run('review-count')) {
  const json = JSON.parse(fs.readFileSync(path.join(root, 'data', 'testimonials.json'), 'utf8'));
  const google = json._meta.sources.google;
  const publishedCount = google.publishedCount;
  const totalReviewsOnListing = google.totalReviewsOnListing;

  // Guard: publishedCount must be present and a positive integer. A missing field
  // must fail loudly: silently falling back to undefined/NaN would let every page
  // pass with "reviewCount": "NaN" style corruption unnoticed.
  if (!Number.isInteger(publishedCount) || publishedCount <= 0) {
    issues.push(`[REVIEW-COUNT] data/testimonials.json _meta.sources.google.publishedCount is missing or not a positive integer (got: ${JSON.stringify(publishedCount)}). This field drives every visible review-count surface site-wide and must be set explicitly.`);
  }

  // Guard: totalReviewsOnListing must be present and a positive integer, mirroring the
  // publishedCount guard above. Without this, deleting or garbling the field would silently
  // skip the publishedCount <= totalReviewsOnListing comparison below instead of failing it —
  // and that comparison is the only thing preventing the site from publicly claiming more
  // reviews than the live GBP listing shows.
  if (!Number.isInteger(totalReviewsOnListing) || totalReviewsOnListing <= 0) {
    issues.push(`[REVIEW-COUNT] data/testimonials.json _meta.sources.google.totalReviewsOnListing is missing or not a positive integer (got: ${JSON.stringify(totalReviewsOnListing)}). This field is the ceiling the publishedCount <= totalReviewsOnListing guard depends on and must be set explicitly.`);
  }

  // Guard: the site must never claim more reviews than the live GBP listing shows.
  // Publishing ahead of the listing is the one failure mode this whole cadence
  // exists to prevent (see the May 2026 GBP content-policy flag).
  if (Number.isInteger(publishedCount) && Number.isInteger(totalReviewsOnListing) && publishedCount > totalReviewsOnListing) {
    issues.push(`[REVIEW-COUNT] data/testimonials.json publishedCount (${publishedCount}) exceeds totalReviewsOnListing (${totalReviewsOnListing}): the site would be claiming more reviews than the live GBP listing shows.`);
  }

  const expectedCount = String(publishedCount);
  checked['review-count'] = { expected: expectedCount, files: 0 };

  for (const filePath of allHtml) {
    const content = fs.readFileSync(filePath, 'utf8');
    // Match "reviewCount": "<value>" — accepts whitespace variations
    const matches = [...content.matchAll(/"reviewCount"\s*:\s*"(\d+)"/g)];
    if (!matches.length) continue;
    checked['review-count'].files++;
    for (const m of matches) {
      if (m[1] !== expectedCount) {
        issues.push(`[REVIEW-COUNT] ${rel(filePath)} — has "reviewCount": "${m[1]}" but data/testimonials.json publishedCount says ${expectedCount}`);
      }
    }
  }
}

// ── Check 1b: testimonial-pill-count ──────────────────────────────────────────
// The "All (N)" filter pill on pages/testimonials.html must equal the number of review
// cards actually rendered in #reviews-grid. Nothing enforced this before, and it drifted
// silently across several PRs (shipped as All (95) against 98 cards, then All (97) against
// 100). It is a DIFFERENT number from the review-count check above: that one mirrors the
// public GBP listing total from data/testimonials.json, this one counts curated cards on
// the page.
//
// Extraction is attribute-order agnostic, does not care whether `class` comes first, and finds
// the grid's closing tag by real <div> depth rather than by indentation — an earlier draft keyed
// on a fixed indent and silently counted 1 card once the cards were nested deeper. Known blind
// spots (neither present today): a card commented out with <!-- --> or hidden with an inline
// style="display:none" still counts.
if (run('testimonial-pill-count')) {
  const filePath = path.join(root, 'pages', 'testimonials.html');
  const content = fs.readFileSync(filePath, 'utf8');

  // Walk <div>/</div> from the grid's opening tag to its matching close.
  function gridInner(html) {
    const open = html.match(/<div\b[^>]*\bid="reviews-grid"[^>]*>/);
    if (!open) return null;
    const start = open.index + open[0].length;
    const tag = /<div\b[^>]*>|<\/div>/g;
    tag.lastIndex = start;
    let depth = 1, m;
    while ((m = tag.exec(html)) !== null) {
      depth += m[0] === '</div>' ? -1 : 1;
      if (depth === 0) return html.slice(start, m.index);
    }
    return null;
  }

  const inner = gridInner(content);
  const cards = inner
    ? [...inner.matchAll(/<div\b[^>]*\bclass="[^"]*\bt-card\b[^"]*"[^>]*>/g)].length
    : 0;
  const pill = content.match(/data-filter="all"[^>]*>\s*All\s*\((\d+)\)\s*</);
  const grid = inner !== null;

  checked['testimonial-pill-count'] = { cards, pill: pill ? Number(pill[1]) : null };

  if (!grid) {
    issues.push(`[PILL-COUNT] ${rel(filePath)} — could not locate #reviews-grid; update this check if the markup changed`);
  } else if (!pill) {
    issues.push(`[PILL-COUNT] ${rel(filePath)} — could not find the All (N) filter pill; update this check if the markup changed`);
  } else if (Number(pill[1]) !== cards) {
    issues.push(`[PILL-COUNT] ${rel(filePath)} — All pill says ${pill[1]} but #reviews-grid renders ${cards} .t-card elements`);
  }

  // ── testimonial-review-schema ───────────────────────────────────────────────
  // Every QUOTED testimonial card must have a matching Review node in the page's
  // JSON-LD, per .claude/skills/testimonial-selection/SKILL.md ("Individual Review JSON-LD
  // entries for each displayed testimonial, with author.name matching the pool's
  // name field exactly"). Nothing enforced this, so it drifted: a 2026-07-30 review
  // caught 2 new cards shipped without nodes while AggregateRating.reviewCount was
  // raised anyway — exactly the "Review snippet should have reviews" shape Google
  // penalizes.
  //
  // Scoped to cards that actually carry a quote. `.t-card--no-quote` cards are
  // rating-only reviews with no body (Drew McMillan, Theresa Robinson, Luci LaBue);
  // a Review node with no reviewBody is legal schema but is a separate editorial
  // decision, deliberately NOT forced by this check.
  if (inner) {
    const decode = (s) => s
      .replace(/&amp;/g, '&').replace(/&rsquo;/g, '’').replace(/&lsquo;/g, '‘')
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>');

    const CARD_OPEN = /<div\b[^>]*\bclass="[^"]*\bt-card\b[^"]*"[^>]*>/g;
    const opens = [...inner.matchAll(CARD_OPEN)];
    const quotedNames = [];
    opens.forEach((m, i) => {
      const block = inner.slice(m.index, opens[i + 1] ? opens[i + 1].index : inner.length);
      if (/\bt-card--no-quote\b/.test(m[0])) return; // rating-only card, no body to mirror
      // Attribute-order tolerant, same shape as CARD_OPEN. A literal
      // `<div class="t-name">` match would silently shrink quotedNames toward empty
      // if markup ever put another attribute first, and the check would then pass
      // vacuously — the exact failure mode this check exists to prevent.
      const name = block.match(/<div\b[^>]*\bclass="[^"]*\bt-name\b[^"]*"[^>]*>([^<]+)<\/div>/);
      if (name) quotedNames.push(decode(name[1].trim()));
    });

    // Belt and braces: a quoted card with no extractable name means the markup moved
    // and this check has gone blind. Fail loudly rather than report a false all-clear.
    const quotedCardCount = opens.filter((m) => !/\bt-card--no-quote\b/.test(m[0])).length;
    if (quotedNames.length !== quotedCardCount) {
      issues.push(`[REVIEW-SCHEMA] ${rel(filePath)} — found ${quotedCardCount} quoted cards but could only read ${quotedNames.length} reviewer names; the .t-name markup changed and this check needs updating`);
    }

    const ldNames = new Set();
    for (const blk of content.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      let parsed;
      try { parsed = JSON.parse(blk[1]); } catch { continue; }
      for (const r of parsed.review || []) {
        if (r && r.author && r.author.name) ldNames.add(r.author.name);
      }
    }

    const missing = quotedNames.filter((n) => !ldNames.has(n));
    checked['testimonial-review-schema'] = { quotedCards: quotedNames.length, reviewNodes: ldNames.size, missing: missing.length };
    if (missing.length) {
      issues.push(`[REVIEW-SCHEMA] ${rel(filePath)} — ${missing.length} quoted testimonial card(s) have no matching Review JSON-LD node: ${missing.join(', ')}`);
    }
  }
}

// ── Check 2: business-tenure ──────────────────────────────────────────────────
if (run('business-tenure')) {
  // Patterns that are business-tenure claims about US (the company).
  // The negative lookbehind avoids "appliance over 8 years old" / "if your X is 8 years old".
  // Strategy: match "over 8 years" or "8+ years" or "for 8 years" only when followed
  // by tokens like "of servicing", "servicing", "in business", or preceded by "for over".
  const tenurePatterns = [
    /\b(over|Over)\s+8\s+years\s+(of\s+servicing|servicing|in\s+business|of\s+experience)/g,
    /\b8\+\s+years\s+(servicing|of\s+experience|in\s+business)/g,
    /\bfor\s+(over\s+)?8\s+years\b(?!\s+old)/g,
  ];
  checked['business-tenure'] = { files: 0 };

  for (const filePath of allHtml) {
    const content = fs.readFileSync(filePath, 'utf8');
    checked['business-tenure'].files++;
    for (const re of tenurePatterns) {
      const matches = [...content.matchAll(re)];
      for (const m of matches) {
        // Quick sanity: don't report inside <code>/<pre> blocks (none exist here, but future-proof)
        const lineNo = content.slice(0, m.index).split('\n').length;
        issues.push(`[8-YEARS] ${rel(filePath)}:${lineNo} — "${m[0]}" — should be "9 years" / "9+ years" (business tenure)`);
      }
    }
  }
}

// ── Check 3: meta-desc-len ────────────────────────────────────────────────────
if (run('meta-desc-len')) {
  checked['meta-desc-len'] = { files: 0, limit: 160 };
  for (const filePath of descChecked) {
    const content = fs.readFileSync(filePath, 'utf8');
    checked['meta-desc-len'].files++;
    const m = content.match(/<meta\s+name="description"\s+content="([^"]*)"/);
    if (!m) {
      issues.push(`[META-LEN] ${rel(filePath)} — no <meta name="description"> found`);
      continue;
    }
    if (m[1].length > 160) {
      issues.push(`[META-LEN] ${rel(filePath)} — meta description is ${m[1].length} chars (>160 limit)`);
    }
  }
}

// ── Check 4: og-desc-sync ─────────────────────────────────────────────────────
if (run('og-desc-sync')) {
  checked['og-desc-sync'] = { files: 0 };
  for (const filePath of descChecked) {
    const content = fs.readFileSync(filePath, 'utf8');
    checked['og-desc-sync'].files++;
    const meta = content.match(/<meta\s+name="description"\s+content="([^"]*)"/);
    const og   = content.match(/<meta\s+property="og:description"\s+content="([^"]*)"/);
    if (!meta || !og) continue; // separately covered by meta-desc-len
    if (meta[1] !== og[1]) {
      issues.push(`[OG-SYNC] ${rel(filePath)} — og:description differs from name="description"`);
    }
  }
}

// ── Check 5: schema-headline-sync ─────────────────────────────────────────────
if (run('schema-headline-sync')) {
  checked['schema-headline-sync'] = { files: 0 };
  for (const filePath of articles) {
    const content = fs.readFileSync(filePath, 'utf8');
    checked['schema-headline-sync'].files++;
    // JSON-LD Article headline (first match)
    const hl = content.match(/"headline"\s*:\s*"([^"]*)"/);
    // H1 text — strip tags + decode &amp; for comparison
    const h1m = content.match(/<h1[^>]*>(.*?)<\/h1>/s);
    if (!hl || !h1m) continue;
    const h1Text = h1m[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim();
    const hlText = hl[1].replace(/&amp;/g, '&').trim();
    if (h1Text !== hlText) {
      issues.push(`[HEADLINE] ${rel(filePath)} — JSON-LD headline ≠ H1`);
      issues.push(`           H1:       ${h1Text}`);
      issues.push(`           headline: ${hlText}`);
    }
  }
}

// ── Check 6: modified-time-sync ───────────────────────────────────────────────
if (run('modified-time-sync')) {
  checked['modified-time-sync'] = { files: 0 };
  for (const filePath of articles) {
    const content = fs.readFileSync(filePath, 'utf8');
    checked['modified-time-sync'].files++;
    const mt = content.match(/<meta\s+property="article:modified_time"\s+content="([^"T]+)/);
    const dm = content.match(/"dateModified"\s*:\s*"([^"T]+)/);
    if (!mt || !dm) continue;
    if (mt[1] !== dm[1]) {
      issues.push(`[DATE-SYNC] ${rel(filePath)} — article:modified_time (${mt[1]}) ≠ dateModified (${dm[1]})`);
    }
  }
}

// ── Check 7: analytics.js present on every nav-bearing page ───────────────────
if (run('analytics-present')) {
  checked['analytics-present'] = { files: 0 };
  for (const filePath of allHtml) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (!content.includes('<nav class="nav"')) continue;   // redirect stubs have no site nav — exempt
    checked['analytics-present'].files++;
    if (!/<script[^>]*\banalytics\.js\b/.test(content)) {
      issues.push(`[ANALYTICS] ${rel(filePath)} — renders the site nav but does not load analytics.js`);
    }
  }
}

// -- Check 7b: the Google tag must be the first thing in <head> ---------------
// AGENTS.md makes this a FAIL gate on every new page, and /review is told to flag
// a missing tag. Until 2026-08-02 nothing checked it: `analytics-present` above
// looks at analytics.js, which is our own click-event script and a DIFFERENT file
// from the gtag.js snippet. The gate was documented, reviewed for, and enforced
// only by memory.
//
// Every assertion runs against a COMMENT-STRIPPED copy. Matching raw text made a
// commented-out old tag count toward the duplicate tally, and made a fully
// commented-out tag report as "misplaced" instead of "missing".
if (run('ga-tag')) {
  checked['ga-tag'] = { files: 0 };
  const LOADER = /<script[^>]*\ssrc="https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=G-TSFHKJ6ZEK"/;
  for (const filePath of allHtml) {
    const raw = fs.readFileSync(filePath, 'utf8');
    if (!raw.includes('<nav class="nav"')) continue;   // redirect stubs exempt, as above
    checked['ga-tag'].files++;
    const rp = rel(filePath);
    // Comments are REMOVED, not blanked, so two things a comment separated can end up
    // adjacent: `<scr<!--x-->ipt src="...gtag/js?id=...">` collapses into a live loader
    // and passes. That matches how a browser reads it, and `raw` is never modified.
    const content = raw.replace(/<!--[\s\S]*?-->/g, '');

    if (!LOADER.test(content)) {
      issues.push(`[GA-TAG] ${rp} - renders the site nav but has no live gtag.js loader for G-TSFHKJ6ZEK`);
      continue;
    }
    // Both quote styles are valid GA; AGENTS.md shows the single-quoted snippet.
    if (!/gtag\(\s*['"]config['"]\s*,\s*['"]G-TSFHKJ6ZEK['"]\s*\)/.test(content)) {
      issues.push(`[GA-TAG] ${rp} - loads gtag.js but never calls gtag('config', 'G-TSFHKJ6ZEK')`);
    }
    // "first child of <head>": nothing but whitespace may precede it once comments
    // are gone. Guard both index lookups explicitly - a bare .slice(search(...))
    // reads from the END of the string when the pattern is absent, which would turn
    // a malformed page into a silent pass.
    const headOpen = content.search(/<head(?=[\s>])[^>]*>/i);
    if (headOpen === -1) {
      issues.push(`[GA-TAG] ${rp} - has a gtag.js loader but no <head> element`);
      continue;
    }
    const afterOpen = content.slice(headOpen + content.slice(headOpen).indexOf('>') + 1);
    const loaderAt  = afterOpen.search(LOADER);
    if (loaderAt === -1) {
      issues.push(`[GA-TAG] ${rp} - gtag.js loader appears before <head>`);
      continue;
    }
    const preamble = afterOpen.slice(0, loaderAt).trim();
    if (preamble) {
      issues.push(`[GA-TAG] ${rp} - gtag.js is not the first child of <head> (preceded by: ${preamble.slice(0, 60).replace(/\s+/g, ' ')})`);
    }
    // One tag per page: AGENTS.md forbids a second Google tag.
    const loaders = (content.match(new RegExp(LOADER.source, 'g')) || []).length;
    if (loaders > 1) {
      issues.push(`[GA-TAG] ${rp} - ${loaders} live gtag.js loaders; exactly one is allowed`);
    }
  }
}

// ── Check 8: every JSON-LD block must be valid JSON ───────────────────────────
if (run('jsonld-valid')) {
  checked['jsonld-valid'] = { files: 0, blocks: 0 };
  for (const filePath of allHtml) {
    const content = fs.readFileSync(filePath, 'utf8');
    const blocks = [...content.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    if (!blocks.length) continue;
    checked['jsonld-valid'].files++;
    blocks.forEach((m, i) => {
      checked['jsonld-valid'].blocks++;
      try { JSON.parse(m[1]); }
      catch (e) { issues.push(`[JSONLD] ${rel(filePath)} block#${i} — invalid JSON: ${e.message.slice(0, 70)}`); }
    });
  }
}

// ── Check 9: title-length (INFORMATIONAL — never pushes to issues) ────────────
if (run('title-length')) {
  const LIMIT = 60; // Google SERP truncation threshold (~60 chars)
  const offenders = [];
  let scanned = 0;
  for (const filePath of allHtml) {
    const content = fs.readFileSync(filePath, 'utf8');
    const m = content.match(/<title>([\s\S]*?)<\/title>/i);
    if (!m) continue;
    scanned++;
    const title = m[1].replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
    if (title.length > LIMIT) offenders.push({ file: rel(filePath), len: title.length, title });
  }
  offenders.sort((a, b) => b.len - a.len);
  checked['title-length'] = { limit: LIMIT, scanned, offenders };
}

// ── Check 9: footer-self-contained ────────────────────────────────────────────
// The single-sourced footer is injected verbatim into pages that do NOT load
// shared.css (the 46 article pages use a self-contained <style> block). Any CSS
// custom property (var(--…)) inside the footer therefore resolves to nothing and
// the text falls back to the dark body color on the #090909 footer — invisible.
// The footer must be fully self-contained: no var() references anywhere in it.
// Added 2026-06-03 after the brand column (name + tagline + icon) shipped
// invisible on every article page (fixed in PR #470).
if (run('footer-self-contained')) {
  checked['footer-self-contained'] = { files: 0 };
  const VAR_RE = /var\(\s*--[a-z0-9-]+\s*\)/gi;

  // (a) the single-source partial itself
  const partialPath = path.join(root, 'partials', 'footer.html');
  if (fs.existsSync(partialPath)) {
    const partial = fs.readFileSync(partialPath, 'utf8');
    const m = partial.match(VAR_RE);
    if (m) issues.push(`[FOOTER-VAR] partials/footer.html — footer partial uses ${m.length} CSS var() (${[...new Set(m)].join(', ')}); the footer is injected into pages without shared.css, where these are undefined`);
  }

  // (b) every injected footer region in the served HTML
  for (const filePath of allHtml) {
    const content = fs.readFileSync(filePath, 'utf8');
    const fm = content.match(/<footer class="footer">[\s\S]*?<\/footer>/i);
    if (!fm) continue;
    checked['footer-self-contained'].files++;
    const vars = fm[0].match(VAR_RE);
    if (vars) issues.push(`[FOOTER-VAR] ${rel(filePath)} — injected footer uses ${vars.length} CSS var() (${[...new Set(vars)].join(', ')}); will render invisible on pages without shared.css`);
  }
}

// ── Check 10: iso8601-timestamps ──────────────────────────────────────────────
// Google-consumed CONTENT timestamps must be full ISO 8601 with a timezone offset
// (e.g. 2026-06-04T00:00:00+00:00), never a bare date ("2026-06-04"). schema.org
// types these as DateTime; Google's Rich Results / GSC validator flags a missing
// timezone — it hard-fails VideoObject.uploadDate ("invalid datetime value") and
// is inconsistent for Article datePublished/dateModified. Enforced on the page's
// own content nodes (Article/NewsArticle/BlogPosting/TechArticle → datePublished,
// dateModified; VideoObject → uploadDate) and the OG article:*_time metas.
//
// Deliberately NOT enforced on Review.datePublished: those are reduced-precision
// review dates (GBP only exposes "N months ago"), so "2026-03" is honest ISO 8601
// and forcing T00:00:00+00:00 would fabricate day/time precision we don't have.
// Added 2026-06-04. `Z` and ±hh:mm offsets both pass.
if (run('iso8601-timestamps')) {
  checked['iso8601-timestamps'] = { files: 0, stamps: 0 };
  const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
  const CONTENT_TYPES = new Set(['Article', 'NewsArticle', 'BlogPosting', 'TechArticle', 'VideoObject']);
  const DATE_FIELDS = ['datePublished', 'dateModified', 'uploadDate'];
  const typesOf = node => (Array.isArray(node['@type']) ? node['@type'] : [node['@type']]).filter(Boolean);
  function walk(node, filePath, c) {
    if (Array.isArray(node)) { node.forEach(n => walk(n, filePath, c)); return; }
    if (!node || typeof node !== 'object') return;
    if (typesOf(node).some(t => CONTENT_TYPES.has(t))) {
      for (const f of DATE_FIELDS) {
        if (typeof node[f] === 'string') {
          c.stamps++;
          if (!ISO.test(node[f])) issues.push(`[ISO8601] ${rel(filePath)} — ${typesOf(node).join('/')} ${f} "${node[f]}" is not full ISO 8601 with timezone offset (expected e.g. 2026-06-04T00:00:00+00:00)`);
        }
      }
    }
    for (const v of Object.values(node)) if (v && typeof v === 'object') walk(v, filePath, c);
  }
  const OG_RE = /<meta\s+property="(article:(?:published|modified)_time)"\s+content="([^"]*)"/g;
  for (const filePath of allHtml) {
    const content = fs.readFileSync(filePath, 'utf8');
    const c = checked['iso8601-timestamps'];
    const before = c.stamps;
    for (const m of content.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      let parsed; try { parsed = JSON.parse(m[1]); } catch { continue; }  // jsonld-valid reports parse errors
      walk(parsed, filePath, c);
    }
    let og;
    OG_RE.lastIndex = 0;
    while ((og = OG_RE.exec(content))) {
      c.stamps++;
      if (!ISO.test(og[2])) issues.push(`[ISO8601] ${rel(filePath)} — ${og[1]} "${og[2]}" is not full ISO 8601 with timezone offset`);
    }
    if (c.stamps > before) c.files++;
  }
}

// ── Check 11: article-mobile-chrome ───────────────────────────────────────────
// Every article must (a) hide the header "Book a Repair" button (.nav-cta) at
// <=768px so the mobile header does not cram, and (b) include the sticky bottom
// Call/Book bar — the primary mobile booking CTA once the header button is hidden.
// Articles carry their OWN inline nav CSS (no shared.css), so this drifts silently
// on new or legacy files. See .claude/skills/mobile-design/SKILL.md. Established site-wide
// 2026-07-19 (PR #610 hid .nav-cta on 46 legacy articles; PR #611 added the sticky
// bar to the 44 that lacked it).
if (run('article-mobile-chrome')) {
  checked['article-mobile-chrome'] = { files: 0 };
  for (const filePath of articles) {
    const content = fs.readFileSync(filePath, 'utf8');
    checked['article-mobile-chrome'].files++;
    if (!/\.nav-cta\s*\{\s*display:\s*none/.test(content)) {
      issues.push(`[MOBILE-CHROME] ${rel(filePath)} — missing ".nav-cta { display: none }" at ≤768px (header Book button not hidden on mobile; header crams). See .claude/skills/mobile-design/SKILL.md.`);
    }
    if (!/class="sticky-mobile-bar"/.test(content)) {
      issues.push(`[MOBILE-CHROME] ${rel(filePath)} — missing the sticky-mobile-bar (mobile Call/Book CTA). See .claude/skills/mobile-design/SKILL.md.`);
    }
  }
}

// ── Check 11a: hamburger-cascade ────────────────────────────────────────────
// A real production bug, found 2026-08-18 during review of PR #752 (backlog
// P6-56): two articles declared an unconditional ".nav-hamburger { display:
// none; ... }" rule AFTER the "@media (max-width: 768px) { .nav-hamburger {
// display: flex; } }" rule meant to show it on mobile. CSS resolves two
// equal-specificity rules by SOURCE ORDER, not by which one sits inside a
// media query, so the later unconditional rule always won and the hamburger
// was display:none at every viewport, so the mobile nav drawer could never be
// opened. The correct order (unconditional rule FIRST, media-query override
// LAST) is proven in-repo by
// articles/article-maintenance-skip-cost-los-angeles-county.html, whose
// "HAMBURGER NAV (mobile)" block carries the same explanatory comment this
// check exists to enforce. Scoped to every HTML file this script already
// enumerates that inlines its OWN ".nav-hamburger" display rule; hub/static
// pages that get the hamburger from shared.css declare no inline rule and
// are skipped cleanly, the same widening precedent as meta-desc-len.
//
// KNOWN COVERAGE BOUNDARY, stated so nobody trusts this further than it goes.
// It reasons over ONE inline `<style>` block per file at a time and only about
// rules whose selector, split on commas, contains exactly `.nav-hamburger`. It
// does NOT resolve: a descendant or compound selector (`.nav .nav-hamburger`,
// `button.nav-hamburger`), which carries higher specificity and so is not the
// equal-specificity race this checks; a rule in shared.css or any other
// external sheet; `!important`; or an inline `style=` attribute. A page can
// therefore still break its hamburger in a way this check calls clean. The two
// gaps a reviewer found on the PR that added it (exact-string selector match,
// and a `max-width` substring gate on the media condition) were closed here:
// selectors are matched per comma-separated part, and ANY media-query rule
// giving `.nav-hamburger` a display other than `none` counts as the override,
// whatever its condition text. A third, narrower one found on the re-check is
// closed too: a rule body carrying more than one `display` declaration is read
// by its LAST one, since duplicates inside a block also resolve by source
// order, so `display: flex; display: none` is correctly read as hidden.
if (run('hamburger-cascade')) {
  checked['hamburger-cascade'] = { files: 0 };
  // Counted per FILE, not per <style> block: a page with two style blocks
  // carrying .nav-hamburger rules must not inflate the summary count.
  const hamburgerFiles = new Set();
  const STYLE_RE = /<style[^>]*>([\s\S]*?)<\/style>/g;
  for (const filePath of allHtml) {
    const content = fs.readFileSync(filePath, 'utf8');
    STYLE_RE.lastIndex = 0;
    let styleMatch;
    while ((styleMatch = STYLE_RE.exec(content))) {
      const css = styleMatch[1];
      const cssStart = styleMatch.index + styleMatch[0].indexOf(css);
      // Strip comments before brace-walking (same length, newlines kept) so a
      // comment sitting between two rules never glues onto the next
      // selector's text, and computed line numbers stay accurate.
      const cssNoComments = css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));

      // Track a stack of open blocks so a plain rule can be told apart from
      // an @media wrapper, and so each rule knows which @media (if any)
      // contains it. Plain CSS has no nested rules, so brace-matching alone
      // recovers this structure, with no raw line-number comparison needed.
      const stack = [];
      const rules = [];
      let buf = '';
      for (let i = 0; i < cssNoComments.length; i++) {
        const ch = cssNoComments[i];
        if (ch === '{') {
          const prelude = buf.trim();
          buf = '';
          if (/^@media/i.test(prelude)) {
            stack.push({ type: 'media', condition: prelude });
          } else {
            let mediaCondition = null;
            for (let s = stack.length - 1; s >= 0; s--) {
              if (stack[s].type === 'media') { mediaCondition = stack[s].condition; break; }
            }
            stack.push({ type: 'rule', selector: prelude, bodyStart: i + 1, mediaCondition });
          }
        } else if (ch === '}') {
          const top = stack.pop();
          if (top && top.type === 'rule') {
            // Slice the body from the comment-blanked copy, not the original:
            // a commented-out "display: flex" inside a rule is not a
            // declaration, and reading it as one would flip the verdict.
            rules.push({ selector: top.selector, mediaCondition: top.mediaCondition, body: cssNoComments.slice(top.bodyStart, i), end: i });
          }
          buf = '';
        } else {
          buf += ch;
        }
      }

      // Match the selector per comma-separated part, not as a whole string: a
      // grouped selector like ".nav, .nav-hamburger" reproduces this bug exactly
      // and an equality test would walk straight past it.
      const targetsHamburger = (sel) => sel.split(',').some(part => part.trim() === '.nav-hamburger');
      const hamburgerRules = rules.filter(r => targetsHamburger(r.selector) && /display\s*:/i.test(r.body));
      if (!hamburgerRules.length) continue; // no inline .nav-hamburger rule here (shared.css page): skip cleanly
      hamburgerFiles.add(rel(filePath));

      // Any media-query rule that REVEALS the button counts as the override,
      // whatever display value it uses and however its condition is written.
      // Gating on the literal substring "max-width" and on "flex" would miss
      // the same bug behind `@media not (min-width: 769px)` or `display: block`.
      // Read the LAST display declaration in the body, not the first: within one
      // rule block CSS also resolves duplicates by source order, so a body of
      // "display: flex; display: none" is hidden, and testing the first match
      // would call it a reveal.
      const effectiveDisplay = (body) => {
        const decls = body.match(/display\s*:\s*[a-z-]+/gi) || [];
        return decls.length ? decls[decls.length - 1].split(':')[1].trim().toLowerCase() : null;
      };
      const mediaShowRules = hamburgerRules.filter(r => r.mediaCondition && effectiveDisplay(r.body) && effectiveDisplay(r.body) !== 'none');
      const unconditionalRules = hamburgerRules.filter(r => !r.mediaCondition);

      for (const flexRule of mediaShowRules) {
        for (const uncond of unconditionalRules) {
          if (uncond.end > flexRule.end) {
            const lineNo = content.slice(0, cssStart + uncond.end).split('\n').length;
            issues.push(`[HAMBURGER-CASCADE] ${rel(filePath)}:${lineNo}: unconditional ".nav-hamburger { display: ... }" appears AFTER the "${flexRule.mediaCondition} { ${flexRule.selector} { display: ... } }" override that reveals it. Equal specificity + later source position means the unconditional rule always wins, so the hamburger is display:none at every viewport. Move the unconditional ".nav-hamburger" block (and its span/aria-expanded/.nav-drawer siblings) BEFORE the @media block, as in articles/article-maintenance-skip-cost-los-angeles-county.html.`);
          }
        }
      }
    }
  }
  checked['hamburger-cascade'].files = hamburgerFiles.size;
}

// ── Check 11b: nav-phone-mobile ───────────────────────────────────────────────
// P6-57b: the header `tel:` link had no width constraint and no rule hiding it
// at any breakpoint, so it wrapped inside the header instead of shrinking to
// fit: measured at 63x30 across 2 lines at 375px, and 43x45 across 3 lines at
// 320px, identically on all 151 pages that carry it. The fix has two halves:
// (a) the header phone link (single-sourced in partials/nav-main.html and
// partials/nav-article.html) got a stable `class="nav-phone"` hook, and (b) a
// `@media (max-width: 480px) { .nav-phone { display: none; } }` rule hides it
// below that width, where the sticky bottom Call/Book bar already carries the
// call path. This check guards both halves so neither can silently regress.
//
// The header tel: link is identified structurally as the tel: href inside
// `<nav class="nav">...</nav>`, NOT the separate drawer CTA
// (`.nav-drawer-cta`, outside `<nav>` in partials/nav-article.html) or the
// sticky-mobile-bar `tel:` link (also outside `<nav>`), both of which must
// keep working and are deliberately left unexamined here.
//
// COVERAGE BOUNDARY, stated so nobody trusts this further than it goes: this
// check can only see whether the hiding rule's TEXT is present in a
// stylesheet the page loads (its own inline <style>, or shared.css if linked).
// It does NOT resolve the CSS cascade the way a browser would, so it cannot
// tell whether some LATER, more specific, or `!important` rule in that same
// stylesheet (or in a second linked stylesheet) re-shows `.nav-phone` after
// this rule hides it, the exact shape of the source-order bug the
// hamburger-cascade check above exists for. A page can still break in a way
// this check calls clean.
//
// WIDENED 2026-08-19: PR #755 hid the header phone below 480px site-wide on
// the basis that the sticky bottom Call/Book bar carries the call path at
// those widths, but shipped past review on 7 pages/blog/*.html category
// landers (dishwasher, dryer, freezer, other, oven-stove, refrigerator,
// washer) that carry the hide but have zero sticky-mobile-bar, leaving no
// call path in the viewport at all below 480px. Root cause: the measurement
// that justified the change enumerated articles/ + pages/ + index.html (151
// pages) and never descended into pages/blog/, while the CSS sweep itself
// correctly hit all 159 pages. Found by independent review, not by this
// check (this check didn't exist yet). Below, whenever the hide rule is in
// scope for a page (`covered`), the check now also requires a
// `class="sticky-mobile-bar"` element containing a `tel:` link, so the
// invariant the hide rule's whole justification rests on can never again
// silently not hold.
if (run('nav-phone-mobile')) {
  checked['nav-phone-mobile'] = { files: 0 };
  const sharedCssPath = path.join(root, 'shared.css');
  const sharedCss = fs.existsSync(sharedCssPath) ? fs.readFileSync(sharedCssPath, 'utf8') : '';
  const HIDE_RULE_RE = /@media\s*\([^)]*max-width:\s*480px[^)]*\)\s*\{\s*\.nav-phone\s*\{\s*display:\s*none/;
  const sharedCssHasRule = HIDE_RULE_RE.test(sharedCss);

  for (const filePath of allHtml) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (!content.includes('<nav class="nav"')) continue;   // no site nav, nothing to check

    const navMatch = content.match(/<nav class="nav"[^>]*>([\s\S]*?)<\/nav>/);
    const navBlock = navMatch ? navMatch[1] : '';
    const telMatch = navBlock.match(/<a\s+href="tel:[^"]*"[^>]*>/);
    if (!telMatch) continue;   // this page's header carries no tel: link, nothing to guard

    checked['nav-phone-mobile'].files++;
    const rp = rel(filePath);

    if (!/class="[^"]*\bnav-phone\b[^"]*"/.test(telMatch[0])) {
      issues.push(`[NAV-PHONE] ${rp}: the header tel: link is missing class="nav-phone" (P6-57b, wraps to 2-3 lines at 375px/320px with nothing to hide it below 480px).`);
    }

    const linksSharedCss = /href="[^"]*shared\.css"/.test(content);
    const inlineHasRule = HIDE_RULE_RE.test(content);
    const covered = inlineHasRule || (linksSharedCss && sharedCssHasRule);
    if (!covered) {
      issues.push(`[NAV-PHONE] ${rp}: no stylesheet this page loads defines "@media (max-width: 480px) { .nav-phone { display: none; } }" (checked its own inline <style> and shared.css if linked).`);
    }

    // The hide rule's whole justification is that the sticky bottom Call/Book
    // bar carries the call path below 480px. If the rule is in scope for this
    // page, that bar must actually exist here and must actually contain a
    // tel: link, the exact gap that shipped past review on PR #755 (see the
    // WIDENED 2026-08-19 note above).
    if (covered) {
      const stickyMatch = content.match(/class="sticky-mobile-bar"[\s\S]*?<\/div>/);
      const stickyHasTel = stickyMatch && /href="tel:[^"]*"/.test(stickyMatch[0]);
      if (!stickyHasTel) {
        issues.push(`[NAV-PHONE] ${rp}: header phone is hidden below 480px but this page has no sticky-mobile-bar tel: link to replace it as the mobile call path (P6-57b follow-up).`);
      }
    }
  }
}

// ── Check 12: non-person-reviewers ────────────────────────────────────────────
// A handful of data/testimonials.json records are flagged as NOT a real
// residential customer (e.g. a Google Maps business/music-entity listing that
// left a review under a normal-looking name), via `nameFlag: "non-person"` or
// a `_note` field matching /do not display/i. These must never be rendered as
// a displayed Review anywhere on the site — no hub, no homepage, no
// testimonials page. Catches drift where a flagged record is scrubbed from one
// page but left on another. Added 2026-07-25 after "Jeff Lane Songs" (a Google
// Maps music-entity listing, not a customer) was found still displayed on
// pages/testimonials.html even though it had already been removed from the
// brand hubs.
if (run('non-person-reviewers')) {
  checked['non-person-reviewers'] = { files: 0, blocked: 0 };
  const testimonialsJson = JSON.parse(fs.readFileSync(path.join(root, 'data', 'testimonials.json'), 'utf8'));
  const blockedNames = new Set(
    testimonialsJson.reviews
      .filter(r => r.nameFlag === 'non-person' || (typeof r._note === 'string' && /do not display/i.test(r._note)))
      .map(r => r.name.trim().toLowerCase())
  );
  checked['non-person-reviewers'].blocked = blockedNames.size;

  function walkReviewAuthors(node, filePath) {
    if (Array.isArray(node)) { node.forEach(n => walkReviewAuthors(n, filePath)); return; }
    if (!node || typeof node !== 'object') return;
    if (node['@type'] === 'Review' && node.author && typeof node.author.name === 'string') {
      const name = node.author.name.trim().toLowerCase();
      if (blockedNames.has(name)) {
        issues.push(`[NON-PERSON] ${rel(filePath)} — displays do-not-display reviewer "${node.author.name}"`);
      }
    }
    for (const v of Object.values(node)) if (v && typeof v === 'object') walkReviewAuthors(v, filePath);
  }

  for (const filePath of allHtml) {
    checked['non-person-reviewers'].files++;
    const content = fs.readFileSync(filePath, 'utf8');
    for (const m of content.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      let parsed; try { parsed = JSON.parse(m[1]); } catch { continue; }  // jsonld-valid reports parse errors
      walkReviewAuthors(parsed, filePath);
    }
  }
}

// ── Check 13: faq-jsonld-parity ───────────────────────────────────────────────
// Every visible FAQ accordion item must match its FAQPage JSON-LD entry exactly,
// comparing RENDERED TEXT (tags stripped, entities decoded, whitespace collapsed),
// and the JSON-LD must never contain raw HTML.
//
// Why this exists: until 2026-07-31 nothing in `npm test` checked FAQ parity at
// all — grepping content-integrity/links/html-integrity/css-vars for "FAQPage",
// "mainEntity" or "faq-a" returned zero hits. So "npm test passes" was silent on
// this, not evidence of it. That surfaced in the PR #655 review, where an <a> was
// added inside a FAQ answer and the only thing standing between that and a
// desynced rich result was authorial care.
//
// Comparing rendered text (not innerHTML) is the whole point. A link wrapped
// around words that already existed leaves the rendered text identical and is
// perfectly legal; a naive innerHTML comparator reports it as a mismatch. Google
// reads the JSON-LD, the user reads the DOM, and the requirement is that they say
// the same thing — not that they share markup.
// RATCHET, not a pass/fail sweep. When this check was written the site already had
// 375 drifted fields across 87 files (43% of all FAQ fields), because nothing had
// ever compared the two. Failing outright would just mean the check never ships.
// So: `test/faq-parity-baseline.json` records the known debt, and the check fails on
// anything NEW, anything that gets WORSE, and anything that has been FIXED but not
// removed from the baseline. That last rule is the anti-rot mechanism — the baseline
// can only ever shrink. Paying it down was tracked as P6-12.
// PAID DOWN IN FULL 2026-08-02: the baseline is now empty and the debt is 0, so every
// page is held to exact parity and any drift fails on the spot. The ratchet machinery
// below is unchanged and still load-bearing — it is what keeps the floor at zero.
if (run('faq-jsonld-parity')) {
  checked['faq-jsonld-parity'] = { files: 0, pairs: 0, baselineFields: 0, baselineFiles: 0 };
  const BASELINE = JSON.parse(fs.readFileSync(path.join(root, 'test', 'faq-parity-baseline.json'), 'utf8'));
  const known = BASELINE.drift || {};
  const knownCount = BASELINE.countMismatch || {};
  const seenDrift = {};
  const seenCountMismatch = {};
  checked['faq-jsonld-parity'].baselineFields = BASELINE.totalFields;
  checked['faq-jsonld-parity'].baselineFiles = BASELINE.totalFiles;

  const decode = (s) => s
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&rsquo;/g, '’').replace(/&lsquo;/g, '‘')
    .replace(/&ldquo;/g, '“').replace(/&rdquo;/g, '”')
    .replace(/&middot;/g, '·').replace(/&ndash;/g, '–').replace(/&mdash;/g, '—')
    .replace(/&rarr;/g, '→').replace(/&hellip;/g, '…');
  // strip tags FIRST, then decode, so an encoded &lt;b&gt; in copy is not eaten as markup
  const norm = (s) => decode(s.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();

  for (const filePath of allHtml) {
    const content = fs.readFileSync(filePath, 'utf8');

    // Collect FAQPage nodes (a page may hold more than one JSON-LD block)
    const ldPairs = [];
    let sawFaqPage = false;
    for (const m of content.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      let parsed; try { parsed = JSON.parse(m[1]); } catch { continue; }
      for (const node of (Array.isArray(parsed) ? parsed : [parsed])) {
        if (!node || node['@type'] !== 'FAQPage' || !Array.isArray(node.mainEntity)) continue;
        sawFaqPage = true;
        for (const q of node.mainEntity) {
          const a = q && q.acceptedAnswer;
          ldPairs.push({ q: typeof q.name === 'string' ? q.name : '', a: a && typeof a.text === 'string' ? a.text : '' });
        }
      }
    }
    if (!sawFaqPage) continue;
    checked['faq-jsonld-parity'].files++;

    // JSON-LD must be plain text: raw markup in a Question/Answer breaks the rich result
    for (const p of ldPairs) {
      for (const [field, val] of [['question', p.q], ['answer', p.a]]) {
        if (/<[a-z/][^>]*>/i.test(val)) {
          issues.push(`[FAQ-PARITY] ${rel(filePath)} — FAQPage ${field} contains raw HTML markup, which must be plain text: "${val.slice(0, 60)}..."`);
        }
      }
    }

    // Visible accordion: .faq-q is a <button> carrying a decorative +/- glyph, and
    // .faq-a is the answer div. Attribute-order tolerant. Two icon markups exist in
    // the wild — hubs use <span class="icon">, articles use
    // <span class="faq-icon" aria-hidden="true"> — so strip any span that is either
    // aria-hidden (decorative by definition, never announced) or icon-classed,
    // rather than matching one literal string.
    const stripDeco = (s) => s
      .replace(/<span\b[^>]*\baria-hidden="true"[^>]*>[\s\S]*?<\/span>/g, '')
      .replace(/<span\b[^>]*\bclass="[^"]*\bicon\b[^"]*"[^>]*>[\s\S]*?<\/span>/g, '')
      .replace(/<span\b[^>]*\bclass="[^"]*\bfaq-icon\b[^"]*"[^>]*>[\s\S]*?<\/span>/g, '');
    // THREE accordion markup families exist site-wide; all three must be parsed or
    // the check silently skips whole page classes:
    //   1. hubs      — <button class="faq-q">…</button> + <div class="faq-a">
    //   2. articles  — <div class="faq-q">…</div>       + <div class="faq-a">
    //   3. articles  — <div class="faq-item"><h3>Q</h3><p>A</p></div>  (no faq-q/faq-a)
    const vis = [];
    const Q = /<(button|div|h[2-4])\b[^>]*\bclass="[^"]*\bfaq-q\b[^"]*"[^>]*>([\s\S]*?)<\/\1>/g;
    const A = /<(div|p)\b[^>]*\bclass="[^"]*\bfaq-a\b[^"]*"[^>]*>([\s\S]*?)<\/\1>/g;
    let qs = [...content.matchAll(Q)].map(m => norm(stripDeco(m[2])));
    let as = [...content.matchAll(A)].map(m => norm(m[2]));

    if (qs.length === 0 && as.length === 0) {
      // family 3: heading + paragraph(s) inside .faq-item, no faq-q/faq-a classes.
      // CONSTRAINT: this non-greedy match stops at the FIRST </div>, so a .faq-item
      // containing a nested <div> would truncate. No page does that today (verified
      // across all 44 family-3 pages), and it fails SAFE if one ever does — the
      // truncated text surfaces as drift or a count mismatch, both loud. If you ever
      // need to wrap a FAQ answer in a <div>, switch this to a depth-aware scan.
      const ITEM = /<div\b[^>]*\bclass="[^"]*\bfaq-item\b[^"]*"[^>]*>([\s\S]*?)<\/div>/g;
      for (const m of content.matchAll(ITEM)) {
        const h = m[1].match(/<(h[2-4])\b[^>]*>([\s\S]*?)<\/\1>/);
        const ps = [...m[1].matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)].map(x => norm(x[1]));
        if (!h || !ps.length) continue;
        qs.push(norm(stripDeco(h[2])));
        as.push(ps.join(' '));
      }
    }
    for (let i = 0; i < Math.max(qs.length, as.length); i++) vis.push({ q: qs[i] ?? '', a: as[i] ?? '' });

    // Vacuous-pass guard: a FAQPage node with no parseable visible items means the
    // accordion markup changed and this check silently stopped checking anything.
    if (vis.length === 0) {
      issues.push(`[FAQ-PARITY] ${rel(filePath)} — has a FAQPage JSON-LD with ${ldPairs.length} entries but no .faq-q/.faq-a items could be parsed; the accordion markup changed and this check needs updating`);
      continue;
    }
    const r = rel(filePath);
    // A count mismatch used to `continue` here, which exempted the file from ALL text
    // checking — a fabricated JSON-LD answer on the one baselined count-mismatch file
    // passed clean. Now the count is reported, the file is marked seen so the cleanup
    // loop can retire it, and the overlapping pairs are still compared below.
    if (vis.length !== ldPairs.length) {
      const kc = knownCount[r];
      if (!kc || kc.visible !== vis.length || kc.jsonld !== ldPairs.length) {
        issues.push(`[FAQ-PARITY] ${r} — ${vis.length} visible FAQ item(s) but ${ldPairs.length} FAQPage JSON-LD entr(ies); they must correspond 1:1`);
      } else {
        seenCountMismatch[r] = true;
      }
    }

    let drift = 0;
    const detail = [];
    for (let i = 0; i < Math.min(vis.length, ldPairs.length); i++) {
      checked['faq-jsonld-parity'].pairs++;
      if (norm(ldPairs[i].q) !== vis[i].q) {
        drift++;
        detail.push(`             FAQ #${i + 1} question — visible: ${vis[i].q.slice(0, 80)}`);
        detail.push(`                              JSON-LD: ${norm(ldPairs[i].q).slice(0, 80)}`);
      }
      if (norm(ldPairs[i].a) !== vis[i].a) {
        drift++;
        detail.push(`             FAQ #${i + 1} answer   — visible: ${vis[i].a.slice(0, 80)}`);
        detail.push(`                              JSON-LD: ${norm(ldPairs[i].a).slice(0, 80)}`);
      }
    }

    const allowed = known[r] || 0;
    if (drift > allowed) {
      seenDrift[r] = drift;
      if (allowed === 0) {
        issues.push(`[FAQ-PARITY] ${r} — ${drift} FAQ field(s) differ between the visible page and the FAQPage JSON-LD. Google reads the JSON-LD, the user reads the page; they must say the same thing.`);
      } else {
        issues.push(`[FAQ-PARITY] ${r} — FAQ drift got WORSE: ${drift} field(s) now differ, baseline allows ${allowed}. Fix the new one, do not raise the baseline.`);
      }
      issues.push(...detail.slice(0, 6));
    } else if (drift < allowed) {
      // ratchet: a fixed file must be paid down in the baseline, or the debt silently persists.
      // Still record the real drift — the measured-vs-declared summary line is a trust signal
      // and must be accurate even on a failing run.
      if (drift > 0) seenDrift[r] = drift;
      issues.push(`[FAQ-PARITY] ${r} — FAQ drift IMPROVED (${allowed} → ${drift}). Update test/faq-parity-baseline.json: ${drift === 0 ? 'remove this file' : `set it to ${drift}`}. The baseline may only shrink.`);
    } else if (drift > 0) {
      seenDrift[r] = drift;
    }
  }

  // Retire stale baseline entries so the file cannot silently outlive the debt.
  // Both maps are swept: knownCount used to be a plain allowlist with no way out.
  // Path comparison is exact (===), not substring, so e.g. "washer-repair-orange-county"
  // cannot be masked by an issue mentioning "dishwasher-repair-orange-county".
  const namedInIssues = new Set(
    issues.map(i => (i.match(/^\[FAQ-PARITY\] (\S+)/) || [])[1]).filter(Boolean)
  );
  for (const f of Object.keys(known)) {
    if (f in seenDrift || namedInIssues.has(f)) continue;
    if (!fs.existsSync(path.join(root, f))) {
      issues.push(`[FAQ-PARITY] ${f} — listed in test/faq-parity-baseline.json but the file no longer exists. Remove it from the baseline.`);
    } else {
      issues.push(`[FAQ-PARITY] ${f} — listed in test/faq-parity-baseline.json but no drift was detected. Remove it from the baseline.`);
    }
  }
  for (const f of Object.keys(knownCount)) {
    if (f in seenCountMismatch || namedInIssues.has(f)) continue;
    issues.push(`[FAQ-PARITY] ${f} — listed under countMismatch in test/faq-parity-baseline.json but its visible and JSON-LD FAQ counts now agree. Remove it from the baseline.`);
  }

  // Report the MEASURED debt next to the declared one. Printing BASELINE.totalFields
  // alone is self-certifying: it echoes what the JSON claims, not what this run found.
  checked['faq-jsonld-parity'].measuredFields = Object.values(seenDrift).reduce((a, b) => a + b, 0);
  checked['faq-jsonld-parity'].measuredFiles = Object.keys(seenDrift).length;
}

// ── Check 15: contrast-aa ─────────────────────────────────────────────────────
// Every CSS rule that declares BOTH a literal-hex color and a literal-hex
// background must clear the WCAG AA threshold: 4.5:1 for body text, 3:1 for large
// text (>=24px, or >=18.66px at weight >=700).
//
// Added 2026-07-31. The #655 design critique found .cta-box at 3.83:1 and the
// footer at 4.38:1; fixing only those two (PR #657) turned out to be treating
// symptoms. A systematic scan then found 18 failing rule/colour combinations
// across 86 files, all the same root cause: #e84c1e (craftsmans-ember) is 3.83:1
// against white in BOTH directions, so it cannot carry small text as a background
// OR as a foreground. It was doing both, on .sticky-call, .inline-cta,
// .inline-cta a, .tip-num, .tip-badge, .btn-white, .read-more and more.
//
// Fix direction: white-on-brand darkens the BACKGROUND to #cc3d12 (4.95:1);
// brand-on-light darkens the TEXT to #aa3210 (6.62:1), which is precisely what
// --brand-text exists for ("WCAG AA for small text on any light bg").
//
// WHAT THIS CANNOT SEE — stated in full, with measured counts, because an
// incomplete disclosure reads as an exhaustive one. It inspects the ~1,609 rules
// that declare BOTH properties in the same block. Blind spots:
//
//   1. Cross-rule cascade — 5,389 rules declare only one of the two, so the pair
//      only exists at render time. 203 of them use #e84c1e as a text colour
//      (.breadcrumb a:hover x71, .nav-dropdown-menu .dropdown-all x69,
//      .article-toc a x19, .blog-link x8 ...). Tracked as P6-15.
//   2. Inline style="" — 7,127 attributes; 40 rendered text nodes actually fail
//      (258 merely mention #e84c1e, so a bulk replace would hit 218 legitimate
//      uses). Also P6-15.
//   3. rgba() and colour keywords, which need compositing / runtime resolution.
//
// var() IS resolved (see below), so `var(--brand)` is no longer a hiding place.
// The genuine fix for buckets 1 and 2 is the in-browser probe in
// test/functional.spec.js, which measures the real painted result. That probe
// currently covers 6 selectors on 6 pages, NOT the whole site — do not read the
// deferred count in the summary line as "covered elsewhere".
if (run('contrast-aa')) {
  checked['contrast-aa'] = { pairs: 0, skippedVar: 0, files: 0 };
  const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const h2r = (h) => {
    h = h.replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16));
  };
  const lum = (r) => 0.2126 * lin(r[0]) + 0.7152 * lin(r[1]) + 0.0722 * lin(r[2]);
  const contrast = (a, b) => { const [x, y] = [lum(h2r(a)), lum(h2r(b))].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
  const HEXRE = /#[0-9a-fA-F]{3,8}\b/;
  const seen = new Map();

  // Resolve var(--token) from the :root table in shared.css before testing, chasing
  // aliases (--brand-text: var(--brand-deeper)). Without this the check was blind to
  // exactly the shape holding most of the remaining failures: `.cost-table th` is
  // white 12.5px/700 on `var(--brand)` on 25 files — the identical root cause, spelled
  // differently. Found in the PR #658 review.
  const TOKENS = {};
  {
    const css = fs.readFileSync(path.join(root, 'shared.css'), 'utf8');
    const rootBlock = (css.match(/:root\s*\{([\s\S]*?)\}/) || [, ''])[1];
    for (const d of rootBlock.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) TOKENS[d[1]] = d[2].trim();
  }
  const deref = (v, depth = 0) => {
    if (depth > 6) return v;                       // cycle guard
    const m = v.match(/var\(\s*(--[\w-]+)\s*(?:,\s*([^)]+))?\)/);
    if (!m) return v;
    const resolved = TOKENS[m[1]] !== undefined ? TOKENS[m[1]] : (m[2] || '');
    return resolved ? deref(v.replace(m[0], resolved.trim()), depth + 1) : v;
  };

  for (const filePath of allHtml.concat([path.join(root, 'shared.css')])) {
    if (!fs.existsSync(filePath)) continue;
    checked['contrast-aa'].files++;
    const src = fs.readFileSync(filePath, 'utf8');
    for (const m of src.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
      const body = m[2];
      const cm = body.match(/(?:^|[;{\s])color\s*:\s*([^;]+)/);
      const bm = body.match(/(?:^|[;{\s])background(?:-color)?\s*:\s*([^;]+)/);
      if (!cm || !bm) continue;
      const cRaw = deref(cm[1].trim()), bRaw = deref(bm[1].trim());
      if (!HEXRE.test(cRaw) || !HEXRE.test(bRaw)) {
        checked['contrast-aa'].skippedVar++;       // still unresolvable: rgba(), keywords, image
        continue;
      }
      const cHex = (cRaw.match(HEXRE) || [])[0];
      const bHexes = bRaw.match(/#[0-9a-fA-F]{3,8}\b/g) || [];
      // 8-digit (#rrggbbaa) and 4-digit hex carry alpha, which this check cannot
      // composite. h2r() would silently read them as opaque and report a ratio that
      // is not what renders, so skip and count them instead of guessing.
      const hasAlpha = (h) => h.replace('#', '').length === 8 || h.replace('#', '').length === 4;
      if (hasAlpha(cHex) || bHexes.some(hasAlpha)) { checked['contrast-aa'].skippedVar++; continue; }
      if (!cHex || !bHexes.length) continue;
      const size = parseFloat((body.match(/font-size\s*:\s*([\d.]+)px/) || [, '16'])[1]);
      const weight = parseInt((body.match(/font-weight\s*:\s*(\d+)/) || [, '400'])[1], 10);
      const large = size >= 24 || (size >= 18.66 && weight >= 700);
      const need = large ? 3 : 4.5;
      // Naming the rule accurately matters: a CI failure that says
      // "@media (max-width:768px)" instead of ".zz-probe" is needlessly hard to find.
      // For the FIRST rule inside an at-rule, the flat regex captures the at-rule as
      // the prelude and swallows the real selector into the body, so recover it from
      // the last `… {` inside the body.
      const nested = body.match(/([^{};]+)\{[^{}]*$/);
      const preludeLines = m[1].trim().split('\n').map(x => x.trim()).filter(Boolean);
      let sel = preludeLines[preludeLines.length - 1] || '';
      if (/^@/.test(sel)) {
        const inner = body.match(/([^{};\n]+)\s*\{/);
        sel = inner ? `${inner[1].trim()}  [in ${sel}]` : `${sel} (first rule in block)`;
      }
      if (nested && !/^@/.test(sel)) sel = nested[1].trim() || sel;
      sel = sel.slice(0, 70);
      for (const bHex of bHexes) {          // a gradient is checked at EVERY stop
        let r;
        try { r = contrast(cHex, bHex); } catch { continue; }
        checked['contrast-aa'].pairs++;
        if (r >= need) continue;
        const key = `${sel} :: ${cHex} on ${bHex}`;
        if (!seen.has(key)) seen.set(key, { r, need, size, weight, files: [] });
        seen.get(key).files.push(rel(filePath));
      }
    }
  }
  for (const [key, v] of seen) {
    const [sel, colors] = key.split(' :: ');
    issues.push(`[CONTRAST] ${sel} — ${colors} is ${v.r.toFixed(2)}:1, below the ${v.need}:1 AA floor for ${v.size}px/${v.weight} text (${v.files.length} file(s), e.g. ${v.files[0]})`);
  }
}

// ── Check 16: faq-schema-presence ─────────────────────────────────────────────
// Any page rendering a real FAQ accordion (>=3 items) must carry a FAQPage
// JSON-LD node.
//
// P6-13, raised in the PR #656 review. `faq-jsonld-parity` compares the two when
// BOTH exist, so deleting an entire FAQPage block passes it clean — "did you
// delete your schema" is a presence assertion, not a parity assertion, and
// folding it into the parity check would muddy a clean abstraction. All 137 FAQ
// pages already comply, so this ships green: it is purely a regression guard
// against a future edit silently dropping the rich result.
//
// The >=3 floor is deliberate. A page with one or two collapsible blocks may be
// using the accordion for something that is not a FAQ, and Google's own guidance
// is that FAQPage is for genuine question/answer content.
if (run('faq-schema-presence')) {
  checked['faq-schema-presence'] = { pages: 0 };
  for (const filePath of allHtml) {
    const content = fs.readFileSync(filePath, 'utf8');
    const items = (content.match(/class="[^"]*\bfaq-item\b/g) || []).length;
    const qs = (content.match(/class="[^"]*\bfaq-q\b/g) || []).length;
    const n = Math.max(items, qs);
    if (n < 3) continue;
    checked['faq-schema-presence'].pages++;
    // Parse the JSON-LD rather than substring-match: this codebase already ships
    // "@type": ["CollectionPage", "ImageGallery"], so a future ["FAQPage", ...] would
    // evade a raw string test. Copilot flagged this on PR #659.
    let hasFaqPage = false;
    for (const m of content.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      let parsed; try { parsed = JSON.parse(m[1]); } catch { continue; }
      const walk = (node) => {
        if (Array.isArray(node)) return node.forEach(walk);
        if (!node || typeof node !== 'object') return;
        const t = node['@type'];
        if (t === 'FAQPage' || (Array.isArray(t) && t.includes('FAQPage'))) hasFaqPage = true;
        for (const v of Object.values(node)) if (v && typeof v === 'object') walk(v);
      };
      walk(parsed);
    }
    if (!hasFaqPage) {
      issues.push(`[FAQ-SCHEMA] ${rel(filePath)} — renders ${n} FAQ accordion items but has no FAQPage JSON-LD node, so the rich result is lost. Add one, matching the visible copy verbatim (see the faq-jsonld-parity check).`);
    }
  }
}

// ── Check 17: gallery-parity ──────────────────────────────────────────────────
// Any page carrying an ImageGallery JSON-LD node must list EXACTLY the photos it
// actually renders: same set, no extras, no omissions, no duplicates, and every
// listed file must exist on disk.
//
// P6-6. pages/recent-repairs.html shipped 33 rendered repair photos against 29
// ImageObject entries — four repairs (both LG compressor shots, the Viking range,
// the KitchenAid control board) were invisible to Google Images and to anything
// reading the structured data. Nothing caught it: jsonld-valid only parses the
// block, and the link checker only follows <a href>. The four entries are the
// symptom; this check is the fix, because the gap reopens every time a card is
// added and the schema is not.
//
// Deliberately NOT keyed on `.repair-card` or on a filename. The page is
// discovered by its schema (@type contains "ImageGallery"), and the image
// directories to compare against are derived from the gallery's own contentUrls,
// so a second gallery page elsewhere is covered the day it ships. <source
// srcset> variants (…-480w.webp) are ignored: those are responsive derivatives
// of the same photo, and schema.org wants one ImageObject per image.
if (run('gallery-parity')) {
  checked['gallery-parity'] = { pages: 0, images: 0 };
  const base = 'https://fixappliancesfast.com/';
  const dirEntries = new Map();   // dir -> Set of real, case-exact filenames
  for (const filePath of allHtml) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (!content.includes('ImageGallery')) continue;

    const listed = [];
    let declaresGallery = false;
    for (const m of content.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      let parsed; try { parsed = JSON.parse(m[1]); } catch { continue; }
      // Collect from a gallery node's OWN `image` property only. An earlier version propagated
      // "we are inside a gallery" to every descendant, which meant a publisher.logo or a
      // VideoObject.thumbnailUrl hanging off the same node counted as a gallery photo and got
      // reported as "listed but not rendered". Proved with a real fixture in the PR #668 review.
      const fromImage = (node) => {
        if (Array.isArray(node)) return node.forEach(fromImage);
        if (typeof node === 'string') return listed.push(node);   // image: ["url", …] form
        if (node && typeof node === 'object' && typeof node.contentUrl === 'string') listed.push(node.contentUrl);
      };
      const walk = (node) => {
        if (Array.isArray(node)) return node.forEach(walk);
        if (!node || typeof node !== 'object') return;
        const t = node['@type'];
        if (t === 'ImageGallery' || (Array.isArray(t) && t.includes('ImageGallery'))) {
          declaresGallery = true;
          if (node.image) fromImage(node.image);
        }
        for (const v of Object.values(node)) if (v && typeof v === 'object') walk(v);
      };
      walk(parsed);
    }
    // The substring test above is only a cheap prefilter. A page that merely MENTIONS
    // "ImageGallery" in prose or an HTML comment declares nothing, and must not be dragged
    // into this check — that false positive was also found in the PR #668 review.
    if (!declaresGallery) continue;
    if (!listed.length) {
      issues.push(`[GALLERY] ${rel(filePath)} — declares an ImageGallery but the node lists no ImageObject contentUrl at all. Either populate image[] or drop the ImageGallery type.`);
      continue;
    }
    checked['gallery-parity'].pages++;
    checked['gallery-parity'].images += listed.length;

    // Directories the gallery itself points at, e.g. "images/real/business".
    const dirs = new Set(listed.map(u => u.replace(base, '').replace(/^\//, '')).map(p => path.posix.dirname(p)));
    const bn = u => u.split('/').pop();
    const listedNames = listed.map(bn);

    const dupes = listedNames.filter((n, i) => listedNames.indexOf(n) !== i);
    for (const d of new Set(dupes)) {
      issues.push(`[GALLERY] ${rel(filePath)} — ${d} appears ${listedNames.filter(n => n === d).length}× in the gallery's image[]. One ImageObject per photo.`);
    }

    // KNOWN TRADEOFF (raised in the PR #668 review, kept on purpose): this collects every <img>
    // sourced from a directory the gallery uses, not every <img> inside a gallery card. So a
    // future non-gallery photo on this page drawn from images/real/business/ (a hero, a trust
    // badge) would be demanded as a gallery entry. That is the safe direction to fail: it is
    // loud, names the file, and is resolved by adding an entry or moving the image. Scoping to a
    // card container instead would hard-code `.repair-card` and silently miss any card the page
    // renders through different markup — the exact drift this check exists to catch.
    const rendered = [...content.matchAll(/<img[^>]+src="([^"]+)"/g)]
      .map(m => m[1])
      .filter(src => [...dirs].some(d => src.includes(d + '/')))
      .map(bn);

    for (const name of new Set(rendered)) {
      if (!listedNames.includes(name)) {
        issues.push(`[GALLERY] ${rel(filePath)} — renders ${name} but no ImageObject lists it, so that repair is missing from the structured data. Add an entry with name/description/contentLocation matching the card.`);
      }
    }
    for (const name of new Set(listedNames)) {
      if (!rendered.includes(name)) {
        issues.push(`[GALLERY] ${rel(filePath)} — the gallery lists ${name} but the page does not render it. Schema must describe what is on the page.`);
      }
    }
    for (const url of listed) {
      if (!url.startsWith(base)) {
        issues.push(`[GALLERY] ${rel(filePath)} — contentUrl "${url}" is not an absolute ${base} URL.`);
        continue;
      }
      const relPath = url.slice(base.length);
      const onDisk = path.join(root, relPath);
      if (!fs.existsSync(onDisk)) {
        issues.push(`[GALLERY] ${rel(filePath)} — contentUrl points at ${relPath}, which does not exist in the repo.`);
        continue;
      }
      // existsSync alone is not enough. This repo is developed on Windows and the deploy target
      // (GitHub Pages) is case-sensitive, so a wrong-case filename passes locally and 404s in
      // production. Compare against the real directory entry. Flagged in the PR #668 review.
      const dirOnDisk = path.dirname(onDisk);
      if (!dirEntries.has(dirOnDisk)) dirEntries.set(dirOnDisk, new Set(fs.readdirSync(dirOnDisk)));
      if (!dirEntries.get(dirOnDisk).has(path.basename(onDisk))) {
        issues.push(`[GALLERY] ${rel(filePath)} — contentUrl points at ${relPath}, which exists on disk only under different capitalisation. GitHub Pages is case-sensitive, so this 404s in production.`);
      }
    }
  }
}

// ── Check 18: brand-tier ──────────────────────────────────────────────────────
// Two rules-defined values that nothing enforced until 2026-08-03:
//   (a) a brand may only be listed inside a PREMIUM enumeration if it is actually
//       a premium brand per .claude/skills/seo-content/SKILL.md;
//   (b) a stated company diagnostic fee must be one of the rule-defined values.
//
// Origin: Bosch was marketed as a premium brand on three cost hubs (washer,
// dryer, dishwasher) and six city hubs, in visible copy AND in FAQPage JSON-LD,
// while seo-content.md tiers it as a STANDARD brand at the $75–$100 service-call
// range. Owner confirmed 2026-08-03 that Bosch is not premium — it has premium
// *product lines*, which is a different claim and is why the scope test below is
// structural rather than textual.
//
// SCOPE — three machine-checkable shapes are gated:
//   1. the `.brand-tier.premium` cost-hub card,
//   2. a `Premium (…)` / `premium brands (…)` parenthetical,
//   3. the `.brand-pill.premium` chip inside a "Premium & Luxury Brands" group
//      on the city hubs. Shape 3 was the one that actually mattered and it was
//      MISSED by the first version of this check: Bosch shipped as a premium
//      pill on 31 of 31 city hubs, styled with the accent border beside Sub-Zero
//      and Wolf, while the first two shapes were being cleaned up. Caught by the
//      PR #670 reviewer. If you add a fourth way to render a brand tier, add it
//      here too.
//
// Prose is deliberately NOT gated. "Premium kitchens with Sub-Zero and Thermador,
// alongside Bosch dishwashers" is correct but not mechanically distinguishable
// from a tier claim. A checker that guesses at English produces false failures
// and gets muted, which is worse than a narrow checker that is always right.
//
// THE TEST IS INVERTED ON PURPOSE. It does not require every listed name to be a
// known premium brand; it rejects names that are known STANDARD brands. That
// difference kills three false-positive classes the PR #670 reviewer found by
// fixture: ordinary prose parentheticals ("premium (fast, reliable) service"),
// `&`-joined pairs ("Sub-Zero & Wolf") that comma-splitting mangles into one
// token, and any brand the rules simply do not tier (Speed Queen), which no
// longer needs a hard-coded exception. An unknown name is not evidence of a
// mistake; a known standard brand in a premium group is.
//
// Line-scoped references stay legal because they are not exact brand names:
// "Bosch Premium", "Bosch 800 Series" and "Benchmark" never equal "Bosch".
if (run('brand-tier')) {
  // Standard-tier brands per seo-content.md ($75–$100 service-call range). These
  // may never appear inside a premium enumeration.
  const STANDARD = new Set(['Whirlpool', 'GE', 'Samsung', 'LG', 'KitchenAid', 'Maytag',
                            'Frigidaire', 'Kenmore', 'Bosch', 'Electrolux', 'Amana', 'Hotpoint']);
  // seo-content.md defines TWO company fees: $99 (OC + LA County, all brands) and
  // $120 (Riverside). The $49 additional-unit price is a policy line that lives in
  // llms.txt, NOT in seo-content.md — it is allowed here so a legitimate page cannot
  // fail, but the message below must not attribute it to the rules file. Flagged by
  // Copilot on PR #670. (The regex below keys on the word "fee", so the usual
  // "each additional unit ... $49" phrasing is not actually reached; this entry is
  // belt-and-braces for a page that does word it as a fee.)
  const FEES = new Set(['99', '120', '49']);
  checked['brand-tier'] = { pages: 0, lists: 0, fees: 0 };

  for (const filePath of allHtml) {
    const content = fs.readFileSync(filePath, 'utf8');
    let touched = false;

    const lists = [
      ...content.matchAll(/<div class="brand-tier premium">[\s\S]*?<\/div>\s*<h3>([^<]*)<\/h3>/g),
      ...content.matchAll(/[Pp]remium(?: brands)? \(([^)]{0,120})\)/g),
      ...content.matchAll(/class="brand-pill premium"[^>]*>([^<]+)</g),
    ];
    for (const m of lists) {
      // Split on commas AND ampersands. Comma-only splitting let an `&`-joined pair of
      // STANDARD brands ("Premium brands (Whirlpool & GE)") survive as one compound token
      // that matches nothing and passes — the mirror-image false NEGATIVE of the false
      // positives the inverted test fixed. Found by the PR #670 reviewer. Splitting on `&`
      // does not reintroduce them: "Sub-Zero" and "Wolf" split apart are both premium.
      const brands = m[1].split(/,|&amp;|&/).map(b => b.replace(/&amp;/g, '&').trim()).filter(Boolean);
      if (!brands.length) continue;
      checked['brand-tier'].lists++; touched = true;
      for (const b of brands) {
        if (!STANDARD.has(b)) continue;
        issues.push(`[BRAND-TIER] ${rel(filePath)} — "${b}" is a standard-tier brand per .claude/skills/seo-content/SKILL.md ($75–$100 service call), but it is listed as premium in "${m[1].trim()}". Move it to the standard/mass-market group (visible copy AND the matching FAQ JSON-LD, or faq-jsonld-parity will fail), or change the rule. A premium PRODUCT LINE is a different claim and is written differently: "Bosch Premium", "Bosch 800 Series", "Benchmark".`);
      }
    }

    for (const m of content.matchAll(/\$(\d{2,4})\b[^.<]{0,30}?\b(?:flat )?(?:diagnostic|service[- ]call) fee|(?:diagnostic|service[- ]call) fee (?:is |of )?\$(\d{2,4})\b/g)) {
      const val = m[1] || m[2];
      checked['brand-tier'].fees++; touched = true;
      if (!FEES.has(val)) {
        issues.push(`[BRAND-TIER] ${rel(filePath)} — states a $${val} diagnostic fee. seo-content.md defines two company fees: $99 (Orange County + LA County, all brands) and $120 (Riverside County). The only other allowed value is $49, the additional-unit price documented in llms.txt.`);
      }
    }
    if (touched) checked['brand-tier'].pages++;
  }
}

// ── Check 19: tel-target ──────────────────────────────────────────────────────
// Every `tel:` href must be a dialable E.164 US number, and the whole site must
// agree on ONE number. This was an unguarded assumption until 2026-08-09, when a
// scan found 7 `tel:+194****5365` links live on two hub pages — including the
// sticky mobile call bar on the Long Beach hub, which is the primary mobile
// booking CTA. A masked number does not dial, so every one of those taps was dead.
// Nothing caught it: test/links.js only resolves internal .html hrefs, and the
// `phone_click` handler in analytics.js fires on the click regardless of whether
// the target can be dialed, so the GA4 event count looked normal while the calls
// went nowhere.
//
// Format alone is not enough — a transposed digit is well-formed and still wrong —
// so this also requires every tel: target on the site to be identical.
if (run('tel-target')) {
  const E164_US = /^tel:\+1[0-9]{10}$/;
  const byTarget = new Map();   // target href -> [file, ...]
  let total = 0;

  // Scan the served pages PLUS partials/. collectHtmlFiles skips partials because
  // they are stamped into pages rather than served, but they are the *source* of 4
  // of these links (footer + nav). Catching a break in the partial beats catching it
  // after build:partials has copied it into every page on the site.
  const partialsDir = path.join(root, 'partials');
  const partialFiles = fs.existsSync(partialsDir)
    ? fs.readdirSync(partialsDir).filter(f => f.endsWith('.html')).map(f => path.join(partialsDir, f))
    : [];

  for (const filePath of [...allHtml, ...partialFiles]) {
    const content = fs.readFileSync(filePath, 'utf8');
    // Case-insensitive: URI schemes are case-insensitive per RFC 3966, so `TEL:`
    // dials exactly like `tel:`. Matching only lowercase would let a mixed-case
    // scheme carrying a broken number pass invisibly — not counted as malformed,
    // not grouped for the equality test, absent from the totals entirely.
    // The scheme is normalised so `TEL:+1…` and `tel:+1…` group as one target.
    for (const m of content.matchAll(/href\s*=\s*["'](tel:[^"']*)["']/gi)) {
      const target = m[1].replace(/^tel:/i, 'tel:');
      total++;
      if (!byTarget.has(target)) byTarget.set(target, []);
      byTarget.get(target).push(rel(filePath));
    }
  }

  // (a) Malformed targets — these cannot dial at all.
  for (const [target, files] of byTarget) {
    if (E164_US.test(target)) continue;
    const where = [...new Set(files)];
    issues.push(`[TEL-TARGET] "${target}" is not a dialable E.164 US number (expected tel:+1 then 10 digits) — ${files.length} link(s) across ${where.join(', ')}`);
  }

  // (b) More than one well-formed number means the site disagrees with itself.
  //     The most-used value is treated as canonical purely to make the message
  //     actionable; both sides are reported.
  const wellFormed = [...byTarget.entries()]
    .filter(([t]) => E164_US.test(t))
    .sort((a, b) => b[1].length - a[1].length);

  if (wellFormed.length > 1) {
    const canonical = wellFormed[0][0];
    for (const [target, files] of wellFormed.slice(1)) {
      const where = [...new Set(files)];
      issues.push(`[TEL-TARGET] "${target}" disagrees with the site-wide number "${canonical}" — ${files.length} link(s) across ${where.join(', ')}. If the business genuinely has a second number, update this check.`);
    }
  }

  checked['tel-target'] = {
    links: total,
    distinct: byTarget.size,
    canonical: wellFormed.length ? wellFormed[0][0] : null
  };
}

// ── Check 20: umbrella-range ──────────────────────────────────────────────────
// Inside a single FAQ answer (or a single .ai-block <p> of AI-answer-block
// prose), a "governing" summary range must actually bound every other dollar
// range itemized in the same block. Found live on 11 cost-hub FAQ/AI-answer
// blocks (branch fix/cost-hub-price-contradictions, 2026-08-16): e.g. "Most
// washing machine repairs in Orange County run between $120 and $450 all-in ...
// The big two, a drive motor or a control board, reach $230 to $490" told the
// reader two different ceilings in one paragraph.
//
// SCOPE, deliberately narrow: only FAQPage JSON-LD answer text and `.ai-block p`
// prose are scanned. FAQ answers are read from JSON-LD (already plain text, and
// kept in sync with the visible accordion by faq-jsonld-parity), so no
// tag-stripping is needed there.
//
// GOVERNING-RANGE DETECTION was tightened across three rounds against real
// corpus false positives (see below); a naive "first verb-shaped range wins"
// implementation produced 53 flags across 25 files this branch never touched,
// almost all genuinely not the same defect:
//
// ROUND 1 finding: a governing range must be BOTH the first dollar range in the
// block AND verb-shaped (run/runs/land/lands/fall/falls/cost/costs, optional
// "between", range immediately after). Two real blocks (gas-vs-electric-range's
// gas FAQ, sub-zero-repair-cost's compressor FAQ) itemize per-part prices FIRST
// and only add a "most jobs run/fall $X-$Y" sentence near the end: a trailing
// "typical total", not a bounding claim on what came before it. When the first
// range in a block is not verb-shaped, the block is skipped.
//
// ROUND 2 finding: verb-shaped plus first-range still was not enough. The
// dominant false-positive shape sitewide is a single compound sentence that
// distributes ONE verb across a comma-joined list of named parts, each with its
// own price ("Typical GE repairs run $250 to $480 FOR a refrigerator control
// board, $180 to $360 FOR an ice-maker..."), where the first range prices only
// the first named part, not "typical GE repairs" as a whole, despite matching
// the verb-shape test. A second, unrelated shape stacks two independent topics
// in one JSON-LD answer (a combined "washer + dryer" FAQ, or a 7-appliance
// AI-answer-block paragraph), where the second topic's own umbrella statement
// gets wrongly checked against the first topic's ceiling. Two structural
// (non-hardcoded) rules close both:
//   (a) the governing candidate's OWN sentence (bounded by the nearest '.' on
//       either side) must contain exactly that ONE range. A parallel "for X, for
//       Y" list or a combined multi-topic sentence always has more than one
//       range in the same sentence and is rejected.
//   (b) the governing candidate's subject (the text between the sentence start
//       and the verb) must name "repair(s)" within its first 40 characters: the
//       true grammatical subject, not a trailing appositive. This is what every
//       confirmed umbrella statement in this corpus shares ("Most X repairs...",
//       "[Appliance] repair in [City]..."), and what disqualifies "A bake
//       igniter replacement, the most common Wolf oven no-heat repair, runs
//       $250 to $450" (the word "repair" is there, but 65 characters in, as an
//       aside on a SPECIFIC part, not the sentence's subject).
//   (c) once a valid governing range is found, a LATER sentence whose own
//       subject also names "repair(s)" near its start marks a new topic (e.g. a
//       combined washer+dryer answer). Checking stops at that boundary; ranges
//       from that point on are this rule's blind spot, not a violation. Side
//       effect, noted rather than hidden: an ordinary itemized clause that
//       happens to reuse the word "repairs" ("Mid-range repairs like a heating
//       element... run $130 to $250") also trips this boundary, so a couple of
//       genuine same-shape violations on untouched files
//       (article-dryer-repair-cost-orange-county.html,
//       article-washer-repair-irvine.html) stop being checked past that point.
//       This is an accepted, documented coverage loss, not a deliberate
//       exemption for those two files.
//
// ROUND 3 finding: only the UPPER bound is enforced (see the check body). A
// sub-item priced below the governing floor is not the "reader gets two
// ceilings" contradiction this check targets, it is a typical/median statement
// legitimately admitting a cheaper outlier. Flagging lower-bound undershoots
// produced a false positive on pages/washer-repair-cost-orange-county.html, a
// file this branch DID fix, on a $100-$220 sub-range that was never touched by
// the fix (present, unchanged, in both the pre-fix and current text). The same
// round widened the premium/brand-scope exemption to match the word "premium"
// itself, not just the five named brands, and to look both before AND after the
// range: this closed the one remaining flag on article-repair-replace.html
// ("Refrigerators tend to be more expensive ($200 to $700, higher for premium
// brands)"), a genuine premium-tier segmentation per seo-content.md's own
// brand-tier system.
//
// Net result: zero flags across the full corpus today. The (b)/(c) coverage
// loss noted above still stands as a real, documented gap on the two named
// files; a future pass that finds a sharper distinguishing signal (or fixes
// those files outright) can restore full coverage there without weakening
// anything this check currently enforces.
//
// Two exemptions are structural, not textual, matching .claude/skills/seo-content/SKILL.md
// and the PR #696 precedent:
//   1. The sanctioned escape hatch: "The one exception above that range is
//      [item], which runs $X-$Y." is stripped out BEFORE governing-range
//      detection, so its own range can never be mistaken for the umbrella, and
//      it is never checked against one.
//   2. Premium/brand-scoped segmentation: a range whose 80 characters of leading
//      context name a premium brand (Sub-Zero, Wolf, Viking, Thermador, Miele)
//      is deliberate segmentation, not a violation.
// Bare single figures ($99 diagnostic fee, the $49 additional-unit line) never
// match the two-number range pattern below, so they are excluded automatically
// without a dedicated rule for them.
if (run('umbrella-range')) {
  checked['umbrella-range'] = { files: 0, blocks: 0, governingRanges: 0, rangesChecked: 0 };

  const num = (s) => parseInt(s.replace(/,/g, ''), 10);
  const CONNECT = '(?:to|and|–|-)';
  // Any two-number dollar range, e.g. "$100 to $350", "$120-$450", "$230 to $490+".
  const RANGE_SRC = `\\$([\\d,]+)\\s*${CONNECT}\\s*\\$([\\d,]+)\\+?`;
  const RANGE_RE = new RegExp(RANGE_SRC, 'g');
  // Verb-anchored "governing" shape: the range must sit immediately after the verb
  // (an optional "between" is the only filler allowed).
  const GOVERN_RE = new RegExp(`\\b(?:run|runs|land|lands|fall|falls|cost|costs)\\s+(?:between\\s+)?${RANGE_SRC}`, 'gi');
  // Sanctioned escape hatch, PR #696: "The one exception above that range is X, which runs $A-$B."
  const EXCEPTION_RE = new RegExp(`The one exception above that range is[^.]*?${RANGE_SRC}`, 'g');
  // ROUND 3 finding: seo-content.md's own brand-tier system treats "premium" as a
  // defined tier, not just the 5 brand names spelled out. One remaining block
  // (article-repair-replace.html) scopes a higher refrigerator range with
  // "...higher for premium brands)" rather than naming a specific brand, and a
  // LATER sentence in the same block ("Premium appliances like Sub-Zero or Viking
  // usually run higher...") confirms the same segmentation. Matching "premium" as
  // a word, in a window that looks BOTH before and after the range (not only
  // before), closes this without a file-specific carve-out.
  const SCOPE_RE = /\b(Sub-Zero|Wolf|Viking|Thermador|Miele|premium)\b/i;
  const REPAIR_WORD = /\brepairs?\b/i;
  const SUBJECT_WINDOW = 40; // "repair(s)" must appear this close to the sentence start to count as the true subject, not a trailing aside

  function extractBlocks(content) {
    const blocks = [];
    for (const m of content.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      let parsed; try { parsed = JSON.parse(m[1]); } catch { continue; } // jsonld-valid reports parse errors
      const walk = (node) => {
        if (Array.isArray(node)) return node.forEach(walk);
        if (!node || typeof node !== 'object') return;
        if (node['@type'] === 'FAQPage' && Array.isArray(node.mainEntity)) {
          for (const q of node.mainEntity) {
            const a = q && q.acceptedAnswer;
            if (a && typeof a.text === 'string') blocks.push({ label: 'FAQ answer', text: a.text });
          }
        }
        for (const v of Object.values(node)) if (v && typeof v === 'object') walk(v);
      };
      walk(parsed);
    }
    for (const m of content.matchAll(/<div\b[^>]*\bclass="[^"]*\bai-block\b[^"]*"[^>]*>([\s\S]*?)<\/div>/g)) {
      for (const p of m[1].matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)) {
        const text = p[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ');
        blocks.push({ label: 'AI answer block', text });
      }
    }
    return blocks;
  }

  for (const filePath of allHtml) {
    const content = fs.readFileSync(filePath, 'utf8');
    const blocks = extractBlocks(content);
    if (!blocks.length) continue;
    checked['umbrella-range'].files++;

    for (const { label, text } of blocks) {
      checked['umbrella-range'].blocks++;

      // Carve the sanctioned exception clause(s) out first, both so their range
      // is never picked up as the governing range and so they are never checked
      // against one.
      const clean = text.replace(EXCEPTION_RE, ' ');

      RANGE_RE.lastIndex = 0;
      const firstRange = RANGE_RE.exec(clean);
      if (!firstRange) continue; // no dollar range in this block at all

      // Collect every verb-anchored ("governing-shaped") match in the block, each
      // annotated with whether its OWN sentence carries just that one range (not
      // a parallel "for X, for Y" list or a second stacked topic) and whether its
      // subject names "repair(s)" near the start (the true grammatical subject,
      // not a trailing aside on one named part). See the ROUND 2 note above.
      GOVERN_RE.lastIndex = 0;
      const candidates = [];
      let gm;
      while ((gm = GOVERN_RE.exec(clean))) {
        const dollarIndex = gm.index + gm[0].indexOf('$');
        const sentenceStart = clean.lastIndexOf('.', dollarIndex) + 1;
        const periodAfter = clean.indexOf('.', dollarIndex);
        const sentenceEnd = periodAfter === -1 ? clean.length : periodAfter;
        const subject = clean.slice(sentenceStart, dollarIndex);
        const ownSentenceRangeCount = (clean.slice(sentenceStart, sentenceEnd).match(new RegExp(RANGE_SRC, 'g')) || []).length;
        candidates.push({
          dollarIndex,
          A: num(gm[1]), B: num(gm[2]),
          hasSubjectRepair: REPAIR_WORD.test(subject.slice(0, SUBJECT_WINDOW)),
          singleRangeSentence: ownSentenceRangeCount === 1,
        });
      }

      const gov = candidates.find(c => c.dollarIndex === firstRange.index && c.hasSubjectRepair && c.singleRangeSentence);
      if (!gov) continue; // no reliable umbrella in this block; see docblock

      const { B, dollarIndex: govDollarIndex } = gov; // only the ceiling (B) is enforced; see below
      checked['umbrella-range'].governingRanges++;

      // A later governing-shaped statement whose subject ALSO names "repair(s)"
      // marks a new topic (e.g. a combined washer+dryer FAQ answer, or an
      // AI-block that walks appliance after appliance). Stop checking there.
      const boundary = candidates.find(c => c.dollarIndex > govDollarIndex && c.hasSubjectRepair);
      const limit = boundary ? boundary.dollarIndex : clean.length;

      RANGE_RE.lastIndex = 0;
      let m;
      while ((m = RANGE_RE.exec(clean))) {
        if (m.index === govDollarIndex) continue; // the governing range itself
        if (m.index >= limit) break; // past the topic boundary, not this rule's to check
        // Looks both before AND after the range: a scoping cue sometimes trails
        // the figure ("$200 to $700, higher for premium brands") rather than
        // leading it, and a naive "before only" window misses that.
        const context = clean.slice(Math.max(0, m.index - 100), Math.min(clean.length, m.index + m[0].length + 80));
        if (SCOPE_RE.test(context)) continue; // premium/brand-scoped segmentation
        checked['umbrella-range'].rangesChecked++;
        // Only the UPPER bound matters: the defect this check exists for is a
        // reader being quoted a ceiling and then handed a bigger number later in
        // the same paragraph ("$490 exceeds the $450 umbrella"). A sub-item
        // priced BELOW the governing floor is not that contradiction, it is a
        // typical/median statement legitimately admitting a cheaper outlier
        // (found live on pages/washer-repair-cost-orange-county.html, a file
        // this branch DID touch: "typically costs $120-$450 ... straightforward
        // fixes ... fall in the $100-$220 range": $100 undercuts the $120 floor
        // in both the pre-fix and current text, and was never part of what this
        // branch changed. Flagging lower-bound undershoots produced that false
        // positive on a file this check must be clean on).
        const y = num(m[2]);
        if (y > B) {
          const snippet = clean.slice(Math.max(0, m.index - 40), m.index + 40).replace(/\s+/g, ' ').trim();
          issues.push(`[UMBRELLA-RANGE] ${rel(filePath)} (${label}): $${m[1]} to $${m[2]} exceeds the governing $${gov.A} to $${gov.B} ceiling stated in the same block ("...${snippet}...")`);
        }
      }
    }
  }
}

// ── Check 21: srcset-width ──────────────────────────────────────────────────
// Every `srcset="…"` (and `imagesrcset="…"`, the same attribute on
// `<link rel="preload" as="image">`) candidate of the form "<url> <N>w" must
// declare the image's REAL intrinsic pixel width — decoded from the file's own
// header, not copied from a filename and not eyeballed. An overstated
// descriptor (a file honestly 600px wide labeled "-800w") tells the browser a
// too-small file can fill a larger slot, so it gets picked for a retina
// display and the job-photo galleries this site leans on for trust render
// soft; an understated descriptor wastes bytes the page already paid to
// download.
//
// This exact defect class was found, half-fixed, and re-found at 5x scale
// across THREE separate audits before this check existed, because every pass
// fixed the instances in front of it and none of them added a gate:
// 2026-08-11 recorded 4 files; a 2026-08-16 full-site scan (branch
// fix/srcset-width-descriptors) found 22 files across 42 occurrences —
// several of them files whose own NAME claims a width ("-800w.webp") the
// header disagrees with, e.g. completed-repair-range-viking-mission-viejo-
// 800w.webp is actually 600px wide. A lying filename is a distinct problem
// from a lying descriptor (the fix is a rename + re-export, not a text edit),
// and is called out separately wherever this check finds one.
//
// Decodes WebP (all three sub-formats: lossy `VP8 `, lossless `VP8L`,
// extended `VP8X`), PNG (IHDR) and JPEG (SOF0/1/2/9/10/11) headers directly —
// pure Node, no new dependency, no shelling out to a binary. `x` density
// descriptors and SVG sources carry no pixel-width claim to check, so they are
// skipped — but COUNTED in the summary rather than silently dropped, per the
// same "no silent skip" discipline as the rest of this file. A referenced file
// that does not exist, an unrecognized srcset candidate shape, or a header
// this decoder cannot parse all fail LOUDLY as issues: a silent skip is
// exactly how this defect class survived three prior audits.
if (run('srcset-width')) {
  checked['srcset-width'] = {
    files: 0, entries: 0, checkedEntries: 0, mismatches: 0,
    skippedDensity: 0, skippedSvg: 0, skippedRemote: 0, skippedImplicit1x: 0,
  };

  // Pure-Node intrinsic-width decoder. Returns a pixel width, or null if the
  // header is not one of the three formats this site ships (WebP/PNG/JPEG) or
  // is too short/malformed to read.
  function decodeIntrinsicWidth(buf) {
    // WebP: "RIFF"....'WEBP' container, then one of three sub-formats.
    if (buf.length >= 30 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
      const fourcc = buf.toString('ascii', 12, 16);
      if (fourcc === 'VP8 ') {
        // Lossy: chunk payload starts at offset 20 (3-byte frame tag + 3-byte
        // start code 0x9d 0x01 0x2a), then a 14-bit little-endian width at 26.
        return buf.readUInt16LE(26) & 0x3fff;
      }
      if (fourcc === 'VP8L') {
        // Lossless: 1-byte signature (0x2f) at 20, then a bit-packed 14-bit
        // width across the low bits of bytes 21-22, stored as (real width - 1).
        return 1 + (((buf[22] & 0x3f) << 8) | buf[21]);
      }
      if (fourcc === 'VP8X') {
        // Extended: 1-byte flags + 3 reserved bytes at 20-23, then a 24-bit
        // little-endian canvas width at 24-26, stored as (real width - 1).
        return 1 + (buf[24] | (buf[25] << 8) | (buf[26] << 16));
      }
      return null;
    }
    // PNG: 8-byte signature, then the IHDR chunk (4-byte length + 4-byte type
    // + 4-byte big-endian width, starting at offset 16).
    if (buf.length >= 24 && buf.toString('hex', 0, 8) === '89504e470d0a1a0a') {
      return buf.readUInt32BE(16);
    }
    // JPEG: walk markers to the first Start-Of-Frame segment. SOF0/1/2/9/10/11
    // (baseline, extended/progressive, arithmetic-coded) all share the same
    // width offset; 0xC4 (DHT), 0xC8 (JPG reserved) and 0xCC (DAC) fall inside
    // the 0xC0-0xCF range but are NOT SOF markers and must be excluded.
    if (buf.length >= 4 && buf[0] === 0xff && buf[1] === 0xd8) {
      let offset = 2;
      while (offset < buf.length - 1) {
        if (buf[offset] !== 0xff) { offset++; continue; }
        // A marker may legally be preceded by a RUN of 0xFF fill bytes (some
        // encoders emit them), so the marker is the first non-0xFF byte after
        // the run — not unconditionally buf[offset + 1]. Reading that byte
        // blind mistakes 0xFF for the marker and then reads a segment length
        // out of unrelated data, which walks the parser into garbage and can
        // return a plausible-looking WRONG width instead of null. That is the
        // one failure shape this whole check exists to rule out, so it is
        // handled even though the site ships no JPEG in a srcset today.
        // 0xFF00 is a stuffed byte inside entropy data, never a marker.
        let m = offset + 1;
        while (m < buf.length && buf[m] === 0xff) m++;
        if (m >= buf.length) break;
        const marker = buf[m];
        if (marker === 0x00) { offset = m + 1; continue; }
        // Standalone markers: no length field follows.
        if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9)) { offset = m + 1; continue; }
        if (m + 2 >= buf.length) break;
        const segLen = buf.readUInt16BE(m + 1);
        const isSOF = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
        if (isSOF) {
          if (m + 7 >= buf.length) return null;
          return buf.readUInt16BE(m + 6);
        }
        if (segLen < 2) return null;   // malformed: a length field counts itself
        offset = m + 1 + segLen;
      }
      return null;
    }
    return null; // not a recognized WebP/PNG/JPEG header
  }

  // resolved absolute path -> decoded width (or null) — decode each file once
  // even though the same image is referenced from many pages.
  const widthCache = new Map();
  const DENSITY_RE = /^\d*\.?\d+x$/i;
  const WIDTH_RE = /^(\d+)w$/;

  for (const filePath of allHtml) {
    const content = fs.readFileSync(filePath, 'utf8');
    const fileDir = path.dirname(filePath);
    let fileHasAttr = false;

    // Both quote styles. The site writes double quotes throughout today, but a
    // double-quote-only pattern would skip a single-quoted srcset in SILENCE,
    // which is the one failure mode this check exists to rule out.
    for (const m of content.matchAll(/\b(?:srcset|imagesrcset)\s*=\s*(["'])([\s\S]*?)\1/g)) {
      fileHasAttr = true;
      const lineNo = content.slice(0, m.index).split('\n').length;
      const candidates = m[2].split(',').map(s => s.trim()).filter(Boolean);

      for (const cand of candidates) {
        checked['srcset-width'].entries++;
        const parts = cand.split(/\s+/);
        const url = parts[0];
        const descriptor = parts[1];

        // A candidate is a URL plus AT MOST one descriptor. A URL cannot contain
        // an unescaped space, so a third token means the attribute is malformed
        // (usually a missing comma, which silently merges two candidates into
        // one and drops a real image from the set). Reading only parts[0..1]
        // would let that pass unseen, which contradicts this check's own
        // fail-loudly rule. Raised by Copilot in review of #745.
        if (parts.length > 2) {
          issues.push(`[SRCSET-WIDTH] ${rel(filePath)}:${lineNo} — "${cand}" has ${parts.length} whitespace-separated tokens; a candidate is "<url>" or "<url> <descriptor>". Check for a missing comma between candidates.`);
          continue;
        }

        if (/^(?:https?:)?\/\//.test(url) || url.startsWith('data:')) {
          checked['srcset-width'].skippedRemote++;
          continue;
        }
        // A bare URL with no descriptor at all is valid srcset syntax — an
        // implicit "1x" (HTML spec: a candidate with no descriptor is treated
        // as 1x). It carries no pixel-width claim to check, same as an
        // explicit x-descriptor, so it is skipped and counted, not treated as
        // malformed.
        if (parts.length === 1) {
          checked['srcset-width'].skippedImplicit1x++;
          continue;
        }
        if (descriptor && DENSITY_RE.test(descriptor)) {
          checked['srcset-width'].skippedDensity++;
          continue;
        }
        if (/\.svg$/i.test(url)) {
          checked['srcset-width'].skippedSvg++;
          continue;
        }
        const widthMatch = descriptor && descriptor.match(WIDTH_RE);
        if (!widthMatch) {
          issues.push(`[SRCSET-WIDTH] ${rel(filePath)}:${lineNo} — "${cand}" is not a recognized srcset candidate (expected "<url> <N>w" or "<url> <N>x"); failing loudly instead of silently skipping.`);
          continue;
        }
        const declared = parseInt(widthMatch[1], 10);

        // Site-absolute ("/images/…") resolves from the repo root; everything
        // else resolves relative to the HTML file's OWN directory, matching how
        // the browser resolves it.
        const resolved = url.startsWith('/') ? path.join(root, url.slice(1)) : path.resolve(fileDir, url);

        if (!fs.existsSync(resolved)) {
          issues.push(`[SRCSET-WIDTH] ${rel(filePath)}:${lineNo} — ${url} does not exist on disk (resolved to ${rel(resolved)}).`);
          continue;
        }

        let decoded = widthCache.get(resolved);
        if (decoded === undefined) {
          decoded = decodeIntrinsicWidth(fs.readFileSync(resolved));
          widthCache.set(resolved, decoded);
        }
        if (decoded === null) {
          issues.push(`[SRCSET-WIDTH] ${rel(filePath)}:${lineNo} — ${url} could not be decoded (unrecognized or malformed WebP/PNG/JPEG header at ${rel(resolved)}).`);
          continue;
        }

        checked['srcset-width'].checkedEntries++;
        if (decoded !== declared) {
          checked['srcset-width'].mismatches++;
          issues.push(`[SRCSET-WIDTH] ${rel(filePath)}:${lineNo} — ${url} declares ${declared}w but the file is actually ${decoded}px wide.`);
        }
      }
    }
    if (fileHasAttr) checked['srcset-width'].files++;
  }
}

// ── Check 22: area-served-parity ────────────────────────────────────────────
// Any page that renders a city-card grid (a `class="city-card…"` anchor with a
// `.city-name` div inside) must agree with itself: every rendered city needs a
// matching `"City, CA"` entry in that same page's LocalBusiness `areaServed`
// JSON-LD, and every `areaServed` entry needs a matching card, EXCEPT entries
// ending in `County, CA` — those are region-level and card-less by design.
// Added 2026-08-17 after pages/service-areas.html was found naming San
// Clemente, Aliso Viejo, Cypress, and Placentia in its visible lede, its FAQ
// JSON-LD, AND its own city-card grid, while omitting all four from
// `areaServed` — the page told human readers it serves them and told
// Google/LLMs it does not. `areaServed` is parsed with JSON.parse over the
// page's `<script type="application/ld+json">` blocks (not regexed out of raw
// HTML), matching the gallery-parity idiom above, so a hand-wrapped multi-line
// array or a reordered field never confuses this check. Auto-detects target
// pages rather than hardcoding a path, so a future page that grows a
// city-card grid is covered on arrival.
if (run('area-served-parity')) {
  checked['area-served-parity'] = { pages: 0, cities: 0 };

  const CITY_NAME_RE = /<div class="city-name">([^<]+)<\/div>/g;

  for (const filePath of allHtml) {
    const content = fs.readFileSync(filePath, 'utf8');

    // Qualification: at least one rendered `<div class="city-name">…</div>`
    // on the page — deliberately NOT gated on an anchor wrapper. An earlier
    // version required a `.city-card…` anchor around the div, on the theory
    // that plain `.city-card--info` cards (Whittier, Norco: no dedicated hub
    // page yet) were the only non-anchor case to worry about. That gate had
    // a silent no-op: converting every anchor card to a plain
    // `<div class="city-card city-card--info">` (all 45 `.city-name` divs
    // still rendered) made zero pages qualify, so the check exited 0 on a
    // page it exists to protect. Qualifying on `.city-name` alone is
    // strictly broader and removes that false-negative path; the
    // `cardNames.length` guard below still no-ops on any page with zero
    // city-name divs. Verified 2026-08-17: `class="city-name"` appears
    // nowhere else in the repo, so this cannot pull unrelated pages into
    // scope today.
    const cardNames = [...content.matchAll(CITY_NAME_RE)].map(m => m[1].trim());
    if (!cardNames.length) continue;

    const areaServed = [];
    for (const m of content.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      let parsed; try { parsed = JSON.parse(m[1]); } catch { continue; }
      const walk = (node) => {
        if (Array.isArray(node)) return node.forEach(walk);
        if (!node || typeof node !== 'object') return;
        const t = node['@type'];
        const isLocalBusiness = t === 'LocalBusiness' || (Array.isArray(t) && t.includes('LocalBusiness'));
        if (isLocalBusiness && node.areaServed) {
          const entries = Array.isArray(node.areaServed) ? node.areaServed : [node.areaServed];
          for (const e of entries) {
            if (typeof e === 'string') areaServed.push(e);
            else if (e && typeof e === 'object' && typeof e.name === 'string') areaServed.push(e.name);
          }
        }
        for (const v of Object.values(node)) if (v && typeof v === 'object') walk(v);
      };
      walk(parsed);
    }

    checked['area-served-parity'].pages++;
    checked['area-served-parity'].cities += cardNames.length;

    // A qualifying page that renders city cards but declares no
    // LocalBusiness areaServed at all: report ONE clear failure instead of
    // one near-identical [AREA-SERVED] line per card (45 lines of noise for
    // service-areas.html). This is the failure path the widened
    // qualification above newly exposes — it must not pass silently either.
    if (areaServed.length === 0) {
      issues.push(`[AREA-SERVED] ${rel(filePath)} — renders ${cardNames.length} city card(s) but declares no LocalBusiness areaServed array.`);
      continue;
    }

    const norm = s => s.trim().toLowerCase();
    const areaServedNorm = areaServed.map(norm);

    for (const name of new Set(cardNames)) {
      const expected = norm(`${name}, CA`);
      if (!areaServedNorm.includes(expected)) {
        issues.push(`[AREA-SERVED] ${rel(filePath)} — renders a "${name}" city card but "${name}, CA" is missing from the LocalBusiness areaServed JSON-LD.`);
      }
    }

    const cardNamesNorm = new Set(cardNames.map(norm));
    for (const entry of new Set(areaServed)) {
      const trimmed = entry.trim();
      if (/county,\s*ca$/i.test(trimmed)) continue;   // region-level, card-less by design
      const cityPart = (trimmed.match(/^(.*),\s*CA$/i) || [null, trimmed])[1];
      if (!cardNamesNorm.has(norm(cityPart))) {
        issues.push(`[AREA-SERVED] ${rel(filePath)} — areaServed lists "${entry}" but no matching city card is rendered on the page.`);
      }
    }
  }
}

// ── Report ────────────────────────────────────────────────────────────────────
// Informational title-length report — printed regardless of enforced-check
// outcome, and never affects the exit code.
if (checked['title-length'] && checked['title-length'].offenders.length) {
  const { limit, offenders } = checked['title-length'];
  console.log(`\nℹ️  title-length (informational, not enforced): ${offenders.length} <title> tag(s) exceed ${limit} chars (SERP truncation):`);
  offenders.slice(0, 80).forEach(o => console.log(`     ${o.len}  ${o.file}`));
  if (offenders.length > 80) console.log(`     ... and ${offenders.length - 80} more`);
  console.log('');
}

if (issues.length) {
  const groups = {};
  for (const i of issues) {
    const tag = i.match(/^\[([A-Z-]+)\]/);
    const key = tag ? tag[1] : 'OTHER';
    (groups[key] = groups[key] || []).push(i);
  }
  for (const [key, lines] of Object.entries(groups)) {
    console.error(`\n${key} failures (${lines.length}):`);
    lines.slice(0, 30).forEach(l => console.error('  ' + l));
    if (lines.length > 30) console.error(`  ... and ${lines.length - 30} more`);
  }
  console.error('');
  process.exit(1);
}

const parts = [];
if (checked['review-count'])         parts.push(`review-count matches JSON (${checked['review-count'].expected}) across ${checked['review-count'].files} pages`);
if (checked['testimonial-pill-count']) parts.push(`testimonials All pill (${checked['testimonial-pill-count'].pill}) matches ${checked['testimonial-pill-count'].cards} rendered cards`);
if (checked['testimonial-review-schema']) parts.push(`all ${checked['testimonial-review-schema'].quotedCards} quoted testimonial cards have a Review JSON-LD node`);
if (checked['business-tenure'])      parts.push(`no stale "8+ years" tenure claims in ${checked['business-tenure'].files} files`);
if (checked['meta-desc-len'])        parts.push(`meta descriptions ≤ ${checked['meta-desc-len'].limit} chars on ${checked['meta-desc-len'].files} articles + pages`);
if (checked['og-desc-sync'])         parts.push(`og:description = name="description" on ${checked['og-desc-sync'].files} articles + pages`);
if (checked['schema-headline-sync']) parts.push(`schema headline = H1 on ${checked['schema-headline-sync'].files} articles`);
if (checked['modified-time-sync'])   parts.push(`modified_time meta = dateModified JSON-LD on ${checked['modified-time-sync'].files} articles`);
if (checked['analytics-present'])    parts.push(`analytics.js present on all ${checked['analytics-present'].files} nav pages`);
if (checked['ga-tag'])               parts.push(`Google tag first in <head> on all ${checked['ga-tag'].files} nav pages`);
if (checked['jsonld-valid'])         parts.push(`${checked['jsonld-valid'].blocks} JSON-LD blocks valid across ${checked['jsonld-valid'].files} files`);
if (checked['footer-self-contained']) parts.push(`footer self-contained (no var()) across ${checked['footer-self-contained'].files} pages`);
if (checked['iso8601-timestamps'])   parts.push(`Google timestamps ISO 8601 w/ offset: ${checked['iso8601-timestamps'].stamps} stamps across ${checked['iso8601-timestamps'].files} files`);
if (checked['article-mobile-chrome']) parts.push(`article mobile chrome (.nav-cta hidden + sticky bar) on all ${checked['article-mobile-chrome'].files} articles`);
if (checked['hamburger-cascade'])    parts.push(`hamburger nav cascade order (unconditional rule before @media override) held on ${checked['hamburger-cascade'].files} files with an inline .nav-hamburger rule`);
if (checked['nav-phone-mobile'])     parts.push(`header .nav-phone class + hide-below-480px rule held on ${checked['nav-phone-mobile'].files} pages with a header tel: link`);
if (checked['non-person-reviewers']) parts.push(`no do-not-display reviewers on ${checked['non-person-reviewers'].files} pages`);
if (checked['contrast-aa'])          parts.push(`WCAG AA contrast on ${checked['contrast-aa'].pairs} same-rule colour pairs across ${checked['contrast-aa'].files} files, var() resolved (${checked['contrast-aa'].skippedVar} rgba()/keyword rules unresolvable; cross-rule + inline-style pairs NOT covered, see P6-15)`);
if (checked['faq-schema-presence']) parts.push(`FAQPage schema present on all ${checked['faq-schema-presence'].pages} pages with a real FAQ accordion`);
if (checked['faq-jsonld-parity']) {
  const c = checked['faq-jsonld-parity'];
  parts.push(`FAQ/JSON-LD parity ratchet held on ${c.pairs} Q&A pairs across ${c.files} pages (debt measured ${c.measuredFields} fields in ${c.measuredFiles} files, baseline declares ${c.baselineFields}/${c.baselineFiles}, see P6-12)`);
}
if (checked['gallery-parity'])       parts.push(`ImageGallery schema matches rendered photos exactly on ${checked['gallery-parity'].pages} page(s) (${checked['gallery-parity'].images} listed images)`);
if (checked['brand-tier'])           parts.push(`brand tiers + fee values match seo-content.md across ${checked['brand-tier'].pages} pages (${checked['brand-tier'].lists} premium lists, ${checked['brand-tier'].fees} fee statements)`);
if (checked['tel-target'])           parts.push(`all ${checked['tel-target'].links} tel: links dial ${checked['tel-target'].canonical} (${checked['tel-target'].distinct} distinct target${checked['tel-target'].distinct === 1 ? '' : 's'})`);
if (checked['umbrella-range'])       parts.push(`umbrella price ranges hold on ${checked['umbrella-range'].rangesChecked} itemized range(s) against ${checked['umbrella-range'].governingRanges} governing range(s) across ${checked['umbrella-range'].blocks} FAQ/AI-answer blocks in ${checked['umbrella-range'].files} files`);
if (checked['srcset-width'])         parts.push(`srcset width descriptors match decoded pixel width on ${checked['srcset-width'].checkedEntries} entries across ${checked['srcset-width'].files} files (${checked['srcset-width'].skippedDensity} x-density + ${checked['srcset-width'].skippedImplicit1x} implicit-1x + ${checked['srcset-width'].skippedSvg} svg + ${checked['srcset-width'].skippedRemote} remote/data skipped)`);
if (checked['area-served-parity'])   parts.push(`areaServed JSON-LD matches ${checked['area-served-parity'].cities} rendered city cards across ${checked['area-served-parity'].pages} city-card grid page(s) (County, CA region entries exempt)`);
if (checked['title-length'])         parts.push(`title-length: ${checked['title-length'].offenders.length}/${checked['title-length'].scanned} titles > ${checked['title-length'].limit} chars (informational)`);
console.log(`content-integrity: ${parts.join('; ')}.`);
