/**
 * localize-images.js
 *
 * Downloads every Unsplash image used across the site to images/ and rewrites
 * all HTML files to use the local paths. Run once; safe to re-run (skips
 * already-downloaded files).
 *
 * Usage: node scripts/localize-images.js
 */

const fs   = require('fs');
const path = require('path');
const https = require('https');

const root      = path.resolve(__dirname, '..');
const imagesDir = path.join(root, 'images');
if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir);

// ─── Image map ───────────────────────────────────────────────────────────────
// oldId  : Unsplash photo ID that appears in HTML (may be wrong/broken)
// file   : local filename under images/
// src    : Unsplash photo ID to actually download (may differ from oldId when replacing)
// size   : download width in pixels (default 1200)
const IMAGES = [
  // ── Refrigerators ──────────────────────────────────────────────────────────
  { oldId: 'photo-1721613877687-c9099b698faa', file: 'fridge-sidebyside.jpg',     src: 'photo-1721613877687-c9099b698faa' },
  { oldId: 'photo-1584568694244-14fbdf83bd30', file: 'fridge-display.jpg',         src: 'photo-1584568694244-14fbdf83bd30' },
  { oldId: 'photo-1588854337236-6889d631faa8', file: 'kitchen-modern-fridge.jpg',  src: 'photo-1588854337236-6889d631faa8' },
  { oldId: 'photo-1571175443880-49e1d25b2bc5', file: 'fridge-vintage.jpg',          src: 'photo-1571175443880-49e1d25b2bc5' },
  // cake photo used in fridge article → replace with correct fridge
  { oldId: 'photo-1578985545062-69928b1d9587', file: 'fridge-sidebyside.jpg',      src: 'photo-1721613877687-c9099b698faa' },
  // construction worker used as mini-fridge hero → replace
  { oldId: 'photo-1621905251918-48416bd8575a', file: 'fridge-mini.jpg',            src: 'photo-1770757587087-766db2874c21' },

  // ── Ovens / Stoves ─────────────────────────────────────────────────────────
  { oldId: 'photo-1623114112815-74a4b9fe505d', file: 'oven-stainless-range.jpg',  src: 'photo-1623114112815-74a4b9fe505d' },
  { oldId: 'photo-1556909172-54557c7e4fb7',    file: 'kitchen-stove.jpg',          src: 'photo-1556909172-54557c7e4fb7' },

  // ── Microwave ──────────────────────────────────────────────────────────────
  // toaster oven used for microwave article → replace
  { oldId: 'photo-1574269909862-7e1d70bb8078', file: 'microwave.jpg',              src: 'photo-1630699144310-980c8ed310e3' },

  // ── Washers / Dryers ───────────────────────────────────────────────────────
  { oldId: 'photo-1626806787461-102c1bfaaea1', file: 'washer-frontload.jpg',       src: 'photo-1626806787461-102c1bfaaea1' },
  { oldId: 'photo-1632923565835-6582b54f2105', file: 'washer-dryer-pair.jpg',      src: 'photo-1632923565835-6582b54f2105' },
  { oldId: 'photo-1597418048367-7dd01e4404ee', file: 'kitchen-with-washer.jpg',    src: 'photo-1597418048367-7dd01e4404ee' },
  // laundromat commercial washers used for home dryer → replace with washer-dryer pair
  { oldId: 'photo-1604335399105-a0c585fd81a1', file: 'washer-dryer-pair.jpg',      src: 'photo-1632923565835-6582b54f2105' },

  // ── Dishwashers ────────────────────────────────────────────────────────────
  { oldId: 'photo-1581622558663-b2e33377dfb2', file: 'dishwasher-open.jpg',        src: 'photo-1581622558663-b2e33377dfb2' },
  // couple cooking on stove used for dishwasher articles → replace
  { oldId: 'photo-1556909114-f6e7ad7d3136',    file: 'dishwasher-open.jpg',        src: 'photo-1581622558663-b2e33377dfb2' },
  // 404 used in dishwasher cost article → replace
  { oldId: 'photo-1559056199-641a0ac8b3f4',    file: 'dishwasher-open.jpg',        src: 'photo-1581622558663-b2e33377dfb2' },
  // headphones used in dishwasher-leaking article → replace
  { oldId: 'photo-1585771724684-38269d6639fd', file: 'dishwasher-open.jpg',        src: 'photo-1581622558663-b2e33377dfb2' },
  { oldId: 'photo-1558618666-fcd25c85cd64',    file: 'repair-tech.jpg',            src: 'photo-1558618666-fcd25c85cd64' },

  // ── Wine Cooler ────────────────────────────────────────────────────────────
  { oldId: 'photo-1510812431401-41d2bd2722f3', file: 'wine-cooler-glasses.jpg',    src: 'photo-1510812431401-41d2bd2722f3' },

  // ── Dorm / Mini Fridge ─────────────────────────────────────────────────────
  // graduation photo used for dorm article → replace
  { oldId: 'photo-1541339907198-e08756dedf3f', file: 'dorm-appliances.jpg',        src: 'photo-1571474039046-42bc4e7f4b98' },

  // ── Generic repair (replaces two broken 404s) ──────────────────────────────
  { oldId: 'photo-1581092160607-ee22731c9c9d', file: 'appliance-repair-generic.jpg', src: 'photo-1562259929-b4e1fd3aef09' },

  // ── Heroes ─────────────────────────────────────────────────────────────────
  { oldId: 'photo-1586208958839-06c17cacdf08', file: 'hero-homepage.jpg',          src: 'photo-1586208958839-06c17cacdf08', size: 1600 },

  // ── Testimonial avatars (small) ────────────────────────────────────────────
  { oldId: 'photo-1607503873903-c5e95f80d7b9', file: 'testimonial-ashley.jpg',    src: 'photo-1607503873903-c5e95f80d7b9', size: 200 },
  { oldId: 'photo-1614289371518-722f2615943d', file: 'testimonial-robert.jpg',     src: 'photo-1614289371518-722f2615943d', size: 200 },
  { oldId: 'photo-1553514029-1318c9127859',    file: 'testimonial-megan.jpg',      src: 'photo-1553514029-1318c9127859',    size: 200 },
];

// ─── Download helper (follows redirects) ─────────────────────────────────────
function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    function get(u) {
      https.get(u, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          file.close();
          return get(res.headers.location);
        }
        if (res.statusCode !== 200) {
          file.close();
          fs.unlinkSync(dest);
          return reject(new Error(`HTTP ${res.statusCode} for ${u}`));
        }
        res.pipe(file);
        file.on('finish', () => file.close(resolve));
      }).on('error', err => { file.close(); fs.unlinkSync(dest); reject(err); });
    }
    get(url);
  });
}

// ─── Step 1: Download unique images ──────────────────────────────────────────
const toDownload = new Map(); // file → { src, size }
for (const img of IMAGES) {
  if (!toDownload.has(img.file)) {
    toDownload.set(img.file, { src: img.src, size: img.size || 1200 });
  }
}

async function downloadAll() {
  for (const [file, { src, size }] of toDownload) {
    const dest = path.join(imagesDir, file);
    if (fs.existsSync(dest)) {
      console.log(`  skip  ${file} (already exists)`);
      continue;
    }
    const url = `https://images.unsplash.com/${src}?w=${size}&auto=format&q=80&fm=jpg&fit=crop`;
    process.stdout.write(`  dl    ${file} ... `);
    try {
      await download(url, dest);
      const kb = Math.round(fs.statSync(dest).size / 1024);
      console.log(`${kb} KB`);
    } catch (e) {
      console.log(`FAILED: ${e.message}`);
    }
  }
}

// ─── Step 2: Rewrite HTML files ───────────────────────────────────────────────
function rewriteHtml() {
  // Build regex map: oldId → local filename
  const idToFile = new Map();
  for (const img of IMAGES) idToFile.set(img.oldId, img.file);

  const htmlFiles = [];
  function collect(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith('.')) { collect(full); continue; }
      if (entry.isFile() && entry.name.endsWith('.html')) htmlFiles.push(full);
    }
  }
  collect(root);

  const PROD = 'https://fixappliancesfast.com';
  let changed = 0;
  for (const filePath of htmlFiles) {
    const depth = path.relative(root, filePath).split(path.sep).length - 1;
    const relPrefix = depth === 0 ? 'images/' : '../images/';
    const absPrefix = `${PROD}/images/`;

    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;

    for (const [oldId, localFile] of idToFile) {
      const escapedId = oldId.replace(/-/g, '\\-');
      const urlPattern = `https://images\\.unsplash\\.com/${escapedId}[^"')]*`;

      // OG / Twitter meta content= → must be absolute URL for social crawlers
      content = content.replace(
        new RegExp(`(property="og:image"[^>]*content="|name="twitter:image"[^>]*content=")${urlPattern}`, 'g'),
        (_, attr) => attr + absPrefix + localFile
      );
      // Everything else (src=, background-image url()) → relative path
      content = content.replace(new RegExp(urlPattern, 'g'), relPrefix + localFile);
    }

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`  upd   ${path.relative(root, filePath)}`);
      changed++;
    }
  }
  console.log(`\nUpdated ${changed} HTML files.`);
}

// ─── Run ──────────────────────────────────────────────────────────────────────
(async () => {
  console.log('Downloading images...');
  await downloadAll();
  console.log('\nRewriting HTML references...');
  rewriteHtml();
  console.log('\nDone. Run `npm test` to verify no broken references remain.');
})();
