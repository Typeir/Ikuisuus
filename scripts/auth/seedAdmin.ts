#!/usr/bin/env npx tsx --tsconfig tsconfig.scripts.json

/**
 * @fileoverview Admin User Seed Script
 * @description Creates the initial admin user in Edge Config.
 * Reads the admin password from CORRECTIONS_SECRET — the same value
 * users will type in the UI to log in as admin.
 *
 * @module scripts/auth/seedAdmin
 * @version 1.0.0
 *
 * @example
 * ```bash
 * npm run seed-admin
 * npm run seed-admin -- --username boss
 * ```
 */

import { createLogger } from '@/lib/logging/logger';
import crypto from 'crypto';
import { readFileSync } from 'fs';
import { resolve } from 'path';
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
    const content = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8');
    const match = content.match(new RegExp(`^${key}=(.+)$`, 'm'));
    return match ? match[1].trim() : undefined;
  } catch {
    return undefined;
  }
};

const secret = loadFromEnvLocal('CORRECTIONS_SECRET');
const edgeConfigId = loadFromEnvLocal('EDGE_CONFIG_ID');
const vercelToken = loadFromEnvLocal('VERCEL_API_TOKEN');

if (!secret) {
  log.error('❌ CORRECTIONS_SECRET is not set.');
  process.exit(1);
}

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
log.message('=== Seed Admin User ===');
log.message(`Username    : ${username}`);
log.message(`Password    : ${password}`);
log.message(`Role        : admin`);
log.message(`ID          : ${user.id}`);
log.message(`Hash        : ${passwordHash}`);

if (!edgeConfigId || !vercelToken) {
  log.message('');
  log.message('⚠️  EDGE_CONFIG_ID or VERCEL_API_TOKEN not set.');
  log.message(
    '   Cannot write to Edge Config. Here is the user JSON to store manually:',
  );
  log.message('');
  log.message(JSON.stringify([user], null, 2));
  log.message('');
  log.message(
    'Store this under the "corrections_users" key in your Edge Config.',
  );
  process.exit(0);
}

/** Write directly to Edge Config */
const writeToEdgeConfig = async (): Promise<void> => {
  const USERS_KEY = 'corrections_users';

  const res = await fetch(
    `https://api.vercel.com/v1/edge-config/${edgeConfigId}/items`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${vercelToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [{ operation: 'upsert', key: USERS_KEY, value: [user] }],
      }),
    },
  );

  if (!res.ok) {
    const body = await res.text();
    log.error(`❌ Edge Config write failed`, { status: res.status, body });
    process.exit(1);
  }

  log.message('');
  log.message('✅ Admin user written to Edge Config.');
  log.message('');
  log.message(`Login with: username="${username}" password="${password}"`);
  log.message('');
};

writeToEdgeConfig().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  log.error('❌ Fatal', { error: message });
  process.exit(1);
});
