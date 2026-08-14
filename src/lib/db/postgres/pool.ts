/**
 * @fileoverview Shared PostgreSQL Connection Pool
 * @description Singleton `pg.Pool`, created on first `getPool()` call from
 * `DATABASE_URL`. `getPool()` throws if `DATABASE_URL` is unset.
 *
 * @module lib/db/postgres/pool
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { Pool, type QueryResult } from 'pg';

/** Lazy singleton — `null` until first `getPool()` call. */
let pool: Pool | null = null;

/**
 * Returns the shared `pg.Pool` instance, creating it on first call.
 *
 * @returns {Pool} Ready-to-query pool
 * @throws {Error} If `DATABASE_URL` is not set
 */
export const getPool = (): Pool => {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        'DATABASE_URL is not set — cannot create PostgreSQL pool.',
      );
    }
    pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });
  }
  return pool;
};

/**
 * Runs a parameterised SQL query on the shared pool.
 *
 * @param {string} text - SQL with $1, $2, … placeholders
 * @param {unknown[]} [params] - Bind values
 * @returns {Promise<QueryResult>} pg result object
 */
export const query = async (
  text: string,
  params?: unknown[],
): Promise<QueryResult> => {
  return getPool().query(text, params);
};

/**
 * Shuts down the pool. Call during process cleanup.
 *
 * @returns {Promise<void>}
 */
export const closePool = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = null;
  }
};
