/**
 * Banned IP Adapter Factory Unit Tests
 *
 * @fileoverview Tests for the banned IP adapter factory resolution logic.
 *
 * @module tests/unit/lib/security/bannedIpsAdapterFactory
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockFsAdapter = { read: vi.fn(), write: vi.fn(), remove: vi.fn() };
const mockPgAdapter = { read: vi.fn(), write: vi.fn(), remove: vi.fn() };

vi.mock('@/lib/security/adapters/fsBannedIpsAdapter', () => ({
  fsBannedIpsAdapter: mockFsAdapter,
}));
vi.mock('@/lib/security/adapters/pgBannedIpsAdapter', () => ({
  pgBannedIpsAdapter: mockPgAdapter,
}));

const originalEnv = { ...process.env };

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  process.env = { ...originalEnv };
});

describe('bannedIpsAdapterFactory', () => {
  it('should resolve to pg adapter when METADATA_BACKEND=pg', async () => {
    process.env.METADATA_BACKEND = 'pg';
    const { bannedIpsAdapter } =
      await import('@/lib/security/bannedIpsAdapterFactory');
    expect(bannedIpsAdapter).toBe(mockPgAdapter);
  });

  it('should resolve to fs adapter when METADATA_BACKEND=fs', async () => {
    process.env.METADATA_BACKEND = 'fs';
    const { bannedIpsAdapter } =
      await import('@/lib/security/bannedIpsAdapterFactory');
    expect(bannedIpsAdapter).toBe(mockFsAdapter);
  });

  it('should default to fs adapter when METADATA_BACKEND is unset', async () => {
    delete process.env.METADATA_BACKEND;
    const { bannedIpsAdapter } =
      await import('@/lib/security/bannedIpsAdapterFactory');
    expect(bannedIpsAdapter).toBe(mockFsAdapter);
  });

  it('should throw for unsupported METADATA_BACKEND values', async () => {
    process.env.METADATA_BACKEND = 'redis';
    await expect(
      import('@/lib/security/bannedIpsAdapterFactory'),
    ).rejects.toThrow('Unsupported banned IP backend: redis');
  });
});
