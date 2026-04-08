/**
 * @fileoverview PostgreSQL Audit Adapter (MikroORM)
 * @description Implements the `AuditAdapter` interface using MikroORM.
 * Queries the `audit_logs` table via the shared ORM singleton.
 *
 * @module lib/db/adapters/pg/pgAuditAdapter
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import type { AuditAdapter, AuditRecord } from '@/lib/db/auditAdapter';
import { AuditRecordEntity } from '@/lib/db/orm/entities/AuditRecordEntity';
import { getEM } from '@/lib/db/orm/orm';
import { logger } from '@/lib/logging/logger';

const log = logger.child({ module: 'PGAudit' });

/**
 * Maps an `AuditRecordEntity` row to an `AuditRecord` domain object.
 *
 * @param {AuditRecordEntity} row - MikroORM entity
 * @returns {AuditRecord} Domain model
 */
const rowToAuditRecord = (row: AuditRecordEntity): AuditRecord => ({
  content_path: row.contentPath,
  base_sha: row.baseSha,
  pr_url: row.prUrl,
  status: row.status as AuditRecord['status'],
  token_id: row.tokenId,
  timestamp: row.timestamp.toISOString(),
});

/**
 * MikroORM-backed audit adapter for the `audit_logs` table.
 */
export const pgAuditAdapter: AuditAdapter = {
  write: async (record: AuditRecord): Promise<void> => {
    try {
      const em = await getEM();
      em.create(AuditRecordEntity, {
        contentPath: record.content_path,
        baseSha: record.base_sha,
        prUrl: record.pr_url,
        status: record.status,
        tokenId: record.token_id,
        timestamp: record.timestamp ? new Date(record.timestamp) : new Date(),
      });
      await em.flush();
    } catch (error) {
      log.error('Failed to write audit record to PostgreSQL', {
        error: error instanceof Error ? error.message : String(error),
        record,
      });
    }
  },

  read: async (limit = 50): Promise<AuditRecord[]> => {
    try {
      const em = await getEM();
      const rows = await em.find(
        AuditRecordEntity,
        {},
        { orderBy: { timestamp: 'desc' }, limit },
      );
      return rows.map(rowToAuditRecord);
    } catch (error) {
      log.error('Failed to read audit records from PostgreSQL', {
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  },
};
