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
 * Charge economy value object — maps to `charges_initial`,
 * `charges_recharge`, `charges_depletes`.
 */
@Embeddable()
export class HeirloomChargesEmbed {
  @Property({ type: 'string', nullable: true })
  initial?: string | null;

  @Property({ type: 'string', nullable: true })
  recharge?: string | null;

  @Property({ type: 'boolean', nullable: true })
  depletes?: boolean | null;
}

/* ────────────────────────────  Entity  ─────────────────────────────── */

/**
 * MikroORM entity for the `heirlooms` table.
 */
@Entity({ tableName: 'heirlooms' })
@Unique({ properties: ['locale', 'slug'] })
@Index({
  properties: ['locale', 'rarity'],
  name: 'heirlooms_locale_rarity_idx',
})
@Index({
  properties: ['locale', 'itemType'],
  name: 'heirlooms_locale_item_type_idx',
})
export class HeirloomEntity {
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

  @Property({ type: 'string', nullable: true })
  rarity?: string | null;

  @Property({ type: 'string', fieldName: 'item_type', nullable: true })
  itemType?: string | null;

  @Property({ type: 'string', fieldName: 'weapon_type', nullable: true })
  weaponType?: string | null;

  @Property({
    type: 'boolean',
    fieldName: 'requires_attunement',
    nullable: true,
  })
  requiresAttunement?: boolean | null;

  @Property({
    type: 'string',
    fieldName: 'attunement_requirements',
    nullable: true,
  })
  attunementRequirements?: string | null;

  @Property({ type: 'string', fieldName: 'weapon_damage', nullable: true })
  weaponDamage?: string | null;

  @Property({ type: 'string', fieldName: 'weapon_damage_type', nullable: true })
  weaponDamageType?: string | null;

  @Property({ type: 'string', fieldName: 'versatile_damage', nullable: true })
  versatileDamage?: string | null;

  @Property({
    type: 'number',
    fieldName: 'hit_modifier',
    columnType: 'smallint',
    nullable: true,
  })
  hitModifier?: number | null;

  @Property({ type: 'string', nullable: true })
  range?: string | null;

  @Property({ type: 'string', nullable: true })
  weight?: string | null;

  @Embedded(() => HeirloomChargesEmbed, { prefix: 'charges_', object: false })
  charges = new HeirloomChargesEmbed();

  @Property({ type: 'string[]' })
  mastery: string[] = [];

  @Property({ fieldName: 'weapon_properties', type: 'string[]' })
  weaponProperties: string[] = [];

  @Property({ fieldName: 'damage_types_dealt', type: 'string[]' })
  damageTypesDealt: string[] = [];

  @Property({ fieldName: 'saving_throw_types', type: 'string[]' })
  savingThrowTypes: string[] = [];

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
}
