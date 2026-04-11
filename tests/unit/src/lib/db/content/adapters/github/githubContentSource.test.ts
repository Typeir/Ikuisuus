/**
 * GitHub Content Source Adapter Unit Tests
 *
 * @fileoverview Verifies exact-path and semantic-suffix fallback resolution
 * behavior for the GitHub-backed content source adapter.
 * @module tests/unit/src/lib/db/content/adapters/github/githubContentSource.test
 * @author Typeir
 * @version 3.1.0
 * @since 1.0.0
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const listEntriesMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/db/content/adapters/github/githubDirectorySource', () => ({
  githubDirectorySource: {
    listEntries: listEntriesMock,
  },
}));

vi.mock('@/lib/logging/logger', () => ({
  logger: {
    child: () => ({
      message: vi.fn(),
      warning: vi.fn(),
      error: vi.fn(),
    }),
  },
}));

type MockResponse = {
  ok: boolean;
  text: () => Promise<string>;
};

const response = (ok: boolean, body = ''): MockResponse => ({
  ok,
  text: async () => body,
});

describe('githubContentSource', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.CONTENT_REPO_OWNER = 'owner';
    process.env.CONTENT_REPO_NAME = 'repo';
    process.env.GITHUB_PAT = 'token';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('returns exact file when direct slug exists', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response(true, '# exact file'));
    global.fetch = fetchMock as any;

    const { githubContentSource } =
      await import('@/lib/db/content/adapters/github/githubContentSource');

    const result = await githubContentSource.fetch(
      'en',
      'character-creation/vocations/fighter/battle-master',
    );

    expect(result).toEqual({
      content: '# exact file',
      resolvedPath: 'en/character-creation/vocations/fighter/battle-master.mdx',
    });
    expect(listEntriesMock).not.toHaveBeenCalled();
  });

  it('resolves unique semantic file when direct slug does not exist', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response(false))
      .mockResolvedValueOnce(response(false))
      .mockResolvedValueOnce(response(false))
      .mockResolvedValueOnce(response(true, '# semantic file'));
    global.fetch = fetchMock as any;
    listEntriesMock.mockResolvedValue([
      {
        name: 'battle-master.specialization.mdx',
        isDirectory: false,
      },
      {
        name: 'main.mdx',
        isDirectory: false,
      },
    ]);

    const { githubContentSource } =
      await import('@/lib/db/content/adapters/github/githubContentSource');

    const result = await githubContentSource.fetch(
      'en',
      'character-creation/vocations/fighter/battle-master',
    );

    expect(listEntriesMock).toHaveBeenCalledWith(
      'en',
      'character-creation/vocations/fighter',
    );
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(String(fetchMock.mock.calls[3][0])).toContain(
      'battle-master.specialization.mdx',
    );
    expect(result).toEqual({
      content: '# semantic file',
      resolvedPath:
        'en/character-creation/vocations/fighter/battle-master.specialization.mdx',
    });
  });

  it('returns null when semantic fallback is ambiguous', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response(false))
      .mockResolvedValueOnce(response(false))
      .mockResolvedValueOnce(response(false));
    global.fetch = fetchMock as any;
    listEntriesMock.mockResolvedValue([
      {
        name: 'battle-master.specialization.mdx',
        isDirectory: false,
      },
      {
        name: 'battle-master.reference.mdx',
        isDirectory: false,
      },
    ]);

    const { githubContentSource } =
      await import('@/lib/db/content/adapters/github/githubContentSource');

    const result = await githubContentSource.fetch(
      'en',
      'character-creation/vocations/fighter/battle-master',
    );

    expect(result).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('returns null when only non-semantic sibling files exist', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response(false))
      .mockResolvedValueOnce(response(false))
      .mockResolvedValueOnce(response(false));
    global.fetch = fetchMock as any;
    listEntriesMock.mockResolvedValue([
      {
        name: 'battle-master.notes.mdx',
        isDirectory: false,
      },
    ]);

    const { githubContentSource } =
      await import('@/lib/db/content/adapters/github/githubContentSource');

    const result = await githubContentSource.fetch(
      'en',
      'character-creation/vocations/fighter/battle-master',
    );

    expect(result).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('resolves .heirloom.mdx semantic fallback', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response(false))
      .mockResolvedValueOnce(response(false))
      .mockResolvedValueOnce(response(false))
      .mockResolvedValueOnce(response(true, '# heirloom file'));
    global.fetch = fetchMock as any;
    listEntriesMock.mockResolvedValue([
      { name: 'sundered-chain.heirloom.mdx', isDirectory: false },
    ]);

    const { githubContentSource } =
      await import('@/lib/db/content/adapters/github/githubContentSource');

    const result = await githubContentSource.fetch(
      'en',
      'items/heirlooms/sundered-chain',
    );

    expect(result).toEqual({
      content: '# heirloom file',
      resolvedPath: 'en/items/heirlooms/sundered-chain.heirloom.mdx',
    });
    expect(String(fetchMock.mock.calls[3][0])).toContain(
      'sundered-chain.heirloom.mdx',
    );
  });

  it('resolves .trinket.mdx semantic fallback', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response(false))
      .mockResolvedValueOnce(response(false))
      .mockResolvedValueOnce(response(false))
      .mockResolvedValueOnce(response(true, '# trinket file'));
    global.fetch = fetchMock as any;
    listEntriesMock.mockResolvedValue([
      { name: 'bone-coin.trinket.mdx', isDirectory: false },
    ]);

    const { githubContentSource } =
      await import('@/lib/db/content/adapters/github/githubContentSource');

    const result = await githubContentSource.fetch(
      'en',
      'items/trinkets/bone-coin',
    );

    expect(result).toEqual({
      content: '# trinket file',
      resolvedPath: 'en/items/trinkets/bone-coin.trinket.mdx',
    });
    expect(String(fetchMock.mock.calls[3][0])).toContain(
      'bone-coin.trinket.mdx',
    );
  });
});
