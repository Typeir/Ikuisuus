/**
 * @fileoverview User Storage Adapter Interface
 * @description Defines the pluggable adapter contract for user persistence.
 * Implementations can target Vercel Edge Config, PostgreSQL, or any other backend
 * without changing consumer code. Mirrors the existing `AuditAdapter` pattern.
 *
 * @module lib/db/auth/userAdapter
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import type { StoredUser } from './schemas';

/**
 * Adapter interface for user persistence.
 * Implementations MUST be safe to call even when the backing store is unavailable
 * (graceful degradation over hard failures).
 */
export interface UserAdapter {
  /**
   * Finds a user by username (case-insensitive).
   *
   * @param {string} username - Login name to search for
   * @returns {Promise<StoredUser | null>} Matching user or null
   */
  findByUsername: (username: string) => Promise<StoredUser | null>;

  /**
   * Finds a user by their unique ID.
   *
   * @param {string} id - User ID
   * @returns {Promise<StoredUser | null>} Matching user or null
   */
  findById: (id: string) => Promise<StoredUser | null>;

  /**
   * Creates a new user record.
   *
   * @param {StoredUser} user - Fully populated user object (password already hashed)
   * @returns {Promise<void>}
   * @throws {Error} If the username already exists
   */
  create: (user: StoredUser) => Promise<void>;

  /**
   * Updates an existing user record (partial merge).
   *
   * @param {string} id - User ID to update
   * @param {Partial<StoredUser>} fields - Fields to merge
   * @returns {Promise<void>}
   */
  update: (id: string, fields: Partial<StoredUser>) => Promise<void>;

  /**
   * Lists all user records.
   *
   * @returns {Promise<StoredUser[]>} All stored users
   */
  listAll: () => Promise<StoredUser[]>;

  /**
   * Deletes a user by ID.
   *
   * @param {string} id - User ID to remove
   * @returns {Promise<void>}
   */
  delete: (id: string) => Promise<void>;
}
