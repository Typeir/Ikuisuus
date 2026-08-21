/**
 * @fileoverview MikroORM Entities — Spell + SpellList
 * @description Decorator-based entities for the `spells` and `spell_lists`
 * tables.
 *
 * @module lib/db/orm/entities/SpellEntity
 * @version 3.0.0
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
 * Spell component requirements — maps to `component_verbal`,
 * `component_somatic`, `component_material`, `component_material_description`.
 */
@OrmEmbeddable('SpellComponentEmbed')
export class SpellComponentEmbed {
  @OrmProperty({ type: 'boolean', nullable: true })
  verbal?: boolean | null;

  @OrmProperty({ type: 'boolean', nullable: true })
  somatic?: boolean | null;

  @OrmProperty({ type: 'boolean', nullable: true })
  material?: boolean | null;

  @OrmProperty({
    type: 'text',
    fieldName: 'material_description',
    nullable: true,
  })
  materialDescription?: string | null;
}

/* ────────────────────────────  Entities  ───────────────────────────── */

/**
 * MikroORM entity for the `spell_lists` table.
 * Represents a normalised spell-list membership row.
 */
@OrmEntity('SpellListEntity', { tableName: 'spell_lists' })
@OrmIndex({ properties: ['spell'], name: 'spell_lists_spell_id_idx' })
@OrmIndex({ properties: ['name'], name: 'spell_lists_name_idx' })
export class SpellListEntity {
  @OrmPrimaryKey({ type: 'number', autoincrement: true })
  id!: number;

  @OrmManyToOne({
    entity: 'SpellEntity',
    fieldName: 'spell_id',
    deleteRule: 'cascade',
  })
  spell!: SpellEntity;

  @OrmProperty({ type: 'string' })
  name!: string;

  @OrmProperty({ type: 'string' })
  link!: string;

  /** @property {string | null} specialization - Owning specialization slug when the list belongs to a specialization rather than a vocation */
  @OrmProperty({ type: 'string', nullable: true })
  specialization?: string | null;
}

/**
 * MikroORM entity for the `spells` table.
 */
@OrmEntity('SpellEntity', { tableName: 'spells' })
@OrmUnique({ properties: ['locale', 'slug'] })
@OrmIndex({ properties: ['locale', 'level'], name: 'spells_locale_level_idx' })
@OrmIndex({ properties: ['locale', 'school'], name: 'spells_locale_school_idx' })
export class SpellEntity {
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

  @OrmProperty({ type: 'number', columnType: 'smallint', nullable: true })
  level?: number | null;

  @OrmProperty({ type: 'string', nullable: true })
  school?: string | null;

  @OrmProperty({ type: 'string', nullable: true })
  quality?: string | null;

  @OrmProperty({ type: 'string', fieldName: 'casting_time_raw', nullable: true })
  castingTimeRaw?: string | null;

  @OrmProperty({ type: 'string', nullable: true })
  range?: string | null;

  @OrmProperty({ type: 'boolean', nullable: true })
  concentration?: boolean | null;

  @OrmProperty({ type: 'string', nullable: true })
  duration?: string | null;

  @OrmEmbedded({
    entity: 'SpellComponentEmbed',
    prefix: 'component_',
    object: false,
  })
  components = new SpellComponentEmbed();

  @OrmProperty({ type: 'boolean', fieldName: 'has_ritual', nullable: true })
  hasRitual?: boolean | null;

  /** @property {string | null} description - Prose description extracted from the spell MDX */
  @OrmProperty({ type: 'text', columnType: 'text', nullable: true })
  description?: string | null;

  /** @property {string | null} image - Image path extracted from Image/BlendedImage in MDX */
  @OrmProperty({ type: 'string', nullable: true })
  image?: string | null;

  @OrmProperty({ fieldName: 'casting_time', type: 'string[]' })
  castingTime: string[] = [];

  @OrmProperty({ type: 'string[]' })
  tags: string[] = [];

  @OrmOneToMany({
    entity: 'SpellListEntity',
    mappedBy: 'spell',
    orphanRemoval: true,
  })
  spellLists = new Collection<SpellListEntity>(this);

  /** @property {string | null} versionHash - FNV-1a content hash for incremental sync */
  @OrmProperty({ type: 'string', fieldName: 'version_hash', nullable: true })
  versionHash?: string | null;

  /** @property {string | null} source - Sourcebook the entry comes from */
  @OrmProperty({ type: 'string', nullable: true })
  source?: string | null;
}
