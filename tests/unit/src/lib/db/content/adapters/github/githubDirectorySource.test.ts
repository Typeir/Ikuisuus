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
});
