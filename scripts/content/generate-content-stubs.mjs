/**
 * Generates stub .mdx + .metadata.json for missing illness, condition, and
 * rules sub-page content files referenced by MDX library links.
 *
 * Run: node scripts/content/generate-content-stubs.mjs [--dry-run]
 */

import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const DRY_RUN = process.argv.includes('--dry-run');

const STUBS = [
  // Illnesses
  {
    dir: 'src/content/en/rules/life-blood-and-ruin/illnesses',
    slug: 'erosion',
    title: 'Erosion',
    type: 'illness',
  },
  {
    dir: 'src/content/en/rules/life-blood-and-ruin/illnesses',
    slug: 'black-rot',
    title: 'Black Rot',
    type: 'illness',
  },
  {
    dir: 'src/content/en/rules/life-blood-and-ruin/illnesses',
    slug: 'red-ruin',
    title: 'Red Ruin',
    type: 'illness',
  },
  {
    dir: 'src/content/en/rules/life-blood-and-ruin/illnesses',
    slug: 'white-life',
    title: 'White Life',
    type: 'illness',
  },
  {
    dir: 'src/content/en/rules/life-blood-and-ruin/illnesses',
    slug: 'poison-of-the-mind',
    title: 'Poison of the Mind',
    type: 'illness',
  },
  // Conditions
  {
    dir: 'src/content/en/conditions',
    slug: 'main',
    title: 'Conditions',
    type: 'conditions',
  },
  // Rules sub-pages — tales-tests-and-tropes
  {
    dir: 'src/content/en/rules/tales-tests-and-tropes',
    slug: 'coherent-stakes',
    title: 'Coherent Stakes',
    type: 'rules',
  },
  {
    dir: 'src/content/en/rules/tales-tests-and-tropes',
    slug: 'know-thy-table',
    title: 'Know Thy Table',
    type: 'rules',
  },
  {
    dir: 'src/content/en/rules/tales-tests-and-tropes',
    slug: 'recovery-is-a-resource',
    title: 'Recovery Is a Resource',
    type: 'rules',
  },
  {
    dir: 'src/content/en/rules/tales-tests-and-tropes',
    slug: 'the-alluring-over-the-archetypal',
    title: 'The Alluring over the Archetypal',
    type: 'rules',
  },
  {
    dir: 'src/content/en/rules/tales-tests-and-tropes',
    slug: 'the-contract-of-mechanics',
    title: 'The Contract of Mechanics',
    type: 'rules',
  },
  // Other missing rules references
  {
    dir: 'src/content/en/rules/steel-and-strife',
    slug: 'movement',
    title: 'Movement',
    type: 'rules',
  },
  {
    dir: 'src/content/en/rules/life-blood-and-ruin',
    slug: 'healing-restoration-and-death',
    title: 'Healing, Restoration & Death',
    type: 'rules',
  },
  {
    dir: 'src/content/en/items/equipment',
    slug: 'armour',
    title: 'Armour',
    type: 'items',
  },
  // Missing feats page
  {
    dir: 'src/content/en/character-creation/feats',
    slug: 'volley',
    title: 'Volley',
    type: 'feats',
  },
];

function stubMdx(title) {
  return `---
title: "${title}"
---

<TODO: Author content for ${title}>

> **TODO**: This is an auto-generated stub. Content pending.
`;
}

function stubMetadataJson(slug, title, type) {
  return JSON.stringify(
    {
      title,
      slug,
      type,
      status: 'stub',
    },
    null,
    2,
  );
}

let created = 0;
let skipped = 0;

for (const { dir, slug, title, type } of STUBS) {
  if (!existsSync(dir)) {
    if (DRY_RUN) {
      console.log(`  [DRY RUN] Would mkdir: ${dir}`);
    } else {
      mkdirSync(dir, { recursive: true });
    }
  }

  const mdxPath = join(dir, `${slug}.mdx`);
  const metaPath = join(dir, `${slug}.metadata.json`);

  if (existsSync(mdxPath)) {
    console.log(`  SKIP (exists): ${mdxPath}`);
    skipped++;
    continue;
  }

  if (DRY_RUN) {
    console.log(`  [DRY RUN] Would create: ${mdxPath}`);
  } else {
    writeFileSync(mdxPath, stubMdx(title));
    writeFileSync(metaPath, stubMetadataJson(slug, title, type));
    console.log(`  CREATED: ${mdxPath}`);
  }
  created++;
}

console.log(
  `\n${DRY_RUN ? 'Would create' : 'Created'} ${created} stub(s), skipped ${skipped} existing.`,
);
if (DRY_RUN) {
  console.log('Run without --dry-run to apply changes.');
}
