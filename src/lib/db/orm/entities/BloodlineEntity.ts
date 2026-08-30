/**
 * @fileoverview MikroORM Entity — Bloodline
 * @description Maps the `bloodlines` table. Multi-value fields in text-array columns; boons in `bloodline_boons` child table.
 *
 * @module lib/db/orm/entities/BloodlineEntity
 * @version 2.0.0
 * @author Typeir
 * @since 7.0.0
 */

import type { ChildSyncContext } from '@/lib/db/orm/childSync';
import {
  OrmEntity,
  OrmIndex,
  OrmOneToMany,
  OrmPrimaryKey,
  OrmProperty,
  OrmUnique,
} from '@/lib/db/orm/schema';
import { Collection } from '@mikro-orm/core';
import { BloodlineBoonEntity } from './BloodlineBoonEntity';
import { BloodlineBoonOptionEntity } from './BloodlineBoonOptionEntity';
import { BloodlineFeatureEntity } from './BloodlineFeatureEntity';

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
    entity: 'BloodlineBoonEntity',
    mappedBy: 'bloodline',
    orphanRemoval: true,
  })
  boons = new Collection<BloodlineBoonEntity>(this);

  @OrmOneToMany({
    entity: 'BloodlineFeatureEntity',
    mappedBy: 'bloodline',
    orphanRemoval: true,
  })
  features = new Collection<BloodlineFeatureEntity>(this);

  /**
   * Creates the boon, boon-option, and core-feature rows for a bloodline record.
   *
   * @param {ChildSyncContext} ctx - Child-row operations
   * @param {unknown} parent - Persisted bloodline row
   * @param {Record<string, unknown>} record - Source bloodline metadata record
   * @returns {void}
   */
  static syncChildren(
    ctx: ChildSyncContext,
    parent: unknown,
    record: Record<string, unknown>,
  ): void {
    const bloodline = parent as BloodlineEntity;
    const boons = (record.boons ?? []) as Array<Record<string, unknown>>;

    for (const boon of boons) {
      const boonInit = ctx.init(BloodlineBoonEntity, boon);
      const boonRow = ctx.create(BloodlineBoonEntity, {
        ...boonInit,
        bloodline,
      }) as BloodlineBoonEntity;

      const options = (boon.subOptions ?? []) as Array<
        Record<string, unknown>
      >;
      for (let i = 0; i < options.length; i++) {
        const option = options[i];
        const optionInit = ctx.init(BloodlineBoonOptionEntity, option);
        ctx.create(BloodlineBoonOptionEntity, {
          ...optionInit,
          boon: boonRow,
          name: option.name as string,
          anchor: (option.anchor as string | undefined) ?? null,
          bpValue: (option.bpValue as number | undefined) ?? 0,
          effect: (option.effect as string | undefined) ?? null,
          tags: (option.tags as string[] | undefined) ?? [],
          sortOrder: i,
        });
      }
    }

    const features = (record.features ?? []) as Array<Record<string, unknown>>;
    for (let i = 0; i < features.length; i++) {
      const feature = features[i];
      const source = (feature.source ?? {}) as Record<string, unknown>;
      const init = ctx.init(BloodlineFeatureEntity, feature);
      ctx.create(BloodlineFeatureEntity, {
        ...init,
        bloodline,
        featureId: feature.id as string,
        sortOrder: i,
        startLine: source.start as number | undefined,
        endLine: source.end as number | undefined,
      });
    }
  }
}
