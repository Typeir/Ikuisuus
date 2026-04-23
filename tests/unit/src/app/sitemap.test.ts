/**
 * @fileoverview Tests for the sitemap.xml route.
 *
 * @module tests/unit/src/app/sitemap.test
 */
import sitemap from '@/app/sitemap';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/seo', () => ({
  resolveMetadataBase: vi
    .fn()
    .mockReturnValue(new URL('https://ikuisuus.vercel.app')),
}));

vi.mock('@/lib/mdx/findAllMdxFiles', () => ({
  default: vi
    .fn()
    .mockResolvedValue([
      '/content/en/items/heirlooms/dreaded-defender.heirloom.mdx',
      '/content/en/items/heirlooms/main.mdx',
      '/content/en/monsters/abyssal-hound.sheet.mdx',
    ]),
}));

vi.mock('path', async () => {
  const actual = await vi.importActual<typeof import('path')>('path');
  return {
    ...actual,
    join: (...parts: string[]) => parts.join('/'),
    relative: (_base: string, full: string) => full.replace('/content/en/', ''),
  };
});

describe('sitemap', () => {
  it('excludes main.mdx index files', async () => {
    const result = await sitemap();
    const urls = result.map((e) => e.url);
    expect(urls.every((u) => !u.includes('main'))).toBe(true);
  });

  it('generates canonical URLs with the production base', async () => {
    const result = await sitemap();
    expect(result[0].url).toMatch(/^https:\/\/ikuisuus\.vercel\.app/);
  });

  it('sets priority to 0.8 for all entries', async () => {
    const result = await sitemap();
    result.forEach((entry) => expect(entry.priority).toBe(0.8));
  });
});
