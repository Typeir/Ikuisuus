/**
 * @fileoverview PostgreSQL World Repository (MikroORM)
 * @description Implements `WorldRepository` via MikroORM against the `world`
 * table.
 *
 * @module lib/db/content/adapters/pg/pgWorldRepository
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import 'server-only';

import { WorldEntity } from '@/lib/db/orm/entities/WorldEntity';
import { nonEmpty, orUndef } from '@/lib/db/orm/helpers';
import type { WorldRepository } from '../../repositories/worldRepository';
import type { WorldMetadata } from '../../schemas/worldMetadata';
import { PgMetadataRepository } from './PgMetadataRepository';

/* ──────────────────────────────  Row mapper  ─────────────────────────── */

/**
 * Maps a MikroORM `WorldEntity` row to the `WorldMetadata` domain object.
 *
 * @param {WorldEntity} row - MikroORM world entity
 * @returns {WorldMetadata} Domain model
 */
const rowToWorld = (row: WorldEntity): WorldMetadata => ({
  slug: row.slug,
  title: row.title,
  file: row.file,
  link: row.link,
  category: orUndef(row.category),
  tags: nonEmpty(row.tags),
  aliases: nonEmpty(row.aliases),
  relatedSlugs: nonEmpty(row.relatedSlugs),
  knowledgeTiers: nonEmpty(row.knowledgeTiers),
  produces: nonEmpty(row.produces),
  consumes: nonEmpty(row.consumes),
  consumers: nonEmpty(row.consumers),
  description: orUndef(row.description),
  readingTime: orUndef(row.readingTime),
  versionHash: orUndef(row.versionHash),
});

/* ──────────────────────────────  Repository  ─────────────────────────── */

/**
 * MikroORM-backed world repository.
 *
 * @class PgWorldRepository
 * @extends {PgMetadataRepository<WorldEntity, WorldMetadata>}
 * @implements {WorldRepository}
 */
class PgWorldRepository
  extends PgMetadataRepository<WorldEntity, WorldMetadata>
  implements WorldRepository
{
  protected readonly entityClass = WorldEntity;

  protected override orderBy(): Record<string, 'asc' | 'desc'> {
    return { title: 'asc' };
  }

  protected override toMetadata(row: WorldEntity): WorldMetadata {
    return rowToWorld(row);
  }
}

/** @type {WorldRepository} */
export const pgWorldRepository: WorldRepository = new PgWorldRepository();
