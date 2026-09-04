/**
 * formspree-guard.js: enforce that every #contact-form submit in a spec file is
 * route-intercepted (P6-47)
 *
 * pages/contact.html's `<form>` posts to a LIVE Formspree endpoint
 * (https://formspree.io/f/xqenbpka). test/functional.spec.js already stubs
 * `page.route('**formspree.io/**', ...)` before every submit it drives, which is
 * why no real lead has ever come from a committed test run. But that discipline
 * was only convention: nothing stopped a new test (or a subagent editing this
 * file) from clicking #form-submit without the stub and quietly emailing the
 * owner a fake job, exactly as happened once already from an interactive
 * assessment session (see P6-47 Incident 2 in tasks/backlog.md, gitignored;
 * cite this check instead).
 *
 * This makes the property enforced rather than remembered: it scans every
 * `test(...)` block in test/**\/*.spec.js for a contact-form submit trigger
 * (`click('#form-submit')` or `'#contact-form'...submit()`), and fails if that
 * trigger is not preceded, inside the SAME test block, by a
 * `page.route('...formspree...', ...)` stub. A beforeEach-registered route does
 * NOT count on purpose: this check only looks inside individual test() bodies,
 * matching how the real spec file already writes it (the route call sits right
 * above the click, inside every contact-form test), so a stub hoisted out of the
 * test body would need a deliberate second look here, not a silent pass.
 *
 * Bracket depth is tracked at the character level to find the end of each
 * test(...) call, which is a heuristic, not a JS parser: it works because this
 * repo's spec files don't nest unbalanced parens inside string literals (a
 * phone number like '(949) 000-0000' balances to net zero and is harmless).
 * A real syntax error would already fail `npx playwright test` on its own.
 *
 * Before any matching, comments are stripped (see stripComments below) so a
 * commented-out `// await page.route('**formspree.io/**', ...)` can never
 * satisfy this check and let a real, unguarded submit through. String
 * literals are left untouched (both because the selectors and URL patterns
 * this check matches live inside them, and so a stray "//" or "/*" inside a
 * string is never mistaken for the start of a comment).
 *
 * Usage:
 *   node test/formspree-guard.js
 */

'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const testDir = path.join(root, 'test');

// Any `test(...)`, `test.only(...)`, or `test.skip(...)` call: deliberately
// excludes `test.describe(...)`, since a describe block is not "the same test
// block" the backlog item is scoped to.
const TEST_CALL_RE = /\btest(?:\.only|\.skip)?\s*\(/g;

// A click on the contact form's submit button, or an explicit .submit() call
// targeting #contact-form.
const SUBMIT_RE = /\.click\(\s*['"]#form-submit['"]\s*\)|['"]#contact-form['"][\s\S]{0,60}?\.submit\(\s*\)/g;

// A Formspree route stub, matching the pattern every existing test already uses:
// page.route('**formspree.io/**', ...).
const ROUTE_STUB_RE = /\.route\(\s*[`'"][^`'"]*formspree[^`'"]*[`'"]/gi;

// Blanks out `//` line comments and `/* */` block comments, leaving every
// other character (including string-literal contents) untouched, so the
// SUBMIT_RE / ROUTE_STUB_RE matching below never treats commented-out code
// as real code. String literals are copied through verbatim, character for
// character (escape sequences included), specifically so a `//` or `/*`
// inside a string is never misread as the start of a comment. Output is the
// same length as the input with newlines in the same positions, so every
// index computed against the sanitized text is still a valid index (and
// line number, via lineOf) into the original source.
function stripComments(src) {
  let out = '';
  const n = src.length;
  let i = 0;
  while (i < n) {
    const ch = src[i];
    const next = src[i + 1];

    if (ch === '"' || ch === "'" || ch === '`') {
      const quote = ch;
      out += ch;
      i++;
      while (i < n) {
        const c = src[i];
        out += c;
        if (c === '\\' && i + 1 < n) {
          out += src[i + 1];
          i += 2;
          continue;
        }
        i++;
        if (c === quote) break;
      }
      continue;
    }

    if (ch === '/' && next === '/') {
      while (i < n && src[i] !== '\n') {
        out += ' ';
        i++;
      }
      continue;
    }

    if (ch === '/' && next === '*') {
      out += '  ';
      i += 2;
      while (i < n && !(src[i] === '*' && src[i + 1] === '/')) {
        out += src[i] === '\n' ? '\n' : ' ';
        i++;
      }
      if (i < n) {
        out += '  ';
        i += 2;
      }
      continue;
    }

    out += ch;
    i++;
  }
  return out;
}

function findSpecFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...findSpecFiles(full));
    } else if (entry.isFile() && entry.name.endsWith('.spec.js')) {
      out.push(full);
    }
  }
  return out;
}

function lineOf(src, index) {
  let line = 1;
  for (let i = 0; i < index; i++) {
    if (src[i] === '\n') line++;
  }
  return line;
}

function extractTestBlocks(src) {
  const blocks = [];
  let m;
  TEST_CALL_RE.lastIndex = 0;
  while ((m = TEST_CALL_RE.exec(src))) {
    const openParenIndex = TEST_CALL_RE.lastIndex - 1; // index of the '(' just matched
    let depth = 0;
    let end = -1;
    for (let i = openParenIndex; i < src.length; i++) {
      const ch = src[i];
      if (ch === '(') depth++;
      else if (ch === ')') {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    if (end === -1) {
      // Unbalanced parens (malformed file); nothing this heuristic can do,
      // and `npx playwright test` will fail on it independently.
      continue;
    }
    blocks.push({ start: m.index, end, text: src.slice(m.index, end + 1) });
    TEST_CALL_RE.lastIndex = end + 1;
  }
  return blocks;
}

const violations = [];
let submitTestCount = 0;

for (const file of findSpecFiles(testDir)) {
  const rel = path.relative(root, file).split(path.sep).join('/');
  const src = fs.readFileSync(file, 'utf8');
  // Match against the comment-stripped text (see stripComments above), not
  // the raw source, so a commented-out stub can never satisfy the guard.
  // Same length as src with newlines in the same positions, so indices into
  // it are still valid indices into src for line-number reporting.
  const sanitized = stripComments(src);

  for (const block of extractTestBlocks(sanitized)) {
    SUBMIT_RE.lastIndex = 0;
    const submitMatch = SUBMIT_RE.exec(block.text);
    if (!submitMatch) continue; // this test never submits the contact form

    submitTestCount++;

    ROUTE_STUB_RE.lastIndex = 0;
    const stubMatch = ROUTE_STUB_RE.exec(block.text);
    const stubComesFirst = stubMatch && stubMatch.index < submitMatch.index;

    if (!stubComesFirst) {
      violations.push(
        `${rel}:${lineOf(src, block.start + submitMatch.index)}: submits #contact-form without a preceding ` +
          `page.route('**formspree.io/**', ...) stub in the same test block`
      );
    }
  }
}

if (violations.length) {
  console.error(`formspree-guard: ${violations.length} unguarded contact-form submit(s) found:`);
  violations.forEach((v) => console.error('  ' + v));
  console.error(
    '\nEvery test that clicks #form-submit (or calls #contact-form.submit()) must register ' +
      "page.route('**formspree.io/**', ...) earlier in the SAME test() body. Without it, a real " +
      'submission reaches the live Formspree endpoint and creates a fake lead in the owner\'s inbox ' +
      '(P6-47 Incident 2).'
  );
  process.exit(1);
}

console.log(`formspree-guard: ${submitTestCount} contact-form submit test(s) checked, all route-stubbed. OK`);
