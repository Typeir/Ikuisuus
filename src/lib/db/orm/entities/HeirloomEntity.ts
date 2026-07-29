/**
 * @fileoverview MikroORM Entity — Heirloom
 * @description Decorator-based entity for the `heirlooms` table.
 * Uses `@Embedded` with `prefix` for the charges value object.
 * Weapon damage fields don't share a clean prefix (`versatile_damage`
 * breaks the `weapon_` pattern) so they stay flat.
 *
 * @module lib/db/orm/entities/HeirloomEntity
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
 * Charge economy value object — maps to `charges_initial`,
 * `charges_recharge`, `charges_depletes`.
 */
@OrmEmbeddable('HeirloomChargesEmbed')
export class HeirloomChargesEmbed {
  @OrmProperty({ type: 'string', nullable: true })
  initial?: string | null;

  @OrmProperty({ type: 'string', nullable: true })
  recharge?: string | null;

  @OrmProperty({ type: 'boolean', nullable: true })
  depletes?: boolean | null;
}

/* ────────────────────────────  Entity  ─────────────────────────────── */

/**
 * MikroORM entity for the `heirlooms` table.
 */
@OrmEntity('HeirloomEntity', { tableName: 'heirlooms' })
@OrmUnique({ properties: ['locale', 'slug'] })
@OrmIndex({
  properties: ['locale', 'rarity'],
  name: 'heirlooms_locale_rarity_idx',
})
@OrmIndex({
  properties: ['locale', 'itemType'],
  name: 'heirlooms_locale_item_type_idx',
})
export class HeirloomEntity {
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

  @OrmProperty({ type: 'string', nullable: true })
  rarity?: string | null;

  @OrmProperty({ type: 'string', fieldName: 'item_type', nullable: true })
  itemType?: string | null;

  @OrmProperty({ type: 'string', fieldName: 'weapon_type', nullable: true })
  weaponType?: string | null;

  @OrmProperty({
    type: 'boolean',
    fieldName: 'requires_attunement',
    nullable: true,
  })
  requiresAttunement?: boolean | null;

  @OrmProperty({
    type: 'string',
    fieldName: 'attunement_requirements',
    nullable: true,
  })
  attunementRequirements?: string | null;

  @OrmProperty({ type: 'string', fieldName: 'weapon_damage', nullable: true })
  weaponDamage?: string | null;

  @OrmProperty({ type: 'string', fieldName: 'weapon_damage_type', nullable: true })
  weaponDamageType?: string | null;

  @OrmProperty({ type: 'string', fieldName: 'versatile_damage', nullable: true })
  versatileDamage?: string | null;

  @OrmProperty({
    type: 'number',
    fieldName: 'hit_modifier',
    columnType: 'smallint',
    nullable: true,
  })
  hitModifier?: number | null;

  @OrmProperty({ type: 'string', nullable: true })
  range?: string | null;

  @OrmProperty({ type: 'string', nullable: true })
  weight?: string | null;

  @OrmEmbedded({
    entity: 'HeirloomChargesEmbed',
    prefix: 'charges_',
    object: false,
  })
  charges = new HeirloomChargesEmbed();

  @OrmProperty({ type: 'string[]' })
  mastery: string[] = [];

  @OrmProperty({ fieldName: 'weapon_properties', type: 'string[]' })
  weaponProperties: string[] = [];

  @OrmProperty({ fieldName: 'damage_types_dealt', type: 'string[]' })
  damageTypesDealt: string[] = [];

  @OrmProperty({ fieldName: 'saving_throw_types', type: 'string[]' })
  savingThrowTypes: string[] = [];

  @OrmProperty({ type: 'string[]' })
  tags: string[] = [];

  /** @property {string | null} description - Prose description extracted from the heirloom MDX */
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
}
