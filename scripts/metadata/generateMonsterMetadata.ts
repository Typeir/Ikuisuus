/**
 * @fileoverview Monster Metadata Generator
 * @description Advanced parser for D&D monster stat blocks in MDX format.
 * Extracts structured metadata including combat stats, abilities, resistances,
 * challenge ratings, and gameplay mechanics. Supports multiple stat blocks per file
 * and nested blockquote stat blocks for variants.
 *
 * @module scripts/metadata/generateMonsterMetadata
 * @version 4.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { createLogger } from '@/lib/logging/logger';
import {
    GameData,
    clean,
    extractAllTags,
    filePathToSlug,
    parseKeyBullets,
    parseNumericValue,
    readLines,
    runGenerator,
    runWithCli,
    splitList,
    splitListWithGrouping,
    type SharedData,
    type StorageAdapter,
} from '@/lib/metadata';
import { promises as fs } from 'fs';
import path from 'path';

const log = createLogger({ component: 'MonsterMetadataGenerator' });

/**
 * Speed data with raw text and parsed movement modes.
 *
 * @property {string} raw - Original speed text
 * @property {Record<string, number | boolean>} modes - Parsed movement modes
 */
interface SpeedData {
  raw: string;
  modes: Record<string, number | boolean>;
}

/**
 * Result of parsing the italic metadata line.
 *
 * @property {string} [size] - Creature size
 * @property {string} [creatureType] - Creature type
 * @property {string} [alignment] - Creature alignment
 */
interface ItalicMeta {
  size?: string;
  creatureType?: string;
  alignment?: string;
}

/**
 * Parses the italic metadata line containing size, creature type, and alignment.
 *
 * @param {string[]} lines - Array of document lines to search
 * @param {SharedData} sharedData - Shared data for size list
 * @returns {ItalicMeta} Parsed creature metadata
 */
function parseItalicMeta(lines: string[], sharedData: SharedData): ItalicMeta {
  const sizeList = GameData.getSizes(sharedData);
  const statBlockPattern = new RegExp(`^_(${sizeList.join('|')})\\s+`, 'i');
  const line = lines.find((l) => statBlockPattern.test(l));
  if (!line) return {};

  const inner = clean(line.replace(/^_/, '').replace(/_$/, ''));
  const [left, rightAlign] = inner.split(/\s*,\s*/, 2);

  let size = '';
  let creatureType = '';
  if (left) {
    for (const s of sizeList) {
      if (left.toLowerCase().startsWith(s.toLowerCase())) {
        size = s;
        creatureType = clean(left.slice(s.length));
        break;
      }
    }
  }

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
 * Parses Markdown table row into individual cell values.
 *
 * @param {string} line - Raw Markdown table row
 * @returns {string[]} Array of cleaned cell contents
 */
function parseTableRowCells(line: string): string[] {
  return line
    .split('|')
    .slice(1, -1)
    .map((c) => clean(c));
}

/**
 * Extracts AC, HP, and Speed from the stat block table.
 *
 * @param {string[]} lines - Array of document lines
 * @returns {{ ac?: object, hp?: object, speed?: SpeedData }} Parsed combat stats
 */
function findArmorHpSpeed(lines: string[]) {
  const idx = lines.findIndex((l) => /\|\s*\*\*Armor\s*Class\*\*/i.test(l));
  if (idx === -1) return {};

  let dataRow = lines[idx + 2];
  if (!/^\s*\|/.test(dataRow)) {
    dataRow = lines.slice(idx + 1).find((l) => /^\s*\|/.test(l)) || '';
  }

  const cells = parseTableRowCells(dataRow || '');
  const [acRaw, hpRaw, speedRaw] = cells;

  const acMatch = (acRaw || '').match(/([\d,]+)\s*(?:\((.*?)\))?/);
  const ac = acMatch ? parseNumericValue(acMatch[1]) : undefined;
  const acNotes = acMatch?.[2] || undefined;

  const hpMatch = (hpRaw || '').match(/([\d,]+)\s*(?:\((.*?)\))?/);
  const hpAverage = hpMatch ? parseNumericValue(hpMatch[1]) : undefined;
  const hpFormula = hpMatch?.[2] || undefined;

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
 * Parses D&D speed string into structured movement modes.
 *
 * @param {string} raw - Raw speed text
 * @returns {SpeedData | undefined} Parsed speed data
 */
function parseSpeed(raw: string): SpeedData | undefined {
  if (!raw) return undefined;

  const parts = raw.split(/\s*,\s*/);
  const modes: Record<string, number | boolean> = {};

  for (const p of parts) {
    const isHover = /\bhover\b/i.test(p);
    if (isHover) modes.hover = true;

    const m = p.match(/(?:(walk|climb|fly|swim|burrow)\s+)?(\d+)\s*ft\.?/i);
    if (m) {
      const mode = (m[1] || 'walk').toLowerCase();
      modes[mode] = Number(m[2]);
    } else {
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
 * Parses the six core ability scores from the stat block table.
 *
 * @param {string[]} lines - Array of document lines
 * @returns {object | undefined} Ability scores
 */
function parseAbilities(lines: string[]) {
  const idx = lines.findIndex((l) =>
    /^\s*\|\s*\*?\*?STR\*?\*?\s+\|\s*\*?\*?DEX\*?\*?\s+\|\s*\*?\*?CON\*?\*?\s+\|\s*\*?\*?INT\*?\*?\s+\|\s*\*?\*?WIS\*?\*?\s+\|\s*\*?\*?CHA\*?\*?\s*\|/i.test(
      l,
    ),
  );
  if (idx === -1) return undefined;

  let valuesRow = '';
  for (let i = idx + 1; i < Math.min(idx + 5, lines.length); i++) {
    const line = lines[i].trim();
    if (!/^\|[-\s|]+\|$/.test(line)) {
      valuesRow = line;
      break;
    }
  }

  if (!valuesRow) return undefined;

  const cells = parseTableRowCells(valuesRow);

  const toPair = (cell: string) => {
    const m = cell.match(/(\d+)/);
    if (m) {
      const score = Number(m[1]);
      return { score, mod: Math.floor((score - 10) / 2) };
    }
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
 *
 * @param {string} [raw] - Raw saving throws string
 * @returns {Record<string, number> | undefined} Map of ability → bonus
 */
function parseSavingThrows(raw?: string): Record<string, number> | undefined {
  if (!raw) return undefined;
  const out: Record<string, number> = {};
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
 *
 * @param {string} [raw] - Raw senses string
 * @param {SharedData} sharedData - Shared data for sense types
 * @returns {object | undefined} Parsed senses
 */
function parseSenses(raw: string | undefined, sharedData: SharedData) {
  if (!raw) return undefined;
  const senses: Record<string, unknown> = { raw };
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
 *
 * @param {string} [rawChallenge] - Raw challenge string
 * @returns {string | undefined} CR value
 */
function parseCR(rawChallenge?: string): string | undefined {
  if (!rawChallenge) return undefined;
  const m = rawChallenge.match(/(\d+\/\d+|\d+)/);
  return m ? m[1] : undefined;
}

/**
 * Parses proficiency bonus.
 *
 * @param {string} [rawPB] - Raw proficiency bonus string
 * @returns {number | undefined} Proficiency bonus value
 */
function parseProficiencyBonus(rawPB?: string): number | undefined {
  if (!rawPB) return undefined;
  const m = rawPB.match(/([+-]?\d+)/);
  return m ? Number(m[1]) : undefined;
}

/**
 * Finds line indices of all stat blocks in a file.
 *
 * @param {string[]} lines - File lines
 * @param {SharedData} sharedData - Shared data for sizes
 * @returns {{ lineIndex: number, isBlockquote: boolean }[]} Array of positions
 */
function findStatBlockPositions(
  lines: string[],
  sharedData: SharedData,
): { lineIndex: number; isBlockquote: boolean }[] {
  const positions: { lineIndex: number; isBlockquote: boolean }[] = [];
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
 *
 * @param {string[]} lines - All file lines
 * @param {number} statBlockLineIdx - Line index of the italic line
 * @param {number} endIdx - Ending line index (exclusive)
 * @param {boolean} isBlockquote - Whether this is a blockquote stat block
 * @returns {string[]} Section lines
 */
function extractStatBlockSection(
  lines: string[],
  statBlockLineIdx: number,
  endIdx: number,
  isBlockquote: boolean,
): string[] {
  const lookbackStart = Math.max(0, statBlockLineIdx - 10);

  if (isBlockquote) {
    let blockquoteEnd = statBlockLineIdx + 1;
    for (let i = statBlockLineIdx + 1; i < lines.length; i++) {
      if (!lines[i].startsWith('>') && lines[i].trim() !== '') {
        blockquoteEnd = i;
        break;
      }
      if (i === lines.length - 1) {
        blockquoteEnd = lines.length;
        break;
      }
    }
    const section = lines.slice(lookbackStart, blockquoteEnd);
    return section.map((line) => line.replace(/^>\s*/, ''));
  }

  return lines.slice(lookbackStart, endIdx);
}

/**
 * Finds the closest heading before the stat block line.
 *
 * @param {string[]} allLines - All file lines
 * @param {number} statBlockLineIdx - Index of the italic line
 * @param {boolean} isBlockquote - Whether this is a blockquote stat block
 * @returns {string} Title or empty string
 */
function findStatBlockTitle(
  allLines: string[],
  statBlockLineIdx: number,
  isBlockquote: boolean,
): string {
  for (
    let i = statBlockLineIdx - 1;
    i >= Math.max(0, statBlockLineIdx - 15);
    i--
  ) {
    const line = allLines[i];
    if (isBlockquote) {
      const match = line.match(/^>\s*#{1,4}\s+\*?\*?(.+?)\*?\*?\s*$/);
      if (match) return match[1].trim();
    } else {
      const match = line.match(/^#{1,3}\s+\*?\*?(.+?)\*?\*?\s*$/);
      if (match) return match[1].trim();
    }
  }
  return '';
}

/** Regex matching a BlendedImage JSX tag with a src attribute (single line). */
const BLENDED_IMAGE_SINGLE =
  /<BlendedImage\s[^>]*?src\s*=\s*['"]([^'"]+)['"]/i;

/** Regex matching a src attribute on any line (for multi-line JSX). */
const SRC_ATTR_PATTERN = /^\s*src\s*=\s*['"]([^'"]+)['"]/i;

/**
 * Finds the image path closest to a stat block by scanning backwards from the
 * italic creature-type line towards the variant heading. For the first stat
 * block (index 0) also scans from the file start.
 *
 * For multi-variant files with per-variant images (e.g. xanthous.sheet.mdx),
 * each variant gets the BlendedImage between its heading and the italic line.
 * When no per-variant image is found, falls back to the first BlendedImage in
 * the entire file (shared header pattern, e.g. cornucopios.sheet.mdx).
 *
 * @param {string[]} allLines - All file lines
 * @param {number} statBlockLineIdx - Index of the italic stat block line
 * @param {number} statBlockIndex - 0-based stat block index in the file
 * @param {{ lineIndex: number }[]} allPositions - Positions of all stat blocks
 * @returns {string | undefined} Image `src` path or undefined
 */
function findMonsterImage(
  allLines: string[],
  statBlockLineIdx: number,
  statBlockIndex: number,
  allPositions: { lineIndex: number }[],
): string | undefined {
  const scanStart =
    statBlockIndex === 0
      ? 0
      : (allPositions[statBlockIndex - 1]?.lineIndex ?? 0);

  let scanEnd = statBlockLineIdx;
  for (let i = statBlockLineIdx + 1; i < Math.min(statBlockLineIdx + 15, allLines.length); i++) {
    if (/^\|/.test(allLines[i])) break;
    scanEnd = i + 1;
  }

  let lastImage: string | undefined;
  let inBlendedImage = false;
  for (let i = scanStart; i < scanEnd; i++) {
    const line = allLines[i];
    const singleMatch = line.match(BLENDED_IMAGE_SINGLE);
    if (singleMatch) {
      lastImage = singleMatch[1];
      inBlendedImage = false;
      continue;
    }
    if (/<BlendedImage\b/i.test(line)) {
      inBlendedImage = true;
      continue;
    }
    if (inBlendedImage) {
      const srcMatch = line.match(SRC_ATTR_PATTERN);
      if (srcMatch) {
        lastImage = srcMatch[1];
        inBlendedImage = false;
      }
      if (/\/>/.test(line)) inBlendedImage = false;
    }
  }

  if (lastImage) return lastImage;

  if (statBlockIndex > 0) {
    let fallbackImage: string | undefined;
    let inTag = false;
    for (let i = 0; i < allPositions[0].lineIndex; i++) {
      const line = allLines[i];
      const singleMatch = line.match(BLENDED_IMAGE_SINGLE);
      if (singleMatch) { fallbackImage = singleMatch[1]; inTag = false; continue; }
      if (/<BlendedImage\b/i.test(line)) { inTag = true; continue; }
      if (inTag) {
        const srcMatch = line.match(SRC_ATTR_PATTERN);
        if (srcMatch) { fallbackImage = srcMatch[1]; inTag = false; }
        if (/\/>/.test(line)) inTag = false;
      }
    }
    if (fallbackImage) return fallbackImage;
  }

  return undefined;
}

/**
 * Parses a stat block section and extracts metadata.
 *
 * @param {string[]} allLines - All file lines
 * @param {string[]} sectionLines - Lines for this stat block
 * @param {number} statBlockLineIdx - Original line index
 * @param {boolean} isBlockquote - Whether this is a blockquote stat block
 * @param {string} baseSlug - Base slug from filename
 * @param {string} filePath - Original file path
 * @param {number} statBlockIndex - Index of this stat block (0 for first/main)
 * @param {SharedData} sharedData - Shared data object
 * @param {{ lineIndex: number }[]} allPositions - All stat block positions in file
 * @returns {object} Stat block metadata
 */
function parseStatBlockSection(
  allLines: string[],
  sectionLines: string[],
  statBlockLineIdx: number,
  isBlockquote: boolean,
  baseSlug: string,
  filePath: string,
  statBlockIndex: number,
  sharedData: SharedData,
  allPositions: { lineIndex: number }[],
) {
  const sectionText = sectionLines.join('\n');
  const title = findStatBlockTitle(allLines, statBlockLineIdx, isBlockquote);

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

  const bulletMap = parseKeyBullets(sectionText);
  const savingThrows = parseSavingThrows(bulletMap['Saving Throws']);
  const senses = parseSenses(bulletMap['Senses'], sharedData);
  const languages = splitList(bulletMap['Languages']);
  const nonmagicalPattern =
    /bludgeoning,?\s+piercing,?\s+and\s+slashing\s+from\s+nonmagical\s+[^;,]+/i;
  const resist = splitListWithGrouping(
    bulletMap['Damage Resistances'],
    nonmagicalPattern,
  );
  const immune = splitListWithGrouping(
    bulletMap['Damage Immunities'],
    nonmagicalPattern,
  );
  const vuln = splitListWithGrouping(
    bulletMap['Damage Vulnerabilities'],
    nonmagicalPattern,
  );
  const condImm = splitList(bulletMap['Condition Immunities']);
  const skills = bulletMap['Skills'] ? splitList(bulletMap['Skills']) : [];
  const cr = parseCR(bulletMap['Challenge']);
  const proficiencyBonus = parseProficiencyBonus(
    bulletMap['Proficiency Bonus'],
  );

  const linesToScan =
    statBlockIndex === 0 && !isBlockquote ? allLines : sectionLines;

  let contentStartIdx = 0;
  for (let i = 0; i < linesToScan.length; i++) {
    if (linesToScan[i].trim() === '---') {
      contentStartIdx = i + 1;
      break;
    }
  }
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

  const tags = extractAllTags(content, filePath, sharedData, {
    contentType: 'monster',
    requireFlightMeasurement: true,
  });

  if (italicMeta.creatureType) {
    tags.push(`creature:${italicMeta.creatureType.toLowerCase()}`);
  }

  if (cr) {
    const crNum = parseFloat(cr);
    if (crNum >= 17) tags.push('rarity:legendary');
    else if (crNum >= 11) tags.push('rarity:epic');
    else if (crNum >= 5) tags.push('rarity:rare');
    else tags.push('rarity:common');
  }

  if (italicMeta.size) {
    tags.push(`size:${italicMeta.size.toLowerCase()}`);
  }

  tags.sort();

  const displayName = title || baseSlug;
  const isNested = statBlockIndex > 0 || isBlockquote;

  if (!italicMeta.size)
    log.debug('Missing size field', {
      creature: displayName,
      file: baseSlug,
      nested: isNested,
    });
  if (!italicMeta.creatureType)
    log.debug('Missing creature type', {
      creature: displayName,
      file: baseSlug,
      nested: isNested,
    });
  if (!cr)
    log.debug('Missing CR', {
      creature: displayName,
      file: baseSlug,
      nested: isNested,
    });
  if (!headerStats.ac)
    log.debug('Missing AC', {
      creature: displayName,
      file: baseSlug,
      nested: isNested,
    });
  if (!headerStats.hp)
    log.debug('Missing HP', {
      creature: displayName,
      file: baseSlug,
      nested: isNested,
    });
  if (!headerStats.speed)
    log.debug('Missing speed', {
      creature: displayName,
      file: baseSlug,
      nested: isNested,
    });

  const image = findMonsterImage(
    allLines,
    statBlockLineIdx,
    statBlockIndex,
    allPositions,
  );

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
    image,
    indexVersion: 2,
  };
}

/**
 * Parses a single monster file and extracts all metadata.
 *
 * @param {string} filePath - Path to .sheet.mdx file
 * @param {SharedData} sharedData - Shared data object
 * @returns {Promise<object[]>} Array of monster metadata objects
 */
async function parseMonsterFile(
  filePath: string,
  sharedData: SharedData,
): Promise<object[]> {
  const raw = await fs.readFile(filePath, 'utf8');
  const lines = readLines(raw);
  const baseSlug = filePathToSlug(filePath);

  const statBlockPositions = findStatBlockPositions(lines, sharedData);

  if (statBlockPositions.length === 0) return [];

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
      statBlockPositions,
    );
    results.push(metadata);
  }

  return results;
}

/**
 * Main execution function.
 *
 * @param {object} [options] - Optional configuration
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
    name: 'Monster Metadata Generator',
    contentType: 'monsters',
    filePattern: options.filePattern || /\.sheet\.mdx$/i,
    parseFile: parseMonsterFile,
    processResult: (metadataArray) => ({
      metadata: metadataArray,
      count: (metadataArray as unknown[]).length,
    }),
    contentDir: options.contentDir,
    storage: options.storage,
  });
}

const isDirectRun =
  import.meta.url === `file://${process.argv[1]}` ||
  import.meta.url === new URL(`file://${process.argv[1]}`).href;

if (isDirectRun) {
  runWithCli(main).catch((error) => {
    log.error('Fatal error during monster metadata generation', {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    process.exit(1);
  });
}

export { main, parseMonsterFile };
