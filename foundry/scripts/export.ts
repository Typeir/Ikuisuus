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
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import type { MonsterMetadata } from '../../src/lib/db/content/schemas/monsterMetadata';
import type { MonsterFeature } from '../../src/lib/types/feature';
import { ParserRegistry } from './handlers/registry';
import { YskeiaParser } from './parsers/yskeiaParser';
import { transformFeature } from './transformers/featureTransformer';
import { transformMonster } from './transformers/monsterTransformer';

/**
 * Monster metadata record with features appended by the feature generator.
 * The base MonsterMetadata type does not include features, but the JSON
 * files on disk do after `generateFeatureMetadata` runs.
 *
 * @property {MonsterFeature[]} [features] - Extracted features from the stat block
 */
interface MonsterMetadataWithFeatures extends MonsterMetadata {
  features?: MonsterFeature[];
}

/** Module ID used in Foundry asset paths. */
const MODULE_ID = 'ikuisuus-damocles';

/** Prefix for module-relative asset paths in Foundry. */
const MODULE_IMG_PREFIX = `modules/${MODULE_ID}/assets/images`;

/** Prefix for module-relative token paths in Foundry. */
const MODULE_TOKEN_PREFIX = `modules/${MODULE_ID}/assets/tokens`;

/** Workspace root directory. */
const __filename = fileURLToPath(import.meta.url);
const ROOT = resolve(dirname(__filename), '../..');

/** Source directory for monster content (MDX files). */
const MONSTERS_DIR = join(ROOT, 'src/content/en/monsters');

/** Directory for generated metadata (pg backend writes here). */
const META_DIR = join(ROOT, '.meta/en/monsters');

/** Output directory for compendium source JSON. */
const OUTPUT_DIR = join(ROOT, 'foundry/packs/_source/monsters');

/** Output directory for bundled images. */
const ASSETS_IMG_DIR = join(ROOT, 'foundry/assets/images');

/** Source directory for WebP images (Next.js public). */
const PUBLIC_IMG_DIR = join(ROOT, 'public/library/images');

/** Frame overlay for token generation. */
const FRAME_PATH = join(ROOT, 'foundry/assets/frames/frame.png');

/** Output directory for generated token images. */
const TOKENS_DIR = join(ROOT, 'foundry/assets/tokens');

/** Token size in pixels (matches frame dimensions). */
const TOKEN_SIZE = 256;

/** Background color for token circles (fills transparency and default tokens). */
const TOKEN_BG_COLOR = '#28303b';

/** Default token filename for monsters without portraits. */
const DEFAULT_TOKEN_FILENAME = '_default.token.webp';

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
 * Resolves the MDX file path for a given monster metadata record.
 *
 * @param {MonsterMetadata} monster - Monster metadata with file path
 * @returns {string} Absolute path to the MDX file
 */
function resolveMdxPath(monster: MonsterMetadata): string {
  return join(ROOT, monster.file);
}

/**
 * Rewrites `/library/images/X.webp` paths to module-relative Foundry paths
 * and collects referenced image filenames for bundling.
 *
 * @param {string} imgPath - Original image path from metadata (e.g. "/library/images/X.webp")
 * @returns {string} Module-relative path (e.g. "modules/ikuisuus-damocles/assets/images/X.webp")
 */
function toModuleImgPath(imgPath: string): string {
  const filename = basename(imgPath);
  return `${MODULE_IMG_PREFIX}/${filename}`;
}

/**
 * Rewrites all `/library/images/` references in HTML to module-relative paths.
 *
 * @param {string} html - Biography HTML string
 * @returns {string} HTML with rewritten image paths
 */
function rewriteBiographyImages(html: string): string {
  return html.replace(/\/library\/images\//g, `${MODULE_IMG_PREFIX}/`);
}

/**
 * Copies referenced images from public/library/images/ to foundry/assets/images/.
 *
 * @param {Set<string>} imageFiles - Set of image filenames to copy
 */
function bundleImages(imageFiles: Set<string>): void {
  mkdirSync(ASSETS_IMG_DIR, { recursive: true });
  let copied = 0;
  let missing = 0;

  for (const filename of imageFiles) {
    const src = join(PUBLIC_IMG_DIR, filename);
    const dest = join(ASSETS_IMG_DIR, filename);

    if (existsSync(src)) {
      copyFileSync(src, dest);
      copied++;
    } else {
      process.stderr.write(`  WARN: Image not found: ${src}\n`);
      missing++;
    }
  }

  process.stdout.write(`Images: ${copied} copied, ${missing} missing\n`);
}

/**
 * Generates circular token images by cropping portraits to center-square,
 * clipping to a circle, and compositing the frame overlay on top.
 *
 * @param {Set<string>} imageFiles - Set of image filenames to generate tokens for
 * @returns {Promise<Map<string, string>>} Map of source filename → token filename
 */
async function generateTokens(
  imageFiles: Set<string>,
): Promise<Map<string, string>> {
  mkdirSync(TOKENS_DIR, { recursive: true });

  const frameBuffer = readFileSync(FRAME_PATH);
  const maskRadius = Math.round((TOKEN_SIZE / 2) * 0.95);
  const circleMask = Buffer.from(
    `<svg width="${TOKEN_SIZE}" height="${TOKEN_SIZE}">` +
      `<circle cx="${TOKEN_SIZE / 2}" cy="${TOKEN_SIZE / 2}" r="${maskRadius}" fill="white"/>` +
      `</svg>`,
  );

  const tokenMap = new Map<string, string>();
  let generated = 0;

  for (const filename of imageFiles) {
    const src = join(ASSETS_IMG_DIR, filename);
    if (!existsSync(src)) continue;

    const tokenFilename = filename.replace(/\.\w+$/, '.token.webp');
    const dest = join(TOKENS_DIR, tokenFilename);

    try {
      const portrait = sharp(src);
      const meta = await portrait.metadata();
      const w = meta.width ?? TOKEN_SIZE;
      const h = meta.height ?? TOKEN_SIZE;
      const cropSize = Math.min(w, h);
      const left = Math.round((w - cropSize) / 2);
      const top = Math.round((h - cropSize) * 0.15);

      const bgLayer = Buffer.from(
        `<svg width="${TOKEN_SIZE}" height="${TOKEN_SIZE}">` +
          `<rect width="${TOKEN_SIZE}" height="${TOKEN_SIZE}" fill="${TOKEN_BG_COLOR}"/>` +
          `</svg>`,
      );

      const cropped = await sharp(bgLayer)
        .composite([
          {
            input: await portrait
              .extract({
                left,
                top,
                width: cropSize,
                height: Math.min(cropSize, h - top),
              })
              .resize(TOKEN_SIZE, TOKEN_SIZE, { fit: 'cover' })
              .png()
              .toBuffer(),
            blend: 'over',
          },
          { input: circleMask, blend: 'dest-in' },
        ])
        .png()
        .toBuffer();

      await sharp(cropped)
        .composite([{ input: frameBuffer, blend: 'over' }])
        .webp({ quality: 90 })
        .toFile(dest);

      tokenMap.set(filename, tokenFilename);
      generated++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      process.stderr.write(
        `  WARN: Token generation failed for ${filename}: ${msg}\n`,
      );
    }
  }

  await generateDefaultToken(frameBuffer, circleMask);
  process.stdout.write(`Tokens: ${generated} generated (+ 1 default)\n`);
  return tokenMap;
}

/**
 * Generates a default round token with a solid background color and frame.
 * Used for monsters that have no portrait image.
 *
 * @param {Buffer} frameBuffer - Frame overlay PNG buffer
 * @param {Buffer} circleMask - Circular mask SVG buffer
 */
async function generateDefaultToken(
  frameBuffer: Buffer,
  circleMask: Buffer,
): Promise<void> {
  const dest = join(TOKENS_DIR, DEFAULT_TOKEN_FILENAME);
  const bgLayer = Buffer.from(
    `<svg width="${TOKEN_SIZE}" height="${TOKEN_SIZE}">` +
      `<rect width="${TOKEN_SIZE}" height="${TOKEN_SIZE}" fill="${TOKEN_BG_COLOR}"/>` +
      `</svg>`,
  );

  const masked = await sharp(bgLayer)
    .composite([{ input: circleMask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  await sharp(masked)
    .composite([{ input: frameBuffer, blend: 'over' }])
    .webp({ quality: 90 })
    .toFile(dest);
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

      const mdxPath = resolveMdxPath(monsters[0]);
      const mdxContent = readFileSync(mdxPath, 'utf-8');

      for (const monster of monsters) {
        const actor = await transformMonster(monster, mdxContent);

        if (monster.image && monster.image.startsWith('/library/images/')) {
          actor.img = toModuleImgPath(monster.image);
          referencedImages.add(basename(monster.image));
        }

        const bio = (actor.system as any)?.details?.biography;
        if (bio?.value) {
          bio.value = rewriteBiographyImages(bio.value);
        }

        const features = monster.features ?? [];
        const items = features.map((f) => transformFeature(f, registry));
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

  bundleImages(referencedImages);
  const tokenMap = await generateTokens(referencedImages);

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
