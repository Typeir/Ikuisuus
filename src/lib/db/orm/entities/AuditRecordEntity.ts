/**
 * @fileoverview MikroORM Entity — AuditRecord
 * @description Decorator-based entity for the `audit_logs` table.
 *
 * @module lib/db/orm/entities/AuditRecordEntity
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { OrmEntity, OrmPrimaryKey, OrmProperty } from '@/lib/db/orm/schema';

/**
 * MikroORM entity for the `audit_logs` table.
 */
@OrmEntity('AuditRecordEntity', { tableName: 'audit_logs' })
export class AuditRecordEntity {
  @OrmPrimaryKey({ type: 'number', autoincrement: true })
  id!: number;

  @OrmProperty({ type: 'string', fieldName: 'content_path' })
  contentPath!: string;

  @OrmProperty({ type: 'string', fieldName: 'base_sha' })
  baseSha!: string;

  @OrmProperty({ type: 'string', fieldName: 'pr_url', nullable: true })
  prUrl?: string;

  @OrmProperty({ type: 'string' })
  status!: string;

  @OrmProperty({ type: 'string', fieldName: 'token_id' })
  tokenId!: string;

  @OrmProperty({
    type: 'Date',
    columnType: 'timestamptz',
    defaultRaw: 'now()',
  })
  timestamp!: Date;
}
