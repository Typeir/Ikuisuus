/**
 * @fileoverview Feat Metadata Generator
 * @description Parses plain `.mdx` files in `src/content/{locale}/character-creation/feats/`
 * and emits `.metadata.json` sidecars consumed by `/api/feats`. Excludes
 * `main.mdx` and files under `fighting-styles/`.
 *
 * Extracts: title, slug, description, prerequisite line, ability score
 * increase, named mechanic features (bold bullets), and derived gameplay tags
 * via the shared `extractAllTags` utility.
 *
 * @module scripts/metadata/generateFeatMetadata
 * @version 1.1.0
 * @author Typeir
 * @since 1.0.0
 */

import { createLogger } from '@/lib/logging/logger';
import { promises as fs } from 'fs';
import matter from 'gray-matter';
import path from 'path';
import {
    blankFrontmatter,
    extractAllTags,
    filePathToSlug,
    parseDescription,
    parseTitle,
    runGenerator,
    runWithCli,
    type SharedData,
    type StorageAdapter,
} from '.';
import { extractFeatureGrants } from './extraction/grantsExtractor';
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
 *   "Increase your Strength score by 1"
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
 * Removes the italic prerequisite line from a parsed description.
 * {@link parseDescription}'s italic-only filter misses prerequisite lines that
 * embed bold (e.g. `_Prerequisite: **Great Weapon Fighting** style_`).
 *
 * @param {string | undefined} description - Parsed description prose
 * @returns {string | undefined} Description without the prerequisite line, or undefined when empty
 */
function stripPrerequisiteLine(
  description: string | undefined,
): string | undefined {
  if (!description) return undefined;
  const joined = description
    .split('\n')
    .filter((line) => !PREREQUISITE_REGEX.test(line))
    .join('\n')
    .trim();
  return joined.length > 0 ? joined : undefined;
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
 * Regex matching bold-bullet feature lines such as
 * `- **Obliterating Strike.** Your attacks deal...`
 */
const FEATURE_BULLET_REGEX = /^[-*+]\s+\*\*([^*]+)\.\*\*/;

/**
 * Walk forward from `startIdx` to find the last line belonging to this
 * feature's bullet block. The block ends when a new top-level bullet, a
 * Markdown heading, or a thematic break is encountered. Trailing blank lines
 * are excluded.
 *
 * @param {string[]} lines - All lines in the file (0-indexed)
 * @param {number} startIdx - 0-based index of the feature's opening bullet line
 * @returns {number} 0-based index of the last content line of this block
 */
function findFeatureEndIdx(lines: string[], startIdx: number): number {
  let endIdx = startIdx;
  for (let i = startIdx + 1; i < lines.length; i++) {
    const l = lines[i];
    if (/^[-*+]\s/.test(l) || /^#{1,6}\s/.test(l) || /^---/.test(l)) break;
    endIdx = i;
  }
  while (endIdx > startIdx && lines[endIdx].trim() === '') endIdx--;
  return endIdx;
}

/**
 * Parse all named-mechanic features from the raw MDX source.
 * Each feature maps to a bold-bullet item `- **Name.** description`.
 *
 * @param {string} raw - Full MDX file content
 * @param {string} filePath - Absolute path (used for tag extraction context)
 * @param {SharedData} sharedData - Shared game data for tag extraction
 * @returns {Array<{ name: string; startLine: number; endLine: number; tags: string[] }>}
 */
function parseFeatures(
  raw: string,
  filePath: string,
  sharedData: SharedData,
): Array<{ name: string; startLine: number; endLine: number; tags: string[] }> {
  const lines = raw.split('\n');
  const features: Array<{
    name: string;
    startLine: number;
    endLine: number;
    tags: string[];
  }> = [];

  for (let i = 0; i < lines.length; i++) {
    const match = FEATURE_BULLET_REGEX.exec(lines[i]);
    if (!match) continue;
    const name = match[1].trim();
    const endIdx = findFeatureEndIdx(lines, i);
    const blockText = lines.slice(i, endIdx + 1).join('\n');
    const tags = Array.from(
      new Set(
        extractAllTags(blockText, filePath, sharedData, {
          contentType: 'generic',
        }),
      ),
    ).sort();
    features.push({ name, startLine: i + 1, endLine: endIdx + 1, tags });
  }

  return features;
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
    const body = blankFrontmatter(raw);
    const lines = body.split('\n').map((l) => l.trim());
    const slug = filePathToSlug(filePath);
    const title = parseTitle(lines);
    const description = stripPrerequisiteLine(parseDescription(body));

    const { prerequisite, hasPrerequisite } = parsePrerequisite(body);
    const abilityIncrease = parseAbilityIncrease(body);
    const features = parseFeatures(body, filePath, sharedData);

    const frontmatter = matter(raw).data as Record<string, unknown>;
    const frontmatterGrants = frontmatter.grants ?? frontmatter.Grants;
    const grantsMap = Array.isArray(frontmatterGrants)
      ? { [title]: frontmatterGrants as string[] }
      : (frontmatterGrants as Record<string, string[]> | undefined);
    const grants = extractFeatureGrants(title, body, grantsMap);
    const multiSelect = frontmatter.multiSelect === true;
    const tagSet = new Set(
      extractAllTags(raw, filePath, sharedData, {
        contentType: 'generic',
      }),
    );
    if (multiSelect) tagSet.add('multi-select');
    const tags = Array.from(tagSet).sort();

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
    if (features.length > 0) metadata.features = features;
    if (grants.length > 0) metadata.grants = grants;
    if (multiSelect) metadata.multiSelect = true;

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
    metadataVersion: '1.1.0',
  });
}

if (
  import.meta.url === `file://${process.argv[1]}` ||
  import.meta.url === new URL(`file://${process.argv[1]}`).href
) {
  runWithCli(main).catch((error) => {
    log.error('Fatal error during feat metadata generation', {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    process.exit(1);
  });
}

export { main, parseFeatFile };

