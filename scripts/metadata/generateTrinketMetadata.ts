/**
 * @fileoverview Trinket Metadata Generator
 * @description Parses .mdx files from the trinkets directory and extracts metadata
 * including item type, damage, range, weight, saving throws, and gameplay tags.
 *
 * @module scripts/metadata/generateTrinketMetadata
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { toNativeMeasure } from '@/lib/units/nativeMeasure';
import { createLogger } from '@/lib/logging/logger';
import { promises as fs } from 'fs';
import path from 'path';
import {
    GameData,
    clean,
    extractAllTags,
    filePathToSlug,
    findContentImage,
    parseTitle,
    plain,
    runGenerator,
    runWithCli,
    type SharedData,
    type StorageAdapter,
} from '.';
import { MECHANICS, PROPERTY } from './trinketPatterns';

const log = createLogger({ component: 'TrinketMetadataGenerator' });

/**
 * Extracts the prose description from a trinket MDX file.
 *
 * Trinket files have no `---` divider. The description is the block of text
 * after the H1 title and optional item-type line, ending at the first bold
 * property line (`**Damage**:`, `**Properties**:`, etc.).
 *
 * @param {string} content - Full MDX file content
 * @returns {string | undefined} Joined prose lines or undefined
 */
function parseTrinketDescription(content: string): string | undefined {
  const lines = content.split('\n');
  const descLines: string[] = [];
  let foundContent = false;

  for (let i = 2; i < lines.length; i++) {
    const l = lines[i].trim();

    if (/^\*\*\w/.test(l) && l.includes(':')) break;

    if (!l) {
      if (foundContent) break;
      continue;
    }

    if (l.startsWith('#') || l.startsWith('<') || l.startsWith('>')) continue;

    foundContent = true;
    descLines.push(l);
  }

  return descLines.length > 0 ? descLines.join('\n') : undefined;
}

/**
 * Parses trinket-specific metadata from content.
 *
 * @param {string} content - Full MDX file content
 * @param {SharedData} sharedData - Shared game data
 * @returns {Record<string, unknown>} Parsed trinket properties
 */
function parseTrinketProperties(
  content: string,
  sharedData: SharedData,
): Record<string, unknown> {
  const lines = content.split('\n');
  const result: Record<string, unknown> = {};

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('**Damage**:')) {
      const damageMatch = trimmed.match(PROPERTY.damage);
      if (damageMatch) {
        const damageText = clean(damageMatch[1]);
        if (damageText !== '—' && damageText !== '-') {
          result.damage = damageText;
        }
      }
    }

    if (trimmed.startsWith('**Damage Type**:')) {
      const typeMatch = trimmed.match(PROPERTY.damageType);
      if (typeMatch) {
        result.damageType = clean(typeMatch[1]).toLowerCase();
      }
    }

    if (trimmed.startsWith('**Properties**:')) {
      const propsMatch = trimmed.match(PROPERTY.properties);
      if (propsMatch) {
        const propsText = clean(propsMatch[1]);
        const cleanedText = propsText.replace(
          PROPERTY.specialNotation,
          'special',
        );
        result.properties = cleanedText
          .split(',')
          .map((p) => plain(p).toLowerCase())
          .filter(Boolean);
      }
    }

    if (trimmed.startsWith('**Range**:')) {
      const rangeMatch = trimmed.match(PROPERTY.range);
      if (rangeMatch) {
        result.range = toNativeMeasure(clean(rangeMatch[1]));
      }
    }

    if (trimmed.startsWith('**Weight**:')) {
      const weightMatch = trimmed.match(PROPERTY.weight);
      if (weightMatch) {
        result.weight = toNativeMeasure(clean(weightMatch[1]));
      }
    }
  }

  const savingThrowMatch = content.match(MECHANICS.dcSavingThrow);
  if (savingThrowMatch) {
    result.savingThrow = {
      dc: parseInt(savingThrowMatch[1], 10),
      ability: savingThrowMatch[2].toLowerCase(),
    };
  }

  const specialEffectsMatch = content.match(MECHANICS.specialEffects);
  if (specialEffectsMatch) {
    result.specialEffects = specialEffectsMatch[1]
      .split(',')
      .map((effect) => clean(effect).toLowerCase())
      .filter(Boolean);
  }

  const conditionKeywords = GameData.getConditions(sharedData);
  const inflictedConditions: string[] = [];
  const lowerContent = content.toLowerCase();

  for (const condition of conditionKeywords) {
    const patterns = [
      new RegExp(
        `\\b(become|becomes|is|are|fall|falls|be)\\s+${condition}\\b`,
        'i',
      ),
      new RegExp(`\\b${condition}\\s+(until|for)\\b`, 'i'),
    ];
    if (patterns.some((pattern) => pattern.test(lowerContent))) {
      inflictedConditions.push(condition.toLowerCase().trim());
    }
  }

  if (inflictedConditions.length > 0) {
    result.inflictsConditions = inflictedConditions.map((c) =>
      c
        .split(',')
        .map((part) => part.trim())
        .join(', '),
    );
  }

  return result;
}

/**
 * Parses the item type from the second line (after title).
 *
 * @param {string} content - Full MDX content
 * @returns {string | undefined} Item type
 */
function parseItemType(content: string): string | undefined {
  const lines = content.split('\n').map((l) => l.trim());
  if (lines.length > 1) {
    const secondLine = clean(lines[1]);
    if (secondLine && !secondLine.startsWith('_')) {
      return secondLine;
    }
  }
  return undefined;
}

/**
 * Parses a single trinket MDX file.
 *
 * @param {string} filePath - Path to .mdx file
 * @param {SharedData} sharedData - Shared game data
 * @returns {Promise<object | null>} Parsed metadata or null on error
 */
async function parseTrinketFile(
  filePath: string,
  sharedData: SharedData,
): Promise<object | null> {
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    const lines = raw.split('\n').map((l) => l.trim());

    const slug = filePathToSlug(filePath);
    const title = parseTitle(lines);
    const itemType = parseItemType(raw);
    const description = parseTrinketDescription(raw);
    const properties = parseTrinketProperties(raw, sharedData);

    const metadata: Record<string, unknown> = {
      slug,
      title,
      file: path.relative(process.cwd(), filePath).replace(/\\/g, '/'),
      link: `/library/items/trinkets/${slug}`,
      itemType: itemType || 'adventuring gear',
      ...properties,
      tags: extractAllTags(raw, filePath, sharedData, {
        contentType: 'generic',
      }),
    };

    if (description) {
      metadata.description = description;
    }

    const image = findContentImage(lines);
    if (image) {
      metadata.image = image;
    }

    return metadata;
  } catch (error) {
    log.warning('Error parsing trinket file', {
      file: filePath,
      error: (error as Error).message,
    });
    return null;
  }
}

/**
 * Main entry point for trinket metadata generation.
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
    name: 'Trinket Metadata Generator',
    contentType: 'trinkets',
    filePattern: options.filePattern || /\.trinket\.mdx$/,
    parseFile: parseTrinketFile,
    processResult: (result) => ({ metadata: result, count: 1 }),
    contentDir: options.contentDir,
    storage: options.storage,
    metadataVersion: '2.0.0',
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runWithCli(main).catch((error) => {
    log.error('Fatal error during trinket metadata generation', {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    process.exit(1);
  });
}

export { main, parseTrinketFile };

