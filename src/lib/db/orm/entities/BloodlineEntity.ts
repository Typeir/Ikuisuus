/**
 * @fileoverview MikroORM Entity — Bloodline
 * @description Maps the `bloodlines` table. Multi-value fields use text-array
 * columns; boons live in a `bloodline_boons` child table via OneToMany.
 * Uses in-house schema decorators so the entity name survives class-name
 * minification.
 *
 * @module lib/db/orm/entities/BloodlineEntity
 * @version 2.0.0
 * @author Typeir
 * @since 7.0.0
 */

import {
    OrmEntity,
    OrmIndex,
    OrmOneToMany,
    OrmPrimaryKey,
    OrmProperty,
    OrmUnique,
} from '@/lib/db/orm/schema';
import { Collection } from '@mikro-orm/core';
import type { BloodlineBoonEntity } from './BloodlineBoonEntity';

/**
 * MikroORM entity for the `bloodlines` table.
 */
@OrmEntity('BloodlineEntity', { tableName: 'bloodlines' })
@OrmUnique({ properties: ['locale', 'slug'] })
@OrmIndex({
  properties: ['locale'],
  name: 'bloodlines_locale_idx',
})
export class BloodlineEntity {
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

  @OrmProperty({ type: 'text', nullable: true })
  description?: string | null;

  @OrmProperty({ type: 'string', nullable: true })
  image?: string | null;

  @OrmProperty({ fieldName: 'ability_scores', type: 'string[]' })
  abilityScores: string[] = [];

  @OrmProperty({ fieldName: 'movement_speeds', type: 'string[]' })
  movementSpeeds: string[] = [];

  @OrmProperty({ type: 'string[]' })
  senses: string[] = [];

  @OrmProperty({ type: 'string[]' })
  size: string[] = [];

  @OrmProperty({ fieldName: 'creature_types', type: 'string[]' })
  creatureTypes: string[] = [];

  @OrmProperty({ type: 'text', nullable: true })
  age?: string | null;

  @OrmProperty({
    type: 'number',
    fieldName: 'boon_budget',
    columnType: 'smallint',
    nullable: true,
  })
  boonBudget?: number | null;

  @OrmProperty({ type: 'string[]' })
  tags: string[] = [];

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
    entity: 'BloodlineBoonEntity',
    mappedBy: 'bloodline',
    orphanRemoval: true,
  })
  boons = new Collection<BloodlineBoonEntity>(this);
}
