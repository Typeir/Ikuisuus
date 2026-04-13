/**
 * @fileoverview Unit Tests — ContentSourceAdapter
 * @description Validates the hexagonal port contract for content source adapters.
 *
 * @module tests/unit/lib/db/content/contentSourceAdapter
 */

import type {
  ContentFetchResult,
  ContentSourceAdapter,
} from '@/lib/db/content/contentSourceAdapter';
import { describe, expect, it, vi } from 'vitest';

describe('ContentSourceAdapter', () => {
  it('a conforming adapter returns a result with content and resolvedPath', async () => {
    const adapter: ContentSourceAdapter = {
      fetch: vi.fn().mockResolvedValue({
        content: '# Hello World',
        resolvedPath: '/src/content/en/monsters/goblin.mdx',
      }),
    };

    const result = await adapter.fetch('en', 'monsters/goblin');

    expect(result).not.toBeNull();
    expect(result!.content).toBe('# Hello World');
    expect(result!.resolvedPath).toBe('/src/content/en/monsters/goblin.mdx');
  });

  it('a conforming adapter returns null when content is not found', async () => {
    const adapter: ContentSourceAdapter = {
      fetch: vi.fn().mockResolvedValue(null),
    };

    const result = await adapter.fetch('en', 'missing/page');

    expect(result).toBeNull();
  });

  it('the fetch method is called with the provided locale and slug', async () => {
    const mockFetch = vi.fn().mockResolvedValue(null);
    const adapter: ContentSourceAdapter = { fetch: mockFetch };

    await adapter.fetch('es', 'spells/fireball');

    expect(mockFetch).toHaveBeenCalledWith('es', 'spells/fireball');
  });

  it('ContentFetchResult shape contains required fields', () => {
    const result: ContentFetchResult = {
      content: '# Fireball',
      resolvedPath: '/src/content/en/spells/fireball.mdx',
    };

    expect(result.content).toBe('# Fireball');
    expect(result.resolvedPath).toBe('/src/content/en/spells/fireball.mdx');
  });

  it('adapter can be called with different locales', async () => {
    const adapter: ContentSourceAdapter = {
      fetch: vi.fn((locale: string, slug: string) =>
        Promise.resolve({ content: `locale=${locale}`, resolvedPath: slug }),
      ),
    };

    const enResult = await adapter.fetch('en', 'monsters/goblin');
    const esResult = await adapter.fetch('es', 'monsters/goblin');

    expect(enResult!.content).toBe('locale=en');
    expect(esResult!.content).toBe('locale=es');
  });
});
