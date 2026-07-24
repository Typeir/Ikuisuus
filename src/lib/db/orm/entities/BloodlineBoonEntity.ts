/**
 * @fileoverview MikroORM Entity — Bloodline Boon
 * @description Decorator-based entity for the `bloodline_boons` child table.
 * Each row represents a single boon option belonging to a bloodline.
 * Foreign-keyed to `bloodlines.id` via ManyToOne.
 *
 * @module lib/db/orm/entities/BloodlineBoonEntity
 * @version 1.0.0
 * @author Typeir
 * @since 7.0.0
 */

import type { BloodlineBoonSubOption } from '@/lib/db/content/schemas/bloodlineMetadata';
import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { BloodlineEntity } from './index';

/**
 * MikroORM entity for the `bloodline_boons` table.
 */
@Entity({ tableName: 'bloodline_boons' })
export class BloodlineBoonEntity {
  @PrimaryKey({ type: 'number', autoincrement: true })
  id!: number;

  @ManyToOne(() => BloodlineEntity, {
    fieldName: 'bloodline_id',
    deleteRule: 'cascade',
  })
  bloodline!: BloodlineEntity;

  @Property({ type: 'string' })
  name!: string;

  @Property({ type: 'string', fieldName: 'bp_label' })
  bpLabel!: string;

  @Property({
    type: 'number',
    fieldName: 'bp_value',
    columnType: 'smallint',
    nullable: true,
  })
  bpValue?: number | null;

  @Property({
    type: 'number',
    fieldName: 'sort_order',
    columnType: 'smallint',
  })
  sortOrder!: number;

  @Property({ type: 'string[]' })
  tags: string[] = [];

  /** @property {number | null} startLine - 1-indexed start line of this boon's heading block in the source MDX */
  @Property({
    type: 'number',
    fieldName: 'start_line',
    columnType: 'smallint',
    nullable: true,
  })
  startLine?: number | null;

  /** @property {number | null} endLine - 1-indexed last line of this boon's content block in the source MDX */
  @Property({
    type: 'number',
    fieldName: 'end_line',
    columnType: 'smallint',
    nullable: true,
  })
  endLine?: number | null;

  /** @property {BloodlineBoonSubOption[] | null} subOptions - Selectable options for a variable-cost boon, stored as JSONB */
  @Property({
    type: 'json',
    fieldName: 'sub_options',
    columnType: 'jsonb',
    nullable: true,
  })
  subOptions?: BloodlineBoonSubOption[] | null;
}
