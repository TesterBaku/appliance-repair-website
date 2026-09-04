'use strict';

/**
 * check-ngram-overlap.js — anti-doorway-page content-overlap checker.
 *
 * Measures how much of two (or more) HTML pages' visible body text is verbatim-shared,
 * using word n-grams (default n=8). This is a manual/ad-hoc diagnostic tool, NOT wired
 * into `npm test` — run it by hand when adding a new hub or article that is templated
 * off an existing one, to sanity-check it is not a near-duplicate "doorway page" in
 * Google's sense.
 *
 * What is stripped before comparing (so shared site chrome does not inflate every pair
 * equally and swamp the real signal):
 *   - <head>...</head> entirely (title/meta/schema are not body content)
 *   - <script>, <style>, <noscript> blocks
 *   - <nav>...</nav> and <footer>...</footer> (single-sourced partials, identical site-wide)
 *   - elements carrying class "sticky-mobile-bar" (shared floating CTA bar)
 *   - elements whose class starts with "related-" (related-card / related-articles blocks,
 *     which legitimately repeat titles/excerpts of OTHER pages)
 *   - all remaining HTML tags (text content only survives)
 *   - common HTML entities are decoded, whitespace is collapsed, text is lowercased
 *
 * Tokenization: splits on runs of characters that are not letters/digits/$/%, so a
 * "$150" or "50%" token survives attached to its symbol, and remaining punctuation is
 * dropped. This is a coarse approximation, not a proper tokenizer — good enough to
 * reproduce the recorded figures, not a precision instrument.
 *
 * Reported metrics (as percentages):
 *   - containment = |A n B| / min(|A|, |B|)   <- THIS is the number to compare against
 *     the historical 12.8% ceiling (see tasks/backlog.md, measured 2026-08-08). It is
 *     normalized by the SMALLER page's n-gram count, so a short page fully swallowed by
 *     a long one still reads as a real breach.
 *   - jaccard = |A n B| / |A u B|             <- for reference only. Jaccard reads
 *     roughly HALF of containment on this corpus because pages differ substantially in
 *     length; using Jaccard against the 12.8% ceiling would have marked all three known
 *     LA-premium breaches (beverly-hills/los-angeles, beverly-hills/pasadena,
 *     pasadena/los-angeles) as passing. Do not swap the ceiling check to Jaccard.
 *
 * Usage:
 *   node scripts/check-ngram-overlap.js <fileA.html> <fileB.html> [--n 8] [--ceiling 12.8] [--json]
 *   node scripts/check-ngram-overlap.js --all <file1.html> <file2.html> <file3.html> ... [--n 8] [--ceiling 12.8] [--json] [--strict]
 *
 * Exit code: always 0, UNLESS --strict is passed, in which case exits 1 if any reported
 * pair's containment exceeds the ceiling. --strict is opt-in and this script is NOT
 * called from `npm test` or any other automated gate — it is a manual diagnostic only.
 */

const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const args = { files: [], all: false, n: 8, ceiling: 12.8, json: false, strict: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--all') args.all = true;
    else if (a === '--n') args.n = parseInt(argv[++i], 10);
    else if (a === '--ceiling') args.ceiling = parseFloat(argv[++i]);
    else if (a === '--json') args.json = true;
    else if (a === '--strict') args.strict = true;
    else args.files.push(a);
  }
  return args;
}

const ENTITIES = {
  '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&apos;': "'",
  '&nbsp;': ' ', '&mdash;': ' ', '&ndash;': ' ', '&rsquo;': "'", '&lsquo;': "'",
  '&rdquo;': '"', '&ldquo;': '"', '&hellip;': '...',
};

function decodeEntities(str) {
  return str.replace(/&#?\w+;/g, (m) => (ENTITIES[m] !== undefined ? ENTITIES[m] : m));
}

function stripBlockByClass(html, classPrefix, exact) {
  // Remove elements (and their subtree) whose class attribute contains a class that
  // either equals `classPrefix` (exact=true) or starts with it (exact=false).
  // Single forward pass over every tag in the document (via matchAll, so it never
  // rescans already-visited text — no risk of stalling on a stray literal '<' in
  // body text), with a per-tag-name depth stack to find where a matched element ends.
  const classTest = exact
    ? (cls) => cls.split(/\s+/).includes(classPrefix)
    : (cls) => cls.split(/\s+/).some((c) => c.startsWith(classPrefix));

  const VOID_TAGS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
  const tagRe = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:\s+[^<>]*?)?)(\/?)>/g;

  let result = '';
  let cursor = 0; // position up to which `result` has already been filled from `html`
  let skipDepth = 0; // >0 while inside a subtree being dropped
  let skipTag = null; // tag name of the element being dropped

  let m;
  while ((m = tagRe.exec(html)) !== null) {
    const [full, closing, tag, attrs, selfClose] = m;
    const tagLower = tag.toLowerCase();
    const isVoid = VOID_TAGS.has(tagLower) || !!selfClose;

    if (skipDepth > 0) {
      if (tagLower === skipTag) {
        if (closing) skipDepth--;
        else if (!isVoid) skipDepth++;
      }
      if (skipDepth === 0) cursor = m.index + full.length;
      continue;
    }

    // Not currently skipping: copy the text between cursor and this tag, then decide.
    if (!closing) {
      const classMatch = /class\s*=\s*["']([^"']*)["']/i.exec(attrs || '');
      const cls = classMatch ? classMatch[1] : '';
      if (cls && classTest(cls)) {
        result += html.slice(cursor, m.index);
        if (isVoid) {
          cursor = m.index + full.length;
        } else {
          skipDepth = 1;
          skipTag = tagLower;
          cursor = m.index + full.length; // will be overwritten once skip closes
        }
        continue;
      }
    }
    // keep this tag as-is; nothing to do until we hit the next candidate
  }

  result += html.slice(cursor);
  return result;
}

function extractVisibleText(html) {
  let s = html;

  // Drop <head>...</head> entirely.
  s = s.replace(/<head[\s\S]*?<\/head>/gi, ' ');

  // Drop script/style/noscript blocks.
  s = s.replace(/<script[\s\S]*?<\/script>/gi, ' ');
  s = s.replace(/<style[\s\S]*?<\/style>/gi, ' ');
  s = s.replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ');

  // Drop shared chrome: <nav>...</nav>, <footer>...</footer>.
  s = s.replace(/<nav[\s\S]*?<\/nav>/gi, ' ');
  s = s.replace(/<footer[\s\S]*?<\/footer>/gi, ' ');

  // Drop the sticky mobile CTA bar and any "related-*" cross-link block.
  s = stripBlockByClass(s, 'sticky-mobile-bar', true);
  s = stripBlockByClass(s, 'related-', false);

  // Strip remaining tags, keeping text.
  s = s.replace(/<!--[\s\S]*?-->/g, ' ');
  s = s.replace(/<[^>]+>/g, ' ');

  s = decodeEntities(s);
  s = s.toLowerCase();
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

function tokenize(text) {
  // Keep letters/digits together; keep a trailing/leading $ or % attached to a number.
  const raw = text.match(/[a-z0-9]+(?:['.][a-z0-9]+)*|\$\d[\d,.]*|\d[\d,.]*%?/g) || [];
  return raw;
}

function ngrams(tokens, n) {
  const grams = [];
  for (let i = 0; i + n <= tokens.length; i++) {
    grams.push(tokens.slice(i, i + n).join(' '));
  }
  return grams;
}

function analyzeFile(filePath, n) {
  const html = fs.readFileSync(filePath, 'utf8');
  const text = extractVisibleText(html);
  const tokens = tokenize(text);
  const grams = ngrams(tokens, n);
  return { filePath, tokens, grams, gramSet: new Set(grams) };
}

// Merge overlapping/adjacent shared n-grams (by their position in file A's gram list)
// into contiguous "runs" and return the longest ones, each rendered as its first ~12 words.
function findSharedRuns(aGrams, sharedSet, n, maxRuns) {
  const runs = [];
  let current = null;
  for (let i = 0; i < aGrams.length; i++) {
    if (sharedSet.has(aGrams[i])) {
      if (current) {
        current.endIdx = i;
      } else {
        current = { startIdx: i, endIdx: i };
      }
    } else if (current) {
      runs.push(current);
      current = null;
    }
  }
  if (current) runs.push(current);

  const withLength = runs.map((r) => {
    const gramWords = r.endIdx - r.startIdx + n; // total words covered by this run
    const words = aGrams[r.startIdx].split(' ');
    return { length: gramWords, preview: words.slice(0, 12).join(' ') };
  });

  withLength.sort((a, b) => b.length - a.length);
  return withLength.slice(0, maxRuns);
}

function pairStats(a, b, n) {
  const inter = new Set();
  const smaller = a.gramSet.size <= b.gramSet.size ? a.gramSet : b.gramSet;
  const larger = a.gramSet.size <= b.gramSet.size ? b.gramSet : a.gramSet;
  for (const g of smaller) {
    if (larger.has(g)) inter.add(g);
  }
  const union = a.gramSet.size + b.gramSet.size - inter.size;
  const minSize = Math.min(a.gramSet.size, b.gramSet.size) || 1;
  const containment = (inter.size / minSize) * 100;
  const jaccard = union > 0 ? (inter.size / union) * 100 : 0;

  const runsA = findSharedRuns(a.grams, inter, n, 5);

  return { containment, jaccard, interSize: inter.size, aSize: a.gramSet.size, bSize: b.gramSet.size, runs: runsA };
}

function fmtPct(x) {
  return x.toFixed(2) + '%';
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const n = args.n;
  const ceiling = args.ceiling;

  if (args.files.length < 2) {
    console.error('Usage: node scripts/check-ngram-overlap.js <fileA.html> <fileB.html> [--n 8] [--ceiling 12.8] [--json]');
    console.error('   or: node scripts/check-ngram-overlap.js --all <file1.html> <file2.html> ... [--n 8] [--ceiling 12.8] [--json] [--strict]');
    process.exit(2);
  }

  const analyses = args.files.map((f) => analyzeFile(path.resolve(f), n));

  const pairs = [];
  if (args.all) {
    for (let i = 0; i < analyses.length; i++) {
      for (let j = i + 1; j < analyses.length; j++) {
        pairs.push([analyses[i], analyses[j]]);
      }
    }
  } else {
    pairs.push([analyses[0], analyses[1]]);
  }

  const results = [];
  let anyOver = false;

  for (const [a, b] of pairs) {
    const stats = pairStats(a, b, n);
    const over = stats.containment > ceiling;
    if (over) anyOver = true;
    results.push({
      fileA: path.relative(process.cwd(), a.filePath),
      fileB: path.relative(process.cwd(), b.filePath),
      containment: stats.containment,
      jaccard: stats.jaccard,
      interSize: stats.interSize,
      aGrams: stats.aSize,
      bGrams: stats.bSize,
      over,
      runs: stats.runs,
    });
  }

  if (args.json) {
    console.log(JSON.stringify({ n, ceiling, results }, null, 2));
  } else {
    console.log(`n-gram overlap check (n=${n}, ceiling=${ceiling}%)\n`);
    for (const r of results) {
      console.log(`${r.fileA}  <->  ${r.fileB}`);
      console.log(`  containment: ${fmtPct(r.containment)}   jaccard: ${fmtPct(r.jaccard)}   shared ${n}-grams: ${r.interSize} (A=${r.aGrams}, B=${r.bGrams})   ${r.over ? `OVER (>${ceiling}%)` : 'ok'}`);
      if (r.runs.length) {
        console.log('  longest shared runs:');
        for (const run of r.runs) {
          console.log(`    [${run.length}w] "${run.preview}${run.length > 12 ? '...' : ''}"`);
        }
      }
      console.log('');
    }
  }

  if (args.strict && anyOver) {
    process.exit(1);
  }
  process.exit(0);
}

if (require.main === module) {
  main();
}

module.exports = { extractVisibleText, tokenize, ngrams, stripBlockByClass };
