/**
 * @fileoverview Sync Service Unit Tests
 * @description Tests for hash-based incremental metadata sync.
 *
 * @module tests/unit/lib/metadata/syncService
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/orm/orm', () => ({
  getEM: vi.fn(),
}));

vi.mock('@/lib/db/orm/entities', () => ({
  BloodlineEntity: class {},
  FeatEntity: class {},
  HeirloomEntity: class {},
  MonsterEntity: class {},
  RuleEntity: class {},
  SpecializationEntity: class {},
  SpellEntity: class {},
  SpellListEntity: class {},
  TrinketEntity: class {},
  VocationEntity: class {},
  WorldEntity: class {},
}));

vi.mock('fs', () => {
  const mocks = {
    existsSync: vi.fn(),
    readdirSync: vi.fn(),
    readFileSync: vi.fn(),
  };
  return { ...mocks, default: mocks };
});

let syncMetadata: typeof import('@/lib/metadata/syncService').syncMetadata;
let getEM: ReturnType<typeof vi.fn>;
let fsMock: {
  existsSync: ReturnType<typeof vi.fn>;
  readdirSync: ReturnType<typeof vi.fn>;
  readFileSync: ReturnType<typeof vi.fn>;
};

beforeEach(async () => {
  const syncMod = await import('@/lib/metadata/syncService');
  syncMetadata = syncMod.syncMetadata;
  const ormMod = await import('@/lib/db/orm/orm');
  getEM = vi.mocked(ormMod.getEM);
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

describe('syncMetadata', () => {
  it('should sync monsters with empty directory', async () => {
    fsMock.existsSync.mockReturnValue(false);

    const mockTx = {
        getMetadata: () => ({ get: () => ({ properties: {} }) }),
      find: vi.fn().mockResolvedValue([]),
      assign: vi.fn(),
      create: vi.fn(),
      remove: vi.fn(),
      flush: vi.fn(),
    };

    const mockEm = {
      transactional: vi.fn(async (fn: (tx: unknown) => Promise<void>) => {
        await fn(mockTx);
      }),
      clear: vi.fn(),
    };

    getEM.mockResolvedValue(mockEm);

    const results = await syncMetadata({
      locale: 'en',
      contentTypes: ['monsters'],
    });

    expect(results.monsters).toBeDefined();
    expect(results.monsters.inserted).toBe(0);
    expect(results.monsters.skipped).toBe(0);
  });

  it('should handle unknown content types gracefully', async () => {
    const mockEm = {
      transactional: vi.fn(async (fn: (tx: unknown) => Promise<void>) => {
        await fn({ getMetadata: () => ({ get: () => ({ properties: {} }) }) });
      }),
      clear: vi.fn(),
    };

    getEM.mockResolvedValue(mockEm);

    const results = await syncMetadata({
      contentTypes: ['nonexistent'],
    });

    expect(results.nonexistent).toBeUndefined();
  });

  it('should not delete DB rows when content dir exists but has no metadata files', async () => {
    fsMock.existsSync.mockReturnValue(true);
    fsMock.readdirSync.mockReturnValue([
      'albedo-the-bleak-bloom.sheet.mdx',
      'goblin.sheet.mdx',
    ]);

    const mockRemove = vi.fn();

    const mockTx = {
        getMetadata: () => ({ get: () => ({ properties: {} }) }),
      find: vi.fn().mockResolvedValue([
        { subSlug: undefined, slug: 'albedo-the-bleak-bloom', versionHash: 'abc' },
        { subSlug: undefined, slug: 'goblin', versionHash: 'def' },
      ]),
      assign: vi.fn(),
      create: vi.fn(),
      remove: mockRemove,
      flush: vi.fn(),
    };

    const mockEm = {
      transactional: vi.fn(async (fn: (tx: unknown) => Promise<void>) => {
        await fn(mockTx);
      }),
      clear: vi.fn(),
    };

    getEM.mockResolvedValue(mockEm);

    const results = await syncMetadata({
      locale: 'en',
      contentTypes: ['monsters'],
    });

    expect(mockRemove).not.toHaveBeenCalled();
    expect(results.monsters.deleted).toBe(0);
  });

  it('should default to locale en', async () => {
    fsMock.existsSync.mockReturnValue(false);

    const mockTx = {
        getMetadata: () => ({ get: () => ({ properties: {} }) }),
      find: vi.fn().mockResolvedValue([]),
      assign: vi.fn(),
      create: vi.fn(),
      remove: vi.fn(),
      flush: vi.fn(),
    };

    const mockEm = {
      transactional: vi.fn(async (fn: (tx: unknown) => Promise<void>) => {
        await fn(mockTx);
      }),
      clear: vi.fn(),
    };

    getEM.mockResolvedValue(mockEm);

    const results = await syncMetadata({ contentTypes: ['monsters'] });
    expect(results).toBeDefined();
  });
});
