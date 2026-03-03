#!/usr/bin/env node

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
 * # Generate a non-expiring token with label (default)
 * CORRECTIONS_SECRET=my-secret node scripts/auth/generateToken.mjs --label editor-a
 *
 * # Generate a token that expires in 7 days
 * CORRECTIONS_SECRET=my-secret node scripts/auth/generateToken.mjs --label editor-b --hours 168
 * ```
 */

import crypto from 'crypto';
import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Reads a CLI argument value by flag name.
 * @param {string} flag - CLI flag (e.g. '--label')
 * @param {string} [fallback] - Default if not provided
 * @returns {string|undefined}
 */
const getArg = (flag, fallback) => {
  const idx = process.argv.indexOf(flag);
  return idx !== -1 && process.argv[idx + 1] ? process.argv[idx + 1] : fallback;
};

/**
 * Attempts to load CORRECTIONS_SECRET from .env.local if not set.
 * @returns {string|undefined}
 */
const loadSecret = () => {
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
  console.error(
    '❌ CORRECTIONS_SECRET is not set. Provide it via environment or .env.local',
  );
  process.exit(1);
}

const label = getArg('--label', undefined);
const hoursRaw = getArg('--hours', undefined);
const scope = getArg('--scope', 'content:write');

const payload = {
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

console.log('');
console.log('=== Capability Token ===');
console.log(`Scope  : ${scope}`);
console.log(`Label  : ${label || '(none)'}`);
console.log(
  `Expires: ${payload.exp ? new Date(payload.exp * 1000).toISOString() + ` (${hoursRaw}h)` : 'never'}`,
);
console.log('');
console.log(token);
console.log('');
