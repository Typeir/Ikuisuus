/**
 * @fileoverview Audit Storage Adapter Interface
 * @description Defines a pluggable adapter contract for persisting audit records.
 * Implementations can target Vercel Edge Config, a database, or any other backend
 * without changing consumer code.
 *
 * @module lib/db/auditAdapter
 * @version 1.0.0
 * @author Typeir
 * @since 2.0.0
 */

/**
 * Shape of a single audit record persisted by the adapter.
 *
 * @property {string} content_path - Relative file path inside the content repo
 * @property {string} base_sha - Git blob SHA the edit was based on
 * @property {string} [pr_url] - GitHub PR URL (absent on failures)
 * @property {'submitted' | 'conflict' | 'error'} status - Outcome
 * @property {string} token_id - Audit-safe token identifier (label or hash prefix)
 * @property {string} [timestamp] - ISO-8601 timestamp (auto-set by implementations)
 */
export interface AuditRecord {
  /** Relative file path inside the content repo */
  content_path: string;
  /** Git blob SHA the edit was based on */
  base_sha: string;
  /** GitHub PR URL (absent on failures) */
  pr_url?: string;
  /** Outcome */
  status: 'submitted' | 'conflict' | 'error';
  /** Audit-safe token identifier (label or hash prefix) */
  token_id: string;
  /** ISO-8601 timestamp (auto-set by implementations) */
  timestamp?: string;
}

/**
 * Adapter interface for audit log persistence.
 * Implementations MUST be safe to call even when the backing store is unavailable
 * (graceful degradation over hard failures).
 */
export interface AuditAdapter {
  /**
   * Persists a single audit record.
   *
   * @param {AuditRecord} record - The record to persist
   * @returns {Promise<void>}
   */
  write: (record: AuditRecord) => Promise<void>;

  /**
   * Reads recent audit records (most-recent-first).
   *
   * @param {number} [limit] - Maximum number of records to return (default 50)
   * @returns {Promise<AuditRecord[]>}
   */
  read: (limit?: number) => Promise<AuditRecord[]>;
}
