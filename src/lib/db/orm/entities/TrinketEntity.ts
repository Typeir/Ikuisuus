/**
 * @fileoverview MikroORM Entity — Trinket
 * @description Decorator-based entity for the `trinkets` table.
 * Uses `@Embedded` with `prefix` for the saving-throw value object.
 *
 * @module lib/db/orm/entities/TrinketEntity
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
 * Saving throw requirement — maps to `saving_throw_dc`, `saving_throw_ability`.
 */
@Embeddable()
export class TrinketSavingThrowEmbed {
  @Property({ columnType: 'smallint', nullable: true })
  dc?: number | null;

  @Property({ nullable: true })
  ability?: string | null;
}

/* ────────────────────────────  Entity  ─────────────────────────────── */

/**
 * MikroORM entity for the `trinkets` table.
 */
@Entity({ tableName: 'trinkets' })
@Unique({ properties: ['locale', 'slug'] })
@Index({
  properties: ['locale', 'itemType'],
  name: 'trinkets_locale_item_type_idx',
})
export class TrinketEntity {
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

  @Property({ fieldName: 'item_type' })
  itemType!: string;

  @Property({ nullable: true })
  damage?: string | null;

  @Property({ fieldName: 'damage_type', nullable: true })
  damageType?: string | null;

  @Property({ nullable: true })
  range?: string | null;

  @Property({ nullable: true })
  weight?: string | null;

  @Embedded(() => TrinketSavingThrowEmbed, {
    prefix: 'saving_throw_',
    object: false,
  })
  savingThrow = new TrinketSavingThrowEmbed();

  @Property({ type: 'string[]' })
  properties: string[] = [];

  @Property({ fieldName: 'special_effects', type: 'string[]' })
  specialEffects: string[] = [];

  @Property({ fieldName: 'inflicts_conditions', type: 'string[]' })
  inflictsConditions: string[] = [];

  @Property({ type: 'string[]' })
  tags: string[] = [];
}
