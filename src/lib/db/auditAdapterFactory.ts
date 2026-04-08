/**
 * @fileoverview Audit Adapter Factory
 * @description Resolves the audit storage adapter based on `METADATA_BACKEND` env var.
 * Mirrors the same factory pattern used by the content repositories and auth system.
 *
 * Supported backends:
 * - `fs` → Filesystem JSON file (default for local development)
 * - `pg` → PostgreSQL via MikroORM
 *
 * @module lib/db/auditAdapterFactory
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { fsAuditAdapter } from './adapters/fs/fsAuditAdapter';
import { pgAuditAdapter } from './adapters/pg/pgAuditAdapter';
import type { AuditAdapter } from './auditAdapter';

/** @property {string} metadataBackend - Active backend: `'fs'` (default) or `'pg'`. */
const metadataBackend = process.env.METADATA_BACKEND || 'fs';

/**
 * Factory function that resolves the audit adapter for the active backend.
 *
 * @returns {AuditAdapter} Audit storage adapter
 * @throws {Error} If `METADATA_BACKEND` is set to an unsupported value
 */
const createAuditAdapter = (): AuditAdapter => {
  switch (metadataBackend) {
    case 'pg':
      return pgAuditAdapter;
    case 'fs':
      return fsAuditAdapter;
    default:
      throw new Error(`Unsupported audit backend: ${metadataBackend}`);
  }
};

/**
 * Resolved audit adapter instance based on environment.
 *
 * @property {AuditAdapter} auditAdapter - Factory-resolved audit adapter
 */
export const auditAdapter = createAuditAdapter();
