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
  @Property({ type: 'number', columnType: 'smallint', nullable: true })
  dc?: number | null;

  @Property({ type: 'string', nullable: true })
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

  @Property({ type: 'string', fieldName: 'item_type' })
  itemType!: string;

  @Property({ type: 'string', nullable: true })
  damage?: string | null;

  @Property({ type: 'string', fieldName: 'damage_type', nullable: true })
  damageType?: string | null;

  @Property({ type: 'string', nullable: true })
  range?: string | null;

  @Property({ type: 'string', nullable: true })
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

  /** @property {string | null} description - Prose description extracted from the trinket MDX */
  @Property({ type: 'text', nullable: true })
  description?: string | null;

  /** @property {string | null} versionHash - FNV-1a content hash for incremental sync */
  @Property({ type: 'string', fieldName: 'version_hash', nullable: true })
  versionHash?: string | null;
}
