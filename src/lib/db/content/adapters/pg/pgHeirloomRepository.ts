/**
 * @fileoverview PostgreSQL Heirloom Repository (MikroORM)
 * @description Implements `HeirloomRepository` via MikroORM against the
 * `heirlooms` table. Charges are read directly from the embedded VO.
 * Weapon damage is reconstructed from flat columns (no shared prefix).
 *
 * @module lib/db/content/adapters/pg/pgHeirloomRepository
 * @version 5.0.0
 * @author Typeir
 * @since 5.0.0
 */

import { HeirloomEntity } from '@/lib/db/orm/entities/HeirloomEntity';
import { nonEmpty, orUndef } from '@/lib/db/orm/helpers';
import { getEM } from '@/lib/db/orm/orm';
import { logger } from '@/lib/logging/logger';
import type { HeirloomRepository } from '../../repositories/heirloomRepository';
import type {
    HeirloomCharges,
    HeirloomMetadata,
    HeirloomWeaponDamage,
} from '../../schemas/heirloomMetadata';

const log = logger.child({ module: 'PGHeirloomRepo' });

/* ─────────────────────  Embed → Domain mappers  ─────────────────────── */

/**
 * Builds weapon damage info from flat row columns.
 *
 * @param {HeirloomEntity} row - Heirloom entity row
 * @returns {HeirloomWeaponDamage | undefined} Weapon damage or undefined
 */
const mapWeaponDamage = (
  row: HeirloomEntity,
): HeirloomWeaponDamage | undefined => {
  if (row.weaponDamage == null) return undefined;
  return {
    damage: row.weaponDamage,
    damageType: row.weaponDamageType ?? '',
    versatileDamage: orUndef(row.versatileDamage),
  };
};

/**
 * Maps the Charges embed to a domain `HeirloomCharges`.
 *
 * @param {HeirloomEntity} row - Heirloom entity row
 * @returns {HeirloomCharges | undefined} Charges or undefined
 */
const mapCharges = (row: HeirloomEntity): HeirloomCharges | undefined => {
  const c = row.charges;
  const hasData = c.initial != null || c.recharge != null || c.depletes != null;
  if (!hasData) return undefined;
  return {
    initial: orUndef(c.initial),
    recharge: orUndef(c.recharge),
    depletes: c.depletes ?? false,
  };
};

/* ─────────────────────────────  Row mapper  ──────────────────────────── */

/**
 * Maps a MikroORM `Heirloom` entity to a typed `HeirloomMetadata` domain object.
 *
 * @param {HeirloomEntity} row - MikroORM entity row
 * @returns {HeirloomMetadata} Domain model
 */
const rowToHeirloom = (row: HeirloomEntity): HeirloomMetadata => ({
  slug: row.slug,
  title: row.title,
  file: row.file,
  link: row.link,
  rarity: orUndef(row.rarity),
  itemType: orUndef(row.itemType),
  weaponType: orUndef(row.weaponType),
  requiresAttunement: row.requiresAttunement ?? false,
  attunementRequirements: orUndef(row.attunementRequirements),
  weaponDamage: mapWeaponDamage(row),
  hitModifier: orUndef(row.hitModifier),
  range: orUndef(row.range),
  weight: orUndef(row.weight),
  charges: mapCharges(row),
  mastery: nonEmpty(row.mastery),
  weaponProperties: nonEmpty(row.weaponProperties),
  damageTypesDealt: nonEmpty(row.damageTypesDealt),
  savingThrowTypes: nonEmpty(row.savingThrowTypes),
  tags: nonEmpty(row.tags),
  description: orUndef(row.description),
  indexVersion: orUndef(row.indexVersion),
});

/* ──────────────────────────────  Repository  ─────────────────────────── */

/**
 * MikroORM-backed heirloom repository.
 */
export const pgHeirloomRepository: HeirloomRepository = {
  list: async (locale: string): Promise<HeirloomMetadata[]> => {
    try {
      const em = await getEM();
      const rows = await em.find(
        HeirloomEntity,
        { locale },
        { orderBy: { slug: 'asc' } },
      );
      return rows.map(rowToHeirloom);
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
      const em = await getEM();
      const row = await em.findOne(HeirloomEntity, { locale, slug });
      return row ? rowToHeirloom(row) : null;
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
