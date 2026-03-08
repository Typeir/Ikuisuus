/**
 * @fileoverview PostgreSQL Trinket Repository
 * @description Implements `TrinketRepository` against the normalised `trinkets`
 * table. All array fields (tags, properties, etc.) use native Postgres TEXT[].
 *
 * @module lib/db/content/adapters/pg/pgTrinketRepository
 * @version 2.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { query } from '@/lib/db/postgres/pool';
import { logger } from '@/lib/logging/logger';
import type { TrinketRepository } from '../../repositories/trinketRepository';
import type { TrinketMetadata } from '../../schemas/trinketMetadata';
import { asNumber, asString, asStringArray } from './rowParsers';

const log = logger.child({ module: 'PGTrinketRepo' });

/* ─────────────────────────────  Row mapper  ──────────────────────────── */

/**
 * Maps a flat `trinkets` row to a typed `TrinketMetadata` object.
 *
 * @param {Record<string, unknown>} row - Raw row from the `trinkets` table
 * @returns {TrinketMetadata} Fully typed trinket metadata
 */
const rowToTrinket = (row: Record<string, unknown>): TrinketMetadata => ({
  slug: String(row.slug),
  title: String(row.title),
  file: String(row.file),
  link: String(row.link),
  itemType: String(row.item_type),
  damage: asString(row.damage),
  damageType: asString(row.damage_type),
  range: asString(row.range),
  weight: asString(row.weight),
  savingThrowDC: asNumber(row.saving_throw_dc),
  savingThrowAbility: asString(row.saving_throw_ability),
  properties: asStringArray(row.properties),
  specialEffects: asStringArray(row.special_effects),
  inflictsConditions: asStringArray(row.inflicts_conditions),
  tags: asStringArray(row.tags),
});

/* ──────────────────────────────  Repository  ─────────────────────────── */

/**
 * PostgreSQL-backed trinket repository.
 *
 * Queries the normalised `trinkets` table.
 */
export const pgTrinketRepository: TrinketRepository = {
  list: async (locale: string): Promise<TrinketMetadata[]> => {
    try {
      const result = await query(
        'SELECT * FROM trinkets WHERE locale = $1 ORDER BY slug ASC',
        [locale],
      );
      return result.rows.map(rowToTrinket);
    } catch (error) {
      log.error('Error reading trinket metadata from PostgreSQL', {
        error: error instanceof Error ? error.message : String(error),
        locale,
      });
      return [];
    }
  },

  getBySlug: async (
    locale: string,
    slug: string,
  ): Promise<TrinketMetadata | null> => {
    try {
      const result = await query(
        'SELECT * FROM trinkets WHERE locale = $1 AND slug = $2 LIMIT 1',
        [locale, slug],
      );
      return result.rows.length > 0 ? rowToTrinket(result.rows[0]) : null;
    } catch (error) {
      log.error('Error reading single trinket from PostgreSQL', {
        error: error instanceof Error ? error.message : String(error),
        locale,
        slug,
      });
      return null;
    }
  },
};
