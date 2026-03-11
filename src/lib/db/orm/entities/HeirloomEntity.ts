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
  @Property({ nullable: true })
  initial?: string | null;

  @Property({ nullable: true })
  recharge?: string | null;

  @Property({ nullable: true })
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

  @Property({ nullable: true })
  rarity?: string | null;

  @Property({ fieldName: 'item_type', nullable: true })
  itemType?: string | null;

  @Property({ fieldName: 'weapon_type', nullable: true })
  weaponType?: string | null;

  @Property({ fieldName: 'requires_attunement', nullable: true })
  requiresAttunement?: boolean | null;

  @Property({ fieldName: 'attunement_requirements', nullable: true })
  attunementRequirements?: string | null;

  @Property({ fieldName: 'weapon_damage', nullable: true })
  weaponDamage?: string | null;

  @Property({ fieldName: 'weapon_damage_type', nullable: true })
  weaponDamageType?: string | null;

  @Property({ fieldName: 'versatile_damage', nullable: true })
  versatileDamage?: string | null;

  @Property({
    fieldName: 'hit_modifier',
    columnType: 'smallint',
    nullable: true,
  })
  hitModifier?: number | null;

  @Property({ nullable: true })
  range?: string | null;

  @Property({ nullable: true })
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
    fieldName: 'index_version',
    columnType: 'smallint',
    nullable: true,
  })
  indexVersion?: number | null;
}
