/**
 * @fileoverview Orchestrate metadata generators: backend detection, paths, run loop.
 * @description Detects backend, resolves directories, maps output paths.
 *
 * @module scripts/metadata/generatorUtils
 * @version 1.0.1
 * @author Typeir
 * @since 3.0.0
 */

/* paw:gate:file-length ignore */

import { createLogger } from '@/lib/logging/logger';
import { extractConsumedKeys } from '@/lib/md/extractKeywordRefs';
import { extractProducedKeys } from '@/lib/md/keywordIndexRegistry';
import { readFileSync } from 'fs';
import path from 'path';
import { fnv1a32 } from '../../src/lib/metadata/contentHash';
import { getMatchingFiles } from '@/lib/utils/getMatchingFiles';
import { ensureDirectory, safeWriteFile } from './fileUtils';
import { UTILITY } from './parsingPatterns';
import { calculateReadingTime } from './parsingUtils';
import { endTimer, startTimer } from './performanceUtils';
import { loadSharedData, type SharedData } from './sharedData';

const log = createLogger({ component: 'metadata-generator' });

/**
 * Resolved project root (two levels up from scripts/metadata/).
 */
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

/**
 * Cached metadata backend value.
 */
let _metadataBackend: string | null = null;

/**
 * Reads METADATA_BACKEND from process.env or .env.local, defaulting to 'fs'.
 *
 * @returns {string} 'pg' or 'fs'
 */
export function getMetadataBackend(): string {
  if (_metadataBackend !== null) return _metadataBackend;
  if (process.env.METADATA_BACKEND) {
    _metadataBackend = process.env.METADATA_BACKEND;
    return _metadataBackend;
  }
  try {
    const envPath = path.join(PROJECT_ROOT, '.env.local');
    const raw = readFileSync(envPath, 'utf8');
    for (const line of raw.split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const eq = t.indexOf('=');
      if (eq === -1) continue;
      const key = t.slice(0, eq).trim();
      if (key === 'METADATA_BACKEND') {
        _metadataBackend = t
          .slice(eq + 1)
          .trim()
          .replace(UTILITY.quotesStrip, '');
        return _metadataBackend;
      }
    }
  } catch {
    /* .env.local absent — default to fs */
  }
  _metadataBackend = 'fs';
  return _metadataBackend;
}

/**
 * Content type to directory mapping.
 */
const CONTENT_PATHS: Record<string, string[]> = {
  monsters: ['src', 'content', 'en', 'monsters'],
  heirlooms: ['src', 'content', 'en', 'items', 'heirlooms'],
  spells: ['src', 'content', 'en', 'spells'],
  trinkets: ['src', 'content', 'en', 'items', 'trinkets'],
  bloodlines: ['src', 'content', 'en', 'character-creation', 'bloodlines'],
  vocations: ['src', 'content', 'en', 'character-creation', 'vocations'],
  specializations: ['src', 'content', 'en', 'character-creation', 'vocations'],
  feats: ['src', 'content', 'en', 'character-creation', 'feats'],
};

/**
 * Gets the absolute content directory for a content type.
 *
 * @param {string} contentType - One of 'monsters', 'heirlooms', 'spells', 'trinkets'
 * @returns {string} Absolute path
 * @throws {Error} If contentType is unknown
 */
export function getContentDirectory(contentType: string): string {
  const segments = CONTENT_PATHS[contentType];
  if (!segments) {
    throw new Error(
      `Unknown content type: ${contentType}. Valid: ${Object.keys(CONTENT_PATHS).join(', ')}`,
    );
  }
  return path.resolve(PROJECT_ROOT, ...segments);
}

/**
 * Maps content type to its subdirectory under .meta/{locale}/.
 *
 * @param {string} contentType - Content type key
 * @returns {string} Subdirectory name
 */
export function getMetaSubdir(contentType: string): string {
  const subdirs: Record<string, string> = {
    monsters: 'monsters',
    heirlooms: path.join('items', 'heirlooms'),
    spells: 'spells',
    trinkets: path.join('items', 'trinkets'),
    bloodlines: path.join('character-creation', 'bloodlines'),
    vocations: path.join('character-creation', 'vocations'),
    specializations: path.join(
      'character-creation',
      'vocations',
      'specializations',
    ),
    feats: path.join('character-creation', 'feats'),
    rules: 'rules',
    world: 'world',
  };
  return subdirs[contentType] || contentType;
}

/**
 * Resolves the output path for a .metadata.json file.
 * Always writes to the .meta/{locale}/{subdir}/ mirror tree, never alongside
 * the source; sidecars in the content tree are build clutter in a submodule
 * that serves as the content bucket.
 *
 * @param {string} sourceFilePath - Original MDX file path
 * @param {RegExp} filePattern - Pattern to replace with .metadata.json
 * @param {string} contentType - Content type key
 * @param {string} locale - Locale code
 * @returns {string} Absolute output path
 */
export function getMetadataOutputPath(
  sourceFilePath: string,
  filePattern: RegExp,
  contentType: string,
  locale: string,
): string {
  const baseName = path
    .basename(sourceFilePath)
    .replace(filePattern, '.metadata.json');
  const subdir = getMetaSubdir(contentType);
  return path.join(PROJECT_ROOT, '.meta', locale, subdir, baseName);
}

/**
 * Storage adapter interface for optional database persistence.
 *
 * @property {Function} upsert - Upsert a single record
 * @property {Function} close - Close the adapter
 */
export interface StorageAdapter {
  upsert(
    category: string,
    locale: string,
    slug: string,
    data: unknown,
  ): Promise<void>;
  close(): Promise<void>;
}

/**
 * Configuration for runGenerator.
 *
 * @property {string} name - Display name for the generator
 * @property {string} contentType - Content type key
 * @property {RegExp} filePattern - Pattern for matching source files
 * @property {Function} parseFile - Async parse function for a single file
 * @property {Function} [processResult] - Optional transform for parse results
 * @property {string} [contentDir] - Override content directory (for testing)
 * @property {StorageAdapter} [storage] - Optional DB storage adapter
 * @property {string} [locale] - Locale for storage (defaults to 'en')
 * @property {boolean} [recursive] - Scan subdirectories recursively (defaults to false)
 * @property {Function} [resolveOutputPath] - Custom output path resolver
 * @property {string} [metadataVersion] - Schema version appended to source hash so parser changes invalidate caches
 * @property {string} [fileFilter] - Single filename to process (from --file CLI flag)
 */
export interface GeneratorConfig {
  name: string;
  contentType: string;
  filePattern: RegExp;
  parseFile: (filePath: string, sharedData: SharedData) => Promise<unknown>;
  processResult?: (result: unknown) => { metadata: unknown; count?: number };
  contentDir?: string;
  storage?: StorageAdapter;
  locale?: string;
  recursive?: boolean;
  resolveOutputPath?: (
    sourceFilePath: string,
    contentType: string,
    locale: string,
  ) => string;
  metadataVersion?: string;
  fileFilter?: string;
}

/**
 * Stamps shared fields (versionHash, readingTime) onto metadata records.
 * Arrays receive the same values on every record. Generator-set values are
 * never overwritten except versionHash, which is always set here.
 *
 * @param {unknown} metadata - Parsed metadata object, array, or null
 * @param {string} hash - Pre-computed version hash
 * @param {string} readingTime - Pre-computed reading time (e.g. "4 min read")
 * @param {string[]} produces - Shard ids the file defines
 * @param {string[]} consumes - Shard ids the file ingests
 * @returns {unknown} Metadata with shared fields populated for object records
 */
function stampSharedFields(
  metadata: unknown,
  hash: string,
  readingTime: string,
  produces: string[],
  consumes: string[],
): unknown {
  if (metadata === null || metadata === undefined) return metadata;
  if (Array.isArray(metadata)) {
    return metadata.map((item) =>
      stampSharedFields(item, hash, readingTime, produces, consumes),
    );
  }
  if (typeof metadata !== 'object') return metadata;
  return {
    readingTime,
    ...(metadata as Record<string, unknown>),
    versionHash: hash,
    produces,
    consumes,
  };
}

/**
 * Orchestrates metadata generation with the standardized pattern:
 * scan → parse → write → optional DB persist → report.
 *
 * @param {GeneratorConfig} config - Generator configuration
 * @returns {Promise<void>}
 */
export async function runGenerator(config: GeneratorConfig): Promise<void> {
  const {
    name,
    contentType,
    filePattern,
    parseFile,
    processResult = null,
    contentDir = null,
    storage = null,
    locale = 'en',
    recursive = false,
    resolveOutputPath = null,
    fileFilter = null,
  } = config;

  const timerKey = `${contentType}-metadata-generation`;
  startTimer(timerKey);

  try {
    log.message(`Scanning for ${contentType} files`);
    if (storage) {
      log.message(`Database persistence enabled for ${contentType}`);
    }

    const sharedData = await loadSharedData();
    log.message('Loaded shared data for optimized processing');

    const resolvedContentDir = contentDir || getContentDirectory(contentType);
    let files = await getMatchingFiles(
      resolvedContentDir,
      filePattern,
      recursive,
    );

    if (fileFilter) {
      files = files.filter((f) => path.basename(f) === fileFilter);
      log.message(
        `Filtered to ${files.length} file(s) matching "${fileFilter}"`,
      );
    }

    log.message(`Found ${files.length} ${contentType} files`);

    if (files.length === 0) {
      log.message(`No ${contentType} files found to process`);
      return;
    }

    const results = await Promise.allSettled(
      files.map(async (filePath) => {
        try {
          const parseResult = await parseFile(filePath, sharedData);

          const processed = processResult
            ? processResult(parseResult)
            : { metadata: parseResult };

          if (processed.metadata === null || processed.metadata === undefined) {
            return {
              filePath,
              success: true,
              ...processed,
              metadata: null,
            };
          }

          const sourceContent = readFileSync(filePath, 'utf8');
          const versionHash = fnv1a32(
            sourceContent + (config.metadataVersion || ''),
          );
          const metadataWithHash = stampSharedFields(
            processed.metadata,
            versionHash,
            calculateReadingTime(sourceContent, locale),
            extractProducedKeys(sourceContent),
            extractConsumedKeys(sourceContent),
          );

          const metadataFilePath = resolveOutputPath
            ? resolveOutputPath(filePath, contentType, locale)
            : getMetadataOutputPath(
                filePath,
                filePattern,
                contentType,
                locale,
              );

          await ensureDirectory(path.dirname(metadataFilePath));

          const success = await safeWriteFile(
            metadataFilePath,
            JSON.stringify(metadataWithHash, null, 2),
          );

          if (!success) {
            throw new Error(
              `Failed to write metadata file: ${metadataFilePath}`,
            );
          }

          if (storage && metadataWithHash) {
            const records = Array.isArray(metadataWithHash)
              ? metadataWithHash
              : [metadataWithHash];
            for (const record of records) {
              if (record && typeof record === 'object' && 'slug' in record) {
                try {
                  await storage.upsert(
                    contentType,
                    locale,
                    (record as { slug: string }).slug,
                    record,
                  );
                } catch (storageErr) {
                  log.warning(
                    `DB upsert failed for ${(record as { slug: string }).slug}`,
                    { error: (storageErr as Error).message },
                  );
                }
              }
            }
          }

          return {
            filePath,
            success: true,
            ...processed,
            metadata: metadataWithHash,
          };
        } catch (error) {
          return {
            filePath,
            success: false,
            error: (error as Error).message,
          };
        }
      }),
    );

    const successful = results.filter(
      (r) => r.status === 'fulfilled' && r.value.success,
    );
    const failed = results.filter(
      (r) =>
        r.status === 'rejected' ||
        (r.status === 'fulfilled' && !r.value.success),
    );

    let statsMessage = `✅ Successfully parsed ${successful.length} files`;
    if (processResult && successful.length > 0) {
      const totalItems = successful.reduce((sum, result) => {
        return (
          sum +
          ((result as PromiseFulfilledResult<{ count?: number }>).value.count ||
            1)
        );
      }, 0);
      statsMessage += ` → ${totalItems} items`;
    }

    log.message(statsMessage);
    log.message(`Wrote ${successful.length} metadata files (.meta/)`);

    if (failed.length > 0) {
      log.warning(`${failed.length} processing errors encountered`);
      failed.forEach((failure) => {
        const fileName =
          failure.status === 'fulfilled'
            ? path.basename(failure.value.filePath)
            : 'Unknown file';
        const error =
          failure.status === 'fulfilled'
            ? failure.value.error
            : (failure as PromiseRejectedResult).reason?.message ||
              'Unknown error';
        log.error(`${fileName}: ${error}`);
      });
    }

    const elapsed = endTimer(timerKey);
    const avgTime =
      successful.length > 0 ? (elapsed / successful.length).toFixed(2) : '0';
    log.message(`Average processing time: ${avgTime}ms per file`);

    if (storage) {
      log.message(
        `Persisted ${contentType} records to database alongside sidecar files`,
      );
    }
  } catch (error) {
    log.error(`Fatal error in ${name}`, {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    process.exitCode = 1;
  }
}
