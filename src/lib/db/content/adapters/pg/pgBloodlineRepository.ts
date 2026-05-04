/**
 * @fileoverview PostgreSQL Bloodline Repository (MikroORM)
 * @description Implements `BloodlineRepository` via MikroORM against the
 * `bloodlines` and `bloodline_boons` tables.
 *
 * @module lib/db/content/adapters/pg/pgBloodlineRepository
 * @version 1.0.0
 * @author Typeir
 * @since 7.0.0
 */

import { BloodlineEntity } from '@/lib/db/orm/entities/BloodlineEntity';
import { nonEmpty, orUndef } from '@/lib/db/orm/helpers';
import type { BloodlineRepository } from '../../repositories/bloodlineRepository';
import type {
  BloodlineBoon,
  BloodlineMetadata,
} from '../../schemas/bloodlineMetadata';
import { PgMetadataRepository } from './PgMetadataRepository';

/* ──────────────────────────────  Row mapper  ─────────────────────────── */

/**
 * Maps a MikroORM `BloodlineEntity` (with populated boons) to a
 * `BloodlineMetadata` domain object.
 *
 * @param {BloodlineEntity} row - MikroORM bloodline entity with loaded boons
 * @returns {BloodlineMetadata} Domain model
 */
const rowToBloodline = (row: BloodlineEntity): BloodlineMetadata => {
  const boons: BloodlineBoon[] = row.boons
    .getItems()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((b) => ({
      name: b.name,
      bpLabel: b.bpLabel,
      bpValue: orUndef(b.bpValue),
      sortOrder: b.sortOrder,
      tags: b.tags,
    }));

  return {
    slug: row.slug,
    title: row.title,
    file: row.file,
    link: row.link,
    description: orUndef(row.description),
    abilityScores: row.abilityScores,
    movementSpeeds: row.movementSpeeds,
    senses: row.senses,
    size: row.size,
    creatureTypes: row.creatureTypes,
    age: orUndef(row.age),
    boonBudget: orUndef(row.boonBudget),
    boons,
    tags: nonEmpty(row.tags),
    indexVersion: orUndef(row.indexVersion),
  };
};

/* ──────────────────────────────  Repository  ─────────────────────────── */

/**
 * MikroORM-backed bloodline repository.
 *
 * @class PgBloodlineRepository
 * @extends {PgMetadataRepository<BloodlineEntity, BloodlineMetadata>}
 * @implements {BloodlineRepository}
 */
class PgBloodlineRepository
  extends PgMetadataRepository<BloodlineEntity, BloodlineMetadata>
  implements BloodlineRepository
{
  protected readonly entityClass = BloodlineEntity;

  protected override populate(): string[] {
    return ['boons'];
  }

  protected override orderBy(): Record<string, 'asc' | 'desc'> {
    return { title: 'asc' };
  }

  protected override toMetadata(row: BloodlineEntity): BloodlineMetadata {
    return rowToBloodline(row);
  }
}

/** @type {BloodlineRepository} */
export const pgBloodlineRepository: BloodlineRepository =
  new PgBloodlineRepository();
