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
 * pagefind has exited 0. If pagefind fails, ./pagefind is left untouched; the only
 * unprotected moment is the swap itself, after a successful build, and `git checkout pagefind`
 * recovers from that.
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

// pagefind succeeded — only now is it safe to replace the committed ./pagefind. Remove
// the old (possibly stale-chunk-laden) output and move the fresh build into place.
fs.rmSync(outputDir, { recursive: true, force: true });
try {
  fs.renameSync(tmpOutputDir, outputDir);
} catch (err) {
  // rename() can fail across filesystem/device boundaries (e.g. os.tmpdir() on a
  // different drive than the repo on Windows) — fall back to copy + remove.
  if (err.code === 'EXDEV') {
    fs.cpSync(tmpOutputDir, outputDir, { recursive: true });
    fs.rmSync(tmpOutputDir, { recursive: true, force: true });
  } else {
    throw err;
  }
}

process.exit(0);
