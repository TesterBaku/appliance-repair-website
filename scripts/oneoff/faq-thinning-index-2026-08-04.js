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
 * Concrete: article-dishwasher-leaking-dana-point "leaking from the bottom" scored 100% under
 * the ORIGINAL broken diff, which is how it reached the top of the list. Under the corrected
 * LCS it scores ~8% and is nowhere near the top - the ranking was the artifact, but reading
 * the two texts still proved the point.
 * The pre-sweep text said the door gasket is "the most common culprit" for a BOTTOM leak.
 * The current text correctly says a door gasket leaks from the FRONT of the door, not the
 * bottom, and distinguishes during-cycle from after-cycle causes. Restoring the old text
 * would reintroduce a factual error and lose a better diagnostic.
 *
 * So: high span share identifies where to LOOK, never what to do. Read both versions in
 * full and ask which is more accurate, not which is longer. Batch 7 restored ZERO of its
 * top three candidates for exactly this reason.
 *
 * SELF-TEST uses SYNTHETIC pairs, not live fields. An earlier version used two real FAQ
 * answers and one of them was wrong: its "73 chars, 72 in one sentence" was stale, because
 * PR #675 had already restored that field, so its real shrink was zero. It passed only
 * because the diff was broken. Repo state moves under a fixture; a synthetic pair does not.
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

// Removed spans, via a real LCS diff.
//
// The first version of this hand-rolled a resync loop that scanned forward for a single
// matching character without retrying the lookahead. When the first divergence was not
// quickly resolvable it collapsed the ENTIRE remaining old text into one span and reported
// 100%. The PR #680 reviewer measured the damage against difflib and an independent LCS
// implementation: 23 of 50 rows were wrong by >=20 points, 12 by >=50, always inflating.
// Every "clean 100%" row was really 14-48%.
//
// Answers are a few hundred characters, so an O(n*m) LCS table is trivially affordable and
// exactly correct. Do not replace this with a cleverer approximation.
function spans(oldText, newText) {
  const n = oldText.length, m = newText.length;
  const dp = new Uint32Array((n + 1) * (m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i * (m + 1) + j] = oldText[i] === newText[j]
        ? dp[(i + 1) * (m + 1) + (j + 1)] + 1
        : Math.max(dp[(i + 1) * (m + 1) + j], dp[i * (m + 1) + (j + 1)]);
    }
  }
  const removed = [];
  let i = 0, j = 0, cur = '';
  while (i < n && j < m) {
    if (oldText[i] === newText[j]) {
      if (cur) { removed.push(cur); cur = ''; }
      i++; j++;
    } else if (dp[(i + 1) * (m + 1) + j] >= dp[i * (m + 1) + (j + 1)]) {
      cur += oldText[i++];              // present in old, absent in new: removed
    } else {
      j++;                              // present in new only: inserted, not our concern
    }
  }
  while (i < n) cur += oldText[i++];
  if (cur) removed.push(cur);
  return removed.sort((a, b) => b.length - a.length);
}

function classify(oldText, newText) {
  const sp = spans(oldText, newText);
  const total = sp.reduce((a, s) => a + s.length, 0) || 1;
  return { share: sp.length ? (100 * sp[0].length) / total : 0, largest: sp[0] || '', count: sp.length };
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

// SELF-TEST — deterministic unit tests of the diff, not of repo state.
//
// The first version used two live FAQ fields as fixtures and one of them was WRONG: its
// docstring claimed "73 chars, 72 in one sentence" for the disposal breaker answer, but
// that field's real shrink today is ZERO, because PR #675 already restored it. The fixture
// passed only because the broken diff over-reported, i.e. the self-test was rubber-stamping
// the bug it existed to catch. Found by the PR #680 reviewer.
//
// Repo state moves under a fixture; a synthetic pair does not. These assert the property
// that actually matters: does the diff separate "one clause was cut" from "the wording was
// changed throughout"?
const FIXTURES = [
  {
    name: 'whole sentence cut => CONTENT DROP',
    old: 'The vent is clogged. This is also a fire hazard, the USFA reports thousands of dryer fires a year. Clean it first.',
    new: 'The vent is clogged. Clean it first.',
    expect: 'CONTENT',
  },
  {
    name: 'reworded throughout, nothing cut => STYLISTIC',
    old: 'A loud humming or buzzing usually points to the condenser fan motor working harder than normal, often caused by dirty coils.',
    new: 'A loud hum or buzz usually points to the condenser fan motor working harder than normal, often from dirty coils.',
    expect: 'STYLISTIC',
  },
  {
    name: 'identical text => never a candidate',
    old: 'The door gasket hardens and cracks over time.',
    new: 'The door gasket hardens and cracks over time.',
    expect: 'IDENTICAL',
  },
];

if (process.argv.includes('--selftest')) {
  // NO ABSOLUTE THRESHOLD IS ASSERTED, deliberately.
  // My first attempt classified at share >= 55% and the honest synthetic fixture FAILED:
  // a purely reworded answer scored 56%. The tempting fix was to move the threshold until
  // the fixtures passed, which is precisely the rubber-stamping that made the previous
  // self-test worthless. The real conclusion is that share is a WEAK signal: good enough to
  // rank fields for a human to read, not good enough to decide anything.
  //
  // So this asserts only what is unambiguous: identical text is never a candidate, and a
  // clean sentence excision must rank ABOVE a throughout-rewording. Relative ordering, not
  // a magic number.
  const cut = classify(FIXTURES[0].old, FIXTURES[0].new).share;
  const reworded = classify(FIXTURES[1].old, FIXTURES[1].new).share;
  const identical = FIXTURES[2].old === FIXTURES[2].new;
  const checks = [
    ['identical text is never a candidate', identical],
    ['a cut sentence outranks a rewording', cut > reworded],
    ['a cut sentence scores near-total', cut >= 90],
    // THE DISCRIMINATING CHECK. The #680 reviewer reinstated the old broken spans() and all
    // three of my other assertions still passed: that bug inflated BOTH fixtures together, so
    // relative ordering and a floor on `cut` both survived it (reworded went 56% -> 75.9%).
    // A self-test that passes on the bug it was rebuilt to catch is the exact failure being
    // removed here. An absolute CEILING on the reworded fixture is what actually discriminates.
    ['a rewording stays well under the cut score', reworded < 65],
  ];
  let bad = 0;
  for (const [name, ok] of checks) { if (!ok) bad++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`); }
  console.log(`
  cut=${Math.round(cut)}%  reworded=${Math.round(reworded)}%`);
  console.log(bad ? 'SELF-TEST FAILED - do not use this tool output.' : 'self-test passed');
  process.exit(bad ? 1 : 0);
}

const rows = candidates();
console.log(`${rows.length} genuine candidates (question matched by name, removal confirmed, shrink >= ${SHRINK_MIN})\n`);
for (const r of rows.slice(0, 25)) {
  console.log(`  ${String(r.share).padStart(3)}%  -${String(r.shrink).padStart(3)}c  ${r.file}`);
  console.log(`        Q: ${r.question.slice(0, 88)}`);
  console.log(`        removed: ${JSON.stringify(r.largest.slice(0, 92))}`);
}
