/**
 * @fileoverview Audit Log Facade
 * @description Provides the public `writeAuditLog` function consumed by the corrections
 * API. Delegates to the factory-resolved `AuditAdapter` implementation. The active
 * backend is selected by `METADATA_BACKEND` env var (fs or pg).
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
 * Never throws — failed writes are logged but swallowed so they do not
 * block the corrections flow.
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
