#!/usr/bin/env npx tsx --tsconfig tsconfig.scripts.json

/**
 * @fileoverview Seeds an admin user into the backend selected by the
 * METADATA_BACKEND env var. Password comes from CORRECTIONS_SECRET.
 * @description Creates the initial admin user using the active backend.
 * Reads the admin password from CORRECTIONS_SECRET.
 * Side effects: with `fs`, writes `.meta/runtime/users.json`; with `pg`,
 * upserts the `corrections_users` PostgreSQL table.
 *
 * @module scripts/auth/seedAdmin
 * @version 2.0.0
 *
 * @example
 * ```bash
 * npm run seed-admin
 * npm run seed-admin -- --username boss
 * METADATA_BACKEND=pg npm run seed-admin
 * ```
 */

import { createLogger } from '@/lib/logging/logger';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { getArgValue } from '../core/cliArgs';

const log = createLogger({ script: 'seedAdmin' });

/**
 * Attempts to load an env var from .env.local when not in the environment.
 *
 * @param key - Environment variable name
 * @returns The value or undefined
 */
const loadFromEnvLocal = (key: string): string | undefined => {
  if (process.env[key]) return process.env[key];
  try {
    const content = fs.readFileSync(
      path.resolve(process.cwd(), '.env.local'),
      'utf-8',
    );
    const match = content.match(new RegExp(`^${key}=(.+)$`, 'm'));
    return match ? match[1].trim() : undefined;
  } catch {
    return undefined;
  }
};

const secret = loadFromEnvLocal('CORRECTIONS_SECRET');
if (!secret) {
  log.error('❌ CORRECTIONS_SECRET is not set.');
  process.exit(1);
}

const backend = loadFromEnvLocal('METADATA_BACKEND') ?? 'fs';
const username = getArgValue('--username') ?? 'admin';
const password = secret;
const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

const user = {
  id: crypto.randomUUID(),
  username,
  passwordHash,
  role: 'admin',
  createdAt: new Date().toISOString(),
};

log.message('');
log.message(`=== Seed Admin User (${backend}) ===`);
log.message(`Username    : ${username}`);
log.message(`Password    : ${password}`);
log.message(`Role        : admin`);
log.message(`ID          : ${user.id}`);
log.message(`Hash        : ${passwordHash}`);

/**
 * Writes the admin user to the filesystem backend.
 */
const writeToFs = async (): Promise<void> => {
  const dataPath = path.resolve(process.cwd(), '.meta/runtime/users.json');
  const dir = path.dirname(dataPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(dataPath, JSON.stringify([user], null, 2), 'utf-8');
  log.message('');
  log.message('✅ Admin user written to .meta/runtime/users.json');
  log.message('');
  log.message(`Login with: username="${username}" password="${password}"`);
};

/**
 * Writes the admin user to the PostgreSQL backend.
 */
const writeToPostgres = async (): Promise<void> => {
  const connectionString = loadFromEnvLocal('DATABASE_URL');
  if (!connectionString) {
    log.error('❌ DATABASE_URL is not set.');
    process.exit(1);
  }

  const pg = await import('pg');
  const pool = new pg.default.Pool({ connectionString, max: 1 });

  try {
    await pool.query(
      `INSERT INTO corrections_users (id, username, password_hash, role, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (username) DO UPDATE
       SET password_hash = $3, role = $4
       RETURNING *`,
      [user.id, username, passwordHash, 'admin'],
    );
    log.message('');
    log.message('✅ Admin user written to PostgreSQL.');
    log.message('');
    log.message(`Login with: username="${username}" password="${password}"`);
  } finally {
    await pool.end();
  }
};

/**
 * Entry point — dispatches to the active backend.
 */
const main = async (): Promise<void> => {
  switch (backend) {
    case 'fs':
      await writeToFs();
      break;
    case 'pg':
      await writeToPostgres();
      break;
    default:
      log.error(`❌ Unsupported METADATA_BACKEND: ${backend}`);
      process.exit(1);
  }
};

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  log.error('❌ Fatal', { error: message });
  process.exit(1);
});
