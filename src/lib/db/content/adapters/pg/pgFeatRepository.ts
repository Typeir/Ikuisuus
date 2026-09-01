/**
 * @fileoverview PostgreSQL Feat Repository (MikroORM)
 * @description Implements `FeatRepository` via MikroORM against the `feats`
 * and `feat_features` tables. The optional ability-score increase is stored as
 * flat prefixed columns via `FeatAbilityIncreaseEmbed`. Named mechanics are
 * loaded via the `features` OneToMany relation.
 *
 * @module lib/db/content/adapters/pg/pgFeatRepository
 * @version 1.1.0
 * @author Typeir
 * @since 1.0.0
 */

import 'server-only';

import {
    FeatEntity,
    FeatFeatureEntity,
} from '@/lib/db/orm/entities/FeatEntity';
import { nonEmpty, orUndef } from '@/lib/db/orm/helpers';
import type { FeatRepository } from '../../repositories/featRepository';
import type {
    FeatAbilityIncrease,
    FeatFeature,
    FeatMetadata,
} from '../../schemas/featMetadata';
import { PgMetadataRepository } from './PgMetadataRepository';

/* ──────────────────────────────  Row mapper  ─────────────────────────── */

/**
 * Maps a `FeatFeatureEntity` row to the `FeatFeature` domain type.
 *
 * @param {FeatFeatureEntity} f - Loaded feat feature entity
 * @returns {FeatFeature} Domain model
 */
const toFeatFeature = (f: FeatFeatureEntity): FeatFeature => ({
  name: f.name,
  anchor: f.anchor ?? undefined,
  startLine: f.startLine ?? undefined,
  endLine: f.endLine ?? undefined,
  tags: nonEmpty(f.tags) ?? [],
});

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
const rowToFeat = (row: FeatEntity): FeatMetadata => {
  const tags = nonEmpty(row.tags) ?? [];
  return {
    slug: row.slug,
    title: row.title,
    file: row.file,
    link: row.link,
    description: orUndef(row.description),
    prerequisite: orUndef(row.prerequisite),
    hasPrerequisite: row.hasPrerequisite,
    abilityIncrease: buildAbilityIncrease(row.abilityIncrease),
    features: row.features.isInitialized()
      ? row.features
          .getItems()
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map(toFeatFeature)
      : undefined,
    multiSelect: tags.includes('multi-select') || undefined,
    grants: nonEmpty(row.grants ?? []),
    tags,
    indexVersion: orUndef(row.indexVersion),
  };
};

/* ──────────────────────────────  Repository  ─────────────────────────── */

/** @property {string[]} populateFields - Relations to populate on every feat query. */
const populateFields = ['features'] as const;

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

  protected override populate(): string[] {
    return [...populateFields];
  }

  protected override orderBy(): Record<string, 'asc' | 'desc'> {
    return { title: 'asc' };
  }

  protected override toMetadata(row: FeatEntity): FeatMetadata {
    return rowToFeat(row);
  }
}

/** @type {FeatRepository} */
export const pgFeatRepository: FeatRepository = new PgFeatRepository();
