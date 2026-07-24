#!/usr/bin/env node
// Definition-of-Done check: every /en/library/spells/<slug> link in the content tree
// must resolve to a real spell file, and every bare quoted slug in a vocation
// spells.list array must too.
//
//   node scripts/migrations/validate-spell-links.mjs

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, basename } from 'node:path';

const ROOT = 'src/content';
const SPELL_DIR = 'src/content/en/spells';

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git') continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (/\.mdx?$/.test(name)) acc.push(p);
  }
  return acc;
}

const slugs = new Set(
  readdirSync(SPELL_DIR)
    .filter((f) => /\.mdx?$/.test(f))
    .map((f) => basename(f).replace(/\.mdx?$/, '')),
);

const badLinks = [];
const badArray = [];

for (const file of walk(ROOT)) {
  const rel = relative(process.cwd(), file);
  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      for (const m of line.matchAll(/\/en\/library\/spells\/([^)\s#]+)/g)) {
        const slug = decodeURIComponent(m[1]).replace(/\/$/, '');
        if (!slugs.has(slug)) badLinks.push(`${rel}:${i + 1}  ${slug}`);
      }
      // bare quoted slugs inside a vocation spells.list array
      if (/spells\.list|SpellTable|^\s*'[a-z0-9ä-]+',?\s*$/.test(line)) {
        const q = line.match(/^\s*'([a-z0-9äöå-]+)',?\s*$/);
        if (q && !slugs.has(q[1])) badArray.push(`${rel}:${i + 1}  '${q[1]}'`);
      }
    });
}

console.log(`spell files: ${slugs.size}`);
console.log(`\nbroken links: ${badLinks.length}`);
for (const b of badLinks) console.log('  ' + b);
console.log(`\nbroken array slugs: ${badArray.length}`);
for (const b of badArray) console.log('  ' + b);
if (!badLinks.length && !badArray.length) console.log('\nAll spell references resolve.');
