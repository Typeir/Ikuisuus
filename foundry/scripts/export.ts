/**
 * @fileoverview Foundry VTT monster compendium export orchestrator.
 * @description Reads monster metadata and MDX content from the Ikuisuus content
 * directory, transforms each monster into a dnd5e NPC Actor JSON document, and
 * writes the results to foundry/packs/_source/monsters/ for compendium packing.
 *
 * Run via: npx tsx --tsconfig tsconfig.scripts.json foundry/scripts/export.ts
 *
 * @module foundry/scripts/export
 * @version 1.0.0
 * @author Typeir
 * @since 2026-04-12
 *
 * @see {@link transformMonster} for the NPC Actor mapping logic
 * @see {@link discoverMetadataFiles} for file discovery
 * @see {@link exportMonsters} for the main orchestration entry
 */

import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { MonsterMetadata } from '../../src/lib/db/content/schemas/monsterMetadata';
import type { MonsterFeature } from '../../src/lib/types/feature';
import { ParserRegistry } from './handlers/registry';
import { YskeiaParser } from './parsers/yskeiaParser';
import { transformFeature } from './transformers/featureTransformer';
import { transformMonster } from './transformers/monsterTransformer';
import { populateFeatureDescriptions } from './utils/mdxToHtml';
import {
  bundleImages,
  DEFAULT_TOKEN_FILENAME,
  generateTokens,
} from './utils/tokenGenerator';

/**
 * Monster metadata record with features appended by the feature generator.
 *
 * @property {MonsterFeature[]} [features] - Extracted features from the stat block
 */
interface MonsterMetadataWithFeatures extends MonsterMetadata {
  features?: MonsterFeature[];
}

/** Module ID used in Foundry asset paths. */
const MODULE_ID = 'ikuisuus-damocles';
const MODULE_IMG_PREFIX = `modules/${MODULE_ID}/assets/images`;
const MODULE_TOKEN_PREFIX = `modules/${MODULE_ID}/assets/tokens`;

/** Workspace root directory. */
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

const MONSTERS_DIR = join(ROOT, 'src/content/en/monsters');
const META_DIR = join(ROOT, '.meta/en/monsters');
const OUTPUT_DIR = join(ROOT, 'foundry/packs/_source/monsters');
const ASSETS_IMG_DIR = join(ROOT, 'foundry/assets/images');
const PUBLIC_IMG_DIR = join(ROOT, 'public/library/images');
const FRAME_PATH = join(ROOT, 'foundry/assets/frames/frame.png');
const TOKENS_DIR = join(ROOT, 'foundry/assets/tokens');

/**
 * Discovers all metadata JSON files, preferring .meta/ (pg backend) over
 * source-adjacent files.
 *
 * @returns {string[]} Absolute paths to metadata files
 */
function discoverMetadataFiles(): string[] {
  try {
    const metaFiles = readdirSync(META_DIR)
      .filter((f) => f.endsWith('.metadata.json'))
      .map((f) => join(META_DIR, f));
    if (metaFiles.length > 0) return metaFiles;
  } catch {
    /* .meta/ may not exist — fall back to source-adjacent */
  }
  return readdirSync(MONSTERS_DIR)
    .filter((f) => f.endsWith('.metadata.json'))
    .map((f) => join(MONSTERS_DIR, f));
}

/**
 * Rewrites image paths to module-relative Foundry paths.
 * Images are bundled flat into assets/images/, so only the filename is used.
 *
 * @param {string} imgPath - Original image path from metadata (e.g. /library/images/monsters/foo.webp)
 * @returns {string} Module-relative path
 */
function toModuleImgPath(imgPath: string): string {
  return `${MODULE_IMG_PREFIX}/${basename(imgPath)}`;
}

/**
 * Rewrites all `/library/images/...` references in HTML to module-relative flat paths.
 * Strips any subdirectory since images are bundled flat into assets/images/.
 *
 * @param {string} html - Biography HTML string
 * @returns {string} HTML with rewritten image paths
 */
function rewriteBiographyImages(html: string): string {
  return html.replace(/\/library\/images\/(?:[^/"']*\/)?([^/"']+)/g, `${MODULE_IMG_PREFIX}/$1`);
}

/**
 * Exports all monsters to Foundry VTT compendium source JSON files.
 */
async function exportMonsters(): Promise<void> {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const registry = new ParserRegistry([
    YskeiaParser as unknown as new () => InstanceType<typeof YskeiaParser>,
  ]);

  const metadataFiles = discoverMetadataFiles();
  let totalActors = 0;
  let totalItems = 0;
  let errors = 0;
  const referencedImages = new Set<string>();

  process.stdout.write(
    `Found ${metadataFiles.length} metadata files in ${MONSTERS_DIR}\n`,
  );

  for (const metaPath of metadataFiles) {
    const slug = basename(metaPath, '.metadata.json');

    try {
      const raw = readFileSync(metaPath, 'utf-8');
      const records: MonsterMetadataWithFeatures[] = JSON.parse(raw);
      const monsters = Array.isArray(records) ? records : [records];

      const mdxPath = join(ROOT, monsters[0].file);
      const mdxContent = readFileSync(mdxPath, 'utf-8');

      for (const monster of monsters) {
        const actor = await transformMonster(monster, mdxContent);

        if (monster.image && monster.image.startsWith('/library/images/')) {
          actor.img = toModuleImgPath(monster.image);
          referencedImages.add(monster.image.replace(/^\/library\/images\//, ''));
        }

        const bio = (actor.system as any)?.details?.biography;
        if (bio?.value) {
          bio.value = rewriteBiographyImages(bio.value);
        }

        const features = monster.features ?? [];
        await populateFeatureDescriptions(features, mdxContent);
        const items = features.map((f, i) =>
          transformFeature(f, registry, actor._id, i),
        );
        for (const item of items) {
          (item as Record<string, unknown>)._key =
            `!actors.items!${actor._id}.${item._id}`;
        }
        (actor as Record<string, unknown>).items = items;
        totalItems += items.length;

        const outPath = join(OUTPUT_DIR, `${actor._id}.json`);
        writeFileSync(outPath, JSON.stringify(actor, null, 2), 'utf-8');
        totalActors++;
        const handledCount = features.filter((f) => registry.has(f.id)).length;
        process.stdout.write(
          `  ${monster.title} -> ${actor._id}.json (${items.length} items, ${handledCount} with handlers)\n`,
        );
      }
    } catch (err) {
      errors++;
      const msg = err instanceof Error ? err.message : String(err);
      process.stderr.write(`  ERROR ${slug}: ${msg}\n`);
    }
  }

  bundleImages(referencedImages, PUBLIC_IMG_DIR, ASSETS_IMG_DIR);
  const tokenMap = await generateTokens(
    referencedImages,
    ASSETS_IMG_DIR,
    FRAME_PATH,
    TOKENS_DIR,
  );

  for (const metaPath of metadataFiles) {
    try {
      const raw = readFileSync(metaPath, 'utf-8');
      const records: MonsterMetadata[] = JSON.parse(raw);
      const monsters = Array.isArray(records) ? records : [records];

      for (const monster of monsters) {
        const idSlug = monster.subSlug ?? monster.slug;
        const { generateFoundryId } = await import('./utils/idGenerator');
        const actorId = generateFoundryId(idSlug, 'monster');
        const actorPath = join(OUTPUT_DIR, `${actorId}.json`);

        if (!existsSync(actorPath)) continue;
        const actor = JSON.parse(readFileSync(actorPath, 'utf-8'));

        let tokenFilename: string | undefined;
        if (monster.image) {
          const imgFilename = basename(monster.image);
          tokenFilename = tokenMap.get(imgFilename);
        }

        actor.prototypeToken.texture = {
          src: `${MODULE_TOKEN_PREFIX}/${tokenFilename ?? DEFAULT_TOKEN_FILENAME}`,
        };
        writeFileSync(actorPath, JSON.stringify(actor, null, 2), 'utf-8');
      }
    } catch {
      /* skip — errors already logged in first pass */
    }
  }

  process.stdout.write(
    `\nExport complete: ${totalActors} actors, ${totalItems} items, ${errors} errors\n`,
  );

  if (errors > 0) {
    process.exit(1);
  }
}

exportMonsters();
