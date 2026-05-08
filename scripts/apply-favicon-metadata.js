const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const skipDirs = new Set(['node_modules', '.git', '.claude', '.agents', '.audits', '.playwright-mcp', 'test-results']);

function collectHtml(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && skipDirs.has(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectHtml(fullPath, files);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      files.push(fullPath);
    }
  }
  return files;
}

function hasBom(buffer) {
  return buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf;
}

function iconPrefix(filePath) {
  const relative = path.relative(path.dirname(filePath), root).replace(/\\/g, '/');
  return relative ? `${relative}/` : '';
}

function iconBlock(filePath) {
  const prefix = iconPrefix(filePath);
  return [
    `  <link rel="icon" href="${prefix}favicon.ico" sizes="any" />`,
    `  <link rel="apple-touch-icon" href="${prefix}apple-touch-icon.png" />`,
    `  <link rel="icon" type="image/png" sizes="192x192" href="${prefix}icon-192.png" />`,
  ].join('\r\n');
}

function applyMetadata(filePath) {
  const originalBuffer = fs.readFileSync(filePath);
  const preserveBom = hasBom(originalBuffer);
  let html = originalBuffer.toString('utf8').replace(/^\ufeff/, '');
  const block = iconBlock(filePath);

  const existingBlock = /  <link rel="icon" href="[^"]*favicon\.ico" sizes="any" \/>\r?\n  <link rel="apple-touch-icon" href="[^"]*apple-touch-icon\.png" \/>\r?\n  <link rel="icon" type="image\/png" sizes="192x192" href="[^"]*icon-192\.png" \/>/;

  if (existingBlock.test(html)) {
    html = html.replace(existingBlock, block);
  } else if (html.includes('<link rel="canonical"')) {
    html = html.replace(/(<link rel="canonical" href="[^"]+" \/>)/, `$1\r\n${block}`);
  } else {
    html = html.replace(/(<meta name="viewport"[^>]*>)/, `$1\r\n${block}`);
  }

  const output = Buffer.from(html, 'utf8');
  fs.writeFileSync(filePath, preserveBom ? Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), output]) : output);
}

const files = collectHtml(root);
for (const file of files) {
  applyMetadata(file);
}

console.log(`Applied favicon metadata to ${files.length} HTML files.`);
