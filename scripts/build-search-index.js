#!/usr/bin/env node
/*
 * build-search-index.js — generate the Pagefind full-text search index for the blog.
 *
 * Pagefind crawls the BUILT article HTML and emits a static search bundle under
 * ./pagefind (JS API + WASM + index fragments). The deployed artifact stays pure
 * static HTML: this is run locally and the ./pagefind output is committed, the same
 * "build locally, commit output" model as sitemap.xml / the partial injectors.
 *
 *   npm run build:search
 *
 * Scope:
 *   --glob "articles/**\/*.html"  → only blog articles are indexed (the blog search
 *                                    targets articles, and a small index keeps results
 *                                    relevant).
 *   --exclude-selectors ...       → strip shared chrome from the index at crawl time so
 *                                    full-text relevance reflects article CONTENT, not the
 *                                    ~28-city nav dropdown / footer / sticky bar / related
 *                                    cards that repeat on every page. Done here (not via
 *                                    data-pagefind-ignore in the HTML) so no page or partial
 *                                    is touched and the inject-partials chrome regexes stay
 *                                    intact.
 *
 * Cleans before it writes: Pagefind content-hashes every fragment/index chunk it emits
 * and never deletes a superseded chunk from a prior run, so ./pagefind only grows across
 * runs (P6-38 — 222 .pf_fragment files for 75 live articles, 30 pagefind.en_*.pf_meta
 * files where there should be one). Deleting ./pagefind up front and then running pagefind
 * in place would leave the committed index destroyed if pagefind then failed, so instead
 * this builds into a fresh temp directory and only swaps it in for ./pagefind after
 * pagefind has exited 0. If pagefind fails, ./pagefind is left untouched.
 *
 * The swap itself is a rename-aside, not a delete-then-rename: the current ./pagefind is
 * first renamed to a sibling backup directory (same filesystem, so that rename is fast and
 * very unlikely to fail on its own — but it IS still wrapped in the same retry/cleanup
 * discipline as the final swap below, not a bare unprotected call, because "very unlikely"
 * is not "impossible" and an uncaught exception here used to crash the process with the temp
 * build directory leaked), then the fresh temp build is renamed into ./pagefind, and only
 * once THAT succeeds is the backup removed. A transient Windows lock (EPERM/EBUSY — e.g. an
 * AV scan or an editor/indexer holding a file open) on either rename is retried a few times
 * with a short backoff before giving up.
 *
 * A cross-device rename (EXDEV — e.g. os.tmpdir() on a different drive than the repo) does
 * NOT fall back to copying straight into the destination: copying directly into ./pagefind
 * (or into the backup path) would let a `cpSync` that dies partway (disk full, a lock taken
 * mid-copy) leave the destination containing a partial, corrupted directory — and a
 * corrupted ./pagefind then makes the restore-from-backup step itself fail with
 * EEXIST/ENOTEMPTY, because renameSync refuses to land on a non-empty target. Instead, EXDEV
 * copies into a fresh staging directory that is a SIBLING of the real destination (so same
 * volume, so same-filesystem), and only once that copy has fully succeeded is the staging
 * directory renamed into the destination — an atomic, same-filesystem rename, so the
 * destination is never observed in a partial state: either the rename lands the complete
 * copy, or it never touches the destination at all. Any failure along the way removes the
 * partial staging directory and rethrows, letting the caller's restore-from-backup logic run
 * against a destination that was never written to.
 *
 * If the final swap fails after every retry/fallback, the backup is renamed straight back to
 * ./pagefind so the committed index is left intact — and the freshly built ./pagefind-build-*
 * temp directory is deliberately NOT deleted until that restore has actually succeeded: it is
 * the only remaining good copy of the new index while the restore is in flight, and deleting
 * it first (the pre-review version of this script did exactly that, unconditionally) would
 * turn a recoverable failure into total data loss if the restore then also failed. The temp
 * directory is still removed on every path where doing so is provably safe: after a
 * successful swap, after a successful restore, and when the very first rename-aside step
 * fails (./pagefind was never touched in that case, so nothing needs restoring).
 * (Residual from the #769 review, backlog.md P6-38 "Residual from the #769 review, not
 * blocking"; the copy-into-staging and protected-aside-move fixes above address the two
 * BLOCKER findings from the PR #802 review of the first pass at this fix.)
 *
 * Re-run and commit ./pagefind whenever an article is added, removed, or renamed
 * (same discipline as `npm run build:sitemap`).
 */
'use strict';

const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const outputDir = path.join(repoRoot, 'pagefind');

// Shared chrome to keep OUT of the index (CSS selectors, excluded at crawl time).
const EXCLUDE_SELECTORS = [
  'nav.nav',            // desktop nav + Service Areas dropdown (lists every OC city)
  '#mobile-nav-drawer', // mobile nav drawer (same links)
  'footer.footer',      // site footer (services list + NAP)
  '.sticky-mobile-bar', // sticky Call/Book bar
  '.related-grid',      // "Related Articles" cards (other articles' titles → cross-talk)
];

// Build into a fresh temp directory (never ./pagefind directly) so a failed run can
// never leave the committed index half-deleted or half-written.
const tmpOutputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pagefind-build-'));

const args = ['--site', '.', '--glob', 'articles/**/*.html', '--output-path', tmpOutputDir];
for (const sel of EXCLUDE_SELECTORS) args.push('--exclude-selectors', sel);

// Resolve the pagefind binary from node_modules/.bin (.cmd shim on Windows).
const bin = path.join(
  repoRoot,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'pagefind.cmd' : 'pagefind'
);

const result = spawnSync(bin, args, {
  cwd: repoRoot,
  stdio: 'inherit',
  shell: process.platform === 'win32', // .cmd needs a shell on Windows
});

if (result.error) {
  console.error('build-search-index: failed to run pagefind:', result.error.message);
  fs.rmSync(tmpOutputDir, { recursive: true, force: true });
  process.exit(1);
}

const exitCode = result.status === null ? 1 : result.status;
if (exitCode !== 0) {
  console.error(`build-search-index: pagefind exited with status ${exitCode}; leaving existing ./pagefind untouched.`);
  fs.rmSync(tmpOutputDir, { recursive: true, force: true });
  process.exit(exitCode);
}

// Synchronous sleep (no extra dependency): Atomics.wait blocks the current thread for
// `ms` milliseconds on a SharedArrayBuffer nobody else touches.
function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

// EXDEV fallback: copy `src` into a fresh staging directory that is a SIBLING of `dest`
// (same parent, so guaranteed same filesystem/volume as dest), then rename that staging
// directory into `dest`. `dest` itself is never written to except by that final rename,
// so `dest` is only ever observed either fully absent/untouched or fully replaced — never
// partially written. A `cpSync` failure partway through leaves only the staging directory
// corrupted, which is removed before rethrowing; `dest` is unaffected either way.
function moveViaCopy(src, dest, { retries, delayMs }) {
  const stagingDir = path.join(path.dirname(dest), `${path.basename(dest)}.pf-swap-tmp-${process.pid}-${Date.now()}`);
  try {
    fs.cpSync(src, stagingDir, { recursive: true });
  } catch (err) {
    fs.rmSync(stagingDir, { recursive: true, force: true });
    throw err;
  }
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      fs.renameSync(stagingDir, dest);
      fs.rmSync(src, { recursive: true, force: true });
      return;
    } catch (err) {
      const retryable = err.code === 'EPERM' || err.code === 'EBUSY';
      if (!retryable || attempt === retries) {
        fs.rmSync(stagingDir, { recursive: true, force: true });
        throw err;
      }
      console.warn(`build-search-index: staging rename attempt ${attempt}/${retries} failed (${err.code}), retrying...`);
      sleepSync(delayMs);
    }
  }
}

// Move `src` into `dest` (which must not exist yet). Retries a locked-file failure
// (EPERM/EBUSY, typically an AV scan or an indexer holding a handle open on Windows) with
// a short backoff; falls back to moveViaCopy() (never a direct copy into `dest`) on a
// cross-device rename (EXDEV). Any other error propagates immediately. Used for BOTH the
// rename-aside step and the final swap, so both get identical retry/fallback behavior.
function moveDirWithRetry(src, dest, { retries = 5, delayMs = 300 } = {}) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      fs.renameSync(src, dest);
      return;
    } catch (err) {
      if (err.code === 'EXDEV') {
        return moveViaCopy(src, dest, { retries, delayMs });
      }
      const retryable = err.code === 'EPERM' || err.code === 'EBUSY';
      if (!retryable || attempt === retries) throw err;
      console.warn(`build-search-index: rename attempt ${attempt}/${retries} failed (${err.code}), retrying...`);
      sleepSync(delayMs);
    }
  }
}

// pagefind succeeded — only now is it safe to replace the committed ./pagefind.
// Rename the current output aside first (rather than deleting it) so a failure on the
// final swap still has something to restore from. This step is wrapped in the same
// retry/fallback/cleanup discipline as the final swap below — it is "very unlikely to
// fail" (same filesystem, no cross-device concern) but not impossible, and an unprotected
// call here used to crash the process on a transient lock with the temp build leaked.
const backupDir = `${outputDir}.pf-backup-${process.pid}-${Date.now()}`;
const hadExisting = fs.existsSync(outputDir);
if (hadExisting) {
  try {
    moveDirWithRetry(outputDir, backupDir);
  } catch (err) {
    // ./pagefind itself was never touched by a failed rename-aside (moveDirWithRetry only
    // ever writes to `dest`, i.e. backupDir, and only via an atomic same-filesystem
    // rename), so there is nothing to restore — the committed index is exactly as it was.
    // Safe to clean up the temp build and fail loudly.
    console.error(`build-search-index: failed to rename the current ./pagefind aside for backup (${err.code || err.message}); leaving ./pagefind untouched.`);
    fs.rmSync(tmpOutputDir, { recursive: true, force: true });
    process.exit(1);
  }
}

try {
  moveDirWithRetry(tmpOutputDir, outputDir);
} catch (err) {
  // The fresh build could not be swapped in after every retry/fallback. moveDirWithRetry
  // (both its plain-rename and moveViaCopy paths) never partially writes `outputDir`, so
  // it is still either missing (if hadExisting was false) or exactly the pre-swap state —
  // never half-written. Restore the backup so the committed index is intact, then fail
  // loudly. Deliberately do NOT delete tmpOutputDir until the restore has actually
  // succeeded: while the restore is outstanding, tmpOutputDir is the only remaining good
  // copy of the freshly built index, and deleting it first would turn a recoverable
  // failure into data loss if the restore then also failed.
  console.error(`build-search-index: failed to move the built index into place (${err.code || err.message}).`);
  let safeToDeleteTmp = !hadExisting; // nothing existed before, so nothing to restore
  if (hadExisting) {
    try {
      moveDirWithRetry(backupDir, outputDir);
      console.error('build-search-index: restored the previous ./pagefind from backup — committed index is intact.');
      safeToDeleteTmp = true;
    } catch (restoreErr) {
      console.error(
        `build-search-index: CRITICAL — could not restore ./pagefind from backup either (${restoreErr.message}). ` +
        `./pagefind may be missing or incomplete. The pre-swap backup is preserved at ${backupDir} and the freshly ` +
        `built (unswapped) index is preserved at ${tmpOutputDir} — neither was deleted. Recover manually, e.g. ` +
        `\`git checkout pagefind\` (discards the backup and the new build) or by moving ${backupDir} back to ${outputDir} yourself.`
      );
    }
  }
  if (safeToDeleteTmp) {
    fs.rmSync(tmpOutputDir, { recursive: true, force: true });
  } else {
    console.error(`build-search-index: leaving ${tmpOutputDir} in place — it holds the only good copy of the newly built index.`);
  }
  process.exit(1);
}

// Swap succeeded — the backup of the old output is no longer needed. Best-effort
// cleanup: a failure here does not put the committed index at risk (the fresh build is
// already live at ./pagefind), so it is logged, not fatal.
if (hadExisting) {
  try {
    fs.rmSync(backupDir, { recursive: true, force: true });
  } catch (err) {
    console.warn(`build-search-index: swap succeeded but could not remove backup ${backupDir}: ${err.message}`);
  }
}

process.exit(0);
