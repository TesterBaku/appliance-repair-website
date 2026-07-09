#!/usr/bin/env node
/**
 * sync-related-card-thumbnails-2026-07.js
 *
 * Syncs .related-card thumbnail images: when a TARGET article has been
 * upgraded to a real photo hero (images/real/business/...) but a SOURCE
 * article still shows the old stock <picture> element for that card,
 * this script collapses:
 *
 *   <picture>
 *     <source srcset="...webp ..." type="image/webp" ...>
 *     <img src="../images/stock.jpg" alt="..." width="..." height="..." loading="lazy" />
 *   </picture>
 *
 * into:
 *
 *   <img src="../images/real/business/target-hero.jpg" alt="..." width="..." height="..." loading="lazy">
 *
 * The transform is idempotent: cards already showing a real image are
 * skipped without modification.
 *
 * Usage:
 *   node scripts/oneoff/sync-related-card-thumbnails-2026-07.js [--dry-run] [--files file1,file2,...]
 *
 *   --dry-run    Show what would change; do not write files.
 *   --files      Comma-separated list of article filenames (basename only, e.g.
 *                article-dryer-not-heating-santa-ana.html). If omitted, processes
 *                all articles with stale related-cards.
 *
 * Run from repo root.
 *
 * Safety:
 *   - Verifies target real-image exists on disk before writing; skips + warns if missing.
 *   - Preserves CRLF line endings on Windows.
 *   - Writes UTF-8 without BOM using Buffer.from().
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Config: map of TARGET article filename -> real hero image path (../images/...)
// Covers every article that has been upgraded to a real business photo as hero.
// ---------------------------------------------------------------------------
const REAL_HERO_MAP = {
  'article-built-in-refrigerator-repair-orange-county.html':
    '../images/real/business/completed-repair-refrigerator-ge-monogram-builtin.jpg',
  'article-dishwasher-cost-orange-county.html':
    '../images/real/business/completed-repair-dishwasher-whirlpool-door-mission-viejo.jpg',
  'article-dishwasher-not-draining-anaheim.html':
    '../images/real/business/completed-repair-dishwasher-pump-drain.jpg',
  'article-dryer-not-heating-santa-ana.html':
    '../images/real/business/completed-repair-dryer-lg-not-heating-santa-ana.jpg',
  'article-dryer-repair-cost-orange-county.html':
    '../images/real/business/completed-repair-dryer-frontload-motor-blower.jpg',
  'article-dryer-takes-too-long-yorba-linda.html':
    '../images/real/business/completed-repair-dryer-lg-exhaust-temperature-sensor-mission-viejo.jpg',
  'article-fridge-maintenance.html':
    '../images/real/business/technician-working-builtin-refrigerator.jpg',
  'article-fridge-not-cooling-fountain-valley.html':
    '../images/real/business/completed-repair-refrigerator-evaporator-coil-swap.jpg',
  'article-fridge-not-cooling-huntington-beach.html':
    '../images/real/business/completed-repair-refrigerator-ge-builtin-sidebyside.jpg',
  'article-fridge-repair-garden-grove.html':
    '../images/real/business/completed-repair-refrigerator-evaporator-coil.jpg',
  'article-garbage-disposal-repair-costa-mesa.html':
    '../images/real/business/completed-repair-disposal-kitchenaid-replacement.jpg',
  'article-gas-stove-igniter-not-working-orange-county.html':
    '../images/real/business/completed-repair-range-gas-burner-valve.jpg',
  'article-gas-vs-electric-range-repair-cost-orange-county.html':
    '../images/real/business/completed-repair-range-viking-mission-viejo.jpg',
  'article-lg-fridge-repair-laguna-beach.html':
    '../images/real/business/completed-repair-refrigerator-whirlpool-drawer-interior-laguna-beach.jpg',
  'article-oven-not-heating-tustin.html':
    '../images/real/business/completed-repair-oven-kitchenaid-control-board-san-clemente.jpg',
  'article-oven-repair-laguna-niguel.html':
    '../images/real/business/completed-repair-oven-kitchenaid-double-wall-newport-beach.jpg',
  'article-oven-repair-santa-ana.html':
    '../images/real/business/completed-repair-oven-kitchenaid-san-clemente-detail.jpg',
  'article-samsung-fridge-not-cooling-irvine.html':
    '../images/real/business/completed-repair-refrigerator-whirlpool-drawer-rail-laguna-beach.jpg',
  'article-stove-burner-not-lighting-orange-county.html':
    '../images/real/business/completed-repair-range-wolf-cooktop-newport-beach.jpg',
  'article-sub-zero-not-cooling-orange-county.html':
    '../images/real/business/completed-repair-refrigerator-subzero-700bfi.jpg',
  'article-sub-zero-repair-cost-orange-county.html':
    '../images/real/business/completed-repair-refrigerator-marine-compressor.jpg',
  'article-sub-zero-repair-vs-replace.html':
    '../images/real/business/completed-repair-refrigerator-ice-dispenser.jpg',
  'article-viking-oven-not-heating-orange-county.html':
    '../images/real/business/completed-repair-range-viking-thermostat-mission-viejo.jpg',
  'article-washer-leaking-buena-park.html':
    '../images/real/business/completed-repair-washer-lg-frontload-door-seal.jpg',
  'article-washer-not-spinning-huntington-beach.html':
    '../images/real/business/completed-repair-washer-control-board-diagnostics.jpg',
  'article-washer-repair-garden-grove.html':
    '../images/real/business/completed-repair-washer-whirlpool-duet-frontload.jpg',
  'article-washer-repair-irvine.html':
    '../images/real/business/completed-repair-washer-control-module-interior.jpg',
  'article-whirlpool-dryer-repair-los-alamitos.html':
    '../images/real/business/completed-repair-dryer-whirlpool-timer-irvine.jpg',
  'article-wine-cooler-not-cooling-seal-beach.html':
    '../images/real/business/completed-repair-wine-cooler-viking-costa-mesa-compressor.jpg',
  'article-wine-cooler-repair-newport-beach.html':
    '../images/real/business/completed-repair-wine-cooler-undercounter-drawer.jpg',
  'article-wolf-range-igniter-not-working-orange-county.html':
    '../images/real/business/completed-repair-range-wolf-cooktop-newton-beach.jpg',
};

// Fix the wolf-range path (cooktop newport beach, not newton beach)
REAL_HERO_MAP['article-wolf-range-igniter-not-working-orange-county.html'] =
  '../images/real/business/completed-repair-range-wolf-cooktop-newport-beach.jpg';

const ARTICLES_DIR = path.resolve('articles');
const IMAGES_BASE = path.resolve('images');

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const filesArg = args.find(a => a.startsWith('--files='));
const filterFiles = filesArg
  ? filesArg.replace('--files=', '').split(',').map(f => f.trim())
  : null;

if (DRY_RUN) console.log('[DRY RUN] No files will be written.\n');

// ---------------------------------------------------------------------------
// Transform a single file
// ---------------------------------------------------------------------------
function resolveImagePath(imgSrcRelative) {
  // imgSrcRelative is like "../images/real/business/X.jpg"
  // resolve relative to ARTICLES_DIR
  return path.resolve(ARTICLES_DIR, imgSrcRelative);
}

/**
 * Given HTML content and a list of (targetHref, newImgSrc) pairs, performs
 * the <picture>-><img> substitution for each stale related-card and returns
 * the modified HTML. Also returns a list of changes made.
 *
 * Strategy: for each related-card href, find the <a href="HREF" class="related-card">
 * block, then within it replace the <picture>...</picture> with a plain <img>.
 */
function transformFile(html, staleCards) {
  let result = html;
  const changes = [];

  for (const card of staleCards) {
    const { href, newImgSrc, keepAlt, keepWidth, keepHeight } = card;

    // Build a regex that matches this specific related-card <a> block.
    // The href can be a bare filename or a path ending in the filename.
    // We match any href containing the target filename.
    const hrefBasename = path.basename(href);
    // Escape for regex
    const escapedHref = hrefBasename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Match <a href="...BASENAME..." class="related-card">...(picture block)...</a>
    // Non-greedy within the <a> block, then find the <picture>...</picture>
    const cardBlockRe = new RegExp(
      `(<a\\s+href="[^"]*${escapedHref}"\\s+class="related-card">)` +
      `([\\s\\S]*?)` +
      `(<\\/a>)`,
      'g'
    );

    let matched = false;
    result = result.replace(cardBlockRe, (fullMatch, openTag, inner, closeTag) => {
      // Check if inner contains a stale <picture>
      if (!/<picture>/i.test(inner)) {
        // No picture element — already collapsed or different structure; skip
        return fullMatch;
      }

      // Extract existing img attributes from the current <img> inside <picture>
      const imgMatch = /<img\s+([^>]+)>/i.exec(inner);
      if (!imgMatch) return fullMatch;

      const attrs = imgMatch[1];
      const altMatch = /alt="([^"]*)"/.exec(attrs);
      const widthMatch = /width="([^"]+)"/.exec(attrs);
      const heightMatch = /height="([^"]+)"/.exec(attrs);

      const alt = keepAlt !== undefined ? keepAlt : (altMatch ? altMatch[1] : '');
      const width = keepWidth !== undefined ? keepWidth : (widthMatch ? widthMatch[1] : '1200');
      const height = keepHeight !== undefined ? keepHeight : (heightMatch ? heightMatch[1] : '800');

      // Build the replacement <img> tag (no self-closing slash per HTML5)
      const newImg = `<img src="${newImgSrc}" alt="${alt}" width="${width}" height="${height}" loading="lazy">`;

      // Replace the <picture>...</picture> block with the new <img>
      const newInner = inner.replace(/<picture>[\s\S]*?<\/picture>/i, newImg);

      matched = true;
      changes.push({
        href: hrefBasename,
        oldSrc: imgMatch ? (/src="([^"]+)"/.exec(attrs) || [])[1] : '?',
        newSrc: newImgSrc,
      });

      return openTag + newInner + closeTag;
    });

    if (!matched) {
      // Try alternate pattern: class comes before href
      const altCardRe = new RegExp(
        `(<a\\s+class="related-card"\\s+href="[^"]*${escapedHref}">)` +
        `([\\s\\S]*?)` +
        `(<\\/a>)`,
        'g'
      );
      result = result.replace(altCardRe, (fullMatch, openTag, inner, closeTag) => {
        if (!/<picture>/i.test(inner)) return fullMatch;
        const imgMatch = /<img\s+([^>]+)>/i.exec(inner);
        if (!imgMatch) return fullMatch;
        const attrs = imgMatch[1];
        const altMatch = /alt="([^"]*)"/.exec(attrs);
        const widthMatch = /width="([^"]+)"/.exec(attrs);
        const heightMatch = /height="([^"]+)"/.exec(attrs);
        const alt = keepAlt !== undefined ? keepAlt : (altMatch ? altMatch[1] : '');
        const width = keepWidth !== undefined ? keepWidth : (widthMatch ? widthMatch[1] : '1200');
        const height = keepHeight !== undefined ? keepHeight : (heightMatch ? heightMatch[1] : '800');
        const newImg = `<img src="${newImgSrc}" alt="${alt}" width="${width}" height="${height}" loading="lazy">`;
        const newInner = inner.replace(/<picture>[\s\S]*?<\/picture>/i, newImg);
        changes.push({
          href: hrefBasename,
          oldSrc: (/src="([^"]+)"/.exec(attrs) || [])[1] || '?',
          newSrc: newImgSrc,
        });
        return openTag + newInner + closeTag;
      });
    }
  }

  return { html: result, changes };
}

// ---------------------------------------------------------------------------
// Build the stale-cards list for a given source file
// ---------------------------------------------------------------------------
function getStaleCardsForFile(html) {
  const stale = [];
  // Match both attribute orders: href-first or class-first
  // Pattern 1: <a href="..." class="related-card">
  // Pattern 2: <a class="related-card" href="...">
  const hrefFirstRe = /<a\s+href="([^"]+)"\s+class="related-card">([\s\S]*?)<\/a>/g;
  const classFirstRe = /<a\s+class="related-card"\s+href="([^"]+)">([\s\S]*?)<\/a>/g;

  function processMatch(href, inner) {
    const targetFile = path.basename(href);
    const realHero = REAL_HERO_MAP[targetFile];
    if (!realHero) return; // target still stock, skip

    // Check current img src
    const imgMatch = /<img\s+([^>]+)>/i.exec(inner);
    if (!imgMatch) return;
    const currentSrc = (/src="([^"]+)"/.exec(imgMatch[1]) || [])[1] || '';
    if (currentSrc.includes('real/business')) return; // already synced

    stale.push({ href, newImgSrc: realHero });
  }

  let m;
  while ((m = hrefFirstRe.exec(html)) !== null) processMatch(m[1], m[2]);
  while ((m = classFirstRe.exec(html)) !== null) processMatch(m[1], m[2]);
  return stale;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
const files = fs.readdirSync(ARTICLES_DIR)
  .filter(f => f.endsWith('.html'))
  .filter(f => !filterFiles || filterFiles.includes(f))
  .sort();

let totalFiles = 0;
let totalCards = 0;
let totalSkipped = 0;

for (const file of files) {
  const filePath = path.join(ARTICLES_DIR, file);
  // Read as Buffer to preserve CRLF exactly
  const rawBuf = fs.readFileSync(filePath);
  const html = rawBuf.toString('utf8');

  // Check for BOM
  if (rawBuf[0] === 0xEF && rawBuf[1] === 0xBB && rawBuf[2] === 0xBF) {
    console.warn(`WARNING: BOM detected in ${file} — skipping to avoid corruption`);
    continue;
  }

  const staleCards = getStaleCardsForFile(html);
  if (staleCards.length === 0) continue;

  // Verify all target images exist on disk before modifying anything
  let anyMissing = false;
  for (const card of staleCards) {
    const absPath = resolveImagePath(card.newImgSrc);
    if (!fs.existsSync(absPath)) {
      console.error(`SKIP (missing image): ${file} -> ${card.href}`);
      console.error(`  Image not found: ${absPath}`);
      anyMissing = true;
      totalSkipped++;
    }
  }
  if (anyMissing) {
    // Only skip cards with missing images; process remaining
    const validCards = staleCards.filter(card => {
      const absPath = resolveImagePath(card.newImgSrc);
      return fs.existsSync(absPath);
    });
    if (validCards.length === 0) continue;
    staleCards.length = 0;
    staleCards.push(...validCards);
  }

  const { html: newHtml, changes } = transformFile(html, staleCards);

  if (newHtml === html) {
    console.log(`  [NO CHANGE] ${file} (${staleCards.length} stale found but regex did not match)`);
    continue;
  }

  if (DRY_RUN) {
    console.log(`[DRY] ${file}: would fix ${changes.length} card(s)`);
    for (const c of changes) {
      console.log(`  ${c.href}: ${c.oldSrc} -> ${c.newSrc}`);
    }
  } else {
    // Write UTF-8 without BOM, preserving CRLF (the string already has CRLF from the original)
    const outBuf = Buffer.from(newHtml, 'utf8');
    fs.writeFileSync(filePath, outBuf);
    console.log(`FIXED ${file}: ${changes.length} card(s)`);
    for (const c of changes) {
      console.log(`  ${c.href}: ${path.basename(c.oldSrc)} -> ${path.basename(c.newSrc)}`);
    }
    totalFiles++;
    totalCards += changes.length;
  }
}

console.log(`\n=== SUMMARY ===`);
if (DRY_RUN) {
  console.log('Dry run complete — no files written.');
} else {
  console.log(`Files modified: ${totalFiles}`);
  console.log(`Cards fixed:    ${totalCards}`);
  console.log(`Cards skipped (missing image): ${totalSkipped}`);
}
