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
const mockListEntries = vi.fn().mockResolvedValue([]);
const mockClearCache = vi.fn();
const mockConsumerRoutesFor = vi.fn().mockResolvedValue([]);

/**
 * Directory entries for a slug, as the suffixed file that would sit on disk.
 *
 * @param {string} stem - Slug stem without suffix
 * @param {string} suffix - Content suffix without dots
 * @returns {{ name: string; isDirectory: boolean }[]} Listing entries
 */
const listingFor = (stem: string, suffix: string) => [
  { name: 'main.mdx', isDirectory: false },
  { name: `${stem}.${suffix}.mdx`, isDirectory: false },
];

vi.mock('next/cache', () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
  revalidateTag: (...args: unknown[]) => mockRevalidateTag(...args),
}));

vi.mock('@/lib/db/content/contentCacheTags', () => ({
  contentCacheTag: (locale: string, slug: string) =>
    `content:${locale}:${slug}`,
  CONTENT_TREE_CACHE_TAG: 'content-tree',
}));

vi.mock('@/lib/db/content/repositories/draftRepository', () => ({
  draftRepository: { archive: (...args: unknown[]) => mockArchive(...args) },
}));

vi.mock('@/lib/db/content/directorySourceResolver', () => ({
  resolveDirectorySource: () => ({
    listEntries: (...args: unknown[]) => mockListEntries(...args),
  }),
}));

vi.mock('@/lib/metadata/syncService', () => ({
  syncMetadata: (...args: unknown[]) => mockSyncMetadata(...args),
}));

vi.mock('@/lib/cache/registry', () => ({
  clearServerCaches: (...args: unknown[]) => mockClearCache(...args),
  registerServerCache: vi.fn(),
  ensureCachesFresh: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/db/content/keywordGraph', () => ({
  consumerRoutesFor: (...args: unknown[]) => mockConsumerRoutesFor(...args),
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
    mockListEntries.mockReset().mockResolvedValue([]);
    mockClearCache.mockReset();
    mockConsumerRoutesFor.mockReset().mockResolvedValue([]);
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
        {
          paths: [
            { path: '/en/library/monsters/goblin', contentType: 'monsters' },
          ],
        },
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

  it('busts the fetch tag under the suffix-stripped slug', async () => {
    await POST(
      makeRequest(
        { paths: ['/en/library/items/heirlooms/deep-dredge.heirloom'] },
        { 'x-revalidation-secret': SECRET },
      ),
    );
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      'content:en:items/heirlooms/deep-dredge',
      'max',
    );
  });

  it('clears listing caches before classifying any path by listing', async () => {
    mockListEntries.mockResolvedValue(listingFor('bane', 'spell'));
    await POST(
      makeRequest(
        { paths: ['/en/library/spells/bane'] },
        { 'x-revalidation-secret': SECRET },
      ),
    );
    expect(mockClearCache).toHaveBeenCalled();
    expect(mockListEntries).toHaveBeenCalled();
    expect(mockClearCache.mock.invocationCallOrder[0]).toBeLessThan(
      mockListEntries.mock.invocationCallOrder[0],
    );
  });

  it('clears server caches again after the metadata sync', async () => {
    await POST(
      makeRequest(
        { paths: [{ path: '/en/library/spells/bane', contentType: 'spells' }] },
        { 'x-revalidation-secret': SECRET },
      ),
    );
    const lastClear = Math.max(...mockClearCache.mock.invocationCallOrder);
    expect(mockSyncMetadata.mock.invocationCallOrder[0]).toBeLessThan(
      lastClear,
    );
  });

  it('busts the tree listing tag once per request', async () => {
    await POST(
      makeRequest(
        { paths: ['/en/library/monsters/goblin', '/en/library/spells/bane'] },
        { 'x-revalidation-secret': SECRET },
      ),
    );
    const treeBusts = mockRevalidateTag.mock.calls.filter(
      (c: unknown[]) => c[0] === 'content-tree',
    );
    expect(treeBusts).toHaveLength(1);
  });

  it('busts the fetch tag before revalidating any path', async () => {
    await POST(
      makeRequest(
        { paths: ['/en/library/monsters/goblin'] },
        { 'x-revalidation-secret': SECRET },
      ),
    );
    const tagOrder = mockRevalidateTag.mock.invocationCallOrder[0];
    const pathOrder = mockRevalidatePath.mock.invocationCallOrder[0];
    expect(tagOrder).toBeLessThan(pathOrder);
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
        {
          paths: [
            { path: '/en/library/monsters/goblin', contentType: 'monsters' },
          ],
        },
        { 'x-revalidation-secret': SECRET },
      ),
    );
    expect(mockArchive).toHaveBeenCalled();
    expect(mockSyncMetadata).toHaveBeenCalledWith(
      expect.objectContaining({ locale: 'en', contentTypes: ['monsters'] }),
    );
  });

  it('calls syncMetadata when no draft was archived', async () => {
    mockArchive.mockResolvedValue(false);
    await POST(
      makeRequest(
        {
          paths: [
            { path: '/en/library/monsters/goblin', contentType: 'monsters' },
          ],
        },
        { 'x-revalidation-secret': SECRET },
      ),
    );
    expect(mockSyncMetadata).toHaveBeenCalledWith(
      expect.objectContaining({ locale: 'en', contentTypes: ['monsters'] }),
    );
  });

  it('syncs each content type once for many paths of that type', async () => {
    await POST(
      makeRequest(
        {
          paths: [
            { path: '/en/library/monsters/goblin', contentType: 'monsters' },
            { path: '/en/library/monsters/orc', contentType: 'monsters' },
            { path: '/en/library/monsters/troll', contentType: 'monsters' },
          ],
        },
        { 'x-revalidation-secret': SECRET },
      ),
    );
    expect(mockSyncMetadata).toHaveBeenCalledTimes(1);
  });

  it('syncs every distinct content type in one request', async () => {
    await POST(
      makeRequest(
        {
          paths: [
            { path: '/en/library/monsters/goblin', contentType: 'monsters' },
            { path: '/en/library/spells/bane', contentType: 'spells' },
            {
              path: '/en/library/items/heirlooms/deep-dredge',
              contentType: 'heirlooms',
            },
            { path: '/en/library/items/trinkets/torch', contentType: 'trinkets' },
            {
              path: '/en/library/character-creation/bloodlines/tallian',
              contentType: 'bloodlines',
            },
          ],
        },
        { 'x-revalidation-secret': SECRET },
      ),
    );
    const synced = mockSyncMetadata.mock.calls
      .map((c) => (c[0] as { contentTypes: string[] }).contentTypes[0])
      .sort();
    expect(synced).toEqual([
      'bloodlines',
      'heirlooms',
      'monsters',
      'spells',
      'trinkets',
    ]);
  });

  it('separates sync by locale', async () => {
    await POST(
      makeRequest(
        {
          paths: [
            { path: '/en/library/spells/bane', contentType: 'spells' },
            { path: '/es/library/spells/bane', contentType: 'spells' },
          ],
        },
        { 'x-revalidation-secret': SECRET },
      ),
    );
    const locales = mockSyncMetadata.mock.calls
      .map((c) => (c[0] as { locale: string }).locale)
      .sort();
    expect(locales).toEqual(['en', 'es']);
  });

  it('does not sync for paths with no synced content table', async () => {
    await POST(
      makeRequest(
        { paths: ['/en/library/rules/steel-and-strife/conditions'] },
        { 'x-revalidation-secret': SECRET },
      ),
    );
    expect(mockSyncMetadata).not.toHaveBeenCalled();
  });

  it('reports metadata outcomes in the response', async () => {
    const res = await POST(
      makeRequest(
        { paths: [{ path: '/en/library/spells/bane', contentType: 'spells' }] },
        { 'x-revalidation-secret': SECRET },
      ),
    );
    const json = await res.json();
    expect(json.metadata).toEqual([
      { locale: 'en', contentType: 'spells', status: 'ok' },
    ]);
  });

  it('reports a failed sync without failing the request', async () => {
    mockSyncMetadata.mockRejectedValue(new Error('db down'));
    const res = await POST(
      makeRequest(
        { paths: [{ path: '/en/library/spells/bane', contentType: 'spells' }] },
        { 'x-revalidation-secret': SECRET },
      ),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.results[0].status).toBe('ok');
    expect(json.metadata[0]).toMatchObject({
      contentType: 'spells',
      status: 'error',
      error: 'db down',
    });
  });

  it('still syncs when draft archival throws', async () => {
    mockArchive.mockRejectedValue(new Error('draft table missing'));
    await POST(
      makeRequest(
        { paths: [{ path: '/en/library/spells/bane', contentType: 'spells' }] },
        { 'x-revalidation-secret': SECRET },
      ),
    );
    expect(mockSyncMetadata).toHaveBeenCalledWith(
      expect.objectContaining({ locale: 'en', contentTypes: ['spells'] }),
    );
  });

  it('classifies by listing when the caller declares no content type', async () => {
    mockListEntries.mockResolvedValue(listingFor('bane', 'spell'));
    await POST(
      makeRequest(
        { paths: ['/en/library/spells/bane'] },
        { 'x-revalidation-secret': SECRET },
      ),
    );
    expect(mockListEntries).toHaveBeenCalledWith('en', 'spells');
    expect(mockSyncMetadata).toHaveBeenCalledWith(
      expect.objectContaining({ locale: 'en', contentTypes: ['spells'] }),
    );
  });

  it('prefers the declared content type over a listing', async () => {
    await POST(
      makeRequest(
        {
          paths: [{ path: '/en/library/spells/bane', contentType: 'spells' }],
        },
        { 'x-revalidation-secret': SECRET },
      ),
    );
    expect(mockListEntries).not.toHaveBeenCalled();
    expect(mockSyncMetadata).toHaveBeenCalledWith(
      expect.objectContaining({ contentTypes: ['spells'] }),
    );
  });

  it('ignores an unknown declared content type and falls back to listing', async () => {
    mockListEntries.mockResolvedValue(listingFor('bane', 'spell'));
    await POST(
      makeRequest(
        {
          paths: [{ path: '/en/library/spells/bane', contentType: 'nonsense' }],
        },
        { 'x-revalidation-secret': SECRET },
      ),
    );
    expect(mockListEntries).toHaveBeenCalled();
    expect(mockSyncMetadata).toHaveBeenCalledWith(
      expect.objectContaining({ contentTypes: ['spells'] }),
    );
  });

  it('does not sync an ambiguous sheet suffix without a declared type', async () => {
    mockListEntries.mockResolvedValue(listingFor('goblin', 'sheet'));
    await POST(
      makeRequest(
        { paths: ['/en/library/monsters/goblin'] },
        { 'x-revalidation-secret': SECRET },
      ),
    );
    expect(mockSyncMetadata).not.toHaveBeenCalled();
  });

  it('survives a failing listing without failing the request', async () => {
    mockListEntries.mockRejectedValue(new Error('bucket unreachable'));
    const res = await POST(
      makeRequest(
        { paths: ['/en/library/spells/bane'] },
        { 'x-revalidation-secret': SECRET },
      ),
    );
    expect(res.status).toBe(200);
    expect(mockSyncMetadata).not.toHaveBeenCalled();
  });
});
