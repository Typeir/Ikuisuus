/**
 * @fileoverview MikroORM Entity — Bloodline
 * @description Decorator-based entity for the `bloodlines` table. Core features
 * are stored as explicit typed columns (text arrays for multi-value fields like
 * ability scores and senses) — no JSONB payload storage.
 *
 * Boons are stored in a separate `bloodline_boons` child table via OneToMany.
 *
 * @module lib/db/orm/entities/BloodlineEntity
 * @version 1.0.0
 * @author Typeir
 * @since 7.0.0
 */

import {
    Collection,
    Entity,
    Index,
    OneToMany,
    PrimaryKey,
    Property,
    Unique,
} from '@mikro-orm/core';
import { BloodlineBoonEntity } from './BloodlineBoonEntity';

/**
 * MikroORM entity for the `bloodlines` table.
 */
@Entity({ tableName: 'bloodlines' })
@Unique({ properties: ['locale', 'slug'] })
@Index({
  properties: ['locale'],
  name: 'bloodlines_locale_idx',
})
export class BloodlineEntity {
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

  @Property({ type: 'text', nullable: true })
  description?: string | null;

  @Property({ fieldName: 'ability_scores', type: 'string[]' })
  abilityScores: string[] = [];

  @Property({ fieldName: 'movement_speeds', type: 'string[]' })
  movementSpeeds: string[] = [];

  @Property({ type: 'string[]' })
  senses: string[] = [];

  @Property({ type: 'string[]' })
  size: string[] = [];

  @Property({ fieldName: 'creature_types', type: 'string[]' })
  creatureTypes: string[] = [];

  @Property({ type: 'text', nullable: true })
  age?: string | null;

  @Property({
    type: 'number',
    fieldName: 'boon_budget',
    columnType: 'smallint',
    nullable: true,
  })
  boonBudget?: number | null;

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

  @OneToMany(() => BloodlineBoonEntity, (boon) => boon.bloodline, {
    orphanRemoval: true,
  })
  boons = new Collection<BloodlineBoonEntity>(this);
}
