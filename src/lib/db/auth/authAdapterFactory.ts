/**
 * @fileoverview Auth Adapter Factory
 * @description Resolves the user storage adapter from `METADATA_BACKEND`.
 * Backends: `'fs'` (default, Filesystem JSON) or `'pg'` (PostgreSQL via MikroORM).
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
 * Resolves the user adapter for the active backend.
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
 * User adapter for the resolved backend.
 *
 * @property {UserAdapter} userAdapter - Factory-resolved user adapter
 */
export const userAdapter = createUserAdapter();
