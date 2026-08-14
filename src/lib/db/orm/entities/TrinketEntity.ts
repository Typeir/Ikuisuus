/**
 * @fileoverview MikroORM Entity — Trinket
 * @description Decorator-based entity for the `trinkets` table.
 *
 * @module lib/db/orm/entities/TrinketEntity
 * @version 3.0.0
 * @author Typeir
 * @since 5.0.0
 */

import {
    OrmEmbeddable,
    OrmEmbedded,
    OrmEntity,
    OrmIndex,
    OrmPrimaryKey,
    OrmProperty,
    OrmUnique,
} from '@/lib/db/orm/schema';

/* ─────────────────────────  Embeddable VOs  ─────────────────────────── */

/**
 * Saving throw requirement — maps to `saving_throw_dc`, `saving_throw_ability`.
 */
@OrmEmbeddable('TrinketSavingThrowEmbed')
export class TrinketSavingThrowEmbed {
  @OrmProperty({ type: 'number', columnType: 'smallint', nullable: true })
  dc?: number | null;

  @OrmProperty({ type: 'string', nullable: true })
  ability?: string | null;
}

/* ────────────────────────────  Entity  ─────────────────────────────── */

/**
 * MikroORM entity for the `trinkets` table.
 */
@OrmEntity('TrinketEntity', { tableName: 'trinkets' })
@OrmUnique({ properties: ['locale', 'slug'] })
@OrmIndex({
  properties: ['locale', 'itemType'],
  name: 'trinkets_locale_item_type_idx',
})
export class TrinketEntity {
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

  @OrmProperty({ type: 'string', fieldName: 'item_type' })
  itemType!: string;

  @OrmProperty({ type: 'string', nullable: true })
  damage?: string | null;

  @OrmProperty({ type: 'string', fieldName: 'damage_type', nullable: true })
  damageType?: string | null;

  @OrmProperty({ type: 'string', nullable: true })
  range?: string | null;

  @OrmProperty({ type: 'string', nullable: true })
  weight?: string | null;

  @OrmEmbedded({
    entity: 'TrinketSavingThrowEmbed',
    prefix: 'saving_throw_',
    object: false,
  })
  savingThrow = new TrinketSavingThrowEmbed();

  @OrmProperty({ type: 'string[]' })
  properties: string[] = [];

  @OrmProperty({ fieldName: 'special_effects', type: 'string[]' })
  specialEffects: string[] = [];

  @OrmProperty({ fieldName: 'inflicts_conditions', type: 'string[]' })
  inflictsConditions: string[] = [];

  @OrmProperty({ type: 'string[]' })
  tags: string[] = [];

  /** @property {string | null} description - Prose description extracted from the trinket MDX */
  @OrmProperty({ type: 'text', nullable: true })
  description?: string | null;

  /** @property {string | null} image - Image path extracted from Image/BlendedImage in MDX */
  @OrmProperty({ type: 'string', nullable: true })
  image?: string | null;

  /** @property {string | null} versionHash - FNV-1a content hash for incremental sync */
  @OrmProperty({ type: 'string', fieldName: 'version_hash', nullable: true })
  versionHash?: string | null;
}
