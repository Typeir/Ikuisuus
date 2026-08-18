/**
 * @fileoverview MikroORM Entity — Bloodline Boon Option
 * @description One selectable option of a variable-cost boon: name, anchor, cost, effect, aspects.
 *
 * @module lib/db/orm/entities/BloodlineBoonOptionEntity
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
import type { BloodlineBoonEntity } from './BloodlineBoonEntity';

/**
 * MikroORM entity for the `bloodline_boon_options` table.
 */
@OrmEntity('BloodlineBoonOptionEntity', { tableName: 'bloodline_boon_options' })
@OrmIndex({ properties: ['boon'], name: 'bloodline_boon_options_boon_id_idx' })
export class BloodlineBoonOptionEntity {
  @OrmPrimaryKey({ type: 'number', autoincrement: true })
  id!: number;

  @OrmManyToOne({
    entity: 'BloodlineBoonEntity',
    fieldName: 'boon_id',
    deleteRule: 'cascade',
  })
  boon!: BloodlineBoonEntity;

  @OrmProperty({ type: 'string' })
  name!: string;

  /** @property {string | null} anchor - Anchor slug of the option name */
  @OrmProperty({ type: 'string', nullable: true })
  anchor?: string | null;

  /** @property {number} bpValue - BP cost of this option */
  @OrmProperty({ type: 'number', fieldName: 'bp_value', columnType: 'smallint' })
  bpValue!: number;

  /** @property {string | null} effect - Short effect summary */
  @OrmProperty({ type: 'string', nullable: true })
  effect?: string | null;

  @OrmProperty({ type: 'string[]' })
  tags: string[] = [];

  @OrmProperty({
    type: 'number',
    fieldName: 'sort_order',
    columnType: 'smallint',
  })
  sortOrder!: number;
}
