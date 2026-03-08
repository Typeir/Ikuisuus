/**
 * Audit Log Facade Unit Tests
 *
 * @fileoverview Tests for the writeAuditLog facade.
 *
 * @module tests/unit/lib/db/auditLog
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/edgeConfigAuditAdapter', () => ({
  edgeConfigAuditAdapter: {
    write: vi.fn(),
    read: vi.fn(),
  },
}));
vi.mock('@/lib/logging/logger', () => ({
  logger: {
    child: () => ({ error: vi.fn(), debug: vi.fn(), message: vi.fn() }),
  },
}));

let writeAuditLog: typeof import('@/lib/db/auditLog').writeAuditLog;
let mockWrite: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  vi.resetModules();
  const adapter = await import('@/lib/db/edgeConfigAuditAdapter');
  mockWrite = adapter.edgeConfigAuditAdapter.write as ReturnType<typeof vi.fn>;

  const mod = await import('@/lib/db/auditLog');
  writeAuditLog = mod.writeAuditLog;
});

afterEach(() => vi.restoreAllMocks());

describe('writeAuditLog', () => {
  it('should delegate to the adapter', async () => {
    mockWrite.mockResolvedValue(undefined);

    await writeAuditLog({
      content_path: 'en/monsters/aboleth.sheet.mdx',
      base_sha: 'abc123',
      status: 'submitted',
      token_id: 'editor-a',
    });

    expect(mockWrite).toHaveBeenCalledWith(
      expect.objectContaining({
        content_path: 'en/monsters/aboleth.sheet.mdx',
        status: 'submitted',
      }),
    );
  });

  it('should swallow errors and not throw', async () => {
    mockWrite.mockRejectedValue(new Error('Edge Config down'));

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
