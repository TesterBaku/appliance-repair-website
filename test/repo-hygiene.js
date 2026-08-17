/**
 * repo-hygiene.js: large-file guard for git-tracked files
 *
 * On 2026-08-02 a 13.6 MB research PDF was swept into a commit by a `git add -A` and
 * nothing in `npm test` stopped it. This check closes that gap: it enumerates every
 * GIT-TRACKED file (via `git ls-files -z`, so `node_modules/` and untracked scratch
 * files never enter the count) and fails if any tracked file exceeds a size limit, or
 * carries an extension that has no legitimate reason to be committed to a static-site
 * repo (archives, installers, document dumps).
 *
 * Threshold, measured 2026-08-16 against the top of the tracked tree:
 *
 *   14.47 MB  videos/social/cooktop-swap-newport-beach-social-1080x1920.mp4  (allowlisted)
 *    3.03 MB  videos/cooktop-swap-newport-beach.mp4
 *    2.01 MB  videos/thermador-cooktop-newport-beach.mp4
 *    1.41 MB  images/source/raw/2026-05-13/IMG-20260513-WA0044.jpg
 *    1.32 MB  images/source/raw/2026-05-13/IMG-20260513-WA0042.jpg
 *    1.21 MB  images/source/raw/2026-05-13/IMG-20260513-WA0047.jpg
 *    0.99 MB  images/source/raw/2026-05-13/IMG-20260513-WA0038.jpg
 *    0.92 MB  images/source/raw/2026-05-13/IMG-20260513-WA0036.jpg
 *    0.43 MB  .agents/skills/impeccable/scripts/live-browser.js
 *   0.28-0.34 MB  a run of images/real/business/*.jpg (real completed-repair photos)
 *
 * Everything else in the tree is well under 1 MB. 5 MB was chosen because it: (a)
 * passes today's tree cleanly (the one file above it is explicitly allowlisted, see
 * below); (b) sits comfortably above the largest non-allowlisted tracked file (3.03 MB,
 * over 60% headroom), so normal site images and short video clips are never flagged;
 * and (c) is well under the 13.6 MB PDF that caused this check to be written, so that
 * exact class of accident is caught. Raising this number to accommodate one big file
 * defeats the point; add a narrow allowlist entry instead (see SIZE_ALLOWLIST).
 *
 * Usage:
 *   node test/repo-hygiene.js
 */

'use strict';

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB (see threshold reasoning above)

// Narrow, explicit allowlist for individual tracked files that legitimately exceed
// MAX_BYTES. Add an entry only for the exact path that needs it, with a comment
// explaining why it's legitimate. Never raise MAX_BYTES itself to fit one file.
const SIZE_ALLOWLIST = new Set([
  // Vertical (1080x1920) social-cut export of the Newport Beach cooktop swap job video.
  // 14.47 MB is inherent to a portrait H.264 export at social-platform quality; this is
  // an intentionally committed marketing asset, not an accident.
  'videos/social/cooktop-swap-newport-beach-social-1080x1920.mp4',
]);

// Extensions with no legitimate reason to be tracked in this static-site repo: archive
// formats, installers, and document dumps (the shape of the 2026-08-02 incident). Verified
// zero false positives against the current tree before adding this list; every extension
// below currently matches nothing tracked.
const BANNED_EXTENSIONS = ['.pdf', '.zip', '.tar', '.tar.gz', '.tgz', '.rar', '.7z', '.exe', '.dmg', '.iso'];

function trackedFiles() {
  const out = execFileSync('git', ['ls-files', '-z'], { cwd: root, maxBuffer: 1024 * 1024 * 64 });
  return out.toString('utf8').split('\0').filter(Boolean);
}

const files = trackedFiles();

const tooLarge = [];
const banned = [];

for (const rel of files) {
  const full = path.join(root, rel);
  let stat;
  try {
    stat = fs.statSync(full);
  } catch (e) {
    // Tracked in the index but absent on disk (e.g. a pending rename); not this
    // check's concern, other git plumbing already handles that state.
    continue;
  }
  if (!stat.isFile()) continue;

  if (stat.size > MAX_BYTES && !SIZE_ALLOWLIST.has(rel)) {
    tooLarge.push(`${rel}: ${(stat.size / (1024 * 1024)).toFixed(2)} MB (limit ${(MAX_BYTES / (1024 * 1024)).toFixed(0)} MB)`);
  }

  const lower = rel.toLowerCase();
  if (BANNED_EXTENSIONS.some((ext) => lower.endsWith(ext))) {
    banned.push(rel);
  }
}

let failed = false;

if (tooLarge.length) {
  console.error(`repo-hygiene: ${tooLarge.length} tracked file(s) exceed the ${(MAX_BYTES / (1024 * 1024)).toFixed(0)} MB size limit:`);
  tooLarge.forEach((v) => console.error('  ' + v));
  console.error('\nDo not commit large binaries via `git add -A`. If a file is genuinely legitimate, add a narrow, commented entry to SIZE_ALLOWLIST in test/repo-hygiene.js for that exact path; never raise the threshold for everything.');
  failed = true;
}

if (banned.length) {
  console.error(`repo-hygiene: ${banned.length} tracked file(s) carry a banned extension:`);
  banned.forEach((v) => console.error('  ' + v));
  console.error(`\nThese extensions (${BANNED_EXTENSIONS.join(', ')}) have no legitimate place in this static-site repo.`);
  failed = true;
}

if (failed) process.exit(1);

console.log(`repo-hygiene: ${files.length} git-tracked files, all within the ${(MAX_BYTES / (1024 * 1024)).toFixed(0)} MB size limit (${SIZE_ALLOWLIST.size} allowlisted), no banned extensions. OK`);
