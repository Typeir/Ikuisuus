/**
 * @fileoverview MongoDB Prisma Client Singleton
 * @description Exports a singleton `PrismaClient` for the MongoDB datasource.
 * Unlike the SQL client, no driver adapter is needed — Prisma connects to
 * MongoDB natively via the connection string in `MONGODB_URL`.
 *
 * The Next.js global singleton pattern is used in development to avoid
 * creating multiple connections during hot-module-replacement restarts.
 *
 * Usage:
 *   import { mongoPrisma } from '@/lib/db/prisma/mongoClient';
 *   const monsters = await mongoPrisma.monster.findMany({ where: { locale: 'en' } });
 *
 * @module lib/db/prisma/mongoClient
 * @version 1.0.0
 * @author Typeir
 * @since 4.0.0
 */

import { PrismaClient } from './generated/mongo';

/** @property {symbol} mongoKey - Global symbol used to cache the client in dev. */
const mongoKey = Symbol.for('prisma.mongo.client');

type GlobalWithMongo = typeof globalThis & {
  [mongoKey]?: PrismaClient;
};

/**
 * Creates a new MongoDB `PrismaClient`.
 *
 * @returns {PrismaClient} Ready-to-query Prisma client for MongoDB
 */
const createMongoClient = (): PrismaClient =>
  new PrismaClient();

/**
 * Singleton MongoDB `PrismaClient` instance.
 *
 * In production a new client is created once per module load.
 * In development the instance is cached on `globalThis` so HMR restarts
 * do not open duplicate connections.
 */
export const mongoPrisma: PrismaClient =
  process.env.NODE_ENV === 'production'
    ? createMongoClient()
    : ((globalThis as GlobalWithMongo)[mongoKey] ??= createMongoClient());
