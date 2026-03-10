/**
 * @fileoverview MongoDB Trinket Repository (Prisma)
 * @description Implements `TrinketRepository` via Prisma ORM against the
 * `trinkets` MongoDB collection. Maps documents to the same domain types
 * used by the PostgreSQL adapter, preserving interface compatibility.
 *
 * @module lib/db/content/adapters/mongo/mongoTrinketRepository
 * @version 1.0.0
 * @author Typeir
 * @since 4.0.0
 */

import type { Trinket } from '@/lib/db/prisma/generated/mongo';
import { mongoPrisma } from '@/lib/db/prisma/mongoClient';
import { logger } from '@/lib/logging/logger';
import type { TrinketRepository } from '../../repositories/trinketRepository';
import type { TrinketMetadata } from '../../schemas/trinketMetadata';
import { nonEmpty, orUndef } from '../pg/rowParsers';

const log = logger.child({ module: 'MongoTrinketRepo' });

/* ─────────────────────────────  Doc mapper  ──────────────────────────── */

/**
 * Maps a Prisma MongoDB `Trinket` document to a `TrinketMetadata` domain object.
 *
 * @param {Trinket} doc - Prisma trinket document
 * @returns {TrinketMetadata} Domain model
 */
const docToTrinket = (doc: Trinket): TrinketMetadata => ({
  slug: doc.slug,
  title: doc.title,
  file: doc.file,
  link: doc.link,
  itemType: doc.itemType,
  damage: orUndef(doc.damage),
  damageType: orUndef(doc.damageType),
  range: orUndef(doc.range),
  weight: orUndef(doc.weight),
  savingThrowDC: orUndef(doc.savingThrowDc),
  savingThrowAbility: orUndef(doc.savingThrowAbility),
  properties: nonEmpty(doc.properties),
  specialEffects: nonEmpty(doc.specialEffects),
  inflictsConditions: nonEmpty(doc.inflictsConditions),
  tags: nonEmpty(doc.tags),
});

/* ──────────────────────────────  Repository  ─────────────────────────── */

/**
 * Prisma-backed trinket repository for MongoDB.
 *
 * Queries the `trinkets` collection via the shared MongoDB Prisma client.
 */
export const mongoTrinketRepository: TrinketRepository = {
  list: async (locale: string): Promise<TrinketMetadata[]> => {
    try {
      const docs = await mongoPrisma.trinket.findMany({
        where: { locale },
        orderBy: { slug: 'asc' },
      });
      return docs.map(docToTrinket);
    } catch (error) {
      log.error('Error reading trinket metadata from MongoDB', {
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
      const doc = await mongoPrisma.trinket.findUnique({
        where: { locale_slug: { locale, slug } },
      });
      return doc ? docToTrinket(doc) : null;
    } catch (error) {
      log.error('Error reading single trinket from MongoDB', {
        error: error instanceof Error ? error.message : String(error),
        locale,
        slug,
      });
      return null;
    }
  },
};
