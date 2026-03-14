/**
 * @fileoverview MDX Content Parsing Utilities
 * @description Common parsing functions for extracting structured data from MDX content.
 * Used by metadata generators for monsters, heirlooms, spells, and trinkets.
 *
 * @module lib/metadata/parsingUtils
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { GameData } from './gameData';
import type { SharedData } from './sharedData';
import { clean, stripMarkdown } from './textUtils';

/**
 * Extracts the title from the first H1 heading.
 *
 * @param {string[]} lines - Array of file lines
 * @returns {string} Clean title without markdown formatting
 */
export function parseTitle(lines: string[]): string {
  const h1 = lines.find((l) => /^#\s+/.test(l));
  return h1 ? clean(h1.replace(/^#\s+/, '')) : '';
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

  const propertiesMatch = text.match(
    /##\s+(Item\s+|Weapon\s+|Armor\s+)?Properties\s*\n([\s\S]*?)(?=\n##|\n---|\n$)/i,
  );
  if (!propertiesMatch) return undefined;

  const propertiesSection = propertiesMatch[2];
  const bulletPattern = /^[-*]\s+\*\*(.+?)(?::)?\*\*\s*:?\s*(.+?)\s*$/gm;
  let match;
  while ((match = bulletPattern.exec(propertiesSection)) !== null) {
    const key = stripMarkdown(match[1].trim());
    const value = stripMarkdown(match[2].trim());
    properties[key] = value;
  }

  return Object.keys(properties).length > 0 ? properties : undefined;
}

/**
 * Parses weight from properties object.
 *
 * @param {Record<string, string> | undefined} properties - Parsed properties object
 * @returns {string | undefined} Weight value
 */
export function parseWeight(
  properties: Record<string, string> | undefined,
): string | undefined {
  if (!properties || !properties.Weight) return undefined;

  const weightText = properties.Weight;
  const weightMatch = weightText.match(/([\d.]+)\s*lbs?\.?/i);
  if (weightMatch) {
    return `${weightMatch[1]} lb${weightMatch[1] !== '1' ? 's' : ''}`;
  }

  return undefined;
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
      return properties.Reach;
    }
    return undefined;
  }
  return properties.Range;
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
  const cleaned = String(value).replace(/,/g, '');
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
  const chargesInfo: {
    initial?: string;
    recharge?: string;
    depletes?: boolean;
  } = {};

  const initialMatch = text.match(
    /holds?\s+(?:up to\s+)?(\d+d\d+|\d+)\s+charges/i,
  );
  if (initialMatch) {
    chargesInfo.initial = initialMatch[1];
  }

  const rechargeMatch = text.match(
    /(?:regain|recover)(?:ing|s)?\s+(\d+\s*\+\s*\d+d\d+|\d+d\d+|\d+)\s+charges?\s+(?:at|each)\s+(\w+)/i,
  );
  if (rechargeMatch) {
    chargesInfo.recharge = `${rechargeMatch[1]} at ${rechargeMatch[2]}`;
  }

  if (/becomes?\s+inert|cannot be recharged|burns? away/i.test(text)) {
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
  const re = /^-\s*\*\*([^*]+)\*\*\s*:\s*(.+?)\s*$/gim;
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
    .split(/[,;]/)
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
      .split(/[,;]/)
      .map((s) => stripMarkdown(s.trim()))
      .filter(Boolean)
      .filter((s) => s !== 'and');

    return [grouped, ...others];
  }

  return raw
    .split(/[,;]/)
    .map((s) => stripMarkdown(s.trim()))
    .filter(Boolean);
}
