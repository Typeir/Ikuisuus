/**
 * @fileoverview PostgreSQL Feat Repository (MikroORM)
 * @description Implements `FeatRepository` via MikroORM against the `feats`
 * table. The optional ability-score increase is stored as flat prefixed columns
 * via `FeatAbilityIncreaseEmbed`; no JSONB is used.
 *
 * @module lib/db/content/adapters/pg/pgFeatRepository
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { FeatEntity } from '@/lib/db/orm/entities/FeatEntity';
import { nonEmpty, orUndef } from '@/lib/db/orm/helpers';
import type { FeatRepository } from '../../repositories/featRepository';
import type {
  FeatAbilityIncrease,
  FeatMetadata,
} from '../../schemas/featMetadata';
import { PgMetadataRepository } from './PgMetadataRepository';

/* ──────────────────────────────  Row mapper  ─────────────────────────── */

/**
 * Converts the nullable `FeatAbilityIncreaseEmbed` value object to its domain
 * shape. Returns `undefined` when the embed is absent or when the abilities
 * array is empty.
 *
 * @param {FeatEntity['abilityIncrease']} embed - Loaded embedded VO
 * @returns {FeatAbilityIncrease | undefined} Domain model or undefined
 */
const buildAbilityIncrease = (
  embed: FeatEntity['abilityIncrease'],
): FeatAbilityIncrease | undefined => {
  if (!embed) return undefined;
  const abilities = nonEmpty(embed.abilities ?? []);
  if (!abilities || embed.amount == null) return undefined;
  return {
    abilities,
    amount: embed.amount,
    maximum: orUndef(embed.maximum),
  };
};

/**
 * Maps a MikroORM `FeatEntity` to a `FeatMetadata` domain object.
 *
 * @param {FeatEntity} row - MikroORM feat entity
 * @returns {FeatMetadata} Domain model
 */
const rowToFeat = (row: FeatEntity): FeatMetadata => ({
  slug: row.slug,
  title: row.title,
  file: row.file,
  link: row.link,
  description: orUndef(row.description),
  prerequisite: orUndef(row.prerequisite),
  hasPrerequisite: row.hasPrerequisite,
  abilityIncrease: buildAbilityIncrease(row.abilityIncrease),
  tags: nonEmpty(row.tags) ?? [],
  indexVersion: orUndef(row.indexVersion),
});

/* ──────────────────────────────  Repository  ─────────────────────────── */

/**
 * MikroORM-backed feat repository.
 *
 * @class PgFeatRepository
 * @extends {PgMetadataRepository<FeatEntity, FeatMetadata>}
 * @implements {FeatRepository}
 */
class PgFeatRepository
  extends PgMetadataRepository<FeatEntity, FeatMetadata>
  implements FeatRepository
{
  protected readonly entityClass = FeatEntity;

  protected override orderBy(): Record<string, 'asc' | 'desc'> {
    return { title: 'asc' };
  }

  protected override toMetadata(row: FeatEntity): FeatMetadata {
    return rowToFeat(row);
  }
}

/** @type {FeatRepository} */
export const pgFeatRepository: FeatRepository = new PgFeatRepository();
