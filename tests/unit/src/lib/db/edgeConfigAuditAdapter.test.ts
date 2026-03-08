/**
 * Edge Config Audit Adapter Unit Tests
 *
 * @fileoverview Tests for the Vercel Edge Config audit adapter.
 *
 * @module tests/unit/lib/db/edgeConfigAuditAdapter
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@vercel/edge-config', () => ({
  get: vi.fn(),
}));
vi.mock('@/lib/logging/logger', () => ({
  logger: {
    child: () => ({ error: vi.fn(), debug: vi.fn(), message: vi.fn() }),
  },
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

const originalEnv = { ...process.env };

beforeEach(() => {
  vi.resetModules();
  process.env.EDGE_CONFIG_ID = 'test-config-id';
  process.env.VERCEL_API_TOKEN = 'test-token';
});

afterEach(() => {
  vi.restoreAllMocks();
  process.env = { ...originalEnv };
});

describe('edgeConfigAuditAdapter', () => {
  describe('write', () => {
    it('should prepend record and write to Edge Config', async () => {
      const { get } = await import('@vercel/edge-config');
      vi.mocked(get).mockResolvedValue([]);
      mockFetch.mockResolvedValue({ ok: true });

      const { edgeConfigAuditAdapter } =
        await import('@/lib/db/edgeConfigAuditAdapter');

      await edgeConfigAuditAdapter.write({
        content_path: 'en/test.mdx',
        base_sha: 'abc',
        status: 'submitted',
        token_id: 'editor',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('edge-config'),
        expect.objectContaining({ method: 'PATCH' }),
      );
    });

    it('should add timestamp if not provided', async () => {
      const { get } = await import('@vercel/edge-config');
      vi.mocked(get).mockResolvedValue([]);
      mockFetch.mockResolvedValue({ ok: true });

      const { edgeConfigAuditAdapter } =
        await import('@/lib/db/edgeConfigAuditAdapter');

      await edgeConfigAuditAdapter.write({
        content_path: 'test.mdx',
        base_sha: 'abc',
        status: 'submitted',
        token_id: 'editor',
      });

      const call = mockFetch.mock.calls[0];
      const body = JSON.parse(call[1].body as string);
      const record = body.items[0].value[0];
      expect(record.timestamp).toBeDefined();
    });

    it('should not throw when env vars are missing', async () => {
      delete process.env.EDGE_CONFIG_ID;
      delete process.env.VERCEL_API_TOKEN;
      const { get } = await import('@vercel/edge-config');
      vi.mocked(get).mockResolvedValue([]);

      const { edgeConfigAuditAdapter } =
        await import('@/lib/db/edgeConfigAuditAdapter');

      await expect(
        edgeConfigAuditAdapter.write({
          content_path: 'test.mdx',
          base_sha: 'abc',
          status: 'error',
          token_id: 'id',
        }),
      ).resolves.toBeUndefined();
    });
  });

  describe('read', () => {
    it('should return records with default limit', async () => {
      const { get } = await import('@vercel/edge-config');
      const records = Array.from({ length: 100 }, (_, i) => ({
        content_path: `test-${i}.mdx`,
        base_sha: 'abc',
        status: 'submitted' as const,
        token_id: 'editor',
      }));
      vi.mocked(get).mockResolvedValue(records);

      const { edgeConfigAuditAdapter } =
        await import('@/lib/db/edgeConfigAuditAdapter');

      const result = await edgeConfigAuditAdapter.read();
      expect(result).toHaveLength(50);
    });

    it('should respect custom limit', async () => {
      const { get } = await import('@vercel/edge-config');
      vi.mocked(get).mockResolvedValue([
        {
          content_path: 'a.mdx',
          base_sha: 's',
          status: 'submitted',
          token_id: 'id',
        },
        {
          content_path: 'b.mdx',
          base_sha: 's',
          status: 'submitted',
          token_id: 'id',
        },
      ]);

      const { edgeConfigAuditAdapter } =
        await import('@/lib/db/edgeConfigAuditAdapter');

      const result = await edgeConfigAuditAdapter.read(1);
      expect(result).toHaveLength(1);
    });

    it('should return empty array on Edge Config failure', async () => {
      const { get } = await import('@vercel/edge-config');
      vi.mocked(get).mockRejectedValue(new Error('fail'));

      const { edgeConfigAuditAdapter } =
        await import('@/lib/db/edgeConfigAuditAdapter');

      const result = await edgeConfigAuditAdapter.read();
      expect(result).toEqual([]);
    });
  });
});
