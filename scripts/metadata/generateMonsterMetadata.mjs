/**
 * Monster Metadata Generator
 *
 * @fileoverview Advanced parser for D&D monster stat blocks in MDX format.
 * Extracts structured metadata including combat stats, abilities, resistances,
 * challenge ratings, and gameplay mechanics. Supports multiple stat blocks per file
 * and nested blockquote stat blocks for variants.
 *
 * @module generateMonsterMetadata
 * @version 3.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires fs.promises File system operations for reading monster files
 * @requires path Path utilities for file manipulation
 * @requires ../core/shared-utils.mjs Performance monitoring and utility functions
 * @requires ../core/shared-data.json Centralized game data and validation patterns
 *
 * @example
 * // Run the monster metadata generator
 * node generateMonsterMetadata.mjs
 *
 * // Expected output: Creates .metadata.json files alongside .sheet.mdx files
 * // with structured data for search, filtering, and display
 */

import { promises as fs } from 'fs';
import path from 'path';
import { createLogger } from '../core/logger.mjs';
import {
  GameData,
  MetadataGeneratorUtils,
  ParsingUtils,
  TaggingUtils,
  TextUtils,
} from '../core/shared-utils.mjs';

const log = createLogger({ module: 'MonsterMetadataGenerator' });

/**
 * Parses the italic metadata line containing size, creature type, and alignment
 *
 * @function parseItalicMeta
 * @param {string[]} lines - Array of document lines to search
 * @returns {{ size?: string, creatureType?: string, alignment?: string }} Parsed creature metadata
 *
 * @description Locates and parses the stat block's italic metadata line which follows
 * the D&D 5e format: `_Size CreatureType, Alignment_`
 *
 * Expected formats:
 * - `_Large Dragon, Chaotic Evil_`
 * - `_Medium Humanoid (Elf), Neutral Good_`
 * - `_Huge Construct_` (alignment optional)
 *
 * @example
 * // Input: ["_Large Dragon, Chaotic Evil_"]
 * parseItalicMeta(lines) // Returns: { size: "Large", creatureType: "Dragon", alignment: "Chaotic Evil" }
 *
 * // Input: ["_Medium Humanoid (Elf), Neutral Good_"]
 * parseItalicMeta(lines) // Returns: { size: "Medium", creatureType: "Humanoid", alignment: "Neutral Good" }
 *
 * // Input: ["No italic line found"]
 * parseItalicMeta(lines) // Returns: {}
 */
function parseItalicMeta(lines, sharedData = null) {
  const sizeList = GameData.getSizes(sharedData);
  // Find the italic line that starts with a size keyword
  const statBlockPattern = new RegExp(`^_(${sizeList.join('|')})\\s+`, 'i');
  const line = lines.find((l) => statBlockPattern.test(l));
  if (!line) return {};

  const inner = TextUtils.clean(line.replace(/^_/, '').replace(/_$/, ''));
  // Split at first comma (alignment after comma)
  const [left, rightAlign] = inner.split(/\s*,\s*/, 2);

  // Expect "<Size> <Type...>"
  let size = '';
  let creatureType = '';
  if (left) {
    const sizeList = GameData.getSizes(sharedData);
    for (const s of sizeList) {
      if (left.toLowerCase().startsWith(s.toLowerCase())) {
        size = s;
        creatureType = TextUtils.clean(left.slice(s.length));
        break;
      }
    }
  }

  // Clean up creature type (remove parenthetical notes and extra whitespace)
  creatureType = creatureType
    .replace(/^\s*,?\s*/g, '')
    .replace(/\(.*?\)/g, '')
    .trim();

  return {
    size: size || undefined,
    creatureType: creatureType || undefined,
    alignment: rightAlign || undefined,
  };
}

/**
 * Parses Markdown table row into individual cell values
 *
 * @function parseTableRowCells
 * @param {string} line - Raw Markdown table row with pipe delimiters
 * @returns {string[]} Array of cleaned cell contents
 *
 * @description Splits table rows on pipe characters and removes the outer
 * empty cells that result from leading/trailing pipes. Each cell is cleaned
 * of whitespace for consistent processing.
 *
 * @example
 * parseTableRowCells("| 18 | 20 | 16 |") // Returns: ["18", "20", "16"]
 * parseTableRowCells("| Armor Class | Hit Points | Speed |") // Returns: ["Armor Class", "Hit Points", "Speed"]
 * parseTableRowCells("|empty||cells|") // Returns: ["empty", "", "cells"]
 */
function parseTableRowCells(line) {
  return line
    .split('|')
    .slice(1, -1) // Remove first and last empty elements from outer pipes
    .map((c) => TextUtils.clean(c));
}

/**
 * Extracts Armor Class, Hit Points, and Speed from the stat block table
 *
 * @function findArmorHpSpeed
 * @param {string[]} lines - Array of document lines to search
 * @returns {{ ac?: object, hp?: object, speed?: object }} Parsed combat statistics
 *
 * @description Locates the stat block table and extracts the three core combat stats.
 * The table is expected to follow D&D 5e stat block format with headers in the first
 * row and values in a subsequent row.
 *
 * Table structure:
 * ```
 * | **Armor Class** | **Hit Points** | **Speed** |
 * |-----------------|----------------|-----------|
 * | 18 (Natural)    | 168 (16d12+80) | 40 ft.   |
 * ```
 *
 * @returns {Object} Object containing parsed stats:
 * @returns {Object} returns.ac - Armor Class with value, notes, and raw text
 * @returns {number} returns.ac.value - Numeric AC value
 * @returns {string} [returns.ac.notes] - AC source/type (e.g., "Natural Armor")
 * @returns {string} returns.ac.raw - Original text from table
 * @returns {Object} returns.hp - Hit Points with average, formula, and raw text
 * @returns {number} returns.hp.average - Average hit points
 * @returns {string} [returns.hp.formula] - Dice formula (e.g., "16d12+80")
 * @returns {string} returns.hp.raw - Original text from table
 * @returns {Object} returns.speed - Speed data (see parseSpeed function)
 *
 * @example
 * // Input table: | **Armor Class** | **Hit Points** | **Speed** |
 * //              | 18 (Natural)    | 168 (16d12+80) | 40 ft., fly 80 ft. |
 * const stats = findArmorHpSpeed(lines);
 * // Returns: {
 * //   ac: { value: 18, notes: "Natural", raw: "18 (Natural)" },
 * //   hp: { average: 168, formula: "16d12+80", raw: "168 (16d12+80)" },
 * //   speed: { raw: "40 ft., fly 80 ft.", modes: { walk: 40, fly: 80 } }
 * // }
 */
function findArmorHpSpeed(lines) {
  // Locate header row containing "**Armor Class**"
  const idx = lines.findIndex((l) => /\|\s*\*\*Armor\s*Class\*\*/i.test(l));
  if (idx === -1) return {};

  // Data row usually at idx + 2 (one separator row in between)
  let dataRow = lines[idx + 2];
  // Fallback: find next line that looks like a table row of values
  if (!/^\s*\|/.test(dataRow)) {
    dataRow = lines.slice(idx + 1).find((l) => /^\s*\|/.test(l)) || '';
  }

  const cells = parseTableRowCells(dataRow || '');
  const [acRaw, hpRaw, speedRaw] = cells;

  // Parse Armor Class: "18" or "18 (Natural Armor)"
  const acMatch = (acRaw || '').match(/([\d,]+)\s*(?:\((.*?)\))?/);
  const ac = acMatch ? ParsingUtils.parseNumericValue(acMatch[1]) : undefined;
  const acNotes = acMatch && acMatch[2] ? acMatch[2] : undefined;

  // Parse Hit Points: "168" or "168 (16d12+80)"
  const hpMatch = (hpRaw || '').match(/([\d,]+)\s*(?:\((.*?)\))?/);
  const hpAverage = hpMatch
    ? ParsingUtils.parseNumericValue(hpMatch[1])
    : undefined;
  const hpFormula = hpMatch && hpMatch[2] ? hpMatch[2] : undefined;

  return {
    ac:
      ac !== undefined ? { value: ac, notes: acNotes, raw: acRaw } : undefined,
    hp:
      hpAverage !== undefined
        ? { average: hpAverage, formula: hpFormula, raw: hpRaw }
        : undefined,
    speed: parseSpeed(speedRaw),
  };
}

/**
 * Parses D&D speed string into structured movement modes
 *
 * @function parseSpeed
 * @param {string} raw - Raw speed text from stat block (e.g., "40 ft., climb 30 ft., fly 80 ft. (hover)")
 * @returns {{ raw: string, modes: object } | undefined} Speed data object or undefined if no input
 *
 * @description Converts D&D speed strings into structured data for easy access.
 * Handles multiple movement modes, hover capability, and various formatting patterns.
 *
 * Movement modes parsed:
 * - walk (default for first unspecified speed)
 * - climb, fly, swim, burrow
 * - hover (special flag for flight)
 *
 * Supported formats:
 * - "30 ft." → walk: 30
 * - "40 ft., fly 60 ft." → walk: 40, fly: 60
 * - "50 ft., fly 100 ft. (hover)" → walk: 50, fly: 100, hover: true
 * - "hover 40 ft." → fly: 40, hover: true
 *
 * @returns {Object} Speed object with:
 * @returns {string} returns.raw - Original speed text
 * @returns {Object} returns.modes - Movement modes with distances
 * @returns {number} [returns.modes.walk] - Walking speed in feet
 * @returns {number} [returns.modes.fly] - Flying speed in feet
 * @returns {number} [returns.modes.climb] - Climbing speed in feet
 * @returns {number} [returns.modes.swim] - Swimming speed in feet
 * @returns {number} [returns.modes.burrow] - Burrowing speed in feet
 * @returns {boolean} [returns.modes.hover] - Can hover while flying
 *
 * @example
 * parseSpeed("40 ft., fly 80 ft. (hover)")
 * // Returns: {
 * //   raw: "40 ft., fly 80 ft. (hover)",
 * //   modes: { walk: 40, fly: 80, hover: true }
 * // }
 *
 * parseSpeed("30 ft.")
 * // Returns: { raw: "30 ft.", modes: { walk: 30 } }
 */
function parseSpeed(raw) {
  if (!raw) return undefined;

  const parts = raw.split(/\s*,\s*/);
  const modes = {};

  for (const p of parts) {
    const isHover = /\bhover\b/i.test(p);
    if (isHover) modes.hover = true;

    // Match "mode distance ft" or "distance ft"
    const m = p.match(/(?:(walk|climb|fly|swim|burrow)\s+)?(\d+)\s*ft\.?/i);
    if (m) {
      let mode = (m[1] || '').toLowerCase();
      const ft = Number(m[2]);

      modes[mode] = ft;
    } else {
      // Handle "hover 35 ft." variant
      const mh = p.match(/hover\s+(\d+)\s*ft\.?/i);
      if (mh) {
        modes.fly = Number(mh[1]);
        modes.hover = true;
      }
    }
  }

  return { raw, modes };
}

/**
 * Parses the six core ability scores from the stat block table
 *
 * @function parseAbilities
 * @param {string[]} lines - Array of document lines to search
 * @returns {{ str: object, dex: object, con: object, int: object, wis: object, cha: object } | undefined} Ability scores or undefined if not found
 *
 * @description Locates the ability scores table and extracts scores and modifiers
 * for all six D&D abilities. The table follows standard stat block format:
 *
 * ```
 * | STR     | DEX     | CON     | INT     | WIS     | CHA     |
 * |---------|---------|---------|---------|---------|---------|
 * | 16 (+3) | 14 (+2) | 18 (+4) | 10 (+0) | 12 (+1) | 8 (-1)  |
 * ```
 *
 * Only the score is extracted — the modifier is omitted because it is always
 * derivable: `mod = floor((score - 10) / 2)`. Consumers compute it on read.
 *
 * Supported formats per cell:
 * - "16 (+3)" → score: 16  (written modifier discarded)
 * - "16"      → score: 16
 * - ""        → score: undefined
 *
 * @returns {Object} Ability scores object with:
 * @returns {Object} returns.str - Strength
 * @returns {number} [returns.str.score] - Ability score (3-30)
 * @returns {Object} returns.dex - Dexterity
 * @returns {Object} returns.con - Constitution
 * @returns {Object} returns.int - Intelligence
 * @returns {Object} returns.wis - Wisdom
 * @returns {Object} returns.cha - Charisma
 *
 * @example
 * // Input: | 16 (+3) | 14 (+2) | 18 (+4) | 10 (+0) | 12 (+1) | 8 (-1) |
 * const abilities = parseAbilities(lines);
 * // Returns: {
 * //   str: { score: 16 },
 * //   dex: { score: 14 },
 * //   con: { score: 18 },
 * //   int: { score: 10 },
 * //   wis: { score: 12 },
 * //   cha: { score: 8 }
 * // }
 */
function parseAbilities(lines) {
  // Find the ability scores header row
  // Updated regex to handle both plain (STR) and bold (**STR**) formatting
  const idx = lines.findIndex((l) =>
    /^\s*\|\s*\*?\*?STR\*?\*?\s+\|\s*\*?\*?DEX\*?\*?\s+\|\s*\*?\*?CON\*?\*?\s+\|\s*\*?\*?INT\*?\*?\s+\|\s*\*?\*?WIS\*?\*?\s+\|\s*\*?\*?CHA\*?\*?\s*\|/i.test(
      l,
    ),
  );
  if (idx === -1) return undefined;

  // Values row is typically idx + 2 (accounting for separator row)
  // But be more flexible: look for the next table row after header
  let valuesRow = '';
  for (let i = idx + 1; i < Math.min(idx + 5, lines.length); i++) {
    const line = lines[i].trim();
    // Skip separator rows (all dashes and pipes)
    if (!/^\|[-\s|]+\|$/.test(line)) {
      valuesRow = line;
      break;
    }
  }

  if (!valuesRow) return undefined;

  const cells = parseTableRowCells(valuesRow);

  /**
   * Converts ability cell text to just the score.
   * Modifiers are redundant — always derivable via `floor((score - 10) / 2)`.
   *
   * @param {string} cell - Cell content like "16 (+3)" or "16"
   * @returns {{ score?: number }} Parsed ability score
   */
  const toPair = (cell) => {
    // Match "16 (+3)" or "16" — capture only the score, discard the written mod
    const m = cell.match(/(\d+)/);
    if (m) return { score: Number(m[1]) };

    // No valid data found
    return { score: undefined };
  };

  if (cells.length < 6) return undefined;

  return {
    str: toPair(cells[0]),
    dex: toPair(cells[1]),
    con: toPair(cells[2]),
    int: toPair(cells[3]),
    wis: toPair(cells[4]),
    cha: toPair(cells[5]),
  };
}

/**
 * Parses saving throw bonuses.
 * @param {string} raw - Raw saving throws string (e.g., "Str +9, Con +10").
 * @returns {Object<string, number> | undefined} Map of ability to bonus.
 */
function parseSavingThrows(raw) {
  if (!raw) return undefined;
  const out = {};
  for (const part of raw.split(/\s*,\s*/)) {
    const m = part.match(/^(Str|Dex|Con|Int|Wis|Cha)\s*([+-]?\d+)/i);
    if (m) {
      out[m[1].toLowerCase()] = Number(m[2]);
    }
  }
  return Object.keys(out).length ? out : undefined;
}

/**
 * Parses senses including passive Perception and special vision.
 * @param {string} raw - Raw senses string.
 * @returns {{ raw: string, passivePerception?: number } | undefined} Parsed senses.
 */
function parseSenses(raw, sharedData = null) {
  if (!raw) return undefined;
  const senses = { raw };
  const p = raw.match(/passive\s+Perception\s+(\d+)/i);
  if (p) senses.passivePerception = Number(p[1]);
  const senseKeys = GameData.getSenses(sharedData);
  for (const key of senseKeys) {
    const r = new RegExp(`${key}\\s+(\\d+)\\s*ft\\.?`, 'i');
    const m = raw.match(r);
    if (m) senses[key] = Number(m[1]);
  }
  return senses;
}

/**
 * Parses challenge rating from Challenge line.
 * @param {string} rawChallenge - Raw challenge string (e.g., "16 (10,900 XP)").
 * @returns {string | undefined} CR value.
 */
function parseCR(rawChallenge) {
  if (!rawChallenge) return undefined;
  const m = rawChallenge.match(/(\d+\/\d+|\d+)/);
  return m ? m[1] : undefined;
}

/**
 * Parses proficiency bonus.
 * @param {string} rawPB - Raw proficiency bonus string.
 * @returns {number | undefined} Proficiency bonus value.
 */
function parseProficiencyBonus(rawPB) {
  if (!rawPB) return undefined;
  const m = rawPB.match(/([+-]?\d+)/);
  return m ? Number(m[1]) : undefined;
}

/**
 * Finds line indices of all stat blocks in a file.
 * @param {string[]} lines - File lines.
 * @returns {{ lineIndex: number, isBlockquote: boolean }[]} Array of stat block positions.
 */
function findStatBlockPositions(lines, sharedData = null) {
  const positions = [];
  const sizeList = GameData.getSizes(sharedData);
  const sizePattern = sizeList.concat(['Colossal', 'Titanic']).join('|');
  const mainStatBlockPattern = new RegExp(`^_(${sizePattern})\\s+.*,.*_$`, 'i');
  const blockquoteStatBlockPattern = new RegExp(
    `^>\\s*_(${sizePattern})\\b`,
    'i',
  );

  lines.forEach((line, idx) => {
    const isMain = mainStatBlockPattern.test(line);
    const isBlockquote = blockquoteStatBlockPattern.test(line);

    if (isMain || isBlockquote) {
      positions.push({ lineIndex: idx, isBlockquote });
    }
  });

  return positions;
}

/**
 * Extracts a section of lines for a specific stat block.
 * Includes preceding lines to capture the heading.
 * @param {string[]} lines - All file lines.
 * @param {number} statBlockLineIdx - Line index of the stat block italic line.
 * @param {number} endIdx - Ending line index (exclusive).
 * @param {boolean} isBlockquote - Whether this is a blockquote stat block.
 * @returns {string[]} Section lines.
 */
function extractStatBlockSection(
  lines,
  statBlockLineIdx,
  endIdx,
  isBlockquote,
) {
  // Look back up to 10 lines to find the heading
  const lookbackStart = Math.max(0, statBlockLineIdx - 10);

  if (isBlockquote) {
    // For blockquote stat blocks, only extract until the blockquote ends
    // Find where lines stop starting with '>'
    let blockquoteEnd = statBlockLineIdx + 1;
    for (let i = statBlockLineIdx + 1; i < lines.length; i++) {
      if (!lines[i].startsWith('>') && lines[i].trim() !== '') {
        blockquoteEnd = i;
        break;
      }
      // If we hit EOF while still in blockquote, use EOF
      if (i === lines.length - 1) {
        blockquoteEnd = lines.length;
        break;
      }
    }

    const section = lines.slice(lookbackStart, blockquoteEnd);
    // Remove blockquote markers from lines
    return section.map((line) => line.replace(/^>\s*/, ''));
  }

  const section = lines.slice(lookbackStart, endIdx);
  return section;
}

/**
 * Finds the closest heading before the stat block line in the original file.
 * @param {string[]} allLines - All file lines.
 * @param {number} statBlockLineIdx - Index of the italic stat block line.
 * @param {boolean} isBlockquote - Whether this is a blockquote stat block.
 * @returns {string} Title or empty string.
 */
function findStatBlockTitle(allLines, statBlockLineIdx, isBlockquote) {
  // Look backwards from the stat block line for closest heading
  for (
    let i = statBlockLineIdx - 1;
    i >= Math.max(0, statBlockLineIdx - 15);
    i--
  ) {
    const line = allLines[i];

    if (isBlockquote) {
      // For blockquote stat blocks, look for blockquote headings like "> ### Petal"
      const match = line.match(/^>\s*#{1,4}\s+\*?\*?(.+?)\*?\*?\s*$/);
      if (match) {
        return match[1].trim();
      }
    } else {
      // For regular stat blocks, look for H1-H3 headings
      const match = line.match(/^#{1,3}\s+\*?\*?(.+?)\*?\*?\s*$/);
      if (match) {
        return match[1].trim();
      }
    }
  }
  return '';
}

/**
 * Parses a stat block section and extracts metadata.
 * @param {string[]} allLines - All file lines (for finding heading).
 * @param {string[]} sectionLines - Lines for this stat block.
 * @param {number} statBlockLineIdx - Original line index of stat block.
 * @param {boolean} isBlockquote - Whether this is a blockquote stat block.
 * @param {string} baseSlug - Base slug from filename.
 * @param {string} filePath - Original file path.
 * @param {number} statBlockIndex - Index of this stat block (0 for first/main).
 * @param {Object} [sharedData=null] - Shared data object
 * @returns {object} Stat block metadata.
 */
function parseStatBlockSection(
  allLines,
  sectionLines,
  statBlockLineIdx,
  isBlockquote,
  baseSlug,
  filePath,
  statBlockIndex,
  sharedData = null,
) {
  const sectionText = sectionLines.join('\n');
  const title = findStatBlockTitle(allLines, statBlockLineIdx, isBlockquote);

  // Generate subSlug from title
  const subSlug = title
    ? title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
    : undefined;

  const italicMeta = parseItalicMeta(sectionLines, sharedData);
  const headerStats = findArmorHpSpeed(sectionLines);
  const abilities = parseAbilities(sectionLines);

  const bulletMap = ParsingUtils.parseKeyBullets(sectionText);
  const savingThrows = parseSavingThrows(bulletMap['Saving Throws']);
  const senses = parseSenses(bulletMap['Senses'], sharedData);
  const languages = ParsingUtils.splitList(bulletMap['Languages']);
  // Pattern for grouping "bludgeoning, piercing, and slashing from nonmagical..."
  const nonmagicalPattern =
    /bludgeoning,?\s+piercing,?\s+and\s+slashing\s+from\s+nonmagical\s+[^;,]+/i;
  const resist = ParsingUtils.splitListWithGrouping(
    bulletMap['Damage Resistances'],
    nonmagicalPattern,
  );
  const immune = ParsingUtils.splitListWithGrouping(
    bulletMap['Damage Immunities'],
    nonmagicalPattern,
  );
  const vuln = ParsingUtils.splitListWithGrouping(
    bulletMap['Damage Vulnerabilities'],
    nonmagicalPattern,
  );
  const condImm = ParsingUtils.splitList(bulletMap['Condition Immunities']);
  const skills = bulletMap['Skills']
    ? ParsingUtils.splitList(bulletMap['Skills'])
    : [];
  const cr = parseCR(bulletMap['Challenge']);
  const proficiencyBonus = parseProficiencyBonus(
    bulletMap['Proficiency Bonus'],
  );

  // Extract tags: main stat block gets entire file, nested blocks get their section only
  const linesToScan =
    statBlockIndex === 0 && !isBlockquote ? allLines : sectionLines;

  // Find where actual content (traits/actions) begins
  let contentStartIdx = 0;
  // Look for the first --- separator after the stat block
  for (let i = 0; i < linesToScan.length; i++) {
    if (linesToScan[i].trim() === '---') {
      contentStartIdx = i + 1;
      break;
    }
  }
  // If no separator found, look for end of bullet list
  if (contentStartIdx === 0) {
    for (let i = 0; i < linesToScan.length; i++) {
      const line = linesToScan[i].trim();
      if (
        /^[-*]\s+\*\*(Proficiency Bonus|Challenge|Languages|Senses|Condition Immunities|Damage|Skills|Saving Throws)\*\*/i.test(
          line,
        )
      ) {
        contentStartIdx = i + 1;
      }
    }
  }

  const contentLines = linesToScan.slice(contentStartIdx);
  const content = contentLines.join('\n');

  const tags = TaggingUtils.extractAllTags(content, filePath, sharedData, {
    contentType: 'monster',
    requireFlightMeasurement: true,
  });

  // Add creature type tag if available
  if (italicMeta.creatureType) {
    tags.push(`creature:${italicMeta.creatureType.toLowerCase()}`);
  }

  // Add rarity tag based on CR
  if (cr) {
    const crValue = typeof cr === 'object' ? cr.rating : cr;
    if (crValue >= 17) {
      tags.push('rarity:legendary');
    } else if (crValue >= 11) {
      tags.push('rarity:epic');
    } else if (crValue >= 5) {
      tags.push('rarity:rare');
    } else {
      tags.push('rarity:common');
    }
  }

  // Add size tag
  if (italicMeta.size) {
    tags.push(`size:${italicMeta.size.toLowerCase()}`);
  }

  // Sort tags for consistency
  tags.sort();

  // Warnings for missing non-critical fields
  const displayName = title || baseSlug;
  const isNested = statBlockIndex > 0 || isBlockquote;

  // Log missing fields at debug level (expected for some creatures)
  if (!italicMeta.size) {
    log.debug('Missing size field', {
      creature: displayName,
      file: baseSlug,
      nested: isNested,
    });
  }
  if (!italicMeta.creatureType) {
    log.debug('Missing creature type', {
      creature: displayName,
      file: baseSlug,
      nested: isNested,
    });
  }
  if (!cr) {
    log.debug('Missing CR', {
      creature: displayName,
      file: baseSlug,
      nested: isNested,
    });
  }
  if (!headerStats.ac) {
    log.debug('Missing AC', {
      creature: displayName,
      file: baseSlug,
      nested: isNested,
    });
  }
  if (!headerStats.hp) {
    log.debug('Missing HP', {
      creature: displayName,
      file: baseSlug,
      nested: isNested,
    });
  }
  if (!headerStats.speed) {
    log.debug('Missing speed', {
      creature: displayName,
      file: baseSlug,
      nested: isNested,
    });
  }

  return {
    slug: baseSlug,
    subSlug,
    title:
      title ||
      baseSlug.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    file: path.relative(process.cwd(), filePath).replace(/\\/g, '/'),
    link:
      subSlug !== baseSlug
        ? `/library/monsters/${baseSlug}#${subSlug}`
        : `/library/monsters/${baseSlug}`,
    size: italicMeta.size?.toLowerCase(),
    creatureType: italicMeta.creatureType?.toLowerCase(),
    alignment: italicMeta.alignment?.toLowerCase(),
    ac: headerStats.ac,
    hp: headerStats.hp,
    speed: headerStats.speed,
    abilities,
    savingThrows,
    skills: skills.length ? skills : undefined,
    damageResistances: resist.length ? resist : undefined,
    damageImmunities: immune.length ? immune : undefined,
    damageVulnerabilities: vuln.length ? vuln : undefined,
    conditionImmunities: condImm.length ? condImm : undefined,
    senses,
    languages: languages.length ? languages : undefined,
    cr,
    proficiencyBonus,
    tags: tags.length ? tags : undefined,
    indexVersion: 2,
  };
}

/**
 * Parses a single monster file and extracts all metadata.
 * Returns array of metadata objects (one per stat block found).
 * @param {string} filePath - Path to `.sheet.mdx` file.
 * @param {Object} [sharedData=null] - Shared data object
 * @returns {Promise<object[]>} Array of monster metadata objects.
 */
async function parseMonsterFile(filePath, sharedData = null) {
  const raw = await fs.readFile(filePath, 'utf8');
  const lines = TextUtils.readLines(raw);
  const baseSlug = TextUtils.filePathToSlug(filePath);

  const statBlockPositions = findStatBlockPositions(lines, sharedData);

  if (statBlockPositions.length === 0) {
    // No stat blocks found - shouldn't happen but handle gracefully
    return [];
  }

  if (statBlockPositions.length > 1) {
    log.debug('Multi-stat block file detected', {
      file: baseSlug,
      statBlockCount: statBlockPositions.length,
    });
  }

  const results = [];

  for (let i = 0; i < statBlockPositions.length; i++) {
    const { lineIndex, isBlockquote } = statBlockPositions[i];
    const nextPos = statBlockPositions[i + 1];
    const endIdx = nextPos ? nextPos.lineIndex : lines.length;

    const sectionLines = extractStatBlockSection(
      lines,
      lineIndex,
      endIdx,
      isBlockquote,
    );
    const metadata = parseStatBlockSection(
      lines,
      sectionLines,
      lineIndex,
      isBlockquote,
      baseSlug,
      filePath,
      i,
      sharedData,
    );
    results.push(metadata);
  }

  return results;
}

/**
 * Main execution function with performance monitoring and parallel processing
 *
 * @async
 * @function main
 * @param {Object} [options] - Optional configuration for testing
 * @param {string} [options.contentDir] - Override content directory (for testing with fixtures)
 * @param {RegExp} [options.filePattern] - Override file pattern (for testing with custom files)
 * @returns {Promise<void>}
 * @throws {Error} If critical failures occur during processing
 *
 * @description Orchestrates the complete monster metadata generation pipeline
 * using the standardized MetadataGeneratorUtils pattern. Handles multi-stat block
 * files by returning arrays of metadata.
 *
 * @example
 * // Normal usage
 * await main();
 *
 * // Testing with fixtures
 * await main({ contentDir: 'tests/fixtures/monsters', filePattern: /\.sheet\.mdx$/i });
 */
async function main(options = {}) {
  await MetadataGeneratorUtils.runGenerator({
    name: 'Monster Metadata Generator',
    contentType: 'monsters',
    filePattern: options.filePattern || /\.sheet\.mdx$/i,
    parseFile: parseMonsterFile,
    processResult: (metadataArray) => ({
      metadata: metadataArray,
      count: metadataArray.length, // Track stat block count
    }),
    contentDir: options.contentDir,
    storage: options.storage,
  });
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  MetadataGeneratorUtils.runWithCli(main).catch((error) => {
    log.error('Fatal error during monster metadata generation', {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  });
}

export { main, parseMonsterFile };

