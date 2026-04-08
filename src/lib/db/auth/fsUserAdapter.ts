/**
 * @fileoverview Filesystem User Adapter
 * @description Implements the `UserAdapter` interface using a local JSON file.
 * User records are persisted as an array in `.meta/runtime/users.json`.
 *
 * Suitable for local development and single-instance deployments.
 * For multi-instance production use, prefer the PostgreSQL adapter.
 *
 * @module lib/db/auth/fsUserAdapter
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { logger } from '@/lib/logging/logger';
import fs from 'fs';
import path from 'path';
import type { StoredUser } from './schemas';
import type { UserAdapter } from './userAdapter';

const log = logger.child({ module: 'FSUser' });

/** Resolved path to the users JSON file. */
const DATA_PATH = path.resolve(process.cwd(), '.meta/runtime/users.json');

/**
 * Ensures the parent directory for the data file exists.
 */
const ensureDir = (): void => {
  const dir = path.dirname(DATA_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

/**
 * Reads user records from the JSON file.
 *
 * @returns {StoredUser[]} Stored users or empty array
 */
const readUsers = (): StoredUser[] => {
  try {
    if (!fs.existsSync(DATA_PATH)) return [];
    const raw = fs.readFileSync(DATA_PATH, 'utf-8');
    const data: unknown = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    log.debug('FS user read failed — returning empty', {
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
};

/**
 * Writes user records to the JSON file.
 *
 * @param {StoredUser[]} users - Full user array to persist
 */
const writeUsers = (users: StoredUser[]): void => {
  ensureDir();
  fs.writeFileSync(DATA_PATH, JSON.stringify(users, null, 2), 'utf-8');
};

/**
 * Filesystem-backed user adapter.
 *
 * Stores user records as a JSON array in `.meta/runtime/users.json`.
 */
export const fsUserAdapter: UserAdapter = {
  findByUsername: async (username: string): Promise<StoredUser | null> => {
    const users = readUsers();
    const lower = username.toLowerCase();
    return users.find((u) => u.username.toLowerCase() === lower) ?? null;
  },

  findById: async (id: string): Promise<StoredUser | null> => {
    const users = readUsers();
    return users.find((u) => u.id === id) ?? null;
  },

  create: async (user: StoredUser): Promise<void> => {
    const users = readUsers();
    const existing = users.find(
      (u) => u.username.toLowerCase() === user.username.toLowerCase(),
    );
    if (existing) {
      throw new Error(`Username already exists: ${user.username}`);
    }
    users.push(user);
    writeUsers(users);
  },

  update: async (id: string, fields: Partial<StoredUser>): Promise<void> => {
    const users = readUsers();
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error(`User not found: ${id}`);
    users[idx] = { ...users[idx], ...fields };
    writeUsers(users);
  },

  listAll: async (): Promise<StoredUser[]> => {
    return readUsers();
  },

  delete: async (id: string): Promise<void> => {
    const users = readUsers();
    const filtered = users.filter((u) => u.id !== id);
    if (filtered.length === users.length) {
      throw new Error(`User not found: ${id}`);
    }
    writeUsers(filtered);
  },
};
