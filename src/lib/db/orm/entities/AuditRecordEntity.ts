/**
 * @fileoverview MikroORM Entity — AuditRecord
 * @description Decorator-based entity for the `audit_logs` table.
 *
 * @module lib/db/orm/entities/AuditRecordEntity
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

/**
 * MikroORM entity for the `audit_logs` table.
 */
@Entity({ tableName: 'audit_logs' })
export class AuditRecordEntity {
  @PrimaryKey({ autoincrement: true })
  id!: number;

  @Property({ type: 'string', fieldName: 'content_path' })
  contentPath!: string;

  @Property({ type: 'string', fieldName: 'base_sha' })
  baseSha!: string;

  @Property({ type: 'string', fieldName: 'pr_url', nullable: true })
  prUrl?: string;

  @Property({ type: 'string' })
  status!: string;

  @Property({ type: 'string', fieldName: 'token_id' })
  tokenId!: string;

  @Property({
    type: 'Date',
    columnType: 'timestamptz',
    defaultRaw: 'now()',
  })
  timestamp!: Date;
}
