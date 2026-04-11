/**
 * Adds content-type double-extension suffixes to MDX files.
 *
 * @fileoverview Renames content files following the double-extension convention:
 *   - `berserker.mdx` → `berserker.specialization.mdx`
 *   - `spells.mdx` → `spells.list.mdx`
 *   - `bilupine.mdx` → `bilupine.bloodline.mdx`
 *   - `the-sunken-city.mdx` → `the-sunken-city.lore.mdx`
 *
 * Suffix assignment rules (evaluated in priority order):
 *   1. Spell list files (`spells.mdx` in vocation dirs) → `.list`
 *   2. Remaining vocation subfiles → `.specialization`
 *   3. Bloodline files → `.bloodline`
 *   4. World lore files → `.lore`
 *
 * Skips `main.mdx` files and any file already carrying a double extension.
 * Also renames co-located `.metadata.json` sidecars when present.
 *
 * @module scripts/content/addContentSuffixes
 * @author Typeir
 * @version 1.0.0
 * @since 3.0.0
 *
 * @example
 * ```bash
 * npx tsx scripts/content/addContentSuffixes.ts --dry   # preview only
 * npx tsx scripts/content/addContentSuffixes.ts          # apply renames
 * ```
 */

import { createLogger } from '@/lib/logging/logger';
import fs from 'fs';
import path from 'path';

import { hasFlag } from '../core/cliArgs';

const log = createLogger({ script: 'addContentSuffixes' });

const CONTENT_ROOT = path.resolve('src', 'content');
const DRY_RUN = hasFlag('dry');

/**
 * A single file rename operation with its target suffix.
 *
 * @property {string} from - Absolute path of the original file
 * @property {string} to - Absolute path after renaming
 * @property {string} suffix - The content-type suffix applied (e.g. `.specialization`)
 */
interface RenameEntry {
  from: string;
  to: string;
  suffix: string;
}

/**
 * Checks whether a filename already carries a recognized double extension.
 *
 * @param {string} filename - Filename to test (e.g. `berserker.specialization.mdx`)
 * @returns {boolean} True when the file already has a content-type suffix
 */
function hasContentSuffix(filename: string): boolean {
  return /\.(sheet|specialization|list|heirloom|trinket|bloodline|lore)\.mdx$/.test(
    filename,
  );
}

/**
 * Inserts a suffix before the `.mdx` extension.
 *
 * @param {string} filePath - Absolute file path ending in `.mdx`
 * @param {string} suffix - Suffix to insert (e.g. `.specialization`)
 * @returns {string} Path with suffix inserted before `.mdx`
 */
function insertSuffix(filePath: string, suffix: string): string {
  return filePath.replace(/\.mdx$/, `${suffix}.mdx`);
}

/**
 * Collects rename entries for all vocation subfiles in a locale directory.
 * Assigns `.list` or `.specialization` based on file identity.
 *
 * @param {string} localeDir - Absolute path to a locale content root (e.g. `src/content/en`)
 * @param {RenameEntry[]} results - Accumulator array for rename entries
 */
function collectVocationRenames(
  localeDir: string,
  results: RenameEntry[],
): void {
  const vocationsDir = path.join(localeDir, 'character-creation', 'vocations');
  if (!fs.existsSync(vocationsDir)) return;

  const vocationDirs = fs
    .readdirSync(vocationsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  for (const voc of vocationDirs) {
    const vocDir = path.join(vocationsDir, voc);
    const files = fs.readdirSync(vocDir).filter((f) => f.endsWith('.mdx'));

    for (const file of files) {
      if (file === 'main.mdx' || hasContentSuffix(file)) continue;

      const baseName = file.replace(/\.mdx$/, '');
      const fullPath = path.join(vocDir, file);

      const suffix = baseName === 'spells' ? '.list' : '.specialization';

      results.push({
        from: fullPath,
        to: insertSuffix(fullPath, suffix),
        suffix,
      });
    }
  }
}

/**
 * Collects rename entries for bloodline files (top-level only, excludes subdirectories).
 *
 * @param {string} localeDir - Absolute path to a locale content root
 * @param {RenameEntry[]} results - Accumulator array for rename entries
 */
function collectBloodlineRenames(
  localeDir: string,
  results: RenameEntry[],
): void {
  const bloodlinesDir = path.join(
    localeDir,
    'character-creation',
    'bloodlines',
  );
  if (!fs.existsSync(bloodlinesDir)) return;

  const files = fs.readdirSync(bloodlinesDir).filter((f) => f.endsWith('.mdx'));

  for (const file of files) {
    if (file === 'main.mdx' || hasContentSuffix(file)) continue;

    const fullPath = path.join(bloodlinesDir, file);
    results.push({
      from: fullPath,
      to: insertSuffix(fullPath, '.bloodline'),
      suffix: '.bloodline',
    });
  }
}

/**
 * Collects rename entries for heirloom files.
 *
 * @param {string} localeDir - Absolute path to a locale content root
 * @param {RenameEntry[]} results - Accumulator array for rename entries
 */
function collectHeirloomRenames(
  localeDir: string,
  results: RenameEntry[],
): void {
  const heirloomsDir = path.join(localeDir, 'items', 'heirlooms');
  if (!fs.existsSync(heirloomsDir)) return;

  const files = fs.readdirSync(heirloomsDir).filter((f) => f.endsWith('.mdx'));

  for (const file of files) {
    if (file === 'main.mdx' || hasContentSuffix(file)) continue;

    const fullPath = path.join(heirloomsDir, file);
    results.push({
      from: fullPath,
      to: insertSuffix(fullPath, '.heirloom'),
      suffix: '.heirloom',
    });
  }
}

/**
 * Collects rename entries for trinket files.
 *
 * @param {string} localeDir - Absolute path to a locale content root
 * @param {RenameEntry[]} results - Accumulator array for rename entries
 */
function collectTrinketRenames(
  localeDir: string,
  results: RenameEntry[],
): void {
  const trinketsDir = path.join(localeDir, 'items', 'trinkets');
  if (!fs.existsSync(trinketsDir)) return;

  const files = fs.readdirSync(trinketsDir).filter((f) => f.endsWith('.mdx'));

  for (const file of files) {
    if (file === 'main.mdx' || hasContentSuffix(file)) continue;

    const fullPath = path.join(trinketsDir, file);
    results.push({
      from: fullPath,
      to: insertSuffix(fullPath, '.trinket'),
      suffix: '.trinket',
    });
  }
}

/**
 * Recursively collects rename entries for world lore files.
 *
 * @param {string} dir - Directory to scan recursively
 * @param {RenameEntry[]} results - Accumulator array for rename entries
 */
function collectLoreRenames(dir: string, results: RenameEntry[]): void {
  if (!fs.existsSync(dir)) return;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      collectLoreRenames(fullPath, results);
    } else if (
      entry.name.endsWith('.mdx') &&
      entry.name !== 'main.mdx' &&
      !hasContentSuffix(entry.name)
    ) {
      results.push({
        from: fullPath,
        to: insertSuffix(fullPath, '.lore'),
        suffix: '.lore',
      });
    }
  }
}

/**
 * Renames an MDX file and its co-located `.metadata.json` sidecar if present.
 *
 * @param {RenameEntry} entry - The rename operation to execute
 */
function renameWithMetadata(entry: RenameEntry): void {
  fs.renameSync(entry.from, entry.to);

  const oldMeta = entry.from.replace(/\.mdx$/, '.metadata.json');
  if (fs.existsSync(oldMeta)) {
    const newMeta = entry.to.replace(/\.mdx$/, '.metadata.json');
    fs.renameSync(oldMeta, newMeta);
    log.message('📦 Renamed metadata', {
      from: path.basename(oldMeta),
      to: path.basename(newMeta),
    });
  }
}

/**
 * Entry point — collects all rename targets across content types and applies them.
 */
function main(): void {
  const allRenames: RenameEntry[] = [];
  const localeDir = path.join(CONTENT_ROOT, 'en');

  if (!fs.existsSync(localeDir)) {
    log.error('Content directory not found', { path: localeDir });
    process.exit(1);
  }

  collectVocationRenames(localeDir, allRenames);
  collectBloodlineRenames(localeDir, allRenames);
  collectHeirloomRenames(localeDir, allRenames);
  collectTrinketRenames(localeDir, allRenames);
  collectLoreRenames(path.join(localeDir, 'world'), allRenames);

  const bySuffix: Record<string, RenameEntry[]> = {};
  for (const r of allRenames) {
    (bySuffix[r.suffix] ??= []).push(r);
  }

  log.message(`📁 Content suffix rename: ${allRenames.length} files`);
  log.message(`   Mode: ${DRY_RUN ? '🔍 DRY RUN' : '✏️  APPLY'}`);

  for (const [suffix, entries] of Object.entries(bySuffix)) {
    log.message(`\n  ${suffix} (${entries.length} files)`);
    for (const e of entries) {
      const rel = path.relative(CONTENT_ROOT, e.from);
      log.message(`    ${rel} → ${path.basename(e.to)}`);
    }
  }

  if (DRY_RUN) {
    log.message('\n🔍 Dry run complete. No files renamed.');
    return;
  }

  let renamed = 0;
  for (const entry of allRenames) {
    renameWithMetadata(entry);
    renamed++;
  }

  log.message(`\n✅ Renamed ${renamed} files.`);
}

main();
