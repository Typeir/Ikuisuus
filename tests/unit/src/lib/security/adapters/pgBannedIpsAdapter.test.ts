/**
 * PostgreSQL Banned IP Adapter Unit Tests
 *
 * @fileoverview Tests for pg-backed banned IP adapter using mocked ORM.
 *
 * @module tests/unit/lib/security/adapters/pgBannedIpsAdapter
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockCreate = vi.fn();
const mockFlush = vi.fn();
const mockFind = vi.fn();
const mockFindOne = vi.fn();
const mockRemoveAndFlush = vi.fn();

vi.mock('@/lib/db/orm/orm', () => ({
  getEM: vi.fn().mockResolvedValue({
    create: mockCreate,
    flush: mockFlush,
    find: mockFind,
    findOne: mockFindOne,
    removeAndFlush: mockRemoveAndFlush,
  }),
}));

vi.mock('@/lib/logging/logger', () => ({
  logger: {
    child: () => ({ error: vi.fn(), debug: vi.fn(), message: vi.fn() }),
  },
}));

beforeEach(() => {
  vi.resetModules();
  mockCreate.mockReset();
  mockFlush.mockReset();
  mockFind.mockReset();
  mockFindOne.mockReset();
  mockRemoveAndFlush.mockReset();
});

afterEach(() => vi.restoreAllMocks());

describe('pgBannedIpsAdapter', () => {
  it('should read entries from the database', async () => {
    mockFind.mockResolvedValue([
      {
        range: '10.0.0.0/24',
        reason: 'test',
        bannedAt: new Date('2025-01-01T00:00:00Z'),
        sourceIp: '10.0.0.1',
      },
    ]);

    const { pgBannedIpsAdapter } =
      await import('@/lib/security/adapters/pgBannedIpsAdapter');

    const entries = await pgBannedIpsAdapter.read();
    expect(entries).toHaveLength(1);
    expect(entries[0].range).toBe('10.0.0.0/24');
    expect(entries[0].bannedAt).toBe('2025-01-01T00:00:00.000Z');
  });

  it('should write entries via ORM', async () => {
    mockFindOne.mockResolvedValue(null);
    mockFlush.mockResolvedValue(undefined);

    const { pgBannedIpsAdapter } =
      await import('@/lib/security/adapters/pgBannedIpsAdapter');

    await pgBannedIpsAdapter.write([
      {
        range: '192.168.0.0/24',
        reason: 'spam',
        bannedAt: '2025-01-01T00:00:00.000Z',
      },
    ]);

    expect(mockCreate).toHaveBeenCalled();
    expect(mockFlush).toHaveBeenCalled();
  });

  it('should remove an entry by range', async () => {
    const mockRow = { range: '10.0.0.0/24' };
    mockFindOne.mockResolvedValue(mockRow);
    mockRemoveAndFlush.mockResolvedValue(undefined);

    const { pgBannedIpsAdapter } =
      await import('@/lib/security/adapters/pgBannedIpsAdapter');

    const result = await pgBannedIpsAdapter.remove('10.0.0.0/24');
    expect(result).toBe(true);
    expect(mockRemoveAndFlush).toHaveBeenCalledWith(mockRow);
  });

  it('should return false when range not found', async () => {
    mockFindOne.mockResolvedValue(null);

    const { pgBannedIpsAdapter } =
      await import('@/lib/security/adapters/pgBannedIpsAdapter');

    const result = await pgBannedIpsAdapter.remove('10.0.0.0/24');
    expect(result).toBe(false);
  });

  it('should return empty array on DB failure', async () => {
    mockFind.mockRejectedValue(new Error('DB down'));

    const { pgBannedIpsAdapter } =
      await import('@/lib/security/adapters/pgBannedIpsAdapter');

    const entries = await pgBannedIpsAdapter.read();
    expect(entries).toEqual([]);
  });
});
