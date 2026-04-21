const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const htmlFiles = fs.readdirSync(root).filter(f => f.endsWith('.html'));
const issues = [];

for (const file of htmlFiles) {
  const content = fs.readFileSync(path.join(root, file), 'utf8');
  const hrefMatches = [...content.matchAll(/href="([^"#][^"]*\.html[^"]*)"/g)];

  for (const [, href] of hrefMatches) {
    if (href.startsWith('http://') || href.startsWith('https://')) continue;
    const target = path.resolve(root, href);
    if (!fs.existsSync(target)) {
      issues.push(`${file} → broken link: ${href}`);
    }
  }
}

if (issues.length) {
  console.error('Broken links found:');
  issues.forEach(i => console.error(' ', i));
  process.exit(1);
} else {
  console.log(`Checked ${htmlFiles.length} pages — no broken links.`);
}
