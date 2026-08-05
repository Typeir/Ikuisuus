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

import { toNativeMeasure, toPlainMeasure } from '@/lib/units/nativeMeasure';
import { createLogger } from '@/lib/logging/logger';
import { promises as fs } from 'fs';
import matter from 'gray-matter';
import path from 'path';
import {
  ItemData,
  clean,
  extractAllTags,
  filePathToSlug,
  findContentImage,
  parseCharges,
  parseDamageTypesDealt,
  parseProperties,
  parseRange,
  parseSavingThrowTypes,
  parseTitle,
  plain,
  parseWeight,
  readLines,
  runGenerator,
  runWithCli,
  stripMarkdown,
  type SharedData,
  type StorageAdapter,
} from '.';
import { GameData } from './gameData';
import {
  ATTUNEMENT,
  DAMAGE,
  ITALIC,
  TYPE_PARSING,
  WEAPON,
} from './heirloomPatterns';
import { LIST, SLUG, TEXT } from './parsingPatterns';

const log = createLogger({ component: 'HeirloomMetadataGenerator' });

/**
 * Splits a leading size word off a parsed type.
 *
 * A type line reads `Large Greatsword`, which is a greatsword at a size, not a
 * distinct weapon. Left joined, the size spawns a near-duplicate weapon type for
 * every size it appears at and a reader filtering `weapon:greatsword` never sees
 * the item.
 *
 * @param {string} value - Parsed type text
 * @param {string[]} sizes - Recognised size words
 * @returns {{ type: string; size?: string }} The type with any size word removed
 */
function splitSizeModifier(
  value: string,
  sizes: string[],
): { type: string; size?: string } {
  const [head, ...rest] = value.trim().split(TEXT.whitespaceCollapse);
  if (rest.length === 0) return { type: value };

  const size = sizes.find(
    (entry) => entry.toLowerCase() === head.toLowerCase(),
  );
  return size ? { type: rest.join(' '), size } : { type: value };
}

/**
 * Routes a parsed specific type to whichever group owns it.
 *
 * The type line names a weapon for a sword and an armour class for a breastplate,
 * so the parser cannot know which group its answer belongs to. Trying each in
 * turn keeps a single warning for a type no group recognises, rather than one
 * false alarm per group that legitimately declined it.
 *
 * @param {string[]} tags - Tag accumulator, mutated in place
 * @param {string} value - Parsed specific type
 * @param {string} label - Heirloom name, for the warning
 * @param {SharedData} sharedData - Shared game data
 * @returns {void}
 */
function pushTypeTag(
  tags: string[],
  value: string,
  label: string,
  sharedData: SharedData,
): void {
  const normalized = value.trim().toLowerCase();
  const armorCategory = normalized.replace(/\s+armou?r$/, '');
  const armorValue = ['light', 'medium', 'heavy'].includes(armorCategory)
    ? armorCategory
    : normalized;

  const candidates: ReadonlyArray<[string, string, string[]]> = [
    ['weapon', normalized, ItemData.getWeaponTypes(sharedData)],
    ['armor', armorValue, ItemData.getArmorTypes(sharedData)],
    ['armor', armorValue, ['light', 'medium', 'heavy']],
    ['item', normalized, ItemData.getItemTypes(sharedData)],
    ['item', normalized, ItemData.getBaseCategoryTypes(sharedData)],
  ];

  for (const [group, candidate, vocabulary] of candidates) {
    if (vocabulary.some((entry) => entry.toLowerCase() === candidate)) {
      tags.push(`${group}:${candidate.replace(TEXT.whitespaceCollapse, '-')}`);
      return;
    }
  }

  log.warning(
    `${label}: "${value}" is not a known weapon, armor or item type — no type aspect emitted`,
  );
}

/**
 * Appends an aspect only when its value belongs to the group's vocabulary.
 *
 * The type line is free prose, so the parser returns whatever it finds there.
 * Emitting that unchecked is how `weapon:liver` and `weapon:food-and-drink`
 * reached the index: a wrong aspect is indistinguishable from a right one until
 * a reader filters by it. An unrecognised value is dropped and reported, so the
 * page keeps the aspects it earned and the prose that confused the parser gets
 * named rather than silently indexed.
 *
 * @param {string[]} tags - Tag accumulator, mutated in place
 * @param {string} group - Aspect group without its trailing colon
 * @param {string | undefined} value - Parsed value, in whatever form the prose used
 * @param {string} label - Heirloom name, for the warning
 * @param {string[]} vocabulary - Values the group accepts
 * @returns {void}
 */
function pushVocabularyTag(
  tags: string[],
  group: string,
  value: string | undefined,
  label: string,
  vocabulary: string[],
): void {
  if (!value) return;

  const normalized = value.trim().toLowerCase();
  if (!vocabulary.some((entry) => entry.toLowerCase() === normalized)) {
    log.warning(
      `${label}: "${value}" is not a known ${group} type — no ${group}: aspect emitted`,
    );
    return;
  }

  tags.push(`${group}:${normalized.replace(TEXT.whitespaceCollapse, '-')}`);
}

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

  const beforeParen = line.match(WEAPON.nameBeforeParen);
  if (beforeParen) {
    const fullText = beforeParen[1].trim();
    const modMatch = fullText.match(WEAPON.enhancementMod);
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

      const masteryMatch = trimmed.match(WEAPON.mastery);
      if (masteryMatch) {
        capturingMastery = true;
        const firstMastery = masteryMatch[1].trim();
        if (firstMastery) mastery.push(plain(firstMastery).toLowerCase());
        continue;
      }

      if (capturingMastery) {
        if (WEAPON.masteryEnd.test(trimmed)) {
          capturingMastery = false;
        } else {
          mastery.push(plain(trimmed).toLowerCase());
          continue;
        }
      }

      const rangeMatch = trimmed.match(WEAPON.range);
      if (rangeMatch) {
        info.range = toNativeMeasure(
          rangeMatch[1].replace(SLUG.parentheses, '').trim(),
        );
        continue;
      }

      const reachMatch = trimmed.match(WEAPON.reach);
      if (reachMatch) {
        info.range = toNativeMeasure(reachMatch[1]);
        properties.push('reach');
        continue;
      }

      const specialMatch = trimmed.match(WEAPON.special);
      if (specialMatch) {
        properties.push(`special: ${specialMatch[1].toLowerCase()}`);
        continue;
      }

      properties.push(trimmed.toLowerCase());
    }

    if (properties.length > 0) info.properties = properties.map((v) => plain(v));
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
  const cutoffIndex = lines.findIndex((l) => TEXT.horizontalRule.test(l));
  const headerLines = cutoffIndex === -1 ? lines : lines.slice(0, cutoffIndex);

  const italicLines = headerLines
    .filter((l) => ITALIC.line.test(l.trim()))
    .map((l) =>
      clean(
        l
          /* Trim first: hard-break trailing spaces ("_Rare_  ") otherwise
             defeat the trailing-underscore strip. */
          .trim()
          .replace(TEXT.underscoreLeading, '')
          .replace(TEXT.underscoreTrailing, ''),
      ),
    );

  let rarity: string | undefined;
  let requiresAttunement = false;
  let attunementRequirements: string | undefined;
  let weaponInfo: WeaponTitleInfo | undefined;

  const rarityKeywords = ItemData.getRarities(sharedData);

  for (const line of italicLines) {
    const lowerLine = line.toLowerCase();

    // Only set rarity once (prefer the first found) using whole-word matching
    if (!rarity) {
      for (const rarityKeyword of rarityKeywords) {
        const kw = String(rarityKeyword).toLowerCase();
        const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp(`\\b${escaped}\\b`);
        if (re.test(lowerLine)) {
          rarity = rarityKeyword;
          break;
        }
      }
    }

    if (lowerLine.includes('attunement')) {
      requiresAttunement = true;
      const attunementMatch = line.match(ATTUNEMENT.requirement);
      if (attunementMatch?.[1]) {
        attunementRequirements = stripMarkdown(attunementMatch[1].trim());
      }
    }

    const isSubtypeFormat = ITALIC.subtypeFormat.test(line);
    if (
      line.includes('(') &&
      !lowerLine.includes('attunement') &&
      // Skip weapon title parsing if line contains any rarity keyword (whole-word match)
      !rarityKeywords.some((r) => {
        const kw = String(r).toLowerCase();
        const esc = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(`\\b${esc}\\b`).test(lowerLine);
      }) &&
      !ITALIC.propertyOrApplies.test(line) &&
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

  const damageMatch = damageText.match(DAMAGE.weaponDamage);

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
 * The parenthetical after a type means different things by base type: a weapon
 * lists properties (`Longsword (Martial, Versatile)`) while everything else lists
 * the slots it occupies (`Monstrous Graft (Liver, Gut)`, `Clothing (Cloak)`).
 * The base type decides which, rather than a list of known slots — a new graft
 * site should start filtering the day it is written, not the day somebody
 * remembers to add it to shared data.
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
      weaponType: undefined as string | undefined,
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

  const typeMatch = typeText.match(WEAPON.typeExtract);
  let baseType: string | null = null;
  if (typeMatch) baseType = typeMatch[1].trim();

  const baseIsWeapon = ItemData.getWeaponTypes(sharedData).some(
    (entry) => entry.toLowerCase() === baseType?.toLowerCase(),
  );

  const parenMatch = typeText.match(TYPE_PARSING.parenContent);
  if (parenMatch) {
    const content = parenMatch[1];
    const parts = content.split(LIST.commaSplit);

    for (const part of parts) {
      const trimmed = plain(part);
      const lower = trimmed.toLowerCase();

      const masteryMatch = trimmed.match(WEAPON.mastery);
      if (masteryMatch) {
        result.mastery.push(
          ...masteryMatch[1]
            .split(LIST.commaWhitespace)
            .map((m: string) => plain(m).toLowerCase()),
        );
        continue;
      }

      const specialMatch = trimmed.match(WEAPON.special);
      if (specialMatch) {
        result.uniqueTags.push(
          `unique:${specialMatch[1].toLowerCase().replace(TEXT.whitespaceCollapse, '-')}`,
        );
        continue;
      }

      if (WEAPON.reachInParens.test(trimmed)) {
        result.weaponProperties.push('reach');
        continue;
      }

      const weaponProperties = ItemData.getWeaponProperties(sharedData);
      const slug = lower.replace(TEXT.whitespaceCollapse, '-');
      const isArmorType = ItemData.getArmorTypes(sharedData).some(
        (entry) => entry.toLowerCase() === lower,
      );

      if (weaponProperties.includes(lower)) {
        result.weaponProperties.push(lower);
      } else if (isArmorType) {
        result.uniqueTags.push(`armor:${slug}`);
      } else {
        result.uniqueTags.push(`${baseIsWeapon ? 'unique' : 'slot'}:${slug}`);
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
      if (firstItem && !TYPE_PARSING.masterySpecialGuard.test(firstItem)) {
        result.weaponType = firstItem;
      }
    }
  } else {
    result.weaponType = baseType ?? undefined;
  }

  return result;
}

/**
 * Extracts the prose description from a heirloom MDX file.
 *
 * Heirloom files have no `---` divider. The description is the first natural
 * prose paragraph after the H1 title, skipping JSX component blocks, italic
 * metadata lines (rarity, type), headings, table rows, blockquotes, and
 * code fences.
 *
 * @param {string[]} lines - File lines (trimmed)
 * @returns {string | undefined} First prose line with markdown stripped, or undefined
 */
function parseHeirloomDescription(lines: string[]): string | undefined {
  const titleIndex = lines.findIndex((l) => l.startsWith('# '));
  if (titleIndex === -1) return undefined;

  let inJsxBlock = false;
  for (let i = titleIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.includes('<')) {
      inJsxBlock = !line.includes('/>') && !line.includes('</');
      if (inJsxBlock || line.includes('/>') || line.includes('</')) continue;
    }
    if (inJsxBlock) continue;

    if (!line) continue;

    if (
      line.startsWith('#') ||
      line.startsWith('_') ||
      line.startsWith('>') ||
      line.startsWith('|') ||
      line.startsWith('-') ||
      line.startsWith('```')
    ) {
      continue;
    }

    if (line.includes('=') && (line.includes('{') || line.includes("'"))) {
      continue;
    }

    return plain(line);
  }
  return undefined;
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
  const rawFile = await fs.readFile(filePath, 'utf8');
  const { content: raw } = matter(rawFile);
  const lines = readLines(raw);
  const baseSlug = filePathToSlug(filePath);

  const title = parseTitle(lines);
  const { rarity, requiresAttunement, attunementRequirements, weaponInfo } =
    parseRarityAndAttunement(lines, sharedData);
  const itemType = ItemData.detectItemType(lines, sharedData);
  const properties = parseProperties(raw) ?? {};

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
      const parenMatch = properties.Type.match(TYPE_PARSING.parenContent);
      if (parenMatch) {
        weaponType = parenMatch[1].split(',')[0].trim();
      }
    }

    if (!weaponType) {
      const italicLines = lines
        .slice(0, 10)
        .filter((l) => ITALIC.line.test(l.trim()))
        .map((l) =>
          l
            .trim()
            .replace(TEXT.underscoreLeading, '')
            .replace(TEXT.underscoreTrailing, ''),
        );

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
        if (ITALIC.propertyOrApplies.test(line)) continue;

        if (allValidTypes.includes(lower)) {
          weaponType = line;
          break;
        }

        const commaMatch = line.match(TYPE_PARSING.twoPartFormat);
        if (commaMatch) {
          const firstPart = commaMatch[1].trim().toLowerCase();
          const secondPart = commaMatch[2].trim();
          if (allValidTypes.includes(firstPart)) {
            const pm = secondPart.match(TYPE_PARSING.beforeParen);
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

  const label = title || baseSlug;
  pushVocabularyTag(tags, 'item', itemType, label, [
    ...ItemData.getItemTypes(sharedData),
    ...ItemData.getBaseCategoryTypes(sharedData),
  ]);
  pushVocabularyTag(
    tags,
    'rarity',
    rarity,
    label,
    ItemData.getRarities(sharedData),
  );
  if (weaponType) {
    const sized = splitSizeModifier(weaponType, GameData.getSizes(sharedData));
    if (sized.size) tags.push(`size:${sized.size.toLowerCase()}`);
    pushTypeTag(tags, sized.type, label, sharedData);
  }

  for (const property of typeInfo.weaponProperties ?? []) {
    pushVocabularyTag(
      tags,
      'property',
      property,
      label,
      ItemData.getWeaponProperties(sharedData),
    );
  }

  for (const entry of mastery ?? []) {
    pushVocabularyTag(
      tags,
      'property',
      entry,
      label,
      ItemData.getMasteryProperties(sharedData),
    );
  }

  if (raw.toLowerCase().includes('nonmagical')) {
    tags.push('property:nonmagical');
  }

  const uniqueTags = Array.from(new Set(tags)).sort();
  tags.length = 0;
  tags.push(...uniqueTags);

  const description = parseHeirloomDescription(lines);
  const image = findContentImage(lines);

  if (!rarity) log.warning(`No rarity found for ${title || baseSlug}`);
  if (!itemType) log.warning(`No item type found for ${title || baseSlug}`);

  return {
    slug: baseSlug,
    title:
      title ||
      baseSlug
        .replace(SLUG.hyphensUnderscores, ' ')
        .replace(SLUG.titleCase, (c) => c.toUpperCase()),
    file: path
      .relative(process.cwd(), filePath)
      .replace(SLUG.pathBackslash, '/'),
    link: `/library/items/heirlooms/${baseSlug}`,
    rarity,
    itemType: itemType?.toLowerCase(),
    weaponType: weaponType?.toLowerCase(),
    requiresAttunement,
    attunementRequirements,
    weaponProperties,
    mastery,
    weaponDamage: weaponDamage?.damage,
    weaponDamageType: weaponDamage?.damageType,
    versatileDamage: weaponDamage?.versatileDamage,
    hitModifier,
    range,
    weight,
    damageTypesDealt,
    savingThrowTypes,
    charges,
    tags: tags.length ? Array.from(new Set(tags)).sort() : undefined,
    indexVersion: 1,
    ...(description && { description }),
    ...(image && { image }),
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
    filePattern: options.filePattern || /\.heirloom\.mdx$/i,
    parseFile: parseHeirloomFile,
    contentDir: options.contentDir,
    storage: options.storage,
    metadataVersion: '3.0.0',
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
