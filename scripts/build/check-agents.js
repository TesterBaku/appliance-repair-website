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
 *   3. Email hygiene: the only email allowed in the committed workflow/rule/agent files is the
 *      business address `@fixappliancesfast.com`; anything else (e.g. the owner's personal
 *      Gmail, scrubbed to $OWNER_EMAIL) is a regression and the one genuinely-private leak.
 *   4. Agent-definition validity: every `.claude/agents/*.md` file must have parseable YAML
 *      frontmatter with a `name:` that matches its filename, a non-empty `description:`, a
 *      `name` unique across the directory, and (if present) a `model:` from the allowed set.
 *      Exactly one harness behavior here is verified by direct observation, and it is the
 *      DEFAULT path, not a failure path: an agent dispatched with no `model:` pin inherits the
 *      session model (a `/review` subagent ran 128 turns on Opus purely by inheritance — the
 *      reason `code-reviewer` pins Sonnet). What the harness does with a MALFORMED definition
 *      (invalid `model:` value, missing `description:`, two files sharing a `name`) has NOT
 *      been tested, and is claimed nowhere in this file. That is the point rather than a gap in
 *      it: an unvalidated definition is a config whose real effect nobody here has established,
 *      so the check requires the canonical shape instead of reasoning about the failure mode.
 *      Parser self-guard: the frontmatter regex is non-greedy and stops at the FIRST bare
 *      `---` line, so a body containing its own `---` truncates the captured block early and a
 *      `model:`-style line after it would be skipped rather than validated. The remainder is
 *      scanned for one, following CommonMark so the scan sees what a markdown reader sees:
 *      fenced blocks are skipped, and a key may carry 0-3 leading spaces (4+ makes it an
 *      indented code block, i.e. an example). A blockquoted `> model:` is likewise not a match.
 *   5. Agent-reference resolution: every agent name listed as a `- \`name\`` bullet in AGENTS.md's
 *      "Agent definitions" subsection must resolve to a real `.claude/agents/<name>.md` file. Without
 *      this, renaming or deleting an agent file leaves AGENTS.md pointing at a name nothing
 *      resolves. Verified by direct observation, not assumed: dispatching an unresolvable agent
 *      name fails loudly ("Agent type '<name>' not found. Available agents: ...") rather than
 *      silently falling back to a generic agent. That is still worth catching here: a loud failure
 *      at dispatch time (e.g. `/review` dispatching `code-reviewer`) is a broken workflow in
 *      production, whereas this assertion catches the same dangling reference in CI before merge.
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
const agentsDir = path.join(repoRoot, '.claude', 'agents');
const skillsDir = path.join(repoRoot, '.agents', 'skills');
const agentsMd = path.join(repoRoot, 'AGENTS.md');

const errors = [];
const rel = (p) => path.relative(repoRoot, p).replace(/\\/g, '/');

// Recursive so the routine-ID/email/agent-definition scans actually cover `.claude/commands/**`,
// `.claude/rules/**`, and `.claude/agents/**` (all flat today, but a future subdirectory must
// not escape the scan).
function listMd(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listMd(full));
    else if (entry.name.endsWith('.md')) out.push(full);
  }
  return out;
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

// --- 3. Email hygiene (commands + rules + agents) ----------------------------
const emailRe = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
for (const file of [...listMd(commandsDir), ...listMd(rulesDir), ...listMd(agentsDir)]) {
  const text = fs.readFileSync(file, 'utf8');
  for (const m of text.matchAll(emailRe)) {
    if (!m[0].toLowerCase().endsWith('@fixappliancesfast.com')) {
      errors.push(
        `${rel(file)}: non-business email "${m[0]}" in a committed workflow/rule/agent file. ` +
          `Only @fixappliancesfast.com is allowed; route private addresses through $OWNER_EMAIL.`
      );
    }
  }
}

// --- 4. Agent-definition validity ---------------------------------------------
// Every `.claude/agents/*.md` file is a Claude Code agent definition: YAML frontmatter followed
// by a markdown body. A malformed frontmatter block, a `name` that doesn't match the filename, a
// missing `description`, a duplicate `name`, or an invalid `model` each is an authoring defect
// this repo rejects on sight (see point 4 in the header docblock above).
const validModels = new Set(['opus', 'sonnet', 'haiku', 'fable', 'inherit']);
const seenAgentNames = new Map(); // name -> first file that declared it
for (const file of listMd(agentsDir)) {
  const text = fs.readFileSync(file, 'utf8');
  const base = path.basename(file, '.md');
  const fmMatch = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fmMatch) {
    errors.push(
      `${rel(file)}: no YAML frontmatter block found (file must start with "---" and have a closing "---").`
    );
    continue;
  }
  const frontmatter = fmMatch[1];

  // The frontmatter regex above is non-greedy and stops at the FIRST bare "---" line, so a
  // markdown body that happens to contain its own "---" line (a horizontal rule, or a second
  // frontmatter-looking block) truncates the captured block early — everything after that
  // premature "---" is treated as body text and never validated, even if it still looks like
  // frontmatter (a `model:` line with a bogus value, for example). Scan the remainder for such
  // a line, but follow CommonMark so this sees what a markdown READER sees rather than raw
  // text. Two rules, and they are the same rule Markdown itself uses to tell a directive from
  // an example:
  //   - skip fenced code blocks (``` or ~~~), so an agent file that legitimately DOCUMENTS
  //     frontmatter syntax in a fenced example is not rejected for its own documentation;
  //   - allow 0-3 leading spaces, so an indented directive is still caught, while 4+ spaces
  //     (an indented code block, i.e. an example again) correctly is not.
  // A ">"-quoted example never matches either, since ">" is not a space.
  const remainderStart = fmMatch.index + fmMatch[0].length;
  const remainder = text.slice(remainderStart);
  const leakRe = /^ {0,3}(name|description|model|tools):\s/;
  const fenceRe = /^ {0,3}(`{3,}|~{3,})/;
  let fence = null; // the open fence's delimiter run while inside one, else null
  let offset = 0;
  for (const rawLine of remainder.split('\n')) {
    const line = rawLine.replace(/\r$/, '');
    const fenceMatch = line.match(fenceRe);
    if (fence) {
      // A fence closes on a run of the SAME character at least as long as the opener.
      if (fenceMatch && fenceMatch[1][0] === fence[0] && fenceMatch[1].length >= fence.length) {
        fence = null;
      }
    } else if (fenceMatch) {
      fence = fenceMatch[1];
    } else {
      const leak = line.match(leakRe);
      if (leak) {
        const lineNum = text.slice(0, remainderStart + offset).split('\n').length;
        errors.push(
          `${rel(file)}: frontmatter block appears truncated by an embedded "---" line ` +
            `(the parser stops at the first bare "---") — "${leak[1]}:" at line ${lineNum} sits ` +
            `outside the parsed frontmatter block and is not being validated.`
        );
      }
    }
    offset += rawLine.length + 1;
  }

  const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
  const descMatch = frontmatter.match(/^description:\s*(.+)$/m);
  const modelMatch = frontmatter.match(/^model:\s*(.+)$/m);

  if (!nameMatch || !nameMatch[1].trim()) {
    errors.push(`${rel(file)}: frontmatter is missing "name:".`);
  } else {
    const name = nameMatch[1].trim();
    if (name !== base) {
      errors.push(
        `${rel(file)}: frontmatter "name: ${name}" does not match filename "${base}.md" ` +
          `(this repo requires frontmatter name to match the filename so dispatch is predictable).`
      );
    }
    if (seenAgentNames.has(name)) {
      errors.push(
        `${rel(file)}: agent name "${name}" collides with ${rel(seenAgentNames.get(name))} ` +
          `(two agent files must never share a name; unsorted readdir order decides which one loads, so it differs per machine).`
      );
    } else {
      seenAgentNames.set(name, file);
    }
  }

  if (!descMatch || !descMatch[1].trim()) {
    errors.push(`${rel(file)}: frontmatter is missing "description:" (must be present and non-empty).`);
  }

  if (modelMatch) {
    const model = modelMatch[1].trim();
    if (!validModels.has(model)) {
      errors.push(
        `${rel(file)}: frontmatter "model: ${model}" is not one of the values this repo allows: ${[...validModels].join(', ')}.`
      );
    }
  }
}

// --- 5. Agent-reference resolution ---------------------------------------------
// Parse the "#### Agent definitions: `.claude/agents/`" subsection for `- `name`` bullet lines
// (same bullet style assertion 1 uses for skills, minus the leading slash) and confirm each
// resolves to a real `.claude/agents/<name>.md` file.
const agentsSection = (agents.split(/^####\s+Agent definitions/m)[1] || '').split(/^#{2,4}\s/m)[0];
const referencedAgentNames = [...agentsSection.matchAll(/^-\s+`([a-z0-9-]+)`/gm)].map((m) => m[1]);
if (referencedAgentNames.length === 0) {
  errors.push(
    'AGENTS.md: could not parse any agent names from the "Agent definitions" subsection.'
  );
}
for (const name of referencedAgentNames) {
  const asAgent = path.join(agentsDir, `${name}.md`);
  if (!fs.existsSync(asAgent)) {
    errors.push(
      `Agent "${name}" is listed in AGENTS.md but has no definition (expected .claude/agents/${name}.md).`
    );
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
  `check-agents: ${skillNames.length} skills + ${referencedAgentNames.length} agent refs resolve; ` +
    `${listMd(commandsDir).length} command + ${listMd(rulesDir).length} rule + ` +
    `${listMd(agentsDir).length} agent files clean ` +
    `(routine IDs active, no private emails, agent frontmatter valid). OK`
);
