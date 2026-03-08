/**
 * @fileoverview PostgreSQL User Adapter
 * @description Implements the `UserAdapter` interface using the shared `pg.Pool`.
 * Queries the `corrections_users` table for all user CRUD operations.
 *
 * Required environment variables:
 *   - `DATABASE_URL` — PostgreSQL connection string
 *
 * Expected table schema (auto-created by the seed script or migration):
 *
 * ```sql
 * CREATE TABLE IF NOT EXISTS corrections_users (
 *   id            TEXT PRIMARY KEY,
 *   username      TEXT UNIQUE NOT NULL,
 *   password_hash TEXT NOT NULL,
 *   role          TEXT NOT NULL DEFAULT 'editor',
 *   created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 *   last_login_at TIMESTAMPTZ
 * );
 * ```
 *
 * @module lib/db/auth/postgresUserAdapter
 * @version 2.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { query } from '@/lib/db/postgres/pool';
import { logger } from '@/lib/logging/logger';
import type { StoredUser } from './schemas';
import type { UserAdapter } from './userAdapter';

const log = logger.child({ module: 'PostgresUser' });

/* ────────────────────────  Row mapper  ─────────────────────────────── */

/**
 * Maps a raw database row to a `StoredUser` object.
 *
 * @param {Record<string, unknown>} row - Raw row from `corrections_users` table
 * @returns {StoredUser} Mapped user
 */
const rowToUser = (row: Record<string, unknown>): StoredUser => ({
  id: String(row.id),
  username: String(row.username),
  passwordHash: String(row.password_hash),
  role: row.role as StoredUser['role'],
  createdAt:
    row.created_at instanceof Date
      ? row.created_at.toISOString()
      : String(row.created_at),
  lastLoginAt: row.last_login_at
    ? row.last_login_at instanceof Date
      ? row.last_login_at.toISOString()
      : String(row.last_login_at)
    : undefined,
});

/* ───────────────────────────  Adapter  ─────────────────────────────── */

/**
 * PostgreSQL user adapter.
 *
 * Expects a `corrections_users` table with the following schema:
 *
 * ```sql
 * CREATE TABLE IF NOT EXISTS corrections_users (
 *   id            TEXT PRIMARY KEY,
 *   username      TEXT UNIQUE NOT NULL,
 *   password_hash TEXT NOT NULL,
 *   role          TEXT NOT NULL DEFAULT 'editor',
 *   created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 *   last_login_at TIMESTAMPTZ
 * );
 * ```
 *
 * Required environment variables:
 *   - `DATABASE_URL` — PostgreSQL connection string
 */
export const postgresUserAdapter: UserAdapter = {
  findByUsername: async (username: string): Promise<StoredUser | null> => {
    try {
      const result = await query(
        'SELECT * FROM corrections_users WHERE LOWER(username) = LOWER($1) LIMIT 1',
        [username],
      );
      return result.rows.length > 0 ? rowToUser(result.rows[0]) : null;
    } catch (error) {
      log.error('findByUsername failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  },

  findById: async (id: string): Promise<StoredUser | null> => {
    try {
      const result = await query(
        'SELECT * FROM corrections_users WHERE id = $1 LIMIT 1',
        [id],
      );
      return result.rows.length > 0 ? rowToUser(result.rows[0]) : null;
    } catch (error) {
      log.error('findById failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  },

  create: async (user: StoredUser): Promise<void> => {
    await query(
      `INSERT INTO corrections_users (id, username, password_hash, role, created_at, last_login_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        user.id,
        user.username,
        user.passwordHash,
        user.role,
        user.createdAt,
        user.lastLoginAt ?? null,
      ],
    );
  },

  update: async (id: string, fields: Partial<StoredUser>): Promise<void> => {
    const setClauses: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (fields.username !== undefined) {
      setClauses.push(`username = $${idx++}`);
      params.push(fields.username);
    }
    if (fields.passwordHash !== undefined) {
      setClauses.push(`password_hash = $${idx++}`);
      params.push(fields.passwordHash);
    }
    if (fields.role !== undefined) {
      setClauses.push(`role = $${idx++}`);
      params.push(fields.role);
    }
    if (fields.lastLoginAt !== undefined) {
      setClauses.push(`last_login_at = $${idx++}`);
      params.push(fields.lastLoginAt);
    }

    if (setClauses.length === 0) return;

    params.push(id);
    await query(
      `UPDATE corrections_users SET ${setClauses.join(', ')} WHERE id = $${idx}`,
      params,
    );
  },

  listAll: async (): Promise<StoredUser[]> => {
    try {
      const result = await query(
        'SELECT * FROM corrections_users ORDER BY created_at ASC',
      );
      return result.rows.map(rowToUser);
    } catch (error) {
      log.error('listAll failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  },

  delete: async (id: string): Promise<void> => {
    const result = await query('DELETE FROM corrections_users WHERE id = $1', [
      id,
    ]);
    if (result.rowCount === 0) {
      throw new Error(`User not found: ${id}`);
    }
  },
};
