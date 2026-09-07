/**
 * @fileoverview Vocation Metadata Generator
 * @description Parses `main.mdx` files from each vocation subdirectory and
 * extracts core traits, feature progression, proficiency grants, optional
 * spellcasting summary, and specialization links.
 *
 * @module scripts/metadata/generateVocationMetadata
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { isIndexFile } from '@/lib/constants/content';
import { createLogger } from '@/lib/logging/logger';
import { formatDie } from '@/lib/utils/diceUtils';
import { promises as fs } from 'fs';
import matter from 'gray-matter';
import { progressionFromText } from './progressionText';
import { unslotVocation } from './vocationForms';
import path from 'path';
import {
    applyAuthoredFeatureAspects,
  stampAnchors,
    blankFrontmatter,
    extractAllTags,
    getMetaSubdir,
    parseDescription,
    parseTitle,
    runGenerator,
    runWithCli,
    type SharedData,
    type StorageAdapter,
} from '.';
import { extractFeatureGrants } from './extraction/grantsExtractor';
import { tagRangedFeatures, type RangedFeature } from './featureAspects';
import { GameData } from './gameData';
import { SLUG, TEXT } from './parsingPatterns';
import {
    parseCoreTraits,
    parseFeatureTable,
    parseFixedTrades,
    parseHitDie,
    parseProficiencies,
    parseSavingThrows,
    parseSkillProficiencies,
} from './vocationParsers';
import {
    classifyArchetype,
    classifyProgression,
    findFeatureLineRange,
    parseSpecializations,
    parseSpellcastingAbility,
} from './vocationSpellcasting';

export { parseFeatureTable } from './vocationParsers';

const log = createLogger({ component: 'VocationMetadataGenerator' });

/**
 * Generates tags for a vocation based on its properties.
 *
 * @param {Record<string, unknown>} metadata - Parsed vocation metadata
 * @param {string} raw - Raw MDX content
 * @param {SharedData} sharedData - Shared game data
 * @returns {string[]} Sorted, deduplicated tag array
 */
function buildVocationTags(
  metadata: Record<string, unknown>,
  raw: string,
  filePath: string,
  sharedData: SharedData,
): string[] {
  const tags = new Set<string>();

  tags.add(`archetype:${String(metadata.archetype).toLowerCase()}`);
  tags.add(`hit-die:${formatDie(metadata.hitDie as number)}`);

  const abilities = GameData.getAbilities(sharedData);
  const saves = metadata.savingThrows as string[];
  for (const save of saves) {
    const ability = abilities.find(
      (candidate) => candidate.long.toLowerCase() === save.toLowerCase(),
    );
    if (ability) tags.add(`save:${ability.short.toLowerCase()}`);
  }

  if (metadata.spellcasting) {
    const sc = metadata.spellcasting as {
      ability: string;
      progression: string;
    };
    tags.add(`spellcasting:${sc.progression.toLowerCase()}`);
    tags.add(`spellcasting-ability:${sc.ability.toLowerCase()}`);
  } else {
    tags.add('spellcasting:none');
  }

  const contentTags = extractAllTags(raw, filePath, sharedData);
  for (const tag of contentTags) {
    tags.add(tag);
  }

  return [...tags].sort();
}

/**
 * Parses a single vocation main.mdx file into metadata.
 *
 * @param {string} filePath - Absolute path to main.mdx
 * @param {SharedData} sharedData - Shared game data constants
 * @returns {Promise<Record<string, unknown> | null>} Parsed metadata or null
 */
async function parseVocationFile(
  filePath: string,
  sharedData: SharedData,
): Promise<Record<string, unknown> | null> {
  const baseName = path.basename(filePath);
  const parentDir = path.basename(path.dirname(filePath));
  if (!isIndexFile(baseName, parentDir)) return null;

  const grandParentDir = path.basename(path.dirname(path.dirname(filePath)));

  if (grandParentDir !== 'vocations') return null;

  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    const body = unslotVocation(blankFrontmatter(raw));
    const title = parseTitle(body.split(TEXT.lineSplit).map((l) => l.trim()));
    const slug = parentDir;

    const traits = parseCoreTraits(body);
    const description = parseDescription(body);
    const hitDie = parseHitDie(
      traits['Hit Point Die'] || traits['Hit Die'] || '',
    );
    const savingThrows = parseSavingThrows(
      traits['Saving Throw Proficiencies'] || '',
    );
    const skillProficiencies = parseSkillProficiencies(
      traits['Skill Proficiencies'] || '',
    );
    const armorProficiencies = parseProficiencies(
      traits['Armor Training'] || traits['Armor Proficiencies'] || '',
    );
    const weaponProficiencies = parseProficiencies(
      traits['Weapon Proficiencies'] || '',
    );
    const toolProficiencies = parseFixedTrades(
      traits['Trade Proficiencies'] || traits['Tool Proficiencies'] || '',
    );
    const primaryAbility = parseProficiencies(traits['Primary Ability'] || '');

    const { features, hasSpellSlots, headers } =
      progressionFromText(body) ?? parseFeatureTable(body);
    const rawLines = body.split(/\r?\n/);
    const vocationFrontmatter = matter(raw).data as Record<string, unknown>;
    const vocationGrantsRaw =
      vocationFrontmatter.grants ?? vocationFrontmatter.Grants;
    const vocationGrantsMap =
      vocationGrantsRaw &&
      !Array.isArray(vocationGrantsRaw) &&
      typeof vocationGrantsRaw === 'object'
        ? (vocationGrantsRaw as Record<string, string[]>)
        : undefined;

    const featuresWithLines = features.map((f) => {
      const range = findFeatureLineRange(rawLines, f.name);
      const prose = range
        ? rawLines.slice(range.startLine - 1, range.endLine).join('\n')
        : '';
      const grants = extractFeatureGrants(f.name, prose, vocationGrantsMap);
      const base = range ? { ...f, ...range } : f;
      return grants.length > 0 ? { ...base, grants } : base;
    });

    tagRangedFeatures(
      featuresWithLines as RangedFeature[],
      rawLines,
      sharedData,
    );
    stampAnchors(featuresWithLines as Array<{ name?: string; heading?: string }>);
    applyAuthoredFeatureAspects(
      featuresWithLines as Array<{ name?: string; heading?: string; tags?: string[] }>,
      matter(raw).data as Record<string, unknown>,
    );

    let spellcasting: { ability: string; progression: string } | undefined;
    if (hasSpellSlots) {
      const ability = parseSpellcastingAbility(body);
      const progression = classifyProgression(headers, body);
      if (ability && progression) {
        spellcasting = { ability, progression };
      }
    }

    const specializations = parseSpecializations(body);
    const archetype = classifyArchetype(spellcasting?.progression ?? null);

    const link = `/library/character-creation/vocations/${slug}/main`;
    const file = path
      .relative(process.cwd(), filePath)
      .replace(SLUG.pathBackslash, '/');

    const metadata: Record<string, unknown> = {
      slug,
      title,
      file,
      link,
      archetype,
      primaryAbility,
      hitDie,
      savingThrows,
      armorProficiencies,
      weaponProficiencies,
      toolProficiencies,
      skillProficiencies,
      spellcasting,
      specializations,
      features: featuresWithLines,
      tags: [],
      indexVersion: 1,
    };

    metadata.tags = buildVocationTags(metadata, raw, filePath, sharedData);

    if (description) {
      metadata.description = description;
    }

    log.message(`✅ Parsed vocation: ${title} (${slug})`, {
      features: features.length,
      specializations: specializations.length,
      archetype,
    });

    return metadata;
  } catch (error) {
    log.error(`Failed to parse ${filePath}`, {
      error: (error as Error).message,
    });
    return null;
  }
}

/**
 * Resolves the output path for a vocation metadata file.
 *
 * @param {string} sourceFilePath - Absolute path to main.mdx
 * @param {string} contentType - Content type key
 * @param {string} backend - 'pg' or 'fs'
 * @param {string} locale - Locale code
 * @returns {string} Absolute output path
 */
function resolveVocationOutputPath(
  sourceFilePath: string,
  contentType: string,
  locale: string,
): string {
  const parentDir = path.basename(path.dirname(sourceFilePath));
  const subdir = getMetaSubdir(contentType);
  return path.join(
    process.cwd(),
    '.meta',
    locale,
    subdir,
    `${parentDir}.metadata.json`,
  );
}

/**
 * Main entry point for vocation metadata generation.
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
    name: 'Vocation Metadata Generator',
    contentType: 'vocations',
    filePattern: options.filePattern || /\.vocation\.mdx$/,
    parseFile: parseVocationFile,
    recursive: true,
    resolveOutputPath: resolveVocationOutputPath,
    processResult: (result: any) => {
      if (result === null) return { metadata: null, count: 0 };
      return { metadata: result, count: 1 };
    },
    contentDir: options.contentDir,
    storage: options.storage,
    metadataVersion: '1.0.0',
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runWithCli(main).catch((error: any) => {
    log.error('Fatal error during vocation metadata generation', {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    process.exit(1);
  });
}

export { main, parseVocationFile };

