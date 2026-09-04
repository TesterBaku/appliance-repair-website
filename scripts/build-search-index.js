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
 * very unlikely to fail on its own), then the fresh temp build is renamed into ./pagefind,
 * and only once THAT succeeds is the backup removed. A transient Windows lock on the final
 * rename (EPERM/EBUSY — e.g. an AV scan or an editor/indexer holding a file open) is retried
 * a few times with a short backoff before giving up; a cross-device rename (EXDEV — e.g.
 * os.tmpdir() on a different drive than the repo) falls back to copy+remove instead of
 * retrying. If every attempt still fails, the backup is renamed straight back to ./pagefind
 * so the committed index is left intact, and the script exits non-zero with a clear message
 * (residual from the #769 review, backlog.md P6-38 "Residual from the #769 review, not
 * blocking"). The temp directory is removed on every exit path.
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

// Move `src` into `dest` (which must not exist). Retries a locked-file failure
// (EPERM/EBUSY, typically an AV scan or an indexer holding a handle open on Windows)
// with a short backoff; falls back to copy+remove on a cross-device rename (EXDEV).
// Any other error propagates immediately.
function moveDirWithRetry(src, dest, { retries = 5, delayMs = 300 } = {}) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      fs.renameSync(src, dest);
      return;
    } catch (err) {
      if (err.code === 'EXDEV') {
        fs.cpSync(src, dest, { recursive: true });
        fs.rmSync(src, { recursive: true, force: true });
        return;
      }
      const retryable = err.code === 'EPERM' || err.code === 'EBUSY';
      if (!retryable || attempt === retries) throw err;
      console.warn(`build-search-index: rename attempt ${attempt}/${retries} failed (${err.code}), retrying...`);
      sleepSync(delayMs);
    }
  }
}

// pagefind succeeded — only now is it safe to replace the committed ./pagefind.
// Rename the current output aside first (same filesystem as ./pagefind, so this step
// itself is very unlikely to fail) rather than deleting it, so a failure on the next
// step still has something to restore from.
const backupDir = `${outputDir}.pf-backup-${process.pid}-${Date.now()}`;
const hadExisting = fs.existsSync(outputDir);
if (hadExisting) fs.renameSync(outputDir, backupDir);

try {
  moveDirWithRetry(tmpOutputDir, outputDir);
} catch (err) {
  // The fresh build could not be swapped in after every retry/fallback. Restore the
  // backup so the committed index is left intact, then fail loudly rather than leaving
  // ./pagefind missing or half-written.
  console.error(`build-search-index: failed to move the built index into place (${err.code || err.message}).`);
  if (hadExisting) {
    try {
      fs.renameSync(backupDir, outputDir);
      console.error('build-search-index: restored the previous ./pagefind from backup — committed index is intact.');
    } catch (restoreErr) {
      console.error(
        `build-search-index: CRITICAL — could not restore ./pagefind from backup either (${restoreErr.message}). ` +
        `./pagefind may be missing. Recover with: git checkout pagefind — the backup, if still present, is at ${backupDir}`
      );
    }
  }
  fs.rmSync(tmpOutputDir, { recursive: true, force: true });
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
