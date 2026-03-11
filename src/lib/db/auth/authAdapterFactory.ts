/**
 * @fileoverview Auth Adapter Factory
 * @description Resolves the user storage adapter based on `METADATA_BACKEND` env var.
 * Mirrors the same factory pattern used by the content repositories (heirloomRepository, etc.).
 *
 * Supported backends:
 * - `pg`   → PostgreSQL via MikroORM (`postgresUserAdapter`)
 * - `edge` → Vercel Edge Config (`edgeConfigUserAdapter`) — default for serverless deployments
 *
 * @module lib/db/auth/authAdapterFactory
 * @version 1.1.0
 * @author Typeir
 * @since 3.0.0
 */

import { edgeConfigUserAdapter } from './edgeConfigUserAdapter';
import { postgresUserAdapter } from './postgresUserAdapter';
import type { UserAdapter } from './userAdapter';

/** @property {string} metadataBackend - Active backend: `'pg'` or `'edge'` (default). */
const metadataBackend = process.env.METADATA_BACKEND || 'edge';

/**
 * Factory function that resolves the user adapter for the active backend.
 *
 * @returns {UserAdapter} User storage adapter
 * @throws {Error} If `METADATA_BACKEND` is set to an unsupported value
 */
const createUserAdapter = (): UserAdapter => {
  switch (metadataBackend) {
    case 'pg':
      return postgresUserAdapter;
    case 'edge':
      return edgeConfigUserAdapter;
    default:
      throw new Error(`Unsupported auth backend: ${metadataBackend}`);
  }
};

/**
 * Resolved user adapter instance based on environment.
 *
 * @property {UserAdapter} userAdapter - Factory-resolved user adapter
 */
export const userAdapter = createUserAdapter();
