// Conform every FAQPage JSON-LD entry site-wide to the page's VISIBLE FAQ copy.
// Run 2026-08-02 to pay down P6-12 (the debt measured by the `faq-jsonld-parity`
// check in test/content-integrity.js, recorded in test/faq-parity-baseline.json:
// 375 drifted fields across 87 files as of 2026-07-31).
//
// DIRECTION OF THE FIX IS FIXED: the JSON-LD is rewritten to match the visible
// page, never the reverse. This script never touches visible HTML copy, <style>
// blocks, or any non-FAQPage schema.
//
// The `decode`, `stripDeco`, `norm` helpers and the visible-FAQ extraction below
// (all three markup families: hub <button class="faq-q">, article
// <div class="faq-q">, and the family-3 <div class="faq-item"><h3>/<p> fallback)
// are copied VERBATIM from test/content-integrity.js check 13
// (faq-jsonld-parity, ~lines 706-782). Do not "improve" these independently of
// the check — any divergence here would silently reintroduce drift the check is
// designed to catch, because this script's notion of "visible text" would no
// longer match the check's.
//
// EDIT STRATEGY — surgical, not a re-serialize. Re-stringifying an entire
// FAQPage JSON-LD block would reformat every untouched line and make the diff
// unreviewable. Instead, inside each block's raw text, this script locates
// JSON.stringify(oldValue) and replaces it with JSON.stringify(newValue), using
// a cursor that only ever advances, so a replacement always lands on the
// occurrence belonging to the current mainEntity index, never an earlier one
// that happens to share the same text. Verified empirically before writing this
// script (2026-08-02): across all 139 FAQPage-bearing files site-wide (887
// name/text fields), JSON.stringify(parsedValue) exactly reproduces the raw
// substring in every case, every FAQPage-bearing <script> block holds exactly
// one top-level node (the FAQPage itself, never array-wrapped or sharing the
// block with a sibling schema node), and every Question/Answer node carries
// ONLY @type/name/acceptedAnswer and @type/text. Those assumptions are
// re-asserted at runtime below (see PHASE 1) and the whole run aborts, with
// nothing written, if any file violates them — this is not expected to fire,
// but "assert and abort loudly" beats silently guessing on a file this script
// has not seen.
//
// Two-phase design:
//   PHASE 1 (validate) — walk every .html file, parse every
//     application/ld+json block, and for every FAQPage node found, assert the
//     structural shape above. Any violation anywhere aborts the ENTIRE run
//     (process.exit(1), nothing written) — the premise must hold everywhere
//     before any file is safe to edit.
//   PHASE 2 (edit) — for files that passed phase 1, pair JSON-LD entry i with
//     visible item i (only over the overlapping range — a visible/JSON-LD
//     count mismatch is reported, never invented or deleted around), compute
//     the surgical edit, then SELF-VERIFY before writing: re-parse the edited
//     block, confirm every field other than the touched name/text values is
//     deep-equal to the original, and confirm each rewritten value now equals
//     the intended visible text. A file that fails self-verify (or whose
//     anchor text can't be located) is left completely untouched and reported —
//     that failure is file-scoped, unlike a phase-1 violation.
//
// Supports --dry-run (report only, writes nothing). Never touches
// test/faq-parity-baseline.json — retiring paid-down entries from the baseline
// is a separate, deliberate step (see tasks/backlog.md P6-12).
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const DRY_RUN = process.argv.includes('--dry-run');
const SKIP = new Set(['node_modules', '.git', '.claude', '.agents', '.audits', '.playwright-mcp', '.staging', '.husky', 'test-results', 'partials']);

function walk(d, out = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, out); else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

// ── Helpers copied VERBATIM from test/content-integrity.js check 13 ──────────
const decode = (s) => s
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
  .replace(/&rsquo;/g, '’').replace(/&lsquo;/g, '‘')
  .replace(/&ldquo;/g, '“').replace(/&rdquo;/g, '”')
  .replace(/&middot;/g, '·').replace(/&ndash;/g, '–').replace(/&mdash;/g, '—')
  .replace(/&rarr;/g, '→').replace(/&hellip;/g, '…');
// strip tags FIRST, then decode, so an encoded &lt;b&gt; in copy is not eaten as markup
const norm = (s) => decode(s.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();

const stripDeco = (s) => s
  .replace(/<span\b[^>]*\baria-hidden="true"[^>]*>[\s\S]*?<\/span>/g, '')
  .replace(/<span\b[^>]*\bclass="[^"]*\bicon\b[^"]*"[^>]*>[\s\S]*?<\/span>/g, '')
  .replace(/<span\b[^>]*\bclass="[^"]*\bfaq-icon\b[^"]*"[^>]*>[\s\S]*?<\/span>/g, '');

function extractVisible(content) {
  const vis = [];
  const Q = /<(button|div|h[2-4])\b[^>]*\bclass="[^"]*\bfaq-q\b[^"]*"[^>]*>([\s\S]*?)<\/\1>/g;
  const A = /<(div|p)\b[^>]*\bclass="[^"]*\bfaq-a\b[^"]*"[^>]*>([\s\S]*?)<\/\1>/g;
  let qs = [...content.matchAll(Q)].map(m => norm(stripDeco(m[2])));
  let as = [...content.matchAll(A)].map(m => norm(m[2]));

  if (qs.length === 0 && as.length === 0) {
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
  return vis;
}
// ── end verbatim helpers ───────────────────────────────────────────────────

const OPEN_TAG = '<script type="application/ld+json">';

// Advance a cursor through `text` looking for JSON.stringify(oldVal) at or after
// `cursor`. If oldVal === newVal, no text changes but the cursor still advances
// past the located occurrence (keeps later searches correctly ordered even past
// fields that don't need editing). Returns { ok:false } if the anchor cannot be
// located — the caller must leave the file untouched in that case.
//
// The "does this need a change" decision compares norm(oldVal) to newVal (newVal
// is already normalized, coming straight from extractVisible), NOT the raw
// oldVal — this must mirror the check's own equivalence relation
// (`norm(ldPairs[i].q) !== vis[i].q`) exactly. A raw comparison here produced
// false positives on pages/wolf-appliance-repair-orange-county.html: its raw
// JSON-LD text has literal double-spaces around em-dash-style hyphens (e.g.
// "is open  -  call") that norm()'s `\s+` collapse treats as equal to the
// visible page's single-spaced rendering, but which a raw !== would flag as
// drift that isn't real. Skipping the norm() on the old side would have
// rewritten fields the check never counted as drifted in the first place.
function advance(text, cursor, oldVal, newVal) {
  const anchorOld = JSON.stringify(oldVal);
  const idx = text.indexOf(anchorOld, cursor);
  if (idx === -1) return { ok: false };
  if (norm(oldVal) === newVal) {
    return { ok: true, text, cursor: idx + anchorOld.length, changed: false };
  }
  const anchorNew = JSON.stringify(newVal);
  const newText = text.slice(0, idx) + anchorNew + text.slice(idx + anchorOld.length);
  return { ok: true, text: newText, cursor: idx + anchorNew.length, changed: true };
}

// ── PHASE 1: walk + validate the structural assumption on every file ─────────
const fatals = [];
const plans = [];

const files = walk(ROOT).sort((a, b) => a.localeCompare(b));

for (const filePath of files) {
  const rel = path.relative(ROOT, filePath).split(path.sep).join('/');
  const content = fs.readFileSync(filePath, 'utf8');

  const blockRe = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
  const blocks = [];
  let m;
  while ((m = blockRe.exec(content))) {
    const blockText = m[1];
    let parsed;
    try { parsed = JSON.parse(blockText); } catch { continue; }
    const nodes = Array.isArray(parsed) ? parsed : [parsed];
    const faqNodes = nodes.filter(n => n && n['@type'] === 'FAQPage' && Array.isArray(n.mainEntity));
    if (faqNodes.length === 0) continue;

    if (nodes.length !== 1 || faqNodes.length !== 1) {
      fatals.push(`${rel} — FAQPage-bearing <script> block does not hold exactly one top-level node (found ${nodes.length} node(s), ${faqNodes.length} FAQPage node(s))`);
      continue;
    }
    const faqNode = faqNodes[0];
    let shapeOk = true;
    for (let mi = 0; mi < faqNode.mainEntity.length; mi++) {
      const q = faqNode.mainEntity[mi];
      const qKeys = q && typeof q === 'object' ? Object.keys(q).sort().join(',') : typeof q;
      if (!q || qKeys !== '@type,acceptedAnswer,name' || q['@type'] !== 'Question' || typeof q.name !== 'string') {
        fatals.push(`${rel} — mainEntity[${mi}] Question node has unexpected shape (keys: ${qKeys})`);
        shapeOk = false;
        continue;
      }
      const aa = q.acceptedAnswer;
      const aKeys = aa && typeof aa === 'object' ? Object.keys(aa).sort().join(',') : typeof aa;
      if (!aa || aKeys !== '@type,text' || aa['@type'] !== 'Answer' || typeof aa.text !== 'string') {
        fatals.push(`${rel} — mainEntity[${mi}] acceptedAnswer has unexpected shape (keys: ${aKeys})`);
        shapeOk = false;
      }
    }
    if (!shapeOk) continue;

    blocks.push({
      blockStartAbs: m.index + OPEN_TAG.length,
      blockEndAbs: m.index + OPEN_TAG.length + blockText.length,
      blockText,
      originalParsedRoot: parsed,
      faqNode,
    });
  }

  if (blocks.length === 0) continue; // no (valid) FAQPage on this file

  const vis = extractVisible(content);
  const ldCount = blocks.reduce((n, b) => n + b.faqNode.mainEntity.length, 0);
  plans.push({ filePath, rel, content, blocks, vis, ldCount });
}

if (fatals.length) {
  console.error('\nFATAL — structural assumption violated; aborting WITHOUT WRITING ANYTHING:\n');
  fatals.forEach(f => console.error('  ' + f));
  console.error(`\n${fatals.length} violation(s). Fix the premise (or this script) before re-running.\n`);
  process.exit(1);
}

// ── PHASE 2: build + self-verify surgical edits, file by file ────────────────
let grandTotalChanged = 0;
let grandTotalFilesChanged = 0;
const perFileReport = [];
const countMismatchFiles = [];
const unresolvedFiles = [];
const verifyFailedFiles = [];
const vacuousFiles = [];

for (const plan of plans) {
  const { filePath, rel, content, blocks, vis, ldCount } = plan;

  if (vis.length === 0) {
    vacuousFiles.push(`${rel} — has FAQPage JSON-LD (${ldCount} entries) but no visible .faq-q/.faq-a/.faq-item could be parsed`);
    continue;
  }
  if (vis.length !== ldCount) {
    countMismatchFiles.push(`${rel} — ${vis.length} visible vs ${ldCount} JSON-LD entries; conforming overlapping pairs only, not inventing or deleting`);
  }

  let globalIdx = 0;
  let fileFailed = false;
  let fileChanged = 0;
  const editedBlocks = [];

  for (const block of blocks) {
    let text = block.blockText;
    let cursor = 0;
    let blockChanged = 0;
    const mainEntity = block.faqNode.mainEntity;
    const changes = []; // { mi, field: 'name'|'text', newVal }

    for (let mi = 0; mi < mainEntity.length && globalIdx < vis.length; mi++) {
      const q = mainEntity[mi];
      const target = vis[globalIdx];
      globalIdx++;

      const stepQ = advance(text, cursor, q.name, target.q);
      if (!stepQ.ok) {
        fileFailed = true;
        unresolvedFiles.push(`${rel} — could not locate mainEntity[${mi}].name anchor in the raw JSON-LD text`);
        break;
      }
      text = stepQ.text; cursor = stepQ.cursor;
      if (stepQ.changed) { blockChanged++; changes.push({ mi, field: 'name', newVal: target.q }); }

      const stepA = advance(text, cursor, q.acceptedAnswer.text, target.a);
      if (!stepA.ok) {
        fileFailed = true;
        unresolvedFiles.push(`${rel} — could not locate mainEntity[${mi}].acceptedAnswer.text anchor in the raw JSON-LD text`);
        break;
      }
      text = stepA.text; cursor = stepA.cursor;
      if (stepA.changed) { blockChanged++; changes.push({ mi, field: 'text', newVal: target.a }); }
    }
    if (fileFailed) break;

    if (blockChanged > 0) {
      let reparsed;
      try { reparsed = JSON.parse(text); }
      catch (e) {
        fileFailed = true;
        verifyFailedFiles.push(`${rel} — modified block failed to re-parse: ${e.message}`);
        break;
      }

      // Confirm every field OTHER than the touched name/text values is deep-equal
      // to the original: clone the original, apply only the intended field
      // writes, and compare the whole structure against the reparsed result.
      const expectedRoot = JSON.parse(JSON.stringify(block.originalParsedRoot));
      const expectedFaqNode = Array.isArray(expectedRoot) ? expectedRoot[0] : expectedRoot;
      for (const ch of changes) {
        if (ch.field === 'name') expectedFaqNode.mainEntity[ch.mi].name = ch.newVal;
        else expectedFaqNode.mainEntity[ch.mi].acceptedAnswer.text = ch.newVal;
      }
      if (JSON.stringify(expectedRoot) !== JSON.stringify(reparsed)) {
        fileFailed = true;
        verifyFailedFiles.push(`${rel} — self-verify failed: modified block is not deep-equal to (original + intended field writes) — an unintended change was made`);
        break;
      }

      // Confirm each rewritten value now literally equals the intended visible text.
      const reparsedFaqNode = Array.isArray(reparsed) ? reparsed[0] : reparsed;
      for (const ch of changes) {
        const actual = ch.field === 'name'
          ? reparsedFaqNode.mainEntity[ch.mi].name
          : reparsedFaqNode.mainEntity[ch.mi].acceptedAnswer.text;
        if (actual !== ch.newVal) {
          fileFailed = true;
          verifyFailedFiles.push(`${rel} — self-verify failed: mainEntity[${ch.mi}].${ch.field} does not equal the intended visible text after rewrite`);
        }
      }
      if (fileFailed) break;

      editedBlocks.push({ blockStartAbs: block.blockStartAbs, blockEndAbs: block.blockEndAbs, newText: text });
      fileChanged += blockChanged;
    }
  }

  if (fileFailed) continue; // left completely untouched; reason already recorded above
  if (fileChanged === 0) continue; // every pair already matched — nothing to write

  // Apply edits bottom-to-top so earlier offsets stay valid.
  const sortedEdits = [...editedBlocks].sort((a, b) => b.blockStartAbs - a.blockStartAbs);
  let newContent = content;
  for (const e of sortedEdits) {
    newContent = newContent.slice(0, e.blockStartAbs) + e.newText + newContent.slice(e.blockEndAbs);
  }

  if (!DRY_RUN) {
    fs.writeFileSync(filePath, newContent, 'utf8'); // Node's utf8 writer never prepends a BOM
  }
  grandTotalChanged += fileChanged;
  grandTotalFilesChanged++;
  perFileReport.push(`${rel}: ${fileChanged} field(s) changed`);
}

console.log(`\n${DRY_RUN ? '[DRY RUN] ' : ''}Per-file changes:`);
perFileReport.forEach(l => console.log('  ' + l));

if (countMismatchFiles.length) {
  console.log(`\nCount mismatches — conformed overlapping pairs only (${countMismatchFiles.length}):`);
  countMismatchFiles.forEach(l => console.log('  ' + l));
}
if (unresolvedFiles.length) {
  console.log(`\nUnresolved anchors — file left UNTOUCHED (${unresolvedFiles.length}):`);
  unresolvedFiles.forEach(l => console.log('  ' + l));
}
if (verifyFailedFiles.length) {
  console.log(`\nSelf-verify failures — file left UNTOUCHED (${verifyFailedFiles.length}):`);
  verifyFailedFiles.forEach(l => console.log('  ' + l));
}
if (vacuousFiles.length) {
  console.log(`\nNo visible FAQ items parsed — file left UNTOUCHED (${vacuousFiles.length}):`);
  vacuousFiles.forEach(l => console.log('  ' + l));
}

console.log(`\n${DRY_RUN ? '[DRY RUN] ' : ''}Grand total: ${grandTotalChanged} field(s) changed across ${grandTotalFilesChanged} file(s) (${plans.length} file(s) scanned had a FAQPage node).`);
if (DRY_RUN) console.log('DRY RUN — no files were written.');
