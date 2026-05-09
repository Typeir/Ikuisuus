/**
 * @fileoverview Feat Metadata Generator
 * @description Parses plain `.mdx` files in `src/content/{locale}/character-creation/feats/`
 * and emits `.metadata.json` sidecars consumed by `/api/feats`. Excludes
 * `main.mdx` and any files under `fighting-styles/` (treated as a sub-index).
 *
 * Extracted fields: title, slug, description, prerequisite line, ability score
 * increase ("Increase your **X score by N**" / "Increase your X or Y score by
 * N"), and derived gameplay tags via the shared `extractAllTags` utility.
 *
 * @module scripts/metadata/generateFeatMetadata
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { createLogger } from '@/lib/logging/logger';
import { promises as fs } from 'fs';
import path from 'path';
import {
    extractAllTags,
    filePathToSlug,
    parseDescription,
    parseTitle,
    runGenerator,
    runWithCli,
    type SharedData,
    type StorageAdapter,
} from '.';
import { SLUG } from './parsingPatterns';

const log = createLogger({ component: 'FeatMetadataGenerator' });

/**
 * Map of long-form ability names to canonical short keys used elsewhere in the
 * codebase (`abilityScores: { str, dex, con, int, wis, cha }`).
 */
const ABILITY_NAME_MAP: Record<string, string> = {
  strength: 'str',
  dexterity: 'dex',
  constitution: 'con',
  intelligence: 'int',
  wisdom: 'wis',
  charisma: 'cha',
};

/**
 * Regex matching a prerequisite line such as
 * `_Prerequisite: **Great Weapon Fighting** style_` or
 * `_No attribute prerequisite._`. The italics wrapper is required.
 */
const PREREQUISITE_REGEX = /_([^_\n]*?prerequisite[^_\n]*?)_/i;

/**
 * Regex matching ability score increase lines.
 * Examples (case-insensitive):
 *   "Increase your **Strength score by 1**"
 *   "Increase your **Strength or Dexterity score by 1**"
 *   "Increase your Strength score by 1, to a maximum of 20"
 */
const ABILITY_INCREASE_REGEX =
  /increase your\s+\**\s*([A-Za-z][A-Za-z\s,or]*?)\s+score\s+by\s+(\d+)\s*\**(?:,\s*to a maximum of\s+\**\s*(\d+))?/i;

/**
 * Parses a prerequisite line into raw text + boolean flag.
 *
 * @param {string} raw - Full MDX file content
 * @returns {{ prerequisite?: string; hasPrerequisite: boolean }} Parsed result
 */
function parsePrerequisite(raw: string): {
  prerequisite?: string;
  hasPrerequisite: boolean;
} {
  const match = raw.match(PREREQUISITE_REGEX);
  if (!match) return { hasPrerequisite: false };

  const text = match[1].trim();
  const isNone = /no attribute prerequisite|no prerequisite/i.test(text);
  return {
    prerequisite: text,
    hasPrerequisite: !isNone,
  };
}

/**
 * Parses an ability score increase line.
 *
 * @param {string} raw - Full MDX file content
 * @returns {object | undefined} Parsed structure or undefined when none found
 */
function parseAbilityIncrease(
  raw: string,
): { abilities: string[]; amount: number; maximum?: number } | undefined {
  const match = raw.match(ABILITY_INCREASE_REGEX);
  if (!match) return undefined;

  const abilitiesRaw = match[1]
    .replace(/\*+/g, '')
    .toLowerCase()
    .split(/\s*,\s*|\s+or\s+|\s+and\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const abilities: string[] = [];
  for (const name of abilitiesRaw) {
    const key = ABILITY_NAME_MAP[name];
    if (key && !abilities.includes(key)) abilities.push(key);
  }
  if (abilities.length === 0) return undefined;

  const amount = Number.parseInt(match[2], 10);
  if (!Number.isFinite(amount)) return undefined;

  const maximum = match[3] ? Number.parseInt(match[3], 10) : undefined;
  return {
    abilities,
    amount,
    maximum:
      maximum !== undefined && Number.isFinite(maximum) ? maximum : undefined,
  };
}

/**
 * Parses a single feat MDX file into a metadata record. Returns `null` for
 * excluded files (`main.mdx`, files under `fighting-styles/`).
 *
 * @param {string} filePath - Absolute path to the MDX file
 * @param {SharedData} sharedData - Shared game data
 * @returns {Promise<object | null>} Metadata record or null when excluded
 */
async function parseFeatFile(
  filePath: string,
  sharedData: SharedData,
): Promise<object | null> {
  const baseName = path.basename(filePath);
  if (baseName === 'main.mdx') return null;
  const normalisedPath = filePath.replace(/\\/g, '/');
  if (normalisedPath.includes('/feats/fighting-styles/')) return null;

  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    const lines = raw.split('\n').map((l) => l.trim());
    const slug = filePathToSlug(filePath);
    const title = parseTitle(lines);
    const description = parseDescription(raw);

    const { prerequisite, hasPrerequisite } = parsePrerequisite(raw);
    const abilityIncrease = parseAbilityIncrease(raw);
    const tags = Array.from(
      new Set(
        extractAllTags(raw, filePath, sharedData, {
          contentType: 'generic',
        }),
      ),
    ).sort();

    const metadata: Record<string, unknown> = {
      slug,
      title,
      file: path
        .relative(process.cwd(), filePath)
        .replace(SLUG.pathBackslash, '/'),
      link: `/library/character-creation/feats/${slug}`,
      hasPrerequisite,
      tags,
      indexVersion: 1,
    };

    if (description) metadata.description = description;
    if (prerequisite) metadata.prerequisite = prerequisite;
    if (abilityIncrease) metadata.abilityIncrease = abilityIncrease;

    return metadata;
  } catch (error) {
    log.warning('Error parsing feat file', {
      file: filePath,
      error: (error as Error).message,
    });
    return null;
  }
}

/**
 * Main entry point for feat metadata generation.
 *
 * @param {object} [options] - Configuration
 * @param {string} [options.contentDir] - Override content directory
 * @param {RegExp} [options.filePattern] - Override file pattern
 * @param {StorageAdapter} [options.storage] - Optional DB storage
 * @returns {Promise<void>}
 */
async function main(
  options: {
    contentDir?: string;
    filePattern?: RegExp;
    storage?: StorageAdapter;
  } = {},
): Promise<void> {
  await runGenerator({
    name: 'Feat Metadata Generator',
    contentType: 'feats',
    filePattern: options.filePattern || /\.mdx$/,
    parseFile: parseFeatFile,
    processResult: (result) => {
      if (result === null) return { metadata: null, count: 0 };
      return { metadata: result, count: 1 };
    },
    contentDir: options.contentDir,
    storage: options.storage,
    metadataVersion: '1.0.0',
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runWithCli(main).catch((error) => {
    log.error('Fatal error during feat metadata generation', {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    process.exit(1);
  });
}

export { main, parseFeatFile };

