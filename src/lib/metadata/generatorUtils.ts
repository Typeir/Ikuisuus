/**
 * @fileoverview Metadata Generator Orchestration Utilities
 * @description Core orchestration for metadata generators: content directory resolution,
 * output path mapping, standardized run loop, and CLI integration.
 *
 * @module lib/metadata/generatorUtils
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { createLogger } from '@/lib/logging/logger';
import { readFileSync } from 'fs';
import path from 'path';
import { contentHash } from './contentHash';
import { ensureDirectory, getMatchingFiles, safeWriteFile } from './fileUtils';
import { endTimer, startTimer } from './performanceUtils';
import { loadSharedData, type SharedData } from './sharedData';

const log = createLogger({ component: 'metadata-generator' });

/**
 * Resolved project root (two levels up from src/lib/metadata/).
 */
const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');

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
          .replace(/^["']|["']$/g, '');
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
  };
  return subdirs[contentType] || contentType;
}

/**
 * Resolves the output path for a .metadata.json file.
 * In pg mode, writes to .meta/{locale}/{subdir}/ instead of alongside source.
 *
 * @param {string} sourceFilePath - Original MDX file path
 * @param {RegExp} filePattern - Pattern to replace with .metadata.json
 * @param {string} contentType - Content type key
 * @param {string} backend - 'pg' or 'fs'
 * @param {string} locale - Locale code
 * @returns {string} Absolute output path
 */
export function getMetadataOutputPath(
  sourceFilePath: string,
  filePattern: RegExp,
  contentType: string,
  backend: string,
  locale: string,
): string {
  if (backend !== 'pg') {
    return sourceFilePath.replace(filePattern, '.metadata.json');
  }
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
    backend: string,
    locale: string,
  ) => string;
}

/**
 * Attaches deterministic version hashes to metadata records.
 *
 * @param {unknown} metadata - Parsed metadata object, array, or null
 * @returns {unknown} Metadata with `versionHash` populated for object records
 */
function attachVersionHashes(metadata: unknown): unknown {
  if (metadata === null || metadata === undefined) {
    return metadata;
  }

  if (Array.isArray(metadata)) {
    return metadata.map((item) => attachVersionHashes(item));
  }

  if (typeof metadata !== 'object') {
    return metadata;
  }

  const record = metadata as Record<string, unknown>;
  const hashPayload = { ...record };
  delete hashPayload.versionHash;

  return {
    ...record,
    versionHash: contentHash(hashPayload),
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
    const files = await getMatchingFiles(
      resolvedContentDir,
      filePattern,
      recursive,
    );
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

          const metadataWithHash = attachVersionHashes(processed.metadata);

          const backend = getMetadataBackend();
          const metadataFilePath = resolveOutputPath
            ? resolveOutputPath(filePath, contentType, backend, locale)
            : getMetadataOutputPath(
                filePath,
                filePattern,
                contentType,
                backend,
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
    const outputLocation =
      getMetadataBackend() === 'pg' ? '.meta/' : 'alongside source';
    log.message(
      `Wrote ${successful.length} metadata files (${outputLocation})`,
    );

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
