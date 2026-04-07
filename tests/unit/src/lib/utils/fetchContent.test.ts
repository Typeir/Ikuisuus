/**
 * @fileoverview Content Fetcher Unit Tests
 * @description Tests for environment-aware content source resolution,
 * adapter selection (fs vs github), and cached fetch behavior.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/content/adapters/fs/fsContentSource', () => ({
  fsContentSource: {
    fetch: vi.fn(),
  },
}));

vi.mock('@/lib/db/content/adapters/github/githubContentSource', () => ({
  githubContentSource: {
    fetch: vi.fn(),
  },
}));

vi.mock('react', () => ({
  cache: (fn: Function) => fn,
}));

vi.mock('@/lib/logging/logger', () => ({
  logger: {
    child: () => ({
      message: vi.fn(),
      debug: vi.fn(),
    }),
  },
}));

describe('fetchContent', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  describe('isBuildTime resolution', () => {
    it('should use fs adapter when CONTENT_FETCH_MODE=build', async () => {
      process.env.CONTENT_FETCH_MODE = 'build';
      process.env.NODE_ENV = 'production';
      const { fsContentSource } =
        await import('@/lib/db/content/adapters/fs/fsContentSource');
      vi.mocked(fsContentSource.fetch).mockResolvedValue({
        content: '# Hello',
        resolvedPath: 'en/monsters/goblin.mdx',
      });
      const { fetchContent } = await import('@/lib/utils/fetchContent');

      const result = await fetchContent('en', 'monsters/goblin');

      expect(fsContentSource.fetch).toHaveBeenCalledWith(
        'en',
        'monsters/goblin',
      );
      expect(result).toEqual({
        content: '# Hello',
        resolvedPath: 'en/monsters/goblin.mdx',
      });
    });

    it('should use github adapter when CONTENT_FETCH_MODE=runtime', async () => {
      process.env.CONTENT_FETCH_MODE = 'runtime';
      process.env.NODE_ENV = 'production';
      const { githubContentSource } =
        await import('@/lib/db/content/adapters/github/githubContentSource');
      vi.mocked(githubContentSource.fetch).mockResolvedValue({
        content: '# Hello',
        resolvedPath: 'en/monsters/goblin.mdx',
      });
      const { fetchContent } = await import('@/lib/utils/fetchContent');

      const result = await fetchContent('en', 'monsters/goblin');

      expect(githubContentSource.fetch).toHaveBeenCalled();
    });

    it('should use fs adapter during production build phase', async () => {
      delete process.env.CONTENT_FETCH_MODE;
      process.env.NODE_ENV = 'production';
      process.env.NEXT_PHASE = 'phase-production-build';
      const { fsContentSource } =
        await import('@/lib/db/content/adapters/fs/fsContentSource');
      vi.mocked(fsContentSource.fetch).mockResolvedValue(null);
      const { fetchContent } = await import('@/lib/utils/fetchContent');

      await fetchContent('en', 'missing');

      expect(fsContentSource.fetch).toHaveBeenCalled();
    });

    it('should use github adapter in development mode', async () => {
      delete process.env.CONTENT_FETCH_MODE;
      process.env.NODE_ENV = 'development';
      delete process.env.NEXT_PHASE;
      const { githubContentSource } =
        await import('@/lib/db/content/adapters/github/githubContentSource');
      vi.mocked(githubContentSource.fetch).mockResolvedValue({
        content: '# Dev',
        resolvedPath: 'en/test.mdx',
      });
      const { fetchContent } = await import('@/lib/utils/fetchContent');

      const result = await fetchContent('en', 'test');

      expect(githubContentSource.fetch).toHaveBeenCalled();
    });
  });

  describe('fetchContent return values', () => {
    it('should return null when adapter returns null', async () => {
      process.env.CONTENT_FETCH_MODE = 'build';
      const { fsContentSource } =
        await import('@/lib/db/content/adapters/fs/fsContentSource');
      vi.mocked(fsContentSource.fetch).mockResolvedValue(null);
      const { fetchContent } = await import('@/lib/utils/fetchContent');

      const result = await fetchContent('en', 'nonexistent');

      expect(result).toBeNull();
    });
  });
});
