/**
 * @fileoverview Trinket Sync Worker Unit Tests
 * @description Tests for hash-based trinket metadata syncing.
 *
 * @module tests/unit/lib/metadata/syncTrinkets
 * @version 1.0.0
 * @author Typeir
 * @since 7.0.0
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/orm/entities', () => ({
  TrinketEntity: class {},
}));

vi.mock('fs', () => {
  const mocks = {
    existsSync: vi.fn(),
    readdirSync: vi.fn(),
    readFileSync: vi.fn(),
  };
  return { ...mocks, default: mocks };
});

let syncTrinkets: (
  em: any,
  locale: string,
) => Promise<{
  inserted: number;
  updated: number;
  skipped: number;
  deleted: number;
}>;
let fsMock: {
  existsSync: ReturnType<typeof vi.fn>;
  readdirSync: ReturnType<typeof vi.fn>;
  readFileSync: ReturnType<typeof vi.fn>;
};

beforeEach(async () => {
  const mod = await import('@/lib/metadata/syncTrinkets');
  syncTrinkets = mod.syncTrinkets;

  const fs = await import('fs');
  fsMock = {
    existsSync: vi.mocked(fs.existsSync),
    readdirSync: vi.mocked(fs.readdirSync),
    readFileSync: vi.mocked(fs.readFileSync),
  };
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('syncTrinkets', () => {
  it('should return empty sync stats when metadata directory does not exist', async () => {
    fsMock.existsSync.mockReturnValue(false);

    const em = {
      find: vi.fn().mockResolvedValue([]),
      assign: vi.fn(),
      create: vi.fn(),
      remove: vi.fn(),
    };

    const result = await syncTrinkets(em as never, 'en');

    expect(result).toEqual({ inserted: 0, updated: 0, skipped: 0, deleted: 0 });
  });

  it('should insert new trinket rows when missing in database', async () => {
    const record = {
      slug: 'viper-fang',
      title: 'Viper Fang',
      file: 'src/content/en/items/trinkets/viper-fang.mdx',
      link: '/library/items/trinkets/viper-fang',
      itemType: 'Weapon',
      damage: '1d4',
      damageType: 'Piercing',
      tags: ['weapon'],
      indexVersion: 1,
    };

    fsMock.existsSync.mockReturnValue(true);
    fsMock.readdirSync.mockReturnValue(['viper-fang.metadata.json'] as never);
    fsMock.readFileSync.mockReturnValue(JSON.stringify(record));

    const em = {
      find: vi.fn().mockResolvedValue([]),
      assign: vi.fn(),
      create: vi.fn(),
      remove: vi.fn(),
    };

    const result = await syncTrinkets(em as never, 'en');

    expect(result.inserted).toBe(1);
    expect(result.updated).toBe(0);
    expect(result.deleted).toBe(0);
    expect(em.create).toHaveBeenCalled();
  });

  it('should skip unchanged rows when version hash matches', async () => {
    const record = {
      slug: 'ash-thorn',
      title: 'Ash Thorn',
      file: 'src/content/en/items/trinkets/ash-thorn.mdx',
      link: '/library/items/trinkets/ash-thorn',
      itemType: 'Weapon',
      tags: [],
      versionHash: 'deadbeef',
    };

    fsMock.existsSync.mockReturnValue(true);
    fsMock.readdirSync.mockReturnValue(['ash-thorn.metadata.json'] as never);
    fsMock.readFileSync.mockReturnValue(JSON.stringify(record));

    const em = {
      find: vi
        .fn()
        .mockResolvedValue([{ slug: 'ash-thorn', versionHash: 'deadbeef' }]),
      assign: vi.fn(),
      create: vi.fn(),
      remove: vi.fn(),
    };

    const result = await syncTrinkets(em as never, 'en');

    expect(result.skipped).toBe(1);
    expect(result.inserted).toBe(0);
    expect(em.assign).not.toHaveBeenCalled();
    expect(em.create).not.toHaveBeenCalled();
  });

  it('should not delete DB rows when directory exists but has no metadata files', async () => {
    fsMock.existsSync.mockReturnValue(true);
    fsMock.readdirSync.mockReturnValue([]);

    const staleEntity = { slug: 'old-relic', versionHash: 'stale' };
    const em = {
      find: vi.fn().mockResolvedValue([staleEntity]),
      assign: vi.fn(),
      create: vi.fn(),
      remove: vi.fn(),
    };

    const result = await syncTrinkets(em as never, 'en');

    expect(result.deleted).toBe(0);
    expect(em.remove).not.toHaveBeenCalled();
  });

  it('should delete stale rows when metadata files exist but omit the slug', async () => {
    const activeRecord = {
      slug: 'new-relic',
      title: 'New Relic',
      file: 'src/content/en/items/trinkets/new-relic.mdx',
      link: '/library/items/trinkets/new-relic',
      itemType: 'Trinket',
      tags: [],
      versionHash: 'abc123',
    };

    fsMock.existsSync.mockReturnValue(true);
    fsMock.readdirSync.mockReturnValue(['new-relic.metadata.json'] as never);
    fsMock.readFileSync.mockReturnValue(JSON.stringify(activeRecord));

    const staleEntity = { slug: 'old-relic', versionHash: 'stale' };
    const em = {
      find: vi.fn().mockResolvedValue([staleEntity]),
      assign: vi.fn(),
      create: vi.fn(),
      remove: vi.fn(),
    };

    const result = await syncTrinkets(em as never, 'en', {
      allowDeletion: true,
    });

    expect(result.deleted).toBe(1);
    expect(em.remove).toHaveBeenCalledWith(staleEntity);
  });

  it('should not delete stale rows by default', async () => {
    const activeRecord = {
      slug: 'new-relic',
      title: 'New Relic',
      file: 'src/content/en/items/trinkets/new-relic.trinket.mdx',
      link: '/library/items/trinkets/new-relic',
      itemType: 'Trinket',
      tags: [],
      versionHash: 'abc123',
    };

    fsMock.existsSync.mockReturnValue(true);
    fsMock.readdirSync.mockReturnValue(['new-relic.metadata.json'] as never);
    fsMock.readFileSync.mockReturnValue(JSON.stringify(activeRecord));

    const staleEntity = { slug: 'old-relic', versionHash: 'stale' };
    const em = {
      find: vi.fn().mockResolvedValue([staleEntity]),
      assign: vi.fn(),
      create: vi.fn(),
      remove: vi.fn(),
    };

    const result = await syncTrinkets(em as never, 'en');

    expect(result.deleted).toBe(0);
    expect(em.remove).not.toHaveBeenCalled();
  });

  it('should sync supplied records without reading sidecars', async () => {
    fsMock.existsSync.mockClear();
    fsMock.readdirSync.mockClear();
    fsMock.readFileSync.mockClear();

    const em = {
      find: vi.fn().mockResolvedValue([]),
      assign: vi.fn(),
      create: vi.fn(),
      remove: vi.fn(),
    };

    const result = await syncTrinkets(em as never, 'en', {
      records: [
        {
          slug: 'fetched-relic',
          title: 'Fetched Relic',
          file: 'src/content/en/items/trinkets/fetched-relic.trinket.mdx',
          link: '/library/items/trinkets/fetched-relic',
          itemType: 'Trinket',
          tags: [],
          versionHash: 'live1',
        },
      ],
    });

    expect(fsMock.readdirSync).not.toHaveBeenCalled();
    expect(result.inserted).toBe(1);
    expect(result.deleted).toBe(0);
  });
});
