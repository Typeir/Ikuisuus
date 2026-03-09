/**
 * @fileoverview Prisma Client Singleton
 * @description Exports a singleton `PrismaClient` backed by the `@prisma/adapter-pg`
 * driver adapter. Reuses the shared `pg.Pool` from `lib/db/postgres/pool` so the
 * entire application shares one connection pool.
 *
 * The Next.js global singleton pattern is used in development to avoid exhausting
 * connection limits during hot-module-replacement restarts.
 *
 * Usage:
 *   import { prisma } from '@/lib/db/prisma/client';
 *   const monsters = await prisma.monster.findMany({ where: { locale: 'en' } });
 *
 * @module lib/db/prisma/client
 * @version 1.0.0
 * @author Typeir
 * @since 4.0.0
 */

import { getPool } from '@/lib/db/postgres/pool';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/sql';

/** @property {symbol} prismaKey - Global symbol used to cache the client in dev. */
const prismaKey = Symbol.for('prisma.client');

type GlobalWithPrisma = typeof globalThis & {
  [prismaKey]?: PrismaClient;
};

/**
 * Creates a new `PrismaClient` bound to the shared `pg.Pool`.
 *
 * @returns {PrismaClient} Ready-to-query Prisma client
 */
const createPrismaClient = (): PrismaClient => {
  const adapter = new PrismaPg(getPool());
  return new PrismaClient({ adapter });
};

/**
 * Singleton `PrismaClient` instance.
 *
 * In production a new client is created once per module load.
 * In development the instance is cached on `globalThis` so HMR restarts
 * do not create a new pool on every file change.
 */
export const prisma: PrismaClient =
  process.env.NODE_ENV === 'production'
    ? createPrismaClient()
    : ((globalThis as GlobalWithPrisma)[prismaKey] ??= createPrismaClient());
