const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const htmlFiles = [];

function collectHtmlFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectHtmlFiles(fullPath);
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.html')) {
      htmlFiles.push(fullPath);
    }
  }
}

collectHtmlFiles(root);
const issues = [];

for (const filePath of htmlFiles) {
  const content = fs.readFileSync(filePath, 'utf8');
  const hrefMatches = [...content.matchAll(/href="([^"#][^"]*\.html[^"]*)"/g)];
  const fromFile = path.relative(root, filePath);
  const fromDir = path.dirname(filePath);

  for (const [, href] of hrefMatches) {
    if (href.startsWith('http://') || href.startsWith('https://')) continue;
    const target = path.resolve(fromDir, href);
    if (!fs.existsSync(target)) {
      issues.push(`${fromFile} → broken link: ${href}`);
    }
  }
}

if (issues.length) {
  console.error('Broken links found:');
  issues.forEach(i => console.error(' ', i));
  process.exit(1);
} else {
  console.log(`Checked ${htmlFiles.length} pages - no broken links.`);
}
