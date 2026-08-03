// Audit: did conforming FAQPage JSON-LD to the visible page copy DOWNGRADE any
// sentence's punctuation? Written 2026-08-02 alongside
// scripts/oneoff/conform-faq-jsonld-2026-08-02.js (P6-12).
//
// WHY THIS EXISTS. The conformer rewrites JSON-LD to match the visible page, which
// is right when the page is right. It is wrong when the *page* is the damaged copy
// and the schema held the authored sentence — on this site that happened wherever
// an earlier em-dash sweep replaced ` — ` with `, `, leaving comma splices on the
// page and correct punctuation in the schema. Those needed the page fixed FIRST.
//
// The first review of that set was done by walking the "punctuation-only" drift
// bucket, pairing visible item i with JSON-LD entry i. That MISSED a real case:
// pages/appliance-repair-orange-ca.html had its Eichler Q&A last in the schema but
// 4th in the accordion, so from index 5 on, every field compared against the wrong
// visible item and bucketed as "substantive wording drift" instead. The conformer
// then downgraded a previously-correct semicolon to a comma splice. Caught in the
// PR #666 review, not by the check.
//
// So this audit is deliberately ALIGNMENT-INDEPENDENT: it never pairs by index. For
// every FAQ string in the working tree it looks for ANY string in the same file's
// pre-sweep version with the same letters and digits, and reports the pair when the
// old one carried more `: ; ( )` than the new one. Order, insertions and deletions
// are all irrelevant to it.
//
// TWO IMPLEMENTATION TRAPS, both hit by an independent reviewer re-deriving this
// from its prose description, both of which silently change the answer:
//
//   1. FOLD CASE in the match key. "Our technicians" vs "our technicians" is a
//      punctuation-driven case change (`. Our` -> `; our`), so a case-SENSITIVE key
//      fails to pair the two strings at all and the downgrade vanishes from the
//      report rather than being flagged. This is how the miele #8 case got missed.
//   2. COMPARE THE COMBINED COUNT of `: ; ( )`, not each mark separately. A colon
//      swapped for a semicolon is a lateral move between two strong marks, not a
//      loss; counting per-character reports it as a downgrade and buries the real
//      findings in false positives (three on article-dorm-appliances.html alone).
//
// Usage:  node scripts/oneoff/audit-faq-punctuation-downgrades-2026-08-02.js [git-ref]
// Default ref is `master` — i.e. "what did this branch change". Reads the old side
// via `git show <ref>:<path>`, so it needs no scratch checkout. Files absent from the
// ref (new pages) are skipped: there is no prior wording to downgrade.
//
// Output is a REVIEW AID, not a pass/fail gate: every hit needs a human call on
// which side is actually better English. At the close of P6-12 it reported exactly
// three, all deliberate and all documented in the PR:
//   - appliance-repair-costa-mesa-ca.html — "neighborhoods, including A, B, and C,
//     within a few hours" is an appositive, not a splice, and huntington-beach ships
//     the same comma form in both surfaces. Page copy left alone.
//   - appliance-repair-garden-grove-ca.html — the old schema read "begins; so you
//     can", and a semicolon is wrong before a coordinating conjunction. The visible
//     comma is the correct form.
//   - miele-appliance-repair-orange-county.html — "cabinet access. Our technicians"
//     vs "access; our technicians". Both correct; no reason to touch rendered copy.
// Exit status is 0 whether or not it finds anything.
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const REF = process.argv[2] || 'master';
const SKIP = new Set(['node_modules', '.git', '.claude', '.agents', '.audits', '.playwright-mcp', '.staging', '.husky', 'test-results', 'partials']);

function walk(d, out = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, out); else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

// Every Question name + Answer text in every FAQPage node, in document order.
function faqStrings(html) {
  const out = [];
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    let parsed;
    try { parsed = JSON.parse(m[1]); } catch { continue; }
    for (const node of (Array.isArray(parsed) ? parsed : [parsed])) {
      if (!node || node['@type'] !== 'FAQPage' || !Array.isArray(node.mainEntity)) continue;
      for (const q of node.mainEntity) {
        if (typeof q?.name === 'string') out.push(q.name);
        if (typeof q?.acceptedAnswer?.text === 'string') out.push(q.acceptedAnswer.text);
      }
    }
  }
  return out;
}

function showFromRef(relPath) {
  try {
    return execFileSync('git', ['show', `${REF}:${relPath}`], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  } catch {
    return null; // not in that ref (new file) — nothing to compare against
  }
}

// TRAP 1: lower-case before stripping, so a punctuation-driven capitalisation
// change ("; our" vs ". Our") still pairs the two strings.
const key = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
// TRAP 2: one combined total, so `:` <-> `;` reads as lateral, not as a loss.
const strength = (s) => [...s].filter(c => c === ':' || c === ';' || c === '(' || c === ')').length;

let flagged = 0;
let compared = 0;

for (const abs of walk(ROOT)) {
  const rel = path.relative(ROOT, abs).split(path.sep).join('/');
  const now = faqStrings(fs.readFileSync(abs, 'utf8'));
  if (!now.length) continue;
  const oldHtml = showFromRef(rel);
  if (oldHtml === null) continue;
  const before = faqStrings(oldHtml);
  if (!before.length) continue;

  const byKey = new Map();
  for (const s of before) if (!byKey.has(key(s))) byKey.set(key(s), s);

  for (const cur of now) {
    const prev = byKey.get(key(cur));
    if (prev === undefined || prev === cur) continue;
    compared++;
    if (strength(prev) > strength(cur)) {
      flagged++;
      console.log(`\n${rel}`);
      console.log(`  NOW (${strength(cur)} strong marks): ${cur.slice(0, 200)}`);
      console.log(`  ${REF} (${strength(prev)}): ${prev.slice(0, 200)}`);
    }
  }
}

console.log(`\n${flagged} field(s) where the ${REF} JSON-LD carried stronger punctuation than the working tree does`);
console.log(`(${compared} same-words pair(s) examined). Each hit needs a human call on which side reads better.`);
