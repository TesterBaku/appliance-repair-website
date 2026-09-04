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
 * `test(...)` block in test/**\/*.spec.js for a reference, inside the test's
 * BODY (after the `=>` of its callback, never inside the test's own title
 * string; see bodySlice below), to one of three submit-candidate tokens: a
 * bare `#form-submit` or `#contact-form` selector literal (quote-anchored,
 * any of `` ` ``/`'`/`"`, so an unrelated string like `'form#contact-form'`
 * does not count), the word `formspree` inside any quoted string (case
 * insensitive), or the string `Send Message` inside any quoted string. If
 * the test body references any of those, it fails unless that reference is
 * preceded, inside the SAME test block, by a `page.route('...formspree...', ...)`
 * stub. A beforeEach-registered route does NOT count on purpose: this check
 * only looks inside individual test() bodies, matching how the real spec file
 * already writes it (the route call sits right above the click, inside every
 * contact-form test), so a stub hoisted out of the test body would need a
 * deliberate second look here, not a silent pass.
 *
 * Matching bare selector/token references, not just `.click(...)` or
 * `.submit()`, is deliberate (Copilot review, PR #804 round 3): Playwright
 * specs commonly drive a submit via `page.locator('#form-submit').click()`,
 * a variable assigned earlier and clicked later (`const submit =
 * page.locator('#form-submit'); ... await submit.click();`),
 * `page.press('#form-submit', 'Enter')`, `.evaluate(f => f.submit())` /
 * `.evaluate(f => f.requestSubmit())`, or `.dispatchEvent('submit')`, none of
 * which the original click/submit-only pattern caught. Every one of those
 * still needs the selector string somewhere in the test body, so anchoring on
 * the selector itself (rather than the specific call that fires it) closes
 * the gap without trying to parse every way Playwright can trigger a click.
 *
 * Round 4 (Copilot review, PR #804) widened this further after a second
 * fixture set: a backtick-delimited selector (`` page.click(`#form-submit`) ``)
 * was missed because the old character class was quote-only; an alternate CSS
 * selector reaching the same button (`page.click('form[action*="formspree"]
 * button[type="submit"]')`) and `page.getByRole('button', {name: 'Send
 * Message'})` were both missed entirely because neither contains the literal
 * string `#form-submit` or `#contact-form`. The backtick is now in the
 * selector class; the `formspree` and `Send Message` tokens catch the other
 * two by matching on text that selector-by-attribute and getByRole calls do
 * still contain, even though they do not contain the ID.
 *
 * Stated, real boundary of this heuristic (not fixed here, because a regex
 * cannot fix it without becoming a JS parser): a selector assembled at
 * runtime, whether by string concatenation (`'#form-' + 'submit'`), template
 * interpolation of a variable, or a helper function that returns the
 * selector, never appears as one contiguous quoted literal, so none of the
 * three tokens above can see it. `page.getByRole(...)` used with no textual
 * overlap against any of the three tokens (e.g. matched by an accessible name
 * that isn't `Send Message`) is the same gap by the same cause. Closing this
 * fully requires evaluating the test file's AST, not scanning its text.
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
 *   node test/formspree-guard.js <path>   # scan one file or one directory
 *                                          # instead of test/**, for fixture
 *                                          # runs that must not live in the
 *                                          # repo tree
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

// Three submit-candidate tokens, any one of which marks a test body as
// referencing the contact form's submit control (see the docblock above for
// the fixture each one exists to catch):
//   1. `#form-submit` or `#contact-form` as an entire, quote-anchored string
//      literal (backtick, single, or double quote on both ends). Anchoring
//      on the quotes, not just the substring, is what keeps this from
//      matching 'form#contact-form' (the plain existence-check locator in
//      the "contact form exists" test, which never submits and carries no
//      stub).
//   2. The word `formspree`, case-insensitive, inside any quoted string.
//      Catches an alternate CSS selector built off the form's action
//      attribute (`'form[action*="formspree"] button[type="submit"]'`) that
//      never spells out `#form-submit`. This also matches the
//      `page.route('**formspree.io/**', ...)` stub's own URL string, which
//      is harmless: a stub always precedes its own URL literal, so it can
//      never itself trigger a violation, only get (correctly) counted as a
//      checked test.
//   3. The string `Send Message` inside any quoted string. Catches
//      `page.getByRole('button', { name: 'Send Message' })`, which contains
//      neither `#form-submit`/`#contact-form` nor `formspree`.
// Case-insensitive throughout ('i' flag) since none of the three tokens
// needs case sensitivity to stay precise.
const SUBMIT_RE = /[`'"]#(?:form-submit|contact-form)[`'"]|[`'"][^`'"]*formspree[^`'"]*[`'"]|[`'"][^`'"]*Send Message[^`'"]*[`'"]/gi;

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

// Optional CLI argument: a single file or a directory to scan instead of the
// default test/**/*.spec.js sweep. Fixture proof runs for this guard's own
// logic must live outside the repo tree (never a committed .spec.js), so an
// explicit target path is the only way to exercise them.
function resolveTargets(argPath) {
  if (!argPath) return findSpecFiles(testDir);
  const resolved = path.resolve(process.cwd(), argPath);
  const stat = fs.statSync(resolved);
  return stat.isDirectory() ? findSpecFiles(resolved) : [resolved];
}

// Slices a test() block's text down to just its callback body, dropping the
// title-string argument. This matters now that SUBMIT_RE's `formspree` token
// matches any quoted occurrence of the word: several test titles in this repo
// literally say "Formspree" (e.g. `test('form posts to Formspree', ...)`,
// `test('the rejection reason from Formspree is shown, not swallowed', ...)`),
// and without this slice those titles alone would (wrongly) count as a
// submit-candidate reference. `=>` reliably marks the end of the title/params
// and the start of the body for every test() call in this repo's spec files
// (`test('...', async ({ page }) => { ... })`); if a call has no `=>` at all
// (not expected here), the whole block text is used unchanged.
function bodySlice(blockText) {
  const arrowIndex = blockText.indexOf('=>');
  if (arrowIndex === -1) return { offset: 0, text: blockText };
  return { offset: arrowIndex + 2, text: blockText.slice(arrowIndex + 2) };
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

for (const file of resolveTargets(process.argv[2])) {
  const rel = path.relative(root, file).split(path.sep).join('/');
  const src = fs.readFileSync(file, 'utf8');
  // Match against the comment-stripped text (see stripComments above), not
  // the raw source, so a commented-out stub can never satisfy the guard.
  // Same length as src with newlines in the same positions, so indices into
  // it are still valid indices into src for line-number reporting.
  const sanitized = stripComments(src);

  for (const block of extractTestBlocks(sanitized)) {
    // Body only: excludes the test's own title-string argument, so a title
    // like "form posts to Formspree" can never itself satisfy the
    // `formspree` token (see bodySlice above).
    const { offset: bodyOffset, text: bodyText } = bodySlice(block.text);

    SUBMIT_RE.lastIndex = 0;
    const submitMatch = SUBMIT_RE.exec(bodyText);
    if (!submitMatch) continue; // this test's body never references a submit-candidate token

    submitTestCount++;

    ROUTE_STUB_RE.lastIndex = 0;
    const stubMatch = ROUTE_STUB_RE.exec(bodyText);
    const stubComesFirst = stubMatch && stubMatch.index < submitMatch.index;

    if (!stubComesFirst) {
      violations.push(
        `${rel}:${lineOf(src, block.start + bodyOffset + submitMatch.index)}: references #form-submit / ` +
          `#contact-form / formspree / "Send Message" without a preceding page.route('**formspree.io/**', ...) ` +
          `stub in the same test block`
      );
    }
  }
}

if (violations.length) {
  console.error(`formspree-guard: ${violations.length} unguarded contact-form submit(s) found:`);
  violations.forEach((v) => console.error('  ' + v));
  console.error(
    "\nEvery test whose body references '#form-submit', '#contact-form', the word formspree, or " +
      "\"Send Message\" (in a quoted selector, a page.press(...) target, an .evaluate()/.dispatchEvent() " +
      "call, a getByRole() name, or any other trigger built from that text) must register " +
      "page.route('**formspree.io/**', ...) earlier in the SAME test() body. Without it, a real " +
      'submission reaches the live Formspree endpoint and creates a fake lead in the owner\'s inbox ' +
      '(P6-47 Incident 2).'
  );
  process.exit(1);
}

console.log(`formspree-guard: ${submitTestCount} contact-form submit test(s) checked, all route-stubbed. OK`);
