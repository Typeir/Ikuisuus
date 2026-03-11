/**
 * @fileoverview PostgreSQL User Adapter (MikroORM)
 * @description Implements the `UserAdapter` interface using MikroORM.
 * Queries the `corrections_users` table via the shared ORM singleton.
 *
 * Required environment variables:
 *   - `DATABASE_URL` — PostgreSQL connection string
 *
 * @module lib/db/auth/postgresUserAdapter
 * @version 4.0.0
 * @author Typeir
 * @since 5.0.0
 */

import { CorrectionsUserEntity } from '@/lib/db/orm/entities/CorrectionsUserEntity';
import { formatDate } from '@/lib/db/orm/helpers';
import { getEM } from '@/lib/db/orm/orm';
import { logger } from '@/lib/logging/logger';
import type { StoredUser } from './schemas';
import type { UserAdapter } from './userAdapter';

const log = logger.child({ module: 'PostgresUser' });

/* ────────────────────────  Row mapper  ─────────────────────────────── */

/**
 * Maps a MikroORM `CorrectionsUser` entity to a `StoredUser` domain object.
 *
 * @param {CorrectionsUserEntity} row - MikroORM entity
 * @returns {StoredUser} Domain model
 */
const rowToUser = (row: CorrectionsUserEntity): StoredUser => ({
  id: row.id,
  username: row.username,
  passwordHash: row.passwordHash,
  role: row.role as StoredUser['role'],
  createdAt: formatDate(row.createdAt) ?? new Date().toISOString(),
  lastLoginAt: formatDate(row.lastLoginAt),
});

/* ───────────────────────────  Adapter  ─────────────────────────────── */

/**
 * MikroORM-backed user adapter for the `corrections_users` table.
 */
export const postgresUserAdapter: UserAdapter = {
  findByUsername: async (username: string): Promise<StoredUser | null> => {
    try {
      const em = await getEM();
      const row = await em.findOne(CorrectionsUserEntity, {
        username: { $ilike: username },
      });
      return row ? rowToUser(row) : null;
    } catch (error) {
      log.error('findByUsername failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  },

  findById: async (id: string): Promise<StoredUser | null> => {
    try {
      const em = await getEM();
      const row = await em.findOne(CorrectionsUserEntity, { id });
      return row ? rowToUser(row) : null;
    } catch (error) {
      log.error('findById failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  },

  create: async (user: StoredUser): Promise<void> => {
    const em = await getEM();
    em.create(CorrectionsUserEntity, {
      id: user.id,
      username: user.username,
      passwordHash: user.passwordHash,
      role: user.role,
      createdAt: new Date(user.createdAt),
      lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt) : null,
    });
    await em.flush();
  },

  update: async (id: string, fields: Partial<StoredUser>): Promise<void> => {
    const em = await getEM();
    const row = await em.findOneOrFail(CorrectionsUserEntity, { id });

    if (fields.username !== undefined) row.username = fields.username;
    if (fields.passwordHash !== undefined)
      row.passwordHash = fields.passwordHash;
    if (fields.role !== undefined) row.role = fields.role;
    if (fields.lastLoginAt !== undefined) {
      row.lastLoginAt = new Date(fields.lastLoginAt);
    }

    await em.flush();
  },

  listAll: async (): Promise<StoredUser[]> => {
    try {
      const em = await getEM();
      const rows = await em.find(
        CorrectionsUserEntity,
        {},
        { orderBy: { createdAt: 'asc' } },
      );
      return rows.map(rowToUser);
    } catch (error) {
      log.error('listAll failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  },

  delete: async (id: string): Promise<void> => {
    const em = await getEM();
    const row = await em.findOne(CorrectionsUserEntity, { id });
    if (!row) throw new Error(`User not found: ${id}`);
    await em.removeAndFlush(row);
  },
};
