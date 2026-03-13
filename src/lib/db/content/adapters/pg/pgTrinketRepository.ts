/**
 * @fileoverview PostgreSQL Trinket Repository (MikroORM)
 * @description Implements `TrinketRepository` via MikroORM against the
 * `trinkets` table.
 *
 * @module lib/db/content/adapters/pg/pgTrinketRepository
 * @version 4.0.0
 * @author Typeir
 * @since 5.0.0
 */

import { TrinketEntity } from '@/lib/db/orm/entities/TrinketEntity';
import { nonEmpty, orUndef } from '@/lib/db/orm/helpers';
import { getEM } from '@/lib/db/orm/orm';
import { logger } from '@/lib/logging/logger';
import type { TrinketRepository } from '../../repositories/trinketRepository';
import type { TrinketMetadata } from '../../schemas/trinketMetadata';

const log = logger.child({ module: 'PGTrinketRepo' });

/* ──────────────────────────────  Row mapper  ─────────────────────────── */

/**
 * Maps a MikroORM `Trinket` entity to a `TrinketMetadata` domain object.
 *
 * @param {TrinketEntity} row - MikroORM trinket entity
 * @returns {TrinketMetadata} Domain model
 */
const rowToTrinket = (row: TrinketEntity): TrinketMetadata => ({
  slug: row.slug,
  title: row.title,
  file: row.file,
  link: row.link,
  itemType: row.itemType,
  damage: orUndef(row.damage),
  damageType: orUndef(row.damageType),
  properties: nonEmpty(row.properties),
  range: orUndef(row.range),
  weight: orUndef(row.weight),
  savingThrowDC: orUndef(row.savingThrow.dc),
  savingThrowAbility: orUndef(row.savingThrow.ability),
  specialEffects: nonEmpty(row.specialEffects),
  inflictsConditions: nonEmpty(row.inflictsConditions),
  tags: nonEmpty(row.tags),
});

/* ──────────────────────────────  Repository  ─────────────────────────── */

/**
 * MikroORM-backed trinket repository.
 */
export const pgTrinketRepository: TrinketRepository = {
  list: async (locale: string): Promise<TrinketMetadata[]> => {
    try {
      const em = await getEM();
      const rows = await em.find(
        TrinketEntity,
        { locale },
        { orderBy: { title: 'asc' } },
      );
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
      const em = await getEM();
      const row = await em.findOne(TrinketEntity, { locale, slug });
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
