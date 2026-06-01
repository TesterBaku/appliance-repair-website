#!/usr/bin/env node
/**
 * Wraps local <img> tags with <picture> elements to enable WebP delivery.
 *
 * For every <img src="[../]images/file.jpg"> that is NOT already inside a
 * <picture> element, this script:
 *   1. Inserts a <source type="image/webp"> pointing at the matching .webp file.
 *   2. Adds width/height attributes to the <img> (if not already present) based
 *      on known dimensions from the conversion run.
 *   3. Writes the updated file back.
 *
 * Skips:
 *   - Unsplash / external URLs
 *   - Images already inside <picture>
 *   - CSS background-image references (separate concern)
 *   - OG/Twitter meta tags (social crawlers need JPG/PNG)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Natural dimensions of each local image (width × height, from conversion run)
const DIMS = {
  'appliance-repair-generic.jpg': [1200, 801],
  'dishwasher-open.jpg':          [1200, 1800],
  'dorm-appliances.jpg':          [1200, 900],
  'freezer-chest.jpg':            [800,  1000],
  'freezer.jpg':                  [679,  910],
  'fridge-mini.jpg':              [1200, 1800],
  'fridge-sidebyside.jpg':        [1200, 800],
  'fridge-vintage.jpg':           [1200, 1800],
  'hero-homepage.jpg':            [1600, 1397],
  'kitchen-modern-fridge.jpg':    [1200, 800],
  'kitchen-stove.jpg':            [1200, 800],
  'kitchen-with-washer.jpg':      [1200, 800],
  'microwave.jpg':                [1200, 800],
  'oven-stainless-range.jpg':     [1200, 1800],
  'repair-tech.jpg':              [1200, 800],
  'testimonial-ashley.jpg':       [200,  300],
  'testimonial-megan.jpg':        [200,  250],
  'testimonial-robert.jpg':       [200,  300],
  'washer-dryer-pair.jpg':        [1200, 1797],
  'washer-frontload.jpg':         [1200, 800],
  'wine-cooler-glasses.jpg':      [1200, 800],
};

// Matches <img> tags referencing a local images/*.jpg file
// Capture group 1: everything before src="..."
// Capture group 2: the path prefix (e.g. "../" or "")
// Capture group 3: the bare filename (e.g. "washer-frontload.jpg")
// Capture group 4: everything after the src attribute, through the closing >
const IMG_RE = /(<img\b)([^>]*?\bsrc=")((?:\.\.\/)*images\/)([^"]+\.jpg)("[^>]*?\/>|"[^>]*>)/gi;

async function processFile(filePath) {
  let html = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // We walk through matches and replace outside-picture <img> tags only.
  // Strategy: collect replacements, then apply in reverse order (to preserve offsets).
  const replacements = [];

  let match;
  IMG_RE.lastIndex = 0;
  while ((match = IMG_RE.exec(html)) !== null) {
    const fullMatch = match[0];
    const before = match[1];      // "<img"
    const attrsBefore = match[2]; // attributes up to src="
    const pathPrefix = match[3];  // e.g. "../images/"
    const filename = match[4];    // e.g. "washer-frontload.jpg"
    const attrsAfter = match[5];  // remaining attrs + closing

    const start = match.index;
    const end = start + fullMatch.length;

    // Check if already inside a <picture> element (look backwards in the html)
    const preceding = html.slice(0, start);
    const lastPicOpen  = preceding.lastIndexOf('<picture');
    const lastPicClose = preceding.lastIndexOf('</picture>');
    if (lastPicOpen > lastPicClose) {
      // Already inside a <picture> — skip
      continue;
    }

    // Skip if the filename is not in our known list (shouldn't happen, but safe)
    if (!DIMS[filename]) continue;

    const [w, h] = DIMS[filename];
    const webpFilename = filename.replace(/\.jpg$/i, '.webp');
    const webp800Filename = filename.replace(/\.jpg$/i, '-800w.webp');
    const webpSrc = `${pathPrefix}${webpFilename}`;
    const webp800Src = `${pathPrefix}${webp800Filename}`;

    // Build the updated <img> tag — add width/height if not present
    let imgTag = fullMatch;
    if (!/\bwidth=/.test(imgTag)) {
      // Insert width/height before the closing /> or >
      imgTag = imgTag.replace(/(\s*\/?>)$/, ` width="${w}" height="${h}"$1`);
    }

    // Determine whether to use a srcset (for non-testimonial images) or simple source
    const isSmall = filename.startsWith('testimonial-');
    let source;
    if (isSmall) {
      source = `<source srcset="${webpSrc}" type="image/webp">`;
    } else {
      // Use 800w for tile-size slots, full size for larger
      source = `<source srcset="${webp800Src} 800w, ${webpSrc} ${w}w" type="image/webp" sizes="(max-width: 768px) 100vw, 800px">`;
    }

    const pictureTag = `<picture>\n  ${source}\n  ${imgTag}\n</picture>`;
    replacements.push({ start, end, replacement: pictureTag });
  }

  if (replacements.length === 0) return false;

  // Apply in reverse so indices stay valid
  replacements.sort((a, b) => b.start - a.start);
  for (const { start, end, replacement } of replacements) {
    html = html.slice(0, start) + replacement + html.slice(end);
  }

  fs.writeFileSync(filePath, html, 'utf8');
  return true;
}

async function main() {
  const root = path.join(__dirname, '..');
  const raw = execSync('git ls-files "*.html" "**/*.html"', { cwd: root }).toString().trim();
  const htmlFiles = raw.split('\n').filter(Boolean).map(f => path.join(root, f));

  let totalChanged = 0;
  let totalReplacements = 0;

  for (const file of htmlFiles.sort()) {
    const before = fs.readFileSync(file, 'utf8');
    const didChange = await processFile(file);
    if (didChange) {
      const after = fs.readFileSync(file, 'utf8');
      // Count picture elements added
      const added = (after.match(/<picture>/g) || []).length - (before.match(/<picture>/g) || []).length;
      const rel = path.relative(path.join(__dirname, '..'), file);
      console.log(`  +${added} <picture>  ${rel}`);
      totalChanged++;
      totalReplacements += added;
    }
  }

  console.log(`\nDone. Updated ${totalChanged} files, added ${totalReplacements} <picture> wrappers.`);
}

main().catch(err => { console.error(err); process.exit(1); });
