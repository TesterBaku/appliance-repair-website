/**
 * session-start.mjs — inject the rules that cannot be made mechanical.
 *
 * Why this exists: a rule that depends on the assistant REMEMBERING it does not
 * reliably fire. (Measured elsewhere: the `ponytail` skill self-activated zero
 * times across ten sessions until a SessionStart hook force-injected it.)
 *
 * Keep this SHORT. It is paid for on every session. Anything enforceable
 * mechanically belongs in a test or a git hook instead, NOT here:
 *   em dashes, BOM/DOCTYPE, GA tag, FAQ parity, contrast -> npm test
 *   direct pushes to master                              -> .husky/pre-push
 * Only rules with no mechanical check earn a line below.
 *
 * Each line must point at its canonical source or BE it. Never restate a doc in
 * different words here: this is the highest-salience text in the repo and will
 * win over anything it contradicts.
 *
 * Node rather than shell so it behaves the same on Windows, matching the
 * existing PostToolUse hook.
 */
process.stdout.write(`Repo non-negotiables (SessionStart hook; canonical text in AGENTS.md):

1. Every change goes branch -> commit -> ALL THREE tests -> PR -> /review -> merge.
   The three: \`npm test\`, \`npm run screenshot\`, \`npm run test:functional\`. All exit 0
   BEFORE the PR is opened. Pushing master is blocked by .husky/pre-push; committing
   on master locally is not, so branch FIRST.
2. Added, removed or renamed an .html file? Run \`npm run build:sitemap\` and commit it.
   Nothing checks sitemap freshness.
3. Added, removed or renamed an \`articles/article-*.html\`? Also run \`npm run build:search\`
   and commit \`pagefind/\`. Nothing checks index freshness.
4. Edited anything in \`articles/\`? Bump BOTH \`article:modified_time\` and the JSON-LD
   \`dateModified\` to today UTC. CI checks the two MATCH, not that you bumped them.
   Exemptions (chrome rollouts, cosmetic href swaps, related-card thumbnails) are in
   AGENTS.md and must be stated in the PR description.
5. Stage explicit paths. \`git add -A\` swept a 13.6 MB research PDF into a commit on
   2026-08-02; no gate caught it. Read \`git status --short\` before committing.
`);
