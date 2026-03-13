/**
 * @fileoverview Edge Config User Adapter
 * @description Implements the `UserAdapter` interface using Vercel Edge Config.
 * Users are stored as a JSON array under a single Edge Config key.
 *
 * This adapter re-uses the same write pattern as `edgeConfigAuditAdapter`
 * (Vercel REST API for writes, `@vercel/edge-config` SDK for reads).
 *
 * @module lib/db/auth/edgeConfigUserAdapter
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { logger } from '@/lib/logging/logger';
import type { StoredUser } from './schemas';
import type { UserAdapter } from './userAdapter';

const log = logger.child({ module: 'EdgeConfigUser' });

/** Edge Config key that holds the users array. */
const USERS_KEY = 'corrections_users';

/* ────────────────  Internal read/write helpers  ───────────────────── */

/**
 * Reads the users array from Edge Config.
 *
 * @returns {Promise<StoredUser[]>} Stored users or empty array on failure
 */
const readUsers = async (): Promise<StoredUser[]> => {
  try {
    const { get } = await import('@vercel/edge-config');
    const data = await get<StoredUser[]>(USERS_KEY);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    log.debug('Edge Config user read failed — returning empty', {
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
};

/**
 * Writes the full users array back to Edge Config via the Vercel REST API.
 *
 * @param {StoredUser[]} users - Complete users array to persist
 * @returns {Promise<void>}
 */
const writeUsers = async (users: StoredUser[]): Promise<void> => {
  const edgeConfigId = process.env.EDGE_CONFIG_ID;
  const vercelToken = process.env.VERCEL_API_TOKEN;

  if (!edgeConfigId || !vercelToken) {
    log.debug(
      'EDGE_CONFIG_ID or VERCEL_API_TOKEN not set — user write skipped',
    );
    return;
  }

  const res = await fetch(
    `https://api.vercel.com/v1/edge-config/${edgeConfigId}/items`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${vercelToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [{ operation: 'upsert', key: USERS_KEY, value: users }],
      }),
    },
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Edge Config user write failed (${res.status}): ${body}`);
  }
};

/* ───────────────────────────  Adapter  ─────────────────────────────── */

/**
 * Vercel Edge Config user adapter.
 *
 * Stores user records as a JSON array under a single Edge Config key.
 * Suitable for small user counts (< 100). For larger deployments swap
 * in `postgresUserAdapter`.
 *
 * Required environment variables:
 *   - `EDGE_CONFIG` — Connection string (auto-set by Vercel)
 *   - `EDGE_CONFIG_ID` — Edge Config store ID (for write API)
 *   - `VERCEL_API_TOKEN` — Token with Edge Config write scope
 */
export const edgeConfigUserAdapter: UserAdapter = {
  findByUsername: async (username: string): Promise<StoredUser | null> => {
    const users = await readUsers();
    return (
      users.find((u) => u.username.toLowerCase() === username.toLowerCase()) ??
      null
    );
  },

  findById: async (id: string): Promise<StoredUser | null> => {
    const users = await readUsers();
    return users.find((u) => u.id === id) ?? null;
  },

  create: async (user: StoredUser): Promise<void> => {
    const users = await readUsers();
    if (
      users.some(
        (u) => u.username.toLowerCase() === user.username.toLowerCase(),
      )
    ) {
      throw new Error(`Username "${user.username}" already exists`);
    }
    users.push(user);
    await writeUsers(users);
  },

  update: async (id: string, fields: Partial<StoredUser>): Promise<void> => {
    const users = await readUsers();
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) {
      throw new Error(`User not found: ${id}`);
    }
    users[idx] = { ...users[idx], ...fields };
    await writeUsers(users);
  },

  listAll: async (): Promise<StoredUser[]> => {
    return readUsers();
  },

  delete: async (id: string): Promise<void> => {
    const users = await readUsers();
    const filtered = users.filter((u) => u.id !== id);
    if (filtered.length === users.length) {
      throw new Error(`User not found: ${id}`);
    }
    await writeUsers(filtered);
  },
};
