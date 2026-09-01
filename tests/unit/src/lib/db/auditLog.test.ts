/**
 * Audit Log Facade Unit Tests
 *
 * @fileoverview Tests for the writeAuditLog facade using adapter-backed persistence.
 *
 * @module tests/unit/src/lib/db/auditLog.test
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockAdapter = {
  write: vi.fn(),
  read: vi.fn(),
};

vi.mock('@/lib/db/auditAdapterFactory', () => ({
  auditAdapter: mockAdapter,
}));
vi.mock('@/lib/logging/logger', () => ({
  logger: {
    child: () => ({ error: vi.fn(), debug: vi.fn(), message: vi.fn() }),
  },
}));

let writeAuditLog: typeof import('@/lib/db/auditLog').writeAuditLog;

beforeEach(async () => {
  vi.resetModules();
  mockAdapter.write.mockReset();
  mockAdapter.read.mockReset();

  const mod = await import('@/lib/db/auditLog');
  writeAuditLog = mod.writeAuditLog;
});

afterEach(() => vi.restoreAllMocks());

describe('writeAuditLog', () => {
  it('should delegate to the adapter', async () => {
    mockAdapter.write.mockResolvedValue(undefined);

    await writeAuditLog({
      content_path: 'en/monsters/aboleth.sheet.mdx',
      base_sha: 'abc123',
      status: 'submitted',
      token_id: 'editor-a',
    });

    expect(mockAdapter.write).toHaveBeenCalledWith(
      expect.objectContaining({
        content_path: 'en/monsters/aboleth.sheet.mdx',
        status: 'submitted',
      }),
    );
  });

  it('should swallow errors and not throw', async () => {
    mockAdapter.write.mockRejectedValue(new Error('Adapter down'));

    await expect(
      writeAuditLog({
        content_path: 'test',
        base_sha: 'sha',
        status: 'error',
        token_id: 'id',
      }),
    ).resolves.toBeUndefined();
  });
});
