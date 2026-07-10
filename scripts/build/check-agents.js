#!/usr/bin/env node
/*
 * check-agents.js — drift guard for the committed cross-agent workflow library.
 *
 * The workflow definitions (`.claude/commands/*.md`) and rule files (`.claude/rules/*.md`)
 * were gitignored until 2026-07-10, which let them silently rot against the canonical
 * AGENTS.md: `test.md` still cited `node test/screenshot.js`, and `seo-blog.md` carried a
 * DEAD routine ID (`trig_01ApQ…`) long after the live routine was recreated. Once the files
 * became the committed single source of truth for every agent (Claude Code, Codex, Cursor,
 * Hermes — see AGENTS.md "Workflow Library"), that drift class needed a CI gate like the
 * partial/site-js/blog-count checks already in `npm test`.
 *
 * Each assertion below maps to a concrete failure it prevents:
 *   1. Skill resolution — every `/name` listed in AGENTS.md "Skills (slash commands)" must
 *      resolve to a real file, so a renamed/deleted command can't leave a dangling skill.
 *   2. Routine-ID freshness — every `trig_…` inside `.claude/commands/**` must be one of the
 *      ACTIVE routine IDs declared in AGENTS.md's "Routine ID:" markers (kills the stale-ID bug).
 *   3. Email hygiene — the only email allowed in the committed workflow/rule files is the
 *      business address `@fixappliancesfast.com`; anything else (e.g. the owner's personal
 *      Gmail, scrubbed to $OWNER_EMAIL) is a regression and the one genuinely-private leak.
 *
 * Deliberately NOT checked here: banned brand/old-domain strings. The workflow files
 * legitimately QUOTE them in review checklists and guidance ("Never write 'Fix Appliances
 * Fast'…", "not universalappliancesrepair.com"), so a regex can't tell "don't use X" from
 * "use X". Brand/domain emission is enforced where it matters — on the actual HTML/schema
 * output — by test/content-integrity.js and test/html-integrity.js.
 *
 * Check-only (no apply mode): `node scripts/build/check-agents.js --check`  (exit 1 on drift)
 * Invoked by `npm test`. Running without --check behaves identically (always verify-only).
 */
'use strict';

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');
const commandsDir = path.join(repoRoot, '.claude', 'commands');
const rulesDir = path.join(repoRoot, '.claude', 'rules');
const skillsDir = path.join(repoRoot, '.agents', 'skills');
const agentsMd = path.join(repoRoot, 'AGENTS.md');

const errors = [];
const rel = (p) => path.relative(repoRoot, p).replace(/\\/g, '/');

function listMd(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith('.md')).map((f) => path.join(dir, f));
}

const agents = fs.readFileSync(agentsMd, 'utf8');

// --- 1. Skill resolution -----------------------------------------------------
// Parse the "## Skills (slash commands)" section for `- `/name` …` bullet lines.
const skillsSection = (agents.split(/^##\s+Skills\s*\(slash commands\)/m)[1] || '').split(/^##\s/m)[0];
const skillNames = [...skillsSection.matchAll(/^-\s+`\/([a-z0-9-]+)`/gm)].map((m) => m[1]);
if (skillNames.length === 0) {
  errors.push('AGENTS.md: could not parse any skills from the "Skills (slash commands)" section.');
}
for (const name of skillNames) {
  const asCommand = path.join(commandsDir, `${name}.md`);
  const asSkill = path.join(skillsDir, name, 'SKILL.md');
  if (!fs.existsSync(asCommand) && !fs.existsSync(asSkill)) {
    errors.push(
      `Skill "/${name}" is listed in AGENTS.md but has no definition ` +
        `(expected .claude/commands/${name}.md or .agents/skills/${name}/SKILL.md).`
    );
  }
}

// --- 2. Routine-ID freshness -------------------------------------------------
// ACTIVE ids = those declared after a "Routine ID:" marker in AGENTS.md. The dead id that
// appears only in prose provenance notes ("the prior `trig_…` was found deleted") is excluded.
const activeRoutineIds = new Set(
  [...agents.matchAll(/Routine ID:\*\*\s*`(trig_[A-Za-z0-9]+)`/g)].map((m) => m[1])
);
if (activeRoutineIds.size === 0) {
  errors.push('AGENTS.md: could not parse any active routine IDs from "Routine ID:" markers.');
}
for (const file of listMd(commandsDir)) {
  const text = fs.readFileSync(file, 'utf8');
  for (const m of text.matchAll(/trig_[A-Za-z0-9]+/g)) {
    if (!activeRoutineIds.has(m[0])) {
      errors.push(
        `${rel(file)}: routine ID ${m[0]} is not an ACTIVE routine in AGENTS.md ` +
          `(active: ${[...activeRoutineIds].join(', ')}). Stale/dead ID — update it.`
      );
    }
  }
}

// --- 3. Email hygiene (commands + rules) -------------------------------------
const emailRe = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
for (const file of [...listMd(commandsDir), ...listMd(rulesDir)]) {
  const text = fs.readFileSync(file, 'utf8');
  for (const m of text.matchAll(emailRe)) {
    if (!m[0].toLowerCase().endsWith('@fixappliancesfast.com')) {
      errors.push(
        `${rel(file)}: non-business email "${m[0]}" in a committed workflow/rule file. ` +
          `Only @fixappliancesfast.com is allowed; route private addresses through $OWNER_EMAIL.`
      );
    }
  }
}

// --- Report ------------------------------------------------------------------
if (errors.length) {
  console.error('check-agents: FAILED\n');
  for (const e of errors) console.error('  ✗ ' + e);
  console.error(`\n${errors.length} problem(s). Fix the workflow files or AGENTS.md, then re-run.`);
  process.exit(1);
}

console.log(
  `check-agents: ${skillNames.length} skills resolve; ` +
    `${listMd(commandsDir).length} command + ${listMd(rulesDir).length} rule files clean ` +
    `(routine IDs active, no private emails). OK`
);
