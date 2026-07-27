/**
 * @fileoverview MikroORM Entities — Spell + SpellList
 * @description Decorator-based entities for the `spells` and `spell_lists`
 * tables. SpellList is a child entity with a many-to-one relation to Spell.
 * Uses `@Embedded` with `prefix` for the spell-component value object.
 *
 * @module lib/db/orm/entities/SpellEntity
 * @version 3.0.0
 * @author Typeir
 * @since 5.0.0
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
 * Spell component requirements — maps to `component_verbal`,
 * `component_somatic`, `component_material`, `component_material_description`.
 */
@Embeddable()
export class SpellComponentEmbed {
  @Property({ type: 'boolean', nullable: true })
  verbal?: boolean | null;

  @Property({ type: 'boolean', nullable: true })
  somatic?: boolean | null;

  @Property({ type: 'boolean', nullable: true })
  material?: boolean | null;

  @Property({
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
@Entity({ tableName: 'spell_lists' })
@Index({ properties: ['spell'], name: 'spell_lists_spell_id_idx' })
@Index({ properties: ['name'], name: 'spell_lists_name_idx' })
export class SpellListEntity {
  @PrimaryKey({ type: 'number', autoincrement: true })
  id!: number;

  @ManyToOne(() => SpellEntity, {
    fieldName: 'spell_id',
    deleteRule: 'cascade',
  })
  spell!: SpellEntity;

  @Property({ type: 'string' })
  name!: string;

  @Property({ type: 'string' })
  link!: string;

  /** @property {string | null} specialization - Owning specialization slug when the list belongs to a specialization rather than a vocation */
  @Property({ type: 'string', nullable: true })
  specialization?: string | null;
}

/**
 * MikroORM entity for the `spells` table.
 */
@Entity({ tableName: 'spells' })
@Unique({ properties: ['locale', 'slug'] })
@Index({ properties: ['locale', 'level'], name: 'spells_locale_level_idx' })
@Index({ properties: ['locale', 'school'], name: 'spells_locale_school_idx' })
export class SpellEntity {
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

  @Property({ type: 'number', columnType: 'smallint', nullable: true })
  level?: number | null;

  @Property({ type: 'string', nullable: true })
  school?: string | null;

  @Property({ type: 'string', nullable: true })
  quality?: string | null;

  @Property({ type: 'string', fieldName: 'casting_time_raw', nullable: true })
  castingTimeRaw?: string | null;

  @Property({ type: 'string', nullable: true })
  range?: string | null;

  @Property({ type: 'boolean', nullable: true })
  concentration?: boolean | null;

  @Property({ type: 'string', nullable: true })
  duration?: string | null;

  @Embedded(() => SpellComponentEmbed, { prefix: 'component_', object: false })
  components = new SpellComponentEmbed();

  @Property({ type: 'boolean', fieldName: 'has_ritual', nullable: true })
  hasRitual?: boolean | null;

  /** @property {string | null} description - Prose description extracted from the spell MDX */
  @Property({ type: 'text', columnType: 'text', nullable: true })
  description?: string | null;

  /** @property {string | null} image - Image path extracted from Image/BlendedImage in MDX */
  @Property({ type: 'string', nullable: true })
  image?: string | null;

  @Property({ fieldName: 'casting_time', type: 'string[]' })
  castingTime: string[] = [];

  @Property({ type: 'string[]' })
  tags: string[] = [];

  @OneToMany(() => SpellListEntity, (sl) => sl.spell, { orphanRemoval: true })
  spellLists = new Collection<SpellListEntity>(this);

  /** @property {string | null} versionHash - FNV-1a content hash for incremental sync */
  @Property({ type: 'string', fieldName: 'version_hash', nullable: true })
  versionHash?: string | null;

  /** @property {string | null} source - Content provenance: null = native Damocles, "basic" = SRD 5.1 (OGL), other = campaign-specific */
  @Property({ type: 'string', nullable: true })
  source?: string | null;
}
