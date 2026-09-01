/**
 * @fileoverview Abstract Filesystem Metadata Repository. Base class for filesystem-backed
 * repository adapters. Provides `list` and `getBySlug` backed by `readMetadataFiles`.
 *
 * @module lib/db/content/adapters/fs/FsMetadataRepository
 * @version 1.0.0
 * @author Typeir
 * @since 7.1.0
 */

import 'server-only';

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
 * Subclasses pass `subdir` to the constructor and may override `filter` or
 * `matchSlug` to specialise record selection.
 */
export abstract class FsMetadataRepository<T extends { slug: string }> {
  /** @protected */
  protected readonly subdir: string;

  /** @private */
  private readonly log: ReturnType<typeof logger.child>;

  /**
   * @param {string} subdir - Content subdirectory relative to `src/content/{locale}/`.
   */
  constructor(subdir: string) {
    this.subdir = subdir;
    this.log = logger.child({ module: this.constructor.name });
  }

  /**
   * Type guard applied to every raw record before it is returned.
   *
   * @param {unknown} record - Raw parsed JSON record.
   * @returns {record is T} True when the record should be included.
   *
   * @description
   * Default accepts any non-null record. Return false to exclude records of
   * another type sharing the same content directory.
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
   * Default compares `record.slug` strictly. Override to match a record type's
   * secondary slug field.
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
