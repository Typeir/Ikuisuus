/**
 * @fileoverview Specialization Metadata Generator
 * @description Parses `.specialization.mdx` files and extracts title, flavor,
 * vocation, specialization type, features, optional always-prepared spell
 * tables, and optional spellcasting progression data.
 *
 * @module scripts/metadata/generateSpecializationMetadata
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
    filePathToSlug,
    parseDescription,
    parseTitle,
    runGenerator,
    runWithCli,
    type SharedData,
    type StorageAdapter,
} from '.';
import { LIST, SLUG, TEXT, UTILITY } from './parsingPatterns';
import {
    CASTING,
    FEATURE,
    FLAVOR,
    SPECIALIZATION_TYPES,
    TABLE,
} from './vocationPatterns';

const log = createLogger({ component: 'SpecializationMetadataGenerator' });

/**
 * Determines the specialization type from the title text.
 *
 * @param {string} title - Specialization title
 * @returns {string} Matched type or "Subclass"
 */
function classifySpecializationType(title: string): string {
  for (const { pattern, type } of SPECIALIZATION_TYPES) {
    if (pattern.test(title)) return type;
  }
  return 'Subclass';
}

/**
 * Extracts the italic flavor line below the H1 title.
 *
 * @param {string[]} lines - File lines
 * @returns {string | undefined} Flavor text without underscores
 */
function parseFlavor(lines: string[]): string | undefined {
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const trimmed = lines[i].trim();
    if (
      FLAVOR.underscoreItalic.test(trimmed) ||
      FLAVOR.asteriskItalic.test(trimmed)
    ) {
      return trimmed.replace(TEXT.italicWrap, '').trim();
    }
  }
  return undefined;
}

/**
 * Parses features from level-heading lines, capturing their 1-indexed start and
 * end line numbers within the MDX file.
 *
 * @param {string} raw - Full MDX file content
 * @returns {Array<{ level: number; name: string; startLine: number; endLine: number }>} Feature entries with line ranges
 */
function parseFeatures(
  raw: string,
): Array<{ level: number; name: string; startLine: number; endLine: number }> {
  const features: Array<{
    level: number;
    name: string;
    startLine: number;
    endLine: number;
  }> = [];
  const lines = raw.split('\n');
  const pattern = new RegExp(FEATURE.levelHeading.source);

  for (let i = 0; i < lines.length; i++) {
    const match = pattern.exec(lines[i]);
    if (!match) continue;

    const level = parseInt(match[1], 10);
    const name = clean(match[2].trim());
    if (isNaN(level) || !name) continue;

    const headingLevel = (/^(#+)/.exec(lines[i]) ?? ['', '##'])[1].length;
    let endIdx = lines.length - 1;
    for (let j = i + 1; j < lines.length; j++) {
      const hm = /^(#{1,6})\s+/.exec(lines[j]);
      if (hm && hm[1].length <= headingLevel) {
        endIdx = j - 1;
        break;
      }
    }
    while (endIdx > i && !lines[endIdx]?.trim()) endIdx--;

    features.push({ level, name, startLine: i + 1, endLine: endIdx + 1 });
  }

  return features;
}

/**
 * Parses always-prepared spell tables (e.g. Domain spells, Oath spells).
 *
 * @param {string} raw - Full MDX file content
 * @returns {Array<{ level: number; spells: string[] }> | undefined} Spell entries or undefined
 */
function parseAlwaysPreparedSpells(
  raw: string,
): Array<{ level: number; spells: string[] }> | undefined {
  if (!CASTING.alwaysPrepared.test(raw)) return undefined;

  const lines = raw.split(TEXT.lineSplit);
  const entries: Array<{ level: number; spells: string[] }> = [];
  let inTable = false;
  let headerSeen = false;

  for (const line of lines) {
    if (!inTable) {
      if (
        TABLE.classLevelHeader.test(line) ||
        TABLE.levelSpellsHeader.test(line)
      ) {
        inTable = true;
        continue;
      }
    }

    if (inTable && TABLE.separator.test(line)) {
      headerSeen = true;
      continue;
    }

    if (inTable && headerSeen && line.startsWith('|')) {
      const cells = line
        .split('|')
        .map((c) => c.trim())
        .filter(Boolean);

      if (cells.length >= 2) {
        const levelMatch = cells[0].match(UTILITY.numericExtract);
        if (!levelMatch) continue;
        const level = parseInt(levelMatch[1], 10);

        const spellCell = cells[1];
        const spells = spellCell
          .replace(TABLE.markdownLink, '$1')
          .split(LIST.commaSplit)
          .map((s) => s.trim())
          .filter(Boolean);

        if (spells.length > 0) {
          entries.push({ level, spells });
        }
      }
    } else if (inTable && headerSeen && !line.startsWith('|')) {
      break;
    }
  }

  return entries.length > 0 ? entries : undefined;
}

/**
 * Detects specialization-specific spellcasting from a dedicated table.
 *
 * @param {string} raw - Full MDX file content
 * @returns {{ ability: string; progression: string } | undefined}
 */
function parseSpecializationSpellcasting(
  raw: string,
): { ability: string; progression: string } | undefined {
  if (!CASTING.specHeading.test(raw)) return undefined;

  const lines = raw.split(TEXT.lineSplit);
  let hasSlotTable = false;
  let maxSlotLevel = 0;

  for (const line of lines) {
    if (TABLE.classLevelHeader.test(line)) {
      const headers = line.split('|').map((c) => c.trim());
      for (const h of headers) {
        const match = h.match(TABLE.slotLevel);
        if (match) {
          hasSlotTable = true;
          const level = parseInt(match[1], 10);
          if (level > maxSlotLevel) maxSlotLevel = level;
        }
      }
    }
  }

  if (!hasSlotTable) return undefined;

  const abilityPatterns = [
    CASTING.abilityIs,
    CASTING.abilityReversed,
    CASTING.modifierRef,
  ];

  const abilities = [
    'Strength',
    'Dexterity',
    'Constitution',
    'Intelligence',
    'Wisdom',
    'Charisma',
  ];

  let ability = 'Intelligence';
  for (const pattern of abilityPatterns) {
    const match = raw.match(pattern);
    if (match) {
      const found = abilities.find(
        (a) => a.toLowerCase() === match[1].toLowerCase(),
      );
      if (found) {
        ability = found;
        break;
      }
    }
  }

  let progression = 'Third';
  if (maxSlotLevel >= 9) progression = 'Full';
  else if (maxSlotLevel >= 5) progression = 'Half';

  return { ability, progression };
}

/**
 * Parses a single specialization MDX file into metadata.
 *
 * @param {string} filePath - Absolute path to the .specialization.mdx file
 * @param {SharedData} sharedData - Shared game data constants
 * @returns {Promise<Record<string, unknown> | null>} Parsed metadata or null
 */
async function parseSpecializationFile(
  filePath: string,
  sharedData: SharedData,
): Promise<Record<string, unknown> | null> {
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    const lines = raw.split(TEXT.lineSplit).map((l) => l.trim());
    const title = parseTitle(lines);
    const slug = filePathToSlug(filePath);

    const parentDir = path.basename(path.dirname(filePath));
    const vocation = parentDir;

    const specializationType = classifySpecializationType(title);
    const flavor = parseFlavor(lines);
    const description = parseDescription(raw);
    const features = parseFeatures(raw);
    const preparedSpells = parseAlwaysPreparedSpells(raw);
    const spellcasting = parseSpecializationSpellcasting(raw);

    const file = path
      .relative(process.cwd(), filePath)
      .replace(SLUG.pathBackslash, '/');
    const link = `/en/library/character-creation/vocations/${vocation}/${slug}`;

    const tags = new Set<string>();
    tags.add(`vocation:${vocation}`);
    tags.add(`type:${specializationType.toLowerCase()}`);

    if (spellcasting) {
      tags.add(`spellcasting:${spellcasting.progression.toLowerCase()}`);
      tags.add(`spellcasting-ability:${spellcasting.ability.toLowerCase()}`);
    }

    if (preparedSpells) {
      tags.add('has-always-prepared-spells');
    }

    const contentTags = extractAllTags(raw, filePath, sharedData);
    for (const tag of contentTags) {
      tags.add(tag);
    }

    const metadata: Record<string, unknown> = {
      slug,
      title,
      file,
      link,
      vocation,
      specializationType,
      flavor,
      spellcasting,
      preparedSpells,
      features,
      tags: [...tags].sort(),
      indexVersion: 1,
    };

    if (description) {
      metadata.description = description;
    }

    log.message(`✅ Parsed specialization: ${title} (${vocation}/${slug})`, {
      features: features.length,
      type: specializationType,
      hasSpellcasting: !!spellcasting,
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
 * Main entry point for specialization metadata generation.
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
    name: 'Specialization Metadata Generator',
    contentType: 'specializations',
    filePattern: options.filePattern || /\.specialization\.mdx$/,
    parseFile: parseSpecializationFile,
    recursive: true,
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
    log.error('Fatal error during specialization metadata generation', {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    process.exit(1);
  });
}

export { main, parseSpecializationFile };

