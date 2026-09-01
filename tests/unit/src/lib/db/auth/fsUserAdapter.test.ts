/**
 * Filesystem User Adapter Unit Tests
 *
 * @fileoverview Tests for fs-backed user persistence.
 *
 * @module tests/unit/src/lib/db/auth/fsUserAdapter.test
 */

import fs from 'fs';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/logging/logger', () => ({
  logger: {
    child: () => ({ error: vi.fn(), debug: vi.fn(), message: vi.fn() }),
  },
}));

const DATA_PATH = path.resolve(process.cwd(), '.meta/runtime/users.json');

const MOCK_USER = {
  id: 'u-1',
  username: 'admin',
  passwordHash: 'a'.repeat(64),
  role: 'admin' as const,
  createdAt: '2025-01-01T00:00:00.000Z',
};

describe('fsUserAdapter', () => {
  beforeEach(() => {
    vi.resetModules();
    if (fs.existsSync(DATA_PATH)) fs.unlinkSync(DATA_PATH);
  });

  afterEach(() => {
    if (fs.existsSync(DATA_PATH)) fs.unlinkSync(DATA_PATH);
  });

  it('should create and find a user by username', async () => {
    const { fsUserAdapter } = await import('@/lib/db/auth/fsUserAdapter');

    await fsUserAdapter.create(MOCK_USER);
    const found = await fsUserAdapter.findByUsername('Admin');
    expect(found).toBeTruthy();
    expect(found?.id).toBe('u-1');
  });

  it('should find a user by id', async () => {
    const { fsUserAdapter } = await import('@/lib/db/auth/fsUserAdapter');

    await fsUserAdapter.create(MOCK_USER);
    const found = await fsUserAdapter.findById('u-1');
    expect(found?.username).toBe('admin');
  });

  it('should return null for missing user', async () => {
    const { fsUserAdapter } = await import('@/lib/db/auth/fsUserAdapter');

    const found = await fsUserAdapter.findByUsername('nonexistent');
    expect(found).toBeNull();
  });

  it('should throw on duplicate username', async () => {
    const { fsUserAdapter } = await import('@/lib/db/auth/fsUserAdapter');

    await fsUserAdapter.create(MOCK_USER);
    await expect(fsUserAdapter.create(MOCK_USER)).rejects.toThrow(
      'Username already exists',
    );
  });

  it('should update user fields', async () => {
    const { fsUserAdapter } = await import('@/lib/db/auth/fsUserAdapter');

    await fsUserAdapter.create(MOCK_USER);
    await fsUserAdapter.update('u-1', {
      lastLoginAt: '2025-06-01T00:00:00.000Z',
    });

    const found = await fsUserAdapter.findById('u-1');
    expect(found?.lastLoginAt).toBe('2025-06-01T00:00:00.000Z');
  });

  it('should list all users', async () => {
    const { fsUserAdapter } = await import('@/lib/db/auth/fsUserAdapter');

    await fsUserAdapter.create(MOCK_USER);
    const users = await fsUserAdapter.listAll();
    expect(users).toHaveLength(1);
  });

  it('should delete a user', async () => {
    const { fsUserAdapter } = await import('@/lib/db/auth/fsUserAdapter');

    await fsUserAdapter.create(MOCK_USER);
    await fsUserAdapter.delete('u-1');
    const users = await fsUserAdapter.listAll();
    expect(users).toHaveLength(0);
  });

  it('should throw when deleting non-existent user', async () => {
    const { fsUserAdapter } = await import('@/lib/db/auth/fsUserAdapter');

    await expect(fsUserAdapter.delete('fake')).rejects.toThrow(
      'User not found',
    );
  });
});
