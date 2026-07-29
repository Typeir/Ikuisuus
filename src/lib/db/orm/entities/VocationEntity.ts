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
 * Skill proficiency grant — maps to `skill_count`, `skill_choices`.
 */
@OrmEmbeddable('VocationSkillProficienciesEmbed')
export class VocationSkillProficienciesEmbed {
  @OrmProperty({ type: 'number', columnType: 'smallint' })
  count!: number;

  @OrmProperty({ type: 'string[]' })
  choices: string[] = [];
}

/**
 * Spellcasting summary — maps to `spellcasting_ability`, `spellcasting_progression`.
 */
@OrmEmbeddable('VocationSpellcastingEmbed')
export class VocationSpellcastingEmbed {
  @OrmProperty({ type: 'string', nullable: true })
  ability?: string | null;

  @OrmProperty({ type: 'string', nullable: true })
  progression?: string | null;
}

/* ─────────────────────  Child Entity  ──────────────────────────────── */

/**
 * MikroORM entity for the `vocation_features` child table.
 */
@OrmEntity('VocationFeatureEntity', { tableName: 'vocation_features' })
export class VocationFeatureEntity {
  @OrmPrimaryKey({ type: 'number', autoincrement: true })
  id!: number;

  @OrmManyToOne({
    entity: 'VocationEntity',
    fieldName: 'vocation_id',
    deleteRule: 'cascade',
  })
  vocation!: VocationEntity;

  @OrmProperty({ type: 'number', columnType: 'smallint' })
  level!: number;

  @OrmProperty({ type: 'string' })
  name!: string;

  @OrmProperty({ type: 'number', fieldName: 'sort_order', columnType: 'smallint' })
  sortOrder!: number;

  /** @property {number | null} startLine - 1-indexed start line of this feature's heading block in the source MDX */
  @OrmProperty({
    type: 'number',
    fieldName: 'start_line',
    columnType: 'smallint',
    nullable: true,
  })
  startLine?: number | null;

  /** @property {number | null} endLine - 1-indexed last line of this feature's heading block in the source MDX */
  @OrmProperty({
    type: 'number',
    fieldName: 'end_line',
    columnType: 'smallint',
    nullable: true,
  })
  endLine?: number | null;

  /** @property {string[] | null} grants - Tag-based proficiency grants this feature confers (e.g. `skill:arcana:expertise`, `armor:heavy`); null when it grants no automatic proficiency */
  @OrmProperty({ type: 'string[]', nullable: true })
  grants?: string[] | null;
}

/* ────────────────────────────  Entity  ─────────────────────────────── */

/**
 * MikroORM entity for the `vocations` table.
 */
@OrmEntity('VocationEntity', { tableName: 'vocations' })
@OrmUnique({ properties: ['locale', 'slug'] })
@OrmIndex({
  properties: ['locale'],
  name: 'vocations_locale_idx',
})
export class VocationEntity {
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

  @OrmProperty({ type: 'string' })
  archetype!: string;

  @OrmProperty({ fieldName: 'primary_ability', type: 'string[]' })
  primaryAbility: string[] = [];

  @OrmProperty({ type: 'integer', fieldName: 'hit_die' })
  hitDie!: number;

  @OrmProperty({ fieldName: 'saving_throws', type: 'string[]' })
  savingThrows: string[] = [];

  @OrmProperty({ fieldName: 'armor_proficiencies', type: 'string[]' })
  armorProficiencies: string[] = [];

  @OrmProperty({ fieldName: 'weapon_proficiencies', type: 'string[]' })
  weaponProficiencies: string[] = [];

  @OrmProperty({ fieldName: 'tool_proficiencies', type: 'string[]' })
  toolProficiencies: string[] = [];

  @OrmEmbedded({
    entity: 'VocationSkillProficienciesEmbed',
    prefix: 'skill_',
    object: false,
  })
  skillProficiencies = new VocationSkillProficienciesEmbed();

  @OrmEmbedded({
    entity: 'VocationSpellcastingEmbed',
    prefix: 'spellcasting_',
    object: false,
    nullable: true,
  })
  spellcasting?: VocationSpellcastingEmbed | null;

  @OrmProperty({ type: 'string[]' })
  specializations: string[] = [];

  @OrmProperty({ type: 'string[]' })
  tags: string[] = [];

  /** @property {string | null} description - Prose description extracted from the vocation MDX */
  @OrmProperty({ type: 'text', nullable: true })
  description?: string | null;

  /** @property {string | null} image - Image path extracted from Image/BlendedImage in MDX */
  @OrmProperty({ type: 'string', nullable: true })
  image?: string | null;

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
    entity: 'VocationFeatureEntity',
    mappedBy: 'vocation',
    orphanRemoval: true,
  })
  features = new Collection<VocationFeatureEntity>(this);
}
