#!/usr/bin/env node
/**
 * P6-18 candidate index. Replaces the position-matched scratch script that caused a
 * FABRICATION in PR #679.
 *
 * WHY THIS EXISTS
 * The original tool paired pre-sweep and current FAQ answers BY ARRAY POSITION. PR #666
 * added and reordered JSON-LD entries in places, so position i on each side is sometimes
 * a different question. Acting on one such phantom entry, a brand-new sentence was written
 * and shipped as a "restoration" onto a field that had never been thinned at all.
 *
 * This version matches BY QUESTION NAME and refuses to emit a candidate unless it can
 * prove a removal exists. That is the precondition the PR #679 reviewer identified as
 * missing: every rule in P6-18 checks whether a restoration is worded well; none asked
 * whether the field was a real candidate.
 *
 * USAGE
 *   node scripts/oneoff/faq-thinning-index-2026-08-04.js            # list candidates
 *   node scripts/oneoff/faq-thinning-index-2026-08-04.js --selftest # run calibration fixtures
 *
 * ⚠️ KNOWN LIMITATION, found immediately on first real use (2026-08-04).
 * A 100% single-span score means "one contiguous region accounts for all removal". That is
 * a content DROP only if the rest of the answer survived. When #666 REWROTE an answer
 * wholesale, the whole old text is one removed span and it also scores 100% — and a rewrite
 * is frequently an IMPROVEMENT that must not be reverted.
 *
 * Concrete: article-dishwasher-leaking-dana-point "leaking from the bottom" scores 100%.
 * The pre-sweep text said the door gasket is "the most common culprit" for a BOTTOM leak.
 * The current text correctly says a door gasket leaks from the FRONT of the door, not the
 * bottom, and distinguishes during-cycle from after-cycle causes. Restoring the old text
 * would reintroduce a factual error and lose a better diagnostic.
 *
 * So: high span share identifies where to LOOK, never what to do. Read both versions in
 * full and ask which is more accurate, not which is longer. Batch 7 restored ZERO of its
 * top three candidates for exactly this reason.
 *
 * SELF-TEST is not decoration. The two fixtures are the only two fields whose correct
 * classification is independently known, both established by review:
 *   freezer-repair-orange-county  "loud noise"  -> STYLISTIC   (63 chars over ~7 word trims)
 *   garbage-disposal              "breaker"     -> CONTENT DROP (73 chars, 72 in one sentence)
 * If either fixture misclassifies, the tool is wrong and its output must not be used.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const PRE_SWEEP = '7a1eb04~1';                 // the commit before the #666 conform sweep
const SHRINK_MIN = 60;                          // the P6-18 threshold for "a thinned field"

function faqMap(html) {
  const out = new Map();
  const re = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
  for (const m of html.matchAll(re)) {
    let parsed;
    try { parsed = JSON.parse(m[1]); } catch { continue; }
    (function walk(n) {
      if (Array.isArray(n)) return n.forEach(walk);
      if (!n || typeof n !== 'object') return;
      if (n['@type'] === 'Question' && typeof n.name === 'string') {
        const a = (n.acceptedAnswer || {}).text;
        if (typeof a === 'string') out.set(n.name.trim(), a);
      }
      for (const v of Object.values(n)) if (v && typeof v === 'object') walk(v);
    })(parsed);
  }
  return out;
}

function preSweep(relPath) {
  try {
    return execFileSync('git', ['show', `${PRE_SWEEP}:${relPath.split(path.sep).join('/')}`],
      { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  } catch { return null; }
}

// Largest contiguous removed span as a share of all removed characters.
// >=55% means one clause carries the loss: a content drop, not a rewording.
function spans(oldText, newText) {
  const removed = [];
  let i = 0, j = 0;
  while (i < oldText.length) {
    if (j < newText.length && oldText[i] === newText[j]) { i++; j++; continue; }
    let best = 0, bestJ = j;
    for (let k = j; k < Math.min(newText.length, j + 400); k++) {
      let run = 0;
      while (oldText[i + run] === newText[k + run] && run < 40) run++;
      if (run > best) { best = run; bestJ = k; }
      if (run >= 40) break;
    }
    if (best >= 8) { removed.push(oldText.slice(i, i + (bestJ - j >= 0 ? 0 : 0)) || ''); j = bestJ; continue; }
    let end = i;
    while (end < oldText.length && (j >= newText.length || oldText[end] !== newText[j])) end++;
    removed.push(oldText.slice(i, end));
    i = end;
    if (i < oldText.length) { i++; j++; }
  }
  return removed.filter(Boolean).sort((a, b) => b.length - a.length);
}

function classify(oldText, newText) {
  const sp = spans(oldText, newText);
  const total = sp.reduce((a, s) => a + s.length, 0) || 1;
  const share = sp.length ? (100 * sp[0].length) / total : 0;
  return { share, largest: sp[0] || '', spans: sp };
}

function candidates() {
  const dirs = ['articles', 'pages'];
  const rows = [];
  for (const d of dirs) {
    for (const f of fs.readdirSync(path.join(ROOT, d))) {
      if (!f.endsWith('.html')) continue;
      const rel = `${d}/${f}`;
      const before = preSweep(rel);
      if (!before) continue;
      const oldMap = faqMap(before);
      const newMap = faqMap(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
      for (const [name, oldAns] of oldMap) {
        // PRECONDITION 1: the same question must still exist, matched by name.
        if (!newMap.has(name)) continue;
        const newAns = newMap.get(name);
        // PRECONDITION 2: a removal must actually exist. This is the check whose
        // absence produced the PR #679 fabrication.
        if (oldAns === newAns) continue;
        const shrink = oldAns.length - newAns.length;
        if (shrink < SHRINK_MIN) continue;
        const c = classify(oldAns, newAns);
        rows.push({ file: rel, question: name, shrink, share: Math.round(c.share), largest: c.largest.trim() });
      }
    }
  }
  return rows.sort((a, b) => b.share - a.share || b.shrink - a.shrink);
}

const FIXTURES = [
  { file: 'pages/freezer-repair-orange-county.html', match: /loud noise/i, expect: 'STYLISTIC' },
  { file: 'pages/garbage-disposal-repair-orange-county.html', match: /breaker/i, expect: 'CONTENT' },
];

if (process.argv.includes('--selftest')) {
  let bad = 0;
  for (const fx of FIXTURES) {
    const before = preSweep(fx.file);
    const oldMap = faqMap(before || '');
    const newMap = faqMap(fs.readFileSync(path.join(ROOT, fx.file), 'utf8'));
    let got = 'NO-CANDIDATE';
    for (const [name, oldAns] of oldMap) {
      if (!fx.match.test(name) || !newMap.has(name)) continue;
      const newAns = newMap.get(name);
      if (oldAns === newAns) { got = 'IDENTICAL'; break; }
      got = classify(oldAns, newAns).share >= 55 ? 'CONTENT' : 'STYLISTIC';
      break;
    }
    const ok = got === fx.expect;
    if (!ok) bad++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${fx.file}  expected ${fx.expect}, got ${got}`);
  }
  console.log(bad ? '\nSELF-TEST FAILED — do not use this tool\'s output.' : '\nself-test passed');
  process.exit(bad ? 1 : 0);
}

const rows = candidates();
console.log(`${rows.length} genuine candidates (question matched by name, removal confirmed, shrink >= ${SHRINK_MIN})\n`);
for (const r of rows.slice(0, 25)) {
  console.log(`  ${String(r.share).padStart(3)}%  -${String(r.shrink).padStart(3)}c  ${r.file}`);
  console.log(`        Q: ${r.question.slice(0, 88)}`);
  console.log(`        removed: ${JSON.stringify(r.largest.slice(0, 92))}`);
}
