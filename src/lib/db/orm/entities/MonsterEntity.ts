/**
 * @fileoverview MikroORM Entity — Monster
 * @description Entity for the `monsters` table with embedded value objects.
 *
 * @module lib/db/orm/entities/MonsterEntity
 * @version 4.0.0
 * @author Typeir
 * @since 5.0.0
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

/* ─────────────────────────  Embeddable VOs  ─────────────────────────── */

/**
 * Armour class value object — maps to `ac_value`, `ac_notes`, `ac_raw`.
 */
@OrmEmbeddable('MonsterACEmbed')
export class MonsterACEmbed {
  @OrmProperty({ type: 'number', columnType: 'smallint', nullable: true })
  value?: number | null;

  @OrmProperty({ type: 'string', nullable: true })
  notes?: string | null;

  @OrmProperty({ type: 'string', nullable: true })
  raw?: string | null;
}

/**
 * Hit points value object — maps to `hp_average`, `hp_formula`, `hp_raw`.
 */
@OrmEmbeddable('MonsterHPEmbed')
export class MonsterHPEmbed {
  @OrmProperty({ type: 'number', columnType: 'smallint', nullable: true })
  average?: number | null;

  @OrmProperty({ type: 'string', nullable: true })
  formula?: string | null;

  @OrmProperty({ type: 'string', nullable: true })
  raw?: string | null;
}

/**
 * Speed value object — maps to `speed_raw`, `speed_walk`, `speed_fly`,
 * `speed_climb`, `speed_swim`, `speed_burrow`, `speed_hover`.
 */
@OrmEmbeddable('MonsterSpeedEmbed')
export class MonsterSpeedEmbed {
  @OrmProperty({ type: 'string', nullable: true })
  raw?: string | null;

  @OrmProperty({ type: 'number', columnType: 'smallint', nullable: true })
  walk?: number | null;

  @OrmProperty({ type: 'number', columnType: 'smallint', nullable: true })
  fly?: number | null;

  @OrmProperty({ type: 'number', columnType: 'smallint', nullable: true })
  climb?: number | null;

  @OrmProperty({ type: 'number', columnType: 'smallint', nullable: true })
  swim?: number | null;

  @OrmProperty({ type: 'number', columnType: 'smallint', nullable: true })
  burrow?: number | null;

  @OrmProperty({ type: 'boolean', nullable: true })
  hover?: boolean | null;
}

/**
 * Ability scores value object — maps to `score_str`, `score_dex`, etc.
 */
@OrmEmbeddable('MonsterScoreEmbed')
export class MonsterScoreEmbed {
  @OrmProperty({ type: 'number', columnType: 'smallint', nullable: true })
  str?: number | null;

  @OrmProperty({ type: 'number', columnType: 'smallint', nullable: true })
  dex?: number | null;

  @OrmProperty({ type: 'number', columnType: 'smallint', nullable: true })
  con?: number | null;

  @OrmProperty({ type: 'number', columnType: 'smallint', nullable: true })
  int?: number | null;

  @OrmProperty({ type: 'number', columnType: 'smallint', nullable: true })
  wis?: number | null;

  @OrmProperty({ type: 'number', columnType: 'smallint', nullable: true })
  cha?: number | null;
}

/**
 * Saving throw bonuses value object — maps to `save_str`, `save_dex`, etc.
 */
@OrmEmbeddable('MonsterSaveEmbed')
export class MonsterSaveEmbed {
  @OrmProperty({ type: 'number', columnType: 'smallint', nullable: true })
  str?: number | null;

  @OrmProperty({ type: 'number', columnType: 'smallint', nullable: true })
  dex?: number | null;

  @OrmProperty({ type: 'number', columnType: 'smallint', nullable: true })
  con?: number | null;

  @OrmProperty({ type: 'number', columnType: 'smallint', nullable: true })
  int?: number | null;

  @OrmProperty({ type: 'number', columnType: 'smallint', nullable: true })
  wis?: number | null;

  @OrmProperty({ type: 'number', columnType: 'smallint', nullable: true })
  cha?: number | null;
}

/**
 * Senses value object — maps to `sense_raw`, `sense_passive_perception`,
 * `sense_darkvision`, `sense_blindsight`, `sense_tremorsense`, `sense_truesight`.
 */
@OrmEmbeddable('MonsterSenseEmbed')
export class MonsterSenseEmbed {
  @OrmProperty({ type: 'string', nullable: true })
  raw?: string | null;

  @OrmProperty({
    type: 'number',
    fieldName: 'passive_perception',
    columnType: 'smallint',
    nullable: true,
  })
  passivePerception?: number | null;

  @OrmProperty({ type: 'number', columnType: 'smallint', nullable: true })
  darkvision?: number | null;

  @OrmProperty({ type: 'number', columnType: 'smallint', nullable: true })
  blindsight?: number | null;

  @OrmProperty({ type: 'number', columnType: 'smallint', nullable: true })
  tremorsense?: number | null;

  @OrmProperty({ type: 'number', columnType: 'smallint', nullable: true })
  truesight?: number | null;
}

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
