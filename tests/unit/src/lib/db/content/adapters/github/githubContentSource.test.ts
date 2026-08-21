/**
 * GitHub Content Source Adapter Unit Tests
 *
 * @fileoverview Verifies directory-listing-based resolution behavior for the
 * GitHub-backed content source adapter.
 * @module tests/unit/src/lib/db/content/adapters/github/githubContentSource.test
 * @author Typeir
 * @version 4.0.0
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

  it('resolves exact slug filename from directory listing', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response(true, '# exact file'));
    global.fetch = fetchMock as any;
    listEntriesMock.mockResolvedValue([
      {
        name: 'battle-master.mdx',
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
      'character-creation/vocations/Warrior/battle-master',
    );

    expect(result).toEqual({
      content: '# exact file',
      resolvedPath: 'en/character-creation/vocations/Warrior/battle-master.mdx',
    });
    expect(listEntriesMock).toHaveBeenCalledWith(
      'en',
      'character-creation/vocations/Warrior',
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('resolves semantic suffix file from directory listing', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(response(true, '# semantic file'));
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
      'character-creation/vocations/Warrior/battle-master',
    );

    expect(listEntriesMock).toHaveBeenCalledWith(
      'en',
      'character-creation/vocations/Warrior',
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain(
      'battle-master.specialization.mdx',
    );
    expect(result).toEqual({
      content: '# semantic file',
      resolvedPath:
        'en/character-creation/vocations/Warrior/battle-master.specialization.mdx',
    });
  });

  it('returns first matching file when multiple matches exist', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(response(true, '# first match'));
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
      'character-creation/vocations/Warrior/battle-master',
    );

    expect(result).toEqual({
      content: '# first match',
      resolvedPath:
        'en/character-creation/vocations/Warrior/battle-master.specialization.mdx',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain(
      'battle-master.specialization.mdx',
    );
  });

  it('returns null when no matching file exists', async () => {
    const fetchMock = vi.fn();
    global.fetch = fetchMock as any;
    listEntriesMock.mockResolvedValue([
      {
        name: 'main.mdx',
        isDirectory: false,
      },
      {
        name: 'other-file.mdx',
        isDirectory: false,
      },
    ]);

    const { githubContentSource } =
      await import('@/lib/db/content/adapters/github/githubContentSource');

    const result = await githubContentSource.fetch(
      'en',
      'character-creation/vocations/Warrior/battle-master',
    );

    expect(result).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns null when directory listing fails to resolve', async () => {
    const fetchMock = vi.fn();
    global.fetch = fetchMock as any;
    listEntriesMock.mockRejectedValue(new Error('boom'));

    const { githubContentSource } =
      await import('@/lib/db/content/adapters/github/githubContentSource');

    await expect(
      githubContentSource.fetch(
        'en',
        'character-creation/vocations/Warrior/battle-master',
      ),
    ).rejects.toThrow('boom');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('resolves .heirloom.mdx file', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(response(true, '# heirloom file'));
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
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain(
      'sundered-chain.heirloom.mdx',
    );
  });

  it('resolves .trinket.mdx file', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(response(true, '# trinket file'));
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
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain(
      'bone-coin.trinket.mdx',
    );
  });

  it('fetches from the branch named by CONTENT_REPO_BRANCH', async () => {
    process.env.CONTENT_REPO_BRANCH = 'staging';
    const fetchMock = vi.fn().mockResolvedValue(response(true, '# staged'));
    global.fetch = fetchMock as any;
    listEntriesMock.mockResolvedValue([{ name: 'bane.mdx', isDirectory: false }]);

    const { githubContentSource } = await import(
      '@/lib/db/content/adapters/github/githubContentSource'
    );
    await githubContentSource.fetch('en', 'spells/bane');

    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://raw.githubusercontent.com/owner/repo/staging/en/spells/bane.mdx',
    );
  });

  it('defaults to the main branch when CONTENT_REPO_BRANCH is unset', async () => {
    delete process.env.CONTENT_REPO_BRANCH;
    const fetchMock = vi.fn().mockResolvedValue(response(true, '# default'));
    global.fetch = fetchMock as any;
    listEntriesMock.mockResolvedValue([{ name: 'bane.mdx', isDirectory: false }]);

    const { githubContentSource } = await import(
      '@/lib/db/content/adapters/github/githubContentSource'
    );
    await githubContentSource.fetch('en', 'spells/bane');

    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://raw.githubusercontent.com/owner/repo/main/en/spells/bane.mdx',
    );
  });

});
