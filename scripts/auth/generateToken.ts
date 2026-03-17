#!/usr/bin/env npx tsx --tsconfig tsconfig.scripts.json

/**
 * @fileoverview Capability Token Generator CLI
 * @description Generates HMAC-signed capability tokens for the Corrections module.
 * Reads CORRECTIONS_SECRET from the environment (or .env.local).
 *
 * @module scripts/auth/generateToken
 * @version 1.0.0
 *
 * @example
 * ```bash
 * CORRECTIONS_SECRET=my-secret npx tsx scripts/auth/generateToken.ts --label editor-a
 * CORRECTIONS_SECRET=my-secret npx tsx scripts/auth/generateToken.ts --label editor-b --hours 168
 * ```
 */

import { createLogger } from '@/lib/logging/logger';
import crypto from 'crypto';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const log = createLogger({ script: 'generateToken' });

/**
 * Reads a CLI argument value by flag name.
 *
 * @param flag - CLI flag (e.g. '--label')
 * @param fallback - Default if not provided
 * @returns The argument value or fallback
 */
const getArg = (flag: string, fallback?: string): string | undefined => {
  const idx = process.argv.indexOf(flag);
  return idx !== -1 && process.argv[idx + 1] ? process.argv[idx + 1] : fallback;
};

/**
 * Attempts to load CORRECTIONS_SECRET from .env.local if not set.
 *
 * @returns The secret string or undefined
 */
const loadSecret = (): string | undefined => {
  if (process.env.CORRECTIONS_SECRET) {
    return process.env.CORRECTIONS_SECRET;
  }
  try {
    const envPath = resolve(process.cwd(), '.env.local');
    const content = readFileSync(envPath, 'utf-8');
    const match = content.match(/^CORRECTIONS_SECRET=(.+)$/m);
    return match ? match[1].trim() : undefined;
  } catch {
    return undefined;
  }
};

const secret = loadSecret();
if (!secret) {
  log.error(
    '❌ CORRECTIONS_SECRET is not set. Provide it via environment or .env.local',
  );
  process.exit(1);
}

const label = getArg('--label', undefined);
const hoursRaw = getArg('--hours', undefined);
const scope = getArg('--scope', 'content:write') ?? 'content:write';

const payload: Record<string, unknown> = {
  scope,
  ...(hoursRaw
    ? { exp: Math.floor(Date.now() / 1000) + parseInt(hoursRaw, 10) * 3600 }
    : {}),
  ...(label ? { label } : {}),
};

const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
const signature = crypto
  .createHmac('sha256', secret)
  .update(payloadB64)
  .digest('base64url');
const token = `${payloadB64}.${signature}`;

log.message('');
log.message('=== Capability Token ===');
log.message(`Scope  : ${scope}`);
log.message(`Label  : ${label || '(none)'}`);
log.message(
  `Expires: ${(payload.exp as number) ? new Date((payload.exp as number) * 1000).toISOString() + ` (${hoursRaw}h)` : 'never'}`,
);
log.message('');
log.message(token);
log.message('');
