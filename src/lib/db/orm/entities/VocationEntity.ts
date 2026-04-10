/**
 * @fileoverview MikroORM Entity — Vocation
 * @description Decorator-based entity for the `vocations` table. Features are
 * stored in a child `vocation_features` table via OneToMany. Skill proficiencies
 * and optional spellcasting are stored as embedded value objects.
 *
 * @module lib/db/orm/entities/VocationEntity
 * @version 1.0.0
 * @author Typeir
 * @since 7.0.0
 */

import {
    Collection,
    Embeddable,
    Embedded,
    Entity,
    Index,
    ManyToOne,
    OneToMany,
    PrimaryKey,
    Property,
    Unique,
} from '@mikro-orm/core';

/* ─────────────────────────  Embeddable VOs  ─────────────────────────── */

/**
 * Skill proficiency grant — maps to `skill_count`, `skill_choices`.
 */
@Embeddable()
export class VocationSkillProficienciesEmbed {
  @Property({ type: 'number', columnType: 'smallint' })
  count!: number;

  @Property({ type: 'string[]' })
  choices: string[] = [];
}

/**
 * Spellcasting summary — maps to `spellcasting_ability`, `spellcasting_progression`.
 */
@Embeddable()
export class VocationSpellcastingEmbed {
  @Property({ type: 'string', nullable: true })
  ability?: string | null;

  @Property({ type: 'string', nullable: true })
  progression?: string | null;
}

/* ─────────────────────  Child Entity  ──────────────────────────────── */

/**
 * MikroORM entity for the `vocation_features` child table.
 */
@Entity({ tableName: 'vocation_features' })
export class VocationFeatureEntity {
  @PrimaryKey({ type: 'number', autoincrement: true })
  id!: number;

  @ManyToOne(() => VocationEntity, {
    fieldName: 'vocation_id',
    deleteRule: 'cascade',
  })
  vocation!: VocationEntity;

  @Property({ type: 'number', columnType: 'smallint' })
  level!: number;

  @Property({ type: 'string' })
  name!: string;

  @Property({ type: 'number', fieldName: 'sort_order', columnType: 'smallint' })
  sortOrder!: number;
}

/* ────────────────────────────  Entity  ─────────────────────────────── */

/**
 * MikroORM entity for the `vocations` table.
 */
@Entity({ tableName: 'vocations' })
@Unique({ properties: ['locale', 'slug'] })
@Index({
  properties: ['locale'],
  name: 'vocations_locale_idx',
})
export class VocationEntity {
  @PrimaryKey({ type: 'number', autoincrement: true })
  id!: number;

  @Property({ type: 'string' })
  locale!: string;

  @Property({ type: 'string' })
  slug!: string;

  @Property({ type: 'string' })
  title!: string;

  @Property({ type: 'string' })
  file!: string;

  @Property({ type: 'string' })
  link!: string;

  @Property({ type: 'string' })
  archetype!: string;

  @Property({ fieldName: 'primary_ability', type: 'string[]' })
  primaryAbility: string[] = [];

  @Property({ type: 'string', fieldName: 'hit_die' })
  hitDie!: string;

  @Property({ fieldName: 'saving_throws', type: 'string[]' })
  savingThrows: string[] = [];

  @Property({ fieldName: 'armor_proficiencies', type: 'string[]' })
  armorProficiencies: string[] = [];

  @Property({ fieldName: 'weapon_proficiencies', type: 'string[]' })
  weaponProficiencies: string[] = [];

  @Property({ fieldName: 'tool_proficiencies', type: 'string[]' })
  toolProficiencies: string[] = [];

  @Embedded(() => VocationSkillProficienciesEmbed, {
    prefix: 'skill_',
    object: false,
  })
  skillProficiencies = new VocationSkillProficienciesEmbed();

  @Embedded(() => VocationSpellcastingEmbed, {
    prefix: 'spellcasting_',
    object: false,
    nullable: true,
  })
  spellcasting?: VocationSpellcastingEmbed | null;

  @Property({ type: 'string[]' })
  specializations: string[] = [];

  @Property({ type: 'string[]' })
  tags: string[] = [];

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

  @OneToMany(() => VocationFeatureEntity, (f) => f.vocation, {
    orphanRemoval: true,
  })
  features = new Collection<VocationFeatureEntity>(this);
}
