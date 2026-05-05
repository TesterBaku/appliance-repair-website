const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Logo is displayed at height:52px. 128px covers 2.4× retina with room to spare.
const TARGET_SIZE = 128;
const logoPath = path.join(__dirname, '..', 'logo.png');

const beforeBytes = fs.statSync(logoPath).size;
const beforeKB = (beforeBytes / 1024).toFixed(1);

sharp(logoPath)
  .resize(TARGET_SIZE, TARGET_SIZE, { fit: 'inside', withoutEnlargement: true })
  .png({ compressionLevel: 9, effort: 10 })
  .toBuffer()
  .then((buf) => {
    fs.writeFileSync(logoPath, buf);
    const afterKB = (buf.length / 1024).toFixed(1);
    console.log(`logo.png: ${beforeKB} KB → ${afterKB} KB (resized to ≤${TARGET_SIZE}px)`);
    if (buf.length >= 100 * 1024) {
      console.warn('Warning: result is still ≥ 100 KB — consider converting to WebP or SVG.');
    }
  })
  .catch((err) => {
    console.error('Optimization failed:', err.message);
    process.exit(1);
  });
