/**
 * @fileoverview Metadata Module Types
 * @description Type contracts for the app-side metadata sync pipeline.
 *
 * @module lib/metadata/types
 * @version 1.0.0
 * @author Typeir
 * @since 7.0.0
 */

/**
 * Result of a hash-based incremental sync operation.
 *
 * @property {number} inserted - New records inserted
 * @property {number} updated - Existing records updated (hash changed)
 * @property {number} skipped - Records skipped (hash unchanged)
 * @property {number} deleted - Stale records removed
 */
export interface SyncResult {
  inserted: number;
  updated: number;
  skipped: number;
  deleted: number;
}

/**
 * Options for one content type's sync.
 *
 * @property {Record<string, unknown>[]} [records] - Pre-parsed records to sync instead of reading sidecars
 * @property {boolean} [allowDeletion] - Removes rows with no incoming record. Destructive; safe only with a full read. Defaults to false
 */
export interface SyncOptions {
  records?: Record<string, unknown>[];
  allowDeletion?: boolean;
}
