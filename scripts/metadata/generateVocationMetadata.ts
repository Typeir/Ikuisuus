/**
 * @fileoverview Vocation Metadata Generator
 * @description Parses `main.mdx` files from each vocation subdirectory and
 * extracts core traits, feature progression, proficiency grants, optional
 * spellcasting summary, and specialization links.
 *
 * Only targets `main.mdx` inside vocation subdirectories (e.g.
 * `vocations/barbarian/main.mdx`). The root `vocations/main.mdx` overview
 * page is excluded.
 *
 * @module scripts/metadata/generateVocationMetadata
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { createLogger } from '@/lib/logging/logger';
import { promises as fs } from 'fs';
import path from 'path';
import {
  clean,
  extractAllTags,
  getMetaSubdir,
  parseDescription,
  parseTitle,
  runGenerator,
  runWithCli,
  type SharedData,
  type StorageAdapter,
} from '.';
import { CASTING, FEATURE, TABLE } from './classPatterns';
import { LIST, SLUG, TEXT } from './parsingPatterns';

const log = createLogger({ component: 'VocationMetadataGenerator' });

/** Known spellcasting progression keywords */
const FULL_CASTER_HEADERS = [
  '1st',
  '2nd',
  '3rd',
  '4th',
  '5th',
  '6th',
  '7th',
  '8th',
  '9th',
];
const HALF_CASTER_HEADERS = ['1st', '2nd', '3rd', '4th', '5th'];

/**
 * Parses the Core Traits table into structured proficiency data.
 *
 * @param {string} raw - Full MDX file content
 * @returns {Record<string, string>} Map of trait name → value
 */
function parseCoreTraits(raw: string): Record<string, string> {
  const traits: Record<string, string> = {};
  const lines = raw.split(TEXT.lineSplit);

  let inTable = false;
  for (const line of lines) {
    if (TABLE.coreTraits.test(line) || TABLE.traitHeader.test(line)) {
      inTable = true;
      continue;
    }
    if (inTable && TABLE.separator.test(line)) continue;
    if (inTable && line.startsWith('|')) {
      const cells = line
        .split('|')
        .map((c) => c.trim())
        .filter(Boolean);
      if (cells.length >= 2) {
        const key = cells[0].replace(TEXT.boldStrip, '').trim();
        traits[key] = cells[1].trim();
      }
    } else if (inTable && !line.startsWith('|')) {
      inTable = false;
    }
  }
  return traits;
}

/**
 * Extracts the hit die token from a traits value.
 *
 * @param {string} value - Raw hit die text (e.g. "d12 per Barbarian level")
 * @returns {string} Normalized hit die (e.g. "d12")
 */
function parseHitDie(value: string): string {
  const match = value.match(FEATURE.hitDie);
  return match ? `d${match[1]}` : 'unknown';
}

/**
 * Parses saving throw proficiencies from the Core Traits table.
 *
 * @param {string} value - Raw saving throw text (e.g. "Strength and Constitution")
 * @returns {string[]} Array of abilities
 */
function parseSavingThrows(value: string): string[] {
  return value
    .replace(TEXT.boldStrip, '')
    .split(LIST.andSplit)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Parses skill proficiencies into count and choices.
 *
 * @param {string} value - Raw skill text (e.g. "Choose 2: Animal Handling, Athletics, ...")
 * @returns {{ count: number; choices: string[] }}
 */
function parseSkillProficiencies(value: string): {
  count: number;
  choices: string[];
} {
  const countMatch = value.match(FEATURE.skillCount);
  const count = countMatch ? parseInt(countMatch[1], 10) : 2;

  const afterColon = value.includes(':') ? value.split(':')[1] : value;
  const choices = afterColon
    .split(LIST.orSplit)
    .map((s) => s.replace(LIST.orPrefix, '').trim())
    .filter(Boolean);

  return { count, choices };
}

/**
 * Splits a proficiency line into individual items.
 *
 * @param {string} value - Raw proficiency text (e.g. "Simple and Martial weapons")
 * @returns {string[]} Array of proficiency items
 */
function parseProficiencies(value: string): string[] {
  if (!value || value.toLowerCase() === 'none') return [];
  return value
    .split(LIST.andOrSplit)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Parses the vocation feature table and extracts feature entries.
 *
 * @param {string} raw - Full MDX file content
 * @returns {{ features: Array<{ level: number; name: string }>; hasSpellSlots: boolean; headers: string[] }}
 */
function parseFeatureTable(raw: string): {
  features: Array<{ level: number; name: string }>;
  hasSpellSlots: boolean;
  headers: string[];
} {
  const lines = raw.split(TEXT.lineSplit);
  const features: Array<{ level: number; name: string }> = [];
  let headers: string[] = [];
  let inTable = false;
  let headerParsed = false;

  for (const line of lines) {
    if (!inTable && TABLE.featuresHeader.test(line)) {
      inTable = true;
      headers = line
        .split('|')
        .map((c) => c.trim())
        .filter(Boolean);
      continue;
    }
    if (inTable && TABLE.separator.test(line)) {
      headerParsed = true;
      continue;
    }
    if (inTable && headerParsed && line.startsWith('|')) {
      const cells = line
        .split('|')
        .map((c) => c.trim())
        .filter(Boolean);

      const level = parseInt(cells[0], 10);
      if (isNaN(level) || !cells[2]) continue;

      const featureCell = cells[2]
        .replace(TABLE.markdownLink, '$1')
        .replace(TEXT.boldStrip, '');

      const featureNames = featureCell
        .split(LIST.commaSplit)
        .map((f) => f.trim())
        .filter((f) => f && f !== '-' && f !== '\\-' && f !== '–');

      for (const name of featureNames) {
        features.push({ level, name: clean(name) });
      }
    } else if (inTable && headerParsed && !line.startsWith('|')) {
      break;
    }
  }

  const hasSpellSlots = headers.some((h) => TABLE.spellSlotColumn.test(h));
  const hasPactSlots = headers.some(
    (h) => CASTING.spellSlotsLabel.test(h) || CASTING.slotLevelLabel.test(h),
  );

  return { features, hasSpellSlots: hasSpellSlots || hasPactSlots, headers };
}

/**
 * Detects spellcasting ability from the Spellcasting feature collapsible block.
 *
 * @param {string} raw - Full MDX file content
 * @returns {string | null} Spellcasting ability name or null
 */
function parseSpellcastingAbility(raw: string): string | null {
  const abilityPatterns = [
    CASTING.abilityBold,
    CASTING.abilityIs,
    CASTING.abilityReversed,
    CASTING.modifierRef,
    CASTING.dcModifier,
  ];

  const spellcastingSection = raw.match(CASTING.section);
  const searchText = spellcastingSection ? spellcastingSection[0] : raw;

  for (const pattern of abilityPatterns) {
    const match = searchText.match(pattern);
    if (match) {
      const ability = match[1];
      const abilities = [
        'Strength',
        'Dexterity',
        'Constitution',
        'Intelligence',
        'Wisdom',
        'Charisma',
      ];
      const found = abilities.find(
        (a) => a.toLowerCase() === ability.toLowerCase(),
      );
      if (found) return found;
    }
  }

  return null;
}

/**
 * Classifies spellcasting progression based on table headers.
 *
 * @param {string[]} headers - Feature table headers
 * @param {string} raw - Full MDX file content
 * @returns {string | null} Progression type: "Full" | "Half" | "Third" | "Pact" | null
 */
function classifyProgression(headers: string[], raw: string): string | null {
  if (CASTING.pactMagic.test(raw)) return 'Pact';

  const slotHeaders = headers.filter((h) => TABLE.spellSlotColumn.test(h));
  if (slotHeaders.length === 0) return null;

  const has9th = slotHeaders.some((h) => h.includes('9th'));
  const has5th = slotHeaders.some((h) => h.includes('5th'));

  if (has9th) return 'Full';
  if (has5th) return 'Half';
  return 'Third';
}

/**
 * Extracts specialization slugs from the specialization table links.
 *
 * @param {string} raw - Full MDX file content
 * @returns {string[]} Array of specialization slugs
 */
function parseSpecializations(raw: string): string[] {
  const slugs: string[] = [];
  const matches = raw.matchAll(new RegExp(FEATURE.specializationLink, 'g'));
  for (const match of matches) {
    slugs.push(match[1]);
  }
  return slugs;
}

/**
 * Determines the archetype based on hit die and spellcasting.
 *
 * @param {string} hitDie - Hit die type (e.g. "d12")
 * @param {string | null} progression - Spellcasting progression or null
 * @returns {string} Archetype label
 */
function classifyArchetype(hitDie: string, progression: string | null): string {
  if (!progression) return 'Martial';
  if (progression === 'Full') return 'Full Caster';
  if (progression === 'Half') return 'Half Caster';
  if (progression === 'Pact') return 'Pact Caster';
  return 'Third Caster';
}

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

  tags.add(`archetype:${metadata.archetype}`);
  tags.add(`hit-die:${metadata.hitDie}`);

  const saves = metadata.savingThrows as string[];
  for (const save of saves) {
    tags.add(`saving-throw:${save.toLowerCase()}`);
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
 * Returns null for the root vocations/main.mdx overview page.
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
  if (baseName !== 'main.mdx') return null;

  const parentDir = path.basename(path.dirname(filePath));
  const grandParentDir = path.basename(path.dirname(path.dirname(filePath)));

  if (grandParentDir !== 'vocations') return null;

  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    const title = parseTitle(raw.split(TEXT.lineSplit).map((l) => l.trim()));
    const slug = parentDir;

    const traits = parseCoreTraits(raw);
    const description = parseDescription(raw);
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
    const toolProficiencies = parseProficiencies(
      traits['Tool Proficiencies'] || '',
    );
    const primaryAbility = parseProficiencies(traits['Primary Ability'] || '');

    const { features, hasSpellSlots, headers } = parseFeatureTable(raw);

    let spellcasting: { ability: string; progression: string } | undefined;
    if (hasSpellSlots) {
      const ability = parseSpellcastingAbility(raw);
      const progression = classifyProgression(headers, raw);
      if (ability && progression) {
        spellcasting = { ability, progression };
      }
    }

    const specializations = parseSpecializations(raw);
    const archetype = classifyArchetype(
      hitDie,
      spellcasting?.progression ?? null,
    );

    const link = `/en/library/character-creation/vocations/${slug}/main`;
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
      features,
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
 * Uses the parent directory name (vocation slug) as the filename
 * since all source files are named `main.mdx`.
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
  backend: string,
  locale: string,
): string {
  const parentDir = path.basename(path.dirname(sourceFilePath));

  if (backend !== 'pg') {
    return path.join(
      path.dirname(sourceFilePath),
      `${parentDir}.metadata.json`,
    );
  }

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
    filePattern: options.filePattern || /main\.mdx$/,
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

