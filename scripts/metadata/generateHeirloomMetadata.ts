/**
 * @fileoverview Heirloom Metadata Generator
 * @description Parses .mdx files from the heirlooms directory and extracts metadata:
 * rarity, item types, attunement, weapon properties, and gameplay mechanics tags.
 *
 * @module scripts/metadata/generateHeirloomMetadata
 * @version 3.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { toNativeMeasure, toPlainMeasure } from '@/lib/units/nativeMeasure';
import {
  FEATURE_SLOT_NAMES,
  FEATURE_SLOTS,
  HEIRLOOM_SLOT_NAMES,
  HEIRLOOM_SLOTS,
} from '@/modules/library/domain/slots';
import { createLogger } from '@/lib/logging/logger';
import { promises as fs } from 'fs';
import matter from 'gray-matter';
import path from 'path';
import remarkGfm from 'remark-gfm';
import remarkMdx from 'remark-mdx';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import {
  applyAuthoredAspects,
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
  MASTERY,
  TYPE_PARSING,
  WEAPON,
} from './heirloomPatterns';
import { LIST, SLUG, TEXT } from './parsingPatterns';

const log = createLogger({ component: 'HeirloomMetadataGenerator' });

/**
 * Splits a leading size word off a parsed type when the first word matches a
 * recognised size.
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
 * Content of the first balanced-parenthesis group.
 *
 * @param {string} text - Line to scan
 * @returns {string | undefined} Group content, or undefined
 */
function firstParenGroup(text: string): string | undefined {
  const open = text.indexOf('(');
  if (open === -1) return undefined;

  let depth = 0;
  for (let i = open; i < text.length; i++) {
    if (text[i] === '(') depth++;
    else if (text[i] === ')' && --depth === 0) {
      return text.substring(open + 1, i);
    }
  }
  return undefined;
}

/**
 * Splits a mastery clause into lower-case names. Strips markdown and em-dash
 * notes, splits on "or"/commas, drops "None".
 *
 * @param {string} value - Raw mastery clause
 * @returns {string[]} Mastery names
 */
function normalizeMasteryValues(value: string): string[] {
  return plain(value)
    .replace(MASTERY.note, '')
    .split(LIST.orSplit)
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry.length > 0 && !MASTERY.none.test(entry));
}

/**
 * Lower-case mastery names defined in the file's own Weapon Mastery section.
 *
 * @param {string[]} lines - File lines
 * @returns {Set<string>} Lower-case mastery names
 */
function parseCustomMasteryNames(lines: string[]): Set<string> {
  const names = new Set<string>();
  let inMasterySection = false;

  for (const line of lines) {
    const heading = line.match(MASTERY.sectionHeading);
    if (heading) {
      inMasterySection = MASTERY.sectionName.test(heading[1]);
      continue;
    }
    if (!inMasterySection) continue;

    const label = line.match(MASTERY.definitionLabel);
    if (label) names.add(plain(label[1]).trim().toLowerCase());
  }

  return names;
}

/**
 * Routes a parsed specific type to whichever group owns it.
 *
 * @param {string[]} tags - Tag accumulator, mutated in place
 * @param {string} value - Parsed specific type
 * @param {string} label - Heirloom name, for the warning
 * @param {SharedData} sharedData - Shared game data
 * @param {boolean} [quiet] - Skip the warning when no group recognises the value
 * @returns {void}
 */
function pushTypeTag(
  tags: string[],
  value: string,
  label: string,
  sharedData: SharedData,
  quiet = false,
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

  if (quiet) return;

  log.warning(
    `${label}: "${value}" is not a known weapon, armor or item type — no type aspect emitted`,
  );
}

/**
 * Appends an aspect only when its value belongs to the group's vocabulary.
 *
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

  const content = firstParenGroup(line);
  if (content !== undefined) {
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
        mastery.push(...normalizeMasteryValues(masteryMatch[1]));
        continue;
      }

      if (capturingMastery) {
        if (WEAPON.masteryEnd.test(trimmed)) {
          capturingMastery = false;
        } else {
          mastery.push(...normalizeMasteryValues(trimmed));
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

    if (properties.length > 0)
      info.properties = properties.map((v) => plain(v));
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
 * Parses the Type property and extracts weapon properties, weapon type, unique
 * tags, and mastery. The parenthetical lists weapon properties for weapon base
 * types and occupied slots for all other base types.
 *
 * @param {Record<string, string>} properties - Parsed properties
 * @param {SharedData} sharedData - Shared data
 * @returns {{ weaponType?: string, weaponProperties: string[], uniqueTags: string[], mastery: string[], typeFromParen: boolean }} Parsed type info; typeFromParen is true when weaponType came from a base category's parenthetical
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
      typeFromParen: false,
    };

  const typeText = properties.Type;
  const result = {
    weaponType: undefined as string | undefined,
    weaponProperties: [] as string[],
    uniqueTags: [] as string[],
    mastery: [] as string[],
    typeFromParen: false,
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
        result.mastery.push(...normalizeMasteryValues(masteryMatch[1]));
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
        result.typeFromParen = true;
      }
    }
  } else {
    result.weaponType = baseType ?? undefined;
  }

  return result;
}

/**
 * First prose paragraph after the H1 title, with markdown stripped. Skips JSX
 * component blocks, italic metadata lines, headings, table rows, blockquotes,
 * and code fences.
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
  return parseHeirloomSource(
    await fs.readFile(filePath, 'utf8'),
    filePath,
    sharedData,
  );
}

/**
 * Parses heirloom metadata from raw MDX source, no file read.
 *
 * @param {string} rawFile - Complete file text including frontmatter
 * @param {string} filePath - Path the source belongs to, for slug and org tags
 * @param {SharedData} sharedData - Shared game data
 * @returns {object} Parsed heirloom metadata
 */
export function parseHeirloomSource(
  rawFile: string,
  filePath: string,
  sharedData: SharedData,
): object {
  const { content: raw, data: frontmatter } = matter(rawFile);
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
  let weaponTypeFromParen = !weaponInfo?.weaponType && typeInfo.typeFromParen;
  const hitModifier = weaponInfo?.hitModifier;
  const range = weaponInfo?.range || rangeFromProps;

  if (!weaponType) {
    if (properties?.Type) {
      const parenMatch = properties.Type.match(TYPE_PARSING.parenContent);
      if (parenMatch) {
        weaponType = parenMatch[1].split(',')[0].trim();
        weaponTypeFromParen = true;
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
    pushTypeTag(tags, sized.type, label, sharedData, weaponTypeFromParen);
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

  const customMasteries = parseCustomMasteryNames(lines);
  const masteryVocabulary = ItemData.getMasteryProperties(sharedData);
  for (const entry of mastery ?? []) {
    const known = masteryVocabulary.some(
      (candidate) => candidate.toLowerCase() === entry,
    );
    if (!known && customMasteries.has(entry)) continue;
    pushVocabularyTag(tags, 'property', entry, label, masteryVocabulary);
  }

  if (raw.toLowerCase().includes('nonmagical')) {
    tags.push('property:nonmagical');
  }

  const uniqueTags = applyAuthoredAspects(tags, frontmatter);
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
    ...(weight ?? {}),
    damageTypesDealt,
    savingThrowTypes,
    charges,
    tags: tags.length ? Array.from(new Set(tags)).sort() : undefined,
    indexVersion: 1,
    ...(description && { description }),
    ...(image && { image }),
  };
}

export interface HeirloomV2Feature {
  name: string;
  kind: string;
  tag?: string;
  cost?: string;
  targets?: string;
  recharge?: string;
}

/**
 * Output shape of the slot card extractor.
 */
export interface HeirloomV2Result {
  rarity: string;
  attunement?: string;
  base?: string;
  quality?: string;
  enchantment?: string;
  damage?: string;
  versatile?: string;
  reach?: string;
  range?: string;
  armorClass?: string;
  stealth?: string;
  mastery?: string[];
  masterfulBlow?: string;
  charges?: string;
  burden?: string;
  focus?: string;
  nullifying?: string;
  features: HeirloomV2Feature[];
}

/**
 * Loose mdast node shape the extractor walks.
 */
interface MdNode {
  type: string;
  name?: string;
  value?: string;
  attributes?: Array<{ name: string; value?: unknown }>;
  children?: MdNode[];
}

/**
 * Concatenated text of an mdast subtree.
 *
 * @param {MdNode | undefined} node - Node to flatten
 * @returns {string} Text content
 */
function mdTextOf(node: MdNode | undefined): string {
  if (!node) return '';
  if (node.type === 'text') return node.value ?? '';
  return (node.children ?? []).map(mdTextOf).join('');
}

/**
 * Text of an mdast subtree without inline JSX elements.
 *
 * @param {MdNode} node - Node to flatten
 * @returns {string} Text content excluding JSX
 */
function mdTextWithoutJsx(node: MdNode): string {
  if (node.type === 'text') return node.value ?? '';
  if (node.type === 'mdxJsxTextElement' || node.type === 'mdxJsxFlowElement') {
    return '';
  }
  return (node.children ?? []).map(mdTextWithoutJsx).join('');
}

/**
 * String value of a named attribute.
 *
 * @param {MdNode} node - JSX element node
 * @param {string} name - Attribute name
 * @returns {string | undefined} Attribute value
 */
function attrValueOf(node: MdNode, name: string): string | undefined {
  for (const attr of node.attributes ?? []) {
    if (attr.name === name && typeof attr.value === 'string') return attr.value;
  }
  return undefined;
}

/**
 * Text of the first child slot element with the given name (form D). Slots
 * sit directly or inside a paragraph of the host.
 *
 * @param {MdNode} node - Host element node
 * @param {string} name - Slot element name
 * @returns {string | undefined} Slot value
 */
function slotValueOf(node: MdNode, name: string): string | undefined {
  const slotText = (child: MdNode): string | undefined =>
    (child.type === 'mdxJsxTextElement' ||
      child.type === 'mdxJsxFlowElement') &&
    child.name === name
      ? mdTextOf(child).trim()
      : undefined;

  for (const child of node.children ?? []) {
    const direct = slotText(child);
    if (direct !== undefined) return direct;
    if (child.type === 'paragraph') {
      for (const inner of child.children ?? []) {
        const nested = slotText(inner);
        if (nested !== undefined) return nested;
      }
    }
  }
  return undefined;
}

/**
 * First flow element with the given name among children.
 *
 * @param {MdNode} node - Parent node
 * @param {string} name - Element name
 * @returns {MdNode | undefined} The element
 */
function findFlowElement(node: MdNode, name: string): MdNode | undefined {
  return (node.children ?? []).find(
    (child) => child.type === 'mdxJsxFlowElement' && child.name === name,
  );
}

/**
 * Lower-cases a slot value, split on commas and semicolons.
 *
 * @param {string | undefined} value - Slot value
 * @returns {string[]} Normalised entries
 */
function normalizeListValue(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(/[,;]/)
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry.length > 0);
}

/**
 * Rarity word from an italic rarity line.
 *
 * @param {string} text - Rarity line text
 * @returns {string} Lower-cased rarity
 */
function rarityFromText(text: string): string {
  const match = text.trim().match(/^(.+?)\s+heirloom\s*$/i);
  return (match ? match[1] : text).trim().toLowerCase();
}

/**
 * Extracts name and tag from a feature heading node.
 *
 * @param {MdNode} heading - Heading element
 * @returns {{ name: string; tag?: string }} Heading parts
 */
function headingPartsOf(heading: MdNode): { name: string; tag?: string } {
  const name = mdTextWithoutJsx(heading).trim();
  const span = (heading.children ?? []).find(
    (child) => child.type === 'mdxJsxTextElement' && child.name === 'span',
  );
  const tag = span ? mdTextOf(span).trim() : undefined;
  return tag ? { name, tag } : { name };
}

/**
 * Extracts the header slots of the JSX forms from the Heirloom element.
 *
 * @param {MdNode} heirloom - Heirloom flow element
 * @returns {Partial<HeirloomV2Result>} Header fields
 */
function parseJsxHeader(heirloom: MdNode): Partial<HeirloomV2Result> {
  const out: Partial<HeirloomV2Result> = {};
  for (const key of HEIRLOOM_SLOT_NAMES) {
    const value =
      attrValueOf(heirloom, key) ??
      slotValueOf(heirloom, HEIRLOOM_SLOTS[key]);
    if (value === undefined) continue;
    if (key === 'mastery') {
      out.mastery = normalizeListValue(value);
    } else if (key === 'rarity') {
      out.rarity = rarityFromText(value);
    } else {
      (out as unknown as Record<string, unknown>)[key] = value.trim();
    }
  }
  return out;
}

/**
 * Parses the JSX forms (C, D, E, F) from the Heirloom element.
 *
 * @param {MdNode} heirloom - Heirloom flow element
 * @returns {HeirloomV2Result} Golden shape
 */
function parseJsxForm(heirloom: MdNode): HeirloomV2Result {
  const result = parseJsxHeader(heirloom);

  for (const child of heirloom.children ?? []) {
    const featureNames = ['Feature', 'Trait', 'Curse'];
    if (
      child.type !== 'mdxJsxFlowElement' ||
      !featureNames.includes(child.name ?? '')
    ) {
      continue;
    }

    const heading = (child.children ?? []).find(
      (kid) => kid.type === 'heading',
    );
    if (!heading) continue;

    const parts = headingPartsOf(heading);
    const feature: HeirloomV2Feature = {
      name: parts.name,
      kind: (child.name ?? 'feature').toLowerCase(),
    };
    if (parts.tag) feature.tag = parts.tag;

    for (const name of FEATURE_SLOT_NAMES) {
      const value =
        attrValueOf(child, name) ?? slotValueOf(child, FEATURE_SLOTS[name]);
      const text = value?.trim();
      if (!text || (name === 'targets' && text === '—')) continue;
      feature[name] = text;
    }

    result.features = result.features ?? [];
    result.features.push(feature);
  }

  return result as HeirloomV2Result;
}

/**
 * Slot card extractor: reads the Heirloom element in either spelling,
 * attributes or slot elements.
 *
 * @param {string} rawFile - Complete file text including frontmatter
 * @returns {HeirloomV2Result} Golden shape with slot values as source text
 */
export function parseHeirloomV2(rawFile: string): HeirloomV2Result {
  const { content } = matter(rawFile);
  const tree = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMdx)
    .parse(content) as unknown as MdNode;

  const heirloom = findFlowElement(tree, 'Heirloom');
  return heirloom ? parseJsxForm(heirloom) : { rarity: '', features: [] };
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
