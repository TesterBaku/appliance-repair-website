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
  const fromFile = path.relative(root, filePath);
  const fromDir = path.dirname(filePath);

  // Check internal HTML hrefs
  for (const [, href] of content.matchAll(/href="([^"#][^"]*\.html[^"]*)"/g)) {
    if (href.startsWith('http://') || href.startsWith('https://')) continue;
    const target = path.resolve(fromDir, href);
    if (!fs.existsSync(target)) {
      issues.push(`${fromFile} → broken link: ${href}`);
    }
  }

  // Check local image src attributes
  for (const [, src] of content.matchAll(/\bsrc="([^"]+)"/g)) {
    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) continue;
    const target = path.resolve(fromDir, src);
    if (!fs.existsSync(target)) {
      issues.push(`${fromFile} → missing image src: ${src}`);
    }
  }

  // Check local background-image url() in inline styles
  for (const [, url] of content.matchAll(/background-image:\s*url\(['"]?([^'")\s]+)['"]?\)/g)) {
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) continue;
    const target = path.resolve(fromDir, url);
    if (!fs.existsSync(target)) {
      issues.push(`${fromFile} → missing background-image: ${url}`);
    }
  }
}

if (issues.length) {
  console.error('Broken references found:');
  issues.forEach(i => console.error(' ', i));
  process.exit(1);
} else {
  console.log(`Checked ${htmlFiles.length} pages - no broken links or missing local images.`);
}
