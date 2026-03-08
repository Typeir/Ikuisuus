/**
 * @fileoverview PostgreSQL Heirloom Repository
 * @description Implements `HeirloomRepository` against the normalised `heirlooms`
 * table. Weapon damage fields are flattened from `HeirloomWeaponDamage`; all
 * array fields (tags, weapon_properties, etc.) use native Postgres TEXT[].
 *
 * @module lib/db/content/adapters/pg/pgHeirloomRepository
 * @version 2.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { query } from '@/lib/db/postgres/pool';
import { logger } from '@/lib/logging/logger';
import type { HeirloomRepository } from '../../repositories/heirloomRepository';
import type { HeirloomMetadata } from '../../schemas/heirloomMetadata';
import { asBoolean, asNumber, asString, asStringArray } from './rowParsers';

const log = logger.child({ module: 'PGHeirloomRepo' });

/* ─────────────────────────────  Row mapper  ──────────────────────────── */

/**
 * Maps a flat `heirlooms` row to a typed `HeirloomMetadata` object.
 *
 * @param {Record<string, unknown>} row - Raw row from the `heirlooms` table
 * @returns {HeirloomMetadata} Fully typed heirloom metadata
 */
const rowToHeirloom = (row: Record<string, unknown>): HeirloomMetadata => ({
  slug: String(row.slug),
  title: String(row.title),
  file: String(row.file),
  link: String(row.link),
  rarity: asString(row.rarity),
  itemType: asString(row.item_type),
  weaponType: asString(row.weapon_type),
  requiresAttunement: asBoolean(row.requires_attunement),
  attunementRequirements: asString(row.attunement_requirements),
  weaponDamage:
    row.weapon_damage != null
      ? {
          damage: String(row.weapon_damage),
          damageType: asString(row.weapon_damage_type) ?? '',
          versatileDamage: asString(row.versatile_damage),
        }
      : undefined,
  hitModifier: asNumber(row.hit_modifier),
  range: asString(row.range),
  weight: asString(row.weight),
  charges:
    row.charges_initial != null ||
    row.charges_recharge != null ||
    row.charges_depletes != null
      ? {
          initial: asString(row.charges_initial),
          recharge: asString(row.charges_recharge),
          depletes: asBoolean(row.charges_depletes),
        }
      : undefined,
  mastery: asStringArray(row.mastery),
  weaponProperties: asStringArray(row.weapon_properties),
  damageTypesDealt: asStringArray(row.damage_types_dealt),
  savingThrowTypes: asStringArray(row.saving_throw_types),
  tags: asStringArray(row.tags),
  indexVersion: asNumber(row.index_version),
});

/* ──────────────────────────────  Repository  ─────────────────────────── */

/**
 * PostgreSQL-backed heirloom repository.
 *
 * Queries the normalised `heirlooms` table.
 */
export const pgHeirloomRepository: HeirloomRepository = {
  list: async (locale: string): Promise<HeirloomMetadata[]> => {
    try {
      const result = await query(
        'SELECT * FROM heirlooms WHERE locale = $1 ORDER BY slug ASC',
        [locale],
      );
      return result.rows.map(rowToHeirloom);
    } catch (error) {
      log.error('Error reading heirloom metadata from PostgreSQL', {
        error: error instanceof Error ? error.message : String(error),
        locale,
      });
      return [];
    }
  },

  getBySlug: async (
    locale: string,
    slug: string,
  ): Promise<HeirloomMetadata | null> => {
    try {
      const result = await query(
        'SELECT * FROM heirlooms WHERE locale = $1 AND slug = $2 LIMIT 1',
        [locale, slug],
      );
      return result.rows.length > 0 ? rowToHeirloom(result.rows[0]) : null;
    } catch (error) {
      log.error('Error reading single heirloom from PostgreSQL', {
        error: error instanceof Error ? error.message : String(error),
        locale,
        slug,
      });
      return null;
    }
  },
};
