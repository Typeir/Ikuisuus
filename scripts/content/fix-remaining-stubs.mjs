/**
 * Fixes stub files: adds H1 heading, creates remaining missing spell stubs,
 * handles apostrophe variant naming.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const DRY_RUN = process.argv.includes('--dry-run');
const SPELLS_DIR = 'src/content/en/spells';

// Remaining missing spells from health check
const MORE_MISSING_SPELLS = [
  'light', 'lost-in-the-folds', 'maximilians-earthen-grasp',
  'message', 'plane-shift', 'pyrotechnics',
  'rary-s-telepathic-bond', 'snillocs-snowball-swarm', 'starry-wisp',
  'summon-dragon', 'tensers-transformation', 'thunderclap',
  'vicious-mockery', 'wall-of-sand', 'wall-of-stone',
  'wall-of-water', 'wind-wall', 'word-of-radiance',
  'yolande-s-regal-presence',
  // apostrophe variant (link uses apostrophe in filename)
  "tasha's-hideous-laughter",
];

function stubMdxWithH1(name) {
  const title = name
    .split(/[-']/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  return `---
title: "${title}"
---

# ${title}

<TODO: Author spell content for ${title}>

> **TODO**: This is an auto-generated stub. Complete the spell description, stat block, and metadata.
`;
}

function stubMetadataJson(name) {
  const title = name
    .split(/[-']/)
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
      components: { verbal: false, somatic: false, material: false, materials: '' },
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

// Step 1: Create remaining spell stubs
console.log('=== Creating remaining spell stubs ===');
let created = 0;
let skipped = 0;

for (const spell of MORE_MISSING_SPELLS) {
  const mdxPath = join(SPELLS_DIR, `${spell}.mdx`);
  const metaPath = join(SPELLS_DIR, `${spell}.metadata.json`);

  if (existsSync(mdxPath)) {
    console.log(`  SKIP (exists): ${spell}.mdx`);
    skipped++;
    continue;
  }

  if (DRY_RUN) {
    console.log(`  [DRY RUN] Would create: ${spell}.mdx`);
  } else {
    writeFileSync(mdxPath, stubMdxWithH1(spell));
    writeFileSync(metaPath, stubMetadataJson(spell));
    console.log(`  CREATED: ${spell}.mdx`);
  }
  created++;
}
console.log(`${DRY_RUN ? 'Would create' : 'Created'} ${created} spell(s), skipped ${skipped}.`);

// Step 2: Fix H1 in all existing stubs (files with "TODO: This is an auto-generated stub")
console.log('\n=== Fixing H1 in existing stubs ===');
function walkDir(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walkDir(full, files);
    } else if (entry.endsWith('.mdx')) {
      files.push(full);
    }
  }
  return files;
}

const DIRS_TO_FIX = [
  'src/content/en/spells',
  'src/content/en/conditions',
  'src/content/en/items/equipment',
  'src/content/en/character-creation/feats',
  'src/content/en/rules/life-blood-and-ruin/illnesses',
  'src/content/en/rules/tales-tests-and-tropes',
  'src/content/en/rules/steel-and-strife',
];

let h1Fixed = 0;
for (const dir of DIRS_TO_FIX) {
  if (!existsSync(dir)) continue;
  const files = walkDir(dir);
  for (const file of files) {
    const content = readFileSync(file, 'utf8');
    // Only fix stubs that lack H1
    if (!content.includes('auto-generated stub') &&
        !content.includes('TODO: Author content for') &&
        !content.includes('<TODO: Author')) continue;
    if (/^#\s/m.test(content)) continue; // already has H1, skip

    // Extract title from frontmatter
    const fmMatch = content.match(/^---\ntitle:\s*"(.+)"\n---/m);
    const title = fmMatch ? fmMatch[1] : path.basename(file, '.mdx');

    const fixed = content.replace(
      /^(---\n[\s\S]*?\n---)\n/,
      `$1\n# ${title}\n\n`,
    );

    if (DRY_RUN) {
      console.log(`  [DRY RUN] Would add H1: ${file}`);
    } else {
      writeFileSync(file, fixed);
      console.log(`  ADDED H1: ${file}`);
    }
    h1Fixed++;
  }
}
console.log(`${DRY_RUN ? 'Would fix' : 'Fixed'} ${h1Fixed} H1 heading(s).`);

if (DRY_RUN) {
  console.log('\nRun without --dry-run to apply changes.');
}
