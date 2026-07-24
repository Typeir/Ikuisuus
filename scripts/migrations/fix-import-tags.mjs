#!/usr/bin/env node
// Stat-block and link convention fixes.
//
// R1  "Casting Time: 1 Major Action R"  — a garbled ritual tag. Every affected spell
//     is in fact a ritual, so the tag is restored rather than dropped.
// R2  "_5th-level Transmutation DC_"    — Dunamancy school markers (DC = Chronurgy,
//     DG = Graviturgy). Those schools do not exist in Damocles; drop the tag.
// R3  Ritual tags belong on the SCHOOL line, not the Casting Time line. The house form
//     is "_3rd-level Divination (Ritual)_" — established by air-bubble, communion,
//     commune-with-the-land, find-familiar, haruspicy et al. R1 originally restored the
//     tag to the Casting Time line, which was the wrong slot; R3 moves it.
// R4  Vocation spell-list links written as ".../vocations/<x>/spells.list" — ".list" is a
//     filename suffix (like ".specialization.mdx") that routing strips. Correct form is
//     ".../vocations/<x>/spells", by 1128 occurrences to 28.
//
// Usage:
//   node scripts/migrations/fix-import-tags.mjs            # dry run
//   node scripts/migrations/fix-import-tags.mjs --apply

import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const APPLY = process.argv.includes('--apply');
const SPELLS = 'src/content/en/spells';
const ROOT = 'src/content';

const RITUAL_OLD = /^(> \*\*Casting Time\*\*: .+?) R(\s*)$/gm;
// Any trailing one-or-two-letter uppercase token on a school line is import debris:
// DC/DG are Dunamancy (Chronurgy/Graviturgy); T and D turned up later on other files.
// Real school lines never end in a bare initialism, and "(Ritual)" is parenthesised,
// so this cannot eat anything legitimate.
const DUNAMANCY = /^(> _[^_\n]*-level [A-Za-z]+) [A-Z]{1,2}(_\s*)$/gm;
const CT_RITUAL = /^(> \*\*Casting Time\*\*: .+?) \(Ritual\)(\s*)$/m;
const SCHOOL = /^(> _[^_\n]*-level [A-Za-z]+)(_\s*)$/m;
const LIST_LINK = /(\/vocations\/[a-z-]+\/spells)\.list(\))/g;
// R5: the referee is the GM (or Game Director), never the DM. 141 occurrences to 20 —
// DM is pure import residue, and every instance is a referee reference, so a word-boundary
// swap is safe. Flagged individually on Earthquake and Transmute Rock before being swept.
const REFEREE = /\bDM\b/g;

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git') continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (/\.mdx?$/.test(name)) acc.push(p);
  }
  return acc;
}

const changes = [];
const touched = new Set();

// ---- R1 / R2 / R3 : spell stat blocks ----
for (const name of readdirSync(SPELLS).filter((f) => /\.mdx?$/.test(f))) {
  const path = join(SPELLS, name);
  const original = readFileSync(path, 'utf8');
  let out = original;

  out = out.replace(RITUAL_OLD, (m, head, tail) => {
    changes.push(`${name}: R1 ritual tag restored`);
    return `${head} (Ritual)${tail}`;
  });
  out = out.replace(DUNAMANCY, (m, head, tail) => {
    changes.push(`${name}: R2 dunamancy marker stripped (${m.trim()})`);
    return `${head}${tail}`;
  });

  // R3: relocate the ritual tag to the school line, where the house form puts it.
  if (CT_RITUAL.test(out) && SCHOOL.test(out)) {
    out = out.replace(CT_RITUAL, (m, head, tail) => `${head}${tail}`);
    out = out.replace(SCHOOL, (m, head, tail) => `${head} (Ritual)${tail}`);
    changes.push(`${name}: R3 ritual tag moved to school line`);
  }

  if (out !== original) {
    touched.add(path);
    if (APPLY) writeFileSync(path, out, 'utf8');
  }
}

// ---- R4 / R5 : anywhere in the content tree ----
for (const path of walk(ROOT)) {
  const original = readFileSync(path, 'utf8');
  let out = original;

  const listHits = original.match(LIST_LINK);
  if (listHits) {
    out = out.replace(LIST_LINK, '$1$2');
    changes.push(`${relative(ROOT, path)}: R4 ${listHits.length} spells.list link(s) corrected`);
  }

  const refHits = out.match(REFEREE);
  if (refHits) {
    out = out.replace(REFEREE, 'GM');
    changes.push(`${relative(ROOT, path)}: R5 ${refHits.length} DM -> GM`);
  }

  if (out !== original) {
    touched.add(path);
    if (APPLY) writeFileSync(path, out, 'utf8');
  }
}

console.log(`fix-import-tags (${APPLY ? 'APPLY' : 'DRY RUN'})  files: ${touched.size}  edits: ${changes.length}`);
for (const c of changes) console.log(`  ${c}`);
if (!APPLY) console.log('\n(dry run — re-run with --apply)');
