/**
 * @fileoverview MikroORM entity for the `feats` table.
 * @description Feat entity with embedded ability-increase VO and child feat_features.
 *
 * @module lib/db/orm/entities/FeatEntity
 * @version 1.1.0
 * @author Typeir
 * @since 1.0.0
 */

import {
    OrmEmbeddable,
    OrmEmbedded,
    OrmEntity,
    OrmIndex,
    OrmManyToOne,
    OrmOneToMany,
    OrmPrimaryKey,
    OrmProperty,
    OrmUnique,
} from '@/lib/db/orm/schema';
import { Collection } from '@mikro-orm/core';

/* ─────────────────────────  Embeddable VO  ─────────────────────────── */

/**
 * Optional ability-score increase value object. All fields nullable.
 */
@OrmEmbeddable('FeatAbilityIncreaseEmbed')
export class FeatAbilityIncreaseEmbed {
  @OrmProperty({ type: 'string[]', nullable: true })
  abilities?: string[] | null;

  @OrmProperty({
    type: 'number',
    columnType: 'smallint',
    nullable: true,
  })
  amount?: number | null;

  @OrmProperty({
    type: 'number',
    columnType: 'smallint',
    nullable: true,
  })
  maximum?: number | null;
}

/* ─────────────────────────  Child Entity  ──────────────────────────── */

/**
 * Named feat mechanic from MDX. Foreign-keyed to `feats.id`.
 */
@OrmEntity('FeatFeatureEntity', { tableName: 'feat_features' })
export class FeatFeatureEntity {
  @OrmPrimaryKey({ type: 'number', autoincrement: true })
  id!: number;

  @OrmManyToOne({
    entity: 'FeatEntity',
    fieldName: 'feat_id',
    deleteRule: 'cascade',
  })
  feat!: FeatEntity;

  /** @property {string | null} anchor - Anchor slug of the rendered heading */
  @OrmProperty({ type: 'string', nullable: true })
  anchor?: string | null;

  @OrmProperty({ type: 'string' })
  name!: string;

  @OrmProperty({ type: 'number', fieldName: 'sort_order', columnType: 'smallint' })
  sortOrder!: number;

  @OrmProperty({ type: 'string[]' })
  tags: string[] = [];

  /** @property {number | null} startLine - 1-indexed start line of this feature's bullet block in the source MDX */
  @OrmProperty({
    type: 'number',
    fieldName: 'start_line',
    columnType: 'smallint',
    nullable: true,
  })
  startLine?: number | null;

  /** @property {number | null} endLine - 1-indexed last line of this feature's bullet block in the source MDX */
  @OrmProperty({
    type: 'number',
    fieldName: 'end_line',
    columnType: 'smallint',
    nullable: true,
  })
  endLine?: number | null;
}

/* ────────────────────────────  Entity  ─────────────────────────────── */

/**
 * MikroORM entity for the `feats` table.
 */
@OrmEntity('FeatEntity', { tableName: 'feats' })
@OrmUnique({ properties: ['locale', 'slug'] })
@OrmIndex({
  properties: ['locale'],
  name: 'feats_locale_idx',
})
export class FeatEntity {
  @OrmPrimaryKey({ type: 'number', autoincrement: true })
  id!: number;

  @OrmProperty({ type: 'string' })
  locale!: string;

  @OrmProperty({ type: 'string' })
  slug!: string;

  @OrmProperty({ type: 'string' })
  title!: string;

  @OrmProperty({ type: 'string' })
  file!: string;

  @OrmProperty({ type: 'string' })
  link!: string;

  @OrmProperty({ type: 'text', nullable: true })
  description?: string | null;

  @OrmProperty({ type: 'string', nullable: true })
  image?: string | null;

  @OrmProperty({ type: 'string', nullable: true })
  prerequisite?: string | null;

  @OrmProperty({ type: 'boolean', fieldName: 'has_prerequisite' })
  hasPrerequisite!: boolean;

  @OrmEmbedded({
    entity: 'FeatAbilityIncreaseEmbed',
    prefix: 'ability_increase_',
    object: false,
    nullable: true,
  })
  abilityIncrease?: FeatAbilityIncreaseEmbed | null;

  @OrmProperty({ type: 'string[]' })
  tags: string[] = [];

  /** @property {string[] | null} grants - Tag-based proficiency grants when selected (e.g. `weapon:martial`, `skill:persuasion:expertise`) */
  @OrmProperty({ type: 'string[]', nullable: true })
  grants?: string[] | null;

  @OrmProperty({
    type: 'number',
    fieldName: 'index_version',
    columnType: 'smallint',
    nullable: true,
  })
  indexVersion?: number | null;

  /** @property {string | null} versionHash - FNV-1a content hash for incremental sync */
  @OrmProperty({ type: 'string', fieldName: 'version_hash', nullable: true })
  versionHash?: string | null;

  @OrmOneToMany({
    entity: 'FeatFeatureEntity',
    mappedBy: 'feat',
    orphanRemoval: true,
  })
  features = new Collection<FeatFeatureEntity>(this);
}
