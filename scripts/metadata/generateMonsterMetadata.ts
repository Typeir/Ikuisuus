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
import matter from 'gray-matter';
import path from 'path';
import {
  GameData,
  applyAuthoredAspects,
  applyAuthoredFeatureAspects,
  stampAnchors,
  blankFrontmatter,
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
import type { MonsterFeature } from '@/lib/types/feature';
import { parseMonsterFeaturesSource } from './generateFeatureMetadata';
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
): StatBlockPosition[] {
  const positions: StatBlockPosition[] = [];
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
      positions.push({ lineIndex: idx, isBlockquote, isObject: false });
      return;
    }
    if (isObjectBlockAnchor(lines, idx, blockquoteStatBlockPattern)) {
      positions.push({ lineIndex: idx, isBlockquote: true, isObject: true });
    }
  });

  return positions;
}

/**
 * A stat block anchor: the `_Size Type_` line of a creature, or the heading of
 * a quoted object block (AC/HP table, no creature line).
 *
 * @property {number} lineIndex - Anchor line
 * @property {boolean} isBlockquote - Block lives inside a `>` quote
 * @property {boolean} isObject - Object block (plating, blade, drone) rather than a creature
 */
interface StatBlockPosition {
  lineIndex: number;
  isBlockquote: boolean;
  isObject: boolean;
}

/**
 * True when `idx` is the heading of a quoted object block: a `> #### Title`
 * heading followed within a few quoted lines by an Armor Class table row and
 * no `_Size Type_` creature line in between.
 *
 * @param {string[]} lines - All file lines
 * @param {number} idx - Candidate heading line
 * @param {RegExp} creatureLine - Quoted `_Size …_` pattern that marks a creature instead
 * @returns {boolean} Whether an object block starts here
 */
function isObjectBlockAnchor(
  lines: string[],
  idx: number,
  creatureLine: RegExp,
): boolean {
  if (!MONSTER_HEADING.blockquoteHeading.test(lines[idx])) return false;
  for (let i = idx + 1; i < Math.min(lines.length, idx + 6); i++) {
    const line = lines[i];
    if (!line.startsWith('>')) return false;
    if (creatureLine.test(line)) return false;
    if (STAT_CONTENT.armorClassRow.test(line)) return true;
  }
  return false;
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
  return parseMonsterSource(
    await fs.readFile(filePath, 'utf8'),
    filePath,
    sharedData,
  );
}

/**
 * Parses monster metadata from raw sheet source, no file read.
 *
 * @param {string} raw - Complete sheet text including frontmatter
 * @param {string} filePath - Path the source belongs to, for slug and org tags
 * @param {SharedData} sharedData - Shared game data
 * @returns {object[]} One metadata record per stat block
 */
export function parseMonsterSource(
  raw: string,
  filePath: string,
  sharedData: SharedData,
): object[] {
  const lines = readLines(blankFrontmatter(raw));
  const baseSlug = filePathToSlug(filePath);
  const fileFrontmatter = matter(raw).data as Record<string, unknown>;

  const statBlockPositions = findStatBlockPositions(lines, sharedData);

  if (statBlockPositions.length === 0) return [];

  if (statBlockPositions.length > 1) {
    log.debug('Multi-stat block file detected', {
      file: baseSlug,
      statBlockCount: statBlockPositions.length,
    });
  }

  const results: Record<string, unknown>[] = [];
  const creaturePositions = statBlockPositions.filter((p) => !p.isObject);

  for (let i = 0; i < statBlockPositions.length; i++) {
    const { lineIndex, isBlockquote, isObject } = statBlockPositions[i];

    if (isObject) {
      const endIdx = blockquoteEnd(lines, lineIndex);
      const metadata = parseObjectBlock(
        lines,
        lineIndex,
        endIdx,
        baseSlug,
        filePath,
        sharedData,
      );
      metadata.blockStart = lineIndex;
      metadata.blockEnd = endIdx;
      results.push(metadata);
      continue;
    }

    /* Stat parsing runs to the next creature of any kind. Feature
       ownership differs: a quoted creature (a summon's statlet inside its
       summoner's sheet) owns only its quote, and the sheet's own creature
       runs on past it to the next unquoted creature; embedded object blocks
       (a goddess's plating) stay inside that range and are carved out of
       ownership below. */
    const creatureIdx = creaturePositions.findIndex(
      (p) => p.lineIndex === lineIndex,
    );
    const nextAny = creaturePositions[creatureIdx + 1];
    const endIdx = nextAny ? nextAny.lineIndex : lines.length;
    const nextUnquoted = creaturePositions
      .slice(creatureIdx + 1)
      .find((p) => !p.isBlockquote);
    const featureEnd = isBlockquote
      ? Math.min(blockquoteEnd(lines, lineIndex), endIdx)
      : nextUnquoted
        ? nextUnquoted.lineIndex
        : lines.length;

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
      creatureIdx,
      sharedData,
      creaturePositions,
    ) as Record<string, unknown>;
    metadata.blockStart = lineIndex;
    metadata.blockEnd = featureEnd;
    metadata.isBlockquote = isBlockquote;
    metadata.isObject = false;
    results.push(metadata);
  }

  const objectRanges = results
    .filter((r) => r.isObject || r.isBlockquote)
    .map((r) => [r.blockStart as number, r.blockEnd as number] as const);
  const insideObject = (line: number) =>
    objectRanges.some(([s, e]) => line >= s && line < e);

  const features = parseMonsterFeaturesSource(raw, baseSlug);
  /* Quoted creature blocks span to the next creature for stat parsing, but
     their features end where the quote ends — the lines after belong to the
     next statlet's title or to prose. */
  const quotedFeatures = parseQuotedBlockFeatures(
    lines,
    results
      .filter((r) => r.isBlockquote || r.isObject)
      .map((r, _i, all) => {
        const start = quoteStart(lines, r.blockStart as number);
        const nextStart = all
          .map((o) => quoteStart(lines, o.blockStart as number))
          .filter((o) => o > start)
          .sort((a, b) => a - b)[0];
        const quoteEnd = r.isObject
          ? (r.blockEnd as number)
          : blockquoteEnd(lines, r.blockStart as number);
        return {
          ...r,
          blockStart: start,
          blockEnd: Math.min(quoteEnd, nextStart ?? quoteEnd),
        };
      }),
    baseSlug,
  );

  for (const r of results) {
    const bStart = r.blockStart as number;
    const bEnd = r.blockEnd as number;
    const own = (f: MonsterFeature) =>
      !!f.source && f.source.start >= bStart && f.source.start < bEnd;
    const owned =
      r.isObject || r.isBlockquote
        ? quotedFeatures.filter(own)
        : features.filter((f) => own(f) && !insideObject(f.source!.start));
    tagFeatures(owned, lines, sharedData);
    r.features = dedupeFeatures(owned);
    stampAnchors(r.features as MonsterFeature[]);
    applyAuthoredFeatureAspects(r.features as MonsterFeature[], fileFrontmatter);
  }

  rollUpSubRecordTags(results);

  /* File-level frontmatter aspects/denyAspects apply to the sheet's parent
     record — the one that carries the rolled-up set. */
  const parent = results.find((r) => !r.isObject);
  if (parent) {
    parent.tags = applyAuthoredAspects(parent.tags as string[], fileFrontmatter);
  }

  for (const r of results) {
    delete r.blockStart;
    delete r.blockEnd;
    delete r.isBlockquote;
    delete r.isObject;
  }

  return results;
}

/**
 * Start of the statlet containing `line`: walks back over `>` lines to the
 * nearest quoted heading (the statlet's title) or the quote's first line, so
 * several statlets sharing one quote each get their own range.
 *
 * @param {string[]} lines - All file lines
 * @param {number} line - A line inside the quote
 * @returns {number} Start index
 */
function quoteStart(lines: string[], line: number): number {
  let i = line;
  while (i > 0 && lines[i - 1].startsWith('>')) {
    i--;
    if (MONSTER_HEADING.blockquoteHeading.test(lines[i])) return i;
  }
  return i;
}

/**
 * Index one past the last quoted line of the block starting at `start`.
 *
 * @param {string[]} lines - All file lines
 * @param {number} start - First line of the block
 * @returns {number} Exclusive end index
 */
function blockquoteEnd(lines: string[], start: number): number {
  let i = start;
  while (i < lines.length && lines[i].startsWith('>')) i++;
  return i;
}

/**
 * Parses a quoted object block (plating, blade, drone): heading title, AC/HP/
 * damage-threshold header row, tags from the block text. Objects carry no
 * scores or challenge; `meta:content:object` marks them.
 *
 * @param {string[]} lines - All file lines
 * @param {number} start - Heading line of the block
 * @param {number} end - Exclusive end of the quote
 * @param {string} baseSlug - File slug
 * @param {string} filePath - Source path
 * @param {SharedData} sharedData - Shared game data
 * @returns {Record<string, unknown>} Object metadata record
 */
function parseObjectBlock(
  lines: string[],
  start: number,
  end: number,
  baseSlug: string,
  filePath: string,
  sharedData: SharedData,
): Record<string, unknown> {
  const quoted = lines
    .slice(start, end)
    .map((l) => l.replace(STAT_CONTENT.blockquotePrefix, ''));
  const title =
    lines[start].match(MONSTER_HEADING.blockquoteHeading)?.[1].trim() ?? '';
  /* Objects are owned by their sheet — the same plating or blade can sit
     in two sheets — so the record slug is sheet-scoped; the page fragment
     stays the bare object anchor. */
  const objectSlug = title
    .toLowerCase()
    .replace(SLUG.nonAlphaKeepSpaces, '')
    .replace(TEXT.whitespaceCollapse, '-')
    .replace(SLUG.multiHyphens, '-')
    .replace(SLUG.singleEdgeHyphens, '');
  const subSlug = `${baseSlug}-${objectSlug}`;
  const headerStats = findArmorHpSpeed(quoted);
  const headerIdx = quoted.findIndex((l) => MONSTER.armorClassHeader.test(l));
  const thresholdRow =
    headerIdx === -1
      ? undefined
      : quoted
          .slice(headerIdx + 1)
          .find((l) => STAT_TABLE.dataRow.test(l) && !/^\|\s*-/.test(l));
  const thresholdRaw = thresholdRow ? parseTableRowCells(thresholdRow)[2] : '';
  const threshold = parseInt((thresholdRaw ?? '').replace(/\D/g, ''), 10);
  const content = quoted.join('\n');

  const tags = extractAllTags(content, filePath, sharedData, {
    contentType: 'monster',
    requireFlightMeasurement: true,
  });
  tags.push('meta:content:object', 'meta:content:sheet');
  tags.push(...extractStrataTags(tags, sharedData));

  return {
    slug: baseSlug,
    subSlug,
    title,
    file: path.relative(process.cwd(), filePath).replace(SLUG.pathBackslash, '/'),
    link: `/library/monsters/${baseSlug}#${objectSlug}`,
    kind: 'object',
    ac: headerStats.ac,
    hp: headerStats.hp,
    damageThreshold: Number.isNaN(threshold) ? undefined : threshold,
    tags: Array.from(new Set(tags)).sort(),
    isBlockquote: true,
    isObject: true,
  };
}

/**
 * Features of quoted blocks. Each block's own line range is de-quoted in
 * place (line numbers preserved) and run through the standard feature parser
 * with statlet rules on; only features anchored inside the block are kept.
 *
 * @param {string[]} lines - All file lines
 * @param {Record<string, unknown>[]} blocks - Records with blockStart/blockEnd
 * @param {string} baseSlug - File slug for feature IDs
 * @returns {MonsterFeature[]} Features across all quoted blocks
 */
function parseQuotedBlockFeatures(
  lines: string[],
  blocks: Record<string, unknown>[],
  baseSlug: string,
): MonsterFeature[] {
  const out: MonsterFeature[] = [];
  for (const block of blocks) {
    const start = block.blockStart as number;
    const end = block.blockEnd as number;
    const dequoted = lines.map((l, i) =>
      i >= start && i < end ? l.replace(STAT_CONTENT.blockquoteMarker, '') : l,
    );
    const feats = parseMonsterFeaturesSource(dequoted.join('\n'), baseSlug, {
      statlet: { start, end },
    });
    for (const f of feats) {
      if (!f.source || f.source.start < start || f.source.start >= end) continue;
      /* The last feature of a statlet otherwise runs to the section end,
         past the quote, and picks up the next block's tags. */
      f.source.end = Math.min(f.source.end, end);
      out.push(f);
    }
  }
  return out;
}

/**
 * Drops features that share an id and source start (a quoted block re-parsed
 * from two overlapping ranges).
 *
 * @param {MonsterFeature[]} features - Owned features
 * @returns {MonsterFeature[]} Deduplicated features, order preserved
 */
function dedupeFeatures(features: MonsterFeature[]): MonsterFeature[] {
  const seen = new Set<string>();
  return features.filter((f) => {
    const key = `${f.id}@${f.source?.start ?? -1}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Unions every sub-record's tags into the file's parent record so a sheet
 * is findable by anything its statlets carry. Sub-records keep their own
 * tags. The parent is the first non-object record.
 *
 * @param {Record<string, unknown>[]} results - All records of the file
 */
function rollUpSubRecordTags(results: Record<string, unknown>[]): void {
  const parent = results.find((r) => !r.isObject);
  if (!parent || results.length < 2) return;
  const union = new Set(parent.tags as string[]);
  for (const r of results) {
    if (r === parent) continue;
    for (const t of (r.tags as string[]) ?? []) {
      if (ROLL_UP_EXCLUDED.test(t)) continue;
      union.add(t);
    }
  }
  parent.tags = [...union].sort();
}

/**
 * Tag groups that describe the record itself, never its parent: `meta:*`
 * (an object statlet does not make the sheet an object) and `rarity:*`
 * (derived from each record's own challenge rating).
 */
const ROLL_UP_EXCLUDED = /^(meta|rarity):/;

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
