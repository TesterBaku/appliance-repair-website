/**
 * add-nav-link.js — one-time script
 * Inserts "Service Areas" nav link into every HTML file that has the standard nav.
 * Run: node scripts/add-nav-link.js
 */
const fs   = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const htmlFiles = [];
function collect(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory() && !e.name.startsWith('.')) { collect(full); continue; }
    if (e.isFile() && e.name.endsWith('.html')) htmlFiles.push(full);
  }
}
collect(root);

let updated = 0;
for (const filePath of htmlFiles) {
  // Skip the service-areas page itself (already has the link)
  if (filePath.endsWith('service-areas.html')) continue;

  const depth = path.relative(root, filePath).split(path.sep).length - 1;
  // root = index.html, depth 1 = pages/, depth 1 = articles/ (both are depth 1)
  const saHref = depth === 0 ? 'pages/service-areas.html' : 'service-areas.html';
  // articles are in articles/ which is same depth as pages/ but need ../pages/
  const relDir = path.relative(root, path.dirname(filePath)).replace(/\\/g, '/');
  const saHrefFinal = relDir === 'articles' ? '../pages/service-areas.html' : saHref;

  let content = fs.readFileSync(filePath, 'utf8');

  // Skip if already has service-areas link
  if (content.includes('service-areas.html')) continue;

  // Insert after the Services link in .nav-links
  // Pattern varies by file: href="services.html" or href="pages/services.html"
  const navLinkPattern = /(<a href="[^"]*services\.html"[^>]*>Services<\/a>)/i;
  if (!navLinkPattern.test(content)) continue;

  content = content.replace(navLinkPattern, `$1\n          <a href="${saHrefFinal}">Service Areas</a>`);

  // Same for nav-drawer
  const drawerPattern = /(<a href="[^"]*services\.html"[^>]*>Services<\/a>)/gi;
  let count = 0;
  content = content.replace(drawerPattern, (match) => {
    count++;
    // Replace all instances (nav-links + drawer)
    return `${match}\n      <a href="${saHrefFinal}">Service Areas</a>`;
  });
  // The first replacement already handled nav-links; for drawer the spacing differs
  // Better: do two targeted replacements
  // Reset and redo more carefully
  content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('service-areas.html')) continue;

  // nav-links block (uses 10-space indent)
  content = content.replace(
    /(<a href="[^"]*services\.html"[^>]*>Services<\/a>\n)(          )/,
    `$1          <a href="${saHrefFinal}">Service Areas</a>\n$2`
  );
  // nav-drawer block (uses 6-space indent)
  content = content.replace(
    /(<a href="[^"]*services\.html"[^>]*>Services<\/a>\n)(      )/,
    `$1      <a href="${saHrefFinal}">Service Areas</a>\n$2`
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`  upd  ${path.relative(root, filePath)}`);
  updated++;
}
console.log(`\nUpdated ${updated} files.`);
