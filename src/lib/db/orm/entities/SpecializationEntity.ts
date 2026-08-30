/**
 * @fileoverview MikroORM Entity — Specialization
 * @description Entity for the `specializations` table with child features and prepared spells.
 *
 * @module lib/db/orm/entities/SpecializationEntity
 * @version 1.0.0
 * @author Typeir
 * @since 7.0.0
 */

import type { ChildSyncContext } from '@/lib/db/orm/childSync';
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
 * Spellcasting summary: ability, progression.
 */
@OrmEmbeddable('SpecializationSpellcastingEmbed')
export class SpecializationSpellcastingEmbed {
  @OrmProperty({ type: 'string', nullable: true })
  ability?: string | null;

  @OrmProperty({ type: 'string', nullable: true })
  progression?: string | null;
}

/* ─────────────────────  Child Entities  ─────────────────────────────── */

/**
 * MikroORM entity for the `specialization_features` child table.
 */
@OrmEntity('SpecializationFeatureEntity', {
  tableName: 'specialization_features',
})
export class SpecializationFeatureEntity {
  @OrmPrimaryKey({ type: 'number', autoincrement: true })
  id!: number;

  @OrmManyToOne({
    entity: 'SpecializationEntity',
    fieldName: 'specialization_id',
    deleteRule: 'cascade',
  })
  specialization!: SpecializationEntity;

  @OrmProperty({ type: 'number', columnType: 'smallint' })
  level!: number;

  /** @property {string | null} anchor - Anchor slug of the rendered heading */
  @OrmProperty({ type: 'string', nullable: true })
  anchor?: string | null;

  @OrmProperty({ type: 'string' })
  name!: string;

  /** @property {string | null} heading - Raw heading text */
  @OrmProperty({ type: 'string', nullable: true })
  heading?: string | null;

  /** @property {string[] | null} tags - Aspects */
  @OrmProperty({ type: 'string[]', nullable: true })
  tags?: string[] | null;

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

  /** @property {string[] | null} grants - Tag-based proficiency grants (e.g. `saving_throw:wisdom`) */
  @OrmProperty({ type: 'string[]', nullable: true })
  grants?: string[] | null;
}

/**
 * MikroORM entity for the `specialization_prepared_spells` child table.
 * Each row represents a level threshold with a list of always-prepared spells.
 */
@OrmEntity('SpecializationPreparedSpellEntity', {
  tableName: 'specialization_prepared_spells',
})
export class SpecializationPreparedSpellEntity {
  @OrmPrimaryKey({ type: 'number', autoincrement: true })
  id!: number;

  @OrmManyToOne({
    entity: 'SpecializationEntity',
    fieldName: 'specialization_id',
    deleteRule: 'cascade',
  })
  specialization!: SpecializationEntity;

  @OrmProperty({ type: 'number', columnType: 'smallint' })
  level!: number;

  @OrmProperty({ type: 'string[]' })
  spells: string[] = [];

  @OrmProperty({ type: 'number', fieldName: 'sort_order', columnType: 'smallint' })
  sortOrder!: number;
}

/* ────────────────────────────  Entity  ─────────────────────────────── */

/**
 * MikroORM entity for the `specializations` table.
 */
@OrmEntity('SpecializationEntity', { tableName: 'specializations' })
@OrmUnique({ properties: ['locale', 'slug'] })
@OrmIndex({
  properties: ['locale', 'vocation'],
  name: 'specializations_locale_vocation_idx',
})
export class SpecializationEntity {
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
  vocation!: string;

  @OrmProperty({ type: 'string', fieldName: 'specialization_type' })
  specializationType!: string;

  @OrmProperty({ type: 'text', nullable: true })
  flavor?: string | null;

  /** @property {string | null} description - Prose description */
  @OrmProperty({ type: 'text', nullable: true })
  description?: string | null;

  /** @property {string | null} image - Image path */
  @OrmProperty({ type: 'string', nullable: true })
  image?: string | null;

  @OrmEmbedded({
    entity: 'SpecializationSpellcastingEmbed',
    prefix: 'spellcasting_',
    object: false,
    nullable: true,
  })
  spellcasting?: SpecializationSpellcastingEmbed | null;

  @OrmProperty({ type: 'string[]' })
  tags: string[] = [];

  @OrmProperty({ type: 'string[]' })
  produces: string[] = [];

  @OrmProperty({ type: 'string[]' })
  consumes: string[] = [];

  @OrmProperty({ type: 'string[]' })
  consumers: string[] = [];

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
    entity: 'SpecializationFeatureEntity',
    mappedBy: 'specialization',
    orphanRemoval: true,
  })
  features = new Collection<SpecializationFeatureEntity>(this);

  @OrmOneToMany({
    entity: 'SpecializationPreparedSpellEntity',
    mappedBy: 'specialization',
    orphanRemoval: true,
  })
  preparedSpells = new Collection<SpecializationPreparedSpellEntity>(this);

  /**
   * Creates the feature and prepared-spell child rows for a specialization record.
   *
   * @param {ChildSyncContext} ctx - Child row operations
   * @param {unknown} parent - Persisted specialization row
   * @param {Record<string, unknown>} record - Source metadata record
   * @returns {void}
   */
  static syncChildren(
    ctx: ChildSyncContext,
    parent: unknown,
    record: Record<string, unknown>,
  ): void {
    const specialization = parent as SpecializationEntity;

    const features = (record.features ?? []) as Array<Record<string, unknown>>;
    for (let i = 0; i < features.length; i++) {
      const init = ctx.init(SpecializationFeatureEntity, features[i]);
      ctx.create(SpecializationFeatureEntity, {
        ...init,
        specialization,
        sortOrder: i,
      });
    }

    const prepared = (record.preparedSpells ?? []) as Array<
      Record<string, unknown>
    >;
    for (let i = 0; i < prepared.length; i++) {
      const init = ctx.init(SpecializationPreparedSpellEntity, prepared[i]);
      ctx.create(SpecializationPreparedSpellEntity, {
        ...init,
        specialization,
        sortOrder: i,
      });
    }
  }
}
