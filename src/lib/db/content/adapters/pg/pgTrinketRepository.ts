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
import type { TrinketRepository } from '../../repositories/trinketRepository';
import type { TrinketMetadata } from '../../schemas/trinketMetadata';
import { PgMetadataRepository } from './PgMetadataRepository';

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
  savingThrow: {
    dc: orUndef(row.savingThrow.dc),
    ability: orUndef(row.savingThrow.ability),
  },
  specialEffects: nonEmpty(row.specialEffects),
  inflictsConditions: nonEmpty(row.inflictsConditions),
  tags: nonEmpty(row.tags),
  description: orUndef(row.description),
});

/* ──────────────────────────────  Repository  ─────────────────────────── */

/**
 * MikroORM-backed trinket repository.
 *
 * @class PgTrinketRepository
 * @extends {PgMetadataRepository<TrinketEntity, TrinketMetadata>}
 * @implements {TrinketRepository}
 */
class PgTrinketRepository
  extends PgMetadataRepository<TrinketEntity, TrinketMetadata>
  implements TrinketRepository
{
  protected readonly entityClass = TrinketEntity;

  protected override orderBy(): Record<string, 'asc' | 'desc'> {
    return { title: 'asc' };
  }

  protected override toMetadata(row: TrinketEntity): TrinketMetadata {
    return rowToTrinket(row);
  }
}

/** @type {TrinketRepository} */
export const pgTrinketRepository: TrinketRepository = new PgTrinketRepository();
