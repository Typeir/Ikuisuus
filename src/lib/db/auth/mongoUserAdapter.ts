/**
 * @fileoverview MongoDB User Adapter (Prisma)
 * @description Implements the `UserAdapter` interface using Prisma ORM against
 * the `corrections_users` MongoDB collection. Maps between MongoDB ObjectId-based
 * documents and the string-ID `StoredUser` domain type.
 *
 * Required environment variables:
 *   - `MONGODB_URL` — MongoDB connection string
 *
 * @module lib/db/auth/mongoUserAdapter
 * @version 1.0.0
 * @author Typeir
 * @since 4.0.0
 */

import { mongoPrisma } from '@/lib/db/prisma/mongoClient';
import type { CorrectionsUser } from '@/lib/db/prisma/generated/mongo';
import { logger } from '@/lib/logging/logger';
import { formatDate } from '../content/adapters/pg/rowParsers';
import type { StoredUser } from './schemas';
import type { UserAdapter } from './userAdapter';

const log = logger.child({ module: 'MongoUser' });

/* ────────────────────────  Doc mapper  ─────────────────────────────── */

/**
 * Maps a Prisma MongoDB `CorrectionsUser` document to a `StoredUser` domain object.
 *
 * @param {CorrectionsUser} doc - Prisma document
 * @returns {StoredUser} Domain model
 */
const docToUser = (doc: CorrectionsUser): StoredUser => ({
  id: doc.id,
  username: doc.username,
  passwordHash: doc.passwordHash,
  role: doc.role as StoredUser['role'],
  createdAt: formatDate(doc.createdAt) ?? new Date().toISOString(),
  lastLoginAt: formatDate(doc.lastLoginAt),
});

/* ───────────────────────────  Adapter  ─────────────────────────────── */

/**
 * Prisma-backed user adapter for the `corrections_users` MongoDB collection.
 */
export const mongoUserAdapter: UserAdapter = {
  findByUsername: async (username: string): Promise<StoredUser | null> => {
    try {
      const doc = await mongoPrisma.correctionsUser.findFirst({
        where: { username: { equals: username, mode: 'insensitive' } },
      });
      return doc ? docToUser(doc) : null;
    } catch (error) {
      log.error('findByUsername failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  },

  findById: async (id: string): Promise<StoredUser | null> => {
    try {
      const doc = await mongoPrisma.correctionsUser.findUnique({ where: { id } });
      return doc ? docToUser(doc) : null;
    } catch (error) {
      log.error('findById failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  },

  create: async (user: StoredUser): Promise<void> => {
    await mongoPrisma.correctionsUser.create({
      data: {
        username: user.username,
        passwordHash: user.passwordHash,
        role: user.role,
        createdAt: new Date(user.createdAt),
        lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt) : null,
      },
    });
  },

  update: async (id: string, fields: Partial<StoredUser>): Promise<void> => {
    const data: Record<string, unknown> = {};

    if (fields.username !== undefined) data.username = fields.username;
    if (fields.passwordHash !== undefined)
      data.passwordHash = fields.passwordHash;
    if (fields.role !== undefined) data.role = fields.role;
    if (fields.lastLoginAt !== undefined) {
      data.lastLoginAt = new Date(fields.lastLoginAt);
    }

    if (Object.keys(data).length === 0) return;

    await mongoPrisma.correctionsUser.update({ where: { id }, data });
  },

  listAll: async (): Promise<StoredUser[]> => {
    try {
      const docs = await mongoPrisma.correctionsUser.findMany({
        orderBy: { createdAt: 'asc' },
      });
      return docs.map(docToUser);
    } catch (error) {
      log.error('listAll failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      await mongoPrisma.correctionsUser.delete({ where: { id } });
    } catch (error) {
      throw new Error(`User not found: ${id}`);
    }
  },
};
