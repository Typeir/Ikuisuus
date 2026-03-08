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
  rarity: row.rarity != null ? String(row.rarity) : undefined,
  itemType: row.item_type != null ? String(row.item_type) : undefined,
  weaponType: row.weapon_type != null ? String(row.weapon_type) : undefined,
  requiresAttunement: row.requires_attunement != null ? Boolean(row.requires_attunement) : undefined,
  attunementRequirements: row.attunement_requirements != null ? String(row.attunement_requirements) : undefined,
  weaponDamage:
    row.weapon_damage != null
      ? {
          damage: String(row.weapon_damage),
          damageType: String(row.weapon_damage_type ?? ''),
          versatileDamage: row.versatile_damage != null ? String(row.versatile_damage) : undefined,
        }
      : undefined,
  hitModifier: row.hit_modifier != null ? Number(row.hit_modifier) : undefined,
  range: row.range != null ? String(row.range) : undefined,
  weight: row.weight != null ? String(row.weight) : undefined,
  charges:
    row.charges_initial != null || row.charges_recharge != null || row.charges_depletes != null
      ? {
          initial: row.charges_initial != null ? String(row.charges_initial) : undefined,
          recharge: row.charges_recharge != null ? String(row.charges_recharge) : undefined,
          depletes: row.charges_depletes != null ? Boolean(row.charges_depletes) : undefined,
        }
      : undefined,
  mastery: (row.mastery as string[] | null) ?? undefined,
  weaponProperties: (row.weapon_properties as string[] | null) ?? undefined,
  damageTypesDealt: (row.damage_types_dealt as string[] | null) ?? undefined,
  savingThrowTypes: (row.saving_throw_types as string[] | null) ?? undefined,
  tags: (row.tags as string[] | null) ?? undefined,
  indexVersion: row.index_version != null ? Number(row.index_version) : undefined,
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
