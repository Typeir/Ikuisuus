/**
 * @fileoverview Abstract PostgreSQL metadata repository, MikroORM-backed.
 * @description Implements `list` and `getBySlug` on `getEM`. Subclasses supply
 * the entity class and row-to-domain mapper; `populate` and `orderBy` are overridable.
 *
 * @module lib/db/content/adapters/pg/PgMetadataRepository
 * @version 1.0.0
 * @author Typeir
 * @since 7.1.0
 */

import 'server-only';

import { getEM } from '@/lib/db/orm/orm';
import { logger } from '@/lib/logging/logger';
import type { EntityClass, FilterQuery } from '@mikro-orm/core';
import {
  buildFilterQuery,
  type FilterExpression,
} from '../../filters';

/**
 * Abstract base class for MikroORM-backed metadata repository adapters.
 *
 * @abstract
 * @class PgMetadataRepository
 * @template TEntity - MikroORM entity type. Must expose `locale` and `slug` string fields.
 * @template TMetadata - Domain metadata record type. Must expose a `slug` string field.
 *
 * @description Abstract members require an entity constructor and a row mapper; `populate()`
 * and `orderBy()` may be overridden.
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
   * @description Override to load relation paths (e.g. `['boons']`, `['features']`).
   */
  protected populate(): string[] {
    return [];
  }

  /**
   * Column ordering applied to `list` queries.
   *
   * @returns {Record<string, 'asc' | 'desc'> | undefined} Order map or `undefined`.
   *
   * @description Override to control sort order. Defaults to `undefined` (database-native order).
   */
  protected orderBy(): Record<string, 'asc' | 'desc'> | undefined {
    return undefined;
  }

  /**
   * Returns all metadata records for the given locale.
   *
   * Translates optional filters into a MikroORM query object merged with the locale predicate before `em.find`.
   *
   * @param {string} locale - Locale code (e.g. `'en'`, `'es'`).
   * @param {FilterExpression[]} [filters] - JSON-serializable filter list.
   * @returns {Promise<TMetadata[]>} All records, or `[]` on error.
   */
  async list(
    locale: string,
    filters?: FilterExpression[],
  ): Promise<TMetadata[]> {
    try {
      const em = await getEM();
      const populate = this.populate() as never[];
      const orderBy = this.orderBy();
      const filterQuery = filters && filters.length > 0
        ? buildFilterQuery(filters)
        : {};
      const where = { locale, ...filterQuery } as FilterQuery<TEntity>;
      const rows = await em.find(this.entityClass, where, {
        populate,
        ...(orderBy ? { orderBy: orderBy as never } : {}),
      });
      return rows.map((r) => this.toMetadata(r));
    } catch (error) {
      this.log.error('Error reading metadata from PostgreSQL', {
        error: error instanceof Error ? error.message : String(error),
        locale,
        filterCount: filters?.length ?? 0,
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
