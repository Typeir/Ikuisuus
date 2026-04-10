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
import {
    clean,
    extractAllTags,
    filePathToSlug,
    parseTitle,
    runGenerator,
    runWithCli,
    type SharedData,
    type StorageAdapter,
} from '@/lib/metadata';
import { promises as fs } from 'fs';
import path from 'path';

const log = createLogger({ component: 'SpecializationMetadataGenerator' });

/** Pattern matching features inside Collapsible blocks */
const FEATURE_HEADING = /##\s+(\d+)\w*\s+Level\s+[–—-]\s+(.+)/;

/** Pattern matching spell slot column headers */
const SPELL_SLOT_HEADER = /\d+(st|nd|rd|th)/;

/**
 * Mapping of title patterns to specialization type labels.
 *
 * @type {Array<{ pattern: RegExp; type: string }>}
 */
const SPECIALIZATION_TYPE_PATTERNS: Array<{
  pattern: RegExp;
  type: string;
}> = [
  { pattern: /^Path of/i, type: 'Path' },
  { pattern: /Domain$/i, type: 'Domain' },
  { pattern: /^College of/i, type: 'College' },
  { pattern: /^Circle of/i, type: 'Circle' },
  { pattern: /^Way of/i, type: 'Way' },
  { pattern: /^Oath of/i, type: 'Oath' },
  { pattern: /^Order of/i, type: 'Order' },
  { pattern: /^School of/i, type: 'School' },
  { pattern: /Patron$/i, type: 'Patron' },
  { pattern: /^The\s/i, type: 'Patron' },
  { pattern: /Knight$/i, type: 'Archetype' },
  { pattern: /Trickster$/i, type: 'Archetype' },
  { pattern: /Champion$/i, type: 'Archetype' },
  { pattern: /Master$/i, type: 'Archetype' },
];

/**
 * Determines the specialization type from the title text.
 *
 * @param {string} title - Specialization title
 * @returns {string} Matched type or "Subclass"
 */
function classifySpecializationType(title: string): string {
  for (const { pattern, type } of SPECIALIZATION_TYPE_PATTERNS) {
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
    if (/^_[^_]+_$/.test(trimmed) || /^\*[^*]+\*$/.test(trimmed)) {
      return trimmed.replace(/^[_*]+|[_*]+$/g, '').trim();
    }
  }
  return undefined;
}

/**
 * Parses features from Collapsible blocks with level headings.
 *
 * @param {string} raw - Full MDX file content
 * @returns {Array<{ level: number; name: string }>} Feature entries
 */
function parseFeatures(raw: string): Array<{ level: number; name: string }> {
  const features: Array<{ level: number; name: string }> = [];
  const matches = raw.matchAll(new RegExp(FEATURE_HEADING, 'g'));

  for (const match of matches) {
    const level = parseInt(match[1], 10);
    const name = clean(match[2].trim());
    if (!isNaN(level) && name) {
      features.push({ level, name });
    }
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
  const tablePattern =
    /(?:domain spells|oath spells|circle spells|expanded spell list|always.?prepared)/i;

  if (!tablePattern.test(raw)) return undefined;

  const lines = raw.split(/\r?\n/);
  const entries: Array<{ level: number; spells: string[] }> = [];
  let inTable = false;
  let headerSeen = false;

  for (const line of lines) {
    if (!inTable) {
      if (
        /^\|\s*(Cleric|Paladin|Druid|Warlock|Ranger)?\s*Level\s*\|/i.test(
          line,
        ) ||
        /^\|\s*Level\s*\|\s*Spells?\s*\|/i.test(line)
      ) {
        inTable = true;
        continue;
      }
    }

    if (inTable && /^\|[-\s|]+\|$/.test(line)) {
      headerSeen = true;
      continue;
    }

    if (inTable && headerSeen && line.startsWith('|')) {
      const cells = line
        .split('|')
        .map((c) => c.trim())
        .filter(Boolean);

      if (cells.length >= 2) {
        const levelMatch = cells[0].match(/(\d+)/);
        if (!levelMatch) continue;
        const level = parseInt(levelMatch[1], 10);

        const spellCell = cells[1];
        const spells = spellCell
          .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
          .split(/,\s*/)
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
  const spellcastingTablePattern =
    /##\s+(?:Eldritch Knight|Arcane Trickster|(?:\w+\s+)*Spellcasting)\s*$/m;
  if (!spellcastingTablePattern.test(raw)) return undefined;

  const lines = raw.split(/\r?\n/);
  let hasSlotTable = false;
  let maxSlotLevel = 0;

  for (const line of lines) {
    if (/^\|\s*(?:Fighter|Rogue|Ranger)?\s*Level\s*\|/i.test(line)) {
      const headers = line.split('|').map((c) => c.trim());
      for (const h of headers) {
        const match = h.match(/(\d+)(st|nd|rd|th)/);
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
    /spellcasting ability is (\w+)/i,
    /(\w+) is your spellcasting ability/i,
    /your (\w+) modifier/i,
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
    const lines = raw.split(/\r?\n/).map((l) => l.trim());
    const title = parseTitle(lines);
    const slug = filePathToSlug(filePath);

    const parentDir = path.basename(path.dirname(filePath));
    const vocation = parentDir;

    const specializationType = classifySpecializationType(title);
    const flavor = parseFlavor(lines);
    const features = parseFeatures(raw);
    const spellsAlwaysPrepared = parseAlwaysPreparedSpells(raw);
    const spellcasting = parseSpecializationSpellcasting(raw);

    const file = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
    const link = `/en/library/character-creation/vocations/${vocation}/${slug}`;

    const tags = new Set<string>();
    tags.add(`vocation:${vocation}`);
    tags.add(`type:${specializationType.toLowerCase()}`);

    if (spellcasting) {
      tags.add(`spellcasting:${spellcasting.progression.toLowerCase()}`);
      tags.add(`spellcasting-ability:${spellcasting.ability.toLowerCase()}`);
    }

    if (spellsAlwaysPrepared) {
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
      spellsAlwaysPrepared,
      features,
      tags: [...tags].sort(),
      indexVersion: 1,
    };

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
    processResult: (result) => {
      if (result === null) return { metadata: null, count: 0 };
      return { metadata: result, count: 1 };
    },
    contentDir: options.contentDir,
    storage: options.storage,
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runWithCli(main).catch((error) => {
    log.error('Fatal error during specialization metadata generation', {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    process.exit(1);
  });
}

export { main, parseSpecializationFile };

