'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const BASE_URL = 'https://fixappliancesfast.com';
const EXCLUDE_DIRS = new Set(['node_modules', 'scripts', 'test', 'tasks', '.git', '.claude', 'logs']);

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

function collectFiles(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!EXCLUDE_DIRS.has(entry.name)) collectFiles(path.join(dir, entry.name), files);
    } else if (entry.name.endsWith('.html')) {
      files.push(path.join(dir, entry.name));
    }
  }
  return files;
}

const today = new Date().toISOString().slice(0, 10);
const files = collectFiles(ROOT);

const urls = files.map(abs => {
  const rel = path.relative(ROOT, abs).replace(/\\/g, '/');
  const urlPath = rel === 'index.html' ? '/' : '/' + rel;
  const loc = BASE_URL + urlPath;
  const lastmod = gitLastmod(abs) || today;
  return { loc, lastmod, urlPath };
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
