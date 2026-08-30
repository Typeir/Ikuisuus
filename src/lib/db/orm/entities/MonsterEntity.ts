/**
 * @fileoverview MikroORM Entity — Monster
 * @description Entity for the `monsters` table with embedded value objects.
 *
 * @module lib/db/orm/entities/MonsterEntity
 * @version 4.0.0
 * @author Typeir
 * @since 5.0.0
 */

import type { ChildSyncContext } from '@/lib/db/orm/childSync';
import {
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

import {
  MonsterACEmbed,
  MonsterHPEmbed,
  MonsterSaveEmbed,
  MonsterScoreEmbed,
  MonsterSenseEmbed,
  MonsterSpeedEmbed,
} from './MonsterEmbeds';

export * from './MonsterEmbeds';

/* ────────────────────────────  Entity  ─────────────────────────────── */

/**
 * Single monster stat block. Multiple variants share slug, differ in subSlug.
 */
@OrmEntity('MonsterEntity', { tableName: 'monsters' })
@OrmUnique({ properties: ['locale', 'slug', 'subSlug'] })
@OrmIndex({ properties: ['locale', 'slug'], name: 'monsters_locale_slug_idx' })
@OrmIndex({ properties: ['locale', 'cr'], name: 'monsters_locale_cr_idx' })
@OrmIndex({
  properties: ['locale', 'creatureType'],
  name: 'monsters_locale_type_idx',
})
export class MonsterEntity {
  @OrmPrimaryKey({ type: 'number', autoincrement: true })
  id!: number;

  @OrmProperty({ type: 'string' })
  locale!: string;

  @OrmProperty({ type: 'string' })
  slug!: string;

  @OrmProperty({ type: 'string', fieldName: 'sub_slug', nullable: true })
  subSlug?: string | null;

  /** @property {string | null} kind - `object` for quoted object statlets; null for creatures */
  @OrmProperty({ type: 'string', nullable: true })
  kind?: string | null;

  /** @property {number | null} damageThreshold - Object damage threshold */
  @OrmProperty({
    type: 'number',
    columnType: 'smallint',
    fieldName: 'damage_threshold',
    nullable: true,
  })
  damageThreshold?: number | null;

  @OrmProperty({ type: 'string' })
  title!: string;

  @OrmProperty({ type: 'string' })
  file!: string;

  @OrmProperty({ type: 'string' })
  link!: string;

  @OrmProperty({ type: 'string', nullable: true })
  size?: string | null;

  @OrmProperty({ type: 'string', fieldName: 'creature_type', nullable: true })
  creatureType?: string | null;

  @OrmProperty({ type: 'string', nullable: true })
  alignment?: string | null;

  @OrmProperty({ type: 'string', nullable: true })
  cr?: string | null;

  @OrmProperty({
    type: 'number',
    fieldName: 'tier_bonus',
    columnType: 'smallint',
    nullable: true,
  })
  tierBonus?: number | null;

  @OrmEmbedded({ entity: 'MonsterACEmbed', prefix: 'ac_', object: false })
  ac = new MonsterACEmbed();

  @OrmEmbedded({ entity: 'MonsterHPEmbed', prefix: 'hp_', object: false })
  hp = new MonsterHPEmbed();

  @OrmEmbedded({ entity: 'MonsterSpeedEmbed', prefix: 'speed_', object: false })
  speed = new MonsterSpeedEmbed();

  @OrmEmbedded({ entity: 'MonsterScoreEmbed', prefix: 'score_', object: false })
  scores = new MonsterScoreEmbed();

  @OrmEmbedded({ entity: 'MonsterSaveEmbed', prefix: 'save_', object: false })
  saves = new MonsterSaveEmbed();

  @OrmEmbedded({ entity: 'MonsterSenseEmbed', prefix: 'sense_', object: false })
  senses = new MonsterSenseEmbed();

  @OrmProperty({ type: 'string[]' })
  skills: string[] = [];

  @OrmProperty({ fieldName: 'damage_resistances', type: 'string[]' })
  damageResistances: string[] = [];

  @OrmProperty({ fieldName: 'damage_immunities', type: 'string[]' })
  damageImmunities: string[] = [];

  @OrmProperty({ fieldName: 'damage_vulnerabilities', type: 'string[]' })
  damageVulnerabilities: string[] = [];

  @OrmProperty({ fieldName: 'condition_immunities', type: 'string[]' })
  conditionImmunities: string[] = [];

  @OrmProperty({ type: 'string[]' })
  languages: string[] = [];

  @OrmProperty({ type: 'string[]' })
  tags: string[] = [];

  @OrmProperty({ type: 'string[]' })
  produces: string[] = [];

  @OrmProperty({ type: 'string[]' })
  consumes: string[] = [];

  @OrmProperty({ type: 'string[]' })
  consumers: string[] = [];

  /** @property {string | null} image - Image path */
  @OrmProperty({ type: 'string', nullable: true })
  image?: string | null;

  /** @property {string | null} description - Lore description */
  @OrmProperty({ type: 'text', nullable: true })
  description?: string | null;

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

  /** @property {Collection<MonsterFeatureEntity>} features - Feature shards */
  @OrmOneToMany({
    entity: 'MonsterFeatureEntity',
    mappedBy: 'monster',
    orphanRemoval: true,
  })
  features = new Collection<MonsterFeatureEntity>(this);

  /**
   * Creates the feature shard rows for a monster record.
   *
   * @param {ChildSyncContext} ctx - Child sync operations
   * @param {unknown} parent - Owning monster row
   * @param {Record<string, unknown>} record - Monster metadata record
   * @returns {void}
   */
  static syncChildren(
    ctx: ChildSyncContext,
    parent: unknown,
    record: Record<string, unknown>,
  ): void {
    const monster = parent as MonsterEntity;
    const features = (record.features ?? []) as Array<Record<string, unknown>>;

    features.forEach((feature, index) => {
      const source = (feature.source ?? {}) as Record<string, unknown>;

      ctx.create(MonsterFeatureEntity, {
        ...ctx.init(MonsterFeatureEntity, feature),
        monster,
        featureId: feature.id as string,
        sortOrder: index,
        startLine: source.start as number | undefined,
        endLine: source.end as number | undefined,
      });
    });
  }
}

/* ─────────────────────────  Child Entity  ──────────────────────────── */

/**
 * MikroORM entity for the `monster_features` child table.
 * One row per feature shard in a stat block.
 */
@OrmEntity('MonsterFeatureEntity', { tableName: 'monster_features' })
export class MonsterFeatureEntity {
  @OrmPrimaryKey({ type: 'number', autoincrement: true })
  id!: number;

  @OrmManyToOne({
    entity: 'MonsterEntity',
    fieldName: 'monster_id',
    deleteRule: 'cascade',
  })
  monster!: MonsterEntity;

  /** @property {string} featureId - Shard identifier, e.g. `mucklord/garbage-communion` */
  @OrmProperty({ type: 'string', fieldName: 'feature_id' })
  featureId!: string;

  /** @property {string | null} anchor - Anchor slug of the rendered heading */
  @OrmProperty({ type: 'string', nullable: true })
  anchor?: string | null;

  @OrmProperty({ type: 'string' })
  name!: string;

  /** @property {string | null} heading - Rendered heading text */
  @OrmProperty({ type: 'string', nullable: true })
  heading?: string | null;

  /** @property {string | null} trigger - `passive`, `action` or `reaction` */
  @OrmProperty({ type: 'string', nullable: true })
  trigger?: string | null;

  @OrmProperty({
    type: 'number',
    fieldName: 'sort_order',
    columnType: 'smallint',
  })
  sortOrder!: number;

  @OrmProperty({ type: 'string[]' })
  tags: string[] = [];

  /** @property {number | null} startLine - Start line of this feature's block in the source MDX */
  @OrmProperty({
    type: 'number',
    fieldName: 'start_line',
    columnType: 'smallint',
    nullable: true,
  })
  startLine?: number | null;

  /** @property {number | null} endLine - Exclusive end line of this feature's block in the source MDX */
  @OrmProperty({
    type: 'number',
    fieldName: 'end_line',
    columnType: 'smallint',
    nullable: true,
  })
  endLine?: number | null;
}
