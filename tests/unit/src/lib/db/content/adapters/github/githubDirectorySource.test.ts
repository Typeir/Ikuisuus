/**
 * @fileoverview Unit Tests — githubDirectorySource
 * @description Validates GitHub Git Trees API integration including env var checks,
 * successful tree filtering, and error handling.
 *
 * @module tests/unit/lib/db/content/adapters/github/githubDirectorySource
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('githubDirectorySource', () => {
  const savedEnv: Record<string, string | undefined> = {};

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();

    savedEnv.CONTENT_REPO_OWNER = process.env.CONTENT_REPO_OWNER;
    savedEnv.CONTENT_REPO_NAME = process.env.CONTENT_REPO_NAME;
    savedEnv.GITHUB_PAT = process.env.GITHUB_PAT;
    savedEnv.CONTENT_REPO_BRANCH = process.env.CONTENT_REPO_BRANCH;
  });

  afterEach(() => {
    for (const [key, value] of Object.entries(savedEnv)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  });

  it('returns empty array when CONTENT_REPO_OWNER is missing', async () => {
    delete process.env.CONTENT_REPO_OWNER;
    delete process.env.CONTENT_REPO_NAME;
    delete process.env.GITHUB_PAT;

    const { githubDirectorySource } =
      await import('@/lib/db/content/adapters/github/githubDirectorySource');

    const entries = await githubDirectorySource.listEntries('en', '');

    expect(entries).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns empty array when GitHub API responds with an error status', async () => {
    process.env.CONTENT_REPO_OWNER = 'test-owner';
    process.env.CONTENT_REPO_NAME = 'test-repo';
    process.env.GITHUB_PAT = 'ghp_test_token';

    mockFetch.mockResolvedValue({
      ok: false,
      status: 403,
      text: () => Promise.resolve('Forbidden'),
    });

    const { githubDirectorySource } =
      await import('@/lib/db/content/adapters/github/githubDirectorySource');

    const entries = await githubDirectorySource.listEntries('en', '');

    expect(entries).toEqual([]);
  });

  it('returns immediate children for a given relative path', async () => {
    process.env.CONTENT_REPO_OWNER = 'test-owner';
    process.env.CONTENT_REPO_NAME = 'test-repo';
    process.env.GITHUB_PAT = 'ghp_test_token';

    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          tree: [
            { path: 'en/monsters', type: 'tree' },
            { path: 'en/monsters/goblin.sheet.mdx', type: 'blob' },
            { path: 'en/monsters/orc.sheet.mdx', type: 'blob' },
            { path: 'en/spells', type: 'tree' },
          ],
        }),
    });

    const { githubDirectorySource } =
      await import('@/lib/db/content/adapters/github/githubDirectorySource');

    const entries = await githubDirectorySource.listEntries('en', 'monsters');

    const names = entries.map((e) => e.name);
    expect(names).toContain('goblin.sheet.mdx');
    expect(names).toContain('orc.sheet.mdx');
    expect(names).not.toContain('spells');
  });

  it('returns only root-level locale content when relativePath is empty', async () => {
    process.env.CONTENT_REPO_OWNER = 'test-owner';
    process.env.CONTENT_REPO_NAME = 'test-repo';
    process.env.GITHUB_PAT = 'ghp_test_token';

    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          tree: [
            { path: 'en/monsters', type: 'tree' },
            { path: 'en/spells', type: 'tree' },
            { path: 'es/monsters', type: 'tree' },
          ],
        }),
    });

    const { githubDirectorySource } =
      await import('@/lib/db/content/adapters/github/githubDirectorySource');

    const entries = await githubDirectorySource.listEntries('en', '');

    const names = entries.map((e) => e.name);
    expect(names).toContain('monsters');
    expect(names).toContain('spells');
    expect(names).not.toContain('es/monsters');
  });

  it('tags the tree fetch so revalidation can bust it', async () => {
    process.env.CONTENT_REPO_OWNER = 'test-owner';
    process.env.CONTENT_REPO_NAME = 'test-repo';
    process.env.GITHUB_PAT = 'ghp_test_token';

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ tree: [] }),
    });

    const { githubDirectorySource } =
      await import('@/lib/db/content/adapters/github/githubDirectorySource');
    await githubDirectorySource.listEntries('en', '');

    expect(mockFetch.mock.calls[0][1]).toMatchObject({
      next: { revalidate: 300, tags: ['content-tree'] },
    });
  });

  it('retries after a rejected fetch instead of caching the failure', async () => {
    process.env.CONTENT_REPO_OWNER = 'test-owner';
    process.env.CONTENT_REPO_NAME = 'test-repo';
    process.env.GITHUB_PAT = 'ghp_test_token';

    mockFetch
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ tree: [{ path: 'en/spells', type: 'tree' }] }),
      });

    const { githubDirectorySource } =
      await import('@/lib/db/content/adapters/github/githubDirectorySource');

    await expect(githubDirectorySource.listEntries('en', '')).rejects.toThrow(
      'network down',
    );

    const entries = await githubDirectorySource.listEntries('en', '');
    expect(entries.map((e) => e.name)).toContain('spells');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('retries after an API error instead of caching the empty tree', async () => {
    process.env.CONTENT_REPO_OWNER = 'test-owner';
    process.env.CONTENT_REPO_NAME = 'test-repo';
    process.env.GITHUB_PAT = 'ghp_test_token';

    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: () => Promise.resolve('rate limited'),
      })
      .mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ tree: [{ path: 'en/spells', type: 'tree' }] }),
      });

    const { githubDirectorySource } =
      await import('@/lib/db/content/adapters/github/githubDirectorySource');

    expect(await githubDirectorySource.listEntries('en', '')).toEqual([]);

    const entries = await githubDirectorySource.listEntries('en', '');
    expect(entries.map((e) => e.name)).toContain('spells');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('re-reads the tree after clearCache', async () => {
    process.env.CONTENT_REPO_OWNER = 'test-owner';
    process.env.CONTENT_REPO_NAME = 'test-repo';
    process.env.GITHUB_PAT = 'ghp_test_token';

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ tree: [] }),
    });

    const { githubDirectorySource } =
      await import('@/lib/db/content/adapters/github/githubDirectorySource');
    const { clearServerCaches } = await import('@/lib/cache/registry');

    await githubDirectorySource.listEntries('en', '');
    await githubDirectorySource.listEntries('en', 'monsters');
    expect(mockFetch).toHaveBeenCalledTimes(1);

    clearServerCaches();
    await githubDirectorySource.listEntries('en', '');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
