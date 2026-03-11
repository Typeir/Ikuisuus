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
  @Property({ columnType: 'smallint', nullable: true })
  value?: number | null;

  @Property({ nullable: true })
  notes?: string | null;

  @Property({ nullable: true })
  raw?: string | null;
}

/**
 * Hit points value object — maps to `hp_average`, `hp_formula`, `hp_raw`.
 */
@Embeddable()
export class MonsterHPEmbed {
  @Property({ columnType: 'smallint', nullable: true })
  average?: number | null;

  @Property({ nullable: true })
  formula?: string | null;

  @Property({ nullable: true })
  raw?: string | null;
}

/**
 * Speed value object — maps to `speed_raw`, `speed_walk`, `speed_fly`,
 * `speed_climb`, `speed_swim`, `speed_burrow`, `speed_hover`.
 */
@Embeddable()
export class MonsterSpeedEmbed {
  @Property({ nullable: true })
  raw?: string | null;

  @Property({ columnType: 'smallint', nullable: true })
  walk?: number | null;

  @Property({ columnType: 'smallint', nullable: true })
  fly?: number | null;

  @Property({ columnType: 'smallint', nullable: true })
  climb?: number | null;

  @Property({ columnType: 'smallint', nullable: true })
  swim?: number | null;

  @Property({ columnType: 'smallint', nullable: true })
  burrow?: number | null;

  @Property({ nullable: true })
  hover?: boolean | null;
}

/**
 * Ability scores value object — maps to `score_str`, `score_dex`, etc.
 */
@Embeddable()
export class MonsterScoreEmbed {
  @Property({ columnType: 'smallint', nullable: true })
  str?: number | null;

  @Property({ columnType: 'smallint', nullable: true })
  dex?: number | null;

  @Property({ columnType: 'smallint', nullable: true })
  con?: number | null;

  @Property({ columnType: 'smallint', nullable: true })
  int?: number | null;

  @Property({ columnType: 'smallint', nullable: true })
  wis?: number | null;

  @Property({ columnType: 'smallint', nullable: true })
  cha?: number | null;
}

/**
 * Saving throw bonuses value object — maps to `save_str`, `save_dex`, etc.
 */
@Embeddable()
export class MonsterSaveEmbed {
  @Property({ columnType: 'smallint', nullable: true })
  str?: number | null;

  @Property({ columnType: 'smallint', nullable: true })
  dex?: number | null;

  @Property({ columnType: 'smallint', nullable: true })
  con?: number | null;

  @Property({ columnType: 'smallint', nullable: true })
  int?: number | null;

  @Property({ columnType: 'smallint', nullable: true })
  wis?: number | null;

  @Property({ columnType: 'smallint', nullable: true })
  cha?: number | null;
}

/**
 * Senses value object — maps to `sense_raw`, `sense_passive_perception`,
 * `sense_darkvision`, `sense_blindsight`, `sense_tremorsense`, `sense_truesight`.
 */
@Embeddable()
export class MonsterSenseEmbed {
  @Property({ nullable: true })
  raw?: string | null;

  @Property({
    fieldName: 'passive_perception',
    columnType: 'smallint',
    nullable: true,
  })
  passivePerception?: number | null;

  @Property({ columnType: 'smallint', nullable: true })
  darkvision?: number | null;

  @Property({ columnType: 'smallint', nullable: true })
  blindsight?: number | null;

  @Property({ columnType: 'smallint', nullable: true })
  tremorsense?: number | null;

  @Property({ columnType: 'smallint', nullable: true })
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
  @PrimaryKey({ autoincrement: true })
  id!: number;

  @Property()
  locale!: string;

  @Property()
  slug!: string;

  @Property({ fieldName: 'sub_slug', nullable: true })
  subSlug?: string | null;

  @Property()
  title!: string;

  @Property()
  file!: string;

  @Property()
  link!: string;

  @Property({ nullable: true })
  size?: string | null;

  @Property({ fieldName: 'creature_type', nullable: true })
  creatureType?: string | null;

  @Property({ nullable: true })
  alignment?: string | null;

  @Property({ nullable: true })
  cr?: string | null;

  @Property({
    fieldName: 'proficiency_bonus',
    columnType: 'smallint',
    nullable: true,
  })
  proficiencyBonus?: number | null;

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

  @Property({
    fieldName: 'index_version',
    columnType: 'smallint',
    nullable: true,
  })
  indexVersion?: number | null;
}
