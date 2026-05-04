/**
 * clean-images.js
 *
 * 1. Wipes images/temp/ (all trial/audit downloads)
 * 2. Reports any orphaned files in images/ that no HTML references
 *    (pass --delete to remove them automatically)
 *
 * Usage:
 *   npm run clean:images          — clears temp, reports orphans
 *   npm run clean:images -- --delete  — clears temp, deletes orphans
 */

const fs   = require('fs');
const path = require('path');

const root      = path.resolve(__dirname, '..');
const imagesDir = path.join(root, 'images');
const tempDir   = path.join(imagesDir, 'temp');
const doDelete  = process.argv.includes('--delete');

// ── 1. Clear images/temp/ ────────────────────────────────────────────────────
let tempCount = 0;
if (fs.existsSync(tempDir)) {
  for (const f of fs.readdirSync(tempDir)) {
    if (f === '.gitkeep') continue;
    fs.unlinkSync(path.join(tempDir, f));
    tempCount++;
  }
}
console.log(`Cleared images/temp/ — ${tempCount} file(s) removed.`);

// ── 2. Find orphaned files in images/ ────────────────────────────────────────
const htmlFiles = [];
function collect(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory() && !e.name.startsWith('.')) { collect(full); continue; }
    if (e.isFile() && e.name.endsWith('.html')) htmlFiles.push(full);
  }
}
collect(root);
const allHtml = htmlFiles.map(f => fs.readFileSync(f, 'utf8')).join('\n');

const imageFiles = fs.readdirSync(imagesDir).filter(f => {
  const full = path.join(imagesDir, f);
  return fs.statSync(full).isFile();
});

const orphaned = imageFiles.filter(f => !allHtml.includes('images/' + f));

if (orphaned.length === 0) {
  console.log('No orphaned images found.');
} else {
  console.log(`\nOrphaned images (${orphaned.length}):`);
  for (const f of orphaned) {
    if (doDelete) {
      fs.unlinkSync(path.join(imagesDir, f));
      console.log(`  deleted  ${f}`);
    } else {
      console.log(`  orphan   ${f}`);
    }
  }
  if (!doDelete) {
    console.log('\nRun with --delete to remove them: npm run clean:images -- --delete');
    process.exit(1);
  }
}
