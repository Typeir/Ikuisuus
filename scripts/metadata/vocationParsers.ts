/**
 * @fileoverview Vocation content parsers.
 * @description Parses core traits and the feature progression table out of
 * `main.mdx` vocation sources.
 *
 * @module scripts/metadata/vocationParsers
 * @version 1.0.0
 * @author Typeir
 * @since 2026-09-07
 */

import { stripInlineMarkdown } from '@/lib/utils/stripInlineMarkdown';
import { clean } from './textUtils';
import { LIST, TEXT } from './parsingPatterns';
import { CASTING, FEATURE, TABLE } from './vocationPatterns';

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
 * Extracts the hit die's face count from a traits value.
 *
 * @param {string} value - Raw hit die text (e.g. "d12 per Berserker level")
 * @returns {number} Face count (e.g. 12), or 0 when the traits declare none
 */
function parseHitDie(value: string): number {
  const match = value.match(FEATURE.hitDie);
  if (!match) return 0;
  const faces = Number.parseInt(match[1], 10);
  return Number.isFinite(faces) && faces > 0 ? faces : 0;
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

/** Maps spelled-out numbers used in "Pick two"/"Choose three" phrasing to digits. */
const WORD_NUMBERS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
};

/**
 * Extracts the number of picks from a "Choose N" / "Pick N" / "Choose any N"
 * phrase, accepting a digit or a spelled-out number and defaulting to 2.
 *
 * @param {string} text - Clean skill text (markdown already stripped)
 * @returns {number} Number of base skill picks
 */
function parseChoiceCount(text: string): number {
  const match = text.match(FEATURE.skillCount);
  if (!match) return 2;
  const token = match[1].toLowerCase();
  return WORD_NUMBERS[token] ?? parseInt(token, 10) ?? 2;
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
  const cleaned = stripInlineMarkdown(value);
  const count = parseChoiceCount(cleaned);
  if (!cleaned.includes(':')) return { count, choices: [] };

  const afterColon = cleaned.split(':')[1];
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
  const cleaned = stripInlineMarkdown(value).trim();
  if (!cleaned || cleaned.toLowerCase() === 'none') return [];
  return cleaned
    .split(LIST.andOrSplit)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Extracts fixed trade display names from a raw "Trade Proficiencies" cell.
 *
 * @param {string} value - Raw Trade Proficiencies cell (markdown links intact)
 * @returns {string[]} Deduped fixed-trade display names
 */
function parseFixedTrades(value: string): string[] {
  if (!value) return [];
  const withoutQualifiers = value.replace(
    /\((?:[^()]|\([^()]*\))*?(?:\bany\b|\bchoose\b|\bor\b)(?:[^()]|\([^()]*\))*\)/gi,
    ' ',
  );
  const out: string[] = [];
  const linkRe = /\[([^\]]+)\]\(([^)]*)\)/g;
  let match: RegExpExecArray | null;
  while ((match = linkRe.exec(withoutQualifiers)) !== null) {
    if (/\/tools\/[a-z0-9-]+/i.test(match[2])) {
      out.push(stripInlineMarkdown(match[1]).trim());
    }
  }
  return [...new Set(out)];
}

/**
 * Splits a markdown table row into cells, dropping only the empty fragments the
 * outer pipes produce.
 *
 * @param {string} line - Raw table row (starts and ends with `|`)
 * @returns {string[]} Trimmed cells with interior blanks preserved
 */
function splitTableRow(line: string): string[] {
  const parts = line.split('|').map((c) => c.trim());
  if (parts[0] === '') parts.shift();
  if (parts[parts.length - 1] === '') parts.pop();
  return parts;
}

/**
 * Parses the vocation feature table and extracts feature entries.
 *
 * @param {string} raw - Full MDX file content
 * @returns {{ features: Array<{ level: number; name: string }>; hasSpellSlots: boolean; headers: string[] }}
 */
export function parseFeatureTable(raw: string): {
  features: Array<{ level: number; name: string }>;
  hasSpellSlots: boolean;
  headers: string[];
} {
  const lines = raw.split(TEXT.lineSplit);
  const features: Array<{ level: number; name: string }> = [];
  let headers: string[] = [];
  let inTable = false;
  let headerParsed = false;
  /** Column index of the "Features" / "Vocation Features" header */
  let featureColIdx = -1;

  for (const line of lines) {
    if (!inTable && TABLE.featuresHeader.test(line)) {
      inTable = true;
      headers = splitTableRow(line);
      featureColIdx = headers.findIndex((h) => TABLE.featuresColumn.test(h));
      if (featureColIdx < 0) {
        featureColIdx = 2;
      }
      continue;
    }
    if (inTable && TABLE.separator.test(line)) {
      headerParsed = true;
      continue;
    }
    if (inTable && headerParsed && line.startsWith('|')) {
      const cells = splitTableRow(line);

      const level = parseInt(cells[0], 10);
      if (isNaN(level) || !cells[featureColIdx]) continue;

      const featureCell = cells[featureColIdx]
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

export { parseCoreTraits, parseFixedTrades, parseHitDie, parseProficiencies, parseSavingThrows, parseSkillProficiencies };
