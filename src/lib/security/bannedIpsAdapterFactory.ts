/**
 * @fileoverview Banned IP Adapter Factory
 * @description Resolves the banned IP persistence adapter based on `METADATA_BACKEND`
 * env var.
 *
 * @module lib/security/bannedIpsAdapterFactory
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { fsBannedIpsAdapter } from './adapters/fsBannedIpsAdapter';
import { pgBannedIpsAdapter } from './adapters/pgBannedIpsAdapter';
import type { BannedIpsAdapter } from './bannedIpsAdapter';

/** @property {string} metadataBackend - Active backend */
const metadataBackend = process.env.METADATA_BACKEND || 'fs';

/**
 * Factory function that resolves the banned IP adapter for the active backend.
 *
 * @returns {BannedIpsAdapter} Banned IP storage adapter
 * @throws {Error} If `METADATA_BACKEND` is set to an unsupported value
 */
const createBannedIpsAdapter = (): BannedIpsAdapter => {
  switch (metadataBackend) {
    case 'pg':
      return pgBannedIpsAdapter;
    case 'fs':
      return fsBannedIpsAdapter;
    default:
      throw new Error(`Unsupported banned IP backend: ${metadataBackend}`);
  }
};

/**
 * Resolved banned IP adapter instance based on environment.
 *
 * @property {BannedIpsAdapter} bannedIpsAdapter - Factory-resolved adapter
 */
export const bannedIpsAdapter = createBannedIpsAdapter();
