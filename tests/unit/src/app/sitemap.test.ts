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

vi.mock('@/modules/library/infrastructure/content/findAllMdxFiles', () => ({
  default: vi
    .fn()
    .mockResolvedValue([
      '/content/en/items/heirlooms/dreaded-defender.heirloom.mdx',
      '/content/en/items/heirlooms/main.mdx',
      '/content/en/monsters/abyssal-hound.sheet.mdx',
      '/content/en/spells/bane.spell.mdx',
      '/content/en/rules/arcana-and-the-fold/barriers.rule.mdx',
      '/content/en/rules/arcana-and-the-fold/main.mdx',
      '/content/en/character-creation/vocations/bard/bard.vocation.mdx',
      '/content/en/character-creation/vocations/bard/spells.list.mdx',
    ]),
}));

vi.mock('path', async () => {
  const actual = await vi.importActual<typeof import('path')>('path');
  const api = {
    ...actual,
    join: (...parts: string[]) => parts.join('/'),
    relative: (_base: string, full: string) => full.replace('/content/en/', ''),
  };
  return { ...api, default: api };
});

describe('sitemap', () => {
  it('generates canonical URLs with the production base', async () => {
    const result = await sitemap();
    expect(result[0].url).toMatch(/^https:\/\/ikuisuus\.vercel\.app/);
  });

  it('sets priority to 0.8 for all entries', async () => {
    const result = await sitemap();
    result.forEach((entry) => expect(entry.priority).toBe(0.8));
  });

  it('strips content-type suffixes from article URLs', async () => {
    const urls = (await sitemap()).map((e) => e.url);
    expect(urls).toContain(
      'https://ikuisuus.vercel.app/en/library/spells/bane',
    );
    expect(urls).toContain(
      'https://ikuisuus.vercel.app/en/library/monsters/abyssal-hound',
    );
    expect(urls.some((u) => /\.(spell|sheet|heirloom|rule|vocation)$/.test(u))).toBe(
      false,
    );
  });

  it('maps a main index to its folder rather than dropping it', async () => {
    const urls = (await sitemap()).map((e) => e.url);
    expect(urls).toContain(
      'https://ikuisuus.vercel.app/en/library/rules/arcana-and-the-fold',
    );
    expect(urls).toContain(
      'https://ikuisuus.vercel.app/en/library/items/heirlooms',
    );
  });

  it('maps a folder-named index to its folder', async () => {
    const urls = (await sitemap()).map((e) => e.url);
    expect(urls).toContain(
      'https://ikuisuus.vercel.app/en/library/character-creation/vocations/bard',
    );
    expect(urls).not.toContain(
      'https://ikuisuus.vercel.app/en/library/character-creation/vocations/bard/bard',
    );
  });

  it('keeps a non-index sibling at its own URL', async () => {
    const urls = (await sitemap()).map((e) => e.url);
    expect(urls).toContain(
      'https://ikuisuus.vercel.app/en/library/character-creation/vocations/bard/spells',
    );
  });

  it('never emits a main segment', async () => {
    const urls = (await sitemap()).map((e) => e.url);
    expect(urls.every((u) => !u.endsWith('/main'))).toBe(true);
  });

  it('emits each URL once', async () => {
    const urls = (await sitemap()).map((e) => e.url);
    expect(new Set(urls).size).toBe(urls.length);
  });
});
