/**
 * Filesystem Audit Adapter Unit Tests
 *
 * @fileoverview Tests for fs-backed audit record persistence.
 *
 * @module tests/unit/src/lib/db/adapters/fs/fsAuditAdapter.test
 */

import fs from 'fs';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/logging/logger', () => ({
  logger: {
    child: () => ({ error: vi.fn(), debug: vi.fn(), message: vi.fn() }),
  },
}));

const DATA_PATH = path.resolve(process.cwd(), '.meta/runtime/audit-log.json');

describe('fsAuditAdapter', () => {
  beforeEach(() => {
    vi.resetModules();
    if (fs.existsSync(DATA_PATH)) fs.unlinkSync(DATA_PATH);
  });

  afterEach(() => {
    if (fs.existsSync(DATA_PATH)) fs.unlinkSync(DATA_PATH);
  });

  it('should write and read audit records', async () => {
    const { fsAuditAdapter } =
      await import('@/lib/db/adapters/fs/fsAuditAdapter');

    await fsAuditAdapter.write({
      content_path: 'en/test.mdx',
      base_sha: 'abc123',
      status: 'submitted',
      token_id: 'editor-a',
    });

    const records = await fsAuditAdapter.read();
    expect(records).toHaveLength(1);
    expect(records[0].content_path).toBe('en/test.mdx');
    expect(records[0].timestamp).toBeDefined();
  });

  it('should return empty array when file does not exist', async () => {
    const { fsAuditAdapter } =
      await import('@/lib/db/adapters/fs/fsAuditAdapter');
    const records = await fsAuditAdapter.read();
    expect(records).toEqual([]);
  });

  it('should prepend new records (most-recent-first)', async () => {
    const { fsAuditAdapter } =
      await import('@/lib/db/adapters/fs/fsAuditAdapter');

    await fsAuditAdapter.write({
      content_path: 'first.mdx',
      base_sha: 'sha1',
      status: 'submitted',
      token_id: 'a',
    });
    await fsAuditAdapter.write({
      content_path: 'second.mdx',
      base_sha: 'sha2',
      status: 'submitted',
      token_id: 'b',
    });

    const records = await fsAuditAdapter.read();
    expect(records[0].content_path).toBe('second.mdx');
    expect(records[1].content_path).toBe('first.mdx');
  });

  it('should respect read limit', async () => {
    const { fsAuditAdapter } =
      await import('@/lib/db/adapters/fs/fsAuditAdapter');

    await fsAuditAdapter.write({
      content_path: 'a.mdx',
      base_sha: 's1',
      status: 'submitted',
      token_id: 'x',
    });
    await fsAuditAdapter.write({
      content_path: 'b.mdx',
      base_sha: 's2',
      status: 'submitted',
      token_id: 'y',
    });

    const records = await fsAuditAdapter.read(1);
    expect(records).toHaveLength(1);
  });
});
