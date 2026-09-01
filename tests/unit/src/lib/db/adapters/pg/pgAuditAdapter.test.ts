/**
 * PostgreSQL Audit Adapter Unit Tests
 *
 * @fileoverview Tests for pg-backed audit adapter using mocked ORM.
 *
 * @module tests/unit/src/lib/db/adapters/pg/pgAuditAdapter.test
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockCreate = vi.fn();
const mockFlush = vi.fn();
const mockFind = vi.fn();

vi.mock('@/lib/db/orm/orm', () => ({
  getEM: vi.fn().mockResolvedValue({
    create: mockCreate,
    flush: mockFlush,
    find: mockFind,
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
});

afterEach(() => vi.restoreAllMocks());

describe('pgAuditAdapter', () => {
  it('should write a record via ORM', async () => {
    mockFlush.mockResolvedValue(undefined);

    const { pgAuditAdapter } =
      await import('@/lib/db/adapters/pg/pgAuditAdapter');

    await pgAuditAdapter.write({
      content_path: 'en/test.mdx',
      base_sha: 'abc',
      status: 'submitted',
      token_id: 'editor-a',
    });

    expect(mockCreate).toHaveBeenCalled();
    expect(mockFlush).toHaveBeenCalled();
  });

  it('should read records in descending timestamp order', async () => {
    mockFind.mockResolvedValue([
      {
        contentPath: 'en/test.mdx',
        baseSha: 'abc',
        prUrl: null,
        status: 'submitted',
        tokenId: 'editor-a',
        timestamp: new Date('2025-01-01T00:00:00Z'),
      },
    ]);

    const { pgAuditAdapter } =
      await import('@/lib/db/adapters/pg/pgAuditAdapter');

    const records = await pgAuditAdapter.read(10);
    expect(records).toHaveLength(1);
    expect(records[0].content_path).toBe('en/test.mdx');
    expect(records[0].timestamp).toBe('2025-01-01T00:00:00.000Z');
  });

  it('should return empty array on ORM failure', async () => {
    mockFind.mockRejectedValue(new Error('DB down'));

    const { pgAuditAdapter } =
      await import('@/lib/db/adapters/pg/pgAuditAdapter');

    const records = await pgAuditAdapter.read();
    expect(records).toEqual([]);
  });
});
