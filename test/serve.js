'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const ROOT = path.resolve(__dirname, '..');

// Validate instead of coercing: Number('foo') is NaN, and server.listen(NaN) silently binds a
// random free port, so the suite would then hit the wrong origin. Mirrors playwright.config.js.
// `--port <n>` on the command line wins over the PORT env var, so `npm start` can pin its own
// port from package.json without a shell-specific `PORT=... node` prefix.
const PORT = (() => {
  const flag = process.argv.indexOf('--port');
  const raw = flag !== -1 ? process.argv[flag + 1] : process.env.PORT;
  if (flag === -1 && (raw === undefined || raw === '')) return 8788;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > 65535) {
    console.error(`test/serve.js: invalid port "${raw}": expected an integer between 1 and 65535 (omit PORT and --port to use the default 8788).`);
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

// Every page carries the real Google tag, so a page served from here used to report page
// views and clicks to the production GA4 property under the hostname "localhost" (62 sessions
// in October 2026, from test runs and local previews). Google's documented opt-out is a
// window flag that must exist before the first gtag() call, so it is inserted straight after
// <head>, ahead of the tag. The tag itself is left in place: it still fills window.dataLayer,
// which the functional suite reads, but gtag.js sends nothing. Only the served bytes change;
// the files on disk, and so the deployed site, are untouched. The insert is done on the raw
// buffer so the file's encoding is never re-interpreted.
const GA_OFF = Buffer.from("<script>window['ga-disable-G-TSFHKJ6ZEK']=true;</script>");
function withAnalyticsOff(html) {
  let open = html.indexOf('<head>');
  if (open === -1) open = html.indexOf('<head ');
  const close = open === -1 ? -1 : html.indexOf('>', open);
  if (close === -1) return html;
  return Buffer.concat([html.subarray(0, close + 1), GA_OFF, html.subarray(close + 1)]);
}

const server = http.createServer((req, res) => {
  let filePath = path.join(ROOT, url.parse(req.url).pathname);
  if (filePath.endsWith('/') || !path.extname(filePath)) filePath += '/index.html';
  if (!fs.existsSync(filePath)) { res.writeHead(404); res.end('Not found'); return; }
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  if (ext === '.html') { res.end(withAnalyticsOff(fs.readFileSync(filePath))); return; }
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Static server running on http://localhost:${PORT}`);
});
