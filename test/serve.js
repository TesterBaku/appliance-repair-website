'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const ROOT = path.resolve(__dirname, '..');

// Validate instead of coercing: Number('foo') is NaN, and server.listen(NaN) silently binds a
// random free port, so the suite would then hit the wrong origin. Mirrors playwright.config.js.
const PORT = (() => {
  const raw = process.env.PORT;
  if (raw === undefined || raw === '') return 8788;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > 65535) {
    console.error(`test/serve.js: invalid PORT "${raw}": expected an integer between 1 and 65535 (omit PORT to use the default 8788).`);
    process.exit(1);
  }
  return n;
})();

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.wasm': 'application/wasm',
};

const server = http.createServer((req, res) => {
  let filePath = path.join(ROOT, url.parse(req.url).pathname);
  if (filePath.endsWith('/') || !path.extname(filePath)) filePath += '/index.html';
  if (!fs.existsSync(filePath)) { res.writeHead(404); res.end('Not found'); return; }
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Static server running on http://localhost:${PORT}`);
});
