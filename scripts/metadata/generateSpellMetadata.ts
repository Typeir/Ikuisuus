/**
 * @fileoverview Spell Metadata Generator
 * @description Parses D&D spell entries in MDX format. Extracts level, school,
 * casting time, range, components, duration, concentration, and gameplay tags.
 *
 * @module scripts/metadata/generateSpellMetadata
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { createLogger } from '@/lib/logging/logger';
import { promises as fs } from 'fs';
import path from 'path';
import {
  GameData,
  clean,
  filePathToSlug,
  getMetadataBackend,
  parseDescription,
  parseTitle,
  runGenerator,
  runWithCli,
  type SharedData,
  type StorageAdapter,
} from '.';
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

  if (CASTING_TIME.bonusAction.test(lowerText)) {
    castingTimes.push('bonus action');
  }
  if (
    CASTING_TIME.action.test(lowerText) &&
    !castingTimes.includes('bonus action')
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
    const rawCastingTime = clean(
      castingTimeLine.replace(STAT_BLOCK.castingTimeStrip, ''),
    );
    result.castingTimeRaw = rawCastingTime;
    result.castingTime = parseCastingTimeToArray(rawCastingTime);
  }

  const rangeLine = lines.find((l) => STAT_BLOCK.rangeLine.test(l));
  if (rangeLine) {
    result.range = clean(rangeLine.replace(STAT_BLOCK.rangeStrip, ''));
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
  const lowerText = fullText.toLowerCase();

  if (metadata.level !== undefined) {
    tags.push(
      metadata.level === 0 ? 'level:cantrip' : `level:${metadata.level}`,
    );
  }
  if (metadata.school)
    tags.push(`school:${(metadata.school as string).toLowerCase()}`);
  if (metadata.quality)
    tags.push(`quality:${(metadata.quality as string).toLowerCase()}`);
  if (metadata.concentration) tags.push('mechanic:concentration');
  if (metadata.verbal) tags.push('component:verbal');
  if (metadata.somatic) tags.push('component:somatic');
  if (metadata.material) tags.push('component:material');

  const damageTypes = GameData.getDamageTypes(sharedData);
  for (const dt of damageTypes) {
    if (lowerText.includes(dt.toLowerCase()))
      tags.push(`damage:${dt.toLowerCase()}`);
  }

  const conditions = GameData.getConditions(sharedData);
  for (const condition of conditions) {
    if (lowerText.includes(condition.toLowerCase()))
      tags.push(`condition:${condition.toLowerCase()}`);
  }

  const mechanics = GameData.getMechanicTypes(sharedData);
  for (const mechanic of mechanics) {
    if (lowerText.includes(mechanic.toLowerCase()))
      tags.push(`mechanic:${mechanic.toLowerCase()}`);
  }

  if (SPELL_TAGS.ritual.test(fullText)) tags.push('mechanic:ritual');
  if (SPELL_TAGS.aoeShape.test(fullText)) tags.push('mechanic:area-of-effect');

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
 * Parses spell lists section from MDX content.
 *
 * @param {string} content - Full MDX content
 * @returns {Array<{ name: string, link: string }>} Spell list references
 */
function parseSpellLists(content: string): { name: string; link: string }[] {
  const spellLists: { name: string; link: string }[] = [];

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
    spellLists.push({ name, link });
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
  const content = await fs.readFile(filePath, 'utf8');
  const lines = content.split('\n');

  const slug = filePathToSlug(filePath);
  const title = parseTitle(lines);

  const headerData = parseSpellHeader(lines, sharedData);
  const properties = parseSpellProperties(lines);
  const components = parseComponents(lines);
  const spellLists = parseSpellLists(content);
  const description = parseDescription(content);

  const tags = generateSpellTags(
    content,
    { ...headerData, ...properties, ...components },
    sharedData,
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
    ...components,
    tags,
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

  const externalMetadataPath = path.join(
    process.cwd(),
    'scripts',
    'core',
    'spells-external.metadata.json',
  );

  try {
    const stats = await fs.stat(externalMetadataPath);
    if (stats.isFile()) {
      log.message('Found external spell metadata', {
        path: externalMetadataPath,
      });

      const externalContent = await fs.readFile(externalMetadataPath, 'utf8');
      const externalSpells = JSON.parse(externalContent);

      const backend = getMetadataBackend();
      let destinationFolder: string;
      if (backend === 'pg') {
        destinationFolder = path.join(process.cwd(), '.meta', 'en', 'spells');
      } else {
        destinationFolder = path.join(
          process.cwd(),
          'src',
          'content',
          'en',
          'spells',
        );
      }
      await fs.mkdir(destinationFolder, { recursive: true });

      const destinationPath = path.join(
        destinationFolder,
        'spells-external.metadata.json',
      );
      await fs.writeFile(
        destinationPath,
        JSON.stringify(externalSpells, null, 2),
        'utf8',
      );

      log.message('Copied external spell metadata', {
        spellCount: externalSpells.length,
        destination: destinationPath,
      });

      if (options.storage && Array.isArray(externalSpells)) {
        let persisted = 0;
        for (const spell of externalSpells) {
          if (spell?.slug) {
            try {
              await options.storage.upsert('spells', 'en', spell.slug, spell);
              persisted++;
            } catch (storageErr) {
              log.warning(`DB upsert failed for external spell ${spell.slug}`, {
                error: (storageErr as Error).message,
              });
            }
          }
        }
        log.message('Persisted external spells to database', {
          count: persisted,
        });
      }
    }
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
      log.warning('Error checking for external spell metadata', {
        error: (err as Error).message,
      });
    }
  }
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

