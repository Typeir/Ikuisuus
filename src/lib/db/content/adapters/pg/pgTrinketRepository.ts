/**
 * @fileoverview PostgreSQL Trinket Repository (Prisma)
 * @description Implements `TrinketRepository` via Prisma ORM against the
 * normalised `trinkets` table. Replaces raw `pg` SQL with type-safe Prisma
 * queries.
 *
 * @module lib/db/content/adapters/pg/pgTrinketRepository
 * @version 3.0.0
 * @author Typeir
 * @since 4.0.0
 */

import { prisma } from '@/lib/db/prisma/client';
import type { Trinket } from '@/lib/db/prisma/generated/sql';
import { logger } from '@/lib/logging/logger';
import type { TrinketRepository } from '../../repositories/trinketRepository';
import type { TrinketMetadata } from '../../schemas/trinketMetadata';
import { nonEmpty, orUndef } from './rowParsers';

const log = logger.child({ module: 'PGTrinketRepo' });

/* ─────────────────────────────  Row mapper  ──────────────────────────── */

/**
 * Maps a Prisma `Trinket` row to a typed `TrinketMetadata` domain object.
 *
 * @param {Trinket} row - Prisma trinket row
 * @returns {TrinketMetadata} Domain model
 */
const rowToTrinket = (row: Trinket): TrinketMetadata => ({
  slug: row.slug,
  title: row.title,
  file: row.file,
  link: row.link,
  itemType: row.itemType,
  damage: orUndef(row.damage),
  damageType: orUndef(row.damageType),
  range: orUndef(row.range),
  weight: orUndef(row.weight),
  savingThrowDC: orUndef(row.savingThrowDc),
  savingThrowAbility: orUndef(row.savingThrowAbility),
  properties: nonEmpty(row.properties),
  specialEffects: nonEmpty(row.specialEffects),
  inflictsConditions: nonEmpty(row.inflictsConditions),
  tags: nonEmpty(row.tags),
});

/* ──────────────────────────────  Repository  ─────────────────────────── */

/**
 * Prisma-backed trinket repository.
 *
 * Queries the `trinkets` table via the shared Prisma client.
 */
export const pgTrinketRepository: TrinketRepository = {
  list: async (locale: string): Promise<TrinketMetadata[]> => {
    try {
      const rows = await prisma.trinket.findMany({
        where: { locale },
        orderBy: { slug: 'asc' },
      });
      return rows.map(rowToTrinket);
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
      const row = await prisma.trinket.findUnique({
        where: { locale_slug: { locale, slug } },
      });
      return row ? rowToTrinket(row) : null;
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
