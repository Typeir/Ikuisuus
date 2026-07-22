/**
 * Generates minimal stub .mdx + .metadata.json for missing SRD spell files.
 *
 * Reads missing spell list from analysis; creates content stubs so library
 * links resolve. Each stub is a minimal MDX with TODO marker for later authoring.
 *
 * Run: node scripts/content/generate-spell-stubs.mjs [--dry-run]
 */

import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const DRY_RUN = process.argv.includes('--dry-run');
const SPELLS_DIR = 'src/content/en/spells';

/** Spell names that health check reported as missing (from analysis) */
const MISSING_SPELLS = [
  'fireball',
  'chill-touch',
  'thaumaturgy',
  'fire-bolt',
  'sacred-flame',
  'guidance',
  'ray-of-frost',
  'toll-the-dead',
  'wall-of-fire',
  'wall-of-force',
  'spirit-shroud',
  'melfs-acid-arrow',
  'gust',
  'erupting-earth',
  'wall-of-light',
  'create-bonfire',
  'dark-star',
  'acid-arrow',
  'abi-dalzims-horrid-wilting',
  'aganazzars-scorcher',
  'arms-of-hadar',
  'black-tentacles',
  'bigbys-hand',
  'blade-burst',
  'commune',
  'contact-other-plane',
  'crusader-s-mantle',
  'divine-smite',
  'dragon-s-breath',
  'elementalism',
  'evard-s-black-tentacles',
  'fount-of-moonlight',
  'friends',
  'globe-of-invulnerability',
  'alarm',
  'bigby-s-hand',
  'create-or-destroy-water',
  'tasha-s-hideous-laughter',
];

function spellStubMdx(name) {
  const title = name
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  return `---
title: "${title}"
---

<TODO: Author spell content for ${title}>

> **TODO**: This is an auto-generated stub. Complete the spell description, stat block, and metadata.
`;
}

function spellMetadataJson(name) {
  const title = name
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  return JSON.stringify(
    {
      title,
      slug: name,
      type: 'spell',
      school: '',
      level: 0,
      ritual: false,
      castingTime: '',
      range: '',
      components: {
        verbal: false,
        somatic: false,
        material: false,
        materials: '',
      },
      duration: '',
      concentration: false,
      classes: [],
      source: 'SRD',
      status: 'stub',
    },
    null,
    2,
  );
}

let created = 0;
let skipped = 0;

if (!existsSync(SPELLS_DIR)) {
  mkdirSync(SPELLS_DIR, { recursive: true });
}

for (const spell of MISSING_SPELLS) {
  const mdxPath = join(SPELLS_DIR, `${spell}.mdx`);
  const metaPath = join(SPELLS_DIR, `${spell}.metadata.json`);

  if (existsSync(mdxPath)) {
    console.log(`  SKIP (exists): ${spell}.mdx`);
    skipped++;
    continue;
  }

  if (DRY_RUN) {
    console.log(
      `  [DRY RUN] Would create: ${spell}.mdx + ${spell}.metadata.json`,
    );
  } else {
    writeFileSync(mdxPath, spellStubMdx(spell));
    writeFileSync(metaPath, spellMetadataJson(spell));
    console.log(`  CREATED: ${spell}.mdx + ${spell}.metadata.json`);
  }
  created++;
}

console.log(
  `\n${DRY_RUN ? 'Would create' : 'Created'} ${created} spell stub(s), skipped ${skipped} existing.`,
);
if (DRY_RUN) {
  console.log('Run without --dry-run to apply changes.');
}
