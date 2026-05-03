/**
 * @fileoverview Abstract Filesystem Metadata Repository
 * @description Base class for all filesystem-backed repository adapters. Provides
 * concrete implementations of `list` and `getBySlug` backed by `readMetadataFiles`.
 * Subclasses override `filter` and `matchSlug` to customise record selection.
 *
 * @module lib/db/content/adapters/fs/FsMetadataRepository
 * @version 1.0.0
 * @author Typeir
 * @since 7.1.0
 */

import { logger } from '@/lib/logging/logger';
import { readMetadataFiles } from './readMetadataFiles';

/**
 * Abstract base class for filesystem metadata repository adapters.
 *
 * @abstract
 * @class FsMetadataRepository
 * @template T - Domain metadata record type. Must expose a `slug` string field.
 *
 * @description
 * Subclasses provide `subdir` and `logModule` via `super()` and may override
 * `filter` or `matchSlug` to specialise record selection without duplicating
 * the read/error-handling boilerplate.
 */
export abstract class FsMetadataRepository<T extends { slug: string }> {
  /** @protected */
  protected readonly subdir: string;

  /** @private */
  private readonly log: ReturnType<typeof logger.child>;

  /**
   * @param {string} subdir - Content subdirectory relative to `src/content/{locale}/`.
   * @param {string} logModule - Module label passed to `logger.child()`.
   */
  constructor(subdir: string, logModule: string) {
    this.subdir = subdir;
    this.log = logger.child({ module: logModule });
  }

  /**
   * Type guard applied to every raw record before it is returned.
   *
   * @param {unknown} record - Raw parsed JSON record.
   * @returns {record is T} True when the record should be included.
   *
   * @description
   * Default implementation accepts any non-null value. Override in subclasses
   * that share a content directory with records of a different type (e.g.
   * vocations and specializations share the same directory).
   */
  protected filter(record: unknown): record is T {
    return record != null;
  }

  /**
   * Predicate used to match a record against a requested slug.
   *
   * @param {T} record - Typed metadata record.
   * @param {string} slug - Slug to match against.
   * @returns {boolean} True when `record` is the requested item.
   *
   * @description
   * Default implementation compares `record.slug` strictly. Override when a
   * record type carries a secondary slug field (e.g. `MonsterMetadata.subSlug`).
   */
  protected matchSlug(record: T, slug: string): boolean {
    return record.slug === slug;
  }

  /**
   * Returns all metadata records for the given locale, filtered by `filter`.
   *
   * @param {string} locale - Locale code (e.g. `'en'`, `'es'`).
   * @returns {Promise<T[]>} Filtered metadata array, or `[]` on error.
   */
  async list(locale: string): Promise<T[]> {
    try {
      const raw = await readMetadataFiles<T>(locale, this.subdir);
      return raw.filter((r): r is T => this.filter(r));
    } catch (error) {
      this.log.error('Error reading metadata from filesystem', {
        error: error instanceof Error ? error.message : String(error),
        locale,
      });
      return [];
    }
  }

  /**
   * Returns a single metadata record matched by `matchSlug`, or `null`.
   *
   * @param {string} locale - Locale code.
   * @param {string} slug - Slug to look up.
   * @returns {Promise<T | null>} Matched record, or `null` if not found or on error.
   */
  async getBySlug(locale: string, slug: string): Promise<T | null> {
    try {
      const all = await readMetadataFiles<T>(locale, this.subdir);
      return (
        all
          .filter((r): r is T => this.filter(r))
          .find((r) => this.matchSlug(r, slug)) ?? null
      );
    } catch (error) {
      this.log.error('Error reading single record from filesystem', {
        error: error instanceof Error ? error.message : String(error),
        locale,
        slug,
      });
      return null;
    }
  }
}
