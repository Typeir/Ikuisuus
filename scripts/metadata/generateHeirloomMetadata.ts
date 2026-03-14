/**
 * @fileoverview Heirloom Metadata Generator
 * @description Parses .mdx files from the heirlooms directory and extracts comprehensive metadata
 * including rarity, item types, attunement, weapon properties, and gameplay mechanics tags.
 *
 * @module scripts/metadata/generateHeirloomMetadata
 * @version 3.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { createLogger } from '@/lib/logging/logger';
import {
    ItemData,
    clean,
    extractAllTags,
    filePathToSlug,
    parseCharges,
    parseDamageTypesDealt,
    parseProperties,
    parseRange,
    parseSavingThrowTypes,
    parseTitle,
    parseWeight,
    readLines,
    runGenerator,
    runWithCli,
    stripMarkdown,
    type SharedData,
    type StorageAdapter,
} from '@/lib/metadata';
import { promises as fs } from 'fs';
import path from 'path';

const log = createLogger({ component: 'HeirloomMetadataGenerator' });

/**
 * Parsed weapon info from the italic title line.
 *
 * @property {string} [weaponType] - Weapon type name
 * @property {number} [hitModifier] - Enhancement bonus
 * @property {string[]} [properties] - Weapon properties
 * @property {string} [range] - Weapon range
 * @property {string[]} [mastery] - Mastery properties
 */
interface WeaponTitleInfo {
  weaponType?: string;
  hitModifier?: number;
  properties?: string[];
  range?: string;
  mastery?: string[];
}

/**
 * Parses weapon title line for detailed info.
 *
 * @param {string} line - Italic line with weapon info
 * @param {SharedData} sharedData - Shared data
 * @returns {WeaponTitleInfo | undefined} Weapon details
 */
function parseWeaponTitleLine(
  line: string,
  sharedData: SharedData,
): WeaponTitleInfo | undefined {
  const info: WeaponTitleInfo = {};

  const beforeParen = line.match(/^(.+?)\s*\(/i);
  if (beforeParen) {
    const fullText = beforeParen[1].trim();
    const modMatch = fullText.match(/^(.+?)\s+\+(\d+)$/);
    if (modMatch) {
      info.weaponType = modMatch[1].trim();
      info.hitModifier = Number(modMatch[2]);
    } else {
      info.weaponType = fullText;
    }
  }

  const firstParen = line.indexOf('(');
  const lastParen = line.lastIndexOf(')');
  if (firstParen !== -1 && lastParen !== -1 && lastParen > firstParen) {
    const content = line.substring(firstParen + 1, lastParen);

    const parts: string[] = [];
    let current = '';
    let depth = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      if (char === '(') depth++;
      else if (char === ')') depth--;
      else if (char === ',' && depth === 0) {
        parts.push(current.trim());
        current = '';
        continue;
      }
      current += char;
    }
    if (current.trim()) parts.push(current.trim());

    const properties: string[] = [];
    const mastery: string[] = [];
    let capturingMastery = false;

    for (const part of parts) {
      const trimmed = part.trim();

      const masteryMatch = trimmed.match(/^Mastery:\s*(.+)$/i);
      if (masteryMatch) {
        capturingMastery = true;
        const firstMastery = masteryMatch[1].trim();
        if (firstMastery) mastery.push(firstMastery.toLowerCase());
        continue;
      }

      if (capturingMastery) {
        if (/^(Special|Range|Ranged?|Reach)\s*[:(/]/i.test(trimmed)) {
          capturingMastery = false;
        } else {
          mastery.push(trimmed.toLowerCase());
          continue;
        }
      }

      const rangeMatch = trimmed.match(
        /^(?:Ranged?|Range)\s+(\d+\/\d+|\(\d+\s+ft\))$/i,
      );
      if (rangeMatch) {
        info.range = rangeMatch[1].replace(/[()]/g, '').trim();
        continue;
      }

      const reachMatch = trimmed.match(/^Reach\s+\((\d+\s+ft\.?)\)$/i);
      if (reachMatch) {
        info.range = reachMatch[1];
        properties.push('reach');
        continue;
      }

      const specialMatch = trimmed.match(/^Special:\s*(.+)$/i);
      if (specialMatch) {
        properties.push(`special: ${specialMatch[1].toLowerCase()}`);
        continue;
      }

      properties.push(trimmed.toLowerCase());
    }

    if (properties.length > 0) info.properties = properties;
    if (mastery.length > 0) info.mastery = mastery;
  }

  return Object.keys(info).length > 0 ? info : undefined;
}

/**
 * Parses rarity, attunement, and weapon properties from italic metadata lines.
 *
 * @param {string[]} lines - File lines
 * @param {SharedData} sharedData - Shared data
 * @returns {{ rarity?: string, requiresAttunement?: boolean, attunementRequirements?: string, weaponInfo?: WeaponTitleInfo }}
 */
function parseRarityAndAttunement(lines: string[], sharedData: SharedData) {
  const cutoffIndex = lines.findIndex((l) => /^\s*---\s*$/.test(l));
  const headerLines = cutoffIndex === -1 ? lines : lines.slice(0, cutoffIndex);

  const italicLines = headerLines
    .filter((l) => /^_.*_$/.test(l.trim()))
    .map((l) => clean(l.replace(/^_/, '').replace(/_$/, '')));

  let rarity: string | undefined;
  let requiresAttunement = false;
  let attunementRequirements: string | undefined;
  let weaponInfo: WeaponTitleInfo | undefined;

  const rarityKeywords = ItemData.getRarities(sharedData);

  for (const line of italicLines) {
    const lowerLine = line.toLowerCase();

    for (const rarityKeyword of rarityKeywords) {
      if (lowerLine.includes(rarityKeyword)) {
        rarity = rarityKeyword;
        break;
      }
    }

    if (lowerLine.includes('attunement')) {
      requiresAttunement = true;
      const attunementMatch = line.match(
        /requires attunement(?:\s+by\s+(.+?))?(?:\)|$)/i,
      );
      if (attunementMatch?.[1]) {
        attunementRequirements = stripMarkdown(attunementMatch[1].trim());
      }
    }

    const isSubtypeFormat = /^[^,]+,\s*[^,]+\s*\([^)]+\)\s*$/.test(line);
    if (
      line.includes('(') &&
      !lowerLine.includes('attunement') &&
      !rarityKeywords.some((r) => lowerLine.includes(r)) &&
      !/property|applies/i.test(line) &&
      !isSubtypeFormat
    ) {
      const parsed = parseWeaponTitleLine(line, sharedData);
      if (parsed && Object.keys(parsed).length > 0) {
        weaponInfo = parsed;
      }
    }
  }

  return { rarity, requiresAttunement, attunementRequirements, weaponInfo };
}

/**
 * Parses weapon damage from Properties section.
 *
 * @param {Record<string, string>} properties - Parsed properties
 * @returns {{ damage?: string, damageType?: string, versatileDamage?: string } | undefined}
 */
function parseWeaponDamageFromProperties(properties: Record<string, string>) {
  if (!properties?.Damage) return undefined;

  const damageInfo: Record<string, string> = {};
  const damageText = properties.Damage;

  const damageMatch = damageText.match(
    /([\dd+]+)\s+(acid|bludgeoning|cold|fire|force|lightning|necrotic|piercing|poison|psychic|radiant|slashing|thunder)(?:\s*\(([\dd+]+)\s*(?:versatile)?\))?/i,
  );

  if (damageMatch) {
    damageInfo.damage = damageMatch[1];
    damageInfo.damageType = damageMatch[2].toLowerCase();
    if (damageMatch[3]) damageInfo.versatileDamage = damageMatch[3];
  }

  return Object.keys(damageInfo).length > 0 ? damageInfo : undefined;
}

/**
 * Parses Type property and extracts weapon properties and weapon type.
 *
 * @param {Record<string, string>} properties - Parsed properties
 * @param {SharedData} sharedData - Shared data
 * @returns {{ weaponType?: string, weaponProperties: string[], uniqueTags: string[], mastery: string[] }}
 */
function parseTypeProperty(
  properties: Record<string, string>,
  sharedData: SharedData,
) {
  if (!properties?.Type)
    return {
      weaponProperties: [] as string[],
      uniqueTags: [] as string[],
      mastery: [] as string[],
    };

  const typeText = properties.Type;
  const result = {
    weaponType: undefined as string | undefined,
    weaponProperties: [] as string[],
    uniqueTags: [] as string[],
    mastery: [] as string[],
  };

  const typeMatch = typeText.match(/^([A-Za-z][A-Za-z\s-]+?)(?:\s*\(|$)/i);
  let baseType: string | null = null;
  if (typeMatch) baseType = typeMatch[1].trim();

  const parenMatch = typeText.match(/\(([^)]+)\)/i);
  if (parenMatch) {
    const content = parenMatch[1];
    const parts = content.split(/,\s*/);

    for (const part of parts) {
      const trimmed = part.trim();
      const lower = trimmed.toLowerCase();

      const masteryMatch = trimmed.match(/^Mastery:\s*(.+)$/i);
      if (masteryMatch) {
        result.mastery.push(
          ...masteryMatch[1]
            .split(/\s*,\s*/)
            .map((m) => m.trim().toLowerCase()),
        );
        continue;
      }

      const specialMatch = trimmed.match(/^Special:\s*(.+)$/i);
      if (specialMatch) {
        result.uniqueTags.push(
          `unique:${specialMatch[1].toLowerCase().replace(/\s+/g, '-')}`,
        );
        continue;
      }

      if (/^reach\s*\(\d+\s*ft\.?\)$/i.test(trimmed)) {
        result.weaponProperties.push('reach');
        continue;
      }

      const weaponProperties = ItemData.getWeaponProperties(sharedData);
      if (weaponProperties.includes(lower)) {
        result.weaponProperties.push(lower);
      } else {
        result.uniqueTags.push(`unique:${lower.replace(/\s+/g, '-')}`);
      }
    }
  }

  const lowerBase = baseType?.toLowerCase();
  const baseCategoryTypes = ItemData.getBaseCategoryTypes(sharedData).map((t) =>
    t.toLowerCase(),
  );
  if (lowerBase && baseCategoryTypes.includes(lowerBase)) {
    if (parenMatch) {
      const firstItem = parenMatch[1].split(',')[0].trim();
      if (firstItem && !/^(Mastery|Special):/i.test(firstItem)) {
        result.weaponType = firstItem;
      }
    }
  } else {
    result.weaponType = baseType ?? undefined;
  }

  return result;
}

/**
 * Parses a single heirloom file and extracts metadata.
 *
 * @param {string} filePath - Path to .mdx file
 * @param {SharedData} sharedData - Shared data
 * @returns {Promise<object>} Heirloom metadata object
 */
async function parseHeirloomFile(
  filePath: string,
  sharedData: SharedData,
): Promise<object> {
  const raw = await fs.readFile(filePath, 'utf8');
  const lines = readLines(raw);
  const baseSlug = filePathToSlug(filePath);

  const title = parseTitle(lines);
  const { rarity, requiresAttunement, attunementRequirements, weaponInfo } =
    parseRarityAndAttunement(lines, sharedData);
  const itemType = ItemData.detectItemType(lines, sharedData);
  const properties = parseProperties(raw);

  const typeInfo = parseTypeProperty(properties, sharedData);
  const weaponDamage = parseWeaponDamageFromProperties(properties);
  const weight = parseWeight(properties);
  const rangeFromProps = parseRange(properties);

  let weaponType: string | undefined =
    weaponInfo?.weaponType || typeInfo.weaponType;
  const hitModifier = weaponInfo?.hitModifier;
  const range = weaponInfo?.range || rangeFromProps;

  if (!weaponType) {
    if (properties?.Type) {
      const parenMatch = properties.Type.match(/\(([^)]+)\)/);
      if (parenMatch) {
        weaponType = parenMatch[1].split(',')[0].trim();
      }
    }

    if (!weaponType) {
      const italicLines = lines
        .slice(0, 10)
        .filter((l) => /^_.*_$/.test(l.trim()))
        .map((l) => l.replace(/^_/, '').replace(/_$/, '').trim());

      const itemTypes = ItemData.getItemTypes(sharedData);
      const clothingTypes = ItemData.getClothingTypes(sharedData);
      const armorTypes = ItemData.getArmorTypes(sharedData);
      const allValidTypes = [...itemTypes, ...clothingTypes, ...armorTypes].map(
        (t) => t.toLowerCase(),
      );
      const rarityKeywords = ItemData.getRarities(sharedData);

      for (const line of italicLines) {
        const lower = line.toLowerCase();
        if (rarityKeywords.some((r) => lower.includes(r))) continue;
        if (/property|applies/i.test(line)) continue;

        if (allValidTypes.includes(lower)) {
          weaponType = line;
          break;
        }

        const commaMatch = line.match(/^([^,]+),\s*([^,]+)$/);
        if (commaMatch) {
          const firstPart = commaMatch[1].trim().toLowerCase();
          const secondPart = commaMatch[2].trim();
          if (allValidTypes.includes(firstPart)) {
            const pm = secondPart.match(/^([^(]+)/);
            weaponType = pm ? pm[1].trim() : secondPart;
            break;
          }
        }
      }
    }
  }

  const allWeaponProps = new Set<string>();
  if (weaponInfo?.properties)
    weaponInfo.properties.forEach((p) => allWeaponProps.add(p));
  if (typeInfo.weaponProperties)
    typeInfo.weaponProperties.forEach((p) => allWeaponProps.add(p));
  const weaponProperties =
    allWeaponProps.size > 0 ? Array.from(allWeaponProps).sort() : undefined;

  const allMastery = new Set<string>();
  if (weaponInfo?.mastery) weaponInfo.mastery.forEach((m) => allMastery.add(m));
  if (typeInfo.mastery) typeInfo.mastery.forEach((m) => allMastery.add(m));
  const mastery =
    allMastery.size > 0 ? Array.from(allMastery).sort() : undefined;

  const damageTypesDealt = parseDamageTypesDealt(raw, sharedData);
  const savingThrowTypes = parseSavingThrowTypes(raw, sharedData);
  const charges = parseCharges(raw);

  const tags = extractAllTags(raw, filePath, sharedData, {
    contentType: 'item',
  });
  if (typeInfo.uniqueTags) tags.push(...typeInfo.uniqueTags);

  if (itemType)
    tags.push(`item:${itemType.toLowerCase().replace(/\s+/g, '-')}`);
  if (rarity) tags.push(`rarity:${rarity.toLowerCase().replace(/\s+/g, '-')}`);
  if (weaponType)
    tags.push(`weapon:${weaponType.toLowerCase().replace(/\s+/g, '-')}`);

  tags.sort();

  if (!rarity) log.warning(`No rarity found for ${title || baseSlug}`);
  if (!itemType) log.warning(`No item type found for ${title || baseSlug}`);

  return {
    slug: baseSlug,
    title:
      title ||
      baseSlug.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    file: path.relative(process.cwd(), filePath).replace(/\\/g, '/'),
    link: `/library/items/heirlooms/${baseSlug}`,
    rarity,
    itemType: itemType?.toLowerCase(),
    weaponType: weaponType?.toLowerCase(),
    requiresAttunement,
    attunementRequirements,
    weaponProperties,
    mastery,
    weaponDamage,
    hitModifier,
    range,
    weight,
    damageTypesDealt,
    savingThrowTypes,
    charges,
    tags: tags.length ? Array.from(new Set(tags)).sort() : undefined,
    indexVersion: 1,
  };
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
    name: 'Heirloom Metadata Generator',
    contentType: 'heirlooms',
    filePattern: options.filePattern || /\.mdx$/i,
    parseFile: parseHeirloomFile,
    contentDir: options.contentDir,
    storage: options.storage,
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runWithCli(main).catch((error) => {
    log.error('Fatal error', {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    process.exit(1);
  });
}

export { main, parseHeirloomFile };
