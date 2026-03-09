/**
 * @fileoverview PostgreSQL Heirloom Repository (Prisma)
 * @description Implements `HeirloomRepository` via Prisma ORM against the
 * normalised `heirlooms` table. Replaces raw `pg` SQL with type-safe Prisma
 * queries. Weapon damage fields are reconstructed from flattened DB columns.
 *
 * @module lib/db/content/adapters/pg/pgHeirloomRepository
 * @version 3.0.0
 * @author Typeir
 * @since 4.0.0
 */

import { prisma } from '@/lib/db/prisma/client';
import type { Heirloom } from '@/lib/db/prisma/generated/sql';
import { logger } from '@/lib/logging/logger';
import type { HeirloomRepository } from '../../repositories/heirloomRepository';
import type {
  HeirloomCharges,
  HeirloomMetadata,
  HeirloomWeaponDamage,
} from '../../schemas/heirloomMetadata';
import { nonEmpty, orUndef } from './rowParsers';

const log = logger.child({ module: 'PGHeirloomRepo' });

/* ─────────────────────  Sub-object builders  ─────────────────────────── */

/**
 * Builds weapon damage info from flat row columns.
 * Returns `undefined` when the item has no weapon damage data.
 *
 * @param {Heirloom} row - Prisma heirloom row
 * @returns {HeirloomWeaponDamage | undefined} Weapon damage or undefined
 */
const buildWeaponDamage = (row: Heirloom): HeirloomWeaponDamage | undefined => {
  if (row.weaponDamage == null) return undefined;
  return {
    damage: row.weaponDamage,
    damageType: row.weaponDamageType ?? '',
    versatileDamage: orUndef(row.versatileDamage),
  };
};

/**
 * Builds charge economy info from flat row columns.
 * Returns `undefined` when no charge-related columns are populated.
 *
 * @param {Heirloom} row - Prisma heirloom row
 * @returns {HeirloomCharges | undefined} Charges or undefined
 */
const buildCharges = (row: Heirloom): HeirloomCharges | undefined => {
  const hasData =
    row.chargesInitial != null ||
    row.chargesRecharge != null ||
    row.chargesDepletes != null;
  if (!hasData) return undefined;
  return {
    initial: orUndef(row.chargesInitial),
    recharge: orUndef(row.chargesRecharge),
    depletes: row.chargesDepletes ?? false,
  };
};

/* ─────────────────────────────  Row mapper  ──────────────────────────── */

/**
 * Maps a Prisma `Heirloom` row to a typed `HeirloomMetadata` domain object.
 * Delegates nested sub-objects to dedicated builder functions.
 *
 * @param {Heirloom} row - Prisma heirloom row
 * @returns {HeirloomMetadata} Domain model
 */
const rowToHeirloom = (row: Heirloom): HeirloomMetadata => ({
  slug: row.slug,
  title: row.title,
  file: row.file,
  link: row.link,
  rarity: orUndef(row.rarity),
  itemType: orUndef(row.itemType),
  weaponType: orUndef(row.weaponType),
  requiresAttunement: row.requiresAttunement ?? false,
  attunementRequirements: orUndef(row.attunementRequirements),
  weaponDamage: buildWeaponDamage(row),
  hitModifier: orUndef(row.hitModifier),
  range: orUndef(row.range),
  weight: orUndef(row.weight),
  charges: buildCharges(row),
  mastery: nonEmpty(row.mastery),
  weaponProperties: nonEmpty(row.weaponProperties),
  damageTypesDealt: nonEmpty(row.damageTypesDealt),
  savingThrowTypes: nonEmpty(row.savingThrowTypes),
  tags: nonEmpty(row.tags),
  indexVersion: orUndef(row.indexVersion),
});

/* ──────────────────────────────  Repository  ─────────────────────────── */

/**
 * Prisma-backed heirloom repository.
 *
 * Queries the `heirlooms` table via the shared Prisma client.
 */
export const pgHeirloomRepository: HeirloomRepository = {
  list: async (locale: string): Promise<HeirloomMetadata[]> => {
    try {
      const rows = await prisma.heirloom.findMany({
        where: { locale },
        orderBy: { slug: 'asc' },
      });
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
      const row = await prisma.heirloom.findUnique({
        where: { locale_slug: { locale, slug } },
      });
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
