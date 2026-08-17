/**
 * @fileoverview Spell Metadata Generator
 * @description Parses Damocles spell entries in MDX format. Extracts level, school,
 * casting time, range, components, duration, concentration, and gameplay tags.
 *
 * @module scripts/metadata/generateSpellMetadata
 * @version 2.0.0
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
  clean,
  filePathToSlug,
  parseDescription,
  parseTitle,
  plain,
  runGenerator,
  runWithCli,
  type SharedData,
  type StorageAdapter,
} from '.';
import { extractDerivedAspects, extractStrataTags } from './aspectExtractors';
import { MONSTER_MECHANICS } from './taggingPatterns';
import {
  applyAuthoredAspects,
  extractDamageTags,
  extractOrganizationalTags,
  stripCitations,
} from './taggingUtils';
import {
  CASTING_TIME,
  COMPONENTS,
  DURATION,
  SPELL_LISTS,
  SPELL_TAGS,
  STAT_BLOCK,
} from './spellPatterns';

const log = createLogger({ component: 'SpellMetadataGenerator' });

/**
 * Parses spell level and school from italic metadata line.
 *
 * @param {string[]} lines - Document lines
 * @param {SharedData} sharedData - Shared game data
 * @returns {{ level?: number, school?: string, quality?: string }}
 */
function parseSpellHeader(lines: string[], sharedData: SharedData) {
  const schools = sharedData?.spellData?.schools || [
    'Abjuration',
    'Conjuration',
    'Divination',
    'Enchantment',
    'Evocation',
    'Illusion',
    'Necromancy',
    'Transmutation',
  ];
  const qualities = sharedData?.spellData?.qualities || [
    'Legendary',
    'Epic',
    'Mythic',
    'Ancient',
  ];

  const italicLine = lines.find((l) => {
    if (!STAT_BLOCK.italicHeader.test(l)) return false;
    if (l.includes('**') || l.includes('__')) return false;
    return true;
  });

  if (!italicLine) return {};

  const match = italicLine.match(STAT_BLOCK.italicHeader);
  if (!match) return {};

  const content = clean(match[1]);
  const lowerContent = content.toLowerCase();

  if (lowerContent.includes('cantrip')) {
    const result: { level: number; school?: string } = { level: 0 };
    for (const sch of schools) {
      if (lowerContent.includes(sch.toLowerCase())) {
        result.school = sch;
        break;
      }
    }
    return result;
  }

  const levelMatch = content.match(STAT_BLOCK.levelPrefix);
  if (!levelMatch) return {};

  const level = parseInt(levelMatch[1], 10);
  const remainder = content.slice(levelMatch[0].length).trim();

  let quality: string | undefined;
  let schoolText = remainder;

  for (const qual of qualities) {
    if (remainder.toLowerCase().startsWith(qual.toLowerCase())) {
      quality = qual;
      schoolText = remainder.slice(qual.length).trim();
      break;
    }
  }

  let school: string | undefined;
  const normalizedSchoolText = schoolText.toLowerCase();
  for (const sch of schools) {
    if (normalizedSchoolText.includes(sch.toLowerCase())) {
      school = sch;
      break;
    }
  }

  return { level, school, quality };
}

/**
 * Parses spell components from stat block.
 *
 * @param {string[]} lines - Document lines
 * @returns {{ verbal?: boolean, somatic?: boolean, material?: boolean, materialDescription?: string }}
 */
function parseComponents(lines: string[]) {
  const componentLine = lines.find((l) => STAT_BLOCK.componentsLine.test(l));
  if (!componentLine) return {};

  const content = componentLine.replace(STAT_BLOCK.componentsStrip, '').trim();

  const result: {
    verbal: boolean;
    somatic: boolean;
    material: boolean;
    materialDescription?: string;
  } = {
    verbal: COMPONENTS.verbal.test(content),
    somatic: COMPONENTS.somatic.test(content),
    material: COMPONENTS.material.test(content),
  };

  const materialMatch = content.match(COMPONENTS.materialDesc);
  if (materialMatch) {
    result.materialDescription = clean(materialMatch[1]);
  }

  return result;
}

/**
 * Parses casting time string into structured array of action types.
 *
 * @param {string} rawCastingTime - Raw casting time text
 * @returns {string[]} Array of casting time components
 */
function parseCastingTimeToArray(rawCastingTime: string): string[] {
  if (!rawCastingTime) return [];

  const castingTimes: string[] = [];
  const lowerText = rawCastingTime.toLowerCase();

  if (CASTING_TIME.minorAction.test(lowerText)) {
    castingTimes.push('Minor Action');
  }
  if (
    CASTING_TIME.action.test(lowerText) &&
    !castingTimes.includes('Minor Action')
  ) {
    castingTimes.push('action');
  }
  if (CASTING_TIME.reaction.test(lowerText)) {
    castingTimes.push('reaction');
  }

  const timeMatch = rawCastingTime.match(CASTING_TIME.timeDuration);
  if (timeMatch) {
    castingTimes.push(timeMatch[1].toLowerCase());
  }

  if (CASTING_TIME.ritual.test(lowerText)) {
    castingTimes.push('ritual');
  }

  if (castingTimes.length === 0) {
    castingTimes.push(rawCastingTime);
  }

  return castingTimes;
}

/**
 * Parses casting time, range, and duration from stat block.
 *
 * @param {string[]} lines - Document lines
 * @returns {{ castingTime?: string[], castingTimeRaw?: string, range?: string, duration?: string, concentration?: boolean }}
 */
function parseSpellProperties(lines: string[]) {
  const result: {
    castingTime?: string[];
    castingTimeRaw?: string;
    range?: string;
    duration?: string;
    concentration?: boolean;
  } = {};

  const castingTimeLine = lines.find((l) => STAT_BLOCK.castingTimeLine.test(l));
  if (castingTimeLine) {
    const rawCastingTime = plain(
      castingTimeLine.replace(STAT_BLOCK.castingTimeStrip, ''),
    );
    result.castingTimeRaw = rawCastingTime;
    result.castingTime = parseCastingTimeToArray(rawCastingTime);
  }

  const rangeLine = lines.find((l) => STAT_BLOCK.rangeLine.test(l));
  if (rangeLine) {
    result.range = toNativeMeasure(
      clean(rangeLine.replace(STAT_BLOCK.rangeStrip, '')),
    );
  }

  const durationLine = lines.find((l) => STAT_BLOCK.durationLine.test(l));
  if (durationLine) {
    const durationText = clean(
      durationLine.replace(STAT_BLOCK.durationStrip, ''),
    );
    result.concentration = DURATION.concentration.test(durationText);
    result.duration = durationText
      .replace(DURATION.concentrationPrefix, '')
      .trim();
  }

  return result;
}

/**
 * Generates gameplay tags from spell content.
 *
 * @param {string} fullText - Complete spell text
 * @param {object} metadata - Parsed spell metadata
 * @param {SharedData} sharedData - Shared game data
 * @returns {string[]} Deduplicated tag array
 */
function generateSpellTags(
  fullText: string,
  metadata: Record<string, unknown>,
  sharedData: SharedData,
): string[] {
  const tags: string[] = [];
  const prose = stripCitations(fullText).replace(/[*_]+/g, ' ');
  const lowerText = prose.toLowerCase();

  if (metadata.level !== undefined) {
    tags.push(
      metadata.level === 0 ? 'level:cantrip' : `level:${metadata.level}`,
    );
  }
  /* `school:` is authored in frontmatter during the school → form
     migration, never derived from the subtitle. */
  if (metadata.quality)
    tags.push(`rarity:${(metadata.quality as string).toLowerCase()}`);
  if (metadata.concentration) tags.push('tempo:sustained');
  if (
    metadata.duration &&
    !/instant/i.test(String(metadata.duration)) &&
    !metadata.concentration
  ) {
    tags.push('tempo:persistent');
  }
  if (metadata.verbal) tags.push('component:verbal');
  if (metadata.somatic) tags.push('component:somatic');
  if (metadata.material) tags.push('component:material');

  tags.push(...extractDamageTags(prose, sharedData));

  const conditions = GameData.getConditions(sharedData);
  for (const condition of conditions) {
    if (new RegExp(`\\b${condition}\\b`, 'i').test(lowerText))
      tags.push(`condition:${condition.toLowerCase()}`);
  }

  const mechanics = GameData.getMechanicTypes(sharedData);
  for (const mechanic of mechanics) {
    if (new RegExp(`\\b${mechanic}\\b`, 'i').test(lowerText))
      tags.push(`mechanic:${mechanic.toLowerCase()}`);
  }

  if (MONSTER_MECHANICS.shapeshifting.test(prose)) {
    tags.push('mechanic:shapeshifting');
  }

  if (SPELL_TAGS.ritual.test(prose)) tags.push('tempo:ritual');
  if (SPELL_TAGS.aoeShape.test(prose)) tags.push('delivery:area');

  tags.push(...extractDerivedAspects(prose, sharedData));
  tags.push(...extractStrataTags(tags, sharedData));

  const abilities = GameData.getAbilities(sharedData);
  for (const ability of abilities) {
    if (
      new RegExp(`\\b${ability.long}\\s+saving\\s+throw\\b`, 'i').test(fullText)
    ) {
      tags.push(`save:${ability.short.toLowerCase()}`);
    }
  }

  return Array.from(new Set(tags));
}

/**
 * Parses spell lists section from MDX content. A link that targets a
 * `.specialization` page marks the list as specialization-owned; the owning
 * slug is derived from the link's basename.
 *
 * @param {string} content - Full MDX content
 * @returns {Array<{ name: string, link: string, specialization?: string }>} Spell list references
 */
function parseSpellLists(
  content: string,
): { name: string; link: string; specialization?: string }[] {
  const spellLists: { name: string; link: string; specialization?: string }[] =
    [];

  const spellListsMatch = content.match(SPELL_LISTS.section);
  if (!spellListsMatch) return spellLists;

  const spellListsSection = spellListsMatch[1];
  const linkPattern = new RegExp(
    SPELL_LISTS.link.source,
    SPELL_LISTS.link.flags,
  );
  let match;

  while ((match = linkPattern.exec(spellListsSection)) !== null) {
    const rawName = clean(match[1]);
    const link = clean(match[2]);
    const name = rawName.replace(SPELL_LISTS.nameSuffix, '').trim();
    const specMatch = /\/([^/]+)\.specialization$/.exec(link);
    spellLists.push({
      name,
      link,
      ...(specMatch ? { specialization: specMatch[1] } : {}),
    });
  }

  return spellLists;
}

/**
 * Parses a single spell MDX file and extracts metadata.
 *
 * @param {string} filePath - Path to spell .mdx file
 * @param {SharedData} sharedData - Shared game data
 * @returns {Promise<object>} Parsed spell metadata
 */
async function parseSpellFile(
  filePath: string,
  sharedData: SharedData,
): Promise<object> {
  return parseSpellSource(
    await fs.readFile(filePath, 'utf8'),
    filePath,
    sharedData,
  );
}

/**
 * Parses spell metadata from raw MDX source, no file read.
 *
 * @param {string} raw - Complete file text including frontmatter
 * @param {string} filePath - Path the source belongs to, for slug and org tags
 * @param {SharedData} sharedData - Shared game data
 * @returns {object} Parsed spell metadata
 */
export function parseSpellSource(
  raw: string,
  filePath: string,
  sharedData: SharedData,
): object {
  const { data: frontmatter, content } = matter(raw);
  const lines = content.split('\n');
  const source =
    typeof frontmatter.source === 'string' ? frontmatter.source : undefined;

  const slug = filePathToSlug(filePath);
  const title = parseTitle(lines);

  const headerData = parseSpellHeader(lines, sharedData);
  const properties = parseSpellProperties(lines);
  const components = parseComponents(lines);
  const spellLists = parseSpellLists(content);
  const description = parseDescription(content);

  const tags = applyAuthoredAspects(
    Array.from(
      new Set([
        ...generateSpellTags(
          content,
          { ...headerData, ...properties, ...components },
          sharedData,
        ),
        ...extractOrganizationalTags(filePath, process.cwd(), source),
      ]),
    ).sort(),
    frontmatter,
  );

  const relativePath = path
    .relative(process.cwd(), filePath)
    .replace(/\\/g, '/');

  const metadata: Record<string, unknown> = {
    slug,
    title,
    file: relativePath,
    link: `/library/spells/${slug}`,
    ...headerData,
    ...properties,
    components: Object.keys(components).length ? components : undefined,
    tags,
    ...(source && { source }),
  };

  if (spellLists.length > 0) {
    metadata.spellLists = spellLists;
  }

  if (description) {
    metadata.description = description;
  }

  return metadata;
}

/**
 * Main generator function.
 *
 * @param {object} [options] - Configuration
 * @param {string} [options.contentDir] - Override content directory
 * @param {RegExp} [options.filePattern] - Override file pattern
 * @param {StorageAdapter} [options.storage] - Optional DB storage
 * @returns {Promise<void>}
 */
async function generateSpellMetadata(
  options: {
    contentDir?: string;
    filePattern?: RegExp;
    storage?: StorageAdapter;
  } = {},
): Promise<void> {
  await runGenerator({
    name: 'Spell Metadata Generator',
    contentType: 'spells',
    filePattern: options.filePattern || /\.mdx$/i,
    parseFile: parseSpellFile,
    contentDir: options.contentDir,
    storage: options.storage,
    metadataVersion: '2.0.0',
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runWithCli(generateSpellMetadata).catch((error) => {
    log.error('Fatal error during spell metadata generation', {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    process.exit(1);
  });
}

export { generateSpellMetadata, generateSpellMetadata as main, parseSpellFile };
