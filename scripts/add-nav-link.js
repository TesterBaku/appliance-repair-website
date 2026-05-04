/**
 * add-nav-link.js — one-time script
 * Inserts "Service Areas" nav link after the "Services" link in every HTML file.
 * Handles both inline nav (articles) and multiline nav (pages).
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
  if (filePath.endsWith('service-areas.html')) continue;

  const relDir = path.relative(root, path.dirname(filePath)).replace(/\\/g, '/');
  const saHref = relDir === ''        ? 'pages/service-areas.html'
               : relDir === 'articles' ? '../pages/service-areas.html'
               :                         'service-areas.html'; // pages/

  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('service-areas.html')) continue;

  // Replace every occurrence of the Services nav anchor with itself + Service Areas link.
  // This covers both nav-links and nav-drawer in one pass.
  // The Services link may or may not have class="active".
  const before = content;
  content = content.replace(
    /(<a href="[^"]*services\.html"(?:\s+class="[^"]*")?>\s*Services\s*<\/a>)/g,
    `$1<a href="${saHref}">Service Areas</a>`
  );

  if (content === before) continue; // nothing matched

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`  upd  ${path.relative(root, filePath)}`);
  updated++;
}
console.log(`\nUpdated ${updated} files.`);
