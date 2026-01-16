#!/usr/bin/env node

/**
 * @fileoverview Generic Metadata Generator - Unified orchestrator for content metadata generation
 * @description Coordinates metadata generation across all content types (monsters, heirlooms, spells, etc.)
 * with unified tagging system and cross-references. Provides centralized entry point for all 
 * metadata operations.
 * 
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 * 
 * @example
 * ```bash
 * # Generate all metadata
 * node scripts/generateMetadata.mjs
 * 
 * # Generate specific content type
 * node scripts/generateMetadata.mjs --type monsters
 * ```
 */

import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { createLogger } from '../core/logger.mjs';

const log = createLogger({ module: 'MetadataOrchestrator' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Content type configuration
const CONTENT_TYPES = {
  monsters: {
    dir: 'src/content/en/monsters',
    pattern: /\.sheet\.mdx$/,
    generator: 'generateMonsterMetadata.mjs',
    contentType: 'monster',
    subType: 'sheet'
  },
  heirlooms: {
    dir: 'src/content/en/items/heirlooms', 
    pattern: /\.mdx$/,
    generator: 'generateHeirloomMetadata.mjs',
    contentType: 'item',
    subType: 'heirloom'
  },
  spells: {
    dir: 'src/content/en/spells',
    pattern: /\.mdx$/,
    generator: 'generateSpellMetadata.mjs',
    contentType: 'spell',
    subType: 'standard'
  },
  trinkets: {
    dir: 'src/content/en/items/trinkets',
    pattern: /\.mdx$/,
    generator: 'generateTrinketMetadata.mjs',
    contentType: 'trinket',
    subType: 'consumable'
  },
  classes: {
    dir: 'src/content/en/character-creation/vocations',
    pattern: /\.mdx$/,
    generator: null, // TODO: implement  
    contentType: 'character-creation',
    subType: 'class'
  },
  world: {
    dir: 'src/content/en/world',
    pattern: /\.mdx$/,
    generator: null, // TODO: implement
    contentType: 'world',
    subType: 'lore'
  }
};

/**
 * Main metadata generation orchestrator that coordinates all content processing
 * 
 * @class MetadataOrchestrator
 * @description Central coordinator for metadata generation across all content types.
 * Manages the execution of specialized generators and handles performance monitoring.
 * Tag extraction is now handled by specialized generators using unified TaggingUtils.
 * 
 * @example
 * ```javascript
 * const orchestrator = new MetadataOrchestrator();
 * await orchestrator.generateAll();
 * // Processes all content types and generates metadata files
 * 
 * // Or generate specific types
 * await orchestrator.generate(['monsters', 'spells']);
 * ```
 */
class MetadataOrchestrator {
  /**
   * Creates a new MetadataOrchestrator instance
   * 
   * @constructor
   */
  constructor() {
    // No initialization needed - generators handle their own tagging
  }

  /**
   * Parse command-line arguments to determine which generators to run
   * 
   * @static
   * @method parseArgs
   * @returns {string[]|null} Array of content types to generate, or null for all
   * @description Supports flags like --monsters, --heirlooms, --spells, --trinkets
   */
  static parseArgs() {
    const args = process.argv.slice(2);
    const types = [];
    
    for (const arg of args) {
      
      if (arg === '--monsters' || arg === '--monster') types.push('monsters');
      if (arg === '--heirlooms' || arg === '--heirloom') types.push('heirlooms');
      if (arg === '--spells' || arg === '--spell') types.push('spells');
      if (arg === '--trinkets' || arg === '--trinket') types.push('trinkets');
    }
    
    return types.length > 0 ? types : null;
  }

  /**
   * Run specific metadata generator for a content type
   * 
   * @async
   * @method runSpecificGenerator
   * @param {string} contentType - The content type key (e.g., 'monsters', 'heirlooms')
   * @param {Object} [options] - Optional configuration for testing
   * @param {string} [options.contentDir] - Override content directory (for testing with fixtures)
   * @returns {Promise<void>}
   * @throws {Error} If the generator fails to execute
   * @description Executes the specialized metadata generator for the given content type.
   * Handles dynamic import and error reporting for generator execution.
   * Now supports passing contentDir override for testing with fixtures.
   */
  async runSpecificGenerator(contentType, options = {}) {
    const config = CONTENT_TYPES[contentType];
    if (!config.generator) {
      log.debug('No specific generator configured, skipping', { contentType });
      return;
    }

    log.message('Running specialized generator', { generator: config.generator });
    
    try {
      // Import and run the specific generator
      const generatorPath = path.resolve(__dirname, config.generator);
      const generatorUrl = pathToFileURL(generatorPath).href;
      const genModule = await import(generatorUrl);
      
      // Build generator options from config and override options
      const generatorOptions = {
        contentDir: options.contentDir || path.resolve(__dirname, '..', '..', config.dir),
        filePattern: config.pattern,
        ...options  // Allow additional override options
      };
      
      // Call the main function with options
      await genModule.main(generatorOptions);
      log.message('Completed generator', { generator: config.generator });
    } catch (error) {
      log.error('Failed to run generator', { generator: config.generator, error: error.message });
    }
  }

  /**
   * Generate metadata for specific content types or all types
   * 
   * @async
   * @method generate
   * @param {string[]|null} contentTypes - Array of content type keys, or null for all
   * @param {Object} [options] - Optional configuration for testing
   * @param {string} [options.contentDir] - Override content directory (for testing with fixtures)
   * @returns {Promise<void>}
   * @description Runs specialized generators for the specified content types.
   * If contentTypes is null or empty, generates metadata for all types.
   * Now supports passing options for testing with fixtures.
   */
  async generate(contentTypes = null, options = {}) {
    const typesToGenerate = contentTypes || Object.keys(CONTENT_TYPES);
    
    log.message('Starting metadata generation', { contentTypes: typesToGenerate });
    
    // Run specialized generators - they handle their own tagging using TaggingUtils
    for (const contentType of typesToGenerate) {
      const config = CONTENT_TYPES[contentType];
      if (config && config.generator) {
        await this.runSpecificGenerator(contentType, options);
      }
    }
    
    log.message('Metadata generation complete');
  }

  /**
   * Generate metadata for all content types using specialized generators
   * @deprecated Use generate() instead
   */
  async generateAll() {
    return this.generate(null);
  }
}

// Run if called directly
if (import.meta.url === pathToFileURL(__filename).href) {
  const orchestrator = new MetadataOrchestrator();
  const contentTypes = MetadataOrchestrator.parseArgs();
  
  orchestrator.generate(contentTypes).catch(error => {
    log.error('Fatal error during metadata orchestration', { error: error.message, stack: error.stack });
    process.exitCode = 1;
  });
}

export { MetadataOrchestrator };