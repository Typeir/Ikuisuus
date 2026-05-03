/**
 * @fileoverview Abstract PostgreSQL Metadata Repository (MikroORM)
 * @description Base class for all MikroORM-backed content repository adapters.
 * Provides concrete implementations of `list` and `getBySlug` built on top of
 * `getEM`. Subclasses declare the entity class and the row-to-domain mapper;
 * `populate` and `orderBy` can be overridden when needed.
 *
 * @module lib/db/content/adapters/pg/PgMetadataRepository
 * @version 1.0.0
 * @author Typeir
 * @since 7.1.0
 */

import { getEM } from '@/lib/db/orm/orm';
import { logger } from '@/lib/logging/logger';
import type { EntityClass, FilterQuery } from '@mikro-orm/core';

/**
 * Abstract base class for MikroORM-backed metadata repository adapters.
 *
 * @abstract
 * @class PgMetadataRepository
 * @template TEntity - MikroORM entity type. Must expose `locale` and `slug` string fields.
 * @template TMetadata - Domain metadata record type. Must expose a `slug` string field.
 *
 * @description
 * Subclasses provide the entity constructor and a row mapper via abstract members,
 * then optionally override `populate()` and `orderBy()` to customise query options.
 * All error handling and logging is centralised here.
 */
export abstract class PgMetadataRepository<
  TEntity extends { locale: string; slug: string },
  TMetadata extends { slug: string },
> {
  /** @private */
  private readonly log: ReturnType<typeof logger.child>;

  constructor() {
    this.log = logger.child({ module: this.constructor.name });
  }

  /**
   * The MikroORM entity constructor used in `em.find` / `em.findOne` calls.
   *
   * @abstract
   * @protected
   */
  protected abstract readonly entityClass: EntityClass<TEntity>;

  /**
   * Maps a loaded entity row to the domain metadata object.
   *
   * @abstract
   * @protected
   * @param {TEntity} row - Loaded MikroORM entity instance.
   * @returns {TMetadata} Domain metadata record.
   */
  protected abstract toMetadata(row: TEntity): TMetadata;

  /**
   * Relation paths to eagerly populate on every query.
   *
   * @returns {string[]} Array of relation field names. Defaults to `[]`.
   *
   * @description
   * Override in subclasses that require relation data (e.g. `['boons']` for
   * bloodlines, `['features', 'preparedSpells']` for specializations).
   */
  protected populate(): string[] {
    return [];
  }

  /**
   * Column ordering applied to `list` queries.
   *
   * @returns {Record<string, 'asc' | 'desc'> | undefined} Order map or `undefined`.
   *
   * @description
   * Override in subclasses to control sort order. Defaults to `undefined`
   * (database-native order).
   */
  protected orderBy(): Record<string, 'asc' | 'desc'> | undefined {
    return undefined;
  }

  /**
   * Returns all metadata records for the given locale.
   *
   * @param {string} locale - Locale code (e.g. `'en'`, `'es'`).
   * @returns {Promise<TMetadata[]>} All records, or `[]` on error.
   */
  async list(locale: string): Promise<TMetadata[]> {
    try {
      const em = await getEM();
      const populate = this.populate() as never[];
      const orderBy = this.orderBy();
      const rows = await em.find(
        this.entityClass,
        { locale } as FilterQuery<TEntity>,
        { populate, ...(orderBy ? { orderBy: orderBy as never } : {}) },
      );
      return rows.map((r) => this.toMetadata(r));
    } catch (error) {
      this.log.error('Error reading metadata from PostgreSQL', {
        error: error instanceof Error ? error.message : String(error),
        locale,
      });
      return [];
    }
  }

  /**
   * Returns a single metadata record matched by slug, or `null`.
   *
   * @param {string} locale - Locale code.
   * @param {string} slug - Slug to look up.
   * @returns {Promise<TMetadata | null>} Matched record, or `null` if not found or on error.
   */
  async getBySlug(locale: string, slug: string): Promise<TMetadata | null> {
    try {
      const em = await getEM();
      const populate = this.populate() as never[];
      const row = await em.findOne(
        this.entityClass,
        { locale, slug } as FilterQuery<TEntity>,
        { populate },
      );
      return row ? this.toMetadata(row) : null;
    } catch (error) {
      this.log.error('Error reading single record from PostgreSQL', {
        error: error instanceof Error ? error.message : String(error),
        locale,
        slug,
      });
      return null;
    }
  }
}
