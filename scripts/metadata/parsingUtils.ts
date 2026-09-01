/**
 * @fileoverview Parsing functions for extracting structured data from MDX content.
 * Used by metadata generators for monsters, heirlooms, spells, and trinkets.
 * @module scripts/metadata/parsingUtils
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { toNativeMeasure, toPlainMeasure } from '@/lib/units/nativeMeasure';
import { stripDiceWrappers } from './diceExpressionUtils';
import { GameData } from './gameData';
import { CHARGES, HEADING, LIST, PROPERTIES } from './parsingPatterns';
import type { SharedData } from './sharedData';
import { blankFrontmatter, clean, plain, stripMarkdown } from './textUtils';

/**
 * Extracts the title from the first H1 heading.
 *
 * @param {string[]} lines - Array of file lines
 * @returns {string} Clean title without markdown formatting
 */
export function parseTitle(lines: string[]): string {
  const h1 = lines.find((l) => HEADING.h1.test(l));
  return h1 ? plain(h1.replace(HEADING.h1, '')) : '';
}

/**
 * Returns the index of the first H1 heading line, or -1 when there is none.
 *
 * @param {string[]} lines - Array of file lines
 * @returns {number} Zero-based index of the H1 line, or -1
 */
export function findTitleIndex(lines: string[]): number {
  return lines.findIndex((l) => HEADING.h1.test(l.trim()));
}

/**
 * Extracts the description from the intro region of an MDX file.
 *
 * Intro region spans from the line after the H1 title to the first
 * structural stop marker (`---`, an H2+ heading, or a `<Collapsible` JSX
 * element). Filters out empty lines, JSX, italic-only lines, headings, and
 * blockquotes. Joins remaining prose with newlines. Returns `undefined` when
 * no prose is found.
 *
 * @param {string} content - Full MDX file content
 * @returns {string | undefined} Joined prose paragraphs or undefined
 */
export function parseDescription(content: string): string | undefined {
  const lines = blankFrontmatter(content).split('\n');

  const titleIdx = findTitleIndex(lines);
  const bodyStart = titleIdx === -1 ? 0 : titleIdx;

  let stopIdx = lines.length;
  for (let i = bodyStart + 1; i < lines.length; i++) {
    const t = lines[i].trim();
    if (t === '---' || /^##\s/.test(t) || t.startsWith('<Collapsible')) {
      stopIdx = i;
      break;
    }
  }

  const introLines = lines
    .slice(bodyStart + 1, stopIdx)
    .map((l) => l.trim())
    .filter(
      (l) =>
        l.length > 0 &&
        !l.startsWith('#') &&
        !l.startsWith('<') &&
        !l.startsWith('{') &&
        !l.startsWith('>') &&
        !l.startsWith('|') &&
        !/^[_*][^_*\n]+[_*]$/.test(l),
    );

  return introLines.length > 0 ? plain(introLines.join('\n')) : undefined;
}

/**
 * Reading speed and label templates per locale. Finnish words are long and
 * few, so its words-per-minute sits lower than English or Spanish.
 */
const READING_PROFILES: Record<
  string,
  { wpm: number; min: (n: number) => string; sec: (n: number) => string }
> = {
  en: {
    wpm: 200,
    min: (n) => `${n} min read`,
    sec: (n) => `${n} sec read`,
  },
  fi: {
    wpm: 160,
    min: (n) => `${n} min lukuaika`,
    sec: (n) => `${n} s lukuaika`,
  },
  es: {
    wpm: 215,
    min: (n) => `${n} min de lectura`,
    sec: (n) => `${n} s de lectura`,
  },
};

/**
 * Estimates reading time of an MDX file from its prose word count.
 *
 * Excludes frontmatter, import/export statements, JSX tag lines, code fences,
 * and table rows. Speed and label localize per the file's locale; unknown
 * locales fall back to English. Formats as whole minutes ("4 min read"), or
 * seconds when under a minute ("40 sec read").
 *
 * @param {string} raw - Raw MDX file content
 * @param {string} [locale='en'] - Content locale driving speed and label
 * @returns {string} Human-readable reading time (e.g. "4 min read")
 */
export function calculateReadingTime(raw: string, locale = 'en'): string {
  const profile = READING_PROFILES[locale] ?? READING_PROFILES.en;
  const wordsPerMinute = profile.wpm;
  const withoutFences = blankFrontmatter(raw).replace(/```[\s\S]*?```/g, '');
  const lines = withoutFences.split('\n');

  const proseLines = lines.filter((line) => {
    const t = line.trim();
    return (
      t.length > 0 &&
      !t.startsWith('<') &&
      !t.startsWith('{') &&
      !t.startsWith('import ') &&
      !t.startsWith('export ') &&
      !t.includes('/>') &&
      !/^\|[\s:-]+\|/.test(t)
    );
  });

  const words = stripMarkdown(proseLines.join(' '))
    .split(/\s+/)
    .filter(Boolean).length;

  const totalSeconds = Math.ceil((words / wordsPerMinute) * 60);
  if (totalSeconds < 60) {
    return profile.sec(Math.max(totalSeconds, 1));
  }
  return profile.min(Math.round(totalSeconds / 60));
}

/** Opening of an image-bearing JSX tag, with src on the same line. */
const IMAGE_TAG_WITH_SRC =
  /<(?:BlendedImage|Image)\b[^>]*?src\s*=\s*['"]([^'"]+)['"]/;

/** Opening of an image-bearing JSX tag (src may follow on a later line). */
const IMAGE_TAG_OPEN = /<(?:BlendedImage|Image)\b/;

/** Opening of any capitalized JSX tag — ends an image tag's attribute scan. */
const ANY_JSX_TAG_OPEN = /<[A-Z]/;

/** A src attribute line inside a multi-line JSX element. */
const SRC_ATTR_LINE = /^\s*src\s*=\s*['"]([^'"]+)['"]/;

/**
 * Finds the last content image in a line range.
 *
 * Matches `<BlendedImage …>` and `<Image …>` elements, single- or
 * multi-line. Non-image JSX openings (`<ParallaxBackdrop` background layers
 * in particular) end any pending attribute scan, so their src lines are not
 * captured.
 *
 * @param {string[]} lines - File lines
 * @param {number} [start=0] - First line index to scan (inclusive)
 * @param {number} [end=lines.length] - Line index to stop before (exclusive)
 * @returns {string | undefined} The last matching image src, or undefined
 */
export function findContentImage(
  lines: string[],
  start = 0,
  end = lines.length,
): string | undefined {
  let lastImage: string | undefined;
  let inImageTag = false;

  for (let i = start; i < Math.min(end, lines.length); i++) {
    const line = lines[i];

    const singleMatch = line.match(IMAGE_TAG_WITH_SRC);
    if (singleMatch) {
      lastImage = singleMatch[1];
      inImageTag = false;
      continue;
    }
    if (IMAGE_TAG_OPEN.test(line)) {
      inImageTag = !line.includes('/>');
      continue;
    }
    if (ANY_JSX_TAG_OPEN.test(line)) {
      inImageTag = false;
      continue;
    }
    if (inImageTag) {
      const srcMatch = line.match(SRC_ATTR_LINE);
      if (srcMatch) {
        lastImage = srcMatch[1];
        inImageTag = false;
      }
      if (line.includes('/>')) inImageTag = false;
    }
  }

  return lastImage;
}

/**
 * Returns the first run of consecutive prose lines anywhere in the body.
 * Unlike {@link parseDescription} it is not limited to the intro region.
 *
 * Skips a leading YAML frontmatter block. Headings, JSX, blockquotes, tables,
 * list items, imports/exports, and italic-only lines are not prose. Result is
 * markdown-stripped and truncated at a word boundary.
 *
 * @param {string[]} lines - Array of file lines
 * @param {number} [maxLength=300] - Maximum description length
 * @returns {string | undefined} First prose paragraph or undefined
 */
export function parseFirstProseParagraph(
  lines: string[],
  maxLength = 300,
): string | undefined {
  const body = blankFrontmatter(lines.join('\n')).split('\n');

  const paragraph: string[] = [];
  for (let i = 0; i < body.length; i++) {
    const line = body[i].trim();
    const isProse =
      line.length > 0 &&
      !line.startsWith('#') &&
      !line.startsWith('<') &&
      !line.startsWith('{') &&
      !line.startsWith('>') &&
      !line.startsWith('|') &&
      !line.startsWith('-') &&
      !line.startsWith('*') &&
      !line.startsWith('import ') &&
      !line.startsWith('export ') &&
      !line.includes('/>') &&
      !line.includes('=') && // JSX attribute lines of multi-line elements
      !/^[_*][^_*\n]+[_*]$/.test(line);
    if (isProse) {
      paragraph.push(line);
    } else if (paragraph.length > 0) {
      break;
    }
  }
  if (paragraph.length === 0) return undefined;

  /* A description is plaintext: it becomes `og:description` and a search key,
     so link syntax and emphasis must not survive into it. */
  const text = plain(paragraph.join(' '));
  if (!text) return undefined;
  if (text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : maxLength)}…`;
}

/**
 * Parses properties from bullet list sections.
 *
 * @param {string} text - Full text content
 * @returns {Record<string, string> | undefined} Map of property names to values
 */
export function parseProperties(
  text: string,
): Record<string, string> | undefined {
  const properties: Record<string, string> = {};

  const propertiesMatch = text.match(PROPERTIES.section);
  if (!propertiesMatch) return undefined;

  const propertiesSection = propertiesMatch[2];
  const bulletPattern = new RegExp(
    PROPERTIES.bulletItem.source,
    PROPERTIES.bulletItem.flags,
  );
  let match;
  while ((match = bulletPattern.exec(propertiesSection)) !== null) {
    const key = stripMarkdown(match[1].trim());
    const value = stripMarkdown(match[2].trim());
    properties[key] = value;
  }

  return Object.keys(properties).length > 0 ? properties : undefined;
}

/**
 * Normalized weight result.
 *
 * @interface NormalizedWeight
 * @property {string} weight - Prose weight string, e.g. "1 burden per 5"
 * @property {number} [weightPer] - Divisor for stackable items, e.g. 5
 */
export interface NormalizedWeight {
  weight: string;
  weightPer?: number;
}

/**
 * Normalizes a raw weight string into its native form and extracts
 * the optional "per N" divisor for stackable items.
 *
 * @param {string} raw - Raw weight text from source, e.g. "[= 1 burden =] per 5"
 * @returns {NormalizedWeight} Normalized weight with optional divisor
 */
export function normalizeWeight(raw: string): NormalizedWeight {
  const weight = toNativeMeasure(raw).trim();
  const perMatch = weight.match(PROPERTIES.weightPer);
  if (perMatch) {
    return { weight, weightPer: parseInt(perMatch[1], 10) };
  }
  return { weight };
}

/**
 * Parses weight from properties object.
 *
 * @param {Record<string, string> | undefined} properties - Parsed properties object
 * @returns {NormalizedWeight | undefined} Weight value with optional divisor
 */
export function parseWeight(
  properties: Record<string, string> | undefined,
): NormalizedWeight | undefined {
  if (!properties || !properties.Weight) return undefined;

  /* Every heirloom writes `[= 2 burden =]`, which the imperial pattern here
     never matched — so the field came back empty for the entire set while the
     one item written in pounds came back in pounds. Normalising handles both
     and answers in the native unit either way. */
  const normalized = normalizeWeight(properties.Weight);

  return normalized.weight ? normalized : undefined;
}

/**
 * Parses range from properties object.
 *
 * @param {Record<string, string> | undefined} properties - Parsed properties object
 * @returns {string | undefined} Range value
 */
export function parseRange(
  properties: Record<string, string> | undefined,
): string | undefined {
  if (!properties || !properties.Range) {
    if (properties && properties.Reach) {
      return toNativeMeasure(properties.Reach);
    }
    return undefined;
  }
  return toNativeMeasure(properties.Range);
}

/**
 * Parses comma-separated number format (e.g., "1,650" -> 1650).
 *
 * @param {string | undefined} value - String potentially containing commas
 * @returns {number | undefined} Parsed number or undefined
 */
export function parseNumericValue(
  value: string | undefined,
): number | undefined {
  if (!value) return undefined;
  const cleaned = String(value).replace(LIST.commaStrip, '');
  const num = Number(cleaned);
  return isNaN(num) ? undefined : num;
}

/**
 * Extracts charges information from content.
 *
 * @param {string} text - Full text content
 * @returns {{ initial?: string; recharge?: string; depletes?: boolean } | undefined} Charges info
 */
export function parseCharges(
  text: string,
): { initial?: string; recharge?: string; depletes?: boolean } | undefined {
  const unwrapped = stripDiceWrappers(text);
  const chargesInfo: {
    initial?: string;
    recharge?: string;
    depletes?: boolean;
  } = {};

  const initialMatch = unwrapped.match(CHARGES.initial);
  if (initialMatch) {
    chargesInfo.initial = initialMatch[1];
  }

  const rechargeMatch = unwrapped.match(CHARGES.recovery);
  if (rechargeMatch) {
    chargesInfo.recharge = `${rechargeMatch[1]} at ${rechargeMatch[2]}`;
  }

  if (CHARGES.depletion.test(unwrapped)) {
    chargesInfo.depletes = true;
  }

  return Object.keys(chargesInfo).length > 0 ? chargesInfo : undefined;
}

/**
 * Parses damage types that an item deals.
 *
 * @param {string} text - Full text content
 * @param {SharedData} data - Shared data object
 * @returns {string[] | undefined} Array of damage types dealt
 */
export function parseDamageTypesDealt(
  text: string,
  data: SharedData,
): string[] | undefined {
  const damageTypes = new Set<string>();
  const damageKeywords = GameData.getDamageTypes(data);

  for (const type of damageKeywords) {
    const dealPattern = new RegExp(
      `(?:deals?|additional|extra)\\s+(?:\\d+d\\d+|\\d+)\\s+${type}\\s+damage`,
      'i',
    );
    if (dealPattern.test(text)) {
      damageTypes.add(type);
    }
  }

  return damageTypes.size > 0 ? Array.from(damageTypes).sort() : undefined;
}

/**
 * Parses saving throw types that an item enforces.
 *
 * @param {string} text - Full text content
 * @param {SharedData} data - Shared data object
 * @returns {string[] | undefined} Array of saving throw ability types
 */
export function parseSavingThrowTypes(
  text: string,
  data: SharedData,
): string[] | undefined {
  const saveTypes = new Set<string>();
  const abilities = GameData.getAbilities(data);

  const abilityNames = abilities.flatMap((a) => [a.long, a.short]);
  const pattern = new RegExp(
    `\\b(${abilityNames.join('|')})\\s+(saving throw|save)`,
    'gi',
  );
  let match;

  while ((match = pattern.exec(text)) !== null) {
    const matchedAbility = match[1].toLowerCase();
    const ability = abilities.find(
      (a) =>
        a.long.toLowerCase() === matchedAbility ||
        a.short.toLowerCase() === matchedAbility,
    );
    if (ability) {
      const fullAbility =
        ability.long.charAt(0).toUpperCase() + ability.long.slice(1);
      saveTypes.add(fullAbility);
    }
  }

  return saveTypes.size > 0 ? Array.from(saveTypes).sort() : undefined;
}

/**
 * Parses markdown bullet points with key-value format.
 *
 * @param {string} text - Text content to parse
 * @returns {Record<string, string>} Map of keys to values
 */
export function parseKeyBullets(text: string): Record<string, string> {
  const map: Record<string, string> = {};
  const re = new RegExp(
    PROPERTIES.keyBullets.source,
    PROPERTIES.keyBullets.flags,
  );
  let m;
  while ((m = re.exec(text)) !== null) {
    map[m[1].trim()] = m[2].trim();
  }
  return map;
}

/**
 * Splits comma/semicolon-delimited list into array.
 *
 * @param {string} raw - Raw list string
 * @returns {string[]} Array of list items with markdown stripped
 */
export function splitList(raw: string): string[] {
  if (!raw || raw === '—' || raw.toLowerCase() === 'none') return [];
  return raw
    .split(LIST.commaOrSemicolon)
    .map((s) => stripMarkdown(s.trim()))
    .filter(Boolean);
}

/**
 * Splits list with special grouping pattern support.
 *
 * @param {string} raw - Raw list string
 * @param {RegExp} groupPattern - Pattern to match for grouped entries
 * @returns {string[]} Array with grouped entry first, then remaining items
 */
export function splitListWithGrouping(
  raw: string,
  groupPattern: RegExp,
): string[] {
  if (!raw || raw === '—' || raw.toLowerCase() === 'none') return [];

  const match = raw.match(groupPattern);

  if (match) {
    const grouped = stripMarkdown(match[0].trim());
    const remainder = raw.replace(groupPattern, '').trim();
    const others = remainder
      .split(LIST.commaOrSemicolon)
      .map((s) => stripMarkdown(s.trim()))
      .filter(Boolean)
      .filter((s) => s !== 'and');

    return [grouped, ...others];
  }

  return raw
    .split(LIST.commaOrSemicolon)
    .map((s) => stripMarkdown(s.trim()))
    .filter(Boolean);
}
