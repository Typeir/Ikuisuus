/**
 * @fileoverview Trinket Metadata Generator - Specialized parser for consumable trinkets and gear
 * @description Parses `.mdx` files from the trinkets directory and extracts comprehensive metadata
 * including item type, damage properties, range, weight, saving throws, and gameplay mechanics.
 * Generates JSON index files for efficient content querying.
 *
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires fs/promises
 * @requires path
 * @requires ../core/shared-utils.mjs
 *
 * @example
 * ```bash
 * # Generate trinket metadata
 * node scripts/generateTrinketMetadata.mjs
 * ```
 *
 * @example
 * ```javascript
 * // Programmatic usage
 * import { generateTrinketMetadata } from './generateTrinketMetadata.mjs';
 * const metadata = await generateTrinketMetadata();
 * ```
 */

import { promises as fs } from 'fs';
import path from 'path';
import { createLogger } from '../core/logger.mjs';
import {
    GameData,
    MetadataGeneratorUtils,
    ParsingUtils,
    TaggingUtils,
    TextUtils,
} from '../core/shared-utils.mjs';

const log = createLogger({ module: 'TrinketMetadataGenerator' });

/**
 * Parses trinket-specific metadata from the content
 *
 * @function parseTrinketProperties
 * @param {string} content - Full MDX file content
 * @param {object} sharedData - Loaded shared data containing game constants
 * @returns {{
 *   itemType?: string,
 *   damage?: string,
 *   damageType?: string,
 *   properties?: string[],
 *   range?: string,
 *   weight?: string,
 *   savingThrowDC?: number,
 *   savingThrowAbility?: string,
 *   specialEffects?: string[]
 * }} Parsed trinket properties
 *
 * @description Trinkets have a specific format with property lines at the bottom:
 * - **Damage**: 1d6
 * - **Damage Type**: Piercing
 * - **Properties**: Thrown, Special (restrain)
 * - **Range**: 30/60
 * - **Weight**: 1 lb.
 */
function parseTrinketProperties(content, sharedData) {
  const lines = content.split('\n');
  const result = {};

  // Look for property lines (bold key-value pairs)
  for (const line of lines) {
    const trimmed = line.trim();

    // **Damage**: 1d6
    if (trimmed.startsWith('**Damage**:')) {
      const damageMatch = trimmed.match(/\*\*Damage\*\*:\s*(.+)/);
      if (damageMatch) {
        const damageText = TextUtils.clean(damageMatch[1]);
        if (damageText !== '—' && damageText !== '-') {
          result.damage = damageText;
        }
      }
    }

    // **Damage Type**: Piercing
    if (trimmed.startsWith('**Damage Type**:')) {
      const typeMatch = trimmed.match(/\*\*Damage Type\*\*:\s*(.+)/);
      if (typeMatch) {
        result.damageType = TextUtils.clean(typeMatch[1]).toLowerCase();
      }
    }

    // **Properties**: Thrown, Special (restrain, trip)
    if (trimmed.startsWith('**Properties**:')) {
      const propsMatch = trimmed.match(/\*\*Properties\*\*:\s*(.+)/);
      if (propsMatch) {
        const propsText = TextUtils.clean(propsMatch[1]);

        // First, handle the "Special (effects)" pattern and extract just the word "Special"
        const cleanedText = propsText.replace(
          /special\s*\([^)]+\)/gi,
          'special',
        );

        // Now split and clean the properties
        result.properties = cleanedText
          .split(',')
          .map((p) => TextUtils.clean(p).toLowerCase())
          .filter(Boolean);
      }
    }

    // **Range**: 30/60 or 20
    if (trimmed.startsWith('**Range**:')) {
      const rangeMatch = trimmed.match(/\*\*Range\*\*:\s*(.+)/);
      if (rangeMatch) {
        result.range = TextUtils.clean(rangeMatch[1]);
      }
    }

    // **Weight**: 1 lb.
    if (trimmed.startsWith('**Weight**:')) {
      const weightMatch = trimmed.match(/\*\*Weight\*\*:\s*(.+)/);
      if (weightMatch) {
        result.weight = TextUtils.clean(weightMatch[1]);
      }
    }
  }

  // Extract saving throw information from description text
  const savingThrowMatch = content.match(/DC\s+(\d+)\s+(\w+)\s+saving throw/i);
  if (savingThrowMatch) {
    result.savingThrowDC = parseInt(savingThrowMatch[1], 10);
    result.savingThrowAbility = savingThrowMatch[2].toLowerCase();
  }

  // Extract special effects from properties (text in parentheses after "Special")
  const specialEffectsMatch = content.match(/Special\s*\(([^)]+)\)/i);
  if (specialEffectsMatch) {
    result.specialEffects = specialEffectsMatch[1]
      .split(',')
      .map((effect) => TextUtils.clean(effect).toLowerCase())
      .filter(Boolean);
  }

  // Extract conditions that the trinket inflicts
  // Get conditions from shared data
  const conditionKeywords = GameData.getConditions(sharedData);

  const inflictedConditions = [];
  const lowerContent = content.toLowerCase();

  for (const condition of conditionKeywords) {
    // Look for patterns like "become frightened", "is restrained", "falls prone", "be stunned"
    const patterns = [
      new RegExp(
        `\\b(become|becomes|is|are|fall|falls|be)\\s+${condition}\\b`,
        'i',
      ),
      new RegExp(`\\b${condition}\\s+(until|for)\\b`, 'i'),
    ];

    if (patterns.some((pattern) => pattern.test(lowerContent))) {
      // Ensure condition name is singular and properly formatted
      inflictedConditions.push(condition.toLowerCase().trim());
    }
  }

  if (inflictedConditions.length > 0) {
    // Store as array of comma-separated values to avoid conflicts
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
 * Parses the item type from the second line (after title)
 *
 * @function parseItemType
 * @param {string} content - Full MDX file content
 * @returns {string|undefined} Item type (e.g., "Adventuring Gear")
 */
function parseItemType(content) {
  const lines = content.split('\n').map((l) => l.trim());
  // Item type is typically on the second line, not in italics
  if (lines.length > 1) {
    const secondLine = TextUtils.clean(lines[1]);
    // Make sure it's not an italic line and not empty
    if (secondLine && !secondLine.startsWith('_')) {
      return secondLine;
    }
  }
  return undefined;
}

/**
 * Parses a single trinket MDX file and extracts metadata
 *
 * @async
 * @function parseTrinketFile
 * @param {string} filePath - Absolute path to the trinket .mdx file
 * @param {object} sharedData - Loaded shared data containing game constants
 * @returns {Promise<object|null>} Parsed metadata object or null on error
 *
 * @description Extracts:
 * - Title, slug, file path
 * - Item type (Adventuring Gear, etc.)
 * - Damage properties (dice, type)
 * - Range and weight
 * - Saving throw DCs and abilities
 * - Special effects and conditions
 * - Tags for filtering and search
 */
async function parseTrinketFile(filePath, sharedData) {
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    const lines = raw.split('\n').map((l) => l.trim());

    // Extract basic info
    const slug = TextUtils.filePathToSlug(filePath);
    const title = ParsingUtils.parseTitle(lines);
    const itemType = parseItemType(raw);

    // Parse trinket-specific properties
    const properties = parseTrinketProperties(raw, sharedData);

    // Build metadata object
    const metadata = {
      slug,
      title,
      file: path.relative(process.cwd(), filePath).replace(/\\/g, '/'),
      link: `/library/items/trinkets/${slug}`,
      itemType: itemType || 'adventuring gear',
      ...properties,
      tags: TaggingUtils.extractAllTags(raw, filePath, sharedData, {
        contentType: 'trinket',
      }),
    };

    return metadata;
  } catch (error) {
    log.warning('Error parsing trinket file', {
      file: filePath,
      error: error.message,
    });
    return null;
  }
}

/**
 * Main entry point for trinket metadata generation
 * 
 * @async
 * @function main
 * @returns {Promise<void>}
/**
 * Main entry point for metadata generation
 * 
 * @async
 * @function main
 * @param {Object} [options] - Optional configuration for testing
 * @param {string} [options.contentDir] - Override content directory (for testing with fixtures)
 * @param {RegExp} [options.filePattern] - Override file pattern (for testing with custom files)
 * @returns {Promise<void>}
 * @throws {Error} If critical failures occur during processing
 * 
 * @description Orchestrates the complete trinket metadata generation pipeline.
 * 
 * @example
 * // Normal usage
 * await main();
 * 
 * // Testing with fixtures
 * await main({ contentDir: 'tests/fixtures/trinkets', filePattern: /\.mdx$/i });
 */
async function main(options = {}) {
  await MetadataGeneratorUtils.runGenerator({
    name: 'Trinket Metadata Generator',
    contentType: 'trinkets',
    filePattern: options.filePattern || /\.mdx$/,
    parseFile: parseTrinketFile,
    processResult: (result) => ({ metadata: result, count: 1 }),
    contentDir: options.contentDir,
    storage: options.storage,
  });
}

// Export main for orchestrator, run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  MetadataGeneratorUtils.runWithCli(main).catch((error) => {
    log.error('Fatal error during trinket metadata generation', {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  });
}

export { main, parseTrinketFile };
