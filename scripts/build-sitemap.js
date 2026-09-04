'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const BASE_URL = 'https://fixappliancesfast.com';
// 'progress' and 'tasks' are gitignored local working notes (AGENTS.md, "progress.md Contract"):
// they are never part of the deployed artifact. They must be excluded here because this walker
// reads the filesystem, not `git ls-files`, so an untracked scratch .html sitting on someone's
// disk at build time would otherwise be published as a real URL. That happened: a staging file at
// progress/_norco_faq.html was emitted into sitemap.xml as a live <loc>, which would have returned
// 404 to Google and leaked an internal filename. Caught in review of PR #770.
const EXCLUDE_DIRS = new Set(['node_modules', 'scripts', 'test', 'tasks', 'progress', '.git', '.claude', 'logs', 'pagefind', 'partials']);
const EXCLUDE_FILES = new Set(['404.html']);

// A redirect stub (old WP URL / pretty-URL alias) is a meta-refresh page whose only
// job is to bounce to a canonical page. It is not itself indexable, so it must never
// appear in the sitemap. Detecting the meta-refresh keeps this list-free: any current
// or future stub (root faq/blog/services/testimonials.html, about/, contact/, etc.) is
// auto-excluded without a hardcoded path list to maintain.
function isRedirectStub(absPath) {
  const head = fs.readFileSync(absPath, 'utf8').slice(0, 1500);
  return /http-equiv=["']refresh["']/i.test(head);
}

// A noindexed page (offline by owner decision, kept live and reversible) must never
// appear in the sitemap either. Detecting the robots meta keeps this list-free, the
// same way isRedirectStub() is: any current or future noindexed page is auto-excluded
// without a hardcoded path list to maintain.
function isNoIndex(absPath) {
  const head = fs.readFileSync(absPath, 'utf8').slice(0, 1500);
  const match = head.match(/<meta\s+name=["']robots["']\s+content=["']([^"']*)["']/i);
  return !!match && /noindex/i.test(match[1]);
}

function priority(urlPath) {
  if (urlPath === '/') return '1.0';
  if (urlPath.startsWith('/pages/services')) return '0.9';
  if (urlPath.startsWith('/pages/blog')) return '0.8';
  if (urlPath.startsWith('/pages/')) return '0.7';
  if (urlPath.startsWith('/articles/')) return '0.6';
  return '0.5';
}

function changefreq(urlPath) {
  if (urlPath === '/' || urlPath.startsWith('/pages/blog')) return 'weekly';
  return 'monthly';
}

function gitLastmod(absPath) {
  try {
    const iso = execSync(
      `git log --follow -1 --format=%aI -- "${absPath}"`,
      { cwd: ROOT, encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
    ).trim();
    return iso ? iso.slice(0, 10) : null;
  } catch (_) {
    return null;
  }
}

// Format a Date as ISO 8601 with a local UTC offset, matching the shape `git log
// --format=%aI` produces (e.g. `2026-08-24T09:41:03-07:00`). Used only so the fs-mtime
// fallback below carries the same precision/shape as the git path before both are
// truncated to a bare YYYY-MM-DD for the sitemap.
function toIsoWithOffset(date) {
  const pad = n => String(n).padStart(2, '0');
  const offsetMin = -date.getTimezoneOffset();
  const sign = offsetMin >= 0 ? '+' : '-';
  const offH = pad(Math.floor(Math.abs(offsetMin) / 60));
  const offM = pad(Math.abs(offsetMin) % 60);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}${sign}${offH}:${offM}`;
}

// A file that is dirty or untracked in the working tree has no commit yet recording its
// current content, so `git log` returns the *previous* commit's date (or nothing, for a
// new file) — stale by construction whenever a content change and the sitemap rebuild
// land in the same commit, which is the workflow this repo uses on every PR (P6-51).
// `git status --porcelain` catches both cases (modified-and-unstaged/staged, and
// untracked) in one call.
function isDirtyOrUntracked(absPath) {
  try {
    const out = execSync(
      `git status --porcelain -- "${absPath}"`,
      { cwd: ROOT, encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
    ).trim();
    return out.length > 0;
  } catch (_) {
    return false;
  }
}

// lastmod() picks the source of truth per file: fs mtime for a file the working tree has
// touched since its last commit (git has nothing current to report), git log otherwise.
// On a clean tree this always takes the git branch, so a clean-tree rebuild is unaffected
// byte-for-byte (P6-51 option 2, backlog.md ~line 3046).
function lastmod(absPath) {
  if (isDirtyOrUntracked(absPath)) {
    return toIsoWithOffset(fs.statSync(absPath).mtime).slice(0, 10);
  }
  return gitLastmod(absPath);
}

function collectFiles(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!EXCLUDE_DIRS.has(entry.name)) collectFiles(path.join(dir, entry.name), files);
    } else if (entry.name.endsWith('.html') && !EXCLUDE_FILES.has(entry.name)) {
      const abs = path.join(dir, entry.name);
      if (!isRedirectStub(abs) && !isNoIndex(abs)) files.push(abs);
    }
  }
  return files;
}

const today = new Date().toISOString().slice(0, 10);
const files = collectFiles(ROOT);

const urls = files.map(abs => {
  const rel = path.relative(ROOT, abs).replace(/\\/g, '/');
  // Strip index.html from any directory-index path (root or subdirectory)
  const urlPath = rel.endsWith('/index.html')
    ? '/' + rel.slice(0, -'index.html'.length)
    : rel === 'index.html' ? '/' : '/' + rel;
  const loc = BASE_URL + urlPath;
  const urlLastmod = lastmod(abs) || today;
  return { loc, lastmod: urlLastmod, urlPath };
});

urls.sort((a, b) => {
  const rank = u => u === '/' ? 0 : u.startsWith('/pages/') ? 1 : 2;
  return rank(a.urlPath) - rank(b.urlPath) || a.loc.localeCompare(b.loc);
});

const entries = urls.map(({ loc, lastmod, urlPath }) => `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq(urlPath)}</changefreq>
    <priority>${priority(urlPath)}</priority>
  </url>`).join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`;

fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml, 'utf8');
console.log(`sitemap.xml written — ${urls.length} URLs`);
