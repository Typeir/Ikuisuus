/**
 * @fileoverview MongoDB Heirloom Repository (Prisma)
 * @description Implements `HeirloomRepository` via Prisma ORM against the
 * `heirlooms` MongoDB collection. Weapon damage fields are reconstructed
 * from flattened document fields, matching the PostgreSQL adapter contract.
 *
 * @module lib/db/content/adapters/mongo/mongoHeirloomRepository
 * @version 1.0.0
 * @author Typeir
 * @since 4.0.0
 */

import type { Heirloom } from '@/lib/db/prisma/generated/mongo';
import { mongoPrisma } from '@/lib/db/prisma/mongoClient';
import { logger } from '@/lib/logging/logger';
import type { HeirloomRepository } from '../../repositories/heirloomRepository';
import type {
    HeirloomCharges,
    HeirloomMetadata,
    HeirloomWeaponDamage,
} from '../../schemas/heirloomMetadata';
import { nonEmpty, orUndef } from '../pg/rowParsers';

const log = logger.child({ module: 'MongoHeirloomRepo' });

/* ─────────────────────  Sub-object builders  ─────────────────────────── */

/**
 * Builds weapon damage info from flat document fields.
 *
 * @param {Heirloom} doc - Prisma heirloom document
 * @returns {HeirloomWeaponDamage | undefined} Weapon damage or undefined
 */
const buildWeaponDamage = (doc: Heirloom): HeirloomWeaponDamage | undefined => {
  if (doc.weaponDamage == null) return undefined;
  return {
    damage: doc.weaponDamage,
    damageType: doc.weaponDamageType ?? '',
    versatileDamage: orUndef(doc.versatileDamage),
  };
};

/**
 * Builds charge economy info from flat document fields.
 *
 * @param {Heirloom} doc - Prisma heirloom document
 * @returns {HeirloomCharges | undefined} Charges or undefined
 */
const buildCharges = (doc: Heirloom): HeirloomCharges | undefined => {
  const hasData =
    doc.chargesInitial != null ||
    doc.chargesRecharge != null ||
    doc.chargesDepletes != null;
  if (!hasData) return undefined;
  return {
    initial: orUndef(doc.chargesInitial),
    recharge: orUndef(doc.chargesRecharge),
    depletes: doc.chargesDepletes ?? false,
  };
};

/* ─────────────────────────────  Doc mapper  ──────────────────────────── */

/**
 * Maps a Prisma MongoDB `Heirloom` document to a `HeirloomMetadata` domain object.
 *
 * @param {Heirloom} doc - Prisma heirloom document
 * @returns {HeirloomMetadata} Domain model
 */
const docToHeirloom = (doc: Heirloom): HeirloomMetadata => ({
  slug: doc.slug,
  title: doc.title,
  file: doc.file,
  link: doc.link,
  rarity: orUndef(doc.rarity),
  itemType: orUndef(doc.itemType),
  weaponType: orUndef(doc.weaponType),
  requiresAttunement: doc.requiresAttunement ?? false,
  attunementRequirements: orUndef(doc.attunementRequirements),
  weaponDamage: buildWeaponDamage(doc),
  hitModifier: orUndef(doc.hitModifier),
  range: orUndef(doc.range),
  weight: orUndef(doc.weight),
  charges: buildCharges(doc),
  mastery: nonEmpty(doc.mastery),
  weaponProperties: nonEmpty(doc.weaponProperties),
  damageTypesDealt: nonEmpty(doc.damageTypesDealt),
  savingThrowTypes: nonEmpty(doc.savingThrowTypes),
  tags: nonEmpty(doc.tags),
  indexVersion: orUndef(doc.indexVersion),
});

/* ──────────────────────────────  Repository  ─────────────────────────── */

/**
 * Prisma-backed heirloom repository for MongoDB.
 *
 * Queries the `heirlooms` collection via the shared MongoDB Prisma client.
 */
export const mongoHeirloomRepository: HeirloomRepository = {
  list: async (locale: string): Promise<HeirloomMetadata[]> => {
    try {
      const docs = await mongoPrisma.heirloom.findMany({
        where: { locale },
        orderBy: { slug: 'asc' },
      });
      return docs.map(docToHeirloom);
    } catch (error) {
      log.error('Error reading heirloom metadata from MongoDB', {
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
      const doc = await mongoPrisma.heirloom.findUnique({
        where: { locale_slug: { locale, slug } },
      });
      return doc ? docToHeirloom(doc) : null;
    } catch (error) {
      log.error('Error reading single heirloom from MongoDB', {
        error: error instanceof Error ? error.message : String(error),
        locale,
        slug,
      });
      return null;
    }
  },
};
