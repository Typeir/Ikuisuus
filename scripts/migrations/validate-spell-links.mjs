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

// ---- third surface: a spell's Spell Lists footer and its array membership must agree ----
//
// A spell with a footer but no array entry is unreachable in play; a spell with an array
// entry but no footer is undocumented. Both halves have to exist or neither. Legendary and
// granted spells ("not innate to any vocation") legitimately have neither, and are exempt.
//
// This surface is invisible to the link check — nothing is broken, the spell simply cannot
// be learned. It hid five unreachable spells until it was looked for directly.
const arrayText = walk(join(ROOT, 'en/character-creation'))
  .filter((f) => /spells\.list\.mdx?$/.test(f))
  .map((f) => readFileSync(f, 'utf8'))
  .join('\n');

const halfWired = [];
for (const slug of slugs) {
  if (slug === 'main') continue;
  const text = readFileSync(join(SPELL_DIR, `${slug}.mdx`), 'utf8');
  if (/Legendary|not innate to any vocation/i.test(text)) continue;
  const hasFooter = /Spell Lists/.test(text);
  const inArray = arrayText.includes(`'${slug}'`);
  if (hasFooter !== inArray) {
    halfWired.push(`${slug}  footer:${hasFooter ? 'yes' : 'no '}  array:${inArray ? 'yes' : 'no '}`);
  }
}

// ---- upcast coverage ----
//
// Adding upcast capability is a standing goal of the refactor: a levelled spell that does
// nothing extra for a bigger slot is a spell nobody casts twice. Cantrips scale by character
// level and Legendary spells carry their own tiers, so both are exempt. Reported rather than
// failed — it is a design target, not an invariant.
const noUpcast = [];
let levelled = 0;
for (const slug of [...slugs].sort()) {
  if (slug === 'main') continue;
  const text = readFileSync(join(SPELL_DIR, `${slug}.mdx`), 'utf8');
  if (/cantrip/i.test(text) || /Legendary/i.test(text)) continue;
  levelled++;
  if (!/At Higher Levels/i.test(text)) noUpcast.push(slug);
}

console.log(`spell files: ${slugs.size}`);
// Author benchmark: not every spell needs an upcast, but most should have one.
const BENCHMARK = 75;
const covered = levelled - noUpcast.length;
const pct = Math.round((covered / levelled) * 100);
console.log(
  `upcast coverage: ${covered}/${levelled} levelled spells (${pct}%) — ` +
    `${noUpcast.length} bare — benchmark ${BENCHMARK}% ${pct >= BENCHMARK ? 'MET' : `(${Math.ceil((BENCHMARK / 100) * levelled) - covered} more needed)`}`,
);
console.log(`\nbroken links: ${badLinks.length}`);
for (const b of badLinks) console.log('  ' + b);
console.log(`\nbroken array slugs: ${badArray.length}`);
for (const b of badArray) console.log('  ' + b);
console.log(`\nhalf-wired spell lists: ${halfWired.length}`);
for (const b of halfWired) console.log('  ' + b);
if (!badLinks.length && !badArray.length && !halfWired.length)
  console.log('\nAll spell references resolve, and every spell is reachable.');
