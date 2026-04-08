/**
 * Audit Adapter Factory Unit Tests
 *
 * @fileoverview Tests for the audit adapter factory resolution logic.
 *
 * @module tests/unit/lib/db/auditAdapterFactory
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockFsAdapter = { write: vi.fn(), read: vi.fn() };
const mockPgAdapter = { write: vi.fn(), read: vi.fn() };

vi.mock('@/lib/db/adapters/fs/fsAuditAdapter', () => ({
  fsAuditAdapter: mockFsAdapter,
}));
vi.mock('@/lib/db/adapters/pg/pgAuditAdapter', () => ({
  pgAuditAdapter: mockPgAdapter,
}));

const originalEnv = { ...process.env };

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  process.env = { ...originalEnv };
});

describe('auditAdapterFactory', () => {
  it('should resolve to pg adapter when METADATA_BACKEND=pg', async () => {
    process.env.METADATA_BACKEND = 'pg';
    const { auditAdapter } = await import('@/lib/db/auditAdapterFactory');
    expect(auditAdapter).toBe(mockPgAdapter);
  });

  it('should resolve to fs adapter when METADATA_BACKEND=fs', async () => {
    process.env.METADATA_BACKEND = 'fs';
    const { auditAdapter } = await import('@/lib/db/auditAdapterFactory');
    expect(auditAdapter).toBe(mockFsAdapter);
  });

  it('should default to fs adapter when METADATA_BACKEND is unset', async () => {
    delete process.env.METADATA_BACKEND;
    const { auditAdapter } = await import('@/lib/db/auditAdapterFactory');
    expect(auditAdapter).toBe(mockFsAdapter);
  });

  it('should throw for unsupported METADATA_BACKEND values', async () => {
    process.env.METADATA_BACKEND = 'redis';
    await expect(import('@/lib/db/auditAdapterFactory')).rejects.toThrow(
      'Unsupported audit backend: redis',
    );
  });
});
