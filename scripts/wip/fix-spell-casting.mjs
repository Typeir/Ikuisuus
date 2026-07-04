#!/usr/bin/env node
/** Fix spell casting times: 1 Action → 1 Major Action. Usage: node scripts/wip/fix-spell-casting.mjs [--live] */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(import.meta.url), '../../..');
const RULES = [
  { re: /(\*\*Casting Time\*\*: 1) Action\b/, to: '$1 Major Action' },
  { re: /(\*\*Casting Time\*\*: 1) action\b/, to: '$1 Major Action' },
];

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else if (e.name.endsWith('.mdx')) out.push(p);
  }
  return out;
}

const live = process.argv.includes('--live');
let changed = 0;

for (const fp of await walk(join(ROOT, 'src', 'content', 'en', 'spells'))) {
  const lines = (await readFile(fp, 'utf-8')).split('\n');
  let had = false;
  for (let i = 0; i < lines.length; i++) {
    for (const r of RULES) {
      r.re.lastIndex = 0;
      const next = lines[i].replace(r.re, r.to);
      if (next !== lines[i]) {
        had = true;
        lines[i] = next;
      }
    }
  }
  if (had) {
    changed++;
    if (live) await writeFile(fp, lines.join('\n'), 'utf-8');
  }
}

console.log(`Mode: ${live ? 'LIVE' : 'DRY RUN'}  Spells fixed: ${changed}`);
