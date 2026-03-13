/**
 * Auth Adapter Factory Unit Tests
 *
 * @fileoverview Tests for the auth adapter factory resolution logic.
 *
 * @module tests/unit/lib/db/auth/authAdapterFactory
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockPgAdapter = {
  findByUsername: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  listAll: vi.fn(),
  delete: vi.fn(),
};

const mockEdgeAdapter = {
  findByUsername: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  listAll: vi.fn(),
  delete: vi.fn(),
};

vi.mock('@/lib/db/auth/postgresUserAdapter', () => ({
  postgresUserAdapter: mockPgAdapter,
}));

vi.mock('@/lib/db/auth/edgeConfigUserAdapter', () => ({
  edgeConfigUserAdapter: mockEdgeAdapter,
}));

const originalEnv = { ...process.env };

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  process.env = { ...originalEnv };
});

describe('authAdapterFactory', () => {
  it('should resolve to PostgreSQL adapter when METADATA_BACKEND=pg', async () => {
    process.env.METADATA_BACKEND = 'pg';

    const { userAdapter } = await import('@/lib/db/auth/authAdapterFactory');
    expect(userAdapter).toBe(mockPgAdapter);
  });

  it('should resolve to Edge Config adapter when METADATA_BACKEND=edge', async () => {
    process.env.METADATA_BACKEND = 'edge';

    const { userAdapter } = await import('@/lib/db/auth/authAdapterFactory');
    expect(userAdapter).toBe(mockEdgeAdapter);
  });

  it('should default to Edge Config adapter when METADATA_BACKEND is unset', async () => {
    delete process.env.METADATA_BACKEND;

    const { userAdapter } = await import('@/lib/db/auth/authAdapterFactory');
    expect(userAdapter).toBe(mockEdgeAdapter);
  });

  it('should throw for unsupported METADATA_BACKEND values', async () => {
    process.env.METADATA_BACKEND = 'redis';

    await expect(
      import('@/lib/db/auth/authAdapterFactory'),
    ).rejects.toThrow('Unsupported auth backend: redis');
  });

  it('should NOT use DATABASE_URL alone to determine adapter', async () => {
    process.env.DATABASE_URL = 'postgresql://...';
    process.env.METADATA_BACKEND = 'edge';

    const { userAdapter } = await import('@/lib/db/auth/authAdapterFactory');
    expect(userAdapter).toBe(mockEdgeAdapter);
  });
});
