/**
 * @fileoverview Metadata Module Barrel Export
 * @description Re-exports app-side metadata utilities.
 *
 * @module lib/metadata/index
 * @version 2.0.0
 * @author Typeir
 * @since 3.0.0
 */

export { contentHash, fnv1a32 } from './contentHash';
export { syncMetadata } from './syncService';
export type { SyncResult } from './types';

