#!/usr/bin/env node
/**
 * Targeted fix: bold-wrapped **action** → **Major Action** (patterns missed by main script).
 * Only touches previously-missed bold text, won't double-process anything.
 * Usage: node scripts/wip/fix-bold-action.mjs [--live]
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(import.meta.url), '../../..');
const SKIP = new Set(['.git', '.next', 'node_modules', '.ignore', 'coverage']);
const EXTS = new Set(['.mdx', '.md']);
const shouldSkip = (p) =>
  p.includes('scripts\\wip') ||
  p.includes('scripts/wip') ||
  p.endsWith('.metadata.json') ||
  p.includes('foundry\\packs') ||
  p.includes('foundry/packs');

// Only match what the main script missed: bold-wrapped action that isn't already Major/Minor/Reaction
const RULES = [
  // "an **action**" → "a **Major Action**" (grammar fix)
  {
    re: /\ban \*\*action\*\*/gi,
    to: 'a **Major Action**',
    desc: 'an **action**',
  },
  // "An **action**" → "A **Major Action**"
  {
    re: /\bAn \*\*action\*\*/g,
    to: 'A **Major Action**',
    desc: 'An **action**',
  },
  // Generic bold **action** (must not already be Major/Minor/Reaction)
  {
    re: /\*\*action\*\*(?!"?\s*(?:Major|Minor|Reaction|Pool))/gi,
    to: '**Major Action**',
    desc: '**action**',
  },
  // "as an **action**" preserves case
  {
    re: /\b([Aa])s an \*\*action\*\*/g,
    to: '$1s a **Major Action**',
    desc: 'As an **action**',
  },
  // "use/uses/using its **action**"
  {
    re: /\b(us(?:e|es|ing)\s+)its \*\*action\*\*/gi,
    to: '$1a **Major Action**',
    desc: 'use its **action**',
  },
];

async function walk(dir) {
  /** @type {string[]} */ const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (!SKIP.has(e.name)) out.push(...(await walk(p)));
    } else if (!shouldSkip(p)) {
      const x = e.name.slice(e.name.lastIndexOf('.'));
      if (EXTS.has(x)) out.push(p);
    }
  }
  return out;
}

const live = process.argv.includes('--live');
const changes = [];
let scanned = 0,
  changed = 0;

for (const d of ['src/content', '.github']) {
  for (const fp of await walk(join(ROOT, d)).catch(() => [])) {
    scanned++;
    const lines = (await readFile(fp, 'utf-8')).split('\n');
    let had = false;
    for (let i = 0; i < lines.length; i++) {
      let cur = lines[i];
      for (const r of RULES) {
        r.re.lastIndex = 0;
        const next = cur.replace(r.re, r.to);
        if (next !== cur) {
          had = true;
          changes.push({
            file: relative(ROOT, fp),
            line: i + 1,
            old: cur.trim().slice(0, 100),
            rule: r.desc,
          });
          cur = next;
        }
      }
      lines[i] = cur;
    }
    if (had) {
      changed++;
      if (live) await writeFile(fp, lines.join('\n'), 'utf-8');
    }
  }
}

const rp = join(ROOT, '.ignore', 'reports', `fix-bold-${Date.now()}.json`);
mkdirSync(join(ROOT, '.ignore', 'reports'), { recursive: true });
writeFileSync(
  rp,
  JSON.stringify(
    { live, scanned, changed, totalChanges: changes.length, changes },
    null,
    2,
  ),
);

console.log(
  `Mode: ${live ? 'LIVE' : 'DRY RUN'}  Scanned: ${scanned}  Changed: ${changed}  Changes: ${changes.length}`,
);
console.log(`Report: ${relative(ROOT, rp)}`);
for (const c of changes.slice(0, 20))
  console.log(`  ${c.file}:${c.line} [${c.rule}]  ${c.old}`);
