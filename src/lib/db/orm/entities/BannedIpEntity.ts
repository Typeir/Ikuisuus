/**
 * @fileoverview MikroORM Entity — BannedIp
 * @description Decorator-based entity for the `banned_ips` table.
 *
 * @module lib/db/orm/entities/BannedIpEntity
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { OrmEntity, OrmPrimaryKey, OrmProperty } from '@/lib/db/orm/schema';

/**
 * MikroORM entity for the `banned_ips` table.
 */
@OrmEntity('BannedIpEntity', { tableName: 'banned_ips' })
export class BannedIpEntity {
  @OrmPrimaryKey({ type: 'number', autoincrement: true })
  id!: number;

  @OrmProperty({ type: 'string', unique: true })
  range!: string;

  @OrmProperty({ type: 'string' })
  reason!: string;

  @OrmProperty({
    type: 'Date',
    fieldName: 'banned_at',
    columnType: 'timestamptz',
    defaultRaw: 'now()',
  })
  bannedAt!: Date;

  @OrmProperty({ type: 'string', fieldName: 'source_ip', nullable: true })
  sourceIp?: string;
}
