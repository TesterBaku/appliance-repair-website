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
 * Re-run and commit ./pagefind whenever an article is added, removed, or renamed
 * (same discipline as `npm run build:sitemap`).
 */
'use strict';

const { spawnSync } = require('child_process');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');

// Shared chrome to keep OUT of the index (CSS selectors, excluded at crawl time).
const EXCLUDE_SELECTORS = [
  'nav.nav',            // desktop nav + Service Areas dropdown (lists every OC city)
  '#mobile-nav-drawer', // mobile nav drawer (same links)
  'footer.footer',      // site footer (services list + NAP)
  '.sticky-mobile-bar', // sticky Call/Book bar
  '.related-grid',      // "Related Articles" cards (other articles' titles → cross-talk)
];

const args = ['--site', '.', '--glob', 'articles/**/*.html'];
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
  process.exit(1);
}
process.exit(result.status === null ? 1 : result.status);
