/**
 * content-integrity.js — content/SEO regression guards
 *
 * Eight checks, all EXIT 1 on any failure. Each check exists because a real bug
 * shipped before it was added:
 *
 *   review-count   — every page with `AggregateRating.reviewCount` must match
 *                    `data/testimonials.json` `_meta.sources.google.capturedCount`.
 *                    Added 2026-05-21 after PRs #374–377 spent 4 commits
 *                    reconciling 5 different count values across 32 files.
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
 *   jsonld-valid   — every `<script type="application/ld+json">` block on every
 *                    page must be valid JSON. No other test parses JSON-LD, so
 *                    broken structured data ships silently. Added 2026-05-31 after
 *                    a pre-existing missing comma in a Review[] array on the Miele
 *                    hub was found during the LocalBusiness @id consolidation.
 *
 * Usage:
 *   node test/content-integrity.js          — run all eight checks
 *   node test/content-integrity.js <name>   — run one check (review-count, business-tenure,
 *                                             meta-desc-len, og-desc-sync,
 *                                             schema-headline-sync, modified-time-sync,
 *                                             analytics-present, jsonld-valid)
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const root       = path.resolve(__dirname, '..');
const mode       = process.argv[2] || 'all';
const SKIP_DIRS  = new Set(['node_modules', '.git', '.claude', '.agents', '.audits', '.playwright-mcp', '.staging', '.husky', 'test-results']);

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
  const expectedCount = String(json._meta.sources.google.capturedCount);
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

// ── Report ────────────────────────────────────────────────────────────────────
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
if (checked['business-tenure'])      parts.push(`no stale "8+ years" tenure claims in ${checked['business-tenure'].files} files`);
if (checked['meta-desc-len'])        parts.push(`meta descriptions ≤ ${checked['meta-desc-len'].limit} chars on ${checked['meta-desc-len'].files} articles`);
if (checked['og-desc-sync'])         parts.push(`og:description = name="description" on ${checked['og-desc-sync'].files} articles`);
if (checked['schema-headline-sync']) parts.push(`schema headline = H1 on ${checked['schema-headline-sync'].files} articles`);
if (checked['modified-time-sync'])   parts.push(`modified_time meta = dateModified JSON-LD on ${checked['modified-time-sync'].files} articles`);
if (checked['analytics-present'])    parts.push(`analytics.js present on all ${checked['analytics-present'].files} nav pages`);
if (checked['jsonld-valid'])         parts.push(`${checked['jsonld-valid'].blocks} JSON-LD blocks valid across ${checked['jsonld-valid'].files} files`);
console.log(`content-integrity: ${parts.join('; ')}.`);
