/**
 * @fileoverview MikroORM Entity — Bloodline Feature
 * @description Child table for a bloodline's core-feature traits (`###`
 * headings under `## Core Features`), each with its own aspects.
 *
 * @module lib/db/orm/entities/BloodlineFeatureEntity
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import {
  OrmEntity,
  OrmIndex,
  OrmManyToOne,
  OrmPrimaryKey,
  OrmProperty,
} from '@/lib/db/orm/schema';
import type { BloodlineEntity } from './BloodlineEntity';

/**
 * MikroORM entity for the `bloodline_features` table.
 */
@OrmEntity('BloodlineFeatureEntity', { tableName: 'bloodline_features' })
@OrmIndex({ properties: ['bloodline'], name: 'bloodline_features_bloodline_id_idx' })
export class BloodlineFeatureEntity {
  @OrmPrimaryKey({ type: 'number', autoincrement: true })
  id!: number;

  @OrmManyToOne({
    entity: 'BloodlineEntity',
    fieldName: 'bloodline_id',
    deleteRule: 'cascade',
  })
  bloodline!: BloodlineEntity;

  /** @property {string} featureId - Stable id, `${slug}:${anchor}` */
  @OrmProperty({ type: 'string', fieldName: 'feature_id' })
  featureId!: string;

  /** @property {string | null} anchor - Anchor slug of the rendered heading; the stable shard key */
  @OrmProperty({ type: 'string', nullable: true })
  anchor?: string | null;

  @OrmProperty({ type: 'string' })
  name!: string;

  @OrmProperty({
    type: 'number',
    fieldName: 'sort_order',
    columnType: 'smallint',
  })
  sortOrder!: number;

  @OrmProperty({
    type: 'number',
    fieldName: 'start_line',
    columnType: 'smallint',
    nullable: true,
  })
  startLine?: number | null;

  @OrmProperty({
    type: 'number',
    fieldName: 'end_line',
    columnType: 'smallint',
    nullable: true,
  })
  endLine?: number | null;

  @OrmProperty({ type: 'string[]' })
  tags: string[] = [];
}
