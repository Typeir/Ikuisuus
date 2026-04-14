/**
 * @fileoverview Bloodline Metadata Generator
 * @description Parses .mdx files from the bloodlines directory and extracts
 * metadata including core features, boon options, ability scores, and gameplay tags.
 *
 * Bloodline MDX files follow a canonical structure:
 *   H1 title → lore intro → `---` → Core Features tables → racial traits →
 *   `---` → Boons section with Collapsible blocks.
 *
 * Files named `main.mdx` and files inside `shared-boons/` are excluded from
 * processing (now also excluded by the `.bloodline.mdx` file pattern).
 * metadata generation (they are index/aggregate pages, not individual bloodlines).
 *
 * @module scripts/metadata/generateBloodlineMetadata
 * @version 1.0.0
 * @author Typeir
 * @since 7.0.0
 */

import { createLogger } from '@/lib/logging/logger';
import { promises as fs } from 'fs';
import path from 'path';
import {
  clean,
  extractAbilitySaveTags,
  extractAllTags,
  extractConditionTags,
  extractDamageTags,
  extractItemMechanicTags,
  extractMovementTags,
  filePathToSlug,
  parseTitle,
  runGenerator,
  runWithCli,
  type SharedData,
  type StorageAdapter,
} from '.';
import {
  BOON,
  BOON_MECHANICS,
  MARKUP,
  PROFICIENCY,
  SECTION,
} from './bloodlinePatterns';
import { SLUG, TEXT, UTILITY } from './parsingPatterns';

const log = createLogger({ component: 'BloodlineMetadataGenerator' });

/**
 * Parsed boon heading metadata.
 *
 * @property {string} name - Boon name
 * @property {string} bpLabel - Raw cost label
 */
interface ParsedBoonHeading {
  name: string;
  bpLabel: string;
}

/**
 * Parsed boon metadata payload.
 *
 * @property {string} name - Boon display name
 * @property {string} bpLabel - Raw BP cost label
 * @property {number} [bpValue] - Numeric BP value when deterministic
 * @property {number} sortOrder - Stable zero-based order in section
 * @property {string[]} tags - Derived boon gameplay tags
 */
interface ParsedBoon {
  name: string;
  bpLabel: string;
  bpValue?: number;
  sortOrder: number;
  tags: string[];
}

/* ────────────────────────  Parsing Helpers  ────────────────────────── */

/**
 * Extracts text items from HTML list markup within a table cell.
 * Handles `<Tooltip>` wrappers by extracting only the display span.
 *
 * @param {string} cellContent - Raw cell content containing `<ul><li>` markup
 * @returns {string[]} Extracted text items
 */
function parseListItems(cellContent: string): string[] {
  const items: string[] = [];
  const liRegex = new RegExp(MARKUP.listItem.source, MARKUP.listItem.flags);
  let match;
  while ((match = liRegex.exec(cellContent)) !== null) {
    let text = match[1];
    const tooltipMatch = text.match(MARKUP.tooltipText);
    if (tooltipMatch) {
      text = tooltipMatch[1];
    }
    text = text.replace(MARKUP.htmlTag, '').trim();
    if (text) items.push(text);
  }
  return items;
}

/**
 * Splits a pipe-delimited markdown table row into cell values.
 *
 * @param {string} row - Pipe-delimited table row
 * @returns {string[]} Trimmed cell values
 */
function parseTableRow(row: string): string[] {
  return row
    .split('|')
    .slice(1, -1)
    .map((cell) => cell.trim());
}

/**
 * Removes MDX/markdown markup while preserving semantic words for tag matching.
 *
 * @param {string} text - Raw MDX fragment
 * @returns {string} Normalized text
 */
function normalizeForTagging(text: string): string {
  const tooltipCollapsed = text.replace(MARKUP.tooltipWrapper, '$1');
  return tooltipCollapsed
    .replace(MARKUP.htmlTag, ' ')
    .replace(MARKUP.markdownLink, '$1')
    .replace(TEXT.markdownFormatChars, ' ')
    .replace(TEXT.whitespaceCollapse, ' ')
    .trim();
}

/**
 * Returns boons section lines between `## Boons` and the next `##` heading.
 *
 * @param {string} content - Full MDX content
 * @returns {string[]} Boons section lines
 */
function getBoonsSectionLines(content: string): string[] {
  const lines = content.split('\n');
  const start = lines.findIndex((line) => SECTION.boons.test(line.trim()));
  if (start === -1) {
    return [];
  }

  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (SECTION.h2Heading.test(lines[i].trim())) {
      end = i;
      break;
    }
  }

  return lines.slice(start + 1, end);
}

/**
 * Parses boon heading lines with support for span labels and inline BP labels.
 *
 * @param {string} line - Heading candidate line
 * @returns {ParsedBoonHeading | null} Parsed heading metadata or null
 */
function parseBoonHeading(line: string): ParsedBoonHeading | null {
  const trimmed = line.trim();
  if (!BOON.headingGuard.test(trimmed)) {
    return null;
  }

  const spanHeading = trimmed.match(BOON.spanHeading);
  if (spanHeading) {
    return {
      name: clean(normalizeForTagging(spanHeading[1])),
      bpLabel: clean(normalizeForTagging(spanHeading[2])),
    };
  }

  const inlineHeading = trimmed.match(BOON.plainHeading);
  if (!inlineHeading) {
    return null;
  }

  const normalized = clean(normalizeForTagging(inlineHeading[1]));
  const inlineCost = normalized.match(BOON.inlineCost);
  if (inlineCost) {
    return {
      name: clean(inlineCost[1]),
      bpLabel: clean(inlineCost[2]),
    };
  }

  return {
    name: normalized,
    bpLabel: 'Variable',
  };
}

/**
 * Parses deterministic BP value from a label.
 *
 * @param {string} bpLabel - Raw cost label
 * @returns {number | undefined} Parsed numeric value when present
 */
function parseBpValue(bpLabel: string): number | undefined {
  const match = bpLabel.match(BOON.bpValue);
  if (!match) {
    return undefined;
  }
  return Number.parseInt(match[1], 10);
}

/**
 * Extracts proficiency tags for skills/tools/instruments.
 *
 * @param {string} normalizedText - Normalized boon text
 * @returns {string[]} Derived proficiency tags
 */
function extractProficiencyTags(normalizedText: string): string[] {
  const tags = new Set<string>();
  const lower = normalizedText.toLowerCase();

  if (PROFICIENCY.keyword.test(lower)) {
    tags.add('mechanic:proficiency');
  }

  const skills = [
    'acrobatics',
    'animal handling',
    'arcana',
    'athletics',
    'deception',
    'history',
    'insight',
    'intimidation',
    'investigation',
    'medicine',
    'nature',
    'perception',
    'performance',
    'persuasion',
    'religion',
    'sleight of hand',
    'stealth',
    'survival',
  ];

  for (const skill of skills) {
    const escaped = skill.replace(UTILITY.regexEscape, '\\$&');
    const skillPattern = new RegExp(
      `\\bproficien(?:cy|t)\\b[\\s\\S]{0,40}\\b${escaped}\\b|\\b${escaped}\\b[\\s\\S]{0,20}\\bproficien(?:cy|t)\\b`,
      'i',
    );
    if (skillPattern.test(lower)) {
      tags.add('mechanic:skill-proficiency');
      tags.add(
        `mechanic:skill-proficiency:${skill.replace(TEXT.whitespaceCollapse, '-')}`,
      );
    }
  }

  for (const entry of PROFICIENCY.tools) {
    if (entry.pattern.test(lower)) {
      tags.add('mechanic:tool-proficiency');
      tags.add(`mechanic:tool-proficiency:${entry.tag}`);
    }
  }

  if (PROFICIENCY.instrument.test(lower)) {
    tags.add('mechanic:instrument-proficiency');
  }

  if (PROFICIENCY.weaponMastery.test(lower)) {
    tags.add('mechanic:weapon-proficiency');
  }

  return Array.from(tags);
}

/**
 * Extracts explicit boon mechanic tags not covered by shared generic taggers.
 *
 * @param {string} normalizedText - Normalized boon text
 * @param {string} bpLabel - Boon BP label
 * @returns {string[]} Derived mechanic tags
 */
function extractBoonMechanicTags(
  normalizedText: string,
  bpLabel: string,
): string[] {
  const tags = new Set<string>();
  const lower = normalizedText.toLowerCase();

  if (BOON_MECHANICS.variableCost.test(bpLabel)) {
    tags.add('mechanic:variable-cost');
    tags.add('mechanic:choice');
  }

  if (BOON_MECHANICS.shortRest.test(lower)) {
    tags.add('mechanic:short-rest');
    tags.add('mechanic:short-rest-recharge');
  }
  if (BOON_MECHANICS.longRest.test(lower)) {
    tags.add('mechanic:long-rest');
    tags.add('mechanic:long-rest-recharge');
  }
  if (BOON_MECHANICS.limitedUses.test(lower)) {
    tags.add('mechanic:limited-uses');
  }

  if (BOON_MECHANICS.armorClass.test(lower)) {
    tags.add('mechanic:ac');
  }
  if (BOON_MECHANICS.savingThrow.test(lower)) {
    tags.add('mechanic:saving-throw');
  }

  if (BOON_MECHANICS.weapon.test(lower)) {
    tags.add('mechanic:weapon');
  }
  if (BOON_MECHANICS.reach.test(lower)) {
    tags.add('mechanic:weapon-reach');
  }
  if (BOON_MECHANICS.extraDamage.test(lower)) {
    tags.add('mechanic:extra-damage');
  }

  if (BOON_MECHANICS.bonusAction.test(lower)) {
    tags.add('mechanic:bonus-action');
  }
  if (BOON_MECHANICS.reaction.test(lower)) {
    tags.add('mechanic:reaction');
  }
  if (BOON_MECHANICS.concentration.test(lower)) {
    tags.add('mechanic:concentration');
  }

  if (BOON_MECHANICS.spellcasting.test(lower)) {
    tags.add('mechanic:spellcasting');
  }
  if (BOON_MECHANICS.innateSpellcasting.test(lower)) {
    tags.add('mechanic:innate-spellcasting');
  }
  if (BOON_MECHANICS.cantrip.test(lower)) {
    tags.add('mechanic:cantrips');
  }
  if (BOON_MECHANICS.materialComponents.test(lower)) {
    tags.add('mechanic:material-components');
  }

  return Array.from(tags);
}

/**
 * Extracts unified boon tags from heading + boon content.
 *
 * @param {string} name - Boon name
 * @param {string} bpLabel - Boon BP cost label
 * @param {string} boonContent - Raw boon section content
 * @param {SharedData} sharedData - Shared taxonomy data
 * @returns {string[]} Sorted unique tags
 */
function extractBoonTags(
  name: string,
  bpLabel: string,
  boonContent: string,
  sharedData: SharedData,
): string[] {
  const source = `${name}\n${bpLabel}\n${boonContent}`;
  const normalized = normalizeForTagging(source);

  const allTags = new Set<string>();

  for (const tag of extractDamageTags(normalized, sharedData)) {
    allTags.add(tag);
  }
  for (const tag of extractConditionTags(normalized, sharedData)) {
    allTags.add(tag);
  }
  for (const tag of extractAbilitySaveTags(normalized, sharedData)) {
    allTags.add(tag);
  }
  for (const tag of extractMovementTags(normalized, sharedData)) {
    allTags.add(tag);
  }
  for (const tag of extractItemMechanicTags(normalized)) {
    allTags.add(tag);
  }
  for (const tag of extractProficiencyTags(normalized)) {
    allTags.add(tag);
  }
  for (const tag of extractBoonMechanicTags(normalized, bpLabel)) {
    allTags.add(tag);
  }

  return Array.from(allTags).sort();
}

/**
 * Parses the Core Features section into a structured object.
 *
 * @param {string} content - Full MDX file content
 * @returns {{ abilityScores: string[], movementSpeeds: string[], senses: string[], size: string[], creatureTypes: string[], age?: string }}
 */
function parseCoreFeatures(content: string): {
  abilityScores: string[];
  movementSpeeds: string[];
  senses: string[];
  size: string[];
  creatureTypes: string[];
  age?: string;
} {
  const result = {
    abilityScores: [] as string[],
    movementSpeeds: [] as string[],
    senses: [] as string[],
    size: [] as string[],
    creatureTypes: [] as string[],
    age: undefined as string | undefined,
  };

  const sectionMatch = content.match(SECTION.coreFeatures);
  if (!sectionMatch) return result;

  const section = sectionMatch[1];
  const dataRows = section
    .split('\n')
    .filter((line) => line.startsWith('|') && line.includes('<ul>'));

  if (dataRows[0]) {
    const cells = parseTableRow(dataRows[0]);
    result.abilityScores = parseListItems(cells[0] || '');
    result.movementSpeeds = parseListItems(cells[1] || '');
    result.senses = parseListItems(cells[2] || '');
  }

  if (dataRows[1]) {
    const cells = parseTableRow(dataRows[1]);
    result.size = parseListItems(cells[0] || '');
    result.creatureTypes = parseListItems(cells[1] || '');
    const ageItems = parseListItems(cells[2] || '');
    result.age = ageItems[0];
  }

  return result;
}

/**
 * Extracts lore description text from between the title and first divider.
 *
 * @param {string} content - Full MDX content
 * @returns {string | undefined} Joined lore paragraphs or undefined
 */
function parseDescription(content: string): string | undefined {
  const lines = content.split('\n');
  const firstDivider = lines.findIndex((l) => l.trim() === '---');
  if (firstDivider < 2) return undefined;

  const introLines = lines
    .slice(1, firstDivider)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (introLines.length === 0) return undefined;
  return introLines.join('\n');
}

/**
 * Extracts the Boon Point budget from the boons section.
 *
 * @param {string} content - Full MDX content
 * @returns {number | undefined} Budget number or undefined
 */
function parseBoonBudget(content: string): number | undefined {
  const match = content.match(BOON.budgetPattern);
  return match ? parseInt(match[1], 10) : undefined;
}

/**
 * Parses all boon entries from the Boons section.
 * Handles nested Collapsible blocks and variable-cost boons.
 *
 * @param {string} content - Full MDX content
 * @param {SharedData} sharedData - Shared game data used for tag extraction
 * @returns {ParsedBoon[]} Parsed boon records
 */
function parseBoons(content: string, sharedData: SharedData): ParsedBoon[] {
  const sectionLines = getBoonsSectionLines(content);
  if (sectionLines.length === 0) {
    return [];
  }

  const headings: Array<{ lineIdx: number; heading: ParsedBoonHeading }> = [];
  for (let i = 0; i < sectionLines.length; i++) {
    const parsed = parseBoonHeading(sectionLines[i]);
    if (parsed && parsed.name) {
      headings.push({ lineIdx: i, heading: parsed });
    }
  }

  return headings.map((entry, idx) => {
    const nextLineIdx =
      idx < headings.length - 1
        ? headings[idx + 1].lineIdx
        : sectionLines.length;

    const rawBlockLines = sectionLines.slice(entry.lineIdx + 1, nextLineIdx);
    const boonContent = rawBlockLines
      .filter((line) => {
        const trimmed = line.trim();
        return !TEXT.collapsibleTag.test(trimmed);
      })
      .join('\n')
      .trim();

    const bpValue = parseBpValue(entry.heading.bpLabel);
    const tags = extractBoonTags(
      entry.heading.name,
      entry.heading.bpLabel,
      boonContent,
      sharedData,
    );

    return {
      name: entry.heading.name,
      bpLabel: entry.heading.bpLabel,
      bpValue,
      sortOrder: idx,
      tags,
    };
  });
}

/* ────────────────────────  File Parser  ────────────────────────────── */

/**
 * Parses a single bloodline MDX file into metadata.
 * Returns null for excluded files (main.mdx, shared-boons) or on parse error.
 *
 * @param {string} filePath - Path to .mdx file
 * @param {SharedData} sharedData - Shared game data
 * @returns {Promise<object | null>} Parsed metadata or null
 */
async function parseBloodlineFile(
  filePath: string,
  sharedData: SharedData,
): Promise<object | null> {
  const baseName = path.basename(filePath);
  if (baseName === 'main.mdx' || filePath.includes('shared-boons')) {
    return null;
  }

  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    const lines = raw.split('\n').map((l) => l.trim());
    const slug = filePathToSlug(filePath);
    const title = parseTitle(lines);
    const description = parseDescription(raw);
    const coreFeatures = parseCoreFeatures(raw);
    const boonBudget = parseBoonBudget(raw);
    const boons = parseBoons(raw, sharedData);
    const boonTags = boons.flatMap((boon) => boon.tags);

    const metadata: Record<string, unknown> = {
      slug,
      title,
      file: path
        .relative(process.cwd(), filePath)
        .replace(SLUG.pathBackslash, '/'),
      link: `/library/character-creation/bloodlines/${slug}`,
      coreFeatures,
      boonBudget,
      boons,
      tags: Array.from(
        new Set([
          ...extractAllTags(raw, filePath, sharedData, {
            contentType: 'generic',
          }),
          ...boonTags,
        ]),
      ).sort(),
      indexVersion: 1,
    };

    if (description) {
      metadata.description = description;
    }

    return metadata;
  } catch (error) {
    log.warning('Error parsing bloodline file', {
      file: filePath,
      error: (error as Error).message,
    });
    return null;
  }
}

/* ────────────────────────  Entry Point  ────────────────────────────── */

/**
 * Main entry point for bloodline metadata generation.
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
    name: 'Bloodline Metadata Generator',
    contentType: 'bloodlines',
    filePattern: options.filePattern || /\.bloodline\.mdx$/,
    parseFile: parseBloodlineFile,
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
    log.error('Fatal error during bloodline metadata generation', {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    process.exit(1);
  });
}

export { main, parseBloodlineFile };

