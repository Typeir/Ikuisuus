/**
 * @fileoverview MikroORM Entity — Specialization
 * @description Decorator-based entity for the `specializations` table. Features
 * are stored in a child `specialization_features` table, always-prepared spells
 * in `specialization_prepared_spells`, and optional spellcasting as an embed.
 *
 * @module lib/db/orm/entities/SpecializationEntity
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
 * Spellcasting summary for third-caster subclasses — maps to
 * `spellcasting_ability`, `spellcasting_progression`.
 */
@Embeddable()
export class SpecializationSpellcastingEmbed {
  @Property({ type: 'string', nullable: true })
  ability?: string | null;

  @Property({ type: 'string', nullable: true })
  progression?: string | null;
}

/* ─────────────────────  Child Entities  ─────────────────────────────── */

/**
 * MikroORM entity for the `specialization_features` child table.
 */
@Entity({ tableName: 'specialization_features' })
export class SpecializationFeatureEntity {
  @PrimaryKey({ type: 'number', autoincrement: true })
  id!: number;

  @ManyToOne(() => SpecializationEntity, {
    fieldName: 'specialization_id',
    deleteRule: 'cascade',
  })
  specialization!: SpecializationEntity;

  @Property({ type: 'number', columnType: 'smallint' })
  level!: number;

  @Property({ type: 'string' })
  name!: string;

  @Property({ type: 'number', fieldName: 'sort_order', columnType: 'smallint' })
  sortOrder!: number;

  /** @property {number | null} startLine - 1-indexed start line of this feature's heading block in the source MDX */
  @Property({
    type: 'number',
    fieldName: 'start_line',
    columnType: 'smallint',
    nullable: true,
  })
  startLine?: number | null;

  /** @property {number | null} endLine - 1-indexed last line of this feature's heading block in the source MDX */
  @Property({
    type: 'number',
    fieldName: 'end_line',
    columnType: 'smallint',
    nullable: true,
  })
  endLine?: number | null;
}

/**
 * MikroORM entity for the `specialization_prepared_spells` child table.
 * Each row represents a level threshold with a list of always-prepared spells.
 */
@Entity({ tableName: 'specialization_prepared_spells' })
export class SpecializationPreparedSpellEntity {
  @PrimaryKey({ type: 'number', autoincrement: true })
  id!: number;

  @ManyToOne(() => SpecializationEntity, {
    fieldName: 'specialization_id',
    deleteRule: 'cascade',
  })
  specialization!: SpecializationEntity;

  @Property({ type: 'number', columnType: 'smallint' })
  level!: number;

  @Property({ type: 'string[]' })
  spells: string[] = [];

  @Property({ type: 'number', fieldName: 'sort_order', columnType: 'smallint' })
  sortOrder!: number;
}

/* ────────────────────────────  Entity  ─────────────────────────────── */

/**
 * MikroORM entity for the `specializations` table.
 */
@Entity({ tableName: 'specializations' })
@Unique({ properties: ['locale', 'slug'] })
@Index({
  properties: ['locale', 'vocation'],
  name: 'specializations_locale_vocation_idx',
})
export class SpecializationEntity {
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
  vocation!: string;

  @Property({ type: 'string', fieldName: 'specialization_type' })
  specializationType!: string;

  @Property({ type: 'text', nullable: true })
  flavor?: string | null;

  /** @property {string | null} description - Prose description extracted from the specialization MDX */
  @Property({ type: 'text', nullable: true })
  description?: string | null;

  /** @property {string | null} image - Image path extracted from Image/BlendedImage in MDX */
  @Property({ type: 'string', nullable: true })
  image?: string | null;

  @Embedded(() => SpecializationSpellcastingEmbed, {
    prefix: 'spellcasting_',
    object: false,
    nullable: true,
  })
  spellcasting?: SpecializationSpellcastingEmbed | null;

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

  @OneToMany(() => SpecializationFeatureEntity, (f) => f.specialization, {
    orphanRemoval: true,
  })
  features = new Collection<SpecializationFeatureEntity>(this);

  @OneToMany(() => SpecializationPreparedSpellEntity, (p) => p.specialization, {
    orphanRemoval: true,
  })
  preparedSpells = new Collection<SpecializationPreparedSpellEntity>(this);
}
