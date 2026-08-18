/**
 * clean-screenshots.js
 *
 * Reports (or deletes) stray Playwright screenshot PNGs that land in the
 * repo ROOT. These come from `browser_take_screenshot` calls (via the
 * playwright MCP server, e.g. during /visual-review or impeccable sessions)
 * that pass a bare filename with no directory: before .mcp.json declared
 * an --output-dir, that resolved to the server's cwd (the repo root)
 * instead of the intended .playwright-mcp/ scratch dir.
 *
 * Root-level PNGs are protected two ways:
 *   1. A hardcoded allowlist of known legitimate site assets.
 *   2. Any root PNG that is git-tracked (via `git ls-files`), so a future
 *      tracked asset is never flagged as a stray. If the git call fails
 *      (e.g. no git on PATH), falls back to the hardcoded allowlist alone.
 *
 * Usage:
 *   npm run clean:screenshots          (reports strays, exits 1 if any)
 *   npm run clean:screenshots -- --delete  (deletes strays)
 */

const fs   = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root     = path.resolve(__dirname, '..');
const doDelete = process.argv.includes('--delete');

// ── 1. Hardcoded allowlist of known legitimate root PNGs ────────────────────
const allowlist = new Set(['logo.png', 'apple-touch-icon.png', 'icon-192.png']);

// ── 2. Defensively extend with any git-tracked root-level PNG ───────────────
try {
  const tracked = execFileSync('git', ['ls-files', '--', '*.png'], {
    cwd: root,
    encoding: 'utf8',
  });
  for (const line of tracked.split('\n')) {
    const f = line.trim();
    if (f && !f.includes('/') && f.toLowerCase().endsWith('.png')) {
      allowlist.add(f);
    }
  }
} catch (err) {
  console.log('(warning: `git ls-files` failed, using hardcoded allowlist only)');
}

// ── 3. Scan the repo root (non-recursive) for *.png files ───────────────────
const rootPngs = fs.readdirSync(root, { withFileTypes: true })
  .filter(e => e.isFile() && e.name.toLowerCase().endsWith('.png'))
  .map(e => e.name);

const strays = rootPngs.filter(f => !allowlist.has(f));

if (strays.length === 0) {
  console.log('No stray screenshots found in the repo root.');
  process.exit(0);
}

let totalBytes = 0;
for (const f of strays) {
  totalBytes += fs.statSync(path.join(root, f)).size;
}
const totalMb = (totalBytes / (1024 * 1024)).toFixed(1);

console.log(`\nStray screenshots in repo root (${strays.length} file(s), ${totalMb} MB):`);
for (const f of strays) {
  if (doDelete) {
    fs.unlinkSync(path.join(root, f));
    console.log(`  deleted  ${f}`);
  } else {
    console.log(`  stray    ${f}`);
  }
}

if (!doDelete) {
  console.log('\nRun with --delete to remove them: npm run clean:screenshots -- --delete');
  process.exit(1);
}
