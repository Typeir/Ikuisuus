/**
 * @fileoverview MikroORM entity for the `bloodline_boons` table.
 * @description Entity for the `bloodline_boons` child table. Each row is one
 * boon option for a bloodline, foreign-keyed to `bloodlines.id` via ManyToOne.
 * Uses in-house schema decorators that preserve the entity name through
 * class-name minification.
 *
 * @module lib/db/orm/entities/BloodlineBoonEntity
 * @version 2.0.0
 * @author Typeir
 * @since 7.0.0
 */

import {
    OrmEntity,
    OrmManyToOne,
    OrmOneToMany,
    OrmPrimaryKey,
    OrmProperty,
} from '@/lib/db/orm/schema';
import { Collection } from '@mikro-orm/core';
import type { BloodlineBoonOptionEntity } from './BloodlineBoonOptionEntity';
import type { BloodlineEntity } from './BloodlineEntity';

/**
 * MikroORM entity for the `bloodline_boons` table.
 */
@OrmEntity('BloodlineBoonEntity', { tableName: 'bloodline_boons' })
export class BloodlineBoonEntity {
  @OrmPrimaryKey({ type: 'number', autoincrement: true })
  id!: number;

  @OrmManyToOne({
    entity: 'BloodlineEntity',
    fieldName: 'bloodline_id',
    deleteRule: 'cascade',
  })
  bloodline!: BloodlineEntity;

  /** @property {string | null} anchor - Anchor slug of the rendered heading; the stable shard key */
  @OrmProperty({ type: 'string', nullable: true })
  anchor?: string | null;

  @OrmProperty({ type: 'string' })
  name!: string;

  @OrmProperty({ type: 'string', fieldName: 'bp_label' })
  bpLabel!: string;

  @OrmProperty({
    type: 'number',
    fieldName: 'bp_value',
    columnType: 'smallint',
    nullable: true,
  })
  bpValue?: number | null;

  @OrmProperty({
    type: 'number',
    fieldName: 'sort_order',
    columnType: 'smallint',
  })
  sortOrder!: number;

  @OrmProperty({ type: 'string[]' })
  tags: string[] = [];

  /** @property {string | null} parentName - Parent boon when this is an option written as its own heading */
  @OrmProperty({ type: 'string', fieldName: 'parent_name', nullable: true })
  parentName?: string | null;

  /** @property {number | null} startLine - 1-indexed start line of this boon's heading block in the source MDX */
  @OrmProperty({
    type: 'number',
    fieldName: 'start_line',
    columnType: 'smallint',
    nullable: true,
  })
  startLine?: number | null;

  /** @property {number | null} endLine - 1-indexed last line of this boon's content block in the source MDX */
  @OrmProperty({
    type: 'number',
    fieldName: 'end_line',
    columnType: 'smallint',
    nullable: true,
  })
  endLine?: number | null;

  /** @property {Collection<BloodlineBoonOptionEntity>} options - Selectable options of a variable-cost boon */
  @OrmOneToMany({
    entity: 'BloodlineBoonOptionEntity',
    mappedBy: 'boon',
    orphanRemoval: true,
  })
  options = new Collection<BloodlineBoonOptionEntity>(this);
}
