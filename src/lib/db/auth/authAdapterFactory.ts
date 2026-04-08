/**
 * @fileoverview Auth Adapter Factory
 * @description Resolves the user storage adapter based on `METADATA_BACKEND` env var.
 * Mirrors the same factory pattern used by the content repositories.
 *
 * Supported backends:
 * - `fs`  → Filesystem JSON file (`fsUserAdapter`) — default for local development
 * - `pg`  → PostgreSQL via MikroORM (`postgresUserAdapter`)
 *
 * @module lib/db/auth/authAdapterFactory
 * @version 2.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { fsUserAdapter } from './fsUserAdapter';
import { postgresUserAdapter } from './postgresUserAdapter';
import type { UserAdapter } from './userAdapter';

/** @property {string} metadataBackend - Active backend: `'fs'` (default) or `'pg'`. */
const metadataBackend = process.env.METADATA_BACKEND || 'fs';

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
    case 'fs':
      return fsUserAdapter;
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
