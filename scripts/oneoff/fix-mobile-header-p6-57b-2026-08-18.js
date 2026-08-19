#!/usr/bin/env node
// P6-57b one-shot sweep: mobile header phone link + hamburger touch target.
//
// Problem measured before this script ran: at 375px the header `tel:` link wrapped
// to 2 lines (63x30) and at 320px to 3 lines (43x45), because `.nav-phone` had no
// width constraint or wrap handling and no rule hid it below 480px. `.nav-hamburger`
// was exactly 44x44, the WCAG 2.5.5 minimum but with zero margin for error.
//
// Fix (identical across all 77 CSS locations):
//   1. Append a `@media (max-width: 480px) { .nav-phone { display: none; } }` rule
//      to the END of the stylesheet / inline <style> block. Appending (never editing
//      an existing media query) is deliberate: a later rule beats an earlier
//      same-specificity rule, so this is safe by construction. The sticky mobile
//      Call/Book bar carries the call path below 480px instead.
//   2. Widen `.nav-hamburger`'s `width: 44px; height: 44px;` to 48px, in place, and
//      ONLY inside that one rule (not `.nav-hamburger span`, not any unrelated
//      `min-height: 44px` elsewhere in the codebase).
//
// Locations touched: shared.css (1), articles/article-*.html inline <style> (75),
// index.html's inline <style> (1, appended to its LAST of two <style> blocks so the
// new rule sits after both in document order; the hamburger edit happens in its
// FIRST block, where that rule lives).
//
// Idempotent: re-running this script is a no-op on files it already touched. Each
// of the two edits is guarded independently so a partial prior run still converges.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');

const MARKER = 'P6-57b';

const HAMBURGER_RE = /(\.nav-hamburger\s*\{[^}]*width:\s*)44px(;[^}]*height:\s*)44px(;)/;

function hideRuleBlock(indent) {
  const pad = indent;
  return (
    `${pad}/* Mobile header (P6-57b): the header phone wrapped to 2 lines at 375px and 3 at\n` +
    `${pad}   320px in a 63px box. The sticky Call/Book bar carries the call path below this\n` +
    `${pad}   breakpoint, so hide the wrapping copy rather than shrinking it further. */\n` +
    `${pad}@media (max-width: 480px) { .nav-phone { display: none; } }\n`
  );
}

function readUtf8NoBom(filePath) {
  const raw = fs.readFileSync(filePath);
  const hasBom = raw[0] === 0xEF && raw[1] === 0xBB && raw[2] === 0xBF;
  return hasBom ? raw.slice(3).toString('utf8') : raw.toString('utf8');
}

function writeUtf8NoBom(filePath, content) {
  fs.writeFileSync(filePath, Buffer.from(content, 'utf8'));
}

// Grow the hamburger touch target. Returns { content, changed }.
function growHamburger(content, filePath) {
  if (HAMBURGER_RE.test(content)) {
    const next = content.replace(HAMBURGER_RE, (_m, pre, mid, tail) => `${pre}48px${mid}48px${tail}`);
    return { content: next, changed: true };
  }
  // Already 48px (idempotent re-run) or genuinely absent.
  if (/\.nav-hamburger\s*\{[^}]*width:\s*48px[^}]*height:\s*48px/.test(content)) {
    return { content, changed: false };
  }
  console.warn(`  WARNING: .nav-hamburger 44px rule not found in ${path.relative(ROOT, filePath)}`);
  return { content, changed: false };
}

// Append the hide-below-480 rule right before a given `</style>` occurrence index.
// Returns the new content, or the original if the marker is already present in
// that block (idempotent).
function appendHideRule(content, closeTagIndex, indent) {
  const blockStart = content.lastIndexOf('<style', closeTagIndex);
  const block = content.slice(blockStart, closeTagIndex);
  if (block.includes(MARKER)) return content; // already applied to this block

  // Insert at the START of the line that holds `</style>` (not at closeTagIndex
  // itself, which sits AFTER that line's own leading indent) so the new block
  // lands on its own clean line(s) and the original `</style>` line, indent
  // included, is pushed down intact rather than having its indent swallowed
  // into the inserted comment.
  const lineStart = content.lastIndexOf('\n', closeTagIndex - 1) + 1;
  const insertion = hideRuleBlock(indent);
  return content.slice(0, lineStart) + insertion + content.slice(lineStart);
}

let filesChanged = 0;
const report = [];

// ---- shared.css ----
(function processSharedCss() {
  const filePath = path.join(ROOT, 'shared.css');
  const original = readUtf8NoBom(filePath);
  let content = original;
  let changed = false;

  const { content: grown, changed: hamburgerChanged } = growHamburger(content, filePath);
  content = grown;
  changed = changed || hamburgerChanged;

  if (!content.includes(MARKER)) {
    content = content.replace(/\s*$/, '\n\n' + hideRuleBlock(''));
    changed = true;
  }

  if (changed) {
    writeUtf8NoBom(filePath, content);
    filesChanged++;
    report.push('shared.css');
  }
})();

// ---- index.html ----
(function processIndexHtml() {
  const filePath = path.join(ROOT, 'index.html');
  const original = readUtf8NoBom(filePath);
  let content = original;
  let changed = false;

  const { content: grown, changed: hamburgerChanged } = growHamburger(content, filePath);
  content = grown;
  changed = changed || hamburgerChanged;

  // Append to the LAST `</style>` in the document (the later of index.html's two
  // <style> blocks), so the new rule sits after both blocks in document order.
  const lastClose = content.lastIndexOf('</style>');
  if (lastClose === -1) {
    console.warn(`  WARNING: no </style> found in ${path.relative(ROOT, filePath)}`);
  } else {
    const withRule = appendHideRule(content, lastClose, '');
    if (withRule !== content) {
      content = withRule;
      changed = true;
    }
  }

  if (changed) {
    writeUtf8NoBom(filePath, content);
    filesChanged++;
    report.push('index.html');
  }
})();

// ---- articles/article-*.html ----
(function processArticles() {
  const articlesDir = path.join(ROOT, 'articles');
  const files = fs.readdirSync(articlesDir)
    .filter((f) => f.startsWith('article-') && f.endsWith('.html'))
    .sort();

  for (const name of files) {
    const filePath = path.join(articlesDir, name);
    const original = readUtf8NoBom(filePath);
    let content = original;
    let changed = false;

    const { content: grown, changed: hamburgerChanged } = growHamburger(content, filePath);
    content = grown;
    changed = changed || hamburgerChanged;

    const closeIdx = content.indexOf('</style>');
    if (closeIdx === -1) {
      console.warn(`  WARNING: no </style> found in ${path.relative(ROOT, filePath)}`);
    } else {
      const withRule = appendHideRule(content, closeIdx, '    ');
      if (withRule !== content) {
        content = withRule;
        changed = true;
      }
    }

    if (changed) {
      writeUtf8NoBom(filePath, content);
      filesChanged++;
      report.push(path.relative(ROOT, filePath));
    }
  }
})();

console.log(`P6-57b mobile header sweep: ${filesChanged} file(s) changed.`);
if (filesChanged) {
  for (const f of report) console.log(`  ${f}`);
}
