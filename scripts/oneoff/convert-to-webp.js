#!/usr/bin/env node
/**
 * Converts all /images/*.jpg to WebP.
 * Outputs two variants per image:
 *   images/<name>.webp        — full-size (same as source, quality 82)
 *   images/<name>-800w.webp   — 800px wide (for service tiles / blog cards)
 * Also prints a dimension table for setting width/height on <img> tags.
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const IMAGES_DIR = path.join(__dirname, '..', 'images');
const QUALITY = 82;
const TILE_WIDTH = 800;

async function main() {
  const files = fs.readdirSync(IMAGES_DIR)
    .filter(f => f.toLowerCase().endsWith('.jpg'))
    .sort();

  console.log(`Converting ${files.length} JPGs to WebP (quality ${QUALITY})...\n`);
  console.log('Filename                        | W    | H    | Full WebP | 800w WebP | Savings');
  console.log('--------------------------------|------|------|-----------|-----------|--------');

  let totalOriginal = 0;
  let totalWebp = 0;

  for (const file of files) {
    const inputPath = path.join(IMAGES_DIR, file);
    const baseName = file.replace(/\.jpg$/i, '');
    const fullWebpPath = path.join(IMAGES_DIR, `${baseName}.webp`);
    const tile800Path = path.join(IMAGES_DIR, `${baseName}-800w.webp`);

    const meta = await sharp(inputPath).metadata();
    const origSize = fs.statSync(inputPath).size;

    // Full-size WebP
    await sharp(inputPath)
      .webp({ quality: QUALITY })
      .toFile(fullWebpPath);
    const fullWebpSize = fs.statSync(fullWebpPath).size;

    // 800px-wide WebP (skip if source is already ≤ 800px)
    if (meta.width > TILE_WIDTH) {
      await sharp(inputPath)
        .resize(TILE_WIDTH)
        .webp({ quality: QUALITY })
        .toFile(tile800Path);
    } else {
      // Just copy the full-size WebP as the 800w variant
      fs.copyFileSync(fullWebpPath, tile800Path);
    }
    const tile800Size = fs.statSync(tile800Path).size;

    totalOriginal += origSize;
    totalWebp += fullWebpSize;

    const savings = Math.round((1 - fullWebpSize / origSize) * 100);
    const row = [
      file.padEnd(32),
      String(meta.width).padStart(4),
      String(meta.height).padStart(4),
      `${Math.round(fullWebpSize / 1024)}KiB`.padStart(9),
      `${Math.round(tile800Size / 1024)}KiB`.padStart(9),
      `${savings}%`.padStart(7),
    ].join(' | ');
    console.log(row);
  }

  const totalSavings = Math.round((1 - totalWebp / totalOriginal) * 100);
  console.log(`\nTotal original: ${Math.round(totalOriginal / 1024)} KiB`);
  console.log(`Total full-size WebP: ${Math.round(totalWebp / 1024)} KiB`);
  console.log(`Overall savings: ${totalSavings}%`);
  console.log('\nDone. WebP files written to /images/.');
}

main().catch(err => { console.error(err); process.exit(1); });
