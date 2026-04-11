/**
 * @fileoverview Unit tests for ISR Revalidation API route
 * @module tests/unit/src/app/api/revalidate/route.test
 * @description Validates POST handler authentication, input validation,
 * path variant expansion, and error handling.
 *
 * @version 2.0.0
 * @author Typeir
 *
 * @requires vitest
 * @requires @/app/api/revalidate/route
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockRevalidatePath = vi.fn();
const mockRevalidateTag = vi.fn();
const mockArchive = vi.fn().mockResolvedValue(false);
const mockSyncMetadata = vi.fn().mockResolvedValue(undefined);

vi.mock('next/cache', () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
  revalidateTag: (...args: unknown[]) => mockRevalidateTag(...args),
}));

vi.mock('@/lib/db/content/contentCacheTags', () => ({
  contentCacheTag: (locale: string, slug: string) =>
    `content:${locale}:${slug}`,
}));

vi.mock('@/lib/db/content/repositories/draftRepository', () => ({
  draftRepository: { archive: (...args: unknown[]) => mockArchive(...args) },
}));

vi.mock('@/lib/metadata/syncService', () => ({
  syncMetadata: (...args: unknown[]) => mockSyncMetadata(...args),
}));

vi.mock('@/lib/logging/logger', () => ({
  logger: {
    child: () => ({
      message: vi.fn(),
      warning: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    }),
  },
}));

import { POST } from '@/app/api/revalidate/route';
import { NextRequest } from 'next/server';

/**
 * Creates a mock NextRequest with the given body and optional headers.
 *
 * @param {unknown} body - Request body
 * @param {Record<string, string>} headers - Request headers
 * @returns {NextRequest} Mock request
 */
function makeRequest(
  body: unknown,
  headers: Record<string, string> = {},
): NextRequest {
  return new NextRequest('http://localhost/api/revalidate', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

describe('POST /api/revalidate', () => {
  const SECRET = 'test-secret-1234';
  let envBackup: string | undefined;

  beforeEach(() => {
    envBackup = process.env.REVALIDATION_SECRET;
    process.env.REVALIDATION_SECRET = SECRET;
    mockRevalidatePath.mockReset();
    mockRevalidateTag.mockReset();
    mockArchive.mockReset().mockResolvedValue(false);
    mockSyncMetadata.mockReset().mockResolvedValue(undefined);
  });

  afterEach(() => {
    if (envBackup !== undefined) {
      process.env.REVALIDATION_SECRET = envBackup;
    } else {
      delete process.env.REVALIDATION_SECRET;
    }
  });

  it('returns 503 when secret is not configured', async () => {
    delete process.env.REVALIDATION_SECRET;
    const res = await POST(
      makeRequest({ paths: ['/en/library/monsters/goblin'] }),
    );
    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.error).toContain('not configured');
  });

  it('returns 401 for missing secret header', async () => {
    const res = await POST(makeRequest({ paths: ['/en/library/monsters'] }));
    expect(res.status).toBe(401);
  });

  it('returns 401 for wrong secret', async () => {
    const res = await POST(
      makeRequest(
        { paths: ['/en/library/monsters'] },
        {
          'x-revalidation-secret': 'wrong-secret-val',
        },
      ),
    );
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid JSON', async () => {
    const req = new NextRequest('http://localhost/api/revalidate', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-revalidation-secret': SECRET,
      },
      body: 'not json',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 for missing paths', async () => {
    const res = await POST(
      makeRequest({}, { 'x-revalidation-secret': SECRET }),
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 for empty paths array', async () => {
    const res = await POST(
      makeRequest({ paths: [] }, { 'x-revalidation-secret': SECRET }),
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 for too many paths', async () => {
    const paths = Array.from({ length: 51 }, (_, i) => `/en/library/page-${i}`);
    const res = await POST(
      makeRequest({ paths }, { 'x-revalidation-secret': SECRET }),
    );
    expect(res.status).toBe(400);
  });

  it('revalidates valid path and returns 200', async () => {
    const res = await POST(
      makeRequest(
        { paths: ['/en/library/monsters/goblin'] },
        { 'x-revalidation-secret': SECRET },
      ),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.results).toHaveLength(1);
    expect(json.results[0].status).toBe('ok');
    expect(mockRevalidatePath).toHaveBeenCalled();
    expect(mockRevalidateTag).toHaveBeenCalled();
  });

  it('revalidates path and /main variant', async () => {
    await POST(
      makeRequest(
        { paths: ['/en/library/monsters/albedo'] },
        { 'x-revalidation-secret': SECRET },
      ),
    );
    const calls = mockRevalidatePath.mock.calls.map((c: unknown[]) => c[0]);
    expect(calls).toContain('/en/library/monsters/albedo');
    expect(calls).toContain('/en/library/monsters/albedo/main');
  });

  it('marks invalid path entries as errors', async () => {
    const res = await POST(
      makeRequest(
        { paths: ['no-leading-slash'] },
        { 'x-revalidation-secret': SECRET },
      ),
    );
    const json = await res.json();
    expect(json.results[0].status).toBe('error');
    expect(json.results[0].error).toContain('Invalid path');
  });

  it('calls syncMetadata when draft is archived', async () => {
    mockArchive.mockResolvedValue(true);
    await POST(
      makeRequest(
        { paths: ['/en/library/monsters/goblin'] },
        { 'x-revalidation-secret': SECRET },
      ),
    );
    expect(mockArchive).toHaveBeenCalled();
    expect(mockSyncMetadata).toHaveBeenCalledWith(
      expect.objectContaining({ locale: 'en', contentTypes: ['monsters'] }),
    );
  });

  it('does not call syncMetadata when no draft archived', async () => {
    mockArchive.mockResolvedValue(false);
    await POST(
      makeRequest(
        { paths: ['/en/library/monsters/goblin'] },
        { 'x-revalidation-secret': SECRET },
      ),
    );
    expect(mockSyncMetadata).not.toHaveBeenCalled();
  });
});
