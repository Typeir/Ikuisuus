/**
 * @fileoverview MikroORM Entity — BannedIp
 * @description Decorator-based entity for the `banned_ips` table.
 *
 * @module lib/db/orm/entities/BannedIpEntity
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

/**
 * MikroORM entity for the `banned_ips` table.
 */
@Entity({ tableName: 'banned_ips' })
export class BannedIpEntity {
  @PrimaryKey({ autoincrement: true })
  id!: number;

  @Property({ type: 'string', unique: true })
  range!: string;

  @Property({ type: 'string' })
  reason!: string;

  @Property({
    type: 'Date',
    fieldName: 'banned_at',
    columnType: 'timestamptz',
    defaultRaw: 'now()',
  })
  bannedAt!: Date;

  @Property({ type: 'string', fieldName: 'source_ip', nullable: true })
  sourceIp?: string;
}
