#!/usr/bin/env node
/*
 * inject-site-js.js — retire the per-page inline interaction JS in favour of
 * the single-sourced /site.js (loaded with `defer`).
 *
 * For every served page that has a nav (a `.nav-hamburger`), this:
 *   1. removes every attribute-less inline <script> whose body matches an
 *      interaction signature (nav drawer, nav dropdown, FAQ accordion /
 *      toggleFaq) — robust to the combined-vs-separate block arrangements
 *      that exist across pages and articles;
 *   2. removes the now-obsolete `<!-- DROPDOWN_JS_INJECTED -->` sentinel;
 *   3. rewrites the main-page FAQ buttons from the inline-onclick pattern
 *      (`class="faq-q" onclick="toggleFaq(this)"`) to `class="faq-q"
 *      aria-expanded="false"` so site.js's accordion can manage them;
 *   4. inserts one `<script defer src="…/site.js">` before the page's
 *      existing analytics.js include (reusing its exact relative depth).
 *
 * Page-specific filters (blog search, testimonials filter) are singletons,
 * not a drift class — their inline scripts use no interaction signature and
 * are intentionally left in place.
 *
 *   node scripts/build/inject-site-js.js            # rewrite all pages
 *   node scripts/build/inject-site-js.js --check    # verify only (exit 1 on drift) — used by `npm test`
 *   node scripts/build/inject-site-js.js <file…>    # rewrite only the named pages
 *
 * Idempotent: re-running makes no further changes once a page is converted.
 */
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');
const args = process.argv.slice(2);
const CHECK = args.includes('--check');
const explicitFiles = args.filter((a) => !a.startsWith('--'));

// An inline interaction <script> is any attribute-less <script> whose body
// references one of these. None of these appear in gtag config, JSON-LD,
// the blog filter, or the testimonials filter — so the match is exact.
const SIGNATURE = /function toggleFaq|querySelectorAll\('\.faq-item'\)|querySelector\('\.nav-drawer'\)|querySelectorAll\('\.nav-dropdown'\)|getElementById\('mobile-nav-drawer'\)/;
const SCRIPT_BLOCK = /[ \t]*<script>[\s\S]*?<\/script>\r?\n?/g;
const SENTINEL = /[ \t]*<!-- DROPDOWN_JS_INJECTED -->\r?\n?/g;
const FAQ_BTN = /class="faq-q" onclick="toggleFaq\(this\)"/g;
const ANALYTICS = /([ \t]*)<script defer src="([^"]*)analytics\.js"><\/script>/;
const SITE_JS_PRESENT = /<script defer src="[^"]*site\.js"><\/script>/;

function depthPrefix(absFile) {
  const rel = path.relative(path.dirname(absFile), repoRoot).split(path.sep).join('/');
  return rel === '' ? '' : rel + '/';
}

function locationOf(absFile) {
  const rel = path.relative(repoRoot, absFile).split(path.sep).join('/');
  const served = !rel.includes('/') || rel.startsWith('pages/') || rel.startsWith('articles/');
  return served ? rel : null;
}

function collectHtml(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!['.git', 'node_modules', '.claude', '.agents', '.playwright-mcp', 'test-results', 'partials'].includes(entry.name))
        collectHtml(full, out);
    } else if (full.endsWith('.html')) {
      out.push(full);
    }
  }
}

function transform(content, absFile) {
  const eol = content.includes('\r\n') ? '\r\n' : '\n';
  let next = content;

  next = next.replace(SENTINEL, '');
  next = next.replace(SCRIPT_BLOCK, (block) => (SIGNATURE.test(block) ? '' : block));
  next = next.replace(FAQ_BTN, 'class="faq-q" aria-expanded="false"');

  if (!SITE_JS_PRESENT.test(next)) {
    if (ANALYTICS.test(next)) {
      next = next.replace(ANALYTICS, (full, indent, prefix) =>
        `${indent}<script defer src="${prefix}site.js"></script>${eol}${full}`);
    } else {
      const prefix = depthPrefix(absFile);
      next = next.replace(/([ \t]*)<\/body>/, (full, indent) =>
        `${indent}  <script defer src="${prefix}site.js"></script>${eol}${full}`);
    }
  }
  return next;
}

// A page is in scope iff it carries the nav (a hamburger button).
function inScope(content) {
  return content.includes('class="nav-hamburger"');
}

let files;
if (explicitFiles.length) {
  files = explicitFiles.map((f) => path.resolve(repoRoot, f));
} else {
  files = [];
  collectHtml(repoRoot, files);
}

let changed = 0;
let skipped = 0;
let converted = 0;
const drift = [];

for (const file of files) {
  if (locationOf(file) === null) { skipped++; continue; }
  const content = fs.readFileSync(file, 'utf8');
  if (!inScope(content)) { skipped++; continue; }
  converted++;
  const rel = path.relative(repoRoot, file).split(path.sep).join('/');

  if (CHECK) {
    // Invariant: exactly one site.js include, no leftover inline interaction
    // scripts, no leftover toggleFaq onclick / sentinel.
    const includes = (content.match(/<script defer src="[^"]*site\.js"><\/script>/g) || []).length;
    const leftoverScripts = (content.match(SCRIPT_BLOCK) || []).some((b) => SIGNATURE.test(b));
    const leftoverOnclick = /onclick="toggleFaq/.test(content);
    const leftoverSentinel = /<!-- DROPDOWN_JS_INJECTED -->/.test(content);
    if (includes !== 1 || leftoverScripts || leftoverOnclick || leftoverSentinel) {
      drift.push(`${rel} (site.js x${includes}${leftoverScripts ? ', inline interaction JS' : ''}${leftoverOnclick ? ', toggleFaq onclick' : ''}${leftoverSentinel ? ', sentinel' : ''})`);
    }
    continue;
  }

  const next = transform(content, file);
  if (next !== content) {
    fs.writeFileSync(file, next, 'utf8');
    changed++;
  }
}

if (CHECK) {
  if (drift.length) {
    console.error(`inject-site-js --check: ${drift.length} page(s) do not match the single-sourced site.js:`);
    drift.forEach((f) => console.error(`  - ${f}`));
    console.error('Run `npm run build:site-js` and commit the result.');
    process.exit(1);
  }
  console.log(`inject-site-js: site.js single-sourced on all ${converted} nav pages; no inline interaction JS remains. OK`);
} else {
  console.log(`inject-site-js: ${changed} file(s) updated (${converted} nav pages processed, ${skipped} skipped).`);
}
