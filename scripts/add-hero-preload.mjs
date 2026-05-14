/**
 * Add <link rel="preload" as="image"> for the hero image on pages that lack it.
 *
 * Hub pages: hero is a CSS background-image. Extract the url() from the inline CSS.
 * Articles:  hero is <picture> with fetchpriority="high" on the <img>. Preload via
 *            imagesrcset to match the <source srcset> in the <picture> element.
 * Skip pages that already have a preload as="image" hint.
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..');

function walkHtml(dir, results = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const full = path.join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) walkHtml(full, results);
    else if (entry.endsWith('.html')) results.push(full);
  }
  return results;
}

let added = 0, skipped = 0;

for (const file of walkHtml(ROOT)) {
  let content = readFileSync(file, 'utf8');

  // Skip if already has a preload as="image"
  if (content.includes('rel="preload" as="image"') || content.includes("rel='preload' as='image'")) {
    skipped++;
    continue;
  }

  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  const isArticle = rel.startsWith('articles/');
  const isPage = rel.startsWith('pages/');
  const isIndex = rel === 'index.html';

  let preloadTag = '';

  if (isArticle) {
    // Find the <source srcset="..."> in the first <picture> element
    const sourceMatch = content.match(/<source\s+srcset="([^"]+)"\s+type="image\/webp"\s+sizes="([^"]+)"/);
    if (!sourceMatch) continue;
    const srcset = sourceMatch[1]; // e.g. "../images/foo-800w.webp 800w, ../images/foo.webp 1200w"
    const sizes = sourceMatch[2];
    // Extract the first (full-size) webp from srcset for href
    // srcset format: "path-800w.webp 800w, path.webp 1200w"
    const parts = srcset.split(',').map(s => s.trim());
    // Use the largest (last) as href
    const hrefPart = parts[parts.length - 1].split(' ')[0];
    preloadTag = `  <link rel="preload" as="image" href="${hrefPart}" fetchpriority="high" type="image/webp" imagesrcset="${srcset}" imagesizes="${sizes}">`;
  } else if (isPage || isIndex) {
    // Find background-image: url(...) in the hub-hero-bg CSS rule
    const bgMatch = content.match(/hub-hero-bg\s*\{[^}]*background-image:\s*url\(['"]?([^'")]+)['"]?\)/);
    if (!bgMatch) continue;
    const imgPath = bgMatch[1]; // e.g. '../images/fridge-sidebyside.webp'
    preloadTag = `  <link rel="preload" as="image" href="${imgPath}" fetchpriority="high" type="image/webp">`;
  } else {
    continue;
  }

  // Insert the preload hint immediately before </head>
  // Place it after the shared.css preload if present, otherwise before </head>
  const sharedCssPreload = '  <link rel="preload" href=';
  const insertAfterShared = content.includes(sharedCssPreload);

  if (insertAfterShared) {
    // Insert right after the last <link rel="preload"> line before </head>
    content = content.replace(/(<link rel="preload"[^\n]*\n)(\s*<link rel="stylesheet")/, `$1${preloadTag}\n$2`);
  } else {
    content = content.replace('</head>', `${preloadTag}\n</head>`);
  }

  writeFileSync(file, content, 'utf8');
  added++;
  console.log(`Added preload to: ${rel}`);
}

console.log(`\nDone. Added: ${added}, Skipped (already had preload): ${skipped}`);
