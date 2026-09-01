/**
 * @fileoverview Metadata Generator Type Contracts
 * @description Typed interfaces for the metadata generation pipeline, used by
 * both script entrypoints and the runtime sync service.
 *
 * @module scripts/metadata/types
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import type { SharedData } from './sharedData';

/**
 * Content type identifiers supported by the generator pipeline.
 */
export type ContentType =
  | 'monsters'
  | 'heirlooms'
  | 'spells'
  | 'trinkets'
  | 'bloodlines'
  | 'vocations'
  | 'specializations';

/**
 * Options passed to a metadata generator's main function.
 *
 * @property {string} [contentDir] - Override content directory (for testing with fixtures)
 * @property {RegExp} [filePattern] - Override file pattern filter
 * @property {MetadataStorage | null} [storage] - Optional database persistence adapter
 * @property {string} [locale] - Locale for storage persistence (defaults to 'en')
 */
export interface GeneratorOptions {
  contentDir?: string;
  filePattern?: RegExp;
  storage?: MetadataStorage | null;
  locale?: string;
}

/**
 * Result of processing a single file through a generator.
 *
 * @property {Record<string, unknown> | Record<string, unknown>[]} metadata - Parsed metadata
 * @property {number} [count] - Number of records produced (for multi-stat-block files)
 */
export interface GeneratorResult {
  metadata: Record<string, unknown> | Record<string, unknown>[];
  count?: number;
}

/**
 * Contract for a metadata generator module.
 * Each content type implements this interface.
 *
 * @property {Function} main - Orchestrates full generation for the content type
 * @property {Function} parseFile - Parses a single file into metadata
 */
export interface GeneratorModule {
  main(options?: GeneratorOptions): Promise<void>;
  parseFile(
    filePath: string,
    sharedData: SharedData,
  ): Promise<Record<string, unknown> | Record<string, unknown>[]>;
}

/**
 * Configuration for MetadataGeneratorUtils.runGenerator().
 *
 * @property {string} name - Display name for logging
 * @property {ContentType} contentType - Content type identifier
 * @property {RegExp} filePattern - Regex pattern for matching source files
 * @property {Function} parseFile - Async function to parse a single file
 * @property {Function} [processResult] - Optional post-processing for parsed results
 * @property {string} [contentDir] - Override content directory
 * @property {MetadataStorage | null} [storage] - Optional storage adapter
 * @property {string} [locale] - Locale code (defaults to 'en')
 */
export interface GeneratorConfig {
  name: string;
  contentType: ContentType;
  filePattern: RegExp;
  parseFile: (
    filePath: string,
    sharedData: SharedData,
  ) => Promise<Record<string, unknown> | Record<string, unknown>[]>;
  processResult?: (
    result: Record<string, unknown> | Record<string, unknown>[],
  ) => GeneratorResult;
  contentDir?: string;
  storage?: MetadataStorage | null;
  locale?: string;
}

/**
 * Content type configuration entry (used by orchestrator).
 *
 * @property {string} dir - Default content directory path relative to project root
 * @property {RegExp} pattern - File matching regex
 * @property {string | null} generator - Generator module filename (null if not implemented)
 * @property {string} contentType - Content category
 * @property {string} subType - Content subcategory
 */
export interface ContentTypeConfig {
  dir: string;
  pattern: RegExp;
  generator: string | null;
  contentType: string;
  subType: string;
}

/**
 * Storage adapter for persisting metadata to a database.
 * Used by generators and the sync service.
 *
 * @property {Function} upsert - Insert or update a metadata record
 * @property {Function} close - Close the storage connection
 */
export interface MetadataStorage {
  upsert(
    category: string,
    locale: string,
    slug: string,
    data: Record<string, unknown>,
  ): Promise<void>;
  close(): Promise<void>;
}
