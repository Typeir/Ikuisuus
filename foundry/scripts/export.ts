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

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join, resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { MonsterMetadata } from '../../src/lib/db/content/schemas/monsterMetadata';
import { transformMonster } from './transformers/monsterTransformer';

/** Workspace root directory. */
const __filename = fileURLToPath(import.meta.url);
const ROOT = resolve(dirname(__filename), '../..');

/** Source directory for monster content (MDX files). */
const MONSTERS_DIR = join(ROOT, 'src/content/en/monsters');

/** Directory for generated metadata (pg backend writes here). */
const META_DIR = join(ROOT, '.meta/en/monsters');

/** Output directory for compendium source JSON. */
const OUTPUT_DIR = join(ROOT, 'foundry/packs/_source/monsters');

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
  } catch { /* .meta/ may not exist — fall back to source-adjacent */ }
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
 * Exports all monsters to Foundry VTT compendium source JSON files.
 */
async function exportMonsters(): Promise<void> {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const metadataFiles = discoverMetadataFiles();
  let totalActors = 0;
  let errors = 0;

  process.stdout.write(`Found ${metadataFiles.length} metadata files in ${MONSTERS_DIR}\n`);

  for (const metaPath of metadataFiles) {
    const slug = basename(metaPath, '.metadata.json');

    try {
      const raw = readFileSync(metaPath, 'utf-8');
      const records: MonsterMetadata[] = JSON.parse(raw);
      const monsters = Array.isArray(records) ? records : [records];

      const mdxPath = resolveMdxPath(monsters[0]);
      const mdxContent = readFileSync(mdxPath, 'utf-8');

      for (const monster of monsters) {
        const actor = await transformMonster(monster, mdxContent);
        const outPath = join(OUTPUT_DIR, `${actor._id}.json`);
        writeFileSync(outPath, JSON.stringify(actor, null, 2), 'utf-8');
        totalActors++;
        process.stdout.write(`  ${monster.title} -> ${actor._id}.json\n`);
      }
    } catch (err) {
      errors++;
      const msg = err instanceof Error ? err.message : String(err);
      process.stderr.write(`  ERROR ${slug}: ${msg}\n`);
    }
  }

  process.stdout.write(`\nExport complete: ${totalActors} actors, ${errors} errors\n`);

  if (errors > 0) {
    process.exit(1);
  }
}

exportMonsters();
