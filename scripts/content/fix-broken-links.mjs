/**
 * Fixes broken library links in MDX source files by updating them to
 * point to the correct Damocles content. Does NOT create stub files.
 *
 * Run: node scripts/content/fix-broken-links.mjs [--dry-run]
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, extname, dirname } from 'path';

const DRY_RUN = process.argv.includes('--dry-run');

// Mapping: broken link slug → correct slug (within same content type)
// For spells, these are Damocles renames or slug corrections.
const SPELL_RENAMES = {
  // Wall → Barrier renames
  'wall-of-fire': 'burning-barrier',
  'wall-of-stone': 'basalt-barrier',
  'wall-of-water': 'brine-barrier',
  'wind-wall': 'breeze-barrier',
  'wall-of-light': 'blinding-barrier',
  'wall-of-force': 'mental-barrier',
  'wall-of-sand': 'breeze-barrier',

  // Apostrophe/slug fixes (missing or misplaced apostrophe)
  "crusader-s-mantle": 'crusaders-mantle',
  "dragon-s-breath": 'dragons-breath',
  "evard-s-black-tentacles": 'evards-black-tentacles',
  "tasha-s-hideous-laughter": "tasha's-hideous-laughter",
  "tasha's-hideous-laughter": "tasha's-hideous-laughter",
  "bigby-s-hand": 'burning-hands',
  "bigbys-hand": 'burning-hands',

  // Spelling corrections
  'maximilians-earthen-grasp': 'maximillians-earthen-grasp',

  // Shortened names → full Damocles names
  'black-tentacles': 'evards-black-tentacles',
  'chill-touch': 'chill',
  'gust': 'gust-of-wind',
  'light': 'dancing-lights',
  'fire-bolt': 'burning-bolts',

  // Close thematic matches (SRD → Damocles)
  'arms-of-hadar': 'hunger-of-hadar',
  'commune': 'commune-with-nature',
  'divine-smite': 'blinding-smite',
  'globe-of-invulnerability': 'invulnerability',
  'spirit-shroud': 'spirit-guardians',
  'fireball': 'delayed-blast-fireball',
  'create-or-destroy-water': 'water-breathing',
  'dark-star': 'darkness',
  'melfs-acid-arrow': 'acid-stream',
  'sacred-flame': 'flame-strike',
  'lost-in-the-folds': 'lost-in-the-muck',
  'friends': 'fast-friends',
  'blade-burst': 'blade-barrier',
  'contact-other-plane': 'otherworldly-form',
  'pyrotechnics': 'pyromancy',
  'rary-s-telepathic-bond': 'warding-bond',
  'snillocs-snowball-swarm': 'opaline-swarm',
  'starry-wisp': 'dancing-lights',
  'thunderclap': 'destructive-wave',
  'vicious-mockery': 'antagonize',
};

// Non-spell link fixes
const OTHER_FIXES = {
  // Rules file renames
  '/en/library/rules/life-blood-and-ruin/healing-recovery-and-death':
    '/en/library/rules/life-blood-and-ruin/healing-restoration-and-death',
};

/**
 * Walk all MDX files recursively.
 */
function walkMdx(dir, files = []) {
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walkMdx(full, files);
    } else if (entry.endsWith('.mdx')) {
      files.push(full);
    }
  }
  return files;
}

let totalFixed = 0;
const contentFiles = walkMdx('src/content/en');

for (const file of contentFiles) {
  let content = readFileSync(file, 'utf8');
  let changed = false;

  // Fix spell links
  for (const [broken, correct] of Object.entries(SPELL_RENAMES)) {
    // Match markdown links: [text](/en/library/spells/broken)
    const mdRegex = new RegExp(
      `(\\[([^\\]]*)\\]\\(/en/library/spells/)${broken.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&')}(\\)|#[^)]*\\))`,
      'g'
    );
    if (mdRegex.test(content)) {
      content = content.replace(mdRegex, `$1${correct}$3`);
      changed = true;
    }

    // Match href links: href="/en/library/spells/broken"
    const hrefRegex = new RegExp(
      `(href\\s*=\\s*["']/en/library/spells/)${broken.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&')}(["'])`,
      'g'
    );
    if (hrefRegex.test(content)) {
      content = content.replace(hrefRegex, `$1${correct}$2`);
      changed = true;
    }
  }

  // Fix other non-spell links
  for (const [broken, correct] of Object.entries(OTHER_FIXES)) {
    if (content.includes(broken)) {
      content = content.replace(new RegExp(broken.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&'), 'g'), correct);
      changed = true;
    }
  }

  if (changed) {
    const rel = file.replace(/\\/g, '/');
    console.log(`${DRY_RUN ? '[DRY RUN] ' : ''}Fixed: ${rel}`);
    totalFixed++;
    if (!DRY_RUN) writeFileSync(file, content);
  }
}

console.log(`\n${DRY_RUN ? 'Would fix' : 'Fixed'} ${totalFixed} file(s).`);
if (DRY_RUN) console.log('Run without --dry-run to apply changes.');
