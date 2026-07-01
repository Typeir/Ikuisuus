/**
 * @fileoverview MikroORM Entity — Monster
 * @description Decorator-based entity for the `monsters` table.
 * Uses `@Embedded` with `prefix` to group flat DB columns into value objects
 * (AC, HP, Speed, Scores, Saves, Senses) — the ORM handles prefix-based
 * column mapping automatically, eliminating manual field-by-field reconstruction.
 *
 * @module lib/db/orm/entities/MonsterEntity
 * @version 4.0.0
 * @author Typeir
 * @since 5.0.0
 */

import {
  Embeddable,
  Embedded,
  Entity,
  Index,
  PrimaryKey,
  Property,
  Unique,
} from '@mikro-orm/core';

/* ─────────────────────────  Embeddable VOs  ─────────────────────────── */

/**
 * Armour class value object — maps to `ac_value`, `ac_notes`, `ac_raw`.
 */
@Embeddable()
export class MonsterACEmbed {
  @Property({ type: 'number', columnType: 'smallint', nullable: true })
  value?: number | null;

  @Property({ type: 'string', nullable: true })
  notes?: string | null;

  @Property({ type: 'string', nullable: true })
  raw?: string | null;
}

/**
 * Hit points value object — maps to `hp_average`, `hp_formula`, `hp_raw`.
 */
@Embeddable()
export class MonsterHPEmbed {
  @Property({ type: 'number', columnType: 'smallint', nullable: true })
  average?: number | null;

  @Property({ type: 'string', nullable: true })
  formula?: string | null;

  @Property({ type: 'string', nullable: true })
  raw?: string | null;
}

/**
 * Speed value object — maps to `speed_raw`, `speed_walk`, `speed_fly`,
 * `speed_climb`, `speed_swim`, `speed_burrow`, `speed_hover`.
 */
@Embeddable()
export class MonsterSpeedEmbed {
  @Property({ type: 'string', nullable: true })
  raw?: string | null;

  @Property({ type: 'number', columnType: 'smallint', nullable: true })
  walk?: number | null;

  @Property({ type: 'number', columnType: 'smallint', nullable: true })
  fly?: number | null;

  @Property({ type: 'number', columnType: 'smallint', nullable: true })
  climb?: number | null;

  @Property({ type: 'number', columnType: 'smallint', nullable: true })
  swim?: number | null;

  @Property({ type: 'number', columnType: 'smallint', nullable: true })
  burrow?: number | null;

  @Property({ type: 'boolean', nullable: true })
  hover?: boolean | null;
}

/**
 * Ability scores value object — maps to `score_str`, `score_dex`, etc.
 */
@Embeddable()
export class MonsterScoreEmbed {
  @Property({ type: 'number', columnType: 'smallint', nullable: true })
  str?: number | null;

  @Property({ type: 'number', columnType: 'smallint', nullable: true })
  dex?: number | null;

  @Property({ type: 'number', columnType: 'smallint', nullable: true })
  con?: number | null;

  @Property({ type: 'number', columnType: 'smallint', nullable: true })
  int?: number | null;

  @Property({ type: 'number', columnType: 'smallint', nullable: true })
  wis?: number | null;

  @Property({ type: 'number', columnType: 'smallint', nullable: true })
  cha?: number | null;
}

/**
 * Saving throw bonuses value object — maps to `save_str`, `save_dex`, etc.
 */
@Embeddable()
export class MonsterSaveEmbed {
  @Property({ type: 'number', columnType: 'smallint', nullable: true })
  str?: number | null;

  @Property({ type: 'number', columnType: 'smallint', nullable: true })
  dex?: number | null;

  @Property({ type: 'number', columnType: 'smallint', nullable: true })
  con?: number | null;

  @Property({ type: 'number', columnType: 'smallint', nullable: true })
  int?: number | null;

  @Property({ type: 'number', columnType: 'smallint', nullable: true })
  wis?: number | null;

  @Property({ type: 'number', columnType: 'smallint', nullable: true })
  cha?: number | null;
}

/**
 * Senses value object — maps to `sense_raw`, `sense_passive_perception`,
 * `sense_darkvision`, `sense_blindsight`, `sense_tremorsense`, `sense_truesight`.
 */
@Embeddable()
export class MonsterSenseEmbed {
  @Property({ type: 'string', nullable: true })
  raw?: string | null;

  @Property({
    type: 'number',
    fieldName: 'passive_perception',
    columnType: 'smallint',
    nullable: true,
  })
  passivePerception?: number | null;

  @Property({ type: 'number', columnType: 'smallint', nullable: true })
  darkvision?: number | null;

  @Property({ type: 'number', columnType: 'smallint', nullable: true })
  blindsight?: number | null;

  @Property({ type: 'number', columnType: 'smallint', nullable: true })
  tremorsense?: number | null;

  @Property({ type: 'number', columnType: 'smallint', nullable: true })
  truesight?: number | null;
}

/* ────────────────────────────  Entity  ─────────────────────────────── */

/**
 * MikroORM entity for the `monsters` table.
 * Each row represents a single monster stat block; files containing multiple
 * variants produce multiple rows sharing the same `slug` but differing `subSlug`.
 */
@Entity({ tableName: 'monsters' })
@Unique({ properties: ['locale', 'slug', 'subSlug'] })
@Index({ properties: ['locale', 'slug'], name: 'monsters_locale_slug_idx' })
@Index({ properties: ['locale', 'cr'], name: 'monsters_locale_cr_idx' })
@Index({
  properties: ['locale', 'creatureType'],
  name: 'monsters_locale_type_idx',
})
export class MonsterEntity {
  @PrimaryKey({ type: 'number', autoincrement: true })
  id!: number;

  @Property({ type: 'string' })
  locale!: string;

  @Property({ type: 'string' })
  slug!: string;

  @Property({ type: 'string', fieldName: 'sub_slug', nullable: true })
  subSlug?: string | null;

  @Property({ type: 'string' })
  title!: string;

  @Property({ type: 'string' })
  file!: string;

  @Property({ type: 'string' })
  link!: string;

  @Property({ type: 'string', nullable: true })
  size?: string | null;

  @Property({ type: 'string', fieldName: 'creature_type', nullable: true })
  creatureType?: string | null;

  @Property({ type: 'string', nullable: true })
  alignment?: string | null;

  @Property({ type: 'string', nullable: true })
  cr?: string | null;

  @Property({
    type: 'number',
    fieldName: 'tier_bonus',
    columnType: 'smallint',
    nullable: true,
  })
  tierBonus?: number | null;

  @Embedded(() => MonsterACEmbed, { prefix: 'ac_', object: false })
  ac = new MonsterACEmbed();

  @Embedded(() => MonsterHPEmbed, { prefix: 'hp_', object: false })
  hp = new MonsterHPEmbed();

  @Embedded(() => MonsterSpeedEmbed, { prefix: 'speed_', object: false })
  speed = new MonsterSpeedEmbed();

  @Embedded(() => MonsterScoreEmbed, { prefix: 'score_', object: false })
  scores = new MonsterScoreEmbed();

  @Embedded(() => MonsterSaveEmbed, { prefix: 'save_', object: false })
  saves = new MonsterSaveEmbed();

  @Embedded(() => MonsterSenseEmbed, { prefix: 'sense_', object: false })
  senses = new MonsterSenseEmbed();

  @Property({ type: 'string[]' })
  skills: string[] = [];

  @Property({ fieldName: 'damage_resistances', type: 'string[]' })
  damageResistances: string[] = [];

  @Property({ fieldName: 'damage_immunities', type: 'string[]' })
  damageImmunities: string[] = [];

  @Property({ fieldName: 'damage_vulnerabilities', type: 'string[]' })
  damageVulnerabilities: string[] = [];

  @Property({ fieldName: 'condition_immunities', type: 'string[]' })
  conditionImmunities: string[] = [];

  @Property({ type: 'string[]' })
  languages: string[] = [];

  @Property({ type: 'string[]' })
  tags: string[] = [];

  /** @property {string | null} image - Image path extracted from BlendedImage in MDX */
  @Property({ type: 'string', nullable: true })
  image?: string | null;

  /** @property {string | null} description - Lore description extracted from the stat block MDX */
  @Property({ type: 'text', nullable: true })
  description?: string | null;

  @Property({
    type: 'number',
    fieldName: 'index_version',
    columnType: 'smallint',
    nullable: true,
  })
  indexVersion?: number | null;

  /** @property {string | null} versionHash - FNV-1a content hash for incremental sync */
  @Property({ type: 'string', fieldName: 'version_hash', nullable: true })
  versionHash?: string | null;
}
