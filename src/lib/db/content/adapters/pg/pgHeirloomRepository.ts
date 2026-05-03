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
import type { HeirloomRepository } from '../../repositories/heirloomRepository';
import type {
    HeirloomCharges,
    HeirloomMetadata,
    HeirloomWeaponDamage,
} from '../../schemas/heirloomMetadata';
import { PgMetadataRepository } from './PgMetadataRepository';

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
 *
 * @class PgHeirloomRepository
 * @extends {PgMetadataRepository<HeirloomEntity, HeirloomMetadata>}
 * @implements {HeirloomRepository}
 */
class PgHeirloomRepository
  extends PgMetadataRepository<HeirloomEntity, HeirloomMetadata>
  implements HeirloomRepository
{
  protected readonly entityClass = HeirloomEntity;

  protected override orderBy(): Record<string, 'asc' | 'desc'> {
    return { slug: 'asc' };
  }

  protected override toMetadata(row: HeirloomEntity): HeirloomMetadata {
    return rowToHeirloom(row);
  }
}

/** @type {HeirloomRepository} */
export const pgHeirloomRepository: HeirloomRepository =
  new PgHeirloomRepository();
