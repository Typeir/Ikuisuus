#!/usr/bin/env node
// Relink unlinked spell mentions.
//
// Monster sheets (and some specs/heirlooms) carry spell names as bare italics —
// `_Hold_`, `_Misty Step_`, `_Sacred Flame_` — instead of links. This script indexes
// the real spell corpus, matches those italics against it (including renamed spells
// via ALIASES), and rewrites them as proper links.
//
// It only considers italics on lines that look like spell context (spell lists,
// "functions as", lines already carrying a spell link), so ordinary prose italics
// like _Hit:_ or a flavourful _light_ are not touched.
//
// Usage:
//   node scripts/migrations/relink-spell-mentions.mjs                   # dry run
//   node scripts/migrations/relink-spell-mentions.mjs --apply           # write
//   node scripts/migrations/relink-spell-mentions.mjs --report <file>   # full report
//   node scripts/migrations/relink-spell-mentions.mjs --root src/content/en/monsters

import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, relative, basename } from 'node:path';

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const val = (f, d) => (argv.indexOf(f) >= 0 ? argv[argv.indexOf(f) + 1] : d);

const APPLY = has('--apply');
const ROOT = val('--root', 'src/content');
const SPELL_DIR = val('--spells', 'src/content/en/spells');
const REPORT = val('--report', null);

// Renamed / merged / retired spells: old display name -> surviving slug.
// Anything whose target slug is missing is reported as a BAD ALIAS rather than applied.
const ALIASES = {
  'sacred flame': 'judgement',
  'toll the dead': 'omen',
  'fire bolt': 'pyromancy',
  firebolt: 'pyromancy',
  guidance: 'focus',
  resistance: 'focus',
  fireball: 'pyroblast',
  'silvery barbs': 'argent-strands',
  'ray of frost': 'chill',
  'acid arrow': 'cystbolt',
  "melf's acid arrow": 'cystbolt',
  'hideous laughter': 'agathoss-mirth',
  "tasha's hideous laughter": 'agathoss-mirth',
  friends: 'glamour',
  "bigby's hand": 'golden-grasp',
  'black tentacles': 'black-forest',
  "evard's black tentacles": 'black-forest',
  'lost in the folds': 'lost-in-the-muck',
  // merges — old member name -> merged survivor
  'hold person': 'hold',
  'hold monster': 'hold',
  'charm person': 'charm',
  'charm monster': 'charm',
  'dominate person': 'dominate',
  'dominate monster': 'dominate',
  'mass cure wounds': 'cure-wounds',
  'mass healing word': 'healing-word',
  'lesser restoration': 'restoration',
  'greater restoration': 'restoration',
  'greater invisibility': 'invisibility',
  seeming: 'disguise-self',
  'water breathing': 'air-bubble',
  tongues: 'comprehend-languages',
  'ice storm': 'cone-of-cold',
  'witch bolt': 'chained-lightning',
  'chain lightning': 'chained-lightning',
  'glyph of warding': 'sigil-of-ruin',
  symbol: 'sigil-of-ruin',
  counterspell: 'objection',
  'dispel magic': 'objection',
  blight: 'excision',
  'circle of death': 'excision',
  'arcane eye': 'silmä',
  'power word pain': 'invoke-agony',
  'power word stun': 'invoke-agony',
  'power word kill': 'thought-of-oblivion',
  'power word heal': 'heal',
  // author rulings, 23-07-2026
  gust: 'thunderwave',
  'erupting earth': 'sandstorm-barrier',
  web: 'entangle',
  'wind wall': 'breeze-barrier',
  'wall of wind': 'breeze-barrier',
  tunnel: 'knock',
  'create bonfire': 'pyromancy',
  'aura of purity': 'aura-of-life',
  'aura of vitality': 'aura-of-life',
  "hunter's mark": 'hex',
  'mind whip': 'despairing-lash',
  "tasha's mind whip": 'despairing-lash',
  'wall of force': 'perfect-barrier',
  "aganazzar's scorcher": 'scorching-ray',
  "ashardalon's stride": 'flame-stride',
  light: 'dancing-lights',
  'entropic communion': 'commune-with-entropy',
  'beastly communion': 'communion',
  'commune with nature': 'commune-with-the-land',
};

const norm = (s) =>
  s
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git') continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (/\.mdx?$/.test(name)) acc.push(p);
  }
  return acc;
}

// ---- index the spell corpus: normalized name -> slug ----
const slugs = new Set();
const index = new Map();
for (const file of walk(SPELL_DIR)) {
  const slug = basename(file).replace(/\.mdx?$/, '');
  slugs.add(slug);
  index.set(norm(slug.replace(/-/g, ' ')), slug);
  const h1 = readFileSync(file, 'utf8').match(/^#\s+(.+)$/m);
  if (h1) index.set(norm(h1[1]), slug);
}

const badAliases = [];
for (const [from, slug] of Object.entries(ALIASES)) {
  if (!slugs.has(slug)) badAliases.push(`${from} -> ${slug} (target missing)`);
  else index.set(norm(from), slug);
}

// Lines that plausibly reference spells.
const CONTEXT =
  /(\blevel\b|cantrip|at will|\/day|\bspell|\bcasts?\b|functions as|prepared|spellcasting|\/en\/library\/spells\/)/i;

// Italic spans that are plainly not spell names: stat-block lines, labels, prerequisites.
const NOISE_PREFIX =
  /^(prerequisite|recharge|costs?|requires?|choose|can be used|counts as|stub|duration|hit|melee|ranged|spell scroll|mythic artifact|very rare|gloves|lantern|book of|scroll of|weave|enhance|disposition|one with)\b/i;
const isNoise = (s) => {
  const t = s.trim();
  return (
    t.length < 3 ||
    /\d+(st|nd|rd|th)[-\s]?level/i.test(t) ||
    /\bcantrip\b/i.test(t) ||
    /[:;]$/.test(t) ||
    /^\(/.test(t) ||
    NOISE_PREFIX.test(t)
  );
};

const linked = [];
const unmatched = [];
let changedFiles = 0;

for (const file of walk(ROOT)) {
  const rel = relative(process.cwd(), file);
  const original = readFileSync(file, 'utf8');
  let dirty = false;

  const out = original.split('\n').map((line, idx) => {

    // Match italic / bold-italic spans, skipping ones already inside a [..](..) link.
    const rewritten = line.replace(/(\*{0,2})_([^_\n]{2,80}?)_(\*{0,2})/g, (m, pre, inner, post, offset) => {
      const before = line.slice(Math.max(0, offset - 1), offset);
      const after = line.slice(offset + m.length);
      if (before === '[' || after.startsWith('](')) return m; // already linked
      if (isNoise(inner)) return m;
      // Single-word names ("Light", "Hold", "Web") are ambiguous with ordinary prose,
      // so they still require a spell-ish line. Multi-word names are safe anywhere.
      if (!/\s/.test(inner.trim()) && !CONTEXT.test(line)) return m;

      // A single italic span may hold several comma-joined spells: _Hold, Mirror Image_
      const parts = inner.split(/\s*,\s*/).filter(Boolean);
      // Fall back to the bare name for annotated entries like "Invisibility (upcast)".
      const lookup = (p) => index.get(norm(p)) || index.get(norm(p.replace(/\s*\([^)]*\)\s*$/, '')));
      const resolved = parts.map((p) => ({ p, slug: lookup(p) }));

      // Only surface unmatched names from spell-ish lines; elsewhere they are just prose.
      const note = (name) => {
        if (CONTEXT.test(line) && !isNoise(name)) unmatched.push({ file: rel, line: idx + 1, name });
      };

      if (!resolved.some((r) => r.slug)) {
        for (const r of resolved) note(r.p);
        return m;
      }

      return resolved
        .map((r) => {
          if (!r.slug) {
            note(r.p);
            return `${pre}_${r.p}_${post}`;
          }
          linked.push({ file: rel, line: idx + 1, name: r.p, slug: r.slug });
          return `[${pre}_${r.p}_${post}](/en/library/spells/${r.slug})`;
        })
        .join(', ');
    });

    if (rewritten !== line) dirty = true;
    return rewritten;
  });

  if (dirty) {
    changedFiles++;
    if (APPLY) writeFileSync(file, out.join('\n'), 'utf8');
  }
}

// ---- report ----
const byName = {};
for (const l of linked) byName[`${l.name} -> ${l.slug}`] = (byName[`${l.name} -> ${l.slug}`] || 0) + 1;
const unNames = {};
for (const u of unmatched) unNames[u.name] = (unNames[u.name] || 0) + 1;

const lines = [];
lines.push(`relink spell mentions (${APPLY ? 'APPLY' : 'DRY RUN'})`);
lines.push(`root: ${ROOT}   spells indexed: ${slugs.size}   files changed: ${changedFiles}   links: ${linked.length}`);
lines.push('\n=== LINKS BY NAME ===');
for (const [k, n] of Object.entries(byName).sort()) lines.push(`  ${String(n).padStart(3)}  ${k}`);
lines.push('\n=== EVERY LINK ===');
for (const l of linked) lines.push(`  ${l.file}:${l.line}  _${l.name}_ -> ${l.slug}`);
lines.push(`\n=== UNMATCHED italic names in spell context (${unmatched.length}) — no such spell; needs an alias or an author call ===`);
for (const [k, n] of Object.entries(unNames).sort()) lines.push(`  ${String(n).padStart(3)}  ${k}`);
if (badAliases.length) {
  lines.push('\n=== BAD ALIASES (target slug missing) ===');
  for (const b of badAliases) lines.push(`  ${b}`);
}
const full = lines.join('\n');
if (REPORT) writeFileSync(REPORT, full, 'utf8');

console.log(`relink spell mentions (${APPLY ? 'APPLY' : 'DRY RUN'})`);
console.log(`root: ${ROOT}   spells indexed: ${slugs.size}   files changed: ${changedFiles}   links: ${linked.length}`);
console.log('\n--- links by name ---');
for (const [k, n] of Object.entries(byName).sort()) console.log(`  ${String(n).padStart(3)}  ${k}`);
console.log(`\n--- UNMATCHED (${unmatched.length}) — no such spell; alias or author call ---`);
for (const [k, n] of Object.entries(unNames).sort()) console.log(`  ${String(n).padStart(3)}  ${k}`);
if (badAliases.length) {
  console.log('\n--- BAD ALIASES (target slug missing) ---');
  for (const b of badAliases) console.log(`  ${b}`);
}
if (REPORT) console.log(`\nFull report written to ${REPORT}`);
if (!APPLY) console.log('\n(dry run — no files written. Re-run with --apply.)');
