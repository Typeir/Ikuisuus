/**
 * @fileoverview Metadata Sync API Route Unit Tests
 * @description Tests for the POST /api/metadata-sync endpoint including
 * auth, body validation, and sync invocation.
 *
 * @module tests/unit/src/app/api/metadata-sync/route.test
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/metadata/syncService', () => ({
  syncMetadata: vi.fn(),
}));

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
let RouteModule: typeof import('@/app/api/metadata-sync/route');
let syncMetadata: ReturnType<typeof vi.fn>;

const originalEnv = process.env.METADATA_SYNC_SECRET;

beforeEach(async () => {
  vi.resetModules();
  process.env.METADATA_SYNC_SECRET = 'test-secret-1234';
  RouteModule = await import('@/app/api/metadata-sync/route');
  const syncMod = await import('@/lib/metadata/syncService');
  syncMetadata = vi.mocked(syncMod.syncMetadata);
});

afterEach(() => {
  if (originalEnv !== undefined) {
    process.env.METADATA_SYNC_SECRET = originalEnv;
  } else {
    delete process.env.METADATA_SYNC_SECRET;
  }
  vi.restoreAllMocks();
});

/**
 * Builds a POST request with headers and JSON body.
 *
 * @param {Record<string, unknown>} body - Request body
 * @param {string} [secret] - x-sync-secret header value
 * @returns {Request} Fetch-compatible request
 */
function makeRequest(body: Record<string, unknown>, secret?: string): Request {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  };
  if (secret) headers['x-sync-secret'] = secret;
  return new Request('http://localhost/api/metadata-sync', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

describe('/api/metadata-sync route', () => {
  describe('exports', () => {
    it('should export POST handler', () => {
      expect(RouteModule.POST).toBeDefined();
      expect(typeof RouteModule.POST).toBe('function');
    });
  });

  describe('authentication', () => {
    it('should return 503 when secret is not configured', async () => {
      delete process.env.METADATA_SYNC_SECRET;
      vi.resetModules();
      const mod = await import('@/app/api/metadata-sync/route');
      const resp = await mod.POST(makeRequest({}, 'anything') as never);
      expect(resp.status).toBe(503);
    });

    it('should return 401 when no secret header provided', async () => {
      const resp = await RouteModule.POST(makeRequest({}) as never);
      expect(resp.status).toBe(401);
    });

    it('should return 401 for invalid secret', async () => {
      const resp = await RouteModule.POST(
        makeRequest({}, 'wrong-secret') as never,
      );
      expect(resp.status).toBe(401);
    });

    it('should accept correct secret', async () => {
      syncMetadata.mockResolvedValue({});
      const resp = await RouteModule.POST(
        makeRequest({}, 'test-secret-1234') as never,
      );
      expect(resp.status).toBe(200);
    });
  });

  describe('body validation', () => {
    it('should return 400 for invalid JSON', async () => {
      const req = new Request('http://localhost/api/metadata-sync', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-sync-secret': 'test-secret-1234',
        },
        body: 'not-json',
      });
      const resp = await RouteModule.POST(req as never);
      expect(resp.status).toBe(400);
    });

    it('should return 400 for invalid locale', async () => {
      const resp = await RouteModule.POST(
        makeRequest({ locale: 'toolonglocale' }, 'test-secret-1234') as never,
      );
      expect(resp.status).toBe(400);
      const body = await resp.json();
      expect(body.error).toBe('Invalid locale');
    });

    it('should return 400 for unknown content type', async () => {
      const resp = await RouteModule.POST(
        makeRequest({ contentTypes: ['invalid'] }, 'test-secret-1234') as never,
      );
      expect(resp.status).toBe(400);
    });

    it('should return 400 for empty contentTypes array', async () => {
      const resp = await RouteModule.POST(
        makeRequest({ contentTypes: [] }, 'test-secret-1234') as never,
      );
      expect(resp.status).toBe(400);
    });
  });

  describe('successful sync', () => {
    it('should return sync results', async () => {
      const mockResults = {
        monsters: { inserted: 5, updated: 2, skipped: 10, deleted: 0 },
      };
      syncMetadata.mockResolvedValue(mockResults);

      const resp = await RouteModule.POST(
        makeRequest(
          { locale: 'en', contentTypes: ['monsters'] },
          'test-secret-1234',
        ) as never,
      );

      expect(resp.status).toBe(200);
      const body = await resp.json();
      expect(body.ok).toBe(true);
      expect(body.results).toEqual(mockResults);
    });

    it('should default locale to en', async () => {
      syncMetadata.mockResolvedValue({});

      await RouteModule.POST(makeRequest({}, 'test-secret-1234') as never);

      expect(syncMetadata).toHaveBeenCalledWith(
        expect.objectContaining({ locale: 'en' }),
      );
    });
  });

  describe('error handling', () => {
    it('should return 500 when sync throws', async () => {
      syncMetadata.mockRejectedValue(new Error('DB connection failed'));

      const resp = await RouteModule.POST(
        makeRequest({}, 'test-secret-1234') as never,
      );

      expect(resp.status).toBe(500);
      const body = await resp.json();
      expect(body.error).toBe('Sync failed');
    });
  });
});
