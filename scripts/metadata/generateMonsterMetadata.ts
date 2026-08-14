/**
 * @fileoverview Monster Metadata Generator
 * @description Parses monster stat blocks in MDX format and extracts metadata.
 * Supports multiple stat blocks per file and blockquote stat blocks for variants.
 *
 * @module scripts/metadata/generateMonsterMetadata
 * @version 4.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { createLogger } from '@/lib/logging/logger';
import { toNativeMeasure, toPlainMeasure } from '@/lib/units/nativeMeasure';
import { promises as fs } from 'fs';
import path from 'path';
import {
  GameData,
  clean,
  extractAllTags,
  filePathToSlug,
  findContentImage,
  parseFirstProseParagraph,
  parseKeyBullets,
  parseNumericValue,
  plain,
  readLines,
  runGenerator,
  runWithCli,
  splitList,
  splitListWithGrouping,
  stripMarkdown,
  type SharedData,
  type StorageAdapter,
} from '.';
import { MONSTER, STRUCTURE } from './extraction/featurePatterns';
import { extractStrataTags } from './aspectExtractors';
import { extractStatBlockFieldAspects, tagFeatures } from './featureAspects';
import { parseMonsterFeatures } from './generateFeatureMetadata';
import {
  IMAGE,
  ITALIC_META,
  MONSTER_HEADING,
  SPEED,
  STAT_CONTENT,
  STAT_TABLE,
} from './monsterPatterns';
import { LIST, SLUG, TEXT, UTILITY } from './parsingPatterns';

const log = createLogger({ component: 'MonsterMetadataGenerator' });

/**
 * Speed data with raw text and parsed flat movement modes.
 *
 * @property {string} raw - Original speed text
 * @property {number | boolean} [walk] - Walk speed in feet
 * @property {number | boolean} [fly] - Fly speed in feet
 * @property {number | boolean} [climb] - Climb speed in feet
 * @property {number | boolean} [swim] - Swim speed in feet
 * @property {number | boolean} [burrow] - Burrow speed in feet
 * @property {boolean} [hover] - Whether the creature hovers while flying
 */
interface SpeedData {
  raw: string;
  [key: string]: number | boolean | string | undefined;
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

  const inner = clean(
    line
      .replace(TEXT.underscoreLeading, '')
      .replace(TEXT.underscoreTrailing, ''),
  );
  const [left, rightAlign] = inner.split(LIST.commaWhitespace, 2);

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
    .replace(ITALIC_META.cleanPrefix, '')
    .replace(ITALIC_META.stripParen, '')
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
  const idx = lines.findIndex((l) => MONSTER.armorClassHeader.test(l));
  if (idx === -1) return {};

  let dataRow = lines[idx + 2];
  if (!STAT_TABLE.dataRow.test(dataRow)) {
    dataRow =
      lines.slice(idx + 1).find((l) => STAT_TABLE.dataRow.test(l)) || '';
  }

  const cells = parseTableRowCells(dataRow || '');
  const [acRaw, hpRaw, speedRaw] = cells;

  const acMatch = (acRaw || '').match(STRUCTURE.numericWithParen);
  const ac = acMatch ? parseNumericValue(acMatch[1]) : undefined;
  const acNotes = acMatch?.[2] || undefined;

  const hpMatch = (hpRaw || '').match(STRUCTURE.numericWithParen);
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
 * Parses Damocles speed string into structured movement modes.
 *
 * @param {string} raw - Raw speed text
 * @returns {SpeedData | undefined} Parsed speed data
 */
function parseSpeed(raw: string): SpeedData | undefined {
  if (!raw) return undefined;

  const parts = raw.split(LIST.commaWhitespace);
  /* Parsed from the source form, stored in the native one: the mode patterns
     below read `[= 8 stride =]`, while the stored value must carry no markdown. */
  const result: SpeedData = { raw: toNativeMeasure(raw) };

  for (const p of parts) {
    const isHover = MONSTER.hover.test(p);
    if (isHover) result.hover = true;

    const m = p.match(MONSTER.speedMode);
    if (m) {
      const mode = (m[1] || 'walk').toLowerCase();
      result[mode] = Number(m[2]);
    } else {
      const mh = p.match(SPEED.hoverDistance);
      if (mh) {
        result.fly = Number(mh[1]);
        result.hover = true;
      }
    }
  }

  return result;
}

/**
 * Parses the six core ability scores from the stat block table.
 *
 * @param {string[]} lines - Array of document lines
 * @returns {{ str?: number, dex?: number, con?: number, int?: number, wis?: number, cha?: number } | undefined} Flat ability scores
 */
function parseAbilities(lines: string[]) {
  const idx = lines.findIndex((l) => STAT_TABLE.abilityHeader.test(l));
  if (idx === -1) return undefined;

  let valuesRow = '';
  for (let i = idx + 1; i < Math.min(idx + 5, lines.length); i++) {
    const line = lines[i].trim();
    if (!STAT_TABLE.separatorRow.test(line)) {
      valuesRow = line;
      break;
    }
  }

  if (!valuesRow) return undefined;

  const cells = parseTableRowCells(valuesRow);

  const toScore = (cell: string): number | undefined => {
    const m = cell.match(UTILITY.numericExtract);
    return m ? Number(m[1]) : undefined;
  };

  if (cells.length < 6) return undefined;

  const scores: Record<string, number | undefined> = {
    str: toScore(cells[0]),
    dex: toScore(cells[1]),
    con: toScore(cells[2]),
    int: toScore(cells[3]),
    wis: toScore(cells[4]),
    cha: toScore(cells[5]),
  };

  const defined = Object.fromEntries(
    Object.entries(scores).filter(([, v]) => v !== undefined),
  );
  return Object.keys(defined).length ? defined : undefined;
}

/**
 * Parses saving throw bonuses.
 *
 * @param {string} [raw] - Raw saving throws string
 * @returns {{ str?: number, dex?: number, con?: number, int?: number, wis?: number, cha?: number } | undefined} Flat map of ability → bonus
 */
function parseSavingThrows(raw?: string): Record<string, number> | undefined {
  if (!raw) return undefined;
  const out: Record<string, number> = {};
  for (const part of raw.split(LIST.commaWhitespace)) {
    const m = part.match(MONSTER.savingThrowBonus);
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
  const senses: Record<string, unknown> = { raw: toNativeMeasure(raw) };
  const p = raw.match(MONSTER.passivePerception);
  if (p) senses.passivePerception = Number(p[1]);
  const senseKeys = GameData.getSenses(sharedData);
  for (const key of senseKeys) {
    const r = new RegExp(
      `${key}\\s+(?:\\[=\\s*)?(\\d+)\\s*(?:stride(?:;ADJ)?\\s*=\\]|ft\\.?)`,
      'i',
    );
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
  const m = rawChallenge.match(MONSTER.challengeRating);
  return m ? m[1] : undefined;
}

/**
 * Parses tier bonus.
 *
 * @param {string} [rawPB] - Raw tier bonus string
 * @returns {number | undefined} tier bonus value
 */
function parseTierBonus(rawPB?: string): number | undefined {
  if (!rawPB) return undefined;
  const m = rawPB.match(UTILITY.numericExtract);
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
    return section.map((line) =>
      line.replace(STAT_CONTENT.blockquotePrefix, ''),
    );
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
      const match = line.match(MONSTER_HEADING.blockquoteHeading);
      if (match) return match[1].trim();
    } else {
      const match = line.match(MONSTER_HEADING.normalHeading);
      if (match) return match[1].trim();
    }
  }
  return '';
}

/**
 * Finds the image path closest to a stat block by scanning backwards from the
 * italic creature-type line towards the variant heading. For the first stat
 * block (index 0) also scans from the file start. Falls back to the first image
 * in the file when a variant block has no per-variant image.
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
  for (
    let i = statBlockLineIdx + 1;
    i < Math.min(statBlockLineIdx + 15, allLines.length);
    i++
  ) {
    if (IMAGE.tableStart.test(allLines[i])) break;
    scanEnd = i + 1;
  }

  const windowImage = findContentImage(allLines, scanStart, scanEnd);
  if (windowImage) return windowImage;

  /* Variant blocks with no image of their own inherit the file's shared
     header image (everything before the first stat block). */
  if (statBlockIndex > 0) {
    return findContentImage(allLines, 0, allPositions[0].lineIndex);
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
/**
 * Extracts the lore description from a stat block section.
 * Collects prose lines between the italic creature-type line and the first table
 * row, filtering out italics, JSX elements, headings, blockquotes, and empty lines.
 *
 * @param {string[]} sectionLines - Lines extracted for this stat block
 * @returns {string | undefined} Prose description with markdown stripped, or undefined
 */
function parseMonsterDescription(sectionLines: string[]): string | undefined {
  const tableIdx = sectionLines.findIndex((l) => l.trim().startsWith('|'));
  if (tableIdx === -1) return undefined;

  // Find the italic metadata line (_Size Type, alignment_)
  const italicIdx = sectionLines.findIndex((l) => /^_[^_]+_$/.test(l.trim()));
  if (italicIdx === -1) return undefined;

  // Start from line after the italic metadata line
  const candidate = sectionLines
    .slice(italicIdx + 1, tableIdx)
    .map((l) => l.trim());

  const descLines = candidate.filter(
    (l) =>
      l.length > 0 &&
      !l.startsWith('#') &&
      !l.startsWith('<') &&
      !l.startsWith('>') &&
      !l.startsWith('|') &&
      !l.includes('/>') &&
      !l.includes('=') && // Exclude JSX attribute lines
      !/^-{3,}$/.test(l), // Exclude markdown dividers
  );

  return descLines.length > 0
    ? descLines.map((l) => plain(l)).join('\n')
    : undefined;
}

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
        .replace(SLUG.nonAlphaKeepSpaces, '')
        .replace(TEXT.whitespaceCollapse, '-')
        .replace(SLUG.multiHyphens, '-')
        .replace(SLUG.singleEdgeHyphens, '')
    : undefined;

  const italicMeta = parseItalicMeta(sectionLines, sharedData);
  const headerStats = findArmorHpSpeed(sectionLines);
  const abilities = parseAbilities(sectionLines);

  const bulletMap = parseKeyBullets(sectionText);
  const savingThrows = parseSavingThrows(bulletMap['Saving Throws']);
  const senses = parseSenses(bulletMap['Senses'], sharedData);
  const languages = splitList(bulletMap['Languages']).map((v) => plain(v));
  const nonmagicalPattern = STAT_CONTENT.nonmagicalDamage;
  /* Scoped defence entries are atomic values a reader filters by, not prose. */
  const resist = splitListWithGrouping(
    bulletMap['Damage Resistances'],
    nonmagicalPattern,
  ).map((v) => plain(v));
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
  const tierBonus = parseTierBonus(bulletMap['Tier Bonus']);

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
      if (STAT_CONTENT.keyValueBullet.test(line)) {
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

  tags.push(
    ...extractStatBlockFieldAspects(
      {
        resistances: resist,
        immunities: immune,
        vulnerabilities: vuln,
        conditionImmunities: condImm,
        senses,
        speed: headerStats.speed as Record<string, unknown> | undefined,
      },
      sharedData,
    ),
  );

  /* The declared Damage Resistances / Immunities land after the shared tagger
     has already run, so the stratum pass repeats over the finished list. */
  tags.push(...extractStrataTags(tags, sharedData));

  const uniqueTags = Array.from(new Set(tags)).sort();
  tags.length = 0;
  tags.push(...uniqueTags);

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

  /* Section-local prose is rare (most sheets put lore before the stat
     block); fall back to the file's first prose paragraph for the main
     stat block so featured cards are not text-free. */
  const description =
    parseMonsterDescription(sectionLines) ??
    (statBlockIndex === 0 ? parseFirstProseParagraph(allLines) : undefined);

  const metadata: Record<string, unknown> = {
    slug: baseSlug,
    subSlug,
    title:
      title ||
      baseSlug
        .replace(SLUG.hyphensUnderscores, ' ')
        .replace(SLUG.titleCase, (c) => c.toUpperCase()),
    file: path
      .relative(process.cwd(), filePath)
      .replace(SLUG.pathBackslash, '/'),
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
    scores: abilities,
    saves: savingThrows,
    skills: skills.length ? skills : undefined,
    damageResistances: resist.length ? resist : undefined,
    damageImmunities: immune.length ? immune : undefined,
    damageVulnerabilities: vuln.length ? vuln : undefined,
    conditionImmunities: condImm.length ? condImm : undefined,
    senses,
    languages: languages.length ? languages : undefined,
    cr,
    tierBonus,
    tags: tags.length ? tags : undefined,
    image,
    indexVersion: 2,
  };

  if (description) {
    metadata.description = description;
  }

  return metadata;
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
    (metadata as Record<string, unknown>).blockStart = lineIndex;
    (metadata as Record<string, unknown>).blockEnd = endIdx;
    results.push(metadata);
  }

  const features = await parseMonsterFeatures(filePath);
  for (let i = 0; i < results.length; i++) {
    const r = results[i] as Record<string, unknown>;
    const bStart = r.blockStart as number;
    const bEnd = r.blockEnd as number;
    const owned = features.filter(
      (f) => f.source && f.source.start >= bStart && f.source.start < bEnd,
    );
    tagFeatures(owned, lines, sharedData);
    r.features = owned;
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
 * @param {string} [options.fileFilter] - Single filename to process (--file)
 * @returns {Promise<void>}
 */
async function main(
  options: {
    contentDir?: string;
    filePattern?: RegExp;
    storage?: StorageAdapter;
    fileFilter?: string;
  } = {},
): Promise<void> {
  await runGenerator({
    name: 'Monster Metadata Generator',
    contentType: 'monsters',
    filePattern: options.filePattern || STAT_CONTENT.sheetFilePattern,
    parseFile: parseMonsterFile,
    processResult: (metadataArray) => ({
      metadata: metadataArray,
      count: (metadataArray as unknown[]).length,
    }),
    contentDir: options.contentDir,
    storage: options.storage,
    fileFilter: options.fileFilter,
    metadataVersion: '4.0.0',
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
