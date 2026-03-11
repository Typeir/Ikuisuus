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
  @Property({ nullable: true })
  verbal?: boolean | null;

  @Property({ nullable: true })
  somatic?: boolean | null;

  @Property({ nullable: true })
  material?: boolean | null;

  @Property({ fieldName: 'material_description', nullable: true })
  materialDescription?: string | null;
}

/* ────────────────────────────  Entities  ───────────────────────────── */

/**
 * MikroORM entity for the `spell_lists` table.
 * Represents a normalised spell-list membership row.
 */
@Entity({ tableName: 'spell_lists' })
@Index({ properties: ['spell'], name: 'spell_lists_spell_id_idx' })
export class SpellListEntity {
  @PrimaryKey({ autoincrement: true })
  id!: number;

  @ManyToOne(() => SpellEntity, {
    fieldName: 'spell_id',
    deleteRule: 'cascade',
  })
  spell!: SpellEntity;

  @Property()
  name!: string;

  @Property()
  link!: string;
}

/**
 * MikroORM entity for the `spells` table.
 */
@Entity({ tableName: 'spells' })
@Unique({ properties: ['locale', 'slug'] })
@Index({ properties: ['locale', 'level'], name: 'spells_locale_level_idx' })
@Index({ properties: ['locale', 'school'], name: 'spells_locale_school_idx' })
export class SpellEntity {
  @PrimaryKey({ autoincrement: true })
  id!: number;

  @Property()
  locale!: string;

  @Property()
  slug!: string;

  @Property()
  title!: string;

  @Property()
  file!: string;

  @Property()
  link!: string;

  @Property({ columnType: 'smallint', nullable: true })
  level?: number | null;

  @Property({ nullable: true })
  school?: string | null;

  @Property({ nullable: true })
  quality?: string | null;

  @Property({ fieldName: 'casting_time_raw', nullable: true })
  castingTimeRaw?: string | null;

  @Property({ nullable: true })
  range?: string | null;

  @Property({ nullable: true })
  concentration?: boolean | null;

  @Property({ nullable: true })
  duration?: string | null;

  @Embedded(() => SpellComponentEmbed, { prefix: 'component_', object: false })
  components = new SpellComponentEmbed();

  @Property({ fieldName: 'has_ritual', nullable: true })
  hasRitual?: boolean | null;

  @Property({ fieldName: 'casting_time', type: 'string[]' })
  castingTime: string[] = [];

  @Property({ type: 'string[]' })
  tags: string[] = [];

  @OneToMany(() => SpellListEntity, (sl) => sl.spell, { orphanRemoval: true })
  spellLists = new Collection<SpellListEntity>(this);
}
