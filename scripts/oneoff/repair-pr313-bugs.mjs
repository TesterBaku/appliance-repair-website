/**
 * Repair two bugs introduced by the PR #313 img-dimensions script:
 *   Bug 1: Logo <img> tags are malformed — missing space after `<img`, duplicate attrs
 *   Bug 2: Article hero imgs have stray slash before fetchpriority attr
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

const files = walkHtml(ROOT);

let logoFixed = 0;
let slashFixed = 0;
let filesChanged = 0;

for (const file of files) {
  let content = readFileSync(file, 'utf8');
  const original = content;

  // Bug 1: Fix malformed logo img tags
  // Pattern produced by the broken script:
  //   <imgalt="Universal Appliances Repair logo" style="height:52px;width:auto;" width="128" height="128"src="[path]/logo.png" alt="..." style="...">
  // Correct form:
  //   <img src="[path]/logo.png" alt="Universal Appliances Repair logo" width="128" height="128" style="height:52px;width:auto;">
  const logoRegex = /<imgalt="Universal Appliances Repair logo" style="height:52px;width:auto;" width="128" height="128"src="([^"]*logo\.png)" alt="[^"]*" style="[^"]*">/g;
  content = content.replace(logoRegex, (_, srcPath) => {
    logoFixed++;
    return `<img src="${srcPath}" alt="Universal Appliances Repair logo" width="128" height="128" style="height:52px;width:auto;">`;
  });

  // Bug 2: Fix stray slash before fetchpriority in article hero imgs
  // Pattern: width="1600" height="460" / fetchpriority="high">
  // Correct:  width="1600" height="460" fetchpriority="high">
  const before2 = content;
  content = content.replace(/ \/ fetchpriority="high">/g, ' fetchpriority="high">');
  if (content !== before2) {
    slashFixed += (before2.match(/ \/ fetchpriority="high">/g) || []).length;
  }

  if (content !== original) {
    writeFileSync(file, content, 'utf8');
    filesChanged++;
    console.log(`Fixed: ${path.relative(ROOT, file)}`);
  }
}

console.log(`\nDone.`);
console.log(`  Logo tags fixed:     ${logoFixed}`);
console.log(`  Stray slashes fixed: ${slashFixed}`);
console.log(`  Files changed:       ${filesChanged}`);
