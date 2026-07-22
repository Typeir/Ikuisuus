/**
 * @fileoverview Metadata Generation Orchestrator
 * @description Coordinates metadata generation across all content types.
 * Provides unified CLI entry point with --persist and --type flags.
 *
 * @module scripts/metadata/generateMetadata
 * @version 3.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { createLogger } from '@/lib/logging/logger';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import type { StorageAdapter } from '.';

const log = createLogger({ component: 'MetadataOrchestrator' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Configuration for a content type generator.
 *
 * @property {string} dir - Relative content directory
 * @property {RegExp} pattern - File matching pattern
 * @property {string | null} generator - Generator filename (.ts)
 * @property {string} contentType - Content type classification
 * @property {string} subType - Content sub-type
 */
interface ContentTypeConfig {
  dir: string;
  pattern: RegExp;
  generator: string | null;
  contentType: string;
  subType: string;
}

const CONTENT_TYPES: Record<string, ContentTypeConfig> = {
  monsters: {
    dir: 'src/content/en/monsters',
    pattern: /\.sheet\.mdx$/,
    generator: 'generateMonsterMetadata.ts',
    contentType: 'monster',
    subType: 'sheet',
  },
  heirlooms: {
    dir: 'src/content/en/items/heirlooms',
    pattern: /\.heirloom\.mdx$/,
    generator: 'generateHeirloomMetadata.ts',
    contentType: 'item',
    subType: 'heirloom',
  },
  spells: {
    dir: 'src/content/en/spells',
    pattern: /\.mdx$/,
    generator: 'generateSpellMetadata.ts',
    contentType: 'spell',
    subType: 'standard',
  },
  trinkets: {
    dir: 'src/content/en/items/trinkets',
    pattern: /\.trinket\.mdx$/,
    generator: 'generateTrinketMetadata.ts',
    contentType: 'trinket',
    subType: 'consumable',
  },
  bloodlines: {
    dir: 'src/content/en/character-creation/bloodlines',
    pattern: /\.bloodline\.mdx$/,
    generator: 'generateBloodlineMetadata.ts',
    contentType: 'character-creation',
    subType: 'bloodline',
  },
  vocations: {
    dir: 'src/content/en/character-creation/vocations',
    pattern: /main\.mdx$/,
    generator: 'generateVocationMetadata.ts',
    contentType: 'character-creation',
    subType: 'vocation',
  },
  specializations: {
    dir: 'src/content/en/character-creation/vocations',
    pattern: /\.specialization\.mdx$/,
    generator: 'generateSpecializationMetadata.ts',
    contentType: 'character-creation',
    subType: 'specialization',
  },
  feats: {
    dir: 'src/content/en/character-creation/feats',
    pattern: /\.mdx$/,
    generator: 'generateFeatMetadata.ts',
    contentType: 'character-creation',
    subType: 'feat',
  },
  world: {
    dir: 'src/content/en/world',
    pattern: /\.mdx$/,
    generator: 'generateWorldMetadata.ts',
    contentType: 'world',
    subType: 'lore',
  },
  rules: {
    dir: 'src/content/en/rules',
    pattern: /\.mdx$/,
    generator: 'generateRulesMetadata.ts',
    contentType: 'rules',
    subType: 'rule',
  },
};

/**
 * Generator options passed to individual generators.
 *
 * @property {string} [contentDir] - Override content directory
 * @property {RegExp} [filePattern] - Override file pattern
 * @property {StorageAdapter} [storage] - Optional DB storage
 */
interface GeneratorOptions {
  contentDir?: string;
  filePattern?: RegExp;
  storage?: StorageAdapter;
}

/**
 * Central metadata generation orchestrator.
 */
class MetadataOrchestrator {
  /**
   * Parse CLI arguments to determine which generators to run.
   *
   * @returns {string[] | null} Content types to generate, or null for all
   */
  static parseArgs(): string[] | null {
    const args = process.argv.slice(2);
    const types: string[] = [];

    for (const arg of args) {
      if (arg === '--monsters' || arg === '--monster') types.push('monsters');
      if (arg === '--heirlooms' || arg === '--heirloom')
        types.push('heirlooms');
      if (arg === '--spells' || arg === '--spell') types.push('spells');
      if (arg === '--trinkets' || arg === '--trinket') types.push('trinkets');
      if (arg === '--bloodlines' || arg === '--bloodline')
        types.push('bloodlines');
      if (arg === '--vocations' || arg === '--vocation')
        types.push('vocations');
      if (arg === '--specializations' || arg === '--specialization')
        types.push('specializations');
      if (arg === '--feats' || arg === '--feat') types.push('feats');
      if (arg === '--world' || arg === '--lore') types.push('world');
      if (arg === '--rules' || arg === '--rule') types.push('rules');
    }

    return types.length > 0 ? types : null;
  }

  /**
   * Run a specific metadata generator.
   *
   * @param {string} contentType - Content type key
   * @param {GeneratorOptions} [options] - Generator options
   * @returns {Promise<void>}
   */
  async runSpecificGenerator(
    contentType: string,
    options: GeneratorOptions = {},
  ): Promise<void> {
    const config = CONTENT_TYPES[contentType];
    if (!config?.generator) {
      log.debug('No specific generator configured, skipping', { contentType });
      return;
    }

    log.message('Running specialized generator', {
      generator: config.generator,
    });

    try {
      const generatorPath = path.resolve(__dirname, config.generator);
      const generatorUrl = pathToFileURL(generatorPath).href;
      const genModule = await import(
        /* webpackIgnore: true */
        generatorUrl
      );

      const generatorOptions = {
        contentDir:
          options.contentDir || path.resolve(__dirname, '..', '..', config.dir),
        filePattern: config.pattern,
        ...options,
      };

      await genModule.main(generatorOptions);
      log.message('Completed generator', { generator: config.generator });
    } catch (error) {
      log.error('Failed to run generator', {
        generator: config.generator,
        error: (error as Error).message,
      });
    }
  }

  /**
   * Generate metadata for specific content types or all types.
   *
   * @param {string[] | null} [contentTypes] - Types to generate, null for all
   * @param {GeneratorOptions} [options] - Generator options
   * @returns {Promise<void>}
   */
  async generate(
    contentTypes: string[] | null = null,
    options: GeneratorOptions = {},
  ): Promise<void> {
    const typesToGenerate = contentTypes || Object.keys(CONTENT_TYPES);

    log.message('Starting metadata generation', {
      contentTypes: typesToGenerate,
    });

    for (const contentType of typesToGenerate) {
      const config = CONTENT_TYPES[contentType];
      if (config?.generator) {
        await this.runSpecificGenerator(contentType, options);
      }
    }

    log.message('Metadata generation complete');
  }
}

if (import.meta.url === pathToFileURL(__filename).href) {
  const orchestrator = new MetadataOrchestrator();
  const contentTypes = MetadataOrchestrator.parseArgs();
  const persist = process.argv.includes('--persist');

  (async () => {
    let storage: StorageAdapter | null = null;
    try {
      if (persist) {
        const { createStorageFromEnv } = await import(
          /* webpackIgnore: true */
          '../core/metadataStorage'
        );
        storage = (await createStorageFromEnv()) as unknown as StorageAdapter;
        log.message('Database persistence enabled via --persist flag');
      }
      await orchestrator.generate(contentTypes, {
        storage: storage ?? undefined,
      });
    } catch (error) {
      log.error('Fatal error during metadata orchestration', {
        error: (error as Error).message,
        stack: (error as Error).stack,
      });
      process.exitCode = 1;
    } finally {
      if (storage) await storage.close();
    }
  })();
}

export { MetadataOrchestrator };

