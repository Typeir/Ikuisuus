/**
 * @fileoverview Bloodline Metadata Generator
 * @description Parses `.bloodline.mdx` files into metadata: core features,
 * boons, ability scores, and gameplay tags. Excludes `main.mdx` files and files
 * under `shared-boons/`.
 *
 * @module scripts/metadata/generateBloodlineMetadata
 * @version 1.0.0
 * @author Typeir
 * @since 7.0.0
 */

import { toNativeMeasure } from '@/lib/units/nativeMeasure';
import { createLogger } from '@/lib/logging/logger';
import { promises as fs } from 'fs';
import matter from 'gray-matter';
import path from 'path';
import {
    applyAuthoredFeatureAspects,
    blankFrontmatter,
    clean,
    extractAbilitySaveTags,
    extractAllTags,
    extractConditionTags,
    extractDamageTags,
    extractItemMechanicTags,
    extractMovementTags,
    filePathToSlug,
    parseDescription,
    parseTitle,
    plain,
    runGenerator,
    runWithCli,
    type SharedData,
    type StorageAdapter,
  stampAnchors,
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
 * A selectable option within a variable-cost boon, parsed from the boon's
 * Cost-column table or its nested option headings.
 *
 * @property {string} name - Option display name
 * @property {number} bpValue - BP cost of this specific option
 * @property {string} [effect] - Short effect summary from the non-name/non-cost columns
 * @property {string[]} [tags] - Aspects of this option alone, from its own row or heading body
 * @property {string} [anchor] - Anchor slug of the option name
 */
interface BoonSubOption {
  name: string;
  bpValue: number;
  effect?: string;
  tags?: string[];
  anchor?: string;
}

/**
 * Parsed boon metadata payload.
 *
 * @property {string} name - Boon display name
 * @property {string} bpLabel - Raw BP cost label
 * @property {number} [bpValue] - Numeric BP value when deterministic; suppressed for variable-cost parents
 * @property {BoonSubOption[]} [subOptions] - Selectable options for a variable-cost boon
 * @property {'choose-one' | 'pick-any'} [subOptionMode] - Selection mode for the sub-options
 * @property {number} sortOrder - Stable zero-based order in section
 * @property {number} startLine - 1-indexed start line of the boon heading block in the source MDX
 * @property {number} endLine - 1-indexed last line of the boon content block in the source MDX
 * @property {string[]} tags - Derived boon gameplay tags
 * @property {string} [anchor] - Anchor slug of the boon heading
 * @property {string} [parentName] - For an option of a variable-cost boon written as its own heading: the parent boon's name
 */
interface ParsedBoon {
  name: string;
  bpLabel: string;
  bpValue?: number;
  subOptions?: BoonSubOption[];
  subOptionMode?: 'choose-one' | 'pick-any';
  sortOrder: number;
  startLine: number;
  endLine: number;
  tags: string[];
  parentName?: string;
  anchor?: string;
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
 * Extracts a Cost-column option table from a boon body block. Detects a markdown
 * table whose header has a `Cost` column and an `Option` column and returns one
 * sub-option per data row. Returns `[]` when the block has no such table.
 *
 * @param {string[]} blockLines - Raw lines of the boon body (between headings)
 * @returns {BoonSubOption[]} Parsed sub-options, or `[]` when there is no cost table
 */
function parseCostTable(
  blockLines: string[],
  sharedData: SharedData,
): BoonSubOption[] {
  const isSeparatorRow = (cells: string[]): boolean =>
    cells.length > 0 && cells.every((cell) => /^:?-+:?$/.test(cell.trim()));

  for (let i = 0; i < blockLines.length - 1; i++) {
    const headerLine = blockLines[i].trim();
    if (!headerLine.startsWith('|')) {
      continue;
    }

    const header = parseTableRow(headerLine);
    const costIdx = header.findIndex((cell) => /^cost$/i.test(cell));
    if (costIdx === -1) {
      continue;
    }
    if (!isSeparatorRow(parseTableRow(blockLines[i + 1].trim()))) {
      continue;
    }

    const optionIdx = header.findIndex((cell) => /^option$/i.test(cell));
    const nameIdx = optionIdx === -1 ? 0 : optionIdx;
    const subOptions: BoonSubOption[] = [];

    for (let r = i + 2; r < blockLines.length; r++) {
      const rowLine = blockLines[r].trim();
      if (!rowLine.startsWith('|')) {
        break;
      }
      const cells = parseTableRow(rowLine);
      if (isSeparatorRow(cells)) {
        continue;
      }
      /* The name is atomic and the effect is prose, so only the name is
         normalised — the effect keeps its macros for the MDX renderer. */
      const name = plain(cells[nameIdx]?.trim() ?? '');
      const bpValue = Number.parseInt(cells[costIdx]?.trim() ?? '', 10);
      if (!name || Number.isNaN(bpValue)) {
        continue;
      }
      const effect =
        cells
          .filter((_, index) => index !== nameIdx && index !== costIdx)
          .map((cell) => cell.trim())
          .filter(Boolean)
          .join(' — ') || undefined;
      const tags = extractBoonTags(name, `${bpValue} BP`, effect ?? '', sharedData);
      subOptions.push({ name, bpValue, effect, tags });
    }

    return subOptions;
  }

  return [];
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
      name: plain(normalizeForTagging(spanHeading[1])),
      bpLabel: clean(normalizeForTagging(spanHeading[2])),
    };
  }

  const inlineHeading = trimmed.match(BOON.plainHeading);
  if (!inlineHeading) {
    return null;
  }

  const normalized = plain(normalizeForTagging(inlineHeading[1]));
  const inlineCost = normalized.match(BOON.inlineCost);
  if (inlineCost) {
    return {
      name: plain(inlineCost[1]),
      bpLabel: clean(inlineCost[2]),
    };
  }

  if (BOON_MECHANICS.variableCost.test(normalized)) {
    return {
      name: normalized,
      bpLabel: 'Variable',
    };
  }

  return null;
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
 * Extracts proficiency tags for skills/tools/instruments. Emits a generic
 * `proficiency:skill` and `proficiency:tool` tag plus a specific tag per matched
 * item. A bare "grants some proficiency" match emits no tag.
 *
 * @param {string} normalizedText - Normalized boon text
 * @returns {string[]} Derived proficiency tags
 */
function extractProficiencyTags(normalizedText: string): string[] {
  const tags = new Set<string>();
  const lower = normalizedText.toLowerCase();

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
      tags.add('proficiency:skill');
      tags.add(`proficiency:${skill.replace(TEXT.whitespaceCollapse, '-')}`);
    }
  }

  for (const entry of PROFICIENCY.tools) {
    if (entry.pattern.test(lower)) {
      tags.add('proficiency:tool');
      tags.add(`proficiency:${entry.tag}`);
    }
  }

  if (PROFICIENCY.instrument.test(lower)) {
    tags.add('proficiency:instrument');
  }

  if (PROFICIENCY.weaponMastery.test(lower)) {
    tags.add('proficiency:weapon');
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
    tags.add('resource:variable');
  }

  if (BOON_MECHANICS.repose.test(lower)) {
    tags.add('resource:per-repose');
  }
  if (BOON_MECHANICS.recovery.test(lower)) {
    tags.add('resource:per-recovery');
  }
  if (BOON_MECHANICS.limitedUses.test(lower)) {
    tags.add('resource:limited');
  }

  if (BOON_MECHANICS.armorClass.test(lower)) {
    tags.add('mechanic:ac-bonus');
  }

  if (BOON_MECHANICS.reach.test(lower)) {
    tags.add('range:reach');
  }
  if (BOON_MECHANICS.extraDamage.test(lower)) {
    tags.add('mechanic:damage-bonus');
  }

  if (BOON_MECHANICS.minorAction.test(lower)) {
    tags.add('tempo:minor');
  }
  if (BOON_MECHANICS.reaction.test(lower)) {
    tags.add('tempo:reactive');
  }
  if (BOON_MECHANICS.concentration.test(lower)) {
    tags.add('tempo:sustained');
  }

  if (BOON_MECHANICS.spellcasting.test(lower)) {
    tags.add('mechanic:spellcasting');
  }
  if (BOON_MECHANICS.innateSpellcasting.test(lower)) {
    tags.add('mechanic:innate-spellcasting');
  }
  if (BOON_MECHANICS.cantrip.test(lower)) {
    tags.add('mechanic:cantrip');
  }
  if (BOON_MECHANICS.materialComponents.test(lower)) {
    tags.add('resource:material-cost');
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
 * A core feature trait: one `###` under `## Core Features`, tagged from its
 * own text so it renders an aspect row like a boon does.
 *
 * @property {string} id - `${slug}:${anchorSlug(name)}`
 * @property {string} name - Heading text
 * @property {string[]} tags - Aspects extracted from the trait's body
 * @property {{ start: number; end: number }} source - 0-based line range in the file
 */
interface CoreFeatureShard {
  id: string;
  name: string;
  tags: string[];
  source: { start: number; end: number };
}

/**
 * Splits `## Core Features` into its `###` traits and tags each. Pure stat
 * blocks (Languages) carry no gameplay tags and are dropped when empty.
 *
 * @param {string} body - File body (frontmatter blanked)
 * @param {string} slug - Bloodline slug, for ids
 * @param {SharedData} sharedData - Shared game data
 * @returns {CoreFeatureShard[]} Tagged core feature shards
 */
function parseCoreFeatureShards(
  body: string,
  slug: string,
  sharedData: SharedData,
): CoreFeatureShard[] {
  const lines = body.split('\n');
  const start = lines.findIndex((l) => /^##\s+Core Features\s*$/.test(l.trim()));
  if (start === -1) return [];
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^##\s+/.test(lines[i].trim())) {
      end = i;
      break;
    }
  }
  const heads: number[] = [];
  for (let i = start + 1; i < end; i++) {
    if (/^###\s+/.test(lines[i].trim())) heads.push(i);
  }
  const shards: CoreFeatureShard[] = [];
  heads.forEach((h, k) => {
    const next = heads[k + 1] ?? end;
    const name = lines[h].trim().replace(/^###\s+/, '').replace(/\*\*/g, '').trim();
    const text = lines.slice(h + 1, next).join('\n');
    const tags = extractBoonTags(name, '', text, sharedData);
    if (tags.length === 0) return;
    shards.push({
      id: `${slug}:${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}`,
      name,
      tags,
      source: { start: h, end: next },
    });
  });
  return shards;
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
    result.movementSpeeds = parseListItems(cells[1] || '').map((v) => toNativeMeasure(v));
    result.senses = parseListItems(cells[2] || '').map((v) => toNativeMeasure(v));
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
 * Parses all boon entries from the Boons section, with 1-indexed absolute start
 * and end line numbers anchored to the full MDX file.
 *
 * Variable-cost boons ("Choose One" / "Pick Any") collapse to a single boon with
 * `subOptions` from the Cost-column table and nested `<Collapsible>` option
 * headings; their `bpValue` is undefined. Other boons set `bpValue`.
 *
 * @param {string} content - Full MDX content
 * @param {SharedData} sharedData - Shared game data used for tag extraction
 * @returns {ParsedBoon[]} Parsed boon records with line anchors
 */
function parseBoons(content: string, sharedData: SharedData): ParsedBoon[] {
  const allLines = content.split('\n');
  const sectionStart = allLines.findIndex((line) =>
    SECTION.boons.test(line.trim()),
  );

  const sectionLines = getBoonsSectionLines(content);
  if (sectionLines.length === 0) {
    return [];
  }

  const headings: Array<{
    lineIdx: number;
    heading: ParsedBoonHeading;
    depth: number;
  }> = [];
  let collapsibleDepth = 0;
  for (let i = 0; i < sectionLines.length; i++) {
    const trimmed = sectionLines[i].trim();
    if (trimmed.startsWith('</Collapsible')) {
      collapsibleDepth = Math.max(0, collapsibleDepth - 1);
      continue;
    }
    if (trimmed.startsWith('<Collapsible')) {
      collapsibleDepth += 1;
      continue;
    }
    const heading = parseBoonHeading(sectionLines[i]);
    if (heading && heading.name) {
      headings.push({ lineIdx: i, heading, depth: collapsibleDepth });
    }
  }

  const buildBlock = (h: number) => {
    const entry = headings[h];
    const nextLineIdx =
      h < headings.length - 1 ? headings[h + 1].lineIdx : sectionLines.length;

    let endSectionIdx = nextLineIdx - 1;
    while (
      endSectionIdx > entry.lineIdx &&
      (!sectionLines[endSectionIdx]?.trim() ||
        TEXT.collapsibleTag.test(sectionLines[endSectionIdx].trim()) ||
        /^-{3,}$/.test(sectionLines[endSectionIdx].trim()))
    ) {
      endSectionIdx--;
    }

    const absStart = sectionStart + 1 + entry.lineIdx + 1;
    const absEnd = sectionStart + 1 + endSectionIdx + 1;
    const rawBlockLines = sectionLines.slice(entry.lineIdx + 1, nextLineIdx);
    const boonContent = rawBlockLines
      .filter((line) => !TEXT.collapsibleTag.test(line.trim()))
      .join('\n')
      .trim();

    return { entry, absStart, absEnd, rawBlockLines, boonContent };
  };

  const firstProseLine = (text: string): string | undefined =>
    text
      .split('\n')
      .map((line) => line.trim())
      .find((line) => line.length > 0 && !line.startsWith('|')) || undefined;

  const boons: ParsedBoon[] = [];
  let idx = 0;
  while (idx < headings.length) {
    const { entry, absStart, absEnd, rawBlockLines, boonContent } =
      buildBlock(idx);
    const isVariableLabel = BOON_MECHANICS.variableCost.test(
      entry.heading.bpLabel,
    );

    const childIdxs: number[] = [];
    if (isVariableLabel) {
      let j = idx + 1;
      while (j < headings.length && headings[j].depth > entry.depth) {
        childIdxs.push(j);
        j += 1;
      }
    }

    const subByName = new Map<string, BoonSubOption>();
    if (isVariableLabel) {
      for (const childIdx of childIdxs) {
        const childBlock = buildBlock(childIdx);
        const childHeading = headings[childIdx].heading;
        subByName.set(childHeading.name, {
          name: childHeading.name,
          bpValue: parseBpValue(childHeading.bpLabel) ?? 0,
          effect: firstProseLine(childBlock.boonContent),
          tags: extractBoonTags(
            childHeading.name,
            childHeading.bpLabel,
            childBlock.boonContent,
            sharedData,
          ),
        });
      }
      for (const row of parseCostTable(rawBlockLines, sharedData)) {
        if (!subByName.has(row.name)) {
          subByName.set(row.name, row);
        }
      }
    }
    const subOptions = [...subByName.values()];

    const childContents = childIdxs.map((c) => buildBlock(c).boonContent);
    const tagSource = [boonContent, ...childContents]
      .filter(Boolean)
      .join('\n');
    const tags = extractBoonTags(
      entry.heading.name,
      entry.heading.bpLabel,
      tagSource,
      sharedData,
    );

    if (isVariableLabel && subOptions.length > 0) {
      const endLine = childIdxs.length
        ? buildBlock(childIdxs[childIdxs.length - 1]).absEnd
        : absEnd;

      boons.push({
        name: entry.heading.name,
        bpLabel: entry.heading.bpLabel,
        bpValue: undefined,
        subOptions,
        subOptionMode: /pick any/i.test(entry.heading.bpLabel)
          ? 'pick-any'
          : 'choose-one',
        sortOrder: boons.length,
        startLine: absStart,
        endLine,
        tags,
      });

      /* Options written as their own headings (nested Collapsibles) are
         boons in their own right: they get a shard, tagged from their own
         body, so their heading renders an aspect row. */
      for (const childIdx of childIdxs) {
        const child = buildBlock(childIdx);
        const childHeading = headings[childIdx].heading;
        boons.push({
          name: childHeading.name,
          bpLabel: childHeading.bpLabel,
          bpValue: parseBpValue(childHeading.bpLabel),
          sortOrder: boons.length,
          startLine: child.absStart,
          endLine: child.absEnd,
          tags: extractBoonTags(
            childHeading.name,
            childHeading.bpLabel,
            child.boonContent,
            sharedData,
          ),
          parentName: entry.heading.name,
        });
      }

      idx += 1 + childIdxs.length;
    } else {
      boons.push({
        name: entry.heading.name,
        bpLabel: entry.heading.bpLabel,
        bpValue: parseBpValue(entry.heading.bpLabel),
        sortOrder: boons.length,
        startLine: absStart,
        endLine: absEnd,
        tags,
      });
      idx += 1;
    }
  }

  return boons;
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
    const body = blankFrontmatter(raw);
    const lines = body.split('\n').map((l) => l.trim());
    const slug = filePathToSlug(filePath);
    const title = parseTitle(lines);
    const description = parseDescription(body);
    const coreFeatures = parseCoreFeatures(body);
    const boonBudget = parseBoonBudget(body);
    const boons = parseBoons(body, sharedData);
    const boonTags = boons.flatMap((boon) => boon.tags);
    const features = parseCoreFeatureShards(body, slug, sharedData);
    const fileFrontmatter = matter(raw).data as Record<string, unknown>;
    stampAnchors(features);
    stampAnchors(boons);
    for (const boon of boons) if (boon.subOptions) stampAnchors(boon.subOptions);
    applyAuthoredFeatureAspects(features, fileFrontmatter);
    applyAuthoredFeatureAspects(boons as Array<{ name?: string; tags?: string[] }>, fileFrontmatter);
    const featureTags = features.flatMap((f) => f.tags);

    const metadata: Record<string, unknown> = {
      slug,
      title,
      file: path
        .relative(process.cwd(), filePath)
        .replace(SLUG.pathBackslash, '/'),
      link: `/library/character-creation/bloodlines/${slug}`,
      abilityScores: coreFeatures.abilityScores,
      movementSpeeds: coreFeatures.movementSpeeds,
      senses: coreFeatures.senses,
      size: coreFeatures.size,
      creatureTypes: coreFeatures.creatureTypes,
      age: coreFeatures.age,
      boonBudget,
      boons,
      features,
      tags: Array.from(
        new Set([
          ...extractAllTags(raw, filePath, sharedData, {
            contentType: 'generic',
          }),
          ...boonTags,
          ...featureTags,
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

