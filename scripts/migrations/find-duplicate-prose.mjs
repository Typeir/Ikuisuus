#!/usr/bin/env node
// Report near-duplicate sentences inside a single spell's stat block.
//
// The import left many spells saying the same thing twice — sometimes verbatim
// (Continual Flame, Null Sphere), sometimes as an overlapping restatement
// (Water Walk's two "move across any liquid surface" paragraphs, Skywrite's two
// word-limit sentences). Individually each looks like a one-off; as a class it is
// the single most common defect in the corpus.
//
// Report-only: collapsing a duplicate needs judgement about which half to keep.
//
// Usage:
//   node scripts/migrations/find-duplicate-prose.mjs
//   node scripts/migrations/find-duplicate-prose.mjs --threshold 0.7

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const argv = process.argv.slice(2);
const THRESHOLD = Number(argv.includes('--threshold') ? argv[argv.indexOf('--threshold') + 1] : 0.75);
const DIR = 'src/content/en/spells';

const norm = (s) =>
  s
    .toLowerCase()
    .replace(/\[%[^%]*%\]/g, ' DICE ')      // dice wrappers vary but mean the same
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // link text only
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const STOP = new Set('the a an of to and or in on at for it its is are be as you your this that with'.split(' '));
const toks = (s) => new Set(norm(s).split(' ').filter((w) => w.length > 2 && !STOP.has(w)));

function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let hit = 0;
  for (const t of a) if (b.has(t)) hit++;
  return hit / (a.size + b.size - hit);
}

const findings = [];

for (const name of readdirSync(DIR).filter((f) => /\.mdx?$/.test(f))) {
  const text = readFileSync(join(DIR, name), 'utf8');

  // Only the stat block matters; the flavour line above it is allowed to echo the body.
  const body = text
    .split('\n')
    .filter((l) => l.startsWith('>'))
    .join(' ')
    .replace(/^>\s?/gm, ' ');

  // Sentence-ish split; keep only substantial ones.
  const sentences = body
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => norm(s).split(' ').length >= 8);

  const seen = sentences.map((s) => ({ s, t: toks(s) }));
  for (let i = 0; i < seen.length; i++) {
    for (let j = i + 1; j < seen.length; j++) {
      const score = jaccard(seen[i].t, seen[j].t);
      if (score >= THRESHOLD) {
        findings.push({ name, score, a: seen[i].s, b: seen[j].s });
      }
    }
  }
}

findings.sort((x, y) => y.score - x.score);

console.log(`duplicate prose scan — threshold ${THRESHOLD}, ${findings.length} pair(s)\n`);
for (const f of findings) {
  console.log(`${f.name}  (${Math.round(f.score * 100)}% overlap)`);
  console.log(`   A: ${f.a.slice(0, 150)}`);
  console.log(`   B: ${f.b.slice(0, 150)}\n`);
}
