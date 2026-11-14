/**
 * @fileoverview builderContentSource tests.
 *
 * @module tests/unit/src/modules/character-builder/infrastructure/devApi/builderContentSource.test
 * @version 1.0.0
 * @author Typeir
 * @since 9.1.0
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mocks, repo } = vi.hoisted(() => ({
  mocks: {
    bloodlines: vi.fn(),
    listBySource: vi.fn(),
    spellList: vi.fn(),
    locate: vi.fn(),
    resolve: vi.fn(),
  },
  repo: () => ({ list: () => Promise.resolve([]) }),
}));

vi.mock('@/lib/db/content/repositories/bloodlineRepository', () => ({
  bloodlineRepository: { list: mocks.bloodlines },
}));
vi.mock('@/lib/db/content/repositories/vocationRepository', () => ({ vocationRepository: repo() }));
vi.mock('@/lib/db/content/repositories/specializationRepository', () => ({
  specializationRepository: repo(),
}));
vi.mock('@/lib/db/content/repositories/featRepository', () => ({ featRepository: repo() }));
vi.mock('@/lib/db/content/repositories/heirloomRepository', () => ({ heirloomRepository: repo() }));
vi.mock('@/lib/db/content/repositories/trinketRepository', () => ({ trinketRepository: repo() }));
vi.mock('@/lib/db/content/repositories/spellRepository', () => ({
  spellRepository: { list: mocks.spellList, listBySource: mocks.listBySource },
}));
vi.mock('@/app/api/content-shards/shardTypes', () => ({
  shardTypeRegistry: {
    bloodlines: { locate: mocks.locate },
    vocations: { locate: mocks.locate },
    specializations: { locate: mocks.locate },
  },
}));
vi.mock('@/lib/md/resolveShardByRef', () => ({ resolveTargetShards: mocks.resolve }));

import { createBuilderContent } from '@/modules/character-builder/infrastructure/devApi/builderContentSource';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createBuilderContent', () => {
  it('memoizes list loads', async () => {
    mocks.bloodlines.mockResolvedValue([{ slug: 'a' }]);
    const content = createBuilderContent('en');
    await content.bloodlines();
    await content.bloodlines();
    expect(mocks.bloodlines).toHaveBeenCalledTimes(1);
    expect(mocks.bloodlines).toHaveBeenCalledWith('en');
  });

  it('scopes spells to sources and dedupes', async () => {
    mocks.listBySource.mockImplementation(async (_l: string, source: string) =>
      source === 'Wizard' ? [{ slug: 'a' }, { slug: 'b' }] : [{ slug: 'b' }],
    );
    const spells = await createBuilderContent('en').spells(['Wizard', 'Bard']);
    expect(spells.map((s) => s.slug)).toEqual(['a', 'b']);
    mocks.spellList.mockResolvedValue([{ slug: 'z' }]);
    expect(await createBuilderContent('en').spells([])).toEqual([{ slug: 'z' }]);
  });

  it('resolves shards and returns undefined on failure', async () => {
    mocks.locate.mockResolvedValueOnce({ file: 'f' });
    mocks.resolve.mockResolvedValueOnce([{ key: 'k', source: 's' }]);
    const content = createBuilderContent('en');
    expect(await content.shards('vocations', 'wizard', ['k'])).toEqual([
      { key: 'k', source: 's' },
    ]);
    mocks.locate.mockResolvedValueOnce(null);
    expect(await content.shards('vocations', 'nope')).toBeUndefined();
    mocks.locate.mockRejectedValueOnce(new Error('boom'));
    expect(await content.shards('vocations', 'boom')).toBeUndefined();
  });
});
