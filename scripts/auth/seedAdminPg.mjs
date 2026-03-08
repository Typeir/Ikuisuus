#!/usr/bin/env node

/**
 * @fileoverview PostgreSQL Admin User Seed Script
 * @description Adds an admin user to the PostgreSQL corrections_users table.
 *
 * Run after database is initialized:
 *   npm run seed-admin-pg
 *   # or with custom credentials:
 *   npm run seed-admin-pg -- --username boss --password mypassword
 *
 * @module scripts/auth/seedAdminPg
 * @version 1.0.0
 *
 * @example
 * ```bash
 * npm run seed-admin-pg -- --username admin --password JOHN_SUNSHINE
 * ```
 */

import crypto from 'crypto';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import pg from 'pg';
import { createLogger } from '../core/logger.mjs';

const log = createLogger({ script: 'seedAdminPg' });

const { Pool } = pg;

/**
 * Reads a CLI argument value by flag name.
 *
 * @param {string} flag - CLI flag (e.g. '--username')
 * @param {string} [fallback] - Default if not provided
 * @returns {string | undefined}
 */
const getArg = (flag, fallback) => {
  const idx = process.argv.indexOf(flag);
  return idx !== -1 && process.argv[idx + 1] ? process.argv[idx + 1] : fallback;
};

/**
 * Attempts to load an env var from .env.local when not in the environment.
 *
 * @param {string} key - Environment variable name
 * @returns {string | undefined}
 */
const loadFromEnvLocal = (key) => {
  if (process.env[key]) return process.env[key];
  try {
    const content = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8');
    const match = content.match(new RegExp(`^${key}=(.+)$`, 'm'));
    return match ? match[1].trim() : undefined;
  } catch {
    return undefined;
  }
};

const connectionString = loadFromEnvLocal('DATABASE_URL');
if (!connectionString) {
  log.error('❌ DATABASE_URL is not set in .env.local or environment.');
  process.exit(1);
}

const username = getArg('--username', 'admin');
const password = getArg('--password');

if (!password) {
  log.error('❌ --password is required.');
  log.message(
    '   Usage: npm run seed-admin-pg -- --username admin --password JOHN_SUNSHINE',
  );
  process.exit(1);
}

const id = crypto.randomUUID();
const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

log.message('');
log.message('=== Seed Admin User (PostgreSQL) ===');
log.message(`Username    : ${username}`);
log.message(`Password    : ${password}`);
log.message(`Password Hash : ${passwordHash}`);
log.message(`Role        : admin`);
log.message(`ID          : ${id}`);

const pool = new Pool({ connectionString, max: 1 });

/**
 * Write user to PostgreSQL
 */
const writeToPostgres = async () => {
  try {
    const result = await pool.query(
      `INSERT INTO corrections_users (id, username, password_hash, role, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (username) DO UPDATE
       SET password_hash = $3, role = $4
       RETURNING *`,
      [id, username, passwordHash, 'admin'],
    );

    log.message('');
    log.message('✅ Admin user written to PostgreSQL.');
    log.message('');
    log.message(`Login with: username="${username}" password="${password}"`);
    log.message('');

    const user = result.rows[0];
    log.message('User details:');
    log.message(
      JSON.stringify(
        {
          id: user.id,
          username: user.username,
          role: user.role,
          created_at: user.created_at,
        },
        null,
        2,
      ),
    );
    log.message('');
  } catch (err) {
    log.error('❌ PostgreSQL write failed', {
      error: err.message || String(err),
    });
    process.exit(1);
  } finally {
    await pool.end();
  }
};

writeToPostgres().catch((err) => {
  log.error('❌ Fatal', { error: err.message || String(err) });
  process.exit(1);
});
