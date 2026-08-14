/**
 * @fileoverview Audit Log Facade
 * @description Exports the public `writeAuditLog` function, delegating to the
 * factory-resolved `AuditAdapter`. Backend selected by `METADATA_BACKEND` env var (fs or pg).
 *
 * @module lib/db/auditLog
 * @version 3.0.0
 * @author Typeir
 * @since 2.0.0
 */

import { logger } from '@/lib/logging/logger';
import type { AuditRecord } from './auditAdapter';
import { auditAdapter } from './auditAdapterFactory';

export type { AuditRecord } from './auditAdapter';

const log = logger.child({ module: 'AuditLog' });

/**
 * Active adapter instance resolved by the audit adapter factory.
 */
const adapter = auditAdapter;

/**
 * Persists an audit record via the active adapter.
 *
 * Never throws — failed writes are logged and swallowed.
 *
 * @param {AuditRecord} record - The audit data to persist
 * @returns {Promise<void>}
 *
 * @example
 * ```ts
 * await writeAuditLog({
 *   content_path: 'en/monsters/aboleth.sheet.mdx',
 *   base_sha: 'abc123',
 *   pr_url: 'https://github.com/.../pull/42',
 *   status: 'submitted',
 *   token_id: 'editor-a',
 * });
 * ```
 */
export const writeAuditLog = async (record: AuditRecord): Promise<void> => {
  try {
    await adapter.write(record);
  } catch (error) {
    log.error('Audit log write failed', {
      error: error instanceof Error ? error.message : String(error),
      record,
    });
  }
};
