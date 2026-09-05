/**
 * @fileoverview Unit tests for generateLibraryStaticParams use-case.
 * @module tests/unit/src/modules/library/application/use-cases/generateStaticParams.test
 * @author Typeir
 * @version 1.0.0
 * @since 6.0.0
 */

import { generateLibraryStaticParams } from '@/modules/library/application/use-cases/generateStaticParams';
import findAllMdxFiles from '@/modules/library/infrastructure/content/findAllMdxFiles';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/modules/library/infrastructure/content/findAllMdxFiles', () => ({
  default: vi.fn(),
}));

describe('generateLibraryStaticParams', () => {
  it('converts content files to slug params', async () => {
    const mockedFindAllMdxFiles = vi.mocked(findAllMdxFiles);
    mockedFindAllMdxFiles.mockResolvedValue([
      '/repo/src/content/en/monsters/albedo-the-bleak-bloom.sheet.mdx',
      '/repo/src/content/en/world/black-cradle.lore.mdx',
    ]);

    const params = await generateLibraryStaticParams('/repo/src/content/en');

    expect(params).toEqual([
      { slug: ['monsters', 'albedo-the-bleak-bloom'] },
      { slug: ['world', 'black-cradle'] },
    ]);
  });

  it('emits the folder route for a folder index, named or main', async () => {
    const mockedFindAllMdxFiles = vi.mocked(findAllMdxFiles);
    mockedFindAllMdxFiles.mockResolvedValue([
      '/repo/src/content/en/character-creation/vocations/paladin/paladin.vocation.mdx',
      '/repo/src/content/en/character-creation/vocations/paladin/spells.list.mdx',
      '/repo/src/content/en/rules/main.mdx',
    ]);

    const params = await generateLibraryStaticParams('/repo/src/content/en');

    expect(params).toEqual([
      { slug: ['character-creation', 'vocations', 'paladin', 'paladin'] },
      { slug: ['character-creation', 'vocations', 'paladin'] },
      { slug: ['character-creation', 'vocations', 'paladin', 'spells'] },
      { slug: ['rules', 'main'] },
      { slug: ['rules'] },
    ]);
  });
});
