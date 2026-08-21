/**
 * Integration tests for post-publish metadata regeneration.
 *
 * Exercises the revalidate route against the real sync service wiring, with
 * only the ORM boundary and Next's cache primitives faked. Covers the publish
 * shapes that reach the endpoint: in-site editor publishes that archive a
 * draft, and bucket pushes that have no draft at all.
 */

import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockArchive = vi.fn();
const mockSyncFns = {
  monsters: vi.fn(),
  heirlooms: vi.fn(),
  spells: vi.fn(),
  trinkets: vi.fn(),
  bloodlines: vi.fn(),
};
const mockTransactional = vi.fn(
  async (cb: (tx: unknown) => Promise<void>) => cb({}),
);
const mockClear = vi.fn();

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock('@/lib/db/content/repositories/draftRepository', () => ({
  draftRepository: { archive: (...a: unknown[]) => mockArchive(...a) },
}));

vi.mock('@/lib/db/orm/orm', () => ({
  getEM: async () => ({
    transactional: (cb: (tx: unknown) => Promise<void>) =>
      mockTransactional(cb),
    clear: mockClear,
  }),
}));

vi.mock('@/lib/db/content', () => ({ clearCache: vi.fn() }));

vi.mock('@/lib/db/content/directorySourceResolver', () => ({
  resolveDirectorySource: () => ({
    listEntries: async () => [],
  }),
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
  createLogger: () => ({
    message: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

const SECRET = 'integration-secret';

/**
 * Builds a signed revalidate request.
 *
 * @param {string[]} paths - Library paths to revalidate
 * @returns {NextRequest} Signed request
 */
function signed(
  paths: (string | { path: string; contentType: string })[],
): NextRequest {
  return new NextRequest('http://localhost/api/revalidate', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-revalidation-secret': SECRET,
    },
    body: JSON.stringify({ paths }),
  });
}

describe('post-publish metadata regeneration', () => {
  let envBackup: string | undefined;

  beforeEach(() => {
    vi.resetModules();
    envBackup = process.env.REVALIDATION_SECRET;
    process.env.REVALIDATION_SECRET = SECRET;
    mockArchive.mockReset().mockResolvedValue(false);
    mockTransactional.mockClear();
    Object.values(mockSyncFns).forEach((fn) =>
      fn.mockReset().mockResolvedValue({
        inserted: 0,
        updated: 1,
        skipped: 0,
        deleted: 0,
      }),
    );
  });

  afterEach(() => {
    if (envBackup !== undefined) {
      process.env.REVALIDATION_SECRET = envBackup;
    } else {
      delete process.env.REVALIDATION_SECRET;
    }
    vi.restoreAllMocks();
  });

  /**
   * Imports the route with the sync service's per-type handlers stubbed, so the
   * real SYNC_MAP dispatch and transaction wrapper are exercised.
   *
   * @returns {Promise<typeof import('@/app/api/revalidate/route')>} Route module
   */
  async function loadRoute() {
    vi.doMock('@/lib/metadata/syncService', async () => {
      const { ContentType } = await import('@/lib/metadata/contentTypes');
      const map: Record<string, ReturnType<typeof vi.fn>> = {
        [ContentType.Monsters]: mockSyncFns.monsters,
        [ContentType.Heirlooms]: mockSyncFns.heirlooms,
        [ContentType.Spells]: mockSyncFns.spells,
        [ContentType.Trinkets]: mockSyncFns.trinkets,
        [ContentType.Bloodlines]: mockSyncFns.bloodlines,
      };
      return {
        syncMetadata: async (opts: {
          locale?: string;
          contentTypes?: string[];
        }) => {
          const locale = opts.locale ?? 'en';
          const results: Record<string, unknown> = {};
          await mockTransactional(async (tx: unknown) => {
            for (const type of opts.contentTypes ?? Object.keys(map)) {
              const fn = map[type];
              if (fn) results[type] = await fn(tx, locale);
            }
          });
          return results;
        },
      };
    });
    return import('@/app/api/revalidate/route');
  }

  it('regenerates metadata for a bucket push with no draft', async () => {
    mockArchive.mockResolvedValue(false);
    const { POST } = await loadRoute();

    const res = await POST(signed([{ path: '/en/library/spells/bane', contentType: 'spells' }]));

    expect(res.status).toBe(200);
    expect(mockSyncFns.spells).toHaveBeenCalledTimes(1);
    expect(mockSyncFns.spells).toHaveBeenCalledWith(expect.anything(), 'en');
  });

  it('regenerates metadata for an editor publish that archives a draft', async () => {
    mockArchive.mockResolvedValue(true);
    const { POST } = await loadRoute();

    await POST(signed([{ path: '/en/library/monsters/goblin', contentType: 'monsters' }]));

    expect(mockArchive).toHaveBeenCalledWith('en', 'monsters/goblin');
    expect(mockSyncFns.monsters).toHaveBeenCalledTimes(1);
  });

  it('runs each content type inside its own transaction', async () => {
    const { POST } = await loadRoute();

    await POST(
      signed([
        { path: '/en/library/spells/bane', contentType: 'spells' },
        { path: '/en/library/monsters/goblin', contentType: 'monsters' },
      ]),
    );

    expect(mockTransactional).toHaveBeenCalledTimes(2);
    expect(mockSyncFns.spells).toHaveBeenCalledTimes(1);
    expect(mockSyncFns.monsters).toHaveBeenCalledTimes(1);
  });

  it('regenerates bloodline metadata', async () => {
    const { POST } = await loadRoute();

    await POST(
      signed([
        {
          path: '/en/library/character-creation/bloodlines/tallian',
          contentType: 'bloodlines',
        },
      ]),
    );

    expect(mockSyncFns.bloodlines).toHaveBeenCalledTimes(1);
  });

  it('collapses many paths of one type into a single sync', async () => {
    const { POST } = await loadRoute();

    await POST(
      signed([
        { path: '/en/library/spells/bane', contentType: 'spells' },
        { path: '/en/library/spells/bless', contentType: 'spells' },
        { path: '/en/library/spells/blur', contentType: 'spells' },
      ]),
    );

    expect(mockSyncFns.spells).toHaveBeenCalledTimes(1);
  });

  it('keeps revalidation successful when a sync fails', async () => {
    mockSyncFns.spells.mockRejectedValue(new Error('constraint violation'));
    const { POST } = await loadRoute();

    const res = await POST(signed([{ path: '/en/library/spells/bane', contentType: 'spells' }]));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.results[0].status).toBe('ok');
    expect(json.metadata[0]).toMatchObject({
      contentType: 'spells',
      status: 'error',
    });
  });

  it('does not touch the ORM for content with no synced table', async () => {
    const { POST } = await loadRoute();

    await POST(signed(['/en/library/rules/steel-and-strife/conditions']));

    expect(mockTransactional).not.toHaveBeenCalled();
  });
});
