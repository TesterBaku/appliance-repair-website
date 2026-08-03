/**
 * content-integrity.js — content/SEO regression guards
 *
 * Nineteen enforced checks (EXIT 1 on any failure) plus one informational report
 * (title-length, never fails). Each enforced check exists because a real bug
 * shipped before it was added:
 *
 *   review-count   — every page with `AggregateRating.reviewCount` must match
 *                    `data/testimonials.json` `_meta.sources.google.totalReviewsOnListing`
 *                    (the public GBP listing total the schema mirrors). This is
 *                    distinct from `capturedCount`, which tracks how many reviews
 *                    we've transcribed into the pool; the two diverge whenever the
 *                    listing gains a review we haven't captured yet (currently 84
 *                    on the listing vs 83 transcribed). AggregateRating is a public
 *                    claim about the listing, so it tracks the listing total.
 *                    Added 2026-05-21 after PRs #374–377 spent 4 commits
 *                    reconciling 5 different count values across 32 files.
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
 *   meta-desc-len  — every article's `<meta name="description">` must be ≤ 160 chars
 *                    so Google SERPs render it without truncation.
 *                    Added 2026-05-21 after PR #359 trimmed 26 articles.
 *
 *   og-desc-sync   — every article's `og:description` must equal its
 *                    `name="description"`. Divergence was the bug in PR #359 review.
 *                    Added 2026-05-21.
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
 *                    .claude/rules/mobile-design.md. Added 2026-07-19 after 46
 *                    articles shipped a cramming mobile header (PR #610) and 44
 *                    lacked the sticky bar (PR #611).
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
 *   title-length   — INFORMATIONAL ONLY (never fails the build). Reports every
 *                    page whose <title> exceeds 60 chars (Google SERP truncation
 *                    threshold), so the over-length titles are visible ahead of a
 *                    deliberate editorial shorten-pass. Added 2026-06-01; shortening
 *                    titles is a separate owner-reviewed batch (SEO/keyword judgment),
 *                    so this check only surfaces the list and does NOT block.
 *
 * Usage:
 *   node test/content-integrity.js          — run all nineteen enforced checks + the report
 *   node test/content-integrity.js <name>   — run one check (review-count,
 *                                             testimonial-pill-count, business-tenure,
 *                                             meta-desc-len, og-desc-sync,
 *                                             schema-headline-sync, modified-time-sync,
 *                                             analytics-present, ga-tag, jsonld-valid,
 *                                             footer-self-contained, iso8601-timestamps,
 *                                             article-mobile-chrome, non-person-reviewers,
 *                                             faq-jsonld-parity, contrast-aa,
 *                                             faq-schema-presence, gallery-parity, brand-tier,
 *                                             title-length)
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

const issues = [];
const checked = {};

function rel(p) { return path.relative(root, p).split(path.sep).join('/'); }
function run(check) { return mode === 'all' || mode === check; }

// ── Check 1: review-count ─────────────────────────────────────────────────────
if (run('review-count')) {
  const json = JSON.parse(fs.readFileSync(path.join(root, 'data', 'testimonials.json'), 'utf8'));
  const expectedCount = String(json._meta.sources.google.totalReviewsOnListing);
  checked['review-count'] = { expected: expectedCount, files: 0 };

  for (const filePath of allHtml) {
    const content = fs.readFileSync(filePath, 'utf8');
    // Match "reviewCount": "<value>" — accepts whitespace variations
    const matches = [...content.matchAll(/"reviewCount"\s*:\s*"(\d+)"/g)];
    if (!matches.length) continue;
    checked['review-count'].files++;
    for (const m of matches) {
      if (m[1] !== expectedCount) {
        issues.push(`[REVIEW-COUNT] ${rel(filePath)} — has "reviewCount": "${m[1]}" but data/testimonials.json says ${expectedCount}`);
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
  // JSON-LD, per .claude/rules/testimonial-selection.md ("Individual Review JSON-LD
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
  for (const filePath of articles) {
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
  for (const filePath of articles) {
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
// on new or legacy files. See .claude/rules/mobile-design.md. Established site-wide
// 2026-07-19 (PR #610 hid .nav-cta on 46 legacy articles; PR #611 added the sticky
// bar to the 44 that lacked it).
if (run('article-mobile-chrome')) {
  checked['article-mobile-chrome'] = { files: 0 };
  for (const filePath of articles) {
    const content = fs.readFileSync(filePath, 'utf8');
    checked['article-mobile-chrome'].files++;
    if (!/\.nav-cta\s*\{\s*display:\s*none/.test(content)) {
      issues.push(`[MOBILE-CHROME] ${rel(filePath)} — missing ".nav-cta { display: none }" at ≤768px (header Book button not hidden on mobile; header crams). See rules/mobile-design.md.`);
    }
    if (!/class="sticky-mobile-bar"/.test(content)) {
      issues.push(`[MOBILE-CHROME] ${rel(filePath)} — missing the sticky-mobile-bar (mobile Call/Book CTA). See rules/mobile-design.md.`);
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
//       a premium brand per .claude/rules/seo-content.md;
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
  const FEES = new Set(['99', '120', '49']);   // OC/LA tier, Riverside tier, additional-unit
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
        issues.push(`[BRAND-TIER] ${rel(filePath)} — "${b}" is a standard-tier brand per .claude/rules/seo-content.md ($75–$100 service call), but it is listed as premium in "${m[1].trim()}". Move it to the standard/mass-market group (visible copy AND the matching FAQ JSON-LD, or faq-jsonld-parity will fail), or change the rule. A premium PRODUCT LINE is a different claim and is written differently: "Bosch Premium", "Bosch 800 Series", "Benchmark".`);
      }
    }

    for (const m of content.matchAll(/\$(\d{2,4})\b[^.<]{0,30}?\b(?:flat )?(?:diagnostic|service[- ]call) fee|(?:diagnostic|service[- ]call) fee (?:is |of )?\$(\d{2,4})\b/g)) {
      const val = m[1] || m[2];
      checked['brand-tier'].fees++; touched = true;
      if (!FEES.has(val)) {
        issues.push(`[BRAND-TIER] ${rel(filePath)} — states a $${val} diagnostic fee. seo-content.md defines exactly three: $99 (Orange County + LA County, all brands), $120 (Riverside County), $49 (each additional unit on the same visit).`);
      }
    }
    if (touched) checked['brand-tier'].pages++;
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
if (checked['meta-desc-len'])        parts.push(`meta descriptions ≤ ${checked['meta-desc-len'].limit} chars on ${checked['meta-desc-len'].files} articles`);
if (checked['og-desc-sync'])         parts.push(`og:description = name="description" on ${checked['og-desc-sync'].files} articles`);
if (checked['schema-headline-sync']) parts.push(`schema headline = H1 on ${checked['schema-headline-sync'].files} articles`);
if (checked['modified-time-sync'])   parts.push(`modified_time meta = dateModified JSON-LD on ${checked['modified-time-sync'].files} articles`);
if (checked['analytics-present'])    parts.push(`analytics.js present on all ${checked['analytics-present'].files} nav pages`);
if (checked['ga-tag'])               parts.push(`Google tag first in <head> on all ${checked['ga-tag'].files} nav pages`);
if (checked['jsonld-valid'])         parts.push(`${checked['jsonld-valid'].blocks} JSON-LD blocks valid across ${checked['jsonld-valid'].files} files`);
if (checked['footer-self-contained']) parts.push(`footer self-contained (no var()) across ${checked['footer-self-contained'].files} pages`);
if (checked['iso8601-timestamps'])   parts.push(`Google timestamps ISO 8601 w/ offset: ${checked['iso8601-timestamps'].stamps} stamps across ${checked['iso8601-timestamps'].files} files`);
if (checked['article-mobile-chrome']) parts.push(`article mobile chrome (.nav-cta hidden + sticky bar) on all ${checked['article-mobile-chrome'].files} articles`);
if (checked['non-person-reviewers']) parts.push(`no do-not-display reviewers on ${checked['non-person-reviewers'].files} pages`);
if (checked['contrast-aa'])          parts.push(`WCAG AA contrast on ${checked['contrast-aa'].pairs} same-rule colour pairs across ${checked['contrast-aa'].files} files, var() resolved (${checked['contrast-aa'].skippedVar} rgba()/keyword rules unresolvable; cross-rule + inline-style pairs NOT covered, see P6-15)`);
if (checked['faq-schema-presence']) parts.push(`FAQPage schema present on all ${checked['faq-schema-presence'].pages} pages with a real FAQ accordion`);
if (checked['faq-jsonld-parity']) {
  const c = checked['faq-jsonld-parity'];
  parts.push(`FAQ/JSON-LD parity ratchet held on ${c.pairs} Q&A pairs across ${c.files} pages (debt measured ${c.measuredFields} fields in ${c.measuredFiles} files, baseline declares ${c.baselineFields}/${c.baselineFiles}, see P6-12)`);
}
if (checked['gallery-parity'])       parts.push(`ImageGallery schema matches rendered photos exactly on ${checked['gallery-parity'].pages} page(s) (${checked['gallery-parity'].images} listed images)`);
if (checked['brand-tier'])           parts.push(`brand tiers + fee values match seo-content.md across ${checked['brand-tier'].pages} pages (${checked['brand-tier'].lists} premium lists, ${checked['brand-tier'].fees} fee statements)`);
if (checked['title-length'])         parts.push(`title-length: ${checked['title-length'].offenders.length}/${checked['title-length'].scanned} titles > ${checked['title-length'].limit} chars (informational)`);
console.log(`content-integrity: ${parts.join('; ')}.`);
